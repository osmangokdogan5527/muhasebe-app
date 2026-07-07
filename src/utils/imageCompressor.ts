/**
 * Compresses an image file on the client side using HTML5 Canvas.
 * Resizes the image so that its width and height do not exceed the specified maximums,
 * and encodes it as a JPEG at a reduced quality level to minimize its byte size.
 *
 * @param file The uploaded image File object
 * @param maxWidth The maximum width of the output image in pixels
 * @param maxHeight The maximum height of the output image in pixels
 * @param quality JPEG compression quality from 0.0 to 1.0 (default 0.7)
 * @returns A promise that resolves to the compressed image as a base64 Data URL string
 */
export function compressImage(
  file: File,
  maxWidth: number = 300,
  maxHeight: number = 300,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If the file is not an image, reject it or resolve to empty
    if (!file.type.startsWith('image/')) {
      reject(new Error('Yüklenen dosya geçerli bir resim değil.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate the new dimensions while preserving the aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // If we fail to get the 2D context, resolve with the uncompressed base64 data url as a fallback
          resolve(event.target?.result as string);
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = (err) => {
        reject(err);
      };
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsDataURL(file);
  });
}
