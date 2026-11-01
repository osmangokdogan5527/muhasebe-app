import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { subscribeSettingDoc, saveSettingDoc, recordActivity } from '../firebase';
import { logError } from '../utils/errorLogger';
import { IDLE_LOGOUT_MINUTES, StaffUser, USERS_SETTING_ID, normalizeUsersDoc } from './staffUsers';
import type { ActivityActor } from './activityTypes';

interface StoredSession {
  userId: string;
  userName?: string;
  role?: 'owner' | 'staff';
  lastActive: number;
}

const sessionKey = (tenantId: string) => `storm_staff_session_${tenantId}`;
/** Bu cihazda kullanıcı sisteminin açık olduğu görüldü mü? (çevrimdışı açılışta sistemi atlamamak için) */
const systemFlagKey = (tenantId: string) => `storm_staff_system_${tenantId}`;

function readSystemFlag(tenantId: string): boolean {
  try {
    return localStorage.getItem(systemFlagKey(tenantId)) === '1';
  } catch {
    return false;
  }
}

function writeSystemFlag(tenantId: string, on: boolean) {
  try {
    if (on) localStorage.setItem(systemFlagKey(tenantId), '1');
    else localStorage.removeItem(systemFlagKey(tenantId));
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'useStaffSession.writeSystemFlag');
  }
}
const IDLE_MS = IDLE_LOGOUT_MINUTES * 60 * 1000;

function readRawSession(tenantId: string): StoredSession | null {
  try {
    const raw = localStorage.getItem(sessionKey(tenantId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.userId !== 'string') return null;
    return {
      userId: parsed.userId,
      userName: typeof parsed.userName === 'string' ? parsed.userName : undefined,
      role: parsed.role === 'owner' ? 'owner' : parsed.role === 'staff' ? 'staff' : undefined,
      lastActive: Number(parsed.lastActive) || 0,
    };
  } catch {
    return null;
  }
}

const isExpired = (session: StoredSession) => Date.now() - session.lastActive > IDLE_MS;

function writeSession(tenantId: string, session: StoredSession | null) {
  try {
    if (session) localStorage.setItem(sessionKey(tenantId), JSON.stringify(session));
    else localStorage.removeItem(sessionKey(tenantId));
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'useStaffSession.writeSession');
  }
}

const actorOf = (user: Pick<StaffUser, 'id' | 'name' | 'role'>): ActivityActor => ({ id: user.id, name: user.name, role: user.role });

