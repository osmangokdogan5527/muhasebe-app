/**
 * Storm Ön Muhasebe - Firma Oturumu (Firebase Auth)
 *
 * Giriş ekranındaki PIN kontrolü yerel yapılır; Firestore güvenlik kuralları ise
 * isteği yapan kullanıcının Firebase oturumuna bakar. Bu yardımcı, PIN doğrulandıktan
 * sonra aynı firmanın Firebase hesabıyla (firmaId@storm.com) oturum açar; böylece
 * kurallar her firmanın yalnızca kendi users/{firmaId} verisine erişmesine izin verir.
 */
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from '../firebase';
import { PIN_ACCOUNTS } from '../constants';
import { logError } from './errorLogger';

export type TenantSignInResult =
  | { status: 'signed_in' }
  | { status: 'offline' }
  | { status: 'failed'; message: string };

const NETWORK_ERROR_CODES = ['auth/network-request-failed', 'auth/internal-error', 'auth/timeout'];

export function getTenantEmail(accountId: string): string {
  return `${accountId}@storm.com`.toLowerCase();
}

export async function signInTenant(accountId: string): Promise<TenantSignInResult> {
  const email = getTenantEmail(accountId);
  const account = PIN_ACCOUNTS.find((acc) => acc.email.toLowerCase() === email);
  if (!account) {
    return { status: 'failed', message: `Bu hesap için Firebase oturum bilgisi tanımlı değil (${email}).` };
  }

  // Aynı firmanın oturumu zaten açıksa (Firebase oturumu cihazda saklanır) tekrar giriş gerekmez
  if (auth.currentUser && (auth.currentUser.email || '').toLowerCase() === email) {
    return { status: 'signed_in' };
  }

  try {
    // Başka firmanın oturumu açık kaldıysa önce kapat
    if (auth.currentUser) {
      await signOut(auth);
    }
    await signInWithEmailAndPassword(auth, account.email, account.password);
    return { status: 'signed_in' };
  } catch (err: any) {
    const code = err?.code || '';
    if (NETWORK_ERROR_CODES.includes(code)) {
      // Çevrimdışı: veriler yerel önbellekten çalışır, bağlantı gelince oturum açılması gerekir
      return { status: 'offline' };
    }
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
      // Hesap henüz yoksa oluştur (ilk kurulum)
      try {
        const credential = await createUserWithEmailAndPassword(auth, account.email, account.password);
        await updateProfile(credential.user, { displayName: account.name });
        return { status: 'signed_in' };
      } catch (createErr: any) {
        if (NETWORK_ERROR_CODES.includes(createErr?.code || '')) {
          return { status: 'offline' };
        }
        logError(createErr instanceof Error ? createErr : new Error(String(createErr)), 'tenantAuth.createUser');
        const message = createErr?.code === 'auth/email-already-in-use'
          ? `Firebase hesabı (${email}) mevcut ama şifresi uygulamadakiyle eşleşmiyor.`
          : `Firebase hesabı oluşturulamadı: ${createErr?.message || createErr}`;
        return { status: 'failed', message };
      }
    }
    logError(err instanceof Error ? err : new Error(String(err)), 'tenantAuth.signIn');
    return { status: 'failed', message: `Firebase oturumu açılamadı: ${err?.message || err}` };
  }
}
