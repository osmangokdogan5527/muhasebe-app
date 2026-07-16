import re

with open('src/components/RaporlarView.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
for i, line in enumerate(lines):
    if "const convertAmount = (amount: number" in line:
        start_idx = i
        break

end_idx = -1
for i, line in enumerate(lines):
    if "const COLORS =" in line:
        end_idx = i - 2
        break

if start_idx != -1 and end_idx != -1:
    hooks_code = "".join(lines[start_idx:end_idx])
    with open('src/components/raporlar/useRaporlarStats.ts', 'w') as f:
        f.write("import { useMemo } from 'react';\n")
        f.write("import { Islem, Expense, EmployeeTransaction, Cari, StokItem } from '../../types';\n\n")
        f.write("export const useRaporlarStats = (deps: any) => {\n")
        f.write("  const { islemler, expenses, employeeTransactions, cariler, stoklar, resolvedDates, selectedCariId, selectedCurrency } = deps;\n\n")
        f.write("  " + hooks_code.replace("\n", "\n  "))
        f.write("\n  return { convertAmount, formatMoney, filteredIslemler, filteredExpenses, filteredEmployeeTransactions, selectedCari, kdvStats, cariEkstreStats, summaryStats, stockStats, cariStats, incomeExpenseStats };\n}\n")
        
    # Now replace the calls in RaporlarView.tsx
    new_content = "".join(lines[:start_idx])
    new_content += "  const { convertAmount, formatMoney, filteredIslemler, filteredExpenses, filteredEmployeeTransactions, selectedCari, kdvStats, cariEkstreStats, summaryStats, stockStats, cariStats, incomeExpenseStats } = useRaporlarStats({ islemler, expenses, employeeTransactions, cariler, stoklar, resolvedDates, selectedCariId, selectedCurrency });\n\n"
    new_content += "".join(lines[end_idx:])
    
    # Also add import
    new_content = new_content.replace("import { getExportFunctions }", "import { useRaporlarStats } from './raporlar/useRaporlarStats';\nimport { getExportFunctions }")
    
    with open('src/components/RaporlarView.tsx', 'w') as f:
        f.write(new_content)
    print(f"Extracted from line {start_idx} to {end_idx}")
else:
    print(f"Could not find bounds start_idx={start_idx} end_idx={end_idx}")
