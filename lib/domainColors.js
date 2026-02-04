/**
 * Domain-specific professional color schemes
 * UNIFIED ENTERPRISE THEME (Tenvo Wine)
 * All domains now use the standard corporate identity for professionalism.
 */

const standardTheme = {
  primary: '#8B1538', // Enterprise Wine
  primaryLight: '#A01A42',
  primaryDark: '#7a1230',
  accent: '#DC2626',
  bg: '#FAFAFA', // Neutral professional background (Replacing colored tints)
  text: '#18181B', // Zinc-900 High Contrast
  // Functional colors for stats (kept semantic)
  stats: {
    revenue: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600' },
    orders: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
    products: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
    customers: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
  },
  button: 'bg-wine hover:bg-wine/90',
  sidebar: 'bg-wine',
};

export const domainColorSchemes = {
  // All domains map to the Standard Enterprise Theme
  'auto-parts': standardTheme,
  'retail-shop': standardTheme,
  'pharmacy': standardTheme,
  'chemical': standardTheme,
  'food-beverages': standardTheme,
  'ecommerce': standardTheme,
  'computer-hardware': standardTheme,
  'furniture': standardTheme,
  'book-publishing': standardTheme,
  'travel': standardTheme,
  'fmcg': standardTheme,
  'electrical': standardTheme,
  'paper-mill': standardTheme,
  'paint': standardTheme,
  'mobile': standardTheme,
  'garments': standardTheme,
  'agriculture': standardTheme,
  'gems-jewellery': standardTheme,
  'electronics-goods': standardTheme,
  'real-estate': standardTheme,
  'grocery': standardTheme,
  'textile-wholesale': standardTheme,
};

// Default scheme
export const defaultScheme = standardTheme;

// Get color scheme for a category
export function getDomainColors(category) {
  // Enforce standard theme regardless of category input
  return defaultScheme;
}
