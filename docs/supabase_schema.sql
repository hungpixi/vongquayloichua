-- ==========================================
-- SUPABASE POSTGRESQL SCHEMA & RLS POLICIES
-- Project: Vòng Quay Lời Chúa (Multi-tenant Parish Wheel)
-- Architecture: Edge-First Serverless & RLS Security
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables (in correct order of dependencies for clean setup/migrations)
DROP TABLE IF EXISTS spin_history CASCADE;
DROP TABLE IF EXISTS blessings CASCADE;
DROP TABLE IF EXISTS wheels CASCADE;
DROP TABLE IF EXISTS parishes CASCADE;

-- ==========================================
-- 1. PARISHES (TENANTS) TABLE
-- ==========================================
CREATE TABLE parishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parishes_slug ON parishes(slug);
CREATE INDEX idx_parishes_owner ON parishes(owner_id);

-- ==========================================
-- 2. WHEELS TABLE
-- ==========================================
CREATE TABLE wheels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parish_id UUID REFERENCES parishes(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    config JSONB NOT NULL, -- UI config structure (colors, background, sfx, bgm, etc.)
    lock_duration VARCHAR(50) DEFAULT '24h', -- Limit rule: 'none', '24h', 'forever'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wheels_parish ON wheels(parish_id);
CREATE INDEX idx_wheels_active ON wheels(is_active);

-- ==========================================
-- 3. BLESSINGS TABLE (Word of God / Gifts)
-- ==========================================
CREATE TABLE blessings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wheel_id UUID REFERENCES wheels(id) ON DELETE CASCADE NOT NULL,
    category VARCHAR(255) NOT NULL, -- e.g., 'Lời Chúa', 'Quà tặng', 'Lời chúc'
    quote VARCHAR(100) NOT NULL,    -- e.g., 'Ga 3,16' or 'Quà 1'
    text TEXT NOT NULL,             -- Core message content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blessings_wheel ON blessings(wheel_id);

-- ==========================================
-- 4. SPIN HISTORY TABLE (Audit Log & Lock Duration Check)
-- ==========================================
CREATE TABLE spin_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wheel_id UUID REFERENCES wheels(id) ON DELETE CASCADE NOT NULL,
    blessing_id UUID REFERENCES blessings(id) ON DELETE SET NULL,
    item_spun VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL, -- MurmurHash3 Device Fingerprint or Anonymous Session ID
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spin_history_wheel ON spin_history(wheel_id);
CREATE INDEX idx_spin_history_lookup ON spin_history(wheel_id, session_id, ip_address);
CREATE INDEX idx_spin_history_created ON spin_history(created_at);


-- ==========================================
-- TIMESTAMPS AUTO-UPDATE TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_parishes_updated_at
    BEFORE UPDATE ON parishes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wheels_updated_at
    BEFORE UPDATE ON wheels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- ==========================================
ALTER TABLE parishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheels ENABLE ROW LEVEL SECURITY;
ALTER TABLE blessings ENABLE ROW LEVEL SECURITY;
ALTER TABLE spin_history ENABLE ROW LEVEL SECURITY;


-- ------------------------------------------
-- PARISHES POLICIES
-- ------------------------------------------

-- Rule 1: Public can read all parishes (needed for routing / matching tenant config)
CREATE POLICY "Allow public read parishes" 
    ON parishes FOR SELECT 
    USING (true);

-- Rule 2: Only the owner can insert a parish record
CREATE POLICY "Allow parish owner to insert parish" 
    ON parishes FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);

-- Rule 3: Only the owner can update parish details
CREATE POLICY "Allow parish owner to update parish" 
    ON parishes FOR UPDATE 
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Rule 4: Only the owner can delete the parish
CREATE POLICY "Allow parish owner to delete parish" 
    ON parishes FOR DELETE 
    USING (auth.uid() = owner_id);


-- ------------------------------------------
-- WHEELS POLICIES
-- ------------------------------------------

-- Rule 1: Public can view active wheels (needed for guest spins).
--        Parish owners can view all wheels (including drafts/inactive).
CREATE POLICY "Allow public read active wheels or owner read all" 
    ON wheels FOR SELECT 
    USING (
        is_active = true 
        OR EXISTS (
            SELECT 1 FROM parishes 
            WHERE parishes.id = wheels.parish_id 
              AND parishes.owner_id = auth.uid()
        )
    );

-- Rule 2: Only parish owners can create wheels
CREATE POLICY "Allow parish owner to insert wheels" 
    ON wheels FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM parishes 
            WHERE parishes.id = wheels.parish_id 
              AND parishes.owner_id = auth.uid()
        )
    );

-- Rule 3: Only parish owners can update wheels
CREATE POLICY "Allow parish owner to update wheels" 
    ON wheels FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM parishes 
            WHERE parishes.id = wheels.parish_id 
              AND parishes.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM parishes 
            WHERE parishes.id = wheels.parish_id 
              AND parishes.owner_id = auth.uid()
        )
    );

-- Rule 4: Only parish owners can delete wheels
CREATE POLICY "Allow parish owner to delete wheels" 
    ON wheels FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM parishes 
            WHERE parishes.id = wheels.parish_id 
              AND parishes.owner_id = auth.uid()
        )
    );


