# KIẾN TRÚC DATABASE HỆ THỐNG VÒNG QUAY LỜI CHÚA (1000 CCU)

Tài liệu này thiết kế kiến trúc lưu trữ cho hệ thống Vòng Quay Lời Chúa (Multi-tenant Parish Wheel) nhằm đảm bảo hiệu năng xử lý ít nhất **1000 CCU (Concurrent Users)** truy cập đồng thời vào các dịp cao điểm (Tết, Giáng Sinh, Lễ bổn mạng), tối ưu hóa chi phí vận hành và giải quyết các bài toán kỹ thuật đặc thù.

---

## 1. SO SÁNH CÁC GIẢI PHÁP DATABASE BACKEND

| Tiêu chí | Supabase / PostgreSQL | Cloudflare D1 (SQLite tại Edge) | Upstash Redis (Cache & Queue) | Vercel Postgres (Neon) |
| :--- | :--- | :--- | :--- | :--- |
| **Độ trễ (Latency)** | Trung bình (50 - 150ms phụ thuộc khu vực) | **Cực thấp (10 - 20ms)** do chạy trực tiếp ở Edge server gần user tại VN | **Cực thấp (~5 - 15ms)** in-memory | Trung bình (Cold-start có thể lên tới 1-3s) |
| **Khả năng CCU (1000+)** | Khá. Cần qua Connection Pooler (Transaction mode) để tránh cạn kiệt connection | **Cực kỳ tốt**. Cloudflare Workers + D1 handle lượng request serverless không giới hạn connection | **Tuyệt vời**. Thích hợp làm bộ đệm ghi hoặc lưu session tạm thời | Khá. Nhưng chi phí tính theo compute time sẽ tăng vọt nếu bị spam |
| **Hỗ trợ Multi-tenancy** | Tốt. Thiết kế qua cột `tenant_id` kết hợp Row Level Security (RLS) | **Hoàn hảo**. Có thể tạo mỗi Giáo xứ 1 file DB D1 riêng biệt (Physical isolation) | Không tối ưu cho quan hệ phức tạp, chỉ làm cache | Tương tự Supabase nhưng chi phí đắt hơn |
| **Chi phí vận hành** | Free tier giới hạn. Gói Pro $25/tháng | **Cực rẻ**. Free tier 5M reads + 100k writes/ngày. Gói $5/tháng cho quy mô cực lớn | Free tier 10k requests/ngày. Gói trả phí theo dung lượng | Dễ vượt hạn mức miễn phí khi CCU tăng đột biến |

### 👉 LỰA CHỌN ĐỀ XUẤT (THE CHAMPION STACK)
Sử dụng **Cloudflare D1 (SQLite)** kết hợp **Cloudflare KV (Edge Cache)** và **Cloudflare Workers**:
1. **Cloudflare KV**: Lưu trữ cấu hình vòng quay (Read-heavy). 1000 người vào trang cùng lúc sẽ đọc trực tiếp từ Edge KV Cache (không chạm vào Database).
2. **Cloudflare D1 (SQLite)**: Lưu thông tin quản trị và lịch sử quay (Write-heavy). Nhờ cơ chế serverless và phân tách DB cho từng tenant (mỗi Giáo xứ một file SQLite DB riêng), hệ thống có khả năng chịu tải vượt trội, an toàn dữ liệu tuyệt đối và chi phí gần như bằng 0.

---

## 2. THIẾT KẾ SCHEMA CHI TIẾT

Dưới đây là thiết kế Schema tối ưu hóa cho mô hình Multi-tenant. 

### A. Mô hình Shared Database (Áp dụng cho PostgreSQL / Supabase)
Phù hợp khi quản lý tập trung tất cả giáo xứ trong một database lớn.

