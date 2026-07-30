import { Stock, Cari } from '../types';

export interface PosCartItem {
  id: string; // Benzersiz sepet satır ID'si
  stockId: string;
  stockCode: string;
  stockName: string;
  unit: string;
  unitPrice: number; // Birim Satış Fiyatı (KDV Dahil)
  taxRate: number; // KDV Oranı (%)
  quantity: number; // Miktar
  discountRate: number; // Satır İskonto Yüzdesi (%)
  discountAmount: number; // Satır İskonto Tutarı (₺)
  totalLine: number; // Satır Toplamı (Net KDV dahil)
  barcode?: string;
  imageUrl?: string;
}

export interface PosPaymentSplit {
  cashAmount: number; // Nakit Ödenen Tutar (₺)
  cashReceived: number; // Nakit Verilen/Alınan Para (₺)
  changeGiven: number; // Müşteriye İade Edilen Para Üstü (₺)
  posAmount: number; // Kredi Kartı / POS ile Ödenen Tutar (₺)
  posAccountId?: string; // Seçili POS / Banka Hesabı ID
  openAccountAmount: number; // Açık Hesap / Veresiye Tutar (₺)
}

export interface PosParkedSale {
  id: string;
  createdAt: string;
  customerName: string;
  cariId?: string;
  items: PosCartItem[];
  note?: string;
  totalAmount: number;
}

export interface PosSaleSummary {
  receiptNo: string;
  date: string;
  time: string;
  items: PosCartItem[];
  paymentSplit: PosPaymentSplit;
  cariId?: string;
  cariName: string;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  note?: string;
}
