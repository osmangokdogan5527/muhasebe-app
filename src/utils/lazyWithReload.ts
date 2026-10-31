/**
 * Ekran kodunu gerektiğinde indiren React.lazy sarmalayıcısı.
 *
 * Yeni sürüm yayınlandığında dosya adları değişir; eski sürümle açık kalmış bir sayfa henüz
 * açılmamış bir ekranı indirmek istediğinde dosya bulunamaz. Bu durumda sayfa bir kez yenilenir
 * (yeni sürüm yüklenir). Yenilemeden sonra yine olmazsa hata ErrorBoundary'ye bırakılır.
 */
import { ComponentType, lazy } from 'react';
import { logError } from './errorLogger';

const RELOAD_FLAG_KEY = 'storm_chunk_reload_at';
const RELOAD_GUARD_MS = 60 * 1000;

function shouldReload(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_FLAG_KEY) || 0);
    if (Date.now() - last < RELOAD_GUARD_MS) return false;
    sessionStorage.setItem(RELOAD_FLAG_KEY, String(Date.now()));
    return true;
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'lazyWithReload.shouldReload');
    return false;
  }
}

export function lazyWithReload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'lazyWithReload.load');
      if (typeof navigator !== 'undefined' && navigator.onLine !== false && shouldReload()) {
        window.location.reload();
        // Sayfa yenilenirken React'in hata göstermemesi için hiç bitmeyen bir söz döndürülür
        return new Promise<{ default: T }>(() => undefined);
      }
      throw err;
    }
  });
}
