import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = "src/pages/ParishionerWheel_reconstructed.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.read().splitlines()

print(f"Total lines: {len(lines)}")

# Search for function/component signatures
for idx, line in enumerate(lines):
    if "const ParishionerWheel" in line:
        print(f"Line {idx + 1}: {line}")
    if "export default" in line:
        print(f"Line {idx + 1}: {line}")
    if "const renderBlessingCard" in line:
        print(f"Line {idx + 1}: {line}")
