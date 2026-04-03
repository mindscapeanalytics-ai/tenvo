# Implementation Plan: Multi-Domain Multi-Tenant Architecture Fixes

## Overview

This plan addresses 19 critical architectural gaps organized by priority:
- **Priority 0 (Critical Security)**: 2 issues - SQL injection, cross-tenant leak
- **Priority 1 (High - Data Integrity & Core)**: 8 issues - Stock pipeline, hard-deletes, missing FKs, integration failures
- **Priority 2 (Medium - Frontend & UX)**: 5 issues - Runtime crashes, hardcoded values, empty pipelines
- **Priority 3 (Low - Schema Enhancements)**: 4 issues - Missing models and foreign keys

---

## PRIORITY 0: CRITICAL SECURITY FIXES (FIX IMMEDIATELY)

### C1: SQL Injection in updateBatchAction

- [x] 1.1 Write bug condition exploration test for SQL injection
  - **Property 1: Bug Condition** - SQL Injection via Unwhitelisted Columns
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate SQL injection vulnerability
  - **Scoped PBT Approach**: Test with malicious column names like "business_id", "id", "'; DROP TABLE batches; --"
  - Test that updateBatchAction rejects unwhitelisted columns (from Bug Condition C1 in design)
  - The test assertions should match Expected Behavior 2.1: whitelist enforcement
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the vulnerability exists)
  - Document counterexamples found to understand attack vectors
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 2.1_


- [ ] 1.2 Write preservation property tests for updateBatchAction (BEFORE implementing fix)
  - **Property 2: Preservation** - Valid Batch Update Operations
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: updateBatchAction with valid columns (batch_number, manufacturing_date, expiry_date, quantity, cost_price, mrp, notes, is_active) succeeds on unfixed code
  - Write property-based test: for all valid column updates, operation succeeds and updates database
  - Verify test passes on UNFIXED code
  - _Requirements: 3.1, 3.3_

- [ ] 1.3 Fix SQL injection vulnerability in updateBatchAction

  - [ ] 1.3.1 Implement column whitelist validation
    - Add ALLOWED_COLUMNS constant: ['batch_number', 'manufacturing_date', 'expiry_date', 'quantity', 'cost_price', 'mrp', 'notes', 'is_active']
    - Validate all update keys against whitelist before query execution
    - Return error response for unauthorized columns
    - File: `lib/actions/standard/inventory/batchActions.js`
    - _Bug_Condition: isBugCondition_C1 where Object.keys(updates).some(key => NOT key IN ALLOWED_COLUMNS)_
    - _Expected_Behavior: Reject unauthorized columns per 2.1_
    - _Preservation: Valid batch updates continue to work per 3.3_
    - _Requirements: 1.1, 2.1, 3.1, 3.3_

  - [ ] 1.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - SQL Injection Prevention
    - **IMPORTANT**: Re-run the SAME test from task 1.1 - do NOT write a new test
    - The test from task 1.1 encodes the expected behavior
    - When this test passes, it confirms SQL injection is prevented
    - Run bug condition exploration test from step 1.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms vulnerability is fixed)
    - _Requirements: 2.1_

  - [ ] 1.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Valid Batch Updates Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 1.2 - do NOT write new tests
    - Run preservation property tests from step 1.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 1.4 Checkpoint - Ensure C1 tests pass
  - Ensure all C1 tests pass, ask the user if questions arise

---

### C2: Cross-Tenant Data Leak in getProductVariantsAction

- [ ] 2.1 Write bug condition exploration test for cross-tenant leak
  - **Property 1: Bug Condition** - Cross-Tenant Variant Leak
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate cross-tenant data leak
  - **Scoped PBT Approach**: Create variants in Business A and Business B, query from Business A context
  - Test that getProductVariantsAction returns ONLY Business A variants (from Bug Condition C2 in design)
  - The test assertions should match Expected Behavior 2.2: businessId filtering
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the leak exists)
  - Document counterexamples found (e.g., "Query from Business A returns Business B variants")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.2, 2.2_

- [ ] 2.2 Write preservation property tests for getProductVariantsAction (BEFORE implementing fix)
  - **Property 2: Preservation** - Single-Tenant Variant Queries
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: getProductVariantsAction returns correct variants when only one tenant has data
  - Write property-based test: for single-tenant scenarios, all variants are returned correctly
  - Verify test passes on UNFIXED code
  - _Requirements: 3.1_

- [ ] 2.3 Fix cross-tenant data leak in getProductVariantsAction

  - [ ] 2.3.1 Implement businessId filtering
    - Add business_id filter to Prisma query WHERE clause
    - Ensure businessId is extracted from authenticated session
    - Validate businessId is present before query execution
    - File: `lib/actions/standard/inventory/variantActions.js`
    - _Bug_Condition: isBugCondition_C2 where query.where.business_id IS NULL_
    - _Expected_Behavior: Filter by businessId per 2.2_
    - _Preservation: Single-tenant queries continue to work per 3.1_
    - _Requirements: 1.2, 2.2, 3.1_

  - [ ] 2.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Tenant Isolation Enforced
    - **IMPORTANT**: Re-run the SAME test from task 2.1 - do NOT write a new test
    - The test from task 2.1 encodes the expected behavior
    - When this test passes, it confirms tenant isolation is enforced
    - Run bug condition exploration test from step 2.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms leak is fixed)
    - _Requirements: 2.2_

  - [ ] 2.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Single-Tenant Queries Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2.2 - do NOT write new tests
    - Run preservation property tests from step 2.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 2.4 Checkpoint - Ensure C2 tests pass
  - Ensure all C2 tests pass, ask the user if questions arise

---

## PRIORITY 1: HIGH - DATA INTEGRITY & CORE FUNCTIONALITY

### C3: POS Stock Deduction Bypasses Pipeline

- [ ] 3.1 Write bug condition exploration test for POS stock bypass
  - **Property 1: Bug Condition** - POS Bypasses Inventory Pipeline
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate pipeline bypass
  - **Scoped PBT Approach**: Create POS transaction with batch-tracked product, verify batch deduction
  - Test that POS transactions create stock_movements and inventory_ledger entries (from Bug Condition C3 in design)
  - The test assertions should match Expected Behavior 2.3: InventoryService.adjustStock() called
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bypass exists)
  - Document counterexamples found (e.g., "POS sale decrements product.stock but no stock_movements record")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.3, 2.3_


