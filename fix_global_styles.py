import re

with open('src/components/GlobalStyles.tsx', 'r') as f:
    content = f.read()

new_bg = """        body,
        .bg-\\[\\#050505\\] {
          background-color: #050505 !important;
          background-image: ${bodyPatternSvg ? bodyPatternSvg : 'none'} !important;
          background-size: ${activePattern.size || 'auto'} !important;
          background-repeat: repeat !important;
          background-attachment: fixed !important;
        }"""

content = re.sub(
    r"        body,\n        \.bg-\\\\[\\\\#050505\\\\] \{\n          background: \n            \$\{bodyPatternSvg\},\n            linear-gradient\(135deg, #f0f4f8 0%, #f7fafc 100%\) !important;\n          background-size: \$\{activePattern\.size \|\| 'auto'\}, 100% 100% !important;\n          background-repeat: repeat, no-repeat !important;\n          background-attachment: fixed !important;\n        \}",
    new_bg,
    content
)

with open('src/components/GlobalStyles.tsx', 'w') as f:
    f.write(content)

