/**
 * Kasa / Banka / POS hareketleri: faturalar, tahsilat/ödemeler, masraflar, maaş/avans ödemeleri ve
 * manuel giriş/çıkış/transferler tek listede, hesabın para biriminde. Bakiye hesabıyla
 * (cashBalances.computeAccountBalances) aynı kuralları kullanır.
 */
import { AccountTransaction, BankAccount, EmployeeTransaction, Expense, Transaction } from '../types';
import { CashCurrencyConverters, resolveCashAccountId } from './cashBalances';
import { getSyncedEmployeeExpenseIds } from './expenseUtils';
import { CashKind, KIND_OF_TYPE, accountDisplayName } from './cashAccounts';
import type { AssignableRecordKind } from '../firebase';

export interface CashMovement {
  id: string;
  date: string;
  /** Aynı gündeki sıralama için */
  createdAt?: string;
  title: string;
  description: string;
  category: string;
  kind: CashKind;
  accountId: string;
  direction: 'in' | 'out';
  amount: number;
  currency: string;
  source: { kind: AssignableRecordKind | 'hesap'; id: string; txType?: string };
  /** Hesap seçilmeden kaydedilmiş (eski) kayıt: merkez hesaba yazılmış görünür */
  unassigned: boolean;
}

const isKind = (value: unknown): value is CashKind => value === 'cash' || value === 'bank' || value === 'pos';

function withOriginalAmount(description: string, amount: number, fromCurrency: string, accountCurrency: string): string {
  if (fromCurrency === accountCurrency) return description;
  const original = `Orijinal: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: fromCurrency }).format(amount)}`;
  return description ? `${description} (${original})` : original;
}

const ISLEM_CATEGORY: Record<string, string> = {
  sale: 'Satış',
  purchase: 'Alış',
  collection: 'Tahsilat',
  payment: 'Ödeme',
  sale_return: 'Satış iadesi',
  purchase_return: 'Alış iadesi',
};