- [ ] 3.2 Write preservation property tests for POS transactions (BEFORE implementing fix)
  - **Property 2: Preservation** - POS Transaction Creation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: POS transactions create pos_transactions and pos_transaction_items records on unfixed code
  - Write property-based test: for all POS sales, transaction records are created correctly
  - Verify test passes on UNFIXED code
  - _Requirements: 3.3_

- [ ] 3.3 Fix POS stock deduction to use inventory pipeline

  - [ ] 3.3.1 Replace direct stock decrement with InventoryService.adjustStock()
    - Remove direct `prisma.products.update({ data: { stock: { decrement } } })` calls
    - Call `InventoryService.adjustStock()` for each line item with proper batch/serial allocation
    - Ensure stock_movements records are created with transaction reference
    - Ensure inventory_ledger entries are created for FIFO costing
    - Files: `lib/actions/standard/pos/posActions.js`, `lib/services/InventoryService.js`
    - _Bug_Condition: isBugCondition_C3 where NOT InventoryService.removeStock() called_
    - _Expected_Behavior: Call InventoryService.adjustStock() per 2.3_
    - _Preservation: POS transaction creation continues to work per 3.3_
    - _Requirements: 1.3, 2.3, 3.3_

  - [ ] 3.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - POS Uses Inventory Pipeline
    - **IMPORTANT**: Re-run the SAME test from task 3.1 - do NOT write a new test
    - The test from task 3.1 encodes the expected behavior
    - When this test passes, it confirms inventory pipeline is used
    - Run bug condition exploration test from step 3.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms pipeline is used)
    - _Requirements: 2.3_

  - [ ] 3.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - POS Transaction Creation Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 3.2 - do NOT write new tests
    - Run preservation property tests from step 3.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 3.4 Checkpoint - Ensure C3 tests pass
  - Ensure all C3 tests pass, ask the user if questions arise

---

### C4: Invoice Hard Delete

- [ ] 4.1 Write bug condition exploration test for invoice hard delete
  - **Property 1: Bug Condition** - Invoice Hard Delete Destroys Audit Trail
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate audit trail destruction
  - **Scoped PBT Approach**: Create invoice with GL entries, delete invoice, verify invoice still exists with is_deleted=true
  - Test that invoice deletion preserves record with soft-delete (from Bug Condition C4 in design)
  - The test assertions should match Expected Behavior 2.4: is_deleted=true, deleted_at=NOW()
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves hard-delete occurs)
  - Document counterexamples found (e.g., "Invoice deleted, GL entries orphaned")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.4, 2.4_

- [ ] 4.2 Write preservation property tests for invoice operations (BEFORE implementing fix)
  - **Property 2: Preservation** - Invoice Creation and Updates
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Invoice creation, updates, and queries work correctly on unfixed code
  - Write property-based test: for all invoice operations except delete, behavior is unchanged
  - Verify test passes on UNFIXED code
  - _Requirements: 3.4_

- [ ] 4.3 Fix invoice hard delete to use soft delete

  - [ ] 4.3.1 Implement soft-delete pattern for invoices
    - Replace `prisma.invoices.delete()` with `prisma.invoices.update({ data: { is_deleted: true, deleted_at: new Date() } })`
    - Add is_deleted and deleted_at columns to invoices table if not present
    - Update all invoice queries to filter `WHERE is_deleted = false OR is_deleted IS NULL`
    - Files: `lib/actions/standard/sales/invoiceActions.js`, `prisma/schema.prisma`
    - _Bug_Condition: isBugCondition_C4 where prisma.invoices.delete() called_
    - _Expected_Behavior: Soft-delete with is_deleted=true per 2.4_
    - _Preservation: Invoice creation and updates continue to work per 3.4_
    - _Requirements: 1.4, 2.4, 3.4_

  - [ ] 4.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Invoice Soft Delete Preserves Audit Trail
    - **IMPORTANT**: Re-run the SAME test from task 4.1 - do NOT write a new test
    - The test from task 4.1 encodes the expected behavior
    - When this test passes, it confirms soft-delete is implemented
    - Run bug condition exploration test from step 4.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms soft-delete works)
    - _Requirements: 2.4_

  - [ ] 4.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Invoice Operations Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 4.2 - do NOT write new tests
    - Run preservation property tests from step 4.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4.4 Checkpoint - Ensure C4 tests pass
  - Ensure all C4 tests pass, ask the user if questions arise

---

### C5: Missing business_id on Child Tables

- [x] 5.1 Write bug condition exploration test for missing business_id
  - **Property 1: Bug Condition** - Child Tables Missing business_id FK
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate missing FK vulnerability
  - **Scoped PBT Approach**: Create child records (purchase_items, pos_transaction_items, etc.), verify business_id is present
  - Test that child table records include business_id foreign key (from Bug Condition C5 in design)
  - The test assertions should match Expected Behavior 2.5: business_id on all child tables
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves FK is missing)
  - Document counterexamples found (e.g., "purchase_items created without business_id")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.5, 2.5_

- [ ] 5.2 Write preservation property tests for child table operations (BEFORE implementing fix)
  - **Property 2: Preservation** - Child Record Creation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Child records are created correctly with parent FK relationships on unfixed code
  - Write property-based test: for all child record creation, parent relationships are maintained
  - Verify test passes on UNFIXED code
  - _Requirements: 3.12_


