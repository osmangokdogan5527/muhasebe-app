/**
 * Çalışan Takibi (yalnızca sahip): kişi bazında günlük özet, zaman çizelgesi,
 * riskli işlemler ve gün sonu PDF raporu.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Clock, FileDown, LogIn, Monitor, ShieldCheck, Smartphone, User as UserIcon, UserCheck } from 'lucide-react';
import { subscribeActivity } from '../firebase';
import { logError } from '../utils/errorLogger';
import { addDaysISO, getTodayISO } from '../utils/dateUtils';
import { formatDate } from '../pdf/format';
import { ReportPdfModal } from '../components/pdf/ReportPdfModal';
import type { ReportDocument } from '../pdf/reportPdf';
import { ACTIVITY_ACTION_LABELS, ACTIVITY_CATEGORY_LABELS, ActivityEntry } from './activityTypes';
import type { StaffUser } from './staffUsers';
import { buildStaffReport, formatTime, money, summarizeActivity, workSpan } from './staffReport';

interface StaffActivityViewProps {
  users: StaffUser[];
}

type Period = 'today' | 'yesterday' | 'week' | 'custom';

/** Ayrıntı tablosunda alan adlarının Türkçe karşılıkları */
const FIELD_LABELS: Record<string, string> = {
  typeLabel: 'Tür',
  cariName: 'Cari',
  date: 'Tarih',
  amount: 'Tutar',
  currency: 'Para birimi',
  invoiceNo: 'Belge no',
  account: 'Hesap',
  description: 'Açıklama',
  paidNow: 'Peşin alınan',
  name: 'Ad',
  code: 'Kod',
  phone: 'Telefon',
  email: 'E-posta',
  address: 'Adres',
  balance: 'Bakiye',
  openingBalance: 'Açılış bakiyesi',
  creditLimit: 'Kredi limiti',
  quantity: 'Miktar',
  minQuantity: 'Kritik miktar',
  unit: 'Birim',
  salesPrice: 'Satış fiyatı',
  purchasePrice: 'Alış fiyatı',
  taxRate: 'KDV %',
  barcode: 'Barkod',
  category: 'Kategori',
  title: 'Başlık',
  role: 'Rol',
  active: 'Aktif',
  screens: 'Ekranlar',
  actions: 'İşlem yetkileri',
  pin: 'PIN',
  employeeName: 'Personel',
  serialNo: 'Seri no',
  dueDate: 'Vade',
  debtor: 'Borçlu',
  status: 'Durum',
  bank: 'Banka',
  totalAmount: 'Toplam',
};
const HIDDEN_FIELDS = new Set(['id', 'type', 'createdAt', 'isActive', 'stockId', 'bankAccountId', 'cariId', 'linkedInvoiceId', 'salesPriceIncludesTax', 'isOpeningBalance']);
const ACCOUNT_LABELS: Record<string, string> = { cash: 'Kasa', bank: 'Banka', pos: 'POS', '': 'Açık hesap' };
const MONEY_FIELDS = new Set(['amount', 'paidNow', 'balance', 'openingBalance', 'creditLimit', 'salesPrice', 'purchasePrice', 'totalAmount']);

function formatField(key: string, value: any): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
  if (key === 'account') return ACCOUNT_LABELS[String(value)] ?? String(value);
  if (MONEY_FIELDS.has(key) && typeof value === 'number') return money(value);
  if (key === 'date' || key === 'dueDate') return formatDate(String(value));
  return String(value);
}

const periodRange = (period: Period, customDay: string): { from: string; to: string; label: string } => {
  const today = getTodayISO();
  if (period === 'yesterday') {
    const d = addDaysISO(-1, today);
    return { from: d, to: d, label: formatDate(d) };
  }
  if (period === 'week') {
    const from = addDaysISO(-6, today);
    return { from, to: today, label: `${formatDate(from)} – ${formatDate(today)}` };
  }
  if (period === 'custom' && customDay) return { from: customDay, to: customDay, label: formatDate(customDay) };
  return { from: today, to: today, label: formatDate(today) };
};

