# TÀI LIỆU BA SPEC

## Dự án: Vòng Quay May Mắn Việt Hoá

## Phiên bản: MVP v1.0

---

# 1. Mục tiêu sản phẩm

Xây dựng một website/app web cho phép người dùng tạo **vòng quay ngẫu nhiên** từ danh sách tên/phần thưởng/nội dung nhập vào. Giao diện lấy cảm hứng từ mô hình Wheel of Names nhưng được Việt hoá toàn bộ, phù hợp dùng cho:

* Trò chơi lớp học
* Mini game nhận quà
* Livestream quay thưởng
* Bốc thăm trúng thưởng
* Chọn ngẫu nhiên học sinh/khách hàng/người tham gia
* Landing page sự kiện, trường học, trung tâm, shop nhỏ

Sản phẩm cần dễ dùng, thao tác nhanh, giao diện trực quan, ưu tiên trải nghiệm trên desktop trước, sau đó responsive mobile.

---

# 2. Phạm vi MVP

## 2.1. Chức năng chính

MVP cần có các chức năng sau:

1. Nhập danh sách mục quay
2. Hiển thị vòng quay tương ứng với danh sách đã nhập
3. Bấm nút quay để random kết quả
4. Hiển thị kết quả sau khi quay xong
5. Lưu lịch sử kết quả
6. Xoá/sửa/sắp xếp danh sách mục quay
7. Tuỳ chỉnh màu sắc vòng quay
8. Tuỳ chỉnh tiêu đề vòng quay
9. Bật/tắt âm thanh quay
10. Reset kết quả
11. Hỗ trợ tiếng Việt toàn bộ giao diện
12. Responsive cơ bản cho mobile/tablet

---

# 3. Đối tượng người dùng

## 3.1. Người dùng chính

* Giáo viên, trung tâm giáo dục
* Chủ shop livestream bán hàng
* Admin tổ chức minigame
* Trường mầm non, trung tâm tiếng Anh, lớp học kỹ năng
* Nhân sự tổ chức sự kiện nội bộ
* Người dùng phổ thông cần công cụ quay số nhanh

## 3.2. Nhu cầu chính

Người dùng muốn:

* Tạo vòng quay nhanh mà không cần đăng nhập
* Copy danh sách tên/phần thưởng vào là dùng được
* Giao diện đẹp, dễ chiếu màn hình
* Có kết quả minh bạch
* Có thể lưu hoặc chia sẻ vòng quay
* Dùng được cho sự kiện hoặc mini game thật

---

# 4. Luồng người dùng chính

## 4.1. Luồng tạo vòng quay nhanh

1. Người dùng truy cập website
2. Hệ thống hiển thị giao diện mặc định gồm:

   * Vòng quay bên trái/giữa
   * Bảng nhập danh sách bên phải
   * Thanh công cụ phía trên
3. Người dùng nhập danh sách tên/phần thưởng vào ô nhập liệu
4. Hệ thống tự động chia mỗi dòng thành một mục quay
5. Vòng quay cập nhật tức thì theo danh sách
6. Người dùng bấm “Quay”
7. Vòng quay xoay với hiệu ứng animation
8. Hệ thống chọn ngẫu nhiên một kết quả
9. Hiển thị popup kết quả
10. Kết quả được lưu vào tab “Kết quả”

---

# 5. Bố cục giao diện desktop

## 5.1. Header

Header nằm trên cùng, chiều cao khoảng 64px.

Thành phần gồm:

* Logo bên trái
  Gợi ý tên: “Vòng Quay May Mắn”, “Quay Tên Nhanh”, “Lucky Wheel Việt”
* Menu chức năng phía phải:

  * Tuỳ chỉnh
  * Tạo mới
  * Mở
  * Lưu
  * Chia sẻ
  * Thư viện
  * Toàn màn hình
  * Thêm
  * Ngôn ngữ

## 5.2. Khu vực chính

Layout chia 2 phần:

### Khu vực vòng quay

