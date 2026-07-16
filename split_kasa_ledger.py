with open("src/components/KasaView.tsx", "r") as f:
    content = f.read()

start_idx = content.find("      {/* Interactive Cash Ledger */}")
end_idx = content.find("      <KasaModals ")

print("Start:", start_idx)
print("End:", end_idx)

if start_idx != -1 and end_idx != -1:
    ledger_code = content[start_idx:end_idx]
    
    with open("src/components/kasa/InteractiveCashLedger.tsx", "w") as f:
        f.write("import React from 'react';\n")
        f.write("import { Search, Edit, Trash2 } from 'lucide-react';\n")
        f.write("export function InteractiveCashLedger({ searchTerm, setSearchTerm, accountFilter, setAccountFilter, dateFilter, setDateFilter, filteredMoves, bankAccounts, setEditingAccount, setIsTxModalOpen, handleDeleteTx, formatCurrency }: any) {\n")
        f.write("  return (\n    <>\n      ")
        f.write(ledger_code)
        f.write("\n    </>\n  );\n}\n")
    
    new_content = content[:start_idx]
    new_content += "      <InteractiveCashLedger \n"
    new_content += "        searchTerm={searchTerm}\n"
    new_content += "        setSearchTerm={setSearchTerm}\n"
    new_content += "        accountFilter={accountFilter}\n"
    new_content += "        setAccountFilter={setAccountFilter}\n"
    new_content += "        dateFilter={dateFilter}\n"
    new_content += "        setDateFilter={setDateFilter}\n"
    new_content += "        filteredMoves={filteredMoves}\n"
    new_content += "        bankAccounts={bankAccounts}\n"
    new_content += "        setEditingAccount={setEditingAccount}\n"
    new_content += "        setIsTxModalOpen={setIsTxModalOpen}\n"
    new_content += "        handleDeleteTx={handleDeleteTx}\n"
    new_content += "        formatCurrency={formatCurrency}\n"
    new_content += "      />\n"
    new_content += "      " + content[end_idx:]

    new_content = "import { InteractiveCashLedger } from './kasa/InteractiveCashLedger';\n" + new_content
    
    with open("src/components/KasaView.tsx", "w") as f:
        f.write(new_content)

