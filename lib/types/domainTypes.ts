/**
 * Domain-Specific Type Definitions
 * Type-safe interfaces for all 21 business domains
 * 
 * This file provides TypeScript types for domain-specific product structures
 * while maintaining backward compatibility with existing code.
 */

// Base product interface - used by all domains
export interface BaseProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price: number;
  stock: number;
  minStock?: number;
  maxStock?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  category: string;
  brand?: string;
  unit: string;
  alternateUnit?: string;
  hsnCode?: string;
  sacCode?: string;
  taxPercent?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Multi-location support
  locations?: ProductLocation[];

  // Valuation
  costPrice?: number;
  mrp?: number; // Maximum Retail Price
  stockValuationMethod?: 'FIFO' | 'LIFO' | 'Average' | 'FEFO';
}

// Supporting types
export interface SerialNumber {
  serialNumber: string;
  purchaseDate?: Date | string;
  warrantyStartDate?: Date | string;
  warrantyEndDate?: Date | string;
  status: 'available' | 'sold' | 'returned' | 'warranty';
  serviceHistory?: ServiceRecord[];
}

export interface Batch {
  batchNumber: string;
  manufacturingDate: Date | string;
  expiryDate: Date | string;
  quantity: number;
  cost: number;
  location?: string;
  status: 'active' | 'expired' | 'sold';
}

export interface ProductVariant {
  id?: string;
  size?: string;
  color?: string;
  finish?: string;
  material?: string;
  sku: string;
  stock: number;
  price: number;
  barcode?: string;
  imageUrl?: string;
  // For expiry-enabled variants
  expiryDate?: Date | string;
  batches?: Batch[];
}

export interface ProductLocation {
  locationId: string;
  locationName: string;
  stock: number;
  minStock?: number;
  reorderPoint?: number;
}

export interface ServiceRecord {
  date: Date | string;
  serviceType: string;
  description: string;
  cost: number;
  technician?: string;
}

export interface BillOfMaterials {
  id: string;
  name: string;
  items: BOMItem[];
  totalCost: number;
}

export interface BOMItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  cost: number;
}

// ============================================
// DOMAIN-SPECIFIC PRODUCT INTERFACES
// ============================================

// 1. Auto Parts
export interface AutoPartProduct extends BaseProduct {
  domain: 'auto-parts';
  partNumber: string;
  oemNumber?: string;
  vehicleCompatibility: string[]; // Array of vehicle models
  warrantyPeriod: number; // in months
  manufacturer: string;
  serialNumbers?: SerialNumber[];
  serviceHistory?: ServiceRecord[];
}

// 2. Retail Shop
export interface RetailProduct extends BaseProduct {
  domain: 'retail-shop';
  mrp: number; // Maximum Retail Price
  variants?: ProductVariant[]; // Size-Color matrix
  expiryDate?: Date | string;
  manufacturingDate?: Date | string;
}

// 3. Pharmacy
export interface PharmacyProduct extends BaseProduct {
  domain: 'pharmacy';
  drugLicense: string;
  scheduleH1: boolean; // Controlled substance
  mrp: number;
  batches?: Batch[];
  manufacturingDate?: Date | string;
  temperatureRange?: string; // Storage temperature
}

// 4. Chemical
export interface ChemicalProduct extends BaseProduct {
  domain: 'chemical';
  casNumber: string; // Chemical Abstracts Service number
  hazardClass: string; // GHS classification
  storageConditions: string;
  sdsUrl?: string; // Safety Data Sheet URL
  batches?: Batch[];
  bom?: BillOfMaterials;
  productionOrders?: string[];
}

// 5. Food & Beverages
export interface FoodBeverageProduct extends BaseProduct {
  domain: 'food-beverages';
  psqcaLicense: string; // Pakistan Standards and Quality Control Authority
  temperatureRange: string; // e.g., "2-8°C"
  mrp: number;
  batches?: Batch[];
  manufacturingDate?: Date | string;
}

// 6. E-commerce
export interface EcommerceProduct extends BaseProduct {
  domain: 'ecommerce';
  weight: number; // for shipping
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
  channels?: {
    channel: 'website' | 'amazon' | 'daraz' | 'shopify' | 'woocommerce';
    channelSku: string;
    price: number;
    stock: number;
    syncEnabled: boolean;
  }[];
}

// 7. Computer Hardware
export interface ComputerHardwareProduct extends BaseProduct {
  domain: 'computer-hardware';
  modelNumber: string;
  warrantyPeriod: number; // in months
  compatibility: string[]; // Compatible systems
  imeiOrMac?: string; // For mobile devices
  serialNumbers?: SerialNumber[];
  serviceHistory?: ServiceRecord[];
}

// 8. Furniture
export interface FurnitureProduct extends BaseProduct {
  domain: 'furniture';
  material: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
  color: string;
  finish: string;
  assemblyRequired: boolean;
  weight: number;
  variants?: ProductVariant[]; // Size-Color-Finish
  bom?: BillOfMaterials;
  productionOrders?: string[];
}

// 9. Book Publishing
export interface BookProduct extends BaseProduct {
  domain: 'book-publishing';
  isbn: string;
  author: string;
  publisher: string;
  edition: string;
  language: string;
  pages: number;
  bindingType: string;
}

