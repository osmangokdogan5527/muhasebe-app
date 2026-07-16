with open("src/components/StoklarView.tsx", "r") as f:
    content = f.read()

qr_start = content.find("{/* Product QR Code Modal */}")
end_details = content.rfind("    </div>\n  );\n}")

print("QR Start:", qr_start)
print("End Details:", end_details)

if qr_start != -1 and end_details != -1:
    modals_code = content[qr_start:end_details]
    
    with open("src/components/stoklar/StoklarExtraModals.tsx", "w") as f:
        f.write("import React from 'react';\n")
        f.write("import { QrCode, Download, FileText, CheckCircle, AlertCircle, X, Package, Hash, Tag, Activity, Users, Truck } from 'lucide-react';\n")
        f.write("export function StoklarExtraModals({ isQrModalOpen, qrStock, setIsQrModalOpen, handleDownloadQrCode, isPinModalOpen, pinCode, setPinCode, pinError, handleVerifyPin, setIsPinModalOpen, selectedStockForDetails, setSelectedStockForDetails, filteredDeliveryHistory, formatCurrency, formatMoney, expandedCariId, setExpandedCariId, isPrintModalOpen, setIsPrintModalOpen, printingStock }: any) {\n")
        f.write("  return (\n    <>\n      ")
        f.write(modals_code)
        f.write("\n    </>\n  );\n}\n")
    
    new_content = content[:qr_start]
    new_content += "      <StoklarExtraModals \n"
    new_content += "        isQrModalOpen={isQrModalOpen}\n"
    new_content += "        qrStock={qrStock}\n"
    new_content += "        setIsQrModalOpen={setIsQrModalOpen}\n"
    new_content += "        handleDownloadQrCode={handleDownloadQrCode}\n"
    new_content += "        isPinModalOpen={isPinModalOpen}\n"
    new_content += "        pinCode={pinCode}\n"
    new_content += "        setPinCode={setPinCode}\n"
    new_content += "        pinError={pinError}\n"
    new_content += "        handleVerifyPin={handleVerifyPin}\n"
    new_content += "        setIsPinModalOpen={setIsPinModalOpen}\n"
    new_content += "        selectedStockForDetails={selectedStockForDetails}\n"
    new_content += "        setSelectedStockForDetails={setSelectedStockForDetails}\n"
    new_content += "        filteredDeliveryHistory={filteredDeliveryHistory}\n"
    new_content += "        formatCurrency={formatCurrency}\n"
    new_content += "        formatMoney={formatMoney}\n"
    new_content += "        expandedCariId={expandedCariId}\n"
    new_content += "        setExpandedCariId={setExpandedCariId}\n"
    new_content += "        isPrintModalOpen={isPrintModalOpen}\n"
    new_content += "        setIsPrintModalOpen={setIsPrintModalOpen}\n"
    new_content += "        printingStock={printingStock}\n"
    new_content += "      />\n"
    new_content += content[end_details:]

    new_content = "import { StoklarExtraModals } from './stoklar/StoklarExtraModals';\n" + new_content
    
    with open("src/components/StoklarView.tsx", "w") as f:
        f.write(new_content)

