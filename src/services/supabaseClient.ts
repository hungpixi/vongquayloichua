import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Khởi tạo client chỉ khi có đủ biến môi trường hợp lệ để tránh crash ứng dụng
// Supabase Anon Key bắt buộc phải là JWT (bắt đầu bằng eyJ)
const isValidSupabase = 
  supabaseUrl && 
  supabaseUrl.startsWith('https://') && 
  supabaseAnonKey && 
  supabaseAnonKey.startsWith('eyJ');

export const supabase = isValidSupabase 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing or invalid. Fallback to LocalStorage will be active.'
  );
}
