import json
import glob
import re

for filename in glob.glob("response_*.json"):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        content = data.get("content", "")
        if "renderBlessingCard" in content or "isMobile" in content:
            print(f"=== Found in {filename} ===")
            lines = content.splitlines()
            for idx, line in enumerate(lines):
                if any(x in line for x in ["renderBlessingCard", "isMobile", "flexDirection"]):
                    print(f"Line {idx + 1}: {line}")
    except Exception as e:
        pass
