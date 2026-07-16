import re

with open('src/components/IslemlerView.tsx', 'r') as f:
    content = f.read()

# Replace IslemlerView with new one. We can just use AST or string manipulation.
# Since it's a huge file, maybe I should generate it.
