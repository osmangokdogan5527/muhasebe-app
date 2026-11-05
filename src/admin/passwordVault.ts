/**
 * Şifre kasası: firma şifrelerinin yalnızca sistem kurucusunun ana koduyla açılabilen kopyası.
 *
 * - Firma kurulduğunda, giriş yaptığında ya da şifresini değiştirdiğinde şifre RSA-OAEP açık
 *   anahtarıyla şifrelenir ve firma kaydına (firmalar/{kod}) yazılır. Firma kendi kopyasını açamaz.
 * - Gizli anahtar koda gömülüdür ama ana kodla (PBKDF2 600.000 tur + AES-GCM) şifrelidir; yalnızca
 *   Yönetim Paneli'ne ana kodla girildiğinde çözülür ve bellekte tutulur.
 * - Firma kayıtlarını Firestore kuralları gereği yalnızca kurucu hesabı okuyabilir.
 */
import { logError } from '../utils/errorLogger';

const PUBLIC_KEY_SPKI = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3FTkLLby2Xxf9UcfQ8oi1dqi/g2rPp+MOj/8BGFUKS320sx0fIgyHQY5kCU+bACPRPuDkQ3C9Nn97jSo0w+gkOjaP0h/gmpWQ92JOvRSXs3L6NlsyEH254zfdXr6fPzIgzmZ91iotcKQ8HgSVaCsh3cAxZOO7lhNb6mFSkcrdItK53jzPFul1FjUhShKgP3t1JcYBM6qaW1w+d9cnhVChSTgnegvl2axUozL6adfUrBWyTJ2RtDAdhjpr4KtGFaPKwYPuQUYhLTGwyJP79oK+AlNbDOzk/kFmmFlnDl+azBv5nLDSTaHmrJxhils0z4gbFTFBcqPw0eYnXWTPJTVVQIDAQAB';
const PRIVATE_KEY_SALT = '+KknHcLX0771wkhQYgXeWg==';
const PRIVATE_KEY_IV = 'ismxECXD6iHGCUlF';
const PRIVATE_KEY_SEALED = 'cB13wMoiqkaYPsEZxb9T6EfsD0S1uoGcgg404jI23Ci6vzi24QtZZbwFAzCF9gRxbU1HiqQPiavZJWvrlTx4WvXiYZDIVTj72y5BzIXqW/1h+Yy3f8ilnRyXQKus8crvjad5xRFO6w1qmnc/HhXV01Y4KlxIkYzolNvMzt4Z8gZMTrURxWGY2jfoyiX7lt83x5ff2IyzeYwSbpiL8cro7GOEyQ93GXt9YCvpsL7gSED3GWJ0r04JVi8skXA0ASTtS06bpztx4M0i4KoDhx2IlrgzlAfGvaFX4yGBSd6OxNT4G8U8Izl0CZiOjrGCE2w4Uz8zZripPAXGqHu5+Fcz1CMxd9JmD+d0FL6vFCdBpfYhZHogYGUXPAfxMIxLJUkvEaExynCMUNr2HBih/KPI8qPiY9dCAsxFcBkDP8elb4P2kK+cawIKl8xXgN9/WJpnDMj051CAoQrqWSvvjlKKCj7tANPyguTiml59H5dMvOwMviYjefacOtvStD3vV9391pd9EIVoztpKMoVQDzTB1xGhwTNSzkwohNC1vrgaT7Hytr/r4D3u2Ex4Pwj/pTkzDAqYSOO/nQIOLYbk+Qf2MydLUA6dB3bxNwHjuohdX+Nfabzej1wMgIPEFDl56JwM/JDkap/mdGGhixHlBeajG8nR+2bERJvHdUhdU+VE7Xt39+aHj3+KSSDVB65kC+llJzqxqdYBs+h4J3kvDV2pZ2EHeA2VER+ZeJ64hmgHsUyj9W5Leogn5bNICvD5Mb7g+g3Dxz4kUjfdAZcN4TrJVRa561OerIELNNgFpL0DPIabXb4bTdBopKWIuf3hG0R79tPJ+R1iYC7pooA+JYhd57q1GUTyqltMHlXfu7Twd+DsbfGhCRb/3vVmjszqQDjJYWAOq6Du/2V/bwVJM561D1O0zwA993b6sN4ctJ9NYfP7pws6zhgH11K4EUbMmAAr1K4FevWak4YgI6LN/L3eTdO1giS4dEAxzoskVF16zmm6IVJ4ix460v2cxXYxOdfx/bTXfYZgvTsj/PNEg1NEvG8JXNLO5vAHtoOBFdSl0CE+B8XOe9tz8UZPKYM0s1tnVleQt5de9HsfJBMfhcrIPbZIsDv+sxLX6mR0Gv6fhLxDq+hi9J8vMVVyUfWPS9pUiMTEwmcmTKaGOPDkRgVpyWj8af9lDLM3HuKup89Up9olvfq3A6+SMMXIVNxylYEYN05wXz7UVjNNSDfKjFI/1jgVWmj6xxCT+9/9bBEgDf2ZZiv92CX0BFNqtR23Y8juy3YhTDr1jYNJy2UORwij31EXBjR7zemKTOkTmdVjiQsQCXbB2cJyegXTrh2tqdBSRHUUP1U2F5hbOkbb5uH7O7Cn+Z7aTOKxSmvgan27iO1pt+NdScbtQOxZYHKSOX3tmnFtPveSjLkqmi/3U5CKU/afjV7PY2qUxOfX2Qd+9rymyCtGK3LEwCLR8eFLJG5C7w3xudRsEBvilp21kzYWmOoy5dr1Le5WRkG2hNaXDMdEGAEplq4Uz0NfRZydKVxXmxzybDPmKk+MoM2EBlzed0n29ndY5CYgsJYPUNwvX+gIqpysZRqfxiscL0l0rUX+5HM+2WL2XvXNCWEQZbWFWTKX/7sxmCt7TZ50vTiVQ9j5';
const PBKDF2_ITERATIONS = 600000;

export interface SealedPassword {
  alg: 'RSA-OAEP-256';
  data: string;
  at: string;
}

const fromB64 = (value: string): Uint8Array => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
const toB64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
};

let publicKeyPromise: Promise<CryptoKey> | null = null;

function publicKey(): Promise<CryptoKey> {
  if (!publicKeyPromise) {
    publicKeyPromise = crypto.subtle.importKey('spki', fromB64(PUBLIC_KEY_SPKI), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
  }
  return publicKeyPromise;
}

/** Şifreyi kurucu için şifreler (hata olursa null: giriş bundan etkilenmez) */
export async function sealPassword(password: string): Promise<SealedPassword | null> {
  try {
    if (!password) return null;
    const data = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, await publicKey(), new TextEncoder().encode(password));
    return { alg: 'RSA-OAEP-256', data: toB64(data), at: new Date().toISOString() };
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'passwordVault.seal');
    return null;
  }
}

/** Ana kodla gizli anahtarı açar. Kod yanlışsa hata fırlatır. */
export async function unlockVault(masterCode: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode('storm-vault:' + masterCode), 'PBKDF2', false, ['deriveKey']);
  const aes = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(PRIVATE_KEY_SALT), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );
  const pkcs8 = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(PRIVATE_KEY_IV) }, aes, fromB64(PRIVATE_KEY_SEALED));
  return crypto.subtle.importKey('pkcs8', pkcs8, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
}

export async function openSealedPassword(sealed: SealedPassword, privateKey: CryptoKey): Promise<string> {
  const plain = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, fromB64(sealed.data));
  return new TextDecoder().decode(plain);
}
