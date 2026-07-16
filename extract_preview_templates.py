with open("src/components/TemplateDesignerView.tsx", "r") as f:
    content = f.read()

start_idx = content.find("if (style === 'corporate') {")
end_idx = content.find("            })()}  \n          </div>")
if end_idx == -1:
    end_idx = content.find("            })()}\n          </div>")

print("Start:", start_idx)
print("End:", end_idx)

