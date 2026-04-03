/**
 * Pakistani Features Integration Utility
 * Central hub for accessing all Pakistani market features
 */

import { getDomainKnowledge } from '../domainKnowledge.js';
import { pakistaniBrands, getBrandsForCategory, searchBrands } from '../domainData/pakistaniBrands.js';
import { pakistaniMarkets, getMarketsForCity, searchMarkets } from '../domainData/pakistaniMarkets.js';
import { pakistaniSeasons, getCurrentSeason, getSeasonalDiscount, applySeasonalPricing } from '../domainData/pakistaniSeasons.js';
import { t, formatNumber, formatCurrency, formatDate, getDirection } from '../translations.js';
import { 
  calculatePointsEarned, 
  calculateRedemption, 
  getCustomerTier, 
  formatPoints 
} from '../services/loyaltyProgram.js';

/**
 * Check if a domain has Pakistani features enabled
 * @param {string} domainKey - Domain key (e.g., 'retail-shop', 'pharmacy')
 * @returns {boolean} True if Pakistani features are enabled
 */
export function hasPakistaniFeatures(domainKey) {
  const domain = getDomainKnowledge(domainKey);
  return domain?.pakistaniFeatures !== undefined;
}

/**
 * Get Pakistani features for a domain
 * @param {string} domainKey - Domain key
 * @returns {Object|null} Pakistani features object or null
 */
export function getPakistaniFeatures(domainKey) {
  const domain = getDomainKnowledge(domainKey);
  return domain?.pakistaniFeatures || null;
}

/**
 * Get payment gateways for a domain
 * @param {string} domainKey - Domain key
 * @returns {Array} Array of payment gateway keys
 */
export function getPaymentGateways(domainKey) {
  const features = getPakistaniFeatures(domainKey);
  return features?.paymentGateways || [];
}

/**
 * Get payment gateway display names
 * @param {string} lang - Language code
 * @returns {Object} Payment gateway names
 */
export function getPaymentGatewayNames(lang = 'en') {
  const names = {
    en: {
      jazzcash: 'JazzCash',
      easypaisa: 'Easypaisa',
      payfast: 'PayFast',
      raast: 'Raast',
      bank_transfer: 'Bank Transfer',
      cod: 'Cash on Delivery',
      cash: 'Cash',
      card: 'Card',
      cheque: 'Cheque'
    },
    ur: {
      jazzcash: 'جاز کیش',
      easypaisa: 'ایزی پیسہ',
      payfast: 'پے فاسٹ',
      raast: 'راست',
      bank_transfer: 'بینک ٹرانسفر',
      cod: 'کیش آن ڈیلیوری',
      cash: 'نقد',
      card: 'کارڈ',
      cheque: 'چیک'
    }
  };
  return names[lang] || names.en;
}

/**
 * Get tax compliance features for a domain
 * @param {string} domainKey - Domain key
 * @returns {Array} Array of tax compliance features
 */
export function getTaxCompliance(domainKey) {
  const features = getPakistaniFeatures(domainKey);
  return features?.taxCompliance || [];
}

/**
 * Get brands for a domain
 * @param {string} domainKey - Domain key
 * @param {string} category - Product category (optional)
 * @returns {Array} Array of brand names
 */
export function getBrandsForDomain(domainKey, category = null) {
  const features = getPakistaniFeatures(domainKey);
  
  if (!features) {
    return [];
  }
  
  // If domain has specific popular brands, return those
  if (features.popularBrands && features.popularBrands.length > 0) {
    return features.popularBrands;
  }
  
  // Otherwise, get brands by category
  if (category) {
    return getBrandsForCategory(category);
  }
  
  // Default to general brands
  return pakistaniBrands.general || [];
}

/**
 * Get market locations for a domain
 * @param {string} domainKey - Domain key
 * @param {string} city - City name (optional)
 * @returns {Array} Array of market locations
 */
export function getMarketLocationsForDomain(domainKey, city = null) {
  const features = getPakistaniFeatures(domainKey);
  
  if (!features || !features.marketLocations) {
    return [];
  }
  
  // If city is specified, get markets for that city
  if (city) {
    return getMarketsForCity(city);
  }
  
  // Otherwise return domain's configured locations
  return features.marketLocations.map(location => ({
    en: location,
    ur: location // Will be enhanced with proper Urdu names
  }));
}

/**
 * Check if seasonal pricing is enabled for a domain
 * @param {string} domainKey - Domain key
 * @returns {boolean} True if seasonal pricing is enabled
 */
export function hasSeasonalPricing(domainKey) {
  const features = getPakistaniFeatures(domainKey);
  return features?.seasonalPricing === true;
}

/**
 * Get seasonal discount for a product
 * @param {string} domainKey - Domain key
 * @param {string} category - Product category
 * @param {number} price - Original price
 * @returns {Object|null} Seasonal pricing object or null
 */
export function getSeasonalPricing(domainKey, category, price) {
  if (!hasSeasonalPricing(domainKey)) {
    return null;
  }
  
  const currentSeason = getCurrentSeason();
  if (!currentSeason) {
    return null;
  }
  
  const discount = getSeasonalDiscount(category);
  if (discount === 0) {
    return null;
  }
  
  const pricing = applySeasonalPricing(price, discount);
  
  return {
    season: currentSeason,
    ...pricing
  };
}

/**
 * Format invoice with Pakistani features
 * @param {Object} invoice - Invoice object
 * @param {string} domainKey - Domain key
 * @param {string} lang - Language code
 * @returns {Object} Enhanced invoice object
 */
