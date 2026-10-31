/**
 * Etiket yerleşim motoru: bir ürün etiketinin üzerindeki öğeleri (yazılar, barkod, QR) milimetre
 * cinsinden hesaplar. Aynı sonuç hem PDF'e hem ekrandaki canlı önizlemeye çizilir; böylece
 * ekranda görülen etiket ile basılan etiket aynıdır.
 */
import { Stock } from '../../types';
import { formatMoney, formatNumber } from '../format';
import { LabelSettings } from './labelSettings';
import { EncodedBarcode, EncodedQr, barcodeRuns, encodeBarcode, encodeQr } from './barcodes';
import { grossSalesPrice, netSalesPrice } from '../../utils/stockPricing';

export type TextWeight = 'normal' | 'semibold' | 'bold';

/** Yazı genişliğini mm cinsinden ölçer (PDF'te jsPDF, önizlemede canvas ile). */
export type MeasureText = (text: string, sizePt: number, weight: TextWeight) => number;

export type LabelElement =
  | { kind: 'text'; x: number; y: number; text: string; sizePt: number; weight: TextWeight; align: 'left' | 'center' | 'right' }
  | { kind: 'barcode'; x: number; y: number; w: number; h: number; runs: [number, number][]; moduleCount: number }
  | { kind: 'qr'; x: number; y: number; size: number; qr: EncodedQr }
  | { kind: 'border'; x: number; y: number; w: number; h: number };

export interface LabelProduct {
  name: string;
  code: string;
  unit: string;
  price: number;
  barcode: string;
}

export function productFromStock(stock: Stock, settings: LabelSettings): LabelProduct {
  // Etikette kasadaki (KDV dahil) fiyat ya da faturadaki (KDV hariç) fiyat gösterilir;
  // stok kartındaki "KDV dahil / hariç" seçimine göre doğru değer stockPricing'den gelir
  const price = settings.priceMode === 'withoutTax' ? netSalesPrice(stock) : grossSalesPrice(stock);
  return {
    name: stock.name || '',
    code: stock.code || '',
    unit: stock.unit || '',
    price,
    barcode: (stock.barcode || stock.code || '').trim(),
  };
}

function qrText(product: LabelProduct, settings: LabelSettings, firmName: string): string {
  if (settings.qrContent === 'custom') return settings.qrCustomText.trim() || product.barcode || product.code;
  if (settings.qrContent === 'info') {
    return [firmName, product.name, product.code && `Kod: ${product.code}`, `Fiyat: ${formatNumber(product.price)} TL`].filter(Boolean).join('\n');
  }
  return product.barcode || product.code || product.name;
}

const PT_TO_MM = 0.3528;
const lineHeight = (sizePt: number) => sizePt * PT_TO_MM * 1.18;

