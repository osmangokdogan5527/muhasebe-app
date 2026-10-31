/**
 * Belge logosu: yüklenen görseli belgelere uygun boyuta küçültür.
 * Saydam arka planı korumak için PNG kullanılır; çok büyük kalırsa beyaz zeminli JPEG'e düşülür.
 * Sonuç firma ayarlarıyla Firestore'a kaydedildiği için boyut sınırlıdır.
 */

const MAX_WIDTH = 600;
const MAX_HEIGHT = 240;
/** data URL uzunluğu (karakter); Firestore belge sınırının (1 MB) çok altında kalır */
export const MAX_LOGO_DATA_LENGTH = 450_000;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Görsel okunamadı. PNG, JPG veya SVG dosyası seçin.'));
    };
    img.src = url;
  });
}

export async function prepareLogo(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Lütfen bir görsel dosyası (PNG, JPG, SVG) seçin.');
  const img = await loadImage(file);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  if (!width || !height) throw new Error('Görselin boyutu okunamadı.');
  const ratio = Math.min(1, MAX_WIDTH / width, MAX_HEIGHT / height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Görsel işlenemedi.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let dataUrl = canvas.toDataURL('image/png');
  if (dataUrl.length > MAX_LOGO_DATA_LENGTH) {
    const flat = document.createElement('canvas');
    flat.width = canvas.width;
    flat.height = canvas.height;
    const fctx = flat.getContext('2d');
    if (!fctx) throw new Error('Görsel işlenemedi.');
    fctx.fillStyle = '#ffffff';
    fctx.fillRect(0, 0, flat.width, flat.height);
    fctx.drawImage(canvas, 0, 0);
    dataUrl = flat.toDataURL('image/jpeg', 0.85);
  }
  if (dataUrl.length > MAX_LOGO_DATA_LENGTH) throw new Error('Logo çok büyük. Daha sade ya da küçük bir görsel deneyin.');
  return dataUrl;
}
