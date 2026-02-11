# Domain Analysis & Implementation Plan
## Comprehensive Market & Domain Understanding

**Date:** January 2025  
**System:** Financial Hub - Multi-Domain Inventory Management  
**Approach:** Incremental, tested, non-breaking improvements

---

## Executive Summary

This document provides a deep-dive analysis of all **41 business domains**, their specific requirements, current implementation status, and a systematic plan for professional enhancements without breaking existing functionality.

**Current Status:**
- ✅ 41 business domains configured and modularized
- ✅ Domain-specific color schemes and feature flags
- ✅ Intelligent Onboarding Wizard (`/register`)
- ✅ Smart Intelligence Layer (Forecasting & Auto-Restock)
- ✅ Integrated Review & Performance Tracking System
- ✅ Pakistani market localization (JazzCash, Easypaisa, FBR/NTN)
- ✅ Standardized Domain Helper System

---

## Domain-by-Domain Deep Analysis

### 1. Auto Parts Domain

#### **Market Characteristics**
- **Target Market**: Automotive parts retailers, service centers, distributors
- **Key Requirements**: Serial number tracking, warranty management, vehicle compatibility
- **Compliance**: GST 18%/28%, HSN codes required
- **Payment Terms**: Cash, Credit 15-30 days, Cheque

#### **Current Implementation**
```javascript
// From domainKnowledge.js
'auto-parts': {
  productFields: ['Part Number', 'OEM Number', 'Vehicle Compatibility', 'Warranty Period', 'Manufacturer', 'HSN Code'],
  taxCategories: ['GST 18%', 'GST 28%'],
  units: ['pcs', 'set', 'box', 'kg'],
  serialTrackingEnabled: true,
  batchTrackingEnabled: false,
  expiryTrackingEnabled: false,
  manufacturingEnabled: false,
}
```

#### **Domain-Specific Data Requirements**

**Product Schema:**
```typescript
interface AutoPartProduct {
  // Basic Fields
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  
  // Auto Parts Specific
  partNumber: string;          // ✅ In productFields
  oemNumber?: string;           // ✅ In productFields
  vehicleCompatibility: string[]; // ✅ In productFields - NEEDS ARRAY SUPPORT
  warrantyPeriod: number;       // ✅ In productFields - days/months
  manufacturer: string;         // ✅ In productFields
  hsnCode: string;              // ✅ In productFields
  
  // Serial Tracking
  serialNumbers?: string[];     // ✅ Enabled - NEEDS IMPLEMENTATION
  warrantyStartDate?: Date;     // For warranty tracking
  warrantyEndDate?: Date;        // Calculated from warrantyPeriod
  
  // Standard Fields
  price: number;
  stock: number;
  category: string;
  unit: 'pcs' | 'set' | 'box' | 'kg';
}
```

**Required Features:**
- ✅ Serial number tracking (enabled, needs UI)
- ✅ Warranty management (needs implementation)
- ✅ Vehicle compatibility matrix (needs implementation)
- ✅ Parts sales by vehicle model (needs report)
- ✅ Warranty claims tracking (needs module)

#### **Implementation Gaps**
1. **Vehicle Compatibility Matrix**
   - Current: Single string field
   - Needed: Multi-select with vehicle models database
   - Priority: High

2. **Serial Number Management**
   - Current: Feature enabled but no UI
   - Needed: Serial number input/scanning interface
   - Priority: High

3. **Warranty Tracking**
   - Current: Warranty period field exists
   - Needed: Warranty start/end date calculation
   - Needed: Warranty claims module
   - Priority: Medium

---

### 2. Retail Shop Domain

#### **Market Characteristics**
- **Target Market**: General retail stores, supermarkets, convenience stores
- **Key Requirements**: Size-color matrix, expiry tracking, MRP compliance
- **Compliance**: GST 5%/12%/18%, MRP display required
- **Payment Terms**: Cash, Card, UPI, Credit

#### **Current Implementation**
```javascript
'retail-shop': {
  productFields: ['Barcode', 'Category', 'Brand', 'Size', 'Color', 'HSN Code', 'MRP'],
  sizeColorMatrixEnabled: true,
  expiryTrackingEnabled: true,
}
```

