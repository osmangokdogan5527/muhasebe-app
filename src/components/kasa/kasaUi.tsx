/**
 * Kasa & Banka ekranlarının ortak küçük parçaları: hesap rozeti, para biçimi, pencere iskeleti,
 * tutar kutusu ve hesap seçici.
 */
import React from 'react';
import { X } from 'lucide-react';
import { BankAccount } from '../../types';
import { accountBadge, accountDisplayName, ibanLast4, isPrimaryAccount } from '../../utils/cashAccounts';
import { parseLocaleNumber } from '../../utils/excelParser';

export const formatMoney = (value: number, currency: string = 'TRY') => {
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY' }).format(Number(value) || 0);
  } catch {
    return `${(Number(value) || 0).toFixed(2)} ${currency}`;
  }
};

/** Kullanıcının yazdığı tutar ("1.250,50", "1250.5", "98000") → sayı; çözülemezse 0 */
export const parseAmountInput = (text: string): number => {
  const n = parseLocaleNumber(text);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
};

/** Sayıyı giriş kutusunda gösterilecek Türkçe metne çevirir (binlik ayırıcısız, virgüllü) */
export const amountToInput = (value: number): string => {
  if (!value) return '';
  return String(Math.round(value * 100) / 100).replace('.', ',');
};

export const AccountBadge: React.FC<{ account: Pick<BankAccount, 'type' | 'name' | 'bankName'>; size?: number }> = ({ account, size = 36 }) => {
  const badge = accountBadge(account);
  return (
    <span
      className="kasa-badge shrink-0 inline-flex items-center justify-center rounded-xl font-extrabold"
      style={{ width: size, height: size, backgroundColor: badge.color, color: '#ffffff', fontSize: size * 0.33 }}
      aria-hidden="true"
    >
      {badge.text}
    </span>
  );
};

/** Hesap seçim kartı (transfer ve işlem pencerelerinde) */
export const AccountOption: React.FC<{
  account: BankAccount;
  accounts: BankAccount[];
  balance: number;
  selected: boolean;
  onSelect: () => void;
  hint?: string;
  compact?: boolean;
}> = ({ account, accounts, balance, selected, onSelect, hint, compact }) => (
  <button
    type="button"
    data-account-option={account.id}
    aria-pressed={selected}
    onClick={onSelect}
    className={`w-full flex items-center gap-3 rounded-2xl border text-left transition cursor-pointer ${compact ? 'p-2.5' : 'p-3'} ${selected ? 'border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
  >
    <AccountBadge account={account} size={compact ? 30 : 36} />
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-bold text-white truncate">
        {accountDisplayName(account)}{isPrimaryAccount(accounts, account) && <span className="text-teal-400"> ★</span>}
      </span>
      <span className="block text-[11px] text-white/50 truncate">
        {ibanLast4(account.iban) ? `•••• ${ibanLast4(account.iban)} · ` : ''}{formatMoney(balance, account.currency)}{hint ? ` · ${hint}` : ''}
      </span>
    </span>
  </button>
);

/** Ortak pencere: telefonda alttan açılır, bilgisayarda ortada */
export const KasaModal: React.FC<{
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}> = ({ id, title, subtitle, icon, onClose, children, footer, wide }) => (
  <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
    <div id={id} className={`safe-sheet bg-[#18181b] border border-white/10 w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl`}>
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="flex items-start gap-3 min-w-0">
          {icon && <span className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">{icon}</span>}
          <div className="min-w-0">
            <h3 id={`${id}-title`} className="text-base font-extrabold text-white">{title}</h3>
            {subtitle && <p className="text-xs text-white/55 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button type="button" aria-label="Kapat" onClick={onClose} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 cursor-pointer">
          <X size={18} />
        </button>
      </div>
      <div className="px-5 pb-5">{children}</div>
      {footer && <div className="sticky bottom-0 px-5 py-4 border-t border-white/10 bg-[#18181b] flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">{footer}</div>}
    </div>
  </div>
);

export const fieldLabel = 'block text-[10px] font-extrabold text-white/60 uppercase tracking-wider mb-1.5';
export const fieldInput = 'w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm outline-none focus:border-teal-500 transition';
export const primaryBtn = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider cursor-pointer';
export const ghostBtn = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 text-xs font-bold uppercase tracking-wider cursor-pointer';

/** Büyük tutar kutusu (para birimi işaretiyle) */
export const AmountField: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  autoFocus?: boolean;
  right?: React.ReactNode;
  hint?: React.ReactNode;
}> = ({ id, label, value, onChange, currency = 'TRY', autoFocus, right, hint }) => {
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₺';
  return (
    <label className="block" htmlFor={id}>
      <span className={`${fieldLabel} flex items-center justify-between gap-2`}><span>{label}</span>{right}</span>
      <span className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl focus-within:border-teal-500 transition">
        <span className="text-lg font-bold text-white/50">{symbol}</span>
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-xl font-extrabold text-white tabular-nums"
          style={{ boxShadow: 'none' }}
          placeholder="0,00"
        />
      </span>
      {hint && <span className="block mt-1 text-[11px] text-white/50">{hint}</span>}
    </label>
  );
};
