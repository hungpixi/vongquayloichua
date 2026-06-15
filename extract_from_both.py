import json
import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

# The two conversations of interest
target_conversations = [
    "ffea5313-cccb-4bd7-a805-cd31a44bfd52",
    "93898445-9105-4106-a27c-957c75d18f21"
]

base_dir = r"C:\Users\PhạmPhúNguyễnHưng\.gemini\antigravity\brain"

# We will collect all line data we find. Key = line number (1-based), Value = line content.
# Since newer messages/tool outputs in the log might contain corrected/newer lines, we can track the timestamp or log position.
# Actually, let's print and extract all chunks to a dict.
extracted_lines = {}

pattern = re.compile(r"^(\d+):(.*)$")

def process_file(log_path):
    print(f"Reading log: {log_path}")
    if not os.path.exists(log_path):
        print(f"Log not found: {log_path}")
        return
        
    line_count = 0
    with open(log_path, 'r', encoding='utf-8') as f:
        for idx, line in enumerate(f):
            try:
                data = json.loads(line)
                # Look inside the data recursively for any string that looks like a file output
                # Let's search all string values in the json object
                def search_obj(obj):
                    if isinstance(obj, str):
                        if "ParishionerWheel.tsx" in obj and ("Total Lines:" in obj or "1: import" in obj):
                            # Extract lines
                            lines = obj.splitlines()
                            extracted = 0
                            for l in lines:
                                match = pattern.match(l.strip())
                                if match:
                                    num = int(match.group(1))
                                    content = match.group(2)
                                    if content.startswith(" "):
                                        content = content[1:]
                                    # Update. Since we process in order, later outputs might overwrite older ones.
                                    extracted_lines[num] = content
                                    extracted += 1
                            if extracted > 0:
                                print(f"  Line {idx}: Extracted {extracted} lines of ParishionerWheel.tsx")
                    elif isinstance(obj, dict):
                        for k, v in obj.items():
                            search_obj(v)
                    elif isinstance(obj, list):
                        for item in obj:
                            search_obj(item)
                search_obj(data)
            except Exception as e:
                pass

# Run on target conversations
for tc in target_conversations:
    log_path = os.path.join(base_dir, tc, ".system_generated", "logs", "transcript.jsonl")
    process_file(log_path)

# Also run on all other log files in the directory to extract as much as possible!
all_dirs = os.listdir(base_dir)
for sd in all_dirs:
    if sd not in target_conversations:
        log_path = os.path.join(base_dir, sd, ".system_generated", "logs", "transcript.jsonl")
        if os.path.exists(log_path):
            process_file(log_path)

# Let's check what we have
missing = []
max_line = max(extracted_lines.keys()) if extracted_lines else 1130
print(f"Max line extracted: {max_line}")

all_lines = []
for i in range(1, max_line + 1):
    if i in extracted_lines:
        all_lines.append(extracted_lines[i])
    else:
        missing.append(i)
        all_lines.append("")

if missing:
    print(f"Total missing: {len(missing)}")
    # Print ranges
    ranges = []
    start = missing[0]
    prev = missing[0]
    for m in missing[1:]:
        if m == prev + 1:
            prev = m
        else:
            ranges.append((start, prev))
            start = m
            prev = m
    ranges.append((start, prev))
    print(f"Missing ranges: {ranges}")
else:
    print("NO MISSING LINES AT ALL!")

# Save the reconstructed file
reconstructed_content = "\n".join(all_lines) + "\n"
with open("src/pages/ParishionerWheel_reconstructed.tsx", "w", encoding="utf-8") as f:
    f.write(reconstructed_content)
print("Saved to src/pages/ParishionerWheel_reconstructed.tsx")
