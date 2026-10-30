/**
 * Storm Ön Muhasebe - Telefona Yüklenebilir Uygulama (PWA) Yardımcıları
 *
 * Service worker yalnızca web sürümünde (https veya localhost, üretim derlemesi)
 * kaydedilir; masaüstü (Electron) sürümünde ve geliştirme modunda devre dışıdır.
 */
import { useEffect, useState } from 'react';
import { logError } from './errorLogger';

function isElectron(): boolean {
  return typeof window !== 'undefined' && !!(window as any).electronAPI;
}

export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}

export function registerServiceWorker(): void {
  try {
    if (!import.meta.env.PROD || isElectron()) return;
    if (!('serviceWorker' in navigator)) return;
    const { protocol, hostname } = window.location;
    if (protocol !== 'https:' && hostname !== 'localhost' && hostname !== '127.0.0.1') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        logError(err instanceof Error ? err : new Error(String(err)), 'pwa.registerServiceWorker');
      });
    });
  } catch (err: any) {
    logError(err instanceof Error ? err : new Error(String(err)), 'pwa.registerServiceWorker');
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * "Uygulamayı Yükle" durumu:
 * - canInstall: Android/Chrome yükleme penceresi açılabilir
 * - showIosHint: iPhone/iPad Safari'de "Paylaş > Ana Ekrana Ekle" ipucu gösterilmeli
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState<boolean>(() => isStandaloneApp());

  useEffect(() => {
    if (isElectron()) return;
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isIos = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome/i.test(ua);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error(String(err)), 'pwa.promptInstall');
    } finally {
      setDeferredPrompt(null);
    }
  };

  return {
    installed,
    canInstall: !installed && !!deferredPrompt,
    showIosHint: !installed && !isElectron() && isIos && isSafari,
    promptInstall,
  };
}
