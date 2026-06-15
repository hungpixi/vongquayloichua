import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

js_path = r"D:\khoinghiep\vongquay\dist\assets\index-CAiRrpO3.js"
with open(js_path, "r", encoding="utf-8") as f:
    code = f.read()

phrases = [
    "Bạn đã nhận Lộc Lời Chúa hôm nay",
    "Mỗi người nhận một Lộc Thánh duy nhất",
    "Đang nhận diện Giáo xứ...",
    "Vui lòng liên hệ với Ban Truyền Thông Giáo xứ để nhận đường dẫn chính xác",
    "Vòng Quay Lời Chúa",
    "Chạm để quay",
    "Lộc Lời Chúa"
]

print("Bundle length:", len(code))

found_indices = []
for phrase in phrases:
    idx = code.find(phrase)
    if idx != -1:
        print(f"Phrase '{phrase}' found at: {idx}")
        found_indices.append(idx)
    else:
        print(f"Phrase '{phrase}' NOT found.")

if found_indices:
    min_idx = min(found_indices)
    max_idx = max(found_indices)
    print(f"\nRange of ParishionerWheel component: {min_idx} to {max_idx}")
    print(f"Recommended extraction range: {min_idx - 15000} to {max_idx + 5000}")