Chiếm khoảng 70% chiều ngang desktop.

Thành phần:

* Vòng quay lớn ở trung tâm
* Mũi tên chỉ kết quả nằm bên phải vòng quay
* Nút quay nằm ở giữa hoặc phía dưới vòng quay
* Nền gradient nhẹ
* Có thể thêm bóng đổ để vòng quay nổi bật

### Khu vực quản lý danh sách

Nằm bên phải, chiếm khoảng 30% chiều ngang.

Gồm 2 tab:

1. Danh sách
2. Kết quả

Trong tab Danh sách có:

* Số lượng mục hiện tại
* Nút Trộn
* Nút Sắp xếp
* Nút Thêm ảnh
* Checkbox “Tuỳ chọn nâng cao”
* Textarea nhập danh sách
* Nút Thêm vòng quay
* Thông tin phiên bản hoặc footer nhỏ

Trong tab Kết quả có:

* Kết quả gần nhất
* Danh sách lịch sử kết quả
* Nút xoá lịch sử
* Nút xuất kết quả nếu cần

---

# 6. Bản dịch giao diện

## 6.1. Header

Customize → Tuỳ chỉnh
New → Tạo mới
Open → Mở
Save → Lưu
Share → Chia sẻ
Gallery → Thư viện
More → Thêm
English → Tiếng Việt
Fullscreen → Toàn màn hình

## 6.2. Sidebar

Entries → Danh sách
Results → Kết quả
Shuffle → Trộn
Sort → Sắp xếp
Add image → Thêm ảnh
Advanced → Tuỳ chọn nâng cao
Add wheel → Thêm vòng quay
Changelog → Nhật ký cập nhật

## 6.3. Popup kết quả

Winner → Kết quả
Remove → Xoá khỏi danh sách
Close → Đóng
Spin again → Quay lại
Share result → Chia sẻ kết quả

---

# 7. Chức năng chi tiết

## 7.1. Nhập danh sách

Người dùng nhập dữ liệu vào textarea.

Quy tắc xử lý:

* Mỗi dòng là một mục
* Bỏ qua dòng trống
* Trim khoảng trắng đầu/cuối
* Nếu có mục trùng, vẫn cho phép giữ nguyên
* Giới hạn MVP: tối đa 300 mục
* Nếu vượt quá giới hạn, hiển thị cảnh báo

Ví dụ:

Nguyễn Văn A
Trần Thị B
Phần quà 1
Voucher 500K

Hệ thống sẽ tạo 4 ô trên vòng quay.

## 7.2. Cập nhật vòng quay realtime

Khi người dùng thay đổi danh sách, vòng quay phải cập nhật ngay.

Yêu cầu:

* Không cần bấm lưu
* Mỗi mục tương ứng một lát cắt
* Text trong lát cắt tự co giãn hoặc rút gọn
* Nếu quá nhiều mục, chỉ hiển thị text với cỡ nhỏ hoặc ẩn bớt

## 7.3. Quay ngẫu nhiên

Khi người dùng bấm nút quay:

* Disable nút quay trong lúc animation
* Vòng quay xoay từ 4–8 giây
* Tốc độ giảm dần tự nhiên
* Sau khi dừng, xác định mục trúng theo vị trí mũi tên
* Hiển thị popup kết quả

Random cần đủ minh bạch ở mức MVP:

* Dùng thuật toán random chuẩn của JavaScript
* Không thiên vị theo vị trí
* Mỗi mục có xác suất bằng nhau nếu chưa có trọng số

## 7.4. Popup kết quả

Popup cần hiển thị:

* Tiêu đề: “🎉 Kết quả là”
* Tên/phần thưởng trúng
* Nút “Quay lại”
* Nút “Xoá mục này”
* Nút “Đóng”

Nếu người dùng chọn “Xoá mục này”, mục vừa trúng bị xoá khỏi danh sách và vòng quay cập nhật lại.

## 7.5. Lịch sử kết quả

