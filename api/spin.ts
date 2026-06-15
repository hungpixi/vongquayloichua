import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';

// Extend IncomingMessage and ServerResponse to match Vercel Node API signatures
interface VercelRequest extends IncomingMessage {
  query: { [key: string]: string | string[] };
  body: any;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => void;
}

// Setup CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Handle CORS Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Set standard CORS headers for subsequent responses
  Object.entries(corsHeaders).forEach(([key, val]) => {
    res.setHeader(key, val);
  });

  // 2. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 3. Parse and validate input body
    const { wheel_id, fingerprint, name, group, session_token } = req.body || {};

    if (!wheel_id) {
      return res.status(400).json({ error: 'Missing wheel_id parameter' });
    }
    if (!fingerprint) {
      return res.status(400).json({ error: 'Missing fingerprint parameter' });
    }

    // Input Validation: Check UUID format for wheel_id to prevent database syntax errors
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(wheel_id)) {
      return res.status(400).json({ error: 'Mã vòng quay không hợp lệ (Sai định dạng UUID).' });
    }

    // 4. Retrieve client IP address
    const rawIp = req.headers['x-forwarded-for'] as string || '';
    const ip = rawIp.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';

    // 5. Check environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const serverSecret = process.env.SERVER_SPIN_SECRET || '';
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials missing in env');
      return res.status(500).json({ error: 'Database configuration error' });
    }

    if (!serverSecret) {
      console.error('SERVER_SPIN_SECRET missing in env');
      return res.status(500).json({ error: 'Security configuration error' });
    }

    // Initialize Supabase Client with Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    // 5.b Verify authenticated Supabase user (if session token is provided)
    let userId = '';
    const authHeader = req.headers['authorization'] as string || '';
    const sessionToken = session_token || (authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '');
    
    if (sessionToken) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(sessionToken);
        if (user && !userError) {
          userId = user.id;
        }
      } catch (err) {
        console.warn('Supabase session token verification failed:', err);
      }
    }

    // 6. Fetch the wheel configuration to check lock_duration and display_slots
    const { data: wheel, error: wheelError } = await supabase
      .from('wheels')
      .select('*')
      .eq('id', wheel_id)
      .maybeSingle();

    if (wheelError || !wheel) {
      console.error('Fetch wheel error:', wheelError);
      return res.status(404).json({ error: 'Wheel not found' });
    }

    const lockDuration = wheel.lock_duration || '24h';
    const isLockActive = lockDuration !== 'none';

    // 7. Server checks lock duration / rate limiting if lock is active
    if (isLockActive) {
      // 7.a Check Upstash Redis on 3 vectors: fingerprint, IP, and userId
      let isRedisLocked = false;
      if (redisUrl && redisToken) {
        try {
          const redisCheckKeys = [
            ['GET', `spin_lock:${wheel_id}:${fingerprint}`],
            ['GET', `spin_lock:${wheel_id}:${ip}`],
          ];
          if (userId) {
            redisCheckKeys.push(['GET', `spin_lock:${wheel_id}:${userId}`]);
          }

          const checkResponse = await fetch(redisUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${redisToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(redisCheckKeys),
          });

          if (checkResponse.ok) {
            const checkResults = await checkResponse.json();
            if (Array.isArray(checkResults)) {
              for (const r of checkResults) {
                const val = typeof r === 'object' && r !== null ? r.result : r;
                if (val !== null && val !== undefined && val !== '') {
                  isRedisLocked = true;
                  break;
                }
              }
            }
          }
        } catch (redisErr) {
          console.warn('Redis check failed, falling back to Supabase:', redisErr);
        }
      }

      if (isRedisLocked) {
        return res.status(403).json({
          error: 'Bạn đã nhận Lộc Lời Chúa hôm nay rồi. Hẹn gặp lại bạn vào ngày mai!',
          code: 'RATE_LIMIT_EXCEEDED'
        });
      }

      // 7.b Check Supabase spin_history on 3 vectors
      try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const orConditions = [
          `session_id.eq.${fingerprint}`,
          `ip_address.eq.${ip}`
        ];
        if (userId) {
          orConditions.push(`session_id.eq.${userId}`);
        }

        const { data: recentSpins, error: spinError } = await supabase
          .from('spin_history')
          .select('id')
          .eq('wheel_id', wheel_id)
          .gte('created_at', twentyFourHoursAgo)
          .or(orConditions.join(','));

        if (spinError) {
          console.error('Supabase spin history check error:', spinError);
        } else if (recentSpins && recentSpins.length > 0) {
          return res.status(403).json({
            error: 'Bạn đã nhận Lộc Lời Chúa hôm nay rồi. Hẹn gặp lại bạn vào ngày mai!',
            code: 'RATE_LIMIT_EXCEEDED'
          });
        }
      } catch (dbErr) {
        console.error('Database check error:', dbErr);
      }
    }

    // 8. Fetch blessings for the wheel
    const { data: blessings, error: blessingsError } = await supabase
      .from('blessings')
      .select('*')
      .eq('wheel_id', wheel_id)
      .order('created_at', { ascending: true });

    if (blessingsError || !blessings || blessings.length === 0) {
      console.error('Fetch blessings error:', blessingsError);
      return res.status(404).json({ error: 'No blessings found for this wheel' });
    }

    // 9. CSPRNG selection calling crypto.getRandomValues if available
    const getRandomIndex = (max: number): number => {
      const array = new Uint32Array(1);
      if (typeof globalThis.crypto?.getRandomValues === 'function') {
        globalThis.crypto.getRandomValues(array);
      } else if (crypto.webcrypto && typeof crypto.webcrypto.getRandomValues === 'function') {
        (crypto.webcrypto as any).getRandomValues(array);
      } else {
        const buffer = crypto.randomBytes(4);
        array[0] = buffer.readUInt32BE(0);
      }
      return array[0] % max;
    };

    const selectedIdx = getRandomIndex(blessings.length);
    const blessing = blessings[selectedIdx];

    // 10. Target angle calculation
    const display_slots = wheel.display_slots && wheel.display_slots > 0 
      ? wheel.display_slots 
      : blessings.length;
    const slot_idx = selectedIdx % display_slots;
    const target_angle = 2 * Math.PI - (slot_idx + 0.5) * (2 * Math.PI / display_slots);

    // 11. Generate HMAC-SHA256 signature
    const dataToSign = `${wheel_id}:${blessing.id}:${target_angle}`;
    const signature = crypto
      .createHmac('sha256', serverSecret)
      .update(dataToSign)
      .digest('hex');

    // 12. Create spin record
    // session_id stores the authenticated user ID if available, to prevent fingerprint spoofing
    const spinRecord = {
      wheel_id,
      blessing_id: blessing.id,
      item_spun: blessing.category,
      session_id: userId || fingerprint,
      ip_address: ip,
      parishioner_name: name || 'Ẩn danh',
      parishioner_group: group || '',
      created_at: new Date().toISOString(),
    };

    // 13. Push to Redis spin_queue and set lock duration if active
    if (redisUrl && redisToken) {
      try {
        const pipelineCommands = [
          ['LPUSH', 'spin_queue', JSON.stringify(spinRecord)]
        ];

        // If lock is active, set Redis locks with 24 hours TTL
        if (isLockActive) {
          pipelineCommands.push(
            ['SET', `spin_lock:${wheel_id}:${fingerprint}`, '1', 'EX', '86400'],
            ['SET', `spin_lock:${wheel_id}:${ip}`, '1', 'EX', '86400']
          );
          if (userId) {
            pipelineCommands.push(
              ['SET', `spin_lock:${wheel_id}:${userId}`, '1', 'EX', '86400']
            );
          }
        }

        const redisResponse = await fetch(redisUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${redisToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pipelineCommands),
        });

        if (!redisResponse.ok) {
          console.error('Failed to push spin record to Redis:', await redisResponse.text());
        }
      } catch (redisErr) {
        console.error('Redis operation failed:', redisErr);
      }
    } else {
      console.warn('Redis configuration missing, inserting record directly to Supabase as fallback');
      // Fallback: If Redis is not configured, we write directly to Supabase
      const { error: insertError } = await supabase
        .from('spin_history')
        .insert(spinRecord);
      if (insertError) {
        console.error('Direct Supabase insert failed:', insertError);
      }
    }

    // 14. Return successful JSON response
    return res.status(200).json({
      blessing,
      target_angle,
      signature,
    });

  } catch (error: any) {
    console.error('Server error handling spin:', error);
    return res.status(500).json({
      error: 'Có lỗi xảy ra trên máy chủ khi chọn Lộc Lời Chúa. Vui lòng thử lại!',
      details: error.message || String(error)
    });
  }
}
