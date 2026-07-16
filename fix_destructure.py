import os
import glob

template_files = glob.glob("src/components/islemler/print-templates/*Template.tsx")

for filepath in template_files:
    with open(filepath, "r") as f:
        content = f.read()
    
    # Check if we already destructured
    if "const {" not in content[:content.find("return")]:
        destructure = "  const { transaction, currentCariForPrint, formatPrintCurrency, convertNumberToWords, transactionTypeTheme, printedBankDetails, printedSignatureArea, activeTemplate, stoklar } = dynamicPrintVars || {};\n"
        
        # We also need to get some from props if we passed them explicitly, like activeTemplate in DefaultTemplate
        if "DefaultTemplate" in filepath:
            destructure += "  const formatPrintCurrencyFn = formatPrintCurrency || dynamicPrintVars?.formatPrintCurrency;\n"
            content = content.replace("formatPrintCurrency(", "formatPrintCurrencyFn(")

        content = content.replace("  return (\n", destructure + "  return (\n")
        
        with open(filepath, "w") as f:
            f.write(content)