Sau mỗi lượt quay, kết quả được lưu vào tab “Kết quả”.

Thông tin lưu:

* Tên mục trúng
* Thời gian quay
* Thứ tự lượt quay

Ví dụ:

Lượt 1 — Nguyễn Văn A — 09:30
Lượt 2 — Voucher 500K — 09:35

## 7.6. Trộn danh sách

Nút “Trộn” dùng để đảo thứ tự danh sách.

Yêu cầu:

* Dữ liệu trong textarea thay đổi theo thứ tự mới
* Vòng quay cập nhật theo thứ tự mới
* Không làm mất dữ liệu

## 7.7. Sắp xếp danh sách

Nút “Sắp xếp” dùng để sort danh sách theo alphabet.

Với tiếng Việt, MVP có thể sort theo Unicode cơ bản.

## 7.8. Tuỳ chỉnh giao diện

MVP cần có panel tuỳ chỉnh đơn giản:

* Đổi tiêu đề vòng quay
* Chọn bộ màu vòng quay
* Bật/tắt âm thanh
* Bật/tắt pháo giấy khi có kết quả
* Đổi ảnh nền hoặc màu nền
* Đổi font chữ

Các preset màu gợi ý:

1. Mặc định: xanh dương, đỏ, vàng, xanh lá
2. Mầm non: hồng, vàng, xanh mint, cam
3. Sang trọng: đen, vàng gold, trắng
4. Tết: đỏ, vàng, xanh lá
5. Pastel: hồng nhạt, tím nhạt, xanh nhạt, kem

---

# 8. Yêu cầu UI/UX

## 8.1. Phong cách thiết kế

Phong cách nên:

* Sạch, dễ nhìn
* Việt hoá thân thiện
* Nút bấm rõ ràng
* Màu sắc vui vẻ
* Phù hợp mini game, giáo dục, sự kiện

Không nên:

* Copy nguyên logo/tên/asset của website gốc
* Dùng quá nhiều hiệu ứng gây rối
* Làm sidebar quá nhỏ trên mobile
* Để text trên vòng quay bị vỡ layout

## 8.2. Desktop

Viewport ưu tiên:

* 1440x900
* 1366x768
* 1920x1080

Yêu cầu:

* Vòng quay luôn nổi bật nhất
* Sidebar có chiều rộng khoảng 340–420px
* Header cố định phía trên
* Vòng quay căn giữa theo phần còn lại của màn hình
* Không bị scroll ngang

## 8.3. Mobile

Trên mobile:

* Header rút gọn
* Vòng quay nằm trên
* Sidebar nhập danh sách nằm dưới
* Các nút chức năng chuyển thành icon hoặc menu
* Có nút “Mở danh sách” dạng bottom sheet nếu cần

---

# 9. Yêu cầu kỹ thuật

## 9.1. Frontend đề xuất

Có thể dùng:

* React + Vite
* TypeScript
* Tailwind CSS
* Framer Motion cho animation
* Canvas/SVG để vẽ vòng quay

Khuyến nghị:

* Dùng Canvas nếu muốn hiệu ứng mượt và nhiều item
* Dùng SVG nếu muốn dễ chỉnh từng lát cắt và text

## 9.2. State management

MVP có thể dùng:

* React useState/useReducer
* Zustand nếu muốn gọn hơn
* localStorage để lưu dữ liệu tạm

Các state chính:

* wheelTitle
* entries
* results
* isSpinning
* selectedEntry
* colorPreset
* soundEnabled
* confettiEnabled
* activeTab

## 9.3. Lưu dữ liệu

MVP chưa cần backend.

Lưu vào localStorage:

* Danh sách hiện tại
* Kết quả đã quay
* Tuỳ chỉnh giao diện
* Tiêu đề vòng quay

Giai đoạn sau mới thêm:

* Đăng nhập
* Lưu nhiều vòng quay
* Chia sẻ bằng link
* Database PostgreSQL/Firebase/Supabase

---

# 10. Cấu trúc màn hình

