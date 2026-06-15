import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

js_path = r"D:\khoinghiep\vongquay\dist\assets\index-CAiRrpO3.js"
with open(js_path, "r", encoding="utf-8") as f:
    code = f.read()

idx = code.find("session_spun_blessing_")
if idx != -1:
    print(f"Found at: {idx}")
    print("--- 1500 characters BEFORE ---")
    print(code[max(0, idx - 1500):idx])
else:
    print("session_spun_blessing_ not found")
