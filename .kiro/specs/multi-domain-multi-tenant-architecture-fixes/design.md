# Multi-Domain Multi-Tenant Architecture Fixes Design

## Overview

This design addresses 19 critical architectural gaps and conflicts in a multi-domain, multi-tenant ERP system managing 50+ Prisma models across 41 business domains. The issues span security vulnerabilities, data integrity problems, broken integration pipelines, and frontend defects that compromise system security, financial accuracy, and operational reliability.

The fixes are organized into five categories:
1. **Security Hardening** (2 critical issues): SQL injection and cross-tenant data leaks
2. **Data Integrity** (3 high-priority issues): Stock pipeline bypasses, hard-deletes, missing foreign keys
3. **Integration Pipeline Fixes** (5 high-priority issues): POS→Finance, Restaurant→Inventory, Payroll→GL, Expenses→Payments
4. **Frontend Wiring** (5 medium-priority issues): Runtime crashes, hardcoded values, empty data pipelines
5. **Schema Enhancements** (4 structural gaps): Missing models and foreign keys

This is a comprehensive architectural improvement project rather than a single bug fix. Each issue has its own bug condition, but they share common root causes: incomplete integration wiring, missing validation layers, and inconsistent transaction management patterns.

## Glossary

- **Bug_Condition (C)**: The condition that triggers each specific bug - varies per issue (SQL injection via unwhitelisted columns, cross-tenant queries without businessId filter, etc.)
- **Property (P)**: The desired behavior for each bug condition - proper validation, tenant isolation, complete integration pipelines
- **Preservation**: Existing functionality that must remain unchanged - all working integrations, RBAC enforcement, existing data operations
- **InventoryService**: Service in `lib/services/InventoryService.js` that handles stock operations with batch/serial/FIFO/ledger tracking
- **AccountingService**: Service in `lib/services/AccountingService.js` that manages GL entries and double-entry accounting
- **withGuard**: Middleware in `lib/rbac/serverGuard.js` that enforces authentication, authorization, and plan checks
- **DataContext**: React context providing business data and refresh functions
- **business_id**: Tenant isolation key present on all primary tables for multi-tenancy enforcement
- **Soft Delete**: Pattern using is_deleted and deleted_at columns instead of hard DELETE operations


## Bug Details

### Bug Condition

This project addresses 19 distinct bugs grouped into 5 categories. Each has its own bug condition:

**Category 1: Security Vulnerabilities**

C1. SQL Injection in updateBatchAction - The bug manifests when updateBatchAction receives user-controlled column names in the SET clause without whitelisting, allowing SQL injection.

**Formal Specification:**
```
FUNCTION isBugCondition_C1(input)
  INPUT: input of type { updates: Record<string, any> }
  OUTPUT: boolean
  
  RETURN Object.keys(input.updates).some(key => 
    NOT key IN ALLOWED_COLUMNS
  )
END FUNCTION

WHERE ALLOWED_COLUMNS = ['batch_number', 'manufacturing_date', 'expiry_date', 
                          'quantity', 'cost_price', 'mrp', 'notes', 'is_active']
```

C2. Cross-Tenant Data Leak in getProductVariantsAction - The bug manifests when querying product variants without businessId filtering, returning data across all tenants.

**Formal Specification:**
```
FUNCTION isBugCondition_C2(input)
  INPUT: input of type { productId: string, businessId: string }
  OUTPUT: boolean
  
  RETURN query.where.business_id IS NULL
         AND query.where.product_id == input.productId
END FUNCTION
```

**Category 2: Data Integrity Issues**

C3. POS Stock Deduction Bypasses Pipeline - The bug manifests when POS transactions directly decrement product.stock without calling InventoryService, bypassing batch/serial/FIFO/ledger/workflow pipeline.

**Formal Specification:**
```
FUNCTION isBugCondition_C3(input)
  INPUT: input of type POSTransaction
  OUTPUT: boolean
  
  RETURN input.items.forEach(item => 
    prisma.products.update({ data: { stock: { decrement: item.quantity } } })
  )
  AND NOT InventoryService.removeStock() called
  AND NOT stock_movements record created
  AND NOT inventory_ledger entry created
END FUNCTION
```


C4. Invoice Hard Delete - The bug manifests when invoices are deleted using hard DELETE instead of soft delete, destroying financial audit trail.

**Formal Specification:**
```
FUNCTION isBugCondition_C4(input)
  INPUT: input of type { invoiceId: string }
  OUTPUT: boolean
  
  RETURN prisma.invoices.delete({ where: { id: input.invoiceId } }) called
         AND NOT prisma.invoices.update({ data: { is_deleted: true } }) called
END FUNCTION
```

C5. Missing business_id on Child Tables - The bug manifests when child table records (purchase_items, pos_transaction_items, etc.) are created without business_id foreign key, preventing proper RLS enforcement.

