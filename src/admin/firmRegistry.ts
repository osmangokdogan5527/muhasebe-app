/**
 * Firma kaydı (firmalar/{firmaKodu}): sistem kurucusunun firmaları görebilmesi, dondurabilmesi
 * ve silebilmesi için. Firma tarafı burada:
 *  - Her girişte kendi kaydını günceller (ad, son giriş, sürüm, cihaz, şifre kasası kopyası).
 *  - Girişte ve çalışırken durumunu denetler: dondurulmuş/silinmiş firma uygulamaya giremez.
 *
 * Firestore kuralları: firma kendi kaydını okuyup yazabilir ama "status" alanını değiştiremez;
 * kayıtları listeleyip durum değiştirmek yalnızca kurucu hesabına açıktır. Kurallar henüz
 * yüklenmemişse (izin hatası) firma hiçbir şekilde etkilenmez.
 */
import { doc, getDoc, getDocFromServer, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { APP_VERSION } from '../constants';
import { currentDevice } from '../users/activityTypes';
import { logError } from '../utils/errorLogger';
import { sealPassword } from './passwordVault';

export const FIRM_REGISTRY_COLL = 'firmalar';

export type FirmStatus = 'active' | 'suspended' | 'deleted';

export const FIRM_BLOCKED_MESSAGES: Record<Exclude<FirmStatus, 'active'>, string> = {
  suspended: 'Bu firma hesabı geçici olarak durdurulmuştur. Lütfen sistem yöneticinizle iletişime geçin.',
  deleted: 'Bu firma hesabı kapatılmıştır. Lütfen sistem yöneticinizle iletişime geçin.',
};

const isPermissionError = (err: unknown) => /permission|insufficient/i.test(String((err as any)?.code || (err as any)?.message || ''));

function logQuiet(err: unknown, context: string) {
  // Kurallar henüz yüklenmediyse izin hatası beklenen durumdur; günlüğü doldurmaz
  if (isPermissionError(err)) return;
  logError(err instanceof Error ? err : new Error(String(err)), context);
}

export function normalizeFirmStatus(value: unknown): FirmStatus {
  return value === 'suspended' || value === 'deleted' ? value : 'active';
}

/**
 * Girişten hemen sonra: firma dondurulmuş/silinmişse kullanıcıya gösterilecek mesaj, değilse null.
 * Sunucuya ulaşılamazsa (çevrimdışı, zaman aşımı, kural yok) giriş engellenmez.
 */
export async function checkFirmBlocked(code: string): Promise<string | null> {
  try {
    const snap = await Promise.race([
      getDocFromServer(doc(db, FIRM_REGISTRY_COLL, code)),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
    ]);
    if (!snap || !snap.exists()) return null;
    const status = normalizeFirmStatus(snap.data()?.status);
    return status === 'active' ? null : FIRM_BLOCKED_MESSAGES[status];
  } catch (err) {
    logQuiet(err, 'firmRegistry.checkFirmBlocked');
    return null;
  }
}

/** Giriş/kayıt/şifre değişiminde firma kaydını günceller (beklemez; hata girişi etkilemez) */
export async function recordFirmLogin(code: string, name: string, password?: string): Promise<void> {
  try {
    const ref = doc(db, FIRM_REGISTRY_COLL, code);
    let exists = false;
    try {
      exists = (await getDoc(ref)).exists();
    } catch (err) {
      logQuiet(err, 'firmRegistry.read');
    }
    const now = new Date().toISOString();
    const sealed = password ? await sealPassword(password) : null;
    const data: Record<string, any> = {
      code,
      name: (name || code).slice(0, 120),
      lastLoginAt: now,
      lastDevice: currentDevice(),
      appVersion: APP_VERSION,
    };
    if (sealed) data.sealedPassword = sealed;
    if (!exists) {
      data.createdAt = now;
      data.status = 'active';
    }
    await setDoc(ref, data, { merge: true });
  } catch (err) {
    logQuiet(err, 'firmRegistry.recordFirmLogin');
  }
}

/** Çalışırken durum değişirse (kurucu dondurdu/sildi) bildirir */
export function subscribeFirmStatus(code: string, onBlocked: (message: string) => void): () => void {
  try {
    return onSnapshot(
      doc(db, FIRM_REGISTRY_COLL, code),
      (snap) => {
        if (!snap.exists()) return;
        const status = normalizeFirmStatus(snap.data()?.status);
        if (status !== 'active') onBlocked(FIRM_BLOCKED_MESSAGES[status]);
      },
      (err) => logQuiet(err, 'firmRegistry.subscribeFirmStatus'),
    );
  } catch (err) {
    logQuiet(err, 'firmRegistry.subscribeFirmStatus');
    return () => undefined;
  }
}
