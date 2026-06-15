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

with open(js_path, "r", encoding="utf-8") as f:
    code = f.read()

# Extract from index 545000 to 575000
start = 545000
end = 575000

with open(r"D:\khoinghiep\vongquay\extracted_component.js", "w", encoding="utf-8") as f:
    f.write(code[start:end])

print(f"Extracted component to D:\\khoinghiep\\vongquay\\extracted_component.js")
