# Bugfix Requirements Document

## Introduction

This document addresses critical security vulnerabilities, data integrity issues, and integration gaps discovered in a multi-domain, multi-tenant ERP system. The system manages 50+ Prisma models across 41 business domains (retail, auto-parts, pharmacy, restaurant, manufacturing, etc.) with a Next.js + PostgreSQL + Prisma backend.

The bugs span multiple categories:
- **Security**: SQL injection and cross-tenant data leaks
- **Data Integrity**: Stock deduction bypasses, hard-deletes destroying audit trails, missing foreign keys
- **Integration**: Broken pipelines between POS→Finance, Restaurant→Inventory, and incorrect GL postings
- **Frontend**: Runtime crashes and hardcoded values

These issues compromise system security, financial accuracy, and operational reliability across all tenant businesses.

---

## Bug Analysis

### Current Behavior (Defect)

#### 1. Security Vulnerabilities

1.1 WHEN updateBatchAction receives user-controlled column names in the SET clause THEN the system allows SQL injection through unwhitelisted column names in lib/actions/standard/inventory/batchActions.js

1.2 WHEN getProductVariantsAction queries product variants THEN the system returns variants across all tenants without businessId filtering in lib/actions/standard/inventory/variantActions.js

#### 2. Data Integrity Issues

1.3 WHEN POS transactions process sales THEN the system directly decrements product.stock bypassing batch/serial/FIFO/ledger/workflow pipeline

1.4 WHEN invoices are deleted THEN the system performs hard-delete destroying financial audit trail instead of soft-delete

1.5 WHEN child table records (purchase_items, pos_transaction_items, restaurant_order_items, etc.) are created THEN the system stores records without business_id foreign key preventing proper RLS enforcement on 12+ tables

#### 3. Integration Failures

1.6 WHEN POS transactions complete THEN the system does not create payment records or GL entries breaking financial reporting

1.7 WHEN restaurant orders are placed THEN the system does not deduct ingredient inventory from stock

1.8 WHEN payroll deductions are posted THEN the system posts to SALES_TAX_PAYABLE account instead of PAYROLL_EXPENSE account

1.9 WHEN adjustStockAction posts GL entries THEN the system releases database client before GL posting query completes causing silent failures

1.10 WHEN expenses are recorded THEN the system does not create linked payment records breaking cash flow tracking

#### 4. Frontend Issues

1.11 WHEN handleStockTransfer executes THEN the system calls non-existent setProducts function causing runtime crash

1.12 WHEN dashboard displays growth metrics THEN the system shows hardcoded percentages (8.2%, 18.7%) instead of calculated values

1.13 WHEN users access premium tabs via URL THEN the system renders content without UpgradePrompt fallback allowing subscription bypass on 5+ tabs

1.14 WHEN Payroll/Approvals tabs render THEN the system displays empty shells with no data pipeline wired

1.15 WHEN users switch businesses THEN the system displays stale data flash without loading boundary

#### 5. Schema Gaps

1.16 WHEN vendor returns occur THEN the system has no purchase_returns model to track debit notes

1.17 WHEN document sequences are needed THEN the system has no document_sequences model for auto-increment per document type per tenant

1.18 WHEN POS transactions should link to invoices THEN the system has no invoice_id foreign key on pos_transactions table

1.19 WHEN production orders complete THEN the system has no output_warehouse_id to track where finished goods are stored

---

### Expected Behavior (Correct)

#### 1. Security Fixes

2.1 WHEN updateBatchAction receives column names THEN the system SHALL whitelist allowed columns (batch_number, manufacturing_date, expiry_date, quantity, cost_price, mrp, notes, is_active) and reject unauthorized columns

2.2 WHEN getProductVariantsAction queries variants THEN the system SHALL filter by businessId to enforce tenant isolation

#### 2. Data Integrity Fixes

2.3 WHEN POS transactions process sales THEN the system SHALL call InventoryService.adjustStock() to properly handle batch deduction, serial allocation, inventory_ledger entries, stock_movements records, and FIFO costing

2.4 WHEN invoices are deleted THEN the system SHALL perform soft-delete by setting is_deleted=true and deleted_at=NOW() preserving audit trail

2.5 WHEN child table records are created THEN the system SHALL include business_id foreign key on purchase_items, pos_transaction_items, pos_payments, pos_refund_items, restaurant_order_items, challan_items, credit_note_items, payroll_items, campaign_messages, segment_customers, price_list_items, and promotion_products tables

