/**
 * Tahsilat / ödeme makbuzu ve alacak / borç dekontu PDF'i.
 */
import { Cari, Transaction } from '../types';
import { roundMoney } from '../utils/invoiceMath';
import { transactionTypeLabel, type DocumentBalance } from '../utils/cariLedger';
import { DocumentBranding } from './branding';
import { registerPdfFonts } from './fonts';
import { amountToTurkishWords, formatDate, formatMoney, formatNumber, normalizeCurrency, safeFileName } from './format';
import { COLORS, PAGE_MARGIN, PaperSize, drawBalanceBox, pageMargin, preparePaper, sizeK, drawDocumentHeader, drawFooters, drawInfoBox, hexToRgb, setText, tint } from './layout';
import type { GeneratedPdf } from './invoicePdf';

const RECEIPT_TITLES: Record<string, string> = {
  'Tahsilat': 'TAHSİLAT MAKBUZU',
  'Peşin Tahsilat': 'TAHSİLAT MAKBUZU',
  'Alacak Dekontu': 'ALACAK DEKONTU',
  'Ödeme': 'ÖDEME MAKBUZU',
  'Peşin Ödeme': 'ÖDEME MAKBUZU',
  'Borç Dekontu': 'BORÇ DEKONTU',
};

const PAYMENT_METHODS: Record<string, string> = {
  cash: 'Nakit (Kasa)',
  bank: 'Banka / Havale / EFT',
  pos: 'Kredi Kartı (POS)',
  '': 'Cari Hesaptan (Mahsup)',
};

export interface ReceiptPdfOptions {
  balance?: DocumentBalance | null;
  /** Kasa / banka hesabının adı */
  accountName?: string;
  /** Bağlı faturanın numarası (peşin satış/alış) */
  linkedInvoiceNo?: string;
  /** Kağıt boyutu (varsayılan A4) */
  paper?: PaperSize;
}

/** Makbuz numarası: kayıtta numara yoksa tarih + kayıt kimliğinden kısa ve kalıcı bir numara üretilir. */
export function receiptNumber(islem: Pick<Transaction, 'invoiceNo' | 'date' | 'id' | 'type'>): string {
  if (islem.invoiceNo) return islem.invoiceNo;
  const prefix = islem.type === 'collection' ? 'THS' : 'ODM';
  return `${prefix}-${(islem.date || '').replace(/-/g, '')}-${(islem.id || '').slice(0, 5).toUpperCase()}`;
}

export function receiptTitle(islem: Pick<Transaction, 'type' | 'linkedInvoiceId' | 'account' | 'description'>): string {
  return RECEIPT_TITLES[transactionTypeLabel(islem)] || (islem.type === 'collection' ? 'TAHSİLAT MAKBUZU' : 'ÖDEME MAKBUZU');
}