- [ ] 5.3 Add business_id foreign key to 12+ child tables

  - [ ] 5.3.1 Add business_id column to child tables in schema
    - Add `business_id String @db.Uuid` to: purchase_items, pos_transaction_items, pos_payments, pos_refund_items, restaurant_order_items, challan_items, credit_note_items, payroll_items, campaign_messages, segment_customers, price_list_items, promotion_products
    - Add foreign key relation: `business Business @relation(fields: [business_id], references: [id], onDelete: Cascade)`
    - Add index: `@@index([business_id])`
    - File: `prisma/schema.prisma`
    - _Bug_Condition: isBugCondition_C5 where input.schema.business_id IS NULL_
    - _Expected_Behavior: Include business_id FK per 2.5_
    - _Preservation: Parent relationships continue to work per 3.12_
    - _Requirements: 1.5, 2.5, 3.12_

  - [ ] 5.3.2 Update child record creation to include business_id
    - Modify all create operations for child tables to include business_id from parent or session
    - Ensure business_id is propagated from parent record (e.g., purchase_items gets business_id from purchase)
    - Files: `lib/actions/standard/purchases/purchaseActions.js`, `lib/actions/standard/pos/posActions.js`, `lib/actions/standard/restaurant/orderActions.js`, `lib/actions/standard/payroll/payrollActions.js`, `lib/actions/standard/crm/campaignActions.js`, `lib/actions/standard/crm/segmentActions.js`, `lib/actions/standard/pricing/priceListActions.js`, `lib/actions/standard/crm/promotionActions.js`
    - _Requirements: 1.5, 2.5_

  - [ ] 5.3.3 Run database migration
    - Generate Prisma migration: `npx prisma migrate dev --name add_business_id_to_child_tables`
    - Backfill existing records with business_id from parent tables
    - Verify migration completes successfully
    - _Requirements: 1.5, 2.5_

  - [ ] 5.3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Child Tables Have business_id FK
    - **IMPORTANT**: Re-run the SAME test from task 5.1 - do NOT write a new test
    - The test from task 5.1 encodes the expected behavior
    - When this test passes, it confirms business_id FK is present
    - Run bug condition exploration test from step 5.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms FK is added)
    - _Requirements: 2.5_

  - [ ] 5.3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Child Record Creation Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 5.2 - do NOT write new tests
    - Run preservation property tests from step 5.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 5.4 Checkpoint - Ensure C5 tests pass
  - Ensure all C5 tests pass, ask the user if questions arise

---

### C6: POS Transactions Don't Create Payment/GL Records

- [ ] 6.1 Write bug condition exploration test for POS payment/GL missing
  - **Property 1: Bug Condition** - POS Transactions Missing Payment/GL Records
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate missing payment/GL records
  - **Scoped PBT Approach**: Create POS cash sale, verify payment record and GL entries exist
  - Test that POS transactions create payment records and GL entries (from Bug Condition C6 in design)
  - The test assertions should match Expected Behavior 2.6: payment record + GL entries (Cash debit, Revenue credit, Tax credit)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves records are missing)
  - Document counterexamples found (e.g., "POS sale of $100 creates no payment record, no GL entries")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.6, 2.6_

- [ ] 6.2 Write preservation property tests for POS transactions (BEFORE implementing fix)
  - **Property 2: Preservation** - POS Transaction Recording
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: POS transactions create pos_transactions records correctly on unfixed code
  - Write property-based test: for all POS sales, transaction records are created
  - Verify test passes on UNFIXED code
  - _Requirements: 3.3_

- [ ] 6.3 Fix POS transactions to create payment and GL records

  - [ ] 6.3.1 Implement payment record creation for POS transactions
    - After POS transaction creation, create payment record in payments table
    - Link payment to customer if customer_id is present
    - Set payment method (cash, card, mobile_wallet) from POS transaction
    - Set payment amount to transaction total
    - File: `lib/actions/standard/pos/posActions.js`
    - _Bug_Condition: isBugCondition_C6 where NOT payments table record created_
    - _Expected_Behavior: Create payment record per 2.6_
    - _Preservation: POS transaction recording continues to work per 3.3_
    - _Requirements: 1.6, 2.6, 3.3_

  - [ ] 6.3.2 Implement GL entry creation for POS transactions
    - Call `AccountingService.recordBusinessTransaction()` with transaction details
    - Create GL entries: Debit Cash (or Card/Mobile Wallet), Credit Revenue, Credit Sales Tax Payable
    - Calculate revenue as total - tax, tax as total * tax_rate
    - Ensure GL entries are created within same database transaction as POS transaction
    - Files: `lib/actions/standard/pos/posActions.js`, `lib/services/AccountingService.js`
    - _Requirements: 1.6, 2.6, 3.4_

  - [ ] 6.3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - POS Creates Payment/GL Records
    - **IMPORTANT**: Re-run the SAME test from task 6.1 - do NOT write a new test
    - The test from task 6.1 encodes the expected behavior
    - When this test passes, it confirms payment/GL records are created
    - Run bug condition exploration test from step 6.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms records are created)
    - _Requirements: 2.6_

  - [ ] 6.3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - POS Transaction Recording Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 6.2 - do NOT write new tests
    - Run preservation property tests from step 6.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 6.4 Checkpoint - Ensure C6 tests pass
  - Ensure all C6 tests pass, ask the user if questions arise

---

### C7: Restaurant Orders Don't Deduct Inventory

- [ ] 7.1 Write bug condition exploration test for restaurant inventory deduction
  - **Property 1: Bug Condition** - Restaurant Orders Don't Deduct Inventory
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate missing inventory deduction
  - **Scoped PBT Approach**: Create restaurant order with recipe, verify ingredient stock is deducted
  - Test that restaurant orders deduct ingredient inventory (from Bug Condition C7 in design)
  - The test assertions should match Expected Behavior 2.7: InventoryService.removeStock() called for each ingredient
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves deduction is missing)
  - Document counterexamples found (e.g., "Order for Chicken Biryani doesn't deduct 500g chicken, 200g rice")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.7, 2.7_


- [ ] 7.2 Write preservation property tests for restaurant orders (BEFORE implementing fix)
  - **Property 2: Preservation** - Restaurant Order Creation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Restaurant orders create restaurant_orders and restaurant_order_items records on unfixed code
  - Write property-based test: for all restaurant orders, order records are created correctly
  - Verify test passes on UNFIXED code
  - _Requirements: 3.6_

