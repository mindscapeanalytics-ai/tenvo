# TaxCalculationsWidget Usage Guide

## Overview

The `TaxCalculationsWidget` is a standalone, reusable dashboard widget that displays PST (Provincial Sales Tax) and FST (Federal Sales Tax) calculations with payment status tracking.

## Features

- Display PST and FST totals with rates
- Show tax liability by period
- Display tax payment status (paid vs pending)
- Quick action: "View Tax Reports"
- Real-time data updates (5-minute refresh interval)
- Loading and empty states
- Responsive design with glass-card styling

## Requirements

Validates Requirements: 6.7, 7.1, 7.2

## Installation

The widget is located at:
```
components/dashboard/widgets/TaxCalculationsWidget.jsx
```

## Basic Usage

```jsx
import { TaxCalculationsWidget } from '@/components/dashboard/widgets/TaxCalculationsWidget';

function MyDashboard() {
  return (
    <TaxCalculationsWidget
      businessId="business-123"
      currency="PKR"
      onViewDetails={(action) => console.log('Action:', action)}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `businessId` | string | Yes | - | Business ID for fetching tax data |
| `data` | object | No | null | Pre-loaded tax data (bypasses API fetch) |
| `currency` | string | No | 'PKR' | Currency code for formatting amounts |
| `onViewDetails` | function | No | - | Callback when user clicks "View Detailed Calculations" |

## Data Structure

When providing custom data via the `data` prop:

```javascript
{
  totalSales: 2450000,
  taxableAmount: 2450000,
  pst: {
    rate: 17,
    amount: 416500
  },
  fst: {
    rate: 1,
    amount: 24500
  },
  totalTax: 441000,
  taxPaid: 400000,
  taxPending: 41000,
  nextFilingDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)
}
```

## Usage in AccountantDashboard

The widget is integrated into the AccountantDashboard template:

```jsx
import { TaxCalculationsWidget } from '@/components/dashboard/widgets/TaxCalculationsWidget';

export function AccountantDashboard({ businessId, currency, onQuickAction }) {
  const taxCalculations = useMemo(() => ({
    // ... tax data
  }), []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <TaxCalculationsWidget
        businessId={businessId}
        data={taxCalculations}
        currency={currency}
        onViewDetails={(action) => onQuickAction?.(action)}
      />
    </div>
  );
}
```

## Styling

The widget uses:
- Glass-card styling (`glass-card` class)
- Wine color scheme with purple accents
- Gradient backgrounds for tax breakdown sections
- Responsive grid layout

## States

### Loading State
Displays animated skeleton loaders while fetching data.

### Empty State
Shows a calculator icon with "No tax data available" message when no data exists.

### Data State
Displays full tax breakdown with:
- Taxable sales amount
- PST calculation (with rate)
- FST calculation (with rate)
- Total tax liability
- Paid vs Pending breakdown
- Last updated timestamp

## Callbacks

### onViewDetails

Called when user clicks the "View Detailed Calculations" button:

```javascript
onViewDetails={(action) => {
  // action will be 'view-tax-details'
  console.log('User wants to view:', action);
  // Navigate to tax reports page or open modal
}}
```

## Auto-Refresh

The widget automatically refreshes data every 5 minutes when not provided with static data via the `data` prop.

## Localization

The widget supports multiple languages through the `useLanguage` hook and `translations` object:

- English (en)
- Urdu (ur)

Translation keys used:
- `tax_calculations`
- `pst_fst_calculations`
- `taxable_sales`
- `pst`
- `fst`
- `total_tax_liability`
- `paid`
- `pending`
- `view_detailed_calculations`
- `last_updated`
- `no_tax_data`

## Example: Custom Data

```jsx
<TaxCalculationsWidget
  businessId="biz-456"
  currency="USD"
  data={{
    totalSales: 50000,
    taxableAmount: 50000,
    pst: { rate: 8, amount: 4000 },
    fst: { rate: 2, amount: 1000 },
    totalTax: 5000,
    taxPaid: 3000,
    taxPending: 2000,
    nextFilingDate: new Date('2024-04-15')
  }}
  onViewDetails={(action) => router.push('/tax-reports')}
/>
```

## Integration with Other Dashboards

The widget can be used in any dashboard template:

```jsx
// In OwnerDashboard
<TaxCalculationsWidget businessId={businessId} currency={currency} />

// In ManagerDashboard
<TaxCalculationsWidget businessId={businessId} currency={currency} />

// In any custom dashboard
<TaxCalculationsWidget businessId={businessId} currency={currency} />
```

## Accessibility

- Semantic HTML structure
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliant

## Performance

- Lazy loading support
- Memoized calculations
- Efficient re-renders
- Optimized for mobile devices

## Related Components

- `FBRComplianceWidget` - FBR compliance status and filing deadlines
- `AccountantDashboard` - Full accountant dashboard template
- `EnhancedDashboard` - Base dashboard component

## Notes

- The widget displays mock data when no API is available
- Tax rates (PST 17%, FST 1%) are configurable via the data prop
- The widget is fully responsive and works on all screen sizes
- Glass-card styling requires the appropriate CSS classes to be defined