/** Süresi dolmuş oturumu günlüğe yazar (kişi adı oturumda saklıdır) */
function logExpired(session: StoredSession) {
  if (!session.userName) return;
  const lastSeen = new Date(session.lastActive);
  const time = Number.isNaN(lastSeen.getTime()) ? '' : ` · son işlem ${lastSeen.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  recordActivity(
    { category: 'oturum', action: 'auto_logout', title: `Oturum kapandı (${IDLE_LOGOUT_MINUTES} dk işlem yok)${time}` },
    { id: session.userId, name: session.userName, role: session.role || 'staff' },
  );
}

/**
 * Firma kullanıcıları ve oturum: kim giriş yaptı, 20 dakika işlem yapılmazsa çıkış.
 * Kullanıcı listesi boşsa sistem kapalıdır (uygulama eskisi gibi çalışır).
 * Giriş, çıkış ve otomatik çıkışlar hareket günlüğüne yazılır.
 */
export function useStaffSession(tenantId: string | null | undefined) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  // Kullanıcı listesi sunucudan doğrulandı mı (önbellekten gelen boş liste sistemi kapatmaz)
  const [serverConfirmed, setServerConfirmed] = useState(false);
  const [systemFlag, setSystemFlag] = useState(false);
  const lastWriteRef = useRef(0);

  // Kullanıcı listesi (canlı)
  useEffect(() => {
    if (!tenantId) {
      setUsers([]);
      setLoaded(false);
      setCurrentId(null);
      setServerConfirmed(false);
      setSystemFlag(false);
      return;
    }
    setServerConfirmed(false);
    setSystemFlag(readSystemFlag(tenantId));
    const stored = readRawSession(tenantId);
    if (stored && isExpired(stored)) {
      // Uygulama kapalıyken süre dolmuş: oturum kapatılır ve günlüğe yazılır
      logExpired(stored);
      writeSession(tenantId, null);
      setCurrentId(null);
    } else {
      setCurrentId(stored?.userId || null);
    }
    let unsub: (() => void) | undefined;
    // Çevrimdışı ve önbellek boşsa liste gelmeyebilir: kilitlenmemek için kısa süre sonra yüklendi say
    const fallback = setTimeout(() => setLoaded(true), 4000);
    try {
      unsub = subscribeSettingDoc(USERS_SETTING_ID, (data, meta) => {
        const list = normalizeUsersDoc(data).users;
        setUsers(list);
        if (!meta?.fromCache) setServerConfirmed(true);
        const anyActive = list.some((u) => u.active);
        if (anyActive) {
          writeSystemFlag(tenantId, true);
          setSystemFlag(true);
        } else if (!meta?.fromCache) {
          // Sunucu sistemin kapalı olduğunu doğruladı
          writeSystemFlag(tenantId, false);
          setSystemFlag(false);
        }
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
  /**
   * Bu cihazda sistem açıktı ama kullanıcı listesi henüz okunamadı (çevrimdışı, önbellek boş):
   * uygulama herkese açık başlamaz; bağlantı beklenir.
   */
  const waitingForUsers = !systemActive && systemFlag && !serverConfirmed;
  const currentUser = useMemo(() => activeUsers.find((u) => u.id === currentId) || null, [activeUsers, currentId]);

  const login = useCallback((user: StaffUser) => {
    if (!tenantId) return;
    writeSession(tenantId, { userId: user.id, userName: user.name, role: user.role, lastActive: Date.now() });
    lastWriteRef.current = Date.now();
    setCurrentId(user.id);
    try {
      recordActivity({ category: 'oturum', action: 'login', title: 'Giriş yaptı' }, actorOf(user));
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'useStaffSession.login');
    }
  }, [tenantId]);

  const logout = useCallback(() => {
    try {
      if (currentUser) recordActivity({ category: 'oturum', action: 'logout', title: 'Çıkış yaptı' }, actorOf(currentUser));
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'useStaffSession.logout');
    }
    if (tenantId) writeSession(tenantId, null);
    setCurrentId(null);
  }, [tenantId, currentUser]);

  // İşlem yapılmazsa otomatik çıkış
  useEffect(() => {
    if (!tenantId || !systemActive || !currentUser) return;
    const touch = () => {
      const now = Date.now();
      // Her dokunuşta değil, en çok 15 saniyede bir yazılır
      if (now - lastWriteRef.current < 15_000) return;
      const stored = readRawSession(tenantId);
      // Başka sekmede çıkış yapılmış ya da süre dolmuşsa dokunuş oturumu geri açmaz
      if (!stored || stored.userId !== currentUser.id || isExpired(stored)) return;
      lastWriteRef.current = now;
      writeSession(tenantId, { userId: currentUser.id, userName: currentUser.name, role: currentUser.role, lastActive: now });
    };
    touch();
    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = setInterval(() => {
      const stored = readRawSession(tenantId);
      if (!stored || stored.userId !== currentUser.id) {
        // Başka sekmede çıkış/kişi değişimi
        setCurrentId(stored && !isExpired(stored) ? stored.userId : null);
        return;
      }
      if (isExpired(stored)) {
        logExpired({ ...stored, userName: stored.userName || currentUser.name, role: stored.role || currentUser.role });
        writeSession(tenantId, null);
        setCurrentId(null);
      }
    }, 30_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      clearInterval(timer);
    };
  }, [tenantId, systemActive, currentUser]);

  const saveUsers = useCallback(async (next: StaffUser[]) => {
    await saveSettingDoc(USERS_SETTING_ID, { users: next });
    setUsers(next);
  }, []);

  return { users, activeUsers, loaded, systemActive, waitingForUsers, currentUser, login, logout, saveUsers };
}

export type StaffSession = ReturnType<typeof useStaffSession>;
