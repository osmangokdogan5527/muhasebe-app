with open("src/components/TemplateDesignerView.tsx", "r") as f:
    view = f.read()

view = view.replace("handleDelete={handleDelete}", "handleDelete={handleDelete}\n        saveTemplates={saveTemplates}")

with open("src/components/TemplateDesignerView.tsx", "w") as f:
    f.write(view)

with open("src/components/templatedesigner/TemplateSettingsPanel.tsx", "r") as f:
    panel = f.read()

panel = panel.replace("setDeletingTemplate }: any) {", "setDeletingTemplate, saveTemplates }: any) {")

with open("src/components/templatedesigner/TemplateSettingsPanel.tsx", "w") as f:
    f.write(panel)

