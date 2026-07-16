import re

with open("src/components/StoklarView.tsx", "r") as f:
    content = f.read()

# Check for Modals
matches = re.finditer(r"\{/\*\s*(.*?Modal.*?)\s*\*/\}", content, re.IGNORECASE)
for m in matches:
    print(m.group(1))

