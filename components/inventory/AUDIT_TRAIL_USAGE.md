# AuditTrailViewer Usage Guide

## Overview

The `AuditTrailViewer` component provides a comprehensive audit trail interface for stock adjustments with advanced filtering and export capabilities.

## Basic Usage

### Standalone Component

```jsx
import { AuditTrailViewer } from '@/components/inventory';

function InventoryAuditPage() {
  return (
    <div className="container mx-auto p-6">
      <AuditTrailViewer
        businessId="your-business-id"
        currency="PKR"
      />
    </div>
  );
}
```

### Product-Specific Audit Trail

```jsx
import { AuditTrailViewer } from '@/components/inventory';

function ProductAuditTab({ product, businessId }) {
  return (
    <AuditTrailViewer
      businessId={businessId}
      productId={product.id}
      currency="PKR"
    />
  );
}
```

### Warehouse-Specific Audit Trail

```jsx
import { AuditTrailViewer } from '@/components/inventory';

function WarehouseAuditView({ warehouse, businessId }) {
  return (
    <AuditTrailViewer
      businessId={businessId}
      warehouseId={warehouse.id}
      currency="PKR"
    />
  );
}
```

## Integration with StockAdjustmentManager

```jsx
import { useState } from 'react';
import { StockAdjustmentManager, AuditTrailViewer } from '@/components/inventory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function InventoryManagement({ businessId, products, warehouses }) {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleAdjustmentComplete = () => {
    // Trigger audit trail refresh
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <Tabs defaultValue="adjustments">
      <TabsList>
        <TabsTrigger value="adjustments">Stock Adjustments</TabsTrigger>
        <TabsTrigger value="audit">Audit Trail</TabsTrigger>
      </TabsList>
      
      <TabsContent value="adjustments">
        <StockAdjustmentManager
          businessId={businessId}
          products={products}
          warehouses={warehouses}
          onAdjustmentComplete={handleAdjustmentComplete}
        />
      </TabsContent>
      
      <TabsContent value="audit">
        <AuditTrailViewer
          key={refreshKey}
          businessId={businessId}
          currency="PKR"
        />
      </TabsContent>
    </Tabs>
  );
}
```

## Features

### 1. Comprehensive Filtering

The component provides multiple filter options:

- **Date Range**: Filter by start and end dates
- **User**: Filter by the user who made the adjustment
- **Product**: Filter by specific product
- **Transaction Type**: Filter by increase, decrease, or correction
- **Reason Code**: Filter by adjustment reason (damage, theft, count_error, etc.)
- **Search**: Free-text search across product names, SKUs, and notes

### 2. Export Capabilities

#### PDF Export
- Generates a formatted PDF with all audit trail data
- Includes header with generation date and record count
- Uses wine color theme for headers
- Optimized column widths for readability

#### Excel Export
- Exports to XLSX format with all fields
- Includes metadata sheet with report information
- Properly formatted columns with appropriate widths
- Includes all audit fields: timestamp, user, action, before/after values, reason, IP address, user agent

### 3. Real-Time Statistics

The component displays four key metrics:
- **Total Records**: Count of all audit records
- **Increases**: Count of stock increase adjustments
- **Decreases**: Count of stock decrease adjustments
- **Pending Approval**: Count of adjustments awaiting approval

### 4. Detailed Table View

The audit trail table displays:
- **Timestamp**: When the adjustment was made
- **User**: Who made the adjustment (with user icon)
- **Action**: Type of adjustment (increase/decrease/correction) with color-coded badge
- **Product**: Product name and SKU (with package icon)
- **Before**: Quantity before adjustment
- **After**: Quantity after adjustment
- **Reason**: Reason code and notes
- **IP Address**: IP address of the user
- **Status**: Approval status (pending/approved/rejected) with color-coded badge

## Styling and Theming

The component uses the wine color scheme consistent with the rest of the inventory system:

```jsx
// Wine color for primary actions
className="bg-wine hover:bg-wine/90"

// Status badges
- Green: Approved, Increase
- Red: Rejected, Decrease
- Yellow: Pending
- Blue: Correction
```

## Mobile Responsiveness

The component is fully responsive:
- **Desktop**: Full table view with all columns
- **Tablet**: Responsive grid for filters (2 columns)
- **Mobile**: Single column layout with horizontal scroll for table

## Performance Considerations

- **Lazy Loading**: Filters are only shown when needed
- **Debounced Search**: Search input is debounced to reduce API calls
- **Efficient Filtering**: Client-side filtering for search term
- **Optimized Queries**: Server-side filtering for date range, user, product, etc.

## Error Handling

The component handles various error scenarios:
- Network errors: Shows toast notification
- Empty results: Displays helpful message with suggestions
- Loading states: Shows spinner during data fetch
- Export errors: Catches and displays error messages

## Accessibility

- Semantic HTML with proper table structure
- ARIA labels for icons and buttons
- Keyboard navigation support
- Screen reader friendly

## Requirements Validation

The component validates the following requirements from the spec:

- **Requirement 6.1**: Records user ID, timestamp, and IP address for every transaction
- **Requirement 6.2**: Records before and after values for all stock adjustments
- **Requirement 6.3**: Records reason codes and notes for all manual adjustments
- **Requirement 6.5**: Provides audit trail search by date range, user, product, and transaction type
- **Requirement 6.6**: Generates audit trail reports in PDF and Excel formats

## Testing

Unit tests are provided in `__tests__/AuditTrailViewer.test.js`:

```bash
npm test -- components/inventory/__tests__/AuditTrailViewer.test.js --run
```

All 20 tests should pass, validating:
- Filter options
- Table columns
- Export functionality
- Audit record structure
- Badge color mapping
- Summary statistics
- Search functionality
- Export data structures

## Future Enhancements

Potential improvements for future versions:
- Real-time updates using Supabase Realtime
- Advanced filtering with multiple conditions
- Custom date range presets (Last 7 days, Last 30 days, etc.)
- Bulk export with pagination
- Audit trail comparison between two time periods
- Graphical visualization of adjustment trends
- Email notifications for specific audit events

## Support

For issues or questions:
1. Check the spec: `.kiro/specs/inventory-system-consolidation/`
2. Review the design document for architecture details
3. Check the tasks file for implementation status
4. Run the unit tests to verify functionality
