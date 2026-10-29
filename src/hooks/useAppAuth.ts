import { useState, useEffect } from 'react';
import { auth, signOut, User as FirebaseUser, setActiveUser } from '../firebase';

export function useAppAuth(
  showToast: (text: string | null, type?: 'success' | 'error' | 'info') => void,
  setUserRole: (role: 'admin' | 'employee') => void,
  setActiveTab: (tab: any) => void
) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

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

  return {
    user, setUser,
    authLoading, setAuthLoading,
    authError, setAuthError,
    handleSignOut
  };
}
