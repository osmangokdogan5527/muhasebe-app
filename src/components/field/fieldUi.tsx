/**
 * Storm Saha (telefon) ekranı - ortak arayüz parçaları
 * Büyük dokunma alanları, koyu zemin, vurgu rengi temadan (--accent-*) gelir.
 */
import React, { useMemo, useState } from 'react';
import { Search, X, ScanLine, User } from 'lucide-react';
import { Cari } from '../../types';

export const formatMoney = (value: number, currency: string = 'TRY') =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY' }).format(Number(value) || 0);

/** "1.250,50" veya "1250.5" gibi girişleri sayıya çevirir. */
export function parseAmount(raw: string): number {
  const cleaned = (raw || '').trim().replace(/\s/g, '');
  if (!cleaned) return 0;
  const normalized = cleaned.includes(',')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

export const norm = (value: string) => (value || '').toLocaleLowerCase('tr-TR').trim();

export const Card: React.FC<{ className?: string; children: React.ReactNode; onClick?: () => void }> = ({ className = '', children, onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl border border-white/10 bg-white/[0.04] p-4 ${onClick ? 'active:scale-[0.99] transition cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; right?: React.ReactNode }> = ({ children, right }) => (
  <div className="flex items-center justify-between mb-2 mt-1">
    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{children}</h3>
    {right}
  </div>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = '', children, ...rest }) => (
  <button
    {...rest}
    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 cursor-pointer ${className}`}
    style={{ background: 'linear-gradient(135deg, var(--accent-500, #0ea5e9), var(--accent-700, #0369a1))', boxShadow: '0 8px 24px -10px var(--accent-500, #0ea5e9)', ...(rest.style || {}) }}
  >
    {children}
  </button>
);

export const SegmentedControl = <T extends string>({ value, options, onChange }: {
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (value: T) => void;
}) => (
  <div className="grid gap-1 p-1 rounded-2xl bg-black/30 border border-white/10" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
    {options.map(opt => {
      const active = opt.value === value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${active ? 'text-white' : 'text-slate-400'}`}
          style={active ? { backgroundColor: 'color-mix(in srgb, var(--accent-500, #0ea5e9) 30%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--accent-500, #0ea5e9) 55%, transparent)' } : {}}
        >
          {opt.icon}{opt.label}
        </button>
      );
    })}
  </div>
);

export const SearchBox: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onScan?: () => void;
  autoFocus?: boolean;
}> = ({ value, onChange, placeholder, onScan, autoFocus }) => (
  <div className="flex gap-2">
    <div className="flex-1 flex items-center gap-2 px-3.5 rounded-2xl bg-black/30 border border-white/10 focus-within:border-[color:var(--accent-500,#0ea5e9)]">
      <Search size={17} className="text-slate-500 shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent py-3 text-[15px] text-white placeholder-slate-500 outline-none min-w-0"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="p-1 text-slate-500 cursor-pointer" aria-label="Temizle">
          <X size={16} />
        </button>
      )}
    </div>
    {onScan && (
      <button
        type="button"
        onClick={onScan}
        aria-label="Barkod okut"
        className="shrink-0 w-12 rounded-2xl flex items-center justify-center text-white border border-white/10 cursor-pointer active:scale-95 transition"
        style={{ backgroundColor: 'color-mix(in srgb, var(--accent-500, #0ea5e9) 25%, transparent)' }}
      >
        <ScanLine size={20} />
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 text-slate-500 gap-2">
    <div className="opacity-60">{icon}</div>
    <p className="text-sm">{text}</p>
  </div>
);

export const BalanceText: React.FC<{ value: number; currency?: string; className?: string }> = ({ value, currency, className = '' }) => (
  <span className={`font-bold tabular-nums ${value > 0 ? 'text-emerald-400' : value < 0 ? 'text-rose-400' : 'text-slate-300'} ${className}`}>
    {formatMoney(value, currency)}
  </span>
);

export const balanceLabel = (value: number) => (value > 0 ? 'Bize borçlu' : value < 0 ? 'Biz borçluyuz' : 'Bakiye yok');

/** Alttan açılan cari seçme paneli (satış ve tahsilatta ortak). */
export const CariPickerSheet: React.FC<{
  isOpen: boolean;
  cariler: Cari[];
  onSelect: (cari: Cari | null) => void;
  onClose: () => void;
  allowNone?: boolean;
  title?: string;
}> = ({ isOpen, cariler, onSelect, onClose, allowNone = false, title = 'Cari Seçin' }) => {
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = norm(query);
    return cariler
      .filter(c => c.isActive !== false)
      .filter(c => !q || norm(c.name).includes(q) || norm(c.code).includes(q) || (c.phone || '').replace(/\s/g, '').includes(q.replace(/\s/g, '')))
      .slice(0, 50);
  }, [cariler, query]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex flex-col justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[85vh] flex flex-col rounded-t-3xl border-t border-white/10 bg-[#0b0d1f] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] animate-slide-up">
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3" />
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 cursor-pointer" aria-label="Kapat"><X size={20} /></button>
        </div>
        <SearchBox value={query} onChange={setQuery} placeholder="Ad, kod veya telefon..." autoFocus />
        <div className="mt-3 overflow-y-auto flex-1 -mx-1 px-1 space-y-2">
          {allowNone && (
            <button type="button" onClick={() => { onSelect(null); onClose(); }} className="w-full text-left rounded-2xl border border-dashed border-white/15 p-3.5 text-sm text-slate-300 cursor-pointer">
              Perakende Müşteri (cari seçmeden)
            </button>
          )}
          {list.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onSelect(c); onClose(); setQuery(''); }}
              className="w-full flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 text-left cursor-pointer active:scale-[0.99] transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0"><User size={17} /></div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                  <div className="text-[11px] text-slate-500">{c.code}{c.phone ? ` • ${c.phone}` : ''}</div>
                </div>
              </div>
              <BalanceText value={c.balance || 0} currency={c.currency} className="text-sm shrink-0" />
            </button>
          ))}
          {list.length === 0 && <EmptyState icon={<User size={28} />} text="Cari bulunamadı." />}
        </div>
      </div>
    </div>
  );
};
