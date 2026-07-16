with open("src/components/TemplateDesignerView.tsx", "r") as f:
    view = f.read()

view = view.replace("updateActiveTemplate={updateActiveTemplate}", "handleUpdateActiveTemplate={handleUpdateActiveTemplate}")
view = view.replace("handleDelete={handleDelete}", "handleDeleteTemplate={handleDeleteTemplate}")
view = view.replace("logoText={logoText}", "") # No logoText prop needed

with open("src/components/TemplateDesignerView.tsx", "w") as f:
    f.write(view)

with open("src/components/templatedesigner/TemplateSettingsPanel.tsx", "r") as f:
    panel = f.read()

panel = panel.replace("updateActiveTemplate", "handleUpdateActiveTemplate")
panel = panel.replace("handleDelete", "handleDeleteTemplate")
# The parameter list in TemplateSettingsPanel also needs fix
# export function TemplateSettingsPanel({ activeTemplateId, setActiveTemplateId, templates, handleCreateNew, activeTemplate, updateActiveTemplate, handleDeleteTemplate, setDeletingTemplate, saveTemplates }: any) {
panel = panel.replace("handleUpdateActiveTemplate={handleUpdateActiveTemplate}", "handleUpdateActiveTemplate")
with open("src/components/templatedesigner/TemplateSettingsPanel.tsx", "w") as f:
    f.write(panel)

