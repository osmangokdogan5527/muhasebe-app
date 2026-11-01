/**
 * Fatura PDF'i (satış, alış ve iade faturaları).
 *
 * Tutarlar kaydın kendisinden okunur: satır toplamları KDV dahildir (item.total); matrah ve KDV
 * oranlara göre splitInvoiceVat ile ayrılır. POS genel iskontosu varsa satırlar ile genel toplam
 * arasındaki fark "İskonto" olarak gösterilir; böylece matrah + KDV her zaman genel toplama eşittir.
 */
import { Cari, Transaction } from '../types';
import type { DocumentBalance } from '../utils/cariLedger';
import { calculateInvoiceLine, roundMoney, splitInvoiceVat } from '../utils/invoiceMath';
import { DocumentBranding } from './branding';
import { registerPdfFonts, PDF_FONT, PDF_FONT_SEMIBOLD } from './fonts';
import { amountToTurkishWords, formatDate, formatMoney, formatNumber, formatQuantity, normalizeCurrency, safeFileName } from './format';
import {
  COLORS,
  FOOTER_HEIGHT,
  PAGE_MARGIN,
  pageMargin,
  sizeK,
  preparePaper,
  PaperSize,
  drawContinuationHeader,
  drawDocumentHeader,
  drawFooters,
  drawBalanceBox,
  drawInfoBox,
  hexToRgb,
  setText,
  tint,
} from './layout';

export const INVOICE_TYPES: Transaction['type'][] = ['sale', 'purchase', 'sale_return', 'purchase_return'];

export function isInvoiceTransaction(islem: Pick<Transaction, 'type'>): boolean {
  return INVOICE_TYPES.includes(islem.type);
}

const INVOICE_TITLES: Record<string, string> = {
  sale: 'SATIŞ FATURASI',
  purchase: 'ALIŞ FATURASI',
  sale_return: 'SATIŞ İADE FATURASI',
  purchase_return: 'ALIŞ İADE FATURASI',
};

// Karşı tarafın kutu başlığı: alış faturasında satıcı, satış iadesinde iade eden müşteri
const PARTY_HEADINGS: Record<string, string> = {
  sale: 'Sayın',
  purchase: 'Satıcı / Tedarikçi',
  sale_return: 'İade Eden Müşteri',
  purchase_return: 'Sayın',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Peşin (Nakit)',
  bank: 'Banka / Havale',
  pos: 'Kredi Kartı (POS)',
  '': 'Açık Hesap (Vadeli)',
};

export interface InvoicePdfOptions {
  /** Cari bakiye özeti (ayarlarda kapalıysa ya da perakende satışsa verilmez) */
  balance?: DocumentBalance | null;
  /** Kağıt boyutu (varsayılan A4) */
  paper?: PaperSize;
}

export interface GeneratedPdf {
  blob: Blob;
  fileName: string;
  pageCount: number;
}

interface InvoiceRow {
  name: string;
  quantity: number;
  unit: string;
  unitNet: number;
  taxRate: number;
  lineNet: number;
  lineTotal: number;
}

function buildRows(islem: Transaction): InvoiceRow[] {
  const items = Array.isArray(islem.items) ? islem.items.filter(Boolean) : [];
  if (items.length === 0) {
    // Kalemsiz (eski veya içe aktarılmış) fatura: tek satır, tutar KDV dahil kabul edilir
    const groups = splitInvoiceVat({ amount: islem.amount, items: [] });
    const net = groups.reduce((sum, g) => sum + g.net, 0);
    return [{
      name: islem.description || 'Mal / Hizmet Bedeli',
      quantity: 1,
      unit: 'Adet',
      unitNet: roundMoney(net),
      taxRate: groups[0]?.rate ?? 0,
      lineNet: roundMoney(net),
      lineTotal: roundMoney(islem.amount),
    }];
  }
  return items.map((item) => {
    const rate = Number(item.taxRate) || 0;
    const quantity = Number(item.quantity) || 0;
    const lineTotal = item.total !== undefined && item.total !== null
      ? roundMoney(Number(item.total) || 0)
      : calculateInvoiceLine(quantity, item.price, rate).total;
    const lineNet = roundMoney(lineTotal / (1 + rate / 100));
    return {
      name: item.stockName || 'Ürün',
      quantity,
      unit: item.unit || 'Adet',
      unitNet: quantity ? lineNet / quantity : lineNet,
      taxRate: rate,
      lineNet,
      lineTotal,
    };
  });
}

