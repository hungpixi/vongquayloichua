import json
import glob

found_files = []
for filename in glob.glob("response_*.json"):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        content = data.get("content", "")
        if "resize" in content or "innerWidth" in content:
            found_files.append(filename)
    except Exception as e:
        pass

print("Found in files:", found_files)
