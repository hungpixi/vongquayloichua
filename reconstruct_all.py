import json
import glob
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

all_lines = {}
pattern = re.compile(r"^(\d+):(.*)$")

for filename in glob.glob("response_*.json"):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        content = data.get("content", "")
        lines_parsed = 0
        for line in content.splitlines():
            match = pattern.match(line)
            if match:
                line_num = int(match.group(1))
                line_content = match.group(2)
                if line_content.startswith(" "):
                    line_content = line_content[1:]
                all_lines[line_num] = line_content
                lines_parsed += 1
        print(f"Parsed {lines_parsed} lines from {filename}")
    except Exception as e:
        print(f"Error parsing {filename}: {e}")

print("\nTotal unique lines gathered:", len(all_lines))
missing = []
# Assuming max lines is around 1130 (or whatever the max key in all_lines is)
max_line = max(all_lines.keys()) if all_lines else 0
print(f"Max line number found: {max_line}")

for i in range(1, max_line + 1):
    if i not in all_lines:
        missing.append(i)

print("Number of missing lines:", len(missing))
if missing:
    print("Missing lines:", missing)
else:
    # Write to ParishionerWheel.tsx
    reconstructed_content = "\n".join(all_lines[i] for i in range(1, max_line + 1)) + "\n"
    with open("src/pages/ParishionerWheel.tsx", "w", encoding="utf-8") as f:
        f.write(reconstructed_content)
    print("Reconstructed ParishionerWheel.tsx successfully!")
