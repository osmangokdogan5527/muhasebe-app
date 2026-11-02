import { useState, useEffect } from 'react';
import { auth, signOut, onAuthStateChanged, User as FirebaseUser, setActiveUser } from '../firebase';
import { logError } from '../utils/errorLogger';

const ACTIVE_USER_KEY = 'storm_muhasebe_active_user';
/** Bu açılışta giriş yapılan firma (yalnızca sayfa yenilemede oturumu korumak için) */
const SESSION_MARKER_KEY = 'storm_session_active_tenant';

export function markSessionActive(uid: string) {
  try {
    sessionStorage.setItem(SESSION_MARKER_KEY, uid);
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'useAppAuth.markSessionActive');
  }
}

function readSessionMarker(): string | null {
  try {
    return sessionStorage.getItem(SESSION_MARKER_KEY);
  } catch {
    return null;
  }
}

function clearSessionMarker() {
  try {
    sessionStorage.removeItem(SESSION_MARKER_KEY);
  } catch {
    // sessionStorage kullanılamıyorsa yapılacak bir şey yok
  }
}

export function useAppAuth(
  showToast: (text: string | null, type?: 'success' | 'error' | 'info') => void,
  setUserRole: (role: 'admin' | 'employee') => void,
  setActiveTab: (tab: any) => void
) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Açılışta oturum: uygulama her yeni açılışta firma şifresini ister. Ancak aynı açılış içinde
  // sayfa yenilenirse (telefonda aşağı çekip yenileme, F5) oturum korunur: giriş yapılınca
  // sessionStorage'a işaret konur; yenilemede işaret ve Firebase oturumu aynı firmayı gösteriyorsa
  // kullanıcı geri yüklenir. Uygulama kapatılınca sessionStorage silinir, şifre yine sorulur.
  useEffect(() => {
    let done = false;
    let unsubscribe: (() => void) | undefined;
    const finish = (restored: FirebaseUser | null) => {
      if (done) return;
      done = true;
      if (restored) {
        setActiveUser(restored.uid);
        setUser(restored);
      } else {
        setActiveUser(null);
        setUser(null);
      }
      setAuthLoading(false);
      unsubscribe?.();
    };

    let stored: any = null;
    try {
      const raw = localStorage.getItem(ACTIVE_USER_KEY);
      stored = raw ? JSON.parse(raw) : null;
    } catch (err) {
      localStorage.removeItem(ACTIVE_USER_KEY);
      logError(err instanceof Error ? err : new Error(String(err)), 'useAppAuth.readStoredUser');
    }
    const sessionUid = readSessionMarker();
    if (!stored?.uid || !sessionUid || sessionUid !== stored.uid) {
      finish(null);
      return;
    }

    try {
      // Firebase oturumu yerel depodan (çevrimdışı da) yüklenince bir kez bildirilir
      unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        const expected = `${String(stored.uid)}@storm.com`.toLowerCase();
        if (fbUser && (fbUser.email || '').toLowerCase() === expected) {
          finish(stored as FirebaseUser);
        } else {
          clearSessionMarker();
          finish(null);
        }
      });
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'useAppAuth.restore');
      finish(null);
    }
    // Firebase yanıt vermezse giriş ekranı açılır (kilitlenme olmaz)
    const timer = setTimeout(() => finish(null), 5000);
    return () => {
      clearTimeout(timer);
      unsubscribe?.();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem(ACTIVE_USER_KEY);
      clearSessionMarker();
      setUser(null);
      setUserRole('employee');
      setActiveTab('dashboard');
    } catch (e) {
      showToast("Çıkış yapılırken bir hata oluştu.", "error");
    }
  };

  return {
    user, setUser,
    authLoading, setAuthLoading,
    authError, setAuthError,
    handleSignOut
  };
}
