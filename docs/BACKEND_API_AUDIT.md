# Backend API Layer — Comprehensive Audit Report

> **Generated**: 2025  
> **Scope**: `lib/api/`, `lib/actions/`, `lib/services/`, `app/api/`, `lib/config/`  
> **Architecture**: Next.js Server Actions + PostgreSQL via `pg` pool  

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [ESSENTIALS — Products, Inventory, Invoices, Customers, Vendors, Purchases](#2-essentials)
3. [STOREFRONT — POS, Refunds, Loyalty, Quotations, Sales Orders, Restaurant](#3-storefront)
4. [FINANCE — Accounting/GL, Payments, Expenses, Tax, Credit Notes, Fiscal, Exchange Rates](#4-finance)
5. [OPERATIONS — Warehouses, Manufacturing, Payroll, Workflows/Approvals](#5-operations)
6. [INTELLIGENCE — Analytics, AI Forecasting, Campaigns/Marketing, Audit Trail](#6-intelligence)
7. [SYSTEM — Auth, Business Management, Config, Health, Plans](#7-system)
8. [Cross-Cutting Concerns & Quality Matrix](#8-cross-cutting-concerns)
9. [Critical Findings & Recommended Fixes](#9-critical-findings)
10. [Appendix: File Inventory](#10-appendix)

---

## 1. Architecture Overview

### Layer Stack

```
┌─────────────────────────────────────────────────────────┐
│  Components (React)                                     │
│  ↓ calls                                                │
│  lib/api/*.js         — Client wrappers (throw on err)  │
│  ↓ delegates to                                         │
│  lib/actions/**/*.js  — Server Actions ('use server')   │
│  ↓ uses                                                 │
│  lib/services/*.js    — Service facades (thin wrappers) │
│  ↓ queries                                              │
│  PostgreSQL via pg    — Raw parameterized SQL            │
└─────────────────────────────────────────────────────────┘
```

### Cross-Cutting Infrastructure

| Concern | Implementation | Location |
|---------|---------------|----------|
| **Auth** | `better-auth` session via `auth.api.getSession()` | `lib/auth` |
| **RBAC** | `verifyBusinessAccess(userId, businessId, roles[], client?)` | `lib/auth/access` |
| **Plan Gating** | `checkPlanFeature(businessId, featureKey)` / `checkPlanLimit(businessId, limitKey, count)` | `lib/auth/planGuard` |
| **Validation** | Zod schemas via `validateWithSchema()` / `validateSchema()` | `lib/validation/schemas` |
| **Result Envelope** | `actionSuccess(payload)` / `actionFailure(code, error, details)` | `lib/actions/_shared/result.js` |
| **Accounting** | Double-entry GL — `createGLEntryAction()` → journal_entries + gl_entries | `lib/actions/basic/accounting.js` |
| **Audit Logging** | `recordAuditLog()` — persistent audit_logs table (auto-created) | `lib/services/audit/auditService.js` |
| **Integration** | `IntegrationEngine.syncAll()` — adapter pattern for Shopify etc. | `lib/services/integrations/integrationEngine.js` |
| **Workflows** | `WorkflowEngine.evaluateTriggers()` — rule-based triggers persisted in DB | `lib/services/workflows/workflowEngine.js` |
| **AI Forecasting** | `AIOrderForecaster.forecastDemand()` — OpenAI with WMA fallback | `lib/services/ai/forecasting.js` |

### Plan Tiers

| Tier | Price | Users | Products | Warehouses | Key Feature Gates |
|------|-------|-------|----------|------------|-------------------|
| **Basic** | Free | 2 | 100 | 1 | Invoicing, purchases, customers, vendors, basic accounting, quotations |
| **Standard** | PKR 2,999/mo | 5 | 500 | 3 | + POS, expense tracking, batch/serial, delivery challans, loyalty, multi-warehouse |
| **Premium** | PKR 7,999/mo | 15 | 5,000 | 10 | + Manufacturing, AI analytics, payroll, approval workflows, restaurant KDS, fiscal periods |
| **Enterprise** | PKR 24,999/mo | ∞ | ∞ | ∞ | + AI forecasting, white label, multi-domain, custom workflows, all features |

---

## 2. ESSENTIALS

### 2.1 Products

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/product.js` | `productAPI.getAll`, `.create`, `.upsertIntegrated`, `.update`, `.delete` |
| Action | `lib/actions/standard/inventory/product.js` (809 lines) | `getProductsAction(businessId, options)`, `getProductAction(businessId, productId)`, `createProductAction(productData)`, `updateProductAction(id, businessId, updates)`, `deleteProductAction(id, businessId)` |
| Validation | `lib/actions/standard/inventory/validation.js` (259 lines) | `checkSKUExistsAction`, `checkBarcodeExistsAction`, `checkStockAvailabilityAction`, `getLowStockProductsAction` |

**CRUD Coverage**: ✅ Full (Create, Read single/list with pagination+search, Update, Delete)

| Quality Check | Status | Notes |
|---------------|--------|-------|
| businessId filter | ✅ | Every query includes `WHERE business_id = $1` |
| Soft delete | ⚠️ | `deleteProductAction` not verified (line 501+ of 809-line file) |
| Zod validation | ✅ | `validateWithSchema(productSchema, productData)` on create |
| GL entries | ❌ N/A | Products alone don't generate journal entries |
| Audit log | ❌ | No `recordAuditLog` call |
| Transactions | ✅ | Full `BEGIN/COMMIT/ROLLBACK` on create (with batch/serial/variant) |
| Error handling | ✅ | `actionFailure()` envelope |

**Notable**: Create handles batch/serial/variant creation atomically in the same transaction. Supports `camelCase → snake_case` normalization for field names.

---

### 2.2 Inventory / Stock

| Layer | File | Exports |
|-------|------|---------|
| Action | `lib/actions/standard/inventory/stock.js` (1053 lines) | `reserveStockAction`, `releaseStockAction`, `addStockAction`, `removeStockAction`, `transferStockAction`, `adjustStockAction`, `getStockValuationAction`, `getStockMovementsAction`, `getLowStockAlertsAction` |
| Service | `lib/services/InventoryService.js` | Thin wrapper delegating to stock actions |

**CRUD Coverage**: ✅ Add/Remove/Transfer/Adjust/Reserve/Release/Valuation/Movements/Alerts

| Quality Check | Status | Notes |
|---------------|--------|-------|
| businessId filter | ✅ | All queries scoped |
| Zod validation | ✅ | All mutations use `validateWithSchema()` |
| GL entries | ✅ | COGS on removeStock (sale/production), Inventory Asset on addStock (purchase) |
| Audit log | ❌ | No `recordAuditLog` — relies on `stock_movements` + `inventory_ledger` tables |
| Transactions | ✅ | Full transactions with external/internal client support |
| Post-transaction | ✅ | Fire-and-forget `IntegrationEngine.syncAll()` + `WorkflowEngine.evaluateTriggers()` |
| FIFO/FEFO | ✅ | Batch allocation on removeStock orders by `expiry_date ASC, created_at ASC` |

**Notable**: `adjustStockAction` has a **bug** — GL posting happens inside a fire-and-forget async block AFTER the transaction commits, but reuses the already-released `client`. This will fail silently.

---

### 2.3 Invoices

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/invoice.js` | `invoiceAPI.getAll`, `.create`, `.update`, `.delete` |
| Action | `lib/actions/basic/invoice.js` | `createInvoiceAction(params)`, `getInvoicesAction(businessId)`, `updateInvoiceAction(params)`, `deleteInvoiceAction(businessId, invoiceId)` |

**CRUD Coverage**: ✅ Full

| Quality Check | Status | Notes |
|---------------|--------|-------|
| businessId filter | ✅ | |
| Soft delete | ❌ **HARD DELETE** | `DELETE FROM invoices` with stock reversal and GL deletion |
| Zod validation | ✅ | `validateWithSchema(invoiceSchema)` |
| GL entries | ✅ | Debit AR, Credit Revenue + Tax on create |
| Stock deduction | ✅ | Via `removeStockAction` per line item |
| Customer balance | ✅ | Updated on create/delete |
| Transactions | ✅ | Full |
| Delete role guard | ✅ | Requires `owner` or `admin` role |

**⚠️ FINDING**: Invoice delete is **hard delete** — inconsistent with all other entities using soft delete. This destroys audit trail.

---

### 2.4 Customers

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/customer.js` | `customerAPI.getAll`, `.create`, `.update`, `.delete` |
| Action | `lib/actions/basic/customer.js` | `getCustomersAction`, `createCustomerAction`, `updateCustomerAction`, `deleteCustomerAction` |

**CRUD Coverage**: ✅ Full

| Quality Check | Status | Notes |
|---------------|--------|-------|
| businessId filter | ✅ | |
| Soft delete | ✅ | `is_deleted = true, deleted_at = NOW()` |
| Zod validation | ❌ | No schema validation |
| GL entries | ❌ N/A | |
| Audit log | ❌ | |
| Pakistan fields | ✅ | `ntn`, `cnic`, `srn`, `filer_status` |

---

### 2.5 Vendors

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/vendors.js` | `vendorAPI.getAll`, `.getById`, `.create`, `.update`, `.delete` |
| Action | `lib/actions/basic/vendor.js` | `getVendorsAction`, `getVendorByIdAction`, `createVendorAction`, `updateVendorAction`, `deleteVendorAction` |

**CRUD Coverage**: ✅ Full + getById

| Quality Check | Status | Notes |
|---------------|--------|-------|
| businessId filter | ✅ | |
| Soft delete | ✅ | |
| Zod validation | ✅ | `validateWithSchema(vendorSchema)` |
| GL entries | ✅ | Opening balance creates GL entry (Debit expense/asset, Credit AP) |
| Transactions | ✅ | Create uses full transaction |

---

### 2.6 Purchases

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/purchases.js` | `purchaseAPI.getAll`, `.getById`, `.create`, `.updateStatus`, `.createAutoReorderPO` |
| Action | `lib/actions/standard/purchase.js` (517 lines) | `getPurchasesAction`, `getPurchaseByIdAction`, `createPurchaseAction`, `updatePurchaseStatusAction`, `createBulkPurchaseOrdersAction`, `createAutoReorderPOAction` |

**CRUD Coverage**: ✅ Create, Read (list+detail), Status Update, Bulk Create, Auto-Reorder. ❌ No dedicated Update or Delete

| Quality Check | Status | Notes |
|---------------|--------|-------|
| businessId filter | ✅ | |
| GL entries | ✅ | On `received` status: Debit Inventory, Credit AP (+ input tax) |
| Stock addition | ✅ | On receive via `addStockAction` with batch auto-creation |
| Vendor balance | ✅ | Updated on receive |
| Duplicate guard | ✅ | PO number uniqueness check |
| Transactions | ✅ | Full |

---

## 3. STOREFRONT

### 3.1 Point of Sale (POS)

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/pos.js` | `posAPI.createTerminal`, `.getTerminals`, `.openSession`, `.closeSession`, `.getSessionSummary`, `.checkout`, `.refund`, `.getRefunds` |
| Action | `lib/actions/standard/pos.js` | `createPosTerminalAction`, `getPosTerminalsAction`, `openPosSessionAction`, `closePosSessionAction`, `createPosTransactionAction`, `getPosSessionSummaryAction` |
| Plan Gate | ✅ | `checkPlanFeature(businessId, 'pos')` — Standard+ |

**CRUD Coverage**: ✅ Terminal CRUD, Session lifecycle, Transaction creation, Summary

| Quality Check | Status | Notes |
|---------------|--------|-------|
| GL entries | ✅ | Cash/Card debit → Revenue + Tax credit per transaction |
| Stock deduction | ⚠️ | Uses **direct SQL** `UPDATE products SET stock = stock - qty` instead of `removeStockAction` — inconsistent with invoice path, no FIFO/batch allocation, no inventory_ledger entry |
| Session management | ✅ | Open/close with cash reconciliation (expected vs counted) |
| Sequential numbering | ✅ | `POS-000001` pattern |

**⚠️ FINDING**: POS stock deduction bypasses the entire stock management pipeline (no batch allocation, no serial tracking, no inventory_ledger, no IntegrationEngine/WorkflowEngine triggers).

---

### 3.2 POS Refunds

| Layer | File | Exports |
|-------|------|---------|
| Action | `lib/actions/standard/posRefund.js` | `refundPosTransactionAction`, `getPosRefundsAction` |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| GL reversal | ✅ | Reverses original GL entries |
| Over-refund protection | ✅ | Validates refund ≤ original amount |
| Stock restock | ✅ | Adds stock back |
| Full/partial | ✅ | Both supported |
| Sequential numbering | ✅ | `RFD-000001` |

---

### 3.3 Loyalty Programs

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/loyalty.js` | `loyaltyAPI.createProgram`, `.getPrograms`, `.earnPoints`, `.redeemPoints`, `.getBalance` |
| Action | `lib/actions/standard/loyalty.js` | `createLoyaltyProgramAction`, `getLoyaltyProgramsAction`, `earnLoyaltyPointsAction`, `redeemLoyaltyPointsAction`, `getLoyaltyBalanceAction` |
| Plan Gate | ✅ | `checkPlanFeature(businessId, 'promotions_crm')` — Standard+ |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Points balance | ✅ | Calculated from earn/redeem transaction sum |
| Minimum threshold | ✅ | Validates `minimumRedeemPoints` before redeem |
| GL entries | ❌ | No GL entries for loyalty liability — gap for proper accounting |
| Transactions | ✅ | Full |

---

### 3.4 Quotations / Sales Orders / Delivery Challans

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/quotations.js` | `quotationAPI.getAll` (parallel fetch), `.getQuotations`, `.createQuotation`, `.getQuotationDetail`, `.getSalesOrders`, `.createSalesOrder`, `.getSalesOrderDetail`, `.getChallans`, `.createChallan`, `.getChallanDetail` |
| Action | `lib/actions/standard/quotation.js` (583 lines) | All corresponding actions |

**Pipeline**: Quotation → Sales Order (reserves stock) → Delivery Challan (deducts stock)

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Stock reservation | ✅ | Sales orders reserve stock via `reserveStockAction` |
| Stock deduction | ✅ | Challans deduct stock (validates availability first) |
| GL entries | ❌ Correct | Non-financial documents don't generate GL (proper behavior) |
| Sequential numbering | ✅ | `QTN-`, `SO-`, `DC-` prefixes |

---

### 3.5 Restaurant (KDS)

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/restaurant.js` | `restaurantAPI.upsertTable`, `.getTables`, `.updateTableStatus`, `.createOrder`, `.updateOrderStatus`, `.getActiveOrders`, `.getKitchenQueue`, `.updateKitchenOrder` |
| Action | `lib/actions/standard/restaurant.js` | All corresponding actions |
| Plan Gate | ✅ | `checkPlanFeature(businessId, 'restaurant_kds')` — Premium+ |

**CRUD Coverage**: ✅ Tables (upsert/read/updateStatus), Orders (create/update/getActive), Kitchen (queue/updateStatus)

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Table lifecycle | ✅ | Auto-occupied on dine-in order, auto-freed on complete/cancel |
| KDS integration | ✅ | Kitchen orders linked, auto-promotes restaurant order to "ready" when all kitchen orders done |
| GL entries | ❌ | No GL posting — restaurant orders aren't linked to POS/invoicing |
| Stock deduction | ❌ | No stock deduction for ordered items — significant gap |
| Transactions | ✅ | Full |

**⚠️ FINDING**: Restaurant orders don't deduct inventory. For food service businesses, ingredient deduction should happen via BOM → consumption or direct stock removal.

---

## 4. FINANCE

### 4.1 Accounting / General Ledger

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/accounting.js` | `accountingAPI.createEntry`, `.getAccounts`, `.getEntries`, `.getBalance`, `.initCOA`, `.getTrialBalance`, `.getProfitLoss`, `.getBalanceSheet`, `.getSummary` |
| Action | `lib/actions/basic/accounting.js` (694 lines) | `createGLEntryAction(data, txClient)`, `getGLAccountBalance`, `getTrialBalanceAction`, `seedChartOfAccountsAction`, `getGLAccountsAction`, `getGLEntriesAction`, `getAccountBalanceAction`, `updateGLAccountAction`, `getGLAccountByType`, `getGLAccountsByTypes` |
| Service | `lib/services/AccountingService.js` | Thin wrapper + `recordBusinessTransaction(type, data)` bridge |
| Config | `lib/config/accounting.js` (214 lines) | `ACCOUNT_CODES`, `ACCOUNT_TYPE_NORMAL`, `ACCOUNT_SUB_TYPES`, `DEFAULT_COA`, `COGS_CODES`, `EXPENSE_CATEGORIES` |

**Core Engine Details**:
- Creates `journal_entries` parent + `gl_entries` children in one transaction
- Validates `SUM(debit) = SUM(credit)` (balanced entries)
- Sequential journal numbering: `JE-000001`
- Checks fiscal period is open via `checkFiscalPeriodOpen()`
- COA: 50+ accounts aligned to Pakistani FBR/IFRS standards (code ranges 1000-5999)

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Double-entry enforcement | ✅ | Debit must equal credit |
| Fiscal period guard | ✅ | Prevents posting to closed/locked periods |
| Transaction support | ✅ | Accepts external `txClient` for cross-action atomicity |

---

### 4.2 Financial Reports

| Layer | File | Exports |
|-------|------|---------|
| Action | `lib/actions/standard/report.js` (515 lines) | `getTrialBalanceAction`, `getProfitLossAction`, `getBalanceSheetAction`, `getAccountingSummaryAction`, `getMonthlyFinancialsAction` |

| Report | Correctness |
|--------|-------------|
| Trial Balance | ✅ Proper debit/credit normal balance by account type |
| P&L | ✅ Revenue − COGS = Gross Profit; − OpEx = Net Income |
| Balance Sheet | ✅ Assets = Liabilities + Equity + Retained Earnings; equation verified |
| Summary | ✅ Includes receivables, payables, margins |

---

### 4.3 Payments

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/payments.js` | `paymentAPI.getAll`, `.create`, `.getCustomerLedger`, `.getVendorLedger`, `.delete`, `.getCustomerReceipts`, `.getVendorPayments` |
| Action | `lib/actions/basic/payment.js` (585 lines) | `getPaymentsAction`, `createPaymentAction`, `getCustomerLedgerAction`, `getVendorLedgerAction`, `deletePaymentAction` |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| GL entries | ✅ | Cash/Bank ↔ AR/AP |
| Multi-allocation | ✅ | `payment_allocations` table for allocating payment across invoices |
| Customer/vendor balance | ✅ | Auto-updates |
| Invoice status | ✅ | Auto-updates to pending/partial/paid |
| Duplicate guard | ✅ | `transaction_id` uniqueness check |

---

### 4.4 Expenses

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/expense.js` | `expenseAPI.create`, `.getAll`, `.getSummary`, `.delete` |
| Action | `lib/actions/basic/expense.js` | `createExpenseAction`, `getExpensesAction`, `getExpenseSummaryAction`, `deleteExpenseAction` |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| GL entries | ✅ | Expense account debit, Cash/Bank/AP credit (varies by payment method) |
| Input tax credit | ✅ | Tax-inclusive handling |
| Vendor balance | ✅ | Updated for credit expenses |
| Soft delete | ✅ | With GL reversal entries |
| Sequential numbering | ✅ | `EXP-000001` |

---

### 4.5 Credit Notes

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/creditNote.js` | `creditNoteAPI.create`, `.getAll`, `.apply` |
| Action | `lib/actions/basic/creditNote.js` | `createCreditNoteAction`, `getCreditNotesAction`, `applyCreditNoteAction` |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| GL reversal | ✅ | Debit Revenue, Credit AR |
| Over-credit guard | ✅ | Validates CN doesn't exceed invoice total |
| Customer balance | ✅ | Reduced on CN creation |
| Sequential numbering | ✅ | `CN-000001` |

---

### 4.6 Tax

| Layer | File | Exports |
|-------|------|---------|
| Action | `lib/actions/standard/tax.js` | `getTaxConfigAction(businessId)`, `configureTaxAction(taxData)` |
| Service | `lib/services/PakistaniTaxService.js` (129 lines) | `.configureTax`, `.getTaxConfig`, `.calculateSalesTax`, `.calculateProvincialTax`, `.calculateWithholdingTax`, `.calculateTotalTax`, `.validateNTN`, `.validateSRN` |

**Coverage**: FBR Federal GST (default 17%), Provincial GST (SRB/PRA), WHT, NTN/SRN validation

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Pakistani compliance | ✅ | FBR-aligned with NTN format validation |
| Upsert | ✅ | `ON CONFLICT (business_id) DO UPDATE` |
| Plan gate | ❌ | `tax.js` doesn't check plan feature |
| Zod validation | ❌ | No schema validation |

---

### 4.7 Fiscal Periods

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/fiscal.js` | `fiscalAPI.createPeriod`, `.getPeriods`, `.closePeriod`, `.reopenPeriod` |
| Action | `lib/actions/basic/fiscal.js` | `createFiscalPeriodAction`, `getFiscalPeriodsAction`, `closeFiscalPeriodAction`, `reopenFiscalPeriodAction`, `checkFiscalPeriodOpen` |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Overlap checking | ✅ | Prevents overlapping periods |
| Trial balance verification | ✅ | Before close |
| Locked period protection | ✅ | `is_locked` flag |
| Audit | ✅ | `closed_by` field recorded |

---

### 4.8 Exchange Rates

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/exchangeRate.js` | `exchangeRateAPI.setRate`, `.getRates`, `.getLatest`, `.convert` |
| Action | `lib/actions/basic/exchangeRate.js` | `setExchangeRateAction`, `getExchangeRatesAction`, `getLatestRateAction`, `convertCurrencyAction` |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Upsert | ✅ | `ON CONFLICT` handling |
| Inverse rate fallback | ✅ | If PKR→USD not found, tries USD→PKR reciprocal |
| businessId filter | ✅ | |

---

## 5. OPERATIONS

### 5.1 Warehouses / Multi-Location

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/warehouse.js` | `warehouseAPI.getLocations`, `.createLocation`, `.updateLocation`, `.deleteLocation`, `.getLocationStock`, `.createTransfer` |
| Action | `lib/actions/standard/inventory/warehouse.js` | `getWarehouseLocationsAction`, `createWarehouseLocationAction`, `updateWarehouseLocationAction`, `getLocationStockAction`, `deleteWarehouseLocationAction` |
| Plan Gate | ✅ | `checkPlanFeature(businessId, 'multi_warehouse')` — Standard+ |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Plan limit | ✅ | `checkPlanLimit(businessId, 'max_warehouses', currentCount)` |
| Primary location | ✅ | Managed (only one primary at a time) |
| Delete guard | ✅ | Cannot delete location with stock |
| SQL injection protection | ✅ | Field whitelist for update SET clause |

---

### 5.2 Batches

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/batch.js` | `batchAPI.create`, `.getByProduct`, `.update`, `.delete`, `.getExpiring` |
| Action | `lib/actions/standard/inventory/batch.js` | `createBatchAction`, `getBatchesAction`, `updateBatchAction`, `deleteBatchAction`, `getExpiringBatchesAction`, `getAvailableBatchesAction`, `updateBatchQuantityAction` |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Soft delete | ✅ | |
| Zod validation | ✅ | |
| **SQL injection** | **⚠️ VULNERABLE** | `updateBatchAction` builds SET clause from user-provided keys without a field whitelist |

---

### 5.3 Serials

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/serial.js` | `serialAPI.create`, `.getSerial`, `.getByProduct`, `.sell`, `.delete` |
| Action | `lib/actions/standard/inventory/serial.js` | `createSerialAction`, `createBulkSerialsAction`, `sellSerialAction`, `getProductSerialsAction`, `getAvailableSerialsAction`, `getSerialAction`, `deleteSerialAction` |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Soft delete | ✅ | |
| Bulk creation | ✅ | `ON CONFLICT` for idempotency |
| Uppercase normalization | ✅ | Serial numbers uppercased |

---

### 5.4 Variants

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/variant.js` | `variantAPI.create`, `.getByProduct`, `.updateStock`, `.updatePricing`, `.search`, `.createMatrix`, `.getMatrix`, `.delete` |
| Action | `lib/actions/standard/inventory/variant.js` | All corresponding actions |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Soft delete | ✅ | |
| Stock movements | ✅ | Recorded for audit on stock changes |
| **businessId check** | **⚠️ MISSING** | `getProductVariantsAction` doesn't verify businessId access |

---

### 5.5 Manufacturing

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/manufacturing.js` | `manufacturingAPI.getBOMs`, `.createBOM`, `.deleteBOM`, `.getProductionOrders`, `.createProductionOrder`, `.updateStatus` |
| Action | `lib/actions/premium/manufacturing.js` (303 lines) | `getBOMsAction`, `createBOMAction`, `getProductionOrdersAction`, `createProductionOrderAction`, `updateProductionOrderStatusAction`, `deleteBOMAction` |
| Service | `lib/services/ManufacturingService.js` | Thin wrapper |
| Plan Gate | ✅ | `checkPlanFeature(businessId, 'manufacturing')` — Premium+ |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Material consumption | ✅ | FIFO batch cost via `removeStockAction` |
| Finished goods addition | ✅ | Via `addStockAction` with calculated unit cost (true cost from consumed materials) |
| BOM delete guard | ✅ | Prevents deletion if active production orders exist |
| Double-completion guard | ✅ | Prevents re-completing already completed orders |
| GL entries | ✅ (Implicit) | Through `removeStockAction` → COGS entries and `addStockAction` → Inventory entries |
| Transactions | ✅ | Full |

---

### 5.6 Payroll

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/payroll.js` | `payrollAPI.addEmployee`, `.getEmployees`, `.updateEmployee`, `.processPayroll`, `.getRuns`, `.getPayslips` |
| Action | `lib/actions/standard/payroll.js` | `createPayrollEmployeeAction`, `getPayrollEmployeesAction`, `updatePayrollEmployeeAction`, `processPayrollAction`, `getPayrollRunsAction`, `getPayslipsAction` |
| Plan Gate | ✅ | `checkPlanFeature(businessId, 'payroll')` — Premium+ |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| GL entries | ✅ | Debit Salary Expense, Credit AP (net) + Tax Payable (deductions) |
| Duplicate run guard | ✅ | Prevents duplicate month/year |
| Pakistan tax slabs | ✅ | Simplified annual slabs (600K-6M+) |
| EOBI | ✅ | 1% employee (capped at Rs.350) |
| Per-employee overrides | ✅ | Allowances, overtime, deductions |
| Sequential numbering | ✅ | `PAY-000001` |
| Transactions | ✅ | Full |

**⚠️ FINDING**: Payroll GL entry posts deductions to `SALES_TAX_PAYABLE` — should use a separate `PAYROLL_TAX_PAYABLE` or at minimum separate the EOBI vs income tax.

---

### 5.7 Approval Workflows

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/workflow.js` | `workflowAPI.submit`, `.resolve`, `.getPending`, `.getHistory` |
| Action | `lib/actions/standard/workflow.js` | `submitApprovalAction`, `resolveApprovalAction`, `getPendingApprovalsAction`, `getApprovalHistoryAction` |
| Plan Gate | ✅ | `checkPlanFeature(businessId, 'approval_workflows')` — Premium+ |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Approver routing | ✅ | Rule-based (`workflow_rules` table) with fallback to business owner |
| Admin override | ✅ | Owner/admin can resolve any request |
| Pagination | ✅ | `LIMIT/OFFSET` on history |
| Re-resolution guard | ✅ | Only pending requests can be resolved |

---

## 6. INTELLIGENCE

### 6.1 Analytics & Dashboard

| Layer | File | Exports |
|-------|------|---------|
| Action | `lib/actions/premium/ai/analytics.js` (582 lines) | `getSalesTrendAction`, `getTopProductsAction`, `getCategoryDistributionAction`, `getKPIMetricsAction`, `getDemandForecastAction`, `getDashboardMetricsAction`, `getExpenseBreakdownAction` |
| Plan Gate | ✅ | `checkPlanFeature(businessId, 'ai_analytics')` — Premium+ |

| Metric | Source |
|--------|--------|
| Sales trend (6 months) | `invoices` table with `generate_series` for gap-filling |
| Top products | `invoice_items` aggregation |
| Category distribution | `products` stock × price |
| KPIs (growth, retention) | Month-over-month revenue comparison + repeat customer rate |
| Dashboard (revenue, orders, cash flow) | `gl_entries` + `invoices` + `products` + `customers` |
| Demand forecast | AI (OpenAI gpt-4o-mini) with WMA fallback |

**⚠️ FINDING**: `getDashboardMetricsAction` has hardcoded placeholder values for `customers.growth` (8.2) and `cashFlow.growth` (18.7).

---

### 6.2 AI Forecasting

| Layer | File | Exports |
|-------|------|---------|
| Action | `lib/actions/premium/ai/ai.js` | `getAiRestockSuggestionsAction`, `processAiFuzzyRuleAction` |
| Service | `lib/services/ai/forecasting.js` | `AIOrderForecaster.forecastDemand`, `.fallbackForecast` |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| AI graceful degradation | ✅ | Falls back to WMA if OpenAI unavailable |
| Dynamic imports | ✅ | AI/OpenAI modules loaded dynamically to prevent build failures |
| Plan gate | ✅ | `ai_analytics` feature required |

---

### 6.3 Marketing & Campaigns

| Layer | File | Exports |
|-------|------|---------|
| Service | `lib/services/MarketingAgentService.js` (187 lines) | `.createSegment`, `.refreshSegment`, `.createCampaign` |
| Service | `lib/services/PromotionService.js` (234 lines) | `.createPromotion`, `.calculateAppliedDiscounts` |
| Service | `lib/services/SupplierAutomationService.js` (180 lines) | `.getReorderNeeds`, `.recordSupplierQuote`, `.selectBestQuote` |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| Audit logging | ✅ | Uses `recordAuditLog()` |
| Structured logging | ✅ | Uses `createModuleLogger()` |
| Dynamic segmentation | ✅ | Rules-based customer segment refresh |
| Promotion types | ✅ | Fixed/percentage, BOGO, min order, max discount |

**Note**: These services don't have corresponding server actions or API wrappers — they're called directly from other services or would need action wrappers created.

---

### 6.4 Audit Trail

| Layer | File | Exports |
|-------|------|---------|
| Service | `lib/services/audit/auditService.js` (284 lines) | `recordAuditLog(params)`, `getAuditLogs(params)` |
| Action | `lib/actions/basic/audit.js` | `getUnifiedActivityFeedAction(businessId, limit)` |

**Two separate systems**:

1. **`auditService.js`** — True audit log, records to `audit_logs` table (auto-created if missing). Used by services (Marketing, Promotions, Supplier). Has before/after snapshots, user attribution.

2. **`audit.js` action** — NOT a true audit trail. It's a **dashboard activity feed** that unions recent invoices, payments, customers, and low-stock products. Misleading name.

**⚠️ FINDING**: Most server actions in `lib/actions/` do NOT call `recordAuditLog()`. Only service-layer code (PromotionService, MarketingAgentService, SupplierAutomationService) uses it. This means core operations like invoice creation, payment posting, stock adjustments, etc. have **no audit trail** beyond the activity feed.

---

## 7. SYSTEM

### 7.1 Auth

| Layer | File | Notes |
|-------|------|-------|
| Route | `app/api/auth/[...better-auth]/route.js` | Delegates to `better-auth` handler for GET/POST |
| Config | `lib/auth` | `better-auth` library configuration |
| Access | `lib/auth/access` | `verifyBusinessAccess(userId, businessId, roles[], client?)` |
| Plan Guard | `lib/auth/planGuard` | `checkPlanFeature(businessId, feature)`, `checkPlanLimit(businessId, limit, count)` |

---

### 7.2 Business Management

| Layer | File | Exports |
|-------|------|---------|
| API | `lib/api/business.js` | `businessAPI.getById`, `.getByUserId`, `.create`, `.update`, `.delete` (STUB), `.getUsers`, `.updateUserRole`, `.addMember`, `.removeMember`, `.updatePlan`, `.getRole`, `.getJoinedBusinesses` |
| Action | `lib/actions/basic/business.js` | 13 exported functions (see summary) |

| Quality Check | Status | Notes |
|---------------|--------|-------|
| COA auto-seeding | ✅ | `seedChartOfAccountsAction` called on business creation |
| Domain uniqueness | ✅ | |
| Duplicate name guard | ✅ | |
| Owner self-healing | ✅ | Ensures owner role exists |
| Plan limit (seats) | ✅ | Checked on `addMember` |
| Owner protection | ✅ | Cannot remove/demote owner |
| **Delete** | **❌ STUB** | `businessAPI.delete()` returns "Not implemented" |

---

### 7.3 Configuration

| File | Contents |
|------|----------|
| `lib/config/accounting.js` (214 lines) | `ACCOUNT_CODES` (50+ codes), `ACCOUNT_TYPE_NORMAL`, `ACCOUNT_SUB_TYPES`, `DEFAULT_COA` (50+ accounts), `COGS_CODES`, `EXPENSE_CATEGORIES` |
| `lib/config/plans.js` (373 lines) | `PLAN_TIERS` (4 tiers), `FEATURE_LABELS`, `FEATURE_MIN_PLAN`, `planHasFeature()`, `planWithinLimit()`, `PLAN_ORDER`, `planAtLeast()`, `getUpgradeBenefits()` |
| `lib/config/domains.js` (421 lines) | `BUSINESS_DOMAINS` — Pakistan-first vertical domain configs (retail, wholesale, restaurant, pharmacy, etc.) with tax defaults, units, categories, module recommendations |

---

### 7.4 Health Check

| Route | `GET /api/health` |
|-------|------------------|
| Checks | Database connectivity + latency, memory (heap/RSS), uptime |
| Response | `{ status: 'healthy'|'degraded', version, environment, uptime, checks, memory, timestamp }` |
| HTTP Status | 200 (healthy) / 503 (degraded) |

---

### 7.5 Bulk Operations

| Layer | File | Exports |
|-------|------|---------|
| Action | `lib/actions/premium/automation/bulk.js` | `bulkDeleteAction(businessId, entityType, ids)` |

Supports: invoices (hard delete), products/customers/vendors (soft delete). Requires `owner`/`admin` role.

### 7.6 Integrated Product Upsert

| Layer | File | Exports |
|-------|------|---------|
| Action | `lib/actions/premium/automation/inventory_composite.js` | `upsertIntegratedProductAction(params)` |

Atomic product create/update with batch delta reconciliation, serial management, and initial stock handling. Uses safe field whitelist for SQL injection prevention.

---

## 8. Cross-Cutting Concerns & Quality Matrix

### Compliance Matrix

| Module | businessId | Soft Delete | Zod Validation | GL Entries | Audit Log | Transactions | Plan Gate |
|--------|:----------:|:-----------:|:--------------:|:----------:|:---------:|:------------:|:---------:|
| Products | ✅ | ⚠️ Unverified | ✅ | N/A | ❌ | ✅ | ❌ |
| Stock | ✅ | N/A | ✅ | ✅ | ❌ | ✅ | ❌ |
| Invoices | ✅ | ❌ **Hard** | ✅ | ✅ | ❌ | ✅ | ❌ |
| Customers | ✅ | ✅ | ❌ | N/A | ❌ | ❌ | ❌ |
| Vendors | ✅ | ✅ | ✅ | ✅ (opening) | ❌ | ✅ | ❌ |
| Purchases | ✅ | N/A | ❌ | ✅ | ❌ | ✅ | ❌ |
| POS | ✅ | N/A | ❌ | ✅ | ❌ | ✅ | ✅ |
| POS Refunds | ✅ | N/A | ❌ | ✅ | ❌ | ✅ | ✅ |
| Loyalty | ✅ | N/A | ❌ | ❌ | ❌ | ✅ | ✅ |
| Quotations | ✅ | N/A | ❌ | N/A | ❌ | ✅ | ❌ |
| Accounting | ✅ | N/A | ❌ | ✅ (core) | ❌ | ✅ | ❌ |
| Payments | ✅ | N/A | ❌ | ✅ | ❌ | ✅ | ❌ |
| Expenses | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Credit Notes | ✅ | N/A | ❌ | ✅ | ❌ | ✅ | ❌ |
| Tax | ✅ | N/A | ❌ | N/A | ❌ | ❌ | ❌ |
| Fiscal | ✅ | N/A | ❌ | N/A | ✅ (closed_by) | ✅ | ❌ |
| Warehouses | ✅ | N/A | ✅ | N/A | ❌ | ❌ | ✅ |
| Batches | ✅ | ✅ | ✅ | N/A | ❌ | ❌ | ❌ |
| Serials | ✅ | ✅ | ✅ | N/A | ❌ | ❌ | ❌ |
| Variants | ⚠️ Missing getByProduct | ✅ | ❌ | N/A | ❌ | ❌ | ❌ |
| Manufacturing | ✅ | N/A | ❌ | ✅ (via stock) | ❌ | ✅ | ✅ |
| Payroll | ✅ | N/A | ❌ | ✅ | ❌ | ✅ | ✅ |
| Workflows | ✅ | N/A | ❌ | N/A | ❌ | ❌ | ✅ |
| Restaurant | ✅ | N/A | ❌ | ❌ | ❌ | ✅ | ✅ |
| Business | ✅ | N/A | ❌ | N/A | ❌ | ✅ | ✅ |

### Pattern Summary

- **businessId multi-tenancy**: ✅ Universally enforced
- **Soft deletes**: Inconsistent — customers/vendors/batches/serials/variants use soft delete; invoices use **hard delete**; many entities have no delete at all
- **Zod validation**: Only on inventory-related actions (products, stock, batches, serials, warehouses); all finance actions lack schema validation
- **GL entries**: Well-implemented for financial transactions; missing for loyalty liability and restaurant operations
- **Audit logging**: **Major gap** — `recordAuditLog()` exists but is only used by 3 service-layer modules; all server actions skip it
- **Error handling**: Mix of `actionSuccess/actionFailure` structured envelope and raw `{ success, error }` objects — inconsistent

---

## 9. Critical Findings & Recommended Fixes

### 🔴 Critical (Security/Data Integrity)

| # | Finding | Location | Impact | Fix |
|---|---------|----------|--------|-----|
| 1 | **SQL Injection in `updateBatchAction`** | `lib/actions/standard/inventory/batch.js` | User-controlled field names injected into SET clause without whitelist | Add field whitelist like warehouse.js does |
| 2 | **`getProductVariantsAction` missing businessId check** | `lib/actions/standard/inventory/variant.js` | Cross-tenant data leak — any authenticated user can read any product's variants | Add `verifyBusinessAccess` call |
| 3 | **Invoice hard delete destroys audit trail** | `lib/actions/basic/invoice.js` | Financial records permanently lost | Convert to soft delete with `is_deleted` flag |

### 🟠 High (Correctness)

| # | Finding | Location | Impact | Fix |
|---|---------|----------|--------|-----|
| 4 | **POS stock deduction bypasses stock pipeline** | `lib/actions/standard/pos.js` | No FIFO/batch allocation, no serial tracking, no inventory_ledger, no workflow triggers for POS sales | Replace direct SQL with `removeStockAction` |
| 5 | **`adjustStockAction` GL posting uses released client** | `lib/actions/standard/inventory/stock.js` (line ~960) | GL entries for stock adjustments silently fail — accounting mismatch | Move GL posting inside the transaction, before COMMIT |
| 6 | **Payroll GL maps deductions to `SALES_TAX_PAYABLE`** | `lib/actions/standard/payroll.js` | Tax payable inflated by payroll deductions (EOBI + income tax mixed with sales tax) | Use separate payroll-specific liability accounts |
| 7 | **Restaurant orders don't deduct inventory** | `lib/actions/standard/restaurant.js` | Inventory levels don't reflect food/ingredient consumption | Integrate with BOM consumption or direct stock deduction |
| 8 | **Dashboard hardcoded growth values** | `lib/actions/premium/ai/analytics.js` | Misleading KPIs: `customers.growth: 8.2`, `cashFlow.growth: 18.7` | Calculate from actual data |

### 🟡 Medium (Consistency/Quality)

| # | Finding | Location | Impact | Fix |
|---|---------|----------|--------|-----|
| 9 | **No audit logging in server actions** | All `lib/actions/` files | No audit trail for core business operations | Add `recordAuditLog()` calls to all mutation actions |
| 10 | **Inconsistent error envelope** | Various files | Some use `actionSuccess/actionFailure`, others use raw `{ success, error }` | Standardize on `actionSuccess/actionFailure` everywhere |
| 11 | **No Zod validation on finance actions** | Payments, expenses, credit notes, GL entries | Invalid data can reach the database | Add Zod schemas for all financial mutations |
| 12 | **Loyalty points have no GL liability** | `lib/actions/standard/loyalty.js` | Unearned liability not reflected in books | Create GL entries: Debit Marketing Expense, Credit Loyalty Liability on earn |
| 13 | **`businessAPI.delete()` not implemented** | `lib/api/business.js` | Users cannot delete businesses | Implement with cascading soft deletes + data retention policy |
| 14 | **Customer action missing Zod validation** | `lib/actions/basic/customer.js` | No input validation | Add `customerSchema` validation |
| 15 | **Service-layer functions lack server action wrappers** | Marketing, Promotions, Supplier services | Cannot be called from client components | Create corresponding server actions |

---

## 10. Appendix: File Inventory

### lib/api/ (24 files — client wrappers)
```
accounting.js    batch.js         business.js      creditNote.js
customer.js      exchangeRate.js  expense.js       fiscal.js
index.js         invoice.js       loyalty.js       manufacturing.js
payments.js      payroll.js       pos.js           product.js
purchases.js     quotations.js    restaurant.js    serial.js
variant.js       vendors.js       warehouse.js     workflow.js
```

### lib/actions/ (server actions)
```
_shared/result.js
basic/accounting.js  basic/audit.js       basic/business.js    basic/creditNote.js
basic/customer.js    basic/exchangeRate.js basic/expense.js     basic/fiscal.js
basic/invoice.js     basic/payment.js     basic/vendor.js
standard/inventory/batch.js    standard/inventory/product.js
standard/inventory/serial.js   standard/inventory/stock.js
standard/inventory/validation.js standard/inventory/variant.js
standard/inventory/warehouse.js
standard/loyalty.js  standard/payroll.js  standard/pos.js
standard/posRefund.js standard/purchase.js standard/quotation.js
standard/report.js   standard/restaurant.js standard/tax.js
standard/workflow.js
premium/manufacturing.js
premium/ai/ai.js     premium/ai/analytics.js
premium/automation/bulk.js  premium/automation/inventory_composite.js
```

### lib/services/ (service facades + engines)
```
AccountingService.js    BatchService.js        InventoryService.js
ManufacturingService.js MarketingAgentService.js PakistaniTaxService.js
PromotionService.js     SerialService.js       SupplierAutomationService.js
VariantService.js
ai/forecasting.js
audit/auditService.js
integrations/integrationEngine.js
logging/logger.js
workflows/workflowEngine.js
```

### lib/config/ (static configuration)
```
accounting.js   domains.js   plans.js
```

### app/api/ (HTTP routes)
```
auth/[...better-auth]/route.js   health/route.js   migrate/route.js
```

---

*End of audit report.*
