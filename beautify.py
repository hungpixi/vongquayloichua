import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

input_path = r"D:\khoinghiep\vongquay\extracted_component.js"
output_path = r"D:\khoinghiep\vongquay\extracted_component_beautified.js"

with open(input_path, "r", encoding="utf-8") as f:
    code = f.read()

out = []
indent = 0
in_str = None  # Char of string delimiter (' or " or `)
escape = False

idx = 0
n = len(code)

while idx < n:
    c = code[idx]
    
    if escape:
        out.append(c)
        escape = False
        idx += 1
        continue
        
    if in_str:
        out.append(c)
        if c == '\\':
            escape = True
        elif c == in_str:
            in_str = None
        idx += 1
        continue
        
    # Check if string start
    if c in ("'", '"', '`'):
        in_str = c
        out.append(c)
        idx += 1
        continue
        
    # Formatting rules for non-string code
    if c == '{':
        out.append(' {\n' + '  ' * (indent + 1))
        indent += 1
    elif c == '}':
        indent = max(0, indent - 1)
        out.append('\n' + '  ' * indent + '}')
    elif c == ';':
        out.append(';\n' + '  ' * indent)
    elif c == ',' and indent > 0:
        # Just add space after comma for readability
        out.append(', ')
    else:
        out.append(c)
        
    idx += 1

with open(output_path, "w", encoding="utf-8") as f:
    f.write("".join(out))

print(f"Beautified JS written to {output_path}")