// 10. Travel
export interface TravelProduct extends BaseProduct {
  domain: 'travel';
  serviceType: string; // 'flight', 'hotel', 'package', etc.
  destination: string;
  duration: string; // e.g., "7 days"
  validity: Date | string; // Booking validity
  commissionRate: number; // Percentage
}

// 11. FMCG
export interface FMCGProduct extends BaseProduct {
  domain: 'fmcg';
  mrp: number;
  batches?: Batch[];
  expiryDate?: Date | string;
  manufacturingDate?: Date | string;
}

// 12. Electrical
export interface ElectricalProduct extends BaseProduct {
  domain: 'electrical';
  voltage: string;
  currentRating: string;
  certification: string; // e.g., "BIS", "CE"
  warrantyPeriod: number;
  modelNumber: string;
  imeiOrMac?: string;
  serialNumbers?: SerialNumber[];
}

// 13. Paper Mill
export interface PaperMillProduct extends BaseProduct {
  domain: 'paper-mill';
  gsm: number; // Grams per square meter
  size: string; // Paper size
  grade: string;
  finish: string;
  reamWeight: number;
  batches?: Batch[];
  bom?: BillOfMaterials;
  productionOrders?: string[];
}

// 14. Paint
export interface PaintProduct extends BaseProduct {
  domain: 'paint';
  colorCode: string;
  finish: string; // 'matte', 'glossy', 'satin'
  baseType: string; // 'water-based', 'oil-based'
  coverage: number; // square meters per liter
  dryingTime: string;
  batches?: Batch[];
  variants?: ProductVariant[]; // Size-Color
  bom?: BillOfMaterials;
  productionOrders?: string[];
}

// 15. Mobile
export interface MobileProduct extends BaseProduct {
  domain: 'mobile';
  modelNumber: string;
  warrantyPeriod: number;
  imei: string;
  serialNumbers?: SerialNumber[];
  serviceHistory?: ServiceRecord[];
}

// 16. Garments
export interface GarmentProduct extends BaseProduct {
  domain: 'garments';
  variants?: ProductVariant[]; // Size-Color
  material: string;
  careInstructions?: string;
  bom?: BillOfMaterials;
  productionOrders?: string[];
}

// 17. Agriculture
export interface AgricultureProduct extends BaseProduct {
  domain: 'agriculture';
  cropType: string;
  season: string;
  harvestDate?: Date | string;
  batches?: Batch[];
  storageConditions: string;
}

// 18. Gems & Jewellery
export interface GemsJewelleryProduct extends BaseProduct {
  domain: 'gems-jewellery';
  carat?: number;
  purity?: string; // e.g., "18K", "22K"
  stoneType?: string;
  certification?: string; // e.g., "GIA", "IGI"
  serialNumbers?: SerialNumber[];
  warrantyPeriod: number;
}

// 19. Electronics Goods
export interface ElectronicsProduct extends BaseProduct {
  domain: 'electronics-goods';
  modelNumber: string;
  warrantyPeriod: number;
  serialNumbers?: SerialNumber[];
  serviceHistory?: ServiceRecord[];
  compatibility?: string[];
}

// 20. Real Estate
export interface RealEstateProduct extends BaseProduct {
  domain: 'real-estate';
  propertyType: string; // 'apartment', 'house', 'commercial'
  area: number; // in square feet/meters
  location: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
}

// 21. Grocery
export interface GroceryProduct extends BaseProduct {
  domain: 'grocery';
  mrp: number;
  batches?: Batch[];
  expiryDate?: Date | string;
  manufacturingDate?: Date | string;
  temperatureRange?: string;
}

// Union type for all products
export type Product =
  | AutoPartProduct
  | RetailProduct
  | PharmacyProduct
  | ChemicalProduct
  | FoodBeverageProduct
  | EcommerceProduct
  | ComputerHardwareProduct
  | FurnitureProduct
  | BookProduct
  | TravelProduct
  | FMCGProduct
  | ElectricalProduct
  | PaperMillProduct
  | PaintProduct
  | MobileProduct
  | GarmentProduct
  | AgricultureProduct
  | GemsJewelleryProduct
  | ElectronicsProduct
  | RealEstateProduct
  | GroceryProduct
  | BaseProduct; // Fallback for unknown domains

// Type guard functions
export function isAutoPartProduct(product: Product): product is AutoPartProduct {
  return 'domain' in product && product.domain === 'auto-parts';
}

export function isPharmacyProduct(product: Product): product is PharmacyProduct {
  return 'domain' in product && product.domain === 'pharmacy';
}

export function isRetailProduct(product: Product): product is RetailProduct {
  return 'domain' in product && product.domain === 'retail-shop';
}

// ... (similar type guards for all domains)

/**
 * Get domain from product
 */
export function getProductDomain(product: Product): string {
  if ('domain' in product) {
    return product.domain;
  }
  return 'generic';
}

/**
 * Check if product has batches
 */
export function hasBatches(product: Product): boolean {
  return 'batches' in product && Array.isArray(product.batches);
}

/**
 * Check if product has serial numbers
 */
export function hasSerialNumbers(product: Product): boolean {
  return 'serialNumbers' in product && Array.isArray(product.serialNumbers);
}

/**
 * Check if product has variants
 */
export function hasVariants(product: Product): boolean {
  return 'variants' in product && Array.isArray(product.variants);
}