- [ ] 7.3 Fix restaurant orders to deduct ingredient inventory

  - [ ] 7.3.1 Implement ingredient deduction for restaurant orders
    - After restaurant order creation, iterate through order items
    - For each item, fetch recipe/BOM data with ingredient list
    - For each ingredient, call `InventoryService.adjustStock()` with negative quantity
    - Ensure stock_movements records are created with restaurant_order reference
    - Files: `lib/actions/standard/restaurant/orderActions.js`, `lib/services/InventoryService.js`
    - _Bug_Condition: isBugCondition_C7 where NOT InventoryService.removeStock() called for ingredients_
    - _Expected_Behavior: Deduct ingredient quantities per 2.7_
    - _Preservation: Restaurant order creation continues to work per 3.6_
    - _Requirements: 1.7, 2.7, 3.6_

  - [ ] 7.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Restaurant Orders Deduct Inventory
    - **IMPORTANT**: Re-run the SAME test from task 7.1 - do NOT write a new test
    - The test from task 7.1 encodes the expected behavior
    - When this test passes, it confirms inventory deduction works
    - Run bug condition exploration test from step 7.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms deduction works)
    - _Requirements: 2.7_

  - [ ] 7.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Restaurant Order Creation Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 7.2 - do NOT write new tests
    - Run preservation property tests from step 7.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 7.4 Checkpoint - Ensure C7 tests pass
  - Ensure all C7 tests pass, ask the user if questions arise

---

### C8: Payroll GL Misposting

- [ ] 8.1 Write bug condition exploration test for payroll GL misposting
  - **Property 1: Bug Condition** - Payroll Posted to Wrong GL Account
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate incorrect GL posting
  - **Scoped PBT Approach**: Create payroll run, verify GL entries use PAYROLL_EXPENSE not SALES_TAX_PAYABLE
  - Test that payroll GL entries use correct accounts (from Bug Condition C8 in design)
  - The test assertions should match Expected Behavior 2.8: PAYROLL_EXPENSE and PAYROLL_PAYABLE accounts
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves misposting occurs)
  - Document counterexamples found (e.g., "Payroll $10,000 posted to SALES_TAX_PAYABLE instead of PAYROLL_EXPENSE")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.8, 2.8_

- [ ] 8.2 Write preservation property tests for payroll operations (BEFORE implementing fix)
  - **Property 2: Preservation** - Payroll Run Creation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Payroll runs create payroll_runs and payroll_items records on unfixed code
  - Write property-based test: for all payroll runs, payroll records are created correctly
  - Verify test passes on UNFIXED code
  - _Requirements: 3.10_

- [ ] 8.3 Fix payroll GL posting to use correct accounts

  - [ ] 8.3.1 Correct payroll GL account mapping
    - Replace SALES_TAX_PAYABLE with PAYROLL_EXPENSE for gross salary debit
    - Use PAYROLL_PAYABLE for net salary credit
    - Use appropriate deduction accounts (INCOME_TAX_PAYABLE, EOBI_PAYABLE, etc.) for deductions
    - Files: `lib/actions/standard/payroll/payrollActions.js`, `lib/services/AccountingService.js`
    - _Bug_Condition: isBugCondition_C8 where accountType == 'SALES_TAX_PAYABLE' for payroll_
    - _Expected_Behavior: Use PAYROLL_EXPENSE and PAYROLL_PAYABLE per 2.8_
    - _Preservation: Payroll run creation continues to work per 3.10_
    - _Requirements: 1.8, 2.8, 3.10_

  - [ ] 8.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Payroll Uses Correct GL Accounts
    - **IMPORTANT**: Re-run the SAME test from task 8.1 - do NOT write a new test
    - The test from task 8.1 encodes the expected behavior
    - When this test passes, it confirms correct GL accounts are used
    - Run bug condition exploration test from step 8.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms correct posting)
    - _Requirements: 2.8_

  - [ ] 8.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Payroll Run Creation Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 8.2 - do NOT write new tests
    - Run preservation property tests from step 8.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 8.4 Checkpoint - Ensure C8 tests pass
  - Ensure all C8 tests pass, ask the user if questions arise

---

### C9: adjustStockAction GL Posting Fails

- [ ] 9.1 Write bug condition exploration test for adjustStockAction GL failure
  - **Property 1: Bug Condition** - adjustStockAction Releases Client Before GL Posting
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate GL posting failure
  - **Scoped PBT Approach**: Create stock adjustment, verify GL entries are created successfully
  - Test that adjustStockAction creates GL entries (from Bug Condition C9 in design)
  - The test assertions should match Expected Behavior 2.9: GL entries created within transaction
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves GL posting fails)
  - Document counterexamples found (e.g., "Stock adjustment +50 units creates no GL entry")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.9, 2.9_

- [ ] 9.2 Write preservation property tests for stock adjustments (BEFORE implementing fix)
  - **Property 2: Preservation** - Stock Adjustment Creation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Stock adjustments create stock_movements records on unfixed code
  - Write property-based test: for all stock adjustments, stock_movements records are created
  - Verify test passes on UNFIXED code
  - _Requirements: 3.8_


- [ ] 9.3 Fix adjustStockAction to keep client open for GL posting

  - [ ] 9.3.1 Refactor transaction management in adjustStockAction
    - Move `client.release()` call to AFTER all GL posting queries complete
    - Ensure AccountingService.recordBusinessTransaction() is called BEFORE client.release()
    - Wrap entire operation in try-catch-finally with client.release() in finally block
    - File: `lib/actions/standard/inventory/stockActions.js`
    - _Bug_Condition: isBugCondition_C9 where client.release() called before GL posting_
    - _Expected_Behavior: Keep client open until GL posting completes per 2.9_
    - _Preservation: Stock adjustment creation continues to work per 3.8_
    - _Requirements: 1.9, 2.9, 3.8_

  - [ ] 9.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - adjustStockAction Creates GL Entries
    - **IMPORTANT**: Re-run the SAME test from task 9.1 - do NOT write a new test
    - The test from task 9.1 encodes the expected behavior
    - When this test passes, it confirms GL entries are created
    - Run bug condition exploration test from step 9.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms GL posting works)
    - _Requirements: 2.9_

  - [ ] 9.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Stock Adjustment Creation Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 9.2 - do NOT write new tests
    - Run preservation property tests from step 9.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 9.4 Checkpoint - Ensure C9 tests pass
  - Ensure all C9 tests pass, ask the user if questions arise

---

