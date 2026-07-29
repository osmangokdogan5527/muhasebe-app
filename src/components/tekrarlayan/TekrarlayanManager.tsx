import React, { useState, useMemo } from 'react';
import { RecurringTransaction, BankAccount, Cari } from '../../types';
import { deleteRecurringTransaction, saveRecurringTransaction } from '../../firebase';
import { reportErrorToTelegram } from '../../utils/telegramLogger';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getPendingRecurringItems, getTodayISO } from '../../utils/recurringUtils';
import TekrarlayanModal from './TekrarlayanModal';
import OnayBekleyenModal from './OnayBekleyenModal';
import { 
  Clock, 
  Plus, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Pause, 
  Edit2, 
  Trash2, 
  Calendar, 
  Zap, 
  Droplets, 
  Flame, 
  Home, 
  FileText, 
  Users, 
  Utensils, 
  Car, 
  HelpCircle, 
  Phone,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  TrendingDown,
  Building
} from 'lucide-react';

interface TekrarlayanManagerProps {
  recurringTransactions: RecurringTransaction[];
  bankAccounts: BankAccount[];
  cariler: Cari[];
}

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  'Elektrik': Zap,
  'Su': Droplets,
  'Doğalgaz': Flame,
  'Kira': Home,
  'Muhasebe Gideri': FileText,
  'Maaş/Personel': Users,
  'Yemek/Mutfak': Utensils,
  'Ulaşım/Yakıt': Car,
  'İnternet/Telefon': Phone,
  'Personel Maaş/Avans': Users,
  'Vergi/SGK': FileText,
  'Diğer': HelpCircle
};

