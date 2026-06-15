import json

with open("response_99.json", "r", encoding="utf-8") as f:
    data = json.load(f)

with open("response_99_content.txt", "w", encoding="utf-8") as f:
    f.write(data["content"])

print("Successfully written response_99_content.txt")