**Formal Specification:**
```
FUNCTION isBugCondition_C5(input)
  INPUT: input of type ChildTableRecord
  OUTPUT: boolean
  
  RETURN input.table IN ['purchase_items', 'pos_transaction_items', 'pos_payments',
                         'pos_refund_items', 'restaurant_order_items', 'challan_items',
                         'credit_note_items', 'payroll_items', 'campaign_messages',
                         'segment_customers', 'price_list_items', 'promotion_products']
         AND input.schema.business_id IS NULL
END FUNCTION
```

**Category 3: Integration Failures**

C6. POS Transactions Don't Create Payment/GL Records - The bug manifests when POS transactions complete without creating payment records or GL entries, breaking financial reporting.

**Formal Specification:**
```
FUNCTION isBugCondition_C6(input)
  INPUT: input of type POSTransaction
  OUTPUT: boolean
  
  RETURN input.status == 'completed'
         AND NOT payments table record created
         AND NOT gl_entries records created (Cash debit, Revenue credit, Tax credit)
END FUNCTION
```

C7. Restaurant Orders Don't Deduct Inventory - The bug manifests when restaurant orders are placed without deducting ingredient inventory from stock.

**Formal Specification:**
```
FUNCTION isBugCondition_C7(input)
  INPUT: input of type RestaurantOrder
  OUTPUT: boolean
  
  RETURN input.items.forEach(item => 
    item.recipe.ingredients.forEach(ingredient =>
      NOT InventoryService.removeStock() called for ingredient
    )
  )
END FUNCTION
```


C8. Payroll GL Misposting - The bug manifests when payroll deductions are posted to SALES_TAX_PAYABLE account instead of PAYROLL_EXPENSE account.

**Formal Specification:**
```
FUNCTION isBugCondition_C8(input)
  INPUT: input of type PayrollRun
  OUTPUT: boolean
  
  RETURN AccountingService.createJournalEntry({
    entries: [{ accountType: 'SALES_TAX_PAYABLE', debit: input.totalNet }]
  })
  AND NOT accountType == 'PAYROLL_EXPENSE' OR 'PAYROLL_PAYABLE'
END FUNCTION
```

C9. adjustStockAction GL Posting Fails - The bug manifests when adjustStockAction releases database client before GL posting query completes, causing silent failures.

**Formal Specification:**
```
FUNCTION isBugCondition_C9(input)
  INPUT: input of type StockAdjustment
  OUTPUT: boolean
  
  RETURN client.release() called
         AND THEN AccountingService.recordBusinessTransaction() called with released client
END FUNCTION
```

C10. Expenses Don't Create Payment Records - The bug manifests when expenses are recorded without creating linked payment records, breaking cash flow tracking.

**Formal Specification:**
```
FUNCTION isBugCondition_C10(input)
  INPUT: input of type Expense
  OUTPUT: boolean
  
  RETURN expense created in expenses table
         AND NOT payment record created in payments table
         AND expense.payment_id IS NULL
END FUNCTION
```

**Category 4: Frontend Issues**

C11. handleStockTransfer Runtime Crash - The bug manifests when handleStockTransfer calls non-existent setProducts function, causing runtime crash.

**Formal Specification:**
```
FUNCTION isBugCondition_C11(input)
  INPUT: input of type StockTransferEvent
  OUTPUT: boolean
  
  RETURN setProducts() called
         AND setProducts IS NOT DEFINED in scope
END FUNCTION
```


C12. Dashboard Hardcoded Growth Percentages - The bug manifests when dashboard displays hardcoded growth percentages (8.2%, 18.7%) instead of calculated values.

**Formal Specification:**
```
FUNCTION isBugCondition_C12(input)
  INPUT: input of type DashboardMetrics
  OUTPUT: boolean
  
  RETURN input.growthPercentage IN [8.2, 18.7, 12.5, 5.3]
         AND NOT calculated from actual financial data
END FUNCTION
```

C13. Premium Tabs Bypass Subscription Gate - The bug manifests when users access premium tabs via URL without subscription, rendering content without UpgradePrompt fallback.

**Formal Specification:**
```
FUNCTION isBugCondition_C13(input)
  INPUT: input of type { tab: string, planTier: string }
  OUTPUT: boolean
  
  RETURN input.tab IN ['manufacturing', 'loyalty', 'audit', 'payroll', 'approvals']
         AND NOT planHasFeature(input.planTier, input.tab)
         AND NOT UpgradePrompt component rendered
END FUNCTION
```

C14. Payroll/Approvals Empty Data Pipelines - The bug manifests when Payroll/Approvals tabs render shells with no data pipeline wired to backend.

**Formal Specification:**
```
FUNCTION isBugCondition_C14(input)
  INPUT: input of type { tab: string }
  OUTPUT: boolean
  
  RETURN input.tab IN ['payroll', 'approvals']
         AND NOT payrollAPI.getEmployees() called
         AND NOT workflowAPI.getPendingApprovals() called
         AND component displays empty state or hardcoded data
END FUNCTION
```

C15. Business Switch Stale Data Flash - The bug manifests when users switch businesses without loading boundary, displaying stale data flash.

