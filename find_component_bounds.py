import re

with open("extracted_more.js", "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for the component name or related function signatures
# Let's search for names that contain "ParishionerWheel"
matches = [m.start() for m in re.finditer("ParishionerWheel", content)]
print("Matches for 'ParishionerWheel':", matches)

for m in matches:
    # Print 200 characters around the match
    start = max(0, m - 100)
    end = min(len(content), m + 200)
    print(f"Context at {m}:\n{content[start:end]}\n" + "-"*40)
