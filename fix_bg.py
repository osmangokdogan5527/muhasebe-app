with open('src/components/GlobalStyles.tsx', 'r') as f:
    text = f.read()

target = """        body,
        .bg-\\[\\#050505\\] {
          background: 
            ${bodyPatternSvg},
            linear-gradient(135deg, #f0f4f8 0%, #f7fafc 100%) !important;
          background-size: ${activePattern.size || 'auto'}, 100% 100% !important;
          background-repeat: repeat, no-repeat !important;
          background-attachment: fixed !important;
        }"""

replacement = """        body,
        .bg-\\[\\#050505\\] {
          background-color: #050505 !important;
          background-image: ${bodyPatternSvg ? bodyPatternSvg : 'none'} !important;
          background-size: ${activePattern.size || 'auto'} !important;
          background-repeat: repeat !important;
          background-attachment: fixed !important;
        }"""

text = text.replace(target, replacement)

with open('src/components/GlobalStyles.tsx', 'w') as f:
    f.write(text)
