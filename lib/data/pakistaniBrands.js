/**
 * Pakistani Brands Database
 * Comprehensive list of popular brands across different business domains
 * Used for autocomplete and smart suggestions
 */

export const pakistaniBrands = {
    // Textile & Fashion
    textile: [
        'Gul Ahmed', 'Khaadi', 'Sapphire', 'Nishat Linen', 'Alkaram Studio',
        'Sana Safinaz', 'Maria B', 'Junaid Jamshed', 'Bonanza Satrangi',
        'Outfitters', 'Ethnic', 'Limelight', 'CrossStitch', 'Zeen',
        'Bareeze', 'So Kamal', 'Ideas', 'Generation', 'Elan',
        'Asim Jofa', 'HSY', 'Nomi Ansari', 'Faraz Manan'
    ],

    // Electronics & Appliances
    electronics: [
        'Haier', 'Dawlance', 'Orient', 'Pel', 'Waves', 'TCL', 'Samsung',
        'LG', 'Sony', 'Panasonic', 'Changhong Ruba', 'Kenwood',
        'Philips', 'Canon', 'Nikon', 'HP', 'Dell', 'Lenovo'
    ],

    // Mobile Phones
    mobile: [
        'Samsung', 'Infinix', 'Tecno', 'Vivo', 'Oppo', 'Realme',
        'Xiaomi', 'Apple', 'Huawei', 'OnePlus', 'Nokia', 'QMobile',
        'Motorola', 'Google Pixel', 'Honor', 'Itel'
    ],

    // Grocery & FMCG
    grocery: [
        'National', 'Shan', 'Tapal', 'Lipton', 'Dalda', 'Habib',
        'Sufi', 'Mehran', 'K&N', 'Shezan', 'Mitchell\'s', 'Nestle',
        'Unilever', 'Procter & Gamble', 'Coca Cola', 'Pepsi',
        'Engro', 'Fauji', 'Olper\'s', 'Nurpur', 'Haleeb'
    ],

    // Bakery & Confectionery
    bakery: [
        'English Biscuit', 'Peek Freans', 'Bisconni', 'Hilal',
        'Bake Parlor', 'Sooper', 'Rio', 'Mayfair', 'Gourmet',
        'Kolson', 'Candyland', 'LU'
    ],

    // Pharmacy & Healthcare
    pharmacy: [
        'GSK', 'Abbott', 'Pfizer', 'Novartis', 'Sanofi', 'Getz Pharma',
        'Searle', 'Ferozsons', 'Highnoon', 'Martin Dow', 'Roche',
        'AGP', 'Bosch Pharma', 'Wilshire', 'Zafa Pharma'
    ],

    // Auto Parts
    autoparts: [
        'Denso', 'Bosch', 'NGK', 'Exide', 'AGS', 'Osaka Battery',
        'Atlas Battery', 'Shell', 'Caltex', 'PSO', 'Total',
        'Yokohama', 'Dunlop', 'Servis', 'General Tire'
    ],

    // Paint & Hardware
    paint: [
        'Berger', 'ICI Dulux', 'Diamond Paints', 'Nippon Paint',
        'Master Paints', 'Jotun', 'Asian Paints'
    ],

    // Cement & Construction
    construction: [
        'DG Khan Cement', 'Lucky Cement', 'Maple Leaf Cement',
        'Bestway Cement', 'Fauji Cement', 'Askari Cement',
        'Cherat Cement', 'Kohat Cement', 'Pioneer Cement'
    ],

    // Steel & Iron
    steel: [
        'Amreli Steels', 'Agha Steel', 'Ittefaq Steel', 'Mughal Steel',
        'KSB Pumps', 'Crescent Steel'
    ]
};

/**
 * Get brands for a specific domain
 * @param {string} domain - Business domain/category
 * @returns {string[]} Array of brand names
 */
export function getBrandsForDomain(domain) {
    // Map domain to brand category
    const domainToBrandMap = {
        'textile-wholesale': 'textile',
        'garments': 'textile',
        'boutique-fashion': 'textile',
        'electronics-goods': 'electronics',
        'mobile': 'mobile',
        'grocery': 'grocery',
        'fmcg': 'grocery',
        'supermarket': 'grocery',
        'bakery-confectionery': 'bakery',
        'pharmacy': 'pharmacy',
        'auto-parts': 'autoparts',
        'paint': 'paint',
        'construction-material': 'construction',
        'steel-iron': 'steel'
    };

    const brandCategory = domainToBrandMap[domain] || 'grocery';
    return pakistaniBrands[brandCategory] || [];
}

/**
 * Search brands by query
 * @param {string} query - Search query
 * @param {string} domain - Business domain (optional)
 * @returns {string[]} Matching brands
 */
export function searchBrands(query, domain = null) {
    const brands = domain ? getBrandsForDomain(domain) : Object.values(pakistaniBrands).flat();

    if (!query) return brands.slice(0, 10);

    const lowerQuery = query.toLowerCase();
    return brands.filter(brand =>
        brand.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
}