-- ------------------------------------------
-- BLESSINGS POLICIES
-- ------------------------------------------

-- Rule 1: Public can read all blessings (so public wheels can render slices)
CREATE POLICY "Allow public read blessings" 
    ON blessings FOR SELECT 
    USING (true);

-- Rule 2: Only parish owners can insert blessings for their own wheels
CREATE POLICY "Allow parish owner to insert blessings" 
    ON blessings FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM wheels
            JOIN parishes ON parishes.id = wheels.parish_id
            WHERE wheels.id = blessings.wheel_id 
              AND parishes.owner_id = auth.uid()
        )
    );

-- Rule 3: Only parish owners can update blessings
CREATE POLICY "Allow parish owner to update blessings" 
    ON blessings FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM wheels
            JOIN parishes ON parishes.id = wheels.parish_id
            WHERE wheels.id = blessings.wheel_id 
              AND parishes.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM wheels
            JOIN parishes ON parishes.id = wheels.parish_id
            WHERE wheels.id = blessings.wheel_id 
              AND parishes.owner_id = auth.uid()
        )
    );

-- Rule 4: Only parish owners can delete blessings
CREATE POLICY "Allow parish owner to delete blessings" 
    ON blessings FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM wheels
            JOIN parishes ON parishes.id = wheels.parish_id
            WHERE wheels.id = blessings.wheel_id 
              AND parishes.owner_id = auth.uid()
        )
    );


-- ------------------------------------------
-- SPIN HISTORY POLICIES
-- ------------------------------------------

-- Rule 1: Allow anonymous/public insert (for client-side or queue logging)
CREATE POLICY "Allow anonymous or public insert spin_history" 
    ON spin_history FOR INSERT 
    WITH CHECK (true);

-- Rule 2: Allow select only for the parish owners (admin auditing and metrics)
CREATE POLICY "Allow parish owners to select spin_history" 
    ON spin_history FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM wheels
            JOIN parishes ON parishes.id = wheels.parish_id
            WHERE wheels.id = spin_history.wheel_id 
              AND parishes.owner_id = auth.uid()
        )
    );

-- Note: UPDATE and DELETE operations are restricted on spin_history.
-- By default, since no UPDATE/DELETE policies are defined, all edit/delete actions are rejected.
-- This guarantees the immutability of spin history logs.


-- ==========================================
-- 5. AUTOMATIC PARISH CREATION TRIGGER
-- ==========================================
-- Automatically creates a parish profile when a new admin user signs up.
-- Extracts parish details from user metadata and handles slug duplicate collisions.

CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER AS $$
DECLARE
    v_parish_name TEXT;
    v_parish_slug TEXT;
    v_is_anonymous BOOLEAN;
    v_clean_slug TEXT;
    v_counter INTEGER := 1;
BEGIN
    -- 1. Determine if the user is anonymous (Parishioner / Guest)
    v_is_anonymous := COALESCE(
        NEW.is_anonymous, 
        (NEW.raw_app_meta_data->>'provider' = 'anonymous'), 
        FALSE
    );

    -- 2. Only create parish for registered admin accounts
    IF NOT v_is_anonymous THEN
        -- Get parish name from metadata or fallback to email prefix
        v_parish_name := COALESCE(
            NEW.raw_user_meta_data->>'parish_name', 
            'Giáo xứ của ' || COALESCE(split_part(NEW.email, '@', 1), 'Admin')
        );

        -- Get parish slug from metadata or auto-generate from email/prefix
        v_parish_slug := COALESCE(
            NEW.raw_user_meta_data->>'parish_slug',
            'giao-xu-' || LOWER(REGEXP_REPLACE(
                COALESCE(split_part(NEW.email, '@', 1), 'admin'), 
                '[^a-zA-Z0-9]', 
                '-', 
                'g'
            ))
        );

        -- Clean up slug structure (remove extra hyphens, trim edges)
        v_clean_slug := REGEXP_REPLACE(v_parish_slug, '-+', '-', 'g');
        v_clean_slug := TRIM(BOTH '-' FROM v_clean_slug);
        v_parish_slug := v_clean_slug;

        -- 3. Collision Resolution for duplicate slugs
        WHILE EXISTS (SELECT 1 FROM public.parishes WHERE slug = v_parish_slug) LOOP
            v_parish_slug := v_clean_slug || '-' || v_counter;
            v_counter := v_counter + 1;
            
            -- Prevent infinite loops in case of extreme errors
            IF v_counter > 100 THEN
                v_parish_slug := v_clean_slug || '-' || SUBSTRING(NEW.id::text FROM 1 FOR 8);
                EXIT;
            END IF;
        END LOOP;

        -- 4. Insert the newly mapped parish profile
        INSERT INTO public.parishes (
            name, 
            slug, 
            owner_id, 
            status, 
            created_at, 
            updated_at
        )
        VALUES (
            v_parish_name, 
            v_parish_slug, 
            NEW.id, 
            'active', 
            CURRENT_TIMESTAMP, 
            CURRENT_TIMESTAMP
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log warning and proceed to not block user registration flow
        RAISE WARNING 'Lỗi trong handle_new_admin_user: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger mapping after new user inserts in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_admin_user();
