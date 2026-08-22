/**
 * Invoice Helpers
 * Utilities for domain-specific invoice generation
 */

import { getDomainKnowledge } from '../domainKnowledge';
import { getDomainProductFields, getFieldLabel } from './domainHelpers';

/**
 * Human-readable label for fabric/textile units.
 * Returns English label by default; Urdu label when locale is 'ur' and translation is available.
 * @param {string} unit
 * @param {string} [locale] - 'en' (default) or 'ur'
 * @returns {string}
 */
export function formatFabricUnit(unit, locale = 'en') {
  const UNIT_LABELS = {
    en: {
      meter: 'Meter',
      gaz: 'Gaz',
      yard: 'Yard',
      thaan: 'Thaan',
      guth: 'Guth',
      suit: 'Suit',
      kg: 'KG',
      pcs: 'Pcs',
      set: 'Set',
    },
    ur: {
      meter: 'میٹر',
      gaz: 'گز',
      yard: 'یارڈ',
      thaan: 'تھان',
      guth: 'گٹھ',
      suit: 'سوٹ',
      kg: 'کلو',
      pcs: 'عدد',
      set: 'سیٹ',
    },
  };

  const key = String(unit || '').trim().toLowerCase();
  const lang = locale === 'ur' ? 'ur' : 'en';
  const label = UNIT_LABELS[lang]?.[key];

  if (!label) {
    // Return title-cased raw unit as English fallback
    return key ? key.charAt(0).toUpperCase() + key.slice(1) : unit;
  }
  return label;
}

/**
 * Get domain-specific invoice columns
 * 
 * @param {string} category - Business category
 * @returns {Array} Array of column objects { header: string, field: string, width: string }
 */
export function getDomainInvoiceColumns(category) {
    const columns = [];

    // 1. Explicit Overrides (for specific styling/widths)
    // Textile Wholesale
    if (category === 'textile-wholesale' || category === 'textile') {
        columns.push(
            { header: 'Article #',    field: 'article_no',   width: 'w-24', placeholder: 'e.g. GA-101' },
            { header: 'Design #',     field: 'design_no',    width: 'w-24', placeholder: 'e.g. D-505' },
            {
                header: 'Fabric Type', field: 'fabric_type', width: 'w-28', placeholder: 'Select…',
                type: 'select',
                options: ['Lawn','Cotton','Wash & Wear','Chiffon','Silk','Khaddar','Linen','Jacquard',
                          'Karandi','Organza','Velvet','Georgette','Cambric','Viscose','Net',
                          'Shamoz','Denim'],
            },
            { header: 'Color/Shade',  field: 'color_shade',  width: 'w-24', placeholder: 'e.g. Navy Blue' },
            { header: 'Roll/Bale #',  field: 'roll_bale_no', width: 'w-20', placeholder: 'Roll #' },
            { header: 'Thaan Len (m)',field: 'thaan_length',  width: 'w-24', placeholder: '40', type: 'number' },
        );
        return columns;
    }

    // Textile Mill
    if (category === 'textile-mill') {
        columns.push(
            { header: 'Yarn Type', field: 'yarntype', width: 'w-24', placeholder: 'Yarn' },
            { header: 'Count/GSM', field: 'countgsm', width: 'w-24', placeholder: 'GSM' }
        );
        return columns;
    }

    // Garments — fabric type in addition to size/color
    if (category === 'garments') {
        columns.push(
            { header: 'Size', field: 'size', width: 'w-16', placeholder: 'Size' },
            { header: 'Color', field: 'color', width: 'w-20', placeholder: 'Color' },
            { header: 'Fabric', field: 'fabrictype', width: 'w-24', placeholder: 'Fabric' }
        );
        return columns;
    }

    // Boutique Fashion — designer, collection, fabric
    if (category === 'boutique-fashion') {
        columns.push(
            { header: 'Designer', field: 'designer', width: 'w-28', placeholder: 'Designer' },
            { header: 'Collection', field: 'collection', width: 'w-28', placeholder: 'Collection' },
            { header: 'Fabric', field: 'fabrictype', width: 'w-24', placeholder: 'Fabric' }
        );
        return columns;
    }

    // Mobile / Electronics
    if (['mobile', 'electronics-goods', 'computer-hardware'].includes(category)) {
        columns.push(
            { header: 'IMEI / Serial', field: 'serialNumber', width: 'w-32', placeholder: 'IMEI/Serial #' }
        );
        return columns;
    }

    // Pharmacy / FMCG / Chemical
    if (['pharmacy', 'fmcg', 'chemical', 'medicine'].includes(category)) {
        columns.push(
            { header: 'Batch', field: 'batchNumber', width: 'w-24', placeholder: 'Batch #' },
            { header: 'Expiry', field: 'expiryDate', width: 'w-24', type: 'date' }
        );
        return columns;
    }

    // Auto Parts
    if (category === 'auto-parts') {
        columns.push(
            { header: 'Part No', field: 'partNumber', width: 'w-28', placeholder: 'Part #' },
            { header: 'Model', field: 'vehicleModel', width: 'w-28', placeholder: 'Vehicle Model' }
        );
        return columns;
    }

    // Footwear
    if (category === 'leather-footwear') {
        columns.push(
            { header: 'Size', field: 'size', width: 'w-16', placeholder: 'Size' },
            { header: 'Color', field: 'color', width: 'w-20', placeholder: 'Color' }
        );
        return columns;
    }

    // Hardware & Architectural Fittings
    if (['hardware-sanitary', 'hardware-store', 'hardware', 'building-hardware', 'hardware-tools'].includes(category)) {
        columns.push(
            { header: 'Item Code', field: 'itemcode', width: 'w-24', placeholder: 'Code/Model' },
            { header: 'Finish', field: 'finish', width: 'w-24', placeholder: 'Finish' },
            { header: 'Material / Size', field: 'size', width: 'w-28', placeholder: 'Size / Spec' }
        );
        return columns;
    }


    // 2. Dynamic Fallback
    // If we haven't matched a specific group, let's try to intelligently guess useful columns
    // from the domain definition.
    const domainFields = getDomainProductFields(category);

    // We filter for "identifying" fields. 
    // This is heuristics. We favor fields that look like ID/Number/Code.
    const candidates = domainFields.filter(f =>
        !['description', 'brand', 'category', 'image', 'hsn'].includes(f) // Exclude basics
    );

    // Take top 2 candidates
    candidates.slice(0, 2).forEach(field => {
        columns.push({
            header: getFieldLabel(field) || field,
            field: field,
            width: 'w-24',
            placeholder: getFieldLabel(field)
        });
    });

    return columns;
}