export async function createReceiptPdf(islem: Transaction, cari: Cari | undefined, branding: DocumentBranding, options: ReceiptPdfOptions = {}): Promise<GeneratedPdf> {
  const { jsPDF } = await import('jspdf');
  const paper: PaperSize = options.paper === 'a5' ? 'a5' : 'a4';
  const doc = new jsPDF({ unit: 'mm', format: paper, orientation: 'portrait', compress: true });
  preparePaper(doc, paper);
  // A4 için yazılmış sabit genişlikler sayfaya göre ölçeklenir
  const k = sizeK(doc);
  await registerPdfFonts(doc);

  const isCollection = islem.type === 'collection';
  const currency = normalizeCurrency(islem.currency);
  const accent = hexToRgb(branding.accentColor);
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - pageMargin(doc) * 2;
  const title = receiptTitle(islem);
  const number = receiptNumber(islem);
  const amount = roundMoney(islem.amount);

  doc.setProperties({ title: `${title} ${number}`, subject: islem.cariName || '', creator: 'Storm Ön Muhasebe' });

  let y = drawDocumentHeader(doc, branding, {
    title,
    meta: [
      { label: 'Makbuz No', value: number },
      { label: 'Tarih', value: formatDate(islem.date) },
    ],
  });

  // Taraf ve belge bilgileri
  const gap = 6;
  const boxWidth = (contentWidth - gap) / 2;
  const partyRows = [
    { value: cari?.name || islem.cariName || '-', bold: true },
    { value: cari?.address || '' },
    { label: 'Telefon', value: cari?.phone || '' },
    { label: 'Vergi D.', value: cari?.taxOffice || '' },
    { label: 'VKN/TCKN', value: cari?.taxNo || '' },
  ];
  const documentRows = [
    { label: 'Ödeme Şekli', value: PAYMENT_METHODS[islem.account || ''] || PAYMENT_METHODS[''] },
    { label: 'Hesap', value: options.accountName || '' },
    { label: 'Para Birimi', value: currency === 'TRY' ? 'Türk Lirası (TRY)' : currency },
    { label: 'Kur', value: currency !== 'TRY' && islem.exchangeRate ? `1 ${currency} = ${formatNumber(islem.exchangeRate, 4)} TL` : '' },
    { label: 'İlgili Fatura', value: options.linkedInvoiceNo || '' },
    { label: 'Cari Kodu', value: cari?.code || '' },
  ];
  const partyHeading = isCollection ? 'Ödemeyi Yapan' : 'Ödemeyi Alan';
  const boxHeight = Math.max(
    drawInfoBox(doc, branding, 0, 0, boxWidth, partyHeading, partyRows, undefined, true),
    drawInfoBox(doc, branding, 0, 0, boxWidth, 'Belge Bilgileri', documentRows, undefined, true),
  );
  drawInfoBox(doc, branding, pageMargin(doc), y, boxWidth, partyHeading, partyRows, boxHeight);
  drawInfoBox(doc, branding, pageMargin(doc) + boxWidth + gap, y, boxWidth, 'Belge Bilgileri', documentRows, boxHeight);
  y += boxHeight + 8;

  // Tutar bandı
  const band = tint(accent, 0.9);
  setText(doc, 9, COLORS.text);
  const words = branding.showAmountInWords ? (doc.splitTextToSize(amountToTurkishWords(amount, currency), contentWidth - 10) as string[]) : [];
  const bandHeight = 17 + (words.length ? words.length * 4.4 + 2 : 0);
  doc.setFillColor(band[0], band[1], band[2]);
  doc.roundedRect(pageMargin(doc), y, contentWidth, bandHeight, 2.5, 2.5, 'F');
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(pageMargin(doc), y + 2.5, 1.4, bandHeight - 5, 'F');
  setText(doc, 9, accent, 'bold');
  doc.text(isCollection ? 'TAHSİL EDİLEN TUTAR' : 'ÖDENEN TUTAR', pageMargin(doc) + 6, y + 10.5);
  setText(doc, 18, accent, 'bold');
  doc.text(formatMoney(amount, currency), pageWidth - pageMargin(doc) - 6, y + 11.5, { align: 'right' });
  if (words.length) {
    setText(doc, 9, COLORS.text);
    doc.text(words, pageMargin(doc) + 6, y + 19);
  }
  y += bandHeight + 7;

  // Açıklama
  if (islem.description) {
    setText(doc, 7.5, accent, 'bold');
    doc.text('AÇIKLAMA', pageMargin(doc), y);
    setText(doc, 9, COLORS.text);
    const lines = (doc.splitTextToSize(islem.description, contentWidth) as string[]).slice(0, 6);
    doc.text(lines, pageMargin(doc), y + 5);
    y += 5 + lines.length * 4.3 + 5;
  }

  // Cari hesap durumu
  const balance = branding.showBalance ? options.balance || null : null;
  if (balance) {
    const balanceWidth = Math.min(100, contentWidth);
    const balanceCurrency = normalizeCurrency(cari?.currency || islem.currency);
    const label = isCollection ? 'Bu Tahsilat' : 'Bu Ödeme';
    const h = drawBalanceBox(doc, branding, pageMargin(doc), y, balanceWidth, balance, balanceCurrency, label);
    y += h + 8;
  }

  // İmza alanı
  if (branding.showSignatureArea) {
    const sy = y + 4;
    const sigWidth = 60 * k;
    const labels = isCollection ? ['Ödemeyi Yapan', 'Tahsil Eden'] : ['Ödemeyi Yapan', 'Ödemeyi Alan'];
    [[labels[0], pageMargin(doc)], [labels[1], pageWidth - pageMargin(doc) - sigWidth]].forEach(([label, x]) => {
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
  const fileName = `${safeFileName(title.replace('MAKBUZU', 'Makbuz').replace('DEKONTU', 'Dekont'))}_${safeFileName(number)}_${safeFileName(cari?.name || islem.cariName || '')}.pdf`;
  return { blob, fileName: paper === 'a5' ? fileName.replace(/\.pdf$/, '_A5.pdf') : fileName, pageCount: doc.getNumberOfPages() };
}
