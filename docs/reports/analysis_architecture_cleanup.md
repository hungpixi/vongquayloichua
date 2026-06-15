# BÁO CÁO PHÂN TÍCH KIẾN TRÚC, ĐỀ XUẤT MODULE HÓA VÀ KẾ HOẠCH DỌN DẸP MÃ NGUỒN

Báo cáo này phân tích chi tiết hiện trạng cấu trúc thư mục, kiến trúc mã nguồn của dự án **Vòng Quay Lộc Chúa**, nhận diện các tệp tin dư thừa cần dọn dẹp, và đề xuất phương án tái cấu trúc (refactoring) theo hướng module hóa nhằm tối ưu khả năng bảo trì, mở rộng và kiểm thử (testing).

---

## 1. Hiện Trạng & Phát Hiện (Current State & Findings)

### 1.1. Tệp Tin Dư Thừa Tại Gốc Dự Án (Root Directory pollution)
Khảo sát gốc dự án tại [d:/khoinghiep/vongquay](file:///d:/khoinghiep/vongquay) cho thấy sự xuất hiện của rất nhiều tệp tin rác phát sinh trong quá trình phát triển, debug, trích xuất mã nguồn và giả lập dữ liệu API. Số lượng tệp dư thừa lên tới hơn 80 tệp bao gồm:

*   **Các kịch bản Python (`.py`) dùng để phân tích và thao tác mã nguồn cục bộ:**
    *   Các script xử lý cấu trúc và tìm kiếm: [check_structure.py](file:///d:/khoinghiep/vongquay/check_structure.py), [beautify.py](file:///d:/khoinghiep/vongquay/beautify.py), [dump_layouts.py](file:///d:/khoinghiep/vongquay/dump_layouts.py), [find_bounds.py](file:///d:/khoinghiep/vongquay/find_bounds.py), [find_component_bounds.py](file:///d:/khoinghiep/vongquay/find_component_bounds.py), [find_jsx_end.py](file:///d:/khoinghiep/vongquay/find_jsx_end.py).
    *   Các script kết xuất nội dung và log: [dump_content.py](file:///d:/khoinghiep/vongquay/dump_content.py), [dump_content_99.py](file:///d:/khoinghiep/vongquay/dump_content_99.py), [dump_content_107.py](file:///d:/khoinghiep/vongquay/dump_content_107.py), [extract_log.py](file:///d:/khoinghiep/vongquay/extract_log.py).
    *   Các script tìm kiếm từ khóa và lịch sử: [search_is_mobile.py](file:///d:/khoinghiep/vongquay/search_is_mobile.py), [search_all_is_mobile.py](file:///d:/khoinghiep/vongquay/search_all_is_mobile.py), [search_backups.py](file:///d:/khoinghiep/vongquay/search_backups.py), [search_dist.py](file:///d:/khoinghiep/vongquay/search_dist.py), [search_history.py](file:///d:/khoinghiep/vongquay/search_history.py), [search_keywords.py](file:///d:/khoinghiep/vongquay/search_keywords.py), [search_resize_effect.py](file:///d:/khoinghiep/vongquay/search_resize_effect.py), [search_toast.py](file:///d:/khoinghiep/vongquay/search_toast.py), [search_vscode_history.py](file:///d:/khoinghiep/vongquay/search_vscode_history.py).
    *   Các script trích xuất và tái tạo code: [extract_before.py](file:///d:/khoinghiep/vongquay/extract_before.py), [extract_from_both.py](file:///d:/khoinghiep/vongquay/extract_from_both.py), [extract_further.py](file:///d:/khoinghiep/vongquay/extract_further.py), [extract_more.py](file:///d:/khoinghiep/vongquay/extract_more.py), [print_component_code.py](file:///d:/khoinghiep/vongquay/print_component_code.py), [print_head.py](file:///d:/khoinghiep/vongquay/print_head.py), [reconstruct.py](file:///d:/khoinghiep/vongquay/reconstruct.py), [reconstruct_all.py](file:///d:/khoinghiep/vongquay/reconstruct_all.py), [find_logs.py](file:///d:/khoinghiep/vongquay/find_logs.py), [find_text.py](file:///d:/khoinghiep/vongquay/find_text.py), [write_final.py](file:///d:/khoinghiep/vongquay/write_final.py).
*   **Các tệp mã nguồn JS/TSX trích xuất tạm thời (`extracted_*`):**
    *   [ParishionerWheel_extracted.js](file:///d:/khoinghiep/vongquay/ParishionerWheel_extracted.js)
    *   Các file từ `extracted_11.tsx` đến `extracted_278.tsx` (hơn 30 tệp tin TSX/TXT trung gian).
    *   [extracted_component.js](file:///d:/khoinghiep/vongquay/extracted_component.js), [extracted_component_beautified.js](file:///d:/khoinghiep/vongquay/extracted_component_beautified.js), [extracted_dist.js](file:///d:/khoinghiep/vongquay/extracted_dist.js), [extracted_more.js](file:///d:/khoinghiep/vongquay/extracted_more.js), [extracted_start.js](file:///d:/khoinghiep/vongquay/extracted_start.js).
*   **Các tệp phản hồi dữ liệu JSON/TXT của API (`response_*`):**
    *   Hơn 20 tệp dữ liệu JSON và TXT mô tả payload trả về của API như `response_2.json`, `response_99_content.txt`...
*   **Các tệp nháp khác:**
    *   [src_diff.txt](file:///d:/khoinghiep/vongquay/src_diff.txt): Bản so sánh mã nguồn tạm thời.
    *   [logo-giochacho.webp](file:///d:/khoinghiep/vongquay/logo-giochacho.webp): File ảnh tĩnh nằm trực tiếp ở thư mục gốc thay vì ở thư mục static resource.

### 1.2. Đánh Giá Kiến Trúc Frontend Hiện Tại
Cấu trúc thư mục mã nguồn frontend [src/](file:///d:/khoinghiep/vongquay/src) hiện tại:
*   `src/pages/`: Chứa giao diện trang.
*   `src/services/`: Chứa các service tương tác dữ liệu.
*   `src/context/`: Quản lý authentication state.
*   `src/utils/`: Chứa helper nhỏ và static data.

#### Phát hiện điểm yếu ở các Monolith Components lớn trong `src/pages`:
*   [AdminDashboard.tsx](file:///d:/khoinghiep/vongquay/src/pages/AdminDashboard.tsx) (136 KB, 2,727 dòng code): File này đảm nhận quá nhiều vai trò: Quản lý CRUD vòng quay, cấu hình thông tin giáo xứ (tên, địa chỉ, ảnh nền, lịch phụng vụ JSON), xử lý thư viện preset lộc tự chọn, hiển thị thống kê biểu đồ & tìm kiếm lịch sử quay, tích hợp 2FA xác thực mã mời.
*   [AdminWheelEditor.tsx](file:///d:/khoinghiep/vongquay/src/pages/AdminWheelEditor.tsx) (125 KB, 2,400+ dòng): Quản lý toàn bộ chức năng chỉnh sửa cấu hình vòng quay, giao diện thiết lập âm thanh SFX/BGM, upload file, và bảng quản lý danh sách lộc chi tiết của vòng quay đó.
*   [ParishionerWheel.tsx](file:///d:/khoinghiep/vongquay/src/pages/ParishionerWheel.tsx) (112 KB, 2,200+ dòng): File giao diện phía giáo dân thực hiện quay số. Nó tích hợp trực tiếp việc vẽ vòng quay động trên HTML5 Canvas, kiểm soát hoạt ảnh (animation), xử lý phát và nạp âm thanh (BGM/SFX) thông qua IndexedDB/Web Audio API, hiển thị thiệp Lộc Lời Chúa kèm các nút chia sẻ mạng xã hội.

#### Phát hiện điểm yếu ở Tầng Dịch Vụ Dữ Liệu (Data Layer):
*   [db.ts](file:///d:/khoinghiep/vongquay/src/services/db.ts) (57 KB, 1,630 dòng code): File này vi phạm nghiêm trọng nguyên lý đơn nhiệm (Single Responsibility Principle). Nó đảm nhiệm đồng thời:
    1.  Cấu hình và kiểm tra trạng thái Online/Offline của Supabase.
    2.  Thiết lập và quản lý IndexedDB để lưu trữ blob audio nhạc nền ngoại tuyến.
    3.  Thiết lập LocalDB (IndexedDB thứ hai) để lưu trữ Sync Queue phục vụ offline-first.
    4.  Cung cấp Mock LocalStorage API thay thế cho toàn bộ các bảng trong database (users, parishes, wheels, blessings, spin_history).
    5.  Thực hiện tất cả các truy vấn nghiệp vụ (CRUD) cho cả 5 thực thể trên ở cả hai chế độ online (Supabase client) và offline (localStorage).

### 1.3. Đánh Giá Kiến Trúc Backend API
Các serverless functions tại [api/](file:///d:/khoinghiep/vongquay/api) hoạt động tốt với luồng ghi bất đồng bộ (Write-Buffering thông qua Redis) và CSPRNG bảo mật kết quả. Tuy nhiên:
*   Mã nguồn trong [spin.ts](file:///d:/khoinghiep/vongquay/api/spin.ts) chứa nhiều logic trùng lặp (ví dụ như CORS configuration, khởi tạo Supabase, kết nối Redis).
*   Không có thư mục dùng chung (`_shared`) để tách biệt các tiện ích backend, dẫn đến khó viết unit test cho logic chọn lộc hay ký signature HMAC độc lập với Vercel Serverless runtime.

---

## 2. Các Vấn Đề Nghiêm Trọng / Điểm Yếu (Critical Issues & Weaknesses)

### Vấn đề 1: Khó khăn trong việc phát triển song song (Low Parallel Development Capability)
Do các trang và chức năng chính nằm tập trung trong 3 file monolith khổng lồ (`AdminDashboard.tsx`, `AdminWheelEditor.tsx`, `ParishionerWheel.tsx`), khi có nhiều lập trình viên cùng tham gia chỉnh sửa (ví dụ: một người sửa UI, một người tối ưu hiệu năng audio, một người sửa form cấu hình), việc xảy ra xung đột mã nguồn (Merge Conflict) là rất lớn và cực kỳ khó giải quyết thủ công.

### Vấn đề 2: Khả năng kiểm thử thấp (Poor Testability)
Việc nhồi nhét state quản lý UI, logic API, IndexedDB API, và canvas drawing vào chung một file component khiến việc viết Unit Test gần như bất khả thi. Để test một thay đổi nhỏ về logic tính góc quay hay bộ đếm thời gian lock spin, lập trình viên buộc phải render toàn bộ component lớn với đầy đủ các dependency phức tạp.

### Vấn đề 3: Vi phạm nguyên lý SOLID (SRP Violation)
Lớp dữ liệu `db.ts` chịu trách nhiệm quá lớn. Khi có thay đổi về schema hoặc logic offline-first, toàn bộ file này phải sửa đổi, làm tăng nguy cơ làm hỏng (regression bugs) các chức năng không liên quan như Authentication hay ghi lịch sử spin.

### Vấn đề 4: Ô nhiễm thư mục gốc và hiệu năng phát triển
Việc lưu trữ hơn 80 file rác tại gốc dự án làm chậm tốc độ index của IDE, tăng dung lượng không cần thiết khi nén mã nguồn hoặc đẩy lên môi trường CI/CD, và gây nhiễu cho lập trình viên khi quản lý các thay đổi qua Git.

---

## 3. Phương Án Giải Quyết Chi Tiết (Proposed Solution & Code Proposals)

### 3.1. Sơ Đồ Cấu Trúc Thư Mục Đề Xuất (Modular Architecture Spec)

Đề xuất tái cấu trúc mã nguồn theo mô hình module hóa, phân tách rõ ràng trách nhiệm giữa Tầng Giao Diện (Presentation), Tầng Logic Nghiệp Vụ (Hooks/Services) và Tầng Dữ Liệu (DB/Adapters):

```text
/
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vercel.json
├── vite.config.ts
├── api/                            # Backend Serverless Functions (Vercel)
│   ├── spin.ts                     # Handler API Spin
│   ├── get-invite.ts
│   ├── verify-invite.ts
│   ├── sync-queue.ts
│   └── _shared/                    # Module phụ trợ dùng chung cho API (không deploy trực tiếp)
│       ├── cors.ts                 # Xử lý CORS headers
│       ├── security.ts             # HMAC signing, CSPRNG engine
│       ├── redis.ts                # Client kết nối Upstash Redis
│       ├── supabase.ts             # Khởi tạo Supabase client service role
│       └── types.ts                # Kiểu dữ liệu chung của Backend
├── docs/                           # Tài liệu kỹ thuật dự án
│   ├── architecture/               
│   ├── reports/                    # Chứa báo cáo dọn dẹp này
│   └── database/                   # Schema SQL, migrations
├── scripts/                        # Các công cụ quản trị & vận hành dự án
│   ├── generate-invite.cjs
│   └── maintenance/                # Di chuyển các script python hữu ích vào đây nếu cần dùng lại
├── public/                         # Tài nguyên tĩnh public (logos, webp)
│   └── logo-giochacho.webp         # Di chuyển file logo từ root vào đây
├── legacy/                         # Code di sản (giữ nguyên để tham khảo)
└── src/                            # Frontend Source Code
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── App.css
    ├── assets/                     # Media tĩnh (images, icons)
    ├── components/                 # Các component dùng chung (Shared UI)
    │   ├── ui/                     # UI cơ bản (Button, Input, Modal, Spinner, Switch, Toast)
    │   └── common/                 # UI phức hợp (Navbar, Footer, SEOHead, ParishHeader)
    ├── context/                    # React Contexts (AuthContext)
    ├── hooks/                      # Custom React Hooks tách biệt logic khỏi UI
    │   ├── useAuth.ts
    │   ├── useLocalStorage.ts
    │   ├── useAudio.ts             # Hook quản lý phát nhạc nền/SFX & IndexedDB
    │   └── useSpin.ts              # Hook quản lý logic quay vòng quay
    ├── services/                   # Dịch vụ tích hợp ngoài và lưu trữ cục bộ
    │   ├── api.ts                  # Client gọi API của Vercel (ví dụ: POST /api/spin)
    │   ├── supabaseClient.ts       # Supabase Client khởi tạo mặc định
    │   ├── localDB/                # Adapter quản lý IndexedDB & LocalStorage
    │   │   ├── audioIDB.ts         # IndexedDB cho audio cache
    │   │   ├── syncIDB.ts          # IndexedDB cho sync queue
    │   │   └── mockStorage.ts      # LocalStorage backup mock database
    │   └── db/                     # Tách nhỏ db.ts cũ thành các module nghiệp vụ
    │       ├── index.ts            # Entry point tổng hợp xuất các hàm
    │       ├── auth.ts             # Tương tác Auth
    │       ├── parish.ts           # CRUD Giáo xứ
    │       ├── wheel.ts            # CRUD Vòng quay
    │       ├── blessing.ts         # CRUD Lộc Lời Chúa
    │       └── spinHistory.ts      # Quản lý lịch sử quay
    └── pages/                      # Các trang nghiệp vụ (tách nhỏ component)
        ├── LandingPage/
        ├── LoginPage/
        ├── RegisterPage/
        ├── AdminDashboard/
        │   ├── index.tsx           # Layout dashboard chính
        │   ├── StatCard.tsx        # Card hiển thị chỉ số thống kê
        │   ├── ParishConfigTab.tsx # Tab cấu hình thông tin Giáo xứ
        │   ├── PresetsTab.tsx      # Tab quản trị thư viện lộc
        │   └── AnalyticsTab.tsx    # Tab xem lịch sử & báo cáo
        ├── AdminWheelEditor/
        │   ├── index.tsx
        │   ├── BlessingTable.tsx   # Danh sách và form thêm lộc nhanh
        │   ├── WheelConfigForm.tsx # Cấu hình thông tin vòng quay
        │   └── AudioConfigForm.tsx # Cấu hình nhạc nền & SFX
        └── ParishionerWheel/
            ├── index.tsx           # Layout chính phía giáo dân
            ├── CanvasWheel.tsx     # Trực quan hóa vòng quay bằng HTML5 Canvas
            ├── BlessingCard.tsx    # Thiệp hiển thị Lộc Lời Chúa
            └── SpinConsole.tsx     # Bảng điều khiển (nhập tên, nút quay)
```

---

### 3.2. Quy Trình Dọn Dẹp (Cleanup Runbook)

Để dọn dẹp gốc dự án một cách an toàn mà không ảnh hưởng tới git history và cấu hình deploy, lập trình viên có thể thực hiện chạy tập lệnh PowerShell (trên Windows) sau:

```powershell
# Di chuyển vào gốc dự án
# cd d:\khoinghiep\vongquay

# 1. Tạo thư mục public chứa ảnh tĩnh nếu chưa có và di chuyển logo vào đúng chỗ
New-Item -ItemType Directory -Force -Path "d:\khoinghiep\vongquay\public"
Move-Item -Path "d:\khoinghiep\vongquay\logo-giochacho.webp" -Destination "d:\khoinghiep\vongquay\public\logo-giochacho.webp" -Force

# 2. Gom các file python bảo trì vào thư mục con để gọn gàng root
New-Item -ItemType Directory -Force -Path "d:\khoinghiep\vongquay\scripts\maintenance"
Get-ChildItem -Path "d:\khoinghiep\vongquay" -Filter "*.py" | ForEach-Object {
    Move-Item -Path $_.FullName -Destination "d:\khoinghiep\vongquay\scripts\maintenance\" -Force
}

# 3. Xóa các file trung gian sinh ra khi trích xuất code (extracted_*)
Get-ChildItem -Path "d:\khoinghiep\vongquay" -Filter "extracted_*" | Remove-Item -Force
if (Test-Path "d:\khoinghiep\vongquay\ParishionerWheel_extracted.js") {
    Remove-Item -Path "d:\khoinghiep\vongquay\ParishionerWheel_extracted.js" -Force
}

# 4. Xóa các file log phản hồi API (response_*.json / response_*.txt)
Get-ChildItem -Path "d:\khoinghiep\vongquay" -Filter "response_*" | Remove-Item -Force

# 5. Xóa file so sánh nháp
if (Test-Path "d:\khoinghiep\vongquay\src_diff.txt") {
    Remove-Item -Path "d:\khoinghiep\vongquay\src_diff.txt" -Force
}

Write-Host "Hoàn thành dọn dẹp thư mục gốc dự án!" -ForegroundColor Green
```

---

### 3.3. Đề Xuất Cải Tiến & Tái Cấu Trúc Mã Nguồn (Refactoring Proposals)

#### Đề xuất A: Tách nhỏ dịch vụ dữ liệu `db.ts` thành cấu trúc Module
Tạo thư mục `src/services/db/`. Để duy trì khả năng tương thích ngược (backwards compatibility) cho toàn bộ các import hiện có trong dự án mà không cần sửa đổi đồng loạt tất cả các file pages, chúng ta sử dụng tệp tin [index.ts](file:///d:/khoinghiep/vongquay/src/services/db/index.ts) làm cổng xuất bản duy nhất (Facaded Export):

```typescript
// src/services/db/index.ts
import { authDB } from './auth';
import { parishDB } from './parish';
import { wheelDB } from './wheel';
import { blessingDB } from './blessing';
import { spinHistoryDB } from './spinHistory';

// Xuất các Interface dùng chung
export * from './types'; 

// Hợp nhất các module thành dbService nguyên bản
export const dbService = {
  ...authDB,
  ...parishDB,
  ...wheelDB,
  ...blessingDB,
  ...spinHistoryDB
};
```

*Minh họa chia nhỏ module - Ví dụ tệp [parish.ts](file:///d:/khoinghiep/vongquay/src/services/db/parish.ts):*
```typescript
// src/services/db/parish.ts
import { supabase } from '../supabaseClient';
import { getLocalData, setLocalData, generateUUID } from '../localDB/mockStorage';
import { Parish } from './types';

const isOnline = () => !!supabase;

export const parishDB = {
  async getParishByOwner(ownerId: string): Promise<Parish | null> {
    if (isOnline()) {
      const { data, error } = await supabase!
        .from('parishes')
        .select('*')
        .eq('owner_id', ownerId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } else {
      const parishes = getLocalData<Parish>('local_parishes');
      return parishes.find(p => p.owner_id === ownerId) || null;
    }
  },

  async createParish(ownerId: string, name: string, slug: string): Promise<Parish> {
    // Logic tạo giáo xứ online/offline ...
  }
};
```

---

#### Đề xuất B: Bóc tách logic Audio nghiệp vụ của Vòng quay ra Custom Hook
Để thu gọn [ParishionerWheel.tsx](file:///d:/khoinghiep/vongquay/src/pages/ParishionerWheel.tsx), chúng ta tách toàn bộ logic khởi tạo, cache IndexedDB, phát và điều khiển âm thanh ra một hook riêng biệt:

```typescript
// src/hooks/useAudio.ts
import { useState, useEffect, useRef } from 'react';
import { getIDBStore } from '../services/localDB/audioIDB';

interface AudioConfig {
  bgmEnabled: boolean;
  bgmVolume: number;
  customBgmUrl?: string;
  spinSfxType: string;
  winSfxType: string;
}

export function useAudio(config: AudioConfig) {
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const sfxRef = useRef<HTMLAudioElement | null>(null);

  // Load audio từ cache IndexedDB hoặc fallback URL mạng
  const loadAudioSource = async (key: string, defaultUrl: string) => {
    try {
      const db = await getIDBStore();
      const cached = await db.get(key);
      if (cached instanceof Blob) {
        return URL.createObjectURL(cached);
      }
    } catch (e) {
      console.warn("IndexedDB audio cache error:", e);
    }
    return defaultUrl;
  };

  const playSpinSfx = async () => {
    const src = await loadAudioSource('spin_sfx', `/audio/sfx/${config.spinSfxType}.mp3`);
    if (sfxRef.current) {
      sfxRef.current.src = src;
      sfxRef.current.play().catch(() => {});
    }
  };

  const playWinSfx = async () => {
    const src = await loadAudioSource('win_sfx', `/audio/sfx/${config.winSfxType}.mp3`);
    if (sfxRef.current) {
      sfxRef.current.src = src;
      sfxRef.current.play().catch(() => {});
    }
  };

  const toggleBgm = () => {
    if (!bgmRef.current) return;
    if (isBgmPlaying) {
      bgmRef.current.pause();
      setIsBgmPlaying(false);
    } else {
      bgmRef.current.play().catch(() => {});
      setIsBgmPlaying(true);
    }
  };

  return { isBgmPlaying, playSpinSfx, playWinSfx, toggleBgm };
}
```

---

#### Đề xuất C: Tái cấu trúc Backend Serverless API dùng chung
Gom các middleware và cấu hình dùng chung của Serverless function vào [api/_shared/](file:///d:/khoinghiep/vongquay/api/_shared).

*Ví dụ Module CORS dùng chung [api/_shared/cors.ts](file:///d:/khoinghiep/vongquay/api/_shared/cors.ts):*
```typescript
// api/_shared/cors.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export function setupCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = (req.headers.origin || req.headers.Origin) as string;
  if (!origin) return false;

  const hostname = new URL(origin).hostname;
  const isAllowed = 
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === 'vongquayloichua.com' ||
    hostname.endsWith('.vongquayloichua.com') ||
    hostname.endsWith('.vercel.app');

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Fingerprint');
    res.setHeader('Access-Control-Max-Age', '86400');
    return true;
  }
  return false;
}
```

*Sử dụng gọn gàng trong [api/spin.ts](file:///d:/khoinghiep/vongquay/api/spin.ts) sau khi module hóa:*
```typescript
// api/spin.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setupCors } from './_shared/cors';
import { verifySession } from './_shared/auth';
import { getSpinLock, setSpinLock } from './_shared/redis';
import { selectBlessingSecurely } from './_shared/security';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. CORS Preflight
  const isCorsAllowed = setupCors(req, res);
  if (req.method === 'OPTIONS') {
    return isCorsAllowed ? res.status(200).end() : res.status(403).json({ error: 'CORS Not Allowed' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Xác thực Session
  const user = await verifySession(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // 3. Kiểm tra lock spin (Redis & DB)
  const { wheel_id, fingerprint } = req.body;
  const isLocked = await getSpinLock(wheel_id, fingerprint, user.id);
  if (isLocked) {
    return res.status(403).json({ error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' });
  }

  // 4. Chọn lộc và trả về
  const result = await selectBlessingSecurely(wheel_id);
  await setSpinLock(wheel_id, fingerprint, user.id, result.record);

  return res.status(200).json(result.payload);
}
```

---

## 4. Kết luận & Timeline Khuyến Nghị

Việc thực hiện dọn dẹp tệp tin dư thừa và tái cấu trúc hệ thống theo các đề xuất trên mang lại giá trị thực tiễn rất lớn:
1.  **Dọn dẹp root** giúp giảm nhiễu 90% các tệp tin không sử dụng, làm sạch git log và tránh các nguy cơ rò rỉ thông tin nháp.
2.  **Module hóa Data Layer** giúp việc mở rộng các chức năng offline-first hoặc chuyển đổi nhà cung cấp database (ví dụ chuyển từ Supabase sang Postgres độc lập) được thực hiện độc lập mà không cần can thiệp tới giao diện.
3.  **Tách các Monolith Components** làm tăng độ ổn định của dự án, cho phép team phát triển song song hiệu quả cao.

**Timeline đề xuất thực hiện:**
*   **Pha 1 (Dọn dẹp root):** Thực hiện ngay lập tức (1 ngày) qua tập lệnh Cleanup Runbook.
*   **Pha 2 (Module hóa db.ts):** Thực hiện trong 2-3 ngày, tạo bộ test case kiểm thử trước và sau khi tách để đảm bảo không lỗi chức năng.
*   **Pha 3 (Tách nhỏ Component & Custom Hooks):** Thực hiện cuốn chiếu theo thứ tự: `ParishionerWheel` -> `AdminWheelEditor` -> `AdminDashboard`. Mỗi trang thực hiện trong 2 ngày.
