import re

with open("src/components/islemler/PdfPrintModal.tsx", "r") as f:
    content = f.read()

# find corporate template
c_start = content.find("if (style === 'corporate') {")
m_start = content.find("if (style === 'modern') {")
e_start = content.find("if (style === 'elegant') {")
cl_start = content.find("if (style === 'classic') {")
end_cl = content.find("</div>\n                          );\n                        })()", cl_start)

# Corporate
corp_code = content[c_start:m_start]
corp_code = corp_code.replace("if (style === 'corporate') {\n                            return (", "")
corp_code = corp_code.replace("\n                            );\n                          }", "")

# Modern
mod_code = content[m_start:e_start]
mod_code = mod_code.replace("if (style === 'modern') {\n                            return (", "")
mod_code = mod_code.replace("\n                            );\n                          }", "")

# Elegant
eleg_code = content[e_start:cl_start]
eleg_code = eleg_code.replace("if (style === 'elegant') {\n                            return (", "")
eleg_code = eleg_code.replace("\n                            );\n                          }", "")

# Classic
clas_code = content[cl_start:end_cl]
clas_code = clas_code.replace("if (style === 'classic') {\n                            return (", "")
clas_code = clas_code.replace("\n                            );", "")

# We need to find what props they use.
# `dynamicPrintVars`, `printSettings`

with open("src/components/islemler/print-templates/CorporateTemplate.tsx", "w") as f:
    f.write("import React from 'react';\n")
    f.write("import { Sparkles } from 'lucide-react';\n")
    f.write("export function CorporateTemplate({ dynamicPrintVars, printSettings }: any) {\n")
    f.write("  return (\n" + corp_code + "\n  );\n}\n")

with open("src/components/islemler/print-templates/ModernTemplate.tsx", "w") as f:
    f.write("import React from 'react';\n")
    f.write("export function ModernTemplate({ dynamicPrintVars, printSettings }: any) {\n")
    f.write("  return (\n" + mod_code + "\n  );\n}\n")

with open("src/components/islemler/print-templates/ElegantTemplate.tsx", "w") as f:
    f.write("import React from 'react';\n")
    f.write("export function ElegantTemplate({ dynamicPrintVars, printSettings }: any) {\n")
    f.write("  return (\n" + eleg_code + "\n  );\n}\n")

with open("src/components/islemler/print-templates/ClassicTemplate.tsx", "w") as f:
    f.write("import React from 'react';\n")
    f.write("export function ClassicTemplate({ dynamicPrintVars, printSettings }: any) {\n")
    f.write("  return (\n" + clas_code + "\n  );\n}\n")

# Replace in original file
new_content = content[:c_start]
new_content += "if (style === 'corporate') return <CorporateTemplate dynamicPrintVars={dynamicPrintVars} printSettings={printSettings} />;\n                          "
new_content += "if (style === 'modern') return <ModernTemplate dynamicPrintVars={dynamicPrintVars} printSettings={printSettings} />;\n                          "
new_content += "if (style === 'elegant') return <ElegantTemplate dynamicPrintVars={dynamicPrintVars} printSettings={printSettings} />;\n                          "
new_content += "if (style === 'classic') return <ClassicTemplate dynamicPrintVars={dynamicPrintVars} printSettings={printSettings} />;\n                          "
new_content += content[end_cl:]

new_content = "import { CorporateTemplate } from './print-templates/CorporateTemplate';\nimport { ModernTemplate } from './print-templates/ModernTemplate';\nimport { ElegantTemplate } from './print-templates/ElegantTemplate';\nimport { ClassicTemplate } from './print-templates/ClassicTemplate';\n" + new_content

with open("src/components/islemler/PdfPrintModal.tsx", "w") as f:
    f.write(new_content)

print(c_start, end_cl)
