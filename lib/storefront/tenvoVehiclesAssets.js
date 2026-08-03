/**
 * Reference imagery for the Tenvo Vehicles showroom template.
 * Marketing heroes and vehicle tiles use Unsplash — Sehgal CDN hotlink-blocks
 * requests with a tenvo.store Referer (HTTP 403), which blanked marketing cards.
 * Accessory/product files may still use the archive CDN with referrerPolicy=no-referrer.
 */
import { buildUnsplashImageUrl } from './unsplashUrl.js';

const CDN_HOST = 'https://sehgalmotorsports.pk/cdn/shop/files';

/** @param {string} photoId @param {number} [w] */
function u(photoId, w = 1200) {
  return buildUnsplashImageUrl(photoId, { w, q: 85 });
}

/**
 * @param {string} file
 * @param {{ width?: number; v?: string | number; height?: number }} [opts]
 */
export function tenvoVehiclesCdn(file, opts = {}) {
  const { width = 1200, v, height } = opts;
  const params = new URLSearchParams();
  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  if (v != null) params.set('v', String(v));
  const qs = params.toString();
  return `${CDN_HOST}/${file}${qs ? `?${qs}` : ''}`;
}

/** Default SEO + branding for vehicle-dealership storefronts. */
export const TENVO_VEHICLES_METADATA = {
  titleSuffix: 'Cars, Parts & Accessories',
  description:
    'Buy new and used cars, auto parts, car care, PPF, conversions, and accessories. Book test drives, showroom visits, and trade-in valuations online.',
  keywords:
    'car dealership, used cars, new cars, auto parts, car care, PPF, vehicle showroom, test drive, trade in',
};

