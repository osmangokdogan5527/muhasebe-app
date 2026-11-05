/**
 * Hızlı para girişi / çıkışı: hiçbir cariye ya da faturaya bağlamadan "3.000 ₺ aldım" gibi.
 * Varsayılan olarak yalnızca kasa hareketidir (kâr-zararı etkilemez); "Gidere yaz" seçilirse
 * masraf olarak kaydedilir.
 */
import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { BankAccount, Expense } from '../../types';
import { deleteAccountTransaction, deleteExpense, saveAccountTransaction, saveExpense } from '../../firebase';
import { getTodayISO } from '../../utils/dateUtils';
import { logError } from '../../utils/errorLogger';
import { KIND_OF_TYPE, accountDisplayName, selectableAccounts } from '../../utils/cashAccounts';
import { AccountOption, AmountField, KasaModal, fieldInput, fieldLabel, formatMoney, ghostBtn, parseAmountInput, primaryBtn } from './kasaUi';

export interface UndoAction {
  label: string;
  run: () => Promise<void>;
}

const EXPENSE_CATEGORIES: Expense['category'][] = [
  'Diğer', 'Yemek/Mutfak', 'Ulaşım/Yakıt', 'Kira', 'Elektrik', 'Su', 'Doğalgaz', 'İnternet/Telefon', 'Muhasebe Gideri', 'Vergi/SGK', 'Banka/POS Komisyonu',
];

interface MoneyMoveModalProps {
  accounts: BankAccount[];
  balances: Record<string, number>;
  initialAccountId?: string;
  initialDirection: 'giris' | 'cikis';
  onClose: () => void;
  onDone: (message: string, undo: UndoAction) => void;
}

export const MoneyMoveModal: React.FC<MoneyMoveModalProps> = ({ accounts, balances, initialAccountId, initialDirection, onClose, onDone }) => {
  const options = useMemo(() => selectableAccounts(accounts), [accounts]);
  const [direction, setDirection] = useState<'giris' | 'cikis'>(initialDirection);
  const [accountId, setAccountId] = useState<string>(initialAccountId && options.some((a) => a.id === initialAccountId) ? initialAccountId : (options[0]?.id || ''));
  const [amountText, setAmountText] = useState('');
  const [note, setNote] = useState('');
  const [asExpense, setAsExpense] = useState(false);
  const [category, setCategory] = useState<Expense['category']>('Diğer');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const account = options.find((a) => a.id === accountId);
  const amount = parseAmountInput(amountText);
  const balance = account ? balances[account.id] || 0 : 0;
  const overdraw = direction === 'cikis' && account && amount > balance + 0.001;

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!account) return setError('Hesap seçin.');
    if (!(amount > 0)) return setError('Tutarı yazın.');
    setSaving(true);
    setError(null);
    try {
      const today = getTodayISO();
      const name = accountDisplayName(account);
      const money = formatMoney(amount, account.currency);
      if (direction === 'cikis' && asExpense) {
        const id = await saveExpense({
          title: note.trim() || category,
          category,
          amount,
          date: today,
          account: KIND_OF_TYPE[account.type],
          bankAccountId: account.id,
          description: note.trim(),
          currency: account.currency,
          createdAt: new Date().toISOString(),
        });
        onDone(`${name}: ${money} gider olarak çıkıldı.`, { label: 'Gider geri alındı.', run: () => deleteExpense(id) });
      } else {
        const id = await saveAccountTransaction({
          accountId: account.id,
          type: direction,
          amount,
          date: today,
          description: note.trim() || (direction === 'giris' ? 'Para girişi' : 'Para çıkışı'),
          createdAt: new Date().toISOString(),
        });
        onDone(`${name}: ${money} ${direction === 'giris' ? 'girişi' : 'çıkışı'} kaydedildi.`, { label: 'Hareket geri alındı.', run: () => deleteAccountTransaction(id) });
      }
      onClose();
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'MoneyMoveModal.save');
      setError(`Kaydedilemedi: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const isOut = direction === 'cikis';
  return (
    <KasaModal
      id="money-move-modal"
      title={isOut ? 'Para Çıkışı' : 'Para Girişi'}
      subtitle="Cariye ya da faturaya bağlamadan, hızlıca."
      icon={isOut ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
      onClose={onClose}
      footer={<>
        <button type="button" className={ghostBtn} onClick={onClose}>Vazgeç</button>
        <button id="money-move-save" type="button" className={primaryBtn} disabled={saving || !(amount > 0) || !account} onClick={() => handleSave()}>
          {saving && <Loader2 size={14} className="animate-spin" />} Kaydet
        </button>
      </>}
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Yön">
          {(['giris', 'cikis'] as const).map((d) => (
            <button
              key={d}
              type="button"
              data-direction={d}
              aria-pressed={direction === d}
              onClick={() => setDirection(d)}
              className={`py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border cursor-pointer transition ${direction === d
                ? (d === 'giris' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/15 border-rose-500/40 text-rose-300')
                : 'bg-white/5 border-white/10 text-white/60'}`}
            >
              {d === 'giris' ? '+ Para Girişi' : '− Para Çıkışı'}
            </button>
          ))}
        </div>

        <AmountField
          id="money-move-amount"
          label="Tutar"
          value={amountText}
          onChange={setAmountText}
          currency={account?.currency}
          autoFocus
          hint={overdraw ? <span className="text-rose-400 font-bold">Hesap bakiyesi ({formatMoney(balance, account?.currency)}) bu tutardan az.</span> : undefined}
        />

        <label className="block">
          <span className={fieldLabel}>Not (isteğe bağlı)</span>
          <input id="money-move-note" className={fieldInput} value={note} onChange={(e) => setNote(e.target.value)} placeholder={isOut ? 'Ör. 3000 aldım, harçlık' : 'Ör. ortak sermaye, bozuk para'} />
        </label>

        <div>
          <span className={fieldLabel}>Hangi hesap?</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {options.map((a) => (
              <AccountOption key={a.id} account={a} accounts={accounts} balance={balances[a.id] || 0} selected={a.id === accountId} onSelect={() => setAccountId(a.id)} compact />
            ))}
          </div>
        </div>

        {isOut && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input id="money-move-expense" type="checkbox" className="accent-teal-500 mt-0.5" checked={asExpense} onChange={() => setAsExpense(!asExpense)} />
              <span>
                <span className="block text-xs font-bold text-white">Gidere yaz</span>
                <span className="block text-[11px] text-white/50">İşaretlenmezse yalnızca kasadan çıkış olur, kâr-zararı etkilemez (ör. cebe para almak).</span>
              </span>
            </label>
            {asExpense && (
              <select value={category} onChange={(e) => setCategory(e.target.value as Expense['category'])} className={`${fieldInput} mt-3`}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
        )}

        {error && <p className="text-xs font-bold text-rose-400">{error}</p>}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
    </KasaModal>
  );
};
