with open("src/components/TemplateDesignerView.tsx", "r") as f:
    content = f.read()

start_preview = content.find("{/* LEFT COLUMN: LIVE PREVIEW (60%) */}")
end_preview = content.find("{/* RIGHT COLUMN: SETTINGS PANEL (40%) */}")
end_settings = content.find("{templateToDelete && (")

print(start_preview, end_preview, end_settings)
