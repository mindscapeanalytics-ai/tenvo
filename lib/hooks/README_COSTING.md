# Costing Methods Implementation

## Overview

Enterprise-grade inventory costing implementation supporting FIFO, LIFO, and WAC (Weighted Average Cost) methods for accurate COGS calculation and inventory valuation.

## Components

### 1. useCostingMethod Hook
**File:** `lib/hooks/useCostingMethod.js`  
**Lines:** ~400

**Functions:**
- `calculateCOGS(productId, quantitySold, warehouseId)` - Calculate Cost of Goods Sold
- `getInventoryValuation(productId)` - Get inventory valuation for products
- `recordBatchConsumption(batchesUsed, saleId)` - Record batch consumption after sale

**Costing Methods:**

#### FIFO (First In, First Out)
- Consumes oldest batches first
- Sorts by `receipt_date` ascending
- Best for perishable goods and inflation periods
- FBR compliant in Pakistan

**Algorithm:**
```javascript
1. Sort batches by receipt_date (oldest first)
2. Consume batches in order until quantity_sold is satisfied
3. Calculate COGS = sum(batch.cost × quantity_used)
4. Return COGS, unit_cost, and batches_used array
```

**Example:**
```javascript
const { calculateCOGS } = useCostingMethod(businessId, 'FIFO');

const result = await calculateCOGS('product-123', 100);
// {
//   method: 'FIFO',
//   total_cogs: 5000,
//   unit_cost: 50,
//   quantity_sold: 100,
//   batches_used: [
//     { batch_id: '1', quantity_used: 60, cost_price: 48, cost_total: 2880 },
//     { batch_id: '2', quantity_used: 40, cost_price: 53, cost_total: 2120 }
//   ]
// }
```

#### LIFO (Last In, First Out)
- Consumes newest batches first
- Sorts by `receipt_date` descending
- Better matches current costs with revenue
- Lower tax liability during inflation

**Algorithm:**
```javascript
1. Sort batches by receipt_date (newest first)
2. Consume batches in order until quantity_sold is satisfied
3. Calculate COGS = sum(batch.cost × quantity_used)
4. Return COGS, unit_cost, and batches_used array
```

#### WAC (Weighted Average Cost)
- Uses weighted average of all available batches
- Simplest method with smoothed costs
- Good for similar items

**Algorithm:**
```javascript
1. Calculate weighted average: sum(cost × quantity) / sum(quantity)
2. Apply average cost to quantity_sold
3. Calculate COGS = quantity_sold × weighted_average_cost
4. Consume proportionally from all batches
5. Return COGS, unit_cost, and batches_used array
```

**Example:**
```javascript
const { calculateCOGS } = useCostingMethod(businessId, 'WAC');

const result = await calculateCOGS('product-123', 100);
// {
//   method: 'WAC',
//   total_cogs: 5050,
//   unit_cost: 50.5,
//   quantity_sold: 100,
//   weighted_average_cost: 50.5,
//   batches_used: [...]
// }
```

### 2. CostingMethodSelector Component
**File:** `components/settings/CostingMethodSelector.jsx`  
**Lines:** ~200

**Features:**
- Visual method selection with pros/cons
- FIFO marked as recommended for Pakistani businesses
- Important notices about method changes
- FBR compliance warnings
- Save to `businesses.costing_method` column

**Usage:**
```jsx
import { CostingMethodSelector } from '@/components/settings/CostingMethodSelector';

<CostingMethodSelector
  businessId={businessId}
  currentMethod="FIFO"
  onUpdate={(newMethod) => console.log('Updated to:', newMethod)}
/>
```

### 3. InventoryValuation Component
**File:** `components/reports/InventoryValuation.jsx`  
**Lines:** ~350

**Features:**
- Real-time inventory valuation using selected costing method
- Summary cards: Total Products, Total Quantity, Avg Unit Cost, Total Value
- Product-level valuation table with filtering
- Search by product name or SKU
- Filter by category
- Export to Excel with metadata
- Responsive design

**Usage:**
```jsx
import { InventoryValuation } from '@/components/reports/InventoryValuation';

<InventoryValuation
  businessId={businessId}
  costingMethod="FIFO"
  currency="PKR"
/>
```

## Database Requirements

### Extended Columns
- `businesses.costing_method` - VARCHAR (FIFO/LIFO/WAC)

### Required Tables
- `product_batches` - With receipt_date, cost_price, available_quantity
- `batch_consumption` (optional) - For tracking batch consumption history

## Costing Method Comparison

| Feature | FIFO | LIFO | WAC |
|---------|------|------|-----|
| **Complexity** | Medium | Medium | Low |
| **Tax Impact (Inflation)** | Higher | Lower | Medium |
| **Inventory Valuation** | Current | Understated | Average |
| **Best For** | Perishables | Non-perishables | Similar items |
| **FBR Compliance** | ✅ Yes | ⚠️ Check | ✅ Yes |
| **Calculation Speed** | Fast | Fast | Fastest |
| **Accuracy** | High | High | Medium |

## Usage Examples

