# BÁO CÁO THIẾT KẾ KIẾN TRÚC CHỊU TẢI 1000+ CCU ĐỒNG THỜI - VÒNG QUAY LỜI CHÚA

Tài liệu này thiết kế chi tiết giải pháp chịu tải peak traffic lớn (1000+ CCU) khi link Vòng Quay Lời Chúa được chia sẻ vào các group cộng đoàn.

---

### 1. Phân Tích Hiện Trạng & Điểm Nghẽn (Bottlenecks)
- **Đặc thù Traffic**: Khi gửi link vòng quay vào nhóm Zalo/Facebook, khoảng 1000+ giáo dân sẽ bấm vào link cùng lúc (Peak traffic cực lớn trong vòng 1-2 phút).
- **Điểm nghẽn Đọc (Read Bottleneck)**: Client truy cập trực tiếp bảng `parishes`, `wheels`, `blessings` thông qua REST API PostgREST của Supabase, chiếm dụng connection pool và gây sập kết nối DB.
- **Điểm nghẽn Ghi (Write Bottleneck)**: Khi giáo dân quay xong, INSERT lịch sử quay hàng loạt dồn dập gây khóa dòng/bảng và nâng tải CPU database lên 100%.

---

### 2. Chiến Lược CDN & Edge Caching (Tối ưu luồng Đọc - Zero DB Hit)

#### Giải pháp: Static JSON Export (Jamstack Approach)
Thay vì client gọi API động vào DB, ta lưu toàn bộ dữ liệu này thành một file JSON tĩnh trên CDN.
1. **Quy trình lưu dữ liệu (Admin-side)**:
   - Khi Admin chỉnh sửa vòng quay và bấm "Lưu", hệ thống gộp dữ liệu thành file JSON:
     `{ "parish": { ... }, "wheel": { ... }, "blessings": [ ... ] }`
   - Lưu file này lên Supabase Storage bucket `public-wheels` dưới đường dẫn: `/configs/[parishSlug]/[wheelSlug].json`.
2. **Quy trình đọc dữ liệu (Parishioner-side)**:
   - Client tải trực tiếp file JSON tĩnh từ CDN thông qua request HTTP GET.
   - **Hiệu quả**: Tránh hoàn toàn truy cập trực tiếp vào DB Postgres. Độ trễ <30ms.

---

### 3. Chiến Lược Hàng Đợi Ghi (Write Queue - Tối ưu luồng Ghi)

#### Giải pháp 1: Client-side Reduction (Giảm thiểu ghi)
- Chỉ ghi nhận lịch sử quay khi thực sự cần đối soát quà tặng vật lý lớn.
- Khóa quay (24h) sử dụng hoàn toàn cơ chế Local-first qua `localStorage` ở trình duyệt.

#### Giải pháp 2: Asynchronous Write Queue (Upstash Redis)
Nếu bắt buộc cần lưu lịch sử quay:
- Client gọi POST đẩy kết quả lên Cloudflare Worker API.
- Worker đẩy log vào hàng đợi **Upstash Redis LPUSH `spin_queue`** (Response trả về ngay lập tức <10ms).
- Cron Worker chạy định kỳ mỗi 5-10 giây pop hàng loạt (bulk 200 items) và ghi gộp vào Supabase PostgreSQL.

---

### 4. TỐI ƯU HÓA DUNG LƯỢNG TẢI TRANG (Bundle Size, Caching & Lazy Loading)

1. **Code Splitting trong React Router 7 + Vite**:
   - Sử dụng React Lazy Loading để tách code Admin Dashboard khỏi Parishioner Wheel.
   - Cấu hình split chunks trong `vite.config.ts`.
2. **Nén & Tối ưu Asset Tĩnh**:
   - Ảnh chuyển sang định dạng **WebP** hoặc **AVIF** (< 120KB).
   - Audio nén mono 64kbps - 96kbps dạng `.ogg` và `.mp3` (< 1.5MB).
   - Lazy Load Audio: Chỉ load file âm thanh khi người dùng bắt đầu click tương tác lần đầu.
