/**
 * Firma bilgileri durumu: belge ayarı kayıtlı mı, fişte görünecek asgari bilgi (ad + telefon) var mı.
 * Karar yalnızca sunucudan doğrulanmış veriyle verilir; çevrimdışı ilk açılışta (önbellek boş)
 * pencere yanlışlıkla açılmaz.
 */
import { useEffect, useState } from 'react';
import { DOCUMENT_BRANDING_DOC_ID, subscribeSettingDoc } from '../firebase';
import { DocumentBranding, normalizeBranding } from '../pdf/branding';
import { logError } from '../utils/errorLogger';
import { isFirmInfoComplete } from './firmInfo';

export function useFirmInfo(tenantId: string | null | undefined, ready: boolean) {
  const [branding, setBranding] = useState<DocumentBranding | null>(null);
  const [saved, setSaved] = useState(false);
  const [serverLoaded, setServerLoaded] = useState(false);

  useEffect(() => {
    setBranding(null);
    setSaved(false);
    setServerLoaded(false);
    if (!tenantId || !ready) return;
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeSettingDoc(DOCUMENT_BRANDING_DOC_ID, (data, meta) => {
        setBranding(data ? normalizeBranding(data) : null);
        setSaved(!!data);
        if (!meta?.fromCache) setServerLoaded(true);
      }, true);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'useFirmInfo.subscribe');
    }
    return () => unsub?.();
  }, [tenantId, ready]);

  const complete = isFirmInfoComplete(branding, saved);
  return { branding, saved, serverLoaded, complete, missing: serverLoaded && !complete };
}
