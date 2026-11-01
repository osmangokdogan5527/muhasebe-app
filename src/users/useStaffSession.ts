import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { subscribeSettingDoc, saveSettingDoc } from '../firebase';
import { logError } from '../utils/errorLogger';
import { IDLE_LOGOUT_MINUTES, StaffUser, USERS_SETTING_ID, normalizeUsersDoc } from './staffUsers';

interface StoredSession {
  userId: string;
  lastActive: number;
}

const sessionKey = (tenantId: string) => `storm_staff_session_${tenantId}`;
const IDLE_MS = IDLE_LOGOUT_MINUTES * 60 * 1000;

function readSession(tenantId: string): StoredSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(tenantId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.userId !== 'string') return null;
    if (Date.now() - Number(parsed.lastActive || 0) > IDLE_MS) return null;
    return { userId: parsed.userId, lastActive: Number(parsed.lastActive) };
  } catch {
    return null;
  }
}

function writeSession(tenantId: string, session: StoredSession | null) {
  try {
    if (session) localStorage.setItem(sessionKey(tenantId), JSON.stringify(session));
    else localStorage.removeItem(sessionKey(tenantId));
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'useStaffSession.writeSession');
  }
}

/**
 * Firma kullanıcıları ve oturum: kim giriş yaptı, 20 dakika işlem yapılmazsa çıkış.
 * Kullanıcı listesi boşsa sistem kapalıdır (uygulama eskisi gibi çalışır).
 */
export function useStaffSession(tenantId: string | null | undefined) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const lastWriteRef = useRef(0);

  // Kullanıcı listesi (canlı)
  useEffect(() => {
    if (!tenantId) {
      setUsers([]);
      setLoaded(false);
      setCurrentId(null);
      return;
    }
    setCurrentId(readSession(tenantId)?.userId || null);
    let unsub: (() => void) | undefined;
    // Çevrimdışı ve önbellek boşsa liste gelmeyebilir: kilitlenmemek için kısa süre sonra yüklendi say
    const fallback = setTimeout(() => setLoaded(true), 4000);
    try {
      unsub = subscribeSettingDoc(USERS_SETTING_ID, (data) => {
        setUsers(normalizeUsersDoc(data).users);
        setLoaded(true);
      });
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'useStaffSession.subscribe');
      setLoaded(true);
    }
    return () => {
      clearTimeout(fallback);
      unsub?.();
    };
  }, [tenantId]);

  const activeUsers = useMemo(() => users.filter((u) => u.active), [users]);
  const systemActive = activeUsers.length > 0;
  const currentUser = useMemo(() => activeUsers.find((u) => u.id === currentId) || null, [activeUsers, currentId]);

  const login = useCallback((user: StaffUser) => {
    if (!tenantId) return;
    writeSession(tenantId, { userId: user.id, lastActive: Date.now() });
    setCurrentId(user.id);
  }, [tenantId]);

  const logout = useCallback(() => {
    if (tenantId) writeSession(tenantId, null);
    setCurrentId(null);
  }, [tenantId]);

  // İşlem yapılmazsa otomatik çıkış
  useEffect(() => {
    if (!tenantId || !systemActive || !currentId) return;
    const touch = () => {
      const now = Date.now();
      // Her dokunuşta değil, en çok 15 saniyede bir yazılır
      if (now - lastWriteRef.current < 15_000) return;
      lastWriteRef.current = now;
      writeSession(tenantId, { userId: currentId, lastActive: now });
    };
    touch();
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = setInterval(() => {
      if (!readSession(tenantId)) {
        setCurrentId(null);
      }
    }, 30_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      clearInterval(timer);
    };
  }, [tenantId, systemActive, currentId]);

  const saveUsers = useCallback(async (next: StaffUser[]) => {
    await saveSettingDoc(USERS_SETTING_ID, { users: next });
    setUsers(next);
  }, []);

  return { users, activeUsers, loaded, systemActive, currentUser, login, logout, saveUsers };
}

export type StaffSession = ReturnType<typeof useStaffSession>;
