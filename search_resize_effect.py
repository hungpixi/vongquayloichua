import json
import glob

found = False
for filename in glob.glob("response_*.json"):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        content = data.get("content", "")
        # Check if the file path is ParishionerWheel.tsx and lines are in 105-130 range
        if "ParishionerWheel.tsx" in content:
            # Look for lines in the range
            lines = content.splitlines()
            for line in lines:
                if "106:" in line or "110:" in line or "115:" in line:
                    print(f"=== Found in {filename} ===")
                    print("\n".join(lines[:15]))
                    print("...")
                    print("\n".join(lines[-15:]))
                    found = True
                    break
    except Exception as e:
        pass

if not found:
    print("Not found in response logs.")