export const TENVO_VEHICLES_ASSETS = {
  logo: '/storefront/tenvo-car-dealership-tcd.svg',
  // Distinct from marketplace hero (photo-1492144534655)
  ogImage: u('1503376780353-7e6692767b70', 1200),
  favicon: '/storefront/tenvo-car-dealership-tcd.svg',
  hero: {
    accessories: u('1618843479313-40f8afb4b4d8', 1920),
    carCare: u('1486262715619-67b85e0b08d3', 1920),
    modifications: u('1552519507-da3b142c6e3d', 1920),
    vehicles: u('1503376780353-7e6692767b70', 1920),
  },
  collections: {
    usedCars: u('1544636331-e26879cd4d9b', 1200),
    autoStore: u('1486262715619-67b85e0b08d3', 1200),
    ppf: u('1618843479313-40f8afb4b4d8', 1200),
    conversions: u('1555215695-3004980ad54e', 1200),
    carCare: u('1593941707882-a5bba14938c7', 1200),
  },
  vehicles: {
    hiluxRevo: u('1533473359331-0135ef1b58bf', 1200),
    swiftGlx: u('1549317661-bd32c8ce0db2', 1200),
    corollaAltis: u('1606664515524-ed2f786a0bd6', 1200),
    peugeot2008: u('1544636331-e26879cd4d9b', 1200),
    fortuner: u('1552519507-da3b142c6e3d', 1200),
    hondaCity: u('1492144534655-ae79c964c9d7', 1200),
    sportage: u('1555215695-3004980ad54e', 1200),
    havalH6: u('1560958089-b8a1929cea89', 1200),
    bmw520: u('1555215695-3004980ad54e', 1200),
    teslaM3: u('1560958089-b8a1929cea89', 1200),
    bikeYamaha: u('1558981806-ec527fa84c39', 800),
    bikeScooter: u('1571068316344-75bc76f77890', 800),
  },
  products: {
    airFreshener: tenvoVehiclesCdn('5_f7d972a5-2895-4b9e-819c-b1db31d9f3f8.jpg', { width: 800, v: '1744383907' }),
    hornA056: tenvoVehiclesCdn('A056_71a20b66-fd6e-412f-8943-ecb39b2dd62f.jpg', { width: 800 }),
    hornMr80002: tenvoVehiclesCdn('80002.jpg', { width: 800 }),
    bonnetSpotlight: tenvoVehiclesCdn('1_9a146b91-ffb7-4602-b238-d4cc82ef56b2.jpg', { width: 800, v: '1744383907' }),
    ashtrayLed: tenvoVehiclesCdn('0_6.jpg', { width: 800 }),
    corollaHeadlight: tenvoVehiclesCdn('ToyotaCorollaHeadLight_ProNikeStyle_Model2012-2013_170ade64-2709-4b0b-bf56-1055e44febac.png', { width: 800 }),
    pioneerBass: tenvoVehiclesCdn('PioneerBassTubeTS-WX306T.png', { width: 800 }),
    pioneerCamera: tenvoVehiclesCdn('PioneerUniversalBackCamera.png', { width: 800 }),
    cityTailLight: tenvoVehiclesCdn('a76becc297f9268e9ba8466b896aab4e.jpg', { width: 800 }),
    ledPod: tenvoVehiclesCdn('1_6160883b-8e69-4c2b-a744-45bf1945026d.png', { width: 800 }),
    carCare: tenvoVehiclesCdn('Car_Care_Products_2.png', { width: 800 }),
    carShampoo: tenvoVehiclesCdn('SONAX_PROFILINE_Plastic_Protectant_Exterior_1Ltr.png', { width: 800 }),
    microfiber: tenvoVehiclesCdn('Rust_Stain_Remover.png', { width: 800 }),
    androidPanel: tenvoVehiclesCdn('4_45b03f81-cb9f-4f95-85ea-0570f5d724ee.png', { width: 800 }),
    floorMats: tenvoVehiclesCdn('5_039c62e2-bac8-4308-bfdd-8a1fc20ab8e1.png', { width: 800 }),
    dashCam: tenvoVehiclesCdn('7_9779681a-6f30-40ba-9081-7207e73f1b5d.png', { width: 800 }),
    ppfRed: tenvoVehiclesCdn('c054da3b-8edb-4694-9a4c-6c4f07357c6b.jpg', { width: 800 }),
    ppfGrey: tenvoVehiclesCdn('unnamed_3.png', { width: 800 }),
    ppfClear: tenvoVehiclesCdn('492600ea-143a-4e3a-ad77-da56ae0a9604.jpg', { width: 800 }),
    conversionRevo: tenvoVehiclesCdn('Toyota_Hilux_Revo_Head_Light_CHROME_UPGRADE_to_Model_2022_KX-B-170-C.png', { width: 800 }),
    conversionPrado: tenvoVehiclesCdn('tunerchaska2.jpg', { width: 800 }),
    conversionFortuner: tenvoVehiclesCdn('7b475b02-8f20-4359-9914-619802f0f52f_1782313450_KZBtfVXOt4.jpg', { width: 800 }),
    conversionMaybach: tenvoVehiclesCdn('374c5bf2-6b5a-487d-b745-d8087343dc4c.jpg', { width: 800 }),
    windowFilm: tenvoVehiclesCdn('resized_banner.jpg', { width: 800, v: '1721029107' }),
    bodyKit: tenvoVehiclesCdn('2023-12-19.jpg', { width: 800, v: '1716554862' }),
    chromeHandles: tenvoVehiclesCdn('SkullTyreAirValveNozzleCaps-Multi-Pair_cf41ca66-e79a-4144-a9cd-dfd1cd2df176.png', { width: 800 }),
  },
  brands: {
    toyota: tenvoVehiclesCdn('Toyota.svg', { width: 120 }),
    honda: tenvoVehiclesCdn('Honda.svg', { width: 120 }),
    suzuki: tenvoVehiclesCdn('Suzuki.svg', { width: 120 }),
    hyundai: tenvoVehiclesCdn('Hyundai.svg', { width: 120 }),
    kia: tenvoVehiclesCdn('Kia.svg', { width: 120 }),
    bmw: tenvoVehiclesCdn('BMW.svg', { width: 120 }),
    mercedes: tenvoVehiclesCdn('Mercedes.svg', { width: 120 }),
    audi: tenvoVehiclesCdn('Audi.svg', { width: 120 }),
    tesla: tenvoVehiclesCdn('Tesla.svg', { width: 120 }),
    haval: tenvoVehiclesCdn('Haval.svg', { width: 120 }),
    peugeot: tenvoVehiclesCdn('Peugeot.svg', { width: 120 }),
    ford: tenvoVehiclesCdn('Ford.svg', { width: 120 }),
    mg: tenvoVehiclesCdn('MG.svg', { width: 120 }),
    changan: tenvoVehiclesCdn('Changan.svg', { width: 120 }),
    lexus: tenvoVehiclesCdn('Mercedes.svg', { width: 120 }),
    'land-rover': tenvoVehiclesCdn('Land_Rover.svg', { width: 120 }),
  },
};

