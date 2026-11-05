/**
 * Yedek durumu: firmanın son yedeği ne zaman, hangi cihazdan, kim tarafından alındı.
 * Firma ayarlarında (ayarlar/yedekDurumu) tutulur; böylece sahip başka cihazdan da görür.
 */
import { BACKUP_STATUS_DOC_ID, saveSettingDoc } from '../firebase';
import { currentDevice } from '../users/activityTypes';
import { logError } from '../utils/errorLogger';

export const BACKUP_STATUS_SETTING_ID = BACKUP_STATUS_DOC_ID;
/** Bu cihazda son yedek (eski sihirbaz da bu anahtarı kullanır) */
export const LOCAL_LAST_BACKUP_KEY = 'storm_last_backup_time';
export const BACKUP_FREQUENCY_KEY = 'storm_backup_frequency';

export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'disabled';
export type BackupKind = 'auto' | 'manual';

export interface BackupStatus {
  lastAt: string;
  kind: BackupKind;
  device: 'Telefon' | 'Bilgisayar';
  byName?: string;
  fileName?: string;
  records?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function readFrequency(): BackupFrequency {
  try {
    const v = localStorage.getItem(BACKUP_FREQUENCY_KEY);
    return v === 'daily' || v === 'monthly' || v === 'disabled' ? v : 'weekly';
  } catch {
    return 'weekly';
  }
}

/** Yedekler arası süre (kapalıysa otomatik yedek haftalık alınır, yalnızca hatırlatma kapanır) */
export function frequencyMs(freq: BackupFrequency): number {
  if (freq === 'daily') return DAY_MS;
  if (freq === 'monthly') return 30 * DAY_MS;
  return 7 * DAY_MS;
}

export function normalizeBackupStatus(data: Record<string, any> | null | undefined): BackupStatus | null {
  try {
    if (!data || typeof data.lastAt !== 'string' || Number.isNaN(new Date(data.lastAt).getTime())) return null;
    return {
      lastAt: data.lastAt,
      kind: data.kind === 'auto' ? 'auto' : 'manual',
      device: data.device === 'Telefon' ? 'Telefon' : 'Bilgisayar',
      byName: typeof data.byName === 'string' ? data.byName : undefined,
      fileName: typeof data.fileName === 'string' ? data.fileName : undefined,
      records: Number.isFinite(Number(data.records)) ? Number(data.records) : undefined,
    };
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'backupStatus.normalize');
    return null;
  }
}

/** Bu cihazda alınan son yedeğin zamanı (ms), yoksa 0 */
export function readLocalLastBackup(): number {
  try {
    return Number(localStorage.getItem(LOCAL_LAST_BACKUP_KEY)) || 0;
  } catch {
    return 0;
  }
}

/** Yedek alındı: cihaza ve firma ayarlarına yazılır (firma kaydı başarısız olsa da yedek geçerlidir) */
export async function recordBackupDone(info: { kind: BackupKind; byName?: string; fileName?: string; records?: number }): Promise<void> {
  const now = new Date();
  try {
    localStorage.setItem(LOCAL_LAST_BACKUP_KEY, String(now.getTime()));
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'backupStatus.local');
  }
  try {
    const status: BackupStatus = { lastAt: now.toISOString(), kind: info.kind, device: currentDevice(), byName: info.byName, fileName: info.fileName, records: info.records };
    await saveSettingDoc(BACKUP_STATUS_SETTING_ID, status as unknown as Record<string, any>);
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'backupStatus.recordBackupDone');
  }
}

/** "04.11.2026 16:20 · Bilgisayar · otomatik · Osman" */
export function describeBackupStatus(status: BackupStatus | null): string {
  if (!status) return 'Henüz yedek alınmadı';
  const d = new Date(status.lastAt);
  const when = `${d.toLocaleDateString('tr-TR')} ${d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
  return [when, status.device, status.kind === 'auto' ? 'otomatik' : 'elle', status.byName].filter(Boolean).join(' · ');
}

/** Son yedekten bu yana geçen gün (yedek yoksa null) */
export function daysSince(iso: string | undefined | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / DAY_MS));
}
