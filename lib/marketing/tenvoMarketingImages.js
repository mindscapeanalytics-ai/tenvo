/**
 * Canonical marketing imagery from /public/tenvo-img/webp (optimized WebP).
 * Each homepage section should use a unique primary image (no cross-section reuse).
 */

const W = '/tenvo-img/webp';

export const TENVO_IMG = {
  /** Hero desktop + phone dashboard composite (black plate via CSS blend) */
  heroDashboardDevices: `${W}/tenvo-dashboard.webp`,
  /** Founder hero composite PNG (optional lifestyle asset) */
  founderPortrait: '/zeeshankeerio.png',
  /** Advanced enterprise hub dashboard */
  advancedDashboard: `${W}/tenvo-advanced-desktop-dashboard-mindscapeanalytics.webp`,
  /** Easy Mode retail dashboard */
  retailDashboard: `${W}/retail-simple-dashboard.webp`,
  /** Desktop + mobile Advanced hub composite */
  oneTenvoHub: `${W}/One-TENVO-Hub.webp`,
  /** Inventory hub + phone + POS hardware */
  inventoryEcosystem: `${W}/pos-inv.webp`,
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
 * Hero → heroDashboardDevices (tenvo-dashboard.webp)
 * Chaos / One Hub → oneTenvoHub (One-TENVO-Hub.webp)
 * AI → advancedDashboard
 * Industry / counter → inventoryEcosystem (pos-inv.webp)
 * Growth → supermarketStore
 * Mobile banner → mobileHome + mobilePos (+ mobileStock on small screens)
 * Trust strip → integration logos + industry icons (no product screenshots)
 * Finance page assets → excelEntry, pnlStatement (not on homepage)
 */

/** Soft legacy map — primary industry visual is inventoryEcosystem */
export const TENVO_IMG_INDUSTRY_CARDS = [
  {
    title: 'Inventory ecosystem',
    blurb: 'Hub, phone, receipts, scan, and payment in one counter picture.',
    metric: 'Counter ready',
    image: TENVO_IMG.inventoryEcosystem,
    href: '/industries',
    object: 'object-contain',
  },
];