function partyRows(islem: Transaction, cari: Cari | undefined) {
  return [
    { value: cari?.name || islem.cariName || '-', bold: true },
    { value: cari?.address || '' },
    { label: 'Telefon', value: cari?.phone || '' },
    { label: 'E-posta', value: cari?.email || '' },
    { label: 'Vergi D.', value: cari?.taxOffice || '' },
    { label: 'VKN/TCKN', value: cari?.taxNo || '' },
  ];
}

export async function createInvoicePdf(islem: Transaction, cari: Cari | undefined, branding: DocumentBranding, options: InvoicePdfOptions = {}): Promise<GeneratedPdf> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const paper: PaperSize = options.paper === 'a5' ? 'a5' : 'a4';
  const doc = new jsPDF({ unit: 'mm', format: paper, orientation: 'portrait', compress: true });
  preparePaper(doc, paper);
  // A4 için yazılmış sabit genişlikler sayfaya göre ölçeklenir
  const k = sizeK(doc);
  await registerPdfFonts(doc);

  const currency = normalizeCurrency(islem.currency);
  const accent = hexToRgb(branding.accentColor);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - pageMargin(doc) * 2;
  const title = INVOICE_TITLES[islem.type] || 'FATURA';
  const reference = islem.invoiceNo || '';

  doc.setProperties({ title: `${title} ${reference}`.trim(), subject: islem.cariName || '', creator: 'Storm Ön Muhasebe' });

  // 1) Başlık
  let y = drawDocumentHeader(doc, branding, {
    title,
    meta: [
      { label: 'Fatura No', value: reference || '-' },
      { label: 'Tarih', value: formatDate(islem.date) },
    ],
  });

  // 2) Müşteri ve belge bilgileri
  const gap = 6;
  const boxWidth = (contentWidth - gap) / 2;
  const documentRows = [
    { label: 'Ödeme', value: PAYMENT_LABELS[islem.account || ''] || PAYMENT_LABELS[''] },
    { label: 'Para Birimi', value: currency === 'TRY' ? 'Türk Lirası (TRY)' : currency },
    { label: 'Kur', value: currency !== 'TRY' && islem.exchangeRate ? `1 ${currency} = ${formatNumber(islem.exchangeRate, 4)} TL` : '' },
    { label: 'Cari Kodu', value: cari?.code || '' },
  ];
  const partyHeading = PARTY_HEADINGS[islem.type] || 'Sayın';
  const boxHeight = Math.max(
    drawInfoBox(doc, branding, 0, 0, boxWidth, partyHeading, partyRows(islem, cari), undefined, true),
    drawInfoBox(doc, branding, 0, 0, boxWidth, 'Belge Bilgileri', documentRows, undefined, true),
  );
  drawInfoBox(doc, branding, pageMargin(doc), y, boxWidth, partyHeading, partyRows(islem, cari), boxHeight);
  drawInfoBox(doc, branding, pageMargin(doc) + boxWidth + gap, y, boxWidth, 'Belge Bilgileri', documentRows, boxHeight);
  y += boxHeight + 7;

  // 3) Kalemler
  const rows = buildRows(islem);
  const zebra = tint(accent, 0.965);
  // KDV'siz belgede KDV sütunu ve %0 satırları gösterilmez
  const hasTax = rows.some((row) => Number(row.taxRate) > 0);
  autoTable(doc, {
    startY: y,
    margin: { left: pageMargin(doc), right: pageMargin(doc), top: pageMargin(doc) + 11, bottom: FOOTER_HEIGHT + 4 },
    head: [hasTax ? ['#', 'Mal / Hizmet', 'Miktar', 'Birim Fiyat', 'KDV', 'Tutar'] : ['#', 'Mal / Hizmet', 'Miktar', 'Birim Fiyat', 'Tutar']],
    body: rows.map((row, index) => [
      String(index + 1),
      row.name,
      `${formatQuantity(row.quantity)} ${row.unit}`,
      formatMoney(row.unitNet, currency),
      ...(hasTax ? [`%${formatQuantity(row.taxRate)}`] : []),
      formatMoney(row.lineNet, currency),
    ]),
    theme: 'plain',
    showHead: 'everyPage',
    styles: {
      font: PDF_FONT,
      fontSize: 8.5,
      textColor: COLORS.text,
      cellPadding: { top: 2.6, bottom: 2.6, left: 2.5, right: 2.5 },
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      font: PDF_FONT_SEMIBOLD,
      fontStyle: 'normal',
      fillColor: accent,
      textColor: COLORS.white,
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: zebra },
    // KDV sütunu yoksa Tutar sütunu bir öne kayar
    columnStyles: {
      0: { cellWidth: 9 * k, halign: 'center', textColor: COLORS.muted },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 26 * k, halign: 'right' },
      3: { cellWidth: 30 * k, halign: 'right' },
      ...(hasTax
        ? { 4: { cellWidth: Math.max(14 * k, 13), halign: 'center' }, 5: { cellWidth: 32 * k, halign: 'right', font: PDF_FONT_SEMIBOLD } }
        : { 4: { cellWidth: 32 * k, halign: 'right', font: PDF_FONT_SEMIBOLD } }),
    },
    didParseCell: (data) => {
      if (data.section === 'head' && data.column.index >= 2) {
        data.cell.styles.halign = data.column.index === 4 ? 'center' : 'right';
      }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawContinuationHeader(doc, branding, title, reference);
      // Tablonun alt çizgisi
      doc.setDrawColor(accent[0], accent[1], accent[2]);
      doc.setLineWidth(0.4);
      const tableBottom = data.cursor ? data.cursor.y : y;
      doc.line(pageMargin(doc), tableBottom, pageWidth - pageMargin(doc), tableBottom);
    },
  });
  y = ((doc as any).lastAutoTable?.finalY ?? y) + 6;

  // 4) Toplamlar
  const vatGroups = splitInvoiceVat({ amount: islem.amount, items: islem.items || [] })
    .filter((g) => Math.abs(g.net) > 0.0049 || Math.abs(g.tax) > 0.0049)
    .sort((a, b) => a.rate - b.rate);
  const itemsTotal = roundMoney(rows.reduce((sum, row) => sum + row.lineTotal, 0));
  const grandTotal = roundMoney(islem.amount);
  const discount = roundMoney(itemsTotal - grandTotal);
  const totalNet = roundMoney(vatGroups.reduce((sum, g) => sum + g.net, 0));

  const totalLines: { label: string; value: string; strong?: boolean }[] = [];
  if (discount > 0.009) {
    totalLines.push({ label: hasTax ? 'Satır Toplamı (KDV dahil)' : 'Satır Toplamı', value: formatMoney(itemsTotal, currency) });
    totalLines.push({ label: 'İskonto', value: `- ${formatMoney(discount, currency)}` });
  }
  if (hasTax) {
    totalLines.push({ label: 'Ara Toplam (KDV hariç)', value: formatMoney(totalNet, currency) });
    vatGroups
      .filter((g) => g.rate > 0)
      .forEach((g) => totalLines.push({ label: `KDV (%${formatQuantity(g.rate)})`, value: formatMoney(roundMoney(g.tax), currency) }));
  }

  const totalsWidth = 82 * k;
  const totalsX = pageWidth - pageMargin(doc) - totalsWidth;
  const lineHeight = 6;
  const grandHeight = 11;
  const totalsHeight = totalLines.length * lineHeight + grandHeight + 2;
  const leftWidth = contentWidth - totalsWidth - 8;
  setText(doc, 8.5, COLORS.text);
  const wordLines = branding.showAmountInWords
    ? (doc.splitTextToSize(amountToTurkishWords(grandTotal, currency), leftWidth) as string[])
    : [];
  // Fatura türünün varsayılan açıklaması ('Satış Faturası' vb.) başlıkta zaten yazdığı için basılmaz
  const DEFAULT_DESCRIPTIONS = ['satış faturası', 'alış faturası', 'satıştan iade faturası', 'alıştan iade faturası'];
  const description = (islem.description || '').trim();
  const noteLines = description && !DEFAULT_DESCRIPTIONS.includes(description.toLocaleLowerCase('tr-TR')) && (islem.items || []).length > 0
    ? (doc.splitTextToSize(description, leftWidth) as string[]).slice(0, 6)
    : [];
  const balance = branding.showBalance ? options.balance || null : null;
  const balanceCurrency = normalizeCurrency(cari?.currency || islem.currency);
  const balanceLabel = islem.type === 'sale' ? 'Bu Fatura' : islem.type === 'purchase' ? 'Bu Fatura (Alış)' : 'Bu İade';
  const balanceHeight = balance ? drawBalanceBox(doc, branding, 0, 0, leftWidth, balance, balanceCurrency, balanceLabel, true) : 0;
  const leftHeight = (wordLines.length ? 8 + wordLines.length * 4.2 + 4 : 0)
    + (noteLines.length ? 4.5 + noteLines.length * 4 + 4 : 0)
    + (balance ? balanceHeight + 2 : 0);
  const blockHeight = Math.max(totalsHeight, leftHeight);
  const signatureHeight = branding.showSignatureArea ? 24 : 0;

  if (y + blockHeight + signatureHeight > pageHeight - FOOTER_HEIGHT - 4) {
    doc.addPage();
    drawContinuationHeader(doc, branding, title, reference);
    y = pageMargin(doc) + 12;
  }

  // Toplam satırları
  let ty = y;
  totalLines.forEach((line) => {
    setText(doc, 8.5, COLORS.muted);
    doc.text(line.label, totalsX + 3, ty + 4);
    setText(doc, 9, COLORS.text, 'semibold');
    doc.text(line.value, pageWidth - pageMargin(doc) - 3, ty + 4, { align: 'right' });
    doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
    doc.setLineWidth(0.2);
    doc.line(totalsX, ty + lineHeight, pageWidth - pageMargin(doc), ty + lineHeight);
    ty += lineHeight;
  });
  ty += 2;
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(totalsX, ty, totalsWidth, grandHeight, 1.8, 1.8, 'F');
  setText(doc, 9, COLORS.white, 'semibold');
  doc.text('GENEL TOPLAM', totalsX + 4, ty + 7.1);
  setText(doc, 12, COLORS.white, 'bold');
  doc.text(formatMoney(grandTotal, currency), pageWidth - pageMargin(doc) - 4, ty + 7.4, { align: 'right' });

  // Yazıyla tutar, açıklama ve cari hesap durumu
  let ly = y;
  if (wordLines.length) {
    setText(doc, 7.5, accent, 'bold');
    doc.text('TUTAR (YAZIYLA)', pageMargin(doc), ly + 4);
    ly += 8;
    setText(doc, 8.5, COLORS.text);
    doc.text(wordLines, pageMargin(doc), ly);
    ly += wordLines.length * 4.2 + 4;
  }
  if (noteLines.length) {
    setText(doc, 7.5, accent, 'bold');
    doc.text('AÇIKLAMA', pageMargin(doc), ly + (wordLines.length ? 0 : 4));
    ly += wordLines.length ? 4.5 : 8.5;
    setText(doc, 8.5, COLORS.text);
    doc.text(noteLines, pageMargin(doc), ly);
    ly += noteLines.length * 4 + 4;
  }
  if (balance) {
    drawBalanceBox(doc, branding, pageMargin(doc), ly, leftWidth, balance, balanceCurrency, balanceLabel);
  }

  // İmza alanı
  if (branding.showSignatureArea) {
    const sy = y + blockHeight + 8;
    const sigWidth = 60 * k;
    [['Teslim Eden', pageMargin(doc)], ['Teslim Alan', pageWidth - pageMargin(doc) - sigWidth]].forEach(([label, x]) => {
      setText(doc, 8, COLORS.muted);
      doc.text(String(label), Number(x) + sigWidth / 2, sy, { align: 'center' });
      doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
      doc.setLineWidth(0.3);
      doc.line(Number(x), sy + 13, Number(x) + sigWidth, sy + 13);
      setText(doc, 7, tint(COLORS.muted, 0.3));
      doc.text('Ad Soyad / İmza', Number(x) + sigWidth / 2, sy + 17, { align: 'center' });
    });
  }

  drawFooters(doc, branding);

  const blob = doc.output('blob');
  const fileName = `${safeFileName(title.replace('FATURASI', 'Fatura'))}_${safeFileName(reference || islem.date)}_${safeFileName(cari?.name || islem.cariName || '')}.pdf`;
  return { blob, fileName: paper === 'a5' ? fileName.replace(/\.pdf$/, '_A5.pdf') : fileName, pageCount: doc.getNumberOfPages() };
}
