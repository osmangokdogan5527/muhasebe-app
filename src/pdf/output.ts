/**
 * Üretilen PDF'i kullanıcıya verme: indir, paylaş (telefonda WhatsApp/e-posta), yeni sekmede aç.
 */
import { logError } from '../utils/errorLogger';

export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    // İndirme başlamadan adres geçersiz olmasın diye biraz beklenir
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}

export function makePdfFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: 'application/pdf' });
}

/** Cihaz dosya paylaşımını destekliyor mu (telefonlar ve bazı bilgisayarlar). */
export function canSharePdf(file: File): boolean {
  try {
    return typeof navigator !== 'undefined'
      && typeof navigator.share === 'function'
      && typeof navigator.canShare === 'function'
      && navigator.canShare({ files: [file] });
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'pdfOutput.canSharePdf');
    return false;
  }
}

export type ShareResult = 'shared' | 'cancelled' | 'unsupported';

export async function sharePdf(file: File, title: string, text?: string): Promise<ShareResult> {
  if (!canSharePdf(file)) return 'unsupported';
  try {
    await navigator.share({ files: [file], title, text });
    return 'shared';
  } catch (err: any) {
    // Kullanıcı paylaşım penceresini kapattı
    if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) return 'cancelled';
    throw err;
  }
}

/** Telefonun ya da bilgisayarın kendi PDF görüntüleyicisinde açmayı dener; olmazsa indirir. */
export function openPdfExternally(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  // 'noopener' verilirse window.open her zaman null döner; açılıp açılmadığını anlamak için verilmez
  const opened = window.open(url, '_blank');
  if (!opened) {
    URL.revokeObjectURL(url);
    triggerDownload(blob, fileName);
    return;
  }
  setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
}

/** Tarayıcı PDF'i sayfa içinde gösterebiliyor mu (masaüstü Chrome/Edge/Safari evet, Android Chrome hayır). */
export function canPreviewPdfInline(): boolean {
  if (typeof navigator === 'undefined') return false;
  const enabled = (navigator as any).pdfViewerEnabled;
  if (typeof enabled === 'boolean') return enabled;
  return !/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}
