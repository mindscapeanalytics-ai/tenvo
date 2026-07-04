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
    image: 'https://services.eatx.pk/ProductImages/d838a46d-20b8-4146-a349-ace9101c9e57.jpg',
    href: '?category=bbq',
  },
  {
    id: 'biryani',
    title: 'Biryani & rice',
    subtitle: 'Handi biryani and classic rice dishes',
    image: 'https://services.eatx.pk/ProductImages/60f4ca4c-de06-4b85-a676-eef2a2976efd.jpg',
    href: '?category=biryani',
  },
  {
    id: 'rolls',
    title: 'Signature rolls',
    subtitle: 'Behari, malai, and crispy rolls',
    image: 'https://services.eatx.pk/ProductImages/6496cce2-7ae9-4f1d-bd0f-4cfecd311ec1.jpg',
    href: '?category=rolls',
  },
  {
    id: 'deals',
    title: 'Deals & combos',
    subtitle: 'Value meals and bundle savings',
    image: 'https://services.eatx.pk/ProductImages/f0cad0aa-4102-41ad-8bca-b0a08cbe6efa.jpeg',
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
    image: 'https://services.eatx.pk/ProductImages/d838a46d-20b8-4146-a349-ace9101c9e57.jpg',
    href: '?category=bbq',
  },
  {
    id: 'biryani',
    title: 'Biryani & rice',
    image: 'https://services.eatx.pk/ProductImages/60f4ca4c-de06-4b85-a676-eef2a2976efd.jpg',
    href: '?category=biryani',
  },
  {
    id: 'rolls',
    title: 'Signature rolls',
    image: 'https://services.eatx.pk/ProductImages/6496cce2-7ae9-4f1d-bd0f-4cfecd311ec1.jpg',
    href: '?category=rolls',
  },
  {
    id: 'deals',
    title: "Today's deals",
    image: 'https://services.eatx.pk/ProductImages/f0cad0aa-4102-41ad-8bca-b0a08cbe6efa.jpeg',
    href: '?onSale=true',
  },
];
