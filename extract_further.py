import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Find the file index-*.js in dist/assets
import glob
files = glob.glob(r"D:\khoinghiep\vongquay\dist\assets\index-*.js")
if not files:
    print("No JS files found in dist/assets")
    exit(1)
js_path = files[0]
print("Found bundle:", js_path)

with open(js_path, "r", encoding="utf-8") as f:
    code = f.read()

idx = code.find("session_spun_blessing_")
if idx != -1:
    print(f"session_spun_blessing_ found at: {idx}")
    # Let's extract 5000 characters before session_spun_blessing_ to 5000 characters after
    start = max(0, idx - 8000)
    end = min(len(code), idx + 8000)
    out_path = r"D:\khoinghiep\vongquay\extracted_start.js"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(code[start:end])
    print(f"Extracted start segment to {out_path}")
else:
    print("session_spun_blessing_ not found")
