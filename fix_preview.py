import re

with open("src/components/TemplateDesignerView.tsx", "r") as f:
    view = f.read()

old_call = """              return <TemplatePreviews 
                activeTemplate={activeTemplate}
                companyName={companyName}
                companyAddress={companyAddress}
                companyPhone={companyPhone}
                logoType={logoType}
                logoImageUrl={logoImageUrl}
                logoText={logoText}
              />;"""

new_call = """              return <TemplatePreviews 
                activeTemplate={activeTemplate}
                companyName={companyName}
                companyAddress={companyAddress}
                companyPhone={companyPhone}
                logoType={logoType}
                logoImageUrl={logoImageUrl}
                logoText={logoText}
                mockCustomer={mockCustomer}
                mockItems={mockItems}
                calculateTotal={calculateTotal}
                renderPreviewBankDetails={renderPreviewBankDetails}
                renderPreviewSignatureArea={renderPreviewSignatureArea}
              />;"""

if old_call in view:
    view = view.replace(old_call, new_call)
else:
    print("Old call not found!")

with open("src/components/TemplateDesignerView.tsx", "w") as f:
    f.write(view)

with open("src/components/templatedesigner/TemplatePreviews.tsx", "r") as f:
    modals = f.read()

sig_start = "export function TemplatePreviews({"
sig_end = "}: any) {"

start_idx = modals.find(sig_start)
end_idx = modals.find(sig_end, start_idx) + len(sig_end)

new_sig = "import { Image as ImageIcon } from 'lucide-react';\nexport function TemplatePreviews({ activeTemplate, companyName, companyAddress, companyPhone, logoType, logoImageUrl, logoText, mockCustomer, mockItems, calculateTotal, renderPreviewBankDetails, renderPreviewSignatureArea }: any) {"

modals = modals[:start_idx] + new_sig + modals[end_idx:]
with open("src/components/templatedesigner/TemplatePreviews.tsx", "w") as f:
    f.write(modals)

