/**
 * Storm Ön Muhasebe - Firma Oturumu (Firebase Auth)
 *
 * Her firma Firebase'de firmaKodu@storm.com hesabıyla temsil edilir ve verisi
 * users/{firmaKodu} altında durur. Firestore kuralları yalnızca o hesapla oturum açmış
 * kullanıcıya erişim verir. Kodda hiçbir hesap ya da şifre yoktur: şifreyi kullanıcı
 * belirler ve Firebase doğrular. İnternet yokken cihazdaki doğrulama özeti kullanılır.
 */
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from '../firebase';
import { DeviceAccount, createPasswordVerifier, upsertDeviceAccount, verifyPassword } from './accountStore';
import { logError } from './errorLogger';

export type TenantAuthResult =
  | { status: 'signed_in'; account: DeviceAccount }
  | { status: 'offline'; account: DeviceAccount }
  | { status: 'failed'; message: string };

export const MIN_PASSWORD_LENGTH = 6;

const NETWORK_ERROR_CODES = ['auth/network-request-failed', 'auth/internal-error', 'auth/timeout'];
const WRONG_PASSWORD_CODES = ['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/user-not-found'];

export function getTenantEmail(tenantId: string): string {
  return `${tenantId}@storm.com`.toLowerCase();
}

/** Firma adından önerilen firma kodu üretir (ör. "Gökdoğan Tekstil" → "gokdogan_tekstil"). */
export function suggestTenantCode(name: string): string {
  const map: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  return (name || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (ch) => map[ch] || ch)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);
}

export function validateTenantCode(code: string): string | null {
  if (!code || code.length < 3 || code.length > 30) return 'Firma kodu 3-30 karakter olmalıdır.';
  if (!/^[a-z0-9_]+$/.test(code)) return 'Firma kodu yalnızca küçük harf (a-z), rakam ve alt çizgi (_) içerebilir.';
  return null;
}

function describeAuthError(err: any): string {
  const code = err?.code || '';
  if (NETWORK_ERROR_CODES.includes(code)) return 'İnternet bağlantısı yok. Bu işlem için internet gereklidir.';
  if (WRONG_PASSWORD_CODES.includes(code)) return 'Firma kodu veya şifre hatalı.';
  if (code === 'auth/too-many-requests') return 'Çok fazla hatalı deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin.';
  if (code === 'auth/email-already-in-use') return 'Bu firma kodu zaten kullanılıyor. Başka bir kod seçin ya da "Mevcut Firmaya Bağlan" ile giriş yapın.';
  if (code === 'auth/weak-password') return `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.`;
  if (code === 'auth/operation-not-allowed') return 'Firebase\'de E-posta/Şifre ile giriş kapalı. Firebase Console > Authentication > Sign-in method bölümünden açılmalıdır.';
  if (code === 'auth/requires-recent-login') return 'Güvenlik için tekrar giriş yapmanız gerekiyor.';
  return err?.message || String(err);
}

async function rememberAccount(account: DeviceAccount, password: string): Promise<DeviceAccount> {
  const verifier = await createPasswordVerifier(password);
  const saved: DeviceAccount = { ...account, verifier };
  upsertDeviceAccount(saved);
  return saved;
}

/** Yeni firma oluşturur (internet gerekir). */
export async function createTenant(name: string, code: string, password: string): Promise<TenantAuthResult> {
  const trimmedName = (name || '').trim();
  if (!trimmedName) return { status: 'failed', message: 'Firma adı boş olamaz.' };
  const codeError = validateTenantCode(code);
  if (codeError) return { status: 'failed', message: codeError };
  if ((password || '').length < MIN_PASSWORD_LENGTH) return { status: 'failed', message: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.` };

  try {
    const credential = await createUserWithEmailAndPassword(auth, getTenantEmail(code), password);
    await updateProfile(credential.user, { displayName: trimmedName });
    const account = await rememberAccount({ id: code, name: trimmedName }, password);
    return { status: 'signed_in', account };
  } catch (err: any) {
    logError(err instanceof Error ? err : new Error(String(err)), 'tenantAuth.createTenant');
    return { status: 'failed', message: describeAuthError(err) };
  }
}

/** Başka cihazda oluşturulmuş bir firmaya bu cihazdan bağlanır (internet gerekir). */
export async function connectTenant(code: string, password: string): Promise<TenantAuthResult> {
  const normalized = (code || '').trim().toLowerCase();
  const codeError = validateTenantCode(normalized);
  if (codeError) return { status: 'failed', message: codeError };

  try {
    const credential = await signInWithEmailAndPassword(auth, getTenantEmail(normalized), password);
    const name = credential.user.displayName || normalized;
    const account = await rememberAccount({ id: normalized, name }, password);
    return { status: 'signed_in', account };
  } catch (err: any) {
    if (!WRONG_PASSWORD_CODES.includes(err?.code || '')) {
      logError(err instanceof Error ? err : new Error(String(err)), 'tenantAuth.connectTenant');
    }
    return { status: 'failed', message: describeAuthError(err) };
  }
}

/** Cihazda kayıtlı bir firmaya giriş yapar; internet yoksa cihazdaki doğrulama özetiyle açar. */
export async function signInTenant(account: DeviceAccount, password: string): Promise<TenantAuthResult> {
  try {
    await signInWithEmailAndPassword(auth, getTenantEmail(account.id), password);
    const saved = await rememberAccount(account, password);
    return { status: 'signed_in', account: saved };
  } catch (err: any) {
    const code = err?.code || '';
    if (NETWORK_ERROR_CODES.includes(code)) {
      if (await verifyPassword(password, account.verifier)) {
        return { status: 'offline', account };
      }
      return {
        status: 'failed',
        message: account.verifier
          ? 'Şifre hatalı.'
          : 'İnternet bağlantısı yok ve bu firma için cihazda çevrimdışı giriş bilgisi bulunmuyor. İlk giriş için internet gereklidir.'
      };
    }
    if (!WRONG_PASSWORD_CODES.includes(code)) {
      logError(err instanceof Error ? err : new Error(String(err)), 'tenantAuth.signInTenant');
    }
    return { status: 'failed', message: code && WRONG_PASSWORD_CODES.includes(code) ? 'Şifre hatalı.' : describeAuthError(err) };
  }
}

/** Oturum açık firmanın şifresini değiştirir (mevcut şifre ile yeniden doğrulama yapılır). */
export async function changeTenantPassword(account: DeviceAccount, currentPassword: string, newPassword: string): Promise<{ ok: boolean; message?: string }> {
  if ((newPassword || '').length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `Yeni şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.` };
  }
  const user = auth.currentUser;
  if (!user || (user.email || '').toLowerCase() !== getTenantEmail(account.id)) {
    return { ok: false, message: 'Şifre değiştirmek için internete bağlıyken bu firmayla giriş yapmış olmanız gerekir.' };
  }
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(getTenantEmail(account.id), currentPassword));
    await updatePassword(user, newPassword);
    await rememberAccount(account, newPassword);
    return { ok: true };
  } catch (err: any) {
    if (!WRONG_PASSWORD_CODES.includes(err?.code || '')) {
      logError(err instanceof Error ? err : new Error(String(err)), 'tenantAuth.changeTenantPassword');
    }
    return { ok: false, message: WRONG_PASSWORD_CODES.includes(err?.code || '') ? 'Mevcut şifre hatalı.' : describeAuthError(err) };
  }
}
