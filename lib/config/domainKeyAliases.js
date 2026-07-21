/**
 * Maps registration / demo slugs to canonical domainKnowledge keys.
 * Keeps hub URLs like `textile` wired to the correct vertical preset.
 */
export const DOMAIN_KEY_ALIASES = Object.freeze({
  textile: 'textile-wholesale',
  apparel: 'garments',
  clothing: 'garments',
  'clothing-store': 'garments',
  restaurant: 'restaurant-cafe',
  cafe: 'restaurant-cafe',
  'hardware-store': 'hardware-sanitary',
  hardware: 'hardware-sanitary',
  electronics: 'electronics-goods',
  'mobile-phone-shop': 'mobile',
  clinic: 'dental-clinic',
  salon: 'salon-spa',
  'beauty-salon': 'salon-spa',
  'spa-wellness': 'salon-spa',
  'medical-clinic': 'clinics-healthcare',
  spa: 'salon-spa',
  bakery: 'bakery-confectionery',
  grocery: 'supermarket',
  jewellery: 'gems-jewellery',
  jewelry: 'gems-jewellery',
  tiles: 'ceramics-tiles',
  ceramics: 'ceramics-tiles',
  'tiles-marble': 'ceramics-tiles',
  marble: 'ceramics-tiles',
  'marble-stone': 'ceramics-tiles',
  'natural-stone': 'ceramics-tiles',
  'tile-shop': 'ceramics-tiles',
  boutique: 'boutique-fashion',
  vet: 'veterinary-clinic',
  veterinary: 'veterinary-clinic',
  dealership: 'vehicle-dealership',
  vincar: 'vehicle-dealership',
  sehgal: 'vehicle-dealership',
  'sehgal-motorsports': 'vehicle-dealership',
  showroom: 'vehicle-dealership',
  'tenvo-vehicles': 'vehicle-dealership',
  'car-dealer': 'vehicle-dealership',
  'auto-dealer': 'vehicle-dealership',
  'car-marketplace': 'auto-marketplace',
  sgcarmart: 'auto-marketplace',
  'auto-marketplace': 'auto-marketplace',
  'fitness-gym': 'gym-fitness',
  gym: 'gym-fitness',
  marine: 'marine-parts',
  'marine-spare-parts': 'marine-parts',
  'ships-parts': 'marine-parts',
  'ship-spare-parts': 'marine-parts',
  'maritime-parts': 'marine-parts',
  'tenvo-marine': 'marine-parts',
  tyre: 'tyre-shop',
  tire: 'tyre-shop',
  tyres: 'tyre-shop',
  tires: 'tyre-shop',
  'tyre-store': 'tyre-shop',
  'tire-shop': 'tyre-shop',
  'tire-store': 'tyre-shop',
});

/**
 * @param {string} category
 * @returns {string}
 */
export function resolveDomainKey(category) {
  const key = String(category || '').trim().toLowerCase();
  if (!key) return 'retail-shop';
  if (DOMAIN_KEY_ALIASES[key]) return DOMAIN_KEY_ALIASES[key];
  return key;
}

/**
 * @param {string} category
 * @returns {boolean}
 */
export function isKnownDomainKey(category) {
  const resolved = resolveDomainKey(category);
  return resolved !== 'retail-shop' || category === 'retail-shop' || category === '';
}
