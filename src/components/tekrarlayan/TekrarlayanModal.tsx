import React, { useState, useEffect } from 'react';
import { RecurringTransaction, Expense, BankAccount, Cari } from '../../types';
import { saveRecurringTransaction } from '../../firebase';
import { reportErrorToTelegram } from '../../utils/telegramLogger';
import { calculateNextDueDate, getTodayISO } from '../../utils/recurringUtils';
import { X, Calendar, DollarSign, FileText, CheckCircle, Clock, Building, Wallet, Layers } from 'lucide-react';

interface TekrarlayanModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem?: RecurringTransaction | null;
  bankAccounts: BankAccount[];
  cariler: Cari[];
}

const CATEGORIES: Expense['category'][] = [
  'Kira',
  'Muhasebe Gideri',
  'İnternet/Telefon',
  'Elektrik',
  'Su',
  'Doğalgaz',
  'Maaş/Personel',
  'Personel Maaş/Avans',
  'Vergi/SGK',
  'Yemek/Mutfak',
  'Ulaşım/Yakıt',
  'Diğer'
];

export default function TekrarlayanModal({
  isOpen,
  onClose,
  editingItem,
  bankAccounts,
  cariler
}: TekrarlayanModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState<Expense['category']>('Kira');
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [account, setAccount] = useState<'cash' | 'bank' | 'pos'>('cash');
  const [bankAccountId, setBankAccountId] = useState('');
  const [cariId, setCariId] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [startDate, setStartDate] = useState(getTodayISO());
  const [endDate, setEndDate] = useState('');
  const [nextDueDate, setNextDueDate] = useState(getTodayISO());
  const [status, setStatus] = useState<'active' | 'paused'>('active');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title || '');
      setType(editingItem.type || 'expense');
      setCategory(editingItem.category || 'Kira');
      setAmount(editingItem.amount || 0);
      setCurrency(editingItem.currency || 'TRY');
      setAccount(editingItem.account || 'cash');
      setBankAccountId(editingItem.bankAccountId || '');
      setCariId(editingItem.cariId || '');
      setFrequency(editingItem.frequency || 'monthly');
      setDayOfMonth(editingItem.dayOfMonth || 1);
      setStartDate(editingItem.startDate || getTodayISO());
      setEndDate(editingItem.endDate || '');
      setNextDueDate(editingItem.nextDueDate || getTodayISO());
      setStatus(editingItem.status || 'active');
      setDescription(editingItem.description || '');
    } else {
      // Reset defaults
      const today = getTodayISO();
      const currentDay = new Date().getDate();
      setTitle('');
      setType('expense');
      setCategory('Kira');
      setAmount(0);
      setCurrency('TRY');
      setAccount('cash');
      setBankAccountId('');
      setCariId('');
      setFrequency('monthly');
      setDayOfMonth(currentDay);
      setStartDate(today);
      setEndDate('');
      setNextDueDate(today);
      setStatus('active');
      setDescription('');
    }
    setErrorMsg('');
  }, [editingItem, isOpen]);

  // When dayOfMonth or startDate changes for a new item, update nextDueDate
  const handleDayOfMonthChange = (val: number) => {
    const day = Math.min(Math.max(1, val), 31);
    setDayOfMonth(day);
    if (!editingItem) {
      // Auto adjust next due date to match selected day
      const d = new Date(startDate || getTodayISO());
      const yyyy = d.getFullYear();
      const mm = d.getMonth();
      const maxDays = new Date(yyyy, mm + 1, 0).getDate();
      const targetDay = Math.min(day, maxDays);
      const newDueDate = new Date(yyyy, mm, targetDay);
      const yStr = newDueDate.getFullYear();
      const mStr = String(newDueDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(newDueDate.getDate()).padStart(2, '0');
      setNextDueDate(`${yStr}-${mStr}-${dStr}`);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Lütfen şablon için açıklayıcı bir başlık girin.');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('Lütfen 0\'dan büyük bir tutar girin.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const selectedCari = cariler.find(c => c.id === cariId);
      const payload: Omit<RecurringTransaction, 'id'> = {
        title: title.trim(),
        type,
        category,
        amount: Number(amount),
        currency,
        account,
        bankAccountId: account === 'bank' || account === 'pos' ? bankAccountId : '',
        cariId: cariId || '',
        cariName: selectedCari ? selectedCari.name : '',
        frequency,
        dayOfMonth: Number(dayOfMonth),
        startDate: startDate || getTodayISO(),
        endDate: endDate || '',
        nextDueDate: nextDueDate || getTodayISO(),
        autoApprove: false, // Her zaman onay mekanizması aktif
        status,
        description: description.trim(),
        createdAt: editingItem?.createdAt || new Date().toISOString()
      };

      await saveRecurringTransaction(payload, editingItem?.id);
      onClose();
    } catch (err: any) {
      reportErrorToTelegram(err, 'TekrarlayanModal.handleSubmit');
      setErrorMsg(`Kaydedilirken hata oluştu: ${err.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--accent-500)]/10 text-[var(--accent-600)] dark:text-[var(--accent-400)] rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingItem ? 'Tekrarlayan İşlem Şablonunu Düzenle' : 'Yeni Tekrarlayan İşlem (Abonelik/Kira/Gider)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Her ay/hafta otomatik onay kuyruğuna düşecek düzenli gider şablonu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Başlık / Tanım */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              İşlem Başlığı / Tanımı *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Ofis Kirası, Turkcell İnternet, Mali Müşavir Ücreti"
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kategori */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Kategori *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Expense['category'])}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Periyot */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Tekrarlama Periyodu *
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
              >
                <option value="monthly">Her Ay (Aylık)</option>
                <option value="weekly">Her Hafta (Haftalık)</option>
                <option value="yearly">Her Yıl (Yıllık)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tutar */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Tahmini Tutar *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-3.5 pr-12 py-2.5 text-sm font-semibold bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 dark:text-zinc-500">
                  {currency}
                </span>
              </div>
            </div>

            {/* Para Birimi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Para Birimi
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
              >
                <option value="TRY">₺ TRY</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ayın Hangi Günü */}
            {frequency === 'monthly' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Her Ayın Hangi Günü? (1 - 31) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => handleDayOfMonthChange(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
                  required
                />
              </div>
            )}

            {/* Sonraki Vade Tarihi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                İlk / Sonraki Vade Tarihi *
              </label>
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ödeme Hesabı */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Varsayılan Ödeme Hesabı
              </label>
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
              >
                <option value="cash">Kasa (Nakit)</option>
                <option value="bank">Banka Hesabı</option>
                <option value="pos">POS / Kredi Kartı</option>
              </select>
            </div>

            {/* Banka Hesabı Seçimi */}
            {(account === 'bank' || account === 'pos') && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                  Banka / POS Hesabı Seçin
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
                >
                  <option value="">Hesap Seçilmedi</option>
                  {bankAccounts
                    .filter((acc) => acc.type === account)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* İlişkili Cari / Tedarikçi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                İlişkili Cari / Hizmet Veren (Opsiyonel)
              </label>
              <select
                value={cariId}
                onChange={(e) => setCariId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
              >
                <option value="">Cari Bağlantısı Yok</option>
                {cariler.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Şablon Durumu */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Şablon Durumu
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
              >
                <option value="active">🟢 Aktif (Vadesi geldiğinde onay bekleyecek)</option>
                <option value="paused">🟡 Duraklatıldı (Otomatik uyarılmayacak)</option>
              </select>
            </div>
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Açıklama / Notlar
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Sözleşme numarası, abone no veya ek notlar..."
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[var(--accent-600)] hover:bg-[var(--accent-700)] active:scale-[0.98] rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              {isSaving ? 'Kaydediliyor...' : editingItem ? 'Güncelle' : 'Şablonu Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
