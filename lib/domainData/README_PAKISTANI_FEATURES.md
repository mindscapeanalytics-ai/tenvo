# Pakistani Market Features - Developer Guide

## Overview

This guide documents the Pakistani market enhancements implemented for TENVO's MVP. All features are designed to work without external APIs, making them production-ready for immediate deployment.

## 📁 File Structure

```
lib/
├── domainData/
│   ├── pakistaniBrands.js          # 200+ Pakistani brands database
│   ├── pakistaniMarkets.js         # 100+ market locations across 10 cities
│   ├── pakistaniSeasons.js         # 8 seasonal pricing periods
│   ├── pakistaniRetailData.js      # Existing retail-specific data
│   ├── retail.js                   # Retail domains with pakistaniFeatures
│   ├── specialized.js              # Specialized domains with pakistaniFeatures
│   └── textile.js                  # Textile domains with pakistaniFeatures
├── services/
│   └── loyaltyProgram.js           # Loyalty points & tiers management
├── utils/
│   └── pakistaniFeatures.js        # Integration utility (USE THIS!)
└── translations.js                  # 300+ English/Urdu translations
```

## 🚀 Quick Start

### 1. Check if Domain Has Pakistani Features

```javascript
import { hasPakistaniFeatures, getPakistaniFeatures } from '@/lib/utils/pakistaniFeatures';

const domainKey = 'retail-shop';

if (hasPakistaniFeatures(domainKey)) {
  const features = getPakistaniFeatures(domainKey);
  console.log('Payment Gateways:', features.paymentGateways);
  console.log('Tax Compliance:', features.taxCompliance);
  console.log('Languages:', features.languages);
}
```

### 2. Get Payment Gateways

```javascript
import { getPaymentGateways, getPaymentGatewayNames } from '@/lib/utils/pakistaniFeatures';

const gateways = getPaymentGateways('pharmacy');
// ['jazzcash', 'easypaisa', 'payfast', 'bank_transfer', 'cod']

const names = getPaymentGatewayNames('ur'); // Urdu names
// { jazzcash: 'جاز کیش', easypaisa: 'ایزی پیسہ', ... }
```

### 3. Get Brands for Domain

```javascript
import { getBrandsForDomain } from '@/lib/utils/pakistaniFeatures';

const brands = getBrandsForDomain('pharmacy');
// ['Getz Pharma', 'Searle', 'Abbott', 'GSK Pakistan', ...]

const mobileBrands = getBrandsForDomain('mobile');
// ['Samsung', 'Apple', 'Xiaomi', 'Oppo', 'Vivo', ...]
```

### 4. Get Market Locations

```javascript
import { getMarketLocationsForDomain } from '@/lib/utils/pakistaniFeatures';
import { getMarketsForCity } from '@/lib/domainData/pakistaniMarkets';

// Get markets for a specific city
const lahoreMarkets = getMarketsForCity('lahore');
// [{ en: 'Anarkali Bazaar', ur: 'انارکلی بازار' }, ...]

// Get markets for domain
const markets = getMarketLocationsForDomain('retail-shop', 'karachi');
```

### 5. Apply Seasonal Pricing

```javascript
import { getSeasonalPricing } from '@/lib/utils/pakistaniFeatures';
import { getCurrentSeason } from '@/lib/domainData/pakistaniSeasons';

const pricing = getSeasonalPricing('retail-shop', 'clothing', 5000);

if (pricing) {
  console.log('Season:', pricing.season.name.en);
  console.log('Original:', pricing.original);
  console.log('Discounted:', pricing.discounted);
  console.log('Savings:', pricing.savings);
}

// Check current season
const season = getCurrentSeason();
if (season) {
  console.log(`${season.name.en} - ${season.discountPercent}% off`);
}
```

### 6. Calculate Loyalty Points

```javascript
import { getLoyaltyPointsForPurchase, validateLoyaltyRedemption } from '@/lib/utils/pakistaniFeatures';

// Calculate points earned
const pointsInfo = getLoyaltyPointsForPurchase(10000, 'gold', 'premium');
console.log('Points:', pointsInfo.points); // 150 (10000 * 0.01 * 1.5)
console.log('Message:', pointsInfo.message.en);

// Validate redemption
const redemption = validateLoyaltyRedemption(500, 5000, 'en');
if (redemption.success) {
  console.log('Discount:', redemption.formattedDiscount);
  console.log('New Total:', redemption.formattedRemaining);
}
```

### 7. Use Translations

