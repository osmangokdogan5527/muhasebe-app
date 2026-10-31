/**
 * Storm Ön Muhasebe - Belge (PDF) Görünüm Ayarları
 *
 * Logo, firma bilgileri, vurgu rengi ve alt not bütün PDF belgelerinde kullanılır.
 * Ayarlar firma verisiyle birlikte (Firestore: users/{firma}/ayarlar/belgeGorunumu) saklanır;
 * böylece bilgisayar ve telefonlar aynı görünümde belge üretir.
 */
import { logError } from '../utils/errorLogger';

export type ReceiptWidth = 58 | 80;

export interface DocumentBranding {
  firmName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxOffice: string;
  taxNumber: string;
  /** Sıkıştırılmış logo (data:image/...;base64). Boşsa firma adı yazıyla gösterilir. */
  logoDataUrl: string;
  /** Vurgu rengi (#rrggbb) */
  accentColor: string;
  /** Belgelerin altında görünen not (ör. banka/IBAN bilgisi, teşekkür notu) */
  footerNote: string;
  /** Faturada/makbuzda imza alanı (Teslim Eden / Teslim Alan) */
  showSignatureArea: boolean;
  /** Fatura ve makbuzda carinin önceki / sonraki / güncel bakiyesi */
  showBalance: boolean;
  /** "Yalnız: ..." yazıyla tutar */
  showAmountInWords: boolean;
  /** POS fişi kağıt genişliği (mm) */
  receiptWidth: ReceiptWidth;
}

export const DEFAULT_ACCENT_COLOR = '#0f4c81';

export const DEFAULT_BRANDING: DocumentBranding = {
  firmName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  taxOffice: '',
  taxNumber: '',
  logoDataUrl: '',
  accentColor: DEFAULT_ACCENT_COLOR,
  footerNote: '',
  showSignatureArea: true,
  showBalance: true,
  showAmountInWords: true,
  receiptWidth: 80,
};

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const LEGACY_PRINT_SETTINGS_KEY = 'storm_muhasebe_print_settings';
const LEGACY_PLACEHOLDERS = new Set(['Firma Adı', 'Firma Adresi', '0555 555 55 55']);

const text = (value: unknown, max = 300): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/** Veritabanından ya da formdan gelen değeri güvenli bir ayar nesnesine çevirir. */
export function normalizeBranding(raw: Partial<DocumentBranding> | Record<string, any> | null | undefined): DocumentBranding {
  const source = (raw || {}) as Record<string, any>;
  const accent = text(source.accentColor, 7);
  const logo = typeof source.logoDataUrl === 'string' && source.logoDataUrl.startsWith('data:image/') ? source.logoDataUrl : '';
  return {
    firmName: text(source.firmName, 120),
    address: text(source.address, 300),
    phone: text(source.phone, 60),
    email: text(source.email, 120),
    website: text(source.website, 120),
    taxOffice: text(source.taxOffice, 80),
    taxNumber: text(source.taxNumber, 20),
    logoDataUrl: logo,
    accentColor: HEX_COLOR.test(accent) ? accent : DEFAULT_ACCENT_COLOR,
    footerNote: text(source.footerNote, 400),
    showSignatureArea: source.showSignatureArea !== false,
    showBalance: source.showBalance !== false,
    showAmountInWords: source.showAmountInWords !== false,
    receiptWidth: Number(source.receiptWidth) === 58 ? 58 : 80,
  };
}

/**
 * Henüz ortak ayar kaydedilmemişse bu cihazdaki eski yazdırma ayarlarından (firma adı, adres,
 * telefon, logo) başlangıç değerleri üretir. Eski sürümün örnek değerleri ("Firma Adı") alınmaz.
 */
export function brandingFromLegacySettings(fallbackFirmName: string): DocumentBranding {
  const base: Partial<DocumentBranding> = { firmName: fallbackFirmName };
  try {
    const raw = localStorage.getItem(LEGACY_PRINT_SETTINGS_KEY);
    if (raw) {
      const legacy = JSON.parse(raw) || {};
      const pick = (value: unknown) => (typeof value === 'string' && !LEGACY_PLACEHOLDERS.has(value.trim()) ? value : '');
      base.firmName = pick(legacy.companyName) || fallbackFirmName;
      base.address = pick(legacy.companyAddress);
      base.phone = pick(legacy.companyPhone);
      if (legacy.logoType === 'image') base.logoDataUrl = pick(legacy.logoImageUrl);
    }
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'branding.brandingFromLegacySettings');
  }
  return normalizeBranding(base);
}
