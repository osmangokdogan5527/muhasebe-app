/**
 * Satış belgesi penceresi (kasa satışı sonrası): termal fiş (80 / 58 mm) ya da fatura (A4 / A5).
 * Varsayılan fiş genişliği belge ayarlarından gelir; fatura için satış kaydı verilmelidir.
 */
import React, { useCallback, useEffect, useState } from 'react';
import type { Cari, Transaction } from '../../types';
import type { DocumentBalance } from '../../utils/cariLedger';
import type { PosSaleSummary } from '../../types/pos';
import { logError } from '../../utils/errorLogger';
import { ReceiptSaleData, createPosReceiptPdf } from '../../pdf/posReceiptPdf';
import { createInvoicePdf } from '../../pdf/invoicePdf';
import { useDocumentBranding } from '../../pdf/useDocumentBranding';
import { formatMoney } from '../../pdf/format';
import { PdfPreviewModal } from './PdfPreviewModal';
import { PdfOptionTabs } from './PdfOptionTabs';
import { usePaperSize } from './usePaperSize';
import { DocumentFormat, SALE_FORMAT_OPTIONS, isReceiptFormat, paperOf, receiptFormatFor, receiptWidthOf } from './documentFormat';

export interface ReceiptInvoiceSource {
  /** Fatura olarak basılacak satış kaydı */
  islem: Transaction;
  cari?: Cari;
  /** Bağlı nakit / kart tahsilatları (ödeme satırı için) */
  linkedReceipts?: Transaction[];
  /** Cari bakiye özeti (veresiyede) */
  balance?: DocumentBalance | null;
}


/** Kasa / telefon satışının özetinden, aynı satışı fatura olarak basmak için kayıt karşılığı üretir */
export function invoiceSourceFromSummary(sale: PosSaleSummary, cariler: Cari[]): ReceiptInvoiceSource | undefined {
  try {
    const id = sale.receiptNo;
    const islem: Transaction = {
      id,
      invoiceNo: sale.receiptNo,
      type: 'sale',
      cariId: sale.cariId || '',
      cariName: sale.cariName,
      date: sale.date,
      amount: sale.grandTotal,
      account: '',
      description: '',
      items: sale.items.map((item) => ({
        stockId: item.stockId,
        stockName: item.stockName,
        quantity: item.quantity,
        unit: item.unit,
        price: item.unitPrice,
        taxRate: item.taxRate,
        total: item.totalLine,
      })),
      createdAt: new Date().toISOString(),
      currency: 'TRY',
    };
    const split = sale.paymentSplit;
    const linkedReceipts: Transaction[] = [
      ...(split.cashAmount > 0.004 ? [{ id: `${id}-cash`, type: 'collection' as const, cariId: islem.cariId, cariName: islem.cariName, date: islem.date, amount: split.cashAmount, account: 'cash' as const, description: '', createdAt: islem.createdAt, linkedInvoiceId: id }] : []),
      ...(split.posAmount > 0.004 ? [{ id: `${id}-pos`, type: 'collection' as const, cariId: islem.cariId, cariName: islem.cariName, date: islem.date, amount: split.posAmount, account: 'pos' as const, description: '', createdAt: islem.createdAt, linkedInvoiceId: id }] : []),
    ];
    const credit = sale.credit;
    return {
      islem,
      cari: cariler.find((c) => c.id === sale.cariId),
      linkedReceipts,
      balance: credit ? { before: credit.balanceBefore, effect: credit.amount, after: credit.balanceAfter, current: credit.balanceAfter } : null,
    };
  } catch (err: any) {
    logError(err instanceof Error ? err : new Error(String(err)), 'ReceiptPdfModal.invoiceSourceFromSummary');
    return undefined;
  }
}

export interface ReceiptPdfModalProps {
  data: ReceiptSaleData;
  title?: string;
  /** Verilirse fatura (A4 / A5) seçenekleri de çıkar */
  invoice?: ReceiptInvoiceSource;
  onClose: () => void;
}

export const ReceiptPdfModal: React.FC<ReceiptPdfModalProps> = ({ data, title = 'Satış Fişi', invoice, onClose }) => {
  const { branding, isLoaded } = useDocumentBranding();
  const [, setPaper] = usePaperSize();
  const [format, setFormat] = useState<DocumentFormat>(receiptFormatFor(branding.receiptWidth));
  const [touched, setTouched] = useState(false);

  // Ayar yüklenince (kullanıcı henüz seçim yapmadıysa) firmanın varsayılan fiş genişliği kullanılır
  useEffect(() => {
    if (isLoaded && !touched) setFormat(receiptFormatFor(branding.receiptWidth));
  }, [isLoaded, touched, branding.receiptWidth]);

  const generate = useCallback(() => {
    if (invoice && !isReceiptFormat(format)) {
      return createInvoicePdf(invoice.islem, invoice.cari, branding, {
        balance: invoice.balance || null,
        paper: paperOf(format),
        linkedReceipts: invoice.linkedReceipts,
      });
    }
    return createPosReceiptPdf(data, branding, receiptWidthOf(format));
  }, [data, branding, format, invoice]);

  const options = invoice ? SALE_FORMAT_OPTIONS : SALE_FORMAT_OPTIONS.filter((o) => isReceiptFormat(o.value));

  return (
    <PdfPreviewModal
      isOpen
      title={title}
      subtitle={`${data.receiptNo}  ·  ${formatMoney(data.grandTotal, data.currency)}`}
      shareText={`${branding.firmName || 'Firmamız'} - Satış ${isReceiptFormat(format) ? 'fişi' : 'faturası'} ${data.receiptNo}`}
      ready={isLoaded}
      generate={generate}
      toolbar={
        <PdfOptionTabs<DocumentFormat>
          label="Belge"
          value={format}
          options={options}
          onChange={(next) => {
            setTouched(true);
            setFormat(next);
            if (!isReceiptFormat(next)) setPaper(paperOf(next));
          }}
        />
      }
      onClose={onClose}
    />
  );
};
