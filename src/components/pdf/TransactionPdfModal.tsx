/**
 * İşlem (fatura) PDF penceresi: firmanın belge ayarlarını okuyup faturayı PDF olarak üretir.
 */
import React, { useCallback } from 'react';
import { Cari, Transaction } from '../../types';
import { createInvoicePdf } from '../../pdf/invoicePdf';
import { useDocumentBranding } from '../../pdf/useDocumentBranding';
import { formatDate } from '../../pdf/format';
import { PdfPreviewModal } from './PdfPreviewModal';

const DOCUMENT_TITLES: Record<string, string> = {
  sale: 'Satış Faturası',
  purchase: 'Alış Faturası',
  sale_return: 'Satış İade Faturası',
  purchase_return: 'Alış İade Faturası',
};

export interface TransactionPdfModalProps {
  transaction: Transaction;
  cariler: Cari[];
  onClose: () => void;
}

export const TransactionPdfModal: React.FC<TransactionPdfModalProps> = ({ transaction, cariler, onClose }) => {
  const { branding, isLoaded } = useDocumentBranding();
  const cari = cariler.find((c) => c.id === transaction.cariId);
  const title = DOCUMENT_TITLES[transaction.type] || 'Belge';

  const generate = useCallback(
    () => createInvoicePdf(transaction, cari, branding),
    [transaction, cari, branding],
  );

  const subtitle = [transaction.invoiceNo, transaction.cariName, formatDate(transaction.date)].filter(Boolean).join('  ·  ');
  const shareText = `${branding.firmName || 'Firmamız'} - ${title}${transaction.invoiceNo ? ` ${transaction.invoiceNo}` : ''}`;

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
