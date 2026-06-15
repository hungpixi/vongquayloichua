import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Helper to dynamically check and get CORS headers
function getCorsHeaders(req: VercelRequest): { [key: string]: string } | null {
  const origin = (req.headers.origin || req.headers.Origin) as string;
  if (!origin) return null;

  try {
    const hostname = new URL(origin).hostname;
    let isAllowed = false;

    // Allow localhost, local IP addresses
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0'
    ) {
      isAllowed = true;
    }
    // Allow main platform domains & subdomains
    else if (
      hostname === 'vongquayloichua.com' ||
      hostname.endsWith('.vongquayloichua.com')
    ) {
      isAllowed = true;
    }
    // Allow Vercel deployments (previews, etc.)
    else if (hostname.endsWith('.vercel.app')) {
      isAllowed = true;
    }

    if (isAllowed) {
      return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Client-Fingerprint',
        'Access-Control-Max-Age': '86400',
      };
    }
  } catch (err) {
    console.error('CORS origin parsing error:', err);
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Setup CORS headers dynamically
  const cors = getCorsHeaders(req);
  if (cors) {
    Object.entries(cors).forEach(([key, val]) => {
      res.setHeader(key, val);
    });
  }

  // Handle CORS Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    if (!cors) {
      return res.status(403).json({ error: 'CORS Origin Not Allowed' });
    }
    res.writeHead(200);
    res.end();
    return;
  }

  // 2. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 3. Parse and validate input body
    const { wheel_id, fingerprint, session_id, name, group, blessing_id, item_spun, created_at, offline_sync } = (req.body || {}) as Record<string, unknown>;

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

    // 5.b Verify authenticated Supabase user (session token is optional)
    const authHeader = req.headers['authorization'] as string || '';
    let userId = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionToken = authHeader.substring(7);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(sessionToken);
        if (user && !userError) {
          userId = user.id;
        }
      } catch (err) {
        console.warn('Supabase session token verification failed (ignored for optional auth):', err);
      }
    }

    // 5.c Handle offline sync bypass
    if (offline_sync) {
      if (!blessing_id || !item_spun) {
        return res.status(400).json({ error: 'Missing blessing_id or item_spun for offline sync' });
      }
      const spinRecord = {
        wheel_id,
        blessing_id,
        item_spun,
        session_id: session_id || userId || fingerprint,
        ip_address: ip,
        parishioner_name: name || 'Ẩn danh',
        parishioner_group: group || '',
        created_at: created_at || new Date().toISOString(),
      };

      if (redisUrl && redisToken) {
        try {
          const redisResponse = await fetch(redisUrl, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${redisToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([['LPUSH', 'spin_queue', JSON.stringify(spinRecord)]]),
          });
          if (!redisResponse.ok) {
            console.error('Failed to push offline spin record to Redis:', await redisResponse.text());
          }
        } catch (redisErr) {
          console.error('Redis operation failed during offline sync:', redisErr);
        }
      } else {
        const { error: insertError } = await supabase
          .from('spin_history')
          .insert(spinRecord);
        if (insertError) {
          console.error('Direct Supabase insert failed during offline sync:', insertError);
        }
      }

      return res.status(200).json({ success: true, message: 'Offline spin synchronized successfully' });
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

    // Parse lock duration dynamically
    let sinceDate: Date | null = null;
    let redisTtl = 86400; // default 24h in seconds
    if (isLockActive) {
      if (lockDuration === 'forever') {
        redisTtl = 31536000; // 1 year
      } else {
        const match = lockDuration.match(/^(\d+)([hmds])$/i);
        let ms = 24 * 60 * 60 * 1000;
        if (match) {
          const value = parseInt(match[1], 10);
          const unit = match[2].toLowerCase();
          if (unit === 'h') {
            ms = value * 60 * 60 * 1000;
            redisTtl = value * 60 * 60;
          } else if (unit === 'm') {
            ms = value * 60 * 1000;
            redisTtl = value * 60;
          } else if (unit === 'd') {
            ms = value * 24 * 60 * 60 * 1000;
            redisTtl = value * 24 * 60 * 60;
          } else if (unit === 's') {
            ms = value * 1000;
            redisTtl = value;
          }
        }
        sinceDate = new Date(Date.now() - ms);
      }
    }

    // 7. Server checks lock duration / rate limiting if lock is active
    if (isLockActive) {
      // 7.a Check Upstash Redis on 3 vectors: fingerprint, IP, and session_id
      let isRedisLocked = false;
      if (redisUrl && redisToken) {
        try {
          const redisCheckKeys: string[][] = [];
          if (fingerprint) redisCheckKeys.push(['GET', `spin_lock:${wheel_id}:${fingerprint}`]);
          if (ip) redisCheckKeys.push(['GET', `spin_lock:${wheel_id}:${ip}`]);
          if (session_id) redisCheckKeys.push(['GET', `spin_lock:${wheel_id}:${session_id}`]);
          if (userId) redisCheckKeys.push(['GET', `spin_lock:${wheel_id}:${userId}`]);

          if (redisCheckKeys.length > 0) {
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
        const orConditions: string[] = [];
        if (fingerprint) orConditions.push(`session_id.eq.${fingerprint}`);
        if (session_id) orConditions.push(`session_id.eq.${session_id}`);
        if (userId) orConditions.push(`session_id.eq.${userId}`);
        if (ip) orConditions.push(`ip_address.eq.${ip}`);

        if (orConditions.length > 0) {
          let query = supabase
            .from('spin_history')
            .select('id')
            .eq('wheel_id', wheel_id);

          if (sinceDate) {
            query = query.gte('created_at', sinceDate.toISOString());
          }

          const { data: recentSpins, error: spinError } = await query.or(orConditions.join(','));

          if (spinError) {
            console.error('Supabase spin history check error:', spinError);
          } else if (recentSpins && recentSpins.length > 0) {
            return res.status(403).json({
              error: 'Bạn đã nhận Lộc Lời Chúa hôm nay rồi. Hẹn gặp lại bạn vào ngày mai!',
              code: 'RATE_LIMIT_EXCEEDED'
            });
          }
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

    // 9. CSPRNG selection with uniform distribution mapping
    const getRandomIndex = (max: number): number => {
      const array = new Uint32Array(1);
      const limit = Math.floor(4294967296 / max) * max;
      let val: number;
      do {
        if (typeof globalThis.crypto?.getRandomValues === 'function') {
          globalThis.crypto.getRandomValues(array);
        } else if (crypto.webcrypto && typeof crypto.webcrypto.getRandomValues === 'function') {
          (crypto.webcrypto as unknown as { getRandomValues: typeof crypto.getRandomValues }).getRandomValues(array);
        } else {
          const buffer = crypto.randomBytes(4);
          array[0] = buffer.readUInt32BE(0);
        }
        val = array[0];
      } while (val >= limit);
      return val % max;
    };

    const selectedIdx = getRandomIndex(blessings.length);
    const blessing = blessings[selectedIdx];

    // 10. Target angle calculation
    const display_slots = (wheel.config?.display_slots || wheel.display_slots || blessings.length);
    const slot_idx = selectedIdx % display_slots;
    const target_angle = 2 * Math.PI - (slot_idx + 0.5) * (2 * Math.PI / display_slots);

    // 11. Generate HMAC-SHA256 signature
    const dataToSign = `${wheel_id}:${blessing.id}:${target_angle}`;
    const signature = crypto
      .createHmac('sha256', serverSecret)
      .update(dataToSign)
      .digest('hex');

    // 12. Create spin record
    const spinRecord = {
      wheel_id,
      blessing_id: blessing.id,
      item_spun: blessing.category,
      session_id: session_id || userId || fingerprint,
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

        // If lock is active, set Redis locks with calculated TTL
        if (isLockActive) {
          const ttlStr = String(redisTtl);
          if (fingerprint) {
            pipelineCommands.push(['SET', `spin_lock:${wheel_id}:${fingerprint}`, '1', 'EX', ttlStr]);
          }
          if (ip) {
            pipelineCommands.push(['SET', `spin_lock:${wheel_id}:${ip}`, '1', 'EX', ttlStr]);
          }
          if (session_id) {
            pipelineCommands.push(['SET', `spin_lock:${wheel_id}:${session_id}`, '1', 'EX', ttlStr]);
          }
          if (userId) {
            pipelineCommands.push(['SET', `spin_lock:${wheel_id}:${userId}`, '1', 'EX', ttlStr]);
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
        } else {
          // Trigger background sync via QStash if QSTASH_TOKEN is configured
          const qstashToken = process.env.QSTASH_TOKEN || '';
          if (qstashToken) {
            try {
              const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
              const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
              if (host) {
                const syncUrl = `${protocol}://${host}/api/sync-queue`;
                const cronSecret = process.env.CRON_SECRET || '';
                const targetUrl = cronSecret 
                  ? `${syncUrl}?secret=${encodeURIComponent(cronSecret)}`
                  : syncUrl;
                  
                const qstashPublishUrl = `https://qstash.upstash.io/v2/publish/${targetUrl}`;
                
                fetch(qstashPublishUrl, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${qstashToken}`,
                    'Content-Type': 'application/json',
                    'Upstash-Delay': '5s', // Run after 5s delay to allow other spins to batch
                  },
                  body: JSON.stringify({ source: 'spin_api' }),
                }).catch(err => {
                  console.error('QStash trigger background promise error:', err);
                });
                
                console.log('[Spin API] Dispatched QStash sync trigger with 5s delay.');
              }
            } catch (qstashErr) {
              console.error('Failed to dispatch QStash sync trigger:', qstashErr);
            }
          }
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

  } catch (error: unknown) {
    console.error('Server error handling spin:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: 'Có lỗi xảy ra trên máy chủ khi chọn Lộc Lời Chúa. Vui lòng thử lại!',
      details: msg
    });
  }
}
