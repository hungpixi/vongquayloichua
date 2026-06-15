import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("extracted_more.js", "r", encoding="utf-8") as f:
    content = f.read()

print("--- HEAD 4000 CHARACTERS ---")
print(content[:4000])