```javascript
import { t, formatCurrency, formatDate, formatNumber } from '@/lib/translations';

// Get translation
const label = t('add_product', 'ur'); // "پروڈکٹ شامل کریں"

// Format currency
const amount = formatCurrency(15000, 'ur'); // "روپے ۱۵۰۰۰"

// Format date
const date = formatDate(new Date(), 'ur'); // "۳ اپریل ۲۰۲۶"

// Format number
const num = formatNumber(12345, 'ur'); // "۱۲۳۴۵"
```

### 8. Format Invoice with Pakistani Features

```javascript
import { formatInvoiceWithPakistaniFeatures } from '@/lib/utils/pakistaniFeatures';

const invoice = {
  total: 15000,
  subtotal: 13000,
  date: new Date(),
  businessNTN: '1234567-8',
  businessSRN: 'SRN-123456',
  items: [...]
};

const enhanced = formatInvoiceWithPakistaniFeatures(invoice, 'retail-shop', 'ur');
console.log(enhanced.formattedTotal); // "روپے ۱۵۰۰۰"
console.log(enhanced.direction); // "rtl"
console.log(enhanced.taxCompliance); // { ntn: '...', srn: '...', ... }
```

## 🎯 Domain Coverage

### Domains with Pakistani Features (11 total):

1. ✅ **retail-shop** - Full features
2. ✅ **pharmacy** - Healthcare brands, FBR compliance
3. ✅ **grocery** - Food brands, seasonal pricing
4. ✅ **fmcg** - FMCG brands, batch tracking
5. ✅ **ecommerce** - Online payments, COD
6. ✅ **garments** - Fashion brands, seasonal sales
7. ✅ **mobile** - Mobile brands, warranty tracking
8. ✅ **electronics-goods** - Electronics brands, EMI
9. ✅ **bakery-confectionery** - Bakery brands, expiry tracking
10. ✅ **boutique-fashion** - Designer brands, custom orders
11. ✅ **textile-wholesale** - Textile mills, bulk orders

### Each Domain Includes:

- **Payment Gateways**: JazzCash, Easypaisa, PayFast, Bank Transfer, COD
- **Tax Compliance**: FBR, NTN, SRN, Provincial Tax, WHT
- **Languages**: English, Urdu (RTL support)
- **Seasonal Pricing**: Automatic discounts during seasons
- **Local Brands**: Domain-specific Pakistani brands
- **Market Locations**: Major Pakistani markets/bazaars
- **Urdu Categories**: Translated product categories

## 📊 Data Statistics

| Feature | Count | Coverage |
|---------|-------|----------|
| Domains with Pakistani Features | 11 | 100% |
| Pakistani Brands | 200+ | 12 categories |
| Market Locations | 100+ | 10 cities |
| Urdu Translations | 300+ | All UI elements |
| Seasonal Periods | 8 | Year-round |
| Loyalty Tiers | 3 | Silver, Gold, Platinum |
| Payment Gateways | 5 | All major Pakistani |

## 🌍 Supported Cities

1. **Lahore** - 15 markets
2. **Karachi** - 15 markets
3. **Islamabad** - 12 markets
4. **Faisalabad** - 10 markets
5. **Rawalpindi** - 8 markets
6. **Multan** - 6 markets
7. **Peshawar** - 6 markets
8. **Quetta** - 5 markets
9. **Sialkot** - 5 markets
10. **Gujranwala** - 4 markets
11. **Hyderabad** - 5 markets

## 🎁 Loyalty Program

### Tiers

- **Silver** (0-9,999 points): 1.0x multiplier
- **Gold** (10,000-49,999 points): 1.5x multiplier
- **Platinum** (50,000+ points): 2.0x multiplier

### Earning Rate

- Base: 1 point per 100 PKR spent
- Multiplied by tier multiplier
- Category multipliers: Premium (1.5x), Seasonal (1.2x), Clearance (0.5x)

### Redemption

- 100 points = 100 PKR discount
- Minimum: 100 points
- Maximum: 50% of invoice total
- Expiry: 365 days from earning

## 🎉 Seasonal Periods

1. **Ramadan** - 10% discount (Food, Grocery, Beverages)
2. **Eid ul-Fitr** - 15% discount (Clothing, Footwear, Gifts)
3. **Eid ul-Adha** - 15% discount (Clothing, Meat, Groceries)
4. **Independence Day** - 5% discount (Patriotic items)
5. **Winter Sale** - 20% discount (Nov-Jan, Winter wear)
6. **Summer Sale** - 15% discount (May-Jul, Summer wear)
7. **Back to School** - 10% discount (Mar-Apr, Stationery)
8. **Wedding Season** - 12% discount (Nov-Dec, Bridal wear)

