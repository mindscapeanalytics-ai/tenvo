/**
 * Client-side image resize + WebP conversion before upload.
 * Keeps storefront hero and product images small and fast to load.
 */

/**
 * @param {File} file
 * @param {number} maxW
 * @param {number} maxH
 * @param {number} quality 0–1
 * @returns {Promise<File>}
 */
export async function resizeImageToWebP(file, maxW, maxH, quality = 0.82) {
  if (typeof window === 'undefined' || !file?.type?.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not optimize image'));
              return;
            }
            const baseName = String(file.name || 'image').replace(/\.[^.]+$/, '');
            resolve(new File([blob], `${baseName}.webp`, { type: 'image/webp' }));
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Could not read image'));
      img.src = e.target?.result;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/** Hero carousel — wide banner, higher quality */
export const HERO_IMAGE_OPTS = { maxW: 1920, maxH: 1080, quality: 0.85 };

/** Homepage marketing banners — same wide format as hero */
export const BANNER_IMAGE_OPTS = { maxW: 1920, maxH: 1080, quality: 0.85 };

/** Product / logo thumbnails */
export const PRODUCT_IMAGE_OPTS = { maxW: 800, maxH: 800, quality: 0.82 };

/** Store logo / square branding */
export const LOGO_IMAGE_OPTS = { maxW: 512, maxH: 512, quality: 0.88 };

/**
 * @param {File} file
 * @param {'hero' | 'banner' | 'product' | 'logo'} purpose
 */
export async function optimizeImageForUpload(file, purpose = 'product') {
  const opts =
    purpose === 'hero' || purpose === 'banner'
      ? HERO_IMAGE_OPTS
      : purpose === 'logo'
        ? LOGO_IMAGE_OPTS
        : PRODUCT_IMAGE_OPTS;
  try {
    return await resizeImageToWebP(file, opts.maxW, opts.maxH, opts.quality);
  } catch {
    return file;
  }
}

/**
 * @param {File} file
 * @param {string} businessId
 * @param {'hero' | 'banner' | 'product' | 'logo'} [purpose]
 */
export async function uploadOptimizedImage(file, businessId, purpose = 'product') {
  if (!businessId) throw new Error('Business context is required to upload images');

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  if (!allowed.includes(file.type)) {
    throw new Error('Unsupported format. Use JPEG, PNG, or WebP.');
  }

  const isWideBanner = purpose === 'hero' || purpose === 'banner';
  const maxBytes = isWideBanner ? 8 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File too large. Max ${isWideBanner ? '8' : '5'} MB before optimization.`);
  }

  const processed = await optimizeImageForUpload(file, purpose);
  const fd = new FormData();
  fd.append('file', processed);
  fd.append('businessId', businessId);
  fd.append('purpose', purpose);

  const res = await fetch('/api/upload/product-image', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}