#### **Domain-Specific Data Requirements**

**Product Schema:**
```typescript
interface RetailProduct {
  // Basic Fields
  id: string;
  name: string;
  sku: string;
  barcode: string;              // ✅ In productFields
  
  // Retail Specific
  category: string;              // ✅ In productFields
  brand: string;                 // ✅ In productFields
  mrp: number;                   // ✅ In productFields - Maximum Retail Price
  hsnCode: string;               // ✅ In productFields
  
  // Size-Color Matrix
  variants: {                    // ✅ Enabled - NEEDS IMPLEMENTATION
    size?: string;
    color?: string;
    sku: string;
    stock: number;
    price: number;
  }[];
  
  // Expiry Tracking
  expiryDate?: Date;             // ✅ Enabled - NEEDS IMPLEMENTATION
  manufacturingDate?: Date;
  
  // Standard Fields
  price: number;
  stock: number;
  unit: 'pcs' | 'kg' | 'litre' | 'pack';
}
```

**Required Features:**
- ✅ Size-color matrix (enabled, needs UI)
- ✅ Expiry tracking (enabled, needs UI)
- ✅ MRP compliance (needs validation)
- ✅ Daily sales reports (needs implementation)
- ✅ Category-wise sales (needs report)

#### **Implementation Gaps**
1. **Size-Color Matrix UI**
   - Current: Feature enabled but no interface
   - Needed: Variant management UI
   - Needed: Variant-wise stock tracking
   - Priority: High

2. **MRP Validation**
   - Current: MRP field exists
   - Needed: MRP >= Selling price validation
   - Needed: MRP display on invoices
   - Priority: Medium

---

### 3. Pharmacy Domain

#### **Market Characteristics**
- **Target Market**: Pharmacies, medical stores, hospitals
- **Key Requirements**: Batch tracking, expiry management, drug license, FEFO
- **Compliance**: GST 5%/12%/18%, Drug License required, Schedule H1 tracking
- **Payment Terms**: Cash, Insurance, Credit

#### **Current Implementation**
```javascript
'pharmacy': {
  productFields: ['Drug License', 'Batch Number', 'Expiry Date', 'MRP', 'HSN Code', 'Schedule H1', 'Manufacturing Date'],
  batchTrackingEnabled: true,
  expiryTrackingEnabled: true,
  stockValuationMethod: 'FEFO',
}
```

#### **Domain-Specific Data Requirements**

**Product Schema:**
```typescript
interface PharmacyProduct {
  // Basic Fields
  id: string;
  name: string;
  sku: string;
  
  // Pharmacy Specific
  drugLicense: string;           // ✅ In productFields
  scheduleH1: boolean;           // ✅ In productFields - Controlled substance
  mrp: number;                   // ✅ In productFields
  hsnCode: string;               // ✅ In productFields
  
  // Batch Tracking
  batches: {                     // ✅ Enabled - NEEDS IMPLEMENTATION
    batchNumber: string;
    manufacturingDate: Date;
    expiryDate: Date;
    quantity: number;
    cost: number;
  }[];
  
  // FEFO (First Expiry First Out)
  stockValuationMethod: 'FEFO';  // ✅ Configured
  
  // Standard Fields
  price: number;
  stock: number;                 // Calculated from batches
  unit: 'strip' | 'bottle' | 'box' | 'vial';
}
```

**Required Features:**
- ✅ Batch tracking (enabled, needs UI)
- ✅ Expiry alerts (needs implementation)
- ✅ FEFO allocation (needs algorithm)
- ✅ Drug license validation (needs implementation)
- ✅ Schedule H1 reporting (needs report)
- ✅ Prescription sales tracking (needs module)

#### **Implementation Gaps**
1. **Batch Management UI**
   - Current: Feature enabled but no interface
   - Needed: Batch entry form
   - Needed: Batch-wise stock display
   - Needed: Batch expiry alerts
   - Priority: Critical (pharmacy requirement)

