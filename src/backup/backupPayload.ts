/**
 * Yedek paketi (.storm) oluşturma.
 *
 * Yedek Sihirbazı ile otomatik yedek aynı paketi üretir; böylece otomatik alınan bir yedek de
 * sihirbazın "Geri Yükle" bölümüyle açılabilir. Veriler ekrandaki listelerden değil doğrudan
 * veritabanından okunur (eksiksiz yedek).
 */
import { encryptBackup, BackupDataPayload } from '../utils/backupCrypto';
import { BACKUP_STATUS_DOC_ID, exportAllDatabaseData } from '../firebase';
import { APP_VERSION } from '../constants';
import { logError } from '../utils/errorLogger';

/** Yedeğe alınan ve geri yüklemede kabul edilen ayar anahtarları (başka anahtar geri yüklenmez) */
export const BACKUP_SETTINGS_KEYS = [
  'kolay_hesap_accent_theme',
  'storm_muhasebe_design_style',
  'storm_muhasebe_logo_theme',
  'storm_muhasebe_font_size',
  'storm_muhasebe_sidebar_bg',
  'storm_muhasebe_sidebar_pattern',
  'storm_muhasebe_sidebar_pattern_opacity',
  'storm_muhasebe_sidebar_pattern_color',
  'storm_muhasebe_hidden_tabs',
  'storm_muhasebe_tab_order',
  'storm_muhasebe_print_settings',
  'storm_print_templates',
  'storm_muhasebe_shortcuts',
  'storm_muhasebe_admin_pin',
  'storm_muhasebe_security_active',
  'storm_muhasebe_action_permissions',
];

export async function createBackupPayload(): Promise<BackupDataPayload> {
  const dbData = await exportAllDatabaseData();
  const settingsToBackup: { [key: string]: string | null } = {};
  for (const key of BACKUP_SETTINGS_KEYS) {
    try {
      settingsToBackup[key] = localStorage.getItem(key);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'backupPayload.readSetting');
      settingsToBackup[key] = null;
    }
  }
  return {
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
    collections: {
      cariler: dbData.cariler || [],
      stoklar: dbData.stoklar || [],
      islemler: dbData.islemler || [],
      ceksenet: dbData.ceksenet || [],
      giderler: dbData.giderler || [],
      calisanlar: dbData.calisanlar || [],
      calisanIslemler: dbData.calisanIslemler || [],
      krediler: dbData.krediler || [],
      hesaplar: dbData.hesaplar || [],
      hesapIslemleri: dbData.hesapIslemleri || [],
      tekrarlayanIslemler: dbData.tekrarlayanIslemler || [],
      // Yedek durumu cihazların yedek geçmişidir, iş verisi değildir: pakete girmez
      ayarlar: (dbData.ayarlar || []).filter((item: any) => item && item.id !== BACKUP_STATUS_DOC_ID),
    },
    localStorage: settingsToBackup,
  };
}

/** Paketteki toplam kayıt sayısı */
export function countBackupRecords(payload: BackupDataPayload): number {
  try {
    return Object.values(payload.collections || {}).reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'backupPayload.countBackupRecords');
    return 0;
  }
}

/** Yerel saatle YYYY-AA-GG, saatli hâli YYYY-AA-GG_SS-DD-ss (aynı dakikadaki yedekler ayrı dosya olur) */
function stamp(date: Date, withTime: boolean): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return withTime ? `${day}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}` : day;
}

/** Sihirbazdan indirilen yedeğin dosya adı */
export function manualBackupFileName(encrypted: boolean, date: Date = new Date()): string {
  return `storm_yedek_${stamp(date, false)}_${encrypted ? 'sifreli' : 'standart'}.storm`;
}

/** Otomatik yedeğin dosya adı (masaüstü yedek klasöründe bu önekle tutulur) */
export function autoBackupFileName(date: Date = new Date()): string {
  return `Oto_Yedek_${stamp(date, true)}.storm`;
}

/** Yedek dizesi (şifre verilmezse standart anahtarla) */
export function encodeBackup(payload: BackupDataPayload, password?: string): string {
  return encryptBackup(payload, password);
}

/** Tarayıcıda dosya indirme */
export function downloadBackupFile(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
