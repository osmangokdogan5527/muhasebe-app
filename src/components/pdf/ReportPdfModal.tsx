/**
 * Rapor PDF penceresi (Raporlar ekranındaki sekmeler).
 */
import React, { useCallback } from 'react';
import { ReportDocument, createReportPdf } from '../../pdf/reportPdf';
import { useDocumentBranding } from '../../pdf/useDocumentBranding';
import { PdfPreviewModal } from './PdfPreviewModal';

export interface ReportPdfModalProps {
  report: ReportDocument;
  onClose: () => void;
}

export const ReportPdfModal: React.FC<ReportPdfModalProps> = ({ report, onClose }) => {
  const { branding, isLoaded } = useDocumentBranding();
  const generate = useCallback(() => createReportPdf(report, branding), [report, branding]);
  return (
    <PdfPreviewModal
      isOpen
      title={report.title}
      subtitle={[report.periodLabel, report.currencyLabel].filter(Boolean).join('  ·  ')}
      shareText={`${branding.firmName || 'Firmamız'} - ${report.title}`}
      ready={isLoaded}
      generate={generate}
      onClose={onClose}
    />
  );
};
