/**
 * Sistem kurucusu (yazılım sahibi) hesabı ve firma yönetimi.
 *
 * Kurucu, Firebase'de ayrı bir hesapla (kurucu.panel@storm.com) oturum açar. Bu oturum ayrı bir
 * Firebase uygulama örneğinde tutulur: firmaların oturumunu hiç etkilemez. Firestore kuralları
 * yalnızca bu hesabın kimliğine (UID) firmaları listeleme, dondurma ve silme izni verir.
 *
 * Firma e-postaları "kod@storm.com" biçimindedir ve kodda nokta olamaz; kurucu e-postası
 * bu yüzden hiçbir firma koduyla çakışmaz.
 */
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  inMemoryPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  initializeFirestore,
  setDoc,
  updateDoc,
  writeBatch,
  limit,
  query,
} from 'firebase/firestore';
import { FIRESTORE_DATABASE_ID, TENANT_COLLECTIONS, firebaseConfig } from '../firebase';
import { getTenantEmail, validateTenantCode, MIN_PASSWORD_LENGTH } from '../utils/tenantAuth';
import { logError } from '../utils/errorLogger';
import { FIRM_REGISTRY_COLL, FirmStatus, normalizeFirmStatus } from './firmRegistry';
import { SealedPassword, sealPassword } from './passwordVault';

export const FOUNDER_EMAIL = 'kurucu.panel@storm.com';
export const MIN_FOUNDER_PASSWORD_LENGTH = 8;

const FOUNDER_APP = 'storm-kurucu';
const CREATOR_APP = 'storm-kurucu-firma-olustur';

function getOrInitApp(name: string): FirebaseApp {
  return getApps().find((a) => a.name === name) || initializeApp(firebaseConfig, name);
}

let founderAuthInstance: Auth | null = null;
let founderDbInstance: Firestore | null = null;

export function founderAuth(): Auth {
  if (!founderAuthInstance) founderAuthInstance = getAuth(getOrInitApp(FOUNDER_APP));
  return founderAuthInstance;
}

function founderDb(): Firestore {
  // Önbellek yok: kurucu her zaman sunucudaki güncel listeyi görür
  if (!founderDbInstance) founderDbInstance = initializeFirestore(getOrInitApp(FOUNDER_APP), {}, FIRESTORE_DATABASE_ID);
  return founderDbInstance;
}

const toErr = (err: unknown) => (err instanceof Error ? err : new Error(String(err)));

function describeFounderError(err: any): string {
  const code = String(err?.code || '');
  if (/wrong-password|invalid-credential|invalid-login|user-not-found/.test(code)) return 'Kurucu şifresi hatalı ya da kurucu hesabı henüz oluşturulmamış.';
  if (/email-already-in-use/.test(code)) return 'Kurucu hesabı zaten oluşturulmuş. Şifrenizle giriş yapın.';
  if (/too-many-requests/.test(code)) return 'Çok fazla hatalı deneme. Biraz bekleyip tekrar deneyin.';
  if (/network/.test(code)) return 'İnternet bağlantısı yok.';
  if (/permission|insufficient/i.test(code + String(err?.message || ''))) return 'İzin yok: Firebase kuralları henüz yüklenmemiş ya da kurucu kimliği kurallarla eşleşmiyor.';
  return err?.message || String(err);
}

export function isPermissionDenied(err: unknown): boolean {
  return /permission|insufficient/i.test(String((err as any)?.code || '') + String((err as any)?.message || ''));
}

/** Kurucu oturumu açık mı (sayfa yenilense de hatırlanır) */
export function watchFounder(callback: (user: User | null) => void): () => void {
  try {
    return onAuthStateChanged(founderAuth(), callback);
  } catch (err) {
    logError(toErr(err), 'founderAuth.watch');
    callback(null);
    return () => undefined;
  }
}

export async function signInFounder(password: string): Promise<{ ok: true; user: User } | { ok: false; message: string }> {
  try {
    const cred = await signInWithEmailAndPassword(founderAuth(), FOUNDER_EMAIL, password);
    return { ok: true, user: cred.user };
  } catch (err) {
    logError(toErr(err), 'founderAuth.signIn');
    return { ok: false, message: describeFounderError(err) };
  }
}

export async function createFounderAccount(password: string): Promise<{ ok: true; user: User } | { ok: false; message: string }> {
  if ((password || '').length < MIN_FOUNDER_PASSWORD_LENGTH) return { ok: false, message: `Kurucu şifresi en az ${MIN_FOUNDER_PASSWORD_LENGTH} karakter olmalıdır.` };
  try {
    const cred = await createUserWithEmailAndPassword(founderAuth(), FOUNDER_EMAIL, password);
    await updateProfile(cred.user, { displayName: 'Sistem Kurucusu' });
    return { ok: true, user: cred.user };
  } catch (err) {
    logError(toErr(err), 'founderAuth.create');
    return { ok: false, message: describeFounderError(err) };
  }
}

export async function signOutFounder(): Promise<void> {
  try {
    await signOut(founderAuth());
  } catch (err) {
    logError(toErr(err), 'founderAuth.signOut');
  }
}

// ---------------- Firmalar ----------------

export interface FirmRecord {
  code: string;
  name: string;
  status: FirmStatus;
  createdAt?: string;
  lastLoginAt?: string;
  lastDevice?: string;
  appVersion?: string;
  statusChangedAt?: string;
  sealedPassword?: SealedPassword;
}

