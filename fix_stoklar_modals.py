with open("src/components/stoklar/StoklarExtraModals.tsx", "r") as f:
    modals = f.read()

# Fix imports
import_line = "import { QrCode, Download, FileText, CheckCircle, AlertCircle, X, Package, Hash, Tag, Activity, Users, Truck, Printer, ShieldAlert } from 'lucide-react';\nimport { toPng } from 'html-to-image';\n"
modals = modals.replace("import { QrCode, Download, FileText, CheckCircle, AlertCircle, X, Package, Hash, Tag, Activity, Users, Truck } from 'lucide-react';\n", import_line)

# Fix signature
old_sig = "export function StoklarExtraModals({ isQrModalOpen, qrStock, setIsQrModalOpen, handleDownloadQrCode, isPinModalOpen, pinCode, setPinCode, pinError, handleVerifyPin, setIsPinModalOpen, selectedStockForDetails, setSelectedStockForDetails, filteredDeliveryHistory, formatCurrency, formatMoney, expandedCariId, setExpandedCariId, isPrintModalOpen, setIsPrintModalOpen, printingStock }: any) {"
new_sig = "export function StoklarExtraModals({ isQrModalOpen, qrStock, setIsQrModalOpen, qrContentMode, setQrContentMode, qrCustomText, setQrCustomText, qrCodeDataUrl, isQrPrinting, setIsQrPrinting, isPinModalOpen, pinInput, setPinInput, pinError, setPinError, escalationPin, pinVerificationAction, setPinVerificationAction, handleVerifyPin, setIsPinModalOpen, selectedStockForDetails, setSelectedStockForDetails, salesDetails, formatCurrency, expandedCariId, setExpandedCariId, isPrintModalOpen, setIsPrintModalOpen, printingStock }: any) {"

modals = modals.replace(old_sig, new_sig)
modals = modals.replace("pinCode", "pinInput")
modals = modals.replace("setPinCode", "setPinInput")
# Fix one stray pinError
modals = modals.replace("pinError=", "pinError={pinError}") # wait, it might be setPinError(true) not sure.

with open("src/components/stoklar/StoklarExtraModals.tsx", "w") as f:
    f.write(modals)

with open("src/components/StoklarView.tsx", "r") as f:
    view = f.read()

# Fix view call
old_call = """      <StoklarExtraModals 
        isQrModalOpen={isQrModalOpen}
        qrStock={qrStock}
        setIsQrModalOpen={setIsQrModalOpen}
        handleDownloadQrCode={handleDownloadQrCode}
        isPinModalOpen={isPinModalOpen}
        pinCode={pinCode}
        setPinCode={setPinCode}
        pinError={pinError}
        handleVerifyPin={handleVerifyPin}
        setIsPinModalOpen={setIsPinModalOpen}
        selectedStockForDetails={selectedStockForDetails}
        setSelectedStockForDetails={setSelectedStockForDetails}
        filteredDeliveryHistory={filteredDeliveryHistory}
        formatCurrency={formatCurrency}
        formatMoney={formatMoney}
        expandedCariId={expandedCariId}
        setExpandedCariId={setExpandedCariId}
        isPrintModalOpen={isPrintModalOpen}
        setIsPrintModalOpen={setIsPrintModalOpen}
        printingStock={printingStock}
      />"""

new_call = """      <StoklarExtraModals 
        isQrModalOpen={isQrModalOpen}
        qrStock={qrStock}
        setIsQrModalOpen={setIsQrModalOpen}
        qrContentMode={qrContentMode}
        setQrContentMode={setQrContentMode}
        qrCustomText={qrCustomText}
        setQrCustomText={setQrCustomText}
        qrCodeDataUrl={qrCodeDataUrl}
        isQrPrinting={isQrPrinting}
        setIsQrPrinting={setIsQrPrinting}
        isPinModalOpen={isPinModalOpen}
        pinInput={pinInput}
        setPinInput={setPinInput}
        pinError={pinError}
        setPinError={setPinError}
        escalationPin={escalationPin}
        pinVerificationAction={pinVerificationAction}
        setPinVerificationAction={setPinVerificationAction}
        handleVerifyPin={handleVerifyPin}
        setIsPinModalOpen={setIsPinModalOpen}
        selectedStockForDetails={selectedStockForDetails}
        setSelectedStockForDetails={setSelectedStockForDetails}
        salesDetails={salesDetails}
        formatCurrency={formatCurrency}
        expandedCariId={expandedCariId}
        setExpandedCariId={setExpandedCariId}
        isPrintModalOpen={isPrintModalOpen}
        setIsPrintModalOpen={setIsPrintModalOpen}
        printingStock={printingStock}
      />"""

view = view.replace(old_call, new_call)

with open("src/components/StoklarView.tsx", "w") as f:
    f.write(view)