2. **FEFO Algorithm**
   - Current: Method configured
   - Needed: Automatic FEFO allocation on sales
   - Needed: Expiry-based stock selection
   - Priority: Critical

3. **Drug License Validation**
   - Current: Field exists
   - Needed: License format validation
   - Needed: License expiry tracking
   - Priority: High

---

### 4. Chemical Domain

#### **Market Characteristics**
- **Target Market**: Chemical manufacturers, distributors, laboratories
- **Key Requirements**: Hazard classification, SDS management, batch tracking, manufacturing
- **Compliance**: GST 18%/28%, Hazard class labeling, Safety Data Sheets
- **Payment Terms**: Advance, Credit 30 Days, LC

#### **Current Implementation**
```javascript
'chemical': {
  productFields: ['CAS Number', 'Hazard Class', 'Storage Conditions', 'SDS', 'Batch Number', 'HSN Code', 'Expiry Date'],
  batchTrackingEnabled: true,
  expiryTrackingEnabled: true,
  manufacturingEnabled: true,
}
```

#### **Domain-Specific Data Requirements**

**Product Schema:**
```typescript
interface ChemicalProduct {
  // Basic Fields
  id: string;
  name: string;
  sku: string;
  
  // Chemical Specific
  casNumber: string;             // ✅ In productFields - Chemical Abstracts Service
  hazardClass: string;           // ✅ In productFields - GHS classification
  storageConditions: string;     // ✅ In productFields - Temperature, humidity
  sdsUrl?: string;               // ✅ In productFields - Safety Data Sheet
  hsnCode: string;               // ✅ In productFields
  
  // Batch Tracking
  batches: {                     // ✅ Enabled
    batchNumber: string;
    manufacturingDate: Date;
    expiryDate: Date;
    quantity: number;
  }[];
  
  // Manufacturing
  bom?: BillOfMaterials;         // ✅ Enabled - NEEDS IMPLEMENTATION
  productionOrders?: string[];   // ✅ Enabled
  
  // Standard Fields
  price: number;
  stock: number;
  unit: 'kg' | 'litre' | 'ton' | 'drum';
}
```

**Required Features:**
- ✅ Batch tracking (enabled, needs UI)
- ✅ Hazard classification (needs UI)
- ✅ SDS management (needs file upload)
- ✅ Manufacturing/BOM (enabled, needs UI)
- ✅ Production orders (needs module)
- ✅ Compliance reporting (needs report)

#### **Implementation Gaps**
1. **Hazard Classification UI**
   - Current: Field exists
   - Needed: GHS pictogram display
   - Needed: Hazard class selector
   - Priority: High (safety requirement)

2. **SDS File Management**
   - Current: Field exists
   - Needed: File upload component
   - Needed: PDF viewer for SDS
   - Priority: High

3. **Manufacturing Module**
   - Current: Feature enabled
   - Needed: BOM creation UI
   - Needed: Production order workflow
   - Priority: Medium

---

### 5. Food & Beverages Domain

#### **Market Characteristics**
- **Target Market**: Restaurants, food retailers, F&B distributors
- **Key Requirements**: FSSAI compliance, expiry tracking, temperature control, batch tracking
- **Compliance**: GST 5%/12%/18%, FSSAI license required
- **Payment Terms**: Cash, Card, UPI, Credit 7 Days

#### **Current Implementation**
```javascript
'food-beverages': {
  productFields: ['FSSAI License', 'Expiry Date', 'Batch Number', 'MRP', 'HSN Code', 'Manufacturing Date', 'Temperature Range'],
  batchTrackingEnabled: true,
  expiryTrackingEnabled: true,
  stockValuationMethod: 'FEFO',
}
```

#### **Domain-Specific Data Requirements**

