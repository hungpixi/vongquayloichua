# BÁO CÁO PHÂN TÍCH CẤU HÌNH MÔI TRƯỜNG & MÔI TRƯỜNG LOCAL DEV

## 1. Hiện Trạng & Phát Hiện (Current State & Findings)

### 1.1. Cấu trúc các file cấu hình hiện tại
Dự án sử dụng các tệp tin cấu hình sau để quản lý môi trường và triển khai:
*   **[.env](file:///d:/khoinghiep/vongquay/.env) & [.env.example](file:///d:/khoinghiep/vongquay/.env.example)**: 
    *   **Phần Client (tiền tố `VITE_`)**: Chứa `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_REQUIRE_INVITE_CODE`. Các biến này được Vite inject vào bundle client-side thông qua `import.meta.env`.
    *   **Phần Server (không có tiền tố)**: Chứa các secrets chỉ chạy trên môi trường serverless/worker như `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SERVER_SPIN_SECRET` (khóa ký HMAC), `QSTASH_TOKEN` (scheduler trigger), `CRON_SECRET`, `INVITATION_SECRET`, `STATIC_INVITE_CODE`.
*   **[vite.config.ts](file:///d:/khoinghiep/vongquay/vite.config.ts)**: Cấu hình dev server chạy trên cổng `3000`. Hiện tại hoàn toàn thiếu cấu hình proxy cho các API endpoints `/api/*`.
*   **[vercel.json](file:///d:/khoinghiep/vongquay/vercel.json)**: Định nghĩa các rule định tuyến (rewrites) và cấu hình cron job chạy nền.
    *   `/api/(.*)` -> `/api/$1` (Serverless Functions chạy trên Node.js).
    *   `/(.*)` -> `/index.html` (SPA routing fallback phục vụ React frontend).
    *   Cron job `/api/sync-queue` chạy lúc `00:00` hàng ngày để đẩy dữ liệu spin từ Upstash Redis vào Supabase.
*   **[package.json](file:///d:/khoinghiep/vongquay/package.json)**: Script khởi chạy dev hiện tại là `"dev": "vite"`. Lệnh này chỉ khởi chạy Vite Dev Server cho frontend ở cổng 3000, hoàn toàn bỏ qua backend APIs ở thư mục `/api`.

### 1.2. Phân tích các API Endpoints (`/api/*.ts`)
Các tệp tin Serverless Functions nằm tại thư mục `/api/*` bao gồm:
*   **[get-invite.ts](file:///d:/khoinghiep/vongquay/api/get-invite.ts)**: Cung cấp mã mời đăng ký. Hỗ trợ CORS cho `localhost`, các subdomains của `vongquayloichua.com` và `vercel.app`. Xác thực JWT token từ client (qua Bearer token) nếu kết nối online, hoặc chỉ cho phép origin từ `localhost` nếu chạy offline.
*   **[verify-invite.ts](file:///d:/khoinghiep/vongquay/api/verify-invite.ts)**: Xác thực mã mời đăng ký được gửi lên từ client. Tương tự như `get-invite.ts`, nó hỗ trợ CORS động và cho phép bypass xác thực nếu `VITE_REQUIRE_INVITE_CODE` là `'false'`.
*   **[spin.ts](file:///d:/khoinghiep/vongquay/api/spin.ts)**: Xử lý quay thưởng chính trên máy chủ (Anti-Cheat Server-Controlled Spin).
    *   Nhận thông tin vòng quay (`wheel_id`), fingerprint thiết bị, tên và nhóm của giáo dân.
    *   Xác thực phiên đăng nhập (JWT token gửi qua Authorization header) với Supabase Service Role.
    *   Kiểm tra lock rate limit (chặn quay lại trong 24h) qua Upstash Redis (bằng fingerprint, IP và userId) và kiểm tra dự phòng (fallback) qua bảng `spin_history` trong Supabase.
    *   Sử dụng CSPRNG (`crypto.getRandomValues`) để chọn lộc ngẫu nhiên, tính toán góc quay đích (`target_angle`).
    *   Tạo chữ ký số HMAC-SHA256 (`signature`) bảo mật bằng `SERVER_SPIN_SECRET` dựa trên chuỗi dữ liệu `${wheel_id}:${blessing.id}:${target_angle}` để ngăn chặn client giả lập hoặc làm giả kết quả.
    *   Đẩy kết quả vào hàng đợi `spin_queue` trên Upstash Redis và thiết lập khóa spin trên Redis TTL 24h. Đồng thời phát tín hiệu trigger QStash chạy ngầm để gọi `/api/sync-queue`.
*   **[sync-queue.ts](file:///d:/khoinghiep/vongquay/api/sync-queue.ts)**: Lấy tối đa 200 bản ghi từ đuôi hàng đợi `spin_queue` (Redis), thực hiện bulk upsert (insert hàng loạt) vào bảng `spin_history` (Supabase). Bảo mật bằng `CRON_SECRET` thông qua query parameter hoặc Bearer token.

### 1.3. Luồng gọi API và kiểm tra môi trường ở Frontend
*   **Kiểm tra trạng thái kết nối DB ([supabaseClient.ts](file:///d:/khoinghiep/vongquay/src/services/supabaseClient.ts))**:
    ```typescript
    const isValidSupabase = 
      supabaseUrl && 
      supabaseUrl.startsWith('https://') && 
      supabaseAnonKey && 
      supabaseAnonKey.startsWith('eyJ'); // Key Supabase hợp lệ phải bắt đầu bằng eyJ
    ```
    Nếu các điều kiện trên không thỏa mãn, client gán `supabase = null`.
*   **Phát hiện Online/Offline ([db.ts](file:///d:/khoinghiep/vongquay/src/services/db.ts))**:
    ```typescript
    const isOnline = () => !!supabase;
    const online = isOnline() && typeof navigator !== 'undefined' && navigator.onLine;
    ```
    *   Nếu `online === true`, client sẽ thực hiện các HTTP requests trực tiếp tới backend API `/api/spin` bằng đường dẫn tương đối.
    *   Nếu `online === false`, client sẽ tự động rơi vào **Offline Fallback**: Tự sinh kết quả ngẫu nhiên ở client (Local RNG), lưu trữ lịch sử vào LocalStorage (`local_spin_history`), không có chữ ký bảo mật từ server (`signature` rỗng) và báo lỗi kết nối mạng.

---

## 2. Các Vấn Đề Nghiêm Trọng & Điểm Yếu (Critical Issues & Weaknesses)

### Lỗi 1: Thiếu cơ chế runtime cho API khi chạy dev ở Local
Khi chạy lệnh `npm run dev`, Vite Dev Server được khởi tạo trên `http://localhost:3000`. Vite chỉ biên dịch và phục vụ mã nguồn frontend (React). Nó không có khả năng thực thi các tệp tin TypeScript Serverless Functions trong `/api/*.ts` (vốn đòi hỏi môi trường chạy Node.js Backend).
*   **Hậu quả**: Khi frontend gửi request `POST /api/spin` hoặc `POST /api/verify-invite` tới `localhost:3000/api/...`, do không có proxy, Vite Dev Server nhận request và áp dụng rule rewrite SPA (`/(.*) -> /index.html` hoặc mặc định fallback).
*   **Sự cố nghiêm trọng**: Vite trả về file `index.html` (chứa mã HTML) với mã trạng thái `200 OK`. Frontend nhận được phản hồi thành công (`response.ok === true`), sau đó chạy lệnh `await response.json()`. Việc parse một chuỗi HTML thành JSON thất bại và ném ra lỗi cú pháp `SyntaxError: Unexpected token '<'...`. Lỗi này đẩy client vào block `catch` và kích hoạt Offline Mode.

### Lỗi 2: Phụ thuộc vào tên miền thực để kiểm thử tính năng bảo mật (Anti-Cheat)
Để nhận được kết quả quay thưởng hợp lệ kèm chữ ký số HMAC (`signature`), frontend bắt buộc phải giao tiếp thành công với API `/api/spin`. Do không chạy được API ở local dưới script dev thông thường:
*   Nhà phát triển không thể test luồng quay thưởng có ký nhận (Server-Controlled Spin) ở local.
*   Bắt buộc phải deploy lên tên miền thực (production hoặc vercel preview) để kiểm tra tính đúng đắn của logic server, gây bất tiện lớn cho quá trình phát triển (Feedback loop kéo dài).
*   Mọi lượt quay thử nghiệm ở local đều bị coi là quay "offline", kết quả lưu cục bộ và không đồng bộ lên database do api `/api/spin` bị lỗi parse.

### Lỗi 3: Cơ chế CORS cứng nhắc hoặc lạm dụng bypass localhost ở API
Trong các API Serverless Functions, hàm `getCorsHeaders` cho phép `localhost`, `127.0.0.1` bất kể cấu hình môi trường nào. Điều này mở ra rủi ro bảo mật nếu ứng dụng production chấp nhận CORS từ bất kỳ client nào chạy ở local của kẻ tấn công, dễ bị khai thác tấn công Replay Attack hoặc Spam request.

---

## 3. Phương Án Giải Quyết Chi Tiết (Proposed Solution & Code Proposals)

### Phương án 1: Sử dụng Vercel CLI làm môi trường chạy Local chuẩn (Khuyến khích)
Để giả lập chính xác môi trường production (Vercel) bao gồm cả Frontend (Vite) và API Routes (Serverless Functions), nhà phát triển nên chạy dự án qua Vercel CLI thay vì chỉ chạy Vite đơn thuần.

#### Bước 1: Cài đặt Vercel CLI toàn cục (Global)
```bash
npm install -g vercel
```

#### Bước 2: Bổ dung Script khởi chạy vào [package.json](file:///d:/khoinghiep/vongquay/package.json)
Cập nhật tệp tin `package.json` để thêm lệnh khởi chạy bằng vercel dev:
```diff
   "scripts": {
     "dev": "vite",
+    "dev:local": "vercel dev",
     "build": "tsc -b && vite build",
```
Khi chạy `npm run dev:local`, Vercel CLI sẽ tự động liên kết dự án, biên dịch các API endpoints ở `/api` thành các local function chạy Node.js và proxy frontend sang một cổng thống nhất (thông thường là `http://localhost:3000`), giúp các cuộc gọi tới `/api/spin` hoạt động chính xác y hệt trên production.

---

### Phương án 2: Cấu hình Vite Reverse Proxy kết nối API Production/Staging
Trong trường hợp nhà phát triển chỉ muốn phát triển frontend cục bộ ở local (`npm run dev`) mà không cần chạy backend local, nhưng vẫn muốn kiểm thử tính năng spin thật có chữ ký số, ta có thể cấu hình Vite chuyển tiếp (proxy) các request `/api/*` tới server staging hoặc production thực tế.

Cấu hình thay thế đề xuất cho [vite.config.ts](file:///d:/khoinghiep/vongquay/vite.config.ts):
```diff
 import { defineConfig } from 'vite'
 import react from '@vitejs/plugin-react'
 
 // https://vite.dev/config/
 export default defineConfig({
   plugins: [react()],
   server: {
     port: 3000,
+    proxy: {
+      '/api': {
+        target: 'https://vongquayloichua.com', // Tên miền API thật hoặc staging
+        changeOrigin: true,
+        secure: true,
+        configure: (proxy, _options) => {
+          proxy.on('error', (err, _req, _res) => {
+            console.log('proxy error', err);
+          });
+        },
+      }
+    }
   },
 })
```
*   **Ưu điểm**: Frontend chạy ở local dev (`localhost:3000`) gọi `/api/spin` sẽ được Vite proxy chuyển tiếp thẳng tới `https://vongquayloichua.com/api/spin`. Request này sẽ lấy được kết quả thật, chữ ký HMAC thật và không bị lỗi CORS vì origin đã được proxy map trùng khớp.

---

### Phương án 3: Mock API chủ động ở Frontend khi ở môi trường Local Dev
Để tránh tình trạng lỗi JSON parsing crash do request `/api/*` trả về `index.html` của Vite dev server, chúng ta cần bổ sung cơ chế kiểm tra môi trường chủ động. Nếu phát hiện đang chạy ở local dev (không qua proxy hoặc vercel dev), client sẽ tự động mock kết quả thay vì gửi request HTTP.

Đoạn code đề xuất điều chỉnh hàm `recordSpin` trong tệp tin [db.ts](file:///d:/khoinghiep/vongquay/src/services/db.ts):

```diff
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
 
-    // Check if online database is active and we have internet connection
-    const online = isOnline() && typeof navigator !== 'undefined' && navigator.onLine;
+    // Kiểm tra xem có đang chạy ở môi trường Vite Local Dev thuần túy không (không có Vercel dev)
+    const isLocalDevVite = typeof window !== 'undefined' && 
+      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
+      !import.meta.env.VITE_USE_REAL_API; // Cho phép bật flag nếu muốn dùng proxy/vercel dev
+
+    // Chỉ online khi database active, có mạng và KHÔNG phải môi trường dev cô lập
+    const online = isOnline() && 
+      typeof navigator !== 'undefined' && 
+      navigator.onLine && 
+      !isLocalDevVite;
 
     if (online) {
       try {
         let session_token = '';
         if (supabase) {
           const { data: sessionData } = await supabase.auth.getSession();
           session_token = sessionData?.session?.access_token || '';
         }
```

Tương tự, điều chỉnh cơ chế mock cho các trang đăng ký và dashboard khi gọi `/api/verify-invite` và `/api/get-invite` ở local dev:

```typescript
// Ví dụ mock verify-invite tại RegisterPage.tsx:
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
if (isLocalDev) {
  // Tự động chấp nhận mã mời tĩnh mà không cần gửi API thật ở dev mode
  if (inviteCode === 'vqlc2026') {
    return { success: true, message: 'Mã mời hợp lệ (Mock Dev)!' };
  }
}
```

*   **Đánh giá**: Phương án này giúp cô lập hoàn toàn môi trường local dev của frontend, giúp ứng dụng không bao giờ bị crash do lỗi JSON parsing và cho phép phát triển ngoại tuyến (offline-first) mượt mà mà không tạo ra các request thừa.
