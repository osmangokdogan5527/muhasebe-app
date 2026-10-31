/**
 * PDF belgelerinin ortak sayfa düzeni: firma başlığı, bilgi kutuları, alt bilgi ve sayfa numarası.
 * Ölçüler milimetredir (A4: 210 x 297).
 */
import type { jsPDF } from 'jspdf';
import { DocumentBranding } from './branding';
import { PDF_FONT, PDF_FONT_SEMIBOLD } from './fonts';

export const PAGE_MARGIN = 14;
export const FOOTER_HEIGHT = 16;

export type RGB = [number, number, number];

export const COLORS = {
  text: [17, 24, 39] as RGB, // koyu gri-siyah
  muted: [100, 116, 139] as RGB, // açıklama grisi
  line: [226, 232, 240] as RGB, // ince çizgi
  zebra: [248, 250, 252] as RGB, // tablo satır zemini
  white: [255, 255, 255] as RGB,
};

export function hexToRgb(hex: string): RGB {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || '');
  if (!match) return [15, 76, 129];
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

/** Rengi beyazla karıştırır (amount 0 = renk, 1 = beyaz): açık zeminler için */
export function tint(color: RGB, amount: number): RGB {
  return color.map((c) => Math.round(c + (255 - c) * amount)) as RGB;
}

export interface DocumentMeta {
  label: string;
  value: string;
}

export interface HeaderOptions {
  title: string;
  meta: DocumentMeta[];
}

function setText(doc: jsPDF, size: number, color: RGB, font: 'normal' | 'bold' | 'semibold' = 'normal') {
  if (font === 'semibold') doc.setFont(PDF_FONT_SEMIBOLD, 'normal');
  else doc.setFont(PDF_FONT, font);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
}

function firmDetailLines(branding: DocumentBranding): string[] {
  const lines: string[] = [];
  if (branding.address) lines.push(branding.address);
  const contact = [branding.phone && `Tel: ${branding.phone}`, branding.email, branding.website].filter(Boolean).join('  ·  ');
  if (contact) lines.push(contact);
  const tax = [branding.taxOffice && `${branding.taxOffice} V.D.`, branding.taxNumber && `VKN/TCKN: ${branding.taxNumber}`].filter(Boolean).join('  ·  ');
  if (tax) lines.push(tax);
  return lines;
}

/**
 * Sayfanın üst kısmı: solda logo/firma adı ve firma bilgileri, sağda belge başlığı ve belge
 * numarası/tarihi. Çizdiği alanın altındaki y konumunu döndürür.
 */
export function drawDocumentHeader(doc: jsPDF, branding: DocumentBranding, options: HeaderOptions): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const accent = hexToRgb(branding.accentColor);
  const left = PAGE_MARGIN;
  const right = pageWidth - PAGE_MARGIN;
  const leftWidth = 98;
  let leftY = PAGE_MARGIN;

  // Üst şerit
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageWidth, 3, 'F');
  leftY += 2;

  // Logo ya da firma adı
  let logoDrawn = false;
  if (branding.logoDataUrl) {
    try {
      const props = doc.getImageProperties(branding.logoDataUrl);
      const maxW = 46;
      const maxH = 20;
      const ratio = Math.min(maxW / props.width, maxH / props.height);
      const w = props.width * ratio;
      const h = props.height * ratio;
      doc.addImage(branding.logoDataUrl, props.fileType || 'PNG', left, leftY, w, h, undefined, 'FAST');
      leftY += h + 3;
      logoDrawn = true;
    } catch {
      logoDrawn = false;
    }
  }
  const firmName = branding.firmName || 'Firma Adı';
  if (logoDrawn) {
    setText(doc, 10, COLORS.text, 'bold');
    const nameLines = doc.splitTextToSize(firmName, leftWidth);
    doc.text(nameLines, left, leftY + 3.5);
    leftY += nameLines.length * 4.6 + 1;
  } else {
    setText(doc, 16, accent, 'bold');
    const nameLines = doc.splitTextToSize(firmName, leftWidth);
    doc.text(nameLines, left, leftY + 6);
    leftY += nameLines.length * 6.8 + 2;
  }

  setText(doc, 8, COLORS.muted);
  firmDetailLines(branding).forEach((line) => {
    const wrapped = doc.splitTextToSize(line, leftWidth);
    doc.text(wrapped, left, leftY + 3);
    leftY += wrapped.length * 3.7;
  });

  // Sağ: belge başlığı ve bilgileri
  let rightY = PAGE_MARGIN + 2;
  setText(doc, 17, accent, 'bold');
  doc.text(options.title, right, rightY + 6, { align: 'right' });
  rightY += 11;
  const metaLabelX = right - 62;
  options.meta.forEach(({ label, value }) => {
    setText(doc, 8, COLORS.muted);
    doc.text(label, metaLabelX, rightY + 3.5);
    setText(doc, 9, COLORS.text, 'semibold');
    doc.text(value || '-', right, rightY + 3.5, { align: 'right' });
    rightY += 5;
  });

  const bottom = Math.max(leftY, rightY) + 3;
  doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
  doc.setLineWidth(0.3);
  doc.line(left, bottom, right, bottom);
  return bottom + 5;
}

