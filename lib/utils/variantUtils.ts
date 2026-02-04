/**
 * Variant Utilities
 * Logic for generating and managing product variations (Size, Color, etc.)
 */

export interface Attribute {
    name: string;
    values: string[];
}

export interface Variant {
    attributes: Record<string, string>;
    sku: string;
    price: number;
    stock: number;
}

/**
 * Generate all possible combinations of attributes
 * 
 * @param attributes Array of Attribute objects
 * @returns Array of variants
 */
export function generateCombinations(attributes: Attribute[], baseSku: string, basePrice: number): Variant[] {
    if (!attributes || attributes.length === 0) return [];

    const results: any[] = [{}];

    for (const attr of attributes) {
        const temp: any[] = [];
        for (const res of results) {
            for (const val of attr.values) {
                temp.push({ ...res, [attr.name]: val });
            }
        }
        results.splice(0, results.length, ...temp);
    }

    return results.map(combination => ({
        ...combination, // Flatten attributes for easy access (e.g. variant.size)
        attributes: combination,
        sku: `${baseSku}-${Object.values(combination).join('-').toUpperCase()}`,
        price: basePrice,
        stock: 0
    }));
}

/**
 * Format variant name from attributes
 */
export function getVariantName(attributes: Record<string, string>): string {
    return Object.values(attributes).sort().join(' / ');
}

/**
 * Validate variant SKU uniqueness (mock implementation)
 */
export function validateSku(sku: string, existingSkus: string[]): boolean {
    return !existingSkus.includes(sku);
}
