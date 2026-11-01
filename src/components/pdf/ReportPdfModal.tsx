/**
 * Rapor PDF penceresi (Raporlar ekranındaki sekmeler).
 */
import React, { useCallback } from 'react';
import { ReportDocument, createReportPdf } from '../../pdf/reportPdf';
import { useDocumentBranding } from '../../pdf/useDocumentBranding';
import { PdfPreviewModal } from './PdfPreviewModal';
import { PdfOptionTabs } from './PdfOptionTabs';
import { usePaperSize, PAPER_OPTIONS } from './usePaperSize';

export interface ReportPdfModalProps {
  report: ReportDocument;
  onClose: () => void;
}

export const ReportPdfModal: React.FC<ReportPdfModalProps> = ({ report, onClose }) => {
  const { branding, isLoaded } = useDocumentBranding();
  const [paper, setPaper] = usePaperSize();
  const generate = useCallback(() => createReportPdf(report, branding, paper), [report, branding, paper]);
  return (
    <PdfPreviewModal
      isOpen
      title={report.title}
      subtitle={[report.periodLabel, report.currencyLabel].filter(Boolean).join('  ·  ')}
      shareText={`${branding.firmName || 'Firmamız'} - ${report.title}`}
      ready={isLoaded}
      generate={generate}
      toolbar={<PdfOptionTabs label="Kağıt" value={paper} options={PAPER_OPTIONS} onChange={setPaper} />}
      onClose={onClose}
    />
  );
};
