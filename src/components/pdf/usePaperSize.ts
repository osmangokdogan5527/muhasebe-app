import { useState } from 'react';
import type { PaperSize } from '../../pdf/layout';
import { logError } from '../../utils/errorLogger';

const STORAGE_KEY = 'storm_pdf_paper_size';

/** Fatura, makbuz ve ekstre PDF'lerinde seçilen kağıt boyutu (A4 / A5); son seçim hatırlanır. */
export function usePaperSize(): [PaperSize, (paper: PaperSize) => void] {
  const [paper, setPaperState] = useState<PaperSize>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'a5' ? 'a5' : 'a4';
    } catch {
      return 'a4';
    }
  });
  const setPaper = (next: PaperSize) => {
    setPaperState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'usePaperSize.setPaper');
    }
  };
  return [paper, setPaper];
}

export const PAPER_OPTIONS: { value: PaperSize; label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'a5', label: 'A5' },
];