## 10.1. Trang chính

Route: /

Chức năng:

* Hiển thị vòng quay
* Nhập danh sách
* Quay random
* Xem kết quả
* Tuỳ chỉnh nhanh

## 10.2. Màn hình popup kết quả

Không cần route riêng.

Component:

* ResultModal

## 10.3. Panel tuỳ chỉnh

Có thể là:

* Drawer bên phải
* Modal
* Dropdown panel từ header

Component:

* CustomizePanel

---

# 11. Component đề xuất

## 11.1. AppLayout

Chứa toàn bộ layout:

* Header
* Main area
* Wheel area
* Sidebar

## 11.2. Header

Props:

* onNew
* onSave
* onOpen
* onShare
* onCustomize
* onFullscreen

## 11.3. WheelCanvas hoặc WheelSvg

Props:

* entries
* colors
* rotation
* isSpinning
* selectedIndex

Chức năng:

* Render vòng quay
* Render text từng lát
* Render animation xoay

## 11.4. WheelPointer

Hiển thị mũi tên chỉ kết quả.

## 11.5. EntryPanel

Props:

* entries
* onEntriesChange
* onShuffle
* onSort
* onAddImage

## 11.6. ResultPanel

Props:

* results
* onClearResults

## 11.7. ResultModal

Props:

* result
* onClose
* onSpinAgain
* onRemoveEntry

## 11.8. CustomizePanel

Props:

* wheelTitle
* colorPreset
* soundEnabled
* confettiEnabled

---

# 12. Data model

## 12.1. Entry

```ts
type Entry = {
  id: string;
  label: string;
  imageUrl?: string;
  weight?: number;
};
```

## 12.2. SpinResult

```ts
type SpinResult = {
  id: string;
  entryId: string;
  label: string;
  createdAt: string;
  spinNumber: number;
};
```

## 12.3. WheelSettings

```ts
type WheelSettings = {
  title: string;
  colorPreset: string;
  soundEnabled: boolean;
  confettiEnabled: boolean;
  removeWinnerAfterSpin: boolean;
};
```

---

# 13. Quy tắc random

MVP dùng random đều:

```ts
const winnerIndex = Math.floor(Math.random() * entries.length);
```

Sau đó tính toán góc quay sao cho lát cắt của winnerIndex dừng tại vị trí mũi tên.

Yêu cầu:

* Không chọn item rỗng
* Không cho quay khi danh sách dưới 2 mục
* Không cho quay khi đang quay
* Sau khi quay xong mới ghi lịch sử

---

# 14. Validation

## 14.1. Khi danh sách rỗng

Hiển thị:

“Vui lòng nhập ít nhất 2 mục để bắt đầu quay.”

## 14.2. Khi chỉ có 1 mục

Hiển thị:

“Cần ít nhất 2 mục để vòng quay hoạt động công bằng.”

## 14.3. Khi danh sách quá dài

Hiển thị:

“Danh sách đang vượt quá giới hạn 300 mục. Vui lòng rút gọn danh sách.”

---

# 15. Nội dung mẫu tiếng Việt

Danh sách mặc định:

An
Bình
Chi
Dũng
Hà
Linh
Minh
Phúc

Tiêu đề mặc định:

“Vòng Quay May Mắn”

Nội dung hướng dẫn:

“Mỗi dòng là một mục trên vòng quay. Nhập tên, phần thưởng hoặc lựa chọn bất kỳ rồi bấm Quay.”

---

# 16. Acceptance Criteria

## 16.1. Danh sách

* Người dùng nhập nhiều dòng vào textarea
* Mỗi dòng tạo thành một lát cắt trên vòng quay
* Xoá dòng trong textarea thì lát cắt biến mất
* Dữ liệu không mất khi refresh trang nếu localStorage hoạt động

## 16.2. Quay

* Bấm nút quay thì vòng quay xoay
* Không thể bấm quay liên tục khi đang quay
* Kết quả hiển thị sau khi vòng quay dừng
* Kết quả được ghi vào lịch sử

