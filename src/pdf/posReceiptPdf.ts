/**
 * POS satış fişi PDF'i: termal rulo kağıt (80 mm ya da 58 mm), uzunluk içeriğe göre.
 * Bilgi fişidir (mali değeri yoktur). Kullanıcı PDF'i açıp fiş yazıcısından basar.
 */
import type { jsPDF as JsPdfType } from 'jspdf';
import { Transaction } from '../types';
import { PosSaleSummary } from '../types/pos';
import { roundMoney } from '../utils/invoiceMath';
import { DocumentBranding, ReceiptWidth } from './branding';
import { registerPdfFonts, PDF_FONT, PDF_FONT_SEMIBOLD } from './fonts';
import { DocumentCurrency, formatBalance, formatDate, formatMoney, formatQuantity, normalizeCurrency, safeFileName } from './format';
import type { GeneratedPdf } from './invoicePdf';

export interface ReceiptLine {
  name: string;
  quantity: number;
  unit: string;
  /** KDV dahil birim fiyat */
  unitPrice: number;
  discountAmount: number;
  discountRate: number;
  /** KDV dahil, satır iskontosu düşülmüş tutar */
  lineTotal: number;
  /** KDV oranı (%); bilinmiyorsa tanımsız */
  taxRate?: number;
}

export interface ReceiptSaleData {
  receiptNo: string;
  date: string;
  time?: string;
  cariName: string;
  isRetail: boolean;
  lines: ReceiptLine[];
  totalTax: number;
  grandTotal: number;
  payments: { label: string; amount: number }[];
  cashReceived?: number;
  change?: number;
  note?: string;
  currency: DocumentCurrency;
  /** Veresiye: açık hesaba yazılan tutar ve (varsa) carinin satış öncesi / sonrası bakiyesi */
  credit?: { amount: number; balanceBefore?: number; balanceAfter?: number };
}

const RETAIL_NAMES = new Set(['perakende müşteri', 'perakende']);

export function receiptDataFromPosSummary(summary: PosSaleSummary): ReceiptSaleData {
  const split = summary.paymentSplit;
  const payments = [
    { label: 'Nakit', amount: split.cashAmount || 0 },
    { label: 'Kredi Kartı', amount: split.posAmount || 0 },
    { label: 'Açık Hesap (Veresiye)', amount: split.openAccountAmount || 0 },
  ].filter((p) => p.amount > 0.004);
  return {
    receiptNo: summary.receiptNo,
    date: summary.date,
    time: summary.time,
    cariName: summary.cariName || 'Perakende Müşteri',
    isRetail: !summary.cariId || RETAIL_NAMES.has((summary.cariName || '').toLocaleLowerCase('tr-TR')),
    lines: summary.items.map((item) => ({
      name: item.stockName,
      quantity: item.quantity,
      unit: item.unit || 'Adet',
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount || 0,
      discountRate: item.discountRate || 0,
      lineTotal: item.totalLine,
      taxRate: Number(item.taxRate) || 0,
    })),
    totalTax: summary.totalTax,
    grandTotal: summary.grandTotal,
    payments,
    cashReceived: split.cashReceived > split.cashAmount ? split.cashReceived : undefined,
    change: split.changeGiven > 0.004 ? split.changeGiven : undefined,
    note: summary.note,
    currency: 'TRY',
    credit: summary.credit && summary.credit.amount > 0.004 ? { ...summary.credit } : undefined,
  };
}

const ACCOUNT_PAYMENT_LABEL: Record<string, string> = {
  cash: 'Nakit',
  bank: 'Banka / Havale',
  pos: 'Kredi Kartı',
  '': 'Açık Hesap (Veresiye)',
};

export interface ReceiptTransactionOptions {
  /** Satışla birlikte yazılan peşin tahsilatlar (nakit / kart); verilmezse fatura hesabı esas alınır */
  linkedReceipts?: Transaction[];
  /** Carinin satış öncesi bakiyesi (veresiye bölümünde gösterilir) */
  balanceBefore?: number;
}

