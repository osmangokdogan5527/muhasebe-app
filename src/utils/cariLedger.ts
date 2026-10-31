/**
 * Cari Hesap Ekstresi Hesabı
 *
 * Bir carinin açılış bakiyesi ve işlemlerinden yürüyen bakiyeli ekstre üretir.
 * Bakiye işareti uygulamanın her yerindeki gibidir: pozitif = cari bize borçlu (Borç bakiye),
 * negatif = biz cariye borçluyuz (Alacak bakiye). Tutarlar carinin kendi para birimindedir
 * (dövizli işlemde convertedAmount).
 */
import { Cari, Transaction } from '../types';
import { roundMoney } from './invoiceMath';

export interface LedgerRow {
  id: string;
  date: string;
  documentNo: string;
  typeLabel: string;
  description: string;
  /** Cariyi borçlandıran tutar (satış, ödeme, alış iadesi) */
  debit: number;
  /** Cariyi alacaklandıran tutar (alış, tahsilat, satış iadesi) */
  credit: number;
  /** Bu satırdan sonraki bakiye */
  balance: number;
  transaction?: Transaction;
}

export interface LedgerResult {
  rows: LedgerRow[];
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

/** İşlemin cari bakiyesine etkisi (firebase.ts'teki bakiye güncellemesiyle aynı kural). */
export function transactionBalanceEffect(t: Pick<Transaction, 'type' | 'amount' | 'convertedAmount'>): number {
  const amount = t.convertedAmount !== undefined && t.convertedAmount !== 0 ? Number(t.convertedAmount) || 0 : Number(t.amount) || 0;
  if (t.type === 'sale' || t.type === 'payment' || t.type === 'purchase_return') return amount;
  if (t.type === 'purchase' || t.type === 'collection' || t.type === 'sale_return') return -amount;
  return 0;
}

export function transactionTypeLabel(t: Pick<Transaction, 'type' | 'linkedInvoiceId' | 'account' | 'description'>): string {
  const desc = (t.description || '').toLocaleLowerCase('tr-TR');
  switch (t.type) {
    case 'sale': return 'Satış Faturası';
    case 'purchase': return 'Alış Faturası';
    case 'sale_return': return 'Satıştan İade';
    case 'purchase_return': return 'Alıştan İade';
    case 'collection':
      if (t.linkedInvoiceId) return 'Peşin Tahsilat';
      if (t.account === '' || /iskonto|düzeltme|indirim/.test(desc)) return 'Alacak Dekontu';
      return 'Tahsilat';
    case 'payment':
      if (t.linkedInvoiceId) return 'Peşin Ödeme';
      if (t.account === '' || /dekont|düzeltme|masraf/.test(desc)) return 'Borç Dekontu';
      return 'Ödeme';
    default: return 'İşlem';
  }
}

/** Aynı gündeki işlemler giriş sırasına göre dizilir (createdAt), böylece yürüyen bakiye doğru olur. */
function compareTransactions(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  const ca = a.createdAt || '';
  const cb = b.createdAt || '';
  if (ca !== cb) return ca < cb ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Carinin tüm ekstresini hesaplar. startDate/endDate (YYYY-MM-DD) verilirse dönem öncesi
 * hareketler "Devreden Bakiye" satırında toplanır, dönem sonrası hareketler gösterilmez.
 */
export function buildCariLedger(cari: Pick<Cari, 'id' | 'openingBalance' | 'createdAt'>, islemler: Transaction[], startDate?: string, endDate?: string): LedgerResult {
  const related = islemler.filter((t) => t && t.cariId === cari.id).sort(compareTransactions);
  const opening = roundMoney(Number(cari.openingBalance) || 0);

  let running = opening;
  let carried = opening;
  const rows: LedgerRow[] = [];
  let totalDebit = 0;
  let totalCredit = 0;

  related.forEach((t) => {
    const effect = roundMoney(transactionBalanceEffect(t));
    running = roundMoney(running + effect);
    if (startDate && t.date < startDate) {
      carried = running;
      return;
    }
    if (endDate && t.date > endDate) return;
    const debit = effect > 0 ? effect : 0;
    const credit = effect < 0 ? -effect : 0;
    totalDebit += debit;
    totalCredit += credit;
    rows.push({
      id: t.id,
      date: t.date,
      documentNo: t.invoiceNo || '',
      typeLabel: transactionTypeLabel(t),
      description: t.description || '',
      debit,
      credit,
      balance: running,
      transaction: t,
    });
  });

  const periodOpening = startDate ? carried : opening;
  const closing = rows.length ? rows[rows.length - 1].balance : periodOpening;
  return {
    rows,
    openingBalance: periodOpening,
    totalDebit: roundMoney(totalDebit),
    totalCredit: roundMoney(totalCredit),
    closingBalance: closing,
  };
}

export interface DocumentBalance {
  /** Belgeden önceki bakiye */
  before: number;
  /** Belgenin bakiyeye etkisi (+ borçlandırır, - alacaklandırır) */
  effect: number;
  /** Belgeden hemen sonraki bakiye */
  after: number;
  /** Bugünkü (bütün işlemler sonrası) bakiye */
  current: number;
}

/** Bir belge (fatura/makbuz) için cari bakiye özeti; işlem cari ekstresinde yoksa null. */
export function documentBalance(cari: Pick<Cari, 'id' | 'openingBalance' | 'createdAt'>, islemler: Transaction[], transactionId: string): DocumentBalance | null {
  const ledger = buildCariLedger(cari, islemler);
  const row = ledger.rows.find((r) => r.id === transactionId);
  if (!row) return null;
  const effect = roundMoney(row.debit - row.credit);
  return { before: roundMoney(row.balance - effect), effect, after: row.balance, current: ledger.closingBalance };
}