## 16.3. UI

* Giao diện desktop giống bố cục tham chiếu:

  * Header trên cùng
  * Vòng quay lớn bên trái/giữa
  * Panel nhập liệu bên phải
* Toàn bộ text chính là tiếng Việt
* Không copy logo/brand của website gốc

## 16.4. Responsive

* Desktop không vỡ layout ở 1366x768
* Mobile hiển thị vòng quay trước, form nhập danh sách sau
* Không xuất hiện scroll ngang

---

# 17. Roadmap phát triển

## Phase 1: MVP local

* Giao diện chính
* Nhập danh sách
* Vòng quay random
* Popup kết quả
* Lịch sử kết quả
* Lưu localStorage

## Phase 2: Mini game chuyên nghiệp

* Upload ảnh từng item
* Âm thanh quay
* Confetti
* Chia sẻ link
* Xuất kết quả CSV
* Nhiều vòng quay trong một phiên

## Phase 3: SaaS / Marketing tool

* Đăng nhập
* Lưu nhiều chiến dịch
* Form thu lead
* QR code tham gia
* Chống quay trùng số điện thoại
* Dashboard kết quả
* Tích hợp Google Sheets
* Tích hợp Zalo OA / webhook / n8n

---

# 18. Prompt cho AI Agent / Antigravity

Hãy build một web app “Vòng Quay May Mắn” bằng React + Vite + TypeScript + Tailwind CSS, giao diện lấy cảm hứng từ bố cục Wheel of Names nhưng Việt hoá hoàn toàn và không sử dụng logo/tài sản của website gốc.

Yêu cầu giao diện:

* Header cố định trên cùng, có logo chữ “Vòng Quay May Mắn”
* Menu gồm: Tuỳ chỉnh, Tạo mới, Mở, Lưu, Chia sẻ, Thư viện, Toàn màn hình, Thêm, Tiếng Việt
* Main layout desktop chia 2 phần:

  * Bên trái/giữa là vòng quay lớn
  * Bên phải là panel quản lý danh sách và kết quả
* Panel bên phải có 2 tab: “Danh sách” và “Kết quả”
* Tab Danh sách có textarea nhập nhiều dòng, mỗi dòng là một mục quay
* Có các nút: Trộn, Sắp xếp, Thêm ảnh, Thêm vòng quay
* Vòng quay cập nhật realtime khi textarea thay đổi
* Có mũi tên chỉ kết quả ở bên phải vòng quay
* Có nút “Quay” rõ ràng
* Khi quay, vòng quay xoay 4–8 giây, giảm tốc tự nhiên rồi hiện popup kết quả
* Popup hiển thị “🎉 Kết quả là” + tên mục trúng + các nút “Quay lại”, “Xoá mục này”, “Đóng”
* Lưu lịch sử kết quả trong tab “Kết quả”
* Lưu entries, results và settings vào localStorage
* Responsive mobile: vòng quay ở trên, panel nhập liệu ở dưới
* Không dùng backend ở MVP

Yêu cầu kỹ thuật:

* Dùng React + Vite + TypeScript
* Dùng Tailwind CSS
* Có thể dùng SVG hoặc Canvas để vẽ vòng quay
* Code component rõ ràng:

  * Header
  * Wheel
  * WheelPointer
  * EntryPanel
  * ResultPanel
  * ResultModal
  * CustomizePanel
* Không hardcode quá nhiều trong App.tsx
* Tách utils random, shuffle, sort, localStorage riêng
* Đảm bảo không lỗi khi danh sách rỗng hoặc chỉ có 1 mục
* Tối ưu UI desktop 1440x900 và 1366x768

Kết quả mong muốn:

* Một web app hoàn chỉnh chạy được
* Giao diện sạch, vui, dễ dùng
* Việt hoá toàn bộ
* Trải nghiệm tương tự công cụ vòng quay ngẫu nhiên chuyên nghiệp
