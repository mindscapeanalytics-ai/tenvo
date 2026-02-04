/**
 * Pakistani Retail Shop Domain-Specific Data
 * Local brands, categories, and market-specific information
 */

/**
 * Popular Pakistani Retail Brands
 */
export const pakistaniRetailBrands = {
  clothing: [
    'Khaadi',
    'Sana Safinaz',
    'Maria B',
    'Gul Ahmed',
    'Nishat Linen',
    'Alkaram Studio',
    'Bonanza Satrangi',
    'Outfitters',
    'ChenOne',
    'Junaid Jamshed',
    'Limelight',
    'Sana Safinaz',
  ],
  footwear: [
    'Bata',
    'Service',
    'Borjan',
    'Stylo',
    'Metro',
    'Shoes & More',
    'Hush Puppies',
    'Nike',
    'Adidas',
  ],
  electronics: [
    'Orient',
    'Haier',
    'Dawlance',
    'Pel',
    'LG',
    'Samsung',
    'TCL',
    'Gree',
    'Kenwood',
  ],
  food: [
    'Shan',
    'National',
    'Mehran',
    'Rafhan',
    'Mitchell\'s',
    'Shezan',
    'Nestle',
    'Unilever',
    'Engro',
  ],
  personalCare: [
    'Safeguard',
    'Lux',
    'Dove',
    'Pantene',
    'Head & Shoulders',
    'Lifebuoy',
    'Fair & Lovely',
    'Ponds',
  ],
  general: [
    'Pakistani Local',
    'Imported',
    'China',
    'Turkey',
    'UAE',
  ],
};

/**
 * Pakistani Retail Categories
 */
export const pakistaniRetailCategories = {
  clothing: {
    en: 'Clothing',
    ur: 'لباس',
    subcategories: [
      { en: 'Men\'s Wear', ur: 'مردوں کا لباس' },
      { en: 'Women\'s Wear', ur: 'خواتین کا لباس' },
      { en: 'Kids Wear', ur: 'بچوں کا لباس' },
      { en: 'Unstitched', ur: 'غیر سلائی شدہ' },
      { en: 'Ready Made', ur: 'تیار شدہ' },
    ],
  },
  footwear: {
    en: 'Footwear',
    ur: 'جوتے',
    subcategories: [
      { en: 'Men\'s Shoes', ur: 'مردوں کے جوتے' },
      { en: 'Women\'s Shoes', ur: 'خواتین کے جوتے' },
      { en: 'Kids Shoes', ur: 'بچوں کے جوتے' },
      { en: 'Sports Shoes', ur: 'کھیل کے جوتے' },
      { en: 'Sandals', ur: 'سینڈل' },
    ],
  },
  electronics: {
    en: 'Electronics',
    ur: 'الیکٹرانکس',
    subcategories: [
      { en: 'Mobile Phones', ur: 'موبائل فون' },
      { en: 'Home Appliances', ur: 'گھریلو آلات' },
      { en: 'TV & Audio', ur: 'ٹی وی اور آڈیو' },
      { en: 'Kitchen Appliances', ur: 'باورچی خانے کے آلات' },
    ],
  },
  food: {
    en: 'Food & Beverages',
    ur: 'کھانا اور مشروبات',
    subcategories: [
      { en: 'Spices', ur: 'مصالحے' },
      { en: 'Rice & Pulses', ur: 'چاول اور دالیں' },
      { en: 'Beverages', ur: 'مشروبات' },
      { en: 'Snacks', ur: 'ناشتہ' },
    ],
  },
  personalCare: {
    en: 'Personal Care',
    ur: 'ذاتی دیکھ بھال',
    subcategories: [
      { en: 'Soap & Shampoo', ur: 'صابن اور شیمپو' },
      { en: 'Skincare', ur: 'جلد کی دیکھ بھال' },
      { en: 'Hair Care', ur: 'بالوں کی دیکھ بھال' },
    ],
  },
  home: {
    en: 'Home & Living',
    ur: 'گھر اور رہائش',
    subcategories: [
      { en: 'Bedding', ur: 'بستر' },
      { en: 'Kitchenware', ur: 'باورچی خانے کے برتن' },
      { en: 'Home Decor', ur: 'گھر کی سجاوٹ' },
    ],
  },
};

