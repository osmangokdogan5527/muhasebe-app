/**
 * Belge biçimi seçimi: termal fiş (80 / 58 mm) ya da sayfa (A4 / A5).
 * Satışlarda dördü de, diğer belgelerde (makbuz, alış faturası, ekstre) A4 / A5 seçilebilir.
 */
import type { PaperSize } from '../../pdf/layout';
import type { ReceiptWidth } from '../../pdf/branding';

export type DocumentFormat = 'receipt80' | 'receipt58' | 'a4' | 'a5';

export const SALE_FORMAT_OPTIONS: { value: DocumentFormat; label: string }[] = [
  { value: 'receipt80', label: 'Fiş 80 mm' },
  { value: 'receipt58', label: 'Fiş 58 mm' },
  { value: 'a4', label: 'Fatura A4' },
  { value: 'a5', label: 'Fatura A5' },
];

export function isReceiptFormat(format: DocumentFormat): format is 'receipt80' | 'receipt58' {
  return format === 'receipt80' || format === 'receipt58';
}

export function receiptWidthOf(format: DocumentFormat): ReceiptWidth {
  return format === 'receipt58' ? 58 : 80;
}

export function receiptFormatFor(width: ReceiptWidth): DocumentFormat {
  return width === 58 ? 'receipt58' : 'receipt80';
}

export function paperOf(format: DocumentFormat): PaperSize {
  return format === 'a5' ? 'a5' : 'a4';
}
