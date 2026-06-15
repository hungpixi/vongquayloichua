import { supabase } from './supabaseClient';
import { 
  DEFAULT_BLESSINGS, 
  CHRISTMAS_BLESSINGS, 
  EASTER_BLESSINGS,
  PENTECOST_BLESSINGS,
  LENT_BLESSINGS,
  ADVENT_BLESSINGS,
  MARIAN_BLESSINGS,
  ST_JOSEPH_BLESSINGS,
  EUCHARIST_BLESSINGS
} from '../utils/blessingsData';
import { getDeviceFingerprint } from '../utils/fingerprint';


// Interfaces
export interface LocalUser {
  id: string;
  email: string;
}

export interface Parish {
  id: string;
  owner_id?: string;
  name: string;
  slug: string;
  logo_url?: string;
  background_url?: string;
  address?: string;
  phone?: string;
  facebook_url?: string;
  youtube_url?: string;
  mass_schedule?: string;
  greeting?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Wheel {
  id: string;
  parish_id: string;
  title: string;
  slug: string;
  description: string;
  theme_preset: string;
  enable_confetti: boolean;
  enable_sound: boolean;
  lock_duration: string; // 'none' | '24h' | 'forever'
  is_active?: boolean;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  background_url?: string;
  logo_url?: string;
  custom_colors?: string;
  address?: string;
  phone?: string;
  facebook_url?: string;
  youtube_url?: string;
  mass_schedule?: string;
  greeting?: string;
  bgm_enabled?: boolean;
  bgm_type?: string;
  bgm_volume?: number;
  spin_sfx_type?: string;
  win_sfx_type?: string;
  custom_bgm_url?: string;
  custom_win_sfx_url?: string;
  display_slots?: number;
  slot_display_type?: string;
  card_template?: string;
  card_text_color?: string;
  card_font_size?: string;
  card_greeting?: string;
  spin_btn_text?: string;
  spinning_btn_text?: string;
  view_result_btn_text?: string;
  recheck_btn_text?: string;
  locked_desc?: string;
}

export interface Blessing {
  id: string;
  wheel_id: string;
  category: string;
  quote?: string;
  text: string;
  is_custom: boolean;
  created_at?: string;
}

export interface SpinHistory {
  id: string;
  wheel_id: string;
  blessing_id?: string;
  item_spun: string;
  session_id?: string;
  created_at?: string;
}

// Check if online database is active
const isOnline = () => !!supabase;

// IndexedDB Helper for Offline Custom Audio Storage
const INDEXEDDB_NAME = 'VongQuayBgmDB';
const STORE_NAME = 'custom_bgms';

const getIDBStore = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXEDDB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains('asset_cache')) {
        db.createObjectStore('asset_cache');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// IndexedDB Helper for Sync Queue and Offline Storage
const LOCAL_DB_NAME = 'VongQuayLocalDB';
const SYNC_QUEUE_STORE = 'sync_queue';

const getLocalDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(LOCAL_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export interface SyncAction {
  id: string;
  action_type: 'RECORD_SPIN' | 'UPDATE_WHEEL' | 'SAVE_BLESSINGS';
  payload: unknown;
  status: 'pending' | 'syncing' | 'failed';
  retry_count: number;
  last_attempt: string | null;
}

// Helper functions for sync queue management
export const updateActionStatus = async (action: SyncAction) => {
  try {
    const db = await getLocalDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(SYNC_QUEUE_STORE);
      const req = store.put(action);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const queue: SyncAction[] = JSON.parse(localStorage.getItem('vqlc_sync_queue') || '[]');
      const idx = queue.findIndex(a => a.id === action.id);
      if (idx !== -1) {
        queue[idx] = action;
      } else {
        queue.push(action);
      }
      localStorage.setItem('vqlc_sync_queue', JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to update LocalStorage fallback:', e);
    }
  }
};

export const removeAction = async (id: string) => {
  try {
    const db = await getLocalDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
      const store = tx.objectStore(SYNC_QUEUE_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      let queue: SyncAction[] = JSON.parse(localStorage.getItem('vqlc_sync_queue') || '[]');
      queue = queue.filter(a => a.id !== id);
      localStorage.setItem('vqlc_sync_queue', JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to remove from LocalStorage fallback:', e);
    }
  }
};

// Helper to generate UUID-like strings for LocalStorage
const generateUUID = () => {
  return 'local-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// INITIALIZE MOCK LOCAL STORAGE DATA
const initLocalStorage = () => {
  if (!localStorage.getItem('local_users')) {
    localStorage.setItem('local_users', JSON.stringify([]));
  }
  if (!localStorage.getItem('local_parishes')) {
    localStorage.setItem('local_parishes', JSON.stringify([]));
  }
  if (!localStorage.getItem('local_wheels')) {
    localStorage.setItem('local_wheels', JSON.stringify([]));
  }
  if (!localStorage.getItem('local_blessings')) {
    localStorage.setItem('local_blessings', JSON.stringify([]));
  }
  if (!localStorage.getItem('local_spin_history')) {
    localStorage.setItem('local_spin_history', JSON.stringify([]));
  }

  // Pre-seed devadmin user if not exists
  const users: LocalUser[] = JSON.parse(localStorage.getItem('local_users') || '[]');
  const devEmail = 'devadmin';
  const devUserId = 'local-devadmin-user-id';
  const devParishId = 'local-devadmin-parish-id';
  const devWheelId = 'local-devadmin-wheel-id';

  if (!users.some((u) => u.email === devEmail || u.id === devUserId)) {
    users.push({ id: devUserId, email: devEmail });
    localStorage.setItem('local_users', JSON.stringify(users));
  }

  // Seed default parish for devadmin
  const parishes: Parish[] = JSON.parse(localStorage.getItem('local_parishes') || '[]');
  if (!parishes.some((p) => p.id === devParishId || p.owner_id === devUserId)) {
    const mockParish: Parish = {
      id: devParishId,
      owner_id: devUserId,
      name: 'Giáo xứ Demo',
      slug: 'giao-xu-demo',
      background_url: '',
      address: '123 Đường Hòa Bình, Phường 1, Quận 11, TP. HCM',
      phone: '0123456789',
      facebook_url: 'https://facebook.com/giaoxudemo',
      youtube_url: 'https://youtube.com/c/giaoxudemo',
      mass_schedule: 'Ngày thường: 05:00, 17:30 | Chúa Nhật: 05:00, 07:00, 17:30',
      greeting: 'Nguyện xin Lời Chúa là ánh sáng chỉ đường cho chúng con!'
    };
    parishes.push(mockParish);
    localStorage.setItem('local_parishes', JSON.stringify(parishes));
  }

  // Seed a default wheel for this parish
  const wheels: Wheel[] = JSON.parse(localStorage.getItem('local_wheels') || '[]');
  if (!wheels.some((w) => w.id === devWheelId || w.parish_id === devParishId)) {
    const mockWheel: Wheel = {
      id: devWheelId,
      parish_id: devParishId,
      title: 'Bảy Ơn Chúa Thánh Thần',
      slug: 'bay-on-thanh-than',
      description: 'Nguyện xin bảy ơn Chúa Thánh Thần tuôn đổ tràn trề trên anh chị em.',
      theme_preset: 'gold',
      enable_confetti: true,
      enable_sound: true,
      lock_duration: '24h',
      background_url: '',
      address: '123 Đường Hòa Bình, Phường 1, Quận 11, TP. HCM',
      phone: '0123456789',
      facebook_url: 'https://facebook.com/giaoxudemo',
      youtube_url: 'https://youtube.com/c/giaoxudemo',
      mass_schedule: 'Ngày thường: 05:00, 17:30 | Chúa Nhật: 05:00, 07:00, 17:30',
      greeting: 'Chúc bạn nhận được Ơn lành từ Chúa Thánh Thần!',
      display_slots: 12,
      slot_display_type: 'mixed',
      card_template: 'default',
      card_text_color: '',
      card_font_size: '16',
      card_greeting: 'Nguyện xin Lời Chúa là nguồn sức mạnh của bạn!'
    };
    wheels.push(mockWheel);
    localStorage.setItem('local_wheels', JSON.stringify(wheels));
  }

  // Add blessings
  const blessings: Blessing[] = JSON.parse(localStorage.getItem('local_blessings') || '[]');
  if (!blessings.some((b) => b.wheel_id === devWheelId)) {
    const mockBlessings: Blessing[] = [
      { id: generateUUID(), wheel_id: devWheelId, category: 'Ơn khôn ngoan', quote: 'Is 11,2', text: 'Thần khí Khôn Ngoan giúp anh/chị nhìn nhận mọi sự theo ý định yêu thương của Chúa.', is_custom: false },
      { id: generateUUID(), wheel_id: devWheelId, category: 'Ơn thông minh', quote: 'Is 11,2', text: 'Thần khí Thông Minh giúp anh/chị thấu hiểu sâu sắc các mầu nhiệm đức tin trong cuộc sống.', is_custom: false },
      { id: generateUUID(), wheel_id: devWheelId, category: 'Ơn hiểu biết', quote: 'Is 11,2', text: 'Thần khí Hiểu Biết giúp anh/chị nhận ra sự hiện diện kì diệu của Thiên Chúa qua thiên nhiên và tha nhân.', is_custom: false },
      { id: generateUUID(), wheel_id: devWheelId, category: 'Ơn lo liệu', quote: 'Is 11,2', text: 'Thần khí Lo Liệu định hướng để anh/chị luôn đưa ra các quyết định sáng suốt và đúng đắn.', is_custom: false },
      { id: generateUUID(), wheel_id: devWheelId, category: 'Ơn sức mạnh', quote: 'Is 11,2', text: 'Thần khí Sức Mạnh ban lòng can đảm giúp anh/chị vượt qua gian nan thử thách để sống chứng tá cho Tin Mừng.', is_custom: false },
      { id: generateUUID(), wheel_id: devWheelId, category: 'Ơn đạo đức', quote: 'Is 11,2', text: 'Thần khí Đạo Đức thắp sáng tình yêu mến thiết tha của anh/chị đối với Thiên Chúa và lòng bao dung đối với anh em.', is_custom: false },
      { id: generateUUID(), wheel_id: devWheelId, category: 'Ơn kính sợ Chúa', quote: 'Is 11,2', text: 'Thần khí Kính Sợ giúp anh/chị luôn sống khiêm nhường, kính tôn uy danh Thiên Chúa và xa lánh tội lỗi.', is_custom: false }
    ];
    blessings.push(...mockBlessings);
    localStorage.setItem('local_blessings', JSON.stringify(blessings));
  }
};
initLocalStorage();

// LOCAL STORAGE ACCESSOR HELPERS
const getLocalData = <T>(key: string): T[] => {
  return JSON.parse(localStorage.getItem(key) || '[]');
};

const setLocalData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const mapDBWheelToWheel = (dbw: Record<string, unknown> | Wheel | null | undefined): Wheel => {
  if (!dbw) return dbw as unknown as Wheel;
  const { config, is_active, ...rest } = dbw as Record<string, unknown>;
  return {
    ...(rest as unknown as Wheel),
    ...((config as Record<string, unknown>) || {}),
    is_active: is_active as boolean
  } as Wheel;
};

// DATABASE SERVICE
export const dbService = {
  // --- AUTH OPERATIONS ---
  async getSessionUser() {
    if (isOnline()) {
      const { data } = await supabase!.auth.getUser();
      return data.user;
    } else {
      const activeUser = localStorage.getItem('local_active_user');
      return activeUser ? JSON.parse(activeUser) : null;
    }
  },

  async signUp(email: string, password: string, parishName: string, slug: string) {
    if (isOnline()) {
      // Validate parish slug uniqueness before starting signup
      const isUnique = await dbService.checkParishSlugUnique(slug);
      if (!isUnique) {
        throw new Error('Đường dẫn Giáo xứ đã tồn tại. Vui lòng chọn đường dẫn khác.');
      }

      // 1. Sign up user with metadata so database trigger can read them
      const { data, error } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          data: {
            parish_name: parishName,
            parish_slug: slug
          }
        }
      });
      if (error) throw error;
      if (!data.user) throw new Error('User creation failed');

      // 2. The database trigger handle_new_admin_user creates the parish automatically.
      // Retrieve the created parish, or fallback to manual creation if trigger didn't run.
      const parish = await dbService.getParishByOwner(data.user.id);
      if (!parish) {
        await dbService.createParish(data.user.id, parishName, slug);
      } else {
        // Trigger created it. Ensure it has the default wheel and blessings.
        const wheels = await dbService.getWheels(parish.id);
        if (wheels.length === 0) {
          try {
            const defaultWheel = await dbService.createWheel(
              parish.id,
              'Bảy Ơn Chúa Thánh Thần',
              'bay-on-thanh-than',
              'Nguyện xin bảy ơn Chúa Thánh Thần tuôn đổ tràn trề trên anh chị em.',
              'gold'
            );
            await dbService.loadDefaultBlessingsPreset(defaultWheel.id, 'gifts');
          } catch (e) {
            console.error('Error creating default wheel for new parish:', e);
          }
        }
      }

      return data.user;
    } else {
      const users = getLocalData<LocalUser>('local_users');
      if (users.find(u => u.email === email)) {
        throw new Error('Email đã được đăng ký.');
      }

      const mockUser = { id: generateUUID(), email };
      users.push(mockUser);
      setLocalData<LocalUser>('local_users', users);

      await dbService.createParish(mockUser.id, parishName, slug);

      localStorage.setItem('local_active_user', JSON.stringify(mockUser));
      return mockUser;
    }
  },

  async signIn(email: string, password: string) {
    if (isOnline()) {
      const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    } else {
      const users = getLocalData<LocalUser>('local_users');
      const cleanEmail = email.trim().toLowerCase();
      let user = users.find(u => u.email.trim().toLowerCase() === cleanEmail);
      
      // Auto-register mock local user if they don't exist yet
      if (!user) {
        const isDevAdmin = cleanEmail === 'devadmin';
        const newUser: LocalUser = { 
          id: isDevAdmin ? 'local-devadmin-user-id' : generateUUID(), 
          email: cleanEmail
        };
        user = newUser;
        users.push(newUser);
        setLocalData<LocalUser>('local_users', users);
        
        // Seed default parish and default wheel for this new local user
        const parishes = getLocalData<Parish>('local_parishes');
        const hasParish = parishes.some(p => p.owner_id === newUser.id);
        if (!hasParish) {
          const parishId = isDevAdmin ? 'local-devadmin-parish-id' : generateUUID();
          const slug = isDevAdmin ? 'giao-xu-demo' : 'giao-xu-' + cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
          const mockParish: Parish = {
            id: parishId,
            owner_id: newUser.id,
            name: isDevAdmin ? 'Giáo xứ Demo' : `Giáo xứ của ${cleanEmail.split('@')[0]}`,
            slug,
            address: '123 Đường Hòa Bình, Phường 1, Quận 11, TP. HCM',
            phone: '0123456789',
            created_at: new Date().toISOString()
          };
          parishes.push(mockParish);
          setLocalData<Parish>('local_parishes', parishes);

          // Seed default wheel
          const wheels = getLocalData<Wheel>('local_wheels');
          const wheelId = isDevAdmin ? 'local-devadmin-wheel-id' : generateUUID();
          const mockWheel: Wheel = {
            id: wheelId,
            parish_id: parishId,
            title: 'Bảy Ơn Chúa Thánh Thần',
            slug: 'bay-on-thanh-than',
            description: 'Nguyện xin bảy ơn Chúa Thánh Thần tuôn đổ tràn trề trên anh chị em.',
            theme_preset: 'gold',
            enable_confetti: true,
            enable_sound: true,
            lock_duration: '24h',
            created_at: new Date().toISOString(),
            display_slots: 12,
            slot_display_type: 'mixed',
            card_template: 'default',
            card_font_size: '16',
            card_greeting: 'Nguyện xin Lời Chúa là nguồn sức mạnh của bạn!'
          };
          wheels.push(mockWheel);
          setLocalData<Wheel>('local_wheels', wheels);

          // Seed blessings
          const blessings = getLocalData<Blessing>('local_blessings');
          const mockBlessings: Blessing[] = [
            { id: generateUUID(), wheel_id: wheelId, category: 'Ơn khôn ngoan', quote: 'Is 11,2', text: 'Thần khí Khôn Ngoan giúp anh/chị nhìn nhận mọi sự theo ý định yêu thương của Chúa.', is_custom: false },
            { id: generateUUID(), wheel_id: wheelId, category: 'Ơn thông minh', quote: 'Is 11,2', text: 'Thần khí Thông Minh giúp anh/chị thấu hiểu sâu sắc các mầu nhiệm đức tin trong cuộc sống.', is_custom: false },
            { id: generateUUID(), wheel_id: wheelId, category: 'Ơn hiểu biết', quote: 'Is 11,2', text: 'Thần khí Hiểu Biết giúp anh/chị nhận ra sự hiện diện kì diệu của Thiên Chúa qua thiên nhiên và tha nhân.', is_custom: false },
            { id: generateUUID(), wheel_id: wheelId, category: 'Ơn lo liệu', quote: 'Is 11,2', text: 'Thần khí Lo Liệu định hướng để anh/chị luôn đưa ra các quyết định sáng suốt và đúng đắn.', is_custom: false },
            { id: generateUUID(), wheel_id: wheelId, category: 'Ơn sức mạnh', quote: 'Is 11,2', text: 'Thần khí Sức Mạnh ban lòng can đảm giúp anh/chị vượt qua gian nan thử thách để sống chứng tá cho Tin Mừng.', is_custom: false },
            { id: generateUUID(), wheel_id: wheelId, category: 'Ơn đạo đức', quote: 'Is 11,2', text: 'Thần khí Đạo Đức thắp sáng tình yêu mến thiết tha của anh/chị đối với Thiên Chúa và lòng bao dung đối với anh em.', is_custom: false },
            { id: generateUUID(), wheel_id: wheelId, category: 'Ơn kính sợ Chúa', quote: 'Is 11,2', text: 'Thần khí Kính Sợ giúp anh/chị luôn sống khiêm nhường, kính tôn uy danh Thiên Chúa và xa lánh tội lỗi.', is_custom: false }
          ];
          blessings.push(...mockBlessings);
          setLocalData<Blessing>('local_blessings', blessings);
        }
      }
      
      localStorage.setItem('local_active_user', JSON.stringify(user));
      return user;
    }
  },

  async signOut() {
    if (isOnline()) {
      await supabase!.auth.signOut();
    } else {
      localStorage.removeItem('local_active_user');
    }
  },

  async signInWithOtp(email: string, redirectTo: string, shouldCreateUser: boolean = false) {
    if (isOnline()) {
      const { data, error } = await supabase!.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser
        }
      });
      if (error) throw error;
      return data;
    } else {
      const users = getLocalData<LocalUser>('local_users');
      const userExists = users.some(u => u.email === email);
      if (!shouldCreateUser && !userExists) {
        throw new Error('Email chưa được đăng ký trong hệ thống.');
      }
      const mockOtp = '123456';
      localStorage.setItem(`mock_otp_${email}`, mockOtp);
      console.log(`[Offline Dev] Simulated OTP for ${email}: ${mockOtp}`);
      return { success: true };
    }
  },

  async verifyOtp(email: string, token: string, type: 'signup' | 'magiclink') {
    if (isOnline()) {
      const { data, error } = await supabase!.auth.verifyOtp({
        email,
        token,
        type
      });
      if (error) throw error;
      return { user: data.user || data.session?.user, session: data.session };
    } else {
      const mockOtp = localStorage.getItem(`mock_otp_${email}`);
      if (token !== mockOtp && token !== '123456') {
        throw new Error('Mã OTP không chính xác hoặc đã hết hạn.');
      }
      const users = getLocalData<LocalUser>('local_users');
      let user = users.find(u => u.email === email);
      if (!user) {
        user = { id: generateUUID(), email };
        users.push(user);
        setLocalData<LocalUser>('local_users', users);
      }
      localStorage.setItem('local_active_user', JSON.stringify(user));
      localStorage.removeItem(`mock_otp_${email}`);
      return { user, session: { user, access_token: 'mock-jwt-token' } };
    }
  },

  async forgotPassword(email: string) {
    if (isOnline()) {
      const { error } = await supabase!.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      return { success: true };
    } else {
      const users = getLocalData<LocalUser>('local_users');
      const user = users.find(u => u.email === email);
      if (!user) {
        throw new Error('Email chưa được đăng ký trong hệ thống.');
      }
      const mockResetToken = 'mock-reset-token-123';
      const resetLink = `${window.location.origin}/reset-password?email=${encodeURIComponent(email)}&token=${mockResetToken}`;
      console.log(`[Offline Dev] Forgot Password Link: ${resetLink}`);
      return { success: true, isMock: true, resetLink };
    }
  },

  async updatePassword(password: string, email?: string) {
    if (isOnline()) {
      const { error } = await supabase!.auth.updateUser({ password });
      if (error) throw error;
      return { success: true };
    } else {
      let targetEmail = email;
      if (!targetEmail) {
        const activeUser = localStorage.getItem('local_active_user');
        if (activeUser) {
          targetEmail = JSON.parse(activeUser).email;
        }
      }
      if (!targetEmail) {
        throw new Error('Không tìm thấy thông tin tài khoản cần đặt lại mật khẩu.');
      }
      const users = getLocalData<LocalUser>('local_users');
      const index = users.findIndex(u => u.email === targetEmail);
      if (index === -1) {
        throw new Error('Tài khoản không tồn tại.');
      }
      // Lưu lại thông tin mật khẩu giả lập nếu cần, ở đây chỉ cần trả về thành công
      return { success: true };
    }
  },


  // --- PARISH OPERATIONS ---
  async getParishByOwner(ownerId: string): Promise<Parish | null> {
    if (isOnline()) {
      const { data, error } = await supabase!
        .from('parishes')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const parishes = getLocalData<Parish>('local_parishes');
      return parishes.find(p => p.owner_id === ownerId) || null;
    }
  },

  async getParishesByOwner(ownerId: string): Promise<Parish[]> {
    if (isOnline()) {
      const { data, error } = await supabase!
        .from('parishes')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const parishes = getLocalData<Parish>('local_parishes');
      return parishes.filter(p => p.owner_id === ownerId);
    }
  },

  async getAllParishes(): Promise<Parish[]> {
    if (isOnline()) {
      const { data, error } = await supabase!
        .from('parishes')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const parishes = getLocalData<Parish>('local_parishes');
      return [...parishes].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
  },

  async getAllSystemStats(): Promise<{ totalParishes: number; totalWheels: number; totalSpins: number }> {
    if (isOnline()) {
      const { count: totalParishes, error: pError } = await supabase!
        .from('parishes')
        .select('*', { count: 'exact', head: true });
      if (pError) throw pError;

      const { count: totalWheels, error: wError } = await supabase!
        .from('wheels')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (wError) throw wError;

      const { count: totalSpins, error: sError } = await supabase!
        .from('spin_history')
        .select('*', { count: 'exact', head: true });
      if (sError) throw sError;

      return {
        totalParishes: totalParishes || 0,
        totalWheels: totalWheels || 0,
        totalSpins: totalSpins || 0
      };
    } else {
      const parishes = getLocalData<Parish>('local_parishes');
      const wheels = getLocalData<Wheel>('local_wheels').filter(w => !w.deleted_at);
      const spinHistory = getLocalData<SpinHistory>('local_spin_history');
      return {
        totalParishes: parishes.length,
        totalWheels: wheels.length,
        totalSpins: spinHistory.length
      };
    }
  },

  async createParish(ownerId: string, name: string, slug: string): Promise<Parish> {
    let parish: Parish;
    if (isOnline()) {
      const { data, error } = await supabase!
        .from('parishes')
        .insert({
          owner_id: ownerId,
          name,
          slug
        })
        .select()
        .single();
      if (error) throw error;
      parish = data;
    } else {
      const parishes = getLocalData<Parish>('local_parishes');
      if (parishes.find(p => p.slug === slug)) {
        throw new Error('Slug giáo xứ đã tồn tại.');
      }
      const mockParish: Parish = {
        id: generateUUID(),
        owner_id: ownerId,
        name,
        slug,
        created_at: new Date().toISOString()
      };
      parishes.push(mockParish);
      setLocalData<Parish>('local_parishes', parishes);
      parish = mockParish;
    }

    // Tự động tạo Vòng quay Bảy Ơn mặc định cho Giáo xứ mới này
    try {
      const defaultWheel = await dbService.createWheel(
        parish.id,
        'Bảy Ơn Chúa Thánh Thần',
        'bay-on-thanh-than',
        'Nguyện xin bảy ơn Chúa Thánh Thần tuôn đổ tràn trề trên anh chị em.',
        'gold'
      );
      await dbService.loadDefaultBlessingsPreset(defaultWheel.id, 'gifts');
    } catch (e) {
      console.error('Error creating default wheel for new parish:', e);
      // Không ném lỗi ra ngoài để tránh làm hỏng luồng chính
    }

    return parish;
  },

  async getParishBySlug(slug: string): Promise<Parish | null> {
    if (isOnline()) {
      const { data, error } = await supabase!
        .from('parishes')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const parishes = getLocalData<Parish>('local_parishes');
      return parishes.find(p => p.slug === slug) || null;
    }
  },

  async updateParish(parishId: string, fields: { 
    name: string; 
    slug: string; 
    logo_url?: string;
    background_url?: string;
    address?: string;
    phone?: string;
    facebook_url?: string;
    youtube_url?: string;
    mass_schedule?: string;
    greeting?: string;
  }) {
    if (isOnline()) {
      const { error } = await supabase!
        .from('parishes')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', parishId);
      if (error) throw error;
    } else {
      const parishes = getLocalData<Parish>('local_parishes');
      const idx = parishes.findIndex(p => p.id === parishId);
      if (idx !== -1) {
        parishes[idx] = { ...parishes[idx], ...fields, updated_at: new Date().toISOString() };
        setLocalData<Parish>('local_parishes', parishes);
      }
    }
  },

  async checkParishSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
    if (isOnline()) {
      let query = supabase!
        .from('parishes')
        .select('id')
        .eq('slug', slug);
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return !data;
    } else {
      const parishes = getLocalData<Parish>('local_parishes');
      const exists = parishes.some(p => p.slug === slug && p.id !== excludeId);
      return !exists;
    }
  },

  async checkParishSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    return !(await this.checkParishSlugUnique(slug, excludeId));
  },

  // --- WHEEL OPERATIONS ---
  async getWheels(parishId: string): Promise<Wheel[]> {
    if (isOnline()) {
      const { data, error } = await supabase!
        .from('wheels')
        .select('*')
        .eq('parish_id', parishId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapDBWheelToWheel);
    } else {
      const wheels = getLocalData<Wheel>('local_wheels');
      return wheels.filter(w => w.parish_id === parishId && !w.deleted_at).map(mapDBWheelToWheel);
    }
  },

  async getWheelBySlugs(parishSlug: string, wheelSlug: string): Promise<{ parish: Parish, wheel: Wheel } | null> {
    if (isOnline()) {
      const parish = await this.getParishBySlug(parishSlug);
      if (!parish) return null;

      const { data, error } = await supabase!
        .from('wheels')
        .select('*')
        .eq('parish_id', parish.id)
        .eq('config->>slug', wheelSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return { parish, wheel: mapDBWheelToWheel(data) };
    } else {
      const parish = await this.getParishBySlug(parishSlug);
      if (!parish) return null;

      const wheels = getLocalData<Wheel>('local_wheels');
      const wheel = wheels.find(w => w.parish_id === parish.id && w.slug === wheelSlug && !w.deleted_at);
      if (!wheel) return null;

      return { parish, wheel: mapDBWheelToWheel(wheel) };
    }
  },

  async getWheelById(wheelId: string): Promise<{ parish: Parish, wheel: Wheel } | null> {
    if (isOnline()) {
      const { data, error } = await supabase!
        .from('wheels')
        .select('*, parishes(*)')
        .eq('id', wheelId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const { parishes, ...wheel } = data;
      return { parish: parishes, wheel: mapDBWheelToWheel(wheel) };
    } else {
      const wheels = getLocalData<Wheel>('local_wheels');
      const wheel = wheels.find(w => w.id === wheelId && !w.deleted_at);
      if (!wheel) return null;

      const parishes = getLocalData<Parish>('local_parishes');
      const parish = parishes.find(p => p.id === wheel.parish_id);
      if (!parish) return null;

      return { parish, wheel: mapDBWheelToWheel(wheel) };
    }
  },

  async createWheel(
    parishId: string, 
    title: string, 
    slug: string, 
    description: string, 
    themePreset: string = 'gold',
    extraFields?: {
      background_url?: string;
      address?: string;
      phone?: string;
      facebook_url?: string;
      youtube_url?: string;
      mass_schedule?: string;
      greeting?: string;
      bgm_enabled?: boolean;
      bgm_type?: string;
      bgm_volume?: number;
      spin_sfx_type?: string;
      win_sfx_type?: string;
      display_slots?: number;
      slot_display_type?: string;
    }
  ) {
    const audioDefaults = {
      bgm_enabled: extraFields?.bgm_enabled ?? false,
      bgm_type: extraFields?.bgm_type ?? 'schubert-ave-maria',
      bgm_volume: extraFields?.bgm_volume ?? 1.0,
      spin_sfx_type: extraFields?.spin_sfx_type ?? 'tick',
      win_sfx_type: extraFields?.win_sfx_type ?? 'fanfare',
      display_slots: extraFields?.display_slots ?? 12,
      slot_display_type: extraFields?.slot_display_type ?? 'mixed'
    };

    if (isOnline()) {
       const configKeys = [
         'slug', 'description', 'theme_preset', 'enable_confetti', 'enable_sound',
         'background_url', 'address', 'phone', 'facebook_url', 'youtube_url',
         'mass_schedule', 'greeting', 'bgm_enabled', 'bgm_type', 'bgm_volume',
         'spin_sfx_type', 'win_sfx_type', 'custom_bgm_url', 'custom_win_sfx_url',
         'display_slots', 'slot_display_type', 'card_template', 'card_text_color',
         'card_font_size', 'card_greeting', 'spin_btn_text', 'spinning_btn_text', 'view_result_btn_text', 'recheck_btn_text', 'locked_desc', 'logo_url', 'custom_colors'
       ];
       const config: Record<string, unknown> = {
         enable_confetti: true,
         enable_sound: true
       };
       const columns: Record<string, unknown> = {
         parish_id: parishId,
         title,
         lock_duration: '24h',
         is_active: true
       };
       // populate config
       for (const key of configKeys) {
         if ((audioDefaults as Record<string, unknown>)[key] !== undefined) config[key] = (audioDefaults as Record<string, unknown>)[key];
         if (extraFields && (extraFields as Record<string, unknown>)[key] !== undefined) config[key] = (extraFields as Record<string, unknown>)[key];
       }
       config.slug = slug;
       config.description = description;
       config.theme_preset = themePreset;

       const { data, error } = await supabase!
         .from('wheels')
         .insert({
           ...columns,
           config
         })
         .select()
         .single();
       if (error) throw error;
       return mapDBWheelToWheel(data);
    } else {
      const wheels = getLocalData<Wheel>('local_wheels');
      // check unique in parish
      if (wheels.find(w => w.parish_id === parishId && w.slug === slug && !w.deleted_at)) {
        throw new Error('Đường dẫn vòng quay đã tồn tại trong giáo xứ.');
      }

      const mockWheel: Wheel = {
        id: generateUUID(),
        parish_id: parishId,
        title,
        slug,
        description,
        theme_preset: themePreset,
        enable_confetti: true,
        enable_sound: true,
        lock_duration: '24h',
        created_at: new Date().toISOString(),
        ...audioDefaults,
        ...extraFields
      };
      wheels.push(mockWheel);
      setLocalData<Wheel>('local_wheels', wheels);
      return mapDBWheelToWheel(mockWheel);
    }
  },

  async updateWheel(wheelId: string, fields: Partial<Omit<Wheel, 'id' | 'parish_id'>>) {
    if (isOnline()) {
       const { data: current, error: fetchErr } = await supabase!
         .from('wheels')
         .select('*')
         .eq('id', wheelId)
         .maybeSingle();
       if (fetchErr) throw fetchErr;
       if (!current) throw new Error('Không tìm thấy vòng quay cần cập nhật.');

       const existingConfig = current.config || {};
       const columnsPayload: Record<string, unknown> = {
         updated_at: new Date().toISOString()
       };
       if (fields.title !== undefined) columnsPayload.title = fields.title;
       if (fields.lock_duration !== undefined) columnsPayload.lock_duration = fields.lock_duration;
       if (fields.is_active !== undefined) columnsPayload.is_active = fields.is_active;

       const configKeys = [
         'slug', 'description', 'theme_preset', 'enable_confetti', 'enable_sound',
         'background_url', 'address', 'phone', 'facebook_url', 'youtube_url',
         'mass_schedule', 'greeting', 'bgm_enabled', 'bgm_type', 'bgm_volume',
         'spin_sfx_type', 'win_sfx_type', 'custom_bgm_url', 'custom_win_sfx_url',
         'display_slots', 'slot_display_type', 'card_template', 'card_text_color',
         'card_font_size', 'card_greeting', 'spin_btn_text', 'spinning_btn_text', 'view_result_btn_text', 'recheck_btn_text', 'locked_desc', 'logo_url', 'custom_colors'
       ];

       const newConfig = { ...existingConfig };
       for (const key of configKeys) {
         if ((fields as Record<string, unknown>)[key] !== undefined) {
           newConfig[key] = (fields as Record<string, unknown>)[key];
         }
       }

       const { error } = await supabase!
         .from('wheels')
         .update({
           ...columnsPayload,
           config: newConfig
         })
         .eq('id', wheelId);
       if (error) throw error;
    } else {
      const wheels = getLocalData<Wheel>('local_wheels');
      const idx = wheels.findIndex(w => w.id === wheelId);
      if (idx !== -1) {
        const currentWheel = wheels[idx];
        if (fields.slug && fields.slug !== currentWheel.slug) {
          const hasDuplicate = wheels.some(w => 
            w.parish_id === currentWheel.parish_id && 
            w.slug === fields.slug && 
            w.id !== wheelId && 
            !w.deleted_at
          );
          if (hasDuplicate) {
            throw new Error('Đường dẫn vòng quay đã tồn tại trong giáo xứ.');
          }
        }
        wheels[idx] = { ...wheels[idx], ...fields, updated_at: new Date().toISOString() };
        setLocalData<Wheel>('local_wheels', wheels);
      }
    }
  },

  async checkWheelSlugUnique(parishId: string, slug: string, excludeId?: string): Promise<boolean> {
    if (isOnline()) {
      let query = supabase!
        .from('wheels')
        .select('id')
        .eq('parish_id', parishId)
        .eq('config->>slug', slug)
        .eq('is_active', true);
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return !data;
    } else {
      const wheels = getLocalData<Wheel>('local_wheels');
      const exists = wheels.some(w => 
        w.parish_id === parishId && 
        w.slug === slug && 
        w.id !== excludeId && 
        !w.deleted_at
      );
      return !exists;
    }
  },

  async checkWheelSlugExists(parishId: string, slug: string, excludeId?: string): Promise<boolean> {
    return !(await this.checkWheelSlugUnique(parishId, slug, excludeId));
  },

  async deleteWheelSoft(wheelId: string) {
    if (isOnline()) {
      const { error } = await supabase!
        .from('wheels')
        .update({ is_active: false })
        .eq('id', wheelId);
      if (error) throw error;
    } else {
      const wheels = getLocalData<Wheel>('local_wheels');
      const idx = wheels.findIndex(w => w.id === wheelId);
      if (idx !== -1) {
        wheels[idx].deleted_at = new Date().toISOString();
        setLocalData<Wheel>('local_wheels', wheels);
      }
    }
  },

  // --- BLESSINGS OPERATIONS ---
  async getBlessings(wheelId: string): Promise<Blessing[]> {
    if (isOnline()) {
      const { data, error } = await supabase!
        .from('blessings')
        .select('*')
        .eq('wheel_id', wheelId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const blessings = getLocalData<Blessing>('local_blessings');
      return blessings.filter(b => b.wheel_id === wheelId);
    }
  },

  async saveBlessings(wheelId: string, blessingsList: Omit<Blessing, 'id' | 'wheel_id'>[]) {
    const baseTime = new Date();
    if (isOnline()) {
      // 1. Delete old blessings
      const { error: deleteError } = await supabase!
        .from('blessings')
        .delete()
        .eq('wheel_id', wheelId);
      if (deleteError) throw deleteError;

      // 2. Insert new ones
      if (blessingsList.length > 0) {
        const payload = blessingsList.map((b, idx) => ({
          wheel_id: wheelId,
          category: b.category,
          quote: b.quote,
          text: b.text,
          is_custom: b.is_custom,
          created_at: new Date(baseTime.getTime() + idx * 1000).toISOString()
        }));
        const { error: insertError } = await supabase!
          .from('blessings')
          .insert(payload);
        if (insertError) throw insertError;
      }
    } else {
      const blessings = getLocalData<Blessing>('local_blessings');
      // Delete old
      const filtered = blessings.filter(b => b.wheel_id !== wheelId);
      
      // Insert new
      const newBlessings = blessingsList.map((b, idx) => ({
        id: generateUUID(),
        wheel_id: wheelId,
        category: b.category,
        quote: b.quote,
        text: b.text,
        is_custom: b.is_custom,
        created_at: new Date(baseTime.getTime() + idx * 1000).toISOString()
      }));
      filtered.push(...newBlessings);
      setLocalData<Blessing>('local_blessings', filtered);
    }
  },

  // Import quick templates
  async loadDefaultBlessingsPreset(
    wheelId: string, 
    presetType: 'gifts' | 'tet' | 'christmas' | 'easter' | 'lent' | 'advent' | 'marian' | 'joseph' | 'eucharist'
  ) {
    let list;
    if (presetType === 'gifts') {
      list = PENTECOST_BLESSINGS.map(b => ({
        category: `Thánh Thần ${b.id}`,
        quote: b.quote,
        text: b.text,
        is_custom: false
      }));
    } else if (presetType === 'christmas') {
      list = CHRISTMAS_BLESSINGS.map(b => ({
        category: `Giáng Sinh ${b.id}`,
        quote: b.quote,
        text: b.text,
        is_custom: false
      }));
    } else if (presetType === 'easter') {
      list = EASTER_BLESSINGS.map(b => ({
        category: `Phục Sinh ${b.id}`,
        quote: b.quote,
        text: b.text,
        is_custom: false
      }));
    } else if (presetType === 'lent') {
      list = LENT_BLESSINGS.map(b => ({
        category: `Mùa Chay ${b.id}`,
        quote: b.quote,
        text: b.text,
        is_custom: false
      }));
    } else if (presetType === 'advent') {
      list = ADVENT_BLESSINGS.map(b => ({
        category: `Mùa Vọng ${b.id}`,
        quote: b.quote,
        text: b.text,
        is_custom: false
      }));
    } else if (presetType === 'marian') {
      list = MARIAN_BLESSINGS.map(b => ({
        category: `Kính Đức Mẹ ${b.id}`,
        quote: b.quote,
        text: b.text,
        is_custom: false
      }));
    } else if (presetType === 'joseph') {
      list = ST_JOSEPH_BLESSINGS.map(b => ({
        category: `Thánh Giuse ${b.id}`,
        quote: b.quote,
        text: b.text,
        is_custom: false
      }));
    } else if (presetType === 'eucharist') {
      list = EUCHARIST_BLESSINGS.map(b => ({
        category: `Thánh Thể ${b.id}`,
        quote: b.quote,
        text: b.text,
        is_custom: false
      }));
    } else {
      list = DEFAULT_BLESSINGS.filter(b => b.id !== 0).map(b => ({
        category: `Lộc số ${b.id}`,
        quote: b.quote,
        text: b.text,
        is_custom: false
      }));
    }

    await this.saveBlessings(wheelId, list);

    // Đồng bộ theme và card template tương ứng với presetType
    const themePreset = presetType === 'gifts' ? 'pentecost' : presetType;
    const cardTemplate = presetType === 'tet' ? 'tet' : presetType === 'christmas' ? 'christmas' : presetType === 'joseph' ? 'wood' : presetType === 'eucharist' ? 'gold' : 'default';

    await this.updateWheel(wheelId, {
      theme_preset: themePreset,
      card_template: cardTemplate
    });
  },

  // --- SPIN HISTORY OPERATIONS ---
  async getSpinHistory(wheelId: string): Promise<SpinHistory[]> {
    if (isOnline()) {
      const { data, error } = await supabase!
        .from('spin_history')
        .select('*')
        .eq('wheel_id', wheelId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const history = getLocalData<SpinHistory>('local_spin_history');
      return history.filter(h => h.wheel_id === wheelId).sort((a,b) => {
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        return dateB - dateA;
      });
    }
  },

  async clearSpinHistory(wheelId: string) {
    if (isOnline()) {
      const { error } = await supabase!
        .from('spin_history')
        .delete()
        .eq('wheel_id', wheelId);
      if (error) throw error;
    } else {
      const history = getLocalData<SpinHistory>('local_spin_history');
      const filtered = history.filter(h => h.wheel_id !== wheelId);
      setLocalData<SpinHistory>('local_spin_history', filtered);
    }
  },

  async recordSpin(
    wheelId: string,
    itemSpun?: string,
    blessingId?: string
  ): Promise<{
    success: boolean;
    blessing?: {
      id: string;
      category: string;
      quote?: string;
      text: string;
      is_custom?: boolean;
    };
    target_angle?: number;
    signature?: string;
    error?: string;
  }> {
    const sessionId = localStorage.getItem('local_session_id') || (() => {
      const sid = generateUUID();
      localStorage.setItem('local_session_id', sid);
      return sid;
    })();

    const fingerprint = await getDeviceFingerprint();

    // Check if online database is active and we have internet connection
    const online = isOnline() && typeof navigator !== 'undefined' && navigator.onLine;

    if (online) {
      try {
        let session_token = '';
        if (supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          session_token = sessionData?.session?.access_token || '';
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (session_token) {
          headers['Authorization'] = `Bearer ${session_token}`;
        }

        const response = await fetch('/api/spin', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            wheel_id: wheelId,
            item_spun: itemSpun,
            blessing_id: blessingId,
            session_id: sessionId,
            fingerprint: fingerprint
          })
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            blessing: data.blessing,
            target_angle: data.target_angle,
            signature: data.signature
          };
        } else {
          // Handle server-side errors (e.g., lock duration active)
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || `Lỗi máy chủ (${response.status})`;
          return {
            success: false,
            error: errorMsg
          };
        }
      } catch (error) {
        console.warn('Network error calling /api/spin, falling back to offline mode:', error);
        // Fall through to offline queueing below
      }
    }

    // Offline / Network Error Fallback
    let finalItemSpun = itemSpun;
    let finalBlessingId = blessingId;
    let selectedBlessing = null;

    if (!finalItemSpun || !finalBlessingId) {
      const blessings = await this.getBlessings(wheelId);
      if (blessings.length > 0) {
        const randomIdx = Math.floor(Math.random() * blessings.length);
        const b = blessings[randomIdx];
        finalItemSpun = b.category;
        finalBlessingId = b.id;
        selectedBlessing = b;
      } else {
        finalItemSpun = 'Lộc Lời Chúa';
        finalBlessingId = generateUUID();
      }
    }

    const history = getLocalData<SpinHistory>('local_spin_history');
    const mockHistory: SpinHistory = {
      id: generateUUID(),
      wheel_id: wheelId,
      blessing_id: finalBlessingId,
      item_spun: finalItemSpun,
      session_id: sessionId,
      created_at: new Date().toISOString()
    };
    history.push(mockHistory);
    setLocalData<SpinHistory>('local_spin_history', history);

    // Offline spins are kept locally only to prevent forged spin results 
    // and avoid duplicate server-side recording when coming back online.

    return {
      success: false,
      blessing: selectedBlessing || {
        id: finalBlessingId,
        wheel_id: wheelId,
        category: finalItemSpun,
        text: 'Chúc bạn nhận được Ơn lành từ Chúa!',
        is_custom: true
      },
      error: 'Mất kết nối mạng, đã lưu ngoại tuyến và sẽ tự động đồng bộ khi có mạng.'
    };
  },

  async uploadCustomBgm(wheelId: string, file: File): Promise<string> {
    if (isOnline()) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${wheelId}-${Date.now()}.${fileExt}`;
      const filePath = `bgm/${fileName}`;

      // Upload file to Supabase Storage bucket 'audio'
      const { error } = await supabase!.storage
        .from('audio')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase!.storage
        .from('audio')
        .getPublicUrl(filePath);

      return publicUrl;
    } else {
      // Offline: Save directly to IndexedDB
      await this.saveLocalBgm(wheelId, file);
      return `indexeddb://${wheelId}`;
    }
  },

  async deleteCustomBgm(wheelId: string, customBgmUrl?: string) {
    if (isOnline() && customBgmUrl) {
      try {
        const marker = '/public/audio/';
        const idx = customBgmUrl.indexOf(marker);
        if (idx !== -1) {
          const filePath = decodeURIComponent(customBgmUrl.substring(idx + marker.length));
          const { error } = await supabase!.storage
            .from('audio')
            .remove([filePath]);
          if (error) {
            console.error('Error removing BGM from Supabase storage:', error);
          }
        }
      } catch (err) {
        console.error('Failed to parse and delete custom BGM file:', err);
      }
    }
    // Always clean up offline IndexedDB copy as well
    await this.deleteLocalBgm(wheelId);
  },

  // IndexedDB operations for custom BGM
  async saveLocalBgm(wheelId: string, blob: Blob): Promise<void> {
    const db = await getIDBStore();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(blob, wheelId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getLocalBgm(wheelId: string): Promise<Blob | null> {
    const db = await getIDBStore();
    return new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(wheelId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteLocalBgm(wheelId: string): Promise<void> {
    const db = await getIDBStore();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(wheelId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async uploadCustomWinSfx(wheelId: string, file: File): Promise<string> {
    if (isOnline()) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${wheelId}-${Date.now()}.${fileExt}`;
      const filePath = `sfx/${fileName}`;

      // Upload file to Supabase Storage bucket 'audio'
      const { error } = await supabase!.storage
        .from('audio')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase!.storage
        .from('audio')
        .getPublicUrl(filePath);

      return publicUrl;
    } else {
      // Offline: Save directly to IndexedDB
      await this.saveLocalWinSfx(wheelId, file);
      return `indexeddb://win_sfx_${wheelId}`;
    }
  },

  async deleteCustomWinSfx(wheelId: string, customWinSfxUrl?: string) {
    if (isOnline() && customWinSfxUrl) {
      try {
        const marker = '/public/audio/';
        const idx = customWinSfxUrl.indexOf(marker);
        if (idx !== -1) {
          const filePath = decodeURIComponent(customWinSfxUrl.substring(idx + marker.length));
          const { error } = await supabase!.storage
            .from('audio')
            .remove([filePath]);
          if (error) {
            console.error('Error removing Win SFX from Supabase storage:', error);
          }
        }
      } catch (err) {
        console.error('Failed to parse and delete custom Win SFX file:', err);
      }
    }
    // Always clean up offline IndexedDB copy as well
    await this.deleteLocalWinSfx(wheelId);
  },

  // IndexedDB operations for custom Win SFX
  async saveLocalWinSfx(wheelId: string, blob: Blob): Promise<void> {
    const db = await getIDBStore();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(blob, `win_sfx_${wheelId}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getLocalWinSfx(wheelId: string): Promise<Blob | null> {
    const db = await getIDBStore();
    return new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(`win_sfx_${wheelId}`);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteLocalWinSfx(wheelId: string): Promise<void> {
    const db = await getIDBStore();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(`win_sfx_${wheelId}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Asset Cache Operations (BGM, background images, logo images)
  async getCachedAssetUrl(url: string): Promise<string> {
    if (!url || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('indexeddb:')) {
      return url;
    }
    try {
      const db = await getIDBStore();
      const blob = await new Promise<Blob | null>((resolve, reject) => {
        const tx = db.transaction('asset_cache', 'readonly');
        const store = tx.objectStore('asset_cache');
        const request = store.get(url);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });

      if (blob) {
        return URL.createObjectURL(blob);
      }

      // If not cached, fetch and cache it
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch asset: ${response.statusText}`);
      }
      const fetchedBlob = await response.blob();
      
      // Save to IndexedDB
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('asset_cache', 'readwrite');
        const store = tx.objectStore('asset_cache');
        const request = store.put(fetchedBlob, url);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      return URL.createObjectURL(fetchedBlob);
    } catch (err) {
      console.warn(`Asset cache failed for ${url}, falling back to original:`, err);
      return url;
    }
  },

  async syncOfflineActions() {
    if (!supabase || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return;
    }

    // Retrieve pending actions from IndexedDB
    let actions: SyncAction[] = [];
    try {
      const db = await getLocalDB();
      actions = await new Promise<SyncAction[]>((resolve, reject) => {
        const tx = db.transaction(SYNC_QUEUE_STORE, 'readonly');
        const store = tx.objectStore(SYNC_QUEUE_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('Failed to read sync_queue from IndexedDB:', err);
    }

    // Retrieve from LocalStorage fallback
    let lsActions: SyncAction[] = [];
    try {
      lsActions = JSON.parse(localStorage.getItem('vqlc_sync_queue') || '[]');
    } catch (err) {
      console.error('Failed to parse vqlc_sync_queue from LocalStorage:', err);
    }

    // Combine actions
    const allActions = [...actions, ...lsActions].filter(a => a.status !== 'syncing');
    if (allActions.length === 0) return;

    console.log(`Found ${allActions.length} pending actions to sync...`);

    // Process each action
    for (const action of allActions) {
      action.status = 'syncing';
      action.last_attempt = new Date().toISOString();

      await updateActionStatus(action);

      try {
        if (action.action_type === 'RECORD_SPIN') {
          let session_token = '';
          if (supabase) {
            const { data: sessionData } = await supabase.auth.getSession();
            session_token = sessionData?.session?.access_token || '';
          }

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };
          if (session_token) {
            headers['Authorization'] = `Bearer ${session_token}`;
          }

          const payload = action.payload as {
            wheel_id: string;
            blessing_id?: string;
            item_spun: string;
            session_id?: string;
            created_at?: string;
            fingerprint?: string;
          };
          const response = await fetch('/api/spin', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              wheel_id: payload.wheel_id,
              blessing_id: payload.blessing_id,
              item_spun: payload.item_spun,
              session_id: payload.session_id,
              created_at: payload.created_at,
              fingerprint: payload.fingerprint,
              offline_sync: true
            })
          });

          if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
          }
        }

        // Success - remove from queue
        await removeAction(action.id);
        console.log(`Successfully synced action ${action.id}`);
      } catch (err) {
        console.error(`Failed to sync action ${action.id}:`, err);
        action.status = 'failed';
        action.retry_count += 1;
        await updateActionStatus(action);
      }
    }
  }
};

// Set up online listener and auto-sync trigger
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    dbService.syncOfflineActions().catch(err => console.error('Error in online event sync:', err));
  });
  // Auto sync on startup after 3 seconds
  setTimeout(() => {
    dbService.syncOfflineActions().catch(err => console.error('Error in startup sync:', err));
  }, 3000);
}

