/**
 * Storm Ön Muhasebe - Fatura Satırı Hesaplamaları
 *
 * Birim fiyat KDV hariçtir. Net tutar ve KDV satır bazında kuruşa yuvarlanır,
 * satır toplamı bu iki yuvarlanmış değerin toplamıdır. Böylece ekrandaki ara
 * toplam + KDV her zaman genel toplama eşit olur ve bakiyelerde küsurat birikmez.
 */

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface InvoiceLineAmounts {
  net: number;
  tax: number;
  total: number;
}

export function calculateInvoiceLine(quantity: number, unitPrice: number, taxRate: number): InvoiceLineAmounts {
  const net = roundMoney((Number(quantity) || 0) * (Number(unitPrice) || 0));
  const tax = roundMoney(net * ((Number(taxRate) || 0) / 100));
  return { net, tax, total: roundMoney(net + tax) };
}

export function calculateInvoiceTotals(items: { quantity: number; price: number; taxRate: number }[]) {
  let subtotal = 0;
  let totalTax = 0;
  (Array.isArray(items) ? items : []).forEach((item) => {
    const line = calculateInvoiceLine(item.quantity, item.price, item.taxRate);
    subtotal += line.net;
    totalTax += line.tax;
  });
  subtotal = roundMoney(subtotal);
  totalTax = roundMoney(totalTax);
  return { subtotal, totalTax, grandTotal: roundMoney(subtotal + totalTax) };
}

export interface VatGroup {
  rate: number;
  net: number;
  tax: number;
}

// Kalemi olmayan eski faturalar için KDV raporunda kullanılan varsayılan oran
const ITEMLESS_INVOICE_VAT_RATE = 20;

/**
 * Bir faturanın tutarını KDV oranlarına göre matrah ve KDV olarak böler.
 *
 * Satır toplamları (item.total) KDV dahildir; fatura formu fiyatın üstüne KDV ekler,
 * POS ise KDV dahil fiyat kaydeder. Matrah her iki durumda da toplamdan geri hesaplanır.
 * POS genel iskontosu satır toplamlarına yansımadığı için gruplar faturanın gerçek
 * tutarına (amount) oranlanır; böylece matrah + KDV her zaman amount'a eşit olur.
 */
export function splitInvoiceVat(invoice: {
  amount: number;
  items?: { quantity: number; price: number; taxRate: number; total?: number }[];
}): VatGroup[] {
  const amount = Number(invoice.amount) || 0;
  const items = Array.isArray(invoice.items) ? invoice.items : [];

  const groups = new Map<number, { total: number; net: number }>();
  let itemsTotal = 0;
  items.forEach((item) => {
    if (!item) return;
    const rate = Number(item.taxRate) || 0;
    const lineTotal = item.total !== undefined && item.total !== null
      ? Number(item.total) || 0
      : calculateInvoiceLine(item.quantity, item.price, rate).total;
    const group = groups.get(rate) || { total: 0, net: 0 };
    group.total += lineTotal;
    group.net += lineTotal / (1 + rate / 100);
    groups.set(rate, group);
    itemsTotal += lineTotal;
  });

  if (itemsTotal <= 0) {
    const net = amount / (1 + ITEMLESS_INVOICE_VAT_RATE / 100);
    return [{ rate: ITEMLESS_INVOICE_VAT_RATE, net, tax: amount - net }];
  }

  const factor = amount / itemsTotal;
  return Array.from(groups.entries()).map(([rate, group]) => ({
    rate,
    net: group.net * factor,
    tax: (group.total - group.net) * factor,
  }));
}

/**
 * Excel içe aktarmada açılış bakiyesi için oluşturulan kayıtlar satış/alış tipindedir
 * ama gerçek bir satış ya da alış değildir; raporlarda gelir/gider sayılmamalıdır.
 */
export function isOpeningBalanceTransaction(islem: {
  isOpeningBalance?: boolean;
  items?: unknown[];
  description?: string;
}): boolean {
  if (islem.isOpeningBalance) return true;
  const hasItems = Array.isArray(islem.items) && islem.items.length > 0;
  return !hasItems && (islem.description || '').trim() === 'Açılış Bakiyesi';
}
