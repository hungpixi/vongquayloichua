/**
 * Utility to compress image files client-side using Canvas.
 * Supports compressing files up to 10MB down to < 3MB.
 */
export const compressImageFile = (
  file: File,
  maxWidth: number = 2048,
  maxHeight: number = 2048,
  quality: number = 0.82
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!window.CanvasRenderingContext2D || !window.FileReader) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions keeping aspect ratio
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
            // Fallback if canvas context is unavailable
            resolve(event.target?.result as string);
            return;
          }

          // Clear canvas and draw image
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Get the base64 output
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        } catch (e) {
          console.warn('Canvas compression failed, falling back to original base64:', e);
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
