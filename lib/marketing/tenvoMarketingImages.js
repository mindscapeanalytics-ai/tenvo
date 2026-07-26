/**
 * Canonical marketing imagery from /public/tenvo-img/webp (optimized WebP).
 * Each homepage section should use a unique primary image (no cross-section reuse).
 */

const W = '/tenvo-img/webp';

export const TENVO_IMG = {
  /** Hero desktop + phone dashboard composite (black plate via CSS blend) */
  heroDashboardDevices: '/tenvo-img/tenvo-dashboard.png',
  /** Founder hero composite PNG (optional lifestyle asset) */
  founderPortrait: '/zeeshankeerio.png',
  /** Advanced enterprise hub dashboard */
  advancedDashboard: `${W}/tenvo-advanced-desktop-dashboard-mindscapeanalytics.webp`,
  /** Easy Mode retail dashboard */
  retailDashboard: `${W}/retail-simple-dashboard.webp`,
  /** Excel / Busy-style data entry — finance marketing pages only (not homepage) */
  excelEntry: `${W}/tenvo-excel-data-entry.webp`,
  /** Finance P&L statement PDF preview — finance marketing pages only */
  pnlStatement: `${W}/pnl-statement.webp`,
  /** True phone: hub home / quick entry */
  mobileHome: `${W}/IMG_6584.webp`,
  /** True phone: inventory stock list */
  mobileStock: `${W}/IMG_6585.webp`,
  /** True phone: key metrics */
  mobileMetrics: `${W}/IMG_6586.webp`,
  /** True phone: POS product grid */
  mobilePos: `${W}/IMG_6587.webp`,
  /** Clean cropped mobile hub tab */
  retailMobileTab: `${W}/tenvo-retail-mobile-tab.webp`,
  /** Auto parts mobile storefront tab */
  autoPartsMobile: `${W}/tenvo-auto-parts-mobile-tab.webp`,
  /** Supermarket elevated storefront */
  supermarketStore: `${W}/supper-mart-tenvo.webp`,
  /** Restaurant elevated storefront */
  restaurantStore: `${W}/tenvo-restrient.webp`,
  /** Restaurant digital menu */
  restaurantMenu: `${W}/tenvo-restrient-digital-manu.webp`,
  /** Auto parts finder storefront */
  autoPartsStore: `${W}/tenvo-auto-parts.webp`,
  /** Milk shop POS */
  milkPos: `${W}/milk-shop-pos.webp`,
  /** Milk Easy Mode */
  milkEasy: `${W}/easy-tenvo-milk.webp`,
  /** Route Hisab / ledger */
  milkHisab: `${W}/milk-hisab-kitab.webp`,
  /** Customer inquiry queue */
  customerInquiry: `${W}/customer-inquery.webp`,
  /** Milk thermal / WhatsApp bill */
  milkBillWhatsapp: `${W}/milk-bill-paid-whatsap.webp`,
  /** Milk bilingual bill */
  milkBillBilingual: `${W}/milk-english-urdu-weekly-monthly-bill.webp`,
  /** Gym / fitness storefront */
  fitnessStore: `${W}/tenvo-jym.webp`,
};

/**
 * Homepage image ownership map — prevents duplicate primary visuals across sections.
 * Hero → heroDashboardDevices (tenvo-dashboard.png desktop + mobile)
 * Chaos → CSS collage (no Excel asset) | Control → retailDashboard
 * AI → advancedDashboard
 * Industry → restaurantMenu, autoPartsMobile, mobileMetrics, milkBillBilingual, customerInquiry, retailMobileTab, + soft fitness
 * Growth → supermarketStore
 * Mobile banner → mobileHome + mobilePos (+ mobileStock on small screens) — soft share mobileHome with hero
 * Trust strip → milkEasy (soft with hero), milkPos, restaurantStore, fitnessStore, milkBillWhatsapp, milkBillBilingual
 * Finance page assets → excelEntry, pnlStatement (not on homepage)
 */

/** Industry showcase — unique product screenshots (no Excel / P&L plates) */
export const TENVO_IMG_INDUSTRY_CARDS = [
  {
    title: 'Restaurant',
    blurb: 'Digital menu, order modes, and a sticky bag for multi-item orders.',
    metric: 'Menu + KDS',
    image: TENVO_IMG.restaurantMenu,
    href: '/store/demo-restaurant',
    object: 'object-top',
  },
  {
    title: 'Auto parts',
    blurb: 'Parts finder wired to inventory for vehicle and SKU search.',
    metric: 'Parts finder',
    image: TENVO_IMG.autoPartsMobile,
    href: '/store/demo-autoparts',
    object: 'object-top',
  },
  {
    title: 'Mobile KPIs',
    blurb: 'Key metrics and quick actions tuned for operators on the floor.',
    metric: 'On phone',
    image: TENVO_IMG.mobileMetrics,
    href: '/register',
    object: 'object-top',
  },
  {
    title: 'Milk bills',
    blurb: 'Bilingual thermal bills for daily and monthly milk routes.',
    metric: 'Route billing',
    image: TENVO_IMG.milkBillBilingual,
    href: '/store/demo-milk',
    object: 'object-top',
  },
  {
    title: 'Customer ops',
    blurb: 'Inquiry queue and follow-ups tied to your storefront leads.',
    metric: 'Inbox',
    image: TENVO_IMG.customerInquiry,
    href: '/features',
    object: 'object-top',
  },
  {
    title: 'Mobile hub',
    blurb: 'Quick entry tiles tuned for phone operators on the floor.',
    metric: 'On the go',
    image: TENVO_IMG.retailMobileTab,
    href: '/register',
    object: 'object-top',
  },
  {
    title: 'Fitness',
    blurb: 'Memberships, supplements, and branded fitness storefront chrome.',
    metric: 'Gym retail',
    image: TENVO_IMG.fitnessStore,
    href: '/store/demo-fitness',
    object: 'object-top',
  },
  {
    title: 'Auto store',
    blurb: 'Parts search and shop chrome that feels native on desktop.',
    metric: 'Web store',
    image: TENVO_IMG.autoPartsStore,
    href: '/store/demo-autoparts',
    object: 'object-top',
  },
];
