with open("src/components/islemler/print-templates/ClassicTemplate.tsx", "r") as f:
    content = f.read()

split_idx = content.find("}\n\n                          /* DEFAULT / MINIMALIST LAYOUT */\n                          return (")

if split_idx == -1:
    split_idx = content.find("}\n                          \n                          /* DEFAULT / MINIMALIST LAYOUT */\n                          return (")

print(split_idx)

classic = content[:split_idx] + "\n  );\n}"
default = content[split_idx:]
default = default[default.find("return (") + 9:]

with open("src/components/islemler/print-templates/ClassicTemplate.tsx", "w") as f:
    f.write(classic)

with open("src/components/islemler/print-templates/DefaultTemplate.tsx", "w") as f:
    f.write("import React from 'react';\n")
    f.write("export function DefaultTemplate({ dynamicPrintVars, printSettings, activeTemplate, formatPrintCurrency, convertNumberToWords, printedSignatureArea, printedBankDetails }: any) {\n")
    f.write("  return (\n" + default)
