import json
import re

def extract_lines(filename):
    with open(filename, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    content = data["content"]
    lines = content.splitlines()
    
    parsed_lines = {}
    pattern = re.compile(r"^(\d+):(.*)$")
    
    for line in lines:
        match = pattern.match(line)
        if match:
            line_num = int(match.group(1))
            line_content = match.group(2)
            # Remove the single leading space if it exists
            if line_content.startswith(" "):
                line_content = line_content[1:]
            parsed_lines[line_num] = line_content
            
    return parsed_lines

# Extract from both files
part1 = extract_lines("response_2.json")
part2 = extract_lines("response_4.json")

# Merge
merged = {}
merged.update(part1)
merged.update(part2)

# Verify we have all lines from 1 to 1129
all_lines = []
for i in range(1, 1130):
    if i in merged:
        all_lines.append(merged[i])
    else:
        print(f"Warning: Line {i} is missing!")
        all_lines.append("")

# Write reconstructed file
reconstructed_content = "\n".join(all_lines) + "\n"
with open("src/pages/ParishionerWheel.tsx", "w", encoding="utf-8") as f:
    f.write(reconstructed_content)

print(f"Reconstructed src/pages/ParishionerWheel.tsx successfully. Total lines: {len(all_lines)}")
