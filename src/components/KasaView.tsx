import { CashFlowAnalysis } from './kasa/CashFlowAnalysis';
import { InteractiveCashLedger } from './kasa/InteractiveCashLedger';
import { KasaModals } from './kasa/KasaModals';
import React, { useState, useMemo } from 'react';
import { Transaction, Expense, EmployeeTransaction, BankAccount, AccountTransaction } from '../types';
import { saveBankAccount, saveAccountTransaction, deleteBankAccount } from '../firebase';
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  DollarSign, 
  PieChart as ChartIcon,
  Plus,
  ArrowRightLeft,
  X,
  Activity,
  Terminal,
  RefreshCw,
  Edit,
  Trash2,
  Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip
} from 'recharts';
interface KasaViewProps {
  islemler: Transaction[];
  expenses: Expense[];
  employeeTransactions?: EmployeeTransaction[];
  bankAccounts?: BankAccount[];
  accountTransactions?: AccountTransaction[];
}
export default function KasaView({ islemler, expenses, employeeTransactions = [], bankAccounts = [], accountTransactions = [] }: KasaViewProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [accountFilter, setAccountFilter] = useState<'all' | 'cash' | 'bank' | 'pos'>('all');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');
  // Transaction / Transfer Modal States
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'giris' | 'cikis' | 'transfer'>('giris');
  const [txSourceAcc, setTxSourceAcc] = useState('');
  const [txTargetAcc, setTxTargetAcc] = useState('');
  const [txAmount, setTxAmount] = useState<string | number>('');
  const [txTargetAmount, setTxTargetAmount] = useState<string | number>('');
  const [txDesc, setTxDesc] = useState('');
  const [crossRate, setCrossRate] = useState<string | number>('');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  // New Account Modal States
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'kasa' | 'banka' | 'pos'>('banka');
  const [accCurrency, setAccCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [accInitBal, setAccInitBal] = useState<string | number>('0');
  const isDefaultAccount = (id: string) => id === 'merkez_kasa' || id === 'merkez_banka' || id === 'merkez_pos';
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
  const openEditAccountModal = (acc: BankAccount) => {
    setEditingAccount(acc);
    setAccName(acc.name);
    setAccType(acc.type);
    setAccCurrency(acc.currency);
    setAccInitBal(acc.initialBalance || 0);
    setIsAccountModalOpen(true);
  };
  const sourceAccData = useMemo(() => bankAccounts.find(a => a.id === txSourceAcc), [bankAccounts, txSourceAcc]);
  const targetAccData = useMemo(() => bankAccounts.find(a => a.id === txTargetAcc), [bankAccounts, txTargetAcc]);
  const isCrossCurrency = useMemo(() => txType === 'transfer' && sourceAccData && targetAccData && sourceAccData.currency !== targetAccData.currency, [txType, sourceAccData, targetAccData]);
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
  React.useEffect(() => {
    if (txType === 'transfer' && crossRate && Number(crossRate) > 0 && txAmount && Number(txAmount) > 0) {
      setTxTargetAmount((Number(txAmount) * Number(crossRate)).toFixed(2));
    }
  }, [txAmount, crossRate, txType]);
  // Find active account details
  const activeAccount = useMemo(() => {
    if (selectedAccountId === 'all') return null;
    return bankAccounts.find(a => a.id === selectedAccountId) || null;
  }, [selectedAccountId, bankAccounts]);
  // Format currency helper
  const formatCurrency = (val: number, cur: string = selectedCurrency) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(val);
  };
  // Compute calculated balance for each BankAccount based on all transactions
  const accountBalances = useMemo(() => {
    const map: Record<string, number> = {};
    // Initialize with initial balances
    bankAccounts.forEach(acc => {
      map[acc.id] = acc.initialBalance || 0;
    });
    // 1. Manual transactions & transfers
    accountTransactions.forEach(tx => {
      if (map[tx.accountId] !== undefined) {
        if (tx.type === 'giris' || tx.type === 'transfer_in') {
          map[tx.accountId] += tx.amount;
        } else if (tx.type === 'cikis' || tx.type === 'transfer_out') {
          map[tx.accountId] -= tx.amount;
        }
      }
    });
    // 2. Commercial / Invoice transactions (islemler)
    islemler.forEach(islem => {
      const targetId = islem.bankAccountId || (islem.account === 'cash' ? 'merkez_kasa' : islem.account === 'bank' ? 'merkez_banka' : islem.account === 'pos' ? 'merkez_pos' : '');
      if (map[targetId] !== undefined) {
        if (islem.type === 'collection' || islem.type === 'sale' || islem.type === 'purchase_return') {
          map[targetId] += islem.amount;
        } else if (islem.type === 'payment' || islem.type === 'purchase' || islem.type === 'sale_return') {
          map[targetId] -= islem.amount;
        }
      }
    });
    // 3. Expenses
    expenses.forEach(exp => {
      const targetId = exp.bankAccountId || (exp.account === 'cash' ? 'merkez_kasa' : exp.account === 'bank' ? 'merkez_banka' : exp.account === 'pos' ? 'merkez_pos' : '');
      if (map[targetId] !== undefined) {
        map[targetId] -= exp.amount;
      }
    });
    // 4. Employee Transactions
    employeeTransactions.forEach(etx => {
      if (etx.type === 'payment' || etx.type === 'advance') {
        const targetId = etx.bankAccountId || (etx.account === 'cash' ? 'merkez_kasa' : etx.account === 'bank' ? 'merkez_banka' : etx.account === 'pos' ? 'merkez_pos' : '');
        if (map[targetId] !== undefined) {
          map[targetId] -= etx.amount;
        }
      }
    });
    return map;
  }, [bankAccounts, accountTransactions, islemler, expenses, employeeTransactions]);
  // Compute Cash, Bank, POS combined balances by currency for the cards and footer
  const balances = useMemo(() => {
    const res = {
      TRY: { cash: 0, bank: 0, pos: 0 },
      USD: { cash: 0, bank: 0, pos: 0 },
      EUR: { cash: 0, bank: 0, pos: 0 }
    };
    bankAccounts.forEach(acc => {
      const cur = acc.currency as 'TRY' | 'USD' | 'EUR';
      if (!res[cur]) return;
      const typeKey = acc.type === 'kasa' ? 'cash' : acc.type === 'banka' ? 'bank' : 'pos';
      const bal = accountBalances[acc.id] || 0;
      res[cur][typeKey] += bal;
    });
    return res;
  }, [bankAccounts, accountBalances]);
  // Merge and normalize all Cash/Bank/POS movements chronologically
  const allMovements = useMemo(() => {
    const list: any[] = [];
    // Helper to resolve bankAccountId from legacy type or explicit value
    const getAccountId = (explicitId: string | undefined, type: 'cash' | 'bank' | 'pos') => {
      if (explicitId) return explicitId;
      if (type === 'cash') return 'merkez_kasa';
      if (type === 'bank') return 'merkez_banka';
      if (type === 'pos') return 'merkez_pos';
      return '';
    };
    // 1. Add islemler
    islemler.forEach(islem => {
      const acc = islem.account;
      if (acc !== 'cash' && acc !== 'bank' && acc !== 'pos') return;
      const isIncoming = islem.type === 'sale' || islem.type === 'collection' || islem.type === 'purchase_return';
      let title = islem.cariName || 'Bilinmeyen Cari';
      let categoryName = 'Ticari Faaliyet';
      if (islem.type === 'sale') categoryName = 'Mal/Hizmet Satışı';
      else if (islem.type === 'purchase') categoryName = 'Mal/Hizmet Alışı';
      else if (islem.type === 'collection') categoryName = 'Cari Tahsilat';
      else if (islem.type === 'payment') categoryName = 'Cari Ödeme';
      else if (islem.type === 'sale_return') categoryName = 'Satış İade';
      else if (islem.type === 'purchase_return') categoryName = 'Alış İade';
      const accountId = getAccountId(islem.bankAccountId, acc);
      list.push({
        id: `islem-${islem.id}`,
        date: islem.date,
        title,
        description: islem.description || '',
        category: categoryName,
        account: acc,
        accountId: accountId,
        type: isIncoming ? 'in' : 'out',
        amount: islem.amount,
        currency: islem.currency || 'TRY',
        rawType: islem.type
      });
    });
    // 2. Add expenses
    expenses.forEach(exp => {
      const acc = exp.account;
      if (acc !== 'cash' && acc !== 'bank' && acc !== 'pos') return;
      const accountId = getAccountId(exp.bankAccountId, acc);
      list.push({
        id: `expense-${exp.id}`,
        date: exp.date,
        title: exp.title || 'Masraf',
        description: exp.description || '',
        category: exp.category || 'Diğer Gider',
        account: acc,
        accountId: accountId,
        type: 'out',
        amount: exp.amount,
        currency: exp.currency || 'TRY',
        rawType: 'expense'
      });
    });
    // 3. Add employeeTransactions
    employeeTransactions.forEach(etx => {
      const acc = etx.account;
      if (acc !== 'cash' && acc !== 'bank' && acc !== 'pos') return;
      if (etx.type !== 'payment' && etx.type !== 'advance') return;
      const accountId = getAccountId(etx.bankAccountId, acc);
      list.push({
        id: `employee-${etx.id}`,
        date: etx.date,
        title: `${etx.employeeName} (${etx.type === 'payment' ? 'Maaş Ödemesi' : 'Avans Ödemesi'})`,
        description: etx.description || '',
        category: etx.type === 'payment' ? 'Personel Maaş/Avans' : 'Personel Avans',
        account: acc,
        accountId: accountId,
        type: 'out',
        amount: etx.amount,
        currency: etx.currency || 'TRY',
        rawType: 'employee_tx'
      });
    });
    // 4. Add accountTransactions (manual inputs & transfers)
    accountTransactions.forEach(tx => {
      const accInfo = bankAccounts.find(a => a.id === tx.accountId);
      if (!accInfo) return;
      const isIncoming = tx.type === 'giris' || tx.type === 'transfer_in';
      let cat = 'Manuel İşlem';
      if (tx.type === 'transfer_in' || tx.type === 'transfer_out') {
        cat = 'Hesap Transferi';
      }
      let title = '';
      if (tx.type === 'giris') title = 'Manuel Para Girişi';
      else if (tx.type === 'cikis') title = 'Manuel Para Çıkışı';
      else if (tx.type === 'transfer_out') {
        const targetAcc = bankAccounts.find(a => a.id === tx.targetAccountId);
        title = `Transfere Giden → ${targetAcc ? targetAcc.name : 'Bilinmeyen Hesap'}`;
      } else if (tx.type === 'transfer_in') {
        const sourceAcc = bankAccounts.find(a => a.id === tx.targetAccountId);
        title = `Transferden Gelen ← ${sourceAcc ? sourceAcc.name : 'Bilinmeyen Hesap'}`;
      }
      list.push({
        id: `acc-tx-${tx.id}`,
        date: tx.date,
        title,
        description: tx.description || '',
        category: cat,
        account: accInfo.type === 'kasa' ? 'cash' : accInfo.type === 'banka' ? 'bank' : 'pos',
        accountId: tx.accountId,
        type: isIncoming ? 'in' : 'out',
        amount: tx.amount,
        currency: accInfo.currency,
        rawType: tx.type
      });
    });
    // Sort descending by date, then id
    return list.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });
  }, [islemler, expenses, employeeTransactions, accountTransactions, bankAccounts]);
  // Filtered movements based on filters
  const filteredMovements = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthPrefix = todayStr.substring(0, 7); // "YYYY-MM"
    return allMovements.filter(m => {
      // 1. Currency filter
      if (m.currency !== selectedCurrency) return false;
      // 2. Account filter (Specific selected account OR broad account filter)
      if (selectedAccountId !== 'all') {
        if (m.accountId !== selectedAccountId) return false;
      } else {
        if (accountFilter !== 'all' && m.account !== accountFilter) return false;
      }
      // 3. Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(term);
        const matchesDesc = m.description.toLowerCase().includes(term);
        const matchesCat = m.category.toLowerCase().includes(term);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }
      // 4. Date filter
      if (dateFilter === 'today' && m.date !== todayStr) return false;
      if (dateFilter === 'month' && !m.date.startsWith(currentMonthPrefix)) return false;
      return true;
    });
  }, [allMovements, selectedCurrency, accountFilter, selectedAccountId, searchTerm, dateFilter]);
  // Cash flow summary statistics for active filters
  const flowStats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    // Categorized spending (outflows)
    const outCategories: Record<string, number> = {};
    filteredMovements.forEach(m => {
      if (m.type === 'in') {
        totalIn += m.amount;
      } else {
        totalOut += m.amount;
        outCategories[m.category] = (outCategories[m.category] || 0) + m.amount;
      }
    });
    // Format for PieChart
    const pieData = Object.entries(outCategories).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value);
    return {
      totalIn,
      totalOut,
      netFlow: totalIn - totalOut,
      pieData
    };
  }, [filteredMovements]);
  // Recharts colors
  const COLORS = ['#f43f5e', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#111111] p-6 rounded-xl border border-white/5 gap-4 shadow-xl">
        <div>
          <h1 id="kasa-view-heading" className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Kasa & Banka Durumu</h1>
          <p className="text-white/40 text-xs mt-1">İşletmenizin nakit mevcudunu, banka hesaplarını ve para akış detaylarını buradan yönetebilirsiniz.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/5 gap-1">
            {(['TRY', 'USD', 'EUR'] as const).map((cur) => (
              <button
                key={cur}
                id={`tab-kasa-cur-${cur}`}
                onClick={() => setSelectedCurrency(cur)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition cursor-pointer ${
                  selectedCurrency === cur 
                    ? 'bg-teal-500 text-black shadow-[0_0_8px_rgba(45,212,191,0.2)]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {cur === 'TRY' ? '₺ TL' : cur === 'USD' ? '$ USD' : '€ EUR'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-[#111111] border border-white/5 p-6 rounded-xl shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">HESAP SEÇİMİ VE EKSTRE ANALİZİ</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Grafikleri, dönem akışını ve işlem dökümünü filtrelemek için bir hesap seçin.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    setEditingAccount(null);
                    setAccName('');
                    setAccType('banka');
                    setAccCurrency('TRY');
                    setAccInitBal('0');
                    setIsAccountModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg border border-white/10 cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                >
                  <Plus size={13} /> YENİ HESAP
                </button>
                <button
                  onClick={() => {
                    setTxType('giris');
                    setIsTxModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-[#8b1a1a] hover:bg-[#721515] text-white text-[11px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-all shadow-sm flex items-center gap-1.5"
                >
                  <ArrowRightLeft size={13} /> İŞLEM / TRANSFER
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border border-zinc-150">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedAccountId === 'all' ? 'bg-teal-600 text-white shadow-sm' : 'bg-white text-zinc-400 border border-zinc-200'}`}>
                  <Activity size={16} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block font-bold">GENEL AKIŞ SEÇENEĞİ</span>
                  <span className="text-xs font-bold text-zinc-800 block">Tüm Kasa, Banka ve POS Hareketleri Birleşik</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedAccountId('all');
                  setAccountFilter('all');
                }}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                  selectedAccountId === 'all'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/10'
                    : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                {selectedAccountId === 'all' ? 'SEÇİLİ (AKTİF)' : 'TÜMÜNÜ AKTİFLEŞTİR'} ({formatCurrency(balances[selectedCurrency].cash + balances[selectedCurrency].bank + balances[selectedCurrency].pos)})
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet size={14} className="text-amber-500" /> NAKİT KASALARI
                  </span>
                  <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full font-bold">
                    {formatCurrency(balances[selectedCurrency].cash)}
                  </span>
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {bankAccounts.filter(acc => acc.type === 'kasa').map(acc => {
                    const isSelected = selectedAccountId === acc.id;
                    const bal = accountBalances[acc.id] || 0;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setSelectedCurrency(acc.currency);
                          setAccountFilter('cash');
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm font-semibold'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="truncate flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-amber-500/20 text-amber-700' : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200/80'}`}>
                            <Wallet size={14} />
                          </div>
                          <div className="truncate">
                            <span className="text-xs block font-bold text-zinc-800 truncate">{acc.name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">{acc.currency} • Nakit</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-xs font-mono font-bold text-zinc-700">
                            {formatCurrency(bal, acc.currency)}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditAccountModal(acc);
                              }}
                              className="text-zinc-400 hover:text-teal-600 p-1 rounded hover:bg-zinc-100 transition"
                              title="Düzenle"
                            >
                              <Edit size={13} />
                            </button>
                            {isDefaultAccount(acc.id) ? (
                              <span 
                                className="text-zinc-200 cursor-not-allowed p-1"
                                title="Merkez hesaplar silinemez"
                              >
                                <Lock size={13} />
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Bu hesabı silmek istediğinize emin misiniz?')) {
                                    deleteBankAccount(acc.id);
                                  }
                                }}
                                className="text-zinc-400 hover:text-rose-600 p-1 rounded hover:bg-zinc-100 transition"
                                title="Sil"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {bankAccounts.filter(acc => acc.type === 'kasa').length === 0 && (
                    <div className="p-4 border border-dashed border-zinc-200 rounded-xl text-center text-zinc-400 text-xs italic">
                      Kayıtlı kasa bulunamadı.
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={14} className="text-blue-500" /> BANKA HESAPLARI
                  </span>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                    {formatCurrency(balances[selectedCurrency].bank)}
                  </span>
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {bankAccounts.filter(acc => acc.type === 'banka').map(acc => {
                    const isSelected = selectedAccountId === acc.id;
                    const bal = accountBalances[acc.id] || 0;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setSelectedCurrency(acc.currency);
                          setAccountFilter('bank');
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm font-semibold'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="truncate flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-blue-500/20 text-blue-700' : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200/80'}`}>
                            <CreditCard size={14} />
                          </div>
                          <div className="truncate">
                            <span className="text-xs block font-bold text-zinc-800 truncate">{acc.name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">{acc.currency} • Vadesiz</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-xs font-mono font-bold text-zinc-700">
                            {formatCurrency(bal, acc.currency)}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditAccountModal(acc);
                              }}
                              className="text-zinc-400 hover:text-teal-600 p-1 rounded hover:bg-zinc-100 transition"
                              title="Düzenle"
                            >
                              <Edit size={13} />
                            </button>
                            {isDefaultAccount(acc.id) ? (
                              <span 
                                className="text-zinc-200 cursor-not-allowed p-1"
                                title="Merkez hesaplar silinemez"
                              >
                                <Lock size={13} />
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Bu hesabı silmek istediğinize emin misiniz?')) {
                                    deleteBankAccount(acc.id);
                                  }
                                }}
                                className="text-zinc-400 hover:text-rose-600 p-1 rounded hover:bg-zinc-100 transition"
                                title="Sil"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {bankAccounts.filter(acc => acc.type === 'banka').length === 0 && (
                    <div className="p-4 border border-dashed border-zinc-200 rounded-xl text-center text-zinc-400 text-xs italic">
                      Kayıtlı banka bulunamadı.
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                  <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal size={14} className="text-purple-500" /> POS CİHAZLARI
                  </span>
                  <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-bold">
                    {formatCurrency(balances[selectedCurrency].pos)}
                  </span>
                </div>
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {bankAccounts.filter(acc => acc.type === 'pos').map(acc => {
                    const isSelected = selectedAccountId === acc.id;
                    const bal = accountBalances[acc.id] || 0;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => {
                          setSelectedAccountId(acc.id);
                          setSelectedCurrency(acc.currency);
                          setAccountFilter('pos');
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                          isSelected
                            ? 'bg-purple-50 border-purple-400 text-purple-900 shadow-sm font-semibold'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="truncate flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-purple-500/20 text-purple-700' : 'bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200/80'}`}>
                            <Terminal size={14} />
                          </div>
                          <div className="truncate">
                            <span className="text-xs block font-bold text-zinc-800 truncate">{acc.name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">{acc.currency} • POS</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-xs font-mono font-bold text-zinc-700">
                            {formatCurrency(bal, acc.currency)}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditAccountModal(acc);
                              }}
                              className="text-zinc-400 hover:text-teal-600 p-1 rounded hover:bg-zinc-100 transition"
                              title="Düzenle"
                            >
                              <Edit size={13} />
                            </button>
                            {isDefaultAccount(acc.id) ? (
                              <span 
                                className="text-zinc-200 cursor-not-allowed p-1"
                                title="Merkez hesaplar silinemez"
                              >
                                <Lock size={13} />
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Bu hesabı silmek istediğinize emin misiniz?')) {
                                    deleteBankAccount(acc.id);
                                  }
                                }}
                                className="text-zinc-400 hover:text-rose-600 p-1 rounded hover:bg-zinc-100 transition"
                                title="Sil"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {bankAccounts.filter(acc => acc.type === 'pos').length === 0 && (
                    <div className="p-4 border border-dashed border-zinc-200 rounded-xl text-center text-zinc-400 text-xs italic">
                      Kayıtlı POS bulunamadı.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {selectedAccountId !== 'all' && activeAccount && (
            <div className="bg-teal-500/10 border border-teal-500/20 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400">
                  {activeAccount.type === 'kasa' ? <Wallet size={16} /> : activeAccount.type === 'banka' ? <CreditCard size={16} /> : <Terminal size={16} />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
                    FİLTRE AKTİF: <span className="font-mono bg-teal-500/15 px-1.5 py-0.5 rounded text-white">{activeAccount.name}</span>
                  </h4>
                  <p className="text-[10px] text-white/60 mt-0.5 uppercase tracking-wide font-mono">
                    Grafikler, dönem nakit akışı ve kasa defteri ekstre tablosu şu anda sadece bu hesaba ait verileri göstermektedir.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedAccountId('all');
                  setAccountFilter('all');
                }}
                className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-black text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors whitespace-nowrap shadow-md shadow-teal-500/10"
              >
                Filtreyi Temizle
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(() => {
              const isCardDisabled = selectedAccountId !== 'all' && activeAccount?.type !== 'kasa';
              const cardTitle = selectedAccountId !== 'all' && activeAccount?.type === 'kasa' 
                ? `${activeAccount.name.toUpperCase()} BAKİYESİ` 
                : "TOPLAM KASA MEVCUDU";
              const cardValue = selectedAccountId !== 'all' && activeAccount?.type === 'kasa'
                ? (accountBalances[activeAccount.id] || 0)
                : balances[selectedCurrency].cash;
              const cardSubtext = selectedAccountId !== 'all' && activeAccount?.type === 'kasa'
                ? "Seçili Kasa Hesabı"
                : "Nakit Para Toplamı";
              return (
                <div 
                  onClick={() => {
                    if (isCardDisabled) {
                      // Click disabled card to clear filter and set account type to cash
                      setSelectedAccountId('all');
                      setAccountFilter('cash');
                    } else {
                      setAccountFilter('cash');
                      setSelectedAccountId('all');
                    }
                    document.getElementById('kasa-defteri-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`bg-[#111111] border p-6 rounded-lg flex flex-col justify-between shadow-lg relative overflow-hidden group cursor-pointer active:scale-[0.99] transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.05)] ${
                    isCardDisabled 
                      ? 'opacity-25 hover:opacity-55 grayscale-[25%] border-dashed border-white/5 hover:border-amber-500/20' 
                      : 'border-white/5 hover:border-amber-500/30'
                  }`}
                  title={isCardDisabled ? "Kasa filtresine dönmek için tıklayın" : "Kasa dökümünü listelemek için tıklayın"}
                >
                  <div className="absolute top-0 right-0 p-8 text-amber-500/5 transition-transform duration-500 group-hover:scale-110 pointer-events-none">
                    <Wallet size={120} />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-white/40 uppercase tracking-widest block font-mono font-bold">{cardTitle}</span>
                      <h3 className="text-3xl font-light italic tracking-tight text-white mt-2 group-hover:text-amber-300 transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                        {formatCurrency(cardValue, selectedAccountId !== 'all' && activeAccount?.type === 'kasa' ? activeAccount.currency : selectedCurrency)}
                      </h3>
                    </div>
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/15 group-hover:bg-amber-500/20 group-hover:border-amber-500/30 transition-all">
                      <Wallet size={18} />
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/50 font-mono">
                    <span>{cardSubtext}</span>
                    <span className="text-amber-400 font-bold group-hover:underline flex items-center gap-1">
                      {isCardDisabled ? "FİLTREYİ SIFIRLA ↺" : "DETAYLARI LİSTELE →"}
                    </span>
                  </div>
                </div>
              );
            })()}
            {(() => {
              const isCardDisabled = selectedAccountId !== 'all' && activeAccount?.type !== 'banka';
              const cardTitle = selectedAccountId !== 'all' && activeAccount?.type === 'banka' 
                ? `${activeAccount.name.toUpperCase()} BAKİYESİ` 
                : "BANKA HESAPLARI MEVCUDU";
              const cardValue = selectedAccountId !== 'all' && activeAccount?.type === 'banka'
                ? (accountBalances[activeAccount.id] || 0)
                : balances[selectedCurrency].bank;
              const cardSubtext = selectedAccountId !== 'all' && activeAccount?.type === 'banka'
                ? "Seçili Banka Hesabı"
                : "Vadeli/Vadesiz Toplamı";
              return (
                <div 
                  onClick={() => {
                    if (isCardDisabled) {
                      setSelectedAccountId('all');
                      setAccountFilter('bank');
                    } else {
                      setAccountFilter('bank');
                      setSelectedAccountId('all');
                    }
                    document.getElementById('kasa-defteri-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`bg-[#111111] border p-6 rounded-lg flex flex-col justify-between shadow-lg relative overflow-hidden group cursor-pointer active:scale-[0.99] transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.05)] ${
                    isCardDisabled 
                      ? 'opacity-25 hover:opacity-55 grayscale-[25%] border-dashed border-white/5 hover:border-blue-500/20' 
                      : 'border-white/5 hover:border-blue-500/30'
                  }`}
                  title={isCardDisabled ? "Banka filtresine dönmek için tıklayın" : "Banka dökümünü listelemek için tıklayın"}
                >
                  <div className="absolute top-0 right-0 p-8 text-blue-500/5 transition-transform duration-500 group-hover:scale-110 pointer-events-none">
                    <CreditCard size={120} />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-white/40 uppercase tracking-widest block font-mono font-bold">{cardTitle}</span>
                      <h3 className="text-3xl font-light italic tracking-tight text-white mt-2 group-hover:text-blue-300 transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                        {formatCurrency(cardValue, selectedAccountId !== 'all' && activeAccount?.type === 'banka' ? activeAccount.currency : selectedCurrency)}
                      </h3>
                    </div>
                    <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/15 group-hover:bg-blue-500/20 group-hover:border-blue-500/30 transition-all">
                      <CreditCard size={18} />
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/50 font-mono">
                    <span>{cardSubtext}</span>
                    <span className="text-blue-400 font-bold group-hover:underline flex items-center gap-1">
                      {isCardDisabled ? "FİLTREYİ SIFIRLA ↺" : "DETAYLARI LİSTELE →"}
                    </span>
                  </div>
                </div>
              );
            })()}
            {(() => {
              const cardTitle = selectedAccountId !== 'all' && activeAccount
                ? `SEÇİLİ HESAP REZERVİ` 
                : "TOPLAM NAKİT MEVCUDU";
              const cardValue = selectedAccountId !== 'all' && activeAccount
                ? (accountBalances[activeAccount.id] || 0)
                : balances[selectedCurrency].cash + balances[selectedCurrency].bank + balances[selectedCurrency].pos;
              const cardSubtext = selectedAccountId !== 'all' && activeAccount
                ? `${activeAccount.name} Net Bakiye`
                : "Kasa + Banka + POS Birleşik";
              return (
                <div 
                  onClick={() => {
                    setSelectedAccountId('all');
                    setAccountFilter('all');
                    document.getElementById('kasa-defteri-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-[#111111] border border-white/5 p-6 rounded-lg flex flex-col justify-between shadow-lg relative overflow-hidden group cursor-pointer active:scale-[0.99] transition-all duration-300 hover:shadow-[0_0_20px_rgba(45,212,191,0.05)]"
                  title="Tüm nakit hareketleri listesini görmek için tıklayın"
                >
                  <div className="absolute top-0 right-0 p-8 text-teal-400/5 transition-transform duration-500 group-hover:scale-110 pointer-events-none">
                    <DollarSign size={120} />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-teal-400 uppercase tracking-widest block font-mono font-bold">{cardTitle}</span>
                      <h3 className="text-3xl font-bold tracking-tight text-teal-400 mt-2 group-hover:text-teal-300 transition-colors" style={{ fontFamily: 'Georgia, serif' }}>
                        {formatCurrency(cardValue, selectedAccountId !== 'all' && activeAccount ? activeAccount.currency : selectedCurrency)}
                      </h3>
                    </div>
                    <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30 shadow-[0_0_12px_rgba(45,212,191,0.15)] group-hover:bg-teal-500/30 transition-all">
                      <DollarSign size={18} />
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-teal-500/10 flex items-center justify-between text-[10px] text-white/50 font-mono">
                    <span>{cardSubtext}</span>
                    <span className="text-teal-400 font-bold font-mono group-hover:underline flex items-center gap-1">
                      {selectedAccountId !== 'all' ? "TÜM HESAPLARA DÖN ↺" : "TÜM HAREKETLERİ GÖR →"}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
      <CashFlowAnalysis 
        flowStats={flowStats}
        COLORS={COLORS}
        formatCurrency={formatCurrency}
      />
            <InteractiveCashLedger 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedAccountId={selectedAccountId}
        setSelectedAccountId={setSelectedAccountId}
        setSelectedCurrency={setSelectedCurrency}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        filteredMovements={filteredMovements}
        bankAccounts={bankAccounts}
        setEditingAccount={setEditingAccount}
        setIsTxModalOpen={setIsTxModalOpen}
        formatCurrency={formatCurrency}
      />
            <KasaModals 
        isAccountModalOpen={isAccountModalOpen}
        isTxModalOpen={isTxModalOpen}
        editingAccount={editingAccount}
        setIsAccountModalOpen={setIsAccountModalOpen}
        setIsTxModalOpen={setIsTxModalOpen}
        setEditingAccount={setEditingAccount}
        accName={accName}
        setAccName={setAccName}
        accType={accType}
        setAccType={setAccType}
        accCurrency={accCurrency}
        setAccCurrency={setAccCurrency}
        accInitBal={accInitBal}
        setAccInitBal={setAccInitBal}
        txType={txType}
        setTxType={setTxType}
        txSourceAcc={txSourceAcc}
        setTxSourceAcc={setTxSourceAcc}
        txTargetAcc={txTargetAcc}
        setTxTargetAcc={setTxTargetAcc}
        txAmount={txAmount}
        setTxAmount={setTxAmount}
        txTargetAmount={txTargetAmount}
        setTxTargetAmount={setTxTargetAmount}
        txDesc={txDesc}
        setTxDesc={setTxDesc}
        crossRate={crossRate}
        setCrossRate={setCrossRate}
        isCrossCurrency={isCrossCurrency}
        sourceAccData={sourceAccData}
        targetAccData={targetAccData}
        isFetchingRate={isFetchingRate}
        fetchLiveRate={fetchLiveRate}
        handleSaveAccount={handleSaveAccount}
        handleSaveTx={handleSaveTx}
        bankAccounts={bankAccounts}
      />
    </div>
  );
}
