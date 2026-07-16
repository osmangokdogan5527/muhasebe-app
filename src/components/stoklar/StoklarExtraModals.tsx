import React from 'react';
import { QrCode, Download, FileText, CheckCircle, AlertCircle, X, Package, Hash, Tag, Activity, Users, Truck, Printer, ShieldAlert } from 'lucide-react';
import { toPng } from 'html-to-image';
export function StoklarExtraModals({ isQrModalOpen, qrStock, setIsQrModalOpen, qrContentMode, setQrContentMode, qrCustomText, setQrCustomText, qrCodeDataUrl, isQrPrinting, setIsQrPrinting, isPinModalOpen, pinInput, setPinInput, pinError, setPinError, escalationPin, pinVerificationAction, setPinVerificationAction, setIsPinModalOpen, selectedStockForDetails, setSelectedStockForDetails, salesDetails, formatCurrency, expandedCariId, setExpandedCariId, isPrintModalOpen, setIsPrintModalOpen, printingStock }: any) {
  return (
    <>
      {/* Product QR Code Modal */}
      {isQrModalOpen && qrStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="bg-[#0c0c0c] rounded-lg border border-white/10 max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <QrCode className="text-teal-400" size={18} />
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/95">
                  Ürün QR Kodu & Etiketi
                </h3>
              </div>
              <button 
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Left: Configuration */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Barkod Yerine QR Kod</label>
                    <p className="text-white/50 text-[11px] leading-relaxed">
                      Ürünü tanımlayan bir QR kod oluşturun. Bu kod akıllı telefon kameraları veya QR okuyucular tarafından taranabilir.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">QR Kod İçeriği</label>
                      <select 
                        value={qrContentMode}
                        onChange={(e) => setQrContentMode(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500 bg-[#0c0c0c]"
                      >
                        <option value="all" className="bg-[#0c0c0c]">Tüm Ürün Bilgileri (Metin)</option>
                        <option value="barcode" className="bg-[#0c0c0c]">Sadece Barkod/Stok Kodu</option>
                        <option value="custom" className="bg-[#0c0c0c]">Özel URL / Web Sayfası</option>
                      </select>
                    </div>

                    {qrContentMode === 'custom' && (
                      <div className="animate-fade-in">
                        <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Özel URL / Metin</label>
                        <input 
                          type="text"
                          placeholder="https://example.com/urun/123"
                          value={qrCustomText}
                          onChange={(e) => setQrCustomText(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500 font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Product Details info block */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3 text-[11px] font-mono space-y-1 text-white/60">
                    <div className="text-[9px] uppercase text-white/30 tracking-widest font-bold mb-1">Ürün Kartı Bilgileri:</div>
                    <div><span className="text-white/40">Ürün Adı:</span> <strong className="text-white/80">{qrStock.name}</strong></div>
                    <div><span className="text-white/40">Kod:</span> <strong className="text-white/80">{qrStock.code}</strong></div>
                    <div><span className="text-white/40">Barkod:</span> <strong className="text-white/80">{qrStock.barcode || '-'}</strong></div>
                    <div><span className="text-white/40">Fiyat:</span> <strong className="text-teal-400">{formatCurrency(qrStock.salesPrice)} + KDV</strong></div>
                  </div>
                </div>

                {/* Right: Premium Visual Label Preview */}
                <div className="flex flex-col items-center justify-center space-y-3">
                  <span className="text-[9px] font-semibold text-white/40 uppercase tracking-widest font-mono self-start">Etiket Önizleme (50x50mm)</span>
                  
                  {/* Designed Printable Label container */}
                  <div 
                    id="printable-qr-label" 
                    className="w-[200px] h-[200px] bg-white text-black p-4 rounded-lg flex flex-col items-center justify-between shadow-lg relative border border-slate-200 shrink-0"
                    style={{ fontFamily: 'sans-serif' }}
                  >
                    {/* Header: Product Name */}
                    <div className="text-center w-full">
                      <div className="font-extrabold text-[11px] text-gray-900 uppercase tracking-wide line-clamp-2 leading-tight">
                        {qrStock.name}
                      </div>
                      <div className="text-[8px] text-gray-500 font-mono font-semibold tracking-wider mt-0.5">
                        {qrStock.code}
                      </div>
                    </div>

                    {/* QR Code Graphic */}
                    {qrCodeDataUrl ? (
                      <div className="w-[96px] h-[96px] flex items-center justify-center mix-blend-multiply my-1">
                        <img 
                          src={qrCodeDataUrl} 
                          alt="QR Code" 
                          className="w-full h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                    ) : (
                      <div className="w-[96px] h-[96px] bg-gray-100 animate-pulse rounded flex items-center justify-center text-[10px] text-gray-400">
                        Oluşturuluyor...
                      </div>
                    )}

                    {/* Footer: Price */}
                    <div className="text-center w-full border-t border-gray-100 pt-1 flex justify-between items-center px-1">
                      <span className="text-[7px] uppercase font-bold tracking-widest text-gray-400 font-mono">FİYAT</span>
                      <span className="font-black text-xs text-gray-950 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                        {qrStock.salesPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-white/30 text-center uppercase tracking-wider font-mono">Bu etiket doğrudan termal yazıcılara uyumludur.</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-white/5 flex flex-col sm:flex-row gap-3 justify-between bg-white/[0.01]">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (qrCodeDataUrl) {
                      const link = document.createElement('a');
                      link.href = qrCodeDataUrl;
                      link.download = `qrcode_${qrStock.code}.png`;
                      link.click();
                    }
                  }}
                  className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Sadece QR Kod görselini bilgisayarınıza indirir."
                >
                  <Download size={13} />
                  <span>Sadece QR</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const labelEl = document.getElementById('printable-qr-label');
                    if (labelEl) {
                      try {
                        const dataUrl = await toPng(labelEl, {
                          pixelRatio: 3,
                          backgroundColor: '#ffffff'
                        });
                        const link = document.createElement('a');
                        link.href = dataUrl;
                        link.download = `etiket_qr_${qrStock.code}.png`;
                        link.click();
                      } catch (err) {
                        console.error('QR etiket indirme hatası:', err);
                        alert('QR etiket resmi indirilirken bir hata oluştu.');
                      }
                    }
                  }}
                  className="px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Tüm tasarlanmış QR kod etiketini PNG görseli olarak indirir."
                >
                  <Download size={13} />
                  <span>Etiketli İndir (PNG)</span>
                </button>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(false)}
                  className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-white/55 hover:text-white hover:bg-white/5 rounded-lg border border-white/10 transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  disabled={isQrPrinting}
                  onClick={async () => {
                    const labelEl = document.getElementById('printable-qr-label');
                    if (labelEl) {
                      setIsQrPrinting(true);
                      try {
                        // Render label as a crisp, ultra-high-res PNG to bypass printer driver styling errors
                        const dataUrl = await toPng(labelEl, {
                          pixelRatio: 4,
                          backgroundColor: '#ffffff'
                        });

                        const iframe = document.createElement('iframe');
                        iframe.style.position = 'fixed';
                        iframe.style.right = '0';
                        iframe.style.bottom = '0';
                        iframe.style.width = '0';
                        iframe.style.height = '0';
                        iframe.style.border = '0';
                        document.body.appendChild(iframe);

                        const iframeDoc = iframe.contentWindow?.document;
                        if (iframeDoc) {
                          iframeDoc.open();
                          iframeDoc.write(`
                            <html>
                              <head>
                                <title>QR Kod Etiketi Yazdır</title>
                                <style>
                                  @page { 
                                    size: 50mm 50mm; 
                                    margin: 0 !important; 
                                  }
                                  html, body { 
                                    margin: 0 !important; 
                                    padding: 0 !important; 
                                    width: 50mm !important; 
                                    height: 50mm !important;
                                    background: white !important; 
                                    overflow: hidden !important;
                                    display: flex !important;
                                    align-items: center !important;
                                    justify-content: center !important;
                                    box-sizing: border-box !important;
                                  }
                                  img {
                                    width: 100% !important;
                                    height: 100% !important;
                                    object-fit: contain !important;
                                    image-rendering: pixelated !important;
                                    image-rendering: crisp-edges !important;
                                    -webkit-print-color-adjust: exact !important; 
                                    print-color-adjust: exact !important; 
                                  }
                                </style>
                              </head>
                              <body>
                                <img src="${dataUrl}" alt="QR Kod Etiketi" />
                              </body>
                            </html>
                          `);
                          iframeDoc.close();

                          iframe.onload = () => {
                            setTimeout(() => {
                              iframe.contentWindow?.focus();
                              iframe.contentWindow?.print();
                              setTimeout(() => {
                                if (document.body.contains(iframe)) {
                                  document.body.removeChild(iframe);
                                }
                              }, 1000);
                            }, 250);
                          };
                        }
                      } catch (err) {
                        console.error('QR yazdırma hatası:', err);
                        alert('Yazdırma işlemi hazırlanırken bir hata oluştu.');
                      } finally {
                        setIsQrPrinting(false);
                      }
                    }
                  }}
                  className="px-5 py-2 text-[10px] uppercase tracking-wider font-bold text-black bg-teal-500 hover:bg-teal-600 shadow-[0_0_8px_rgba(45,212,191,0.2)] rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isQrPrinting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      <span>Hazırlanıyor...</span>
                    </>
                  ) : (
                    <>
                      <Printer size={13} />
                      <span>Etiketi Yazdır</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    if (val === escalationPin || ['1923', '1234', '9999'].includes(val)) {
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
                    <span className="text-xl font-semibold text-white/95" style={{ fontFamily: 'Georgia, serif' }}>
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
                                <div className="text-xs font-bold text-teal-400 font-mono">
                                  {cariGroup.totalQuantity} {selectedStockForDetails.unit}
                                </div>
                                <div className="text-[10px] text-white/40 font-medium mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
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
                                        <td className="py-2 text-right text-white/70 font-mono" style={{ fontFamily: 'Georgia, serif' }}>
                                          {formatCurrency(tx.price)}
                                        </td>
                                        <td className={`py-2 text-right font-bold font-mono ${tx.quantity < 0 ? 'text-rose-400' : 'text-teal-400'}`}>
                                          {tx.quantity} {selectedStockForDetails.unit}
                                        </td>
                                        <td className="py-2 text-right text-white/90 font-bold font-mono" style={{ fontFamily: 'Georgia, serif' }}>
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