export default function TekrarlayanManager({
  recurringTransactions,
  bankAccounts,
  cariler
}: TekrarlayanManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'paused'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTransaction | null>(null);
  const [pendingItemToApprove, setPendingItemToApprove] = useState<RecurringTransaction | null>(null);

  const todayStr = getTodayISO();

  // Pending items count
  const pendingItems = useMemo(() => {
    return getPendingRecurringItems(recurringTransactions, todayStr);
  }, [recurringTransactions, todayStr]);

  // Total estimated monthly expenditure
  const totalMonthlyExpense = useMemo(() => {
    return recurringTransactions
      .filter((item) => item.status === 'active' && item.type === 'expense')
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [recurringTransactions]);

  // Filtered items
  const filteredList = useMemo(() => {
    return recurringTransactions.filter((item) => {
      // Search
      const matchesSearch = 
        !searchTerm.trim() ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.cariName && item.cariName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

      // Category
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

      // Status
      let matchesStatus = true;
      if (statusFilter === 'pending') {
        matchesStatus = item.status === 'active' && !!item.nextDueDate && item.nextDueDate <= todayStr;
      } else if (statusFilter === 'active') {
        matchesStatus = item.status === 'active';
      } else if (statusFilter === 'paused') {
        matchesStatus = item.status === 'paused';
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [recurringTransactions, searchTerm, selectedCategory, statusFilter, todayStr]);

  // Toggle active/paused status
  const handleToggleStatus = async (item: RecurringTransaction) => {
    try {
      const newStatus = item.status === 'active' ? 'paused' : 'active';
      const updated: Omit<RecurringTransaction, 'id'> = {
        ...item,
        status: newStatus
      };
      await saveRecurringTransaction(updated, item.id);
    } catch (err: any) {
      reportErrorToTelegram(err, 'TekrarlayanManager.handleToggleStatus');
      alert(`Durum değiştirilirken hata oluştu: ${err.message || ''}`);
    }
  };

  // Delete template
  const handleDelete = async (item: RecurringTransaction) => {
    if (!window.confirm(`"${item.title}" şablonunu silmek istediğinize emin misiniz?`)) {
      return;
    }
    try {
      await deleteRecurringTransaction(item.id);
    } catch (err: any) {
      reportErrorToTelegram(err, 'TekrarlayanManager.handleDelete');
      alert(`Silinirken hata oluştu: ${err.message || ''}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Active Recurring */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Aktif Abonelik & Şablon
            </p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {recurringTransactions.filter(i => i.status === 'active').length} <span className="text-sm font-normal text-slate-400">Adet</span>
            </h4>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Approvals Widget */}
        <div className={`border p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all ${
          pendingItems.length > 0 
            ? 'bg-gradient-to-r from-[var(--accent-50)] to-[var(--accent-100)] dark:from-[var(--accent-950)]/40 dark:to-[var(--accent-900)]/30 border-[var(--accent-300)] dark:border-[var(--accent-800)]' 
            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-[var(--accent-700)] dark:text-[var(--accent-400)] uppercase tracking-wider">
                Onay Bekleyen İşlemler
              </p>
              {pendingItems.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-[var(--accent-600)] text-white rounded-full animate-pulse">
                  {pendingItems.length} VADESİ GELDİ
                </span>
              )}
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {pendingItems.length} <span className="text-sm font-normal text-slate-500 dark:text-zinc-400">Gider</span>
            </h4>
          </div>
          {pendingItems.length > 0 ? (
            <button
              onClick={() => {
                setStatusFilter('pending');
                if (pendingItems[0]) setPendingItemToApprove(pendingItems[0]);
              }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-[var(--accent-600)] hover:bg-[var(--accent-700)] rounded-xl shadow-sm transition-all flex items-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              İncele ve Onayla
            </button>
          ) : (
            <div className="p-3 bg-slate-100 dark:bg-zinc-800 text-slate-400 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Total Monthly Estimated Expense */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Tahmini Aylık Düzenli Yük
            </p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {formatCurrency(totalMonthlyExpense, 'TRY')}
            </h4>
          </div>
          <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search & Category */}
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Abonelik, kira veya şablon ara..."
              className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">⚠️ Onay Bekleyenler ({pendingItems.length})</option>
              <option value="active">🟢 Aktif Şablonlar</option>
              <option value="paused">🟡 Duraklatılanlar</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
            >
              <option value="all">Tüm Kategoriler</option>
              {Object.keys(CATEGORY_ICONS).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add New Template Button */}
        <button
          onClick={() => {
            setEditingTemplate(null);
            setIsCreateModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-white bg-[var(--accent-600)] hover:bg-[var(--accent-700)] active:scale-[0.98] rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yeni Tekrarlayan İşlem / Abonelik Ekle
        </button>
      </div>

      {/* List / Cards */}
      {filteredList.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-zinc-700 mb-3 animate-pulse" />
          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
            Tekrarlayan İşlem Bulunamadı
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
            Her ay otomatik onay kuyruğuna düşecek kira, fatura, abonelik ve maaş gibi düzenli giderlerinizi tanımlayabilirsiniz.
          </p>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setIsCreateModalOpen(true);
            }}
            className="mt-4 px-4 py-2 text-xs font-bold text-[var(--accent-600)] bg-[var(--accent-50)] dark:bg-[var(--accent-950)]/50 rounded-xl hover:bg-[var(--accent-100)] transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            İlk Şablonu Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => {
            const IconComp = CATEGORY_ICONS[item.category] || FileText;
            const isDue = item.status === 'active' && !!item.nextDueDate && item.nextDueDate <= todayStr;

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between relative overflow-hidden ${
                  isDue 
                    ? 'border-[var(--accent-400)] dark:border-[var(--accent-700)] ring-2 ring-[var(--accent-500)]/20' 
                    : item.status === 'paused'
                    ? 'border-slate-200 dark:border-zinc-800 opacity-70'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-[var(--accent-300)]'
                }`}
              >
                {/* Top Row: Icon, Title & Status */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        isDue 
                          ? 'bg-[var(--accent-600)] text-white animate-bounce' 
                          : 'bg-[var(--accent-50)] dark:bg-[var(--accent-950)]/40 text-[var(--accent-600)] dark:text-[var(--accent-400)]'
                      }`}>
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                          {item.title}
                        </h4>
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-md mt-0.5">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isDue ? (
                        <span className="px-2.5 py-1 text-[10px] font-black bg-[var(--accent-600)] text-white rounded-lg shadow-sm">
                          ONAY BEKLEYEN
                        </span>
                      ) : item.status === 'active' ? (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200/50">
                          🟢 AKTİF
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-lg">
                          🟡 PAUSE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 my-3 text-xs text-slate-600 dark:text-zinc-300">
                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-400">Tahmini Tutar:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.amount, item.currency || 'TRY')}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-zinc-800">
                      <span className="text-slate-400">Periyot / Gün:</span>
                      <span className="font-medium">
                        {item.frequency === 'monthly' ? `Her Ayın ${item.dayOfMonth}. Günü` : item.frequency === 'weekly' ? 'Her Hafta' : 'Her Yıl'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Sonraki Vade:</span>
                      <span className={`font-bold ${isDue ? 'text-[var(--accent-600)] dark:text-[var(--accent-400)]' : 'text-slate-700 dark:text-zinc-200'}`}>
                        {formatDate(item.nextDueDate)}
                      </span>
                    </div>

                    {item.cariName && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-zinc-400 pt-1">
                        <Building className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{item.cariName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2 mt-2">
                  {isDue ? (
                    <button
                      onClick={() => setPendingItemToApprove(item)}
                      className="w-full py-2 text-xs font-bold text-white bg-[var(--accent-600)] hover:bg-[var(--accent-700)] rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Düzenle ve Onayla
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          title={item.status === 'active' ? 'Duraklat' : 'Aktifleştir'}
                          className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          {item.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-500" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingTemplate(item);
                            setIsCreateModalOpen(true);
                          }}
                          title="Şablonu Düzenle"
                          className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPendingItemToApprove(item)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-[var(--accent-700)] dark:text-[var(--accent-400)] bg-[var(--accent-50)] dark:bg-[var(--accent-950)]/40 hover:bg-[var(--accent-100)] rounded-lg transition-colors flex items-center gap-1"
                          title="Şimdi Gidere İşle"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Gidere İşle
                        </button>

                        <button
                          onClick={() => handleDelete(item)}
                          title="Sil"
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <TekrarlayanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        editingItem={editingTemplate}
        bankAccounts={bankAccounts}
        cariler={cariler}
      />

      <OnayBekleyenModal
        isOpen={!!pendingItemToApprove}
        onClose={() => setPendingItemToApprove(null)}
        pendingItem={pendingItemToApprove}
        bankAccounts={bankAccounts}
        cariler={cariler}
      />
    </div>
  );
}
