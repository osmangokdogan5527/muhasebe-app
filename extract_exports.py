import re

with open('src/components/RaporlarView.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if "const downloadExcel =" in line:
        start_idx = i
        break

end_idx = -1
for i in range(start_idx, len(lines)):
    if "return (" in lines[i] and "dashboard-wrapper" in lines[i+2]:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    exports_code = "".join(lines[start_idx:end_idx])
    with open('src/components/raporlar/exportUtils.ts', 'w') as f:
        f.write("import * as XLSX from 'xlsx';\nimport jsPDF from 'jspdf';\nimport 'jspdf-autotable';\n\n")
        f.write("export const getExportFunctions = (deps: any) => {\n")
        f.write("  const { activeTab, summaryStats, selectedCurrency, stockStats, cariStats, filteredExpenses, kdvStats, selectedCari, resolvedDates, cariEkstreStats, formatMoney, turkishToPdf, cariler } = deps;\n\n")
        f.write("  " + exports_code.replace("\n", "\n  "))
        f.write("\n  return { downloadExcel, downloadPDF, exportAllToExcel, downloadCariEkstrePDF, downloadKdvPdf };\n}\n")
        
    # Now replace the calls in RaporlarView.tsx
    new_content = "".join(lines[:start_idx])
    new_content += "  const { downloadExcel, downloadPDF, exportAllToExcel, downloadCariEkstrePDF, downloadKdvPdf } = getExportFunctions({ activeTab, summaryStats, selectedCurrency, stockStats, cariStats, filteredExpenses, kdvStats, selectedCari, resolvedDates, cariEkstreStats, formatMoney, turkishToPdf, cariler });\n\n"
    new_content += "".join(lines[end_idx:])
    
    # Also add import
    new_content = new_content.replace("import { GelirGiderTab }", "import { getExportFunctions } from './raporlar/exportUtils';\nimport { GelirGiderTab }")
    
    with open('src/components/RaporlarView.tsx', 'w') as f:
        f.write(new_content)
    print(f"Extracted from line {start_idx} to {end_idx}")
else:
    print("Could not find bounds")
