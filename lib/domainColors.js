/**
 * Enterprise Color System
 * UNIFIED PROFESSIONAL THEME
 * 
 * All domains use the standard brand colors for consistency and professionalism.
 * This ensures a cohesive user experience across all business categories.
 */

const enterpriseTheme = {
  // Brand Colors
  primary: '#2F5BFF',
  primaryLight: '#5F82FF',
  primaryDark: '#1738A5',
  accent: '#C69214',
  
  // Surface Colors
  bg: '#FAFAFA',
  bgElevated: '#FFFFFF',
  text: '#171717',
  textSecondary: '#525252',
  textMuted: '#737373',
  
  // Semantic Colors for Stats (Professional & Accessible)
  stats: {
    revenue: {
      bg: 'bg-success-light',
      text: 'text-success-dark',
      icon: 'text-success',
      iconColor: 'text-success',
      border: 'border-success/20'
    },
    orders: {
      bg: 'bg-info-light',
      text: 'text-info-dark',
      icon: 'text-info',
      iconColor: 'text-info',
      border: 'border-info/20'
    },
    products: {
      bg: 'bg-warning-light',
      text: 'text-warning-dark',
      icon: 'text-warning',
      iconColor: 'text-warning',
      border: 'border-warning/20'
    },
    customers: {
      bg: 'bg-brand-50',
      text: 'text-brand-primary-dark',
      icon: 'text-brand-primary',
      iconColor: 'text-brand-primary',
      border: 'border-brand-100'
    },
  },
  
  // Component Styles
  button: 'bg-brand-primary hover:bg-brand-primary-dark text-white',
  buttonSecondary: 'bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300',
  buttonGhost: 'bg-transparent hover:bg-neutral-100 text-neutral-700',
  
  // Layout
  sidebar: 'bg-brand-primary',
  sidebarText: 'text-white',
  
  // Borders & Shadows
  border: 'border-neutral-200',
  shadow: 'shadow-md',
  shadowHover: 'hover:shadow-lg',
};

// All domains use the same enterprise theme
export const domainColorSchemes = {
  'auto-parts': enterpriseTheme,
  'retail-shop': enterpriseTheme,
  'pharmacy': enterpriseTheme,
  'chemical': enterpriseTheme,
  'food-beverages': enterpriseTheme,
  'ecommerce': enterpriseTheme,
  'computer-hardware': enterpriseTheme,
  'furniture': enterpriseTheme,
  'book-publishing': enterpriseTheme,
  'travel': enterpriseTheme,
  'fmcg': enterpriseTheme,
  'electrical': enterpriseTheme,
  'paper-mill': enterpriseTheme,
  'paint': enterpriseTheme,
  'mobile': enterpriseTheme,
  'garments': enterpriseTheme,
  'agriculture': enterpriseTheme,
  'gems-jewellery': enterpriseTheme,
  'electronics-goods': enterpriseTheme,
  'real-estate': enterpriseTheme,
  'grocery': enterpriseTheme,
  'textile-wholesale': enterpriseTheme,
  'textile-manufacturing': enterpriseTheme,
  'electronics': enterpriseTheme,
  'mobile-accessories': enterpriseTheme,
  'appliances': enterpriseTheme,
  'garments-wholesale': enterpriseTheme,
  'garments-retail': enterpriseTheme,
  'boutique': enterpriseTheme,
  'boutique-fashion': enterpriseTheme,
  'bakery-confectionery': enterpriseTheme,
  'bookshop-stationery': enterpriseTheme,
  'supermarket': enterpriseTheme,
};

// Default scheme
export const defaultScheme = enterpriseTheme;

/**
 * Get color scheme for a category
 * @param {string} category - Business category
 * @returns {object} Enterprise theme colors
 */
export function getDomainColors(category) {
  // Return enterprise theme for all categories
  return enterpriseTheme;
}
