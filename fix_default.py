import re

with open("src/components/islemler/print-templates/DefaultTemplate.tsx", "r") as f:
    content = f.read()

# remove from props
content = content.replace(" activeTemplate, formatPrintCurrency, convertNumberToWords, printedSignatureArea, printedBankDetails ", " ")
content = content.replace("formatPrintCurrencyFn", "formatPrintCurrency")
content = content.replace("const formatPrintCurrency = formatPrintCurrency || dynamicPrintVars?.formatPrintCurrency;\n", "")

with open("src/components/islemler/print-templates/DefaultTemplate.tsx", "w") as f:
    f.write(content)

with open("src/components/islemler/print-templates/CorporateTemplate.tsx", "r") as f:
    corp = f.read()

# add kdvBreakdown to destructure
corp = corp.replace("activeTemplate, stoklar } =", "activeTemplate, stoklar, kdvBreakdown } =")

with open("src/components/islemler/print-templates/CorporateTemplate.tsx", "w") as f:
    f.write(corp)