/** @type {Record<string, string>} */
const SKU_IMAGE_MAP = {
  'TYT-HILUX-REVO-2021': TENVO_VEHICLES_ASSETS.vehicles.hiluxRevo,
  'SUZ-SWIFT-GLX-2025': TENVO_VEHICLES_ASSETS.vehicles.swiftGlx,
  'TYT-ALTIS-2020': TENVO_VEHICLES_ASSETS.vehicles.corollaAltis,
  'PEU-2008-2023': TENVO_VEHICLES_ASSETS.vehicles.peugeot2008,
  'TYT-FORT-LEG-2022': TENVO_VEHICLES_ASSETS.vehicles.fortuner,
  'HND-CITY-2024': TENVO_VEHICLES_ASSETS.vehicles.hondaCity,
  'KIA-SPORT-2023': TENVO_VEHICLES_ASSETS.vehicles.sportage,
  'HVL-H6-HEV-2024': TENVO_VEHICLES_ASSETS.vehicles.havalH6,
  'BMW-520I-2019': TENVO_VEHICLES_ASSETS.vehicles.bmw520,
  'TSL-M3-2022': TENVO_VEHICLES_ASSETS.vehicles.teslaM3,
  'YBR-125G': TENVO_VEHICLES_ASSETS.vehicles.bikeYamaha,
  'US-125-SCOOT': TENVO_VEHICLES_ASSETS.vehicles.bikeScooter,
  'CBH-AIR-GEL': TENVO_VEHICLES_ASSETS.products.airFreshener,
  'MRH-YW-A056': TENVO_VEHICLES_ASSETS.products.hornA056,
  'MRH-MR-80-002': TENVO_VEHICLES_ASSETS.products.hornMr80002,
  'X7-BONNET-3L': TENVO_VEHICLES_ASSETS.products.bonnetSpotlight,
  'SMS-ASH-LED': TENVO_VEHICLES_ASSETS.products.ashtrayLed,
  'X7-COROLLA-HL': TENVO_VEHICLES_ASSETS.products.corollaHeadlight,
  'PIO-WX306T': TENVO_VEHICLES_ASSETS.products.pioneerBass,
  'PIO-CAM-UNI': TENVO_VEHICLES_ASSETS.products.pioneerCamera,
  'X7-CITY-BL': TENVO_VEHICLES_ASSETS.products.cityTailLight,
  'X7-POD-40W': TENVO_VEHICLES_ASSETS.products.ledPod,
  'KLCB-SHAMPOO-1L': TENVO_VEHICLES_ASSETS.products.carShampoo,
  'SMS-MF-5PK': TENVO_VEHICLES_ASSETS.products.microfiber,
  'SMS-AND-10': TENVO_VEHICLES_ASSETS.products.androidPanel,
  'SMS-10D-MATS': TENVO_VEHICLES_ASSETS.products.floorMats,
  'SMS-DVR-4K': TENVO_VEHICLES_ASSETS.products.dashCam,
  'PPF-CL-49': TENVO_VEHICLES_ASSETS.products.ppfRed,
  'PPF-JGY-100': TENVO_VEHICLES_ASSETS.products.ppfGrey,
  'PPF-ULT-CLR': TENVO_VEHICLES_ASSETS.products.ppfClear,
  'CONV-REVO-ROCCO': TENVO_VEHICLES_ASSETS.products.conversionRevo,
  'CONV-PRADO-GX': TENVO_VEHICLES_ASSETS.products.conversionPrado,
  'CONV-FORT-LEG': TENVO_VEHICLES_ASSETS.products.conversionFortuner,
  'CONV-W222-MAY': TENVO_VEHICLES_ASSETS.products.conversionMaybach,
  'WF-CERAMIC': TENVO_VEHICLES_ASSETS.products.windowFilm,
  'WF-CHAMELEON': TENVO_VEHICLES_ASSETS.products.windowFilm,
  '3M-CRYST': TENVO_VEHICLES_ASSETS.products.windowFilm,
  'MOD-FORT-SIGMA': TENVO_VEHICLES_ASSETS.products.bodyKit,
  'EXT-DHC-4': TENVO_VEHICLES_ASSETS.products.chromeHandles,
};

/**
 * @param {string} sku
 * @param {string} [fallback]
 */
export function productImageForSku(sku, fallback) {
  return SKU_IMAGE_MAP[sku] || fallback || TENVO_VEHICLES_ASSETS.hero.accessories;
}
