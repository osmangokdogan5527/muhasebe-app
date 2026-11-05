import { useEffect, useState } from 'react';
import type { PaperSize } from '../../pdf/layout';
import type { DocumentBranding } from '../../pdf/branding';

export type PaperKind = 'document' | 'statement' | 'report';

/**
 * Belge penceresinde kağıt boyutu: firmanın Belge Görünümü ayarındaki varsayılanla açılır
 * (makbuz/fatura A5, ekstre ve rapor A4). Pencerede değiştirilen seçim yalnızca o belge içindir.
 */
export function useDocumentPaper(kind: PaperKind, branding: DocumentBranding, isLoaded: boolean): [PaperSize, (paper: PaperSize) => void] {
  const fallback: PaperSize = kind === 'statement' ? branding.statementPaper : kind === 'report' ? branding.reportPaper : branding.documentPaper;
  const [paper, setPaperState] = useState<PaperSize>(fallback);
  const [touched, setTouched] = useState(false);
  // Ayar yüklenince (kullanıcı henüz seçim yapmadıysa) firmanın varsayılanı kullanılır
  useEffect(() => {
    if (isLoaded && !touched) setPaperState(fallback);
  }, [isLoaded, touched, fallback]);
  const setPaper = (next: PaperSize) => {
    setTouched(true);
    setPaperState(next);
  };
  return [paper, setPaper];
}

export const PAPER_OPTIONS: { value: PaperSize; label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'a5', label: 'A5' },
];
