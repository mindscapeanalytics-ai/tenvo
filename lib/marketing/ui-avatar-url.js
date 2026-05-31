/**
 * Build a ui-avatars.com URL that returns PNG (not SVG).
 * Next.js <Image> rejects remote SVG unless dangerouslyAllowSVG is enabled.
 *
 * @param {string} displayName - Full name shown on the avatar
 * @param {object} [opts]
 * @param {string} [opts.background] - Hex without # (default emerald-600)
 * @param {string} [opts.color] - Text hex without # (default white)
 * @param {number} [opts.size] - Edge length in px (default 128)
 */
export function uiAvatarPngUrl(displayName, opts = {}) {
  const background = (opts.background || '0d9488').replace(/^#/, '');
  const color = (opts.color || 'ffffff').replace(/^#/, '');
  const size = opts.size ?? 128;
  const params = new URLSearchParams({
    name: displayName,
    size: String(size),
    format: 'png',
    background,
    color,
    bold: 'true',
  });
  return `https://ui-avatars.com/api/?${params.toString()}`;
}