### C10: Expenses Don't Create Payment Records

- [ ] 10.1 Write bug condition exploration test for expense payment missing
  - **Property 1: Bug Condition** - Expenses Missing Payment Records
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate missing payment records
  - **Scoped PBT Approach**: Create expense, verify payment record exists with payment_id link
  - Test that expenses create payment records (from Bug Condition C10 in design)
  - The test assertions should match Expected Behavior 2.10: payment record created with payment_id FK
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves payment record is missing)
  - Document counterexamples found (e.g., "Expense $500 created with payment_id=null, no payment record")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.10, 2.10_

- [ ] 10.2 Write preservation property tests for expense operations (BEFORE implementing fix)
  - **Property 2: Preservation** - Expense Creation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Expenses create expenses records correctly on unfixed code
  - Write property-based test: for all expenses, expense records are created
  - Verify test passes on UNFIXED code
  - _Requirements: 3.10_

- [ ] 10.3 Fix expenses to create payment records

  - [ ] 10.3.1 Implement payment record creation for expenses
    - After expense creation, create payment record in payments table
    - Link payment to vendor if vendor_id is present
    - Set payment method from expense payment_method field
    - Set payment amount to expense amount
    - Update expense with payment_id foreign key
    - Files: `lib/actions/standard/finance/expenseActions.js`, `prisma/schema.prisma`
    - _Bug_Condition: isBugCondition_C10 where NOT payment record created_
    - _Expected_Behavior: Create payment record with payment_id FK per 2.10_
    - _Preservation: Expense creation continues to work per 3.10_
    - _Requirements: 1.10, 2.10, 3.10_

  - [ ] 10.3.2 Add payment_id foreign key to expenses table
    - Add `payment_id String? @db.Uuid` to expenses model
    - Add foreign key relation: `payment Payment? @relation(fields: [payment_id], references: [id])`
    - Generate and run migration
    - File: `prisma/schema.prisma`
    - _Requirements: 1.10, 2.10_

  - [ ] 10.3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Expenses Create Payment Records
    - **IMPORTANT**: Re-run the SAME test from task 10.1 - do NOT write a new test
    - The test from task 10.1 encodes the expected behavior
    - When this test passes, it confirms payment records are created
    - Run bug condition exploration test from step 10.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms payment record is created)
    - _Requirements: 2.10_

  - [ ] 10.3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Expense Creation Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 10.2 - do NOT write new tests
    - Run preservation property tests from step 10.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 10.4 Checkpoint - Ensure C10 tests pass
  - Ensure all C10 tests pass, ask the user if questions arise

---

## PRIORITY 2: MEDIUM - FRONTEND & UX

### C11: handleStockTransfer Runtime Crash

- [ ] 11.1 Write bug condition exploration test for handleStockTransfer crash
  - **Property 1: Bug Condition** - handleStockTransfer Calls Non-Existent Function
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate runtime crash
  - **Scoped PBT Approach**: Trigger stock transfer, verify no ReferenceError occurs
  - Test that handleStockTransfer executes without error (from Bug Condition C11 in design)
  - The test assertions should match Expected Behavior 2.11: call DataContext.refreshInventory()
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves crash occurs)
  - Document counterexamples found (e.g., "ReferenceError: setProducts is not defined")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.11, 2.11_

- [ ] 11.2 Write preservation property tests for stock transfer UI (BEFORE implementing fix)
  - **Property 2: Preservation** - Stock Transfer Form Rendering
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Stock transfer form renders correctly on unfixed code (before submit)
  - Write property-based test: for stock transfer form rendering, UI displays correctly
  - Verify test passes on UNFIXED code
  - _Requirements: 3.9_

- [ ] 11.3 Fix handleStockTransfer to call valid refresh function

  - [ ] 11.3.1 Replace setProducts with DataContext.refreshInventory()
    - Remove `setProducts()` call
    - Replace with `DataContext.refreshInventory()` or equivalent valid function
    - Ensure DataContext is imported and available in scope
    - File: `components/AdvancedInventoryFeatures.jsx`
    - _Bug_Condition: isBugCondition_C11 where setProducts() called and NOT DEFINED_
    - _Expected_Behavior: Call DataContext.refreshInventory() per 2.11_
    - _Preservation: Stock transfer form rendering continues to work per 3.9_
    - _Requirements: 1.11, 2.11, 3.9_

  - [ ] 11.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - handleStockTransfer Executes Without Error
    - **IMPORTANT**: Re-run the SAME test from task 11.1 - do NOT write a new test
    - The test from task 11.1 encodes the expected behavior
    - When this test passes, it confirms crash is fixed
    - Run bug condition exploration test from step 11.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms no crash)
    - _Requirements: 2.11_

  - [ ] 11.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Stock Transfer Form Rendering Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 11.2 - do NOT write new tests
    - Run preservation property tests from step 11.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 11.4 Checkpoint - Ensure C11 tests pass
  - Ensure all C11 tests pass, ask the user if questions arise

---

### C12: Dashboard Hardcoded Growth Percentages


- [ ] 12.1 Write bug condition exploration test for hardcoded growth percentages
  - **Property 1: Bug Condition** - Dashboard Shows Hardcoded Growth Values
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate hardcoded values
  - **Scoped PBT Approach**: Render dashboard with known financial data, verify growth percentages are calculated not hardcoded
  - Test that dashboard displays calculated growth percentages (from Bug Condition C12 in design)
  - The test assertions should match Expected Behavior 2.12: calculated period-over-period changes
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves hardcoded values exist)
  - Document counterexamples found (e.g., "Dashboard shows 8.2% growth when actual is -3.5%")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.12, 2.12_

- [ ] 12.2 Write preservation property tests for dashboard metrics (BEFORE implementing fix)
  - **Property 2: Preservation** - Dashboard Metric Display
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Dashboard displays absolute values (revenue, expenses, profit) correctly on unfixed code
  - Write property-based test: for dashboard absolute metrics, values are displayed correctly
  - Verify test passes on UNFIXED code
  - _Requirements: 3.10_

