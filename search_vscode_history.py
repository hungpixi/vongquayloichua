import os
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

appdata = os.environ.get("APPDATA")
paths_to_check = [
    os.path.join(appdata, "Code", "User", "History"),
    os.path.join(appdata, "Cursor", "User", "History"),
    os.path.join(appdata, "Cursor-nightly", "User", "History"),
]

found = False
for history_path in paths_to_check:
    print("Searching history path:", history_path)
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
                                files_in_dir = os.listdir(root)
                                print(f"Files in dir: {files_in_dir}")
                                # Let's copy the files to some temp dir or inspect them
                    except Exception as e:
                        pass

if not found:
    print("No VS Code / Cursor history entries found for ParishionerWheel.tsx.")
