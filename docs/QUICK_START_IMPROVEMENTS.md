# Quick Start Guide - Domain Improvements
## How to Use the New Domain-Specific Features

---

## 🎯 What's New

We've implemented a comprehensive domain-specific system that allows each of the 21 business categories to have their own specialized fields and features.

### Key Improvements:

1. **Type-Safe Domain System** - Full TypeScript support for all domains
2. **PKR Currency Support** - Pakistani Rupee formatting and conversion
3. **Domain-Specific Fields** - Auto-rendering based on business category
4. **Batch Tracking** - For Pharmacy, FMCG, Food & Beverages
5. **Serial Tracking** - For Auto Parts, Electronics, Hardware
6. **Vehicle Compatibility** - For Auto Parts domain

---

## 🚀 Quick Integration

### Step 1: Import the Components

```jsx
// In your product form component
import { DomainFieldRenderer } from '@/components/domain/DomainFieldRenderer';
import { BatchNumberInput } from '@/components/domain/BatchTracking';
import { SerialNumberInput } from '@/components/domain/SerialTracking';
import { formatCurrency, getCurrencySymbol } from '@/lib/currency/pkr';
import { 
  isBatchTrackingEnabled, 
  isSerialTrackingEnabled,
  getDomainProductFields 
} from '@/lib/utils/domainHelpers';
```

### Step 2: Use DomainFieldRenderer

Replace static inputs with dynamic domain-aware fields:

```jsx
// Before
<Input 
  label="Part Number"
  value={product.partNumber}
  onChange={(e) => setProduct({...product, partNumber: e.target.value})}
/>

// After
<DomainFieldRenderer
  field="partNumber"
  value={product.partNumber}
  onChange={(value) => setProduct({...product, partNumber: value})}
  category={category}
  product={product}
/>
```

### Step 3: Add Batch Tracking (if enabled)

```jsx
{isBatchTrackingEnabled(category) && (
  <div className="mt-6">
    <BatchNumberInput
      value={product.batches || []}
      onChange={(batches) => setProduct({...product, batches})}
      product={product}
    />
  </div>
)}
```

### Step 4: Add Serial Tracking (if enabled)

```jsx
{isSerialTrackingEnabled(category) && (
  <div className="mt-6">
    <SerialNumberInput
      value={product.serialNumbers || []}
      onChange={(serialNumbers) => setProduct({...product, serialNumbers})}
      product={product}
    />
  </div>
)}
```

### Step 5: Update Currency Displays

```jsx
// Before
<span>₹{product.price}</span>

// After
import { formatCurrency } from '@/lib/currency/pkr';

const currency = 'PKR'; // or get from user settings
<span>{formatCurrency(product.price, currency)}</span>
```

---

## 📋 Domain-Specific Examples

### Auto Parts Domain

```jsx
import { VehicleCompatibilitySelector } from '@/components/domain/AutoPartsFields';

// In your form
<VehicleCompatibilitySelector
  value={product.vehicleCompatibility || []}
  onChange={(vehicles) => setProduct({...product, vehicleCompatibility: vehicles})}
/>

<DomainFieldRenderer
  field="partNumber"
  value={product.partNumber}
  onChange={(value) => setProduct({...product, partNumber: value})}
  category="auto-parts"
  product={product}
/>

<DomainFieldRenderer
  field="warrantyPeriod"
  value={product.warrantyPeriod}
  onChange={(value) => setProduct({...product, warrantyPeriod: value})}
  category="auto-parts"
  product={product}
/>
```

### Pharmacy Domain

```jsx
// Batch tracking is automatically enabled for pharmacy
<BatchNumberInput
  value={product.batches || []}
  onChange={(batches) => {
    // Update product with batches
    setProduct({...product, batches});
    
    // Calculate total stock from batches
    const totalStock = batches.reduce((sum, b) => sum + b.quantity, 0);
    setProduct({...product, batches, stock: totalStock});
  }}
  product={product}
/>

<DomainFieldRenderer
  field="drugLicense"
  value={product.drugLicense}
  onChange={(value) => setProduct({...product, drugLicense: value})}
  category="pharmacy"
  product={product}
/>
```

### Retail Shop Domain

```jsx
// Size-Color Matrix (coming soon)
// For now, use variants array
const [variants, setVariants] = useState(product.variants || []);

// Add variant
const addVariant = () => {
  setVariants([...variants, {
    size: '',
    color: '',
    sku: '',
    stock: 0,
    price: 0,
  }]);
};
```

---

## 💰 Currency Usage

### Basic Formatting