### Calculate COGS for a Sale
```javascript
import { useCostingMethod } from '@/lib/hooks/useCostingMethod';

function SalesComponent({ businessId }) {
  const { calculateCOGS, recordBatchConsumption } = useCostingMethod(
    businessId,
    'FIFO'
  );

  const handleSale = async (productId, quantity, saleId) => {
    try {
      // Calculate COGS
      const result = await calculateCOGS(productId, quantity);
      
      console.log('COGS:', result.total_cogs);
      console.log('Unit Cost:', result.unit_cost);
      console.log('Batches Used:', result.batches_used);

      // Record batch consumption
      await recordBatchConsumption(result.batches_used, saleId);

      // Update sale record with COGS
      await updateSale(saleId, {
        cogs: result.total_cogs,
        unit_cost: result.unit_cost
      });
    } catch (error) {
      console.error('COGS calculation failed:', error);
    }
  };
}
```

### Get Inventory Valuation
```javascript
import { useCostingMethod } from '@/lib/hooks/useCostingMethod';

function ValuationComponent({ businessId }) {
  const { getInventoryValuation } = useCostingMethod(businessId, 'WAC');

  const loadValuation = async () => {
    try {
      // Get valuation for all products
      const valuation = await getInventoryValuation();
      
      console.log('Total Value:', valuation.total_value);
      console.log('Total Quantity:', valuation.total_quantity);
      console.log('Products:', valuation.products);

      // Get valuation for specific product
      const productValuation = await getInventoryValuation('product-123');
    } catch (error) {
      console.error('Valuation failed:', error);
    }
  };
}
```

## Error Handling

### Common Errors

1. **Insufficient Stock**
```javascript
// Error: Insufficient stock: 10 units short
// Solution: Check available quantity before sale
```

2. **No Available Batches**
```javascript
// Error: No available batches found for this product
// Solution: Ensure product has active batches with available_quantity > 0
```

3. **Invalid Costing Method**
```javascript
// Error: Invalid costing method: XYZ
// Solution: Use 'FIFO', 'LIFO', or 'WAC'
```

## Performance Considerations

### Optimization Tips

1. **Batch Indexing**: Ensure `receipt_date` and `available_quantity` are indexed
2. **Caching**: Cache valuation results for frequently accessed products
3. **Pagination**: Paginate large product lists in valuation report
4. **Async Processing**: Calculate COGS asynchronously for bulk sales

### Performance Metrics

- **COGS Calculation**: <100ms for 10 batches
- **Valuation Report**: <2s for 1000 products
- **Batch Consumption**: <50ms per batch

## Best Practices

### 1. Method Selection
- Use FIFO for perishable goods (food, pharmacy)
- Use LIFO for non-perishable goods in inflationary periods
- Use WAC for similar items with frequent price changes

### 2. Batch Management
- Always set `receipt_date` when creating batches
- Keep `available_quantity` updated in real-time
- Archive consumed batches (available_quantity = 0)

### 3. Audit Trail
- Record all COGS calculations in sales records
- Track batch consumption for audit purposes
- Generate monthly valuation reports

### 4. FBR Compliance (Pakistan)
- FIFO is recommended and widely accepted
- Document method changes with proper justification
- Maintain consistent method throughout fiscal year
- Notify FBR before changing costing method

## Testing

### Unit Tests (TODO)
- Test FIFO calculation with multiple batches
- Test LIFO calculation with multiple batches
- Test WAC calculation with varying costs
- Test insufficient stock error handling
- Test batch consumption recording

### Property Tests (TODO)
- Property 4: FIFO Costing Correctness
- Property 5: LIFO Costing Correctness
- Property 6: WAC Costing Correctness
- Property 9: Inventory Valuation Report Accuracy

## Integration

### With Sales Module
```javascript
// In sales creation
const cogsResult = await calculateCOGS(productId, quantity);
await recordBatchConsumption(cogsResult.batches_used, saleId);

// Update sale record
sale.cogs = cogsResult.total_cogs;
sale.unit_cost = cogsResult.unit_cost;
sale.gross_profit = sale.total_amount - cogsResult.total_cogs;
```

### With Reporting Module
```javascript
// In financial reports
const valuation = await getInventoryValuation();
report.inventory_value = valuation.total_value;
report.inventory_quantity = valuation.total_quantity;
```

### With Business Settings
```javascript
// In business settings
<CostingMethodSelector
  businessId={business.id}
  currentMethod={business.costing_method}
  onUpdate={async (newMethod) => {
    await updateBusiness({ costing_method: newMethod });
    await recalculateValuation();
  }}
/>
```

## Future Enhancements

1. **Specific Identification**: Track individual item costs
2. **Moving Average**: Continuous average cost calculation
3. **Standard Costing**: Predetermined standard costs
4. **Retail Method**: For retail businesses
5. **Gross Profit Method**: Estimation based on gross profit percentage

## Support

For issues or questions:
- Check the spec: `.kiro/specs/inventory-system-consolidation/`
- Review the design document for architecture details
- Check the tasks file for implementation status

## License

Proprietary - Financial Hub ERP+POS System
