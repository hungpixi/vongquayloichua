import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Find JS file in dist/assets
import glob
files = glob.glob(r"D:\khoinghiep\vongquay\dist\assets\index-*.js")
if not files:
    print("No JS files found in dist/assets")
    exit(1)
js_path = files[0]
print("Found bundle:", js_path)

with open(js_path, "r", encoding="utf-8") as f:
    code = f.read()

terms = [
    "corner-ornament",
    "modal-overlay",
    "winner-card",
    "Xem lại Lộc Thánh của bạn",
    "Đang nhận diện Giáo xứ...",
    "Vui lòng liên hệ với Ban Truyền Thông Giáo xứ để nhận đường dẫn chính xác",
    "Về Trang Chủ",
    "public-layout",
    "copyright",
    "footer",
    "Vòng Quay Lộc Lời Chúa"
]

for term in terms:
    idx = code.rfind(term)
    print(f"Term '{term}' last occurrence: {idx}")
