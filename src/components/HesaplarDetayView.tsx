import React, { useState, useEffect } from 'react';
import { BankAccount, AccountTransaction, Transaction, Expense, EmployeeTransaction } from '../types';
import { saveBankAccount, saveAccountTransaction, deleteBankAccount } from '../firebase';
import { Plus, ArrowRightLeft, DollarSign, Wallet, CreditCard, X, TrendingUp, TrendingDown, Trash2, RefreshCw, Terminal, Lock, Edit } from 'lucide-react';

interface Props {
  bankAccounts: BankAccount[];
  accountTransactions: AccountTransaction[];
  islemler?: Transaction[];
  expenses?: Expense[];
  employeeTransactions?: EmployeeTransaction[];
}

export default function HesaplarDetayView({ bankAccounts, accountTransactions, islemler = [], expenses = [], employeeTransactions = [] }: Props) {
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'giris' | 'cikis' | 'transfer'>('giris');

  // Account Form
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'kasa' | 'banka' | 'pos'>('banka');
  const [accCurrency, setAccCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [accInitBal, setAccInitBal] = useState<string | number>('0');

  // Tx Form
  const [txSourceAcc, setTxSourceAcc] = useState('');
  const [txTargetAcc, setTxTargetAcc] = useState('');
  const [txAmount, setTxAmount] = useState<string | number>('');
  const [txTargetAmount, setTxTargetAmount] = useState<string | number>('');
  const [txDesc, setTxDesc] = useState('');
  const [crossRate, setCrossRate] = useState<string | number>('');
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const formatCurrency = (val: number, cur: string) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(val);
  };

  const calculateBalance = (acc: BankAccount) => {
    let bal = acc.initialBalance || 0;
    
    // Manual Transactions & Transfers
    accountTransactions.forEach(tx => {
      if (tx.accountId === acc.id) {
        if (tx.type === 'giris' || tx.type === 'transfer_in') bal += tx.amount;
        if (tx.type === 'cikis' || tx.type === 'transfer_out') bal -= tx.amount;
      }
    });

    // Cari / Fatura İşlemleri
    islemler.forEach(islem => {
      if (islem.bankAccountId === acc.id) {
        if (islem.type === 'collection' || islem.type === 'sale' || islem.type === 'purchase_return') bal += islem.amount;
        if (islem.type === 'payment' || islem.type === 'purchase' || islem.type === 'sale_return') bal -= islem.amount;
      }
    });

    // Masraflar
    expenses.forEach(expense => {
      if (expense.bankAccountId === acc.id) {
        bal -= expense.amount;
      }
    });

    // Personel İşlemleri
    employeeTransactions.forEach(etx => {
      if (etx.bankAccountId === acc.id && (etx.type === 'payment' || etx.type === 'advance')) {
        bal -= etx.amount;
      }
    });

    return bal;
  };

  const isDefaultAccount = (id: string) => id === 'merkez_kasa' || id === 'merkez_banka' || id === 'merkez_pos';

  const openNewAccountModal = () => {
    setEditingAccount(null);
    setAccName('');
    setAccType('banka');
    setAccCurrency('TRY');
    setAccInitBal('0');
    setIsAccountModalOpen(true);
  };

  const openEditAccountModal = (acc: BankAccount) => {
    setEditingAccount(acc);
    setAccName(acc.name);
    setAccType(acc.type);
    setAccCurrency(acc.currency);
    setAccInitBal(acc.initialBalance || 0);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      await saveBankAccount({
        ...editingAccount,
        name: accName,
        type: accType,
        currency: accCurrency,
        initialBalance: Number(accInitBal),
      }, editingAccount.id);
    } else {
      await saveBankAccount({
        name: accName,
        type: accType,
        currency: accCurrency,
        initialBalance: Number(accInitBal),
        createdAt: new Date().toISOString()
      });
    }
    setIsAccountModalOpen(false);
    setEditingAccount(null);
    setAccName('');
    setAccInitBal('0');
  };

  const fetchLiveRate = async (sourceCur: string, targetCur: string) => {
    if (!sourceCur || !targetCur || sourceCur === targetCur) return;
    setIsFetchingRate(true);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/' + sourceCur);
      if (response.ok) {
        const data = await response.json();
        if (data && data.rates && data.rates[targetCur]) {
          const rate = Number(data.rates[targetCur].toFixed(4));
          setCrossRate(rate);
          if (txAmount && Number(txAmount) > 0) {
            setTxTargetAmount((Number(txAmount) * rate).toFixed(2));
          }
        }
      }
    } catch (e) {
      console.warn('Kur alınamadı:', e);
    } finally {
      setIsFetchingRate(false);
    }
  };

  useEffect(() => {
    if (txType === 'transfer' && crossRate && Number(crossRate) > 0 && txAmount && Number(txAmount) > 0) {
      setTxTargetAmount((Number(txAmount) * Number(crossRate)).toFixed(2));
    }
  }, [txAmount, crossRate, txType]);

  const handleSaveTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(txAmount);
    if (!txSourceAcc || amountNum <= 0) return;

    if (txType === 'transfer') {
      if (!txTargetAcc || txSourceAcc === txTargetAcc) return;
      
      const sourceData = bankAccounts.find(a => a.id === txSourceAcc);
      const targetData = bankAccounts.find(a => a.id === txTargetAcc);
      let targetAmountFinal = amountNum;
      
      if (sourceData && targetData && sourceData.currency !== targetData.currency) {
        const tAmount = Number(txTargetAmount);
        if (tAmount <= 0) return;
        targetAmountFinal = tAmount;
      }

      // Source transfer out
      await saveAccountTransaction({
        accountId: txSourceAcc,
        type: 'transfer_out',
        amount: amountNum,
        date: new Date().toISOString().split('T')[0],
        description: txDesc || 'Hesaplar arası transfer',
        targetAccountId: txTargetAcc,
        createdAt: new Date().toISOString()
      });
      
      // Target transfer in
      await saveAccountTransaction({
        accountId: txTargetAcc,
        type: 'transfer_in',
        amount: targetAmountFinal,
        date: new Date().toISOString().split('T')[0],
        description: txDesc || 'Hesaplar arası transfer',
        targetAccountId: txSourceAcc,
        createdAt: new Date().toISOString()
      });
    } else {
      // giris or cikis
      await saveAccountTransaction({
        accountId: txSourceAcc,
        type: txType,
        amount: amountNum,
        date: new Date().toISOString().split('T')[0],
        description: txDesc || (txType === 'giris' ? 'Manuel Giriş' : 'Manuel Çıkış'),
        createdAt: new Date().toISOString()
      });
    }

    setIsTxModalOpen(false);
    setTxAmount('');
    setTxTargetAmount('');
    setTxDesc('');
  };

  const sourceAccData = bankAccounts.find(a => a.id === txSourceAcc);
  const targetAccData = bankAccounts.find(a => a.id === txTargetAcc);
  const isCrossCurrency = txType === 'transfer' && sourceAccData && targetAccData && sourceAccData.currency !== targetAccData.currency;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#111111] p-6 rounded-xl border border-white/5 shadow-xl">
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/90 mb-1">Detaylı Hesap & Transfer Yönetimi</h2>
          <p className="text-white/40 text-[10px] uppercase tracking-widest font-mono">Çoklu para birimi kasa ve banka hesapları takibi</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={openNewAccountModal} className="flex-1 md:flex-none justify-center bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
            <Plus size={16} /> Yeni Hesap
          </button>
          <button onClick={() => { setTxType('giris'); setIsTxModalOpen(true); }} className="flex-1 md:flex-none justify-center bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
            <ArrowRightLeft size={16} /> İşlem / Transfer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bankAccounts.length === 0 && (
          <div className="col-span-full p-12 flex flex-col items-center justify-center text-center text-white/40 bg-[#111111] rounded-xl border border-white/5">
            <Wallet size={48} className="mb-4 opacity-20" />
            <span className="text-sm font-medium">Henüz detaylı hesap tanımlanmadı.</span>
            <span className="text-xs mt-2 max-w-xs">Hesaplar arası transfer ve sebepsiz giriş/çıkış yapmak için yeni bir kasa veya banka hesabı oluşturun.</span>
          </div>
        )}
        {bankAccounts.map(acc => {
          const bal = calculateBalance(acc);
          return (
            <div key={acc.id} className="bg-[#111111] border border-white/5 p-6 rounded-xl shadow-lg relative overflow-hidden group hover:border-teal-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-6 text-teal-400/5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                {acc.type === 'kasa' ? <Wallet size={80} /> : acc.type === 'pos' ? <Terminal size={80} /> : <CreditCard size={80} />}
              </div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/5 text-white/50 mb-3 border border-white/5">
                    {acc.type === 'kasa' ? 'Nakit Kasa' : acc.type === 'pos' ? 'POS Hesabı' : 'Banka Hesabı'} • {acc.currency}
                  </span>
                  <h3 className="text-lg font-bold text-white/90 truncate max-w-[200px]" title={acc.name}>{acc.name}</h3>
                </div>
              </div>
              <div className="pb-4 border-b border-white/5">
                <span className="text-[10px] text-white/40 uppercase tracking-widest block font-mono font-bold mb-1">Güncel Bakiye</span>
                <h4 className="text-3xl font-light tracking-tight text-white" style={{ fontFamily: 'Georgia, serif' }}>
                  {formatCurrency(bal, acc.currency)}
                </h4>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider bg-teal-400/10 px-2 py-1 rounded">Aktif</span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => openEditAccountModal(acc)}
                    className="text-white/20 hover:text-teal-400 transition p-1"
                    title="Hesabı Düzenle"
                  >
                    <Edit size={15} />
                  </button>
                  {isDefaultAccount(acc.id) ? (
                    <span 
                      className="text-white/10 cursor-not-allowed p-1"
                      title="Merkez hesaplar silinemez"
                    >
                      <Lock size={15} />
                    </span>
                  ) : (
                    <button 
                      onClick={() => {
                        if (window.confirm('Bu hesabı silmek istediğinize emin misiniz?')) {
                          deleteBankAccount(acc.id);
                        }
                      }}
                      className="text-white/20 hover:text-rose-400 transition p-1"
                      title="Hesabı Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
              <button onClick={() => setIsAccountModalOpen(false)} className="text-white/40 hover:text-white transition"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveAccount} className="p-6 space-y-5">
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
                    disabled={editingAccount ? isDefaultAccount(editingAccount.id) : false}
                    className={`w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none ${editingAccount && isDefaultAccount(editingAccount.id) ? 'opacity-50 cursor-not-allowed bg-white/[0.02]' : ''}`}
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
                    disabled={editingAccount ? isDefaultAccount(editingAccount.id) : false}
                    className={`w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-none ${editingAccount && isDefaultAccount(editingAccount.id) ? 'opacity-50 cursor-not-allowed bg-white/[0.02]' : ''}`}
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
                <button type="button" onClick={() => setIsAccountModalOpen(false)} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition">İptal</button>
                <button type="submit" className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition shadow-lg shadow-teal-500/20">
                  {editingAccount ? 'Güncelle' : 'Hesabı Oluştur'}
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
            <form onSubmit={handleSaveTx} className="p-6 space-y-5">
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
    </div>
  );
}
