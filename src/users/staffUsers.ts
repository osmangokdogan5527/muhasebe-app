/**
 * Firma içi kullanıcılar (sahip ve çalışanlar).
 *
 * Firma, cihazı firma koduyla bir kez bağlar; ardından her kişi kendi adı ve PIN'iyle girer.
 * Kullanıcı listesi Firestore'da firma ayarları altında tutulur (ayarlar/kullanicilar) ve yedeğe
 * dahildir. PIN'ler düz metin saklanmaz; PBKDF2 doğrulama özeti saklanır.
 *
 * Not: Tüm kullanıcılar arka planda aynı firma hesabıyla bağlandığı için bu ayrım uygulama
 * içinde uygulanır (sunucu kuralı değildir).
 */
import { createPasswordVerifier, verifyPassword, PasswordVerifier } from '../utils/accountStore';
import { logError } from '../utils/errorLogger';

export const USERS_SETTING_ID = 'kullanicilar';
/** İşlem yapılmazsa oturumun kapanacağı süre */
export const IDLE_LOGOUT_MINUTES = 20;
export const MIN_PIN_LENGTH = 4;
export const MAX_PIN_LENGTH = 6;

export type StaffRole = 'owner' | 'staff';

/** Çalışana tek tek verilebilen işlem yetkileri (mevcut yetki sistemiyle aynı anahtarlar) */
export const STAFF_ACTIONS = [
  { key: 'edit_sale', label: 'Satış / fatura düzenleme' },
  { key: 'delete_sale', label: 'Satış / fatura silme' },
  { key: 'edit_payment', label: 'Tahsilat / ödeme düzenleme' },
  { key: 'delete_payment', label: 'Tahsilat / ödeme silme' },
  { key: 'edit_stock', label: 'Stok kartı düzenleme' },
  { key: 'delete_stock', label: 'Stok kartı silme' },
  { key: 'decrease_stock', label: 'Stok miktarı düşürme' },
] as const;

export type StaffActionKey = typeof STAFF_ACTIONS[number]['key'];
export type StaffActions = Record<StaffActionKey, boolean>;

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  pin: PasswordVerifier;
  active: boolean;
  /** Çalışanın girebildiği sekmeler (sahip için kullanılmaz) */
  allowedTabs: string[];
  /** Çalışanın yapabildiği işlemler (sahip için kullanılmaz) */
  actions: StaffActions;
  createdAt: string;
}

export interface StaffUsersDoc {
  users: StaffUser[];
}

/** Yeni çalışan için varsayılan yetkiler: satış, tahsilat, cari ve stok görme; silme/düzenleme yok */
export const DEFAULT_STAFF_TABS = ['pos', 'tahsilat', 'cariler', 'stoklar', 'islemler'];

export function emptyActions(): StaffActions {
  return STAFF_ACTIONS.reduce((acc, a) => ({ ...acc, [a.key]: false }), {} as StaffActions);
}

export function normalizeUsersDoc(data: Record<string, any> | null | undefined): StaffUsersDoc {
  try {
    const raw = Array.isArray(data?.users) ? data!.users : [];
    const users: StaffUser[] = raw
      .filter((u: any) => u && typeof u.id === 'string' && typeof u.name === 'string' && u.pin && u.pin.hash)
      .map((u: any) => ({
        id: u.id,
        name: String(u.name).trim(),
        role: u.role === 'owner' ? 'owner' : 'staff',
        pin: u.pin,
        active: u.active !== false,
        allowedTabs: Array.isArray(u.allowedTabs) ? u.allowedTabs.filter((t: any) => typeof t === 'string') : [...DEFAULT_STAFF_TABS],
        actions: { ...emptyActions(), ...(u.actions || {}) },
        createdAt: u.createdAt || new Date().toISOString(),
      }));
    return { users };
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'staffUsers.normalizeUsersDoc');
    return { users: [] };
  }
}

export function validatePin(pin: string): string | null {
  if (!/^[0-9]+$/.test(pin || '')) return 'PIN yalnızca rakamlardan oluşmalıdır.';
  if (pin.length < MIN_PIN_LENGTH || pin.length > MAX_PIN_LENGTH) return `PIN ${MIN_PIN_LENGTH}-${MAX_PIN_LENGTH} haneli olmalıdır.`;
  if (/^(\d)\1+$/.test(pin) || ['1234', '12345', '123456', '4321'].includes(pin)) return 'Çok basit bir PIN seçilemez.';
  return null;
}

export async function hashPin(pin: string): Promise<PasswordVerifier> {
  return createPasswordVerifier(pin);
}

export async function checkPin(user: StaffUser, pin: string): Promise<boolean> {
  return verifyPassword(pin, user.pin);
}

export function newUserId(): string {
  return `u_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Tüm sekmeler: kullanıcının izinli olmadığı sekmeler mevcut yetki sistemine "hassas" olarak verilir */
export function restrictedTabsFor(user: StaffUser, allTabs: string[]): string[] {
  if (user.role === 'owner') return [];
  return allTabs.filter((tab) => !user.allowedTabs.includes(tab));
}