/** İkinci ve sonraki sayfaların üstündeki kısa başlık. */
export function drawContinuationHeader(doc: jsPDF, branding: DocumentBranding, title: string, reference: string): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const accent = hexToRgb(branding.accentColor);
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageWidth, 3, 'F');
  setText(doc, 9, COLORS.text, 'bold');
  doc.text(branding.firmName || '', PAGE_MARGIN, PAGE_MARGIN + 3);
  setText(doc, 9, accent, 'bold');
  doc.text(`${title}${reference ? `  ·  ${reference}` : ''}`, pageWidth - PAGE_MARGIN, PAGE_MARGIN + 3, { align: 'right' });
  doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
  doc.setLineWidth(0.3);
  doc.line(PAGE_MARGIN, PAGE_MARGIN + 6, pageWidth - PAGE_MARGIN, PAGE_MARGIN + 6);
}

export interface InfoBoxRow {
  label?: string;
  value: string;
  bold?: boolean;
}

/**
 * Açık renk zeminli bilgi kutusu (ör. "SAYIN" müşteri bilgileri, "BELGE BİLGİLERİ").
 * Kutunun yüksekliğini döndürür; drawOnly=false ise sadece ölçer, çizmez.
 */
export function drawInfoBox(
  doc: jsPDF,
  branding: DocumentBranding,
  x: number,
  y: number,
  width: number,
  heading: string,
  rows: InfoBoxRow[],
  fixedHeight?: number,
  measureOnly = false,
): number {
  const accent = hexToRgb(branding.accentColor);
  const padding = 4;
  const innerWidth = width - padding * 2;
  const lineHeight = 4.1;
  const labelWidth = 24;

  const prepared = rows
    .filter((row) => row.value && row.value.trim())
    .map((row) => {
      setText(doc, row.bold ? 10 : 8.5, COLORS.text, row.bold ? 'bold' : 'normal');
      const available = row.label ? innerWidth - labelWidth : innerWidth;
      const lines = doc.splitTextToSize(row.value, available) as string[];
      return { row, lines, height: lines.length * (row.bold ? 4.8 : lineHeight) };
    });
  const contentHeight = prepared.reduce((sum, item) => sum + item.height, 0);
  const height = Math.max(fixedHeight || 0, padding + 5 + contentHeight + padding - 1);
  if (measureOnly) return height;

  const bg = tint(accent, 0.94);
  doc.setFillColor(bg[0], bg[1], bg[2]);
  doc.roundedRect(x, y, width, height, 2, 2, 'F');
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(x, y + 2, 1.2, height - 4, 'F');

  setText(doc, 7.5, accent, 'bold');
  doc.text(heading.toLocaleUpperCase('tr-TR'), x + padding, y + padding + 2.5);
  let cursor = y + padding + 7;
  prepared.forEach(({ row, lines }) => {
    if (row.label) {
      setText(doc, 8, COLORS.muted);
      doc.text(row.label, x + padding, cursor);
    }
    setText(doc, row.bold ? 10 : 8.5, COLORS.text, row.bold ? 'bold' : row.label ? 'semibold' : 'normal');
    doc.text(lines, x + padding + (row.label ? labelWidth : 0), cursor);
    cursor += lines.length * (row.bold ? 4.8 : lineHeight);
  });
  return height;
}

/** Bütün sayfalara alt bilgi (not, sayfa numarası) yazar. Belge tamamlandıktan sonra çağrılır. */
export function drawFooters(doc: jsPDF, branding: DocumentBranding): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const accent = hexToRgb(branding.accentColor);
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    const top = pageHeight - FOOTER_HEIGHT + 2;
    doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
    doc.setLineWidth(0.3);
    doc.line(PAGE_MARGIN, top, pageWidth - PAGE_MARGIN, top);
    if (branding.footerNote) {
      setText(doc, 7.5, COLORS.muted);
      const lines = (doc.splitTextToSize(branding.footerNote, pageWidth - PAGE_MARGIN * 2 - 30) as string[]).slice(0, 2);
      doc.text(lines, PAGE_MARGIN, top + 4.5);
    }
    setText(doc, 7.5, accent, 'semibold');
    doc.text(`Sayfa ${page} / ${pageCount}`, pageWidth - PAGE_MARGIN, top + 4.5, { align: 'right' });
    setText(doc, 6.5, tint(COLORS.muted, 0.3));
    doc.text('Storm Ön Muhasebe ile hazırlanmıştır.', pageWidth - PAGE_MARGIN, top + 8.5, { align: 'right' });
  }
}

export { setText };
