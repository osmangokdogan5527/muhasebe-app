/**
 * Cari hesap ekstresi PDF'i: dönem başı (devreden) bakiye, hareketler, yürüyen bakiye ve toplamlar.
 */
import { Cari, Transaction } from '../types';
import { buildCariLedger } from '../utils/cariLedger';
import { DocumentBranding } from './branding';
import { registerPdfFonts, PDF_FONT, PDF_FONT_SEMIBOLD } from './fonts';
import { formatBalance, formatDate, formatMoney, normalizeCurrency, safeFileName } from './format';
import {
  COLORS,
  FOOTER_HEIGHT,
  PAGE_MARGIN,
  drawContinuationHeader,
  drawDocumentHeader,
  drawFooters,
  drawInfoBox,
  hexToRgb,
  setText,
  tint,
} from './layout';
import type { GeneratedPdf } from './invoicePdf';
import { getTodayISO } from '../utils/dateUtils';

export interface StatementPdfOptions {
  startDate?: string;
  endDate?: string;
}

const TITLE = 'CARİ HESAP EKSTRESİ';

export function statementPeriodLabel(startDate?: string, endDate?: string): string {
  if (startDate && endDate) return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  if (startDate) return `${formatDate(startDate)} sonrası`;
  if (endDate) return `${formatDate(endDate)} öncesi`;
  return 'Tüm hareketler';
}

