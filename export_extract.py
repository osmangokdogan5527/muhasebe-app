import re

with open('src/components/RaporlarView.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "const downloadExcel =" in line:
        start_idx = i
    if "const turkishToPdf =" in line and start_idx == -1: # wait, turkishToPdf is at line 148
        pass

# let's just extract all functions that we can.
