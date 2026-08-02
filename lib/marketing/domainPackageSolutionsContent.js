/**
 * Per-package marketing copy for `/solutions/[slug]` pages.
 * Icon fields are Lucide export names (strings), resolved in the client page component.
 * Keep claims honest vs `lib/marketing/capabilities.js` and package `moduleGroups` statuses.
 */
import {
  CLOTHING_COMMERCE_HIGHLIGHTS,
  PHARMACY_COMMERCE_HIGHLIGHTS,
  AUTO_PARTS_COMMERCE_HIGHLIGHTS,
  VEHICLE_SHOWROOM_HIGHLIGHTS,
  FURNITURE_COMMERCE_HIGHLIGHTS,
  FITNESS_COMMERCE_HIGHLIGHTS,
  MILK_COMMERCE_HIGHLIGHTS,
  WATER_COMMERCE_HIGHLIGHTS,
} from '@/lib/config/domainPackageFeatures';
import { TENVO_IMG } from '@/lib/marketing/tenvoMarketingImages';
import { getDemoStoreHeroByDomain } from '@/lib/marketing/demoStoreGalleryMeta';

const DEMO = {
  textile: getDemoStoreHeroByDomain('demo-textile'),
  pharmacy: getDemoStoreHeroByDomain('demo-pharmacy'),
  autoparts: getDemoStoreHeroByDomain('demo-autoparts'),
  showroom: getDemoStoreHeroByDomain('demo-showroom'),
  furniture: getDemoStoreHeroByDomain('demo-furniture'),
  fitness: getDemoStoreHeroByDomain('demo-fitness'),
};

