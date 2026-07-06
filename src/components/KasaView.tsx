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
  Activity
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

import HesaplarDetayView from './HesaplarDetayView';

interface KasaViewProps {
  islemler: Transaction[];
  expenses: Expense[];
  employeeTransactions?: EmployeeTransaction[];
  bankAccounts?: BankAccount[];
  accountTransactions?: AccountTransaction[];
}

export default function KasaView({ islemler, expenses, employeeTransactions = [], bankAccounts = [], accountTransactions = [] }: KasaViewProps) {
  const [viewMode, setViewMode] = useState<'genel' | 'detayli'>('genel');
  const [selectedCurrency, setSelectedCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [accountFilter, setAccountFilter] = useState<'all' | 'cash' | 'bank'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'month'>('all');

  // Format currency helper
  const formatCurrency = (val: number, cur: string = selectedCurrency) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(val);
  };

  // Compute Cash and Bank balances for ALL currencies
  const balances = useMemo(() => {
    const res = {
      TRY: { cash: 0, bank: 0, pos: 0 },
      USD: { cash: 0, bank: 0, pos: 0 },
      EUR: { cash: 0, bank: 0, pos: 0 }
    };

    // 1. Process islemler (Sales, Purchases, Collections, Payments, Returns)
    islemler.forEach(islem => {
      const cur = (islem.currency || 'TRY') as 'TRY' | 'USD' | 'EUR';
      if (!res[cur]) return;

      const amt = islem.amount || 0;
      const acc = islem.account; // 'cash' | 'bank' | 'pos' | ''

      if (acc === 'cash' || acc === 'bank' || acc === 'pos') {
        if (islem.type === 'sale' || islem.type === 'collection' || islem.type === 'purchase_return') {
          res[cur][acc] += amt;
        } else if (islem.type === 'purchase' || islem.type === 'payment' || islem.type === 'sale_return') {
          res[cur][acc] -= amt;
        }
      }
    });

    // 2. Process expenses (which includes synced employee payments/advances)
    expenses.forEach(exp => {
      const cur = (exp.currency || 'TRY') as 'TRY' | 'USD' | 'EUR';
      if (!res[cur]) return;

      const amt = exp.amount || 0;
      const acc = exp.account; // 'cash' | 'bank' | 'pos'

      if (acc === 'cash' || acc === 'bank' || acc === 'pos') {
        res[cur][acc] -= amt;
      }
    });

    return res;
  }, [islemler, expenses]);

  // Merge and normalize all Cash/Bank movements (Transactions & Expenses)
  const allMovements = useMemo(() => {
    const list: any[] = [];

    // Add islemler
    islemler.forEach(islem => {
      const acc = islem.account;
      if (acc !== 'cash' && acc !== 'bank' && acc !== 'pos') return; // only cash/bank/pos movements

      const isIncoming = islem.type === 'sale' || islem.type === 'collection' || islem.type === 'purchase_return';
      let title = islem.cariName || 'Bilinmeyen Cari';
      let categoryName = 'Ticari Faaliyet';
      
      if (islem.type === 'sale') categoryName = 'Mal/Hizmet Satışı';
      else if (islem.type === 'purchase') categoryName = 'Mal/Hizmet Alışı';
      else if (islem.type === 'collection') categoryName = 'Cari Tahsilat';
      else if (islem.type === 'payment') categoryName = 'Cari Ödeme';
      else if (islem.type === 'sale_return') categoryName = 'Satış İade';
      else if (islem.type === 'purchase_return') categoryName = 'Alış İade';

      list.push({
        id: `islem-${islem.id}`,
        date: islem.date,
        title,
        description: islem.description || '',
        category: categoryName,
        account: acc,
        type: isIncoming ? 'in' : 'out',
        amount: islem.amount,
        currency: islem.currency || 'TRY',
        rawType: islem.type
      });
    });

    // Add expenses
    expenses.forEach(exp => {
      const acc = exp.account;
      if (acc !== 'cash' && acc !== 'bank' && acc !== 'pos') return;

      list.push({
        id: `expense-${exp.id}`,
        date: exp.date,
        title: exp.title || 'Masraf',
        description: exp.description || '',
        category: exp.category || 'Diğer Gider',
        account: acc,
        type: 'out',
        amount: exp.amount,
        currency: exp.currency || 'TRY',
        rawType: 'expense'
      });
    });

    // Sort descending by date, then id
    return list.sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });
  }, [islemler, expenses]);

  // Filtered movements based on filters
  const filteredMovements = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthPrefix = todayStr.substring(0, 7); // "YYYY-MM"

    return allMovements.filter(m => {
      // 1. Currency filter
      if (m.currency !== selectedCurrency) return false;

      // 2. Account filter
      if (accountFilter !== 'all' && m.account !== accountFilter) return false;

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
  }, [allMovements, selectedCurrency, accountFilter, searchTerm, dateFilter]);

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
            <button
              onClick={() => setViewMode('genel')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition cursor-pointer flex items-center gap-2 ${
                viewMode === 'genel' ? 'bg-teal-500/20 text-teal-400' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity size={14} /> Genel Akış
            </button>
            <button
              onClick={() => setViewMode('detayli')}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition cursor-pointer flex items-center gap-2 ${
                viewMode === 'detayli' ? 'bg-teal-500/20 text-teal-400' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wallet size={14} /> Hesaplar & Transfer
            </button>
          </div>
          {viewMode === 'genel' && (
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
          )}
        </div>
      </div>

      {viewMode === 'genel' ? (
        <>
          {/* Account Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Cash Register (Kasa) */}
        <div className="bg-[#111111] border border-white/5 p-6 rounded-lg flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-teal-500/5 transition-transform duration-500 group-hover:scale-110 pointer-events-none">
            <Wallet size={120} />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-white/40 uppercase tracking-widest block font-mono font-bold">MERKEZ KASA MEVCUDU</span>
              <h3 className="text-3xl font-light italic tracking-tight text-white mt-2" style={{ fontFamily: 'Georgia, serif' }}>
                {formatCurrency(balances[selectedCurrency].cash)}
              </h3>
            </div>
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/15">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/50 font-mono">
            <span>Nakit Para Toplamı</span>
            <span className="text-teal-400 font-bold">AKTİF</span>
          </div>
        </div>

        {/* Total Bank accounts (Banka) */}
        <div className="bg-[#111111] border border-white/5 p-6 rounded-lg flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-teal-500/5 transition-transform duration-500 group-hover:scale-110 pointer-events-none">
            <CreditCard size={120} />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-white/40 uppercase tracking-widest block font-mono font-bold">BANKA HESAPLARI MEVCUDU</span>
              <h3 className="text-3xl font-light italic tracking-tight text-white mt-2" style={{ fontFamily: 'Georgia, serif' }}>
                {formatCurrency(balances[selectedCurrency].bank)}
              </h3>
            </div>
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/15">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-white/50 font-mono">
            <span>Vadeli/Vadesiz Toplamı</span>
            <span className="text-teal-400 font-bold">LİKİT</span>
          </div>
        </div>

        {/* Total Combined */}
        <div className="bg-[#111111] border border-white/5 p-6 rounded-lg flex flex-col justify-between shadow-lg relative overflow-hidden group bg-gradient-to-br from-[#111111] to-[#152321]">
          <div className="absolute top-0 right-0 p-8 text-teal-400/5 transition-transform duration-500 group-hover:scale-110 pointer-events-none">
            <DollarSign size={120} />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-teal-400 uppercase tracking-widest block font-mono font-bold">TOPLAM NAKİT MEVCUDU</span>
              <h3 className="text-3xl font-bold tracking-tight text-teal-400 mt-2" style={{ fontFamily: 'Georgia, serif' }}>
                {formatCurrency(balances[selectedCurrency].cash + balances[selectedCurrency].bank + balances[selectedCurrency].pos)}
              </h3>
            </div>
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30 shadow-[0_0_12px_rgba(45,212,191,0.15)]">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-teal-500/10 flex items-center justify-between text-[10px] text-white/50 font-mono">
            <span>Kasa + Banka + POS Birleşik</span>
            <span className="text-teal-400 font-bold font-mono">NET REZERV</span>
          </div>
        </div>
      </div>

      {/* Multi-Currency Mini Grid */}
      <div className="bg-[#111111] p-4 rounded-xl border border-white/5 flex flex-wrap justify-between gap-4 shadow-sm text-xs text-white/50">
        <span className="font-mono uppercase tracking-widest font-bold text-white/30 flex items-center gap-2">
          <CheckCircle2 size={13} className="text-teal-500" />
          Tüm Döviz Cinsleri Nakit Dağılımı:
        </span>
        <div className="flex gap-6 flex-wrap">
          <div>
            <span className="font-bold text-white/70">₺ TRY: </span>
            <span className="font-mono text-white/90 font-bold">{formatCurrency(balances.TRY.cash + balances.TRY.bank + balances.TRY.pos, 'TRY')}</span>
            <span className="text-white/30 text-[10px] ml-1.5">(Kasa: {formatCurrency(balances.TRY.cash, 'TRY')} / Banka: {formatCurrency(balances.TRY.bank, 'TRY')} / POS: {formatCurrency(balances.TRY.pos, 'TRY')})</span>
          </div>
          <div>
            <span className="font-bold text-white/70">$ USD: </span>
            <span className="font-mono text-white/90 font-bold">{formatCurrency(balances.USD.cash + balances.USD.bank + balances.USD.pos, 'USD')}</span>
            <span className="text-white/30 text-[10px] ml-1.5">(Kasa: {formatCurrency(balances.USD.cash, 'USD')} / Banka: {formatCurrency(balances.USD.bank, 'USD')} / POS: {formatCurrency(balances.USD.pos, 'USD')})</span>
          </div>
          <div>
            <span className="font-bold text-white/70">€ EUR: </span>
            <span className="font-mono text-white/90 font-bold">{formatCurrency(balances.EUR.cash + balances.EUR.bank + balances.EUR.pos, 'EUR')}</span>
            <span className="text-white/30 text-[10px] ml-1.5">(Kasa: {formatCurrency(balances.EUR.cash, 'EUR')} / Banka: {formatCurrency(balances.EUR.bank, 'EUR')} / POS: {formatCurrency(balances.EUR.pos, 'EUR')})</span>
          </div>
        </div>
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
      <div className="bg-[#111111] border border-white/5 rounded-lg shadow-lg overflow-hidden flex flex-col">
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
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value as any)}
              className="bg-white/5 border border-white/10 focus:border-teal-500 focus:ring-teal-500 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white/80 cursor-pointer"
            >
              <option value="all" className="bg-[#111111] text-white">Tüm Hesaplar</option>
              <option value="cash" className="bg-[#111111] text-white">Sadece Kasa</option>
              <option value="bank" className="bg-[#111111] text-white">Sadece Banka</option>
              <option value="pos" className="bg-[#111111] text-white">Sadece POS</option>
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
                          {m.account === 'cash' ? 'Kasa' : m.account === 'pos' ? 'POS' : 'Banka'}
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
        </>
      ) : (
        <HesaplarDetayView 
          bankAccounts={bankAccounts} 
          accountTransactions={accountTransactions} 
          islemler={islemler}
          expenses={expenses}
          employeeTransactions={employeeTransactions}
        />
      )}
    </div>
  );
}
