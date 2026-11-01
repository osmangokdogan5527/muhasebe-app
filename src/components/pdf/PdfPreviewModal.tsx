/**
 * PDF Belge Penceresi: belgeyi üretir, önizler ve Paylaş / İndir / Aç seçeneklerini sunar.
 * Yazdırma programın içinden yapılmaz; kullanıcı PDF'i kendi programında açıp yazdırır.
 *
 * Masaüstünde PDF sayfa içinde önizlenir. Telefonlarda (Android Chrome sayfa içinde PDF
 * gösteremez) belge bilgisi ve büyük düğmeler gösterilir; Paylaş ile WhatsApp/e-posta açılır.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Download, Share2, ExternalLink, Loader2, AlertTriangle, RotateCcw, Printer } from 'lucide-react';
import { logError } from '../../utils/errorLogger';
import { alertDialog } from '../../utils/dialogs';
import { GeneratedPdf } from '../../pdf/invoicePdf';
import { canPreviewPdfInline, canSharePdf, makePdfFile, openPdfExternally, sharePdf, triggerDownload } from '../../pdf/output';

export interface PdfPreviewModalProps {
  isOpen: boolean;
  /** Pencere başlığı, ör. "Satış Faturası" */
  title: string;
  /** Başlığın altındaki kısa bilgi, ör. fatura no ve cari adı */
  subtitle?: string;
  /** Paylaşımda kullanılan kısa mesaj */
  shareText?: string;
  /** Belge ayarları hazır olana kadar false kalır; hazır olunca PDF üretilir */
  ready?: boolean;
  /** PDF'i üretir. Girdiler değişince yeniden çağrılması için useCallback ile verilmelidir. */
  generate: () => Promise<GeneratedPdf>;
  /** Başlığın altında gösterilen seçenekler (ör. fiş genişliği 80/58 mm) */
  toolbar?: React.ReactNode;
  onClose: () => void;
}

