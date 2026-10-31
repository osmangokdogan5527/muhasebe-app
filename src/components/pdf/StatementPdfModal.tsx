/**
 * Cari hesap ekstresi PDF penceresi (seçilen tarih aralığıyla).
 */
import React, { useCallback } from 'react';
import { Cari, Transaction } from '../../types';
import { createStatementPdf, statementPeriodLabel } from '../../pdf/statementPdf';
import { useDocumentBranding } from '../../pdf/useDocumentBranding';
import { PdfPreviewModal } from './PdfPreviewModal';

export interface StatementPdfModalProps {
  cari: Cari;
  islemler: Transaction[];
  startDate?: string;
  endDate?: string;
  onClose: () => void;
}

export const StatementPdfModal: React.FC<StatementPdfModalProps> = ({ cari, islemler, startDate, endDate, onClose }) => {
  const { branding, isLoaded } = useDocumentBranding();

  const generate = useCallback(
    () => createStatementPdf(cari, islemler, branding, { startDate, endDate }),
    [cari, islemler, branding, startDate, endDate],
  );

  return (
    <PdfPreviewModal
      isOpen
      title="Cari Hesap Ekstresi"
      subtitle={`${cari.name}  ·  ${statementPeriodLabel(startDate, endDate)}`}
      shareText={`${branding.firmName || 'Firmamız'} - ${cari.name} hesap ekstresi`}
      ready={isLoaded}
      generate={generate}
      onClose={onClose}
    />
  );
};
