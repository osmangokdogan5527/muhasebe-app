/**
 * Yazılım sağlayıcısının ana kodu.
 *
 * - Giriş ekranındaki "Yönetici Paneli" (sistem kayıtları, geri bildirimler) yalnızca bu kodla açılır.
 * - Firmalar kendi yönetici PIN'lerini belirler; PIN'i unutan firma için sağlayıcı bu kodla
 *   PIN pencerelerini açabilir ve Ayarlar'da PIN'i sıfırlayabilir.
 *
 * Kod düz metin olarak tutulmaz; yalnızca SHA-256 özeti saklanır.
 */
import { logError } from './errorLogger';

export const MASTER_CODE_LENGTH = 6;
const MASTER_CODE_HASH = '1b544df7348e10d054ed0bf6edf0ec5f6fa8334c096d70eaf6139de01efb8d7b';
const SALT = 'storm-master:';

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Girilen kod sağlayıcı ana kodu mu? */
export async function isMasterCode(input: string): Promise<boolean> {
  try {
    const value = (input || '').trim();
    if (value.length !== MASTER_CODE_LENGTH || !/^[0-9]+$/.test(value)) return false;
    return (await sha256Hex(SALT + value)) === MASTER_CODE_HASH;
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'masterCode.isMasterCode');
    return false;
  }
}

/** Firma PIN'i ya da sağlayıcı ana kodu ile yetki doğrulaması */
export async function isValidAdminCode(input: string, firmPin: string): Promise<boolean> {
  if (input && firmPin && input === firmPin) return true;
  return isMasterCode(input);
}
