/**
 * Kasa & Banka: hesaplar tek listede (Tümü / Kasa / Banka / POS), üstte toplam nakit varlık ve
 * döviz hesapları, hızlı işlemler (para girişi/çıkışı, transfer, POS'u bankaya aktarma).
 * Hesaba tıklayınca sağdan hesap detayı açılır. Hesabı belli olmayan eski hareketler için uyarı.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowDownLeft, ArrowRightLeft, ArrowUpRight, ChevronRight, CreditCard, Eye, EyeOff, List, Plus, Search } from 'lucide-react';
import { AccountTransaction, BankAccount, Cari, EmployeeTransaction, Expense, Transaction } from '../types';
import { deleteAccountTransaction, saveAccountTransaction, setPrimaryBankAccount } from '../firebase';
import { computeAccountBalances, createCashCurrencyConverters } from '../utils/cashBalances';
import { buildCashMovements, CashMovement, relativeDay, unassignedMovements } from '../utils/cashMovements';
import { AccountType, TYPE_LABEL, accountDisplayName, ibanLast4, isPrimaryAccount } from '../utils/cashAccounts';
import { convertWithRates } from '../utils/currencyUtils';
import { getTodayISO } from '../utils/dateUtils';
import { confirmDialog } from '../utils/dialogs';
import { logError } from '../utils/errorLogger';
import { useFxRates } from '../hooks/useFxRates';
import { AccountBadge, formatMoney } from './kasa/kasaUi';
import { MoneyMoveModal, UndoAction } from './kasa/MoneyMoveModal';
import { TransferModal, TransferMode } from './kasa/TransferModal';
import { AccountFormModal } from './kasa/AccountFormModal';
import { AccountDrawer } from './kasa/AccountDrawer';
import { AssignAccountsModal } from './kasa/AssignAccountsModal';

interface KasaViewProps {
  islemler: Transaction[];
  cariler?: Cari[];
  expenses: Expense[];
  employeeTransactions?: EmployeeTransaction[];
  bankAccounts?: BankAccount[];
  accountTransactions?: AccountTransaction[];
}

type Tab = 'all' | AccountType;

const TYPE_COLOR: Record<AccountType, string> = { kasa: '#f59e0b', banka: 'var(--accent-600, #2563eb)', pos: '#8b5cf6' };
const TYPE_TAG: Record<AccountType, string> = {
  kasa: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  banka: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  pos: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};
const UNDO_SECONDS = 6;

export default function KasaView({ islemler, cariler = [], expenses, employeeTransactions = [], bankAccounts = [], accountTransactions = [] }: KasaViewProps) {
  const fxRates = useFxRates();
  const converters = useMemo(() => createCashCurrencyConverters(bankAccounts, cariler, fxRates), [bankAccounts, cariler, fxRates]);
  const balances = useMemo(() => computeAccountBalances({ bankAccounts, accountTransactions, islemler, expenses, employeeTransactions, converters }), [bankAccounts, accountTransactions, islemler, expenses, employeeTransactions, converters]);
  const movements = useMemo(() => buildCashMovements({ bankAccounts, accountTransactions, islemler, expenses, employeeTransactions, converters }), [bankAccounts, accountTransactions, islemler, expenses, employeeTransactions, converters]);
  const unassigned = useMemo(() => unassignedMovements(movements, bankAccounts), [movements, bankAccounts]);
  const today = getTodayISO();

  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [drawer, setDrawer] = useState<string | 'all' | null>(null);
  const [moneyMove, setMoneyMove] = useState<{ direction: 'giris' | 'cikis'; accountId?: string } | null>(null);
  const [transfer, setTransfer] = useState<{ mode: TransferMode; fromId?: string } | null>(null);
  const [accountForm, setAccountForm] = useState<{ editing?: BankAccount; type?: AccountType } | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; undo?: UndoAction; error?: boolean } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hareket tarihi: hesap başına son hareket
  const lastMovementDate = useMemo(() => {
    const map = new Map<string, string>();
    movements.forEach((m) => { if (!map.has(m.accountId)) map.set(m.accountId, m.date); });
    return map;
  }, [movements]);

  const activeAccounts = useMemo(() => bankAccounts.filter((a) => !a.archived), [bankAccounts]);
  const archivedAccounts = useMemo(() => bankAccounts.filter((a) => a.archived), [bankAccounts]);

  // Özet: TL karşılığı toplam ve türe göre dağılım; döviz hesapları ayrı
  const summary = useMemo(() => {
    const byType: Record<AccountType, number> = { kasa: 0, banka: 0, pos: 0 };
    const foreign: Record<'USD' | 'EUR', { amount: number; tl: number }> = { USD: { amount: 0, tl: 0 }, EUR: { amount: 0, tl: 0 } };
    activeAccounts.forEach((a) => {
      const bal = balances[a.id] || 0;
      const tl = a.currency === 'TRY' ? bal : convertWithRates(bal, a.currency, 'TRY', fxRates);
      byType[a.type] += tl;
      if (a.currency === 'USD' || a.currency === 'EUR') {
        foreign[a.currency].amount += bal;
        foreign[a.currency].tl += tl;
      }
    });
    const total = byType.kasa + byType.banka + byType.pos;
    return { byType, foreign, total };
  }, [activeAccounts, balances, fxRates]);

  const posWithBalance = useMemo(() => activeAccounts.filter((a) => a.type === 'pos' && (balances[a.id] || 0) > 0.009), [activeAccounts, balances]);

  const listAccounts = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    const source = showArchived ? archivedAccounts : activeAccounts;
    return source
      .filter((a) => tab === 'all' || a.type === tab)
      .filter((a) => !q || `${accountDisplayName(a)} ${a.bankName || ''} ${a.iban || ''}`.toLocaleLowerCase('tr-TR').includes(q))
      .sort((a, b) => {
        // TL önce, sonra döviz; tür sırası kasa, banka, POS; varsayılan önce
        const cur = Number(a.currency !== 'TRY') - Number(b.currency !== 'TRY');
        if (cur) return cur;
        const order: Record<AccountType, number> = { banka: 0, kasa: 1, pos: 2 };
        if (tab === 'all' && order[a.type] !== order[b.type]) return order[a.type] - order[b.type];
        const prim = Number(isPrimaryAccount(bankAccounts, b)) - Number(isPrimaryAccount(bankAccounts, a));
        return prim || accountDisplayName(a).localeCompare(accountDisplayName(b), 'tr');
      });
  }, [activeAccounts, archivedAccounts, bankAccounts, tab, search, showArchived]);

  const counts = useMemo(() => ({
    all: activeAccounts.length,
    kasa: activeAccounts.filter((a) => a.type === 'kasa').length,
    banka: activeAccounts.filter((a) => a.type === 'banka').length,
    pos: activeAccounts.filter((a) => a.type === 'pos').length,
  }), [activeAccounts]);

  // ---- Bildirim ve "Geri al" ----
  const clearToastTimer = () => {
    if (toastTimer.current) clearInterval(toastTimer.current);
    toastTimer.current = null;
  };
  const showToast = useCallback((message: string, undo?: UndoAction, error = false) => {
    clearToastTimer();
    setToast({ message, undo, error });
    setCountdown(UNDO_SECONDS);
    toastTimer.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearToastTimer();
          setToast(null);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }, []);
  useEffect(() => () => clearToastTimer(), []);

  const runUndo = async () => {
    const undo = toast?.undo;
    clearToastTimer();
    setToast(null);
    if (!undo) return;
    try {
      await undo.run();
      showToast(undo.label);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'KasaView.undo');
      showToast('Geri alınamadı.', undefined, true);
    }
  };

  // ---- Hesap detayındaki işlemler ----
  const handleMakePrimary = async (account: BankAccount) => {
    try {
      await setPrimaryBankAccount(account.id, bankAccounts);
      showToast(`${accountDisplayName(account)} artık varsayılan ${TYPE_LABEL[account.type].toLocaleLowerCase('tr-TR')} hesabı.`);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'KasaView.makePrimary');
      showToast('Varsayılan hesap değiştirilemedi.', undefined, true);
    }
  };

  const handleDeleteManual = async (movement: CashMovement) => {
    const ok = await confirmDialog({ title: 'Hareketi sil', message: `${movement.title} (${formatMoney(movement.amount, movement.currency)}) silinsin mi?`, confirmText: 'Sil', danger: true });
    if (!ok) return;
    try {
      await deleteAccountTransaction(movement.source.id);
      showToast('Hareket silindi.');
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'KasaView.deleteManual');
      showToast('Silinemedi.', undefined, true);
    }
  };

  const handleReconcile = async (account: BankAccount, difference: number) => {
    try {
      const id = await saveAccountTransaction({
        accountId: account.id,
        type: difference > 0 ? 'giris' : 'cikis',
        amount: Math.abs(difference),
        date: today,
        description: account.type === 'kasa' ? 'Kasa sayım farkı' : 'Banka mutabakat farkı',
        createdAt: new Date().toISOString(),
      });
      showToast(`${accountDisplayName(account)}: fark ${formatMoney(difference, account.currency)} kaydedildi.`, { label: 'Fark kaydı geri alındı.', run: () => deleteAccountTransaction(id) });
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'KasaView.reconcile');
      showToast('Fark kaydedilemedi.', undefined, true);
    }
  };

  const drawerAccount = drawer && drawer !== 'all' ? bankAccounts.find((a) => a.id === drawer) || null : null;
  const total = summary.total || 0;
  const pct = (v: number) => (total > 0 ? Math.max(0, (v / total) * 100) : 0);

  const quickActions: { id: string; label: string; icon: React.ReactNode; run: () => void; badge?: string; strong?: boolean }[] = [
    { id: 'kasa-quick-in', label: 'Para Girişi', icon: <ArrowDownLeft size={16} />, run: () => setMoneyMove({ direction: 'giris' }) },
    { id: 'kasa-quick-out', label: 'Para Çıkışı', icon: <ArrowUpRight size={16} />, run: () => setMoneyMove({ direction: 'cikis' }) },
    { id: 'kasa-quick-transfer', label: 'Transfer', icon: <ArrowRightLeft size={16} />, run: () => setTransfer({ mode: 'between' }) },
    {
      id: 'kasa-quick-pos',
      label: "POS'u Bankaya Aktar",
      icon: <CreditCard size={16} />,
      run: () => setTransfer({ mode: 'pos', fromId: posWithBalance[0]?.id }),
      badge: posWithBalance.length ? formatMoney(posWithBalance.reduce((s, a) => s + (a.currency === 'TRY' ? balances[a.id] || 0 : 0), 0), 'TRY') : undefined,
      strong: posWithBalance.length > 0,
    },
  ];

  return (
    <div className="kasa-view space-y-5">
      {/* Başlık */}
      <div className="kasa-hero flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-6 rounded-2xl border border-white/10 bg-[#111111]">
        <div>
          <h1 id="kasa-view-heading" className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Kasa &amp; Banka</h1>
          <p className="text-white/50 text-xs mt-1">Hesaplarınız, bakiyeleriniz ve para hareketleri. Bir hesaba tıklayınca ayrıntısı açılır.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" id="kasa-all-movements" onClick={() => setDrawer('all')} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/15 text-white/80 hover:bg-white/10 text-xs font-bold cursor-pointer"><List size={14} /> Tüm Hareketler</button>
          <button type="button" id="kasa-new-account" onClick={() => setAccountForm({})} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold cursor-pointer"><Plus size={14} /> Yeni Hesap</button>
        </div>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="kasa-card rounded-2xl border border-white/10 bg-[#111111] p-5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">Toplam nakit varlık{summary.foreign.USD.amount || summary.foreign.EUR.amount ? ' (TL karşılığı)' : ''}</div>
          <div id="kasa-total" className="mt-1 text-3xl font-extrabold tabular-nums text-white">{formatMoney(total, 'TRY')}</div>
          <div className="mt-4 flex h-3 rounded-full overflow-hidden bg-white/5" aria-hidden="true">
            {(['kasa', 'banka', 'pos'] as AccountType[]).map((t) => <div key={t} style={{ width: `${pct(summary.byType[t])}%`, background: TYPE_COLOR[t] }} />)}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/70">
            {(['kasa', 'banka', 'pos'] as AccountType[]).map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <i className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: TYPE_COLOR[t] }} />
                {t === 'pos' ? 'POS (bankaya geçecek)' : TYPE_LABEL[t]} <b className="tabular-nums text-white">{formatMoney(summary.byType[t], 'TRY')}</b>
              </span>
            ))}
          </div>
        </div>
        <div className="kasa-card rounded-2xl border border-white/10 bg-[#111111] p-5">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/50">Döviz hesapları</div>
          {summary.foreign.USD.amount || summary.foreign.EUR.amount ? (
            <div className="mt-3 space-y-2.5">
              {(['USD', 'EUR'] as const).filter((c) => summary.foreign[c].amount).map((c) => (
                <div key={c} className="flex justify-between gap-3 text-sm">
                  <b className="tabular-nums text-white">{formatMoney(summary.foreign[c].amount, c)}</b>
                  <span className="tabular-nums text-white/50">≈ {formatMoney(summary.foreign[c].tl, 'TRY')}</span>
                </div>
              ))}
              <p className="text-[11px] text-white/40">TCMB kuru ile.</p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-white/50">Döviz hesabı yok. USD ya da EUR hesap eklerseniz burada TL karşılığıyla görünür.</p>
          )}
        </div>
      </div>

      {/* Hızlı işlemler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {quickActions.map((q) => (
          <button
            key={q.id}
            id={q.id}
            type="button"
            onClick={q.run}
            className={`kasa-quick flex items-center gap-2.5 p-3.5 rounded-2xl border text-left cursor-pointer transition ${q.strong ? 'border-violet-500/40 bg-violet-500/10' : 'border-white/10 bg-[#111111] hover:bg-white/5'}`}
          >
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${q.strong ? 'bg-violet-500/20 text-violet-300' : 'bg-teal-500/10 text-teal-400'}`}>{q.icon}</span>
            <span className="min-w-0">
              <span className="block text-sm font-extrabold text-white">{q.label}</span>
              {q.badge && <span className="block text-[11px] text-violet-300 tabular-nums">{q.badge} bekliyor</span>}
            </span>
          </button>
        ))}
      </div>

      {/* Hesabı belli olmayan eski hareketler */}
      {unassigned.length > 0 && (
        <div id="kasa-unassigned" className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10">
          <AlertTriangle size={20} className="text-rose-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <b className="text-sm text-rose-300">{unassigned.length} hareketin hesabı belli değil</b>
            <p className="text-xs text-white/60 mt-0.5">Hesap seçilmeden kaydedildikleri için merkez hesapta görünüyorlar; bakiyeler bu yüzden bankadakiyle tutmayabilir.</p>
          </div>
          <button type="button" id="kasa-assign-open" onClick={() => setAssignOpen(true)} className="shrink-0 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer">Hesaplarını belirle</button>
        </div>
      )}

      {/* Hesap listesi */}
      <div className="kasa-card rounded-2xl border border-white/10 bg-[#111111] overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4">
          <div className="inline-flex flex-wrap rounded-xl bg-white/5 border border-white/10 p-1" role="tablist">
            {([['all', 'Tümü'], ['banka', 'Banka'], ['kasa', 'Kasa'], ['pos', 'POS']] as [Tab, string][]).map(([t, label]) => (
              <button key={t} type="button" role="tab" data-kasa-tab={t} aria-selected={tab === t} onClick={() => setTab(t)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${tab === t ? 'bg-teal-600 text-white' : 'text-white/60 hover:text-white'}`}>
                {label} ({counts[t]})
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 md:w-64">
            <Search size={14} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Hesap, banka ya da IBAN ara…" className="bg-transparent border-0 outline-none text-xs text-white flex-1 min-w-0" style={{ boxShadow: 'none' }} />
          </label>
        </div>

        <div className="hidden md:grid grid-cols-[minmax(0,2.2fr)_90px_120px_minmax(0,1.2fr)_110px_minmax(0,1fr)] gap-3 px-5 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white/40 border-t border-white/5">
          <span>Hesap</span><span>Tür</span><span>IBAN</span><span className="text-right">Bakiye</span><span className="text-right">Son hareket</span><span />
        </div>
        <div id="kasa-account-list" className="divide-y divide-white/5 border-t border-white/5">
          {listAccounts.length === 0 && <p className="px-5 py-10 text-center text-xs text-white/45">{showArchived ? 'Arşivde hesap yok.' : 'Bu görünümde hesap yok.'}</p>}
          {listAccounts.map((a) => {
            const bal = balances[a.id] || 0;
            const primary = isPrimaryAccount(bankAccounts, a);
            const linked = a.type === 'pos' && a.linkedBankAccountId ? bankAccounts.find((b) => b.id === a.linkedBankAccountId) : undefined;
            const sub = a.type === 'pos'
              ? (linked ? `→ ${accountDisplayName(linked)} hesabına geçer` : 'Bankası seçilmedi')
              : primary ? `Varsayılan ${TYPE_LABEL[a.type].toLocaleLowerCase('tr-TR')} hesabı` : (a.bankName || (a.type === 'kasa' ? 'Nakit' : 'Banka hesabı'));
            return (
              <div
                key={a.id}
                id={`kasa-account-${a.id}`}
                role="button"
                tabIndex={0}
                onClick={() => setDrawer(a.id)}
                onKeyDown={(e) => { if (e.key === 'Enter') setDrawer(a.id); }}
                className="grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,2.2fr)_90px_120px_minmax(0,1.2fr)_110px_minmax(0,1fr)] gap-x-3 gap-y-1 items-center px-4 md:px-5 py-3.5 cursor-pointer hover:bg-white/[0.03] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AccountBadge account={a} />
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-white truncate">{accountDisplayName(a)}{primary && <span className="text-teal-400"> ★</span>}</div>
                    <div className="text-[11px] text-white/50 truncate">{sub}</div>
                  </div>
                </div>
                <span className="hidden md:inline-flex"><span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${TYPE_TAG[a.type]}`}>{TYPE_LABEL[a.type]}{a.currency !== 'TRY' ? ` · ${a.currency}` : ''}</span></span>
                <span className="hidden md:block text-xs text-white/50 tabular-nums">{ibanLast4(a.iban) ? `•••• ${ibanLast4(a.iban)}` : '—'}</span>
                <span className="text-right">
                  <span className={`block text-sm font-extrabold tabular-nums ${bal < 0 ? 'text-rose-400' : 'text-white'}`}>{formatMoney(bal, a.currency)}</span>
                  {a.currency !== 'TRY' && <span className="block text-[11px] text-white/40 tabular-nums">≈ {formatMoney(convertWithRates(bal, a.currency, 'TRY', fxRates), 'TRY')}</span>}
                </span>
                <span className="hidden md:block text-right text-xs text-white/50">{relativeDay(lastMovementDate.get(a.id), today)}</span>
                <span className="col-span-2 md:col-span-1 flex justify-end items-center gap-2">
                  {a.type === 'pos' && bal > 0.009 && !a.archived && (
                    <button type="button" data-pos-transfer={a.id} onClick={(e) => { e.stopPropagation(); setTransfer({ mode: 'pos', fromId: a.id }); }} className="px-3 py-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 text-violet-300 text-[11px] font-extrabold cursor-pointer whitespace-nowrap">Bankaya aktar</button>
                  )}
                  <ChevronRight size={16} className="hidden md:block text-white/30" />
                </span>
              </div>
            );
          })}
        </div>
        {(archivedAccounts.length > 0 || showArchived) && (
          <button type="button" id="kasa-toggle-archived" onClick={() => setShowArchived(!showArchived)} className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-bold text-white/50 hover:text-white border-t border-white/5 cursor-pointer">
            {showArchived ? <><EyeOff size={13} /> Aktif hesaplara dön</> : <><Eye size={13} /> Arşivdeki hesaplar ({archivedAccounts.length})</>}
          </button>
        )}
      </div>

      {/* Pencereler */}
      {drawer && (
        <AccountDrawer
          account={drawerAccount}
          accounts={bankAccounts}
          balances={balances}
          movements={movements}
          onClose={() => setDrawer(null)}
          onMoneyMove={(direction, accountId) => setMoneyMove({ direction, accountId })}
          onTransfer={(accountId) => {
            const acc = bankAccounts.find((b) => b.id === accountId);
            setTransfer({ mode: acc?.type === 'pos' ? 'pos' : acc?.type === 'kasa' ? 'deposit' : 'between', fromId: accountId });
          }}
          onEdit={(account) => setAccountForm({ editing: account })}
          onMakePrimary={handleMakePrimary}
          onDeleteManual={handleDeleteManual}
          onReconcile={handleReconcile}
        />
      )}
      {moneyMove && (
        <MoneyMoveModal
          accounts={bankAccounts}
          balances={balances}
          initialAccountId={moneyMove.accountId}
          initialDirection={moneyMove.direction}
          onClose={() => setMoneyMove(null)}
          onDone={(message, undo) => showToast(message, undo)}
        />
      )}
      {transfer && (
        <TransferModal
          accounts={bankAccounts}
          balances={balances}
          fxRates={fxRates}
          initialMode={transfer.mode}
          initialFromId={transfer.fromId}
          onClose={() => setTransfer(null)}
          onDone={(message, undo) => showToast(message, undo)}
        />
      )}
      {accountForm && (
        <AccountFormModal
          accounts={bankAccounts}
          editing={accountForm.editing}
          initialType={accountForm.type}
          onClose={() => setAccountForm(null)}
          onSaved={(message) => showToast(message)}
        />
      )}
      {assignOpen && (
        <AssignAccountsModal accounts={bankAccounts} items={unassigned} onClose={() => setAssignOpen(false)} onDone={(message) => showToast(message)} />
      )}

      {/* Bildirim + Geri al */}
      {toast && (
        <div id="kasa-toast" className="fixed z-[260] left-1/2 -translate-x-1/2 bottom-24 md:bottom-6 w-[calc(100%-24px)] max-w-lg flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl" style={{ background: toast.error ? '#7f1d1d' : '#0f172a', color: '#ffffff' }}>
          <span className="flex-1 text-sm" style={{ color: '#ffffff' }}>{toast.message}</span>
          {toast.undo && (
            <button type="button" id="kasa-undo" onClick={runUndo} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer" style={{ background: '#ffffff', color: '#0f172a' }}>
              Geri al ({countdown})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
