# Stock Validation Utilities - Usage Guide

## Overview

The stock validation utilities provide overselling prevention by checking available stock across all warehouse locations before allowing sales or reservations. This implements **Requirement 4.6** from the inventory system consolidation spec.

## Key Features

- ✅ Multi-location stock aggregation
- ✅ Reserved quantity consideration
- ✅ User-friendly error messages
- ✅ Comprehensive stock breakdown by location
- ✅ Input validation and error handling

## Functions

### 1. `checkAvailableStock(productId, businessId, requestedQuantity)`

Checks if sufficient stock is available across all locations for a product.

**Parameters:**
- `productId` (string): Product UUID
- `businessId` (string): Business UUID
- `requestedQuantity` (number): Quantity requested for sale/reservation

**Returns:**
```javascript
{
  success: boolean,              // Operation succeeded
  available: boolean,            // Sufficient stock available
  totalAvailable: number,        // Total available across all locations
  totalReserved: number,         // Total reserved across all locations
  requestedQuantity: number,     // The requested quantity
  shortage: number,              // Shortage amount (0 if available)
  locationBreakdown: Array,      // Stock breakdown by location
  message: string                // User-friendly message
}
```

**Example Usage:**

```javascript
import { checkAvailableStock } from '@/lib/utils/stockValidation';

// In a sales component
async function handleSale(productId, quantity) {
  const result = await checkAvailableStock(
    productId,
    businessId,
    quantity
  );

  if (!result.available) {
    // Show error to user
    toast.error(result.message);
    // "Insufficient stock. Available: 30, Requested: 50, Short by: 20"
    return;
  }

  // Proceed with sale
  await processSale(productId, quantity);
  toast.success(`Sale processed for ${quantity} units`);
}
```

**Location Breakdown Structure:**
```javascript
locationBreakdown: [
  {
    warehouseId: 'uuid',
    warehouseName: 'Main Warehouse',
    warehouseLocation: 'City A',
    quantity: 100,           // Total quantity
    reserved: 20,            // Reserved quantity
    available: 80            // Available = quantity - reserved
  },
  // ... more locations
]
```

### 2. `checkAvailableStockAtLocation(productId, businessId, warehouseId, requestedQuantity)`

Checks stock availability at a specific warehouse location.

**Parameters:**
- `productId` (string): Product UUID
- `businessId` (string): Business UUID
- `warehouseId` (string): Warehouse UUID
- `requestedQuantity` (number): Quantity requested

**Returns:**
```javascript
{
  success: boolean,
  available: boolean,
  availableQuantity: number,
  reservedQuantity: number,
  requestedQuantity: number,
  shortage: number,
  warehouseId: string,
  warehouseName: string,
  warehouseLocation: string,
  message: string
}
```

**Example Usage:**

```javascript
import { checkAvailableStockAtLocation } from '@/lib/utils/stockValidation';

// Check stock at specific warehouse before transfer
async function initiateTransfer(productId, fromWarehouseId, quantity) {
  const result = await checkAvailableStockAtLocation(
    productId,
    businessId,
    fromWarehouseId,
    quantity
  );

  if (!result.available) {
    toast.error(result.message);
    // "Insufficient stock at Main Warehouse. Available: 20, Requested: 50"
    return;
  }

  // Proceed with transfer
  await createStockTransfer(productId, fromWarehouseId, toWarehouseId, quantity);
}
```

### 3. `getStockSummary(productId, businessId)`

Gets comprehensive stock information across all locations without validation.

**Parameters:**
- `productId` (string): Product UUID
- `businessId` (string): Business UUID

**Returns:**
```javascript
{
  success: boolean,
  totalQuantity: number,        // Total quantity across all locations
  totalReserved: number,        // Total reserved across all locations
  totalAvailable: number,       // Total available across all locations
  locationCount: number,        // Number of locations
  locations: Array              // Detailed location information
}
```

**Location Structure:**
```javascript
locations: [
  {
    warehouseId: 'uuid',
    warehouseName: 'Main Warehouse',
    warehouseLocation: 'City A',
    isPrimary: true,
    quantity: 100,
    reserved: 20,
    available: 80,
    minStock: 10,
    maxStock: 200,
    isLowStock: false          // available <= minStock
  },
  // ... more locations
]
```

**Example Usage:**

```javascript
import { getStockSummary } from '@/lib/utils/stockValidation';

// Display stock information in product details
function ProductStockInfo({ productId }) {
  const [stockInfo, setStockInfo] = useState(null);

  useEffect(() => {
    async function loadStock() {
      const result = await getStockSummary(productId, businessId);
      if (result.success) {
        setStockInfo(result);
      }
    }
    loadStock();
  }, [productId]);

  if (!stockInfo) return <LoadingSpinner />;

  return (
    <div>
      <h3>Stock Summary</h3>
      <p>Total Available: {stockInfo.totalAvailable}</p>
      <p>Total Reserved: {stockInfo.totalReserved}</p>
      <p>Locations: {stockInfo.locationCount}</p>
      
      <h4>By Location:</h4>
      {stockInfo.locations.map(loc => (
        <div key={loc.warehouseId}>
          <strong>{loc.warehouseName}</strong>
          {loc.isPrimary && <Badge>Primary</Badge>}
          <p>Available: {loc.available}</p>
          {loc.isLowStock && <Alert>Low Stock!</Alert>}
        </div>
      ))}
    </div>
  );
}
```

