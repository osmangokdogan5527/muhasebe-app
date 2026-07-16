with open('src/components/raporlar/useRaporlarStats.ts', 'r') as f:
    content = f.read()

content = content.replace("import { Islem, Expense, EmployeeTransaction, Cari, Stock }", "import { Transaction as Islem, Expense, EmployeeTransaction, Cari, StockItem }")
content = content.replace("StokItem", "StockItem")
content = content.replace("Stock[]", "StockItem[]")
with open('src/components/raporlar/useRaporlarStats.ts', 'w') as f:
    f.write(content)
