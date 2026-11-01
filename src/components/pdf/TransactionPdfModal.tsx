/**
 * İşlem PDF penceresi: faturalar (satış, alış, iade) ve tahsilat/ödeme makbuzları.
 * Firmanın belge ayarlarını okur, carinin belge öncesi/sonrası bakiyesini hesaplar.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { BankAccount, Cari, Transaction } from '../../types';
import { createInvoicePdf, isInvoiceTransaction } from '../../pdf/invoicePdf';
import { createReceiptPdf, receiptNumber, receiptTitle } from '../../pdf/receiptPdf';
import { createPosReceiptPdf, receiptDataFromTransaction } from '../../pdf/posReceiptPdf';
import { useDocumentBranding } from '../../pdf/useDocumentBranding';
import { formatDate } from '../../pdf/format';
import { documentBalance } from '../../utils/cariLedger';
import { RETAIL_CARI_ID } from '../../firebase';
import { PdfPreviewModal } from './PdfPreviewModal';
import { PdfOptionTabs } from './PdfOptionTabs';
import { usePaperSize, PAPER_OPTIONS } from './usePaperSize';

const INVOICE_TITLES: Record<string, string> = {
  sale: 'Satış Faturası',
  purchase: 'Alış Faturası',
  sale_return: 'Satış İade Faturası',
  purchase_return: 'Alış İade Faturası',
};

const ACCOUNT_TYPES: Record<string, BankAccount['type']> = { cash: 'kasa', bank: 'banka', pos: 'pos' };

export interface TransactionPdfModalProps {
  transaction: Transaction;
  cariler: Cari[];
  islemler: Transaction[];
  bankAccounts?: BankAccount[];
  onClose: () => void;
}

function titleCase(upper: string): string {
  return upper.toLocaleLowerCase('tr-TR').replace(/(^|\s)(\S)/g, (_m, space, ch) => `${space}${ch.toLocaleUpperCase('tr-TR')}`);
}

export const TransactionPdfModal: React.FC<TransactionPdfModalProps> = ({ transaction, cariler, islemler, bankAccounts = [], onClose }) => {
  const { branding, isLoaded } = useDocumentBranding();
  const cari = cariler.find((c) => c.id === transaction.cariId);
  const isInvoice = isInvoiceTransaction(transaction);
  // Kasadan (POS) yapılan satışlar fiş olarak da alınabilir
  const isPosSale = transaction.type === 'sale' && /^POS-/i.test(transaction.invoiceNo || '');
  const [format, setFormat] = useState<'a4' | 'receipt'>(isPosSale ? 'receipt' : 'a4');
  const [paper, setPaper] = usePaperSize();
  const title = isInvoice ? INVOICE_TITLES[transaction.type] || 'Fatura' : titleCase(receiptTitle(transaction));
  const number = isInvoice ? transaction.invoiceNo || '' : receiptNumber(transaction);

  // Perakende müşteride ve cari bulunamazsa bakiye gösterilmez
  const balance = useMemo(() => {
    if (!cari || cari.id === RETAIL_CARI_ID) return null;
    return documentBalance(cari, islemler, transaction.id);
  }, [cari, islemler, transaction.id]);

  const accountName = useMemo(() => {
    if (transaction.bankAccountId) {
      const found = bankAccounts.find((a) => a.id === transaction.bankAccountId);
      if (found) return found.name;
    }
    const type = ACCOUNT_TYPES[transaction.account || ''];
    const defaults = type ? bankAccounts.filter((a) => a.type === type) : [];
    return defaults.length === 1 ? defaults[0].name : '';
  }, [transaction.bankAccountId, transaction.account, bankAccounts]);

  const linkedInvoiceNo = useMemo(() => {
    if (!transaction.linkedInvoiceId) return '';
    return islemler.find((t) => t.id === transaction.linkedInvoiceId)?.invoiceNo || '';
  }, [transaction.linkedInvoiceId, islemler]);

  const generate = useCallback(() => {
    if (isPosSale && format === 'receipt') {
      const isRetail = !cari || cari.id === RETAIL_CARI_ID;
      return createPosReceiptPdf(receiptDataFromTransaction(transaction, isRetail, {
        linkedReceipts: islemler.filter((t) => t.linkedInvoiceId === transaction.id),
        balanceBefore: balance ? balance.before : undefined,
      }), branding);
    }
    return isInvoice
      ? createInvoicePdf(transaction, cari, branding, { balance, paper })
      : createReceiptPdf(transaction, cari, branding, { balance, accountName, linkedInvoiceNo, paper });
  }, [isPosSale, format, isInvoice, transaction, cari, branding, balance, accountName, linkedInvoiceNo, islemler, paper]);

  const subtitle = [number, transaction.cariName, formatDate(transaction.date)].filter(Boolean).join('  ·  ');
  const shareText = `${branding.firmName || 'Firmamız'} - ${title}${number ? ` ${number}` : ''}`;

  return (
    <PdfPreviewModal
      isOpen
      title={title}
      subtitle={subtitle}
      shareText={shareText}
      ready={isLoaded}
      generate={generate}
      toolbar={(
        <div className="flex items-center gap-4 flex-wrap">
          {isPosSale && (
            <PdfOptionTabs<'receipt' | 'a4'>
              label="Belge"
              value={format}
              options={[{ value: 'receipt', label: `Fiş (${branding.receiptWidth} mm)` }, { value: 'a4', label: 'Fatura' }]}
              onChange={setFormat}
            />
          )}
          {(!isPosSale || format === 'a4') && (
            <PdfOptionTabs label="Kağıt" value={paper} options={PAPER_OPTIONS} onChange={setPaper} />
          )}
        </div>
      )}
      onClose={onClose}
    />
  );
};
