/**
 * Pakistani Locations Database
 * Cities, markets, and regions for location-based features
 */

export const pakistaniCities = {
    punjab: [
        'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala',
        'Sialkot', 'Bahawalpur', 'Sargodha', 'Sheikhupura', 'Jhang',
        'Rahim Yar Khan', 'Gujrat', 'Kasur', 'Sahiwal', 'Okara'
    ],
    sindh: [
        'Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah',
        'Mirpurkhas', 'Jacobabad', 'Shikarpur', 'Khairpur', 'Dadu'
    ],
    kpk: [
        'Peshawar', 'Mardan', 'Abbottabad', 'Swat', 'Mingora',
        'Kohat', 'Dera Ismail Khan', 'Mansehra', 'Bannu', 'Charsadda'
    ],
    balochistan: [
        'Quetta', 'Gwadar', 'Turbat', 'Khuzdar', 'Chaman',
        'Sibi', 'Zhob', 'Loralai', 'Mastung'
    ],
    ajk: [
        'Muzaffarabad', 'Mirpur', 'Rawalakot', 'Kotli', 'Bhimber'
    ],
    gilgit: [
        'Gilgit', 'Skardu', 'Hunza', 'Chilas', 'Ghanche'
    ]
};

// Flatten all cities for easy access
export const allCities = Object.values(pakistaniCities).flat().sort();

// Major cities (for quick selection)
export const majorCities = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Hyderabad', 'Gujranwala', 'Peshawar', 'Quetta',
    'Sialkot', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana'
];

// Textile markets by city
export const textileMarkets = {
    karachi: [
        'Jama Cloth Market', 'Lunda Bazaar', 'Tariq Road', 'Saddar',
        'Bohri Bazaar', 'Zainab Market', 'Hyderi Market'
    ],
    lahore: [
        'Anarkali Bazaar', 'Liberty Market', 'Azam Cloth Market',
        'Hall Road', 'Ichhra Bazaar', 'Shah Alam Market',
        'Brandreth Road', 'Moon Market'
    ],
    faisalabad: [
        'Cloth Market', 'Jhang Bazaar', 'Aminpur Bazaar',
        'Katchery Bazaar', 'Rail Bazaar', 'Ghanta Ghar'
    ],
    rawalpindi: [
        'Raja Bazaar', 'Saddar Bazaar', 'Commercial Market',
        'Moti Bazaar'
    ],
    multan: [
        'Hussain Agahi Bazaar', 'Chowk Bazaar', 'Suraj Miani Bazaar'
    ]
};

// Electronics markets
export const electronicsMarkets = {
    karachi: ['Saddar', 'Tariq Road', 'Hyderi Market', 'Regal Chowk'],
    lahore: ['Hall Road', 'Hafeez Center', 'Liberty Market'],
    rawalpindi: ['Raja Bazaar', 'Commercial Market', 'Saddar'],
    islamabad: ['Blue Area', 'F-6 Markaz', 'F-7 Markaz', 'Jinnah Super']
};

// Auto parts markets
export const autoPartsMarkets = {
    karachi: ['Shershah', 'Lea Market', 'Saddar'],
    lahore: ['Brandreth Road', 'Badami Bagh', 'Shahdara'],
    rawalpindi: ['Committee Chowk', 'Saddar'],
    faisalabad: ['Ghulam Muhammad Abad', 'Aminpur']
};

/**
 * Get cities by province
 * @param {string} province - Province name
 * @returns {string[]} Array of cities
 */
export function getCitiesByProvince(province) {
    return pakistaniCities[province.toLowerCase()] || [];
}

/**
 * Get markets for a domain and city
 * @param {string} domain - Business domain
 * @param {string} city - City name
 * @returns {string[]} Array of market names
 */
export function getMarketsForDomainAndCity(domain, city) {
    const cityKey = city.toLowerCase();

    if (domain.includes('textile') || domain.includes('garment')) {
        return textileMarkets[cityKey] || [];
    }

    if (domain.includes('electronics') || domain.includes('mobile')) {
        return electronicsMarkets[cityKey] || [];
    }

    if (domain.includes('auto')) {
        return autoPartsMarkets[cityKey] || [];
    }

    return [];
}

/**
 * Search cities by query
 * @param {string} query - Search query
 * @returns {string[]} Matching cities
 */
export function searchCities(query) {
    if (!query) return majorCities;

    const lowerQuery = query.toLowerCase();
    return allCities.filter(city =>
        city.toLowerCase().includes(lowerQuery)
    ).slice(0, 15);
}