- [ ] 12.3 Fix dashboard to calculate growth percentages

  - [ ] 12.3.1 Implement growth percentage calculation
    - Fetch current period and previous period financial data
    - Calculate growth percentage: ((current - previous) / previous) * 100
    - Replace hardcoded values (8.2, 18.7, 12.5, 5.3) with calculated values
    - Handle edge cases: previous period = 0, no previous data
    - Files: `components/EnhancedDashboard.jsx`, `components/dashboard/FinancialOverview.jsx`
    - _Bug_Condition: isBugCondition_C12 where growthPercentage IN [8.2, 18.7, 12.5, 5.3]_
    - _Expected_Behavior: Calculate actual period-over-period changes per 2.12_
    - _Preservation: Dashboard absolute metrics continue to work per 3.10_
    - _Requirements: 1.12, 2.12, 3.10_

  - [ ] 12.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Dashboard Shows Calculated Growth
    - **IMPORTANT**: Re-run the SAME test from task 12.1 - do NOT write a new test
    - The test from task 12.1 encodes the expected behavior
    - When this test passes, it confirms growth is calculated
    - Run bug condition exploration test from step 12.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms calculated growth)
    - _Requirements: 2.12_

  - [ ] 12.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Dashboard Metric Display Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 12.2 - do NOT write new tests
    - Run preservation property tests from step 12.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 12.4 Checkpoint - Ensure C12 tests pass
  - Ensure all C12 tests pass, ask the user if questions arise

---

### C13: Premium Tabs Bypass Subscription Gate

- [ ] 13.1 Write bug condition exploration test for subscription bypass
  - **Property 1: Bug Condition** - Premium Tabs Accessible Without Subscription
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate subscription bypass
  - **Scoped PBT Approach**: Navigate to premium tabs with basic plan, verify UpgradePrompt renders
  - Test that premium tabs show UpgradePrompt for unauthorized plans (from Bug Condition C13 in design)
  - The test assertions should match Expected Behavior 2.13: UpgradePrompt component rendered
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves bypass exists)
  - Document counterexamples found (e.g., "Basic plan user accesses /business/retail?tab=manufacturing, sees full UI")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.13, 2.13_

- [ ] 13.2 Write preservation property tests for tab navigation (BEFORE implementing fix)
  - **Property 2: Preservation** - Authorized Tab Access
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Users with appropriate plan access premium tabs correctly on unfixed code
  - Write property-based test: for authorized plan tiers, premium tabs render correctly
  - Verify test passes on UNFIXED code
  - _Requirements: 3.9, 3.11_

- [ ] 13.3 Fix premium tabs to enforce subscription gate

  - [ ] 13.3.1 Add subscription check to premium tab rendering
    - For tabs: manufacturing, loyalty, audit, payroll, approvals
    - Check `planHasFeature(currentPlan, tabName)` before rendering content
    - Render `<UpgradePrompt feature={tabName} />` if check fails
    - Render tab content if check passes
    - Files: `app/business/[category]/page.jsx`, `components/UpgradePrompt.jsx`
    - _Bug_Condition: isBugCondition_C13 where NOT planHasFeature() AND NOT UpgradePrompt rendered_
    - _Expected_Behavior: Render UpgradePrompt for unauthorized access per 2.13_
    - _Preservation: Authorized tab access continues to work per 3.9, 3.11_
    - _Requirements: 1.13, 2.13, 3.9, 3.11_

  - [ ] 13.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Premium Tabs Show UpgradePrompt
    - **IMPORTANT**: Re-run the SAME test from task 13.1 - do NOT write a new test
    - The test from task 13.1 encodes the expected behavior
    - When this test passes, it confirms subscription gate is enforced
    - Run bug condition exploration test from step 13.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms gate is enforced)
    - _Requirements: 2.13_

  - [ ] 13.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Authorized Tab Access Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 13.2 - do NOT write new tests
    - Run preservation property tests from step 13.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 13.4 Checkpoint - Ensure C13 tests pass
  - Ensure all C13 tests pass, ask the user if questions arise

---

### C14: Payroll/Approvals Empty Data Pipelines

- [ ] 14.1 Write bug condition exploration test for empty data pipelines
  - **Property 1: Bug Condition** - Payroll/Approvals Tabs Have No Data Pipeline
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate missing data pipeline
  - **Scoped PBT Approach**: Render Payroll/Approvals tabs, verify API calls are made
  - Test that Payroll/Approvals tabs fetch data from backend (from Bug Condition C14 in design)
  - The test assertions should match Expected Behavior 2.14: API calls to payrollAPI and workflowAPI
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves pipeline is missing)
  - Document counterexamples found (e.g., "Payroll tab renders with no API call to getEmployees()")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.14, 2.14_

- [ ] 14.2 Write preservation property tests for tab rendering (BEFORE implementing fix)
  - **Property 2: Preservation** - Tab Shell Rendering
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Payroll/Approvals tabs render shell UI correctly on unfixed code
  - Write property-based test: for tab shell rendering, UI structure is correct
  - Verify test passes on UNFIXED code
  - _Requirements: 3.9_


- [ ] 14.3 Wire data pipelines for Payroll and Approvals tabs

  - [ ] 14.3.1 Implement Payroll data fetching
    - Add API calls to `payrollAPI.getEmployees()` and `payrollAPI.getRuns()`
    - Wire data to Payroll tab component state
    - Display employee list and payroll run history
    - File: `app/business/[category]/page.jsx` (Payroll tab section)
    - _Bug_Condition: isBugCondition_C14 where NOT payrollAPI.getEmployees() called_
    - _Expected_Behavior: Wire data fetching per 2.14_
    - _Preservation: Tab shell rendering continues to work per 3.9_
    - _Requirements: 1.14, 2.14, 3.9_

  - [ ] 14.3.2 Implement Approvals data fetching
    - Add API calls to `workflowAPI.getPendingApprovals()` and `workflowAPI.getHistory()`
    - Wire data to Approvals tab component state
    - Display pending approvals list and approval history
    - File: `app/business/[category]/page.jsx` (Approvals tab section)
    - _Requirements: 1.14, 2.14, 3.9_

  - [ ] 14.3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Payroll/Approvals Fetch Data
    - **IMPORTANT**: Re-run the SAME test from task 14.1 - do NOT write a new test
    - Run bug condition exploration test from step 14.1
    - **EXPECTED OUTCOME**: Test PASSES (confirms data pipeline is wired)
    - _Requirements: 2.14_

  - [ ] 14.3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Tab Shell Rendering Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 14.2 - do NOT write new tests
    - Run preservation property tests from step 14.2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)