/**
 * Pakistani Size Standards
 */
export const pakistaniSizes = {
  clothing: {
    men: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    women: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    kids: ['2Y', '4Y', '6Y', '8Y', '10Y', '12Y', '14Y'],
    unstitched: ['2.5m', '3m', '3.5m', '4m', '5m', '6m'],
  },
  footwear: {
    men: Array.from({ length: 20 }, (_, i) => (i + 6).toString()), // 6-25
    women: Array.from({ length: 15 }, (_, i) => (i + 3).toString()), // 3-17
    kids: Array.from({ length: 12 }, (_, i) => (i + 1).toString()), // 1-12
  },
};

/**
 * Pakistani Color Names (English/Urdu)
 */
export const pakistaniColors = [
  { en: 'Red', ur: 'سرخ', code: '#FF0000' },
  { en: 'Blue', ur: 'نیلا', code: '#0000FF' },
  { en: 'Green', ur: 'سبز', code: '#008000' },
  { en: 'Black', ur: 'سیاہ', code: '#000000' },
  { en: 'White', ur: 'سفید', code: '#FFFFFF' },
  { en: 'Yellow', ur: 'پیلا', code: '#FFFF00' },
  { en: 'Pink', ur: 'گلابی', code: '#FFC0CB' },
  { en: 'Orange', ur: 'نارنجی', code: '#FFA500' },
  { en: 'Purple', ur: 'جامنی', code: '#800080' },
  { en: 'Brown', ur: 'بھورا', code: '#A52A2A' },
  { en: 'Gray', ur: 'سرمئی', code: '#808080' },
  { en: 'Navy', ur: 'نیوی', code: '#000080' },
  { en: 'Beige', ur: 'بیج', code: '#F5F5DC' },
  { en: 'Maroon', ur: 'مارون', code: '#800000' },
  { en: 'Gold', ur: 'سونے کا', code: '#FFD700' },
  { en: 'Silver', ur: 'چاندی', code: '#C0C0C0' },
];

/**
 * Pakistani Seasonal Pricing Periods
 */
export const pakistaniSeasonalPeriods = {
  ramadan: {
    name: { en: 'Ramadan', ur: 'رمضان' },
    months: [3, 4], // March-April (varies)
    discountPercent: 10,
  },
  eidUlFitr: {
    name: { en: 'Eid ul-Fitr', ur: 'عید الفطر' },
    months: [4, 5], // April-May
    discountPercent: 15,
  },
  eidUlAdha: {
    name: { en: 'Eid ul-Adha', ur: 'عید الاضحی' },
    months: [6, 7], // June-July
    discountPercent: 15,
  },
  independenceDay: {
    name: { en: 'Independence Day', ur: 'یوم آزادی' },
    months: [8], // August
    discountPercent: 5,
  },
  winter: {
    name: { en: 'Winter Sale', ur: 'سردیوں کی سیل' },
    months: [11, 12, 1], // November-December-January
    discountPercent: 20,
  },
  summer: {
    name: { en: 'Summer Sale', ur: 'گرمیوں کی سیل' },
    months: [5, 6, 7], // May-June-July
    discountPercent: 15,
  },
};

/**
 * Get current seasonal period
 */
export function getCurrentSeasonalPeriod() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  for (const [key, period] of Object.entries(pakistaniSeasonalPeriods)) {
    if (period.months.includes(currentMonth)) {
      return { key, ...period };
    }
  }
  
  return null;
}

/**
 * Get Pakistani retail category by English name
 */
export function getPakistaniCategory(categoryName) {
  return Object.values(pakistaniRetailCategories).find(
    cat => cat.en === categoryName || cat.ur === categoryName
  );
}

/**
 * Get all brands for a category
 */
export function getBrandsForCategory(category) {
  const categoryBrandMap = {
    clothing: pakistaniRetailBrands.clothing,
    footwear: pakistaniRetailBrands.footwear,
    electronics: pakistaniRetailBrands.electronics,
    food: pakistaniRetailBrands.food,
    personalCare: pakistaniRetailBrands.personalCare,
  };
  
  return categoryBrandMap[category] || pakistaniRetailBrands.general;
}


