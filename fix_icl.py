with open("src/components/KasaView.tsx", "r") as f:
    view = f.read()

view = view.replace("handleDeleteTx={handleDeleteTx}", "")

with open("src/components/KasaView.tsx", "w") as f:
    f.write(view)

with open("src/components/kasa/InteractiveCashLedger.tsx", "r") as f:
    icl = f.read()

icl = icl.replace("handleDeleteTx,", "")
icl = icl.replace("selectedAccountId !== 'all' ? selectedAccountId : accountFilter", "selectedAccountId")
icl = icl.replace("setAccountFilter('all');", "")
icl = icl.replace("setAccountFilter(val);", "")

with open("src/components/kasa/InteractiveCashLedger.tsx", "w") as f:
    f.write(icl)

