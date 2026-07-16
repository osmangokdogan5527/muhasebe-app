with open("src/components/KasaView.tsx", "r") as f:
    view = f.read()

view = view.replace("expenseChartData={expenseChartData}", "flowStats={flowStats}")
view = view.replace("EXPENSE_COLORS={EXPENSE_COLORS}", "COLORS={COLORS}")
view = view.replace("currentPeriodIn={currentPeriodIn}", "")
view = view.replace("currentPeriodOut={currentPeriodOut}", "")

view = view.replace("filteredMoves={filteredMoves}", "filteredMovements={filteredMovements}")
view = view.replace("accountFilter={accountFilter}", "selectedAccountId={selectedAccountId}\n        setSelectedAccountId={setSelectedAccountId}\n        setSelectedCurrency={setSelectedCurrency}")

view = view.replace("setAccountFilter={setAccountFilter}", "")

with open("src/components/KasaView.tsx", "w") as f:
    f.write(view)

with open("src/components/kasa/CashFlowAnalysis.tsx", "r") as f:
    cfa = f.read()

cfa = cfa.replace("expenseChartData, EXPENSE_COLORS, formatCurrency, currentPeriodIn, currentPeriodOut", "flowStats, COLORS, formatCurrency")

with open("src/components/kasa/CashFlowAnalysis.tsx", "w") as f:
    f.write(cfa)

with open("src/components/kasa/InteractiveCashLedger.tsx", "r") as f:
    icl = f.read()

icl = icl.replace("accountFilter, setAccountFilter", "selectedAccountId, setSelectedAccountId, setSelectedCurrency")
icl = icl.replace("filteredMoves", "filteredMovements")
icl = icl.replace("import { Search, Edit, Trash2 }", "import { Search, Edit, Trash2, ArrowUpRight, ArrowDownLeft }")

with open("src/components/kasa/InteractiveCashLedger.tsx", "w") as f:
    f.write(icl)