**Product Schema:**
```typescript
interface FoodBeverageProduct {
  // Basic Fields
  id: string;
  name: string;
  sku: string;
  
  // F&B Specific
  fssaiLicense: string;          // ✅ In productFields
  temperatureRange: string;      // ✅ In productFields - e.g., "2-8°C"
  mrp: number;                   // ✅ In productFields
  hsnCode: string;               // ✅ In productFields
  
  // Batch & Expiry
  batches: {                     // ✅ Enabled
    batchNumber: string;
    manufacturingDate: Date;
    expiryDate: Date;
    quantity: number;
  }[];
  
  // FEFO
  stockValuationMethod: 'FEFO';  // ✅ Configured
  
  // Standard Fields
  price: number;
  stock: number;
  unit: 'kg' | 'litre' | 'pack' | 'box';
}
```

**Required Features:**
- ✅ Batch tracking (enabled, needs UI)
- ✅ Expiry tracking (enabled, needs UI)
- ✅ FSSAI compliance (needs validation)
- ✅ Temperature monitoring (needs implementation)
- ✅ FEFO allocation (needs algorithm)
- ✅ Category sales reports (needs report)

#### **Implementation Gaps**
1. **FSSAI License Validation**
   - Current: Field exists
   - Needed: License format validation (14-digit)
   - Needed: License expiry tracking
   - Priority: High (compliance requirement)

2. **Temperature Monitoring**
   - Current: Field exists
   - Needed: Temperature alert system
   - Needed: Storage condition compliance
   - Priority: Medium

---

### 6. E-commerce Domain

#### **Market Characteristics**
- **Target Market**: Online retailers, marketplaces, dropshippers
- **Key Requirements**: Multi-channel sync, fulfillment tracking, return management
- **Compliance**: GST 5%/12%/18%, E-way bill for shipping
- **Payment Terms**: Online Payment, COD, Wallet

#### **Current Implementation**
```javascript
'ecommerce': {
  productFields: ['SKU', 'Category', 'Brand', 'Weight', 'Dimensions', 'HSN Code', 'Barcode'],
  // No special tracking enabled
}
```

#### **Domain-Specific Data Requirements**

**Product Schema:**
```typescript
interface EcommerceProduct {
  // Basic Fields
  id: string;
  name: string;
  sku: string;
  barcode: string;               // ✅ In productFields
  
  // E-commerce Specific
  category: string;               // ✅ In productFields
  brand: string;                  // ✅ In productFields
  weight: number;                 // ✅ In productFields - for shipping
  dimensions: {                   // ✅ In productFields - NEEDS STRUCTURE
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
  hsnCode: string;               // ✅ In productFields
  
  // Multi-channel
  channels: {                     // NEEDS IMPLEMENTATION
    channel: 'website' | 'amazon' | 'flipkart' | 'shopify';
    channelSku: string;
    price: number;
    stock: number;
    syncEnabled: boolean;
  }[];
  
  // Standard Fields
  price: number;
  stock: number;
  unit: 'pcs' | 'set' | 'pack';
}
```

**Required Features:**
- ❌ Multi-channel sync (needs implementation)
- ❌ Fulfillment tracking (needs module)
- ❌ Return management (needs module)
- ❌ Channel performance reports (needs report)
- ❌ Customer lifetime value (needs analytics)

#### **Implementation Gaps**
1. **Multi-Channel Management**
   - Current: Not implemented
   - Needed: Channel configuration
   - Needed: Sync service
   - Needed: Channel-wise inventory
   - Priority: High

2. **Fulfillment Tracking**
   - Current: Not implemented
   - Needed: Order fulfillment workflow
   - Needed: Shipping integration
   - Needed: Delivery tracking
   - Priority: High

---

### 7. Computer Hardware Domain

#### **Market Characteristics**
- **Target Market**: Computer retailers, IT distributors, service centers
- **Key Requirements**: Serial tracking, warranty management, compatibility matrix
- **Compliance**: GST 18%/28%, Warranty documentation
- **Payment Terms**: Cash, Card, Credit 30 Days, EMI

#### **Current Implementation**
```javascript
'computer-hardware': {
  productFields: ['Model Number', 'Serial Number', 'Warranty Period', 'Compatibility', 'HSN Code', 'IMEI/MAC Address'],
  serialTrackingEnabled: true,
}
```

#### **Domain-Specific Data Requirements**