/**
 * Format field value for invoice display
 */
export function formatInvoiceField(value, type) {
    if (!value) return '';
    if (type === 'date') {
        return new Date(value).toLocaleDateString();
    }
    return value;
}

/**
 * Fabric unit conversion for invoice line intelligence.
 *
 * Pakistani textile wholesalers sell in two primary modes:
 *  1. By Thaan (roll): qty=2 thaanLength=40 → total 80 meters to bill
 *  2. By Meter: qty=80 unit=meter → straightforward
 *  3. By Suit: qty=10 suitCutting=2.25 → 22.5 meters used
 *  4. By Gaz: 1 gaz = 0.9144 meters
 *
 * Returns { displayQty, displayUnit, totalMeters, conversionNote }
 *
 * @param {{ quantity: number, unit: string, thaan_length?: number|string, suit_cutting?: number|string }} lineItem
 * @returns {{ displayQty: number, displayUnit: string, totalMeters: number|null, conversionNote: string }}
 */
export function resolveTextileLineQty(lineItem) {
    const qty = Number(lineItem?.quantity || 0);
    const unit = String(lineItem?.unit || '').toLowerCase().trim();
    const thaanLen = Number(lineItem?.thaan_length || lineItem?.thaanLength || 0);
    const suitCutting = Number(lineItem?.suit_cutting || lineItem?.suitCutting || 2.25);

    const breakdown = lineItem?.thaan_breakdown || lineItem?.thaanBreakdown;
    let breakdownArray = [];
    if (Array.isArray(breakdown)) {
        breakdownArray = breakdown.map(Number).filter(n => !isNaN(n) && n > 0);
    } else if (typeof breakdown === 'string' && breakdown.trim()) {
        breakdownArray = breakdown.split(/[,;\s]+/).map(Number).filter(n => !isNaN(n) && n > 0);
    }

    if (unit === 'meter' || unit === 'mtr' || unit === 'm' || unit === 'metre') {
        const totalMeters = Math.round(qty * 10000) / 10000;
        return {
            displayQty: qty,
            displayUnit: 'Meter',
            totalMeters,
            conversionNote: qty > 0 ? `${qty} Meters` : '',
        };
    }

    if (unit === 'thaan') {
        if (breakdownArray.length > 0) {
            const totalMeters = Math.round(breakdownArray.reduce((sum, len) => sum + len, 0) * 100) / 100;
            const rollsNote = breakdownArray.map(m => `${m}m`).join(', ');
            return {
                displayQty: breakdownArray.length || qty,
                displayUnit: 'Thaan',
                totalMeters,
                conversionNote: `${breakdownArray.length} Thaan (${rollsNote}) = ${totalMeters}m`,
            };
        }

        if (qty > 0 && thaanLen > 0) {
            const totalMeters = Math.round(qty * thaanLen * 100) / 100;
            return {
                displayQty: qty,
                displayUnit: 'Thaan',
                totalMeters,
                conversionNote: `${qty} Thaan × ${thaanLen}m = ${totalMeters}m`,
            };
        }

        if (qty > 0) {
            return {
                displayQty: qty,
                displayUnit: 'Thaan',
                totalMeters: null,
                conversionNote: `${qty} Thaan`,
            };
        }
    }

    if (unit === 'guth' && qty > 0) {
        // 1 guth = typically 10 suits
        const suits = qty * 10;
        const totalMeters = Math.round(suits * suitCutting * 100) / 100;
        return {
            displayQty: qty,
            displayUnit: 'Guth',
            totalMeters,
            conversionNote: `${qty} Guth × 10 Suits × ${suitCutting}m = ${totalMeters}m`,
        };
    }

    if (unit === 'suit' && qty > 0 && suitCutting > 0) {
        const totalMeters = Math.round(qty * suitCutting * 100) / 100;
        return {
            displayQty: qty,
            displayUnit: 'Suit',
            totalMeters,
            conversionNote: `${qty} Suits × ${suitCutting}m/suit = ${totalMeters}m`,
        };
    }

    if ((unit === 'gaz' || unit === 'yard') && qty > 0) {
        const totalMeters = Math.round(qty * 0.9144 * 100) / 100;
        return {
            displayQty: qty,
            displayUnit: unit === 'gaz' ? 'Gaz' : 'Yard',
            totalMeters,
            conversionNote: `${qty} ${unit === 'gaz' ? 'Gaz' : 'Yard'} (${totalMeters}m)`,
        };
    }

    return {
        displayQty: qty,
        displayUnit: unit || 'pcs',
        totalMeters: null,
        conversionNote: '',
    };
}

