import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"C:\Users\PhạmPhúNguyễnHưng\.gemini\antigravity\brain"
print("Scanning:", base_dir)

if os.path.exists(base_dir):
    subdirs = os.listdir(base_dir)
    print("Subdirectories:", subdirs)
    for sd in subdirs:
        sd_path = os.path.join(base_dir, sd)
        if os.path.isdir(sd_path):
            # Try to look for transcript.jsonl
            log_file = os.path.join(sd_path, ".system_generated", "logs", "transcript.jsonl")
            if os.path.exists(log_file):
                print(f"FOUND log: {log_file} (size: {os.path.getsize(log_file)} bytes)")
            else:
                # search recursively inside
                for root, dirs, files in os.walk(sd_path):
                    for f in files:
                        if f == "transcript.jsonl":
                            p = os.path.join(root, f)
                            print(f"FOUND recursively: {p} (size: {os.path.getsize(p)} bytes)")
else:
    print("base_dir does not exist")
