/**
 * Çalışan Takibi: hareket günlüğünden kişi bazında günlük özet ve gün sonu raporu (PDF).
 */
import type { ReportDocument } from '../pdf/reportPdf';
import { formatMoney, formatDate } from '../pdf/format';
import { logError } from '../utils/errorLogger';
import { ACTIVITY_ACTION_LABELS, ACTIVITY_CATEGORY_LABELS, ActivityEntry } from './activityTypes';

export interface StaffDaySummary {
  userId: string;
  userName: string;
  role: 'owner' | 'staff';
  /** İlk ve son kayıt zamanı (ISO) */
  firstAt: string;
  lastAt: string;
  loginCount: number;
  salesCount: number;
  salesTotal: number;
  returnsCount: number;
  returnsTotal: number;
  purchasesCount: number;
  purchasesTotal: number;
  /** Ayrı tahsilat kayıtları */
  collectionsCount: number;
  collectionsTotal: number;
  /** Satışta peşin alınan (nakit/kart) tutar */
  paidAtSaleTotal: number;
  paymentsCount: number;
  paymentsTotal: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
  riskyCount: number;
  totalCount: number;
}

/** Yalnızca TL tutarlar toplanır; döviz kayıtları adet olarak sayılır */
const tlAmount = (e: ActivityEntry): number => (!e.currency || e.currency === 'TRY' ? Number(e.amount) || 0 : 0);

export function summarizeActivity(entries: ActivityEntry[]): StaffDaySummary[] {
  const map = new Map<string, StaffDaySummary>();
  try {
    for (const e of entries) {
      let s = map.get(e.userId);
      if (!s) {
        s = {
          userId: e.userId,
          userName: e.userName,
          role: e.role,
          firstAt: e.at,
          lastAt: e.at,
          loginCount: 0,
          salesCount: 0,
          salesTotal: 0,
          returnsCount: 0,
          returnsTotal: 0,
          purchasesCount: 0,
          purchasesTotal: 0,
          collectionsCount: 0,
          collectionsTotal: 0,
          paidAtSaleTotal: 0,
          paymentsCount: 0,
          paymentsTotal: 0,
          createCount: 0,
          updateCount: 0,
          deleteCount: 0,
          riskyCount: 0,
          totalCount: 0,
        };
        map.set(e.userId, s);
      }
      if (e.at < s.firstAt) s.firstAt = e.at;
      if (e.at > s.lastAt) s.lastAt = e.at;
      s.totalCount++;
      if (e.risky) s.riskyCount++;
      if (e.action === 'login') s.loginCount++;
      if (e.action === 'create') s.createCount++;
      if (e.action === 'update') s.updateCount++;
      if (e.action === 'delete') s.deleteCount++;

      if (e.action === 'create' && (e.category === 'satis' || e.category === 'tahsilat')) {
        const type = e.after?.type;
        const amount = tlAmount(e);
        if (type === 'sale') {
          s.salesCount++;
          s.salesTotal += amount;
          if (!e.currency || e.currency === 'TRY') s.paidAtSaleTotal += Number(e.after?.paidNow) || 0;
        } else if (type === 'sale_return') {
          s.returnsCount++;
          s.returnsTotal += amount;
        } else if (type === 'purchase') {
          s.purchasesCount++;
          s.purchasesTotal += amount;
        } else if (type === 'collection') {
          s.collectionsCount++;
          s.collectionsTotal += amount;
        } else if (type === 'payment') {
          s.paymentsCount++;
          s.paymentsTotal += amount;
        }
      }
    }
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'staffReport.summarizeActivity');
  }
  // Sahipler önce, sonra ada göre
  return [...map.values()].sort((a, b) => (a.role === b.role ? a.userName.localeCompare(b.userName, 'tr') : a.role === 'owner' ? -1 : 1));
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

/** "09:12 – 17:40" (çok günlü dönemde tarihli) */
export function workSpan(s: Pick<StaffDaySummary, 'firstAt' | 'lastAt'>): string {
  const sameDay = s.firstAt.slice(0, 10) === s.lastAt.slice(0, 10);
  if (sameDay) return `${formatTime(s.firstAt)} – ${formatTime(s.lastAt)}`;
  const fmt = (iso: string) => `${formatDate(new Date(iso).toLocaleDateString('sv-SE'))} ${formatTime(iso)}`;
  return `${fmt(s.firstAt)} – ${fmt(s.lastAt)}`;
}