```sql
-- 1. Bảng Giáo xứ (Tenants)
CREATE TABLE parishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- dùng cho router: vongquayloichua.com/giao-xu-tan-dinh
    domain VARCHAR(255) UNIQUE NULL,   -- Custom domain của cha xứ nếu có
    status VARCHAR(50) DEFAULT 'active', -- active, suspended
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_parishes_slug ON parishes(slug);

-- 2. Bảng Quản trị viên (Admins)
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parish_id UUID REFERENCES parishes(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'parish_admin', -- super_admin, parish_admin, editor
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_admins_parish ON admins(parish_id);

-- 3. Bảng Vòng Quay (Wheels)
CREATE TABLE wheels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parish_id UUID REFERENCES parishes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL, -- Lưu cấu hình frontend (màu sắc, hình nền, âm thanh, nhạc nền)
    spins_per_user INT DEFAULT 1, -- Số lượt quay tối đa của mỗi giáo dân
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_wheels_parish ON wheels(parish_id);

-- 4. Bảng Phần Quà / Lời Chúa (Gifts/Wheel Items)
CREATE TABLE gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wheel_id UUID REFERENCES wheels(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'WORD_OF_GOD' (Lời Chúa), 'PHYSICAL' (Quà vật lý), 'LUCK' (Lời chúc may mắn)
    content TEXT NOT NULL,      -- Nội dung Lời Chúa hoặc tên quà tặng
    image_url VARCHAR(512),
    weight INT NOT NULL DEFAULT 100, -- Trọng số xác suất trúng (ví dụ: 100 = 10%, 10 = 1%)
    quantity INT NOT NULL DEFAULT -1, -- Tổng số lượng quà có sẵn (-1: vô hạn, dùng cho Lời Chúa)
    remaining_quantity INT NOT NULL DEFAULT -1, -- Số lượng quà còn lại
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_remaining_quantity CHECK (remaining_quantity >= -1)
);
CREATE INDEX idx_gifts_wheel ON gifts(wheel_id);

-- 5. Bảng Lịch sử quay (Spin History)
CREATE TABLE spin_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wheel_id UUID REFERENCES wheels(id) ON DELETE CASCADE,
    gift_id UUID REFERENCES gifts(id),
    parishioner_name VARCHAR(255) NOT NULL, -- Tên giáo dân nhập vào trước khi quay
    parishioner_group VARCHAR(255) NULL,   -- Giáo họ / Lớp Giáo lý / Hội đoàn
    parishioner_phone VARCHAR(20) NULL,    -- Số điện thoại (nếu cần nhận quà lớn)
    ip_address VARCHAR(45) NOT NULL,       -- Để hạn chế spam lượt quay
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_spin_history_wheel ON spin_history(wheel_id);
CREATE INDEX idx_spin_history_created ON spin_history(created_at);
```

### B. Mô hình Isolated Database (Áp dụng cho SQLite / Cloudflare D1)
Mỗi Giáo xứ sở hữu 1 file database riêng biệt. Schema của mỗi DB sẽ không cần cột `parish_id`.

```sql
-- Dùng cho SQLite của từng giáo xứ độc lập

CREATE TABLE admins (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'parish_admin',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wheels (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    config TEXT NOT NULL, -- Lưu chuỗi JSON cấu hình UI
    spins_per_user INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gifts (
    id TEXT PRIMARY KEY,
    wheel_id TEXT REFERENCES wheels(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- WORD_OF_GOD, PHYSICAL, LUCK
    content TEXT NOT NULL,
    image_url TEXT,
    weight INTEGER NOT NULL DEFAULT 100,
    quantity INTEGER NOT NULL DEFAULT -1,
    remaining_quantity INTEGER NOT NULL DEFAULT -1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_remaining CHECK (remaining_quantity >= -1)
);

CREATE TABLE spin_history (
    id TEXT PRIMARY KEY,
    wheel_id TEXT REFERENCES wheels(id) ON DELETE CASCADE,
    gift_id TEXT REFERENCES gifts(id),
    parishioner_name TEXT NOT NULL,
    parishioner_group TEXT,
    parishioner_phone TEXT,
    ip_address TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. GIẢI PHÁP TỐI ƯU ĐỌC/GHI & TRÁNH NGHẼN DB

Với 1000 CCU truy cập đồng thời, việc tối ưu hóa I/O là điều bắt buộc để hệ thống không bị crash.

### 3.1. Chiến lược tối ưu Đọc (Read Optimization)
90% lưu lượng truy cập là đọc cấu hình vòng quay và danh sách các cung (Lời Chúa / Quà tặng). 
- **Giải pháp**: Áp dụng **Edge Cache (Cloudflare KV)**.
- **Quy trình hoạt động**:
  1. Giáo dân quét mã QR vào link -> API Gateway kiểm tra KV Cache bằng key `wheel:{wheel_id}`.
  2. Nếu cache tồn tại -> Trả về JSON cấu hình ngay tại Edge (độ trễ ~15ms, DB hoàn toàn nhàn rỗi).
  3. Nếu cache chưa có (hoặc hết hạn) -> Query D1/Postgres -> Ghi kết quả vào KV Cache -> Trả về cho user.
  4. Khi Cha xứ thay đổi cấu hình vòng quay trong Admin -> Ghi xuống DB -> Đồng thời ghi đè (overwrite) KV Cache tương ứng để cập nhật ngay lập tức.

### 3.2. Chiến lược tối ưu Ghi & Xử lý Race Condition (Write Optimization)
Thách thức lớn nhất: Nhiều giáo dân cùng quay trúng các món quà vật lý có giới hạn số lượng (ví dụ: chỉ có 3 cuốn Kinh Thánh) tại cùng một thời điểm.

#### Giải pháp 1: Ghi trực tiếp an toàn với Row Lock (Dành cho PostgreSQL)
Sử dụng database transaction để trừ số lượng quà và kiểm tra tồn kho:
```sql
BEGIN;

