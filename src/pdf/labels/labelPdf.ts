/**
 * Etiket PDF'i: rulo etikette her etiket ayrı sayfa (etiket ölçüsünde), A4'te satır/sütun düzeni.
 */
import type { jsPDF as JsPdfType } from 'jspdf';
import { Stock } from '../../types';
import { registerPdfFonts, PDF_FONT, PDF_FONT_SEMIBOLD } from '../fonts';
import { safeFileName } from '../format';
import type { GeneratedPdf } from '../invoicePdf';
import { A4_HEIGHT, A4_WIDTH, LabelSettings, labelsPerPage } from './labelSettings';
import { LabelElement, MeasureText, TextWeight, computeLabelLayout, productFromStock } from './labelLayout';

export interface LabelPrintItem {
  stock: Stock;
  copies: number;
}

export const MAX_LABELS_PER_PDF = 2000;

function setPdfFont(doc: JsPdfType, sizePt: number, weight: TextWeight) {
  if (weight === 'semibold') doc.setFont(PDF_FONT_SEMIBOLD, 'normal');
  else doc.setFont(PDF_FONT, weight === 'bold' ? 'bold' : 'normal');
  doc.setFontSize(sizePt);
}

function pdfMeasure(doc: JsPdfType): MeasureText {
  return (text, sizePt, weight) => {
    setPdfFont(doc, sizePt, weight);
    return doc.getTextWidth(text);
  };
}

export function drawLabelElements(doc: JsPdfType, elements: LabelElement[], ox: number, oy: number): void {
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(0, 0, 0);
  elements.forEach((el) => {
    if (el.kind === 'border') {
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.15);
      doc.roundedRect(ox + el.x, oy + el.y, el.w, el.h, 1, 1, 'S');
    } else if (el.kind === 'text') {
      setPdfFont(doc, el.sizePt, el.weight);
      doc.text(el.text, ox + el.x, oy + el.y, { align: el.align });
    } else if (el.kind === 'barcode') {
      const module = el.w / el.moduleCount;
      el.runs.forEach(([start, length]) => doc.rect(ox + el.x + start * module, oy + el.y, length * module, el.h, 'F'));
    } else if (el.kind === 'qr') {
      const module = el.size / el.qr.size;
      for (let row = 0; row < el.qr.size; row += 1) {
        let runStart = -1;
        for (let col = 0; col <= el.qr.size; col += 1) {
          const dark = col < el.qr.size && el.qr.isDark(row, col);
          if (dark && runStart < 0) runStart = col;
          if (!dark && runStart >= 0) {
            // Komşu modüller arasında ince beyaz çizgi kalmasın diye hafif taşırılır
            doc.rect(ox + el.x + runStart * module, oy + el.y + row * module, (col - runStart) * module + 0.01, module + 0.01, 'F');
            runStart = -1;
          }
        }
      }
    }
  });
}

/**
 * startIndex: A4 sayfada daha önce kullanılmış etiketleri atlamak için ilk etiketin sırası (0'dan).
 */
export async function createLabelsPdf(items: LabelPrintItem[], settings: LabelSettings, firmName: string, startIndex = 0): Promise<GeneratedPdf> {
  const { jsPDF } = await import('jspdf');
  const queue: Stock[] = [];
  items.forEach(({ stock, copies }) => {
    const n = Math.max(0, Math.floor(copies));
    for (let i = 0; i < n && queue.length < MAX_LABELS_PER_PDF; i += 1) queue.push(stock);
  });
  if (queue.length === 0) throw new Error('Basılacak etiket yok.');

  const roll = settings.mode === 'roll';
  const W = settings.widthMm;
  const H = settings.heightMm;
  const doc = roll
    ? new jsPDF({ unit: 'mm', format: [W, H], orientation: W > H ? 'landscape' : 'portrait', compress: true })
    : new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  await registerPdfFonts(doc);
  doc.setProperties({ title: 'Ürün Etiketleri', creator: 'Storm Ön Muhasebe' });
  const measure = pdfMeasure(doc);

  // Aynı ürünün kopyaları için yerleşim bir kez hesaplanır
  const cache = new Map<string, LabelElement[]>();
  const layoutFor = (stock: Stock) => {
    const key = stock.id || stock.code || stock.name;
    let elements = cache.get(key);
    if (!elements) {
      const product = productFromStock(stock, settings);
      elements = computeLabelLayout(product, settings, firmName, measure);
      cache.set(key, elements);
    }
    return elements;
  };

  const perPage = labelsPerPage(settings);
  const skip = roll ? 0 : Math.max(0, Math.min(perPage - 1, Math.floor(startIndex)));
  queue.forEach((stock, index) => {
    const elements = layoutFor(stock);
    if (roll) {
      if (index > 0) doc.addPage([W, H], W > H ? 'landscape' : 'portrait');
      drawLabelElements(doc, elements, 0, 0);
      return;
    }
    const slot = index + skip;
    const inPage = slot % perPage;
    if (inPage === 0 && slot > 0) doc.addPage('a4', 'portrait');
    const col = inPage % settings.sheet.columns;
    const row = Math.floor(inPage / settings.sheet.columns);
    const ox = settings.sheet.marginLeftMm + col * (W + settings.sheet.gapXMm);
    const oy = settings.sheet.marginTopMm + row * (H + settings.sheet.gapYMm);
    if (ox + W <= A4_WIDTH + 0.01 && oy + H <= A4_HEIGHT + 0.01) drawLabelElements(doc, elements, ox, oy);
  });

  const first = items.find((i) => i.copies > 0)?.stock;
  const name = items.filter((i) => i.copies > 0).length === 1 && first ? safeFileName(first.name) : 'Urunler';
  return {
    blob: doc.output('blob'),
    fileName: `Etiket_${name}_${String(W).replace('.', ',')}x${String(H).replace('.', ',')}mm.pdf`,
    pageCount: doc.getNumberOfPages(),
  };
}
