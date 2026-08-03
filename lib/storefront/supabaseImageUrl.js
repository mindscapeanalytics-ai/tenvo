/**
 * Supabase Storage image delivery helpers.
 * Prefer pre-built thumb/card WebP files when present; otherwise CDN transforms.
 * Avoids Next.js /_next/image for tenant product grids (fast + Vercel-safe).
 */

const SUPABASE_OBJECT_PATH =
  /^(https?:\/\/[^/]+\.supabase\.(?:co|in))\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i;

const SUPABASE_RENDER_PATH =
  /^(https?:\/\/[^/]+\.supabase\.(?:co|in))\/storage\/v1\/render\/image\/public\/([^/]+)\/(.+)$/i;

/** @typedef {'thumb' | 'card' | 'detail' | 'hero'} StorefrontImageVariant */

const VARIANT_PRESETS = {
  thumb: { width: 256, quality: 72 },
  card: { width: 512, quality: 78 },
  detail: { width: 960, quality: 82 },
  hero: { width: 1920, quality: 85 },
};

/**
 * @param {string | null | undefined} url
 * @returns {boolean}
 */
export function isSupabaseStorageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return SUPABASE_OBJECT_PATH.test(url) || SUPABASE_RENDER_PATH.test(url);
}

/**
 * Parse a Supabase public object or render URL into bucket + object path.
 * @param {string} url
 * @returns {{ origin: string, bucket: string, objectPath: string } | null}
 */
export function parseSupabaseStorageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const objectMatch = url.match(SUPABASE_OBJECT_PATH);
  if (objectMatch) {
    return {
      origin: objectMatch[1],
      bucket: objectMatch[2],
      objectPath: objectMatch[3].split('?')[0],
    };
  }
  const renderMatch = url.match(SUPABASE_RENDER_PATH);
  if (renderMatch) {
    return {
      origin: renderMatch[1],
      bucket: renderMatch[2],
      objectPath: renderMatch[3].split('?')[0],
    };
  }
  return null;
}

/**
 * Strip upload `-thumb` / `-card` suffix so we can recover the full object path.
 * @param {string} objectPath
 */
export function stripProductVariantSuffix(objectPath) {
  return String(objectPath || '').replace(/-(thumb|card)(\.[^.]+)$/i, '$2');
}

/**
 * Map a full product upload URL to the pre-generated `-thumb` / `-card` sibling
 * written by POST /api/upload/product-image (Sharp variants).
 * @param {string} url
 * @param {'thumb' | 'card'} variant
 * @returns {string | null}
 */
export function buildPrebuiltProductVariantUrl(url, variant) {
  if (variant !== 'thumb' && variant !== 'card') return null;
  const parsed = parseSupabaseStorageUrl(url);
  if (!parsed) return null;

  // Product uploads live under images/{businessId}/… (hero/banner use storefront-hero/).
  if (!/^images\//i.test(parsed.objectPath) && !/\/images\//i.test(parsed.objectPath)) {
    // Still allow when path contains /images/tenant/…
    if (!parsed.objectPath.includes('images/')) return null;
  }

  const basePath = stripProductVariantSuffix(parsed.objectPath);
  const dot = basePath.lastIndexOf('.');
  if (dot <= 0) return null;

  // Already the requested variant
  if (new RegExp(`-${variant}\\.[^.]+$`, 'i').test(parsed.objectPath)) {
    return `${parsed.origin}/storage/v1/object/public/${parsed.bucket}/${parsed.objectPath}`;
  }

  const variantPath = `${basePath.slice(0, dot)}-${variant}${basePath.slice(dot)}`;
  return `${parsed.origin}/storage/v1/object/public/${parsed.bucket}/${variantPath}`;
}

/**
 * Build a Supabase render/transform URL (served from Supabase CDN).
 * @param {string} url
 * @param {{ width?: number, height?: number, quality?: number, format?: 'webp' | 'origin' }} [opts]
 * @returns {string}
 */
