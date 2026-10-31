/**
 * İşlem PDF penceresi: faturalar (satış, alış, iade) ve tahsilat/ödeme makbuzları.
 * Firmanın belge ayarlarını okur, carinin belge öncesi/sonrası bakiyesini hesaplar.
 */
import React, { useCallback, useMemo } from 'react';
import { BankAccount, Cari, Transaction } from '../../types';
import { createInvoicePdf, isInvoiceTransaction } from '../../pdf/invoicePdf';
import { createReceiptPdf, receiptNumber, receiptTitle } from '../../pdf/receiptPdf';
import { useDocumentBranding } from '../../pdf/useDocumentBranding';
import { formatDate } from '../../pdf/format';
import { documentBalance } from '../../utils/cariLedger';
import { RETAIL_CARI_ID } from '../../firebase';
import { PdfPreviewModal } from './PdfPreviewModal';

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

  const generate = useCallback(
    () => (isInvoice
      ? createInvoicePdf(transaction, cari, branding, { balance })
      : createReceiptPdf(transaction, cari, branding, { balance, accountName, linkedInvoiceNo })),
    [isInvoice, transaction, cari, branding, balance, accountName, linkedInvoiceNo],
  );

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
      onClose={onClose}
    />
  );
};
