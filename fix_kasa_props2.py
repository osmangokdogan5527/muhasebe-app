import re

with open("src/components/KasaView.tsx", "r") as f:
    content = f.read()

# remove those from KasaView.tsx call
to_remove = [
    "editingTx={editingTx}",
    "accountFormData={accountFormData}",
    "txFormData={txFormData}",
    "formError={formError}",
    "isSubmitting={isSubmitting}",
    "setEditingTx={setEditingTx}",
    "setAccountFormData={setAccountFormData}",
    "setTxFormData={setTxFormData}",
    "handleAccountSubmit={handleAccountSubmit}",
    "handleTxSubmit={handleTxSubmit}",
    "handleDeleteTx={handleDeleteTx}"
]

for r in to_remove:
    content = content.replace(r + "\n        ", "")
    content = content.replace("        " + r + "\n", "")

with open("src/components/KasaView.tsx", "w") as f:
    f.write(content)

with open("src/components/kasa/KasaModals.tsx", "r") as f:
    modals = f.read()

# replace signature in KasaModals
sig_start = "export function KasaModals({"
sig_end = "}) {"

start_idx = modals.find(sig_start)
end_idx = modals.find(sig_end, start_idx) + len(sig_end)

new_sig = "export function KasaModals({ isAccountModalOpen, isTxModalOpen, editingAccount, setIsAccountModalOpen, setIsTxModalOpen, setEditingAccount, accName, setAccName, accType, setAccType, accCurrency, setAccCurrency, accInitBal, setAccInitBal, txType, setTxType, txSourceAcc, setTxSourceAcc, txTargetAcc, setTxTargetAcc, txAmount, setTxAmount, txTargetAmount, setTxTargetAmount, txDesc, setTxDesc, crossRate, setCrossRate, isCrossCurrency, sourceAccData, targetAccData, isFetchingRate, fetchLiveRate, handleSaveAccount, handleSaveTx, bankAccounts }) {"

modals = modals[:start_idx] + new_sig + modals[end_idx:]

with open("src/components/kasa/KasaModals.tsx", "w") as f:
    f.write(modals)
