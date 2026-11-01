/**
 * WhatsApp ile mesaj açma (telefonda WhatsApp uygulaması, bilgisayarda WhatsApp Web / masaüstü).
 */
import { logError } from './errorLogger';

/** Türkiye telefon numarasını uluslararası biçime çevirir (ör. 0532 555 12 34 → 905325551234). */
export function toWhatsAppNumber(phone: string | undefined | null): string | null {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('90') && digits.length === 12) return digits;
  if (digits.startsWith('0') && digits.length === 11) return `9${digits}`;
  if (digits.length === 10 && digits.startsWith('5')) return `90${digits}`;
  return digits.length >= 10 ? digits : null;
}

export function whatsAppUrl(phone: string | undefined | null, text: string): string {
  const number = toWhatsAppNumber(phone);
  const encoded = encodeURIComponent(text);
  // Numara yoksa WhatsApp kişi seçtirerek mesajı hazırlar
  return number ? `https://wa.me/${number}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

/** Bağlantıyı sistem tarayıcısında / uygulamada açar (Electron'da harici olarak). */
export function openExternalLink(url: string): void {
  try {
    const api = (window as any).electronAPI;
    if (api && typeof api.openExternal === 'function') {
      api.openExternal(url);
      return;
    }
    window.open(url, '_blank', 'noopener');
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'whatsapp.openExternalLink');
  }
}
