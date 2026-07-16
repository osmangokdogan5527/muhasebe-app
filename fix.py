with open('src/components/raporlar/exportUtils.ts', 'r') as f:
    content = f.read()

content = content.replace("import 'jspdf-autotable';\n", "")
content = content.replace("formatMoney, turkishToPdf, cariler", "formatMoney, turkishToPdf, cariler, incomeExpenseStats, stoklar, islemler, expenses")

with open('src/components/raporlar/exportUtils.ts', 'w') as f:
    f.write(content)

with open('src/components/raporlar/useRaporlarStats.ts', 'r') as f:
    content2 = f.read()

content2 = content2.replace("resolvedDates, selectedCariId, selectedCurrency } = deps", "resolvedDates, selectedCariId, selectedCurrency, stockValuationType, stockSearch, cariSearch, cariTypeFilter } = deps")
# Replace missing type imports
content2 = content2.replace("import { Islem, Expense, EmployeeTransaction, Cari, StokItem }", "import { Islem, Expense, EmployeeTransaction, Cari, Stock }")

with open('src/components/raporlar/useRaporlarStats.ts', 'w') as f:
    f.write(content2)

with open('src/components/RaporlarView.tsx', 'r') as f:
    content3 = f.read()

content3 = content3.replace("const { convertAmount", "const { convertAmount, formatMoney, filteredIslemler, filteredExpenses, filteredEmployeeTransactions, selectedCari, kdvStats, cariEkstreStats, summaryStats, stockStats, cariStats, incomeExpenseStats } = useRaporlarStats({ islemler, expenses, employeeTransactions, cariler, stoklar, resolvedDates, selectedCariId, selectedCurrency, stockValuationType, stockSearch, cariSearch, cariTypeFilter });\n  const { downloadExcel")

content3 = content3.replace("const { downloadExcel, downloadPDF, exportAllToExcel, downloadCariEkstrePDF, downloadKdvPdf } = getExportFunctions({ activeTab, summaryStats, selectedCurrency, stockStats, cariStats, filteredExpenses, kdvStats, selectedCari, resolvedDates, cariEkstreStats, formatMoney, turkishToPdf, cariler });", "const { downloadExcel, downloadPDF, exportAllToExcel, downloadCariEkstrePDF, downloadKdvPdf } = getExportFunctions({ activeTab, summaryStats, selectedCurrency, stockStats, cariStats, filteredExpenses, kdvStats, selectedCari, resolvedDates, cariEkstreStats, formatMoney, turkishToPdf, cariler, incomeExpenseStats, stoklar, islemler, expenses });")

# Remove duplicate useRaporlarStats call
lines = content3.split("\n")
new_lines = []
skip = False
for line in lines:
    if "const { convertAmount, formatMoney, filteredIslemler" in line and not skip:
        skip = True
        new_lines.append(line)
        continue
    if "const { convertAmount, formatMoney, filteredIslemler" in line and skip:
        continue
    new_lines.append(line)

content3 = "\n".join(new_lines)

with open('src/components/RaporlarView.tsx', 'w') as f:
    f.write(content3)