#### 3. Integration Fixes

2.6 WHEN POS transactions complete THEN the system SHALL create payment records in payments table and GL entries (debit Cash, credit Revenue, credit Sales Tax Payable)

2.7 WHEN restaurant orders are placed THEN the system SHALL deduct ingredient quantities from inventory using recipe/BOM data

2.8 WHEN payroll deductions are posted THEN the system SHALL post to PAYROLL_EXPENSE and PAYROLL_PAYABLE accounts instead of SALES_TAX_PAYABLE

2.9 WHEN adjustStockAction posts GL entries THEN the system SHALL keep database client connection open until all GL posting queries complete within the transaction

2.10 WHEN expenses are recorded THEN the system SHALL create linked payment record with payment_id foreign key on expenses table

#### 4. Frontend Fixes

2.11 WHEN handleStockTransfer executes THEN the system SHALL call DataContext.refreshInventory() or equivalent valid function instead of non-existent setProducts

2.12 WHEN dashboard displays growth metrics THEN the system SHALL calculate actual period-over-period percentage changes from financial data

2.13 WHEN users access premium tabs via URL without subscription THEN the system SHALL render UpgradePrompt component on manufacturing, loyalty, audit, payroll, and approvals tabs

2.14 WHEN Payroll/Approvals tabs render THEN the system SHALL wire data fetching from payrollAPI.getEmployees(), payrollAPI.getRuns(), workflowAPI.getPendingApprovals(), and workflowAPI.getHistory()

2.15 WHEN users switch businesses THEN the system SHALL display loading boundary with BusinessLoadingBoundary component preventing stale data flash

#### 5. Schema Additions

2.16 WHEN vendor returns occur THEN the system SHALL store data in purchase_returns table with columns (id, business_id, vendor_id, return_number, return_date, total_amount, status, notes) and purchase_return_items table

2.17 WHEN document sequences are needed THEN the system SHALL use document_sequences table with columns (id, business_id, document_type, prefix, current_number, padding_length) for auto-increment

2.18 WHEN POS transactions should link to invoices THEN the system SHALL use optional invoice_id foreign key on pos_transactions table

2.19 WHEN production orders complete THEN the system SHALL store output location in output_warehouse_id foreign key on production_orders table

---

### Unchanged Behavior (Regression Prevention)

#### 1. Existing Security

3.1 WHEN authenticated users access their own tenant data THEN the system SHALL CONTINUE TO enforce business_id filtering on all primary tables

3.2 WHEN RBAC permissions are checked THEN the system SHALL CONTINUE TO use withGuard middleware for permission enforcement

#### 2. Existing Data Operations

3.3 WHEN invoices are created with proper stock pipeline THEN the system SHALL CONTINUE TO call removeStockAction with batch/serial tracking

3.4 WHEN GL entries are posted for invoices THEN the system SHALL CONTINUE TO create proper debit/credit entries (AR debit, Revenue credit, Tax credit)

3.5 WHEN products are created/updated via productAPI.upsertIntegrated THEN the system SHALL CONTINUE TO handle batches and serial numbers atomically

#### 3. Existing Integrations

3.6 WHEN manufacturing production orders consume materials THEN the system SHALL CONTINUE TO deduct raw material stock

3.7 WHEN payments are allocated to invoices THEN the system SHALL CONTINUE TO update customer outstanding_balance

3.8 WHEN stock transfers occur between warehouses THEN the system SHALL CONTINUE TO create stock_movements records

#### 4. Existing Frontend

3.9 WHEN users navigate between tabs THEN the system SHALL CONTINUE TO use handleTabChange with URL query parameter synchronization

3.10 WHEN DataContext refreshes THEN the system SHALL CONTINUE TO fetch all domain data (inventory, sales, purchases, manufacturing, payroll, approvals, expenses)

3.11 WHEN resource limits are checked THEN the system SHALL CONTINUE TO use useResourceLimits hook with plan tier enforcement

#### 5. Existing Schema

3.12 WHEN multi-tenant operations occur THEN the system SHALL CONTINUE TO use business_id foreign keys with cascade delete on all primary tables

3.13 WHEN audit logs are written THEN the system SHALL CONTINUE TO use auditWrite function for tracking entity changes

3.14 WHEN subscription tiers are checked THEN the system SHALL CONTINUE TO use plan_tier, plan_expires_at, max_products, max_warehouses fields on businesses table
