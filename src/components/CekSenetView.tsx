import React, { useMemo, useState, useEffect } from 'react';
import { Cari, CekSenet, Transaction } from '../types';
import { saveCekSenet, deleteCekSenet, createTransaction } from '../firebase';
import { 
  FileText, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building2, 
  User, 
  Calendar,
  X,
  CreditCard,
  Briefcase,
  Lock,
  Check,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wallet,
  AlertCircle
} from 'lucide-react';

interface CekSenetViewProps {
  ceksenet: CekSenet[];
  cariler: Cari[];
  islemler: Transaction[];
}

export default function CekSenetView({ ceksenet, cariler, islemler }: CekSenetViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receivable' | 'payable'>('all');
  const [filterDocType, setFilterDocType] = useState<'all' | 'cheque' | 'note'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'portfolio' | 'collected' | 'paid' | 'endorsed' | 'unpaid'>('all');
  const [activeCurrency, setActiveCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Form fields
  const [type, setType] = useState<'receivable' | 'payable'>('receivable');
  const [docType, setDocType] = useState<'cheque' | 'note'>('cheque');
  const [portfolioNo, setPortfolioNo] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [debtor, setDebtor] = useState('');
  const [selectedCariId, setSelectedCariId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().substring(0, 10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [status, setStatus] = useState<'portfolio' | 'collected' | 'paid' | 'endorsed' | 'unpaid'>('portfolio');
  const [description, setDescription] = useState('');
  const [affectCariBalance, setAffectCariBalance] = useState(true);

  // Multi-Currency / Manual Rate support states for checks
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [customConvertedAmount, setCustomConvertedAmount] = useState<number>(0);
  const [isMultiCurrency, setIsMultiCurrency] = useState<boolean>(false);
  const [isConvertedAmountEdited, setIsConvertedAmountEdited] = useState<boolean>(false);

  // Find currently selected Cari's currency
  const activeCariCurrency = useMemo(() => {
    const selectedCari = cariler.find(c => c.id === selectedCariId);
    return selectedCari?.currency || 'TRY';
  }, [selectedCariId, cariler]);

  // Fetch live exchange rate when currencies differ
  useEffect(() => {
    if (currency === activeCariCurrency) {
      setExchangeRate(1);
      setIsMultiCurrency(false);
      return;
    }
    setIsMultiCurrency(true);

    const fetchLiveRate = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/TRY');
        if (response.ok) {
          const data = await response.json();
          if (data && data.rates) {
            if (currency === 'USD' && activeCariCurrency === 'TRY') {
               setExchangeRate(Number((1 / data.rates.USD).toFixed(4)));
            } else if (currency === 'EUR' && activeCariCurrency === 'TRY') {
               setExchangeRate(Number((1 / data.rates.EUR).toFixed(4)));
            } else if (currency === 'TRY' && activeCariCurrency === 'USD') {
               setExchangeRate(Number(data.rates.USD.toFixed(4)));
            } else if (currency === 'TRY' && activeCariCurrency === 'EUR') {
               setExchangeRate(Number(data.rates.EUR.toFixed(4)));
            } else if (currency === 'USD' && activeCariCurrency === 'EUR') {
               setExchangeRate(Number((data.rates.EUR / data.rates.USD).toFixed(4)));
            } else if (currency === 'EUR' && activeCariCurrency === 'USD') {
               setExchangeRate(Number((data.rates.USD / data.rates.EUR).toFixed(4)));
            }
          }
        }
      } catch (e) {
        console.warn('Kurlar alınamadı (Çevrimdışı)', e);
      }
    };
    fetchLiveRate();
  }, [currency, activeCariCurrency]);

  // Sync check currency when a Cari is selected
  useEffect(() => {
    const selectedCari = cariler.find(c => c.id === selectedCariId);
    if (selectedCari) {
      const cur = selectedCari.currency || 'TRY';
      setCurrency(cur);
      setCustomConvertedAmount(0);
      setIsConvertedAmountEdited(false);
    }
  }, [selectedCariId, cariler]);

  // Calculate default converted amount based on rate & currencies for checks
  const autoConvertedAmount = useMemo(() => {
    const amt = amount;
    if (currency === activeCariCurrency) return amt;
    if (exchangeRate <= 0) return amt;
    
    if ((currency === 'USD' || currency === 'EUR') && activeCariCurrency === 'TRY') {
      return Number((amt * exchangeRate).toFixed(2));
    }
    if (currency === 'TRY' && (activeCariCurrency === 'USD' || activeCariCurrency === 'EUR')) {
      return Number((amt / exchangeRate).toFixed(2));
    }
    return Number((amt * exchangeRate).toFixed(2));
  }, [amount, currency, activeCariCurrency, exchangeRate]);

  // Sync customConvertedAmount with autoConvertedAmount when not manually overridden
  useEffect(() => {
    if (!isConvertedAmountEdited) {
      setCustomConvertedAmount(autoConvertedAmount);
    }
  }, [autoConvertedAmount, isConvertedAmountEdited]);

  // Status Action Modal State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CekSenet | null>(null);
  const [actionType, setActionType] = useState<'collect_cash' | 'collect_bank' | 'endorse' | 'pay_bank' | 'mark_unpaid' | 'return_portfolio'>('collect_cash');
  const [endorseCariId, setEndorseCariId] = useState('');
  const [endorseExchangeRate, setEndorseExchangeRate] = useState<number>(1);
  const [actionAccount, setActionAccount] = useState<'cash' | 'bank'>('bank');

  // Stats
  const stats = useMemo(() => {
    let receivedTotal = 0;
    let paidTotal = 0;
    let portfolioTotal = 0;
    let collectedTotal = 0;
    let nearMaturityCount = 0;

    const todayStr = new Date().toISOString().substring(0, 10);
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);

    ceksenet.forEach(item => {
      if (item.currency !== activeCurrency) return;

      if (item.type === 'receivable') {
        receivedTotal += item.amount;
        if (item.status === 'portfolio') {
          portfolioTotal += item.amount;
        } else if (item.status === 'collected') {
          collectedTotal += item.amount;
        }
      } else {
        paidTotal += item.amount;
      }

      // Check for near maturity
      if (item.status === 'portfolio' && item.dueDate >= todayStr && item.dueDate <= thirtyDaysLater) {
        nearMaturityCount++;
      }
    });

    return {
      receivedTotal,
      paidTotal,
      portfolioTotal,
      collectedTotal,
      nearMaturityCount
    };
  }, [ceksenet, activeCurrency]);

  // Filtered Cheques/Notes
  const filteredCekSenet = useMemo(() => {
    return ceksenet.filter(item => {
      const matchSearch = 
        item.cariName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serialNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.portfolioNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.debtor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterDocType !== 'all' && item.docType !== filterDocType) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;

      return true;
    });
  }, [ceksenet, searchTerm, filterType, filterDocType, filterStatus]);

  // Open modal with auto generated Portfolio No
  const handleOpenAddModal = () => {
    setFormError('');
    setType('receivable');
    setDocType('cheque');
    setSerialNo('');
    setDebtor('');
    setSelectedCariId('');
    setAmount(0);
    setCurrency(activeCurrency);
    setIssueDate(new Date().toISOString().substring(0, 10));
    setDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10));
    setBankName('');
    setBankBranch('');
    setAccountNo('');
    setStatus('portfolio');
    setDescription('');
    setAffectCariBalance(true);

    const year = new Date().getFullYear();
    const count = ceksenet.length + 1;
    setPortfolioNo(`PRT-${year}-${String(count).padStart(4, '0')}`);
    
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedCariId) {
      setFormError('Lütfen bir Cari Hesap seçin.');
      return;
    }

    if (amount <= 0) {
      setFormError('Tutar sıfırdan büyük olmalıdır.');
      return;
    }

    const selectedCari = cariler.find(c => c.id === selectedCariId);
    if (!selectedCari) {
      setFormError('Seçilen cari hesap bulunamadı.');
      return;
    }

    try {
      const payload: Omit<CekSenet, 'id'> = {
        type,
        docType,
        portfolioNo,
        serialNo: serialNo.trim(),
        debtor: debtor.trim() || selectedCari.name,
        cariId: selectedCariId,
        cariName: selectedCari.name,
        amount,
        currency: isMultiCurrency ? currency : (selectedCari.currency || 'TRY'),
        issueDate,
        dueDate,
        bankName: bankName.trim(),
        bankBranch: bankBranch.trim(),
        accountNo: accountNo.trim(),
        status,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        exchangeRate: isMultiCurrency ? exchangeRate : undefined,
        convertedAmount: isMultiCurrency ? customConvertedAmount : undefined
      };

      const cekSenetId = await saveCekSenet(payload);

      // Optionally, create a Cari balance action (collection/payment) in islemler
      if (affectCariBalance) {
        const docLabel = docType === 'cheque' ? 'Çek' : 'Senet';
        const islemLabel = type === 'receivable' ? 'Alınan' : 'Verilen';
        
        await createTransaction({
          type: type === 'receivable' ? 'collection' : 'payment',
          cariId: selectedCariId,
          cariName: selectedCari.name,
          date: issueDate,
          amount,
          currency: isMultiCurrency ? currency : (selectedCari.currency || 'TRY'),
          account: '', // Open account tracking for now, will receive into cash/bank on collected status
          description: `${islemLabel} ${docLabel} Girişi (Seri: ${serialNo.trim()}, Portföy: ${portfolioNo})`,
          createdAt: new Date().toISOString(),
          exchangeRate: isMultiCurrency ? exchangeRate : undefined,
          convertedAmount: isMultiCurrency ? customConvertedAmount : undefined
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Kayıt sırasında bir hata oluştu.');
    }
  };

  // Open action modal
  const handleOpenActionModal = (item: CekSenet, act: typeof actionType) => {
    setSelectedItem(item);
    setActionType(act);
    setEndorseCariId('');
    setEndorseExchangeRate(1);
    setActionAccount('bank');
    setIsActionModalOpen(true);
  };

  // Execute State Transition
  const handleExecuteAction = async () => {
    if (!selectedItem) return;

    try {
      const updatedItem = { ...selectedItem };
      const docLabel = selectedItem.docType === 'cheque' ? 'Çek' : 'Senet';

      if (actionType === 'collect_cash' || actionType === 'collect_bank') {
        updatedItem.status = 'collected';
        
        // Save the updated check state
        await saveCekSenet(updatedItem, selectedItem.id);

        // Create transaction to receive cash or bank funds (this does NOT affect Cari balance, because cari balance was already updated when check was entered. It moves from cheque portfolio to cash/bank asset)
        await createTransaction({
          type: 'collection',
          cariId: selectedItem.cariId,
          cariName: selectedItem.cariName,
          date: new Date().toISOString().substring(0, 10),
          amount: selectedItem.amount,
          currency: selectedItem.currency,
          account: actionType === 'collect_cash' ? 'cash' : 'bank',
          description: `${docLabel} Tahsilatı (Seri: ${selectedItem.serialNo})`,
          createdAt: new Date().toISOString()
        });

      } else if (actionType === 'pay_bank') {
        updatedItem.status = 'paid';
        await saveCekSenet(updatedItem, selectedItem.id);

        // Create payment transaction from bank
        await createTransaction({
          type: 'payment',
          cariId: selectedItem.cariId,
          cariName: selectedItem.cariName,
          date: new Date().toISOString().substring(0, 10),
          amount: selectedItem.amount,
          currency: selectedItem.currency,
          account: 'bank',
          description: `Kendi ${docLabel} Ödememiz (Seri: ${selectedItem.serialNo})`,
          createdAt: new Date().toISOString()
        });

      } else if (actionType === 'endorse') {
        if (!endorseCariId) {
          alert('Lütfen ciro edilecek tedarikçi cariyi seçin.');
          return;
        }
        const targetCari = cariler.find(c => c.id === endorseCariId);
        if (!targetCari) return;

        updatedItem.status = 'endorsed';
        updatedItem.description = `${updatedItem.description || ''} (Ciro Edildi: ${targetCari.name})`.trim();
        await saveCekSenet(updatedItem, selectedItem.id);

        // Since we pay the supplier with this cheque, it decreases our debt to them (makes a payment transaction)
        await createTransaction({
          type: 'payment',
          cariId: targetCari.id,
          cariName: targetCari.name,
          date: new Date().toISOString().substring(0, 10),
          amount: selectedItem.amount,
          currency: selectedItem.currency,
          exchangeRate: selectedItem.currency !== 'TRY' ? endorseExchangeRate : 1,
          convertedAmount: selectedItem.currency !== 'TRY' ? selectedItem.amount * endorseExchangeRate : selectedItem.amount,
          account: '',
          description: `Müşteri ${docLabel} Cirosu ile Ödeme (Seri: ${selectedItem.serialNo}, Asıl Borçlu: ${selectedItem.debtor})`,
          createdAt: new Date().toISOString()
        });

      } else if (actionType === 'mark_unpaid') {
        updatedItem.status = 'unpaid';
        await saveCekSenet(updatedItem, selectedItem.id);

      } else if (actionType === 'return_portfolio') {
        updatedItem.status = 'portfolio';
        await saveCekSenet(updatedItem, selectedItem.id);
      }

      setIsActionModalOpen(false);
      setSelectedItem(null);
    } catch (err) {
      console.error('Eylem yürütülürken hata oluştu:', err);
      alert('İşlem gerçekleştirilemedi.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu çek/senet kaydını silmek istediğinize emin misiniz? (Finansal hareket geçmişini etkilemez)')) {
      try {
        await deleteCekSenet(id);
      } catch (err) {
        console.error('Silme hatası:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-xl font-light uppercase tracking-[0.15em] text-white/95 flex items-center gap-2">
            <Briefcase className="text-teal-500" size={20} />
            Çek ve Senet Takibi
          </h1>
          <p className="text-white/40 text-[11px] uppercase tracking-widest font-mono mt-1">
            Alınan ve verilen çek/senet vadeleri, tahsilat, ödeme ve ciro durumları
          </p>
        </div>

        {/* Currency Switcher & Add Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto self-end">
          <div className="bg-white/5 border border-white/10 rounded-lg p-0.5 flex gap-0.5">
            {(['TRY', 'USD', 'EUR'] as const).map(cur => (
              <button
                key={cur}
                id={`btn-currency-${cur}`}
                onClick={() => setActiveCurrency(cur)}
                className={`px-3 py-1 rounded text-[10px] font-bold font-mono uppercase tracking-wider transition ${
                  activeCurrency === cur ? 'bg-teal-500 text-black shadow-[0_0_8px_rgba(45,212,191,0.2)]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>

          <button
            id="btn-add-ceksenet"
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 text-black hover:bg-teal-400 font-semibold rounded-lg text-xs uppercase tracking-wider transition shadow-[0_0_12px_rgba(45,212,191,0.2)] cursor-pointer shrink-0 ml-auto sm:ml-0"
          >
            <Plus size={15} />
            <span>Yeni Çek/Senet</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Dashboard Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Receivables In Portfolio */}
        <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center">
            <Wallet size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold tracking-wider text-white/30 uppercase block font-mono">Portföydeki Çek/Senet</span>
            <div className="text-lg font-bold text-teal-300 font-mono mt-0.5 truncate">
              {stats.portfolioTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeCurrency}
            </div>
            <span className="text-[9px] text-white/40 mt-1 block uppercase tracking-widest font-mono">Tahsili bekleyen alınanlar</span>
          </div>
        </div>

        {/* Total Received (Cumulative) */}
        <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <ArrowDownLeft size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold tracking-wider text-white/30 uppercase block font-mono">Toplam Alınan Çek/Senet</span>
            <div className="text-lg font-bold text-white/90 font-mono mt-0.5 truncate">
              {stats.receivedTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeCurrency}
            </div>
            <span className="text-[9px] text-teal-400 mt-1 block uppercase tracking-widest font-mono">
              {stats.collectedTotal.toLocaleString('tr-TR')} {activeCurrency} tahsil edildi
            </span>
          </div>
        </div>

        {/* Total Paid / Issued Cheques */}
        <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
            <ArrowUpRight size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold tracking-wider text-white/30 uppercase block font-mono">Toplam Verilen (Kendi)</span>
            <div className="text-lg font-bold text-rose-300 font-mono mt-0.5 truncate">
              {stats.paidTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeCurrency}
            </div>
            <span className="text-[9px] text-white/40 mt-1 block uppercase tracking-widest font-mono">Ödenmeyi bekleyen taahhütler</span>
          </div>
        </div>

        {/* Near Maturity Count Warning */}
        <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            stats.nearMaturityCount > 0 
              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 animate-pulse' 
              : 'bg-white/5 border border-white/10 text-white/40'
          }`}>
            <Clock size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold tracking-wider text-white/30 uppercase block font-mono">Vadesi Yaklaşan Çekler</span>
            <div className={`text-lg font-bold font-mono mt-0.5 truncate ${stats.nearMaturityCount > 0 ? 'text-amber-300' : 'text-white/90'}`}>
              {stats.nearMaturityCount} Adet
            </div>
            <span className="text-[9px] text-white/40 mt-1 block uppercase tracking-widest font-mono">Gelecek 30 gün içinde vadesi</span>
          </div>
        </div>

      </div>

      {/* Filters and List */}
      <div className="bg-[#080808] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Filter Controls Bar */}
        <div className="p-5 border-b border-white/5 bg-black/20 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          
          {/* Text Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              id="search-ceksenet"
              type="text"
              placeholder="Cari, borçlu, seri, portföy no ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white/90 placeholder-white/20 focus:outline-hidden focus:border-teal-500 transition"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Structured Select Filters */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Direction Filter */}
            <div>
              <select
                id="filter-ceksenet-direction"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 bg-white/5 border border-white/10 text-white/80 rounded-xl text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500 font-medium"
              >
                <option value="all" className="bg-[#0c0c0c]">Tüm Yönler (Giriş/Çıkış)</option>
                <option value="receivable" className="bg-[#0c0c0c]">📥 Alınan Çek/Senet (Müşteri)</option>
                <option value="payable" className="bg-[#0c0c0c]">📤 Verilen Çek/Senet (Kendi)</option>
              </select>
            </div>

            {/* Document Type Filter */}
            <div>
              <select
                id="filter-ceksenet-doctype"
                value={filterDocType}
                onChange={(e) => setFilterDocType(e.target.value as any)}
                className="px-3 py-2 bg-white/5 border border-white/10 text-white/80 rounded-xl text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500 font-medium"
              >
                <option value="all" className="bg-[#0c0c0c]">Tüm Belge Tipleri</option>
                <option value="cheque" className="bg-[#0c0c0c]">🎫 Sadece Çekler</option>
                <option value="note" className="bg-[#0c0c0c]">📜 Sadece Senetler</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                id="filter-ceksenet-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-white/5 border border-white/10 text-white/80 rounded-xl text-xs bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500 font-medium"
              >
                <option value="all" className="bg-[#0c0c0c]">Tüm Durumlar</option>
                <option value="portfolio" className="bg-[#0c0c0c]">💼 Portföyde / Beklemede</option>
                <option value="collected" className="bg-[#0c0c0c]">✅ Tahsil Edildi</option>
                <option value="paid" className="bg-[#0c0c0c]">🏦 Ödendi</option>
                <option value="endorsed" className="bg-[#0c0c0c]">↗️ Ciro Edildi</option>
                <option value="unpaid" className="bg-[#0c0c0c]">❌ Karşılıksız / Ödenmedi</option>
              </select>
            </div>

          </div>

        </div>

        {/* Empty State */}
        {filteredCekSenet.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/30 mx-auto mb-4 border border-white/5">
              <FileText size={20} />
            </div>
            <h3 className="text-white/80 text-sm font-medium uppercase tracking-wider">Çek veya Senet Kaydı Bulunmadı</h3>
            <p className="text-white/30 text-xs mt-2 max-w-sm mx-auto uppercase tracking-widest font-mono">
              Arama kriterlerinize veya aktif filtrelerinize uyan kayıt bulunmuyor. Yeni çek/senet eklemek için sağ üstteki butona tıklayabilirsiniz.
            </p>
          </div>
        ) : (
          <div>
            
            {/* Desktop Table view (Hidden on small screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.01] text-[10px] text-white/35 font-mono uppercase tracking-wider">
                    <th className="p-4 font-semibold">Vade / Düzenleme</th>
                    <th className="p-4 font-semibold">Portföy / Belge No</th>
                    <th className="p-4 font-semibold">Cari Hesap / Borçlu</th>
                    <th className="p-4 font-semibold">Tip / Belge</th>
                    <th className="p-4 font-semibold text-right">Tutar</th>
                    <th className="p-4 font-semibold text-center">Durum</th>
                    <th className="p-4 font-semibold text-center">Durum Eylemleri</th>
                    <th className="p-4 font-semibold text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-white/80">
                  {filteredCekSenet.map((item) => {
                    const isReceivable = item.type === 'receivable';
                    const isPastDue = item.dueDate < new Date().toISOString().substring(0, 10) && item.status === 'portfolio';
                    
                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-white/[0.01] transition ${isPastDue ? 'bg-rose-500/[0.01] border-l-2 border-l-rose-500' : ''}`}
                      >
                        <td className="p-4">
                          <div className="font-mono font-semibold text-white/90 flex items-center gap-1.5">
                            {isPastDue && <span title="Vadesi Geçmiş!"><AlertTriangle size={13} className="text-rose-500 animate-pulse" /></span>}
                            <span>{item.dueDate}</span>
                          </div>
                          <div className="text-[10px] text-white/40 font-mono mt-0.5">Düz: {item.issueDate}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-mono font-bold text-white/90">{item.portfolioNo}</div>
                          <div className="text-[10px] text-white/50 font-mono mt-0.5">Seri: {item.serialNo}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-teal-300">{item.cariName}</div>
                          <div className="text-[10px] text-white/45 font-mono mt-0.5 flex items-center gap-1">
                            <User size={10} />
                            <span>Borçlu: {item.debtor}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider font-mono ${
                              isReceivable 
                                ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400' 
                                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                            }`}>
                              {isReceivable ? 'Alınan (Müşteri)' : 'Verilen (Kendi)'}
                            </span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide font-mono bg-white/5 border border-white/10 text-white/70">
                              {item.docType === 'cheque' ? 'Çek' : 'Senet'}
                            </span>
                          </div>
                          {item.bankName && (
                            <div className="text-[10px] text-white/35 mt-1 font-mono truncate max-w-[150px]" title={`${item.bankName} / ${item.bankBranch}`}>
                              🏛️ {item.bankName}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-white text-sm">
                          {item.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {item.currency}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wider ${
                            item.status === 'portfolio' ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' :
                            item.status === 'collected' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400' :
                            item.status === 'paid' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400' :
                            item.status === 'endorsed' ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400' :
                            'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                          }`}>
                            <span className={`w-1 h-1 rounded-full ${
                              item.status === 'portfolio' ? 'bg-amber-400' :
                              item.status === 'collected' || item.status === 'paid' ? 'bg-teal-400' :
                              item.status === 'endorsed' ? 'bg-purple-400' : 'bg-rose-500'
                            }`}></span>
                            {item.status === 'portfolio' ? (isReceivable ? 'PORTFÖYDE' : 'ÖDENECEK') :
                             item.status === 'collected' ? 'TAHSİL EDİLDİ' :
                             item.status === 'paid' ? 'ÖDENDİ' :
                             item.status === 'endorsed' ? 'CİRO EDİLDİ' : 'KARŞILIKSIZ / ÖDENMEDİ'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {item.status === 'portfolio' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              {isReceivable ? (
                                <>
                                  <button
                                    id={`btn-action-collect-cash-${item.id}`}
                                    onClick={() => handleOpenActionModal(item, 'collect_cash')}
                                    className="px-2 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded text-[10px] font-semibold transition"
                                    title="Kasaya Tahsil Et"
                                  >
                                    💵 Nakit Tahsil
                                  </button>
                                  <button
                                    id={`btn-action-collect-bank-${item.id}`}
                                    onClick={() => handleOpenActionModal(item, 'collect_bank')}
                                    className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded text-[10px] font-semibold transition"
                                    title="Bankaya Tahsil Et"
                                  >
                                    🏦 Banka Tahsil
                                  </button>
                                  <button
                                    id={`btn-action-endorse-${item.id}`}
                                    onClick={() => handleOpenActionModal(item, 'endorse')}
                                    className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded text-[10px] font-semibold transition"
                                    title="Tedarikçiye Ciro Et"
                                  >
                                    ↗️ Ciro Et
                                  </button>
                                </>
                              ) : (
                                <button
                                  id={`btn-action-pay-${item.id}`}
                                  onClick={() => handleOpenActionModal(item, 'pay_bank')}
                                  className="px-3 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/20 rounded text-[10px] font-semibold transition"
                                >
                                  🏦 Öde (Banka)
                                </button>
                              )}
                              
                              <button
                                id={`btn-action-unpaid-${item.id}`}
                                onClick={() => handleOpenActionModal(item, 'mark_unpaid')}
                                className="p-1 text-rose-400/50 hover:text-rose-400 hover:bg-white/5 rounded transition"
                                title="Ödenmedi / Karşılıksız İşaretle"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-[10px] text-white/30 font-mono">
                              <Lock size={11} className="text-white/20" />
                              <span>Eşitlendi</span>
                              <button
                                id={`btn-action-return-${item.id}`}
                                onClick={() => handleOpenActionModal(item, 'return_portfolio')}
                                className="ml-1 text-white/20 hover:text-white/60 p-0.5 rounded"
                                title="Portföy Durumuna Geri Al"
                              >
                                <RefreshCw size={10} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            id={`btn-delete-${item.id}`}
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-white/20 hover:text-rose-400 hover:bg-white/5 rounded transition"
                            title="Kaydı Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards view (Shown on small screens) */}
            <div className="block md:hidden divide-y divide-white/5">
              {filteredCekSenet.map((item) => {
                const isReceivable = item.type === 'receivable';
                const isPastDue = item.dueDate < new Date().toISOString().substring(0, 10) && item.status === 'portfolio';

                return (
                  <div 
                    key={item.id} 
                    className={`p-4 flex flex-col gap-3 transition ${isPastDue ? 'bg-rose-500/[0.01]' : ''}`}
                  >
                    
                    {/* Header: Date and Portfolio No */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-white/30 font-mono">{item.dueDate} vadesi</span>
                          {isPastDue && <span className="px-1 text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded font-mono">Vadesi Geçti</span>}
                        </div>
                        <div className="font-bold text-white/90 text-sm mt-0.5 font-mono">{item.portfolioNo}</div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider ${
                        item.status === 'portfolio' ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' :
                        item.status === 'collected' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400' :
                        item.status === 'paid' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400' :
                        item.status === 'endorsed' ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400' :
                        'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                      }`}>
                        {item.status === 'portfolio' ? (isReceivable ? 'PORTFÖY' : 'BEKLEYEN') :
                         item.status === 'collected' ? 'TAHSİL' :
                         item.status === 'paid' ? 'ÖDENDİ' :
                         item.status === 'endorsed' ? 'CİRO' : 'ÖDENMEDİ'}
                      </span>
                    </div>

                    {/* Body Info */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/[0.01] p-2.5 rounded-lg border border-white/5">
                      <div>
                        <span className="text-white/30 block font-mono uppercase tracking-wider text-[8px]">Cari Hesap</span>
                        <span className="font-bold text-teal-300 truncate block">{item.cariName}</span>
                      </div>
                      <div>
                        <span className="text-white/30 block font-mono uppercase tracking-wider text-[8px]">Asıl Borçlu</span>
                        <span className="font-medium text-white/80 truncate block">{item.debtor}</span>
                      </div>
                      <div>
                        <span className="text-white/30 block font-mono uppercase tracking-wider text-[8px]">Belge / Tip</span>
                        <span className="font-semibold text-white/70 block uppercase">
                          {item.docType === 'cheque' ? 'Çek' : 'Senet'} ({isReceivable ? 'Alınan' : 'Kendi'})
                        </span>
                      </div>
                      <div>
                        <span className="text-white/30 block font-mono uppercase tracking-wider text-[8px]">Seri / Çek No</span>
                        <span className="font-mono text-white/70 block">{item.serialNo}</span>
                      </div>
                    </div>

                    {/* Amount & Actions footer */}
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-base font-mono font-bold text-teal-400">
                        {item.amount.toLocaleString('tr-TR')} {item.currency}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.status === 'portfolio' ? (
                          <div className="flex items-center gap-1">
                            {isReceivable ? (
                              <button
                                onClick={() => handleOpenActionModal(item, 'collect_cash')}
                                className="px-2 py-1 bg-teal-500 text-black rounded text-[9px] font-bold uppercase tracking-wider transition"
                              >
                                Tahsil (Nakit)
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenActionModal(item, 'pay_bank')}
                                className="px-2 py-1 bg-teal-500 text-black rounded text-[9px] font-bold uppercase tracking-wider transition"
                              >
                                Öde (Banka)
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-white/30 font-mono">Muhasebeleştirildi</span>
                        )}

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-white/20 hover:text-rose-400 bg-white/5 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

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
                        <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Manuel Döviz Kuru</label>
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

    </div>
  );
}
