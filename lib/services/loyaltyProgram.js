/**
 * Loyalty Program Service
 * Manages customer loyalty points, tiers, and rewards
 * MVP Phase 1: Data structures and business logic (no external APIs)
 */

/**
 * Loyalty tier configuration
 */
export const loyaltyTiers = {
  silver: {
    key: 'silver',
    name: { en: 'Silver', ur: 'سلور' },
    minPoints: 0,
    maxPoints: 9999,
    multiplier: 1.0,
    benefits: {
      en: ['Basic rewards', 'Birthday bonus', 'Email notifications'],
      ur: ['بنیادی انعامات', 'سالگرہ بونس', 'ای میل اطلاعات']
    },
    color: '#C0C0C0'
  },
  gold: {
    key: 'gold',
    name: { en: 'Gold', ur: 'گولڈ' },
    minPoints: 10000,
    maxPoints: 49999,
    multiplier: 1.5,
    benefits: {
      en: ['1.5x points', 'Priority support', 'Exclusive offers', 'WhatsApp notifications'],
      ur: ['1.5x پوائنٹس', 'ترجیحی سپورٹ', 'خصوصی پیشکش', 'واٹس ایپ اطلاعات']
    },
    color: '#FFD700'
  },
  platinum: {
    key: 'platinum',
    name: { en: 'Platinum', ur: 'پلاٹینم' },
    minPoints: 50000,
    maxPoints: Infinity,
    multiplier: 2.0,
    benefits: {
      en: ['2x points', 'VIP support', 'Early access', 'Free delivery', 'Personal account manager'],
      ur: ['2x پوائنٹس', 'وی آئی پی سپورٹ', 'ابتدائی رسائی', 'مفت ڈیلیوری', 'ذاتی اکاؤنٹ مینیجر']
    },
    color: '#E5E4E2'
  }
};

/**
 * Loyalty program configuration
 */
export const loyaltyConfig = {
  // Base earning rate: 1 point per 100 PKR spent
  basePointsPerPKR: 0.01,
  
  // Redemption rate: 100 points = 100 PKR discount
  redemptionRate: 1.0,
  
  // Points expiry period (in days)
  expiryDays: 365,
  
  // Minimum points required for redemption
  minRedemptionPoints: 100,
  
  // Maximum points that can be redeemed per transaction (percentage of total)
  maxRedemptionPercent: 50,
  
  // Bonus points for special occasions
  bonusEvents: {
    birthday: 500,
    anniversary: 1000,
    referral: 200
  },
  
  // Category-specific multipliers
  categoryMultipliers: {
    'premium': 1.5,
    'seasonal': 1.2,
    'clearance': 0.5
  }
};

/**
 * Calculate points earned for a purchase
 * @param {number} amount - Purchase amount in PKR
 * @param {string} tierKey - Customer's loyalty tier
 * @param {string} category - Product category (optional)
 * @returns {number} Points earned
 */
export function calculatePointsEarned(amount, tierKey = 'silver', category = null) {
  const tier = loyaltyTiers[tierKey] || loyaltyTiers.silver;
  const basePoints = amount * loyaltyConfig.basePointsPerPKR;
  
  // Apply tier multiplier
  let points = basePoints * tier.multiplier;
  
  // Apply category multiplier if applicable
  if (category && loyaltyConfig.categoryMultipliers[category]) {
    points *= loyaltyConfig.categoryMultipliers[category];
  }
  
  return Math.floor(points);
}

/**
 * Calculate discount from points redemption
 * @param {number} points - Points to redeem
 * @param {number} invoiceTotal - Total invoice amount
 * @returns {Object} Redemption details
 */
export function calculateRedemption(points, invoiceTotal) {
  // Check minimum redemption
  if (points < loyaltyConfig.minRedemptionPoints) {
    return {
      success: false,
      error: 'Minimum redemption is 100 points',
      errorUr: 'کم از کم ریڈیمپشن 100 پوائنٹس ہے'
    };
  }
  
  // Calculate discount amount
  const discountAmount = points * loyaltyConfig.redemptionRate;
  
  // Check maximum redemption limit (50% of invoice)
  const maxDiscount = invoiceTotal * (loyaltyConfig.maxRedemptionPercent / 100);
  
  if (discountAmount > maxDiscount) {
    const maxPoints = Math.floor(maxDiscount / loyaltyConfig.redemptionRate);
    return {
      success: false,
      error: `Maximum ${maxPoints} points can be redeemed for this invoice`,
      errorUr: `اس انوائس کے لیے زیادہ سے زیادہ ${maxPoints} پوائنٹس ریڈیم کیے جا سکتے ہیں`,
      maxPoints,
      maxDiscount
    };
  }
  
  return {
    success: true,
    pointsRedeemed: points,
    discountAmount: Math.round(discountAmount * 100) / 100,
    remainingTotal: Math.round((invoiceTotal - discountAmount) * 100) / 100
  };
}