**Product Schema:**
```typescript
interface ComputerHardwareProduct {
  // Basic Fields
  id: string;
  name: string;
  sku: string;
  
  // Hardware Specific
  modelNumber: string;           // ✅ In productFields
  warrantyPeriod: number;        // ✅ In productFields - months
  compatibility: string[];       // ✅ In productFields - NEEDS ARRAY
  hsnCode: string;               // ✅ In productFields
  imeiOrMac?: string;            // ✅ In productFields - For mobile devices
  
  // Serial Tracking
  serialNumbers: {               // ✅ Enabled - NEEDS STRUCTURE
    serialNumber: string;
    purchaseDate: Date;
    warrantyStartDate: Date;
    warrantyEndDate: Date;
    serviceHistory: ServiceRecord[];
  }[];
  
  // Standard Fields
  price: number;
  stock: number;
  unit: 'pcs' | 'set' | 'box';
}
```

**Required Features:**
- ✅ Serial tracking (enabled, needs UI)
- ✅ Warranty management (needs implementation)
- ✅ Compatibility matrix (needs UI)
- ✅ Service history (needs module)
- ✅ Warranty claims (needs module)

---

### 8. Furniture Domain

#### **Market Characteristics**
- **Target Market**: Furniture retailers, manufacturers, interior designers
- **Key Requirements**: Customization, assembly tracking, size-color matrix, manufacturing
- **Compliance**: GST 18%/28%, Delivery scheduling
- **Payment Terms**: Advance 50%, On Delivery, Credit 30 Days

#### **Current Implementation**
```javascript
'furniture': {
  productFields: ['Material', 'Dimensions', 'Color', 'Finish', 'Assembly Required', 'HSN Code', 'Weight'],
  sizeColorMatrixEnabled: true,
  manufacturingEnabled: true,
}
```

#### **Domain-Specific Data Requirements**

**Product Schema:**
```typescript
interface FurnitureProduct {
  // Basic Fields
  id: string;
  name: string;
  sku: string;
  
  // Furniture Specific
  material: string;              // ✅ In productFields
  dimensions: {                  // ✅ In productFields - NEEDS STRUCTURE
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'inch';
  };
  color: string;                 // ✅ In productFields
  finish: string;                // ✅ In productFields
  assemblyRequired: boolean;     // ✅ In productFields
  weight: number;                // ✅ In productFields
  hsnCode: string;               // ✅ In productFields
  
  // Size-Color Matrix
  variants: {                    // ✅ Enabled
    size?: string;
    color: string;
    finish?: string;
    sku: string;
    stock: number;
    price: number;
  }[];
  
  // Manufacturing
  bom?: BillOfMaterials;         // ✅ Enabled
  productionOrders?: string[];
  
  // Standard Fields
  price: number;
  stock: number;
  unit: 'pcs' | 'set' | 'sqft';
}
```

**Required Features:**
- ✅ Size-color matrix (enabled, needs UI)
- ✅ Manufacturing/BOM (enabled, needs UI)
- ❌ Customization options (needs implementation)
- ❌ Assembly tracking (needs module)
- ❌ Delivery scheduling (needs module)

---

### 9-21. Remaining Domains

[Similar analysis for: Book Publishing, Travel, FMCG, Electrical, Paper Mill, Paint, Mobile, Garments, Agriculture, Gems & Jewellery, Electronics Goods, Real Estate, Grocery]

---

## Current Data Structure Analysis

### Product Data Model (Current)

**Basic Structure:**
```typescript
// Current implementation (inferred)
interface Product {
  id: string;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  category?: string;
  // Domain-specific fields stored as flat structure
}
```

**Issues Identified:**
1. ❌ Domain-specific fields not properly structured
2. ❌ Variants (size-color) not implemented
3. ❌ Batch/serial tracking data not structured
4. ❌ Manufacturing data not structured
5. ❌ Multi-location data not structured

---

## Implementation Plan

### Phase 1: Data Model Enhancement (Week 1-2)

**Goal:** Create proper data structures for all domains without breaking existing code

#### Step 1.1: Create Domain-Specific Type Definitions