## Integration Examples

### Sales/Invoice Component

```javascript
import { checkAvailableStock } from '@/lib/utils/stockValidation';

function InvoiceLineItem({ product, quantity, onQuantityChange }) {
  const [stockError, setStockError] = useState(null);

  const validateStock = async (newQuantity) => {
    const result = await checkAvailableStock(
      product.id,
      businessId,
      newQuantity
    );

    if (!result.available) {
      setStockError(result.message);
      return false;
    }

    setStockError(null);
    return true;
  };

  const handleQuantityChange = async (newQuantity) => {
    const isValid = await validateStock(newQuantity);
    if (isValid) {
      onQuantityChange(newQuantity);
    }
  };

  return (
    <div>
      <Input
        type="number"
        value={quantity}
        onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
      />
      {stockError && (
        <Alert variant="destructive">{stockError}</Alert>
      )}
    </div>
  );
}
```

### Order Processing

```javascript
import { checkAvailableStock } from '@/lib/utils/stockValidation';

async function processOrder(orderItems) {
  // Validate all items before processing
  const validationResults = await Promise.all(
    orderItems.map(item =>
      checkAvailableStock(item.productId, businessId, item.quantity)
    )
  );

  // Check if any items are unavailable
  const unavailableItems = validationResults
    .map((result, index) => ({ result, item: orderItems[index] }))
    .filter(({ result }) => !result.available);

  if (unavailableItems.length > 0) {
    // Show detailed error for each unavailable item
    const errorMessages = unavailableItems.map(({ result, item }) =>
      `${item.productName}: ${result.message}`
    );
    
    toast.error(
      <div>
        <p>Cannot process order:</p>
        <ul>
          {errorMessages.map((msg, i) => <li key={i}>{msg}</li>)}
        </ul>
      </div>
    );
    return;
  }

  // All items available, proceed with order
  await createOrder(orderItems);
  toast.success('Order processed successfully');
}
```

### Stock Reservation

```javascript
import { checkAvailableStock } from '@/lib/utils/stockValidation';

async function reserveStock(productId, quantity, customerId) {
  // Check availability
  const result = await checkAvailableStock(productId, businessId, quantity);

  if (!result.available) {
    return {
      success: false,
      error: result.message,
      availableQuantity: result.totalAvailable
    };
  }

  // Create reservation
  const reservation = await createStockReservation({
    productId,
    quantity,
    customerId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  });

  return {
    success: true,
    reservation,
    message: `Reserved ${quantity} units for customer`
  };
}
```

## Error Handling

All functions return a `success` boolean and an `error` string when operations fail:

```javascript
const result = await checkAvailableStock(productId, businessId, quantity);

if (!result.success) {
  console.error('Stock validation failed:', result.error);
  // Handle error appropriately
  return;
}

// Proceed with operation
```

## Common Error Messages

- **Input Validation:**
  - "Product ID and Business ID are required"
  - "Requested quantity must be a positive number"

- **Stock Availability:**
  - "No stock available at any location"
  - "Insufficient stock. Available: X, Requested: Y, Short by: Z"
  - "No stock at this location"

- **Database Errors:**
  - "Database error: [error message]"
  - "Unexpected error: [error message]"

## Best Practices

1. **Always validate before sale/reservation:**
   ```javascript
   // ✅ Good
   const validation = await checkAvailableStock(productId, businessId, qty);
   if (validation.available) {
     await processSale();
   }

   // ❌ Bad - no validation
   await processSale(); // May oversell!
   ```

2. **Show detailed error messages:**
   ```javascript
   // ✅ Good - user knows exactly what's wrong
   toast.error(result.message);
   // "Insufficient stock. Available: 30, Requested: 50, Short by: 20"

   // ❌ Bad - generic message
   toast.error("Not enough stock");
   ```

3. **Use location breakdown for insights:**
   ```javascript
   if (!result.available) {
     console.log('Stock by location:', result.locationBreakdown);
     // Helps identify which locations have stock
   }
   ```

4. **Handle async operations properly:**
   ```javascript
   // ✅ Good - await the validation
   const result = await checkAvailableStock(...);
   if (result.available) { /* proceed */ }

   // ❌ Bad - not awaiting
   const result = checkAvailableStock(...); // Returns Promise!
   if (result.available) { /* will fail */ }
   ```

## Testing

The utilities include comprehensive unit tests. Run them with:

```bash
npm test -- lib/utils/__tests__/stockValidation.test.js
```

Test coverage includes:
- ✅ Multi-location aggregation
- ✅ Reserved quantity handling
- ✅ Input validation
- ✅ Error handling
- ✅ Edge cases (exact match, no stock, etc.)

## Related Files

- **Implementation:** `lib/utils/stockValidation.js`
- **Tests:** `lib/utils/__tests__/stockValidation.test.js`
- **Supabase Client:** `lib/supabase/client.js`
- **Database Schema:** `supabase/migrations/020_enterprise_inventory_features.sql`
- **Multi-Location Hook:** `lib/hooks/useMultiLocationSync.js`

## Spec Reference

This implementation satisfies:
- **Requirement 4.6:** The system must prevent overselling by checking total available stock across all locations before allowing a sale
- **Design Property 13:** Overselling Prevention - For any sale attempt of quantity Q, if the sum of available quantities across all locations is less than Q, the sale should be rejected
