/**
 * Storm Ön Muhasebe - Cihazdaki Firma Listesi
 *
 * Kodda hazır hesap yoktur. Bu cihazda oluşturulan ya da bağlanılan firmalar burada
 * tutulur (yalnızca kod, ad ve profil resmi). Şifrenin kendisi saklanmaz; internet yokken
 * giriş yapılabilmesi için yalnızca PBKDF2 ile türetilmiş bir doğrulama özeti saklanır.
 */
import { logError } from './errorLogger';

export interface PasswordVerifier {
  salt: string;
  hash: string;
  iterations: number;
}

export interface DeviceAccount {
  id: string;
  name: string;
  photoURL?: string;
  verifier?: PasswordVerifier;
}

const ACCOUNTS_KEY = 'storm_muhasebe_accounts';
const PBKDF2_ITERATIONS = 150000;

// Eski sürümlerin hazır hesap listesi (PIN'leri içerir); artık kullanılmadığı için temizlenir
const LEGACY_USERS_KEY = 'storm_muhasebe_users';

export function loadDeviceAccounts(): DeviceAccount[] {
  try {
    localStorage.removeItem(LEGACY_USERS_KEY);
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((a) => a && typeof a.id === 'string' && a.id) : [];
  } catch (err: any) {
    logError(err instanceof Error ? err : new Error(String(err)), 'accountStore.load');
    return [];
  }
}

export function saveDeviceAccounts(accounts: DeviceAccount[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err: any) {
    logError(err instanceof Error ? err : new Error(String(err)), 'accountStore.save');
  }
}

export function upsertDeviceAccount(account: DeviceAccount): DeviceAccount[] {
  const accounts = loadDeviceAccounts();
  const index = accounts.findIndex((a) => a.id === account.id);
  if (index >= 0) {
    accounts[index] = { ...accounts[index], ...account };
  } else {
    accounts.push(account);
  }
  saveDeviceAccounts(accounts);
  return accounts;
}

export function removeDeviceAccount(id: string): DeviceAccount[] {
  const accounts = loadDeviceAccounts().filter((a) => a.id !== id);
  saveDeviceAccounts(accounts);
  return accounts;
}

function toBase64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  arr.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return arr;
}

async function deriveHash(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, keyMaterial, 256);
  return toBase64(bits);
}

export async function createPasswordVerifier(password: string): Promise<PasswordVerifier> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveHash(password, salt, PBKDF2_ITERATIONS);
  return { salt: toBase64(salt), hash, iterations: PBKDF2_ITERATIONS };
}

export async function verifyPassword(password: string, verifier: PasswordVerifier | undefined): Promise<boolean> {
  if (!verifier || !verifier.salt || !verifier.hash) return false;
  try {
    const hash = await deriveHash(password, fromBase64(verifier.salt), verifier.iterations || PBKDF2_ITERATIONS);
    return hash === verifier.hash;
  } catch (err: any) {
    logError(err instanceof Error ? err : new Error(String(err)), 'accountStore.verifyPassword');
    return false;
  }
}