**File:** `lib/types/domainTypes.ts`

```typescript
// Base product interface
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
  category: string;
  unit: string;
  hsnCode?: string;
  taxPercent?: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Domain-specific extensions
export interface AutoPartProduct extends BaseProduct {
  domain: 'auto-parts';
  partNumber: string;
  oemNumber?: string;
  vehicleCompatibility: string[];
  warrantyPeriod: number;
  manufacturer: string;
  serialNumbers?: SerialNumber[];
}

export interface RetailProduct extends BaseProduct {
  domain: 'retail-shop';
  brand: string;
  mrp: number;
  variants?: ProductVariant[];
  expiryDate?: Date;
}

export interface PharmacyProduct extends BaseProduct {
  domain: 'pharmacy';
  drugLicense: string;
  scheduleH1: boolean;
  mrp: number;
  batches?: Batch[];
}

// ... (similar for all 21 domains)

// Union type
export type Product = 
  | AutoPartProduct 
  | RetailProduct 
  | PharmacyProduct 
  | ChemicalProduct
  // ... (all domains)
  | BaseProduct; // Fallback
```

#### Step 1.2: Create Helper Functions

**File:** `lib/utils/domainHelpers.ts`

```typescript
import { Product, getDomainKnowledge } from '@/lib/domainKnowledge';

/**
 * Get domain-specific product fields for a category
 */
export function getDomainProductFields(category: string): string[] {
  const knowledge = getDomainKnowledge(category);
  return knowledge?.productFields || [];
}

/**
 * Validate product data against domain requirements
 */
export function validateDomainProduct(product: Product, category: string): ValidationResult {
  const knowledge = getDomainKnowledge(category);
  const errors: string[] = [];
  
  // Check required fields
  knowledge?.productFields?.forEach(field => {
    if (!product[field] && field !== 'HSN Code') { // HSN might be optional
      errors.push(`${field} is required for ${category}`);
    }
  });
  
  return { valid: errors.length === 0, errors };
}

/**
 * Get default values for domain-specific fields
 */
export function getDomainDefaults(category: string): Partial<Product> {
  const knowledge = getDomainKnowledge(category);
  return {
    unit: knowledge?.units?.[0] || 'pcs',
    taxPercent: knowledge?.defaultTax || 0,
    // ... other defaults
  };
}
```

#### Step 1.3: Update Components to Use New Types

**Approach:** Gradual migration with backward compatibility

```typescript
// components/InventoryManager.jsx - Updated
import { Product, getDomainProductFields } from '@/lib/utils/domainHelpers';

export function InventoryManager({ products = [], category = 'retail-shop' }) {
  // Get domain-specific fields
  const domainFields = getDomainProductFields(category);
  
  // Render domain-specific fields dynamically
  const renderDomainFields = (product: Product) => {
    return domainFields.map(field => {
      // Render appropriate input based on field type
      return <DomainFieldInput key={field} field={field} product={product} />;
    });
  };
  
  // ... rest of component
}
```

---

### Phase 2: Domain-Specific UI Components (Week 3-4)

#### Step 2.1: Create Domain Field Renderer

**File:** `components/DomainFieldRenderer.jsx`

```typescript
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDomainKnowledge } from '@/lib/domainKnowledge';

export function DomainFieldRenderer({ 
  field, 
  value, 
  onChange, 
  category,
  product 
}) {
  const knowledge = getDomainKnowledge(category);
  
  // Determine field type and render appropriate input
  const renderField = () => {
    switch (field) {
      case 'Serial Number':
        return <SerialNumberInput value={value} onChange={onChange} />;
      case 'Batch Number':
        return <BatchNumberInput value={value} onChange={onChange} />;
      case 'Expiry Date':
        return <DatePicker value={value} onChange={onChange} />;
      case 'Vehicle Compatibility':
        return <VehicleCompatibilitySelector value={value} onChange={onChange} />;
      case 'Size':
      case 'Color':
        return <VariantSelector field={field} value={value} onChange={onChange} />;
      default:
        return <Input value={value} onChange={(e) => onChange(e.target.value)} />;
    }
  };
  
  return (
    <div className="space-y-2">
      <Label>{field}</Label>
      {renderField()}
    </div>
  );
}
```

