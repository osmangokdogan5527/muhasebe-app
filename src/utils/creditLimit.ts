/**
 * Veresiye (açık hesap) limiti hesabı.
 *
 * Cari bakiyesi: pozitif = müşteri bize borçlu. Limit carinin para birimindedir;
 * 0 ya da tanımsız limit "sınırsız" demektir.
 */
import type { Cari } from '../types';
import { logError } from './errorLogger';

export interface CreditCheck {
  /** Satış öncesi bakiye (müşterinin borcu pozitif) */
  balanceBefore: number;
  /** Satıştan sonra oluşacak bakiye */
  balanceAfter: number;
  /** Tanımlı limit; sınırsızsa null */
  limit: number | null;
  /** Limit aşılıyor mu */
  exceeded: boolean;
  /** Limit aşılıyorsa aşan tutar */
  overBy: number;
  /** Kalan veresiye hakkı (satış öncesi); sınırsızsa null */
  remainingBefore: number | null;
}

function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

export function creditLimitOf(cari: Pick<Cari, 'creditLimit'> | null | undefined): number | null {
  const limit = Number(cari?.creditLimit);
  return Number.isFinite(limit) && limit > 0 ? limit : null;
}

/** Cariye `openAmount` kadar veresiye yazılırsa limit durumu */
export function checkCreditLimit(cari: Pick<Cari, 'balance' | 'creditLimit'> | null | undefined, openAmount: number): CreditCheck {
  try {
    const balanceBefore = round2(Number(cari?.balance) || 0);
    const balanceAfter = round2(balanceBefore + Math.max(0, Number(openAmount) || 0));
    const limit = creditLimitOf(cari);
    const exceeded = limit !== null && openAmount > 0 && balanceAfter > limit + 0.005;
    return {
      balanceBefore,
      balanceAfter,
      limit,
      exceeded,
      overBy: exceeded && limit !== null ? round2(balanceAfter - limit) : 0,
      remainingBefore: limit !== null ? round2(limit - balanceBefore) : null,
    };
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'creditLimit.checkCreditLimit');
    return { balanceBefore: 0, balanceAfter: 0, limit: null, exceeded: false, overBy: 0, remainingBefore: null };
  }
}

/**
 * Veresiye limiti aşılıyorsa kullanıcıya sorar (PIN istenmez).
 * Limit yoksa ya da aşılmıyorsa hemen true döner.
 */
export async function confirmCreditLimit(cari: (Pick<Cari, 'balance' | 'creditLimit' | 'name'> & { currency?: string }) | null | undefined, openAmount: number): Promise<boolean> {
  try {
    if (!cari || !(openAmount > 0)) return true;
    const check = checkCreditLimit(cari, openAmount);
    if (!check.exceeded || check.limit === null) return true;
    const currency = cari.currency || 'TRY';
    const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(v);
    const { confirmDialog } = await import('./dialogs');
    return await confirmDialog({
      title: 'Veresiye limiti aşılıyor',
      message: `${cari.name} için veresiye limiti ${fmt(check.limit)}. Bu satışla borç ${fmt(check.balanceAfter)} olacak (${fmt(check.overBy)} fazla). Yine de devam edilsin mi?`,
      confirmText: 'Yine de Veresiye Yaz',
      cancelText: 'Vazgeç',
    });
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'creditLimit.confirmCreditLimit');
    return false;
  }
}
