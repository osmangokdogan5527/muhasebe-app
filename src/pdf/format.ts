/**
 * PDF belgeleri için biçimlendirme yardımcıları: para, tarih, miktar ve yazıyla tutar.
 */

export type DocumentCurrency = 'TRY' | 'USD' | 'EUR';

const CURRENCY_SYMBOL: Record<DocumentCurrency, string> = { TRY: '₺', USD: '$', EUR: '€' };

export function normalizeCurrency(value: unknown): DocumentCurrency {
  return value === 'USD' || value === 'EUR' ? value : 'TRY';
}

/** 1234.5 -> "1.234,50 ₺" (sembol sonda; Türkçe fatura alışkanlığı) */
export function formatMoney(value: number, currency: DocumentCurrency = 'TRY'): string {
  const amount = Number.isFinite(value) ? value : 0;
  const formatted = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  return `${formatted} ${CURRENCY_SYMBOL[currency]}`;
}

/**
 * Cari bakiyesi: pozitif = cari borçlu ("Borç"), negatif = biz borçluyuz ("Alacak").
 * 1250 -> "1.250,00 ₺ Borç", -300 -> "300,00 ₺ Alacak", 0 -> "0,00 ₺"
 */
export function formatBalance(value: number, currency: DocumentCurrency = 'TRY'): string {
  const amount = Number.isFinite(value) ? value : 0;
  if (Math.abs(amount) < 0.005) return formatMoney(0, currency);
  return `${formatMoney(Math.abs(amount), currency)} ${amount > 0 ? 'Borç' : 'Alacak'}`;
}

/** Bakiyeye etki: +500 -> "+ 500,00 ₺", -500 -> "− 500,00 ₺" */
export function formatSignedMoney(value: number, currency: DocumentCurrency = 'TRY'): string {
  const amount = Number.isFinite(value) ? value : 0;
  if (Math.abs(amount) < 0.005) return formatMoney(0, currency);
  return `${amount > 0 ? '+' : '−'} ${formatMoney(Math.abs(amount), currency)}`;
}

/** Sayı (para birimi olmadan): 1234.5 -> "1.234,50" */
export function formatNumber(value: number, fractionDigits = 2): string {
  const amount = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(amount);
}

/** Miktar: tam sayıysa küsuratsız, değilse en fazla 3 basamak: 2 -> "2", 1.25 -> "1,25" */
export function formatQuantity(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 }).format(amount);
}

/** "2026-10-31" -> "31.10.2026" (geçersizse olduğu gibi) */
export function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : isoDate;
}

/** Dosya adında kullanılamayan karakterleri temizler: "Yılmaz Tic. / 2026" -> "Yilmaz_Tic_2026" */
export function safeFileName(value: string): string {
  const map: Record<string, string> = { ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', İ: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U' };
  const ascii = (value || '').replace(/[çÇğĞıİöÖşŞüÜ]/g, (ch) => map[ch] || ch);
  return ascii.replace(/[^A-Za-z0-9-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'belge';
}

const ONES = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
const TENS = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
const SCALES = ['', 'bin', 'milyon', 'milyar', 'trilyon'];

function threeDigitsToWords(n: number): string[] {
  const words: string[] = [];
  const hundreds = Math.floor(n / 100);
  const tens = Math.floor((n % 100) / 10);
  const ones = n % 10;
  if (hundreds > 0) {
    if (hundreds > 1) words.push(ONES[hundreds]);
    words.push('yüz');
  }
  if (tens > 0) words.push(TENS[tens]);
  if (ones > 0) words.push(ONES[ones]);
  return words;
}

/** Tam sayıyı Türkçe yazıya çevirir: 1234 -> "bin iki yüz otuz dört" */
export function integerToTurkishWords(value: number): string {
  let n = Math.floor(Math.abs(value));
  if (n === 0) return 'sıfır';
  const groups: string[] = [];
  let scale = 0;
  while (n > 0 && scale < SCALES.length) {
    const chunk = n % 1000;
    if (chunk > 0) {
      // "bir bin" denmez, yalnızca "bin"
      const chunkWords = scale === 1 && chunk === 1 ? [] : threeDigitsToWords(chunk);
      if (SCALES[scale]) chunkWords.push(SCALES[scale]);
      groups.unshift(chunkWords.join(' '));
    }
    n = Math.floor(n / 1000);
    scale += 1;
  }
  return groups.join(' ');
}

const CURRENCY_WORDS: Record<DocumentCurrency, { main: string; sub: string }> = {
  TRY: { main: 'Türk lirası', sub: 'kuruş' },
  USD: { main: 'ABD doları', sub: 'sent' },
  EUR: { main: 'avro', sub: 'sent' },
};

/** 1234.5 -> "Yalnız: Bin iki yüz otuz dört Türk lirası elli kuruş" */
export function amountToTurkishWords(value: number, currency: DocumentCurrency = 'TRY'): string {
  const safe = Number.isFinite(value) ? Math.abs(value) : 0;
  const cents = Math.round(safe * 100);
  const main = Math.floor(cents / 100);
  const sub = cents % 100;
  const names = CURRENCY_WORDS[currency];
  let sentence = `${integerToTurkishWords(main)} ${names.main}`;
  if (sub > 0) sentence += ` ${integerToTurkishWords(sub)} ${names.sub}`;
  return `Yalnız: ${sentence.charAt(0).toLocaleUpperCase('tr-TR')}${sentence.slice(1)}`;
}
