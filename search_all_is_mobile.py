import json
import glob

for filename in glob.glob("response_*.json"):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        content = data.get("content", "")
        if "isMobile" in content:
            lines = content.splitlines()
            for idx, line in enumerate(lines):
                if "isMobile" in line:
                    print(f"{filename} L{idx+1}: {line}")
    except Exception as e:
        pass
