/**
 * Variant sync helpers — convert form/matrix state into product_variants rows.
 */

import { parseSizeColorKey } from '@/lib/storefront/storefrontProductVariants';

function slugPart(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toUpperCase();
}

/**
 * Build variant SKU from base SKU + attribute parts.
 */
export function buildVariantSku(baseSku, parts) {
  const base = String(baseSku || 'PROD').trim().toUpperCase();
  const suffix = parts.filter(Boolean).map(slugPart).join('-');
  return suffix ? `${base}-${suffix}` : `${base}-VAR`;
}

/**
 * Convert size-color matrix object (e.g. { "M-Red": 5 }) to variant rows.
 */
export function matrixToVariantRows(sizeColorMatrix, base = {}) {
  if (!sizeColorMatrix || typeof sizeColorMatrix !== 'object') return [];

  const rows = [];
  for (const [key, qty] of Object.entries(sizeColorMatrix)) {
    const parsed = parseSizeColorKey(key);
    if (!parsed) continue;
    const stock = Number(qty);
    if (!Number.isFinite(stock) || stock < 0) continue;

    const { size, color } = parsed;
    rows.push({
      size,
      color,
      stock,
      variant_sku: buildVariantSku(base.sku, [size, color]),
      variant_name: `${size} - ${color}`,
      price: Number(base.price) || 0,
      cost_price: Number(base.cost_price ?? base.costPrice) || 0,
      mrp: Number(base.mrp) || 0,
      min_stock: Number(base.min_stock ?? base.minStock) || 0,
    });
  }
  return rows;
}

/**
 * Convert VariantManager output to variant rows.
 */
export function variantManagerToRows(variants, base = {}) {
  if (!Array.isArray(variants) || variants.length === 0) return [];

  return variants.map((v) => {
    const attrs = v.attributes || {};
    const size = v.size || attrs.Size || attrs.size || null;
    const color = v.color || attrs.Color || attrs.color || null;
    const material = v.material || attrs.Material || attrs.material || null;
    const pattern = v.pattern || attrs.Pattern || attrs.pattern || null;

    const nameParts = Object.values(attrs).filter(Boolean);
    const variantName =
      v.variant_name ||
      v.variantName ||
      (nameParts.length > 0 ? nameParts.join(' / ') : `${size || ''} - ${color || ''}`.trim());

    return {
      size,
      color,
      pattern,
      material,
      custom_attributes: attrs,
      variant_sku: v.sku || v.variant_sku || buildVariantSku(base.sku, nameParts.length ? nameParts : [size, color]),
      variant_name: variantName,
      price: Number(v.price ?? base.price) || 0,
      cost_price: Number(v.cost_price ?? v.costPrice ?? base.cost_price ?? base.costPrice) || 0,
      mrp: Number(v.mrp ?? base.mrp) || 0,
      stock: Number(v.stock) || 0,
      min_stock: Number(v.min_stock ?? v.minStock ?? base.min_stock ?? base.minStock) || 0,
      image_url: v.image_url || v.imageUrl || null,
    };
  });
}

/**
 * Merge matrix + manager variants; manager wins on duplicate size-color keys.
 */
export function mergeVariantSources(sizeColorMatrix, managerVariants, base = {}) {
  const byKey = new Map();

  for (const row of matrixToVariantRows(sizeColorMatrix, base)) {
    const key = `${row.size || ''}::${row.color || ''}`;
    byKey.set(key, row);
  }

  for (const row of variantManagerToRows(managerVariants, base)) {
    const key = `${row.size || ''}::${row.color || ''}`;
    byKey.set(key, { ...byKey.get(key), ...row });
  }

  return Array.from(byKey.values()).filter((r) => r.size || r.color || r.variant_sku);
}

/**
 * Build variant payload from ProductForm state.
 */
export function buildVariantsFromForm(formData, productMeta = {}) {
  const base = {
    sku: formData.sku || productMeta.sku,
    price: formData.price,
    cost_price: formData.costPrice,
    mrp: formData.mrp,
    min_stock: formData.minStock,
  };

  return mergeVariantSources(
    formData.sizeColorMatrix,
    formData.variants,
    base
  );
}

/**
 * Hydrate form state from DB variant rows + domain_data matrix fallback.
 */
export function dbVariantsToFormState(product) {
  const matrix = {};
  const variants = [];

  const dbVariants = Array.isArray(product?.variants) ? product.variants : [];

  if (dbVariants.length > 0) {
    for (const v of dbVariants) {
      if (v.size && v.color) {
        matrix[`${v.size}-${v.color}`] = Number(v.stock) || 0;
      }
      variants.push({
        id: v.id,
        sku: v.variant_sku,
        size: v.size,
        color: v.color,
        pattern: v.pattern,
        material: v.material,
        price: Number(v.price) || 0,
        cost_price: Number(v.cost_price) || 0,
        mrp: Number(v.mrp) || 0,
        stock: Number(v.stock) || 0,
        attributes: {
          ...(v.size ? { Size: v.size } : {}),
          ...(v.color ? { Color: v.color } : {}),
          ...(v.material ? { Material: v.material } : {}),
          ...(v.pattern ? { Pattern: v.pattern } : {}),
          ...(v.custom_attributes && typeof v.custom_attributes === 'object' ? v.custom_attributes : {}),
        },
      });
    }
    return { sizeColorMatrix: matrix, variants };
  }

  const ddMatrix = product?.domain_data?.size_color_matrix;
  if (ddMatrix && typeof ddMatrix === 'object') {
    return { sizeColorMatrix: { ...ddMatrix }, variants: matrixToVariantRows(ddMatrix, product) };
  }

  return { sizeColorMatrix: {}, variants: [] };
}

export function totalVariantStock(variantRows) {
  return (variantRows || []).reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
}
