with open("src/components/TemplateDesignerView.tsx", "r") as f:
    content = f.read()

start_idx = content.find("      {/* RIGHT COLUMN: SETTINGS PANEL (40%) */}")
end_idx = content.find("      {/* Delete Confirmation Modal */}")

print("Start:", start_idx)
print("End:", end_idx)

