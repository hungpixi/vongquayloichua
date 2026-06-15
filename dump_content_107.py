import json

with open("response_107.json", "r", encoding="utf-8") as f:
    data = json.load(f)

with open("response_107_content.txt", "w", encoding="utf-8") as f:
    f.write(data["content"])

print("Successfully written response_107_content.txt")
