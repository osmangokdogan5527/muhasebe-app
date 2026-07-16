with open("src/components/CekSenetView.tsx", "r") as f:
    content = f.read()

m1_start = content.find("{/* 1. ADD NEW CHEQUE / PROMISSORY NOTE MODAL */}")
end_str = content.rfind("    </div>\n  );\n}")

print("M1 Start:", m1_start)
print("End:", end_str)

if m1_start != -1 and end_str != -1:
    modals_code = content[m1_start:end_str]
    
    with open("src/components/ceksenet/CekSenetModals.tsx", "w") as f:
        f.write("import React from 'react';\n")
        f.write("import { X, FileText, ArrowRightLeft, CreditCard, User, Tag, Calendar, AlertCircle, RefreshCw, Upload, Download } from 'lucide-react';\n")
        f.write("export function CekSenetModals({ isAddModalOpen, setIsAddModalOpen, newItemData, setNewItemData, activeTab, error, bankAccounts, employees, stoklar, handleAddSubmit, isActionModalOpen, setIsActionModalOpen, actionType, setActionType, targetAccount, setTargetAccount, selectedItemForAction, handleExecuteAction }: any) {\n")
        f.write("  return (\n    <>\n      ")
        f.write(modals_code)
        f.write("\n    </>\n  );\n}\n")
    
    new_content = content[:m1_start]
    new_content += "      <CekSenetModals \n"
    new_content += "        isAddModalOpen={isAddModalOpen}\n"
    new_content += "        setIsAddModalOpen={setIsAddModalOpen}\n"
    new_content += "        newItemData={newItemData}\n"
    new_content += "        setNewItemData={setNewItemData}\n"
    new_content += "        activeTab={activeTab}\n"
    new_content += "        error={error}\n"
    new_content += "        bankAccounts={bankAccounts}\n"
    new_content += "        employees={employees}\n"
    new_content += "        stoklar={stoklar}\n"
    new_content += "        handleAddSubmit={handleAddSubmit}\n"
    new_content += "        isActionModalOpen={isActionModalOpen}\n"
    new_content += "        setIsActionModalOpen={setIsActionModalOpen}\n"
    new_content += "        actionType={actionType}\n"
    new_content += "        setActionType={setActionType}\n"
    new_content += "        targetAccount={targetAccount}\n"
    new_content += "        setTargetAccount={setTargetAccount}\n"
    new_content += "        selectedItemForAction={selectedItemForAction}\n"
    new_content += "        handleExecuteAction={handleExecuteAction}\n"
    new_content += "      />\n"
    new_content += content[end_str:]

    new_content = "import { CekSenetModals } from './ceksenet/CekSenetModals';\n" + new_content
    
    with open("src/components/CekSenetView.tsx", "w") as f:
        f.write(new_content)

