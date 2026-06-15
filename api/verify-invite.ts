import type { VercelRequest, VercelResponse } from '@vercel/node';

const STEP_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

function generateCode(secretKey: string, block: number): string {
  const payload = `${secretKey}-${block}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const code = Math.abs(hash) % 1000000;
  return code.toString().padStart(6, '0');
}

// Helper to dynamically check and get CORS headers
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  // CORS Setup
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const requireInvite = process.env.VITE_REQUIRE_INVITE_CODE !== 'false' && process.env.REQUIRE_INVITE_CODE !== 'false';
    if (!requireInvite) {
      return res.status(200).json({ success: true, message: 'Mã mời được bỏ qua (bypass)!' });
    }

    const { code } = (req.body || {}) as { code?: string };
    if (!code) {
      return res.status(400).json({ error: 'Thiếu mã mời xác thực.' });
    }

    const staticCode = process.env.STATIC_INVITE_CODE || process.env.INVITATION_SECRET || 'vqlc2026';
    const cleanCode = code.trim().toLowerCase();
    const cleanStaticCode = staticCode.trim().toLowerCase();

    if (cleanCode === cleanStaticCode) {
      return res.status(200).json({ success: true, message: 'Mã mời hợp lệ!' });
    }

    return res.status(400).json({ 
      success: false, 
      error: 'Mã mời không chính xác.' 
    });

  } catch (err: unknown) {
    console.error('Verify invitation code error:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ 
      error: 'Có lỗi xảy ra khi xác thực mã mời.', 
      details: msg 
    });
  }
}
