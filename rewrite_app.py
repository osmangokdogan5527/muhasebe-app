import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace settings hooks
settings_re = re.compile(
    r"  const \[activeTheme, setActiveTheme\].*?setAutoBackupEnabled\);\n    }\n  \}, \[autoBackupEnabled\]\);\n",
    re.DOTALL
)

# wait, there are other methods in between like handleDownloadLogoSvg
# Let's do string replacement instead.
