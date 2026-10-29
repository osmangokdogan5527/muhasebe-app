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
