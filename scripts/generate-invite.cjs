const fs = require('fs');
const path = require('path');

// 1. Parse .env file manually to avoid external dependencies
try {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const parts = trimmed.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
      }
    });
  }
} catch (err) {
  console.error('Error loading .env file:', err);
}

const secret = process.env.INVITATION_SECRET || 'vqlc_invitation_secret_key_2026';
const STEP_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

function generateCode(secretKey, block) {
  const payload = `${secretKey}-${block}`;
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  const code = Math.abs(hash) % 1000000;
  return code.toString().padStart(6, '0');
}

const now = Date.now();
const currentBlock = Math.floor(now / STEP_MS);

// Calculate remaining time
const msRemaining = STEP_MS - (now % STEP_MS);
const minRemaining = Math.floor(msRemaining / (60 * 1000));
const secRemaining = Math.floor((msRemaining % (60 * 1000)) / 1000);

const currentCode = generateCode(secret, currentBlock);
const previousCode = generateCode(secret, currentBlock - 1);
const nextCode = generateCode(secret, currentBlock + 1);

console.log('\n=============================================');
console.log('      MÃ MỜI ĐĂNG KÝ VÒNG QUAY LỜI CHÚA      ');
console.log('=============================================');
console.log(`MÃ ĐANG HIỆU LỰC (Hôm nay):  \x1b[32;1m${currentCode}\x1b[0m`);
console.log(`Thời gian còn lại:           \x1b[36m${minRemaining} phút ${secRemaining} giây\x1b[0m`);
console.log('---------------------------------------------');
console.log(`Mã vừa hết hạn (Gối đầu):   \x1b[33m${previousCode}\x1b[0m`);
console.log(`Mã kế tiếp (Sau 15 phút):    \x1b[35m${nextCode}\x1b[0m`);
console.log('=============================================\n');
