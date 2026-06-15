import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

js_path = r"D:\khoinghiep\vongquay\dist\assets\index-CAiRrpO3.js"
with open(js_path, "r", encoding="utf-8") as f:
    code = f.read()

keywords = [
    "dbService",
    "canvas-confetti",
    "useParams",
    "CornerOrnamentSVG",
    "getContrastColor",
    "getLayoutBackground",
    "drawWheel",
    "handleCopyBlessing",
    "handleDownloadPNG",
    "handleDownloadInlinePNG",
    "renderBlessingCard",
    "public-layout",
    "public-card-wrapper",
    "ParishionerWheel"
]

print("Bundle length:", len(code))

for kw in keywords:
    # Find all occurrences
    idx = 0
    indices = []
    while True:
        idx = code.find(kw, idx)
        if idx == -1:
            break
        indices.append(idx)
        idx += len(kw)
    if indices:
        print(f"Keyword '{kw}' found at: {indices}")
    else:
        print(f"Keyword '{kw}' NOT found.")
