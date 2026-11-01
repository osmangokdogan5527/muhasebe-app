/**
 * Stok satış fiyatının KDV durumu ve fiyat dönüşümleri.
 *
 * Stok kartındaki "Satış Fiyatı" iki şekilde girilebilir:
 *  - KDV dahil (etiket / raf fiyatı): kasada aynen tahsil edilir, faturada KDV'den arındırılır.
 *  - KDV hariç (net fiyat): faturada aynen birim fiyat olur, kasada ve etikette KDV eklenir.
 *
 * Alanı hiç olmayan (1.8.6 öncesi) stoklar KDV dahil kabul edilir; çünkü kasa ve etiket bu fiyatı
 * zaten olduğu gibi kullanıyordu. Yeni stok kartları varsayılan olarak KDV hariç açılır.
 */
import type { Stock } from '../types';
import { logError } from './errorLogger';

/** Yeni açılan stok kartlarında anahtarın varsayılan konumu */
export const NEW_STOCK_SALES_PRICE_INCLUDES_TAX = false;

type PricedStock = Pick<Stock, 'salesPrice' | 'taxRate'> & { salesPriceIncludesTax?: boolean };

/** Birim fiyatlarda kuruş altı hassasiyet korunur; tutarlar satırda 2 haneye yuvarlanır */
function roundUnitPrice(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function rateOf(stock: PricedStock): number {
  const rate = Number(stock.taxRate);
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

/** Stokun satış fiyatı KDV dahil mi? (alan yoksa eski davranış: dahil) */
export function salesPriceIncludesTax(stock: PricedStock | null | undefined): boolean {
  if (!stock) return true;
  return stock.salesPriceIncludesTax !== false;
}

/** Faturada kullanılacak KDV hariç birim satış fiyatı */
export function netSalesPrice(stock: PricedStock | null | undefined): number {
  try {
    if (!stock) return 0;
    const price = Number(stock.salesPrice) || 0;
    if (!salesPriceIncludesTax(stock)) return price;
    const rate = rateOf(stock);
    return rate > 0 ? roundUnitPrice(price / (1 + rate / 100)) : price;
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'stockPricing.netSalesPrice');
    return Number(stock?.salesPrice) || 0;
  }
}

/** Kasada, sahada ve etikette kullanılacak KDV dahil satış fiyatı */
export function grossSalesPrice(stock: PricedStock | null | undefined): number {
  try {
    if (!stock) return 0;
    const price = Number(stock.salesPrice) || 0;
    if (salesPriceIncludesTax(stock)) return price;
    const rate = rateOf(stock);
    return rate > 0 ? Math.round(price * (1 + rate / 100) * 100) / 100 : price;
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'stockPricing.grossSalesPrice');
    return Number(stock?.salesPrice) || 0;
  }
}

/** Kısa açıklama: "KDV dahil" / "KDV hariç" */
export function salesPriceTaxLabel(stock: PricedStock | null | undefined): string {
  return salesPriceIncludesTax(stock) ? 'KDV dahil' : 'KDV hariç';
}
