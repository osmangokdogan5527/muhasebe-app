import re

with open("src/components/KasaView.tsx", "r") as f:
    content = f.read()

m1_start = content.find("{/* MODAL: ADD/EDIT ACCOUNT */}")
if m1_start == -1:
    m1_start = content.find("{isAccountModalOpen && (")

m2_start = content.find("{isTxModalOpen && (")
end_str = content.rfind("</div>")

print(m1_start, m2_start, end_str)

if m1_start != -1 and end_str != -1:
    modal_code = content[m1_start:end_str]
    # We will just write it to a single modals file to make it easier to import
    with open("src/components/kasa/KasaModals.tsx", "w") as f:
        f.write("import React from 'react';\n")
        f.write("import { X } from 'lucide-react';\n")
        f.write("import { BankAccount, AccountTransaction } from '../../types';\n\n")
        
        f.write("export function KasaModals({ isAccountModalOpen, isTxModalOpen, editingAccount, editingTx, accountFormData, txFormData, formError, isSubmitting, setIsAccountModalOpen, setIsTxModalOpen, setEditingAccount, setEditingTx, setAccountFormData, setTxFormData, handleAccountSubmit, handleTxSubmit, handleDeleteTx }) {\n")
        f.write("  return (\n    <>\n")
        f.write("      " + modal_code.replace("\n", "\n      "))
        f.write("\n    </>\n  );\n}\n")

    # Now replace the calls in KasaView.tsx
    new_content = content[:m1_start]
    new_content += "      <KasaModals \n"
    new_content += "        isAccountModalOpen={isAccountModalOpen}\n"
    new_content += "        isTxModalOpen={isTxModalOpen}\n"
    new_content += "        editingAccount={editingAccount}\n"
    new_content += "        editingTx={editingTx}\n"
    new_content += "        accountFormData={accountFormData}\n"
    new_content += "        txFormData={txFormData}\n"
    new_content += "        formError={formError}\n"
    new_content += "        isSubmitting={isSubmitting}\n"
    new_content += "        setIsAccountModalOpen={setIsAccountModalOpen}\n"
    new_content += "        setIsTxModalOpen={setIsTxModalOpen}\n"
    new_content += "        setEditingAccount={setEditingAccount}\n"
    new_content += "        setEditingTx={setEditingTx}\n"
    new_content += "        setAccountFormData={setAccountFormData}\n"
    new_content += "        setTxFormData={setTxFormData}\n"
    new_content += "        handleAccountSubmit={handleAccountSubmit}\n"
    new_content += "        handleTxSubmit={handleTxSubmit}\n"
    new_content += "        handleDeleteTx={handleDeleteTx}\n"
    new_content += "      />\n"
    new_content += "    " + content[end_str:]
    
    # Also add import
    new_content = "import { KasaModals } from './kasa/KasaModals';\n" + new_content
    
    with open('src/components/KasaView.tsx', 'w') as f:
        f.write(new_content)
    print(f"Extracted from line {m1_start} to {end_str}")
else:
    print("Could not find bounds")
