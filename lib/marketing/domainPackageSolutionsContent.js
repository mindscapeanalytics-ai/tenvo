/**
 * Per-package marketing copy for `/solutions/[slug]` pages.
 * Icon fields are Lucide export names (strings), resolved in the client page component.
 */
import {
  CLOTHING_COMMERCE_HIGHLIGHTS,
  PHARMACY_COMMERCE_HIGHLIGHTS,
  AUTO_PARTS_COMMERCE_HIGHLIGHTS,
  VEHICLE_SHOWROOM_HIGHLIGHTS,
  FURNITURE_COMMERCE_HIGHLIGHTS,
  FITNESS_COMMERCE_HIGHLIGHTS,
  MILK_COMMERCE_HIGHLIGHTS,
} from '@/lib/config/domainPackageFeatures';
import { TENVO_IMG } from '@/lib/marketing/tenvoMarketingImages';

/** @type {Record<string, object>} */
export const DOMAIN_PACKAGE_SOLUTIONS_CONTENT = {
  'clothing-commerce': {
    heroEyebrow: 'Fashion & textile suite',
    channelsHeading: 'What a large clothing operator actually runs',
    channelsLead:
      'Most scaled fashion groups run a public store, one or more showrooms, and a B2B desk, often with separate price lists per channel.',
    modulesHeading: 'Module mix tuned for fashion & textile',
    modulesLead: 'Honest status labels aligned with product capabilities and plan gates in the hub.',
    highlightFeatures: CLOTHING_COMMERCE_HIGHLIGHTS,
    channelPillars: [
      {
        icon: 'Globe',
        title: 'Online storefront',
        body: 'Branded catalog with variants, filters, cart, and checkout. Orders land in the same hub as showroom sales.',
        accent: 'border-violet-200/80 bg-gradient-to-br from-violet-50/70 to-white',
        iconClass: 'bg-violet-600 text-white',
      },
      {
        icon: 'Store',
        title: 'Retail POS',
        body: 'Counter checkout with barcode lookup, loyalty, and thermal receipts. Stock decrements from the same matrix as your web store.',
        accent: 'border-rose-200/80 bg-gradient-to-br from-rose-50/70 to-white',
        iconClass: 'bg-rose-600 text-white',
      },
      {
        icon: 'Shirt',
        title: 'Wholesale desk',
        body: 'Price lists, credit limits, quotations, and delivery challans for dealers and market buyers, without a second ERP.',
        accent: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-white',
        iconClass: 'bg-emerald-600 text-white',
      },
    ],
    verticalPresets: [
      { key: 'garments', label: 'Garments & fashion retail', desc: 'Size/color matrix, seasons, omni-channel' },
      { key: 'boutique-fashion', label: 'Designer boutique', desc: 'Collections, stitching types, luxury storefront' },
      { key: 'textile-wholesale', label: 'Textile wholesale', desc: 'Thaan, article/design, broker fields' },
      { key: 'textile-mill', label: 'Textile mill', desc: 'Fabric production, BOM, batch rolls' },
    ],
    faqTitle: 'Clothing commerce suite FAQ',
    ctaTitle: 'Run your next collection on one hub',
  },
  'pharmacy-commerce': {
    heroEyebrow: 'Pharmacy & wellness suite',
    channelsHeading: 'Counter, delivery, and compliant catalog',
    channelsLead:
      'Licensed pharmacies run a regulated product catalog, fast counter sales, and repeat-order delivery, with expiry-aware stock and pharmacist-led support.',
    modulesHeading: 'Module mix tuned for pharmacy operators',
    modulesLead: 'Honest status labels aligned with product capabilities and plan gates in the hub.',
    highlightFeatures: PHARMACY_COMMERCE_HIGHLIGHTS,
    channelPillars: [
      {
        icon: 'Globe',
        title: 'Online pharmacy',
        body: 'OTC, wellness, and repeat-order catalog with branded pharmacy storefront, cart, and hub order fulfilment.',
        accent: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-white',
        iconClass: 'bg-emerald-600 text-white',
      },
      {
        icon: 'Store',
        title: 'Counter POS',
        body: 'Barcode lookup, GST receipts, and fast checkout for walk-in customers. Same stock ledger as online orders.',
        accent: 'border-teal-200/80 bg-gradient-to-br from-teal-50/70 to-white',
        iconClass: 'bg-teal-700 text-white',
      },
      {
        icon: 'Stethoscope',
        title: 'Care & support',
        body: 'Appointment booking, helpdesk tickets, and feedback loops for pharmacist consultations and refill reminders.',
        accent: 'border-sky-200/80 bg-gradient-to-br from-sky-50/70 to-white',
        iconClass: 'bg-sky-700 text-white',
      },
    ],
    verticalPresets: [
      { key: 'pharmacy', label: 'Licensed pharmacy', desc: 'Expiry batches, OTC catalog, delivery thresholds' },
    ],
    faqTitle: 'Pharmacy commerce suite FAQ',
    ctaTitle: 'Run your pharmacy on one compliant hub',
  },
  'auto-parts-commerce': {
    heroEyebrow: 'Auto parts & accessories suite',
    channelsHeading: 'Parts counter, e-shop, and trade desk',
    channelsLead:
      'Auto parts retailers combine vehicle-aware search, trade counter sales, and wholesale supply, often across multiple branches and brands.',
    modulesHeading: 'Module mix tuned for parts retailers',
    modulesLead: 'Honest status labels aligned with product capabilities and plan gates in the hub.',
    highlightFeatures: AUTO_PARTS_COMMERCE_HIGHLIGHTS,
    channelPillars: [
      {
        icon: 'Search',
        title: 'Parts finder storefront',
        body: 'Vehicle-aware hero search, category rails, and OEM-style catalog on a branded public store wired to hub inventory.',
        accent: 'border-red-200/80 bg-gradient-to-br from-red-50/70 to-white',
        iconClass: 'bg-red-600 text-white',
      },
      {
        icon: 'Wrench',
        title: 'Trade counter POS',
        body: 'Barcode and part-number lookup, credit accounts for workshops, and thermal receipts at the counter.',
        accent: 'border-zinc-200/80 bg-gradient-to-br from-zinc-50/70 to-white',
        iconClass: 'bg-zinc-800 text-white',
      },
      {
        icon: 'Truck',
        title: 'Wholesale supply',
        body: 'Supplier quotes, price lists for workshops, and multi-warehouse fulfilment for fast-moving SKUs.',
        accent: 'border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-white',
        iconClass: 'bg-amber-700 text-white',
      },
    ],
    verticalPresets: [
      { key: 'auto-parts', label: 'Auto parts & accessories', desc: 'Parts finder, OEM filters, multi-brand catalog' },
    ],
    faqTitle: 'Auto parts commerce suite FAQ',
    ctaTitle: 'Stock, sell, and ship parts from one hub',
  },
  'vehicle-showroom': {
    heroEyebrow: 'Vehicle showroom suite',
    channelsHeading: 'Showroom, listings, and aftersales shop',
    channelsLead:
      'Dealerships list vehicles online, book test drives, sell parts and accessories, and run showroom POS without a separate CRM and DMS stack.',
    modulesHeading: 'Module mix tuned for vehicle dealerships',
    modulesLead: 'Honest status labels aligned with product capabilities and plan gates in the hub.',
    highlightFeatures: VEHICLE_SHOWROOM_HIGHLIGHTS,
    channelPillars: [
      {
        icon: 'Car',
        title: 'Digital showroom',
        body: 'Vehicle listings with make, model, condition, and booking CTAs on a branded dealership storefront.',
        accent: 'border-neutral-200/80 bg-gradient-to-br from-neutral-100/70 to-white',
        iconClass: 'bg-neutral-900 text-white',
      },
      {
        icon: 'Calendar',
        title: 'Test drives & leads',
        body: 'Appointment booking, lead capture forms, live chat, and nurture campaigns from the same customer record.',
        accent: 'border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-white',
        iconClass: 'bg-blue-800 text-white',
      },
      {
        icon: 'Wrench',
        title: 'Parts & accessories shop',
        body: 'E-shop for car care, PPF, and accessories with POS checkout and shared customer accounts.',
        accent: 'border-red-200/80 bg-gradient-to-br from-red-50/60 to-white',
        iconClass: 'bg-red-700 text-white',
      },
    ],
    verticalPresets: [
      { key: 'vehicle-dealership', label: 'Single-brand dealership', desc: 'Listings, test drives, parts e-shop, UAN booking' },
    ],
    faqTitle: 'Vehicle showroom suite FAQ',
    ctaTitle: 'List, book, and sell from one dealership hub',
  },
  'furniture-commerce': {
    heroEyebrow: 'Furniture & home suite',
    channelsHeading: 'Showroom, delivery, and large-ticket online',
    channelsLead:
      'Furniture retailers sell high-ticket collections online and in showroom, coordinate delivery challans, and reserve stock for custom orders.',
    modulesHeading: 'Module mix tuned for furniture & home',
    modulesLead: 'Honest status labels aligned with product capabilities and plan gates in the hub.',
    highlightFeatures: FURNITURE_COMMERCE_HIGHLIGHTS,
    channelPillars: [
      {
        icon: 'Home',
        title: 'Elevated storefront',
        body: 'Room-inspired catalog, collection pages, and checkout with delivery thresholds for bulky goods.',
        accent: 'border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-white',
        iconClass: 'bg-amber-900 text-white',
      },
      {
        icon: 'Sofa',
        title: 'Showroom POS',
        body: 'In-store quotes, deposits, and barcode lookup. Same stock picture as your web catalog.',
        accent: 'border-stone-200/80 bg-gradient-to-br from-stone-50/70 to-white',
        iconClass: 'bg-stone-800 text-white',
      },
      {
        icon: 'Truck',
        title: 'Delivery & reservations',
        body: 'Delivery challans, stock reservations for made-to-order lines, and multi-warehouse fulfilment.',
        accent: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-white',
        iconClass: 'bg-emerald-800 text-white',
      },
    ],
    verticalPresets: [
      { key: 'furniture', label: 'Furniture & home', desc: 'Living, bedroom, dining collections with delivery' },
    ],
    faqTitle: 'Furniture commerce suite FAQ',
    ctaTitle: 'Showcase and deliver furniture from one hub',
  },
  'fitness-commerce': {
    heroEyebrow: 'Gym & fitness suite',
    channelsHeading: 'Supplements, memberships, and coached training',
    channelsLead:
      'Modern gyms run a branded supplement shop, front-desk membership sales, and personal training booked online, often with separate tools for each channel.',
    modulesHeading: 'Module mix tuned for gym & fitness operators',
    modulesLead: 'Honest status labels aligned with product capabilities and plan gates in the hub.',
    highlightFeatures: FITNESS_COMMERCE_HIGHLIGHTS,
    channelPillars: [
      {
        icon: 'Globe',
        title: 'Elevated supplement store',
        body: 'Dark fitness hero, category rails for whey and pre-workout, membership tiers, and coach profiles on a branded public storefront.',
        accent: 'border-rose-200/80 bg-gradient-to-br from-rose-50/70 to-black/5',
        iconClass: 'bg-rose-600 text-white',
      },
      {
        icon: 'Dumbbell',
        title: 'Front desk & POS',
        body: 'Sell memberships, class packs, and counter supplements with barcode lookup and thermal receipts. Same stock as your web shop.',
        accent: 'border-zinc-200/80 bg-gradient-to-br from-zinc-100/70 to-white',
        iconClass: 'bg-zinc-900 text-white',
      },
      {
        icon: 'Calendar',
        title: 'Coaching & booking',
        body: 'Tenant meeting URLs for PT and nutrition consults, contact flows for trial passes, and hub queue for follow-up.',
        accent: 'border-red-200/80 bg-gradient-to-br from-red-50/60 to-white',
        iconClass: 'bg-red-700 text-white',
      },
    ],
    verticalPresets: [
      { key: 'gym-fitness', label: 'Gym & fitness center', desc: 'Supplements, memberships, PT packs, and booking' },
    ],
    faqTitle: 'Gym & fitness commerce suite FAQ',
    ctaTitle: 'Stock, sell, and coach from one fitness hub',
  },
  'milk-commerce': {
    heroEyebrow: 'Milk shop operating system',
    heroLead:
      'One clear hub for kg counter sales, morning Route Hisab, chill FEFO stock, and week or month credit collect. Built for Pakistani doodh shops, not generic ERP clutter.',
    heroImage: TENVO_IMG.milkDashboard,
    heroImageFit: 'contain',
    heroAccent: '#0284c7',
    cardImage: TENVO_IMG.milkPos,
    cardImageAlt: 'Milk shop POS with fresh milk, dahi, and dairy categories',
    channelsHeading: 'Three ways milk shops actually make money',
    channelsLead:
      'Walk-in counter, morning house routes, and a simple online milk store. Same stock, same customers, same AR, without restaurant, warehouse chain, or gym modules in the way.',
    modulesHeading: 'Module mix tuned for milk shop operators',
    modulesLead:
      'Only the capabilities a neighborhood doodh shop needs. Honest Available labels match what ships in the hub today.',
    highlightFeatures: MILK_COMMERCE_HIGHLIGHTS,
    problemHeading: 'Paper notebooks and generic ERPs slow milk shops down',
    problemLead:
      'Keepers lose hours reconciling morning deliveries, arguing over weekly credit, and clicking through modules built for restaurants or warehouse chains.',
    painPoints: [
      {
        title: 'Morning registers drift',
        body: 'House deliveries written on paper or WhatsApp get missed, double-counted, or forgotten before weekly collection.',
      },
      {
        title: 'Credit fights every week',
        body: 'Customers dispute kg totals when there is no clear day-by-day Y/N bill in English and Urdu.',
      },
      {
        title: 'Wrong software chrome',
        body: 'Generic plans surface restaurant POS, multi-warehouse, memberships, and serial tracking keepers never use.',
      },
      {
        title: 'Chill stock quietly spoils',
        body: 'Without FEFO and near-expiry awareness, dahi and pack dairy expire on the shelf while fresh milk sells out.',
      },
      {
        title: 'Load-shedding kills the till',
        body: 'Counter sales stall when the network drops, and offline recovery becomes a spreadsheet cleanup later.',
      },
      {
        title: 'Tools do not talk',
        body: 'Separate POS, delivery notes, and online orders mean three stock truths and no single receivables view.',
      },
    ],
    outcomesHeading: 'How Tenvo raises daily production and productivity',
    outcomesLead:
      'Less time on books, fewer missed houses, faster counter queues, and cleaner month-end collect, so the same staff can serve more liters and more routes.',
    outcomes: [
      {
        metric: '1 day sheet',
        label: 'Becomes a week or month bill',
        body: 'Save the morning route once. Week or month totals become invoices, 58mm thermal bills, and collection reminders on the same AR path.',
      },
      {
        metric: 'kg + barcode',
        label: 'Faster counter throughput',
        body: 'Weight lines for fresh milk and barcode for pack dairy in one SuperStore till, with hold, split tender, and F1-F9 hotkeys.',
      },
      {
        metric: 'EN + Urdu',
        label: 'Fewer collection disputes',
        body: 'Bilingual Y/N daily detail on thermal bills gives houses a clear audit trail before cash or JazzCash is collected.',
      },
      {
        metric: 'Offline ready',
        label: 'Counter and route keep moving',
        body: 'POS offline mode and Route Hisab offline Phase 1 keep sales and day sheets usable when the line drops, then sync to Postgres.',
      },
      {
        metric: 'FEFO chill',
        label: 'Less wastage, clearer restock',
        body: 'Batch and near-expiry awareness for chilled dairy so near-date stock moves first and low stock shows on the Easy dashboard.',
      },
      {
        metric: 'Lean hub',
        label: 'Staff learn one OS',
        body: 'Restaurant, warehouse chain, and membership chrome stay off. Quick Entry opens Milk Record, POS, and customers in one glance.',
      },
    ],
    featureShowcaseHeading: 'See the milk OS that owners run every morning',
    featureShowcaseLead:
      'Real product screens from the milk suite: Easy dashboard, kg POS, Route Hisab, and bilingual collection bills.',
    featureShowcases: [
      {
        title: 'Morning command center',
        importance: 'Owner priority',
        body: 'Retail Simple dashboard puts Milk Record, POS, top selling dairy, revenue, and online orders on one screen so you know what sold and what to collect before the first delivery leaves.',
        help: 'Cuts tab-hopping. Helpers open the same tiles for route entry, expenses, and walk-in sales without learning a warehouse ERP.',
        image: TENVO_IMG.milkDashboard,
        imageAlt: 'TENVO Easy Mode dashboard for a milk shop with Milk Record and dairy KPIs',
        object: 'object-contain',
      },
      {
        title: 'Counter POS built for kg milk',
        importance: 'Daily revenue',
        body: 'Fresh Milk, Dahi, Lassi, Ghee, and pack dairy categories with live stock pills, weight-aware lines, barcode scan, hold sales, and cash/card/wallet tender.',
        help: 'Walk-ins check out in seconds while the same catalog powers online orders. Offline queue covers load-shedding.',
        image: TENVO_IMG.milkPos,
        imageAlt: 'Milk shop POS product grid with cart and dairy categories',
        object: 'object-contain',
      },
      {
        title: 'Route Hisab daily sheet',
        importance: 'Route productivity',
        body: 'Log milk kg, eggs, bread, butter, cream, and dahi per house. On Route, Delivered, Pending, and Day Total update as you type. Save day once so week and month bills stay honest.',
        help: 'Replaces paper register math. Pending houses stay visible so no morning stop is skipped.',
        image: TENVO_IMG.milkHisab,
        imageAlt: 'Route Hisab Daily Route sheet with house deliveries and day total',
        object: 'object-contain',
      },
      {
        title: 'Week and month bills customers trust',
        importance: 'Cash collection',
        body: '58mm thermal bills with English and Urdu, daily Y/N detail, product totals in kg and dozen, and a clear grand total for the collection visit.',
        help: 'Reduces “kitna bana?” arguments. Pair with hub, email, or WhatsApp reminders that carry the bill context.',
        image: TENVO_IMG.milkBillBilingual,
        imageAlt: 'Bilingual English and Urdu weekly milk delivery bill',
        object: 'object-contain',
      },
    ],
    guideHeading: 'Run your doodh shop in three steps',
    guideLead:
      'Preview the milk storefront, understand counter plus Route Hisab, then register with Professional packaging and milk-shop presets already applied.',
    guideSteps: [
      {
        title: 'See what buyers get',
        body: 'Open demo-milk for the elevated public store with kg-first dairy categories and chill-friendly rails.',
        href: '/store/demo-milk',
        cta: 'Open demo-milk',
      },
      {
        title: 'Know the daily OS',
        body: 'Counter POS for walk-ins, Route Hisab for morning houses, FEFO chill stock, and week/month credit collect on standard invoices.',
      },
      {
        title: 'Register the suite',
        body: 'Start trial with milk-commerce packaging. Hub lands on milk-shop with restaurant, warehouse chain, and membership chrome stripped.',
        href: '/register?package=milk-commerce&domain=milk-shop&plan=professional',
        cta: 'Start Milk Shop suite',
      },
    ],
    channelPillars: [
      {
        icon: 'Store',
        title: 'Counter POS (kg)',
        body: 'Weight-aware SuperStore checkout for fresh milk, barcode for pack dairy, refunds, and offline mode for load-shedding.',
        accent: 'border-sky-200/80 bg-gradient-to-br from-sky-50/70 to-white',
        iconClass: 'bg-sky-600 text-white',
        heroImage: TENVO_IMG.milkPos,
        imageFit: 'contain',
        slideAccent: '#0284c7',
      },
      {
        icon: 'ClipboardList',
        title: 'Route Hisab',
        body: 'Paper-style daily sheet by house and route. Week or month totals become invoices, thermal bills, and collection reminders.',
        accent: 'border-cyan-200/80 bg-gradient-to-br from-cyan-50/70 to-white',
        iconClass: 'bg-cyan-700 text-white',
        heroImage: TENVO_IMG.milkHisab,
        imageFit: 'contain',
        slideAccent: '#0e7490',
      },
      {
        icon: 'Globe',
        title: 'Online milk store',
        body: 'Elevated public store with milk categories and storefront orders fulfilled in the same hub as counter sales.',
        accent: 'border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-white',
        iconClass: 'bg-blue-700 text-white',
        heroImage: TENVO_IMG.milkEasy,
        imageFit: 'contain',
        slideAccent: '#1d4ed8',
      },
    ],
    verticalPresets: [
      {
        key: 'milk-shop',
        label: 'Neighborhood milk shop',
        desc: 'kg milk, Route Hisab, FEFO chill, single counter',
      },
    ],
    faqTitle: 'Milk shop commerce suite FAQ',
    ctaTitle: 'Run your doodh shop on one clear hub',
    ctaSubtitle:
      '14-day trial on Professional modules with milk-shop presets, Route Hisab, and lean packaging (no restaurant or warehouse clutter).',
  },
};

/**
 * @param {string} slug
 */
export function getDomainPackageSolutionsContent(slug) {
  return DOMAIN_PACKAGE_SOLUTIONS_CONTENT[slug] || null;
}
