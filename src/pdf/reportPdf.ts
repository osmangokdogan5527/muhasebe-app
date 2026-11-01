/**
 * Rapor PDF'i: belge başlığı, özet kartları ve tablolar (tüm satırlar, çok sayfalı).
 * Rapor içeriği (hangi tablo, hangi kart) src/components/raporlar/reportDocuments.ts'te kurulur.
 */
import { DocumentBranding } from './branding';
import { registerPdfFonts, PDF_FONT, PDF_FONT_SEMIBOLD } from './fonts';
import { formatDate, safeFileName } from './format';
import {
  COLORS,
  FOOTER_HEIGHT,
  PAGE_MARGIN,
  PaperSize,
  pageMargin,
  preparePaper,
  sizeK,
  RGB,
  drawContinuationHeader,
  drawDocumentHeader,
  drawFooters,
  hexToRgb,
  setText,
  tint,
} from './layout';
import type { GeneratedPdf } from './invoicePdf';
import { getTodayISO } from '../utils/dateUtils';

export type ReportTone = 'neutral' | 'positive' | 'negative';

export interface ReportCard {
  label: string;
  value: string;
  hint?: string;
  tone?: ReportTone;
}

export interface ReportColumn {
  header: string;
  align?: 'left' | 'right' | 'center';
  /** mm; verilmezse kalan genişlik paylaşılır */
  width?: number;
  emphasis?: boolean;
}

export interface ReportTableSection {
  kind: 'table';
  title?: string;
  columns: ReportColumn[];
  rows: string[][];
  /** Satır bazında vurgu (ör. ara toplam satırları) */
  rowStyles?: ('normal' | 'subtotal' | 'total' | 'heading')[];
  foot?: string[];
  emptyText?: string;
}

export interface ReportNoteSection {
  kind: 'note';
  text: string;
}

export type ReportSection = ReportTableSection | ReportNoteSection;

export interface ReportDocument {
  title: string;
  /** Dosya adında kullanılır */
  fileKey: string;
  periodLabel?: string;
  currencyLabel?: string;
  cards?: ReportCard[];
  sections: ReportSection[];
  landscape?: boolean;
}

const TONE_COLORS: Record<ReportTone, RGB> = {
  neutral: COLORS.text,
  positive: [21, 128, 61],
  negative: [190, 18, 60],
};