- [ ] 14.4 Checkpoint - Ensure C14 tests pass

---

### C15: Business Switch Stale Data Flash

- [ ] 15.1 Write bug condition exploration test for stale data flash
  - **Property 1: Bug Condition** - Business Switch Shows Stale Data
  - **CRITICAL**: This test MUST FAIL on unfixed code
  - **GOAL**: Surface counterexamples that demonstrate stale data flash
  - **Scoped PBT Approach**: Switch businesses, verify loading boundary prevents stale data display
  - Test that business switch shows loading state (from Bug Condition C15 in design)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (proves stale data flash exists)
  - _Requirements: 1.15, 2.15_

- [ ] 15.2 Write preservation property tests for business switch (BEFORE implementing fix)
  - **Property 2: Preservation** - Business Switch Functionality
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Business switch updates context correctly on unfixed code
  - Verify test passes on UNFIXED code
  - _Requirements: 3.9_

- [ ] 15.3 Add loading boundary for business switch

  - [ ] 15.3.1 Implement BusinessLoadingBoundary component
    - Create loading boundary component that shows spinner during business switch
    - Wrap business content with BusinessLoadingBoundary
    - File: `app/business/layout.js`
    - _Bug_Condition: isBugCondition_C15 where NOT BusinessLoadingBoundary wrapping content_
    - _Expected_Behavior: Display loading boundary per 2.15_
    - _Requirements: 1.15, 2.15, 3.9_

  - [ ] 15.3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Business Switch Shows Loading State
    - Run bug condition exploration test from step 15.1
    - **EXPECTED OUTCOME**: Test PASSES
    - _Requirements: 2.15_

  - [ ] 15.3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Business Switch Functionality Unchanged
    - Run preservation property tests from step 15.2
    - **EXPECTED OUTCOME**: Tests PASS

- [ ] 15.4 Checkpoint - Ensure C15 tests pass

---

## PRIORITY 3: LOW - SCHEMA ENHANCEMENTS

### C16: No Purchase Returns Model

- [ ] 16.1 Write bug condition exploration test for purchase returns
  - **Property 1: Bug Condition** - No Purchase Returns Model
  - **CRITICAL**: This test MUST FAIL on unfixed code
  - **GOAL**: Surface counterexamples that demonstrate missing model
  - Test that purchase returns can be stored (from Bug Condition C16 in design)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS
  - _Requirements: 1.16, 2.16_

- [ ] 16.2 Write preservation property tests for purchase operations (BEFORE implementing fix)
  - **Property 2: Preservation** - Purchase Creation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Purchase creation works correctly on unfixed code
  - Verify test passes on UNFIXED code
  - _Requirements: 3.3_

- [ ] 16.3 Add purchase_returns model

  - [ ] 16.3.1 Create purchase_returns schema
    - Add purchase_returns model with columns: id, business_id, vendor_id, return_number, return_date, total_amount, status, notes
    - Add purchase_return_items model with columns: id, business_id, return_id, product_id, quantity, unit_price, total
    - File: `prisma/schema.prisma`
    - _Bug_Condition: isBugCondition_C16 where NOT purchase_returns table exists_
    - _Expected_Behavior: Create purchase_returns model per 2.16_
    - _Requirements: 1.16, 2.16_

  - [ ] 16.3.2 Run database migration
    - Generate migration: `npx prisma migrate dev --name add_purchase_returns`
    - _Requirements: 1.16, 2.16_

  - [ ] 16.3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Purchase Returns Model Exists
    - Run bug condition exploration test from step 16.1
    - **EXPECTED OUTCOME**: Test PASSES
    - _Requirements: 2.16_

  - [ ] 16.3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Purchase Creation Unchanged
    - Run preservation property tests from step 16.2
    - **EXPECTED OUTCOME**: Tests PASS

- [ ] 16.4 Checkpoint - Ensure C16 tests pass

---

### C17: No Document Sequences Model

- [ ] 17.1 Write bug condition exploration test for document sequences
  - **Property 1: Bug Condition** - No Document Sequences Model
  - **CRITICAL**: This test MUST FAIL on unfixed code
  - **GOAL**: Surface counterexamples that demonstrate missing model
  - Test that document sequences can be managed (from Bug Condition C17 in design)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS
  - _Requirements: 1.17, 2.17_

- [ ] 17.2 Write preservation property tests for document generation (BEFORE implementing fix)
  - **Property 2: Preservation** - Manual Document Numbering
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Manual document numbering works on unfixed code
  - Verify test passes on UNFIXED code
  - _Requirements: 3.13_

- [ ] 17.3 Add document_sequences model

  - [ ] 17.3.1 Create document_sequences schema
    - Add document_sequences model with columns: id, business_id, document_type, prefix, current_number, padding_length
    - Add unique constraint on (business_id, document_type)
    - File: `prisma/schema.prisma`
    - _Bug_Condition: isBugCondition_C17 where NOT document_sequences table exists_
    - _Expected_Behavior: Create document_sequences model per 2.17_
    - _Requirements: 1.17, 2.17_

  - [ ] 17.3.2 Run database migration
    - Generate migration: `npx prisma migrate dev --name add_document_sequences`
    - _Requirements: 1.17, 2.17_

  - [ ] 17.3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Document Sequences Model Exists
    - Run bug condition exploration test from step 17.1
    - **EXPECTED OUTCOME**: Test PASSES
    - _Requirements: 2.17_

  - [ ] 17.3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Manual Document Numbering Unchanged
    - Run preservation property tests from step 17.2
    - **EXPECTED OUTCOME**: Tests PASS

- [ ] 17.4 Checkpoint - Ensure C17 tests pass

---

### C18: POS Transactions Missing invoice_id FK