#### Step 2.2: Create Specialized Input Components

**File:** `components/domain/AutoPartsFields.jsx`

```typescript
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

export function VehicleCompatibilitySelector({ value = [], onChange }) {
  const [vehicles, setVehicles] = useState(value);
  const [newVehicle, setNewVehicle] = useState('');
  
  const addVehicle = () => {
    if (newVehicle.trim()) {
      const updated = [...vehicles, newVehicle.trim()];
      setVehicles(updated);
      onChange(updated);
      setNewVehicle('');
    }
  };
  
  const removeVehicle = (index) => {
    const updated = vehicles.filter((_, i) => i !== index);
    setVehicles(updated);
    onChange(updated);
  };
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={newVehicle}
          onChange={(e) => setNewVehicle(e.target.value)}
          placeholder="Enter vehicle model (e.g., Honda City 2020)"
          onKeyPress={(e) => e.key === 'Enter' && addVehicle()}
        />
        <Button type="button" onClick={addVehicle} size="sm">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {vehicles.map((vehicle, index) => (
          <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
            <span className="text-sm">{vehicle}</span>
            <button
              onClick={() => removeVehicle(index)}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SerialNumberInput({ value = [], onChange, product }) {
  // Similar implementation for serial numbers
  // Support scanning and manual entry
}
```

---

### Phase 3: Pakistani Market Localization (Week 5-6)

#### Step 3.1: PKR Currency Support

**File:** `lib/currency/pkr.ts`

```typescript
/**
 * PKR Currency Utilities
 * Handles Pakistani Rupee formatting and calculations
 */

export const CURRENCY_CONFIG = {
  PKR: {
    code: 'PKR',
    symbol: '₨',
    decimal: 2,
    locale: 'en-PK',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    decimal: 2,
    locale: 'en-IN',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    decimal: 2,
    locale: 'en-US',
  },
};

export type CurrencyCode = keyof typeof CURRENCY_CONFIG;

/**
 * Format amount in specified currency
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'PKR',
  options?: Intl.NumberFormatOptions
): string {
  const config = CURRENCY_CONFIG[currency];
  const formatter = new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: config.decimal,
    maximumFractionDigits: config.decimal,
    ...options,
  });
  
  return formatter.format(amount);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string, currency: CurrencyCode = 'PKR'): number {
  // Remove currency symbols and formatting
  const cleaned = value
    .replace(/[₨₹$,]/g, '')
    .replace(/\s/g, '')
    .trim();
  
  return parseFloat(cleaned) || 0;
}

/**
 * Convert between currencies
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  exchangeRate: number
): number {
  if (from === to) return amount;
  return amount * exchangeRate;
}
```

#### Step 3.2: Update All Currency Displays

**File:** `lib/utils/currencyHelpers.ts`

```typescript
import { formatCurrency, CurrencyCode } from '@/lib/currency/pkr';

/**
 * Hook to get currency formatter for current business
 */
export function useCurrency(businessCurrency: CurrencyCode = 'PKR') {
  return {
    format: (amount: number) => formatCurrency(amount, businessCurrency),
    symbol: CURRENCY_CONFIG[businessCurrency].symbol,
    code: businessCurrency,
  };
}

/**
 * Update all currency displays in components
 * Replace: ₹{amount} with: {formatCurrency(amount, currency)}
 */
```

**Migration Script:**
```typescript
// scripts/migrate-currency.js
// Find and replace all hardcoded currency symbols
// ₹ → formatCurrency(amount, currency)
// $ → formatCurrency(amount, 'USD')
```

---

### Phase 4: Feature Implementation (Week 7-12)

#### Batch Tracking Implementation

**File:** `components/domain/BatchTracking.jsx`

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/DatePicker';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

