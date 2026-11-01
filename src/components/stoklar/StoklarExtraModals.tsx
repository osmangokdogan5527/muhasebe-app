import React from 'react';
import { QrCode, Download, FileText, CheckCircle, AlertCircle, X, Package, Hash, Tag, Activity, Users, Truck, Printer, ShieldAlert } from 'lucide-react';
import { alertDialog } from '../../utils/dialogs';
export function StoklarExtraModals({ isPinModalOpen, pinInput, setPinInput, pinError, setPinError, escalationPin, pinVerificationAction, setPinVerificationAction, setIsPinModalOpen, selectedStockForDetails, setSelectedStockForDetails, salesDetails, formatCurrency, expandedCariId, setExpandedCariId }: any) {
  return (
    <>
      {/* PIN Verification Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={24} />
            </div>
            
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Yönetici Doğrulaması</h3>
            <p className="text-xs text-white/60 mt-1 mb-6">
              Bu kritik işlemi gerçekleştirmek için 4 haneli Yönetici PIN kodunu giriniz.
            </p>

            <div className="space-y-4">
              <input
                type="password"
                maxLength={4}
                value={pinInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPinInput(val);
                  setPinError('');
                  
                  if (val.length === 4) {
                    if (val === escalationPin) {
                      setIsPinModalOpen(false);
                      if (pinVerificationAction) {
                        pinVerificationAction();
                      }
                    } else {
                      setPinError('Hatalı Yönetici PIN kodu!');
                    }
                  }
                }}
                placeholder="••••"
                className="w-full bg-white/5 border border-white/10 focus:border-orange-500 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.6em] text-white transition outline-none font-mono"
                autoFocus
              />

              {pinError && (
                <p className="text-xs font-bold text-rose-400">{pinError}</p>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsPinModalOpen(false);
                  setPinVerificationAction(null);
                }}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-bold uppercase tracking-wider transition border border-white/10"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details & Delivery History Modal */}
      {selectedStockForDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-start bg-white/[0.01]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono tracking-widest font-bold text-teal-400 uppercase bg-teal-500/10 px-2 py-0.5 rounded">
                    STOK TESLİMAT GEÇMİŞİ
                  </span>
                  <span className="text-[10px] font-mono tracking-wider text-white/40">
                    {selectedStockForDetails.code}
                  </span>
                </div>
                <h3 className="text-base font-extrabold tracking-tight text-white leading-tight">
                  {selectedStockForDetails.name}
                </h3>
                {(selectedStockForDetails.category || selectedStockForDetails.brand) && (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {selectedStockForDetails.category && (
                      <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold font-sans">
                        Kategori: {selectedStockForDetails.category}
                      </span>
                    )}
                    {selectedStockForDetails.brand && (
                      <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold font-sans">
                        Marka: {selectedStockForDetails.brand}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedStockForDetails(null);
                  setExpandedCariId(null);
                }}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Container */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
              {/* Summary Widgets */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#111111] p-4 rounded-xl border border-white/5 shadow-md">
                  <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase block">Toplam Verilen</span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-xl font-bold text-teal-400">
                      {salesDetails.reduce((sum, g) => sum + g.totalQuantity, 0)}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">
                      {selectedStockForDetails.unit}
                    </span>
                  </div>
                </div>

                <div className="bg-[#111111] p-4 rounded-xl border border-white/5 shadow-md">
                  <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase block">Toplam Ciro (Brüt)</span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-xl font-bold text-white/95 font-sans tabular-nums">
                      {formatCurrency(salesDetails.reduce((sum, g) => sum + g.totalAmount, 0))}
                    </span>
                  </div>
                </div>

                <div className="bg-[#111111] p-4 rounded-xl border border-white/5 shadow-md">
                  <span className="text-[9px] font-mono tracking-widest font-bold text-white/40 uppercase block">Müşteri Sayısı</span>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-xl font-bold text-teal-400">
                      {salesDetails.length}
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">Cari</span>
                  </div>
                </div>
              </div>

              {/* List Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-mono tracking-wider font-bold text-white/50 uppercase">
                  MÜŞTERI BAZLI DAĞILIM VE ADETLER
                </h4>

                {salesDetails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center bg-[#111111] rounded-xl border border-white/5 p-6">
                    <Package className="text-white/15 mb-3 animate-pulse" size={32} />
                    <p className="text-xs text-white/50 max-w-xs font-sans">
                      Bu ürüne ait herhangi bir satış veya teslimat hareketi bulunmamaktadır.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {salesDetails.map((cariGroup) => {
                      const isExpanded = expandedCariId === cariGroup.cariId;
                      return (
                        <div 
                          key={cariGroup.cariId} 
                          className="bg-[#111111] rounded-xl border border-white/5 overflow-hidden transition"
                        >
                          {/* Row Header Clickable to Toggle Breakdown */}
                          <div 
                            onClick={() => setExpandedCariId(isExpanded ? null : cariGroup.cariId)}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition select-none"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center text-xs font-bold font-mono">
                                {cariGroup.cariName.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white/95">{cariGroup.cariName}</div>
                                <div className="text-[9px] text-white/40 font-mono mt-0.5 tracking-wider uppercase">
                                  {cariGroup.transactions.length} Farklı İşlem
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <div className="text-xs font-bold text-teal-400 font-sans tabular-nums">
                                  {cariGroup.totalQuantity} {selectedStockForDetails.unit}
                                </div>
                                <div className="text-[10px] text-white/40 font-medium mt-0.5 font-sans tabular-nums">
                                  {formatCurrency(cariGroup.totalAmount)}
                                </div>
                              </div>
                              <div className="text-white/30 hover:text-white transition">
                                <svg 
                                  className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Collapsible Details */}
                          {isExpanded && (
                            <div className="border-t border-white/5 bg-white/[0.01] p-4 space-y-2.5 animate-fade-in">
                              <div className="text-[9px] font-mono tracking-wider font-bold text-white/40 uppercase mb-2">
                                İşlem Detayları ve Tarihleri
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px] border-collapse">
                                  <thead>
                                    <tr className="text-white/30 border-b border-white/5 pb-1 font-mono uppercase tracking-widest text-[9px]">
                                      <th className="pb-2 font-semibold">Tarih</th>
                                      <th className="pb-2 font-semibold">Evrak/Fatura No</th>
                                      <th className="pb-2 font-semibold text-center">İşlem Tipi</th>
                                      <th className="pb-2 font-semibold text-right">Birim Fiyat</th>
                                      <th className="pb-2 font-semibold text-right">Miktar</th>
                                      <th className="pb-2 font-semibold text-right">Toplam</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                    {cariGroup.transactions.map((tx, idx) => (
                                      <tr key={tx.id || idx} className="text-white/80 hover:bg-white/5 transition">
                                        <td className="py-2 text-white/65 font-mono">{tx.date}</td>
                                        <td className="py-2 text-white/50 font-mono">{tx.invoiceNo || 'Fatura Yok'}</td>
                                        <td className="py-2 text-center">
                                          <span className={`px-1.5 py-0.5 text-[8px] uppercase font-bold tracking-wider rounded-sm ${
                                            tx.type === 'sale_return' 
                                              ? 'bg-rose-500/10 text-rose-400' 
                                              : 'bg-teal-500/10 text-teal-400'
                                          }`}>
                                            {tx.type === 'sale_return' ? 'İade' : 'Satış'}
                                          </span>
                                        </td>
                                        <td className="py-2 text-right text-white/70 font-sans tabular-nums">
                                          {formatCurrency(tx.price)}
                                        </td>
                                        <td className={`py-2 text-right font-bold font-sans tabular-nums ${tx.quantity < 0 ? 'text-rose-400' : 'text-teal-400'}`}>
                                          {tx.quantity} {selectedStockForDetails.unit}
                                        </td>
                                        <td className="py-2 text-right text-white/90 font-bold font-sans tabular-nums">
                                          {formatCurrency(tx.total)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/[0.01] border-t border-white/5 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSelectedStockForDetails(null);
                  setExpandedCariId(null);
                }}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl text-xs font-bold uppercase tracking-wider transition border border-white/10 cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
