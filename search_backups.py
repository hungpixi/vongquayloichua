import os
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

backup_paths = [
    os.path.expandvars(r'%APPDATA%\Cursor\Backups'),
    os.path.expandvars(r'%APPDATA%\Code\Backups'),
    os.path.expandvars(r'%USERPROFILE%\.cursor\backups'),
]

found = False
for bp in backup_paths:
    print("Searching backup path:", bp)
    if os.path.exists(bp):
        for root, dirs, files in os.walk(bp):
            for file in files:
                # Search inside files for references to ParishionerWheel.tsx
                file_path = os.path.join(root, file)
                try:
                    # Files in backups are typically json or text files listing backed-up workspaces
                    if file == "workspaces.json":
                        with open(file_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            print(f"  Found workspaces.json in {root}")
                            print(json.dumps(data, indent=2))
                    else:
                        # If the file size is reasonable, search for ParishionerWheel.tsx
                        if os.path.getsize(file_path) < 10 * 1024 * 1024:
                            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                                content = f.read()
                                if "ParishionerWheel.tsx" in content:
                                    found = True
                                    print(f"  Found reference in file: {file_path}")
                                    # Print first 200 chars
                                    print(content[:300])
                except Exception as e:
                    pass

if not found:
    print("No backup files found.")
