with open("src/components/TemplateDesignerView.tsx", "r") as f:
    content = f.read()

start_idx = content.find("      {/* RIGHT COLUMN: SETTINGS PANEL (40%) */}")
end_idx = content.find("      {/* Delete Confirmation Modal */}")

if start_idx != -1 and end_idx != -1:
    settings_code = content[start_idx:end_idx]
    
    with open("src/components/templatedesigner/TemplateSettingsPanel.tsx", "w") as f:
        f.write("import React from 'react';\n")
        f.write("import { Save, Plus, Trash2, LayoutTemplate, Settings, Image as ImageIcon, Barcode as BarcodeIcon } from 'lucide-react';\n")
        f.write("import { SwitchRow } from '../templates/SwitchRow';\n")
        f.write("export function TemplateSettingsPanel({ activeTemplateId, setActiveTemplateId, templates, handleCreateNew, activeTemplate, updateActiveTemplate, handleDelete, setDeletingTemplate }: any) {\n")
        f.write("  return (\n    <>\n      ")
        f.write(settings_code)
        f.write("\n    </>\n  );\n}\n")
    
    new_content = content[:start_idx]
    new_content += "      <TemplateSettingsPanel \n"
    new_content += "        activeTemplateId={activeTemplateId}\n"
    new_content += "        setActiveTemplateId={setActiveTemplateId}\n"
    new_content += "        templates={templates}\n"
    new_content += "        handleCreateNew={handleCreateNew}\n"
    new_content += "        activeTemplate={activeTemplate}\n"
    new_content += "        updateActiveTemplate={updateActiveTemplate}\n"
    new_content += "        handleDelete={handleDelete}\n"
    new_content += "        setDeletingTemplate={setDeletingTemplate}\n"
    new_content += "      />\n"
    new_content += "      " + content[end_idx:]

    new_content = "import { TemplateSettingsPanel } from './templatedesigner/TemplateSettingsPanel';\n" + new_content
    
    with open("src/components/TemplateDesignerView.tsx", "w") as f:
        f.write(new_content)