/** Kayıtlı bir satış (İşlemler listesinden) için fiş verisi. Satırlar KDV dahil fiyatla gösterilir. */
export function receiptDataFromTransaction(islem: Transaction, isRetail: boolean, options: ReceiptTransactionOptions = {}): ReceiptSaleData {
  const items = Array.isArray(islem.items) ? islem.items : [];
  const lines: ReceiptLine[] = items.map((item) => {
    const lineTotal = roundMoney(Number(item.total) || 0);
    const quantity = Number(item.quantity) || 0;
    return {
      name: item.stockName,
      quantity,
      unit: item.unit || 'Adet',
      unitPrice: quantity ? lineTotal / quantity : lineTotal,
      discountAmount: 0,
      discountRate: 0,
      lineTotal,
      taxRate: Number(item.taxRate) || 0,
    };
  });
  // Ödeme dağılımı: kasadan yapılan satışta tahsilat faturanın kendisinde değil, bağlı kayıtlardadır
  const grandTotal = roundMoney(Number(islem.amount) || 0);
  let payments: { label: string; amount: number }[];
  let openAmount = 0;
  if (islem.account) {
    payments = [{ label: ACCOUNT_PAYMENT_LABEL[islem.account] || 'Ödeme', amount: grandTotal }];
  } else {
    const linked = (options.linkedReceipts || []).filter((r) => r && r.linkedInvoiceId === islem.id);
    const byLabel = new Map<string, number>();
    linked.forEach((r) => {
      const label = ACCOUNT_PAYMENT_LABEL[r.account || ''] || 'Ödeme';
      byLabel.set(label, roundMoney((byLabel.get(label) || 0) + (Number(r.amount) || 0)));
    });
    const paid = roundMoney([...byLabel.values()].reduce((sum, v) => sum + v, 0));
    openAmount = roundMoney(Math.max(0, grandTotal - paid));
    payments = [...byLabel.entries()].map(([label, amount]) => ({ label, amount }));
    if (openAmount > 0.004) payments.push({ label: ACCOUNT_PAYMENT_LABEL[''], amount: openAmount });
  }
  const credit = openAmount > 0.004 && !isRetail
    ? {
        amount: openAmount,
        balanceBefore: options.balanceBefore,
        balanceAfter: options.balanceBefore !== undefined ? roundMoney(options.balanceBefore + openAmount) : undefined,
      }
    : undefined;

  const totalTax = items.reduce((sum, item) => {
    const total = Number(item.total) || 0;
    const rate = Number(item.taxRate) || 0;
    return sum + (total - total / (1 + rate / 100));
  }, 0);
  return {
    receiptNo: islem.invoiceNo || islem.id,
    date: islem.date,
    time: islem.createdAt && islem.createdAt.length >= 16 ? new Date(islem.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : undefined,
    cariName: islem.cariName || 'Perakende Müşteri',
    isRetail,
    lines: lines.length ? lines : [{ name: islem.description || 'Satış', quantity: 1, unit: 'Adet', unitPrice: islem.amount, discountAmount: 0, discountRate: 0, lineTotal: islem.amount }],
    totalTax: roundMoney(totalTax),
    grandTotal: roundMoney(islem.amount),
    payments,
    note: islem.description && !/^POS Satışı/i.test(islem.description) ? islem.description : undefined,
    currency: normalizeCurrency(islem.currency),
    credit,
  };
}

const MM_PER_PT = 0.3528;

interface ReceiptMetrics {
  width: number;
  margin: number;
  base: number;
}

function metricsFor(width: ReceiptWidth): ReceiptMetrics {
  return width === 58 ? { width: 58, margin: 3, base: 6.8 } : { width: 80, margin: 4, base: 7.6 };
}

/** Fişi verilen belgeye çizer ve son y konumunu döndürür (ilk geçişte yükseklik ölçmek için de kullanılır). */
function drawReceipt(doc: JsPdfType, data: ReceiptSaleData, branding: DocumentBranding, m: ReceiptMetrics): number {
  const left = m.margin;
  const right = m.width - m.margin;
  const cw = right - left;
  const center = m.width / 2;
  const lh = (size: number) => size * MM_PER_PT * 1.32;
  let y = m.margin + 1;

  const font = (size: number, weight: 'normal' | 'bold' | 'semibold' = 'normal', gray = false) => {
    if (weight === 'semibold') doc.setFont(PDF_FONT_SEMIBOLD, 'normal');
    else doc.setFont(PDF_FONT, weight);
    doc.setFontSize(size);
    const c = gray ? 90 : 0;
    doc.setTextColor(c, c, c);
  };
  const centered = (text: string, size: number, weight: 'normal' | 'bold' | 'semibold' = 'normal', gray = false) => {
    font(size, weight, gray);
    const lines = doc.splitTextToSize(text, cw) as string[];
    lines.forEach((line) => {
      y += lh(size);
      doc.text(line, center, y - lh(size) * 0.25, { align: 'center' });
    });
  };
  const pair = (label: string, value: string, size: number, weight: 'normal' | 'bold' | 'semibold' = 'normal') => {
    font(size, weight);
    const valueWidth = doc.getTextWidth(value);
    const labelLines = doc.splitTextToSize(label, Math.max(10, cw - valueWidth - 2)) as string[];
    labelLines.forEach((line, i) => {
      y += lh(size);
      doc.text(line, left, y - lh(size) * 0.25);
      if (i === 0) doc.text(value, right, y - lh(size) * 0.25, { align: 'right' });
    });
  };
  const dashed = () => {
    y += 2;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([0.8, 0.8], 0);
    doc.line(left, y, right, y);
    doc.setLineDashPattern([], 0);
    y += 1.2;
  };
  const money = (value: number) => formatMoney(value, data.currency);

  // Firma
  if (branding.logoDataUrl) {
    try {
      const props = doc.getImageProperties(branding.logoDataUrl);
      const maxW = cw * 0.6;
      const maxH = 14;
      const ratio = Math.min(maxW / props.width, maxH / props.height);
      const w = props.width * ratio;
      const h = props.height * ratio;
      doc.addImage(branding.logoDataUrl, props.fileType || 'PNG', center - w / 2, y, w, h, undefined, 'FAST');
      y += h + 1;
    } catch {
      // Logo okunamazsa yalnızca firma adı yazılır
    }
  }
  centered(branding.firmName || 'Firma', m.base + 2, 'bold');
  if (branding.address) centered(branding.address, m.base - 1, 'normal', true);
  const contact = [branding.phone && `Tel: ${branding.phone}`].filter(Boolean).join('');
  if (contact) centered(contact, m.base - 1, 'normal', true);
  const tax = [branding.taxOffice && `${branding.taxOffice} V.D.`, branding.taxNumber && `VKN: ${branding.taxNumber}`].filter(Boolean).join('  ');
  if (tax) centered(tax, m.base - 1, 'normal', true);

  dashed();
  centered('SATIŞ FİŞİ', m.base + 1.5, 'bold');
  pair('Fiş No', data.receiptNo, m.base - 0.6);
  pair('Tarih', `${formatDate(data.date)}${data.time ? ` ${data.time}` : ''}`, m.base - 0.6);
  if (!data.isRetail) pair('Müşteri', data.cariName, m.base - 0.6, 'semibold');

  // Kalemler
  dashed();
  data.lines.forEach((line) => {
    font(m.base, 'semibold');
    const nameLines = doc.splitTextToSize(line.name, cw) as string[];
    nameLines.forEach((text) => {
      y += lh(m.base);
      doc.text(text, left, y - lh(m.base) * 0.25);
    });
    const gross = roundMoney(line.unitPrice * line.quantity);
    pair(`${formatQuantity(line.quantity)} ${line.unit} x ${money(line.unitPrice)}`, money(gross), m.base - 0.4);
    if (line.discountAmount > 0.004) {
      pair(`İskonto${line.discountRate ? ` (%${formatQuantity(line.discountRate)})` : ''}`, `- ${money(line.discountAmount)}`, m.base - 0.8);
    }
    y += 0.8;
  });

  // Toplamlar
  dashed();
  const gross = roundMoney(data.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
  const discount = roundMoney(gross - data.grandTotal);
  if (discount > 0.004) {
    pair('Ara Toplam', money(gross), m.base);
    pair('İskonto', `- ${money(discount)}`, m.base);
  }
  // KDV'siz satışta KDV satırı yazılmaz; tek oran varsa oranıyla yazılır
  if (data.totalTax > 0.004) {
    const rates = [...new Set(data.lines.map((line) => Number(line.taxRate) || 0).filter((rate) => rate > 0))];
    pair(rates.length === 1 ? `KDV %${formatQuantity(rates[0])} (dahil)` : 'KDV (dahil)', money(data.totalTax), m.base - 0.4);
  }
  y += 0.8;
  pair('TOPLAM', money(data.grandTotal), m.base + 3.5, 'bold');
  y += 0.6;

  // Ödemeler
  dashed();
  data.payments.forEach((p) => pair(p.label, money(p.amount), m.base));
  if (data.cashReceived) pair('Alınan Nakit', money(data.cashReceived), m.base);
  if (data.change) pair('Para Üstü', money(data.change), m.base, 'semibold');

  // Veresiye (açık hesap) bölümü
  if (data.credit && data.credit.amount > 0.004) {
    dashed();
    centered('AÇIK HESAP (VERESİYE)', m.base + 0.6, 'bold');
    centered(`${money(data.credit.amount)} hesabınıza borç yazılmıştır.`, m.base - 0.6);
    if (branding.showBalance !== false && data.credit.balanceBefore !== undefined && data.credit.balanceAfter !== undefined) {
      y += 0.6;
      pair('Önceki Bakiye', formatBalance(data.credit.balanceBefore, data.currency), m.base - 0.6);
      pair('Bu Satış', `+ ${money(data.credit.amount)}`, m.base - 0.6);
      pair('Güncel Bakiye', formatBalance(data.credit.balanceAfter, data.currency), m.base, 'bold');
    }
    if (branding.showSignatureArea !== false) {
      y += 7;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.line(left + cw * 0.15, y, right - cw * 0.15, y);
      centered('Müşteri İmzası', m.base - 1.4, 'normal', true);
    }
  }

  // Not ve alt bilgi
  if (data.note || branding.footerNote) {
    dashed();
    if (data.note) centered(data.note, m.base - 0.6);
    if (branding.footerNote) centered(branding.footerNote, m.base - 1, 'normal', true);
  }
  dashed();
  centered('Bizi tercih ettiğiniz için teşekkür ederiz.', m.base - 0.4, 'semibold');
  centered('Bilgi fişidir, mali değeri yoktur.', m.base - 1.6, 'normal', true);
  return y + m.margin;
}

export async function createPosReceiptPdf(data: ReceiptSaleData, branding: DocumentBranding, width: ReceiptWidth = branding.receiptWidth): Promise<GeneratedPdf> {
  const { jsPDF } = await import('jspdf');
  const m = metricsFor(width);

  // 1. geçiş: yüksekliği ölç
  const probe = new jsPDF({ unit: 'mm', format: [m.width, 2000], orientation: 'portrait' });
  await registerPdfFonts(probe);
  // Fiş her zaman genişliğinden uzun olmalı; aksi halde PDF sayfayı yan çevirir ve fişin sağı kesilir
  const height = Math.max(m.width + 10, Math.ceil(drawReceipt(probe, data, branding, m)));

  // 2. geçiş: tam uzunlukta çiz
  const doc = new jsPDF({ unit: 'mm', format: [m.width, height], orientation: 'portrait', compress: true });
  await registerPdfFonts(doc);
  doc.setProperties({ title: `Satış Fişi ${data.receiptNo}`, creator: 'Storm Ön Muhasebe' });
  drawReceipt(doc, data, branding, m);

  return {
    blob: doc.output('blob'),
    fileName: `Fis_${safeFileName(data.receiptNo)}_${m.width}mm.pdf`,
    pageCount: 1,
  };
}
