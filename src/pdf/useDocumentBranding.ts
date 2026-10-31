/**
 * Firmanın belge görünüm ayarlarını (logo, firma bilgileri, renk) canlı olarak okur.
 * Henüz kaydedilmemişse bu cihazdaki eski yazdırma ayarlarından ve firma adından başlangıç üretir.
 */
import { useEffect, useState } from 'react';
import { auth, subscribeDocumentBranding } from '../firebase';
import { logError } from '../utils/errorLogger';
import { DocumentBranding, brandingFromLegacySettings, normalizeBranding } from './branding';

export interface DocumentBrandingState {
  branding: DocumentBranding;
  /** Ayar veritabanından en az bir kez okundu mu */
  isLoaded: boolean;
  /** Veritabanında kayıtlı ayar var mı (yoksa varsayılanlar kullanılıyor) */
  isSaved: boolean;
}

// Ayar okunamazsa (ör. ilk açılış internetsiz) belge varsayılanlarla bu süreden sonra üretilir
const LOAD_TIMEOUT_MS = 2500;

function fallbackBranding(): DocumentBranding {
  return brandingFromLegacySettings(auth.currentUser?.displayName || '');
}

export function useDocumentBranding(): DocumentBrandingState {
  const [state, setState] = useState<DocumentBrandingState>(() => ({ branding: fallbackBranding(), isLoaded: false, isSaved: false }));

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const timer = setTimeout(() => {
      setState((prev) => (prev.isLoaded ? prev : { ...prev, isLoaded: true }));
    }, LOAD_TIMEOUT_MS);
    try {
      unsubscribe = subscribeDocumentBranding((data) => {
        setState({
          branding: data ? normalizeBranding(data) : fallbackBranding(),
          isLoaded: true,
          isSaved: !!data,
        });
      });
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'useDocumentBranding.subscribe');
      setState((prev) => ({ ...prev, isLoaded: true }));
    }
    return () => {
      clearTimeout(timer);
      try {
        unsubscribe?.();
      } catch (err) {
        logError(err instanceof Error ? err : new Error(String(err)), 'useDocumentBranding.unsubscribe');
      }
    };
  }, []);

  return state;
}
