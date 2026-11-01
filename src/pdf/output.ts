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

/**
 * PDF'i telefonun paylaşım menüsüyle paylaşır (WhatsApp, e-posta...).
 * Android'de WhatsApp, dosyayla birlikte başlık/metin gönderildiğinde paylaşımı sıklıkla reddeder;
 * bu yüzden önce yalnızca dosya denenir, olmazsa başlık ve metinle tekrar denenir.
 * Kullanıcının kendisi kapattığında 'cancelled', paylaşım yapılamadığında hata fırlatılır.
 */
export async function sharePdf(file: File, title: string, text?: string): Promise<ShareResult> {
  if (!canSharePdf(file)) return 'unsupported';
  const attempts: ShareData[] = [
    { files: [file] },
    { files: [file], title },
    ...(text ? [{ files: [file], title, text }] : []),
  ];
  let lastError: unknown = null;
  for (const data of attempts) {
    try {
      if (typeof navigator.canShare === 'function' && !navigator.canShare(data)) continue;
      await navigator.share(data);
      return 'shared';
    } catch (err: any) {
      // Kullanıcı paylaşım penceresini kendisi kapattı
      if (err && err.name === 'AbortError') return 'cancelled';
      lastError = err;
      // İzin/etkileşim hatası: yeni bir dokunuş olmadan tekrar denenemez
      if (err && err.name === 'NotAllowedError') break;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Paylaşım yapılamadı');
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
