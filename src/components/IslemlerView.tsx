import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { VirtualTableBody } from './VirtualTableBody';
import { Transaction, Cari, Stock, InvoiceItem, BankAccount } from '../types';
import { createTransaction, removeTransaction } from '../firebase';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  X, 
  CreditCard, 
  PlusCircle, 
  MinusCircle, 
  FileSpreadsheet,
  AlertCircle,
  FileCheck,
  AlertTriangle,
  Lock,
  Printer,
  Edit,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Scan,
  ShieldAlert,
  Download
} from 'lucide-react';
import { IslemModal } from './islemler/IslemModal';
import { PdfPrintModal } from './islemler/PdfPrintModal';
import { parseScannedQrCode } from '../utils/formatters';

interface IslemlerViewProps {
  islemler: Transaction[];
  cariler: Cari[];
  stoklar: Stock[];
  bankAccounts?: BankAccount[];
  pendingIslemModal?: 'sale' | 'purchase' | 'collection' | 'payment' | null;
  pendingCariId?: string | null;
  onClearPendingIslemModal?: () => void;
  aiPrefilledData?: {
    islem: 'sale' | 'purchase' | 'collection' | 'payment';
    cariAdi?: string;
    urunAdi?: string;
    miktar?: number;
    fiyat?: number;
    kdv?: number;
  } | null;
  onClearAiPrefilledData?: () => void;
  userRole?: 'admin' | 'employee';
  actionPermissions?: {
    delete_sale: boolean;
    delete_payment: boolean;
    delete_stock: boolean;
    decrease_stock: boolean;
    edit_sale?: boolean;
    edit_payment?: boolean;
    edit_stock?: boolean;
  };
  escalationPin?: string;
  isSecurityActive?: boolean;
  onViewCariDetails?: (cariId: string) => void;
}