```jsx
import { formatCurrency, formatAmount, getCurrencySymbol } from '@/lib/currency/pkr';

// With symbol
formatCurrency(1000, 'PKR') // Returns '₨1,000.00'

// Without symbol (for tables)
formatAmount(1000, 'PKR') // Returns '1,000.00'

// Just symbol
getCurrencySymbol('PKR') // Returns '₨'
```

### In Tables

```jsx
// Table cell
<td>{formatCurrency(row.price, currency)}</td>

// Or without symbol
<td>{formatAmount(row.price, currency)}</td>
```

### In Forms

```jsx
<Input
  type="number"
  value={product.price}
  onChange={(e) => setProduct({...product, price: parseFloat(e.target.value)})}
  prefix={getCurrencySymbol(currency)}
/>
```

### Currency Conversion

```jsx
import { convertCurrency } from '@/lib/currency/pkr';

// Convert USD to PKR
const pkrAmount = convertCurrency(100, 'USD', 'PKR', 280); // 28000
```

---

## 🔍 Domain Helpers Usage

### Check Feature Availability

```jsx
import { 
  isBatchTrackingEnabled,
  isSerialTrackingEnabled,
  isExpiryTrackingEnabled,
  isManufacturingEnabled,
  isSizeColorMatrixEnabled,
} from '@/lib/utils/domainHelpers';

// Conditional rendering
{isBatchTrackingEnabled(category) && <BatchTracking />}
{isSerialTrackingEnabled(category) && <SerialTracking />}
```

### Get Domain Information

```jsx
import { 
  getDomainProductFields,
  getDomainTaxCategories,
  getDomainUnits,
  getDomainDefaultTax,
  getDomainFeatureSummary,
} from '@/lib/utils/domainHelpers';

// Get required fields
const fields = getDomainProductFields('pharmacy');
// Returns: ['Drug License', 'Batch Number', 'Expiry Date', ...]

// Get tax categories
const taxes = getDomainTaxCategories('retail-shop');
// Returns: ['GST 5%', 'GST 12%', 'GST 18%']

// Get all feature flags
const features = getDomainFeatureSummary('auto-parts');
// Returns: { batchTracking: false, serialTracking: true, ... }
```

### Validate Product

```jsx
import { validateDomainProduct } from '@/lib/utils/domainHelpers';

const validation = validateDomainProduct(product, category);

if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  // Show errors to user
}

if (validation.warnings.length > 0) {
  console.warn('Warnings:', validation.warnings);
  // Show warnings to user
}
```

---

## 🎨 Styling

All components use Tailwind CSS and shadcn/ui components. They automatically match your existing design system.

### Custom Styling

```jsx
<DomainFieldRenderer
  field="partNumber"
  value={product.partNumber}
  onChange={...}
  category={category}
  className="my-custom-class" // Additional classes
/>
```

---

## 🐛 Troubleshooting

### Component Not Rendering

1. Check if category is valid:
   ```jsx
   const validCategories = ['auto-parts', 'pharmacy', 'retail-shop', ...];
   if (!validCategories.includes(category)) {
     console.error('Invalid category:', category);
   }
   ```

2. Check if field exists for domain:
   ```jsx
   const fields = getDomainProductFields(category);
   console.log('Available fields:', fields);
   ```

### Currency Not Displaying

1. Check currency code:
   ```jsx
   import { isValidCurrency } from '@/lib/currency/pkr';
   if (!isValidCurrency(currency)) {
     console.error('Invalid currency:', currency);
   }
   ```

2. Check amount is a number:
   ```jsx
   if (typeof amount !== 'number' || isNaN(amount)) {
     console.error('Invalid amount:', amount);
   }
   ```

### Batch/Serial Tracking Not Showing

1. Check feature is enabled:
   ```jsx
   console.log('Batch enabled:', isBatchTrackingEnabled(category));
   console.log('Serial enabled:', isSerialTrackingEnabled(category));
   ```

2. Check product has the field:
   ```jsx
   console.log('Product batches:', product.batches);
   console.log('Product serials:', product.serialNumbers);
   ```

---

## 📚 Next Steps

1. **Integrate into InventoryManager** - Update the main inventory component
2. **Update Product Forms** - Add domain-specific fields
3. **Add Currency Selector** - Let users choose currency
4. **Add Urdu Support** - For Pakistani market
5. **Create Variant Manager** - For size-color matrix

---

## 📞 Support

For questions or issues:
1. Check `IMPLEMENTATION_PROGRESS.md` for current status
2. Check `DOMAIN_ANALYSIS_AND_IMPLEMENTATION_PLAN.md` for detailed analysis
3. Review component source code for examples

---

**Happy Coding! 🚀**

