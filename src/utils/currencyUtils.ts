import { Transaction } from '../types';
import { TCMBRatesResult, calculateExchangeRate } from './tcmbService';

/**
 * Tutarı kurlar üzerinden (TRY ara birimi ile) başka bir para birimine çevirir.
 */
export function convertWithRates(amount: number, fromCurrency: string, toCurrency: string, rates: TCMBRatesResult): number {
  const from = fromCurrency || 'TRY';
  const to = toCurrency || 'TRY';
  if (from === to) return amount;
  return amount * calculateExchangeRate(rates, from, to);
}

/**
 * Bir cari işleminin (veya onun bir kısmının) tutarını hedef para birimine çevirir.
 *
 * Kullanıcının işlemde girdiği kurla hesaplanan convertedAmount carinin para
 * birimindedir; hedef para birimi carininkiyle aynıysa bu tutar esas alınır.
 * Aksi halde güncel/önbellekteki kurlar kullanılır. exchangeRate alanı tek başına
 * kullanılmaz, çünkü yönü (hangi birimin hangisine oranı) işlem türüne göre değişir.
 *
 * @param amount İşlem para birimindeki tutar (genelde islem.amount ya da onun bir kısmı)
 */
export function convertTransactionAmount(
  islem: Pick<Transaction, 'amount' | 'currency' | 'convertedAmount'>,
  amount: number,
  toCurrency: string,
  cariCurrency: string | undefined,
  rates: TCMBRatesResult
): number {
  const txCurrency = islem.currency || 'TRY';
  if (txCurrency === toCurrency) return amount;
  if (cariCurrency && cariCurrency === toCurrency && cariCurrency !== txCurrency && islem.convertedAmount && islem.amount) {
    return amount * (islem.convertedAmount / islem.amount);
  }
  return convertWithRates(amount, txCurrency, toCurrency, rates);
}