- [ ] 18.1 Write bug condition exploration test for POS invoice link
  - **Property 1: Bug Condition** - POS Transactions Missing invoice_id FK
  - **CRITICAL**: This test MUST FAIL on unfixed code
  - **GOAL**: Surface counterexamples that demonstrate missing FK
  - Test that POS transactions can link to invoices (from Bug Condition C18 in design)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS
  - _Requirements: 1.18, 2.18_

- [ ] 18.2 Write preservation property tests for POS transactions (BEFORE implementing fix)
  - **Property 2: Preservation** - POS Transaction Creation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: POS transaction creation works on unfixed code
  - Verify test passes on UNFIXED code
  - _Requirements: 3.3_


- [ ] 18.3 Add invoice_id foreign key to pos_transactions

  - [ ] 18.3.1 Add invoice_id to pos_transactions schema
    - Add `invoice_id String? @db.Uuid` to pos_transactions model
    - Add foreign key relation: `invoice Invoice? @relation(fields: [invoice_id], references: [id])`
    - File: `prisma/schema.prisma`
    - _Bug_Condition: isBugCondition_C18 where pos_transactions.invoice_id IS NULL in schema_
    - _Expected_Behavior: Add invoice_id FK per 2.18_
    - _Requirements: 1.18, 2.18_

  - [ ] 18.3.2 Run database migration
    - Generate migration: `npx prisma migrate dev --name add_invoice_id_to_pos_transactions`
    - _Requirements: 1.18, 2.18_

  - [ ] 18.3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - POS Transactions Have invoice_id FK
    - Run bug condition exploration test from step 18.1
    - **EXPECTED OUTCOME**: Test PASSES
    - _Requirements: 2.18_

  - [ ] 18.3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - POS Transaction Creation Unchanged
    - Run preservation property tests from step 18.2
    - **EXPECTED OUTCOME**: Tests PASS

- [ ] 18.4 Checkpoint - Ensure C18 tests pass

---

### C19: Production Orders Missing output_warehouse_id

- [ ] 19.1 Write bug condition exploration test for production output warehouse
  - **Property 1: Bug Condition** - Production Orders Missing output_warehouse_id
  - **CRITICAL**: This test MUST FAIL on unfixed code
  - **GOAL**: Surface counterexamples that demonstrate missing FK
  - Test that production orders can track output warehouse (from Bug Condition C19 in design)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS
  - _Requirements: 1.19, 2.19_

- [ ] 19.2 Write preservation property tests for production orders (BEFORE implementing fix)
  - **Property 2: Preservation** - Production Order Creation
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Production order creation works on unfixed code
  - Verify test passes on UNFIXED code
  - _Requirements: 3.6_

- [ ] 19.3 Add output_warehouse_id to production_orders

  - [ ] 19.3.1 Add output_warehouse_id to production_orders schema
    - Add `output_warehouse_id String? @db.Uuid` to production_orders model
    - Add foreign key relation: `output_warehouse Warehouse? @relation(fields: [output_warehouse_id], references: [id])`
    - File: `prisma/schema.prisma`
    - _Bug_Condition: isBugCondition_C19 where production_orders.output_warehouse_id IS NULL in schema_
    - _Expected_Behavior: Add output_warehouse_id FK per 2.19_
    - _Requirements: 1.19, 2.19_

  - [ ] 19.3.2 Run database migration
    - Generate migration: `npx prisma migrate dev --name add_output_warehouse_id_to_production_orders`
    - _Requirements: 1.19, 2.19_

  - [ ] 19.3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Production Orders Have output_warehouse_id FK
    - Run bug condition exploration test from step 19.1
    - **EXPECTED OUTCOME**: Test PASSES
    - _Requirements: 2.19_

  - [ ] 19.3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Production Order Creation Unchanged
    - Run preservation property tests from step 19.2
    - **EXPECTED OUTCOME**: Tests PASS

- [ ] 19.4 Checkpoint - Ensure C19 tests pass

---

## FINAL CHECKPOINT

- [ ] 20. Final Integration Testing
  - Run full test suite across all 19 fixes
  - Verify no regressions in existing functionality
  - Confirm all security vulnerabilities are patched
  - Validate data integrity across all integrations
  - Test multi-tenant isolation enforcement
  - Verify frontend UX improvements
  - Confirm schema enhancements are functional
  - Ask user for final review and approval

---

## Rollback Strategy

Each fix includes rollback instructions:

**Priority 0 (Security):**
- C1: Revert batchActions.js changes, remove whitelist validation
- C2: Revert variantActions.js changes, remove businessId filter

**Priority 1 (Data Integrity & Core):**
- C3: Revert posActions.js changes, restore direct stock decrement
- C4: Revert invoiceActions.js changes, restore hard delete
- C5: Rollback migration, remove business_id columns from child tables
- C6: Revert posActions.js changes, remove payment/GL creation
- C7: Revert orderActions.js changes, remove ingredient deduction
- C8: Revert payrollActions.js changes, restore SALES_TAX_PAYABLE posting
- C9: Revert stockActions.js changes, restore original transaction management
- C10: Revert expenseActions.js changes, rollback migration removing payment_id

**Priority 2 (Frontend):**
- C11: Revert AdvancedInventoryFeatures.jsx changes
- C12: Revert dashboard component changes, restore hardcoded values
- C13: Revert page.jsx changes, remove subscription checks
- C14: Revert page.jsx changes, remove data fetching
- C15: Revert layout.js changes, remove loading boundary

**Priority 3 (Schema):**
- C16: Rollback migration, drop purchase_returns tables
- C17: Rollback migration, drop document_sequences table
- C18: Rollback migration, remove invoice_id from pos_transactions
- C19: Rollback migration, remove output_warehouse_id from production_orders

---

## Testing Approach

**Unit Tests:**
- Each bug condition exploration test validates the specific fix
- Preservation tests ensure no regressions

**Integration Tests:**
- Test cross-module interactions (POS→Inventory→Finance)
- Verify transaction boundaries and data consistency

**Security Tests:**
- Penetration testing for SQL injection (C1)
- Multi-tenant isolation testing (C2, C5)

**Performance Tests:**
- Measure impact of additional validations and queries
- Ensure no significant performance degradation

**User Acceptance Tests:**
- Validate frontend fixes with real user workflows
- Confirm UX improvements meet requirements

