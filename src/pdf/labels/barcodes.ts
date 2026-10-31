/**
 * Barkod ve QR kodu "çizim verisine" çevirir: PDF'te ve önizlemede dikdörtgenlerle (vektör)
 * çizilir; böylece termal etiket yazıcılarında da keskin basılır.
 */
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { logError } from '../../utils/errorLogger';

export interface EncodedBarcode {
  /** '1' = siyah çubuk, '0' = boşluk; her karakter bir modül genişliği */
  modules: string;
  format: 'EAN13' | 'EAN8' | 'CODE128';
  text: string;
}

function encodeWith(text: string, format: EncodedBarcode['format']): EncodedBarcode | null {
  const target: { encodings?: { data: string }[] } = {};
  try {
    JsBarcode(target as any, text, { format, displayValue: false, margin: 0 });
  } catch {
    return null;
  }
  const modules = (target.encodings || []).map((e) => e.data).join('');
  return modules ? { modules, format, text } : null;
}

/**
 * Barkod: 13 haneli geçerli numara EAN-13, 8 haneli EAN-8, aksi halde CODE128.
 * Kontrol hanesi hatalı EAN numaraları da CODE128 ile basılır (ürün etiketsiz kalmaz).
 */
export function encodeBarcode(raw: string): EncodedBarcode | null {
  const text = (raw || '').trim();
  if (!text) return null;
  try {
    if (/^\d{13}$/.test(text)) {
      const ean = encodeWith(text, 'EAN13');
      if (ean) return ean;
    }
    if (/^\d{8}$/.test(text)) {
      const ean8 = encodeWith(text, 'EAN8');
      if (ean8) return ean8;
    }
    // CODE128 Türkçe karakterleri kodlayamaz; ASCII karşılığına çevrilir
    const ascii = text
      .replace(/[çÇ]/g, (c) => (c === 'ç' ? 'c' : 'C'))
      .replace(/[ğĞ]/g, (c) => (c === 'ğ' ? 'g' : 'G'))
      .replace(/[ıİ]/g, (c) => (c === 'ı' ? 'i' : 'I'))
      .replace(/[öÖ]/g, (c) => (c === 'ö' ? 'o' : 'O'))
      .replace(/[şŞ]/g, (c) => (c === 'ş' ? 's' : 'S'))
      .replace(/[üÜ]/g, (c) => (c === 'ü' ? 'u' : 'U'))
      .replace(/[^\x20-\x7E]/g, '');
    return ascii ? encodeWith(ascii, 'CODE128') : null;
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'barcodes.encodeBarcode');
    return null;
  }
}

export interface EncodedQr {
  size: number;
  /** Satır satır: true = siyah modül */
  isDark: (row: number, col: number) => boolean;
}

export function encodeQr(text: string): EncodedQr | null {
  const value = (text || '').trim();
  if (!value) return null;
  try {
    const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
    const { size } = qr.modules;
    return { size, isDark: (row, col) => !!qr.modules.get(row, col) };
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'barcodes.encodeQr');
    return null;
  }
}

/** Ardışık siyah modülleri tek çubukta birleştirir: [başlangıç, genişlik] (modül cinsinden). */
export function barcodeRuns(modules: string): [number, number][] {
  const runs: [number, number][] = [];
  let start = -1;
  for (let i = 0; i <= modules.length; i += 1) {
    const dark = modules[i] === '1';
    if (dark && start < 0) start = i;
    if (!dark && start >= 0) {
      runs.push([start, i - start]);
      start = -1;
    }
  }
  return runs;
}