/** @type {Record<string, object>} */
export const DOMAIN_PACKAGE_SOLUTIONS_CONTENT = {
  'clothing-commerce': {
    heroEyebrow: 'Fashion & textile suite',
    audienceHeading: 'From single-door boutique to multi-channel clothing group',
    audienceLead:
      'Start with one showroom and an online catalog. Scale into wholesale desks, multiple warehouses, and BOM production without stitching Shopify, Busy, and Excel together.',
    audience: [
      {
        title: 'Small & mid fashion retailers',
        body: 'Boutique or garments store with size/color matrix, barcode POS, and a branded editorial storefront on day one. Lean packaging keeps gym and restaurant chrome out of the hub.',
        fit: 'Best when you need Free/Starter POS basics now, then this suite for fashion packaging and raised limits.',
      },
      {
        title: 'Growing wholesale & mill operators',
        body: 'Textile wholesale articles, price lists, quotations, delivery challans, and optional mill BOM on Business-tier packaging when trade volume and production appear.',
        fit: 'Best when dealers, thaan/article fields, and multi-warehouse stock matter more than a single till.',
      },
    ],
    problemHeading: 'Fashion teams lose margin when channels disagree',
    problemLead:
      'Web, counter, and wholesale often keep separate stock truths. Collections launch late, dealers get wrong prices, and finance reconciles three exports.',
    painPoints: [
      {
        title: 'Variant chaos',
        body: 'Size/color matrix lives in a spreadsheet while the till and web store drift, so bestsellers show available online when the shelf is empty.',
      },
      {
        title: 'Wholesale on WhatsApp',
        body: 'Dealer quotes and challans sit outside inventory, so credit limits and live stock never inform the promise.',
      },
      {
        title: 'Seasonal blind spots',
        body: 'Without one hub for seasons and collections, leftover stock piles up while new lines launch without channel pricing.',
      },
      {
        title: 'Tool sprawl',
        body: 'Storefront builder + offline POS + accounting means triple data entry and no single order view for the owner.',
      },
      {
        title: 'Wrong ERP chrome',
        body: 'Generic plans surface restaurant KDS, gym memberships, or warehouse chains that fashion teams never touch.',
      },
      {
        title: 'Growth without CRM glue',
        body: 'Loyalty and campaigns cannot segment real buyers when customer history is split across apps.',
      },
    ],
    outcomesHeading: 'How one clothing hub grows the business',
    outcomesLead:
      'Honest operating outcomes (not invented percentages): fewer stock surprises, faster dealer quotes, and a path from boutique to wholesale without a second system.',
    outcomes: [
      {
        metric: '1 catalog',
        label: 'Web, POS, and trade',
        body: 'Variants and stock decrement from the same product truth whether the sale is online, counter, or wholesale desk.',
      },
      {
        metric: 'Quotes + stock',
        label: 'Dealer promises you can keep',
        body: 'B2B quotations and sales orders carry live stock context so sales stop overselling thaan and SKUs.',
      },
      {
        metric: 'Editorial shop',
        label: 'Day-one branded store',
        body: 'Fashion editorial storefront presets land on registration for clothing verticals, not a blank theme shell.',
      },
      {
        metric: 'Raised limits',
        label: 'Room to add branches',
        body: 'Suite packaging lifts products, seats, and POS terminals on the recommended Business tier as you open doors.',
      },
      {
        metric: 'Lean modules',
        label: 'Staff learn faster',
        body: 'Packaging enables fashion-relevant features and keeps unrelated vertical chrome off the sidebar.',
      },
      {
        metric: 'Growth path',
        label: 'CRM without export',
        body: 'Loyalty and campaigns (plan-gated) read the same customers and orders once operations are stable.',
      },
    ],
    featureShowcaseHeading: 'See the clothing OS owners actually run',
    featureShowcaseLead:
      'Product UI and live demo storefront imagery. Status of wholesale depth and manufacturing stays Available / Partial as labeled in modules below.',
    featureShowcases: [
      {
        title: 'One hub for inventory and selling',
        importance: 'Owner priority',
        body: 'Advanced and Easy Mode dashboards keep stock, sales, and channel activity visible so owners are not tab-hopping between a store builder and a separate till.',
        help: 'Start lean on Free/Starter POS + inventory, then graduate into this suite for fashion packaging.',
        image: TENVO_IMG.oneTenvoHub,
        imageAlt: 'TENVO hub on desktop and mobile',
        object: 'object-contain',
      },
      {
        title: 'Counter ready with catalog depth',
        importance: 'Daily revenue',
        body: 'Retail POS with barcode lookup, product imagery, and the same variant matrix buyers see online.',
        help: 'Thermal receipts and sessions ship today. Offline POS is Available on plan gate for supported retail shells.',
        image: TENVO_IMG.inventoryEcosystem,
        imageAlt: 'Inventory and POS hardware ecosystem',
        object: 'object-contain',
      },
      {
        title: 'Branded fashion storefront',
        importance: 'Buyer experience',
        body: 'Public shop with collections, filters, cart, and checkout. Orders land in the same hub as showroom sales.',
        help: 'Open demo-textile to walk the buyer path before you register.',
        image: DEMO.textile,
        imageAlt: 'Fashion commerce demo storefront',
        object: 'object-cover',
      },
    ],
    guideHeading: 'Launch a clothing hub in three steps',
    guideLead: 'Preview the storefront, confirm channel mix, then register with clothing-commerce packaging applied.',
    channelsHeading: 'What a clothing operator actually runs',
    channelsLead:
      'Most scaled fashion groups run a public store, one or more showrooms, and a B2B desk, often with separate price lists per channel.',
    modulesHeading: 'Module mix tuned for fashion & textile',
    modulesLead:
      'Catalog and channels are Available. Operations, growth, and compliance stay Partial where depth is plan-gated or expanding.',
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
    audienceHeading: 'Neighborhood pharmacy to multi-counter retail chains',
    audienceLead:
      'Licensed pharmacies need expiry-aware stock and a compliant catalog first. Chains add delivery thresholds and more terminals without inventing FBR live sync claims.',
    audience: [
      {
        title: 'Single-door pharmacies',
        body: 'Barcode counter, batch/expiry awareness, OTC and wellness catalog, and a branded pharmacy storefront for repeat orders.',
        fit: 'Best when counter speed and near-expiry visibility matter more than multi-branch MES.',
      },
      {
        title: 'Growing pharmacy retailers',
        body: 'Raised product and terminal limits, delivery-oriented storefront, appointment/helpdesk loops for pharmacist support. Tax summaries stay Partial (not live FBR IRIS).',
        fit: 'Best when you need one hub for counter + online, not a DRAP filing replacement.',
      },
    ],
    problemHeading: 'Pharmacies cannot treat stock like fashion SKUs',
    problemLead:
      'Batch, expiry, and prescription-aware selling break generic retail tools. Operators also get burned by marketing that overclaims FBR automation.',
    painPoints: [
      {
        title: 'Expiry surprises',
        body: 'Without batch and near-expiry workflows, wastage and compliance risk climb on fast-moving medicine lines.',
      },
      {
        title: 'Split channel stock',
        body: 'Online refill orders and counter sales disagree when catalogs live in two systems.',
      },
      {
        title: 'Rx ambiguity',
        body: 'Prescription-required items must be blocked from casual cart checkout. Network e-Rx APIs stay Roadmap.',
      },
      {
        title: 'Compliance overclaim',
        body: 'Teams buy software expecting live FBR IRIS. TENVO ships tax config and audit-ready summaries (Partial), not live transmission.',
      },
      {
        title: 'Cold-chain fantasy',
        body: 'Temperature IoT monitoring is not a shipped pharmacy module. Focus on inventory discipline and honest labels instead.',
      },
      {
        title: 'Generic ERP clutter',
        body: 'Restaurant and gym modules distract pharmacy staff who need counter, batches, and delivery.',
      },
    ],
    outcomesHeading: 'How pharmacy operators improve the day',
    outcomesLead:
      'Faster counters, clearer expiry awareness, and one order hub. No unverified “100% audit compliance” claims.',
    outcomes: [
      {
        metric: 'Batch aware',
        label: 'Near-expiry visibility',
        body: 'Pharmacy inventory modes surface batch/expiry fields so near-date stock can move first.',
      },
      {
        metric: '1 ledger',
        label: 'Counter and online',
        body: 'Storefront orders and POS share the pharmacy catalog and hub fulfilment queue.',
      },
      {
        metric: 'Rx guardrails',
        label: 'Safer checkout',
        body: 'Prescription-required items show badges and are blocked from casual Add to Cart / API checkout.',
      },
      {
        metric: 'Tax honest',
        label: 'GST setup + exports',
        body: 'Configure rates and export summaries. Live FBR IRIS remains Roadmap, labeled clearly.',
      },
      {
        metric: 'Care loops',
        label: 'Refill follow-up',
        body: 'Appointment booking and contact queue support pharmacist consultations without a second CRM.',
      },
      {
        metric: 'Suite limits',
        label: 'Room to grow',
        body: 'Raised product and POS limits on the recommended Business packaging as you add counters.',
      },
    ],
    featureShowcaseHeading: 'Pharmacy storefront and hub proof',
    featureShowcaseLead:
      'Elevated pharmacy demo imagery plus hub inventory/POS screens. Module cards below keep Available vs Partial honest.',
    featureShowcases: [
      {
        title: 'Elevated pharmacy storefront',
        importance: 'Buyer experience',
        body: 'Branded OTC and wellness catalog with pharmacy chrome. Orders fulfil in the same hub as counter sales.',
        help: 'Open demo-pharmacy to walk the public path before signup.',
        image: DEMO.pharmacy,
        imageAlt: 'Pharmacy elevated storefront demo',
        object: 'object-cover',
      },
      {
        title: 'Inventory discipline for regulated catalogs',
        importance: 'Operations',
        body: 'Hub inventory with product imagery, Excel import, and domain fields suited to pharmacy batches.',
        help: 'Camera barcode scan ships via shared PosCameraScanner on supported plans.',
        image: TENVO_IMG.inventoryEcosystem,
        imageAlt: 'TENVO inventory and POS ecosystem',
        object: 'object-contain',
      },
      {
        title: 'Retail Simple owner view',
        importance: 'Owner priority',
        body: 'Easy Mode dashboards keep sales and stock glanceable for single-door owners who do not need enterprise chrome every morning.',
        help: 'Advanced Mode remains available when multi-user finance depth appears.',
        image: TENVO_IMG.retailDashboard,
        imageAlt: 'Retail Simple dashboard',
        object: 'object-contain',
      },
    ],
    channelsHeading: 'Counter, delivery, and compliant catalog',
    channelsLead:
      'Licensed pharmacies run a regulated product catalog, fast counter sales, and repeat-order delivery, with expiry-aware stock and pharmacist-led support.',
    modulesHeading: 'Module mix tuned for pharmacy operators',
    modulesLead:
      'Pharmacy catalog and channels are Available. Service and compliance stay Partial. Live FBR IRIS and network Rx APIs are Roadmap.',
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
    ctaTitle: 'Run your pharmacy on one honest hub',
    ctaSubtitle:
      '14-day trial with pharmacy packaging. Tax summaries are Available as Partial depth. Live FBR filing is Roadmap.',
  },

  'auto-parts-commerce': {
    heroEyebrow: 'Auto parts & accessories suite',
    audienceHeading: 'Trade counter shops to multi-branch parts retailers',
    audienceLead:
      'Vehicle-aware search and trade credit matter more than a generic fashion theme. Start with one counter; grow warehouses and wholesale without a second ERP.',
    audience: [
      {
        title: 'Neighborhood parts counters',
        body: 'Part-number and barcode POS, OEM-style catalog fields, and a parts-finder storefront buyers already understand.',
        fit: 'Best for single-door trade shops that still want an online finder.',
      },
      {
        title: 'Multi-branch wholesalers',
        body: 'Workshop price lists, multi-warehouse fulfilment, and raised suite limits when SKU count and terminals grow.',
        fit: 'Best when workshops buy on credit and stock lives in more than one location.',
      },
    ],
    problemHeading: 'Parts retail breaks when search and stock disagree',
    problemLead:
      'Workshops expect fitment answers at the counter. Web catalogs that ignore vehicle context and stock truth lose the trade desk.',
    painPoints: [
      {
        title: 'Fitment friction',
        body: 'Generic product grids force staff to translate make/model/year by hand while the customer waits.',
      },
      {
        title: 'Trade on chat',
        body: 'Workshop quotes and credit sit in WhatsApp, so receivables and stock never stay aligned.',
      },
      {
        title: 'SKU explosion',
        body: 'Thousands of interchangeable parts need warehouses and barcodes, not a boutique variant matrix alone.',
      },
      {
        title: 'Channel drift',
        body: 'Online orders pull stock the counter already sold because systems do not share one ledger.',
      },
      {
        title: 'Overclaimed accuracy',
        body: 'Marketing “99.8% stock accuracy” claims are unverifiable. TENVO shows honest Available/Partial module status instead.',
      },
      {
        title: 'Courier fantasy',
        body: 'Built-in TCS live APIs are not the pitch. Delivery challans and hub fulfilment ship; carrier APIs vary by integration roadmap.',
      },
    ],
    outcomesHeading: 'How parts desks grow with one hub',
    outcomesLead:
      'Faster fitment search, shared trade/online stock, and a path to wholesale pricing without invented fulfilment KPIs.',
    outcomes: [
      {
        metric: 'Parts finder',
        label: 'Vehicle-aware storefront',
        body: 'Immersive parts-finder hero and category rails wired to hub inventory, not a placeholder catalog.',
      },
      {
        metric: 'Trade POS',
        label: 'Counter throughput',
        body: 'Barcode and part-number lookup with thermal receipts and credit-aware customer records.',
      },
      {
        metric: '1 stock truth',
        label: 'Web and counter',
        body: 'Online orders and till sales decrement the same sellable stock picture.',
      },
      {
        metric: 'Wholesale desk',
        label: 'Workshop price lists',
        body: 'Supplier quotes and trade pricing without exporting the catalog to another ERP.',
      },
      {
        metric: 'Mobile ready',
        label: 'Staff on the floor',
        body: 'Hub mobile tiles and storefront mobile chrome for floor lookups without a second app.',
      },
      {
        metric: 'Suite scale',
        label: 'More SKUs, more tills',
        body: 'Raised product and terminal limits on recommended Business packaging as branches open.',
      },
    ],
    featureShowcaseHeading: 'Parts finder and counter proof',
    featureShowcaseLead: 'Live demo-autoparts imagery plus TENVO mobile/hub product screens.',
    featureShowcases: [
      {
        title: 'Parts-finder public store',
        importance: 'Buyer experience',
        body: 'Vehicle-aware hero search and OEM-style browsing on a branded storefront connected to real inventory UUIDs.',
        help: 'Open demo-autoparts before you register.',
        image: DEMO.autoparts || TENVO_IMG.autoPartsStore,
        imageAlt: 'Auto parts finder storefront',
        object: 'object-cover',
      },
      {
        title: 'Mobile parts browsing',
        importance: 'Floor productivity',
        body: 'Storefront and hub mobile experiences so staff can confirm fitment and stock without returning to a desktop only.',
        help: 'Camera barcode scan is Available on plan gate via shared PosCameraScanner.',
        image: TENVO_IMG.autoPartsMobile,
        imageAlt: 'Auto parts mobile storefront tab',
        object: 'object-contain',
      },
      {
        title: 'Inventory ecosystem',
        importance: 'Operations',
        body: 'Multi-warehouse capable inventory with Excel import and product images for dense SKU catalogs.',
        help: 'Inventory depth is labeled Partial where advanced warehouse workflows still expand.',
        image: TENVO_IMG.inventoryEcosystem,
        imageAlt: 'Inventory and POS ecosystem',
        object: 'object-contain',
      },
    ],
    channelsHeading: 'Parts counter, e-shop, and trade desk',
    channelsLead:
      'Auto parts retailers combine vehicle-aware search, trade counter sales, and wholesale supply, often across multiple branches and brands.',
    modulesHeading: 'Module mix tuned for parts retailers',
    modulesLead: 'Parts and channels are Available. Inventory depth stays Partial where multi-warehouse workflows continue to deepen.',
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
    audienceHeading: 'Single-brand dealers to multi-location showrooms',
    audienceLead:
      'Listings, test-drive booking, and parts e-shop belong in one dealership hub. Marketplace portal chrome stays a separate vertical.',
    audience: [
      {
        title: 'Single-brand dealerships',
        body: 'Vehicle listings with make/model/condition, booking CTAs, and owner-configured contact/UAN without a separate DMS for day-one selling.',
        fit: 'Best when you sell units and accessories from one brand roof.',
      },
      {
        title: 'Growing dealer groups',
        body: 'Raised limits, aftersales parts shop, lead nurture via campaigns (Partial/plan-gated), and showroom POS for accessories.',
        fit: 'Best when leads, listings, and parts should share customer history.',
      },
    ],
    problemHeading: 'Showrooms lose deals when listings and CRM disagree',
    problemLead:
      'Spreadsheet stock lists, Facebook leads, and a separate parts till mean sold cars stay “available” and accessories never attach to the buyer.',
    painPoints: [
      {
        title: 'Listing drift',
        body: 'Cars sold off the floor still appear online because the website is not the inventory system.',
      },
      {
        title: 'Lead black holes',
        body: 'Test-drive requests land in email while salespeople chase WhatsApp without a shared queue.',
      },
      {
        title: 'Parts orphaned',
        body: 'Accessories and car care sell on a different till than the vehicle CRM, so lifetime value is invisible.',
      },
      {
        title: 'Wrong automotive mode',
        body: 'Portal marketplace features or live COE tickers do not belong on a single-brand dealership storefront.',
      },
      {
        title: 'DMS sticker shock',
        body: 'Enterprise dealer stacks are heavy for dealers who need listings + booking + parts first.',
      },
      {
        title: 'Growth tools later',
        body: 'Campaigns should attach after operations work, not force a second marketing cloud on day one.',
      },
    ],
    outcomesHeading: 'How dealerships grow on one showroom hub',
    outcomesLead:
      'Honest outcomes: listings tied to inventory, booking CTAs on the storefront, and an accessories path that shares customers.',
    outcomes: [
      {
        metric: 'Listings',
        label: 'Inventory-backed vehicles',
        body: 'Vehicles live as products with domain fields (make, model, condition, fuel) so the public list reflects hub truth.',
      },
      {
        metric: 'Bookings',
        label: 'Test drives & leads',
        body: 'Appointment and contact flows capture interest with owner Store Settings contacts, not a bolted CRM.',
      },
      {
        metric: 'Parts shop',
        label: 'Aftersales revenue',
        body: 'Accessories and care products sell online and at POS against the same customer records.',
      },
      {
        metric: 'Isolated vertical',
        label: 'Dealership, not portal',
        body: 'vehicle-dealership stays separate from auto-marketplace and auto-parts finder templates.',
      },
      {
        metric: 'Brand control',
        label: 'Owner storefront settings',
        body: 'Hero, contact, and booking meeting URL stay configurable without code forks.',
      },
      {
        metric: 'Suite path',
        label: 'Scale seats & terminals',
        body: 'Business-tier packaging raises limits when a second showroom or more sales seats appear.',
      },
    ],
    featureShowcaseHeading: 'Showroom and hub proof',
    featureShowcaseLead: 'Demo showroom imagery plus TENVO hub screens for the owner morning view.',
    featureShowcases: [
      {
        title: 'Digital showroom storefront',
        importance: 'Buyer experience',
        body: 'Vehicle-forward hero and listings for single-brand dealerships. Buy/sell CTAs route to booking and contact with owner info.',
        help: 'Open demo-showroom to preview the public experience.',
        image: DEMO.showroom,
        imageAlt: 'Vehicle dealership showroom demo',
        object: 'object-cover',
      },
      {
        title: 'Owner command center',
        importance: 'Sales ops',
        body: 'Advanced hub dashboards keep pipeline-adjacent KPIs and inventory visible without exporting to a separate DMS BI tool on day one.',
        help: 'Campaigns and AI analyst remain Partial / plan-gated on the growth strip.',
        image: TENVO_IMG.advancedDashboard,
        imageAlt: 'TENVO Advanced hub dashboard',
        object: 'object-contain',
      },
      {
        title: 'One TENVO hub',
        importance: 'Team productivity',
        body: 'Desktop and mobile hub so floor staff and managers share listings, customers, and orders.',
        help: 'Register with vehicle-showroom packaging so dealership presets land correctly.',
        image: TENVO_IMG.oneTenvoHub,
        imageAlt: 'TENVO hub devices',
        object: 'object-contain',
      },
    ],
    channelsHeading: 'Showroom, listings, and aftersales shop',
    channelsLead:
      'Dealerships list vehicles online, book test drives, sell parts and accessories, and run showroom POS without a separate CRM and DMS stack.',
    modulesHeading: 'Module mix tuned for vehicle dealerships',
    modulesLead: 'Showroom and channels are Available. Growth and deeper operations stay Partial where plan gates apply.',
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
    audienceHeading: 'Showroom retailers to multi-warehouse home brands',
    audienceLead:
      'Large-ticket furniture needs delivery challans and stock reservations more than flashy unverified “360° AR” claims.',
    audience: [
      {
        title: 'Single showroom home retailers',
        body: 'Elevated catalog, deposits/quotes at POS, and delivery thresholds for bulky goods on a branded storefront.',
        fit: 'Best when collections and delivery coordination matter more than installment banking.',
      },
      {
        title: 'Growing furniture brands',
        body: 'Multi-warehouse fulfilment, reservations for made-to-order lines, and suite limits for more SKUs and seats.',
        fit: 'Assembly scheduling remains Roadmap. Delivery challans and reservations ship as labeled.',
      },
    ],
    problemHeading: 'Furniture sales stall when delivery and stock are guesswork',
    problemLead:
      'High-ticket orders fail when the website promises a sofa the warehouse already reserved, or delivery notes live in a notebook.',
    painPoints: [
      {
        title: 'Bulky delivery chaos',
        body: 'Without challans and thresholds, online checkout underprices or overpromises delivery.',
      },
      {
        title: 'Custom order risk',
        body: 'Made-to-order lines need reservations so the showroom does not double-sell the same unit.',
      },
      {
        title: 'Showroom vs web drift',
        body: 'Floor samples and web photos diverge when catalogs are not the inventory system.',
      },
      {
        title: 'Installment overclaim',
        body: 'Built-in consumer financing is not the suite pitch. Deposits and invoices ship; bank installment products are partner-specific.',
      },
      {
        title: 'Assembly scheduling',
        body: 'Field crew calendars are Roadmap. Do not buy this suite expecting a full field-service module today.',
      },
      {
        title: 'Tool sprawl',
        body: 'Website builder + WhatsApp orders + Excel stock means owners never trust available-to-promise.',
      },
    ],
    outcomesHeading: 'How furniture retailers grow cleanly',
    outcomesLead:
      'One catalog for showroom and web, delivery-aware checkout, and honest Roadmap labels for assembly scheduling.',
    outcomes: [
      {
        metric: 'Elevated shop',
        label: 'Collection-led browsing',
        body: 'Furniture storefront with room-inspired rails and inventory-backed category tiles.',
      },
      {
        metric: 'Showroom POS',
        label: 'Quotes and deposits',
        body: 'In-store selling on the same stock picture as the web catalog.',
      },
      {
        metric: 'Delivery',
        label: 'Challans & thresholds',
        body: 'Delivery coordination modules for bulky goods without inventing driver-fleet telemetry.',
      },
      {
        metric: 'Reservations',
        label: 'Protect custom lines',
        body: 'Stock reservations reduce double-selling on made-to-order paths.',
      },
      {
        metric: 'Owner video',
        label: 'Hero you control',
        body: 'Optional looping hero video from Store Settings when you want cinematic collection storytelling.',
      },
      {
        metric: 'Suite limits',
        label: 'Scale catalog depth',
        body: 'Raised product and warehouse limits as collections and locations expand.',
      },
    ],
    featureShowcaseHeading: 'Furniture storefront and hub proof',
    featureShowcaseLead: 'Demo furniture imagery plus inventory/hub product screens.',
    featureShowcases: [
      {
        title: 'Elevated furniture storefront',
        importance: 'Buyer experience',
        body: 'Collection-led public shop with delivery-aware commerce chrome.',
        help: 'Open demo-furniture to preview Discover and shop rails.',
        image: DEMO.furniture,
        imageAlt: 'Furniture elevated storefront demo',
        object: 'object-cover',
      },
      {
        title: 'Inventory for large-ticket catalogs',
        importance: 'Operations',
        body: 'Hub inventory with imagery and Excel import so collections stay sellable and countable.',
        help: 'Assembly crew scheduling stays Roadmap in FAQ and capability map.',
        image: TENVO_IMG.inventoryEcosystem,
        imageAlt: 'Inventory ecosystem',
        object: 'object-contain',
      },
      {
        title: 'Retail owner dashboard',
        importance: 'Owner priority',
        body: 'Easy Mode keeps sales and stock glanceable for showroom managers who need speed over finance depth every morning.',
        help: 'Finance statements and GL remain Available on higher tiers when you need formal books.',
        image: TENVO_IMG.retailDashboard,
        imageAlt: 'Retail Simple dashboard',
        object: 'object-contain',
      },
    ],
    channelsHeading: 'Showroom, delivery, and large-ticket online',
    channelsLead:
      'Furniture retailers sell high-ticket collections online and in showroom, coordinate delivery challans, and reserve stock for custom orders.',
    modulesHeading: 'Module mix tuned for furniture & home',
    modulesLead: 'Furniture, channels, and delivery are Available. Growth is Partial. Assembly scheduling is Roadmap.',
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
    audienceHeading: 'Boutique gyms to multi-location fitness brands',
    audienceLead:
      'Sell supplements online, memberships at the desk, and coaching bookings without forcing turnstile hardware you do not own yet.',
    audience: [
      {
        title: 'Single-location gyms',
        body: 'Elevated supplement store, front-desk POS, membership SKUs, and tenant meeting URLs for PT consults.',
        fit: 'Best when retail + memberships matter more than biometric access control.',
      },
      {
        title: 'Growing fitness groups',
        body: 'Raised limits, loyalty/campaigns path (Partial), and shared customers across shop and desk. Turnstile/biometric access stays Roadmap.',
        fit: 'Best when you want one hub before buying a separate gym OS and Shopify stack.',
      },
    ],
    problemHeading: 'Gyms bleed margin across three disconnected tools',
    problemLead:
      'Supplement Shopify, membership spreadsheet, and PT Calendly never share stock or renewals. Marketing that promises biometric access today sets the wrong expectation.',
    painPoints: [
      {
        title: 'Shop vs desk drift',
        body: 'Online whey sales and counter memberships disagree on customers and inventory.',
      },
      {
        title: 'Membership chaos',
        body: 'Plans live in Excel while renewals and storefront pricing drift from POS reality.',
      },
      {
        title: 'PT booking orphan',
        body: 'Coaches use a personal calendar that never writes back to the gym CRM.',
      },
      {
        title: 'Access control overclaim',
        body: 'Turnstile and biometric gates are Roadmap. Do not buy expecting hardware integrations today.',
      },
      {
        title: 'Bookable misuse',
        body: 'Classes and PT are not Add-to-Cart retail SKUs. Shop catalog stays supplements and gear only.',
      },
      {
        title: 'Analytics fog',
        body: 'Without one ledger, owners cannot see which channel funds rent.',
      },
    ],
    outcomesHeading: 'How fitness brands grow with one hub',
    outcomesLead:
      'Retail shop, memberships, and coaching intake share customers. Honest Roadmap labels for access hardware.',
    outcomes: [
      {
        metric: 'Shop catalog',
        label: 'Supplements & gear',
        body: 'Fitness storefront sells physical retail SKUs. Memberships and PT stay on booking sections, not cart abuse.',
      },
      {
        metric: 'Front desk',
        label: 'POS + memberships',
        body: 'Sell plans, packs, and counter products with barcode and thermal receipts.',
      },
      {
        metric: 'Coaching',
        label: 'Tenant meeting URLs',
        body: 'Owner-configured booking links for PT and nutrition (not platform Calendly forced on tenants).',
      },
      {
        metric: 'Memberships',
        label: 'Plans from inventory',
        body: 'Membership SKUs sync into enrollments and member pricing on supported tiers.',
      },
      {
        metric: 'Growth later',
        label: 'CRM & campaigns',
        body: 'Loyalty and outreach attach when operations stabilize. Depth is Partial / plan-gated.',
      },
      {
        metric: 'Suite scale',
        label: 'More seats & SKUs',
        body: 'Raised limits on Business packaging as locations and product depth grow.',
      },
    ],
    featureShowcaseHeading: 'Fitness storefront and hub proof',
    featureShowcaseLead: 'Demo fitness imagery plus TENVO product screens. Access control remains Roadmap.',
    featureShowcases: [
      {
        title: 'Elevated fitness storefront',
        importance: 'Buyer experience',
        body: 'Dark fitness hero, supplement rails, membership tiers, and coach profiles on a branded public store.',
        help: 'Open demo-fitness. Cart is for retail products only.',
        image: DEMO.fitness || TENVO_IMG.fitnessStore,
        imageAlt: 'Gym and fitness elevated storefront',
        object: 'object-cover',
      },
      {
        title: 'Mobile hub for floor staff',
        importance: 'Desk productivity',
        body: 'Phone-friendly hub tiles so front desk can move between POS, customers, and stock without a desktop only.',
        help: 'Camera scan available on plan gate via shared PosCameraScanner.',
        image: TENVO_IMG.mobilePos,
        imageAlt: 'TENVO mobile POS grid',
        object: 'object-contain',
      },
      {
        title: 'Owner metrics at a glance',
        importance: 'Owner priority',
        body: 'Retail Simple and Advanced dashboards keep revenue and stock visible across shop and desk channels.',
        help: 'AI analyst remains Partial / API-gated on higher tiers.',
        image: TENVO_IMG.retailDashboard,
        imageAlt: 'Retail Simple dashboard',
        object: 'object-contain',
      },
    ],
    channelsHeading: 'Supplements, memberships, and coached training',
    channelsLead:
      'Modern gyms run a branded supplement shop, front-desk membership sales, and personal training booked online, often with separate tools for each channel.',
    modulesHeading: 'Module mix tuned for gym & fitness operators',
    modulesLead:
      'Storefront, channels, and coaching intake are Available. Growth is Partial. Turnstile / biometric access is Roadmap.',
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
    audienceHeading: 'Neighborhood doodh shops to multi-route milk retailers',
    audienceLead:
      'Start with one kg counter and a morning route book. Grow houses and online orders without restaurant, warehouse-chain, or gym modules in the way.',
    audience: [
      {
        title: 'Single-counter milk shops',
        body: 'Weight-aware POS, Route Hisab day sheet, FEFO chill awareness, and bilingual collection bills on Professional packaging.',
        fit: 'Best when paper registers and weekly credit fights are the daily pain.',
      },
      {
        title: 'Growing dairy retailers',
        body: 'More houses on routes, online milk store orders, offline-ready counter and Route Hisab Phase 1 when the line drops.',
        fit: 'Best when you need lean milk OS, not a generic multi-vertical ERP.',
      },
    ],
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

  'water-commerce': {
    heroEyebrow: 'Water delivery operating system',
    heroLead:
      'City and area rider routes, 19L refill and pack SKUs, domestic and corporate accounts, and week or month credit collect. Built for Pakistani water suppliers, not generic ERP clutter.',
    heroAccent: '#0ea5e9',
    audienceHeading: 'Neighborhood refill plants to multi-city water suppliers',
    audienceLead:
      'Start with Karachi area routes and corporate offices. Grow cities without restaurant, warehouse-chain, or gym modules in the way.',
    audience: [
      {
        title: 'Local water plants and refill shops',
        body: 'Daily Route sheet, bottle deposits, city/area customer book, and SuperStore POS on Professional packaging.',
        fit: 'Best when paper route books and weekday schedules are the daily pain.',
      },
      {
        title: 'Growing water distributors',
        body: 'More riders and cities, domestic plus corporate cadence, and standard AR invoices for weekly or monthly collect.',
        fit: 'Best when you need lean water OS, not a generic multi-vertical ERP.',
      },
    ],
    channelsHeading: 'How water suppliers actually make money',
    channelsLead:
      'Counter pickup, daily rider routes, and corporate accounts. Same stock, same customers, same AR.',
    modulesHeading: 'Module mix tuned for water delivery operators',
    modulesLead:
      'Only the capabilities a bottled water business needs. Honest Available labels match what ships in the hub today.',
    highlightFeatures: WATER_COMMERCE_HIGHLIGHTS,
    problemHeading: 'Spreadsheets and generic ERPs slow water suppliers down',
    problemLead:
      'Operators lose hours reconciling rider sheets, deposits, and weekly credit across neighborhoods.',
    painPoints: [
      {
        title: 'Areas and days get mixed up',
        body: 'DHA, Gulshan, and corporate offices on different weekdays are hard to track on paper.',
      },
      {
        title: 'Deposits and empties drift',
        body: 'Empty bottle deposits and 19L returns are not tied to the same customer ledger as deliveries.',
      },
      {
        title: 'Wrong software chrome',
        body: 'Generic plans surface restaurant POS, multi-warehouse, and memberships suppliers never use.',
      },
    ],
    outcomesHeading: 'What changes in the first week',
    outcomes: [
      {
        label: 'Clear morning routes',
        body: 'Daily Route shows only houses and offices due that weekday, by city and area.',
      },
      {
        label: 'Faster collect',
        body: 'Week or month totals become invoices with thermal bills and WhatsApp reminders.',
      },
      {
        label: 'Staff learn one OS',
        body: 'Restaurant and warehouse chrome stay off. Quick Entry opens Water Route, POS, and customers.',
      },
    ],
    guideHeading: 'Run water delivery in three steps',
    guideLead:
      'Understand city/area routes and Daily Route, then register with Professional packaging and water-delivery presets.',
    guideSteps: [
      {
        title: 'Know the daily OS',
        body: 'Customers by city and area, Daily Route for riders, bottle/case stock, and week/month credit on standard invoices.',
      },
      {
        title: 'Register the suite',
        body: 'Start trial with water-commerce packaging. Hub lands on water-delivery with lean chrome.',
        href: '/register?package=water-commerce&domain=water-delivery&plan=professional',
        cta: 'Start Water Delivery suite',
      },
    ],
    channelPillars: [
      {
        icon: 'MapPin',
        title: 'City and area book',
        body: 'Pakistan city → neighborhood presets (Karachi DHA, Clifton, Gulshan…), domestic vs corporate, delivery days.',
        accent: 'border-sky-200/80 bg-gradient-to-br from-sky-50/70 to-white',
        iconClass: 'bg-sky-600 text-white',
        slideAccent: '#0ea5e9',
      },
      {
        icon: 'ClipboardList',
        title: 'Daily Route',
        body: 'Rider doorstep grid filtered by weekday cadence. Save day once so week and month bills stay honest.',
        accent: 'border-cyan-200/80 bg-gradient-to-br from-cyan-50/70 to-white',
        iconClass: 'bg-cyan-600 text-white',
        slideAccent: '#0891b2',
      },
      {
        icon: 'Droplets',
        title: 'Bottles and deposits',
        body: '19L refill, family packs, PET cases, and empty bottle deposit tracking with PK brands.',
        accent: 'border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-white',
        iconClass: 'bg-blue-600 text-white',
        slideAccent: '#2563eb',
      },
    ],
    verticalPresets: [
      {
        key: 'water-delivery',
        label: 'Water delivery',
        desc: 'Rider routes, 19L refill, domestic and corporate',
      },
    ],
    faqTitle: 'Water delivery commerce suite FAQ',
    ctaTitle: 'Run your water supply on one clear hub',
    ctaSubtitle:
      '14-day trial on Professional modules with water-delivery presets, Daily Route, and lean packaging.',
  },
};

/**
 * @param {string} slug
 */
export function getDomainPackageSolutionsContent(slug) {
  return DOMAIN_PACKAGE_SOLUTIONS_CONTENT[slug] || null;
}
