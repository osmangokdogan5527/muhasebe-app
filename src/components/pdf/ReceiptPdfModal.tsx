/**
 * POS satış fişi PDF penceresi (80 / 58 mm). Varsayılan genişlik belge ayarlarından gelir.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ReceiptWidth } from '../../pdf/branding';
import { ReceiptSaleData, createPosReceiptPdf } from '../../pdf/posReceiptPdf';
import { useDocumentBranding } from '../../pdf/useDocumentBranding';
import { formatMoney } from '../../pdf/format';
import { PdfPreviewModal } from './PdfPreviewModal';
import { PdfOptionTabs } from './PdfOptionTabs';

export interface ReceiptPdfModalProps {
  data: ReceiptSaleData;
  title?: string;
  onClose: () => void;
}

export const ReceiptPdfModal: React.FC<ReceiptPdfModalProps> = ({ data, title = 'Satış Fişi', onClose }) => {
  const { branding, isLoaded } = useDocumentBranding();
  const [width, setWidth] = useState<ReceiptWidth>(branding.receiptWidth);
  const [touched, setTouched] = useState(false);

  // Ayar yüklenince (kullanıcı henüz seçim yapmadıysa) firmanın varsayılan fiş genişliği kullanılır
  useEffect(() => {
    if (isLoaded && !touched) setWidth(branding.receiptWidth);
  }, [isLoaded, touched, branding.receiptWidth]);

  const generate = useCallback(() => createPosReceiptPdf(data, branding, width), [data, branding, width]);

  return (
    <PdfPreviewModal
      isOpen
      title={title}
      subtitle={`${data.receiptNo}  ·  ${formatMoney(data.grandTotal, data.currency)}`}
      shareText={`${branding.firmName || 'Firmamız'} - Satış fişi ${data.receiptNo}`}
      ready={isLoaded}
      generate={generate}
      toolbar={
        <PdfOptionTabs<'80' | '58'>
          label="Fiş genişliği"
          value={String(width) as '80' | '58'}
          options={[{ value: '80', label: '80 mm' }, { value: '58', label: '58 mm' }]}
          onChange={(v) => { setTouched(true); setWidth(v === '58' ? 58 : 80); }}
        />
      }
      onClose={onClose}
    />
  );
};
