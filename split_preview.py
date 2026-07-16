import re

with open("src/components/TemplateDesignerView.tsx", "r") as f:
    content = f.read()

start_idx = content.find("if (style === 'corporate') {")
end_idx = content.find("            })()}  \n          </div>")
if end_idx == -1:
    end_idx = content.find("            })()}\n          </div>")
if end_idx == -1:
    end_idx = content.find("            })()}\n")
if end_idx == -1:
    end_idx = content.find("            })()")

print("Start:", start_idx)
print("End:", end_idx)

if start_idx != -1 and end_idx != -1:
    preview_code = content[start_idx:end_idx]
    
    with open("src/components/templatedesigner/TemplatePreviews.tsx", "w") as f:
        f.write("import React from 'react';\n")
        f.write("import { PrintTemplateConfig } from '../TemplateDesignerView';\n\n")
        f.write("export function TemplatePreviews({ activeTemplate, companyName, companyAddress, companyPhone, logoType, logoImageUrl, logoText }: any) {\n")
        f.write("  const style = activeTemplate.designStyle || 'minimal';\n")
        f.write("  " + preview_code + "\n")
        f.write("}\n")
    
    new_content = content[:start_idx]
    new_content += "              return <TemplatePreviews \n"
    new_content += "                activeTemplate={activeTemplate}\n"
    new_content += "                companyName={companyName}\n"
    new_content += "                companyAddress={companyAddress}\n"
    new_content += "                companyPhone={companyPhone}\n"
    new_content += "                logoType={logoType}\n"
    new_content += "                logoImageUrl={logoImageUrl}\n"
    new_content += "                logoText={logoText}\n"
    new_content += "              />;\n"
    new_content += "  " + content[end_idx:]

    new_content = "import { TemplatePreviews } from './templatedesigner/TemplatePreviews';\n" + new_content
    
    with open("src/components/TemplateDesignerView.tsx", "w") as f:
        f.write(new_content)