## 🔧 Best Practices

### 1. Always Check Feature Availability

```javascript
if (hasPakistaniFeatures(domainKey)) {
  // Use Pakistani features
} else {
  // Fallback to standard features
}
```

### 2. Use the Integration Utility

```javascript
// ✅ GOOD - Use the utility
import { getPakistaniFeaturesSummary } from '@/lib/utils/pakistaniFeatures';

// ❌ BAD - Direct imports
import { pakistaniBrands } from '@/lib/domainData/pakistaniBrands';
```

### 3. Handle Language Properly

```javascript
// Always provide language parameter
const label = t('product_name', userLanguage);
const amount = formatCurrency(price, userLanguage);
const direction = getDirection(userLanguage); // 'rtl' or 'ltr'
```

### 4. Validate Before Processing

```javascript
import { validateLoyaltyTransaction } from '@/lib/services/loyaltyProgram';

const validation = validateLoyaltyTransaction(transaction);
if (!validation.isValid) {
  console.error('Errors:', validation.errors);
  return;
}
```

## 🧪 Testing

### Test Seasonal Pricing

```javascript
import { getCurrentSeason, isDateInSeason } from '@/lib/domainData/pakistaniSeasons';

// Test current season
const season = getCurrentSeason(new Date('2026-12-15'));
console.log(season?.name.en); // "Winter Sale" or "Wedding Season"

// Test specific date
const isWinter = isDateInSeason('winter_sale', new Date('2026-12-15'));
console.log(isWinter); // true
```

### Test Loyalty Calculations

```javascript
import { calculatePointsEarned, getCustomerTier } from '@/lib/services/loyaltyProgram';

// Test points calculation
const points = calculatePointsEarned(10000, 'gold', 'premium');
console.log(points); // 150

// Test tier determination
const tier = getCustomerTier(25000);
console.log(tier.key); // 'gold'
```

## 📝 Common Use Cases

### Use Case 1: Product Form with Pakistani Features

```javascript
const domainKey = 'pharmacy';
const brands = getBrandsForDomain(domainKey);
const markets = getMarketLocationsForDomain(domainKey, 'lahore');

// Render brand dropdown
<select>
  {brands.map(brand => (
    <option key={brand} value={brand}>{brand}</option>
  ))}
</select>

// Render market dropdown
<select>
  {markets.map(market => (
    <option key={market.en} value={market.en}>
      {lang === 'ur' ? market.ur : market.en}
    </option>
  ))}
</select>
```

### Use Case 2: Invoice with Seasonal Discount

```javascript
const pricing = getSeasonalPricing(domainKey, productCategory, originalPrice);

if (pricing) {
  return (
    <div>
      <p>Original: {formatCurrency(pricing.original, lang)}</p>
      <p>Discount: {pricing.discountPercent}%</p>
      <p>Final: {formatCurrency(pricing.discounted, lang)}</p>
      <p>Season: {pricing.season.name[lang]}</p>
    </div>
  );
}
```

### Use Case 3: Loyalty Points Display

```javascript
const pointsInfo = getLoyaltyPointsForPurchase(invoiceTotal, customerTier);

return (
  <div>
    <p>{pointsInfo.message[lang]}</p>
    <p>Tier: {pointsInfo.tier}</p>
    <p>Multiplier: {pointsInfo.multiplier}x</p>
  </div>
);
```

## 🚨 Important Notes

1. **No External APIs**: All features work offline (MVP Phase 1)
2. **Islamic Calendar**: Ramadan/Eid dates are approximate (Phase 2 will add Hijri conversion)
3. **RTL Support**: Always use `getDirection(lang)` for proper text direction
4. **Number Formatting**: Use `formatNumber()` for Urdu numerals (۰۱۲۳۴۵۶۷۸۹)
5. **Build Clean**: All files pass TypeScript validation

## 🔄 Future Enhancements (Phase 2)

- FBR IRIS API integration
- Raast payment gateway integration
- WhatsApp Business API
- SMS gateway integration
- Hijri calendar conversion for Islamic dates
- AI-powered tax calculation
- Digital signature for invoices
- QR code generation for FBR compliance

## 📞 Support

For questions or issues, refer to:
- Design Document: `.kiro/specs/pakistani-market-2026-enhancements/design.md`
- Requirements: `.kiro/specs/pakistani-market-2026-enhancements/requirements.md`
