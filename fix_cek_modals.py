with open("src/components/CekSenetView.tsx", "r") as f:
    view = f.read()

# Replace the incorrect call with a comprehensive one
old_call = """      <CekSenetModals 
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        newItemData={newItemData}
        setNewItemData={setNewItemData}
        activeTab={activeTab}
        error={error}
        bankAccounts={bankAccounts}
        employees={employees}
        stoklar={stoklar}
        handleAddSubmit={handleAddSubmit}
        isActionModalOpen={isActionModalOpen}
        setIsActionModalOpen={setIsActionModalOpen}
        actionType={actionType}
        setActionType={setActionType}
        targetAccount={targetAccount}
        setTargetAccount={setTargetAccount}
        selectedItemForAction={selectedItemForAction}
        handleExecuteAction={handleExecuteAction}
      />"""

new_call = """      <CekSenetModals 
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        formError={formError}
        type={type}
        setType={setType}
        docType={docType}
        setDocType={setDocType}
        portfolioNo={portfolioNo}
        setPortfolioNo={setPortfolioNo}
        serialNo={serialNo}
        setSerialNo={setSerialNo}
        debtor={debtor}
        setDebtor={setDebtor}
        selectedCariId={selectedCariId}
        setSelectedCariId={setSelectedCariId}
        amount={amount}
        setAmount={setAmount}
        currency={currency}
        setCurrency={setCurrency}
        issueDate={issueDate}
        setIssueDate={setIssueDate}
        dueDate={dueDate}
        setDueDate={setDueDate}
        bankName={bankName}
        setBankName={setBankName}
        bankBranch={bankBranch}
        setBankBranch={setBankBranch}
        accountNo={accountNo}
        setAccountNo={setAccountNo}
        status={status}
        setStatus={setStatus}
        description={description}
        setDescription={setDescription}
        affectCariBalance={affectCariBalance}
        setAffectCariBalance={setAffectCariBalance}
        exchangeRate={exchangeRate}
        setExchangeRate={setExchangeRate}
        customConvertedAmount={customConvertedAmount}
        setCustomConvertedAmount={setCustomConvertedAmount}
        isMultiCurrency={isMultiCurrency}
        setIsMultiCurrency={setIsMultiCurrency}
        isConvertedAmountEdited={isConvertedAmountEdited}
        setIsConvertedAmountEdited={setIsConvertedAmountEdited}
        isActionModalOpen={isActionModalOpen}
        setIsActionModalOpen={setIsActionModalOpen}
        selectedItem={selectedItem}
        setSelectedItem={setSelectedItem}
        actionType={actionType}
        setActionType={setActionType}
        endorseCariId={endorseCariId}
        setEndorseCariId={setEndorseCariId}
        endorseExchangeRate={endorseExchangeRate}
        setEndorseExchangeRate={setEndorseExchangeRate}
        actionAccount={actionAccount}
        setActionAccount={setActionAccount}
        cariler={cariler}
        activeCariCurrency={activeCariCurrency}
        handleSubmit={handleSubmit}
        handleExecuteAction={handleExecuteAction}
      />"""

if old_call in view:
    view = view.replace(old_call, new_call)
else:
    print("Could not find old call!")

with open("src/components/CekSenetView.tsx", "w") as f:
    f.write(view)

with open("src/components/ceksenet/CekSenetModals.tsx", "r") as f:
    modals = f.read()

sig_start = "export function CekSenetModals({"
sig_end = "}: any) {"

start_idx = modals.find(sig_start)
end_idx = modals.find(sig_end, start_idx) + len(sig_end)

new_sig = "export function CekSenetModals({ isModalOpen, setIsModalOpen, formError, type, setType, docType, setDocType, portfolioNo, setPortfolioNo, serialNo, setSerialNo, debtor, setDebtor, selectedCariId, setSelectedCariId, amount, setAmount, currency, setCurrency, issueDate, setIssueDate, dueDate, setDueDate, bankName, setBankName, bankBranch, setBankBranch, accountNo, setAccountNo, status, setStatus, description, setDescription, affectCariBalance, setAffectCariBalance, exchangeRate, setExchangeRate, customConvertedAmount, setCustomConvertedAmount, isMultiCurrency, setIsMultiCurrency, isConvertedAmountEdited, setIsConvertedAmountEdited, isActionModalOpen, setIsActionModalOpen, selectedItem, setSelectedItem, actionType, setActionType, endorseCariId, setEndorseCariId, endorseExchangeRate, setEndorseExchangeRate, actionAccount, setActionAccount, cariler, activeCariCurrency, handleSubmit, handleExecuteAction }: any) {"

modals = modals[:start_idx] + new_sig + modals[end_idx:]
with open("src/components/ceksenet/CekSenetModals.tsx", "w") as f:
    f.write(modals)

