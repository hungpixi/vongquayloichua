# Tài liệu Phân tích & Yêu cầu Refactor: Vòng Quay Bảy Ơn Chúa Thánh Thần

Tài liệu này định nghĩa các yêu cầu refactor cho trang web "Vòng quay may mắn" hiện tại sang phiên bản **"Vòng quay Bảy ơn Chúa Thánh Thần"** dành riêng cho Giáo xứ.

---

## 1. Bối cảnh & Cấu trúc Dự án Hiện tại
Dự án hiện tại là ứng dụng web tĩnh chạy trên Client-side bằng công nghệ:
- **HTML**: `vongquay.html`
- **CSS**: `vongquay.css`
- **JavaScript**: `vongquay.js` (Sử dụng Canvas để vẽ vòng quay và Web Audio API để phát âm thanh).
- **Lưu trữ**: Dữ liệu lưu trong LocalStorage.

---

## 2. Yêu cầu Nghiệp vụ Mới
Thay vì hiển thị số may mắn hoặc tên ngẫu nhiên ngay từ đầu, vòng quay sẽ hoạt động theo luồng sau:
1. **Thiết lập mặc định (Khúc đầu)**:
   - Danh sách mục quay mặc định gồm **7 ơn Chúa Thánh Thần**:
     1. Ơn khôn ngoan
     2. Ơn thông minh
     3. Ơn hiểu biết
     4. Ơn lo liệu
     5. Ơn sức mạnh
     6. Ơn đạo đức
     7. Ơn kính sợ Chúa
   - Tiêu đề mặc định của vòng quay: `"Bảy ơn Chúa Thánh Thần"`.
2. **Luồng quay (Khúc sau)**:
   - Khi bấm quay, vòng quay sẽ xoay và dừng lại ở một trong 7 ơn lành này (hoặc mục nhập tùy chỉnh của cha/admin).
   - Khi dừng lại, popup kết quả hiển thị:
     - Tên ơn lành trúng (ví dụ: `Ơn khôn ngoan`).
     - Một **lời chúc/thông điệp Công giáo tương ứng** lấy từ danh sách 200 lời chúc đã chuẩn bị sẵn để gửi tới giáo dân.
     - Nút sao chép lời chúc và các nút hành động (Quay tiếp, Xóa khỏi danh sách, Đóng).

---

## 3. Chi tiết Giao diện & Trải nghiệm (UI/UX)

### 3.1. Chủ đề màu sắc (Theme)
Đổi màu sắc giao diện mặc định sang tone màu ấm cúng, trang nghiêm của Nhà thờ:
- **Màu nền**: Trắng kem hoặc xanh trời nhạt (`#fdfbf7` hoặc `#f0f7ff`).
- **Màu chủ đạo**: Vàng gold/amber (`#d97706`) và xanh dương đậm hoặc đỏ rượu vang.
- **Icon trang trí**: ✨, 🙏, 🕊️, ✝️ thay cho các icon sòng bài/casino.

### 3.2. Cấu trúc Popup Kết quả (Winner Modal)
Bố cục popup mới từ trên xuống dưới:
1. **Icon phía trên**: 🙏 ✨ 🕊️
2. **Tiêu đề**: `🎉 Chúc mừng quý cộng đoàn!`
3. **Nhãn động (Label)**:
   - Nếu trúng 7 ơn: `"Ơn lành nhận được:"`
   - Nếu trúng tên/số tùy chỉnh: `"Người nhận lộc:"` hoặc `"Kết quả:"`
4. **Mục trúng (Winner Display)**: Hiển thị chữ lớn, nổi bật (ví dụ: `Ơn khôn ngoan`).
5. **Khối Lời chúc (Blessing Card)**:
   - Nền vàng nhạt/kem có viền nét đứt hoặc viền gold nhẹ.
   - Tiêu đề nhỏ: `<i class="fa-solid fa-cross"></i> Lời chúc từ Giáo xứ`
   - Nội dung lời chúc: Hiển thị câu chúc ngẫu nhiên từ danh sách 200 lời chúc.
   - Nút **"Sao chép lời chúc"** đi kèm.
6. **Lời chúc chân trang**: *"Giáo xứ kính chúc quý cộng đoàn luôn sống trong bình an và ân sủng của Chúa."*
7. **Các nút hành động**:
   - `Quay tiếp` (Nút chính màu vàng/xanh dương)
   - `Đóng` (Nút phụ màu xám)
   - `Xóa khỏi danh sách` (Nút phụ màu đỏ nhạt)

---

## 4. Cấu trúc Cơ sở Dữ liệu & Logic JavaScript

### 4.1. Cơ sở dữ liệu lời chúc (`blessings.js`)
Tách riêng cơ sở dữ liệu gồm 200 lời chúc Công giáo ra file `blessings.js` để dễ quản lý.
```javascript
const BLESSINGS = [
  { id: 1, category: 'khon-ngoan', text: 'Nguyện xin Chúa Thánh Thần ban ơn khôn ngoan để quý vị luôn biết chọn lựa điều lành đẹp ý Chúa.' },
  // ... Đầy đủ 200 lời chúc
];
```

### 4.2. Khớp lời chúc sau khi quay
- Nếu mục trúng là một trong 7 ơn (ví dụ: "Ơn khôn ngoan"): Hệ thống ưu tiên chọn một lời chúc thuộc nhóm tương ứng với ơn đó để tăng tính ý nghĩa.
- Nếu không khớp hoặc danh sách tùy chỉnh: Chọn ngẫu nhiên 1 trong 200 lời chúc.

### 4.3. Định dạng sao chép (Copy Template)
Khi bấm nút Copy, văn bản được định dạng như sau:
```text
🎉 Chúc mừng ơn lành nhận được: [Mục trúng]

🙏 Lời chúc từ Giáo xứ:
"[Nội dung lời chúc]"

Giáo xứ kính chúc quý cộng đoàn luôn sống trong bình an và ân sủng của Chúa.
```

### 4.4. LocalStorage
Lưu trữ trạng thái vòng quay để không bị mất khi tải lại trang:
- `parish-wheel-entries`: Danh sách các ơn hoặc tên người quay.
- `parish-wheel-results`: Lịch sử kết quả (Lưu cả tên mục trúng và nội dung lời chúc để hiển thị lại).
- `parish-wheel-settings`: Cấu hình âm thanh, thời gian quay, tiêu đề.