export async function createStatementPdf(cari: Cari, islemler: Transaction[], branding: DocumentBranding, options: StatementPdfOptions = {}): Promise<GeneratedPdf> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  await registerPdfFonts(doc);

  const ledger = buildCariLedger(cari, islemler, options.startDate || undefined, options.endDate || undefined);
  const currency = normalizeCurrency(cari.currency);
  const accent = hexToRgb(branding.accentColor);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const today = getTodayISO();
  const period = statementPeriodLabel(options.startDate, options.endDate);

  doc.setProperties({ title: `${TITLE} ${cari.name}`, subject: period, creator: 'Storm Ön Muhasebe' });

  let y = drawDocumentHeader(doc, branding, {
    title: TITLE,
    meta: [
      { label: 'Dönem', value: period },
      { label: 'Düzenleme Tarihi', value: formatDate(today) },
    ],
  });

  // Cari ve özet
  const gap = 6;
  const boxWidth = (contentWidth - gap) / 2;
  const partyRows = [
    { value: cari.name || '-', bold: true },
    { value: cari.address || '' },
    { label: 'Telefon', value: cari.phone || '' },
    { label: 'Vergi D.', value: cari.taxOffice || '' },
    { label: 'VKN/TCKN', value: cari.taxNo || '' },
    { label: 'Cari Kodu', value: cari.code || '' },
  ];
  const summaryRows = [
    { label: 'Dönem Başı', value: formatBalance(ledger.openingBalance, currency) },
    { label: 'Toplam Borç', value: formatMoney(ledger.totalDebit, currency) },
    { label: 'Toplam Alacak', value: formatMoney(ledger.totalCredit, currency) },
    { label: 'Hareket', value: `${ledger.rows.length} adet` },
  ];
  const boxHeight = Math.max(
    drawInfoBox(doc, branding, 0, 0, boxWidth, 'Sayın', partyRows, undefined, true),
    drawInfoBox(doc, branding, 0, 0, boxWidth, 'Hesap Özeti', summaryRows, undefined, true) + 11,
  );
  drawInfoBox(doc, branding, PAGE_MARGIN, y, boxWidth, 'Sayın', partyRows, boxHeight);
  const summaryX = PAGE_MARGIN + boxWidth + gap;
  drawInfoBox(doc, branding, summaryX, y, boxWidth, 'Hesap Özeti', summaryRows, boxHeight);
  // Dönem sonu bakiyesi vurgulu
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(summaryX + 3, y + boxHeight - 12, boxWidth - 6, 9, 1.5, 1.5, 'F');
  setText(doc, 8, COLORS.white, 'semibold');
  doc.text('DÖNEM SONU BAKİYE', summaryX + 6, y + boxHeight - 6.3);
  setText(doc, 9.5, COLORS.white, 'bold');
  doc.text(formatBalance(ledger.closingBalance, currency), summaryX + boxWidth - 6, y + boxHeight - 6.2, { align: 'right' });
  y += boxHeight + 7;

  // Hareket tablosu
  const openingLabel = options.startDate ? 'Devreden Bakiye' : 'Açılış Bakiyesi';
  const body: string[][] = [
    [options.startDate ? formatDate(options.startDate) : '', openingLabel, '', '', '', formatBalance(ledger.openingBalance, currency)],
    ...ledger.rows.map((row) => [
      formatDate(row.date),
      row.documentNo ? `${row.typeLabel}\n${row.documentNo}` : row.typeLabel,
      row.description,
      row.debit ? formatMoney(row.debit, currency) : '',
      row.credit ? formatMoney(row.credit, currency) : '',
      formatBalance(row.balance, currency),
    ]),
  ];
  const zebra = tint(accent, 0.965);
  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, top: PAGE_MARGIN + 11, bottom: FOOTER_HEIGHT + 4 },
    head: [['Tarih', 'İşlem / Belge No', 'Açıklama', 'Borç', 'Alacak', 'Bakiye']],
    body,
    foot: [['', 'TOPLAM', '', formatMoney(ledger.totalDebit, currency), formatMoney(ledger.totalCredit, currency), formatBalance(ledger.closingBalance, currency)]],
    theme: 'plain',
    showHead: 'everyPage',
    showFoot: 'lastPage',
    styles: {
      font: PDF_FONT,
      fontSize: 7.8,
      textColor: COLORS.text,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2, right: 2 },
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: { font: PDF_FONT_SEMIBOLD, fontStyle: 'normal', fillColor: accent, textColor: COLORS.white, fontSize: 7.8 },
    footStyles: { font: PDF_FONT_SEMIBOLD, fontStyle: 'normal', fillColor: tint(accent, 0.88), textColor: COLORS.text, fontSize: 8 },
    alternateRowStyles: { fillColor: zebra },
    columnStyles: {
      0: { cellWidth: 19 },
      1: { cellWidth: 32 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 33, halign: 'right', font: PDF_FONT_SEMIBOLD },
    },
    didParseCell: (data) => {
      if (data.column.index >= 3 && (data.section === 'head' || data.section === 'foot')) data.cell.styles.halign = 'right';
      // Devreden / açılış satırı
      if (data.section === 'body' && data.row.index === 0) {
        data.cell.styles.fillColor = tint(accent, 0.92);
        data.cell.styles.font = PDF_FONT_SEMIBOLD;
      }
      if (data.section === 'body' && data.column.index === 1 && data.row.index > 0) {
        data.cell.styles.textColor = COLORS.text;
      }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawContinuationHeader(doc, branding, TITLE, cari.name);
    },
  });
  y = ((doc as any).lastAutoTable?.finalY ?? y) + 8;

  // Mutabakat notu ve imza
  setText(doc, 8.5, COLORS.text);
  const note = `İşbu hesap ekstresi ${formatDate(today)} tarihi itibarıyla düzenlenmiştir. Hesap bakiyeniz ${formatBalance(ledger.closingBalance, currency)} olarak görünmektedir. Kayıtlarınızla uyuşmayan bir durum varsa 7 gün içinde bildirmenizi rica ederiz.`;
  const noteLines = doc.splitTextToSize(note, contentWidth) as string[];
  const blockHeight = noteLines.length * 4.3 + (branding.showSignatureArea ? 30 : 4);
  if (y + blockHeight > pageHeight - FOOTER_HEIGHT - 4) {
    doc.addPage();
    drawContinuationHeader(doc, branding, TITLE, cari.name);
    y = PAGE_MARGIN + 14;
  }
  doc.text(noteLines, PAGE_MARGIN, y);
  y += noteLines.length * 4.3 + 8;

  if (branding.showSignatureArea) {
    const sigWidth = 60;
    [[branding.firmName || 'Firma', PAGE_MARGIN, 'Kaşe / İmza'], [cari.name, pageWidth - PAGE_MARGIN - sigWidth, 'Mutabıkız / Kaşe / İmza']].forEach(([label, x, hint]) => {
      setText(doc, 8, COLORS.muted);
      doc.text((doc.splitTextToSize(String(label), sigWidth) as string[])[0], Number(x) + sigWidth / 2, y, { align: 'center' });
      doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
      doc.setLineWidth(0.3);
      doc.line(Number(x), y + 13, Number(x) + sigWidth, y + 13);
      setText(doc, 7, tint(COLORS.muted, 0.3));
      doc.text(String(hint), Number(x) + sigWidth / 2, y + 17, { align: 'center' });
    });
  }

  drawFooters(doc, branding);

  const blob = doc.output('blob');
  const fileName = `Cari_Ekstre_${safeFileName(cari.name)}_${safeFileName(options.startDate || 'tum')}_${safeFileName(options.endDate || today)}.pdf`;
  return { blob, fileName, pageCount: doc.getNumberOfPages() };
}