function truncate(text: string, maxWidth: number, sizePt: number, weight: TextWeight, measure: MeasureText): string {
  if (measure(text, sizePt, weight) <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (measure(`${text.slice(0, mid).trimEnd()}…`, sizePt, weight) <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return lo > 0 ? `${text.slice(0, lo).trimEnd()}…` : '';
}

/** Metni en fazla maxLines satıra böler; sığmayan son satır "…" ile kısaltılır. */
function wrap(text: string, maxWidth: number, sizePt: number, weight: TextWeight, maxLines: number, measure: MeasureText): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (let i = 0; i < words.length; i += 1) {
    const candidate = current ? `${current} ${words[i]}` : words[i];
    if (measure(candidate, sizePt, weight) <= maxWidth || !current) {
      current = candidate;
    } else if (lines.length + 1 >= maxLines) {
      // Son satır: kalan kelimeler eklenir, sığmayan kısım "…" ile kısaltılır
      current = `${current} ${words.slice(i).join(' ')}`;
      break;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines).map((line) => truncate(line, maxWidth, sizePt, weight, measure));
}

interface TextBlock {
  key: 'firm' | 'name' | 'meta' | 'price';
  lines: string[];
  sizePt: number;
  weight: TextWeight;
  gapAfter: number;
}

const FONT_SCALE = { small: 0.86, normal: 1, large: 1.16 };

/**
 * Tek etiketin öğelerini (0,0 sol üst köşe) hesaplar.
 * barcode/qr önceden kodlanmış verilebilir (çok kopyada tekrar hesaplanmasın diye).
 */
export function computeLabelLayout(
  product: LabelProduct,
  settings: LabelSettings,
  firmName: string,
  measure: MeasureText,
  pre?: { barcode?: EncodedBarcode | null; qr?: EncodedQr | null },
): LabelElement[] {
  const W = settings.widthMm;
  const H = settings.heightMm;
  const pad = Math.min(3, Math.max(1.2, Math.min(W, H) * 0.07));
  const x0 = pad;
  const y0 = pad;
  const iw = W - pad * 2;
  const ih = H - pad * 2;
  const elements: LabelElement[] = [];
  if (settings.showBorder) elements.push({ kind: 'border', x: 0.3, y: 0.3, w: W - 0.6, h: H - 0.6 });

  // Barkod (altta, tam genişlik)
  const barcode = settings.showBarcode ? (pre && 'barcode' in pre ? pre.barcode : encodeBarcode(product.barcode)) : null;
  let bottom = y0 + ih;
  if (barcode) {
    const textSize = Math.max(4.5, 5.6 * Math.min(W / 50, H / 30) * FONT_SCALE[settings.fontScale]);
    const textH = settings.showBarcodeText ? lineHeight(textSize) : 0;
    const barH = Math.min(18, Math.max(4.5, ih * 0.3));
    const barY = bottom - textH - barH;
    // Okuyucular için her iki yanda boşluk (sessiz bölge) bırakılır; çubuklar çok kalınlaşmasın diye
    // modül genişliği en fazla 0,55 mm olur ve barkod ortalanır
    const moduleCount = barcode.modules.length;
    const moduleWidth = Math.min(0.55, iw / (moduleCount + 8));
    const barW = moduleWidth * moduleCount;
    elements.push({ kind: 'barcode', x: x0 + (iw - barW) / 2, y: barY, w: barW, h: barH, runs: barcodeRuns(barcode.modules), moduleCount });
    if (settings.showBarcodeText) {
      elements.push({ kind: 'text', x: x0 + iw / 2, y: bottom - textH * 0.18, text: barcode.text, sizePt: textSize, weight: 'normal', align: 'center' });
    }
    bottom = barY - Math.max(0.8, ih * 0.04);
  }

  // QR (sağ üst)
  let textRight = x0 + iw;
  if (settings.showQr) {
    const qr = pre && 'qr' in pre ? pre.qr : encodeQr(qrText(product, settings, firmName));
    const size = Math.min(bottom - y0, iw * (settings.showName || settings.showPrice ? 0.42 : 1));
    if (qr && size >= 6) {
      const qx = settings.showName || settings.showPrice || settings.showCode || settings.showFirmName ? x0 + iw - size : x0 + (iw - size) / 2;
      elements.push({ kind: 'qr', x: qx, y: y0, size, qr });
      textRight = qx - Math.max(1, iw * 0.04);
    }
  }

  // Yazılar: sığana kadar küçültülür
  const columnWidth = textRight - x0;
  const columnHeight = bottom - y0;
  if (columnWidth < 5 || columnHeight < 2) return elements;
  const align: 'left' | 'center' = textRight < x0 + iw - 0.01 ? 'left' : 'center';
  const ax = align === 'left' ? x0 : x0 + columnWidth / 2;
  const meta = [settings.showCode ? product.code : '', settings.showUnit ? product.unit : ''].filter(Boolean).join('  ·  ');
  const priceText = formatMoney(product.price);

  let scale = Math.min(2.2, Math.max(0.55, Math.min(W / 50, H / 30))) * FONT_SCALE[settings.fontScale];
  let nameLines = 2;
  let dropFirm = false;
  let dropMeta = false;
  for (let attempt = 0; attempt < 14; attempt += 1) {
    const blocks: TextBlock[] = [];
    const size = (base: number) => Math.max(4.5, base * scale);
    if (settings.showFirmName && firmName && !dropFirm) {
      blocks.push({ key: 'firm', lines: [truncate(firmName, columnWidth, size(5.2), 'semibold', measure)], sizePt: size(5.2), weight: 'semibold', gapAfter: 0.4 });
    }
    if (settings.showName && product.name) {
      blocks.push({ key: 'name', lines: wrap(product.name, columnWidth, size(7.8), 'bold', nameLines, measure), sizePt: size(7.8), weight: 'bold', gapAfter: 0.5 });
    }
    if (meta && !dropMeta) {
      blocks.push({ key: 'meta', lines: [truncate(meta, columnWidth, size(5.6), 'normal', measure)], sizePt: size(5.6), weight: 'normal', gapAfter: 0.6 });
    }
    if (settings.showPrice) {
      const priceSize = size(13);
      const fitted = measure(priceText, priceSize, 'bold') <= columnWidth ? priceSize : Math.max(4.5, priceSize * (columnWidth / measure(priceText, priceSize, 'bold')));
      blocks.push({ key: 'price', lines: [priceText], sizePt: fitted, weight: 'bold', gapAfter: 0 });
    }
    const total = blocks.reduce((sum, b) => sum + b.lines.length * lineHeight(b.sizePt) + b.gapAfter, 0);
    const fits = total <= columnHeight + 0.01;
    if (fits || attempt === 13) {
      // Fiyat sütunun altına, diğerleri üste yerleşir
      let y = y0;
      blocks.filter((b) => b.key !== 'price').forEach((b) => {
        b.lines.forEach((line) => {
          y += lineHeight(b.sizePt);
          elements.push({ kind: 'text', x: ax, y: y - lineHeight(b.sizePt) * 0.2, text: line, sizePt: b.sizePt, weight: b.weight, align });
        });
        y += b.gapAfter;
      });
      const price = blocks.find((b) => b.key === 'price');
      if (price) {
        const py = Math.max(y + lineHeight(price.sizePt), bottom) - lineHeight(price.sizePt) * 0.16;
        elements.push({ kind: 'text', x: ax, y: py, text: price.lines[0], sizePt: price.sizePt, weight: 'bold', align });
      }
      return elements;
    }
    // Sığmadı: önce küçült, sonra adı tek satıra indir, sonra firma ve kod satırını çıkar
    if (scale > 0.62) scale *= 0.9;
    else if (nameLines > 1) nameLines = 1;
    else if (!dropFirm && settings.showFirmName) dropFirm = true;
    else dropMeta = true;
  }
  return elements;
}
