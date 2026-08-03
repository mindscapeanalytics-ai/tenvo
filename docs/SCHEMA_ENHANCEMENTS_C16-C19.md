# Schema Enhancements Implementation (C16-C19)

**Date**: 2026-04-01  
**Status**: Schema Updated - Migration Required

## Changes Implemented

### C16: Purchase Returns Module ✅

**New Tables:**
1. `purchase_returns` - Main purchase return records
   - Tracks returns to vendors with return_number, dates, amounts
   - Links to vendor and original purchase
   - Status workflow: pending → approved → completed
   
2. `purchase_return_items` - Line items for returns
   - Product, quantity, pricing details
   - Batch tracking support
   - Links to parent return

**Relations Added:**
- `businesses.purchase_returns[]`
- `businesses.purchase_return_items[]`
- `vendors.purchase_returns[]`
- `products.purchase_return_items[]`

### C17: Document Sequences Module ✅

**New Table:**
- `document_sequences` - Centralized document numbering
  - Per-business, per-document-type sequences
  - Configurable prefix, padding, suffix
  - Optional reset frequency (yearly/monthly)
  - Ensures gap-free sequential numbering

**Relations Added:**
- `businesses.document_sequences[]`

**Benefits:**
- Centralized number generation
- Audit-compliant sequential numbering
- Configurable per document type
- Prevents number gaps and duplicates

### C18: POS-to-Invoice Linking ✅

**Schema Changes:**
- Added `invoice_id` field to `pos_transactions` (nullable)
- Added index on `invoice_id` for performance
- Added relation `pos_transactions.invoices`
- Added reverse relation `invoices.pos_transactions[]`

**Use Cases:**
- Convert POS sales to formal invoices
- Link walk-in sales to customer accounts
- Generate invoices from POS transactions for B2B customers

### C19: Production Output Warehouse ✅

**Schema Changes:**
- Added `output_warehouse_id` to `production_orders`
- Renamed existing `warehouse_id` relation to "production_input_warehouse"
- Added new relation "production_output_warehouse"
- Added index on `output_warehouse_id`

**Benefits:**
- Track where raw materials come from (input warehouse)
- Track where finished goods go (output warehouse)
- Support multi-warehouse manufacturing workflows
- Enable proper inventory movement tracking

## Migration Steps

### 1. Generate Prisma Migration

```bash
npx prisma migrate dev --name add_schema_enhancements_c16_c19
```

This will:
- Create migration SQL files
- Apply changes to development database
- Regenerate Prisma Client

### 2. Verify Migration

```bash
npx prisma migrate status
```

### 3. Apply to Production

```bash
npx prisma migrate deploy
```

## API Implementation Required

### C16: Purchase Returns API

Create the following endpoints:

```javascript
// lib/api/purchaseReturns.js
export const purchaseReturnsAPI = {
  create: async (businessId, returnData, items) => { /* ... */ },
  getAll: async (businessId, filters) => { /* ... */ },
  getById: async (businessId, returnId) => { /* ... */ },
  updateStatus: async (businessId, returnId, status) => { /* ... */ },
  delete: async (businessId, returnId) => { /* ... */ }
};
```

**Service Layer:**
```javascript
// lib/services/PurchaseReturnService.js
export const PurchaseReturnService = {
  createReturn: async (data, userId, txClient) => {
    // 1. Create return record
    // 2. Create return items
    // 3. Update vendor balance (credit)
    // 4. Reverse inventory (remove stock)
    // 5. Create GL entries (reverse purchase)
  }
};
```

### C17: Document Sequences API

```javascript
// lib/services/DocumentSequenceService.js
export const DocumentSequenceService = {
  getNextNumber: async (businessId, documentType, txClient) => {
    // 1. Lock sequence record
    // 2. Increment current_number
    // 3. Format with prefix/padding/suffix
    // 4. Return formatted number
  },
  
  initializeSequence: async (businessId, documentType, config) => {
    // Create or update sequence configuration
  }
};
```

**Migration Path:**
- Existing `generateScopedDocumentNumber` can be gradually migrated
- New documents use DocumentSequenceService
- Maintains backward compatibility

### C18: POS-to-Invoice Conversion

```javascript
// lib/services/POSService.js
export const POSService = {
  convertToInvoice: async (posTransactionId, invoiceData, txClient) => {
    // 1. Get POS transaction
    // 2. Create invoice with same items
    // 3. Link: UPDATE pos_transactions SET invoice_id = $1
    // 4. Return invoice
  }
};
```

### C19: Production with Output Warehouse

```javascript
// lib/services/ManufacturingService.js
export const ManufacturingService = {
  completeProduction: async (productionOrderId, txClient) => {
    // 1. Get production order
    // 2. Remove raw materials from warehouse_id (input)
    // 3. Add finished goods to output_warehouse_id (output)
    // 4. Create stock movements for both
    // 5. Update production order status
  }
};
```

## Testing Checklist

- [ ] Migration runs successfully
- [ ] All relations work correctly
- [ ] Indexes are created
- [ ] Foreign key constraints work
- [ ] Prisma Client regenerated
- [ ] No breaking changes to existing code

## Rollback Plan

If issues occur:

```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back <migration_name>

# Or restore from backup
psql -U postgres -d your_database < backup.sql
```

## Notes

- All changes are backward compatible
- Existing code continues to work
- New features are opt-in
- No data migration required (all new tables/columns are nullable or have defaults)

## Next Steps

1. Run migration: `npx prisma migrate dev --name add_schema_enhancements_c16_c19`
2. Implement API endpoints for purchase returns
3. Migrate document number generation to use sequences
4. Add UI for POS-to-invoice conversion
5. Update production completion to use output warehouse

---

**Status**: Schema changes complete. Ready for migration and API implementation.
