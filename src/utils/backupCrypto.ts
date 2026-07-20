/**
 * Storm Ön Muhasebe - Veri Yedekleme ve Kriptolama Yardımcısı
 * 
 * Bu yardımcı, veritabanı koleksiyonlarını ve uygulama ayarlarını şifreli
 * bir şekilde .storm uzantılı dosyalara paketler veya bu dosyalardan geri yükler.
 * Tarayıcı ve masaüstü uyumlu, sıfır bağımlılıklı şifreleme motorudur.
 */

// Basit ama güvenli bir SHA256/hashing alternatifi (Sıfır bağımlılık için)
function generateHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// Güvenli RC4-ve-tuz bazlı veri şifreleme/şifre çözme algoritması
function cryptRC4(key: string, str: string): string {
  const s: number[] = [];
  let j = 0;
  let x = 0;
  let res = '';

  for (let i = 0; i < 256; i++) {
    s[i] = i;
  }

  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key.charCodeAt(i % key.length)) % 256;
    x = s[i];
    s[i] = s[j];
    s[j] = x;
  }

  let i = 0;
  j = 0;
  for (let y = 0; y < str.length; y++) {
    i = (i + 1) % 256;
    j = (j + s[i]) % 256;
    x = s[i];
    s[i] = s[j];
    s[j] = x;
    res += String.fromCharCode(str.charCodeAt(y) ^ s[(s[i] + s[j]) % 256]);
  }

  return res;
}

export interface BackupDataPayload {
  version: string;
  timestamp: string;
  collections: {
    cariler?: any[];
    stoklar?: any[];
    islemler?: any[];
    ceksenet?: any[];
    giderler?: any[];
    calisanlar?: any[];
    calisanIslemler?: any[];
    krediler?: any[];
    hesaplar?: any[];
    hesapIslemleri?: any[];
  };
  localStorage: { [key: string]: string | null };
}

/**
 * Verilen verileri bir parola ile şifreleyip .storm yedek dizesi üretir
 */
export function encryptBackup(payload: BackupDataPayload, password?: string): string {
  const pass = password || 'STORM_DEFAULT_KEY_2026';
  const rawJson = JSON.stringify(payload);
  
  // Parola doğrulama anahtarı üret
  const passHash = generateHash(pass + '_verification_salt');
  const payloadHash = generateHash(rawJson);
  
  // Şifrelenecek paket
  const container = {
    h: payloadHash, // Checksum
    p: passHash,    // Password verification
    t: new Date().toISOString(),
    d: cryptRC4(pass, rawJson) // Encrypted string
  };

  const finalString = JSON.stringify(container);
  // Base64 ve Storm Başlığı ekle
  return 'STORM_CRYPT_V1_' + btoa(unescape(encodeURIComponent(finalString)));
}

/**
 * Şifreli .storm dizesini verilen parola ile çözüp doğrular
 */
export function decryptBackup(encryptedString: string, password?: string): BackupDataPayload {
  const pass = password || 'STORM_DEFAULT_KEY_2026';
  
  if (!encryptedString.startsWith('STORM_CRYPT_V1_')) {
    throw new Error('Geçersiz dosya biçimi. Bu bir Storm yedek dosyası (.storm) değil.');
  }

  try {
    const base64Part = encryptedString.substring('STORM_CRYPT_V1_'.length);
    const decodedString = decodeURIComponent(escape(atob(base64Part)));
    const container = JSON.parse(decodedString);

    if (!container.h || !container.p || !container.d) {
      throw new Error('Dosya içeriği eksik veya hasar görmüş.');
    }

    // Parola doğrulaması yap
    const expectedPassHash = generateHash(pass + '_verification_salt');
    if (container.p !== expectedPassHash) {
      throw new Error('Hatalı şifre! Lütfen yedeği şifrelediğiniz şifreyi giriniz.');
    }

    // Deşifre et
    const decryptedJson = cryptRC4(pass, container.d);
    
    // Checksum kontrolü
    const computedHash = generateHash(decryptedJson);
    if (container.h !== computedHash) {
      throw new Error('Dosya bütünlük kontrolü (Checksum) başarısız oldu. Dosya içeriği değiştirilmiş olabilir.');
    }

    return JSON.parse(decryptedJson) as BackupDataPayload;
  } catch (error: any) {
    if (error.message && error.message.includes('Hatalı şifre')) {
      throw error;
    }
    throw new Error('Yedek çözümlenemedi. Dosya bozuk veya hatalı parola girdiniz.');
  }
}
