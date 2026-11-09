/**
 * Hesap detayı (sağdan açılan panel): bakiye, bu hesaba özel işlemler, dönem özeti, hareketler,
 * banka mutabakatı / kasa sayımı. "Tüm hareketler" modunda bütün hesapların hareketleri listelenir.
 */
import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, Pencil, Scale, Search, Star, Trash2, X } from 'lucide-react';
import { BankAccount } from '../../types';
import { getTodayISO } from '../../utils/dateUtils';
import { accountDisplayName, formatIban, isPrimaryAccount, TYPE_LABEL } from '../../utils/cashAccounts';
import { CashMovement, relativeDay } from '../../utils/cashMovements';
import { AccountBadge, formatMoney } from './kasaUi';
import { parseLocaleNumber } from '../../utils/excelParser';

type Period = 'month' | 'last30' | 'all';

interface AccountDrawerProps {
  /** null: tüm hesapların hareketleri */
  account: BankAccount | null;
  accounts: BankAccount[];
  balances: Record<string, number>;
  movements: CashMovement[];
  onClose: () => void;
  onMoneyMove: (direction: 'giris' | 'cikis', accountId?: string) => void;
  onTransfer: (accountId?: string) => void;
  onEdit: (account: BankAccount) => void;
  onMakePrimary: (account: BankAccount) => void;
  onDeleteManual: (movement: CashMovement) => void;
  onReconcile: (account: BankAccount, difference: number) => void;
}