/**
 * Get customer tier based on total points
 * @param {number} totalPoints - Customer's total points
 * @returns {Object} Tier object
 */
export function getCustomerTier(totalPoints) {
  for (const [key, tier] of Object.entries(loyaltyTiers)) {
    if (totalPoints >= tier.minPoints && totalPoints <= tier.maxPoints) {
      return { ...tier, key };
    }
  }
  return { ...loyaltyTiers.silver, key: 'silver' };
}

/**
 * Calculate points until next tier
 * @param {number} currentPoints - Current points balance
 * @returns {Object} Next tier information
 */
export function getPointsToNextTier(currentPoints) {
  const currentTier = getCustomerTier(currentPoints);
  
  if (currentTier.key === 'platinum') {
    return {
      currentTier: currentTier.key,
      nextTier: null,
      pointsNeeded: 0,
      message: { 
        en: 'You are at the highest tier!', 
        ur: 'آپ اعلیٰ ترین درجے پر ہیں!' 
      }
    };
  }
  
  const nextTierKey = currentTier.key === 'silver' ? 'gold' : 'platinum';
  const nextTier = loyaltyTiers[nextTierKey];
  const pointsNeeded = nextTier.minPoints - currentPoints;
  
  return {
    currentTier: currentTier.key,
    nextTier: nextTierKey,
    pointsNeeded,
    message: {
      en: `${pointsNeeded} more points to reach ${nextTier.name.en}`,
      ur: `${nextTier.name.ur} تک پہنچنے کے لیے ${pointsNeeded} مزید پوائنٹس`
    }
  };
}

/**
 * Calculate points expiry
 * @param {Date} earnedDate - Date when points were earned
 * @returns {Object} Expiry information
 */
export function calculatePointsExpiry(earnedDate) {
  const expiryDate = new Date(earnedDate);
  expiryDate.setDate(expiryDate.getDate() + loyaltyConfig.expiryDays);
  
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  
  return {
    expiryDate,
    daysUntilExpiry,
    isExpired: daysUntilExpiry < 0,
    isExpiringSoon: daysUntilExpiry > 0 && daysUntilExpiry <= 30
  };
}

/**
 * Get bonus points for special events
 * @param {string} eventType - Event type (birthday, anniversary, referral)
 * @returns {number} Bonus points
 */
export function getBonusPoints(eventType) {
  return loyaltyConfig.bonusEvents[eventType] || 0;
}

/**
 * Format points display
 * @param {number} points - Points to format
 * @param {string} lang - Language code
 * @returns {string} Formatted points string
 */
export function formatPoints(points, lang = 'en') {
  if (lang === 'ur') {
    const urduNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const urduPoints = points.toString().split('').map(digit => {
      return /\d/.test(digit) ? urduNumerals[parseInt(digit)] : digit;
    }).join('');
    return `${urduPoints} پوائنٹس`;
  }
  return `${points.toLocaleString()} points`;
}

/**
 * Get all loyalty tiers
 * @returns {Array} Array of tier objects
 */
export function getAllTiers() {
  return Object.entries(loyaltyTiers).map(([key, tier]) => ({
    ...tier,
    key
  }));
}

/**
 * Validate loyalty transaction
 * @param {Object} transaction - Transaction object
 * @returns {Object} Validation result
 */
export function validateLoyaltyTransaction(transaction) {
  const errors = [];
  
  if (!transaction.customerId) {
    errors.push({ en: 'Customer ID is required', ur: 'کسٹمر آئی ڈی ضروری ہے' });
  }
  
  if (transaction.type === 'earn' && (!transaction.amount || transaction.amount <= 0)) {
    errors.push({ en: 'Valid purchase amount is required', ur: 'درست خریداری کی رقم ضروری ہے' });
  }
  
  if (transaction.type === 'redeem' && (!transaction.points || transaction.points < loyaltyConfig.minRedemptionPoints)) {
    errors.push({ 
      en: `Minimum ${loyaltyConfig.minRedemptionPoints} points required for redemption`, 
      ur: `ریڈیمپشن کے لیے کم از کم ${loyaltyConfig.minRedemptionPoints} پوائنٹس ضروری ہیں` 
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate loyalty summary for customer
 * @param {Object} customerData - Customer loyalty data
 * @returns {Object} Loyalty summary
 */
export function generateLoyaltySummary(customerData) {
  const { totalPoints, pointsEarned, pointsRedeemed, pointsExpired } = customerData;
  const tier = getCustomerTier(totalPoints);
  const nextTierInfo = getPointsToNextTier(totalPoints);
  
  return {
    currentPoints: totalPoints,
    tier: tier.key,
    tierName: tier.name,
    tierBenefits: tier.benefits,
    multiplier: tier.multiplier,
    lifetimeEarned: pointsEarned,
    lifetimeRedeemed: pointsRedeemed,
    expired: pointsExpired,
    nextTier: nextTierInfo,
    redemptionValue: Math.round(totalPoints * loyaltyConfig.redemptionRate * 100) / 100
  };
}
