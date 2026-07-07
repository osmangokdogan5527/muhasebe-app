import React, { useState, useMemo } from 'react';
import { Cari, Transaction, Expense, EmployeeTransaction, BankAccount, AccountTransaction } from '../types';
import { saveBankAccount, saveAccountTransaction, deleteBankAccount } from '../firebase';
import { 
  Wallet, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar,
  Briefcase,
  Users,
  CheckCircle2,
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
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend
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
      {/* Header */}
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

      {/* 📱 1. Master Account Switcher & Tabs Hub */}
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

            {/* 1. Tüm Hesaplar Genel Bar */}
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

            {/* Symmetrical Grid of Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Column 1: Nakit Kasaları */}
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

              {/* Column 2: Banka Hesapları */}
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

              {/* Column 3: POS Cihazları */}
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

          {/* ⚡ 2. Active Account Focus Banner */}
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

          {/* 📊 3. Primary Financial Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Cash Register (Kasa) */}
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

            {/* Card 2: Bank Accounts (Banka) */}
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

            {/* Card 3: Combined / Selected Net Cash */}
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



      {/* Cash Flow Summary & Outflow Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outflow Analysis (Neye Ödeme Yaptık) */}
        <div className="bg-[#111111] p-6 rounded-lg border border-white/5 lg:col-span-2 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">Neye Ödeme Yaptık? (Ödeme Dağılımı)</h2>
                <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">Yapılan tüm ödeme ve masrafların kategorilere göre analizi</p>
              </div>
              <span className="p-2 bg-white/5 text-white/50 rounded-lg border border-white/10">
                <ChartIcon size={16} />
              </span>
            </div>

            {flowStats.pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white/[0.02] rounded-lg border border-dashed border-white/10">
                <TrendingDown className="text-white/20 mb-3" size={32} />
                <span className="text-xs uppercase tracking-widest text-white/60 font-medium">Ödeme Kaydı Yok</span>
                <span className="text-[10px] text-white/30 mt-1 uppercase tracking-widest font-mono">Seçili filtrelerde ödeme/gider bulunamadı.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Pie Chart */}
                <div className="h-48 md:h-56 relative flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={flowStats.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {flowStats.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: any) => [formatCurrency(Number(val)), 'Tutar']}
                        contentStyle={{ 
                          backgroundColor: '#111111', 
                          borderRadius: '12px', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontFamily: 'monospace'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <span className="text-[9px] text-white/40 block font-mono uppercase tracking-widest">Toplam Gider</span>
                    <span className="text-base font-bold text-white font-mono">{formatCurrency(flowStats.totalOut)}</span>
                  </div>
                </div>

                {/* Categories List */}
                <div className="space-y-3.5">
                  {flowStats.pieData.slice(0, 5).map((entry, idx) => (
                    <div key={entry.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                        <span className="text-white/80 font-medium truncate">{entry.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-white/95 font-mono">{formatCurrency(entry.value)}</span>
                        <span className="text-[9px] text-white/40 ml-2 font-mono">
                          ({((entry.value / flowStats.totalOut) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                  {flowStats.pieData.length > 5 && (
                    <div className="text-[10px] text-white/40 italic pl-4.5">
                      + {flowStats.pieData.length - 5} kategori daha var
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[11px] text-white/50">
            <span>Dönem İçi Gider / Ödeme Dağılımı</span>
            <span className="text-teal-400 font-mono font-bold uppercase tracking-wider">Otomatik Sentez</span>
          </div>
        </div>

        {/* Period Cash Flow Stats */}
        <div className="bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70 mb-6">Dönem Nakit Akışı</h2>
            <div className="space-y-4">
              {/* Girişler */}
              <div className="p-4 bg-black/30 border border-white/5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <ArrowUpRight size={16} />
                  </span>
                  <div>
                    <span className="text-[9px] text-white/40 uppercase block font-mono font-bold">TOPLAM GİRİŞ (TAHSİLAT)</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">{formatCurrency(flowStats.totalIn)}</span>
                  </div>
                </div>
              </div>

              {/* Çıkışlar */}
              <div className="p-4 bg-black/30 border border-white/5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                    <ArrowDownLeft size={16} />
                  </span>
                  <div>
                    <span className="text-[9px] text-white/40 uppercase block font-mono font-bold">TOPLAM ÇIKIŞ (ÖDEME)</span>
                    <span className="text-sm font-bold text-rose-400 font-mono mt-0.5 block">{formatCurrency(flowStats.totalOut)}</span>
                  </div>
                </div>
              </div>

              {/* Net Akış */}
              <div className="p-4 bg-black/30 border border-white/5 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-lg ${flowStats.netFlow >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    <TrendingUp size={16} />
                  </span>
                  <div>
                    <span className="text-[9px] text-white/40 uppercase block font-mono font-bold">NET NAKİT AKIŞI (DÖNEMLİK)</span>
                    <span className={`text-sm font-bold font-mono mt-0.5 block ${flowStats.netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {flowStats.netFlow >= 0 ? '+' : ''}{formatCurrency(flowStats.netFlow)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-3 rounded-lg text-[10px] text-white/40 text-center font-mono uppercase mt-6 tracking-wider">
            {flowStats.netFlow >= 0 
              ? 'Nakit rezerviniz bu dönem büyüyor.' 
              : 'Nakit rezervlerinizde net azalma var.'}
          </div>
        </div>
      </div>

      {/* Interactive Cash Ledger */}
      <div id="kasa-defteri-section" className="bg-[#111111] border border-white/5 rounded-lg shadow-lg overflow-hidden flex flex-col scroll-mt-6">
        {/* Table Filters Toolbar */}
        <div className="p-5 border-b border-white/5 bg-white/[0.01] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">Kasa & Banka Defteri (Ekstre)</h2>
            <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-mono">Tüm para giriş ve çıkışlarının kronolojik detay dökümü</p>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:flex-none">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white/30">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Açıklama, cari, masraf ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-48 bg-white/5 border border-white/10 focus:border-teal-500 focus:ring-teal-500 rounded-lg pl-8 pr-3 py-1.5 text-xs font-medium text-white placeholder:text-white/30"
              />
            </div>

            {/* Account filter */}
            <select
              value={selectedAccountId !== 'all' ? selectedAccountId : accountFilter}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all' || val === 'cash' || val === 'bank' || val === 'pos') {
                  setAccountFilter(val as any);
                  setSelectedAccountId('all');
                } else {
                  setSelectedAccountId(val);
                  const found = bankAccounts.find(a => a.id === val);
                  if (found) {
                    setAccountFilter(found.type === 'kasa' ? 'cash' : found.type === 'banka' ? 'bank' : 'pos');
                    setSelectedCurrency(found.currency);
                  }
                }
              }}
              className="bg-white/5 border border-white/10 focus:border-teal-500 focus:ring-teal-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/80 cursor-pointer"
            >
              <optgroup label="Genel Gruplar" className="bg-[#111111] text-white">
                <option value="all">Tüm Hesaplar</option>
                <option value="cash">Sadece Kasa</option>
                <option value="bank">Sadece Banka</option>
                <option value="pos">Sadece POS</option>
              </optgroup>
              <optgroup label="Özel Hesaplar" className="bg-[#111111] text-white">
                {bankAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                ))}
              </optgroup>
            </select>

            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-white/5 border border-white/10 focus:border-teal-500 focus:ring-teal-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/80 cursor-pointer"
            >
              <option value="all" className="bg-[#111111] text-white">Tüm Tarihler</option>
              <option value="today" className="bg-[#111111] text-white">Bugün</option>
              <option value="month" className="bg-[#111111] text-white">Bu Ay</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Tarih</th>
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Hesap</th>
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Akış</th>
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Kategori</th>
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Muhatap / Başlık</th>
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono">Açıklama</th>
                <th className="py-3 px-4 text-[10px] font-bold text-white/40 uppercase tracking-wider font-mono text-right">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-white/30 font-medium font-mono">
                    Eşleşen nakit hareketi bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isIncoming = m.type === 'in';
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.01] transition">
                      <td className="py-3.5 px-4 whitespace-nowrap text-white/50 font-mono">
                        {m.date}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          m.account === 'cash' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' 
                            : m.account === 'pos'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/10'
                        }`}>
                          {bankAccounts.find(a => a.id === m.accountId)?.name || (m.account === 'cash' ? 'Kasa' : m.account === 'pos' ? 'POS' : 'Banka')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                          isIncoming 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                        }`}>
                          {isIncoming ? (
                            <>
                              <ArrowUpRight size={10} />
                              GİRİŞ
                            </>
                          ) : (
                            <>
                              <ArrowDownLeft size={10} />
                              ÇIKIŞ
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-white/40 font-mono text-[10px] uppercase">
                        {m.category}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white/80 max-w-xs truncate">
                        {m.title}
                      </td>
                      <td className="py-3.5 px-4 text-white/50 max-w-xs truncate font-mono text-[10px]">
                        {m.description || <span className="text-white/20 italic">—</span>}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold font-mono">
                        <span className={isIncoming ? 'text-emerald-400' : 'text-rose-400'}>
                          {isIncoming ? '+' : '-'}{formatCurrency(m.amount, m.currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
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
    </div>
  );
}