type Status = 'loading' | 'ready' | 'error';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ isOpen, title, subtitle, shareText, ready = true, generate, toolbar, onClose }) => {
  const [status, setStatus] = useState<Status>('loading');
  const [pdf, setPdf] = useState<GeneratedPdf | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const inlinePreview = useMemo(() => canPreviewPdfInline(), []);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // PDF üret
  useEffect(() => {
    if (!isOpen || !ready) return;
    let cancelled = false;
    let createdUrl = '';
    setStatus('loading');
    setErrorMessage('');
    generate()
      .then((result) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(result.blob);
        setPdf(result);
        setPreviewUrl(createdUrl);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        logError(err instanceof Error ? err : new Error(String(err)), 'PdfPreviewModal.generate');
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
        setErrorMessage(offline
          ? 'PDF hazırlanamadı. İnternet bağlantısı yokken ilk kez belge oluşturulamıyor; bağlantı gelince tekrar deneyin.'
          : 'PDF hazırlanırken bir hata oluştu. Lütfen tekrar deneyin.');
        setStatus('error');
      });
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [isOpen, ready, generate, attempt]);

  // Kapanınca temizle
  useEffect(() => {
    if (!isOpen) {
      setPdf(null);
      setPreviewUrl('');
      setStatus('loading');
    }
  }, [isOpen]);

  // Esc ile kapat
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    closeButtonRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const file = useMemo(() => (pdf ? makePdfFile(pdf.blob, pdf.fileName) : null), [pdf]);
  const shareSupported = useMemo(() => (file ? canSharePdf(file) : false), [file]);

  const handleDownload = useCallback(() => {
    if (!pdf) return;
    try {
      triggerDownload(pdf.blob, pdf.fileName);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'PdfPreviewModal.download');
      alertDialog('PDF indirilemedi. Lütfen tekrar deneyin.');
    }
  }, [pdf]);

  const handleOpen = useCallback(() => {
    if (!pdf) return;
    try {
      openPdfExternally(pdf.blob, pdf.fileName);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'PdfPreviewModal.open');
      alertDialog('PDF açılamadı. "İndir" ile kaydedip açabilirsiniz.');
    }
  }, [pdf]);

  const handleShare = useCallback(async () => {
    if (!file) return;
    setIsSharing(true);
    try {
      const result = await sharePdf(file, title, shareText);
      if (result === 'unsupported') handleDownload();
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'PdfPreviewModal.share');
      alertDialog('Paylaşılamadı. PDF\'i indirip kendiniz gönderebilirsiniz.');
    } finally {
      setIsSharing(false);
    }
  }, [file, title, shareText, handleDownload]);

  if (!isOpen) return null;

  const buttonBase = 'flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

  // Pencere sayfanın en üstüne (body) çizilir: ekran geçiş animasyonları kendi katmanını
  // oluşturduğundan aksi halde Storm AI düğmesi gibi öğeler pencerenin üstünde kalıyordu.
  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-6 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`storm-doc-modal w-full flex flex-col overflow-hidden border border-white/10 shadow-2xl rounded-t-3xl sm:rounded-2xl ${inlinePreview ? 'sm:max-w-5xl h-[92vh]' : 'sm:max-w-md max-h-[92vh]'}`}
        style={{ backgroundColor: '#0f1225' }}
      >
        {/* Başlık */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(56, 189, 248, 0.14)', color: '#7dd3fc' }}>
            <FileText size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold truncate" style={{ color: '#ffffff' }}>{title}</h2>
            {subtitle && <p className="text-xs truncate" style={{ color: '#94a3b8' }}>{subtitle}</p>}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition cursor-pointer"
            style={{ color: '#cbd5e1' }}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        {toolbar && <div className="shrink-0 px-5 py-3 border-b border-white/10">{toolbar}</div>}

        {/* İçerik */}
        <div className={`flex-1 min-h-0 ${inlinePreview && status === 'ready' ? 'bg-[#525659]' : ''}`}>
          {status === 'loading' && (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center gap-3" role="status">
              <Loader2 size={30} className="animate-spin" style={{ color: '#7dd3fc' }} />
              <p className="text-sm" style={{ color: '#cbd5e1' }}>PDF hazırlanıyor...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center gap-4 px-6 text-center">
              <AlertTriangle size={30} style={{ color: '#fda4af' }} />
              <p className="text-sm max-w-sm" style={{ color: '#e2e8f0' }}>{errorMessage}</p>
              <button type="button" onClick={() => setAttempt((n) => n + 1)} className={`${buttonBase} border border-white/15 hover:bg-white/10`} style={{ color: '#e2e8f0' }}>
                <RotateCcw size={16} /> Tekrar Dene
              </button>
            </div>
          )}

          {status === 'ready' && pdf && inlinePreview && (
            <iframe title={`${title} önizleme`} src={`${previewUrl}#toolbar=1&view=FitH`} className="w-full h-full border-0" />
          )}

          {status === 'ready' && pdf && !inlinePreview && (
            <div className="px-6 py-8 flex flex-col items-center text-center gap-3">
              <div className="w-20 h-24 rounded-xl flex flex-col items-center justify-center shadow-lg" style={{ backgroundColor: '#ffffff' }}>
                <FileText size={34} style={{ color: '#dc2626' }} />
                <span className="text-[10px] font-black mt-1" style={{ color: '#dc2626' }}>PDF</span>
              </div>
              <p className="text-sm font-semibold break-all" style={{ color: '#ffffff' }}>{pdf.fileName}</p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>{pdf.pageCount} sayfa · {formatSize(pdf.blob.size)}</p>
            </div>
          )}
        </div>

        {/* Düğmeler */}
        <div className="shrink-0 border-t border-white/10 px-5 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3">
          <div className={`grid gap-2 ${inlinePreview ? 'sm:flex sm:justify-end' : ''} grid-cols-1`}>
            {shareSupported && (
              <button type="button" onClick={handleShare} disabled={status !== 'ready' || isSharing} className={buttonBase} style={{ backgroundColor: '#16a34a', color: '#ffffff' }}>
                {isSharing ? <Loader2 size={17} className="animate-spin" /> : <Share2 size={17} />}
                Paylaş (WhatsApp, E-posta...)
              </button>
            )}
            <button type="button" onClick={handleDownload} disabled={status !== 'ready'} className={buttonBase} style={{ backgroundColor: 'var(--accent-600, #0284c7)', color: '#ffffff' }}>
              <Download size={17} /> PDF İndir
            </button>
            <button type="button" onClick={handleOpen} disabled={status !== 'ready'} className={`${buttonBase} border border-white/15 hover:bg-white/10`} style={{ color: '#e2e8f0' }}>
              <ExternalLink size={17} /> {inlinePreview ? 'Yeni Sekmede Aç' : 'PDF\'i Aç'}
            </button>
          </div>
          <p className="flex items-center justify-center sm:justify-start gap-1.5 text-[11px]" style={{ color: '#94a3b8' }}>
            <Printer size={12} /> Yazdırmak için PDF'i açıp kendi PDF programınızdan yazdırın.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
};