const EntryDetails: React.FC<{ entry: ActivityEntry }> = ({ entry }) => {
  const before = entry.before || {};
  const after = entry.after || {};
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).filter((k) => !HIDDEN_FIELDS.has(k) && k !== 'items');
  const hasBoth = !!entry.before && !!entry.after;
  const items: any[] = Array.isArray(after.items) ? after.items : Array.isArray(before.items) ? before.items : [];
  const beforeItems: any[] = hasBoth && Array.isArray(before.items) ? before.items : [];
  return (
    <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-3 text-xs space-y-2">
      {keys.length > 0 && (
        <table className="w-full">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-white/40">
              <th className="text-left font-bold py-1 pr-2">Alan</th>
              {hasBoth ? <th className="text-left font-bold py-1 pr-2">Önce</th> : null}
              <th className="text-left font-bold py-1">{hasBoth ? 'Sonra' : entry.before ? 'Silinen kayıt' : 'Değer'}</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => {
              const b = before[k];
              const a = after[k];
              const changed = hasBoth && JSON.stringify(b) !== JSON.stringify(a);
              return (
                <tr key={k} className={changed ? 'bg-amber-500/10' : ''}>
                  <td className="py-1 pr-2 text-white/50 align-top whitespace-nowrap">{FIELD_LABELS[k] || k}</td>
                  {hasBoth ? <td className={`py-1 pr-2 align-top ${changed ? 'text-rose-300 line-through decoration-rose-400/60' : 'text-white/70'}`}>{formatField(k, b)}</td> : null}
                  <td className={`py-1 align-top ${changed ? 'text-emerald-300 font-semibold' : 'text-white/80'}`}>{formatField(k, hasBoth ? a : entry.before ? b : a)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {items.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-1">{hasBoth ? 'Kalemler (yeni)' : 'Kalemler'}</div>
          <ul className="space-y-0.5">
            {items.map((i, idx) => (
              <li key={idx} className="flex justify-between gap-2 text-white/80">
                <span className="truncate">{i.name} × {i.qty}</span>
                <span className="tabular-nums">{money(Number(i.total) || 0)}</span>
              </li>
            ))}
          </ul>
          {beforeItems.length > 0 && JSON.stringify(beforeItems) !== JSON.stringify(items) && (
            <div className="mt-2 text-white/50">
              <div className="text-[10px] uppercase tracking-wider font-bold mb-1">Önceki kalemler</div>
              {beforeItems.map((i, idx) => (
                <div key={idx} className="flex justify-between gap-2 line-through decoration-rose-400/50">
                  <span className="truncate">{i.name} × {i.qty}</span>
                  <span className="tabular-nums">{money(Number(i.total) || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const StaffActivityView: React.FC<StaffActivityViewProps> = ({ users }) => {
  const [period, setPeriod] = useState<Period>('today');
  const [customDay, setCustomDay] = useState(getTodayISO());
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [onlyRisky, setOnlyRisky] = useState(false);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [report, setReport] = useState<ReportDocument | null>(null);

  const range = useMemo(() => periodRange(period, customDay), [period, customDay]);

  useEffect(() => {
    setLoading(true);
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeActivity(range.from, range.to, (list) => {
        setEntries(list);
        setLoading(false);
      });
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'StaffActivityView.subscribe');
      setEntries([]);
      setLoading(false);
    }
    return () => unsub?.();
  }, [range.from, range.to]);

  const summaries = useMemo(() => summarizeActivity(entries), [entries]);
  const filtered = useMemo(
    () => entries.filter((e) => (selectedUser === 'all' || e.userId === selectedUser) && (!onlyRisky || e.risky)),
    [entries, selectedUser, onlyRisky],
  );
  const multiDay = range.from !== range.to;
  const selectedName = selectedUser === 'all' ? undefined : summaries.find((s) => s.userId === selectedUser)?.userName || users.find((u) => u.id === selectedUser)?.name;
  // Hiç kaydı olmayan aktif çalışanlar da "işlem yok" olarak gösterilir
  const idleUsers = users.filter((u) => u.active && !summaries.some((s) => s.userId === u.id));

  const openReport = () => {
    try {
      const source = selectedUser === 'all' ? entries : entries.filter((e) => e.userId === selectedUser);
      setReport(buildStaffReport(source, range.label, range.to, selectedName));
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'StaffActivityView.openReport');
    }
  };

  const periodButton = (id: Period, label: string) => (
    <button
      key={id}
      type="button"
      id={`staff-period-${id}`}
      onClick={() => setPeriod(id)}
      className={`px-3 py-2 rounded-lg text-xs font-bold border cursor-pointer transition ${period === id ? 'bg-teal-600 border-teal-500 text-white' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
    >
      {label}
    </button>
  );

  return (
    <div id="staff-activity-view" className="space-y-5">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[#111111] p-5 sm:p-6 rounded-lg border border-white/5 shadow-lg">
        <div>
          <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90 flex items-center gap-2"><UserCheck size={16} className="text-teal-400" /> Çalışan Takibi</h1>
          <p className="text-white/40 text-xs mt-1">Kim, ne zaman, ne yaptı? Bu ekranı firma sahipleri ve sahibin yetki verdiği kullanıcılar görür.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {periodButton('today', 'Bugün')}
          {periodButton('yesterday', 'Dün')}
          {periodButton('week', 'Son 7 gün')}
          <input
            type="date"
            id="staff-period-day"
            value={customDay}
            max={getTodayISO()}
            onChange={(e) => { setCustomDay(e.target.value); setPeriod('custom'); }}
            className={`px-3 py-2 rounded-lg text-xs border bg-white/5 text-white/80 outline-none ${period === 'custom' ? 'border-teal-500' : 'border-white/10'}`}
          />
          <button
            type="button"
            id="btn-staff-report"
            onClick={openReport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <FileDown size={14} /> Gün sonu PDF
          </button>
        </div>
      </div>

      {/* Kişi kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {summaries.map((s) => {
          const active = selectedUser === s.userId;
          return (
            <button
              key={s.userId}
              type="button"
              id={`staff-card-${s.userId}`}
              onClick={() => setSelectedUser(active ? 'all' : s.userId)}
              className={`text-left p-4 rounded-2xl border transition cursor-pointer ${active ? 'border-teal-500 bg-teal-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-300 flex items-center justify-center font-bold shrink-0">{s.userName.charAt(0).toLocaleUpperCase('tr-TR')}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                    {s.userName}
                    {s.role === 'owner' && <ShieldCheck size={13} className="text-amber-300" />}
                  </div>
                  <div className="text-[11px] text-white/50 flex items-center gap-1"><Clock size={11} /> {workSpan(s)}</div>
                </div>
                {s.riskyCount > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-rose-500/15 text-rose-300" title="Silme, düzenleme, onay">
                    <AlertTriangle size={12} /> {s.riskyCount}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]">
                <div className="rounded-lg bg-black/20 p-2">
                  <div className="text-white/45">Satış ({s.salesCount})</div>
                  <div className="text-white font-bold tabular-nums">{money(s.salesTotal)}</div>
                </div>
                <div className="rounded-lg bg-black/20 p-2">
                  <div className="text-white/45">Tahsilat + peşin</div>
                  <div className="text-emerald-300 font-bold tabular-nums">{money(s.collectionsTotal + s.paidAtSaleTotal)}</div>
                </div>
                <div className="rounded-lg bg-black/20 p-2">
                  <div className="text-white/45">Düzenleme / Silme</div>
                  <div className={`font-bold ${s.updateCount + s.deleteCount ? 'text-rose-300' : 'text-white'}`}>{s.updateCount} / {s.deleteCount}</div>
                </div>
                <div className="rounded-lg bg-black/20 p-2">
                  <div className="text-white/45">Toplam hareket</div>
                  <div className="text-white font-bold">{s.totalCount} <span className="text-white/40 font-normal">· {s.loginCount} giriş</span></div>
                </div>
              </div>
            </button>
          );
        })}
        {idleUsers.map((u) => (
          <div key={u.id} className="p-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] flex items-center gap-3 opacity-70">
            <span className="w-10 h-10 rounded-xl bg-white/5 text-white/40 flex items-center justify-center font-bold shrink-0">{u.name.charAt(0).toLocaleUpperCase('tr-TR')}</span>
            <div>
              <div className="text-sm font-bold text-white/70">{u.name}</div>
              <div className="text-[11px] text-white/40">Bu dönemde işlem yok</div>
            </div>
          </div>
        ))}
      </div>

      {/* Zaman çizelgesi */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-white/80">
            Hareketler {selectedName ? `· ${selectedName}` : ''} <span className="text-white/40 font-normal normal-case">({filtered.length})</span>
          </h2>
          <div className="flex items-center gap-3">
            {selectedUser !== 'all' && (
              <button type="button" onClick={() => setSelectedUser('all')} className="text-[11px] text-teal-300 cursor-pointer">Herkesi göster</button>
            )}
            <label className="flex items-center gap-2 text-[11px] text-white/70 cursor-pointer">
              <input id="staff-only-risky" type="checkbox" className="accent-rose-500" checked={onlyRisky} onChange={() => setOnlyRisky((v) => !v)} />
              Sadece dikkat edilecekler
            </label>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-white/40 py-6 text-center">Yükleniyor…</p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-white/40 py-6 text-center">{entries.length ? 'Filtreye uyan hareket yok.' : 'Bu dönemde kayıtlı hareket yok.'}</p>
        ) : (
          <ol className="space-y-1.5">
            {filtered.map((e, idx) => {
              const showDay = multiDay && (idx === 0 || filtered[idx - 1].day !== e.day);
              const hasDetails = !!(e.before || e.after);
              const isOpen = expanded === e.id;
              const isSession = e.category === 'oturum';
              return (
                <React.Fragment key={e.id}>
                  {showDay && <li className="pt-2 text-[10px] font-extrabold uppercase tracking-wider text-white/40">{formatDate(e.day)}</li>}
                  <li
                    data-risky={e.risky ? 'true' : undefined}
                    className={`rounded-xl border p-3 ${e.risky ? 'border-rose-500/40 bg-rose-500/[0.07] border-l-4' : 'border-white/5 bg-black/10'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] font-mono text-white/50 w-11 shrink-0 pt-0.5">{formatTime(e.at)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-xs font-bold text-white">{e.userName}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${e.risky ? 'bg-rose-500/20 text-rose-200' : isSession ? 'bg-sky-500/15 text-sky-300' : 'bg-white/10 text-white/70'}`}>
                            {isSession ? <LogIn size={10} className="inline mr-1 -mt-0.5" /> : e.risky ? <AlertTriangle size={10} className="inline mr-1 -mt-0.5" /> : null}
                            {ACTIVITY_CATEGORY_LABELS[e.category] || e.category} · {ACTIVITY_ACTION_LABELS[e.action] || e.action}
                          </span>
                          <span className="text-white/30" title={e.device}>{e.device === 'Telefon' ? <Smartphone size={11} /> : <Monitor size={11} />}</span>
                        </div>
                        <div className="text-xs text-white/75 mt-0.5 break-words">{e.title}</div>
                      </div>
                      {typeof e.amount === 'number' && e.amount !== 0 && (
                        <span className="text-xs font-bold tabular-nums text-white shrink-0">{money(e.amount)}{e.currency && e.currency !== 'TRY' ? ` (${e.currency})` : ''}</span>
                      )}
                      {hasDetails && (
                        <button type="button" onClick={() => setExpanded(isOpen ? null : e.id)} className="p-1 rounded hover:bg-white/10 text-white/50 cursor-pointer shrink-0" aria-label="Ayrıntı">
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                    {isOpen && <EntryDetails entry={e} />}
                  </li>
                </React.Fragment>
              );
            })}
          </ol>
        )}
      </div>

      <p className="text-[11px] text-white/35 flex items-center gap-1.5"><UserIcon size={12} /> Kayıtlar kullanıcı sistemi açıldıktan sonra tutulur. Tutar toplamları TL kayıtlardır.</p>

      {report && <ReportPdfModal report={report} onClose={() => setReport(null)} />}
    </div>
  );
};

export default StaffActivityView;
