/**
 * Veresiye (alacak) yaşlandırması.
 *
 * Carinin borçlandığı her kayıt (satış, açılış bakiyesi vb.) bir "borç dilimi" açar; tahsilat ve
 * iadeler en eski dilimden başlayarak kapatır (FIFO). Kalan dilimlerin tarihleri borcun kaç
 * gündür beklediğini verir. Hesap, cari bakiyesindeki kuralla aynıdır (utils/cariLedger).
 */
import type { Cari, Transaction } from '../types';
import { buildCariLedger } from './cariLedger';
import { formatDateISO, parseDateISO } from './dateUtils';
import { roundMoney } from './invoiceMath';
import { logError } from './errorLogger';

export interface DebtAging {
  /** Güncel bakiye (pozitif = müşteri borçlu) */
  balance: number;
  /** Ödenmemiş en eski borcun tarihi (YYYY-MM-DD); borç yoksa null */
  oldestOpenDate: string | null;
  /** En eski ödenmemiş borcun beklediği gün */
  oldestAgeDays: number;
  /** Yaş aralıklarına göre ödenmemiş tutar */
  buckets: { d0_30: number; d31_60: number; d61_90: number; d90p: number };
  /** Son tahsilat (cariyi alacaklandıran ödeme) tarihi */
  lastCollectionDate: string | null;
}

const EMPTY: DebtAging = {
  balance: 0,
  oldestOpenDate: null,
  oldestAgeDays: 0,
  buckets: { d0_30: 0, d31_60: 0, d61_90: 0, d90p: 0 },
  lastCollectionDate: null,
};

function daysBetween(fromISO: string, toISO: string): number {
  const from = parseDateISO(fromISO).getTime();
  const to = parseDateISO(toISO).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 0;
  return Math.max(0, Math.round((to - from) / 86400000));
}

export function computeDebtAging(
  cari: Pick<Cari, 'id' | 'openingBalance' | 'createdAt' | 'balance'>,
  islemler: Transaction[],
  todayISO: string = formatDateISO(new Date()),
): DebtAging {
  try {
    const ledger = buildCariLedger(cari, islemler);
    const layers: { date: string; amount: number }[] = [];
    const openingDate = cari.createdAt && !isNaN(new Date(cari.createdAt).getTime())
      ? formatDateISO(new Date(cari.createdAt))
      : todayISO;

    // Açılış bakiyesi: pozitifse ilk borç dilimi, negatifse ilk borçları kapatacak avans
    let credit = 0;
    const opening = Number(cari.openingBalance) || 0;
    if (opening > 0) layers.push({ date: openingDate, amount: opening });
    else if (opening < 0) credit = -opening;

    let lastCollectionDate: string | null = null;
    ledger.rows.forEach((row) => {
      if (row.debit > 0) {
        let amount = row.debit;
        // Önceden alınmış avans varsa yeni borcu önce o kapatır
        if (credit > 0) {
          const used = Math.min(credit, amount);
          credit = roundMoney(credit - used);
          amount = roundMoney(amount - used);
        }
        if (amount > 0.004) layers.push({ date: row.date, amount });
      }
      if (row.credit > 0) {
        if (row.transaction?.type === 'collection') lastCollectionDate = row.date;
        let remaining = row.credit;
        while (remaining > 0.004 && layers.length) {
          const first = layers[0];
          const used = Math.min(first.amount, remaining);
          first.amount = roundMoney(first.amount - used);
          remaining = roundMoney(remaining - used);
          if (first.amount <= 0.004) layers.shift();
        }
        if (remaining > 0.004) credit = roundMoney(credit + remaining);
      }
    });

    const buckets = { d0_30: 0, d31_60: 0, d61_90: 0, d90p: 0 };
    layers.forEach((layer) => {
      const age = daysBetween(layer.date, todayISO);
      if (age <= 30) buckets.d0_30 += layer.amount;
      else if (age <= 60) buckets.d31_60 += layer.amount;
      else if (age <= 90) buckets.d61_90 += layer.amount;
      else buckets.d90p += layer.amount;
    });
    (Object.keys(buckets) as (keyof typeof buckets)[]).forEach((key) => { buckets[key] = roundMoney(buckets[key]); });

    const oldest = layers.length ? layers[0].date : null;
    return {
      balance: roundMoney(Number(cari.balance) || 0),
      oldestOpenDate: oldest,
      oldestAgeDays: oldest ? daysBetween(oldest, todayISO) : 0,
      buckets,
      lastCollectionDate,
    };
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'debtAging.computeDebtAging');
    return { ...EMPTY, balance: Number(cari.balance) || 0 };
  }
}
