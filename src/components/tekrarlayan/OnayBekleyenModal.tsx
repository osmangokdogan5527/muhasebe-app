import React, { useState, useEffect } from 'react';
import { RecurringTransaction, Expense, BankAccount, Cari } from '../../types';
import { saveExpense, saveRecurringTransaction } from '../../firebase';
import { reportErrorToTelegram } from '../../utils/telegramLogger';
import { calculateNextDueDate, getTodayISO } from '../../utils/recurringUtils';
import { X, CheckCircle, SkipForward, Edit3, Calendar, DollarSign, AlertCircle, Building, Wallet, Tag } from 'lucide-react';

interface OnayBekleyenModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingItem: RecurringTransaction | null;
  bankAccounts: BankAccount[];
  cariler: Cari[];
  onApprovedOrSkipped?: () => void;
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

export default function OnayBekleyenModal({
  isOpen,
  onClose,
  pendingItem,
  bankAccounts,
  cariler,
  onApprovedOrSkipped
}: OnayBekleyenModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Kira');
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');
  const [date, setDate] = useState(getTodayISO());
  const [account, setAccount] = useState<'cash' | 'bank' | 'pos'>('cash');
  const [bankAccountId, setBankAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (pendingItem) {
      setTitle(pendingItem.title || '');
      setCategory(pendingItem.category || 'Kira');
      setAmount(pendingItem.amount || 0);
      setCurrency(pendingItem.currency || 'TRY');
      setDate(pendingItem.nextDueDate || getTodayISO());
      setAccount(pendingItem.account || 'cash');
      setBankAccountId(pendingItem.bankAccountId || '');
      setDescription(
        pendingItem.description 
          ? `${pendingItem.description} (${pendingItem.nextDueDate} Dönemi)` 
          : `${pendingItem.title} - ${pendingItem.nextDueDate} Düzenli Ödeme`
      );
    } else {
      setTitle('');
      setCategory('Kira');
      setAmount(0);
      setCurrency('TRY');
      setDate(getTodayISO());
      setAccount('cash');
      setBankAccountId('');
      setDescription('');
    }
    setErrorMsg('');
  }, [pendingItem, isOpen]);

  if (!isOpen || !pendingItem) return null;

  // Approve & Save Expense Entry
  const handleApproveAndProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMsg('Lütfen 0\'dan büyük geçerli bir tutar girin.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      // 1. Create real Expense record in database
      const newExpensePayload: Omit<Expense, 'id'> = {
        title: title.trim() || pendingItem.title,
        category: category,
        amount: Number(amount),
        currency: currency,
        date: date || getTodayISO(),
        account: account,
        bankAccountId: account === 'bank' || account === 'pos' ? bankAccountId : '',
        description: description.trim(),
        createdAt: new Date().toISOString()
      };

      await saveExpense(newExpensePayload);

      // 2. Compute next due date for the recurring rule
      const nextDate = calculateNextDueDate(
        pendingItem.nextDueDate || getTodayISO(),
        pendingItem.frequency || 'monthly',
        pendingItem.dayOfMonth || 1
      );

      // 3. Update RecurringTransaction template status and dates
      const updatedRecurringPayload: Omit<RecurringTransaction, 'id'> = {
        ...pendingItem,
        lastProcessedDate: date || getTodayISO(),
        nextDueDate: nextDate
      };

      await saveRecurringTransaction(updatedRecurringPayload, pendingItem.id);

      if (onApprovedOrSkipped) onApprovedOrSkipped();
      onClose();
    } catch (err: any) {
      reportErrorToTelegram(err, 'OnayBekleyenModal.handleApproveAndProcess');
      setErrorMsg(`İşlem onaylanırken hata oluştu: ${err.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Skip this period
  const handleSkipPeriod = async () => {
    if (!window.confirm(`"${pendingItem.title}" işleminin bu dönemini (${pendingItem.nextDueDate}) pas geçmek istediğinize emin misiniz? Gider kaydı oluşturulmayacak, bir sonraki vadeye aktarılacaktır.`)) {
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const nextDate = calculateNextDueDate(
        pendingItem.nextDueDate || getTodayISO(),
        pendingItem.frequency || 'monthly',
        pendingItem.dayOfMonth || 1
      );

      const updatedRecurringPayload: Omit<RecurringTransaction, 'id'> = {
        ...pendingItem,
        nextDueDate: nextDate
      };

      await saveRecurringTransaction(updatedRecurringPayload, pendingItem.id);

      if (onApprovedOrSkipped) onApprovedOrSkipped();
      onClose();
    } catch (err: any) {
      reportErrorToTelegram(err, 'OnayBekleyenModal.handleSkipPeriod');
      setErrorMsg(`Dönem pas geçilirken hata oluştu: ${err.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--accent-200)]/50 dark:border-[var(--accent-900)]/30 bg-[var(--accent-500)]/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--accent-500)]/20 text-[var(--accent-700)] dark:text-[var(--accent-400)] rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Tekrarlayan İşlem Onayı & Düzeltme
              </h3>
              <p className="text-xs text-[var(--accent-800)]/80 dark:text-[var(--accent-300)]/80 font-medium">
                Vadesi Gelen İşlem: <span className="font-bold">{pendingItem.title}</span> ({pendingItem.nextDueDate})
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

        {/* Informational Banner */}
        <div className="px-6 py-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span>
            Gideri kaydetmeden önce gerçekleşen tutar, tarih veya ödeme hesabı bilgilerinde dilediğiniz düzeltmeyi yapabilirsiniz.
          </span>
        </div>

        {/* Body Form */}
        <form onSubmit={handleApproveAndProcess} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* İşlem Başlığı */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              İşlem Başlığı / Açıklama
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Gerçekleşen Tutar */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Gerçekleşen Tutar *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-3.5 pr-12 py-2.5 text-sm font-bold bg-[var(--accent-500)]/5 dark:bg-zinc-800 border border-[var(--accent-300)]/60 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none text-[var(--accent-900)] dark:text-[var(--accent-200)]"
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[var(--accent-700)] dark:text-[var(--accent-400)]">
                  {currency}
                </span>
              </div>
            </div>

            {/* İşlem Tarihi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Gider Tarihi *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kategori */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Gider Kategorisi
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

            {/* Ödeme Hesabı */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Ödeme Yapılan Hesap
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
          </div>

          {/* Banka Hesabı seçimi */}
          {(account === 'bank' || account === 'pos') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
                Banka / POS Detay Hesabı
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

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              Gider Açıklaması / Dekont Notu
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-[var(--accent-500)] dark:text-white outline-none resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleSkipPeriod}
              disabled={isProcessing}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-[var(--accent-600)] dark:hover:text-[var(--accent-400)] hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Bu Ayı Pas Geç
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                {isProcessing ? 'İşleniyor...' : 'Düzeltmeleri Onayla ve Gidere İşle'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
