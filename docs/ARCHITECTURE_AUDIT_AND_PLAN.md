# TENVO ERP — Comprehensive Architecture Audit & Gap-Free Plan

> **Date:** 2026-03-03  
> **Scope:** Schema, Backend, Frontend, Integrations, Subscription Tiers, Market Readiness  
> **Platform:** Multi-tenant ERP + Inventory + POS (Next.js / Prisma / PostgreSQL / Supabase)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Schema & Data Model Analysis](#2-schema--data-model-analysis)
3. [Backend API & Server Actions Audit](#3-backend-api--server-actions-audit)
4. [Frontend Architecture & UI/UX Audit](#4-frontend-architecture--uiux-audit)
5. [Integrations & Cross-Module Data Flow](#5-integrations--cross-module-data-flow)
6. [Subscription Tiers & Feature Gating](#6-subscription-tiers--feature-gating)
7. [Multi-Tenancy & Multi-Country Architecture](#7-multi-tenancy--multi-country-architecture)
8. [Gap Register & Fix Plan](#8-gap-register--fix-plan)
9. [Recommended Architecture Improvements](#9-recommended-architecture-improvements)
10. [Implementation Roadmap](#10-implementation-roadmap)

---

## 1. Executive Summary

### What Exists (Strengths)
- **50+ Prisma models** covering Inventory, Sales, Finance (GL/Journal), POS, Manufacturing, Warehouse, Payroll, Loyalty, Restaurant, Campaigns, Audit.
- **Multi-tenancy** is architecturally enforced — every table has `business_id` with cascade delete.
- **Subscription tiers** (basic → standard → premium → enterprise) are schema-defined with `plan_tier`, `plan_expires_at`, `plan_seats`, `max_products`, `max_warehouses`.
- **Domain-aware** business categories (51 categories spanning retail, wholesale, pharma, food, services, manufacturing, tech, etc.).
- **Pakistan-specific** knowledge baked in: NTN/CNIC/SRN fields, FBR integration flags, PKR defaults, Urdu translations, EOBI payroll deductions, GST 17%.
- **Country-agnostic architecture** via `domain_data` JSON columns and configurable `tax_configurations`.
- **Role-Based Access Control** with 5 roles: owner, admin, manager, accountant, salesperson.
- **30+ API modules** covering every domain.
- **40+ UI components** mapped to sidebar categories.

### What's Broken (Critical)
| # | Issue | Severity | Domain |
|---|---|---|---|
| C1 | SQL injection in `updateBatchAction` — unwhitelisted SET columns | 🔴 CRITICAL | Security |
| C2 | Cross-tenant data leak in `getProductVariantsAction` — missing businessId filter | 🔴 CRITICAL | Security |
| C3 | `handleStockTransfer` calls non-existent `setProducts` — runtime crash | 🔴 CRITICAL | Frontend |
| C4 | POS stock deduction bypasses batch/serial/FIFO/ledger/workflow pipeline | 🟠 HIGH | Data Integrity |
| C5 | `adjustStockAction` GL posting releases DB client before query | 🟠 HIGH | Finance |
| C6 | Payroll deductions posted to `SALES_TAX_PAYABLE` instead of `PAYROLL_EXPENSE` | 🟠 HIGH | Finance |
| C7 | Restaurant orders don't deduct inventory | 🟠 HIGH | Operations |
| C8 | Invoice hard-delete destroys financial audit trail | 🟠 HIGH | Compliance |
| C9 | Dashboard growth percentages are hardcoded (8.2%, 18.7%) | 🟡 MEDIUM | Analytics |
| C10 | Payroll/Approvals tabs render shells with empty data pipelines | 🟡 MEDIUM | Frontend |

### What's Missing (Gaps)
| # | Gap | Impact |
|---|---|---|
| G1 | No server-side subscription enforcement on actions | Users on basic plan can call premium endpoints |
| G2 | Audit logging exists but only 3 services call it | No audit trail for 90% of operations |
| G3 | No input validation (Zod) on finance actions | Data integrity risk |
| G4 | 5+ premium tabs render without `UpgradePrompt` fallback | Bypass subscription gating via URL |
| G5 | Expenses tab has no sidebar entry | Users can't find expense management |
| G6 | `AdvancedAnalytics`, `DemandForecast`, `EnhancedDashboard` are dead code | Bundle bloat |
| G7 | Domain config (POS_RELEVANT_DOMAINS etc.) duplicated in 3 files | Maintenance risk |
| G8 | i18n partial — most toasts/labels are English-only | Market readiness |
| G9 | No loading boundary on business switch | Stale data flash |
| G10 | No country plugin architecture for adding countries beyond Pakistan | Scalability |

---

## 2. Schema & Data Model Analysis

### 2.1 Entity Coverage by Domain

| Domain | Models | Status |
|---|---|---|
| **Auth & Tenancy** | `User`, `Session`, `Account`, `Verification`, `TwoFactor`, `businesses`, `business_users` | ✅ Complete |
| **Products & Inventory** | `products`, `product_variants`, `product_batches`, `product_serials`, `product_stock_locations`, `inventory_ledger`, `inventory_reservations`, `stock_movements`, `stock_transfers` | ✅ Complete |
| **Sales** | `invoices`, `invoice_items`, `quotations`, `quotation_items`, `sales_orders`, `sales_order_items`, `delivery_challans`, `delivery_challan_items`, `challan_items`, `credit_notes`, `credit_note_items` | ✅ Complete |
| **Purchasing** | `purchases`, `purchase_items`, `vendors`, `supplier_quotes` | ✅ Complete |
| **Finance** | `gl_accounts`, `gl_entries`, `journal_entries`, `payments`, `payment_allocations`, `expenses`, `fiscal_periods`, `exchange_rates`, `tax_configurations` | ✅ Complete |
| **POS** | `pos_terminals`, `pos_sessions`, `pos_transactions`, `pos_transaction_items`, `pos_payments`, `pos_refunds`, `pos_refund_items` | ✅ Complete |
| **Loyalty/CRM** | `loyalty_programs`, `loyalty_transactions`, `promotions`, `promotion_products`, `campaigns`, `campaign_messages`, `customer_segments`, `segment_customers`, `price_lists`, `price_list_items` | ✅ Complete |
| **Manufacturing** | `boms`, `bom_materials`, `production_orders` | ✅ Complete |
| **Warehouse** | `warehouse_locations` | ✅ Complete |
| **Restaurant** | `restaurant_tables`, `restaurant_orders`, `restaurant_order_items`, `kitchen_orders` | ✅ Complete |
| **HR/Payroll** | `payroll_employees`, `payroll_items`, `payroll_runs` | ✅ Complete |
| **Workflows** | `workflow_rules`, `workflow_history`, `approval_requests` | ✅ Complete |
| **Audit** | `audit_logs` | ✅ Complete |

### 2.2 Schema Relationship Issues

| Issue | Detail | Fix |
|---|---|---|
| `purchase_items` missing `business_id` | Can't enforce RLS without business context | Add `business_id` with FK to businesses |
| `pos_transaction_items` missing `business_id` | Same issue | Add `business_id` FK |
| `pos_payments` missing `business_id` | Same | Add `business_id` FK |
| `pos_refund_items` missing `business_id` | Same | Add `business_id` FK |
| `restaurant_order_items` missing `business_id` | Same | Add `business_id` FK |
| `challan_items` missing `business_id` | Same | Add `business_id` FK |
| `credit_note_items` missing `business_id` | Same | Add `business_id` FK |
| `payroll_items` missing `business_id` | Same | Add `business_id` FK |
| `campaign_messages` missing `business_id` | Same | Add `business_id` FK |
| `segment_customers` missing `business_id` | Same | Add `business_id` FK |
| `price_list_items` missing `business_id` | Same | Add `business_id` FK |
| `promotion_products` missing `business_id` | Same | Add `business_id` FK |
| POS transactions no FK to `invoices` | POS sales should optionally generate invoices | Add optional `invoice_id` on `pos_transactions` |
| POS transactions no FK to `payments` | POS payments don't feed into finance `payments` | Should auto-create `payments` record |
| Manufacturing no FK to `warehouse_locations` for output | Production output goes nowhere | Add `output_warehouse_id` on `production_orders` *(partially exists)* |
| `restaurant_orders` no link to `pos_transactions` | Restaurant billing doesn't integrate with POS | Add `pos_transaction_id` on `restaurant_orders` |
| `expenses` no link to `payments` | Expense payment creates no payment record | Add optional `payment_id` on `expenses` |
| No `returns` or `goods_return` model | Purchase returns have no schema | Add `purchase_returns` + `purchase_return_items` models |
| No `customer_addresses` model | Customers limited to single address | Add `customer_addresses` for multiple shipping/billing |
| No `vendor_contacts` model | Vendors limited to single contact | Add `vendor_contacts` for enterprise |
| No `attachments` generic model | Receipts, documents stored as URLs only | Add `attachments` polymorphic model |

### 2.3 Missing Schema Entities for Market Parity

| Entity | Purpose | Priority |
|---|---|---|
| `purchase_returns` / `purchase_return_items` | Track vendor returns / debit notes | HIGH |
| `customer_addresses` | Multiple billing/shipping addresses | MEDIUM |
| `document_sequences` | Auto-increment sequences per document type per tenant | HIGH |
| `notification_preferences` / `notifications` | In-app + push notification system | MEDIUM |
| `integrations` | Store API keys for Stripe, WhatsApp, SMS providers | HIGH |
| `subscription_history` | Track plan changes, upgrades, downgrades | MEDIUM |
| `pos_cash_movements` | Cash-in/cash-out during POS session | MEDIUM |

---

## 3. Backend API & Server Actions Audit

### 3.1 API Layer Structure

```
lib/api/           → Client-callable API functions (fetch wrappers for server actions)
lib/actions/basic/ → Server actions for basic tier features
lib/actions/standard/ → Server actions for standard tier features  
lib/actions/premium/  → Server actions for premium tier features
lib/services/      → Business logic services
```

### 3.2 Module Coverage

| Module | lib/api/ | actions/basic/ | actions/standard/ | actions/premium/ | services/ | Complete? |
|---|---|---|---|---|---|---|
| Products | ✅ product.js | ✅ (in customer.js shared) | ✅ inventory/ | — | ✅ InventoryService | ✅ |
| Invoices | ✅ invoice.js | ✅ invoice.js | — | — | — | ✅ |
| Customers | ✅ customer.js | ✅ customer.js | — | — | — | ✅ |
| Vendors | ✅ vendors.js | ✅ vendor.js | — | — | — | ✅ |
| Purchases | ✅ purchases.js | — | ✅ purchase.js | — | — | ✅ |
| Accounting | ✅ accounting.js | ✅ accounting.js | — | — | ✅ AccountingService | ✅ |
| Payments | ✅ payments.js | ✅ payment.js | — | — | — | ✅ |
| Expenses | ✅ expense.js | ✅ expense.js | — | — | — | ✅ |
| Credit Notes | ✅ creditNote.js | ✅ creditNote.js | — | — | — | ✅ |
| Fiscal | ✅ fiscal.js | ✅ fiscal.js | — | — | — | ✅ |
| Exchange Rates | ✅ exchangeRate.js | ✅ exchangeRate.js | — | — | — | ✅ |
| POS | ✅ pos.js | — | ✅ pos.js | — | — | ✅ |
| POS Refunds | — | — | ✅ posRefund.js | — | — | ✅ |
| Quotations | ✅ quotations.js | — | ✅ quotation.js | — | — | ✅ |
| Loyalty | ✅ loyalty.js | — | ✅ loyalty.js | — | — | ✅ |
| Manufacturing | ✅ manufacturing.js | — | — | ✅ manufacturing.js | ✅ ManufacturingService | ✅ |
| Warehouse | ✅ warehouse.js | — | ✅ (in inventory/) | — | — | ✅ |
| Batches | ✅ batch.js | — | ✅ (in inventory/) | — | ✅ BatchService | ✅ |
| Serials | ✅ serial.js | — | ✅ (in inventory/) | — | ✅ SerialService | ✅ |
| Variants | ✅ variant.js | — | ✅ (in inventory/) | — | ✅ VariantService | ✅ |
| Payroll | ✅ payroll.js | — | ✅ payroll.js | — | — | ⚠️ Actions exist but UI pipeline broken |
| Workflow | ✅ workflow.js | — | ✅ workflow.js | — | — | ⚠️ Same |
| Restaurant | ✅ restaurant.js | — | ✅ restaurant.js | — | — | ⚠️ No inventory deduction |
| Audit | — | — | — | — | ✅ audit/ | ✅ |
| Tax | — | — | ✅ tax.js | — | ✅ PakistaniTaxService | ✅ |
| Business | ✅ business.js | ✅ business.js | — | — | — | ✅ |
| AI/Analytics | — | — | — | ✅ ai/ | ✅ ai/ | ✅ |
| Marketing | — | — | — | ✅ automation/ | ✅ MarketingAgentService | ✅ |
| Reports | — | — | ✅ report.js | — | — | ✅ |

### 3.3 Critical Backend Issues

#### 🔴 C1: SQL Injection in `updateBatchAction`
```javascript
// lib/actions/standard/inventory/batchActions.js
const setClause = Object.keys(validUpdates)
  .map((key) => `"${key}" = $${paramIndex++}`) // ← user key injected into SQL
  .join(', ');
```
**Fix:** Whitelist allowed column names:
```javascript
const ALLOWED_COLUMNS = ['batch_number', 'manufacturing_date', 'expiry_date', 'quantity', 'cost_price', 'mrp', 'notes', 'is_active'];
const safeKeys = Object.keys(validUpdates).filter(k => ALLOWED_COLUMNS.includes(k));
```

#### 🔴 C2: Cross-Tenant Data Leak in `getProductVariantsAction`
```javascript
// lib/actions/standard/inventory/variantActions.js
const variants = await prisma.product_variants.findMany({
  where: { product_id: productId } // ← no business_id filter!
});
```
**Fix:** Add `business_id: businessId` to the where clause.

#### 🟠 C4: POS Stock Deduction Bypasses Pipeline
```javascript
// lib/actions/standard/pos.js — completePosTransaction
await prisma.products.update({
  where: { id: item.product_id },
  data: { stock: { decrement: item.quantity } }
});
// Missing: batch deduction, serial allocation, inventory_ledger entry,
// stock_movements record, warehouse-specific deduction, FIFO costing
```
**Fix:** Call `InventoryService.adjustStock()` instead of raw decrement. Create `stock_movements` and `inventory_ledger` entries.

#### 🟠 C5: adjustStockAction GL Posting Fails Silently
```javascript
// The DB client is released before the GL query runs
const client = await pool.connect();
// ... stock operations ...
client.release(); // ← released here
// ... later code attempts GL posting using released client
```

#### 🟠 C6: Payroll GL Misposting
```javascript
// Posts salary expense to SALES_TAX_PAYABLE account type
await AccountingService.createJournalEntry({
  entries: [{ accountType: 'SALES_TAX_PAYABLE', debit: totalNet }]
});
```
**Fix:** Use `SALARY_EXPENSE` / `PAYROLL_PAYABLE` account types.

#### 🟠 C8: Invoice Hard Delete
```javascript
// lib/actions/basic/invoice.js — deleteInvoiceAction
await prisma.invoices.delete({ where: { id } }); // Hard delete!
```
**Fix:** Use soft delete: `update({ data: { is_deleted: true, deleted_at: new Date() } })`.

### 3.4 Systemic Backend Improvements Needed

| Area | Current State | Target State |
|---|---|---|
| **Input Validation** | Only inventory actions use Zod | ALL server actions validate with Zod schemas |
| **Audit Logging** | 3 services call `recordAuditLog()` | Every write operation logs to audit |
| **Error Response** | Mix of `actionSuccess/actionFailure` and raw objects | Unified `ActionResult<T>` envelope everywhere |
| **Server-side Plan Check** | None — only client sidebar gating | `withPlanGuard('premium')` wrapper on premium actions |
| **Soft Delete** | Inconsistent — invoices hard-delete | All entities use `is_deleted` + `deleted_at` |
| **GL Auto-posting** | Manual and inconsistent | Every financial mutation auto-posts via `AccountingService` |
| **Transaction Boundaries** | Some use `$transaction`, many don't | All multi-table operations wrapped in Prisma transactions |

---

## 4. Frontend Architecture & UI/UX Audit

### 4.1 Routing Architecture

```
/                       → Landing page
/login                  → Auth
/register               → New user
/multi-business          → Business list / switcher
/business/[category]?tab=<key>  → Main SPA workspace
```

**All business modules live under a single dynamic route** with tab-based navigation. This is efficient but creates challenges:
- Bundle size grows as every component is loaded
- No route-level code splitting per module
- Deep linking works via `?tab=key` but isn't SEO-friendly (irrelevant for SaaS)

### 4.2 Sidebar → Tab Content Mapping

#### ESSENTIALS
| Sidebar Item | Tab Key | Component | Backend Connected | Status |
|---|---|---|---|---|
| Dashboard | `dashboard` | `DomainDashboard` | ✅ | **Working** |
| Inventory & Stock | `inventory` | `InventoryTab` → `InventoryManager` + `BatchManager` + `SerialScanner` | ✅ | **Working** |
| Sales & Invoicing | `invoices` | `InvoiceTab` | ✅ | **Working** |
| Customers | `customers` | `CustomersTab` | ✅ | **Working** |
| Vendors & Procurement | `vendors` | `VendorManager` | ✅ | **Working** |
| Purchase Orders | `purchases` | `PurchaseOrderManager` | ✅ | **Working** |

#### STOREFRONT
| Sidebar Item | Tab Key | Component | Backend Connected | Status |
|---|---|---|---|---|
| Point of Sale | `pos` | `PosTerminal` / `SuperStorePOS` / `RestaurantPOS` | ✅ | **Working** (stock pipeline gap) |
| Refunds & Returns | `refunds` | `PosRefundPanel` | ✅ | **Working** ⚠️ No plan gate |
| Restaurant | `restaurant` | `RestaurantManager` + `FloorPlanEditor` + `KitchenDisplaySystem` | ⚠️ Hardcoded state | **Partially Broken** |
| Loyalty & CRM | `loyalty` | `CustomerLoyaltyPortal` + `PromotionEngine` | ✅ | **Working** ⚠️ No plan gate |
| Quotations | `quotations` | `QuotationOrderChallanManager` | ✅ | **Working** |
| Sales Manager | `sales` | `SalesManager` | ✅ | **Working** |

#### FINANCE
| Sidebar Item | Tab Key | Component | Backend Connected | Status |
|---|---|---|---|---|
| Accounting | `accounting` | `FinancialOverview` + summary cards | ✅ | **Working** |
| Payments | `payments` | `PaymentManager` | ✅ | **Working** |
| Finance Hub | `finance` | `JournalEntryManager` + `TrialBalanceView` + `FinancialReports` | ✅ | **Working** |
| Tax / GST | `gst` | `TaxComplianceManager` | ✅ | **Working** |
| *(Missing)* | `expenses` | `FinanceHub` (component) | ✅ | **No sidebar entry!** |

#### OPERATIONS
| Sidebar Item | Tab Key | Component | Backend Connected | Status |
|---|---|---|---|---|
| Warehouses | `warehouses` | `MultiLocationInventory` | ✅ | **Working** |
| Manufacturing | `manufacturing` | `ManufacturingModule` | ✅ | **Working** ⚠️ No plan gate |
| Payroll & HR | `payroll` | `PayrollDashboard` + `AttendanceTracker` + `ShiftScheduler` | ❌ Empty pipeline | **Shell Only** |
| Approvals | `approvals` | `ApprovalInbox` + `WorkflowBuilder` | ❌ Empty pipeline | **Shell Only** |

#### INTELLIGENCE
| Sidebar Item | Tab Key | Component | Backend Connected | Status |
|---|---|---|---|---|
| Analytics & AI | `reports` | `AIInsightsPanel` + `ReportBuilder` | ✅ | **Working** |
| Campaigns | `campaigns` | `PromotionEngine` + `AIInsightsPanel` | ✅ | **Working** |
| Audit Trail | `audit` | `AuditTrailViewer` | ✅ | **Working** ⚠️ No plan gate |

#### SYSTEM
| Sidebar Item | Tab Key | Component | Backend Connected | Status |
|---|---|---|---|---|
| Settings | `settings` | `SettingsManager` + `SetupWizard` | ✅ | **Working** |

### 4.3 Dead Code / Unused Components

| Component | Status | Action |
|---|---|---|
| `AdvancedAnalytics.jsx` | Imported in page.js, never rendered | Remove import |
| `DemandForecast.jsx` | Imported in page.js, never rendered | Remove import |
| `RevenueAreaChart` | Imported, never used | Remove import |
| `EnhancedDashboard.jsx` | File exists, never referenced | Delete file or integrate |
| `AdvancedInventoryFeatures.jsx` | File exists, not in any tab | Delete or integrate |
| `AdvancedSearch.jsx` | File exists, not in any tab | Integrate into global search |
| `navigation/AppSidebar.jsx` | Alternative sidebar, never used | Delete |
| `reports/DomainReports.jsx` | Not rendered in tabs | Integrate into reports tab |
| `StakeholderLedger.jsx` | Not in tabs | Integrate into finance |
| `SmartRestockEngine.jsx` | Not in tabs | Integrate into AI tab |
| `GRNView.jsx` | Not in tabs | Integrate into purchases |
| `ReviewSystem.jsx` | Not in tabs | Integrate into CRM/loyalty |

### 4.4 UI/UX Gaps vs Market Leaders

| Feature | Zoho Inventory | Odoo | TENVO Current | Gap |
|---|---|---|---|---|
| Global search (⌘K) | ✅ | ✅ | ❌ | Need command palette |
| Keyboard shortcuts | ✅ | ✅ | Partial (Excel mode) | Need global shortcuts |
| Mobile bottom nav | ✅ | ✅ | ❌ | Need mobile nav bar |
| Drag & drop reorder | ✅ | ✅ | ❌ | Need for POS, tables |
| Inline editing in tables | ✅ | ✅ | ✅ (BusyGrid) | Good |
| PDF export | ✅ | ✅ | ✅ | Good |
| Email invoices | ✅ | ✅ | ❌ | Need email integration |
| Dashboard widgets drag | ✅ | ✅ | ❌ | Nice-to-have |
| Multi-language | ✅ | ✅ | Partial (EN/UR) | Need full i18n |
| Dark mode | ✅ | ✅ | ❌ | Need theme toggle |
| Offline POS | ✅ | ✅ | ❌ | Critical for POS |
| Barcode scanning | ✅ | ✅ | ✅ | Good |
| 404 / empty states | ✅ | ✅ | ❌ | Need proper empty states |
| Onboarding tour | ✅ | ✅ | Partial (SetupWizard) | Need guided tour |
| Notifications center | ✅ | ✅ | ❌ | Need notification bell |

---

## 5. Integrations & Cross-Module Data Flow

### 5.1 Current Data Flow Map

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Products   │────▶│   Invoices   │────▶│   Payments   │
│  Inventory   │     │   Sales      │     │   Finance    │
│  Batches     │     │   POS        │     │   GL Entries │
│  Serials     │     │   Quotations │     │   Journals   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Warehouses  │     │  Customers   │     │  Analytics   │
│  Transfers   │     │  Vendors     │     │  Reports     │
│  Movements   │     │  CRM         │     │  AI Insights │
└──────────────┘     └──────────────┘     └──────────────┘
```

### 5.2 Broken Integration Points

| From → To | Expected Flow | Current State | Impact |
|---|---|---|---|
| **POS → Inventory** | Sale reduces batch/serial stock, creates stock_movement + inventory_ledger | Raw `stock.decrement()` only | FIFO costing broken, no batch tracking |
| **POS → Finance** | Sale auto-creates payment + GL entries (debit Cash, credit Revenue) | No payment/GL record created | POS revenue invisible in accounting |
| **POS → Invoice** | Optionally generate invoice per POS transaction | No link | Customers can't get formal invoices |
| **Restaurant → Inventory** | Menu items deduct ingredient stock | No deduction | Ingredient costs invisible |
| **Restaurant → POS** | Table checkout creates POS transaction | No link | Restaurant revenue not in POS reports |
| **Manufacturing → Inventory** | Production consumes materials, outputs finished goods | Output creates stock but no stock_movement | No material movement audit trail |
| **Expenses → Payments** | Expense creates corresponding payment record | No link | Cash flow reports incomplete |
| **Payroll → GL** | Salary run posts journal entries | Misposts to SALES_TAX_PAYABLE | Balance sheet inflated |
| **Credit Notes → GL** | Credit note posts reversal entries | Not implemented | Revenue adjustment missing |
| **Purchases → GL** | Approved purchase posts AP entries | Not implemented | AP not tracked in accounting |
| **Quotation → Sales Order → Invoice** | Full document conversion chain | Quotation→SO exists, SO→Invoice missing | Manual data re-entry |

### 5.3 External Integration Status

| Integration | Implementation | Status |
|---|---|---|
| **Stripe** (payments/subscriptions) | Schema has `stripe_subscription_id`, `stripeCustomerId` | ⚠️ Fields exist but no Stripe webhook/API implementation |
| **FBR/SRB** (Pakistan tax) | `PakistaniTaxService.js` + `tax_configurations` | ✅ Tax calculation works, ❌ No actual FBR API integration |
| **WhatsApp** (campaigns) | `campaign_messages` model + `MarketingAgentService` | ⚠️ Service exists but no WhatsApp Business API integration |
| **Email** (invoices/campaigns) | Campaign type `email` defined | ❌ No email sending implementation |
| **SMS** | Not implemented | ❌ No SMS provider integration |
| **Bank Reconciliation** | Not implemented | ❌ Major gap for finance module |
| **E-commerce** | Not implemented | ❌ No Shopify/WooCommerce sync |

---

## 6. Subscription Tiers & Feature Gating

### 6.1 Current Tier Mapping

```
BASIC (Free / Starter)
├── Dashboard, Inventory (≤100 products), Invoices, Customers, Vendors, Purchases
├── Basic Accounting, Payments, Quotations
├── 1 Warehouse, 2 Users
└── No POS, No Manufacturing, No AI

STANDARD
├── Everything in Basic +
├── POS, Refunds & Returns, Restaurant
├── Multi-Warehouse (≤3), Stock Transfers
├── Batch & Serial Tracking
├── Expense Tracking
├── 500 Products, 5 Users
└── No Manufacturing, No AI, No Payroll

PREMIUM  
├── Everything in Standard +
├── Manufacturing (BOM + Production Orders)
├── AI Analytics & Insights
├── Loyalty Programs, CRM
├── Campaigns & Marketing
├── Payroll & HR
├── Approval Workflows  
├── Audit Trail
├── Unlimited Warehouses, Products, 15 Users
└── No White-Label, No API Access

ENTERPRISE
├── Everything in Premium +
├── White-Label Branding
├── API Access
├── Multi-Domain
├── Custom Integrations
├── Priority Support
├── Unlimited Users
└── SLA Guarantee
```

### 6.2 Gating Enforcement Gaps

| Layer | Current Enforcement | Gap |
|---|---|---|
| **Sidebar Navigation** | ✅ `getNavItemAccess()` checks plan | None |
| **Tab Content (Client)** | ⚠️ Only 2/10 premium tabs show `UpgradePrompt` | 8 tabs need `UpgradePrompt` |
| **Server Actions** | ❌ No plan check on any server action | **Critical** — any tab content that loads can call server |
| **API Rate Limits** | ❌ None | Need rate limiting per plan |
| **Resource Limits** | ⚠️ `max_products`, `max_warehouses` in schema | Not enforced in create actions |

### 6.3 Recommended Fix: `withPlanGuard` Middleware

```javascript
// lib/rbac/planGuard.js
export function withPlanGuard(requiredFeature) {
  return async (serverActionFn) => {
    const { business } = await getBusinessContext();
    if (!planHasFeature(business.plan_tier, requiredFeature)) {
      return { success: false, error: 'PLAN_UPGRADE_REQUIRED', feature: requiredFeature };
    }
    return serverActionFn();
  };
}
```

---

## 7. Multi-Tenancy & Multi-Country Architecture

### 7.1 Current Multi-Tenancy Model

- **Data isolation:** Every table has `business_id` FK. Cascade delete ensures full cleanup.
- **User-business mapping:** `business_users` M:N table with role per business.
- **Business switching:** Client-side `BusinessContext` with `switchBusinessByDomain()`.
- **Row-Level Security:** Some models annotated for Supabase RLS, not uniformly enforced.

### 7.2 Multi-Country Architecture (Current → Target)

**Current: Pakistan-specific**
- `country` defaults to "Pakistan"
- `currency` defaults to "PKR"
- `timezone` defaults to "Asia/Karachi"
- Tax rate defaults to 17% (Pakistan GST)
- NTN/CNIC/SRN fields on businesses, customers, vendors
- EOBI deductions in payroll
- FBR integration flags

**Target: Country Plugin Architecture**

```
lib/
├── country-plugins/
│   ├── index.js              ← Plugin registry
│   ├── base.js               ← Abstract country plugin
│   ├── pk/                   ← Pakistan (current)
│   │   ├── tax.js            ← GST 17%, FBR, WHT
│   │   ├── compliance.js     ← NTN/CNIC/SRN validation
│   │   ├── payroll.js        ← EOBI, salary slabs
│   │   ├── fields.js         ← Country-specific form fields
│   │   ├── translations.js   ← Urdu labels
│   │   └── config.js         ← PKR, Asia/Karachi, fiscal year July
│   ├── ae/                   ← UAE (future)
│   │   ├── tax.js            ← VAT 5%
│   │   ├── compliance.js     ← TRN validation
│   │   ├── payroll.js        ← WPS, gratuity
│   │   ├── fields.js
│   │   └── config.js         ← AED, Asia/Dubai
│   ├── sa/                   ← Saudi Arabia (future)
│   │   └── ...
│   └── in/                   ← India (future)
│       ├── tax.js            ← GST multi-slab (5/12/18/28%)
│       ├── compliance.js     ← GSTIN/PAN validation
│       └── ...
```

**Key Design Principles:**
1. **No country-specific logic in core code** — all behind plugin interfaces
2. **`domain_data` JSON fields** already exist on key entities for country-specific metadata
3. **`tax_configurations`** table already supports per-business tax config
4. **Country detected from `businesses.country`** field → loads appropriate plugin
5. **Form fields dynamically rendered** from plugin's `fields.js` definitions

### 7.3 What Needs Refactoring for Multi-Country

| Current Location | Hardcoded For | Refactor To |
|---|---|---|
| `PakistaniTaxService.js` | Pakistan only | `CountryPlugin.getTaxService()` |
| `domainKnowledge.js` | Pakistan categories | `CountryPlugin.getBusinessCategories()` |
| NTN/CNIC/SRN fields in schema | Pakistan-specific | Keep in schema (nullable), show via plugin's `fields.js` |
| Payroll EOBI deduction | Pakistan-specific | `CountryPlugin.getPayrollDeductions()` |
| Currency "PKR" default | Pakistan | `CountryPlugin.getDefaultCurrency()` |
| Urdu translations | Pakistan | i18n system with country plugin providing locale packs |

---

## 8. Gap Register & Fix Plan

### 8.1 Priority Matrix

#### 🔴 P0 — Fix Immediately (Security/Data Integrity)

| ID | Gap | Fix | Effort |
|---|---|---|---|
| C1 | SQL injection in updateBatchAction | Whitelist allowed columns | 30 min |
| C2 | Cross-tenant data leak in variants | Add business_id filter | 15 min |
| C3 | `setProducts` not defined (runtime crash) | Use DataProvider's refresh function | 30 min |
| C8 | Invoice hard delete | Change to soft delete | 30 min |

#### 🟠 P1 — Fix This Sprint (Core Functionality)

| ID | Gap | Fix | Effort |
|---|---|---|---|
| C4 | POS bypasses stock pipeline | Use InventoryService.adjustStock() | 4 hrs |
| C5 | GL posting uses released client | Restructure within transaction | 2 hrs |
| C6 | Payroll GL misposting | Fix account type mapping | 1 hr |
| C7 | Restaurant doesn't deduct stock | Add ingredient deduction on order | 3 hrs |
| C10 | Payroll/Approvals empty pipeline | Wire page.js handlers to API calls | 4 hrs |
| G1 | No server-side plan enforcement | Add `withPlanGuard` middleware | 4 hrs |
| G3 | No Zod validation on finance actions | Add Zod schemas for all finance actions | 6 hrs |
| G4 | Premium tabs bypass plan gate | Add `UpgradePrompt` to 8 tabs | 2 hrs |
| G5 | Expenses tab no sidebar entry | Add "Expenses" under FINANCE | 30 min |

#### 🟡 P2 — Next Sprint (UX & Completeness)

| ID | Gap | Fix | Effort |
|---|---|---|---|
| G2 | Audit logging for all actions | Add `recordAuditLog` calls to every write action | 8 hrs |
| G6 | Dead imports/components | Remove unused code | 2 hrs |
| G7 | Domain config duplication | Extract to shared `lib/config/domains.js` | 2 hrs |
| G8 | i18n incomplete | Full translation coverage for UI strings | 12 hrs |
| G9 | No loading boundary on business switch | Add suspense/skeleton during switch | 3 hrs |
| — | POS → Finance integration | Auto-create payment + GL entries | 6 hrs |
| — | POS → Invoice generation | Optional invoice creation | 4 hrs |
| — | Restaurant → POS integration | Link orders to POS transactions | 4 hrs |
| — | SO → Invoice conversion | Add conversion action | 4 hrs |
| — | Purchase returns schema + CRUD | Add models + actions + UI | 12 hrs |
| — | Duplicate TabsContent blocks | Deduplicate reports/campaigns | 30 min |
| — | Global command palette (⌘K) | Add search across all entities | 8 hrs |
| — | Dark mode | Add theme toggle with Tailwind dark: variant | 6 hrs |
| — | Notifications center | Add notification bell + in-app notifications | 12 hrs |

#### 🟢 P3 — Market Readiness (Competitive Features)

| ID | Gap | Fix | Effort |
|---|---|---|---|
| G10 | Country plugin architecture | Refactor to plugin system | 20 hrs |
| — | Offline POS (PWA / IndexedDB) | Service worker + local DB | 40 hrs |
| — | Email invoice sending | Email provider integration | 8 hrs |
| — | Bank reconciliation | Manual/auto matching UI | 20 hrs |
| — | Stripe payment integration | Webhooks + subscription management | 16 hrs |
| — | WhatsApp Business API | Campaign message sending | 12 hrs |
| — | E-commerce sync (Shopify) | Inventory sync integration | 20 hrs |
| — | Document sequences | Auto-increment per business per doc type | 6 hrs |
| — | Resource limit enforcement | Check max_products/warehouses in create actions | 4 hrs |
| — | Mobile bottom navigation | Add fixed bottom nav for mobile | 4 hrs |
| — | Empty state illustrations | Add for every module | 4 hrs |
| — | Onboarding guided tour | Step-by-step walkthrough | 8 hrs |

---

## 9. Recommended Architecture Improvements

### 9.1 Backend Architecture Pattern

```
Current (Flat):
lib/actions/basic/invoice.js     ← Direct Prisma queries
lib/actions/standard/pos.js      ← Direct Prisma queries

Recommended (Layered):
┌─────────────────────────────────────────────────┐
│                 Server Actions                    │
│  (Validation → Auth → Plan Check → Service Call) │
├─────────────────────────────────────────────────┤
│                 Service Layer                     │
│  (Business logic, cross-module orchestration)    │
├─────────────────────────────────────────────────┤
│                Repository Layer                   │
│  (Prisma queries, tenant-scoped)                 │
├─────────────────────────────────────────────────┤
│                 Database (Prisma)                 │
└─────────────────────────────────────────────────┘
```

**Every server action should follow this flow:**
```javascript
export async function createInvoiceAction(businessId, data) {
  // 1. Auth
  const user = await requireAuth();
  
  // 2. RBAC
  await requirePermission(user, businessId, 'invoice.create');
  
  // 3. Plan gate
  await requirePlanFeature(businessId, 'invoicing');
  
  // 4. Validate
  const validated = invoiceSchema.parse(data);
  
  // 5. Execute (in transaction)
  const result = await prisma.$transaction(async (tx) => {
    const invoice = await InvoiceService.create(tx, businessId, validated);
    await AccountingService.postInvoice(tx, businessId, invoice);
    await AuditService.log(tx, businessId, user, 'invoice.created', invoice);
    return invoice;
  });
  
  // 6. Return standardized response
  return actionSuccess(result);
}
```

### 9.2 Frontend Architecture Improvements

**Route-based code splitting:**
```
app/business/[category]/
├── page.js                  ← Shell + dynamic import based on tab
├── components/
│   ├── DashboardTabs.jsx    ← Tab container with lazy loading
│   └── TabGuard.jsx         ← Plan + RBAC check wrapper
├── inventory/
│   └── page.js              ← Optional: dedicated route for complex modules
├── pos/
│   └── page.js
└── ...
```

**TabGuard component:**
```jsx
function TabGuard({ feature, roles, children }) {
  const { business } = useBusiness();
  const { role } = useAuth();
  
  if (roles && !roles.includes(role)) return <AccessDenied />;
  if (feature && !planHasFeature(business.plan_tier, feature)) return <UpgradePrompt feature={feature} />;
  
  return children;
}
```

### 9.3 Unified Response Pattern

```typescript
// lib/types/ActionResult.ts
type ActionResult<T> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: string; code?: string; details?: Record<string, string> };
```

---

## 10. Implementation Roadmap

### Phase 1: Stabilize (Week 1) — Backend Hardening
- [ ] Fix C1: SQL injection in batch actions
- [ ] Fix C2: Cross-tenant data leak in variants
- [ ] Fix C3: `setProducts` runtime crash
- [ ] Fix C5: GL posting client release bug
- [ ] Fix C6: Payroll GL account type
- [ ] Fix C8: Invoice soft delete
- [ ] Add Zod validation to all server actions
- [ ] Add `withPlanGuard` middleware
- [ ] Add audit logging to all write operations
- [ ] Standardize error response pattern

### Phase 2: Connect (Week 2) — Integration Wiring
- [ ] Fix C4: POS → full stock pipeline (batch/serial/ledger/FIFO)
- [ ] Fix C7: Restaurant → inventory deduction
- [ ] Wire POS → Finance (auto-create payments + GL entries)
- [ ] Wire POS → Invoice (optional receipt generation)
- [ ] Wire Restaurant → POS (checkout integration)
- [ ] Wire Expenses → Payments
- [ ] Wire Purchases → GL (AP entries)
- [ ] Wire Credit Notes → GL (reversal entries)
- [ ] Wire Quotation → SO → Invoice conversion chain
- [ ] Fix Payroll tab data pipeline (page.js handlers)
- [ ] Fix Approvals tab data pipeline

### Phase 3: Polish (Week 3) — Frontend Hardening
- [ ] Add `UpgradePrompt` to all premium-gated tabs
- [ ] Add `TabGuard` wrapper (plan + RBAC)
- [ ] Add Expenses sidebar entry under FINANCE
- [ ] Remove dead code (unused imports + orphan components)
- [ ] Extract domain config to shared module
- [ ] Fix duplicate TabsContent blocks
- [ ] Add loading boundary on business switch
- [ ] Integrate orphan components (GRNView, StakeholderLedger, SmartRestockEngine)
- [ ] Add global command palette (⌘K or Ctrl+K search)
- [ ] Add empty state illustrations
- [ ] Add resource limit enforcement (max products/warehouses)

### Phase 4: Experience (Week 4) — UX Upgrade
- [ ] Dark mode toggle
- [ ] Full i18n coverage (all strings through translation system)
- [ ] Mobile bottom navigation
- [ ] Notifications center
- [ ] Keyboard shortcuts
- [ ] Onboarding guided tour
- [ ] 404 / catch-all for invalid tabs

### Phase 5: Scale (Month 2) — Market Features
- [ ] Country plugin architecture
- [ ] Stripe payment + subscription management
- [ ] Email sending (invoices + campaigns)
- [ ] Purchase returns module
- [ ] Bank reconciliation
- [ ] Offline POS (PWA)
- [ ] WhatsApp Business integration
- [ ] Document auto-sequencing

---

## Appendix: Complete Model Count

| Category | Models | Count |
|---|---|---|
| Auth | User, Session, Account, Verification, TwoFactor | 5 |
| Tenancy | businesses, business_users | 2 |
| Products | products, product_variants, product_batches, product_serials, product_stock_locations | 5 |
| Inventory | inventory_ledger, inventory_reservations, stock_movements, stock_transfers | 4 |
| Sales | invoices, invoice_items, quotations, quotation_items, sales_orders, sales_order_items, delivery_challans, delivery_challan_items, challan_items | 9 |
| Purchasing | purchases, purchase_items, vendors, supplier_quotes | 4 |
| Finance | gl_accounts, gl_entries, journal_entries, payments, payment_allocations, expenses, fiscal_periods, exchange_rates, credit_notes, credit_note_items, tax_configurations, price_lists, price_list_items | 13 |
| POS | pos_terminals, pos_sessions, pos_transactions, pos_transaction_items, pos_payments, pos_refunds, pos_refund_items | 7 |
| CRM | customers, loyalty_programs, loyalty_transactions, promotions, promotion_products, campaigns, campaign_messages, customer_segments, segment_customers | 9 |
| Operations | warehouse_locations, boms, bom_materials, production_orders | 4 |
| Restaurant | restaurant_tables, restaurant_orders, restaurant_order_items, kitchen_orders | 4 |
| HR | payroll_employees, payroll_runs, payroll_items | 3 |
| Workflow | workflow_rules, workflow_history, approval_requests | 3 |
| Audit | audit_logs | 1 |
| **TOTAL** | | **73 models** |

---

*This document is the single source of truth for the TENVO ERP architecture audit. All implementation work should reference this plan.*
