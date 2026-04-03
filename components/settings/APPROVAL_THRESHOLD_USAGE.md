# Approval Threshold Configuration - Usage Guide

## Overview

The `ApprovalThresholdConfig` component allows businesses to configure the monetary threshold above which stock adjustments require manager approval. This is a critical control mechanism for inventory management.

## Component Location

```
components/settings/ApprovalThresholdConfig.jsx
```

## Purpose

- Configure approval threshold for stock adjustments
- Provide visual feedback on how the threshold works
- Display best practices and calculation examples
- Save threshold to `businesses.approval_threshold_amount` column

## Usage

### Basic Usage

```jsx
import { ApprovalThresholdConfig } from '@/components/settings/ApprovalThresholdConfig';

function BusinessSettings() {
  const { business, updateBusiness } = useBusiness();

  const handleThresholdUpdate = (newThreshold) => {
    updateBusiness({ 
      ...business, 
      approval_threshold_amount: newThreshold 
    });
  };

  return (
    <ApprovalThresholdConfig
      businessId={business.id}
      currentThreshold={business.approval_threshold_amount || 10000}
      onUpdate={handleThresholdUpdate}
    />
  );
}
```

### Integration with SettingsManager

Add to the "Financials" or "Compliance" tab in `SettingsManager.jsx`:

```jsx
<TabsContent value="financials" className="space-y-4 pt-4">
  {/* Existing financial settings */}
  
  {/* Add Approval Threshold Config */}
  <ApprovalThresholdConfig
    businessId={business?.id}
    currentThreshold={business?.approval_threshold_amount || 10000}
    onUpdate={(newThreshold) => {
      updateBusiness({ 
        ...business, 
        approval_threshold_amount: newThreshold 
      });
    }}
  />
</TabsContent>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `businessId` | string | Yes | - | Business ID for saving the threshold |
| `currentThreshold` | number | No | 10000 | Current approval threshold amount |
| `onUpdate` | function | No | - | Callback function called after successful update |

## Features

### 1. Currency Formatting
- Displays threshold in PKR format
- Shows formatted preview of current threshold
- Input accepts only numeric values

### 2. Validation
- Ensures positive numbers only
- Prevents invalid input (letters, special characters)
- Shows error messages for invalid values

### 3. Visual Examples
- Shows how threshold works with real examples
- Displays "below threshold" and "above threshold" scenarios
- Calculates example values based on current threshold

### 4. Calculation Info
- Explains adjustment value calculation formula
- Provides concrete example: Quantity × Cost Price
- Helps users understand when approval is triggered

### 5. Best Practices
- Recommends typical threshold ranges (PKR 5,000 - 50,000)
- Explains trade-offs between control and speed
- Suggests quarterly review

## How It Works

### Adjustment Value Calculation

```
Adjustment Value = |Quantity Change| × Product Cost Price
```

**Example:**
- Product: Widget (Cost Price: PKR 200)
- Adjustment: -50 units (decrease)
- Adjustment Value: 50 × 200 = PKR 10,000

### Approval Logic

```javascript
if (adjustmentValue > approvalThreshold) {
  // Requires approval
  adjustment.requires_approval = true;
  adjustment.approval_status = 'pending';
} else {
  // Auto-approved
  adjustment.requires_approval = false;
  adjustment.approval_status = 'approved';
}
```

## Database Schema

The component updates the `businesses` table:

```sql
ALTER TABLE businesses
ADD COLUMN approval_threshold_amount DECIMAL(15,2) DEFAULT 10000.00;
```

## Integration Points

### 1. Stock Adjustment Manager

The threshold is used in `StockAdjustmentManager` component:

```jsx
import { useStockAdjustment } from '@/lib/hooks/useStockAdjustment';

function StockAdjustmentManager({ product, businessId }) {
  const { 
    createAdjustment, 
    approvalThreshold // Fetched from business settings
  } = useStockAdjustment(product.id, businessId);

  // Adjustment value calculation
  const adjustmentValue = Math.abs(quantityChange) * product.cost_price;
  const requiresApproval = adjustmentValue > approvalThreshold;

  // Display approval indicator
  {requiresApproval && (
    <Badge variant="warning">Requires Approval</Badge>
  )}
}
```

### 2. Approval Workflow

When an adjustment requires approval:

1. Status set to 'pending'
2. Notification sent to approvers
3. Adjustment appears in approval queue
4. Manager can approve/reject with comments

## Testing

Run tests:

```bash
npm test components/settings/__tests__/ApprovalThresholdConfig.test.js
```

Test coverage includes:
- Rendering with default values
- Input validation (numeric only)
- Save functionality
- Error handling
- Cancel functionality
- Best practices display

## Typical Threshold Values

| Business Size | Recommended Threshold |
|---------------|----------------------|
| Small (1-5 employees) | PKR 5,000 - 10,000 |
| Medium (6-20 employees) | PKR 10,000 - 25,000 |
| Large (21+ employees) | PKR 25,000 - 50,000 |
| Enterprise | PKR 50,000+ |

## Requirements Validation

This component implements:

- **Requirement 5.1**: "THE Inventory_System SHALL allow configuration of approval threshold amount at the business level"

## Related Components

- `StockAdjustmentManager` - Uses the threshold for approval logic
- `useStockAdjustment` hook - Fetches threshold from business settings
- `CostingMethodSelector` - Similar settings component pattern
- `PakistaniTaxConfig` - Similar settings component pattern

## Future Enhancements

Potential improvements:
1. Multi-level thresholds (e.g., >10K = manager, >50K = director)
2. Category-specific thresholds
3. Time-based thresholds (higher during business hours)
4. Threshold history and audit trail
5. Threshold recommendations based on business data

## Support

For issues or questions:
- Check the test file for usage examples
- Review `StockAdjustmentManager` for integration
- See `useStockAdjustment` hook for backend logic
