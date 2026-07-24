/**
 * Archive-backed media and defaults for Tenvo Marine (marine-parts).
 * Taxonomy and imagery from ships-parts.html / DWG Trading homepage.
 */

const CDN = 'https://c11cbcde.delivery.rocketcdn.me/wp-content/uploads';

export const MARINE_HERO_VIDEO_URL =
  'https://www.wartsila.com/videos/default-source/home/home-page-hero-video.mp4';

export const MARINE_HERO_POSTER = `${CDN}/2025/03/Home-topfoto-dwg-trading.jpg`;

export const MARINE_ACCENT = '#002d54';
export const MARINE_ACCENT_DARK = '#001a33';
export const MARINE_ACCENT_LIGHT = '#e8f1f8';
export const MARINE_TEAL = '#0d9488';

export const MARINE_DEFAULT_SLIDES = [
  {
    eyebrow: 'Marine propulsion',
    title: 'Shaping reliable power at sea',
    subtitle: 'New and used thrusters, rudder propellers, seals, and lifecycle spare parts.',
    image: MARINE_HERO_POSTER,
    ctaLabel: 'Browse catalogue',
    ctaHrefSuffix: '',
    accent: MARINE_ACCENT,
  },
];

export const MARINE_EXPERTISE_CARDS = [
  {
    id: 'new-systems',
    title: 'New Systems',
    subtitle: 'Hydraulic and mechanical thrusters, ready for install.',
    hrefSuffix: '?category=new-systems',
    image: `${CDN}/2025/08/New-systems-home.jpg`,
  },
  {
    id: 'used-systems',
    title: 'Used Systems',
    subtitle: 'Inspected used rudder propellers and jet systems.',
    hrefSuffix: '?category=used-systems',
    image: `${CDN}/2025/03/Used-systems_11zon.jpg`,
  },
  {
    id: 'spare-parts',
    title: 'Spare Parts',
    subtitle: 'OEM and interchange parts for propulsion fleets.',
    hrefSuffix: '?category=spare-parts',
    image: `${CDN}/2026/02/Spare-Parts.jpg`,
  },
  {
    id: 'repair-service',
    title: 'Repair Service',
    subtitle: 'Workshop repair, retrofit, and seal overhauls.',
    hrefSuffix: '?category=repair-service',
    image: `${CDN}/2026/02/Repair-service.jpg`,
  },
];

/**
 * Premium dual sector overview (Wärtsilä-style) — shown before expertise cards.
 * icon: lucide key — ship | wrench | package | anchor | zap
 */
export const MARINE_SECTOR_CARDS = [
  {
    id: 'propulsion',
    icon: 'ship',
    title: 'Propulsion systems',
    body:
      'New and inspected used thrusters, rudder propellers, and azimuth drives for workboats, tugs, and deep-sea fleets — with OEM fitment and lead-time clarity.',
    ctaLabel: 'Explore systems',
    href: '/products?category=new-systems',
    image: `${CDN}/2025/08/New-systems-home.jpg`,
  },
  {
    id: 'lifecycle',
    icon: 'wrench',
    title: 'Parts & lifecycle service',
    body:
      'Sterntube seals, spare kits, and workshop repair support so vessels stay competitive between dockings — quoted from part number, OEM, or equipment type.',
    ctaLabel: 'Browse parts & service',
    href: '/products?category=spare-parts',
    image: `${CDN}/2026/02/Spare-Parts.jpg`,
  },
];

export const MARINE_EQUIPMENT_CATEGORIES = [
  {
    id: 'hydraulic-retractable',
    label: 'Hydraulic retractable rudder propellers',
    equipmentType: 'Hydraulic retractable rudder propeller',
    image: `${CDN}/2025/10/Hydraulic-retractable-rudder-propellers-1.png`,
  },
  {
    id: 'well-mounted',
    label: 'Hydraulic well-mounted rudder propellers',
    equipmentType: 'Well-mounted rudder propeller',
    image: `${CDN}/2025/10/Hydraulic-well-mounted-rudder-propellers-1.png`,
  },
  {
    id: 'hydraulic-crane',
    label: 'Hydraulic cranes',
    equipmentType: 'Hydraulic crane',
    image: `${CDN}/2025/10/Hydraulic-Cranes.png`,
  },
  {
    id: 'tunnel-thruster',
    label: 'Hydraulic tunnel thrusters',
    equipmentType: 'Tunnel thruster',
    image: `${CDN}/2025/10/Hydraulic-tunnel-thruster-electric-kleiner.png`,
  },
  {
    id: 'em-tunnel',
    label: 'Electric / mechanical tunnel thrusters',
    equipmentType: 'Tunnel thruster',
    image: `${CDN}/2025/10/Electric-Mechanical-Tunnel-Thrusters.png`,
  },
  {
    id: 'azimuth',
    label: 'L-drive / Z-drive azimuth',
    equipmentType: 'Azimuth L/Z-drive',
    image: `${CDN}/2025/10/L-Drive-and-Z-Drive-azimuth-deckmounted-navigators.png`,
  },
  {
    id: 'used-rudder',
    label: 'Used rudder propellers',
    equipmentType: 'Hydraulic retractable rudder propeller',
    hrefSuffix: '?systemCondition=used',
    image: `${CDN}/2025/10/Used-Rudder-Proppelers.png`,
  },
  {
    id: 'pump-jet',
    label: 'Used pump-jets & waterjets',
    equipmentType: 'Pump-jet / waterjet',
    image: `${CDN}/2025/10/Used-Pump-jets-waterjets.png`,
  },
  {
    id: 'spare-rudder',
    label: 'Spare parts for rudder propellers',
    equipmentType: 'Other',
    hrefSuffix: '?category=Spare%20Parts',
    image: `${CDN}/2025/10/Spare-partes-rudder-propppelers.png`,
  },
  {
    id: 'sterntube',
    label: 'Sterntube, compact & shaft seals',
    equipmentType: 'Sterntube / shaft seal',
    image: `${CDN}/2025/10/Sterntube-Compact-and-Shaft-Seals.png`,
  },
];

