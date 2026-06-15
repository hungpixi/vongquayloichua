import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';


function getCorsHeaders(req: VercelRequest): { [key: string]: string } | null {
  const origin = (req.headers.origin || req.headers.Origin) as string;
  if (!origin) return null;

  try {
    const hostname = new URL(origin).hostname;
    let isAllowed = false;

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === 'vongquayloichua.com' ||
      hostname.endsWith('.vongquayloichua.com') ||
      hostname.endsWith('.vercel.app')
    ) {
      isAllowed = true;
    }

    if (isAllowed) {
      return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      };
    }
  } catch (err) {
    console.error('CORS origin parsing error:', err);
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cors = getCorsHeaders(req);
  if (cors) {
    Object.entries(cors).forEach(([key, val]) => {
      res.setHeader(key, val);
    });
  }

  if (req.method === 'OPTIONS') {
    if (!cors) {
      return res.status(403).json({ error: 'CORS Origin Not Allowed' });
    }
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    // Nếu cấu hình Supabase chạy online, kiểm tra Authorization token
    if (supabaseUrl && supabaseAnonKey) {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Yêu cầu token xác thực.' });
      }

      const token = authHeader.substring(7);
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user || user.is_anonymous || user.app_metadata?.provider === 'anonymous') {
        return res.status(403).json({ error: 'Truy cập bị từ chối. Tài khoản của bạn không được phép lấy mã mời.' });
      }
    } else {
      // Khi chạy offline, chỉ cho phép từ localhost
      const origin = (req.headers.origin || req.headers.Origin || '') as string;
      const referer = (req.headers.referer || '') as string;
      const isLocalHost = 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') || 
        referer.includes('localhost') || 
        referer.includes('127.0.0.1');

      if (!isLocalHost) {
        return res.status(403).json({ error: 'Truy cập bị từ chối ở môi trường offline.' });
      }
    }

    const staticCode = process.env.STATIC_INVITE_CODE || process.env.INVITATION_SECRET || 'vqlc2026';

    return res.status(200).json({
      success: true,
      code: staticCode,
      isStatic: true
    });

  } catch (err: unknown) {
    console.error('Get invitation code error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ 
      error: 'Có lỗi xảy ra khi lấy mã mời.', 
      details: msg 
    });
  }
}
