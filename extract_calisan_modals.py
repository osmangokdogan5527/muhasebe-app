import re

with open("src/components/CalisanlarView.tsx", "r") as f:
    content = f.read()

m1_start = content.find("{/* MODAL: ADD/EDIT EMPLOYEE CARD */}")
m2_start = content.find("{/* MODAL: ADD/EDIT SALARY CARI TRANSACTION */}")
m3_start = content.find("{/* MODAL: EMPLOYEE CARI DETAIL VIEWER */}")
end_str = content.rfind("</div>")

print(m1_start, m2_start, m3_start, end_str)

if m1_start != -1 and end_str != -1:
    modal_code = content[m1_start:end_str]
    # We will just write it to a single modals file to make it easier to import
    with open("src/components/calisanlar/CalisanlarModals.tsx", "w") as f:
        f.write("import React from 'react';\n")
        f.write("import { X, Users, CreditCard, AlertCircle, FileText, Download, Wallet, Trash2 } from 'lucide-react';\n")
        f.write("import { Employee, EmployeeTransaction } from '../../types';\n\n")
        
        f.write("export function CalisanlarModals({ isEmployeeModalOpen, isTxModalOpen, isDetailModalOpen, editingEmployee, editingTx, selectedEmployee, empFormData, txFormData, formError, isSubmitting, setIsEmployeeModalOpen, setIsTxModalOpen, setIsDetailModalOpen, setEmpFormData, setTxFormData, handleEmployeeSubmit, handleTxSubmit, handleDeleteTx, handleEditTx, formatMoney, convertAmount, employeeBalances, employeeTransactions, employees }) {\n")
        f.write("  return (\n    <>\n")
        f.write("      " + modal_code.replace("\n", "\n      "))
        f.write("\n    </>\n  );\n}\n")

    # Now replace the calls in CalisanlarView.tsx
    new_content = content[:m1_start]
    new_content += "      <CalisanlarModals \n"
    new_content += "        isEmployeeModalOpen={isEmployeeModalOpen}\n"
    new_content += "        isTxModalOpen={isTxModalOpen}\n"
    new_content += "        isDetailModalOpen={isDetailModalOpen}\n"
    new_content += "        editingEmployee={editingEmployee}\n"
    new_content += "        editingTx={editingTx}\n"
    new_content += "        selectedEmployee={selectedEmployee}\n"
    new_content += "        empFormData={empFormData}\n"
    new_content += "        txFormData={txFormData}\n"
    new_content += "        formError={formError}\n"
    new_content += "        isSubmitting={isSubmitting}\n"
    new_content += "        setIsEmployeeModalOpen={setIsEmployeeModalOpen}\n"
    new_content += "        setIsTxModalOpen={setIsTxModalOpen}\n"
    new_content += "        setIsDetailModalOpen={setIsDetailModalOpen}\n"
    new_content += "        setEmpFormData={setEmpFormData}\n"
    new_content += "        setTxFormData={setTxFormData}\n"
    new_content += "        handleEmployeeSubmit={handleEmployeeSubmit}\n"
    new_content += "        handleTxSubmit={handleTxSubmit}\n"
    new_content += "        handleDeleteTx={handleDeleteTx}\n"
    new_content += "        handleEditTx={handleEditTx}\n"
    new_content += "        formatMoney={formatMoney}\n"
    new_content += "        convertAmount={convertAmount}\n"
    new_content += "        employeeBalances={employeeBalances}\n"
    new_content += "        employeeTransactions={employeeTransactions}\n"
    new_content += "        employees={employees}\n"
    new_content += "      />\n"
    new_content += "    " + content[end_str:]
    
    # Also add import
    new_content = "import { CalisanlarModals } from './calisanlar/CalisanlarModals';\n" + new_content
    
    with open('src/components/CalisanlarView.tsx', 'w') as f:
        f.write(new_content)
    print(f"Extracted from line {m1_start} to {end_str}")
else:
    print("Could not find bounds")