export function formatInvoiceWithPakistaniFeatures(invoice, domainKey, lang = 'en') {
  const features = getPakistaniFeatures(domainKey);
  
  if (!features) {
    return invoice;
  }
  
  const enhanced = { ...invoice };
  
  // Add tax compliance fields
  if (features.taxCompliance) {
    enhanced.taxCompliance = {
      ntn: invoice.businessNTN || '',
      srn: invoice.businessSRN || '',
      provincialTax: invoice.provincialTax || 0,
      withholdingTax: invoice.withholdingTax || 0
    };
  }
  
  // Add seasonal discount if applicable
  if (features.seasonalPricing && invoice.items) {
    const currentSeason = getCurrentSeason();
    if (currentSeason) {
      enhanced.seasonalInfo = {
        season: currentSeason.name[lang],
        discount: currentSeason.discountPercent
      };
    }
  }
  
  // Format currency
  enhanced.formattedTotal = formatCurrency(invoice.total, lang);
  enhanced.formattedSubtotal = formatCurrency(invoice.subtotal, lang);
  
  // Format date
  enhanced.formattedDate = formatDate(new Date(invoice.date), lang);
  
  // Add text direction
  enhanced.direction = getDirection(lang);
  
  return enhanced;
}

/**
 * Get loyalty points for a purchase
 * @param {number} amount - Purchase amount
 * @param {string} customerTier - Customer tier (silver, gold, platinum)
 * @param {string} category - Product category
 * @returns {Object} Points information
 */
export function getLoyaltyPointsForPurchase(amount, customerTier = 'silver', category = null) {
  const points = calculatePointsEarned(amount, customerTier, category);
  const tier = getCustomerTier(0); // Get tier info
  
  return {
    points,
    tier: customerTier,
    multiplier: tier.multiplier,
    message: {
      en: `You will earn ${points} points`,
      ur: `آپ ${points} پوائنٹس حاصل کریں گے`
    }
  };
}

/**
 * Validate and calculate loyalty redemption
 * @param {number} points - Points to redeem
 * @param {number} invoiceTotal - Invoice total
 * @param {string} lang - Language code
 * @returns {Object} Redemption result
 */
export function validateLoyaltyRedemption(points, invoiceTotal, lang = 'en') {
  const result = calculateRedemption(points, invoiceTotal);
  
  if (!result.success) {
    return {
      ...result,
      message: result[lang === 'ur' ? 'errorUr' : 'error']
    };
  }
  
  return {
    ...result,
    formattedDiscount: formatCurrency(result.discountAmount, lang),
    formattedRemaining: formatCurrency(result.remainingTotal, lang),
    message: {
      en: `${points} points redeemed for ${formatCurrency(result.discountAmount, 'en')} discount`,
      ur: `${formatPoints(points, 'ur')} ${formatCurrency(result.discountAmount, 'ur')} رعایت کے لیے ریڈیم کیے گئے`
    }
  };
}

/**
 * Get comprehensive Pakistani features summary for a domain
 * @param {string} domainKey - Domain key
 * @param {string} lang - Language code
 * @returns {Object} Features summary
 */
export function getPakistaniFeaturesSummary(domainKey, lang = 'en') {
  const features = getPakistaniFeatures(domainKey);
  
  if (!features) {
    return {
      enabled: false,
      message: {
        en: 'Pakistani features not available for this domain',
        ur: 'اس ڈومین کے لیے پاکستانی خصوصیات دستیاب نہیں ہیں'
      }
    };
  }
  
  const currentSeason = getCurrentSeason();
  
  return {
    enabled: true,
    paymentGateways: features.paymentGateways.map(gw => ({
      key: gw,
      name: getPaymentGatewayNames(lang)[gw]
    })),
    taxCompliance: features.taxCompliance,
    languages: features.languages,
    seasonalPricing: {
      enabled: features.seasonalPricing,
      currentSeason: currentSeason ? {
        name: currentSeason.name[lang],
        discount: currentSeason.discountPercent
      } : null
    },
    localBrands: {
      enabled: features.localBrands,
      count: features.popularBrands?.length || 0
    },
    marketLocations: {
      enabled: features.marketLocations?.length > 0,
      count: features.marketLocations?.length || 0
    },
    urduSupport: features.languages.includes('ur')
  };
}

/**
 * Search across all Pakistani features
 * @param {string} query - Search query
 * @param {string} type - Search type ('brands', 'markets', 'all')
 * @returns {Object} Search results
 */
export function searchPakistaniFeatures(query, type = 'all') {
  const results = {};
  
  if (type === 'brands' || type === 'all') {
    results.brands = searchBrands(query);
  }
  
  if (type === 'markets' || type === 'all') {
    results.markets = searchMarkets(query);
  }
  
  return results;
}

/**
 * Get localized field labels for Pakistani features
 * @param {string} lang - Language code
 * @returns {Object} Field labels
 */
export function getPakistaniFieldLabels(lang = 'en') {
  return {
    ntn: t('ntn_number', lang),
    srn: t('srn_number', lang),
    marketLocation: t('market_location', lang),
    paymentMethod: t('payment_method', lang),
    seasonalDiscount: t('seasonal_discount', lang),
    loyaltyPoints: lang === 'en' ? 'Loyalty Points' : 'لائلٹی پوائنٹس',
    brand: t('brand', lang),
    city: t('city', lang)
  };
}

export default {
  hasPakistaniFeatures,
  getPakistaniFeatures,
  getPaymentGateways,
  getPaymentGatewayNames,
  getTaxCompliance,
  getBrandsForDomain,
  getMarketLocationsForDomain,
  hasSeasonalPricing,
  getSeasonalPricing,
  formatInvoiceWithPakistaniFeatures,
  getLoyaltyPointsForPurchase,
  validateLoyaltyRedemption,
  getPakistaniFeaturesSummary,
  searchPakistaniFeatures,
  getPakistaniFieldLabels
};
