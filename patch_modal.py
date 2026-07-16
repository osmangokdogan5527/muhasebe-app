with open("src/components/islemler/PdfPrintModal.tsx", "r") as f:
    modal = f.read()

modal = modal.replace("if (style === 'classic') return <ClassicTemplate dynamicPrintVars={dynamicPrintVars} printSettings={printSettings} />;", "if (style === 'classic') return <ClassicTemplate dynamicPrintVars={dynamicPrintVars} printSettings={printSettings} />;\n                          return <DefaultTemplate dynamicPrintVars={dynamicPrintVars} printSettings={printSettings} activeTemplate={activeTemplate} formatPrintCurrency={dynamicPrintVars?.formatPrintCurrency} convertNumberToWords={dynamicPrintVars?.convertNumberToWords} printedSignatureArea={dynamicPrintVars?.printedSignatureArea} printedBankDetails={dynamicPrintVars?.printedBankDetails} />;")
modal = "import { DefaultTemplate } from './print-templates/DefaultTemplate';\n" + modal

with open("src/components/islemler/PdfPrintModal.tsx", "w") as f:
    f.write(modal)