**Formal Specification:**
```
FUNCTION isBugCondition_C15(input)
  INPUT: input of type BusinessSwitchEvent
  OUTPUT: boolean
  
  RETURN businessContext.switchBusiness() called
         AND NOT BusinessLoadingBoundary component wrapping content
         AND previous business data visible during fetch
END FUNCTION
```


**Category 5: Schema Gaps**

C16. No Purchase Returns Model - The bug manifests when vendor returns occur with no purchase_returns model to track debit notes.

**Formal Specification:**
```
FUNCTION isBugCondition_C16(input)
  INPUT: input of type VendorReturn
  OUTPUT: boolean
  
  RETURN input.type == 'purchase_return'
         AND NOT purchase_returns table exists
         AND NOT purchase_return_items table exists
END FUNCTION
```

C17. No Document Sequences Model - The bug manifests when document sequences are needed with no document_sequences model for auto-increment per document type per tenant.

**Formal Specification:**
```
FUNCTION isBugCondition_C17(input)
  INPUT: input of type { documentType: string, businessId: string }
  OUTPUT: boolean
  
  RETURN generateDocumentNumber() called
         AND NOT document_sequences table exists
         AND manual sequence management in application code
END FUNCTION
```

C18. POS Transactions Missing invoice_id FK - The bug manifests when POS transactions should link to invoices with no invoice_id foreign key on pos_transactions table.

**Formal Specification:**
```
FUNCTION isBugCondition_C18(input)
  INPUT: input of type POSTransaction
  OUTPUT: boolean
  
  RETURN input.shouldGenerateInvoice == true
         AND pos_transactions.invoice_id IS NULL in schema
END FUNCTION
```

C19. Production Orders Missing output_warehouse_id - The bug manifests when production orders complete with no output_warehouse_id to track where finished goods are stored.

**Formal Specification:**
```
FUNCTION isBugCondition_C19(input)
  INPUT: input of type ProductionOrder
  OUTPUT: boolean
  
  RETURN input.status == 'completed'
         AND production_orders.output_warehouse_id IS NULL in schema
         AND finished goods location unknown
END FUNCTION
```

### Examples

**Security Examples:**
- C1: User sends `{ "business_id": "malicious_value" }` in batch update → SQL injection executes
- C2: User queries variants for product in Business A → receives variants from Business B and C


**Data Integrity Examples:**
- C3: POS sale of 10 units → product.stock decrements but no batch_id tracked, FIFO costing broken, no inventory_ledger entry
- C4: Invoice deleted → all GL entries orphaned, financial reports incorrect, audit trail destroyed
- C5: purchase_items created without business_id → RLS bypass possible, cross-tenant data leak risk

**Integration Examples:**
- C6: POS cash sale of $100 → no payment record created, no GL entry (debit Cash $100, credit Revenue $85, credit Tax $15), accounting reports show $0 revenue
- C7: Restaurant order for "Chicken Biryani" (requires 500g chicken, 200g rice) → ingredients not deducted from inventory, stock levels incorrect
- C8: Payroll run with $10,000 gross salary → posted to SALES_TAX_PAYABLE instead of PAYROLL_EXPENSE, balance sheet inflated
- C9: Stock adjustment of +50 units → GL posting fails silently due to released client, inventory value mismatch
- C10: Expense of $500 for office supplies → no payment record created, cash flow reports incomplete

**Frontend Examples:**
- C11: User clicks "Transfer Stock" → setProducts() called → ReferenceError: setProducts is not defined
- C12: Dashboard shows "Revenue Growth: +8.2%" → actual growth is -3.5%, misleading metrics
- C13: Basic plan user navigates to /business/retail?tab=manufacturing → manufacturing UI renders instead of UpgradePrompt
- C14: User clicks Payroll tab → empty shell renders with "No data" instead of fetching employee list
- C15: User switches from Business A to Business B → Business A data flashes for 500ms before Business B data loads

**Schema Examples:**
- C16: Vendor return of defective goods → no table to record return, manual tracking in notes field
- C17: Invoice numbering → INV-001, INV-002 managed in application code, race conditions possible
- C18: POS sale → customer requests formal invoice, no link between pos_transactions and invoices
- C19: Production order completes → 100 finished goods created, warehouse location unknown

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All existing working integrations must continue to function (Invoice→GL, Payment→Customer Balance, Manufacturing→Stock)
- RBAC enforcement via withGuard middleware must remain unchanged
- Multi-tenant isolation via business_id filtering on all primary tables must remain unchanged
- Existing data operations (product CRUD, customer management, vendor management) must remain unchanged
- Subscription tier enforcement on sidebar navigation must remain unchanged
- Existing soft-delete patterns on products, customers, vendors must remain unchanged
- Audit logging for currently tracked operations must remain unchanged
- Transaction boundaries for invoice creation, payment allocation must remain unchanged

**Scope:**
All inputs that do NOT involve the 19 specific bug conditions should be completely unaffected by these fixes. This includes:
- All working server actions with proper validation and tenant isolation
- All working UI components with proper data pipelines
- All working integrations (Invoice→Payment, Manufacturing→Inventory where implemented correctly)
- All existing security measures (authentication, RBAC, plan checks)