export const AccountDrawer: React.FC<AccountDrawerProps> = ({
  account, accounts, balances, movements, onClose, onMoneyMove, onTransfer, onEdit, onMakePrimary, onDeleteManual, onReconcile,
}) => {
  const [period, setPeriod] = useState<Period>('month');
  const [search, setSearch] = useState('');
  const [realText, setRealText] = useState('');
  const today = getTodayISO();
  const byId = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const scoped = useMemo(() => movements.filter((m) => !account || m.accountId === account.id), [movements, account]);
  const visible = useMemo(() => {
    const monthPrefix = today.slice(0, 7);
    const from30 = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const q = search.trim().toLocaleLowerCase('tr-TR');
    return scoped.filter((m) => {
      if (period === 'month' && !m.date.startsWith(monthPrefix)) return false;
      if (period === 'last30' && m.date < from30) return false;
      if (q && !`${m.title} ${m.description} ${m.category}`.toLocaleLowerCase('tr-TR').includes(q)) return false;
      return true;
    });
  }, [scoped, period, search, today]);

  // Dönem özeti: tek hesapta hesabın para birimiyle; tüm hesaplarda yalnızca TL hareketleri
  const totals = useMemo(() => {
    let inSum = 0;
    let outSum = 0;
    visible.forEach((m) => {
      if (!account && m.currency !== 'TRY') return;
      if (m.direction === 'in') inSum += m.amount;
      else outSum += m.amount;
    });
    return { inSum, outSum };
  }, [visible, account]);
  const currency = account?.currency || 'TRY';
  const balance = account ? balances[account.id] || 0 : 0;
  const realValue = parseLocaleNumber(realText);
  const difference = Number.isFinite(realValue) && realText.trim() ? Math.round((realValue - balance) * 100) / 100 : null;
  const isKasa = account?.type === 'kasa';

  return (
    <div className="fixed inset-0 z-[150] flex justify-end" role="dialog" aria-modal="true" aria-label={account ? accountDisplayName(account) : 'Tüm hareketler'}>
      <button type="button" aria-label="Kapat" className="absolute inset-0 bg-black/50 backdrop-blur-[2px] cursor-default" onClick={onClose} />
      <div id="account-drawer" className="kasa-drawer relative w-full sm:max-w-xl h-full bg-[#18181b] border-l border-white/10 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Başlık */}
        <div className="kasa-drawer-head safe-top-pad shrink-0 p-5 text-white" style={{ background: 'linear-gradient(135deg, var(--accent-500, #0ea5e9), var(--accent-700, #0369a1))' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {account ? <AccountBadge account={account} size={42} /> : <span className="w-[42px] h-[42px] rounded-xl bg-white/20 flex items-center justify-center"><ArrowRightLeft size={20} /></span>}
              <div className="min-w-0">
                <div className="text-lg font-extrabold truncate" style={{ color: '#ffffff' }}>
                  {account ? accountDisplayName(account) : 'Tüm hareketler'}{account && isPrimaryAccount(accounts, account) ? ' ★' : ''}
                </div>
                <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {account ? [TYPE_LABEL[account.type], account.currency, account.iban ? formatIban(account.iban) : ''].filter(Boolean).join(' · ') : 'Kasa, banka ve POS hareketleri'}
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Kapat" className="p-1.5 rounded-lg cursor-pointer" style={{ color: '#ffffff', background: 'rgba(255,255,255,0.15)' }}><X size={18} /></button>
          </div>
          {account && (
            <>
              <div id="drawer-balance" className="mt-4 text-3xl font-extrabold tabular-nums" style={{ color: '#ffffff' }}>{formatMoney(balance, currency)}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>Güncel bakiye</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { id: 'drawer-in', label: '+ Giriş', run: () => onMoneyMove('giris', account.id) },
                  { id: 'drawer-out', label: '− Çıkış', run: () => onMoneyMove('cikis', account.id) },
                  { id: 'drawer-transfer', label: '⇄ Transfer', run: () => onTransfer(account.id) },
                  { id: 'drawer-edit', label: 'Düzenle', run: () => onEdit(account) },
                ].map((b, i) => (
                  <button key={b.id} id={b.id} type="button" onClick={b.run} className="px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer"
                    style={i === 0 ? { background: '#ffffff', color: 'var(--accent-700, #0369a1)' } : { background: 'rgba(255,255,255,0.16)', color: '#ffffff' }}>
                    {b.label}
                  </button>
                ))}
                {!isPrimaryAccount(accounts, account) && !account.archived && (
                  <button id="drawer-primary" type="button" onClick={() => onMakePrimary(account)} className="px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer inline-flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.16)', color: '#ffffff' }}>
                    <Star size={12} /> Varsayılan yap
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Dönem özeti + mutabakat */}
          <div className="grid grid-cols-2 gap-2 p-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">Giriş</div>
              <div className="mt-1 text-base font-extrabold tabular-nums text-emerald-400">+{formatMoney(totals.inSum, currency)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">Çıkış</div>
              <div className="mt-1 text-base font-extrabold tabular-nums text-rose-400">−{formatMoney(totals.outSum, currency)}</div>
            </div>
            {account && (
              <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-white/50"><Scale size={12} /> {isKasa ? 'Kasa sayımı' : 'Banka mutabakatı'}</div>
                <div className="mt-2 flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    id="drawer-real-balance"
                    inputMode="decimal"
                    value={realText}
                    onChange={(e) => setRealText(e.target.value.replace(/[^0-9.,-]/g, ''))}
                    placeholder={isKasa ? 'Kasada sayılan tutar' : 'Bankadaki gerçek bakiye'}
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-teal-500"
                  />
                  {difference !== null && (
                    difference === 0
                      ? <span className="text-xs font-bold text-emerald-400">✓ Tutuyor</span>
                      : (
                        <button id="drawer-reconcile" type="button" onClick={() => { onReconcile(account, difference); setRealText(''); }} className="px-3 py-2 rounded-xl text-xs font-extrabold bg-teal-600 text-white cursor-pointer whitespace-nowrap">
                          Fark {difference > 0 ? '+' : '−'}{formatMoney(Math.abs(difference), currency)} · Kaydet
                        </button>
                      )
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-white/45">{isKasa ? 'Kasadaki parayı sayıp yazın; fark varsa tek tuşla "sayım farkı" olarak kaydedilir.' : 'Banka uygulamasındaki bakiyeyi yazın; fark varsa tek tuşla "mutabakat farkı" olarak kaydedilir.'}</p>
              </div>
            )}
          </div>

          {/* Hareketler */}
          <div className="px-4 pb-2 flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <div className="inline-flex rounded-xl bg-white/5 border border-white/10 p-1">
              {([['month', 'Bu ay'], ['last30', 'Son 30 gün'], ['all', 'Tümü']] as [Period, string][]).map(([p, label]) => (
                <button key={p} type="button" data-period={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${period === p ? 'bg-teal-600 text-white' : 'text-white/60'}`}>{label}</button>
              ))}
            </div>
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/50">
              <Search size={13} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara…" className="bg-transparent border-0 outline-none text-xs text-white w-32" style={{ boxShadow: 'none' }} />
            </label>
          </div>
          <div id="drawer-movements" className="divide-y divide-white/5">
            {visible.length === 0 && <p className="px-4 py-10 text-center text-xs text-white/45">Bu dönemde hareket yok.</p>}
            {visible.slice(0, 300).map((m) => {
              const acc = byId.get(m.accountId);
              const manual = m.source.kind === 'hesap' && (m.source.txType === 'giris' || m.source.txType === 'cikis');
              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${m.direction === 'in' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {m.direction === 'in' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{m.title}</div>
                    <div className="text-[11px] text-white/45 truncate">
                      {relativeDay(m.date, today)} · {m.category}{!account && acc ? ` · ${accountDisplayName(acc)}` : ''}{m.description ? ` · ${m.description}` : ''}
                    </div>
                  </div>
                  <span className={`text-sm font-extrabold tabular-nums whitespace-nowrap ${m.direction === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m.direction === 'in' ? '+' : '−'}{formatMoney(m.amount, m.currency)}
                  </span>
                  {manual && (
                    <button type="button" title="Bu hareketi sil" aria-label="Bu hareketi sil" onClick={() => onDeleteManual(m)} className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })}
            {visible.length > 300 && <p className="px-4 py-3 text-[11px] text-white/45">Son 300 hareket gösteriliyor; dönemi daraltın ya da arayın.</p>}
          </div>
        </div>
        {account && (
          <div className="shrink-0 px-4 py-2 border-t border-white/10 text-[11px] text-white/40 flex items-center gap-1.5">
            <Pencil size={11} /> Hesap adı, IBAN, varsayılan ve arşiv: Düzenle
          </div>
        )}
      </div>
    </div>
  );
};