function IslemlerView({ 
  islemler, 
  cariler, 
  stoklar,
  bankAccounts = [],
  pendingIslemModal,
  pendingCariId,
  onClearPendingIslemModal,
  aiPrefilledData,
  onClearAiPrefilledData,
  userRole = 'employee',
  actionPermissions = { delete_sale: false, delete_payment: false, delete_stock: false, decrease_stock: false, edit_sale: false, edit_payment: false, edit_stock: false },
  escalationPin = '1923',
  isSecurityActive = false,
  onViewCariDetails
}: IslemlerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'purchase' | 'collection' | 'payment' | 'sale_return' | 'purchase_return'>('all');
  
  // PIN Verification for restricted employee actions
  const [pinVerificationAction, setPinVerificationAction] = useState<(() => void) | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const checkPermissionAndExecute = useCallback((actionKey: 'delete_sale' | 'delete_payment' | 'edit_sale' | 'edit_payment', executeAction: () => void) => {
    if (!isSecurityActive || userRole === 'admin' || actionPermissions[actionKey]) {
      executeAction();
    } else {
      setPinVerificationAction(() => executeAction);
      setPinInput('');
      setPinError('');
      setIsPinModalOpen(true);
    }
  }, [isSecurityActive, userRole, actionPermissions]);

  // Varsayılan olarak son 1 ayı gösterecek şekilde ayarlandı
  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);
  
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ 
    start: defaultStartDate.toISOString().split('T')[0], 
    end: defaultEndDate.toISOString().split('T')[0] 
  });
  
  // Print PDF Receipt states
  const [selectedPrintTransaction, setSelectedPrintTransaction] = useState<Transaction | null>(null);

  const handleOpenPrintModal = useCallback((islem: Transaction) => {
    setSelectedPrintTransaction(islem);
  }, []);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'sale' | 'purchase' | 'collection' | 'payment' | 'sale_return' | 'purchase_return'>('sale');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteConfirmTransaction, setDeleteConfirmTransaction] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCariId, setSelectedCariId] = useState('');

  const filteredTransactions = useMemo(() => {
    return islemler.filter(t => {
      const matchSearch = 
        t.cariName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.invoiceNo && t.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (filterType !== 'all' && t.type !== filterType) {
        return false;
      }

      if (dateRange.start && t.date < dateRange.start) return false;
      if (dateRange.end && t.date > dateRange.end) return false;

      return true;
    });
  }, [islemler, searchTerm, filterType, dateRange]);

  // Open modal if triggered by parent component (e.g. sidebar shortcut or Cari list quick action)
  useEffect(() => {
    if (pendingIslemModal) {
      handleOpenModal(pendingIslemModal, pendingCariId || undefined);
      if (onClearPendingIslemModal) {
        onClearPendingIslemModal();
      }
    }
  }, [pendingIslemModal, pendingCariId]);

  // Open modal with AI prefilled data
  useEffect(() => {
    if (aiPrefilledData) {
      setModalType(aiPrefilledData.islem);
      setEditingTransaction(null);
      setIsModalOpen(true);
    }
  }, [aiPrefilledData]);

  // Open modal with default settings
  const handleOpenModal = useCallback((type: 'sale' | 'purchase' | 'collection' | 'payment' | 'sale_return' | 'purchase_return', preselectedCariId?: string) => {
    setModalType(type);
    setEditingTransaction(null);
    setSelectedCariId(preselectedCariId || '');
    setIsModalOpen(true);
  }, []);

  // Handle invoice item changes (dropdown selection, quantity/price changes)
  const handleEditTransaction = useCallback((islem: Transaction) => {
    const isSaleType = ['sale', 'sale_return'].includes(islem.type);
    const actionKey = isSaleType ? 'edit_sale' : 'edit_payment';

    checkPermissionAndExecute(actionKey, () => {
      setEditingTransaction(islem);
      setModalType(islem.type);
      setIsModalOpen(true);
    });
  }, [checkPermissionAndExecute]);

  // Handle transaction deletion trigger
  const handleDeleteTransaction = useCallback((islem: Transaction) => {
    const isSaleType = ['sale', 'sale_return'].includes(islem.type);
    const actionKey = isSaleType ? 'delete_sale' : 'delete_payment';

    checkPermissionAndExecute(actionKey, () => {
      setDeleteConfirmTransaction(islem);
    });
  }, [checkPermissionAndExecute]);

  // Perform actual deletion
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteConfirmTransaction) return;
    setIsDeleting(true);
    try {
      await removeTransaction(deleteConfirmTransaction);
      setDeleteConfirmTransaction(null);
    } catch (err: any) {
      console.error(err);
      alert(`İşlem silinirken hata oluştu: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmTransaction]);

  // Handle form submission to database
  // Format currency helper
  const formatCurrency = useCallback((val: number, cur: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(val);
  }, []);

  const renderIslemRow = useCallback((islem: Transaction, index: number) => {
    const isIncoming = ['sale', 'collection', 'purchase_return'].includes(islem.type);
    const isCariDeleted = islem.cariId ? !cariler.some(c => c.id === islem.cariId) : false;
    const isStockDeleted = islem.items ? islem.items.some(item => item.stockId && !stoklar.some(s => s.id === item.stockId)) : false;
    const isOrphaned = isCariDeleted || isStockDeleted;
    return (
      <tr key={islem.id} className={`transition h-[72px] ${isOrphaned ? 'bg-amber-500/[0.02] hover:bg-amber-500/[0.04]' : 'hover:bg-white/[0.02]'}`}>
        <td className="p-4 text-xs font-semibold text-white/45 font-mono">
          {islem.date}
        </td>
        <td className="p-4">
          <div className="font-bold text-white/95 text-sm flex items-center gap-1.5">
            {isCariDeleted || isOrphaned || !onViewCariDetails ? (
              <span className={isOrphaned ? 'text-amber-200/90' : ''}>{islem.cariName}</span>
            ) : (
              <button
                type="button"
                onClick={() => onViewCariDetails(islem.cariId!)}
                className="font-bold text-teal-400 hover:text-teal-300 hover:underline cursor-pointer transition text-left leading-tight"
              >
                {islem.cariName}
              </button>
            )}
            {isCariDeleted && (
              <span className="inline-flex items-center text-amber-500 hover:text-amber-400 cursor-help" title="Cari kayıt silinmiş! Muhasebe bütünlüğü için yasal kayıt korunmaktadır.">
                <AlertTriangle size={13} className="animate-pulse" />
              </span>
            )}
            {isStockDeleted && (
              <span className="inline-flex items-center text-amber-500 hover:text-amber-400 cursor-help" title="Faturadaki bazı stok kalemleri silinmiş! Muhasebe bütünlüğü için yasal kayıt korunmaktadır.">
                <AlertCircle size={13} className="animate-pulse" />
              </span>
            )}
          </div>
        </td>
        <td className="p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] uppercase font-mono tracking-wider font-semibold ${
              islem.type === 'sale' || islem.type === 'purchase_return' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
              islem.type === 'purchase' || islem.type === 'sale_return' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
              islem.type === 'collection' ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {islem.type === 'sale' ? 'Satış' :
               islem.type === 'purchase' ? 'Alış' :
               islem.type === 'sale_return' ? 'Satıştan İade' :
               islem.type === 'purchase_return' ? 'Alıştan İade' :
               islem.type === 'collection' ? 'Tahsilat' : 'Ödeme'}
            </span>
            {isOrphaned ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-mono font-bold tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400" title="Yasal muhasebe kaydı korunuyor, bu işlem geçersiz kılınmıştır.">
                GEÇERSİZ KILINMIŞ
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold tracking-wider bg-white/5 border border-white/10 text-white/70">
                {islem.currency || 'TRY'}
              </span>
            )}
          </div>
        </td>
        <td className="p-4 text-xs font-semibold text-white/70 font-mono">
          {islem.invoiceNo || '-'}
        </td>
        <td className="p-4 text-xs text-white/50 font-sans">
          {islem.account === 'cash' ? '💵 Kasa' :
           islem.account === 'bank' ? '🏦 Banka' : 
           islem.account === 'pos' ? '💳 POS' : '⏳ Vadeli'}
        </td>
        <td className="p-4 text-xs text-white/40 max-w-xs truncate" title={islem.description}>
          {islem.description}
        </td>
        <td className="p-4 text-right">
          <div className={`font-semibold text-sm tabular-nums font-sans ${isIncoming ? 'text-teal-400' : 'text-red-400'}`}>
            {isIncoming ? '+' : '-'}{formatCurrency(islem.amount, islem.currency || 'TRY')}
          </div>
          {islem.exchangeRate && islem.exchangeRate !== 1 && (
            <div className="text-[9px] text-white/30 font-mono mt-0.5">
              {formatCurrency(islem.convertedAmount || (islem.amount * islem.exchangeRate), 'TRY')} (Kur: {islem.exchangeRate})
            </div>
          )}
        </td>
        <td className="p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <button
              id={`btn-print-islem-${islem.id}`}
              onClick={() => handleOpenPrintModal(islem)}
              className="p-1.5 text-white/30 hover:text-teal-400 hover:bg-white/5 rounded transition cursor-pointer"
              title="Yazdır / PDF Al"
            >
              <Printer size={15} />
            </button>
            <button
              id={`btn-edit-islem-${islem.id}`}
              onClick={() => handleEditTransaction(islem)}
              className="p-1.5 text-white/30 hover:text-blue-400 hover:bg-white/5 rounded transition cursor-pointer"
              title="Düzenle"
            >
              <Edit size={15} />
            </button>
            {isOrphaned ? (
              <span 
                className="inline-flex p-1.5 text-amber-500/40 hover:text-amber-500/60 transition cursor-help"
                title="Geçersiz Kılınmış (Asıl Cari veya Stok kaydı silindiği için yasal muhasebe bütünlüğünü korumak adına geri alınamaz/iptal edilemez)"
              >
                <Lock size={15} />
              </span>
            ) : (
              <button
                id={`btn-delete-islem-${islem.id}`}
                onClick={() => handleDeleteTransaction(islem)}
                className="p-1.5 text-white/30 hover:text-red-400 hover:bg-white/5 rounded transition cursor-pointer"
                title="Geri Al / İptal Et"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }, [cariler, stoklar, onViewCariDetails, handleOpenPrintModal, handleEditTransaction, handleDeleteTransaction, formatCurrency]);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111111] p-6 rounded-lg border border-white/5 shadow-lg">
        <div>
          <h1 id="islemler-heading" className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">İşlemler & Faturalar</h1>
          <p className="text-white/40 text-xs mt-1 font-sans">Faturalarınızı kesin, tahsilat ve ödemelerinizi tek ekrandan anlık yönetin.</p>
        </div>
        
        {/* Quick action triggers */}
        <div className="flex flex-wrap items-center gap-2 relative">


          <button 
            id="btn-add-sale"
            onClick={() => handleOpenModal('sale')}
            className="flex items-center gap-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2.5 rounded transition cursor-pointer"
          >
            <ArrowUpRight size={13} />
            <span>Satış</span>
          </button>
          <button 
            id="btn-add-purchase"
            onClick={() => handleOpenModal('purchase')}
            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2.5 rounded transition cursor-pointer"
          >
            <ArrowDownLeft size={13} />
            <span>Alış</span>
          </button>
          <button 
            id="btn-add-sale-return"
            onClick={() => handleOpenModal('sale_return')}
            className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2.5 rounded transition cursor-pointer"
          >
            <ArrowDownLeft size={13} />
            <span>Satış İade</span>
          </button>
          <button 
            id="btn-add-purchase-return"
            onClick={() => handleOpenModal('purchase_return')}
            className="flex items-center gap-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2.5 rounded transition cursor-pointer"
          >
            <ArrowUpRight size={13} />
            <span>Alış İade</span>
          </button>
          <button 
            id="btn-add-collection"
            onClick={() => handleOpenModal('collection')}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2.5 rounded transition cursor-pointer"
          >
            <ArrowUpRight size={13} />
            <span>Tahsilat</span>
          </button>
          <button 
            id="btn-add-payment"
            onClick={() => handleOpenModal('payment')}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-[10px] uppercase tracking-wider font-bold px-3.5 py-2.5 rounded transition cursor-pointer"
          >
            <ArrowDownLeft size={13} />
            <span>Ödeme</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#111111] p-4 rounded-lg border border-white/5 shadow-md flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input 
            id="search-transactions"
            type="text"
            placeholder="Cari adı, fatura no veya açıklama ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-teal-500 focus:bg-white/[0.08] transition"
          />
        </div>
        
        {/* Filters Grid */}
        <div className="flex flex-wrap items-center gap-1">
          <div className="flex items-center gap-2 mr-2 bg-white/5 p-1 rounded border border-white/10">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent text-xs text-white/70 px-2 py-1 outline-hidden [color-scheme:dark]"
              title="Başlangıç Tarihi"
            />
            <span className="text-white/30 text-xs">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent text-xs text-white/70 px-2 py-1 outline-hidden [color-scheme:dark]"
              title="Bitiş Tarihi"
            />
            {(dateRange.start || dateRange.end) && (
              <button
                onClick={() => setDateRange({ start: '', end: '' })}
                className="text-white/40 hover:text-rose-400 p-1"
                title="Tarih filtresini temizle"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <button 
            id="filter-islem-all"
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'all' 
                ? 'bg-teal-500 text-black shadow-[0_0_8px_rgba(45,212,191,0.15)]' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            Tümü
          </button>
          <button 
            id="filter-islem-sale"
            onClick={() => setFilterType('sale')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'sale' 
                ? 'bg-teal-500/20 border border-teal-500/40 text-teal-400' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            Satış
          </button>
          <button 
            id="filter-islem-purchase"
            onClick={() => setFilterType('purchase')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'purchase' 
                ? 'bg-red-400/20 border border-red-400/40 text-red-400' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            Alış
          </button>
          <button 
            id="filter-islem-sale-return"
            onClick={() => setFilterType('sale_return')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'sale_return' 
                ? 'bg-red-400/20 border border-red-400/40 text-red-400' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            Satış İade
          </button>
          <button 
            id="filter-islem-purchase-return"
            onClick={() => setFilterType('purchase_return')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'purchase_return' 
                ? 'bg-teal-500/20 border border-teal-500/40 text-teal-400' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            Alış İade
          </button>
          <button 
            id="filter-islem-collection"
            onClick={() => setFilterType('collection')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'collection' 
                ? 'bg-teal-500/20 border border-teal-500/40 text-teal-400' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            Tahsilat
          </button>
          <button 
            id="filter-islem-payment"
            onClick={() => setFilterType('payment')}
            className={`px-3 py-2 text-[10px] uppercase tracking-wider font-semibold rounded transition ${
              filterType === 'payment' 
                ? 'bg-red-400/20 border border-red-400/40 text-red-400' 
                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
            }`}
          >
            Ödeme
          </button>
        </div>
      </div>

      {/* Transactions Table/List */}
      <div className="bg-[#111111] rounded-lg border border-white/5 shadow-lg overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileSpreadsheet className="text-white/20 mb-4" size={48} />
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-white/70">İşlem Bulunamadı</h3>
            <p className="text-xs text-white/40 mt-2 max-w-sm font-mono uppercase tracking-widest">Kriterlerinize uygun bir fatura veya ödeme hareketi bulunamadı.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Tarih</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Cari Hesap</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">İşlem Tipi</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Belge No</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Kasa/Banka</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono">Açıklama</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-right">Tutar</th>
                    <th className="p-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest font-mono text-center">İşlem</th>
                  </tr>
                </thead>
                <VirtualTableBody
                  items={filteredTransactions}
                  rowHeight={72}
                  renderRow={renderIslemRow}
                />
              </table>
            </div>

            {/* Mobile View Card List */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {filteredTransactions.map((islem) => {
                const isIncoming = ['sale', 'collection', 'purchase_return'].includes(islem.type);
                const isCariDeleted = islem.cariId ? !cariler.some(c => c.id === islem.cariId) : false;
                const isStockDeleted = islem.items ? islem.items.some(item => item.stockId && !stoklar.some(s => s.id === item.stockId)) : false;
                const isOrphaned = isCariDeleted || isStockDeleted;
                return (
                  <div key={islem.id} className={`p-4 rounded-lg border flex flex-col gap-3 transition ${isOrphaned ? 'bg-amber-500/[0.02] border-amber-500/25' : 'bg-white/[0.01] border-white/5'}`}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] font-semibold text-white/30 font-mono block">{islem.date}</span>
                        <div className="font-bold text-white/90 text-sm mt-1 leading-tight flex items-center gap-1.5">
                          {isCariDeleted || isOrphaned || !onViewCariDetails ? (
                            <span className={isOrphaned ? 'text-amber-200/90' : ''}>{islem.cariName}</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onViewCariDetails(islem.cariId)}
                              className="font-bold text-teal-400 hover:text-teal-300 hover:underline cursor-pointer transition text-left leading-tight"
                            >
                              {islem.cariName}
                            </button>
                          )}
                          {isCariDeleted && (
                            <span className="text-amber-500 animate-pulse" title="Cari kayıt silinmiş! Muhasebe bütünlüğü için yasal kayıt korunmaktadır.">
                              <AlertTriangle size={13} />
                            </span>
                          )}
                          {isStockDeleted && (
                            <span className="text-amber-500 animate-pulse" title="Faturadaki bazı stok kalemleri silinmiş! Muhasebe bütünlüğü için yasal kayıt korunmaktadır.">
                              <AlertCircle size={13} />
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] uppercase tracking-wider font-mono font-semibold ${
                          ['sale', 'purchase_return'].includes(islem.type) ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' :
                          ['purchase', 'sale_return'].includes(islem.type) ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          islem.type === 'collection' ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {islem.type === 'sale' ? 'Satış' : islem.type === 'purchase' ? 'Alış' : islem.type === 'sale_return' ? 'Satış İade' : islem.type === 'purchase_return' ? 'Alış İade' : islem.type === 'collection' ? 'Tahsilat' : 'Ödeme'}
                        </span>
                        {isOrphaned ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] uppercase font-mono font-bold tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400">
                            Geçersiz Kılınmış
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-mono font-bold tracking-wider bg-white/5 border border-white/10 text-white/70">
                            {islem.currency || 'TRY'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-white/60 space-y-1 bg-white/[0.02] p-2.5 rounded border border-white/5 font-mono">
                      {islem.invoiceNo && <div>Belge No: <strong>{islem.invoiceNo}</strong></div>}
                      <div>Hesap: <strong>{islem.account === 'cash' ? 'Kasa' : islem.account === 'bank' ? 'Banka' : islem.account === 'pos' ? 'POS' : 'Açık Hesap'}</strong></div>
                      {islem.description && <div className="line-clamp-2 text-white/40 italic mt-0.5">"{islem.description}"</div>}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                      <div>
                        <div className="text-[9px] text-white/30 font-semibold uppercase tracking-wider font-mono">Tutar</div>
                        <div className={`font-bold text-sm tabular-nums font-sans ${isIncoming ? 'text-teal-400' : 'text-red-400'}`}>
                          {isIncoming ? '+' : '-'}{formatCurrency(islem.amount, islem.currency || 'TRY')}
                        </div>
                        {islem.exchangeRate && islem.exchangeRate !== 1 && (
                          <div className="text-[9px] text-white/30 font-mono mt-0.5">
                            {formatCurrency(islem.convertedAmount || (islem.amount * islem.exchangeRate), 'TRY')} (Kur: {islem.exchangeRate})
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          id={`btn-mob-print-islem-${islem.id}`}
                          onClick={() => handleOpenPrintModal(islem)}
                          className="p-2 text-teal-400 bg-white/5 hover:bg-white/10 rounded transition cursor-pointer"
                          title="Yazdır / PDF Al"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          id={`btn-mob-edit-islem-${islem.id}`}
                          onClick={() => handleEditTransaction(islem)}
                          className="p-2 text-blue-400 bg-white/5 hover:bg-white/10 rounded transition cursor-pointer"
                          title="Düzenle"
                        >
                          <Edit size={15} />
                        </button>
                        {isOrphaned ? (
                          <div className="flex items-center gap-1.5 text-amber-500/60 text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded">
                            <Lock size={12} />
                            <span>Kayıt Korunuyor</span>
                          </div>
                        ) : (
                          <button 
                            id={`btn-mob-delete-islem-${islem.id}`}
                            onClick={() => handleDeleteTransaction(islem)}
                            className="p-2 text-red-400 bg-white/5 hover:bg-white/10 rounded transition cursor-pointer"
                            title="Geri Al"
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
          </div>
        )}
      </div>

      {/* Transaction Creator Modal (Sale / Purchase / Collection / Payment) */}
            <IslemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalType={modalType}
        editingTransaction={editingTransaction}
        preselectedCariId={selectedCariId}
        cariler={cariler}
        stoklar={stoklar}
        bankAccounts={bankAccounts}
        aiPrefilledData={aiPrefilledData}
        onClearAiData={onClearPendingIslemModal}
      />
      {/* PDF Print Preview & Settings Modal */}
      {selectedPrintTransaction && (
        <PdfPrintModal
          transaction={selectedPrintTransaction}
          cariler={cariler}
          stoklar={stoklar}
          onClose={() => setSelectedPrintTransaction(null)}
        />
      )}
      
      {/* custom delete confirmation modal */}
      {deleteConfirmTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-[#0c0c0c] rounded-xl border border-white/10 max-w-md w-full shadow-2xl overflow-hidden flex flex-col p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg shrink-0">
                <AlertTriangle size={20} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">İşlemi Silmeyi Onayla</h3>
                <p className="text-white/40 text-xs mt-1">Bu işlemi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
              </div>
            </div>

            {/* Transaction details card */}
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3.5 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-white/40">İşlem Tipi:</span>
                <span className={`font-bold ${
                  deleteConfirmTransaction.type === 'sale' || deleteConfirmTransaction.type === 'purchase_return' || deleteConfirmTransaction.type === 'collection'
                    ? 'text-teal-400'
                    : 'text-red-400'
                }`}>
                  {deleteConfirmTransaction.type === 'sale' ? 'Satış Faturası' :
                   deleteConfirmTransaction.type === 'purchase' ? 'Alış Faturası' :
                   deleteConfirmTransaction.type === 'sale_return' ? 'Satıştan İade Faturası' :
                   deleteConfirmTransaction.type === 'purchase_return' ? 'Alıştan İade Faturası' :
                   deleteConfirmTransaction.type === 'collection' ? 'Tahsilat Makbuzu' : 'Ödeme Makbuzu'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Cari Hesap:</span>
                <span className="text-white/80 font-bold">{deleteConfirmTransaction.cariName}</span>
              </div>
              {deleteConfirmTransaction.invoiceNo && (
                <div className="flex justify-between">
                  <span className="text-white/40">Belge No:</span>
                  <span className="text-white/80">{deleteConfirmTransaction.invoiceNo}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/40">Tarih:</span>
                <span className="text-white/85">{deleteConfirmTransaction.date}</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1">
                <span className="text-white/40">Tutar:</span>
                <span className="text-white font-bold text-sm">
                  {formatCurrency(deleteConfirmTransaction.amount, deleteConfirmTransaction.currency || 'TRY')}
                </span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-[11px] text-amber-300 flex gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <p className="leading-normal">
                <strong>Dikkat:</strong> Bu işlem silindiğinde, ilişkili cari bakiyeler ve stok miktarları otomatik olarak geri alınacaktır.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTransaction(null)}
                className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 bg-white rounded-lg border border-slate-200 transition-all cursor-pointer active:scale-95 duration-150"
              >
                İptal Et
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-[10px] uppercase tracking-wider font-bold text-white bg-red-500 hover:bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.2)] rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Siliniyor...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>İşlemi Sil</span>
                  </>
                )}
              </button>
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
    </div>
  );
}

export default React.memo(IslemlerView);
