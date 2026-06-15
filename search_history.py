import os
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

history_path = os.path.expandvars(r'%APPDATA%\Cursor\User\History')
print("Searching history path:", history_path)
found = False
if os.path.exists(history_path):
    for root, dirs, files in os.walk(history_path):
        for file in files:
            if file == "entries.json":
                json_path = os.path.join(root, file)
                try:
                    with open(json_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        resource_path = data.get("resource", "")
                        if "ParishionerWheel.tsx" in resource_path:
                            found = True
                            print(f"\nFound match for: {resource_path}")
                            print(f"Directory: {root}")
                            print(f"Entries: {json.dumps(data.get('entries', []), indent=2)}")
                            # Print files in directory
                            print(f"Files in dir: {os.listdir(root)}")
                except Exception as e:
                    pass
if not found:
    print("No Cursor history entries found for ParishionerWheel.tsx.")