-- 1. Lấy thông tin quà và khóa dòng đó lại để tránh race condition
SELECT remaining_quantity 
FROM gifts 
WHERE id = 'gift-uuid-123' AND quantity > -1
FOR UPDATE;

-- 2. Cập nhật trừ đi 1 nếu số lượng còn lại > 0
UPDATE gifts 
SET remaining_quantity = remaining_quantity - 1 
WHERE id = 'gift-uuid-123' AND remaining_quantity > 0;

-- 3. Nếu update thành công (affected rows = 1), ghi nhận lịch sử quay
INSERT INTO spin_history (wheel_id, gift_id, parishioner_name, ip_address) 
VALUES ('wheel-uuid', 'gift-uuid-123', 'Nguyễn Văn A', '1.1.1.1');

COMMIT;
```

#### Giải pháp 2: Atomic Counter với Redis / Upstash (Khuyên dùng)
Trước khi ghi xuống SQLite/Postgres, ta dùng Redis làm màng lọc số lượng quà vật lý:
1. Khi khởi tạo vòng quay, nạp số lượng quà vật lý vào Redis: `SET gift_stock:{gift_id} {quantity}`.
2. Khi giáo dân quay trúng quà vật lý:
   - Worker chạy lệnh: `DECR gift_stock:{gift_id}`.
   - Nếu kết quả trả về `>= 0`: Xác nhận trúng quà vật lý hợp lệ -> Chuyển sang bước lưu Spin History.
   - Nếu kết quả trả về `< 0` (hết quà): Tự động đổi kết quả sang phần quà vô hạn (ví dụ: Lời Chúa hoặc lời chúc) -> Trả kết quả mới cho user.
3. Đồng bộ lại số lượng còn lại từ Redis về Database chính định kỳ hoặc sau khi kết thúc đợt quay.

#### Giải pháp 3: Buffer Queue cho Lịch sử quay (Spin History)
Để DB không bị quá tải do ghi nhận hàng ngàn lượt quay dồn dập:
- Khi user quay xong, Worker đẩy log quay (`spin_history` payload) vào một **Cloudflare Queue** hoặc **Upstash Redis List**.
- API phản hồi ngay lập tức cho client "Bạn đã trúng..." mà không đợi DB ghi thành công (Asynchronous Response).
- Một background worker chạy định kỳ (mỗi 1-2 giây) đọc từ Queue, gộp các bản ghi lại thành câu lệnh **Bulk Insert** để đẩy vào DB:
  ```sql
  INSERT INTO spin_history (wheel_id, gift_id, parishioner_name, ip_address)
  VALUES 
  ('w1', 'g1', 'User A', '1.1.1.1'),
  ('w1', 'g2', 'User B', '1.1.1.2'),
  ... (tối đa 100 dòng một lần)
  ```

---

## 4. TỐI ƯU UX KHÔNG CẦN LOGIN PHỨC TẠP
Để giáo dân (đặc biệt là người lớn tuổi và trẻ em) dễ dàng tham gia mà vẫn quản lý được lượt quay:
- **Nhập Tên + Giáo Họ**: Giao diện yêu cầu nhập Tên và Giáo họ trước khi cho phép ấn nút quay. Thông tin này được lưu cục bộ trên trình duyệt (`localStorage`) để các lần sau không cần nhập lại.
- **Quản lý lượt quay qua Device Fingerprint & IP**:
  - Lưu token lượt quay trong `Cookie` hoặc `localStorage` của trình duyệt.
  - Đồng thời, backend kiểm tra trong bảng `spin_history` xem đã có lượt quay nào từ `ip_address` đó trong vòng X phút qua chưa để hạn chế spam.
