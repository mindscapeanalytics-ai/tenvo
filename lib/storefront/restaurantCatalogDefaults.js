/**
 * Static marketing defaults for elevated restaurant / kitchen storefronts.
 */

export const RESTAURANT_THEME = {
  accent: '#dc2626',
  accentDark: '#991b1b',
  promoBar: '#dc2626',
  cream: '#fafafa',
};

/** Demo homepage spotlight — resolved at runtime from product photos. */
export const RESTAURANT_DEMO_SPOTLIGHT_CARDS = [
  {
    id: 'bbq',
    title: 'BBQ & grills',
    subtitle: 'Tikka, boti, and karahi specials',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=82&auto=format&fit=crop',
    href: '?category=bbq',
  },
  {
    id: 'biryani',
    title: 'Biryani & rice',
    subtitle: 'Handi biryani and classic rice dishes',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=900&q=82&auto=format&fit=crop',
    href: '?category=biryani',
  },
  {
    id: 'rolls',
    title: 'Signature rolls',
    subtitle: 'Behari, malai, and crispy rolls',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&q=82&auto=format&fit=crop',
    href: '?category=rolls',
  },
  {
    id: 'deals',
    title: 'Deals & combos',
    subtitle: 'Value meals and bundle savings',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=82&auto=format&fit=crop',
    href: '?onSale=true',
  },
];

export const RESTAURANT_DELIVERY_NOTICE = 'Order online · Fresh meals · Delivery & pickup';

export const RESTAURANT_DEFAULT_SUB_NAV = [
  { id: 'menu', label: 'Full menu', hrefSuffix: '/products' },
  { id: 'deals', label: 'Deals', hrefSuffix: '/products?onSale=true' },
  { id: 'combos', label: 'Combos', hrefSuffix: '/products?search=combo' },
  { id: 'contact', label: 'Catering', hrefSuffix: '/contact' },
];

/** Wide promo tiles — resolved at runtime from product photos on demo stores. */
export const RESTAURANT_UPPER_PROMO_TILES = [
  {
    id: 'bbq',
    title: 'BBQ & grills',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=82&auto=format&fit=crop',
    href: '?category=bbq',
  },
  {
    id: 'biryani',
    title: 'Biryani & rice',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=900&q=82&auto=format&fit=crop',
    href: '?category=biryani',
  },
  {
    id: 'rolls',
    title: 'Signature rolls',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&q=82&auto=format&fit=crop',
    href: '?category=rolls',
  },
  {
    id: 'deals',
    title: "Today's deals",
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=82&auto=format&fit=crop',
    href: '?onSale=true',
  },
];
