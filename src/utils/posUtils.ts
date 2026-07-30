import { Stock } from '../types';
import { PosCartItem, PosPaymentSplit } from '../types/pos';
import { reportErrorToTelegram } from './telegramLogger';

/**
 * Barkod veya Arama Terimine göre stok bulur
 */
export function findStockByBarcodeOrSearch(stocks: Stock[], searchTerm: string): Stock | null {
  try {
    if (!searchTerm || !searchTerm.trim()) return null;
    const cleanTerm = searchTerm.trim().toLowerCase();

    // 1. Birebir Barkod Eşleşmesi
    const exactBarcode = stocks.find(s => s.barcode && s.barcode.trim().toLowerCase() === cleanTerm);
    if (exactBarcode) return exactBarcode;

    // 2. Birebir Stok Kodu Eşleşmesi
    const exactCode = stocks.find(s => s.code && s.code.trim().toLowerCase() === cleanTerm);
    if (exactCode) return exactCode;

    // 3. Stok Adı İçerenler
    const matchName = stocks.find(s => s.name && s.name.toLowerCase().includes(cleanTerm));
    if (matchName) return matchName;

    return null;
  } catch (err: any) {
    reportErrorToTelegram(err, 'posUtils:findStockByBarcodeOrSearch');
    return null;
  }
}

/**
 * Satır toplamını KDV ve İskonto dahil hesaplar
 */
export function calculateLineTotal(unitPrice: number, quantity: number, discountRate: number = 0): {
  discountAmount: number;
  totalLine: number;
} {
  const gross = unitPrice * quantity;
  const discountAmount = (gross * discountRate) / 100;
  const totalLine = Math.max(0, gross - discountAmount);
  return { discountAmount, totalLine };
}

/**
 * Benzersiz Fiş Numarası Üretir (Örn: POS-20260729-1024)
 */
export function generateReceiptNo(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `POS-${dateStr}-${randomSuffix}`;
}

/**
 * Sepet genel özetini ve KDV dağılımını hesaplar
 */
export function calculateCartSummary(
  items: PosCartItem[],
  generalDiscountVal: number = 0,
  discountMode: 'percent' | 'amount' | 'target' = 'percent',
  globalTaxRate: number = 0
) {
  try {
    let rawTotal = 0;
    let totalLineDiscount = 0;

    items.forEach((item) => {
      const lineGross = item.unitPrice * item.quantity;
      rawTotal += lineGross;
      totalLineDiscount += item.discountAmount || 0;
    });

    const subtotalAfterLineDiscounts = Math.max(0, rawTotal - totalLineDiscount);

    // Genel İskonto Hesaplama
    let generalDiscountAmount = 0;
    const val = typeof generalDiscountVal === 'number' ? generalDiscountVal : Number(generalDiscountVal) || 0;

    if (discountMode === 'percent') {
      const rate = Math.min(100, Math.max(0, val));
      generalDiscountAmount = (subtotalAfterLineDiscounts * rate) / 100;
    } else if (discountMode === 'amount') {
      generalDiscountAmount = Math.min(subtotalAfterLineDiscounts, Math.max(0, val));
    } else if (discountMode === 'target') {
      // Alınması Gereken Tutar (Net Ödenecek)
      const target = Math.max(0, val);
      if (target > 0 && target < subtotalAfterLineDiscounts) {
        generalDiscountAmount = subtotalAfterLineDiscounts - target;
      } else {
        generalDiscountAmount = 0;
      }
    }

    const grandTotal = Math.max(0, subtotalAfterLineDiscounts - generalDiscountAmount);
    const totalDiscount = totalLineDiscount + generalDiscountAmount;

    // KDV Hesaplama (Varsayılan %0 KDV)
    let totalTax = 0;
    if (globalTaxRate > 0) {
      totalTax = grandTotal - grandTotal / (1 + globalTaxRate / 100);
    }

    const taxBase = grandTotal - totalTax;

    return {
      rawTotal,
      totalLineDiscount,
      generalDiscountAmount,
      totalDiscount,
      subtotalAfterLineDiscounts,
      taxBase: Number(taxBase.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
    };
  } catch (err: any) {
    reportErrorToTelegram(err, 'posUtils:calculateCartSummary');
    return {
      rawTotal: 0,
      totalLineDiscount: 0,
      generalDiscountAmount: 0,
      totalDiscount: 0,
      subtotalAfterLineDiscounts: 0,
      taxBase: 0,
      totalTax: 0,
      grandTotal: 0,
    };
  }
}

/**
 * Parçalı ödemedeki kalan borcu ve para üstünü hesaplar
 */
export function calculatePaymentBalance(grandTotal: number, payment: PosPaymentSplit) {
  const totalPaid = (payment.cashAmount || 0) + (payment.posAmount || 0) + (payment.openAccountAmount || 0);
  const remaining = Math.max(0, Number((grandTotal - totalPaid).toFixed(2)));
  
  // Nakit ödemedeki iade verilecek para üstü
  const changeGiven = payment.cashReceived > payment.cashAmount
    ? Number((payment.cashReceived - payment.cashAmount).toFixed(2))
    : 0;

  return {
    totalPaid: Number(totalPaid.toFixed(2)),
    remaining,
    isFullyPaid: remaining <= 0.01,
    changeGiven
  };
}
