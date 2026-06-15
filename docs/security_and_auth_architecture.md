# TÀI LIỆU THIẾT HỆ THỐNG XÁC THỰC & BẢO MẬT CHỐNG GIAN LẬN
**Dự án**: Vòng Quay Lời Chúa (Bảy Ơn Chúa Thánh Thần)
**Vai trò thiết kế**: Auth & Security Expert

---

## 1. Cơ chế định danh giáo dân ẩn danh nhẹ nhàng (Anonymous Parishioner Identification)

### 1.1. Giải pháp Định danh 3 lớp phối hợp (Không cần tài khoản)
Chúng ta sẽ triển khai cơ chế định danh ẩn danh kết hợp giữa Client-side Fingerprinting và Supabase Anonymous Auth:
1. **Browser Device Fingerprinting (Client-side)**:
   - Thu thập thông số phần cứng & phần mềm của trình duyệt (Canvas rendering, WebGL context, Resolution, Timezone, User-Agent).
   - Mã hóa toàn bộ các thông số trên bằng thuật toán **MurmurHash3** (tạo chuỗi Hash 32-bit rất nhẹ) làm `Device Fingerprint`.
2. **Supabase Anonymous Auth**:
   - Client đăng nhập ẩn danh thông qua Supabase `signInAnonymously()` sinh ra một User thực sự trong bảng `auth.users`, cho phép sử dụng đầy đủ các cơ chế bảo vệ cơ sở dữ liệu bằng **Row Level Security (RLS)**.
3. **Signed Token & Device Verification**:
   - Khi kiểm tra giới hạn quay (`lock_duration`), server sẽ đối chiếu cả 3 yếu tố: **IP Address** + **Device Fingerprint** + **Anonymous User ID**. Dù giáo dân có dùng tab ẩn danh hay xóa cache, Server vẫn chặn được việc quay liên tiếp.

---

## 2. Bảo mật chống cheat kết quả quay thưởng (Anti-Cheat Spin Engine)

### 2.1. Giải pháp: Server-Controlled Spin (Chuyển luồng Random lên Server)
Loại bỏ logic sinh số ngẫu nhiên ở client. Luồng quay sẽ chuyển sang kiến trúc **Server-Controlled**:
1. Giáo dân nhấn **[QUAY]** -> Gửi request (wheel_id, fingerprint, session_token) lên Edge Function.
2. Server thực hiện xác thực (session, rate limit IP & Fingerprint, lock duration).
3. Server truy vấn danh sách Blessings, sử dụng **CSPRNG** (`crypto.getRandomValues`) chọn ngẫu nhiên 1 Blessing và tính toán góc dừng (`target_angle`).
4. Server tự động ghi nhận kết quả vào bảng `spin_history` (không phụ thuộc vào client gọi ghi).
5. Server tạo mã chữ ký xác thực: `signature = HMAC_SHA256(wheel_id + blessing_id + target_angle, Server_Secret)` gửi về client.
6. Client nhận `target_angle` & `signature`, verify chữ ký và chạy hiệu ứng dừng đúng góc đó.

---

## 3. Cơ chế đăng nhập gọn nhẹ cho cha xứ (Admin Passwordless OTP & Magic Link)

### 3.1. Thiết kế Trải nghiệm Đăng nhập Đơn giản
Áp dụng cơ chế đăng nhập **Passwordless** thông qua Supabase Auth:
1. Cha xứ nhập email và bấm [Đăng nhập].
2. Supabase gửi mã OTP 6 số và Magic Link về Email của Cha xứ.
3. Cha click Link trong email hoặc nhập 6 số OTP vào giao diện trang web để nhận JWT Admin Session.

### 3.2. Cấu hình phân quyền an toàn qua Database RLS (Row Level Security)
- **Bảng `parishes` RLS**: Chỉ chủ sở hữu giáo xứ mới được phép chỉnh sửa (`auth.uid() = owner_id`).
- **Bảng `wheels` RLS**: Public được đọc vòng quay active. Chỉ Admin của Giáo xứ quản lý vòng quay mới có quyền INSERT/UPDATE/DELETE.
- **Bảng `blessings` RLS**: Public được đọc. Chỉ Admin của vòng quay đó mới được sửa đổi.
