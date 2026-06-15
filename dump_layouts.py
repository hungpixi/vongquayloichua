import json

with open("response_4.json", "r", encoding="utf-8") as f:
    data_4 = json.load(f)

with open("response_97.json", "r", encoding="utf-8") as f:
    data_97 = json.load(f)

with open("extracted_4.txt", "w", encoding="utf-8") as f:
    f.write(data_4["content"])

with open("extracted_97.txt", "w", encoding="utf-8") as f:
    f.write(data_97["content"])

print("Successfully written extracted_4.txt and extracted_97.txt")