export async function createReportPdf(report: ReportDocument, branding: DocumentBranding, paper: PaperSize = 'a4'): Promise<GeneratedPdf> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ unit: 'mm', format: paper, orientation: report.landscape ? 'landscape' : 'portrait', compress: true });
  preparePaper(doc, paper);
  const k = sizeK(doc);
  await registerPdfFonts(doc);

  const accent = hexToRgb(branding.accentColor);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - pageMargin(doc) * 2;
  const today = getTodayISO();
  const title = report.title.toLocaleUpperCase('tr-TR');

  doc.setProperties({ title: report.title, subject: report.periodLabel || '', creator: 'Storm Ön Muhasebe' });

  const meta = [
    report.periodLabel ? { label: 'Dönem', value: report.periodLabel } : null,
    report.currencyLabel ? { label: 'Para Birimi', value: report.currencyLabel } : null,
    { label: 'Düzenleme Tarihi', value: formatDate(today) },
  ].filter(Boolean) as { label: string; value: string }[];
  let y = drawDocumentHeader(doc, branding, { title, meta });

  // Özet kartları
  const cards = report.cards || [];
  if (cards.length) {
    const perRow = Math.min(4, cards.length);
    const gap = 4;
    const cardWidth = (contentWidth - gap * (perRow - 1)) / perRow;
    const cardHeight = 18;
    const bg = tint(accent, 0.94);
    cards.forEach((card, index) => {
      const col = index % perRow;
      const row = Math.floor(index / perRow);
      const x = pageMargin(doc) + col * (cardWidth + gap);
      const cy = y + row * (cardHeight + gap);
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.roundedRect(x, cy, cardWidth, cardHeight, 2, 2, 'F');
      setText(doc, 7, COLORS.muted, 'semibold');
      doc.text((doc.splitTextToSize(card.label.toLocaleUpperCase('tr-TR'), cardWidth - 6) as string[])[0], x + 3, cy + 5.5);
      const color = TONE_COLORS[card.tone || 'neutral'];
      let size = 12;
      setText(doc, size, color, 'bold');
      while (size > 7 && doc.getTextWidth(card.value) > cardWidth - 6) {
        size -= 0.5;
        doc.setFontSize(size);
      }
      doc.text(card.value, x + 3, cy + 12.5);
      if (card.hint) {
        setText(doc, 6.5, COLORS.muted);
        doc.text((doc.splitTextToSize(card.hint, cardWidth - 6) as string[])[0], x + 3, cy + 16.2);
      }
    });
    y += Math.ceil(cards.length / perRow) * (cardHeight + gap) + 3;
  }

  const zebra = tint(accent, 0.965);
  // Devam sayfalarının kısa başlığı her sayfaya bir kez çizilir
  const pagesWithHeader = new Set<number>([1]);
  const ensureContinuationHeader = () => {
    const page = doc.getCurrentPageInfo().pageNumber;
    if (pagesWithHeader.has(page)) return;
    pagesWithHeader.add(page);
    drawContinuationHeader(doc, branding, title, report.periodLabel || '');
  };
  report.sections.forEach((section) => {
    if (section.kind === 'note') {
      setText(doc, 8, COLORS.muted);
      const lines = doc.splitTextToSize(section.text, contentWidth) as string[];
      if (y + lines.length * 4 > pageHeight - FOOTER_HEIGHT - 4) {
        doc.addPage();
        ensureContinuationHeader();
        y = pageMargin(doc) + 14;
      }
      doc.text(lines, pageMargin(doc), y + 3);
      y += lines.length * 4 + 6;
      return;
    }

    // Başlık sığmıyorsa yeni sayfaya geçilir (başlık tablodan ayrı kalmasın)
    if (section.title && y + 22 > pageHeight - FOOTER_HEIGHT - 4) {
      doc.addPage();
      ensureContinuationHeader();
      y = pageMargin(doc) + 14;
    }
    if (section.title) {
      setText(doc, 9, accent, 'bold');
      doc.text(section.title.toLocaleUpperCase('tr-TR'), pageMargin(doc), y + 3);
      y += 6;
    }

    const body = section.rows.length ? section.rows : [[section.emptyText || 'Bu dönemde kayıt yok.', ...section.columns.slice(1).map(() => '')]];
    const columnStyles: Record<number, any> = {};
    section.columns.forEach((col, i) => {
      columnStyles[i] = {
        halign: col.align || 'left',
        ...(col.width ? { cellWidth: col.width * k } : { cellWidth: 'auto' }),
        ...(col.emphasis ? { font: PDF_FONT_SEMIBOLD } : {}),
      };
    });
    autoTable(doc, {
      startY: y,
      margin: { left: pageMargin(doc), right: pageMargin(doc), top: pageMargin(doc) + 11, bottom: FOOTER_HEIGHT + 4 },
      head: [section.columns.map((c) => c.header)],
      body,
      foot: section.foot ? [section.foot] : undefined,
      theme: 'plain',
      showHead: 'everyPage',
      showFoot: 'lastPage',
      styles: { font: PDF_FONT, fontSize: 8, textColor: COLORS.text, cellPadding: { top: 2.2, bottom: 2.2, left: 2.2, right: 2.2 }, valign: 'middle', overflow: 'linebreak' },
      headStyles: { font: PDF_FONT_SEMIBOLD, fontStyle: 'normal', fillColor: accent, textColor: COLORS.white, fontSize: 7.8 },
      footStyles: { font: PDF_FONT_SEMIBOLD, fontStyle: 'normal', fillColor: tint(accent, 0.86), textColor: COLORS.text, fontSize: 8.2 },
      alternateRowStyles: { fillColor: zebra },
      columnStyles,
      didParseCell: (data) => {
        const align = section.columns[data.column.index]?.align;
        if (data.section !== 'body' && align) data.cell.styles.halign = align;
        if (data.section === 'body' && section.rows.length === 0) {
          data.cell.styles.textColor = COLORS.muted;
        }
        const style = section.rowStyles?.[data.row.index];
        if (data.section === 'body' && style && style !== 'normal') {
          data.cell.styles.font = style === 'heading' ? PDF_FONT_SEMIBOLD : style === 'total' ? PDF_FONT : PDF_FONT_SEMIBOLD;
          if (style === 'total') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = tint(accent, 0.84);
          } else if (style === 'subtotal') {
            data.cell.styles.fillColor = tint(accent, 0.92);
          } else if (style === 'heading') {
            data.cell.styles.fillColor = COLORS.white;
            data.cell.styles.textColor = accent;
          }
        }
      },
      didDrawPage: () => ensureContinuationHeader(),
    });
    y = ((doc as any).lastAutoTable?.finalY ?? y) + 8;
  });

  drawFooters(doc, branding);

  return {
    blob: doc.output('blob'),
    fileName: `Rapor_${safeFileName(report.fileKey)}_${today}${paper === 'a5' ? '_A5' : ''}.pdf`,
    pageCount: doc.getNumberOfPages(),
  };
}
