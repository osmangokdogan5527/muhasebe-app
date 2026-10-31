/**
 * PDF yazı tipi: Inter (SIL Open Font License, fonts/OFL.txt).
 * jsPDF'in yerleşik yazı tipleri Türkçe karakterleri (ş, ğ, İ, ı...) basamaz; bu yüzden
 * Inter dosyaları PDF üretilirken bir kez indirilip belgeye gömülür.
 */
import type { jsPDF } from 'jspdf';
import interRegularUrl from './fonts/Inter-Regular.ttf?url';
import interSemiBoldUrl from './fonts/Inter-SemiBold.ttf?url';
import interBoldUrl from './fonts/Inter-Bold.ttf?url';

export const PDF_FONT = 'Inter';
/** Yarı kalın ağırlık ayrı bir aile adıyla kaydedilir (jsPDF yalnızca normal/bold bilir). */
export const PDF_FONT_SEMIBOLD = 'InterSemiBold';

interface FontFile {
  url: string;
  vfsName: string;
  family: string;
  style: 'normal' | 'bold';
}

const FONT_FILES: FontFile[] = [
  { url: interRegularUrl, vfsName: 'Inter-Regular.ttf', family: PDF_FONT, style: 'normal' },
  { url: interBoldUrl, vfsName: 'Inter-Bold.ttf', family: PDF_FONT, style: 'bold' },
  { url: interSemiBoldUrl, vfsName: 'Inter-SemiBold.ttf', family: PDF_FONT_SEMIBOLD, style: 'normal' },
];

let fontDataPromise: Promise<string[]> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}

function loadFontData(): Promise<string[]> {
  if (!fontDataPromise) {
    fontDataPromise = Promise.all(
      FONT_FILES.map(async (file) => {
        const response = await fetch(file.url);
        if (!response.ok) throw new Error(`Yazı tipi indirilemedi: ${file.vfsName} (${response.status})`);
        return arrayBufferToBase64(await response.arrayBuffer());
      }),
    ).catch((err) => {
      // Bir sonraki denemede yeniden indirilsin (ör. internet geri geldiğinde)
      fontDataPromise = null;
      throw err;
    });
  }
  return fontDataPromise;
}

/** Inter yazı tiplerini belgeye ekler ve varsayılan yazı tipi yapar. */
export async function registerPdfFonts(doc: jsPDF): Promise<void> {
  const data = await loadFontData();
  FONT_FILES.forEach((file, index) => {
    doc.addFileToVFS(file.vfsName, data[index]);
    doc.addFont(file.vfsName, file.family, file.style);
  });
  doc.setFont(PDF_FONT, 'normal');
}