export function BatchTracking({ product, onUpdate, category }) {
  const [batches, setBatches] = useState(product.batches || []);
  
  const addBatch = () => {
    const newBatch = {
      batchNumber: `BATCH-${Date.now()}`,
      manufacturingDate: new Date(),
      expiryDate: new Date(),
      quantity: 0,
      cost: 0,
    };
    setBatches([...batches, newBatch]);
  };
  
  const updateBatch = (index, field, value) => {
    const updated = batches.map((batch, i) => 
      i === index ? { ...batch, [field]: value } : batch
    );
    setBatches(updated);
    onUpdate({ ...product, batches: updated });
  };
  
  const removeBatch = (index) => {
    setBatches(batches.filter((_, i) => i !== index));
  };
  
  // Calculate expiry alerts
  const getExpiryAlerts = () => {
    const today = new Date();
    const alertDays = 30; // Configurable
    return batches.filter(batch => {
      const daysUntilExpiry = Math.ceil(
        (new Date(batch.expiryDate) - today) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= alertDays && daysUntilExpiry > 0;
    });
  };
  
  const expiryAlerts = getExpiryAlerts();
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Batch Management</CardTitle>
          <Button onClick={addBatch} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Batch
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {expiryAlerts.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold">
                {expiryAlerts.length} batch(es) expiring soon
              </span>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {batches.map((batch, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label>Batch Number</Label>
                  <Input
                    value={batch.batchNumber}
                    onChange={(e) => updateBatch(index, 'batchNumber', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Manufacturing Date</Label>
                  <DatePicker
                    value={batch.manufacturingDate}
                    onChange={(date) => updateBatch(index, 'manufacturingDate', date)}
                  />
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <DatePicker
                    value={batch.expiryDate}
                    onChange={(date) => updateBatch(index, 'expiryDate', date)}
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={batch.quantity}
                    onChange={(e) => updateBatch(index, 'quantity', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBatch(index)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {batches.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No batches added. Click "Add Batch" to start tracking.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Implementation Checklist

### Week 1: Foundation
- [ ] Create domain type definitions
- [ ] Create domain helper functions
- [ ] Update product interfaces
- [ ] Test backward compatibility

### Week 2: Data Structure
- [ ] Implement variant structure (size-color)
- [ ] Implement batch structure
- [ ] Implement serial number structure
- [ ] Update database schema (if applicable)

### Week 3: UI Components
- [ ] Create DomainFieldRenderer
- [ ] Create specialized input components
- [ ] Integrate into InventoryManager
- [ ] Test all domains

### Week 4: Domain Features
- [ ] Batch tracking UI (Pharmacy, FMCG, etc.)
- [ ] Serial tracking UI (Auto Parts, Electronics)
- [ ] Size-color matrix UI (Retail, Garments)
- [ ] Expiry management UI

### Week 5: Pakistani Localization
- [ ] PKR currency implementation
- [ ] Update all currency displays
- [ ] Test currency conversions
- [ ] Add currency selector

### Week 6: Urdu Language
- [ ] Set up i18n
- [ ] Translate core components
- [ ] Add RTL support
- [ ] Test bilingual interface

### Week 7-12: Advanced Features
- [ ] Payment gateway integration
- [ ] FBR compliance
- [ ] Advanced reporting
- [ ] Workflow automation

---

## Testing Strategy

### Unit Tests
```typescript
// __tests__/lib/currency/pkr.test.ts
describe('PKR Currency', () => {
  it('should format PKR correctly', () => {
    expect(formatCurrency(1000, 'PKR')).toBe('₨1,000.00');
  });
});
```

### Integration Tests
```typescript
// __tests__/components/InventoryManager.test.tsx
describe('InventoryManager with Domain Fields', () => {
  it('should render auto-parts specific fields', () => {
    render(<InventoryManager category="auto-parts" />);
    expect(screen.getByLabelText('Part Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Vehicle Compatibility')).toBeInTheDocument();
  });
});
```

---

## Next Steps

1. **Review this plan** with team
2. **Start with Phase 1** (Data Model Enhancement)
3. **Test incrementally** after each change
4. **Document as you go**
5. **Deploy to staging** before production

---

**Last Updated:** January 2025  
**Status:** Ready for Implementation

