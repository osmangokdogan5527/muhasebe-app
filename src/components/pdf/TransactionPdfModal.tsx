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
import { DocumentFormat, SALE_FORMAT_OPTIONS, isReceiptFormat, paperOf, receiptFormatFor, receiptWidthOf } from './documentFormat';

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
  // Satışlar fiş (80 / 58 mm) ya da fatura (A4 / A5) olarak alınabilir; kasadan yapılan satış fişle açılır
  const isSale = transaction.type === 'sale';
  const isPosSale = isSale && /^POS-/i.test(transaction.invoiceNo || '');
  const [paper, setPaper] = usePaperSize();
  const [format, setFormatState] = useState<DocumentFormat>(isPosSale ? receiptFormatFor(branding.receiptWidth) : paper);
  const setFormat = (next: DocumentFormat) => {
    setFormatState(next);
    if (!isReceiptFormat(next)) setPaper(paperOf(next));
  };
  const linkedReceipts = useMemo(() => islemler.filter((t) => t.linkedInvoiceId === transaction.id), [islemler, transaction.id]);
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
    if (isSale && isReceiptFormat(format)) {
      const isRetail = !cari || cari.id === RETAIL_CARI_ID;
      return createPosReceiptPdf(receiptDataFromTransaction(transaction, isRetail, {
        linkedReceipts,
        balanceBefore: balance ? balance.before : undefined,
      }), branding, receiptWidthOf(format));
    }
    const pagePaper = isSale ? paperOf(format) : paper;
    return isInvoice
      ? createInvoicePdf(transaction, cari, branding, { balance, paper: pagePaper, linkedReceipts })
      : createReceiptPdf(transaction, cari, branding, { balance, accountName, linkedInvoiceNo, paper: pagePaper });
  }, [isSale, format, isInvoice, transaction, cari, branding, balance, accountName, linkedInvoiceNo, linkedReceipts, paper]);

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
      toolbar={isSale ? (
        <PdfOptionTabs<DocumentFormat> label="Belge" value={format} options={SALE_FORMAT_OPTIONS} onChange={setFormat} />
      ) : (
        <PdfOptionTabs label="Kağıt" value={paper} options={PAPER_OPTIONS} onChange={setPaper} />
      )}
      onClose={onClose}
    />
  );
};
