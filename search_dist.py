import os
import sys

js_path = r"D:\khoinghiep\vongquay\dist\assets\index-CAiRrpO3.js"
with open(js_path, "r", encoding="utf-8") as f:
    code = f.read()

# We want to extract around the index 568193
start = 558000
end = 572000

out_path = r"D:\khoinghiep\vongquay\extracted_dist.js"
with open(out_path, "w", encoding="utf-8") as f:
    f.write(code[start:end])

print(f"Extracted {end - start} characters to {out_path}")
