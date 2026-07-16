import { useState, useEffect } from 'react';
import { auth, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, User as FirebaseUser, setActiveUser } from '../firebase';
import { PIN_ACCOUNTS } from '../constants';

export function useAppAuth(
  showToast: (text: string | null, type?: 'success' | 'error' | 'info') => void,
  setUserRole: (role: 'admin' | 'employee') => void,
  setActiveTab: (tab: any) => void
) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [enteredPin, setEnteredPin] = useState('');

  // Initialize Authentication state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('storm_muhasebe_active_user');
    if (storedUser) {
      try {
        JSON.parse(storedUser);
        // Do NOT auto-login, require PIN entry every time.
        setActiveUser(null);
        setUser(null); 
      } catch (e) {
        localStorage.removeItem('storm_muhasebe_active_user');
        setActiveUser(null);
      }
    } else {
      setActiveUser(null);
    }
    setAuthLoading(false);
  }, []);

  const handlePinLogin = async (pin: string) => {
    if (pin.length !== 6) {
      showToast('Lütfen 6 haneli giriş kodunuzu tam olarak girin.', 'error');
      return;
    }
    const account = PIN_ACCOUNTS.find(acc => acc.pin === pin);
    if (!account) {
      showToast('Geçersiz giriş kodu! Lütfen sistemde tanımlı olan 5 koddan birini kullanın.', 'error');
      return;
    }
    showToast(null, 'info');
    try {
      await signInWithEmailAndPassword(auth, account.email, account.password);
    } catch (err: any) {
      console.warn("Otomatik giriş başarısız oldu, kullanıcı kaydı kontrol ediliyor...", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
          await updateProfile(userCredential.user, { displayName: account.name });
        } catch (createErr: any) {
          console.error("Otomatik hesap kaydı başarısız oldu:", createErr);
          showToast(`Kullanıcı kaydı oluşturulamadı: ${createErr.message || createErr}`, 'error');
        }
      } else {
        showToast(`Giriş hatası: ${err.message || err}`, 'error');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('storm_muhasebe_active_user');
      setUser(null);
      setUserRole('employee');
      setActiveTab('dashboard');
    } catch (e) {
      showToast("Çıkış yapılırken bir hata oluştu.", "error");
    }
  };

  useEffect(() => {
    if (user) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key >= '0' && e.key <= '9') {
        setEnteredPin(prev => {
          if (prev.length < 6) {
            const next = prev + e.key;
            if (next.length === 6) {
              handlePinLogin(next);
            }
            return next;
          }
          return prev;
        });
      } else if (e.key === 'Backspace') {
        setEnteredPin(prev => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        setEnteredPin('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  return {
    user, setUser,
    authLoading, setAuthLoading,
    authError, setAuthError,
    enteredPin, setEnteredPin,
    handlePinLogin, handleSignOut
  };
}