export const money = (value: number) => formatMoney(value, 'TRY');

export function entryLabel(e: ActivityEntry): string {
  return `${ACTIVITY_CATEGORY_LABELS[e.category] || e.category} · ${ACTIVITY_ACTION_LABELS[e.action] || e.action}`;
}

/** Gün sonu raporu */
export function buildStaffReport(entries: ActivityEntry[], periodLabel: string, fileDay: string, selectedName?: string): ReportDocument {
  const summaries = summarizeActivity(entries);
  const total = summaries.reduce(
    (acc, s) => ({
      sales: acc.sales + s.salesTotal,
      cashIn: acc.cashIn + s.collectionsTotal + s.paidAtSaleTotal,
      deletes: acc.deletes + s.deleteCount,
      risky: acc.risky + s.riskyCount,
    }),
    { sales: 0, cashIn: 0, deletes: 0, risky: 0 },
  );
  const chronological = [...entries].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  const multiDay = new Set(entries.map((e) => e.day)).size > 1;
  const timeOf = (e: ActivityEntry) => (multiDay ? `${formatDate(e.day).slice(0, 5)} ${formatTime(e.at)}` : formatTime(e.at));
  const risky = chronological.filter((e) => e.risky);

  return {
    title: selectedName ? `Çalışan Raporu · ${selectedName}` : 'Gün Sonu Çalışan Raporu',
    fileKey: `calisan-raporu-${fileDay}${selectedName ? `-${selectedName}` : ''}`,
    periodLabel,
    currencyLabel: 'TL',
    cards: [
      { label: 'Satış', value: money(total.sales) },
      { label: 'Kasaya giren', value: money(total.cashIn), hint: 'Tahsilat + satışta peşin', tone: 'positive' },
      { label: 'Silme', value: String(total.deletes), tone: total.deletes ? 'negative' : 'neutral' },
      { label: 'Dikkat edilecek', value: String(total.risky), hint: 'Silme, düzenleme, onay', tone: total.risky ? 'negative' : 'neutral' },
    ],
    sections: [
      {
        kind: 'table',
        title: 'Kişi bazında özet',
        columns: [
          { header: 'Kişi', emphasis: true },
          { header: 'Çalışma', width: 30 },
          { header: 'Satış', align: 'right', width: 30 },
          { header: 'Tahsilat + peşin', align: 'right', width: 30 },
          { header: 'Düzenleme', align: 'center', width: 22 },
          { header: 'Silme', align: 'center', width: 14 },
          { header: 'Dikkat', align: 'center', width: 14 },
        ],
        rows: summaries.map((s) => [
          `${s.userName}${s.role === 'owner' ? ' (Sahip)' : ''}`,
          workSpan(s),
          `${s.salesCount} · ${money(s.salesTotal)}`,
          money(s.collectionsTotal + s.paidAtSaleTotal),
          String(s.updateCount),
          String(s.deleteCount),
          String(s.riskyCount),
        ]),
        emptyText: 'Bu dönemde kayıt yok.',
      },
      {
        kind: 'table',
        title: 'Dikkat edilecek işlemler',
        columns: [
          { header: 'Saat', width: multiDay ? 24 : 14 },
          { header: 'Kişi', width: 26 },
          { header: 'İşlem', width: 34 },
          { header: 'Açıklama' },
          { header: 'Tutar', align: 'right', width: 26 },
        ],
        rows: risky.map((e) => [timeOf(e), e.userName, entryLabel(e), e.title, e.amount ? money(Number(e.amount)) : '']),
        emptyText: 'Silme, düzenleme ya da onay gerektiren işlem yok.',
      },
      {
        kind: 'table',
        title: 'Tüm hareketler',
        columns: [
          { header: 'Saat', width: multiDay ? 24 : 14 },
          { header: 'Kişi', width: 26 },
          { header: 'İşlem', width: 34 },
          { header: 'Açıklama' },
          { header: 'Tutar', align: 'right', width: 26 },
        ],
        rows: chronological.map((e) => [timeOf(e), e.userName, entryLabel(e), `${e.risky ? '[!] ' : ''}${e.title}`, e.amount ? money(Number(e.amount)) : '']),
        emptyText: 'Bu dönemde kayıt yok.',
      },
      {
        kind: 'note',
        text: 'Tutarlar TL kayıtların toplamıdır. [!] işaretli satırlar silme, düzenleme, sahip onayı ya da yetki değişikliğidir.',
      },
    ],
  };
}
