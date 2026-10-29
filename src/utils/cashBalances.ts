/**
 * Storm Ön Muhasebe - Kasa / Banka / POS Bakiye Hesabı
 *
 * Kasa ekranı ve AI asistan aynı hesabı kullanır. Bakiye = açılış bakiyesi
 * + manuel giriş/çıkış ve transferler + hesaba bağlı fatura/tahsilat/ödemeler
 * - masraflar - maaş/avans ödemeleri. Tutarlar hesabın para birimine çevrilir.
 */
import { AccountTransaction, BankAccount, Cari, EmployeeTransaction, Expense, Transaction } from '../types';
import { TCMBRatesResult } from './tcmbService';
import { convertTransactionAmount, convertWithRates } from './currencyUtils';
import { getSyncedEmployeeExpenseIds } from './expenseUtils';

export interface CashCurrencyConverters {
  getAccountCurrency: (accountId: string) => string;
  islemToAccount: (islem: Transaction, accountId: string) => number;
  amountToAccount: (amount: number, fromCurrency: string | undefined, accountId: string) => number;
}

export function createCashCurrencyConverters(bankAccounts: BankAccount[], cariler: Cari[], fxRates: TCMBRatesResult): CashCurrencyConverters {
  const accountCurrency = new Map<string, string>();
  bankAccounts.forEach(acc => accountCurrency.set(acc.id, acc.currency || 'TRY'));
  const cariCurrency = new Map<string, string>();
  cariler.forEach(c => cariCurrency.set(c.id, c.currency || 'TRY'));
  const getAccountCurrency = (accountId: string) => accountCurrency.get(accountId) || 'TRY';
  const islemToAccount = (islem: Transaction, accountId: string) =>
    convertTransactionAmount(islem, islem.amount, getAccountCurrency(accountId), cariCurrency.get(islem.cariId), fxRates);
  const amountToAccount = (amount: number, fromCurrency: string | undefined, accountId: string) =>
    convertWithRates(amount, fromCurrency || 'TRY', getAccountCurrency(accountId), fxRates);
  return { getAccountCurrency, islemToAccount, amountToAccount };
}

// Hesap kimliği belirtilmemiş eski kayıtlar varsayılan merkez hesaplara yazılır
export function resolveCashAccountId(explicitId: string | undefined, account: string | undefined): string {
  if (explicitId) return explicitId;
  if (account === 'cash') return 'merkez_kasa';
  if (account === 'bank') return 'merkez_banka';
  if (account === 'pos') return 'merkez_pos';
  return '';
}

export function computeAccountBalances(params: {
  bankAccounts: BankAccount[];
  accountTransactions: AccountTransaction[];
  islemler: Transaction[];
  expenses: Expense[];
  employeeTransactions: EmployeeTransaction[];
  converters: CashCurrencyConverters;
}): Record<string, number> {
  const { bankAccounts, accountTransactions, islemler, expenses, employeeTransactions, converters } = params;
  const map: Record<string, number> = {};
  // Initialize with initial balances
  bankAccounts.forEach(acc => {
    map[acc.id] = acc.initialBalance || 0;
  });
  // 1. Manual transactions & transfers
  accountTransactions.forEach(tx => {
    if (map[tx.accountId] !== undefined) {
      if (tx.type === 'giris' || tx.type === 'transfer_in') {
        map[tx.accountId] += tx.amount;
      } else if (tx.type === 'cikis' || tx.type === 'transfer_out') {
        map[tx.accountId] -= tx.amount;
      }
    }
  });
  // 2. Commercial / Invoice transactions (islemler)
  islemler.forEach(islem => {
    const targetId = resolveCashAccountId(islem.bankAccountId, islem.account);
    if (map[targetId] !== undefined) {
      const amountInAccount = converters.islemToAccount(islem, targetId);
      if (islem.type === 'collection' || islem.type === 'sale' || islem.type === 'purchase_return') {
        map[targetId] += amountInAccount;
      } else if (islem.type === 'payment' || islem.type === 'purchase' || islem.type === 'sale_return') {
        map[targetId] -= amountInAccount;
      }
    }
  });
  // 3. Expenses (maaş/avans ödemesinden otomatik oluşan masraflar 4. adımda sayılıyor)
  const syncedExpenseIds = getSyncedEmployeeExpenseIds(employeeTransactions);
  expenses.forEach(exp => {
    if (syncedExpenseIds.has(exp.id)) return;
    const targetId = resolveCashAccountId(exp.bankAccountId, exp.account);
    if (map[targetId] !== undefined) {
      map[targetId] -= converters.amountToAccount(exp.amount, exp.currency, targetId);
    }
  });
  // 4. Employee Transactions
  employeeTransactions.forEach(etx => {
    if (etx.type === 'payment' || etx.type === 'advance') {
      const targetId = resolveCashAccountId(etx.bankAccountId, etx.account);
      if (map[targetId] !== undefined) {
        map[targetId] -= converters.amountToAccount(etx.amount, etx.currency, targetId);
      }
    }
  });
  return map;
}
