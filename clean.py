with open('src/components/RaporlarView.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    # If the line contains the second duplicate declaration:
    if "const { downloadExcel, formatMoney" in line:
        continue # this is duplicate line
    
    new_lines.append(line)

with open('src/components/RaporlarView.tsx', 'w') as f:
    f.write("".join(new_lines))
