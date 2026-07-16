import React from 'react';
import { X, Edit, Plus, ArrowRightLeft, RefreshCw } from 'lucide-react';
import { BankAccount, AccountTransaction } from '../../types';

export function KasaModals({ isAccountModalOpen, isTxModalOpen, editingAccount, setIsAccountModalOpen, setIsTxModalOpen, setEditingAccount, accName, setAccName, accType, setAccType, accCurrency, setAccCurrency, accInitBal, setAccInitBal, txType, setTxType, txSourceAcc, setTxSourceAcc, txTargetAcc, setTxTargetAcc, txAmount, setTxAmount, txTargetAmount, setTxTargetAmount, txDesc, setTxDesc, crossRate, setCrossRate, isCrossCurrency, sourceAccData, targetAccData, isFetchingRate, fetchLiveRate, handleSaveAccount, handleSaveTx, bankAccounts }) {
  return (
    <>
      {isAccountModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#151515] rounded-2xl shadow-2xl w-full max-w-md border border-white/10 animate-fade-in overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                      {editingAccount ? (
                        <>
                          <Edit size={16} className="text-teal-500" /> Hesabı Düzenle
                        </>
                      ) : (
                        <>
                          <Plus size={16} className="text-teal-500" /> Yeni Kasa / Banka / POS
                        </>
                      )}
                    </h3>
                    <button onClick={() => { setIsAccountModalOpen(false); setEditingAccount(null); }} className="text-white/40 hover:text-white transition"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleSaveAccount} className="p-6 space-y-5 text-left">
                    <div>
                      <label className="block text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Hesap Adı</label>
                      <input type="text" required value={accName} onChange={e => setAccName(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" placeholder="Örn: Garanti TL Hesabı" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Tür</label>
                        <select 
                          value={accType} 
                          onChange={e => setAccType(e.target.value as any)} 
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none"
                        >
                          <option value="banka">Banka Hesabı</option>
                          <option value="kasa">Nakit Kasa</option>
                          <option value="pos">POS Hesabı</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Para Birimi</label>
                        <select 
                          value={accCurrency} 
                          onChange={e => setAccCurrency(e.target.value as any)} 
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none"
                        >
                          <option value="TRY">TRY (₺)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Açılış Bakiyesi</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-sm font-mono">{accCurrency === 'TRY' ? '₺' : accCurrency === 'USD' ? '$' : '€'}</span>
                        <input type="number" required value={accInitBal} onChange={e => setAccInitBal(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg pl-8 pr-3.5 py-2.5 text-sm text-white font-mono focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" placeholder="0.00" />
                      </div>
                    </div>
                    <div className="pt-4 flex justify-end gap-3 mt-2 border-t border-white/5">
                      <button type="button" onClick={() => { setIsAccountModalOpen(false); setEditingAccount(null); }} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition">İptal</button>
                      <button type="submit" className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition shadow-lg shadow-teal-500/20">
                        {editingAccount ? 'Değişiklikleri Kaydet' : 'Hesabı Oluştur'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
      
            {isTxModalOpen && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#151515] rounded-2xl shadow-2xl w-full max-w-md border border-white/10 animate-fade-in overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
                    <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                      <ArrowRightLeft size={16} className="text-teal-500" /> İşlem / Transfer
                    </h3>
                    <button onClick={() => setIsTxModalOpen(false)} className="text-white/40 hover:text-white transition"><X size={20} /></button>
                  </div>
                  <div className="p-4 border-b border-white/5 flex gap-2 bg-[#0a0a0a]/50">
                    <button onClick={() => setTxType('giris')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${txType === 'giris' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>Para Girişi</button>
                    <button onClick={() => setTxType('cikis')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${txType === 'cikis' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>Para Çıkışı</button>
                    <button onClick={() => setTxType('transfer')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${txType === 'transfer' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>Transfer</button>
                  </div>
                  <form onSubmit={handleSaveTx} className="p-6 space-y-5 text-left">
                    <div>
                      <label className="block text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider">{txType === 'transfer' ? 'Gönderen Hesap' : 'İşlem Yapılacak Hesap'}</label>
                      <select required value={txSourceAcc} onChange={e => setTxSourceAcc(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none">
                        <option value="">Seçiniz...</option>
                        {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                      </select>
                    </div>
                    
                    {txType === 'transfer' && (
                      <div className="animate-fade-in relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white/20"><ArrowRightLeft size={16} className="rotate-90" /></div>
                        <label className="block text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider mt-2">Alıcı Hesap</label>
                        <select required value={txTargetAcc} onChange={e => setTxTargetAcc(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none">
                          <option value="">Seçiniz...</option>
                          {bankAccounts.filter(a => a.id !== txSourceAcc).map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
                        </select>
                      </div>
                    )}
      
                    <div>
                      <label className="block text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Tutar</label>
                      <div className="relative">
                        <input type="number" required min="0.01" step="0.01" value={txAmount} onChange={e => setTxAmount(e.target.value)} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" placeholder="0.00" />
                      </div>
                    </div>
      
                    {isCrossCurrency && (
                      <div className="animate-fade-in space-y-4">
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider">
                              Döviz Kuru ({sourceAccData?.currency} / {targetAccData?.currency})
                            </label>
                            <input 
                              type="number" 
                              min="0.0001" 
                              step="0.0001" 
                              value={crossRate} 
                              onChange={e => {
                                setCrossRate(e.target.value);
                                if (txAmount && Number(txAmount) > 0 && e.target.value && Number(e.target.value) > 0) {
                                  setTxTargetAmount((Number(txAmount) * Number(e.target.value)).toFixed(2));
                                }
                              }} 
                              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" 
                              placeholder="Örn: 34.50" 
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => fetchLiveRate(sourceAccData?.currency || '', targetAccData?.currency || '')}
                            disabled={isFetchingRate}
                            className="h-[42px] px-3 bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg hover:bg-teal-500/30 transition flex items-center gap-2"
                            title="Güncel Ortalama Kuru Getir"
                          >
                            <RefreshCw size={16} className={isFetchingRate ? 'animate-spin' : ''} />
                            <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Kur Getir</span>
                          </button>
                        </div>
      
                        <div>
                          <label className="block text-[11px] font-semibold text-teal-400 mb-1.5 uppercase tracking-wider">
                            Hedef Hesaba Geçecek Tutar ({targetAccData?.currency})
                          </label>
                          <input 
                            type="number" 
                            required 
                            min="0.01" 
                            step="0.01" 
                            value={txTargetAmount} 
                            onChange={e => {
                              setTxTargetAmount(e.target.value);
                              if (txAmount && Number(txAmount) > 0 && e.target.value && Number(e.target.value) > 0) {
                                setCrossRate((Number(e.target.value) / Number(txAmount)).toFixed(4));
                              }
                            }} 
                            className="w-full bg-teal-500/10 border border-teal-500/30 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" 
                            placeholder="0.00" 
                          />
                        </div>
                        
                        {txAmount && txTargetAmount && (
                          <div className="mt-2 p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-xs">
                            <span className="text-teal-400 font-bold block mb-1">Döviz Çeviri Özeti:</span>
                            1 {sourceAccData?.currency} ≈ <span className="font-mono text-white">{(Number(txTargetAmount) / Number(txAmount)).toFixed(4)} {targetAccData?.currency}</span><br/>
                            1 {targetAccData?.currency} ≈ <span className="font-mono text-white">{(Number(txAmount) / Number(txTargetAmount)).toFixed(4)} {sourceAccData?.currency}</span>
                          </div>
                        )}
                      </div>
                    )}
      
                    <div>
                      <label className="block text-[11px] font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Açıklama / Sebep</label>
                      <input type="text" value={txDesc} onChange={e => setTxDesc(e.target.value)} placeholder="Opsiyonel..." className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none" />
                    </div>
      
                    <div className="pt-4 flex justify-end gap-3 mt-2 border-t border-white/5">
                      <button type="button" onClick={() => setIsTxModalOpen(false)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition">İptal</button>
                      <button type="submit" className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white rounded-lg transition shadow-lg ${txType === 'giris' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : txType === 'cikis' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}>
                        İşlemi Tamamla
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          
    </>
  );
}