export function buildSupabaseTransformUrl(url, opts = {}) {
  const parsed = parseSupabaseStorageUrl(url);
  if (!parsed) return url;

  const fullPath = stripProductVariantSuffix(parsed.objectPath);
  const { width, height, quality = 80, format = 'webp' } = opts;
  const params = new URLSearchParams();
  if (width) params.set('width', String(Math.round(width)));
  if (height) params.set('height', String(Math.round(height)));
  params.set('quality', String(Math.min(100, Math.max(1, Math.round(quality)))));
  if (format && format !== 'origin') params.set('format', format);

  const qs = params.toString();
  return `${parsed.origin}/storage/v1/render/image/public/${parsed.bucket}/${fullPath}${qs ? `?${qs}` : ''}`;
}

/**
 * Direct object/public URL (fallback when render/transform is unavailable).
 * Always resolves to the full (non -thumb/-card) object when possible.
 * @param {string} url
 * @returns {string}
 */
export function buildSupabaseObjectPublicUrl(url) {
  const parsed = parseSupabaseStorageUrl(url);
  if (!parsed) return url;
  const fullPath = stripProductVariantSuffix(parsed.objectPath);
  return `${parsed.origin}/storage/v1/object/public/${parsed.bucket}/${fullPath}`;
}

/**
 * Resolve the best delivery URL for storefront product imagery.
 * Order: pre-built thumb/card file → CDN transform → original.
 *
 * @param {string | null | undefined} url
 * @param {{ variant?: StorefrontImageVariant, width?: number, height?: number, preferPrebuilt?: boolean }} [opts]
 * @returns {string}
 */
export function resolveStorefrontImageSrc(url, opts = {}) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('data:')) return trimmed;

  if (!isSupabaseStorageUrl(trimmed)) {
    return trimmed;
  }

  const variant = opts.variant || null;
  // Default off: prebuilt `-thumb`/`-card` siblings 404 for legacy uploads and cause a failed
  // request + lag. CDN transform always hits the full object and is cacheable.
  const preferPrebuilt = opts.preferPrebuilt === true;

  if (preferPrebuilt && (variant === 'thumb' || variant === 'card')) {
    const prebuilt = buildPrebuiltProductVariantUrl(trimmed, variant);
    if (prebuilt) return prebuilt;
  }

  const preset = variant ? VARIANT_PRESETS[variant] : null;
  const width = opts.width ?? preset?.width;
  const height = opts.height;
  const quality = preset?.quality ?? 80;

  // detail/hero (and missing prebuilt): on-the-fly CDN resize of the full object
  return buildSupabaseTransformUrl(trimmed, { width, height, quality, format: 'webp' });
}

/**
 * Whether the URL should bypass next/image and use a plain img (CDN-direct).
 * @param {string | null | undefined} url
 * @returns {boolean}
 */
export function shouldUseDirectCdnImage(url) {
  return isSupabaseStorageUrl(url);
}

/**
 * Infer image variant from rendered width for grid cards vs PDP.
 * @param {number | undefined} width
 * @returns {StorefrontImageVariant}
 */
export function inferImageVariantFromWidth(width) {
  if (!width || width <= 280) return 'thumb';
  if (width <= 640) return 'card';
  if (width <= 1200) return 'detail';
  return 'hero';
}

/**
 * Infer variant from a `sizes` attribute for fill layouts.
 * @param {string | undefined} sizes
 * @returns {StorefrontImageVariant | null}
 */
export function inferImageVariantFromSizes(sizes) {
  if (!sizes || typeof sizes !== 'string') return null;
  // Tiny thumbs (search, gallery strip)
  if (/\b(56|64|80|96)px\b/.test(sizes)) return 'thumb';
  // Dense grids / rails
  if (/16vw|20vw|25vw/.test(sizes) && !/50vw/.test(sizes)) return 'card';
  // Full PDP main frame
  if (/50vw/.test(sizes) && /100vw/.test(sizes)) return 'detail';
  return null;
}