export const MARINE_KPI_DEFAULTS = [
  { value: '45+', label: 'Years of propulsion expertise' },
  { value: '10', label: 'Core equipment families' },
  { value: '24/7', label: 'RFQ and parts enquiry desk' },
  { value: 'NL', label: 'European maritime logistics hub' },
];

export const MARINE_INSIGHTS = [
  {
    id: 'seals-lifecycle',
    tag: 'Technical note',
    title: 'Sterntube seals: when to overhaul before dry-dock',
    excerpt: 'How seal wear, leakage, and shaft condition drive spare-part stocking for mid-size fleets.',
    hrefSuffix: '/contact?subject=other',
  },
  {
    id: 'thruster-retrofit',
    tag: 'Case focus',
    title: 'Tunnel thruster retrofit without full system replacement',
    excerpt: 'Matching OEM numbers and interchange codes to keep vessels sailing on schedule.',
    hrefSuffix: '/contact?subject=other',
  },
  {
    id: 'new-vs-used',
    tag: 'Buying guide',
    title: 'New vs used rudder propellers: risk, lead time, and ROI',
    excerpt: 'A practical framework for operators choosing between new systems and inspected used units.',
    hrefSuffix: '/products?systemCondition=used',
  },
];

export const MARINE_TRUST_DEFAULTS = {
  title: 'Lifecycle partner for marine maneuvering',
  subtitle: 'Part-number accuracy, equipment fitment, and workshop support for workboats to tankers.',
  stats: MARINE_KPI_DEFAULTS,
};

export const MARINE_CTA_DEFAULTS = {
  title: 'Thruster spare parts',
  subtitle: 'For your vessels Bow, Stern and Azimuth thrusters.',
  label: 'Receive Quotation',
};

/** Hero dock / homepage quick links (owner-overridable). */
export const MARINE_DEFAULT_QUICK_LINKS = [
  { id: 'new', label: 'New systems', href: '/products?systemCondition=new' },
  { id: 'used', label: 'Used systems', href: '/products?systemCondition=used' },
  { id: 'spare', label: 'Spare parts', href: '/products?category=spare-parts' },
  { id: 'rfq', label: 'RFQ', href: '/contact?subject=quotation' },
];

/** Optional brand / OEM chips under the hero dock. */
export const MARINE_DEFAULT_BRAND_CHIPS = [
  { id: 'schottel', label: 'Schottel', href: '/products?search=Schottel' },
  { id: 'wartsila', label: 'Wärtsilä', href: '/products?search=Wartsila' },
  { id: 'veth', label: 'Veth', href: '/products?search=Veth' },
  { id: 'zf', label: 'ZF', href: '/products?search=ZF' },
  { id: 'kawasaki', label: 'Kawasaki', href: '/products?search=Kawasaki' },
];

export const MARINE_ABOUT_IMAGE = `${CDN}/2025/07/DWG-Trading-specialist-in-rudder-propellers-foto.jpg`;
export const MARINE_SERVICE_IMAGE = `${CDN}/2025/05/Exceptional-service-foto_11zon.jpg`;
/** Fallback when Stay Ahead primary image fails to load. */
export const MARINE_STAY_AHEAD_FALLBACK = `${CDN}/2025/03/Home-topfoto-dwg-trading.jpg`;

export const MARINE_INSIGHT_IMAGES = {
  'seals-lifecycle': `${CDN}/2025/10/Sterntube-Compact-and-Shaft-Seals.png`,
  'thruster-retrofit': `${CDN}/2025/10/Hydraulic-tunnel-thruster-electric-kleiner.png`,
  'new-vs-used': `${CDN}/2025/10/Used-Rudder-Proppelers.png`,
};
