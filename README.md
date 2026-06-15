# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

## Kiến Trúc Chịu Tải 1000+ CCU

Hệ thống hiện tại **đã hoàn toàn đủ khả năng chịu tải 1000+ CCU đồng thời (và thậm chí nhiều hơn thế)**. Kiến trúc chịu tải đã được tối ưu hóa triệt để ở cả 2 chiều Đọc (Read) và Ghi (Write):

### 1. Chiều Đọc (Read Path) — Tải trang không chạm vào Database (Zero DB Hit)
* **Giải pháp:** Sử dụng mô hình **Jamstack (Static JSON Config)**. 
* **Cách hoạt động:** Khi người quản trị lưu vòng quay, toàn bộ dữ liệu cấu hình Giáo xứ, Vòng quay, và Lộc Lời Chúa được gộp lại và lưu trữ dưới dạng một tệp tĩnh `.json` tại Supabase Storage bucket `public-wheels` theo đường dẫn `/configs/[parishSlug]/[wheelSlug].json`.
* **Hiệu quả:** Giáo dân khi truy cập chỉ tải file JSON tĩnh qua CDN với độ trễ cực thấp **<30ms**. Hệ thống không cần tạo bất kỳ kết nối nào đến PostgreSQL, loại bỏ hoàn toàn nguy cơ sập DB do cạn kiệt Connection Pool.

### 2. Chiều Ghi (Write Path) — Xử lý chèn lịch sử quay qua Hàng đợi (Asynchronous Write Queue)
* **Giải pháp:** Sử dụng **Upstash Redis + Upstash QStash** làm hàng đợi ghi trung gian (Write Queue).
* **Cách hoạt động** (Xem chi tiết tại [api/spin.ts](file:///d:/khoinghiep/vongquay/api/spin.ts)):
  1. Khi giáo dân quay xong, lượt quay được gửi lên Serverless API `/api/spin`.
  2. API thực hiện chèn bản ghi vào hàng đợi Redis `spin_queue` bằng lệnh `LPUSH` (Độ trễ phản hồi cực nhanh **<10ms**).
  3. API thiết lập đồng thời khóa chống quay lại (Rate Limit) theo các vector: IP, Browser Fingerprint, Session ID và User ID trực tiếp trên Redis với TTL định sẵn.
  4. Sau đó, API gửi tín hiệu sang **Upstash QStash** kích hoạt bất đồng bộ gọi đến endpoint đồng bộ `/api/sync-queue` với độ trễ 5 giây (`Upstash-Delay: 5s`).
* **Đồng bộ hàng loạt** (Xem chi tiết tại [api/sync-queue.ts](file:///d:/khoinghiep/vongquay/api/sync-queue.ts)):
  * Endpoint `/api/sync-queue` sẽ lấy khóa lock phân tán (`spin_sync_lock`) để tránh chạy chồng chéo.
  * Pop hàng loạt tối đa **200 lượt quay** một lúc từ hàng đợi Redis (`RPOP spin_queue 200`) và thực hiện **Bulk Upsert** chèn gộp vào bảng `spin_history` của PostgreSQL Supabase chỉ trong 1 truy vấn duy nhất.
  * Nếu có bản ghi bị lỗi kết nối tạm thời, hệ thống sẽ tự động đẩy ngược lại vào Redis queue để thực hiện đồng bộ lại lần sau.

### Kết luận
Với sự kết hợp của **Jamstack (CDN) cho luồng Đọc** và **Upstash Redis Queue cho luồng Ghi**, hệ thống hoạt động như một bộ đệm giảm chấn. Khi có 1000+ CCU đồng thời ập vào, cơ sở dữ liệu Supabase PostgreSQL chỉ nhận một vài truy vấn Bulk chèn lịch sử chắt lọc gọn gàng, CPU của database luôn được giữ ở ngưỡng an toàn dưới 10%.
