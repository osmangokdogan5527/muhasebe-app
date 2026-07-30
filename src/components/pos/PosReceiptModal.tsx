import React, { useRef } from 'react';
import { PosSaleSummary } from '../../types/pos';
import { Printer, X, Check, ShieldCheck } from 'lucide-react';
import { reportErrorToTelegram } from '../../utils/telegramLogger';

interface PosReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleSummary: PosSaleSummary | null;
  companyName?: string;
}

export const PosReceiptModal: React.FC<PosReceiptModalProps> = ({
  isOpen,
  onClose,
  saleSummary,
  companyName = 'STORM MUHASEBE VE PERAKENDE',
}) => {
  if (!isOpen || !saleSummary) return null;

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    try {
      const content = printRef.current;
      if (!content) return;

      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) {
        window.print();
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Fiş - ${saleSummary.receiptNo}</title>
            <style>
              body {
                font-family: 'Courier New', Courier, monospace;
                width: 78mm;
                margin: 0 auto;
                padding: 10px;
                font-size: 12px;
                color: #000;
                background: #fff;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
              .border-b { border-bottom: 1px dashed #000; margin: 8px 0; }
              .border-t { border-top: 1px dashed #000; margin: 8px 0; }
              .flex { display: flex; justify-content: space-between; }
              table { width: 100%; border-collapse: collapse; margin: 8px 0; }
              th, td { text-align: left; padding: 3px 0; font-size: 11px; }
            </style>
          </head>
          <body>
            ${content.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosReceiptModal:handlePrint');
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-white/10 flex items-center justify-between shrink-0">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Printer size={16} className="text-teal-400" />
            <span>Satış Fişi / Önizleme</span>
          </h4>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* RECEIPT PAPER CONTAINER */}
        <div className="p-6 bg-slate-950/60 overflow-y-auto flex-1 custom-scrollbar">
          <div
            ref={printRef}
            className="p-5 bg-white text-slate-900 rounded-lg shadow-lg font-mono text-xs space-y-3 leading-snug border border-slate-200"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            {/* BAŞLIK VE FİRMA */}
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-400">
              <h3 className="font-bold text-sm tracking-tight text-black">{companyName}</h3>
              <p className="text-[10px] text-slate-600">Hızlı Satış & Perakende Fişi</p>
              <div className="text-[10px] text-slate-500 pt-1">
                <span>Fiş No: {saleSummary.receiptNo}</span>
                <br />
                <span>Tarih: {saleSummary.date} {saleSummary.time}</span>
              </div>
            </div>

            {/* MÜŞTERİ BİLGİSİ */}
            <div className="text-[11px] py-1 border-b border-dashed border-slate-300">
              <span>Müşteri: <strong>{saleSummary.cariName}</strong></span>
            </div>

            {/* KALEMLER TABLOSU */}
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-400 text-[10px] uppercase">
                  <th className="py-1">Ürün</th>
                  <th className="text-center">Miktar</th>
                  <th className="text-right">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {saleSummary.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-1.5 pr-1">
                      <div className="font-bold truncate max-w-[130px]">{item.stockName}</div>
                      <div className="text-[9px] text-slate-500">
                        ₺{item.unitPrice.toFixed(2)} x %{item.taxRate} KDV
                      </div>
                    </td>
                    <td className="text-center font-bold">{item.quantity}</td>
                    <td className="text-right font-bold">
                      ₺{item.totalLine.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOPLAMLAR & ÖDEME KIRILIMLARI */}
            <div className="pt-2 border-t border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Ara Toplam:</span>
                <span>₺{saleSummary.subtotal.toFixed(2)}</span>
              </div>
              {saleSummary.totalDiscount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Toplam İskonto:</span>
                  <span>-₺{saleSummary.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>KDV Matrahı/Vergi:</span>
                <span>₺{saleSummary.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-800 text-black">
                <span>GENEL TOPLAM:</span>
                <span>₺{saleSummary.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* ÖDEME TİPLERİ */}
            <div className="pt-2 border-t border-dashed border-slate-300 text-[10px] space-y-0.5">
              <span className="font-bold block">Ödeme Detayı:</span>
              {saleSummary.paymentSplit.cashAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>• Nakit Ödenen:</span>
                  <span>₺{saleSummary.paymentSplit.cashAmount.toFixed(2)}</span>
                </div>
              )}
              {saleSummary.paymentSplit.changeGiven > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>  (Para Üstü Verildi):</span>
                  <span>₺{saleSummary.paymentSplit.changeGiven.toFixed(2)}</span>
                </div>
              )}
              {saleSummary.paymentSplit.posAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>• Kredi Kartı (POS):</span>
                  <span>₺{saleSummary.paymentSplit.posAmount.toFixed(2)}</span>
                </div>
              )}
              {saleSummary.paymentSplit.openAccountAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>• Açık Hesap (Veresiye):</span>
                  <span>₺{saleSummary.paymentSplit.openAccountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* FOOTER & TEŞEKKÜR */}
            <div className="text-center pt-3 text-[10px] text-slate-500 border-t border-dashed border-slate-300">
              <p className="font-bold">Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz!</p>
              <p className="text-[9px] mt-0.5">Storm Muhasebe POS Altyapısı ile Üretilmiştir</p>
            </div>
          </div>
        </div>

        {/* MODAL ACTIONS */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-white/10 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Kapat
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Printer size={16} />
            Yazdır (80mm Fiş)
          </button>
        </div>
      </div>
    </div>
  );
};