export async function listFirms(): Promise<FirmRecord[]> {
  const snap = await getDocs(collection(founderDb(), FIRM_REGISTRY_COLL));
  const list: FirmRecord[] = [];
  snap.forEach((d) => {
    const data = d.data() as Record<string, any>;
    list.push({
      code: d.id,
      name: typeof data.name === 'string' && data.name ? data.name : d.id,
      status: normalizeFirmStatus(data.status),
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt,
      lastDevice: data.lastDevice,
      appVersion: data.appVersion,
      statusChangedAt: data.statusChangedAt,
      sealedPassword: data.sealedPassword && typeof data.sealedPassword.data === 'string' ? data.sealedPassword : undefined,
    });
  });
  // Silinenler sona, diğerleri son girişe göre
  return list.sort((a, b) => {
    if ((a.status === 'deleted') !== (b.status === 'deleted')) return a.status === 'deleted' ? 1 : -1;
    return String(b.lastLoginAt || b.createdAt || '').localeCompare(String(a.lastLoginAt || a.createdAt || ''));
  });
}

export async function setFirmStatus(code: string, status: Exclude<FirmStatus, 'deleted'>): Promise<void> {
  await updateDoc(doc(founderDb(), FIRM_REGISTRY_COLL, code), { status, statusChangedAt: new Date().toISOString() });
}

/**
 * Firmanın bütün verisini siler ve kaydı "silindi" olarak işaretler (firma bir daha giremez).
 * Firebase'deki giriş hesabı tarayıcıdan silinemez; kod bu yüzden tekrar kullanılamaz.
 */
export async function deleteFirm(code: string, onProgress?: (deleted: number) => void): Promise<number> {
  const firestore = founderDb();
  let total = 0;
  for (const name of TENANT_COLLECTIONS) {
    // Parça parça: her turda en çok 400 belge okunup silinir
    for (;;) {
      const snap = await getDocs(query(collection(firestore, 'users', code, name), limit(400)));
      if (snap.empty) break;
      const batch = writeBatch(firestore);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      total += snap.size;
      onProgress?.(total);
      if (snap.size < 400) break;
    }
  }
  await setDoc(doc(firestore, FIRM_REGISTRY_COLL, code), {
    status: 'deleted',
    statusChangedAt: new Date().toISOString(),
    sealedPassword: null,
  }, { merge: true });
  return total;
}

/**
 * Panelden yeni firma kurar. Firma hesabı ayrı bir uygulama örneğinde açılır ve hemen kapatılır;
 * kurucu oturumu ve cihazdaki firma oturumu etkilenmez. Kayıt kurucu tarafından yazılır.
 */
export async function createFirmFromPanel(name: string, code: string, password: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const trimmedName = (name || '').trim();
  if (!trimmedName) return { ok: false, message: 'Firma adını yazın.' };
  const codeError = validateTenantCode(code);
  if (codeError) return { ok: false, message: codeError };
  if ((password || '').length < MIN_PASSWORD_LENGTH) return { ok: false, message: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.` };
  const creatorAuth = getAuth(getOrInitApp(CREATOR_APP));
  try {
    await setPersistence(creatorAuth, inMemoryPersistence);
    const cred = await createUserWithEmailAndPassword(creatorAuth, getTenantEmail(code), password);
    await updateProfile(cred.user, { displayName: trimmedName });
  } catch (err: any) {
    logError(toErr(err), 'founderAuth.createFirm');
    if (/email-already-in-use/.test(String(err?.code || ''))) return { ok: false, message: 'Bu firma kodu zaten kullanılıyor. Başka bir kod seçin.' };
    return { ok: false, message: describeFounderError(err) };
  } finally {
    try { await signOut(creatorAuth); } catch { /* oturum zaten kapalı */ }
  }
  try {
    const now = new Date().toISOString();
    const sealed = await sealPassword(password);
    await setDoc(doc(founderDb(), FIRM_REGISTRY_COLL, code), {
      code,
      name: trimmedName.slice(0, 120),
      status: 'active',
      createdAt: now,
      createdBy: 'kurucu',
      ...(sealed ? { sealedPassword: sealed } : {}),
    });
    return { ok: true };
  } catch (err) {
    logError(toErr(err), 'founderAuth.createFirmRecord');
    return { ok: false, message: `Firma hesabı açıldı ama kayıt yazılamadı: ${describeFounderError(err)}` };
  }
}

// ---------------- Firestore kuralları ----------------

/** Firebase Console > Firestore > Kurallar bölümüne yapıştırılacak metin */
export function buildFirestoreRules(founderUid: string): string {
  return `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Sistem kurucusu (Storm Yönetim Paneli): firmaları listeler, dondurur, siler
    function isFounder() {
      return request.auth != null && request.auth.uid == '${founderUid}';
    }

    // Firma hesabı: firmaKodu@storm.com
    function isTenant(tenantId) {
      return request.auth != null && request.auth.token.email == (tenantId + '@storm.com');
    }

    // Dondurulmuş ya da silinmiş firma verisine erişemez (kaydı olmayan eski firmalar etkilenmez)
    function tenantActive(tenantId) {
      let path = /databases/$(database)/documents/firmalar/$(tenantId);
      return !exists(path) || get(path).data.get('status', 'active') == 'active';
    }

    // Her firma yalnızca kendi verisine erişir
    match /users/{tenantId}/{document=**} {
      allow read, write: if (isTenant(tenantId) && tenantActive(tenantId)) || isFounder();
    }

    // Firma kayıtları: firma kendi kaydını günceller ama durumunu değiştiremez
    match /firmalar/{tenantId} {
      allow read: if isFounder() || isTenant(tenantId);
      allow create: if isFounder()
        || (isTenant(tenantId) && request.resource.data.get('status', 'active') == 'active');
      allow update: if isFounder()
        || (isTenant(tenantId) && request.resource.data.get('status', 'active') == resource.data.get('status', 'active'));
      allow delete: if isFounder();
    }

    // Bunun dışındaki her yol kapalıdır.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;
}
