/**
 * Decode WebP (raw base64) to a JPEG data URL for APIs that expect `image/jpeg`.
 */
export function webpRawBase64ToJpegDataUrl(webpBase64: string, quality = 0.92): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unsupported'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Failed to decode image'));
    img.src = `data:image/webp;base64,${webpBase64}`;
  });
}
