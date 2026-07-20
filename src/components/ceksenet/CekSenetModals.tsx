import React from 'react';
import { X, FileText, ArrowRightLeft, CreditCard, User, Tag, Calendar, AlertCircle, RefreshCw, Upload, Download } from 'lucide-react';
export function CekSenetModals({ isModalOpen, setIsModalOpen, formError, type, setType, docType, setDocType, portfolioNo, setPortfolioNo, serialNo, setSerialNo, debtor, setDebtor, selectedCariId, setSelectedCariId, amount, setAmount, currency, setCurrency, issueDate, setIssueDate, dueDate, setDueDate, bankName, setBankName, bankBranch, setBankBranch, accountNo, setAccountNo, status, setStatus, description, setDescription, affectCariBalance, setAffectCariBalance, exchangeRate, setExchangeRate, tcmbLoading, handleForceTcmbRate, customConvertedAmount, setCustomConvertedAmount, isMultiCurrency, setIsMultiCurrency, isConvertedAmountEdited, setIsConvertedAmountEdited, isActionModalOpen, setIsActionModalOpen, selectedItem, setSelectedItem, actionType, setActionType, endorseCariId, setEndorseCariId, endorseExchangeRate, setEndorseExchangeRate, actionAccount, setActionAccount, cariler, activeCariCurrency, handleSubmit, handleExecuteAction }: any) {
  return (
    <>
      {/* 1. ADD NEW CHEQUE / PROMISSORY NOTE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/95">
                  Yeni Çek veya Senet Girişi
                </h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mt-0.5">
                  Portföye yeni alınan veya kendi verdiğimiz çek/senet kaydını işleme
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
              
              {formError && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded flex items-center gap-2 text-xs text-red-400 font-medium">
                  <AlertCircle size={14} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Direction Type and Document Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Hareket Yönü *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setType('receivable'); setStatus('portfolio'); }}
                      className={`py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition ${
                        type === 'receivable' 
                          ? 'bg-blue-500/10 border-blue-500 text-blue-400 font-bold' 
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      📥 Alınan (Müşteri)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setType('payable'); setStatus('portfolio'); }}
                      className={`py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition ${
                        type === 'payable' 
                          ? 'bg-rose-500/10 border-rose-500 text-rose-400 font-bold' 
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      📤 Verilen (Kendi)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Belge Türü *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDocType('cheque')}
                      className={`py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition ${
                        docType === 'cheque' 
                          ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-bold' 
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      🎫 Çek
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocType('note')}
                      className={`py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border transition ${
                        docType === 'note' 
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold' 
                          : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                      }`}
                    >
                      📜 Senet
                    </button>
                  </div>
                </div>

              </div>

              {/* Core Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Cari Account Selection */}
                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Cari Hesap *</label>
                  <select
                    required
                    value={selectedCariId}
                    onChange={(e) => setSelectedCariId(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500 font-medium"
                  >
                    <option value="" className="bg-[#0c0c0c]">-- Cari Seçin --</option>
                    {cariler.filter(c => c.isActive !== false).map(c => (
                      <option key={c.id} value={c.id} className="bg-[#0c0c0c]">
                        {c.name} ({c.type === 'customer' ? 'Müşteri' : c.type === 'supplier' ? 'Tedarikçi' : 'Müşteri/Tedarikçi'}) - [{c.currency || 'TRY'}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Portfolio No */}
                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Portföy No</label>
                  <input
                    type="text"
                    required
                    value={portfolioNo}
                    onChange={(e) => setPortfolioNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-mono focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                {/* Serial No / Cheque No */}
                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Çek / Belge Seri No *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: CEK-829392"
                    value={serialNo}
                    onChange={(e) => setSerialNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-mono focus:outline-hidden focus:border-teal-500"
                  />
                </div>

              </div>

              {/* Amount and Dates */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                {/* Amount */}
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Tutar (Tutar Girin) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0.01"
                      placeholder="0.00"
                      value={amount || ''}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-3 pr-16 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:border-teal-500"
                    />
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as any)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#0c0c0c] text-teal-400 text-[10px] font-bold font-mono border border-white/10 rounded px-1.5 py-0.5 focus:outline-hidden"
                    >
                      <option value="TRY">TRY</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                {/* Issue Date */}
                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Düzenleme Tarihi</label>
                  <input
                    type="date"
                    required
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Vade Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs font-bold focus:outline-hidden focus:border-teal-500"
                  />
                </div>

              </div>

              {/* Farklı Para Birimi ve Manuel Kur Bölümü (Çek / Senet için) */}
              {selectedCariId && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold text-white/80 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={isMultiCurrency}
                        onChange={(e) => {
                          setIsMultiCurrency(e.target.checked);
                          if (e.target.checked) {
                            const selectedCari = cariler.find(c => c.id === selectedCariId);
                            setCurrency(selectedCari?.currency || 'TRY');
                          }
                        }}
                        className="rounded border-white/10 bg-white/5 text-teal-600 focus:ring-teal-500 focus:ring-offset-[#0c0c0c]"
                      />
                      <span>Farklı Para Birimi / Manuel Kur Uygula</span>
                    </label>
                    <span className="text-[10px] text-white/40 font-mono">
                      Cari Para Birimi: <span className="font-bold text-teal-400">{activeCariCurrency}</span>
                    </span>
                  </div>

                  {isMultiCurrency && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/5 animate-fade-in">
                      <div>
                        <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Çek Para Birimi</label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500 font-medium font-mono"
                        >
                          <option value="TRY" className="bg-[#0c0c0c]">TRY</option>
                          <option value="USD" className="bg-[#0c0c0c]">USD</option>
                          <option value="EUR" className="bg-[#0c0c0c]">EUR</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest font-mono">Manuel Döviz Kuru</label>
                          {handleForceTcmbRate && (
                            <button
                              type="button"
                              onClick={handleForceTcmbRate}
                              disabled={tcmbLoading}
                              className="text-[9px] text-teal-400 hover:text-teal-300 font-semibold font-sans flex items-center gap-1 transition cursor-pointer"
                            >
                              <RefreshCw size={8} className={tcmbLoading ? 'animate-spin' : ''} />
                              TCMB'den Çek
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.0001"
                            min="0.0001"
                            value={exchangeRate}
                            onChange={(e) => {
                              setExchangeRate(parseFloat(e.target.value) || 0);
                            }}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs focus:outline-hidden focus:border-teal-500 font-mono font-semibold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30 font-mono font-medium">
                            {activeCariCurrency}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest font-mono">
                            Cariye Yansıyacak Tutar ({activeCariCurrency})
                          </label>
                          {isConvertedAmountEdited && (
                            <button
                              type="button"
                              onClick={() => setIsConvertedAmountEdited(false)}
                              className="text-[9px] text-teal-400 hover:underline cursor-pointer"
                            >
                              Sıfırla
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={customConvertedAmount || ''}
                            onChange={(e) => {
                              setIsConvertedAmountEdited(true);
                              setCustomConvertedAmount(parseFloat(e.target.value) || 0);
                            }}
                            className="w-full px-3 py-2 bg-teal-950/20 border border-teal-500/30 text-teal-300 rounded-xl text-xs focus:outline-hidden focus:border-teal-400 font-mono font-bold"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-teal-400/50 font-mono font-bold">
                            {activeCariCurrency}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/30 mt-1 font-sans">
                          {currency === activeCariCurrency ? (
                            "Para birimleri aynı olduğu için kur etkisi yoktur."
                          ) : (
                            `Hesaplama: 1 ${
                              currency === 'TRY' ? (activeCariCurrency === 'TRY' ? 'USD' : activeCariCurrency) : currency
                            } = ${exchangeRate} TRY/Birim`
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Debtor & Bank details (Highly important for checks) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-white/[0.01] border border-white/5">
                
                <div className="md:col-span-2">
                  <label className="block text-[8px] font-semibold text-white/30 uppercase tracking-widest mb-1 font-mono">Asıl Borçlu (Düzenleyen) / Ciranta</label>
                  <input
                    type="text"
                    placeholder="Boş bırakılırsa seçilen Cari yazılır"
                    value={debtor}
                    onChange={(e) => setDebtor(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-semibold text-white/30 uppercase tracking-widest mb-1 font-mono">Banka Adı (Varsa)</label>
                  <input
                    type="text"
                    placeholder="Örn: Garanti Bankası"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-semibold text-white/30 uppercase tracking-widest mb-1 font-mono">Şube / Hesap No (Varsa)</label>
                  <input
                    type="text"
                    placeholder="Örn: Merkez / 10292"
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-xs focus:outline-hidden focus:border-teal-500"
                  />
                </div>

              </div>

              {/* Affect Cari Balance Checkbox */}
              <div className="p-3 bg-teal-500/5 border border-teal-500/20 rounded-xl flex items-start gap-3">
                <input
                  id="affect-cari-balance-checkbox"
                  type="checkbox"
                  checked={affectCariBalance}
                  onChange={(e) => setAffectCariBalance(e.target.checked)}
                  className="mt-0.5 rounded text-teal-500 focus:ring-teal-500/50 bg-[#0c0c0c] border-white/20 w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="affect-cari-balance-checkbox" className="text-xs font-semibold text-teal-300 block cursor-pointer">
                    Cari Hesap Bakiyesini Hemen Etkilesin (Tahsilat/Ödeme İşlemi Olarak Kaydet)
                  </label>
                  <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">
                    İşaretlenirse, bu çek/senet vadesi beklenmeden Cari hesabın bakiyesini düşer/artırır ve Finansal Hareketler'e otomatik yasal kayıt atar.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Açıklama / Notlar</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Çek hakkında ek notlar, vadesinde nereye verileceği vb..."
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs focus:outline-hidden focus:border-teal-500"
                />
              </div>

            </form>

            {/* Modal Footer */}
            <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-black/40">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs uppercase tracking-wider transition cursor-pointer font-semibold"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-5 py-2 bg-teal-500 text-black hover:bg-teal-400 rounded-xl text-xs uppercase tracking-wider transition shadow-[0_0_12px_rgba(45,212,191,0.2)] cursor-pointer font-bold"
              >
                Kaydet
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. CHEQUE ACTION MODAL (TRANSITIONS) */}
      {isActionModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-md flex flex-col shadow-2xl animate-scale-up">
            
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/40">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/95">
                  Çek/Senet Durum Değişikliği
                </h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mt-0.5">
                  Seri: {selectedItem.serialNo} ({selectedItem.docType === 'cheque' ? 'Çek' : 'Senet'})
                </p>
              </div>
              <button 
                onClick={() => setIsActionModalOpen(false)}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              
              <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col gap-1.5">
                <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Belge Tutarı ve Vadesi</div>
                <div className="text-xl font-bold font-mono text-teal-400">
                  {selectedItem.amount.toLocaleString('tr-TR')} {selectedItem.currency}
                </div>
                <div className="text-xs text-white/60">Vade Tarihi: <span className="font-mono font-bold text-white/95">{selectedItem.dueDate}</span></div>
                <div className="text-xs text-white/60">Cari: <span className="font-bold text-white/95">{selectedItem.cariName}</span></div>
              </div>

              {actionType === 'collect_cash' && (
                <div className="space-y-3">
                  <div className="p-3 bg-teal-500/5 border border-teal-500/20 rounded-xl text-xs text-teal-300">
                    ℹ️ Bu işlem, portföydeki çeki <strong>Tahsil Edildi</strong> durumuna getirecek ve seçtiğiniz hesaba anında para girişini gerçekleştirecektir.
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Tahsil Edilecek Kasa / Banka Hesabı</label>
                    <select
                      value={actionAccount}
                      onChange={(e) => setActionAccount(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500"
                    >
                      <option value="cash" className="bg-[#0c0c0c]">💵 Nakit Kasa Hesabı</option>
                      <option value="bank" className="bg-[#0c0c0c]">🏦 Banka Vadesiz Mevduat Hesabı</option>
                    </select>
                  </div>
                </div>
              )}

              {actionType === 'collect_bank' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                    ℹ️ Çek banka hesabına <strong>Tahsil Edilecektir</strong>. Bu işlem banka bakiyesini artıracak, çek portföyden çıkacaktır.
                  </div>
                </div>
              )}

              {actionType === 'pay_bank' && (
                <div className="space-y-3">
                  <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                    ⚠️ Kendi yazdığımız çekin bankamızdan <strong>ödenmesini</strong> onaylıyorsunuz. Bu işlem bankamızdan para çıkışı yapacak ve çeki kapatacaktır.
                  </div>
                </div>
              )}

              {actionType === 'endorse' && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl text-xs text-purple-300">
                    ℹ️ Alınan müşteri çekini bir tedarikçiye ciro ederek <strong>borç ödemesi</strong> yapabilirsiniz. Tedarikçi seçimi zorunludur.
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Ciro Edilecek Tedarikçi Cari *</label>
                    <select
                      required
                      value={endorseCariId}
                      onChange={(e) => setEndorseCariId(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500"
                    >
                      <option value="" className="bg-[#0c0c0c]">-- Tedarikçi Seçin --</option>
                      {cariler.filter(c => c.type === 'supplier' || c.type === 'both').map(c => (
                        <option key={c.id} value={c.id} className="bg-[#0c0c0c]">
                          {c.name} - Bakiye: {c.balance.toLocaleString()} {c.currency || 'TRY'}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedItem?.currency !== 'TRY' && (
                    <div className="mt-4 p-3 border border-white/10 rounded-xl bg-white/5 space-y-3">
                      <div>
                        <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Döviz Kuru ({selectedItem?.currency} / TRY) *</label>
                        <input
                          type="number"
                          step="0.0001"
                          required
                          value={endorseExchangeRate}
                          onChange={(e) => setEndorseExchangeRate(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500"
                        />
                        <p className="text-[10px] text-white/40 mt-1">
                          Tedarikçiye Yansıyacak Tutar: {((selectedItem?.amount || 0) * endorseExchangeRate).toLocaleString()} ₺
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {actionType === 'mark_unpaid' && (
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400">
                  ⚠️ Dikkat! Bu çeki <strong>Ödenmedi / Karşılıksız</strong> olarak işaretliyorsunuz. Bu durum yasal takip gerektirebilir ve protesto işlemlerini başlatabilir.
                </div>
              )}

              {actionType === 'return_portfolio' && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                  🔄 Çekin durumunu tekrar <strong>Portföyde / Beklemede</strong> aşamasına geri almak istiyorsunuz.
                </div>
              )}

            </div>

            <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-black/40">
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs uppercase tracking-wider transition font-semibold"
              >
                Vazgeç
              </button>
              <button
                onClick={handleExecuteAction}
                className="px-5 py-2 bg-teal-500 text-black hover:bg-teal-400 rounded-xl text-xs uppercase tracking-wider font-bold transition shadow-[0_0_12px_rgba(45,212,191,0.2)]"
              >
                Eylemi Onayla
              </button>
            </div>

          </div>
        </div>
      )}


    </>
  );
}
