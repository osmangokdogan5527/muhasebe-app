/**
 * Storm Ön Muhasebe - Tarih Yardımcıları
 *
 * Tüm iş tarihleri (fatura, çek, masraf, kasa) kullanıcının yerel saatine göre
 * YYYY-MM-DD biçiminde tutulur. toISOString() UTC döndürdüğü için Türkiye'de
 * (UTC+3) gece 00:00-03:00 arasında bir önceki günü verir; bu yüzden tarih
 * üretirken her zaman bu yardımcılar kullanılmalıdır.
 */

/**
 * Formats a Date object as YYYY-MM-DD string in local time.
 */
export function formatDateISO(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD (local time).
 */
export function getTodayISO(): string {
  return formatDateISO(new Date());
}

/**
 * Parses a YYYY-MM-DD string as a local-time date (new Date('YYYY-MM-DD') parses as UTC).
 * Returns an invalid Date for malformed input.
 */
export function parseDateISO(dateStr: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr || '');
  if (!match) return new Date(NaN);
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Returns the local date `days` days from today (or from `fromDateStr`) as YYYY-MM-DD.
 */
export function addDaysISO(days: number, fromDateStr?: string): string {
  const base = fromDateStr ? parseDateISO(fromDateStr) : new Date();
  const date = isNaN(base.getTime()) ? new Date() : base;
  date.setDate(date.getDate() + days);
  return formatDateISO(date);
}
