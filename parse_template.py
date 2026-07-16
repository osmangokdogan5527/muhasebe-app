import re

with open("src/components/TemplateDesignerView.tsx", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "{/*" in line and "*/}" in line:
        pass # print(f"{i+1}: {line.strip()}")
    elif "return (" in line:
        pass # print(f"{i+1}: return (")

