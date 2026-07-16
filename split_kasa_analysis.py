with open("src/components/KasaView.tsx", "r") as f:
    content = f.read()

start_idx = content.find("      {/* Cash Flow Summary & Outflow Analysis */}")
end_idx = content.find("      <InteractiveCashLedger ")

print("Start:", start_idx)
print("End:", end_idx)

if start_idx != -1 and end_idx != -1:
    analysis_code = content[start_idx:end_idx]
    
    with open("src/components/kasa/CashFlowAnalysis.tsx", "w") as f:
        f.write("import React from 'react';\n")
        f.write("import { PieChart as ChartIcon, Activity, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';\n")
        f.write("import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';\n")
        f.write("export function CashFlowAnalysis({ expenseChartData, EXPENSE_COLORS, formatCurrency, currentPeriodIn, currentPeriodOut }: any) {\n")
        f.write("  return (\n    <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">\n      ")
        f.write(analysis_code)
        f.write("\n    </div>\n  );\n}\n")
    
    new_content = content[:start_idx]
    new_content += "      <CashFlowAnalysis \n"
    new_content += "        expenseChartData={expenseChartData}\n"
    new_content += "        EXPENSE_COLORS={EXPENSE_COLORS}\n"
    new_content += "        formatCurrency={formatCurrency}\n"
    new_content += "        currentPeriodIn={currentPeriodIn}\n"
    new_content += "        currentPeriodOut={currentPeriodOut}\n"
    new_content += "      />\n"
    new_content += "      " + content[end_idx:]

    new_content = "import { CashFlowAnalysis } from './kasa/CashFlowAnalysis';\n" + new_content
    
    with open("src/components/KasaView.tsx", "w") as f:
        f.write(new_content)

