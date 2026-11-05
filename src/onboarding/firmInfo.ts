/**
 * İlk giriş "Firma Bilgileri": fiş, fatura ve ekstrelerde görünen firma bilgilerinin
 * doğrulanması ve Belge Görünümü ayarına (ayarlar/belgeGorunumu) dönüştürülmesi.
 */
import { DocumentBranding, normalizeBranding } from '../pdf/branding';
import { logError } from '../utils/errorLogger';

export interface FirmInfoForm {
  firmName: string;
  phone: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  email: string;
  iban: string;
  logoDataUrl: string;
}

export type FirmInfoErrors = Partial<Record<keyof FirmInfoForm, string>>;

const digits = (value: string) => (value || '').replace(/[^0-9]/g, '');

/**
 * Türkiye telefonunu "0XXX XXX XX XX" biçimine getirir. 0'sız (5xx…) ve +90'lı yazımlar da kabul
 * edilir. Tanınmayan biçim (ör. dahili numara) olduğu gibi bırakılır.
 */
export function formatPhone(value: string): string {
  const raw = (value || '').trim();
  let d = digits(raw);
  if (d.startsWith('90') && d.length === 12) d = d.slice(2);
  if (d.length === 10 && /^[2-5]/.test(d)) d = `0${d}`;
  if (d.length === 11 && d.startsWith('0')) return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
  return raw;
}

export function isValidPhone(value: string): boolean {
  const d = digits(value);
  return d.length >= 7 && d.length <= 13;
}

/** TR IBAN: boşluksuz büyük harf, 26 karakter ve mod-97 denetimi */
export function normalizeIban(value: string): string {
  return (value || '').replace(/\s+/g, '').toUpperCase();
}

export function isValidIban(value: string): boolean {
  try {
    const iban = normalizeIban(value);
    if (!/^TR\d{24}$/.test(iban)) return false;
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    const numeric = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55));
    let remainder = 0;
    for (const ch of numeric) remainder = (remainder * 10 + Number(ch)) % 97;
    return remainder === 1;
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'firmInfo.isValidIban');
    return false;
  }
}

/** "TR12 3456 ..." */
export function formatIban(value: string): string {
  return normalizeIban(value).replace(/(.{4})/g, '$1 ').trim();
}

const IBAN_IN_TEXT = /TR\s?(?:\d\s?){24}/i;

/** Alt nottaki IBAN (ilk eşleşme) */
export function ibanFromFooter(footerNote: string): string {
  const m = (footerNote || '').match(IBAN_IN_TEXT);
  return m ? formatIban(m[0]) : '';
}

export function validateFirmInfo(form: FirmInfoForm): FirmInfoErrors {
  const errors: FirmInfoErrors = {};
  if (!form.firmName.trim()) errors.firmName = 'Firma adını yazın.';
  if (!form.phone.trim()) errors.phone = 'Telefon numarasını yazın.';
  else if (!isValidPhone(form.phone)) errors.phone = 'Telefon numarası eksik ya da hatalı.';
  const tax = digits(form.taxNumber);
  if (tax && tax.length !== 10 && tax.length !== 11) errors.taxNumber = 'Vergi no 10, TC kimlik no 11 hanedir.';
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'E-posta adresi hatalı.';
  if (form.iban.trim() && !isValidIban(form.iban)) errors.iban = 'IBAN hatalı (TR ile başlar, 26 karakterdir).';
  return errors;
}

export function formFromBranding(branding: DocumentBranding): FirmInfoForm {
  return {
    firmName: branding.firmName || '',
    phone: branding.phone || '',
    address: branding.address || '',
    taxOffice: branding.taxOffice || '',
    taxNumber: branding.taxNumber || '',
    email: branding.email || '',
    iban: ibanFromFooter(branding.footerNote),
    logoDataUrl: branding.logoDataUrl || '',
  };
}

/**
 * Formu mevcut belge ayarının üzerine uygular (renk, seçenekler gibi diğer alanlar korunur).
 * IBAN alt nota yazılır: alt notta IBAN varsa yenisiyle değiştirilir, yoksa sona eklenir.
 */
export function applyFirmInfo(current: DocumentBranding, form: FirmInfoForm): DocumentBranding {
  let footerNote = current.footerNote || '';
  const iban = form.iban.trim() ? formatIban(form.iban) : '';
  if (iban) {
    footerNote = IBAN_IN_TEXT.test(footerNote)
      ? footerNote.replace(IBAN_IN_TEXT, iban)
      : [footerNote.trim(), `IBAN: ${iban}`].filter(Boolean).join('\n');
  }
  return normalizeBranding({
    ...current,
    firmName: form.firmName.trim(),
    phone: formatPhone(form.phone),
    address: form.address.trim(),
    taxOffice: form.taxOffice.trim(),
    taxNumber: digits(form.taxNumber),
    email: form.email.trim(),
    logoDataUrl: form.logoDataUrl,
    footerNote,
  });
}

/** Fişte görünmesi gereken asgari bilgi var mı */
export function isFirmInfoComplete(branding: DocumentBranding | null, saved: boolean): boolean {
  return !!branding && saved && !!branding.firmName.trim() && !!branding.phone.trim();
}

const promptedKey = (tenantId: string) => `storm_firm_info_prompted_${tenantId}`;

export function wasFirmInfoPrompted(tenantId: string): boolean {
  try {
    return localStorage.getItem(promptedKey(tenantId)) === '1';
  } catch {
    return false;
  }
}

export function markFirmInfoPrompted(tenantId: string) {
  try {
    localStorage.setItem(promptedKey(tenantId), '1');
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'firmInfo.markPrompted');
  }
}
