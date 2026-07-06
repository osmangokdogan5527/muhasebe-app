import React, { useState, useMemo, useEffect } from 'react';
import { Expense } from '../types';
import { saveExpense, deleteExpense } from '../firebase';
import { 
  Plus, 
  Search, 
  Wallet, 
  Calendar, 
  Edit2, 
  Trash2, 
  X, 
  TrendingDown, 
  Tag, 
  FileText, 
  Zap, 
  Droplets, 
  Flame, 
  Home, 
  Users, 
  Utensils, 
  Car, 
  HelpCircle,
  TrendingUp,
  Briefcase,
  Phone
} from 'lucide-react';

interface MasraflarViewProps {
  expenses: Expense[];
  aiPrefilledData?: {
    islem: 'expense' | 'sale' | 'purchase' | 'collection' | 'payment' | 'employee_payment';
    cariAdi?: string;
    urunAdi?: string;
    miktar?: number;
    fiyat?: number;
    kdv?: number;
  } | null;
  onClearAiPrefilledData?: () => void;
}

const CATEGORY_ICONS: Record<Expense['category'], React.ComponentType<any>> = {
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

const CATEGORY_COLORS: Record<Expense['category'], string> = {
  'Elektrik': 'bg-amber-50 text-amber-600 border-amber-200/50',
  'Su': 'bg-sky-50 text-sky-600 border-sky-200/50',
  'Doğalgaz': 'bg-orange-50 text-orange-600 border-orange-200/50',
  'Kira': 'bg-emerald-50 text-emerald-600 border-emerald-200/50',
  'Muhasebe Gideri': 'bg-indigo-50 text-indigo-600 border-indigo-200/50',
  'Maaş/Personel': 'bg-purple-50 text-purple-600 border-purple-200/50',
  'Yemek/Mutfak': 'bg-rose-50 text-rose-600 border-rose-200/50',
  'Ulaşım/Yakıt': 'bg-cyan-50 text-cyan-600 border-cyan-200/50',
  'İnternet/Telefon': 'bg-blue-50 text-blue-600 border-blue-200/50',
  'Personel Maaş/Avans': 'bg-purple-50 text-purple-600 border-purple-200/50',
  'Vergi/SGK': 'bg-red-50 text-red-600 border-red-200/50',
  'Diğer': 'bg-slate-50 text-slate-600 border-slate-200/50'
};

export default function MasraflarView({ expenses, aiPrefilledData, onClearAiPrefilledData }: MasraflarViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'Elektrik' as Expense['category'],
    amount: 0,
    currency: 'TRY' as 'TRY' | 'USD' | 'EUR',
    date: new Date().toISOString().split('T')[0],
    account: 'cash' as 'cash' | 'bank' | 'pos',
    description: ''
  });
  
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (aiPrefilledData && aiPrefilledData.islem === 'expense') {
      setEditingExpense(null);
      setFormError('');
      
      // Determine category roughly based on title
      let cat = 'Diğer' as Expense['category'];
      const titleLower = (aiPrefilledData.urunAdi || aiPrefilledData.cariAdi || '').toLowerCase();
      if (titleLower.includes('su')) cat = 'Su';
      else if (titleLower.includes('elektrik')) cat = 'Elektrik';
      else if (titleLower.includes('internet') || titleLower.includes('telefon')) cat = 'İnternet/Telefon';
      else if (titleLower.includes('kira')) cat = 'Kira';
      else if (titleLower.includes('maaş') || titleLower.includes('personel')) cat = 'Personel Maaş/Avans';
      else if (titleLower.includes('yemek')) cat = 'Yemek/Mutfak';
      else if (titleLower.includes('ulaşım') || titleLower.includes('yakıt')) cat = 'Ulaşım/Yakıt';
      else if (titleLower.includes('vergi') || titleLower.includes('sgk')) cat = 'Vergi/SGK';

      setFormData({
        title: aiPrefilledData.urunAdi || aiPrefilledData.cariAdi || 'AI Otomatik Masraf',
        category: cat,
        amount: aiPrefilledData.fiyat || 0,
        currency: 'TRY',
        date: new Date().toISOString().split('T')[0],
        account: 'cash',
        description: 'Storm AI tarafından dolduruldu.'
      });
      
      setIsModalOpen(true);
      
      if (onClearAiPrefilledData) {
        onClearAiPrefilledData();
      }
    }
  }, [aiPrefilledData]);

  // Filter and search
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchSearch = 
        exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.description && exp.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = filterCategory === 'all' || exp.category === filterCategory;

      return matchSearch && matchCategory;
    });
  }, [expenses, searchTerm, filterCategory]);

  // Totals calculations
  const totalStats = useMemo(() => {
    const totalsByCurrency = { TRY: 0, USD: 0, EUR: 0 };
    const categoryTotals = {} as Record<Expense['category'], number>;

    expenses.forEach(exp => {
      totalsByCurrency[exp.currency] = (totalsByCurrency[exp.currency] || 0) + exp.amount;
      
      // Calculate active currency category breakdown
      if (exp.currency === selectedCurrency) {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      }
    });

    return {
      totalsByCurrency,
      categoryTotals,
      totalCount: expenses.length
    };
  }, [expenses, selectedCurrency]);

  const handleOpenCreateModal = () => {
    setEditingExpense(null);
    setFormData({
      title: '',
      category: 'Elektrik',
      amount: 0,
      currency: 'TRY',
      date: new Date().toISOString().split('T')[0],
      account: 'cash',
      description: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      account: expense.account,
      description: expense.description || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Bu masraf kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await deleteExpense(id);
    } catch (err: any) {
      alert('Masraf silinirken hata oluştu: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Lütfen masraf başlığı girin.');
      return;
    }
    if (formData.amount <= 0) {
      setFormError('Lütfen geçerli bir tutar girin.');
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');
      
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        amount: Number(formData.amount),
        currency: formData.currency,
        date: formData.date,
        account: formData.account,
        description: formData.description.trim(),
        createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString()
      };

      await saveExpense(payload, editingExpense?.id);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Kayıt sırasında hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : '€';
    return `${symbol}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Header and Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 id="masraflar-heading" className="text-xl font-extrabold uppercase tracking-wider text-slate-900">Gider ve Masraf Takibi</h1>
          <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-widest">
            İŞLETME GİDERLERİ • FATURALAR • DÜZENLİ ÖDEMELER
          </p>
        </div>
        <button
          id="add-expense-btn"
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
        >
          <Plus size={16} />
          <span>Yeni Masraf Ekle</span>
        </button>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#ffffff] p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <TrendingDown size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Toplam Masraf (TL)</span>
            <h4 className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(totalStats.totalsByCurrency.TRY || 0, 'TRY')}
            </h4>
          </div>
        </div>

        <div className="bg-[#ffffff] p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <TrendingDown size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Toplam Masraf (USD)</span>
            <h4 className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(totalStats.totalsByCurrency.USD || 0, 'USD')}
            </h4>
          </div>
        </div>

        <div className="bg-[#ffffff] p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <TrendingDown size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Toplam Masraf (EUR)</span>
            <h4 className="text-xl font-bold text-slate-900 mt-1">
              {formatCurrency(totalStats.totalsByCurrency.EUR || 0, 'EUR')}
            </h4>
          </div>
        </div>

        <div className="bg-[#ffffff] p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
            <Wallet size={20} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kayıtlı Fatura/Gider</span>
            <h4 className="text-xl font-bold text-slate-900 mt-1">
              {totalStats.totalCount} Adet
            </h4>
          </div>
        </div>
      </div>

      {/* Main Content Layout with List and Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Expenses Table/List (2 Columns wide) */}
        <div className="lg:col-span-2 bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row justify-between gap-3">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </span>
              <input
                id="expense-search"
                type="text"
                placeholder="Masraf adı veya açıklama ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-rose-500 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-900"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                id="category-filter"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-rose-500 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="all">Tüm Kategoriler</option>
                <option value="Elektrik">Elektrik</option>
                <option value="Su">Su</option>
                <option value="Doğalgaz">Doğalgaz</option>
                <option value="Kira">Kira</option>
                <option value="Muhasebe Gideri">Muhasebe</option>
                <option value="Maaş/Personel">Maaş/Personel</option>
                <option value="Yemek/Mutfak">Yemek/Mutfak</option>
                <option value="Ulaşım/Yakıt">Ulaşım/Yakıt</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tarih</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Açıklama / Başlık</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ödeme Yeri</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Tutar</th>
                  <th className="py-3.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      Eşleşen masraf kaydı bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const CatIcon = CATEGORY_ICONS[exp.category] || HelpCircle;
                    const catColorClass = CATEGORY_COLORS[exp.category] || 'bg-slate-50 text-slate-600 border-slate-100';
                    
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-4 whitespace-nowrap text-slate-500 font-mono">
                          {exp.date}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-slate-800">{exp.title}</div>
                          {exp.description && (
                            <div className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate">{exp.description}</div>
                          )}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${catColorClass}`}>
                            <CatIcon size={11} />
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            exp.account === 'cash' 
                              ? 'bg-amber-100/50 text-amber-800' 
                              : exp.account === 'pos'
                              ? 'bg-purple-100/50 text-purple-800'
                              : 'bg-teal-100/50 text-teal-800'
                          }`}>
                            {exp.account === 'cash' ? 'Kasa' : exp.account === 'pos' ? 'POS' : 'Banka'}
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-right font-extrabold text-slate-900">
                          {formatCurrency(exp.amount, exp.currency)}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(exp)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                              title="Düzenle"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Sil"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category breakdown sidebar card (1 Column wide) */}
        <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Kategori Analizi</h3>
              
              {/* Currency switcher */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                {(['TRY', 'USD', 'EUR'] as const).map(curr => (
                  <button
                    key={curr}
                    onClick={() => setSelectedCurrency(curr)}
                    className={`px-2 py-1 text-[10px] font-extrabold rounded-md transition cursor-pointer ${
                      selectedCurrency === curr 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {curr === 'TRY' ? '₺' : curr === 'USD' ? '$' : '€'}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-semibold mt-4 mb-5 uppercase tracking-wider">
              {selectedCurrency} Para birimi bazında kategori dağılımı:
            </p>

            <div className="space-y-4">
              {(Object.keys(CATEGORY_ICONS) as Expense['category'][]).map(cat => {
                const amount = totalStats.categoryTotals[cat] || 0;
                const totalActive = (Object.values(totalStats.categoryTotals) as number[]).reduce((a, b) => a + b, 0);
                const percent = totalActive > 0 ? (amount / totalActive) * 100 : 0;
                
                const CatIcon = CATEGORY_ICONS[cat] || HelpCircle;
                const colors = CATEGORY_COLORS[cat] || 'text-slate-600 bg-slate-50';

                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${colors.split(' ')[0]} ${colors.split(' ')[1]} border border-black/5`}>
                          <CatIcon size={12} />
                        </span>
                        <span className="font-bold text-slate-700">{cat}</span>
                      </div>
                      <span className="font-mono font-extrabold text-slate-900">
                        {formatCurrency(amount, selectedCurrency)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          cat === 'Elektrik' ? 'bg-amber-500' :
                          cat === 'Su' ? 'bg-sky-500' :
                          cat === 'Doğalgaz' ? 'bg-orange-500' :
                          cat === 'Kira' ? 'bg-emerald-500' :
                          cat === 'Muhasebe Gideri' ? 'bg-indigo-500' :
                          cat === 'Maaş/Personel' ? 'bg-purple-500' :
                          cat === 'Yemek/Mutfak' ? 'bg-rose-500' :
                          cat === 'Ulaşım/Yakıt' ? 'bg-cyan-500' :
                          'bg-slate-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
            <span>Seçilen Para Birimi Gideri</span>
            <span className="font-extrabold text-slate-800">
              {formatCurrency((Object.values(totalStats.categoryTotals) as number[]).reduce((a, b) => a + b, 0), selectedCurrency)}
            </span>
          </div>
        </div>

      </div>

      {/* CREATE & EDIT EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#ffffff] rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <TrendingDown size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    {editingExpense ? 'Gider Kaydını Düzenle' : 'Yeni Gider / Masraf Ekle'}
                  </h3>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono mt-0.5">
                    STORM MUHASEBE MASRAF FORMU
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-lg border border-rose-100 text-xs font-bold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Gider Başlığı / Açıklaması *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Haziran Elektrik Faturası, Temmuz Ofis Kirası"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-slate-200 focus:border-rose-500 focus:ring-rose-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Masraf Kategorisi *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Expense['category'] })}
                    className="w-full border border-slate-200 focus:border-rose-500 focus:ring-rose-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 cursor-pointer"
                  >
                    <option value="Elektrik">Elektrik</option>
                    <option value="Su">Su</option>
                    <option value="Doğalgaz">Doğalgaz</option>
                    <option value="Kira">Kira</option>
                    <option value="Muhasebe Gideri">Muhasebe</option>
                    <option value="Maaş/Personel">Maaş/Personel</option>
                    <option value="Yemek/Mutfak">Yemek/Mutfak</option>
                    <option value="Ulaşım/Yakıt">Ulaşım/Yakıt</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Gider Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-slate-200 focus:border-rose-500 focus:ring-rose-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 font-mono"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tutar *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-200 focus:border-rose-500 focus:ring-rose-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 font-mono"
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Para Birimi *
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'TRY' | 'USD' | 'EUR' })}
                    className="w-full border border-slate-200 focus:border-rose-500 focus:ring-rose-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 cursor-pointer"
                  >
                    <option value="TRY">₺ TRY</option>
                    <option value="USD">$ USD</option>
                    <option value="EUR">€ EUR</option>
                  </select>
                </div>

                {/* Account (Payment Method) */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Ödeme Kaynağı *
                  </label>
                  <select
                    value={formData.account}
                    onChange={(e) => setFormData({ ...formData, account: e.target.value as 'cash' | 'bank' | 'pos' })}
                    className="w-full border border-slate-200 focus:border-rose-500 focus:ring-rose-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50 cursor-pointer"
                  >
                    <option value="cash">Kasa (Nakit)</option>
                    <option value="bank">Banka (Havale/EFT)</option>
                    <option value="pos">POS (Kredi Kartı)</option>
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Detaylı Açıklama / Notlar
                  </label>
                  <textarea
                    placeholder="Masrafa dair ek notlar, fatura numarası vb. bilgileri buraya girebilirsiniz."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full border border-slate-200 focus:border-rose-500 focus:ring-rose-500 rounded-lg p-2.5 text-xs text-slate-900 bg-slate-50"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-wider rounded-lg hover:bg-slate-50 transition cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white uppercase tracking-wider bg-rose-600 hover:bg-rose-700 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? 'Kaydediliyor...' : editingExpense ? 'Değişiklikleri Kaydet' : 'Masrafı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