export function buildCashMovements(params: {
  bankAccounts: BankAccount[];
  accountTransactions: AccountTransaction[];
  islemler: Transaction[];
  expenses: Expense[];
  employeeTransactions: EmployeeTransaction[];
  converters: CashCurrencyConverters;
}): CashMovement[] {
  const { bankAccounts, accountTransactions, islemler, expenses, employeeTransactions, converters } = params;
  const byId = new Map(bankAccounts.map((a) => [a.id, a]));
  const list: CashMovement[] = [];

  islemler.forEach((islem) => {
    if (!isKind(islem.account)) return;
    const accountId = resolveCashAccountId(islem.bankAccountId, islem.account);
    const currency = converters.getAccountCurrency(accountId);
    const incoming = islem.type === 'sale' || islem.type === 'collection' || islem.type === 'purchase_return';
    list.push({
      id: `islem-${islem.id}`,
      date: islem.date,
      createdAt: islem.createdAt,
      title: islem.cariName || 'Cari',
      description: withOriginalAmount(islem.description || islem.invoiceNo || '', islem.amount, islem.currency || 'TRY', currency),
      category: ISLEM_CATEGORY[islem.type] || 'Ticari işlem',
      kind: islem.account,
      accountId,
      direction: incoming ? 'in' : 'out',
      amount: converters.islemToAccount(islem, accountId),
      currency,
      source: { kind: 'islem', id: islem.id },
      unassigned: !islem.bankAccountId,
    });
  });

  const synced = getSyncedEmployeeExpenseIds(employeeTransactions);
  expenses.forEach((exp) => {
    if (synced.has(exp.id) || !isKind(exp.account)) return;
    const accountId = resolveCashAccountId(exp.bankAccountId, exp.account);
    const currency = converters.getAccountCurrency(accountId);
    list.push({
      id: `gider-${exp.id}`,
      date: exp.date,
      createdAt: exp.createdAt,
      title: exp.title || 'Masraf',
      description: withOriginalAmount(exp.description || '', exp.amount, exp.currency || 'TRY', currency),
      category: exp.category || 'Masraf',
      kind: exp.account,
      accountId,
      direction: 'out',
      amount: converters.amountToAccount(exp.amount, exp.currency, accountId),
      currency,
      source: { kind: 'gider', id: exp.id },
      unassigned: !exp.bankAccountId,
    });
  });

  employeeTransactions.forEach((etx) => {
    if (!isKind(etx.account) || (etx.type !== 'payment' && etx.type !== 'advance')) return;
    const accountId = resolveCashAccountId(etx.bankAccountId, etx.account);
    const currency = converters.getAccountCurrency(accountId);
    list.push({
      id: `personel-${etx.id}`,
      date: etx.date,
      createdAt: etx.createdAt,
      title: `${etx.employeeName} · ${etx.type === 'payment' ? 'Maaş' : 'Avans'}`,
      description: withOriginalAmount(etx.description || '', etx.amount, etx.currency || 'TRY', currency),
      category: etx.type === 'payment' ? 'Maaş' : 'Avans',
      kind: etx.account,
      accountId,
      direction: 'out',
      amount: converters.amountToAccount(etx.amount, etx.currency, accountId),
      currency,
      source: { kind: 'personel', id: etx.id },
      unassigned: !etx.bankAccountId,
    });
  });

  accountTransactions.forEach((tx) => {
    const acc = byId.get(tx.accountId);
    if (!acc) return;
    const other = tx.targetAccountId ? byId.get(tx.targetAccountId) : undefined;
    const incoming = tx.type === 'giris' || tx.type === 'transfer_in';
    const title = tx.type === 'giris'
      ? 'Para girişi'
      : tx.type === 'cikis'
        ? 'Para çıkışı'
        : tx.type === 'transfer_out'
          ? `Transfer → ${accountDisplayName(other)}`
          : `Transfer ← ${accountDisplayName(other)}`;
    list.push({
      id: `hesap-${tx.id}`,
      date: tx.date,
      createdAt: tx.createdAt,
      title,
      description: tx.description || '',
      category: tx.type === 'giris' || tx.type === 'cikis' ? 'Manuel' : 'Transfer',
      kind: KIND_OF_TYPE[acc.type],
      accountId: tx.accountId,
      direction: incoming ? 'in' : 'out',
      amount: Number(tx.amount) || 0,
      currency: acc.currency,
      source: { kind: 'hesap', id: tx.id, txType: tx.type },
      unassigned: false,
    });
  });

  return list.sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')) || b.id.localeCompare(a.id));
}

/**
 * Hesabı belirsiz kayıtlar: o türde birden fazla (arşivlenmemiş) hesap varsa ve kayıt hesap
 * seçilmeden yazılmışsa. Tek hesap varken belirsizlik yoktur.
 */
export function unassignedMovements(movements: CashMovement[], accounts: BankAccount[]): CashMovement[] {
  const counts: Record<CashKind, number> = { cash: 0, bank: 0, pos: 0 };
  accounts.forEach((a) => { if (!a.archived) counts[KIND_OF_TYPE[a.type]] += 1; });
  return movements.filter((m) => m.unassigned && m.source.kind !== 'hesap' && counts[m.kind] > 1);
}

/** Sayfa başlığındaki kısa ifade: "Bugün", "Dün", "3 gün önce", "12.10.2026" */
export function relativeDay(date: string | undefined, today: string): string {
  if (!date) return '—';
  if (date === today) return 'Bugün';
  const d = new Date(`${date}T00:00:00`);
  const t = new Date(`${today}T00:00:00`);
  const diff = Math.round((t.getTime() - d.getTime()) / 86_400_000);
  if (diff === 1) return 'Dün';
  if (diff > 1 && diff < 7) return `${diff} gün önce`;
  return d.toLocaleDateString('tr-TR');
}
