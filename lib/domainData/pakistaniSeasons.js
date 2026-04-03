/**
 * Pakistani Seasonal Pricing Configuration
 * Defines seasonal periods for automated pricing adjustments
 */

/**
 * Pakistani seasonal periods with Islamic and Gregorian calendar support
 */
export const pakistaniSeasons = {
  ramadan: {
    key: 'ramadan',
    name: { en: 'Ramadan', ur: 'رمضان' },
    type: 'islamic', // Uses Hijri calendar
    discountPercent: 10,
    applicableCategories: ['food', 'grocery', 'beverages', 'dates', 'snacks'],
    description: {
      en: 'Holy month of fasting - increased demand for food items',
      ur: 'روزے کا مقدس مہینہ - کھانے کی اشیاء کی بڑھتی ہوئی مانگ'
    },
    // Ramadan shifts ~11 days earlier each year (Islamic calendar)
    estimatedMonths: [3, 4], // March-April (approximate)
    durationDays: 30
  },

  eid_ul_fitr: {
    key: 'eid_ul_fitr',
    name: { en: 'Eid ul-Fitr', ur: 'عید الفطر' },
    type: 'islamic',
    discountPercent: 15,
    applicableCategories: ['clothing', 'footwear', 'accessories', 'gifts', 'sweets'],
    description: {
      en: 'Festival after Ramadan - peak shopping for clothes and gifts',
      ur: 'رمضان کے بعد عید - کپڑوں اور تحائف کی خریداری کا عروج'
    },
    estimatedMonths: [4, 5], // April-May (approximate)
    durationDays: 3
  },

  eid_ul_adha: {
    key: 'eid_ul_adha',
    name: { en: 'Eid ul-Adha', ur: 'عید الاضحی' },
    type: 'islamic',
    discountPercent: 15,
    applicableCategories: ['clothing', 'footwear', 'meat', 'groceries', 'gifts'],
    description: {
      en: 'Festival of Sacrifice - shopping for clothes and meat',
      ur: 'قربانی کی عید - کپڑوں اور گوشت کی خریداری'
    },
    estimatedMonths: [6, 7], // June-July (approximate)
    durationDays: 4
  },

  independence_day: {
    key: 'independence_day',
    name: { en: 'Independence Day', ur: 'یوم آزادی' },
    type: 'gregorian',
    discountPercent: 5,
    applicableCategories: ['clothing', 'flags', 'decorations', 'patriotic_items'],
    description: {
      en: 'Pakistan Independence Day - patriotic shopping',
      ur: 'پاکستان کا یوم آزادی - حب الوطنی کی خریداری'
    },
    startDate: { month: 8, day: 10 }, // August 10
    endDate: { month: 8, day: 15 }, // August 15
    durationDays: 6
  },

  winter_sale: {
    key: 'winter_sale',
    name: { en: 'Winter Sale', ur: 'سردیوں کی سیل' },
    type: 'gregorian',
    discountPercent: 20,
    applicableCategories: ['clothing', 'winter_wear', 'blankets', 'heaters', 'warm_accessories'],
    description: {
      en: 'Winter season clearance sale',
      ur: 'سردیوں کے موسم کی کلیئرنس سیل'
    },
    startDate: { month: 11, day: 1 }, // November 1
    endDate: { month: 1, day: 31 }, // January 31
    durationDays: 92
  },

  summer_sale: {
    key: 'summer_sale',
    name: { en: 'Summer Sale', ur: 'گرمیوں کی سیل' },
    type: 'gregorian',
    discountPercent: 15,
    applicableCategories: ['clothing', 'summer_wear', 'fans', 'coolers', 'beverages'],
    description: {
      en: 'Summer season clearance sale',
      ur: 'گرمیوں کے موسم کی کلیئرنس سیل'
    },
    startDate: { month: 5, day: 1 }, // May 1
    endDate: { month: 7, day: 31 }, // July 31
    durationDays: 92
  },

  back_to_school: {
    key: 'back_to_school',
    name: { en: 'Back to School', ur: 'واپسی اسکول' },
    type: 'gregorian',
    discountPercent: 10,
    applicableCategories: ['stationery', 'books', 'bags', 'uniforms', 'shoes'],
    description: {
      en: 'School reopening season - stationery and uniform shopping',
      ur: 'اسکول دوبارہ کھلنے کا موسم - اسٹیشنری اور یونیفارم کی خریداری'
    },
    startDate: { month: 3, day: 15 }, // March 15
    endDate: { month: 4, day: 15 }, // April 15
    durationDays: 31
  },

  wedding_season: {
    key: 'wedding_season',
    name: { en: 'Wedding Season', ur: 'شادیوں کا موسم' },
    type: 'gregorian',
    discountPercent: 12,
    applicableCategories: ['bridal_wear', 'jewelry', 'gifts', 'decorations', 'catering'],
    description: {
      en: 'Peak wedding season in Pakistan',
      ur: 'پاکستان میں شادیوں کا عروج'
    },
    startDate: { month: 11, day: 1 }, // November 1
    endDate: { month: 12, day: 31 }, // December 31
    durationDays: 61
  }
};

