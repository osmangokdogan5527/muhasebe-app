/**
 * Otomatik yedek.
 *
 * Bilgisayarda (masaüstü uygulaması): seçilen sıklıkta (varsayılan haftalık) tüm veriler sessizce
 * .storm paketi olarak yedek klasörüne yazılır; son 8 yedek tutulur. Kim giriş yapmış olursa olsun
 * çalışır (yedek veri güvenliğidir), ama durumu yalnızca sahip ve yetki verilen kişi görür.
 *
 * Telefon / tarayıcı: dosya sessizce kaydedilemez. Yedek zamanı geldiğinde yalnızca yedek yetkisi
 * olan kişiye hatırlatma gösterilir (indirme sihirbazdan yapılır).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribeSettingDoc } from '../firebase';
import { logError } from '../utils/errorLogger';
import { autoBackupFileName, countBackupRecords, createBackupPayload, downloadBackupFile, encodeBackup, manualBackupFileName } from './backupPayload';
import {
  BACKUP_STATUS_SETTING_ID,
  BackupStatus,
  frequencyMs,
  normalizeBackupStatus,
  readFrequency,
  readLocalLastBackup,
  recordBackupDone,
} from './backupStatus';

interface ElectronBackupApi {
  saveAutoBackup?: (content: string, fileName: string) => Promise<{ success: boolean; path?: string; error?: string }>;
}

const electronApi = (): ElectronBackupApi | null => {
  try {
    return ((window as any).electronAPI as ElectronBackupApi) || null;
  } catch {
    return null;
  }
};

const autoKey = (tenantId: string) => `storm_auto_backup_last_${tenantId}`;
/** Hiç yedek yoksa hatırlatma bu cihazda firmanın ilk görüldüğü andan itibaren sayılır (yeni firmada hemen açılmaz) */
const firstSeenKey = (tenantId: string) => `storm_backup_first_seen_${tenantId}`;

function readFirstSeen(tenantId: string): number {
  try {
    const existing = Number(localStorage.getItem(firstSeenKey(tenantId))) || 0;
    if (existing) return existing;
    const now = Date.now();
    localStorage.setItem(firstSeenKey(tenantId), String(now));
    return now;
  } catch {
    return Date.now();
  }
}
/** Uygulama açılır açılmaz ağır okuma yapılmaz; ekranlar yüklendikten sonra yedek alınır */
const START_DELAY_MS = 20_000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

function readAutoLast(tenantId: string): number {
  try {
    return Number(localStorage.getItem(autoKey(tenantId))) || 0;
  } catch {
    return 0;
  }
}

function writeAutoLast(tenantId: string, ms: number) {
  try {
    localStorage.setItem(autoKey(tenantId), String(ms));
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'useAutoBackup.writeAutoLast');
  }
}

interface Options {
  /** Firma (giriş yapılmış ve kullanıcı listesi yüklenmiş olmalı) */
  tenantId: string | null | undefined;
  ready: boolean;
  /** Ayarlar > Otomatik Yedekleme anahtarı */
  autoEnabled: boolean;
  /** Yedek durumunu görme / yedek alma yetkisi */
  canManage: boolean;
  actorName?: string;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export function useAutoBackup({ tenantId, ready, autoEnabled, canManage, actorName, showToast }: Options) {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const actorRef = useRef(actorName);
  actorRef.current = actorName;
  const canSilentSave = !!electronApi()?.saveAutoBackup;

  // Firma yedek durumu (canlı)
  useEffect(() => {
    setStatus(null);
    setStatusLoaded(false);
    if (!tenantId || !ready) return;
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeSettingDoc(BACKUP_STATUS_SETTING_ID, (data, meta) => {
        setStatus(normalizeBackupStatus(data));
        if (!meta?.fromCache) setStatusLoaded(true);
      }, true);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'useAutoBackup.subscribe');
    }
    return () => unsub?.();
  }, [tenantId, ready]);

  /** Yedeği alır: bilgisayarda yedek klasörüne yazar, telefonda/tarayıcıda indirir */
  const runBackup = useCallback(async (kind: 'auto' | 'manual'): Promise<boolean> => {
    if (!tenantId || runningRef.current) return false;
    runningRef.current = true;
    setRunning(true);
    try {
      const payload = await createBackupPayload();
      const records = countBackupRecords(payload);
      const content = encodeBackup(payload);
      const api = electronApi();
      let fileName: string;
      if (api?.saveAutoBackup) {
        fileName = autoBackupFileName();
        const result = await api.saveAutoBackup(content, fileName);
        if (!result?.success) throw new Error(result?.error || 'Yedek dosyası yazılamadı.');
      } else {
        if (kind === 'auto') return false;
        fileName = manualBackupFileName(false);
        downloadBackupFile(content, fileName);
      }
      if (kind === 'auto' || api?.saveAutoBackup) writeAutoLast(tenantId, Date.now());
      await recordBackupDone({ kind, byName: actorRef.current, fileName, records });
      if (kind === 'manual') showToast(api?.saveAutoBackup ? 'Yedek alındı ve yedek klasörüne kaydedildi.' : 'Yedek dosyası indirildi.', 'success');
      return true;
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), `useAutoBackup.run:${kind}`);
      if (kind === 'manual') showToast(`Yedek alınamadı: ${err instanceof Error ? err.message : String(err)}`, 'error');
      return false;
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  }, [tenantId, showToast]);

  // Bilgisayarda sessiz otomatik yedek
  useEffect(() => {
    if (!tenantId || !ready || !autoEnabled || !canSilentSave) return;
    const check = () => {
      try {
        const last = readAutoLast(tenantId);
        if (Date.now() - last < frequencyMs(readFrequency())) return;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
        runBackup('auto');
      } catch (err) {
        logError(err instanceof Error ? err : new Error(String(err)), 'useAutoBackup.check');
      }
    };
    const first = setTimeout(check, START_DELAY_MS);
    const timer = setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [tenantId, ready, autoEnabled, canSilentSave, runBackup]);

  /**
   * Hatırlatma gerekiyor mu? (otomatik yedeğin çalışmadığı cihazda, yetkili kişiye)
   * Firma durumu sunucudan okunmadan karar verilmez; bu cihazdaki son yedek de sayılır.
   */
  const silentActive = canSilentSave && autoEnabled;
  let reminderDue = false;
  try {
    const freq = readFrequency();
    if (canManage && ready && statusLoaded && !silentActive && freq !== 'disabled') {
      const firmLast = status ? new Date(status.lastAt).getTime() : 0;
      let last = Math.max(firmLast || 0, readLocalLastBackup());
      if (!last) last = tenantId ? readFirstSeen(tenantId) : Date.now();
      reminderDue = Date.now() - last > frequencyMs(freq);
    }
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'useAutoBackup.reminder');
  }

  const backupNow = useCallback(() => runBackup('manual'), [runBackup]);

  return { status, statusLoaded, running, canSilentSave, silentActive, reminderDue, backupNow };
}

export type AutoBackup = ReturnType<typeof useAutoBackup>;
