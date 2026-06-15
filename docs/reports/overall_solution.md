# BÁO CÁO TỔNG HỢP VÀ PHƯƠNG ÁN GIẢI QUYẾT TOÀN DIỆN
## DỰ ÁN: VÒNG QUAY LỘC CHÚA

Tài liệu này tổng hợp kết quả phân tích từ 5 subagents chuyên trách và đề xuất lộ trình hành động cụ thể nhằm giải quyết triệt để các vấn đề:
1. **Lỗi chạy local dev (`npm run dev`)** dẫn tới phụ thuộc tên miền thực và crash API.
2. **Lỗ hổng bảo mật nghiêm trọng** trong luồng Xác thực (Auth Flow) và Phân quyền (RBAC).
3. **Lỗi logic nghiêm trọng** ở hàng đợi đồng bộ (`sync-queue`) và luồng quay (`spin`).
4. **Nợ kỹ thuật & Rác mã nguồn** làm suy giảm khả năng bảo trì.

---

## 1. TỔNG HỢP CÁC PHÁT HIỆN LỚN (CRITICAL FINDINGS)

### 1.1. Vấn đề Môi trường & Feedback Loop ở Local
*   **Hiện trạng:** Vite dev server (`npm run dev` ở cổng 3000) không chạy được các serverless API Node.js trong thư mục [api/](file:///d:/khoinghiep/vongquay/api). Các request `/api/*` bị rewrite về `index.html` của SPA, trả về mã HTML thay vì JSON, gây crash ứng dụng.
*   **Hệ quả:** Nhà phát triển buộc phải deploy lên Vercel online để test logic quay thưởng (spin) có chữ ký bảo mật HMAC, làm kéo dài thời gian phát triển và debug.

### 1.2. Lỗ hổng Xác thực & Phân quyền (Auth & RBAC)
*   **Bypass mã mời đăng ký:** Mã mời đăng ký Admin chỉ được kiểm tra ở client qua API `/api/verify-invite` trước khi gọi đăng ký. Kẻ tấn công có thể bỏ qua frontend, gọi trực tiếp API đăng ký của Supabase để tạo tài khoản Admin mà không cần mã mời hợp lệ.
*   **Bypass Admin Dashboard:** Giáo dân khi tham gia quay online sẽ được Supabase cấp một session ẩn danh (Anonymous Session). Tuy nhiên, `ProtectedRoute` tại [App.tsx](file:///d:/khoinghiep/vongquay/src/App.tsx) chỉ kiểm tra sự tồn tại của session (`!!user`), cho phép giáo dân ẩn danh truy cập thẳng vào Dashboard quản trị.
*   **Bypass API Admin:** Các API nhạy cảm như `/api/sync-queue` và `/api/get-invite` chỉ kiểm tra xem user gửi request có session hay không chứ không kiểm tra Role hoặc trạng thái ẩn danh, dẫn tới rủi ro rò rỉ mã mời tĩnh và phá hoại database.

### 1.3. Lỗi logic luồng Quay (Spin) & Đồng bộ hàng đợi (Sync Queue)
*   **Lỗi 401 khi Quay Online:** API `/api/spin` chặn truy cập của người dùng không đăng nhập. Điều này mâu thuẫn với nghiệp vụ: giáo dân vãng lai không cần tài khoản vẫn phải quay online được. Lỗi này ép client luôn phải chuyển sang chế độ Offline.
*   **Hỏng đồng bộ offline:** Logic client gửi lượt quay offline lên server bị lệch pha do server không có tham số `offline_sync`.
*   **Nghẽn hàng đợi Redis (Head-of-Line Blocking):** API `/api/sync-queue` xử lý đồng bộ hàng loạt. Nếu một bản ghi bị lỗi (ví dụ: vi phạm ràng buộc dữ liệu hoặc lỗi transient), code thực hiện lệnh `break` dừng toàn bộ tiến trình, khiến tất cả các bản ghi hợp lệ xếp sau bị kẹt lại vĩnh viễn.

### 1.4. Kiến trúc mã nguồn cồng kềnh & Ô nhiễm thư mục
*   **Mã nguồn rác:** Thư mục gốc chứa hơn 80 file tạm thời (`extracted_*.tsx`, `response_*.json`, script `.py` tự chế) làm chậm git, rối mắt và cản trở CI/CD.
*   **Monolith Components:** Các trang chính như `ParishionerWheel` (>100KB, >2000 dòng) nhồi nhét quá nhiều logic (vẽ Canvas, hiệu ứng âm thanh Web Audio, gọi API, đồng bộ LocalStorage).
*   **db.ts quá tải:** File [db.ts](file:///d:/khoinghiep/vongquay/src/services/db.ts) (57KB) chứa toàn bộ cấu hình, kết nối IndexedDB, API Supabase client của tất cả thực thể, vi phạm nguyên lý Single Responsibility.

---

## 2. KẾ HOẠCH HÀNH ĐỘNG CHI TIẾT (ACTION PLAN)

Chúng ta sẽ chia lộ trình xử lý làm 3 giai đoạn:

### GIAI ĐOẠN 1: Tối ưu hóa Môi trường Local Dev (Thực hiện Ngay)

#### Bước 1: Chuyển đổi công cụ chạy local sang Vercel CLI
Thay vì chạy `npm run dev` (chỉ chạy Vite), chúng ta sử dụng **Vercel CLI** để chạy song song cả React frontend và local API Serverless trên cùng một cổng.
1. Cài đặt Vercel CLI toàn cục (hoặc dev dependency):
   ```bash
   npm install -g vercel
   ```
2. Khởi chạy môi trường local dev:
   ```bash
   vercel dev
   ```
   *Vercel CLI sẽ tự động đọc cấu hình [vercel.json](file:///d:/khoinghiep/vongquay/vercel.json), chạy Vite ở cổng 3000 và host các API Serverless tại cổng 3000/api/*.*

#### Bước 2: Cập nhật cấu hình Reverse Proxy trong Vite (Phương án dự phòng)
Nếu không dùng Vercel CLI, ta có thể cấu hình [vite.config.ts](file:///d:/khoinghiep/vongquay/vite.config.ts) để chuyển tiếp các request API `/api/*` về một server API local chạy độc lập hoặc server staging thực:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Hoặc domain staging online
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
```

---

### GIAI ĐOẠN 2: Vá Lỗ hổng Bảo mật & Sửa Logic Nghiệp vụ (Core Fixes)

#### Bước 1: Khắc phục phân quyền Client & API
1. **Sửa `ProtectedRoute` ở [App.tsx](file:///d:/khoinghiep/vongquay/src/App.tsx):**
   Chỉ cho phép những user có tài khoản chính thức (không ẩn danh) và có role admin (nếu có trường role) truy cập:
   ```typescript
   if (!user || user.is_anonymous) {
     return <Navigate to="/login" replace />;
   }
   ```
2. **Sửa API Backend (`/api/sync-queue`, `/api/get-invite`):**
   Kiểm tra token gửi lên. Từ chối ngay nếu user là Anonymous User:
   ```typescript
   const { data: { user }, error } = await supabase.auth.getUser(token);
   if (error || !user || user.is_anonymous) {
     return response.status(403).json({ error: 'Truy cập bị từ chối' });
   }
   ```

#### Bước 2: Khắc phục lỗ hổng mã mời đăng ký Admin
1. **Client truyền mã mời vào User MetaData:** Khi gọi `signUp` trong `AuthContext.tsx`, truyền mã mời trong phần metadata:
   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email,
     password,
     options: {
       data: {
         parish_name: parishName,
         parish_slug: slug,
         invitation_code: invitationCode // Truyền mã mời lên DB
       }
     }
   });
   ```
2. **Database Trigger xác thực:** Viết một function và trigger trong Supabase (`auth.users - BEFORE INSERT`) để kiểm tra `invitation_code` trong metadata. Nếu mã mời sai hoặc hết hạn, từ chối insert record. Điều này ngăn chặn triệt để việc bypass client.

#### Bước 3: Sửa lỗi API `/api/spin` cho khách vãng lai (Public Spin)
Cho phép các request không có header authorization (hoặc có session anonymous) gọi API quay thưởng để lấy kết quả có chữ ký HMAC hợp lệ. Server chỉ cần tạo một khóa ký tạm thời hoặc dùng chữ ký hệ thống mà không cần check session đăng nhập của admin.

#### Bước 4: Chống nghẽn hàng đợi (Head-of-Line Blocking) ở `sync-queue`
Trong logic xử lý hàng đợi, thay vì `break` khi gặp lỗi ghi DB ở một bản ghi, ta thực hiện:
1. Đưa bản ghi lỗi vào **Dead Letter Queue (DLQ)** trong Redis hoặc ghi log lỗi vào DB riêng.
2. Tiếp tục vòng lặp xử lý các bản ghi tiếp theo trong hàng đợi.

---

### GIAI ĐOẠN 3: Tái cấu trúc & Dọn dẹp Codebase (Refactoring)

#### Bước 1: Chạy lệnh dọn dẹp file rác tại thư mục gốc
Di chuyển hoặc xóa bỏ hoàn toàn các file `extracted_*.tsx`, `response_*.json`, `beautify.py`, v.v. để giải phóng thư mục gốc.

#### Bước 2: Phân rã file `db.ts`
Chia [db.ts](file:///d:/khoinghiep/vongquay/src/services/db.ts) thành các module dịch vụ độc lập:
*   `services/supabaseService.ts`: Chứa các cuộc gọi CRUD tới Supabase.
*   `services/indexedDbService.ts`: Quản lý lưu trữ offline IndexedDB cho lượt quay và lời chúc.
*   `services/localStorageMock.ts`: Mock dữ liệu khi không kết nối DB.

#### Bước 3: Phân rã trang Giao diện Monolith
Tách logic vẽ vòng quay bằng HTML5 Canvas và logic âm thanh Web Audio ra các custom hook chuyên biệt (ví dụ: `useWheelCanvas.ts`, `useAudioEffects.ts`), giúp file UI chỉ tập trung vào hiển thị và nhận tương tác.

---

## 3. ĐỀ XUẤT LỰA CHỌN PHƯƠNG ÁN PHÁT TRIỂN TIẾP THEO

Để bạn có thể code và test liên tục trên môi trường local, tôi đề xuất thực hiện **GIAI ĐOẠN 1** ngay lập tức bằng cách cài đặt Vercel CLI và chạy lệnh `vercel dev`. 

Bạn muốn tôi tiến hành thực hiện bước nào trước?
1. **Phương án A:** Viết script dọn dẹp tự động toàn bộ 80+ file rác ở thư mục gốc để làm sạch không gian làm việc.
2. **Phương án B:** Hướng dẫn cấu hình/cài đặt Vercel CLI để chạy local dev đồng bộ với backend serverless API.
3. **Phương án C:** Triển khai vá các lỗi bảo mật phân quyền khách vãng lai / bypass Admin Dashboard trước tiên.
