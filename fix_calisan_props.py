with open("src/components/CalisanlarView.tsx", "r") as f:
    content = f.read()

content = content.replace("handleEditTx={handleEditTx}", "handleOpenEditTx={handleOpenEditTx}\n        handleOpenCreateEmployee={handleOpenCreateEmployee}\n        handleOpenCreateTx={handleOpenCreateTx}\n        handleTxTypeChange={handleTxTypeChange}")
content = content.replace("formatMoney={formatMoney}", "formatCurrency={formatCurrency}")
content = content.replace("convertAmount={convertAmount}\n", "")
content = content.replace("employeeTransactions={employeeTransactions}", "employeeSpecificTransactions={employeeSpecificTransactions}\n        portfolioCekler={portfolioCekler}")

with open("src/components/CalisanlarView.tsx", "w") as f:
    f.write(content)

with open("src/components/calisanlar/CalisanlarModals.tsx", "r") as f:
    modals = f.read()

modals = modals.replace("import { X, Users, CreditCard, AlertCircle, FileText, Download, Wallet, Trash2 }", "import { X, Users, CreditCard, AlertCircle, FileText, Download, Wallet, Trash2, DollarSign, Plus, Phone, Mail }")

modals = modals.replace("handleEditTx", "handleOpenEditTx")
modals = modals.replace("formatMoney", "formatCurrency")
modals = modals.replace("convertAmount, ", "")
modals = modals.replace("employeeTransactions, employees", "employeeSpecificTransactions, portfolioCekler, employees, handleOpenCreateEmployee, handleOpenCreateTx, handleTxTypeChange")

with open("src/components/calisanlar/CalisanlarModals.tsx", "w") as f:
    f.write(modals)