/**
 * Get current active season based on current date
 * @param {Date} currentDate - Current date (defaults to now)
 * @returns {Object|null} Active season object or null
 */
export function getCurrentSeason(currentDate = new Date()) {
  const month = currentDate.getMonth() + 1; // 1-12
  const day = currentDate.getDate();

  for (const [key, season] of Object.entries(pakistaniSeasons)) {
    if (season.type === 'gregorian') {
      const { startDate, endDate } = season;
      
      // Handle seasons that span across year boundary (e.g., Nov-Jan)
      if (startDate.month > endDate.month) {
        if (
          (month === startDate.month && day >= startDate.day) ||
          (month > startDate.month) ||
          (month < endDate.month) ||
          (month === endDate.month && day <= endDate.day)
        ) {
          return { ...season, key };
        }
      } else {
        // Normal season within same year
        if (
          (month > startDate.month || (month === startDate.month && day >= startDate.day)) &&
          (month < endDate.month || (month === endDate.month && day <= endDate.day))
        ) {
          return { ...season, key };
        }
      }
    }
    // Islamic calendar seasons would need Hijri date conversion (Phase 2)
  }

  return null;
}

/**
 * Get upcoming season within specified days
 * @param {number} daysAhead - Number of days to look ahead
 * @param {Date} currentDate - Current date (defaults to now)
 * @returns {Object|null} Upcoming season object or null
 */
export function getUpcomingSeason(daysAhead = 30, currentDate = new Date()) {
  const futureDate = new Date(currentDate);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const month = futureDate.getMonth() + 1;
  const day = futureDate.getDate();

  for (const [key, season] of Object.entries(pakistaniSeasons)) {
    if (season.type === 'gregorian') {
      const { startDate } = season;
      
      // Check if season starts within the lookahead period
      if (month === startDate.month && day >= startDate.day - 7 && day <= startDate.day) {
        return { ...season, key, daysUntilStart: Math.ceil((new Date(futureDate.getFullYear(), startDate.month - 1, startDate.day) - currentDate) / (1000 * 60 * 60 * 24)) };
      }
    }
  }

  return null;
}

/**
 * Get seasonal discount for a product category
 * @param {string} category - Product category
 * @param {Date} currentDate - Current date (defaults to now)
 * @returns {number} Discount percentage (0 if no season active)
 */
export function getSeasonalDiscount(category, currentDate = new Date()) {
  const currentSeason = getCurrentSeason(currentDate);
  
  if (!currentSeason) {
    return 0;
  }

  if (currentSeason.applicableCategories.includes(category.toLowerCase())) {
    return currentSeason.discountPercent;
  }

  return 0;
}

/**
 * Apply seasonal pricing to a price
 * @param {number} originalPrice - Original product price
 * @param {number} discountPercent - Discount percentage
 * @returns {Object} Object with original, discounted, and savings
 */
export function applySeasonalPricing(originalPrice, discountPercent) {
  const discount = (originalPrice * discountPercent) / 100;
  const discountedPrice = originalPrice - discount;

  return {
    original: originalPrice,
    discounted: Math.round(discountedPrice * 100) / 100,
    savings: Math.round(discount * 100) / 100,
    discountPercent
  };
}

/**
 * Get all seasons
 * @returns {Array} Array of all season objects
 */
export function getAllSeasons() {
  return Object.entries(pakistaniSeasons).map(([key, season]) => ({
    ...season,
    key
  }));
}

/**
 * Get seasons by type
 * @param {string} type - 'islamic' or 'gregorian'
 * @returns {Array} Array of season objects
 */
export function getSeasonsByType(type) {
  return getAllSeasons().filter(season => season.type === type);
}

/**
 * Check if a date falls within a specific season
 * @param {string} seasonKey - Season key
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is within season
 */
export function isDateInSeason(seasonKey, date = new Date()) {
  const season = pakistaniSeasons[seasonKey];
  if (!season) return false;

  if (season.type === 'gregorian') {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const { startDate, endDate } = season;

    if (startDate.month > endDate.month) {
      // Spans year boundary
      return (
        (month === startDate.month && day >= startDate.day) ||
        (month > startDate.month) ||
        (month < endDate.month) ||
        (month === endDate.month && day <= endDate.day)
      );
    } else {
      return (
        (month > startDate.month || (month === startDate.month && day >= startDate.day)) &&
        (month < endDate.month || (month === endDate.month && day <= endDate.day))
      );
    }
  }

  return false;
}
