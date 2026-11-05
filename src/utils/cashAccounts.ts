/**
 * Kasa / Banka / POS hesapları için ortak yardımcılar: tür eşlemesi, görünen ad, banka rengi,
 * IBAN biçimi ve varsayılan (★) hesap seçimi.
 */
import { BankAccount } from '../types';
import { logError } from './errorLogger';

export type CashKind = 'cash' | 'bank' | 'pos';
export type AccountType = BankAccount['type'];

export const KIND_OF_TYPE: Record<AccountType, CashKind> = { kasa: 'cash', banka: 'bank', pos: 'pos' };
export const TYPE_OF_KIND: Record<CashKind, AccountType> = { cash: 'kasa', bank: 'banka', pos: 'pos' };
export const TYPE_LABEL: Record<AccountType, string> = { kasa: 'Kasa', banka: 'Banka', pos: 'POS' };

/** Sistemin oluşturduğu merkez hesaplar (silinemez; varsayılan seçilmemişse yeni kayıtlar buraya yazılır) */
export const CENTRAL_ACCOUNT_ID: Record<CashKind, string> = { cash: 'merkez_kasa', bank: 'merkez_banka', pos: 'merkez_pos' };

export function isCentralAccount(id: string): boolean {
  return id === 'merkez_kasa' || id === 'merkez_banka' || id === 'merkez_pos';
}

/** Türkiye'deki yaygın bankalar: listede seçim ve renk rozeti için */
export const KNOWN_BANKS: { name: string; short: string; color: string; match: RegExp }[] = [
  { name: 'Ziraat Bankası', short: 'ZB', color: '#e30a17', match: /ziraat/i },
  { name: 'Türkiye İş Bankası', short: 'İŞ', color: '#0b4ea2', match: /(^|\s)i[şs]\s?bank|türkiye i[şs]/i },
  { name: 'Garanti BBVA', short: 'GB', color: '#00a650', match: /garanti/i },
  { name: 'Akbank', short: 'AK', color: '#dc0005', match: /akbank/i },
  { name: 'Yapı Kredi', short: 'YK', color: '#004a93', match: /yap[ıi]\s?kredi/i },
  { name: 'Halkbank', short: 'HB', color: '#0067ac', match: /halk/i },
  { name: 'VakıfBank', short: 'VB', color: '#c99700', match: /vak[ıi]f/i },
  { name: 'QNB', short: 'QN', color: '#5c2d91', match: /qnb|finans/i },
  { name: 'DenizBank', short: 'DB', color: '#005eb8', match: /deniz/i },
  { name: 'TEB', short: 'TE', color: '#00843d', match: /\bteb\b|ekonomi/i },
  { name: 'Kuveyt Türk', short: 'KT', color: '#00824a', match: /kuveyt/i },
  { name: 'Enpara', short: 'EN', color: '#6c2c91', match: /enpara/i },
  { name: 'ING', short: 'IN', color: '#ff6200', match: /\bing\b/i },
  { name: 'Şekerbank', short: 'ŞB', color: '#009a44', match: /[şs]eker/i },
  { name: 'Albaraka', short: 'AB', color: '#008c45', match: /albaraka/i },
  { name: 'Papara', short: 'PP', color: '#1a1a1a', match: /papara/i },
];

const KIND_COLOR: Record<AccountType, string> = { kasa: '#f59e0b', banka: '#2563eb', pos: '#8b5cf6' };

/** Hesabın rozeti: bilinen bankada banka rengi ve kısaltması, değilse türün rengi ve baş harfi */
export function accountBadge(acc: Pick<BankAccount, 'type' | 'name' | 'bankName'>): { text: string; color: string } {
  try {
    const source = `${acc.bankName || ''} ${acc.type !== 'kasa' ? acc.name : ''}`;
    const known = KNOWN_BANKS.find((b) => b.match.test(source));
    if (known && acc.type !== 'kasa') return { text: known.short, color: known.color };
    const base = (acc.bankName || acc.name || TYPE_LABEL[acc.type]).trim();
    const initials = base.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toLocaleUpperCase('tr-TR');
    return { text: initials || TYPE_LABEL[acc.type][0], color: KIND_COLOR[acc.type] };
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'cashAccounts.accountBadge');
    return { text: '?', color: KIND_COLOR[acc.type] || '#64748b' };
  }
}

/** "Ziraat – Ticari" (banka adı varsa başına eklenir; merkez hesaplar olduğu gibi) */
export function accountDisplayName(acc: Pick<BankAccount, 'name' | 'bankName'> | null | undefined): string {
  if (!acc) return 'Bilinmeyen hesap';
  const name = (acc.name || '').trim();
  const bank = (acc.bankName || '').trim();
  if (!bank) return name || 'Hesap';
  const shortBank = bank.replace(/\s*(bankası|bank|bbva)\s*$/i, '').trim() || bank;
  if (!name || name.toLocaleLowerCase('tr-TR') === bank.toLocaleLowerCase('tr-TR')) return bank;
  if (name.toLocaleLowerCase('tr-TR').includes(shortBank.toLocaleLowerCase('tr-TR'))) return name;
  return `${shortBank} – ${name}`;
}

export function normalizeIban(value: string): string {
  return (value || '').replace(/\s+/g, '').toUpperCase();
}

export function formatIban(value: string): string {
  return normalizeIban(value).replace(/(.{4})/g, '$1 ').trim();
}

export function ibanLast4(value: string | undefined): string {
  const iban = normalizeIban(value || '');
  return iban.length >= 4 ? iban.slice(-4) : '';
}

/** TR IBAN doğrulaması (boş ise geçerli sayılır: alan isteğe bağlı) */
export function isValidIbanOrEmpty(value: string): boolean {
  const iban = normalizeIban(value);
  if (!iban) return true;
  if (!/^TR\d{24}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
  let remainder = 0;
  for (const ch of numeric) remainder = (remainder * 10 + Number(ch)) % 97;
  return remainder === 1;
}

/** Türün varsayılan (★) hesabı: işaretli olan, yoksa merkez hesap */
export function primaryAccountId(accounts: BankAccount[], kind: CashKind): string {
  const type = TYPE_OF_KIND[kind];
  const marked = accounts.find((a) => a.type === type && a.isPrimary && !a.archived);
  return marked ? marked.id : CENTRAL_ACCOUNT_ID[kind];
}

export function primaryAccountMap(accounts: BankAccount[]): Record<CashKind, string> {
  return { cash: primaryAccountId(accounts, 'cash'), bank: primaryAccountId(accounts, 'bank'), pos: primaryAccountId(accounts, 'pos') };
}

export function isPrimaryAccount(accounts: BankAccount[], acc: BankAccount): boolean {
  return primaryAccountId(accounts, KIND_OF_TYPE[acc.type]) === acc.id;
}

/** Seçim listelerinde gösterilecek hesaplar (arşivdekiler hariç, varsayılan önce) */
export function selectableAccounts(accounts: BankAccount[], type?: AccountType): BankAccount[] {
  return accounts
    .filter((a) => !a.archived && (!type || a.type === type))
    .sort((a, b) => Number(isPrimaryAccount(accounts, b)) - Number(isPrimaryAccount(accounts, a)) || accountDisplayName(a).localeCompare(accountDisplayName(b), 'tr'));
}

/** Para tutarını iki haneye yuvarlar */
export const roundMoney = (value: number) => Math.round((Number(value) || 0) * 100) / 100;