/**
 * When a textile invoice line switches unit to 'thaan', auto-populate thaan_length
 * from the product's domain_data if available, and suggest per-meter rate from per-thaan rate.
 *
 * @param {object} item - current invoice line item
 * @param {object|null} product - matched product from catalog
 * @param {string} newUnit - the unit being selected
 * @returns {Partial<object>} fields to merge onto the line item
 */
export function autoFillTextileLineOnUnitChange(item, product, newUnit) {
    const unit = String(newUnit || '').toLowerCase().trim();
    const patches = { unit: newUnit };

    const thaanLen = Number(
        product?.domain_data?.thaanlength ||
        product?.domain_data?.thaan_length ||
        item?.thaan_length ||
        40
    );
    const suitCutting = Number(
        product?.domain_data?.suitcutting ||
        product?.domain_data?.suit_cutting ||
        item?.suit_cutting ||
        2.25
    );

    if (unit === 'thaan') {
        patches.thaan_length = thaanLen;
        // If the stored price is per-meter, convert to per-thaan for display
        const perMeterRate = Number(product?.price || item?.rate || 0);
        if (perMeterRate > 0 && thaanLen > 0) {
            patches._per_meter_rate = perMeterRate;
            patches.rate = Math.round(perMeterRate * thaanLen * 100) / 100;
            patches._rate_basis = 'per_thaan';
        }
    }

    if (unit === 'suit') {
        patches.suit_cutting = suitCutting;
        const perMeterRate = Number(product?.price || item?.rate || 0);
        if (perMeterRate > 0 && suitCutting > 0) {
            patches.rate = Math.round(perMeterRate * suitCutting * 100) / 100;
            patches._rate_basis = 'per_suit';
        }
    }

    if (unit === 'meter' || unit === 'metre') {
        // If previously per-thaan rate was stored, revert to per-meter
        if (item?._per_meter_rate) {
            patches.rate = item._per_meter_rate;
            patches._rate_basis = 'per_meter';
        }
    }

    return patches;
}

/**
 * Safely resolves product selling price from any standard or domain price property.
 * Checks: price, selling_price, unit_price, rate, defaultPrice, trade_price, retail_price, display_price,
 * as well as nested domain_data price fields.
 * @param {object} product
 * @returns {number}
 */
export function resolveProductPrice(product) {
  if (!product) return 0;
  const candidates = [
    product.price,
    product.selling_price,
    product.unit_price,
    product.rate,
    product.defaultPrice,
    product.trade_price,
    product.retail_price,
    product.display_price,
    product.domain_data?.price,
    product.domain_data?.selling_price,
    product.domain_data?.trade_price,
    product.domain_data?.retail_price,
    product.domain_data?.defaultPrice,
  ];

  for (const candidate of candidates) {
    const num = Number(candidate);
    if (Number.isFinite(num) && num > 0) {
      return num;
    }
  }
  return 0;
}
