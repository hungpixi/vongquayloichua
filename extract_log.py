import json
import os

log_path = r"C:\Users\PhạmPhúNguyễnHưng\.gemini\antigravity\brain\853f9156-fbd9-4c9f-8e14-d8d045491b65\.system_generated\logs\transcript.jsonl"
if not os.path.exists(log_path):
    print("Log file not found at", log_path)
    exit(1)

with open(log_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            s = json.dumps(data)
            if "Total Lines:" in s and "ParishionerWheel.tsx" in s:
                print(f"Line {idx} matches.")
                # Save to a json file
                out_name = f"response_{idx}.json"
                with open(out_name, "w", encoding="utf-8") as out:
                    json.dump(data, out, indent=2, ensure_ascii=False)
                print(f"  Saved to {out_name}")
        except Exception as e:
            pass
