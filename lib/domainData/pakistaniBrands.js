/**
 * Comprehensive Pakistani Brand Database
 * Organized by business domain for quick product entry
 */

export const pakistaniBrands = {
  // Retail & Fashion
  clothing: [
    'Khaadi', 'Gul Ahmed', 'Sana Safinaz', 'Maria B', 'Nishat Linen', 'Alkaram Studio',
    'Bonanza Satrangi', 'Outfitters', 'ChenOne', 'Junaid Jamshed', 'Limelight',
    'Zara Shahjahan', 'Elan', 'Sapphire', 'J.', 'Kayseria', 'CrossRoads', 'Ethnic',
    'Ideas', 'Breakout', 'Hang Ten', 'Leisure Club', 'Stoneage', 'Charcoal'
  ],

  footwear: [
    'Bata Pakistan', 'Service Shoes', 'Borjan', 'Stylo', 'Metro Shoes',
    'Shoes & More', 'Hush Puppies Pakistan', 'Ndure', 'ECS', 'Servis Cheetah'
  ],

  // Electronics & Appliances
  electronics: [
    'Orient Electronics', 'Haier Pakistan', 'Dawlance', 'Pel', 'Gree Pakistan',
    'Kenwood Pakistan', 'Waves', 'TCL Pakistan', 'Changhong Ruba', 'Super Asia'
  ],

  mobile: [
    'Samsung Pakistan', 'Apple Pakistan', 'Xiaomi Pakistan', 'Oppo Pakistan',
    'Vivo Pakistan', 'Realme Pakistan', 'Infinix', 'Tecno', 'QMobile',
    'Huawei Pakistan', 'OnePlus Pakistan', 'Nokia Pakistan'
  ],

  // Food & Beverages
  food: [
    'Shan Foods', 'National Foods', 'Mehran', 'Rafhan', 'Mitchell\'s',
    'Shezan', 'Tapal Tea', 'Lipton Pakistan', 'Nestle Pakistan', 'Unilever Pakistan',
    'Engro Foods', 'Nurpur', 'Olper\'s', 'Tarang', 'Kolson', 'Peek Freans',
    'Sooper', 'Candyland', 'English Biscuit', 'Ismail Industries'
  ],

  // Personal Care & FMCG
  personalCare: [
    'Safeguard', 'Lux', 'Dove Pakistan', 'Pantene', 'Head & Shoulders',
    'Lifebuoy', 'Fair & Lovely', 'Ponds', 'Sunsilk', 'Clear', 'Clinic Plus',
    'Capri', 'Rexona', 'Dettol Pakistan', 'Lifebuoy', 'Lux', 'Palmolive'
  ],

  // Pharmaceutical
  pharmaceutical: [
    'Getz Pharma', 'Searle Pakistan', 'Abbott Laboratories Pakistan', 'GSK Pakistan',
    'Novartis Pakistan', 'Pfizer Pakistan', 'Sanofi Pakistan', 'Hilton Pharma',
    'Ferozsons Laboratories', 'Martin Dow', 'Highnoon Laboratories', 'Bosch Pharma',
    'AGP Limited', 'Platinum Pharmaceuticals', 'Wilshire Laboratories', 'Scilife Pharma'
  ],

  // Textile & Mills
  textile: [
    'Gul Ahmed Textile', 'Nishat Mills', 'Sapphire Textile', 'Al-Karam Textile',
    'Crescent Textile', 'Masood Textile', 'Kohinoor Mills', 'Interloop Limited',
    'Artistic Milliners', 'Azgard Nine', 'Faisal Spinning', 'Reliance Weaving Mills'
  ],

  // Bakery & Confectionery
  bakery: [
    'Bundu Khan', 'Jalal Sons', 'Rahat Bakers', 'Delizia', 'Bread & Beyond',
    'Hobnob Bakery', 'Tehzeeb Bakers', 'Masoom\'s', 'Pie in the Sky',
    'Bread Basket', 'Hot n Crispy', 'Bake Parlor', 'Kolson', 'English Biscuit'
  ],

  // Boutique & Designer Fashion
  designer: [
    'HSY (Hassan Sheheryar Yasin)', 'Sana Safinaz', 'Maria B', 'Elan',
    'Faraz Manan', 'Nomi Ansari', 'Zara Shahjahan', 'Maheen Karim', 'Suffuse',
    'Sania Maskatiya', 'Deepak Perwani', 'Shehla Chatoor', 'Rizwan Beyg',
    'Kamiar Rokni', 'Fahad Hussayn', 'Ali Xeeshan'
  ],

  // Grocery & Supermarket
  grocery: [
    'Shan', 'National', 'Mehran', 'Rafhan', 'Mitchell\'s', 'Shezan',
    'Tapal', 'Lipton', 'Nestle', 'Unilever', 'Engro', 'Nurpur', 'Olper\'s',
    'Tarang', 'Kolson', 'Peek Freans', 'Sooper', 'Candyland'
  ],

  // General/Multi-Category
  general: [
    'Pakistani Local', 'Imported', 'China', 'Turkey', 'UAE', 'Thailand',
    'Malaysia', 'Bangladesh', 'India', 'USA', 'UK', 'Germany'
  ]
};

/**
 * Get brands for a specific category
 * @param {string} category - Category name (clothing, footwear, etc.)
 * @returns {string[]} Array of brand names
 */
export function getBrandsForCategory(category) {
  return pakistaniBrands[category] || pakistaniBrands.general;
}

/**
 * Get all brands as a flat array
 * @returns {string[]} All unique brand names
 */
export function getAllBrands() {
  const allBrands = new Set();
  Object.values(pakistaniBrands).forEach(brands => {
    brands.forEach(brand => allBrands.add(brand));
  });
  return Array.from(allBrands).sort();
}

/**
 * Search brands by keyword
 * @param {string} keyword - Search term
 * @returns {string[]} Matching brand names
 */
export function searchBrands(keyword) {
  const searchTerm = keyword.toLowerCase();
  return getAllBrands().filter(brand => 
    brand.toLowerCase().includes(searchTerm)
  );
}
