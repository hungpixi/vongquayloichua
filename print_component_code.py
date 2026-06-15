import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = r"D:\khoinghiep\vongquay\extracted_component_beautified.js"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# Search for Hr = (
idx = code.find("Hr = (")
if idx == -1:
    # Try searching for Hr= (without spaces)
    idx = code.find("Hr=")

if idx == -1:
    print("Could not find component function start 'Hr = (' or 'Hr='")
    # Let's search for the useParams call: "let {parishSlug: e, wheelSlug: t, wheelId: n}"
    idx = code.find("let {parishSlug: e")

if idx != -1:
    print(f"Component start found at index: {idx}")
    # Let's match braces to find the end of the function
    brace_count = 0
    in_str = None
    escape = False
    
    # Let's find the first '{' after the index
    start_brace = code.find("{", idx)
    if start_brace != -1:
        brace_count = 1
        curr = start_brace + 1
        n = len(code)
        while curr < n and brace_count > 0:
            c = code[curr]
            if escape:
                escape = False
                curr += 1
                continue
            if in_str:
                if c == '\\':
                    escape = True
                elif c == in_str:
                    in_str = None
                curr += 1
                continue
            if c in ("'", '"', '`'):
                in_str = c
                curr += 1
                continue
            if c == '{':
                brace_count += 1
            elif c == '}':
                brace_count -= 1
            curr += 1
        
        component_code = code[idx:curr]
        out_path = r"D:\khoinghiep\vongquay\ParishionerWheel_extracted.js"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(component_code)
        print(f"Extracted component to {out_path} ({len(component_code)} characters)")
    else:
        print("Could not find opening brace '{'")
else:
    print("Component start not found.")
