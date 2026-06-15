# TÀI LIỆU THIẾT KẾ: CLIENT-SIDE STORAGE & SYNC ENGINE
## Ứng dụng Vòng Quay Lời Chúa

Tài liệu này chi tiết hóa phương án lưu trữ phía client và cơ chế đồng bộ hóa dữ liệu (Sync Engine) chống nghẽn cho ứng dụng Vòng Quay Lời Chúa, đáp ứng tải lớn từ giáo dân.

---

### 1. Phân tích & Lựa chọn công nghệ lưu trữ ở Client

#### Cho Giáo dân (Người quay vòng quay)
* **Anonymous Session Token (`session_id`)**:
  * *Lưu trữ ở:* **Local Storage** (`vqlc_anonymous_session`).
  * *Lý do:* Cần tồn tại lâu dài, qua nhiều phiên đóng/mở trình duyệt để định danh duy nhất thiết bị/trình duyệt của giáo dân. Tránh dùng Session Storage vì giáo dân có thể đóng tab để reset lại session và quay tiếp nhằm gian lận quà.
* **Trạng thái khóa lượt quay (`spin_locks`)**:
  * *Lưu trữ ở:* **Local Storage** (`vqlc_spin_locks`).
  * *Lý do:* Đây là chốt chặn đầu tiên (Client-side rate limit) chống spam. Lưu timestamp lượt quay cuối cùng của từng `wheel_id` để chặn nút "Quay" ngay lập tức nếu chưa đủ thời gian khóa (ví dụ: lock 24h).
* **Lịch sử quay gần đây (`spin_history_cache`)**:
  * *Lưu trữ ở:* **Local Storage** (`vqlc_spin_history`).
  * *Lý do:* Lưu 10-20 lượt quay gần nhất để hiển thị nhanh trên UI ("Quà của bạn"), giúp giảm thiểu query database liên tục.
* **Cấu hình cá nhân (`preferences`)**:
  * *Lưu trữ ở:* **Local Storage** (`vqlc_preferences`).
  * *Lý do:* Lưu trạng thái âm thanh (BGM, SFX), âm lượng, hiệu ứng pháo hoa, chế độ tối/sáng của giáo dân cho các lần truy cập sau.
* **Tệp âm thanh & hình ảnh tĩnh nặng (`offline_media`)**:
  * *Lưu trữ ở:* **IndexedDB** (`vqlc_media_cache`).
  * *Lý do:* Lưu file BGM (mp3) và logo/background (Blob) để hỗ trợ chạy offline hoàn toàn và tăng tốc độ tải trang lần sau. Local Storage không thể lưu Blob trực tiếp và giới hạn dung lượng 5MB không đủ cho audio.

#### Cho Cha xứ / Admin (Người cấu hình)
* **Token xác thực (`auth_token`)**:
  * *Lưu trữ ở:* **Local Storage** (mặc định của Supabase Client).
  * *Lý do:* Duy trì trạng thái đăng nhập lâu dài cho admin. Cần kết hợp kiểm tra JWT hết hạn ở client.
* **Bản nháp cấu hình (`draft_configs`)**:
  * *Lưu trữ ở:* **Local Storage** (`vqlc_draft_${wheel_id}`).
  * *Lý do:* Lưu trữ bản nháp cấu hình vòng quay (danh sách lộc Lời Chúa đang chỉnh sửa) để khôi phục lại khi admin lỡ tay đóng tab, F5 hoặc mất mạng.
* **Hàng đợi đồng bộ hóa ngoại tuyến (`sync_queue`)**:
  * *Lưu trữ ở:* **IndexedDB** (`vqlc_sync_queue`).
  * *Lý do:* Chứa hàng đợi các thay đổi cấu hình chưa đồng bộ lên server khi admin hoạt động offline hoặc mạng yếu. Hỗ trợ lưu trữ các payload lớn (ví dụ: upload nhạc nền mới dạng Blob).

---

### 2. Thiết kế JSON Schema chi tiết

#### Local Storage Keys:

1. **`vqlc_anonymous_session`**:
```json
{
  "session_id": "anon_f81dfef4d-9c82-4ae6-9306-70f815",
  "created_at": "2026-06-15T03:45:00.000Z",
  "device_info": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
}
```

2. **`vqlc_spin_locks`**:
```json
{
  "locks": {
    "wheel_local-devadmin-wheel-id": {
      "last_spin_time": "2026-06-15T03:50:00.000Z",
      "lock_until": "2026-06-16T03:50:00.000Z"
    }
  }
}
```

3. **`vqlc_preferences`**:
```json
{
  "bgm_muted": false,
  "sfx_muted": false,
  "volume": 0.3,
  "enable_confetti": true,
  "theme": "light"
}
```

4. **`vqlc_draft_${wheel_id}`**:
```json
{
  "wheel_id": "wheel_uuid_123",
  "title": "Lộc Xuân Bính Ngọ 2026",
  "theme_preset": "tet",
  "lock_duration": "24h",
  "blessings": [
    {
      "category": "Lộc Đầu Năm 1",
      "quote": "Pl 4,4",
      "text": "Anh em hãy vui luôn trong niềm vui của Chúa.",
      "is_custom": true
    }
  ],
  "updated_at": "2026-06-15T04:10:00.000Z"
}
```

#### IndexedDB Schema (`VongQuayLocalDB`, version: 1):

* **Store 1: `sync_queue`** (Lưu hàng đợi đồng bộ)
  * Key Path: `id` (string - UUIDv4)
```json
{
  "id": "action_uuid_999",
  "action_type": "RECORD_SPIN" | "UPDATE_WHEEL" | "SAVE_BLESSINGS",
  "payload": {
    "wheel_id": "wheel_uuid_123",
    "spin_id": "spin_uuid_777",
    "item_spun": "Lộc Đầu Năm 1",
    "blessing_id": "blessing_uuid_abc",
    "session_id": "anon_f81dfef4d-9c82-4ae6-9306-70f815",
    "created_at": "2026-06-15T03:50:00.000Z"
  },
  "status": "pending",
  "retry_count": 0,
  "last_attempt": null
}
```

* **Store 2: `offline_media`** (Lưu file âm thanh/hình ảnh offline)
  * Key Path: `media_key` (string)
```json
{
  "media_key": "bgm_wheel_uuid_123",
  "blob": Blob(audio/mpeg),
  "content_type": "audio/mpeg",
  "updated_at": "2026-06-15T03:45:00.000Z"
}
```

---

### 3. Cơ chế đồng bộ hóa dữ liệu (Sync Engine)

1. **Write-Behind Caching (Ghi hoãn)**: Client ghi nhận kết quả và hiển thị cho người dùng ngay lập tức, không cần chờ API phản hồi mới hiển thị UI.
2. **De-duplication (Khử trùng lặp)**: Sử dụng UUIDv4 `spin_id` ở client và constraint `UNIQUE` ở DB. Gửi request dạng `UPSERT ... ON CONFLICT DO NOTHING`.
3. **Debounce & Batching (Gom nhóm)**: Sync Engine chạy định kỳ gom các log quay `pending` thành batch payload (tối đa 20 items) gửi 1 HTTP request lên server.
4. **Retry & Backoff**: Sử dụng Exponential Backoff để thử lại sau khi lỗi mạng/server (5xx, 429).
