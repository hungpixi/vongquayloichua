import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

interface SpinQueueItem {
  id?: string;
  wheel_id: string;
  blessing_id?: string | null;
  item_spun?: string;
  gift_name?: string;
  session_id?: string;
  parishioner_name?: string;
  ip_address?: string;
  created_at?: string;
}

// Initialize environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const cronSecret = process.env.CRON_SECRET;

// Helper to check for database constraint errors
function isPermanentError(code?: string): boolean {
  if (!code) return false;
  // Postgres Error Codes:
  // Class 22: Data Exception (e.g. invalid UUID formats)
  // Class 23: Integrity Constraint Violation (e.g. foreign keys, unique checks)
  // Class 42: Syntax Error or Access Rule Violation
  return code.startsWith('22') || code.startsWith('23') || code.startsWith('42');
}

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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  // 1.b Method verification
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Dependency validation
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Sync Worker] Supabase credentials missing.');
    return res.status(500).json({ error: 'Database configuration missing' });
  }
  if (!redisUrl || !redisToken) {
    console.error('[Sync Worker] Upstash Redis credentials missing.');
    return res.status(500).json({ error: 'Redis configuration missing' });
  }

  // Initialize clients
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });

  // 3. Security validation
  const authHeader = req.headers.authorization;
  const secretQuery = req.query?.secret;
  
  let isAuthorized = false;

  // Verify Supabase JWT token first if authHeader starts with Bearer
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (cronSecret && token === cronSecret) {
      isAuthorized = true;
    } else {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        // Only allow if user has system_admin or parish_admin role
        if (user && !userError && (user.app_metadata?.role === 'system_admin' || user.app_metadata?.role === 'parish_admin')) {
          isAuthorized = true;
        }
      } catch (err) {
        console.warn('[Sync Worker] Supabase session token verification failed:', err);
      }
    }
  }

  // Check query parameter fallback for cronSecret
  if (!isAuthorized && cronSecret && secretQuery === cronSecret) {
    isAuthorized = true;
  }

  if (!isAuthorized) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token or credentials' });
  }

  const redisHeaders = {
    'Authorization': `Bearer ${redisToken}`,
    'Content-Type': 'application/json'
  };

  const lockKey = 'spin_sync_lock';
  const queueKey = 'spin_queue';

  try {
    // 4. Acquire Redis distributed lock (expire in 60s to prevent concurrent cron overlap)
    const lockResponse = await fetch(redisUrl, {
      method: 'POST',
      headers: redisHeaders,
      body: JSON.stringify(['SET', lockKey, '1', 'NX', 'EX', '60'])
    });

    if (!lockResponse.ok) {
      throw new Error(`Failed to acquire lock from Redis: ${lockResponse.statusText}`);
    }

    const lockResult = await lockResponse.json();
    if (lockResult.result !== 'OK') {
      console.log('[Sync Worker] Skip: Sync already in progress (lock active).');
      return res.status(200).json({ success: true, message: 'Sync already in progress (lock active)' });
    }

    let itemsSuccess = 0;
    let itemsFailed = 0;
    let itemsSkipped = 0;
    const transientFailedRecords: SpinQueueItem[] = [];

    try {
      // 5. Pop a batch of 200 items from the queue (FIFO via RPOP)
      const popResponse = await fetch(redisUrl, {
        method: 'POST',
        headers: redisHeaders,
        body: JSON.stringify(['RPOP', queueKey, '200'])
      });

      if (!popResponse.ok) {
        throw new Error(`Failed to pop from Redis: ${popResponse.statusText}`);
      }

      const popResult = await popResponse.json();
      let rawItems = popResult.result;

      if (!rawItems) {
        rawItems = [];
      } else if (!Array.isArray(rawItems)) {
        rawItems = [rawItems];
      }

      if (rawItems.length === 0) {
        // Queue is empty, release lock and return
        await fetch(redisUrl, {
          method: 'POST',
          headers: redisHeaders,
          body: JSON.stringify(['DEL', lockKey])
        });
        console.log('[Sync Worker] Queue is empty. Sync completed with 0 items.');
        return res.status(200).json({ success: true, syncedCount: 0, message: 'Queue is empty' });
      }

      const K = rawItems.length;
      console.log(`[Sync Worker] Popped ${K} items from queue. Starting sync...`);

      // Parse queue items
      const parsedRecords = rawItems.map((rawItem: unknown) => {
        try {
          const item = (typeof rawItem === 'string' ? JSON.parse(rawItem) : rawItem) as SpinQueueItem;
          // Build strict schema compliance object
          return {
            id: item.id || crypto.randomUUID(),
            wheel_id: item.wheel_id,
            blessing_id: item.blessing_id || null,
            item_spun: item.item_spun || item.gift_name || 'Unknown Item',
            session_id: item.session_id || item.parishioner_name || 'unknown',
            ip_address: item.ip_address || '0.0.0.0',
            created_at: item.created_at || new Date().toISOString()
          };
        } catch (err) {
          console.error('[Sync Worker] JSON parse error for item:', rawItem, err);
          return null;
        }
      });

      // Filter out totally corrupt records (null or missing wheel_id)
      const validRecords = parsedRecords.filter((rec: typeof parsedRecords[number]): rec is NonNullable<typeof rec> => rec !== null && !!rec.wheel_id);
      const corruptCount = K - validRecords.length;
      itemsSkipped += corruptCount;

      if (validRecords.length > 0) {
        // 6. Attempt Bulk Insert (Upsert to prevent duplicate key errors on retry)
        const { error: bulkError } = await supabase
          .from('spin_history')
          .upsert(validRecords, { onConflict: 'id' });

        if (!bulkError) {
          // Bulk insert succeeded completely
          itemsSuccess += validRecords.length;
          console.log(`[Sync Worker] Successfully bulk inserted ${validRecords.length} records.`);
        } else {
          console.warn('[Sync Worker] Bulk insert failed, falling back to individual inserts:', bulkError);

          // If bulk insert fails, process individually
          for (const record of validRecords) {
            try {
              const { error: singleError } = await supabase
                .from('spin_history')
                .upsert(record, { onConflict: 'id' });

              if (!singleError) {
                itemsSuccess++;
              } else {
                // Check if error is due to missing foreign key
                if (singleError.code === '23503' && record.blessing_id) {
                  console.warn(`[Sync Worker] FK constraint violation on blessing_id ${record.blessing_id}. Retrying with null...`);
                  const retryRecord = { ...record, blessing_id: null };
                  const { error: retryError } = await supabase
                    .from('spin_history')
                    .upsert(retryRecord, { onConflict: 'id' });

                  if (!retryError) {
                    itemsSuccess++;
                    continue;
                  }
                  
                  console.error('[Sync Worker] Failed retry with null blessing_id:', retryError);
                  if (isPermanentError(retryError.code)) {
                    itemsFailed++;
                  } else {
                    transientFailedRecords.push(record);
                  }
                } else if (isPermanentError(singleError.code)) {
                  console.error(`[Sync Worker] Permanent error for record ${record.id}:`, singleError);
                  itemsFailed++;
                } else {
                  console.error(`[Sync Worker] Transient database error for record ${record.id}:`, singleError);
                  transientFailedRecords.push(record);
                }
              }
            } catch (err) {
              console.error(`[Sync Worker] Exception for record ${record.id}:`, err);
              transientFailedRecords.push(record);
            }
          }
        }
      }

      // 7. Re-queue transient failed records to Redis queue via RPUSH (maintaining FIFO order since we RPOP)
      if (transientFailedRecords.length > 0) {
        console.log(`[Sync Worker] Re-queueing ${transientFailedRecords.length} transiently failed records.`);
        const requeueCommands = transientFailedRecords.map(rec => ['RPUSH', queueKey, JSON.stringify(rec)]);
        await fetch(redisUrl, {
          method: 'POST',
          headers: redisHeaders,
          body: JSON.stringify(requeueCommands)
        });
      }

      // 8. Release the Redis distributed lock
      await fetch(redisUrl, {
        method: 'POST',
        headers: redisHeaders,
        body: JSON.stringify(['DEL', lockKey])
      });

      return res.status(200).json({
        success: true,
        totalChecked: K,
        syncedCount: itemsSuccess,
        failedCount: itemsFailed,
        skippedCount: itemsSkipped,
        requeuedCount: transientFailedRecords.length,
        message: `Synced ${itemsSuccess} spins. Re-queued ${transientFailedRecords.length} spins. Skipped/failed ${itemsSkipped + itemsFailed} items.`
      });

    } catch (innerError: unknown) {
      // Release lock on exception
      await fetch(redisUrl, {
        method: 'POST',
        headers: redisHeaders,
        body: JSON.stringify(['DEL', lockKey])
      });
      throw innerError;
    }

  } catch (error: unknown) {
    console.error('[Sync Worker] Critical Error during execution:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      success: false,
      error: msg || 'Internal Server Error'
    });
  }
}
