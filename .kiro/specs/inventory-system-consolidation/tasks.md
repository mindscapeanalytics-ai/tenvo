# Implementation Plan: Enterprise-Grade Inventory System Consolidation & Enhancement

## Overview

This implementation plan consolidates duplicate inventory components (reducing 1,200+ lines to <100), simplifies navigation from 3+ clicks to 1-2 clicks, adds 10+ enterprise features (FIFO/LIFO/WAC costing, multi-location sync, approval workflows), integrates Pakistani market features (textile roll tracking, FBR compliance, Urdu localization), and achieves 100% mobile responsiveness while maintaining backward compatibility.

The implementation follows a phased approach over 12 weeks, with each phase building on the previous one. Tasks are organized to ensure incremental progress with early validation through checkpoints.

## Tasks

### Phase 1: Foundation & Component Consolidation (Weeks 1-2)

- [x] 1. Set up database schema extensions for enterprise features
  - Create migration file for new columns and tables
  - Add `costing_method` and `approval_threshold_amount` to businesses table
  - Add `parent_batch_id`, `is_merged`, `is_split` columns to batches table
  - Create `product_locations` table for multi-location support
  - Create `stock_transfers` table for location transfers
  - Create `stock_adjustments` table for approval workflows
  - Run migrations and verify schema changes
  - _Requirements: 3.6, 4.1, 5.1, 18.1_

- [ ]* 1.1 Write property test for database schema backward compatibility
  - **Property 1: Backward Compatibility Preservation**
  - **Validates: Requirements 1.7, 1.8, 18.1**

- [ ] 2. Create shared custom hooks for inventory operations
  - [x] 2.1 Implement `useBatchTracking` hook
    - Create hook file at `lib/hooks/useBatchTracking.js`
    - Implement CRUD operations: addBatch, updateBatch, deleteBatch
    - Implement FEFO sorting logic (sort by expiry date ascending)
    - Implement getNextExpiryBatch and getExpiringBatches functions
    - Add loading and error states
    - _Requirements: 1.1, 19.3_

  - [ ]* 2.2 Write property test for FEFO sorting
    - **Property 19: Batch FEFO Sorting**
    - **Validates: Requirements 7.1**

  - [x] 2.3 Implement `useSerialTracking` hook
    - Create hook file at `lib/hooks/useSerialTracking.js`
    - Implement CRUD operations: registerSerial, bulkRegisterSerials, updateSerialStatus
    - Implement getWarrantyStatus and getAvailableSerials functions
    - Add warranty calculation logic
    - Add loading and error states
    - _Requirements: 1.2, 19.4_

  - [x] 2.4 Implement `useStockAdjustment` hook
    - Create hook file at `lib/hooks/useStockAdjustment.js`
    - Implement createAdjustment, approveAdjustment, rejectAdjustment functions
    - Implement getAuditTrail and getPendingApprovals functions
    - Add approval threshold checking logic
    - Add loading and error states
    - _Requirements: 1.3, 19.5_


  - [ ]* 2.5 Write property test for approval threshold enforcement
    - **Property 15: Approval Threshold Enforcement**
    - **Validates: Requirements 5.2**

- [ ] 3. Create consolidated BatchTrackingManager component
  - [x] 3.1 Create component file and basic structure
    - Create `components/inventory/BatchTrackingManager.jsx`
    - Define props interface (product, businessId, category, mode, callbacks)
    - Set up component state using useBatchTracking hook
    - Implement mode switching (register, view, manage)
    - _Requirements: 1.1, 1.5, 1.6, 19.1_

  - [x] 3.2 Implement batch entry form
    - Create form with fields: batch_number, manufacturing_date, expiry_date, quantity, cost_price, location
    - Add validation for required fields and date logic (expiry > manufacturing)
    - Implement form submission with optimistic updates
    - Add success/error toast notifications
    - _Requirements: 1.1, 7.1_

  - [x] 3.3 Implement FEFO batch list display
    - Create batch list component with FEFO sorting
    - Add expiry status badges (green: >90 days, yellow: 30-90 days, red: <30 days)
    - Display batch details: number, quantity, expiry date, cost
    - Add quick action buttons: merge, split, adjust quantity
    - _Requirements: 7.1, 22.2_

  - [x] 3.4 Implement batch merge functionality
    - Create merge dialog with batch selection checkboxes
    - Calculate weighted average cost: sum(cost × quantity) / sum(quantity)
    - Use earliest expiry date from selected batches
    - Generate new batch number or allow user input
    - Update database and refresh batch list
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 3.5 Write property test for batch merge weighted average
    - **Property 20: Batch Merge Weighted Average**
    - **Validates: Requirements 7.2, 7.3**

  - [x] 3.6 Implement batch split functionality
    - Create split dialog with quantity input for each split
    - Validate total split quantity equals original batch quantity
    - Generate split batch numbers: ORIGINAL-S1, ORIGINAL-S2, etc.
    - Preserve original expiry date and cost for all splits
    - Update database and refresh batch list
    - _Requirements: 7.4, 7.5, 7.6_

  - [ ]* 3.7 Write property test for batch split preservation
    - **Property 21: Batch Split Preservation**
    - **Validates: Requirements 7.4, 7.5**

  - [x] 3.8 Add Pakistani textile tracking fields
    - Add conditional fields for textile category: roll_number, length_yards, width_inches, weight_kg
    - Add fabric_type dropdown (Cotton Lawn, Khaddar, Silk, Chiffon, Linen)
    - Add finish_status dropdown (kora, finished, dyed, printed)
    - Calculate and display total area: (length × width) / 1296 square yards
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 3.9 Write property test for textile area calculation
    - **Property 23: Textile Roll Area Calculation**
    - **Validates: Requirements 9.2**

- [ ] 4. Create consolidated SerialTrackingManager component
  - [x] 4.1 Create component file and basic structure
    - Create `components/inventory/SerialTrackingManager.jsx`
    - Define props interface (product, businessId, category, mode, callbacks)
    - Set up component state using useSerialTracking hook
    - Implement mode switching (register, scan, view)
    - _Requirements: 1.2, 1.5, 1.6, 19.1_

  - [x] 4.2 Implement serial entry form
    - Create form with fields: serial_number, imei, mac_address, warranty_period_months, notes
    - Add validation for unique serial numbers
    - Implement single and bulk registration modes
    - Add success/error toast notifications
    - _Requirements: 1.2_

  - [x] 4.3 Implement serial list display
    - Create serial list with status badges (available, sold, returned, defective, under_repair)
    - Display warranty status with countdown (active, expiring soon, expired)
    - Add quick action buttons: update status, view details
    - Implement filtering by status and warranty status
    - _Requirements: 22.3, 22.6_

  - [x] 4.4 Implement bulk serial registration
    - Create textarea for pasting multiple serial numbers (one per line)
    - Parse and validate serial numbers
    - Show preview with count and validation errors
    - Batch insert serials with progress indicator
    - _Requirements: 1.2_

- [ ] 5. Create consolidated StockAdjustmentManager component
  - [x] 5.1 Create component file and basic structure
    - Create `components/inventory/StockAdjustmentManager.jsx`
    - Define props interface (product, businessId, locations, approvalThreshold, callbacks)
    - Set up component state using useStockAdjustment hook
    - _Requirements: 1.3, 1.5, 1.6, 19.1_

  - [x] 5.2 Implement stock adjustment form
    - Create form with fields: product, location, adjustment_type, quantity_change, reason_code, reason_notes
    - Add validation for quantity limits and required fields
    - Calculate adjustment value: quantity_change × product.cost_price
    - Check if adjustment requires approval (value > threshold)
    - Display approval requirement indicator
    - _Requirements: 5.1, 5.2_

  - [x] 5.3 Implement approval workflow UI
    - Create pending approvals queue for approvers
    - Display adjustment details: product, quantity, value, requester, reason
    - Add approve/reject buttons with comment field
    - Send notifications to requester on approval/rejection
    - Update stock only after approval
    - _Requirements: 5.3, 5.4, 5.5, 5.6_

  - [ ]* 5.4 Write property test for approval notification delivery
    - **Property 16: Approval Notification Delivery**
    - **Validates: Requirements 5.3**

  - [x] 5.5 Implement enhanced audit trail viewer
    - Create audit trail component with filterable table
    - Display columns: timestamp, user, action, before_value, after_value, reason, IP address
    - Add filters: date range, user, product, transaction type
    - Implement export to PDF and Excel
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

- [x] 6. Checkpoint - Verify consolidated components
  - Test all three consolidated components (Batch, Serial, StockAdjustment)
  - Verify component size ≤250 lines each
  - Ensure all existing functionality preserved
  - Run unit tests and property tests
  - Ask user if questions arise


### Phase 2: Enterprise Features (Weeks 3-4)

- [ ] 7. Implement costing methods (FIFO/LIFO/WAC)
  - [x] 7.1 Create `useCostingMethod` hook
    - Create hook file at `lib/hooks/useCostingMethod.js`
    - Implement calculateCOGS function with method parameter (FIFO, LIFO, WAC)
    - Implement getInventoryValuation function
    - Add batch consumption tracking
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 7.2 Implement FIFO costing logic
    - Sort batches by receipt_date ascending (oldest first)
    - Consume batches in order until quantity_sold is satisfied
    - Calculate COGS: sum(batch.cost × quantity_used)
    - Return COGS, unit_cost, and batches_used array
    - _Requirements: 3.1, 3.4_

  - [ ]* 7.3 Write property test for FIFO costing correctness
    - **Property 4: FIFO Costing Correctness**
    - **Validates: Requirements 3.1, 3.4**

  - [x] 7.4 Implement LIFO costing logic
    - Sort batches by receipt_date descending (newest first)
    - Consume batches in order until quantity_sold is satisfied
    - Calculate COGS: sum(batch.cost × quantity_used)
    - Return COGS, unit_cost, and batches_used array
    - _Requirements: 3.2, 3.4_

  - [ ]* 7.5 Write property test for LIFO costing correctness
    - **Property 5: LIFO Costing Correctness**
    - **Validates: Requirements 3.2, 3.4**

  - [x] 7.6 Implement WAC costing logic
    - Calculate weighted average: sum(batch.cost × batch.quantity) / sum(batch.quantity)
    - Apply average cost to quantity_sold
    - Calculate COGS: quantity_sold × weighted_average_cost
    - Return COGS, unit_cost, and batches_used array
    - _Requirements: 3.3, 3.4_

  - [ ]* 7.7 Write property test for WAC costing correctness
    - **Property 6: WAC Costing Correctness**
    - **Validates: Requirements 3.3, 3.4**

  - [x] 7.8 Add costing method selector to business settings
    - Add costing_method field to business settings form
    - Create dropdown with options: FIFO, LIFO, WAC
    - Display explanation for each method
    - Save to businesses.costing_method column
    - _Requirements: 3.6_

  - [x] 7.9 Implement inventory valuation report
    - Create report component at `components/reports/InventoryValuation.jsx`
    - Fetch all products with batch data
    - Calculate valuation using selected costing method
    - Display: product, quantity, unit_cost, total_value
    - Add export to Excel functionality
    - _Requirements: 3.8, 3.9_

  - [ ]* 7.10 Write property test for inventory valuation accuracy
    - **Property 9: Inventory Valuation Report Accuracy**
    - **Validates: Requirements 3.8, 3.9**

- [ ] 8. Implement multi-location real-time sync
  - [x] 8.1 Create `useMultiLocationSync` hook
    - Create hook file at `lib/hooks/useMultiLocationSync.js`
    - Implement getProductLocations function
    - Implement transferStock function
    - Implement confirmReceipt function
    - Set up Supabase Realtime subscription for inventory updates
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 8.2 Implement stock transfer workflow
    - Create StockTransferForm component
    - Add fields: product, from_warehouse, to_warehouse, quantity, notes
    - Validate available stock at source location
    - Reserve quantity at source on transfer initiation
    - Create stock_transfers record with status 'pending'
    - Send notification to receiving location
    - _Requirements: 4.3, 4.4_

  - [ ]* 8.3 Write property test for stock transfer reservation
    - **Property 11: Stock Transfer Reservation**
    - **Validates: Requirements 4.4**

  - [x] 8.4 Implement transfer receipt confirmation
    - Create receipt confirmation UI for receiving location
    - Display transfer details: product, quantity, source location
    - Add received_quantity input (allow partial receipt)
    - Update product_locations for both source and destination
    - Update stock_transfers status to 'completed'
    - _Requirements: 4.3_

  - [-] 8.5 Implement real-time sync with Supabase Realtime
    - Subscribe to 'stock.updated' events for business_id
    - Update local state when remote stock changes detected
    - Display sync indicator in UI (last synced timestamp)
    - Handle sync latency <2 seconds
    - _Requirements: 4.1_

  - [ ]* 8.6 Write property test for multi-location sync latency
    - **Property 10: Multi-Location Sync Latency**
    - **Validates: Requirements 4.1**

  - [x] 8.7 Implement offline queue with IndexedDB
    - Create IndexedDB database for offline operations
    - Queue stock movements when offline
    - Display offline indicator in UI
    - Auto-sync queued operations when connection restored
    - Handle conflict resolution for concurrent updates
    - _Requirements: 4.8_

  - [ ]* 8.8 Write property test for offline queue synchronization
    - **Property 14: Offline Queue Synchronization**
    - **Validates: Requirements 4.8**

  - [x] 8.9 Implement overselling prevention
    - Create checkAvailableStock function
    - Sum available quantities across all locations
    - Block sale if requested quantity > total available
    - Display error message with available quantity
    - _Requirements: 4.6_

  - [ ]* 8.10 Write property test for overselling prevention
    - **Property 13: Overselling Prevention**
    - **Validates: Requirements 4.6**

- [ ] 9. Implement approval workflows
  - [x] 9.1 Create approval threshold configuration
    - Add approval_threshold_amount field to business settings
    - Create input with currency formatting
    - Save to businesses.approval_threshold_amount column
    - _Requirements: 5.1_

  - [x] 9.2 Implement approval notification system
    - Create notification service at `lib/services/notifications.js`
    - Implement sendApprovalRequest function (email + in-app)
    - Implement sendApprovalDecision function (notify requester)
    - Integrate with existing notification system
    - _Requirements: 5.3, 5.5_

  - [-] 9.3 Implement multi-level approval support
    - Add approval_level field to stock_adjustments table
    - Define approval hierarchy: staff → manager → director
    - Route high-value adjustments to appropriate level
    - Track approval chain in audit trail
    - _Requirements: 5.6_

  - [x] 9.4 Create approval queue UI
    - Create ApprovalQueue component at `components/inventory/ApprovalQueue.jsx`
    - Display pending adjustments for current user's approval level
    - Show adjustment details: product, quantity, value, requester, reason
    - Add approve/reject actions with mandatory comments
    - Update adjustment status and notify requester
    - _Requirements: 5.7_

- [x] 10. Implement cycle counting workflows
  - [x] 10.1 Create cycle count schedule configuration
    - Create CycleCountSchedule component
    - Add filters: product category, location, ABC classification
    - Generate cycle count tasks with product list and expected quantities
    - Assign counter (user) to each task
    - _Requirements: 8.1, 8.2_

  - [x] 10.2 Implement cycle count execution UI
    - Create CycleCountTask component for mobile/web
    - Display product list with expected quantities
    - Add physical count input for each product
    - Calculate variance: physical - system
    - Flag variances exceeding tolerance percentage
    - _Requirements: 8.3, 8.4, 8.5_

  - [ ]* 10.3 Write property test for cycle count variance detection
    - **Property 22: Cycle Count Variance Detection**
    - **Validates: Requirements 8.5, 8.6**

  - [x] 10.4 Implement cycle count approval and adjustment
    - Require supervisor approval for variances > tolerance
    - Auto-adjust stock quantities on approval
    - Record adjustment with reason: 'cycle_count'
    - Generate cycle count report with variance analysis
    - _Requirements: 8.6, 8.7, 8.8_

- [x] 11. Checkpoint - Verify enterprise features
  - Test costing methods with sample data (FIFO, LIFO, WAC)
  - Test multi-location sync with 2+ locations
  - Test approval workflow with threshold adjustments
  - Test cycle counting end-to-end
  - Verify all property tests pass
  - Ask user if questions arise


### Phase 3: Pakistani Market Integration (Weeks 5-6)

- [ ] 12. Implement textile roll/bale tracking
  - [ ] 12.1 Add textile-specific fields to product model
    - Extend domain_data with textile fields: roll_number, length_yards, width_inches, weight_kg
    - Add fabric_type, finish_status, article_number, design_number, cutting_requirement
    - Update product form to show textile fields when category is textile-wholesale
    - _Requirements: 9.1_

  - [ ] 12.2 Implement cutting calculator
    - Create CuttingCalculator component
    - Input: suit length (yards)
    - Calculate: suits per roll = length_yards / suit_length
    - Display: total suits, remaining fabric
    - _Requirements: 9.5_

  - [ ] 12.3 Implement partial roll tracking
    - Update batch quantity when partial roll is sold
    - Calculate remaining length: original_length - sold_length
    - Update weight proportionally: (remaining_length / original_length) × original_weight
    - Display remaining dimensions in batch list
    - _Requirements: 9.7_

  - [ ] 12.4 Implement bale management
    - Create BaleManager component
    - Group multiple rolls into bales
    - Track bale number, total weight, piece count
    - Display bale summary with roll breakdown
    - _Requirements: 9.8_

  - [ ] 12.5 Create roll-wise stock reports
    - Create RollStockReport component
    - Display: roll_number, fabric_type, length, width, weight, status
    - Add filters: fabric_type, finish_status
    - Export to Excel with textile-specific columns
    - _Requirements: 9.6_

- [ ] 13. Implement garment lot tracking with size-color matrix
  - [ ] 13.1 Create VariantMatrixEditor component
    - Create component at `components/inventory/VariantMatrixEditor.jsx`
    - Define sizes array: ['S', 'M', 'L', 'XL', 'XXL']
    - Define colors array: ['Red', 'Blue', 'Black', 'White']
    - Create interactive grid: rows = sizes, columns = colors
    - _Requirements: 10.1_

  - [ ] 13.2 Implement SKU auto-generation
    - Generate SKU for each size-color combination: {base_sku}-{size}-{color}
    - Validate uniqueness within product
    - Store in size_color_matrix.variants object
    - _Requirements: 10.2_

  - [ ]* 13.3 Write property test for garment matrix SKU generation
    - **Property 24: Garment Matrix SKU Generation**
    - **Validates: Requirements 10.2**

  - [ ] 13.4 Implement matrix bulk operations
    - Add "Set All Prices" button to apply price to all variants
    - Add "Adjust All Quantities" button for bulk stock changes
    - Add "Distribute Quantity" to spread total across matrix
    - Validate and update all variants in single transaction
    - _Requirements: 10.4_

  - [ ] 13.5 Implement visual stock indicators
    - Color-code matrix cells: green (in stock), yellow (low stock), red (out of stock)
    - Display quantity in each cell
    - Highlight out-of-stock variants
    - Add hover tooltip with variant details
    - _Requirements: 10.3, 10.7_

  - [ ] 13.6 Add lot tracking fields
    - Add lot_number, production_date, quality_grade to garment products
    - Display lot information in product details
    - Generate lot-wise reports showing size-color distribution
    - _Requirements: 10.5, 10.8_

- [ ] 14. Implement pharmacy FBR compliance
  - [ ] 14.1 Add pharmacy-specific fields
    - Add drug_registration_number, controlled_substance_schedule to domain_data
    - Add generic_name, manufacturer fields
    - Set batch_tracking_required and expiry_tracking_required to true
    - _Requirements: 11.1_

  - [ ] 14.2 Implement drug registration validation
    - Create validator for FBR format: alphanumeric, 10-15 characters
    - Display format hints in form
    - Show validation errors inline
    - _Requirements: 11.2_

  - [ ] 14.3 Implement expiry blocking for pharmacy
    - Check batch expiry_date before sale
    - Block sale if expiry_date < current_date
    - Display error: "Cannot sell expired medicine"
    - _Requirements: 11.3_

  - [ ]* 14.4 Write property test for pharmacy expiry blocking
    - **Property 25: Pharmacy Expiry Blocking**
    - **Validates: Requirements 11.3**

  - [ ] 14.5 Implement prescription capture for controlled substances
    - Add prescription fields: number, prescriber, date
    - Require prescription for Schedule H and Schedule X drugs
    - Store prescription details with sale record
    - _Requirements: 11.6_

  - [ ] 14.6 Implement 90-day expiry alerts
    - Create scheduled job to check batch expiry dates
    - Send alerts for batches expiring within 90 days
    - Display expiry dashboard with near-expiry medicines
    - Add action buttons: return to supplier, discount sale
    - _Requirements: 11.7_

  - [ ] 14.7 Create FBR-compliant batch reports
    - Create FBRBatchReport component
    - Display: drug_name, registration_number, batch_number, expiry_date, quantity
    - Add date range filter
    - Export to Excel in FBR format
    - _Requirements: 11.4, 11.8_

- [ ] 15. Implement seasonal inventory adjustments
  - [ ] 15.1 Integrate with pakistaniSeasons.js
    - Import getCurrentSeason, getSeasonalDiscount, applySeasonalPricing
    - Check if current date falls within active season
    - Get discount percentage for product category
    - _Requirements: 12.1_

  - [ ] 15.2 Implement seasonal pricing display
    - Display current season badge (Eid, Summer, Winter, Monsoon)
    - Show original price with strikethrough
    - Show discounted price prominently
    - Display savings amount
    - _Requirements: 12.2_

  - [ ]* 15.3 Write property test for seasonal pricing application
    - **Property 26: Seasonal Pricing Application**
    - **Validates: Requirements 12.1, 12.2**

  - [ ] 15.4 Implement bulk seasonal adjustments
    - Create SeasonalAdjustment component
    - Select product category and discount percentage
    - Apply discount to all products in category
    - Revert prices when season ends
    - _Requirements: 12.3, 12.7_

  - [ ] 15.5 Implement seasonal demand forecasting
    - Fetch historical sales data for previous years
    - Calculate average sales for each season
    - Display forecast: expected demand for upcoming season
    - Generate restock recommendations
    - _Requirements: 12.4, 12.5_

  - [ ] 15.6 Implement seasonal restock alerts
    - Send alerts 30 days before peak season
    - Display recommended restock quantities
    - Link to purchase order creation
    - _Requirements: 12.5_

  - [ ] 15.7 Create seasonal performance reports
    - Compare actual vs forecasted sales
    - Display seasonal turnover rates
    - Show top-performing products by season
    - Export to Excel
    - _Requirements: 12.6, 12.8_

- [ ] 16. Implement Urdu localization
  - [ ] 16.1 Integrate with translations.js
    - Import t, formatCurrency, formatDate, getDirection functions
    - Add language parameter to all inventory components
    - Wrap all text labels with t() function
    - _Requirements: 13.1_

  - [ ] 16.2 Implement RTL layout support
    - Check language and apply dir="rtl" when Urdu selected
    - Mirror layout horizontally for RTL
    - Adjust text alignment and padding
    - Test all forms and tables in RTL mode
    - _Requirements: 13.4_

  - [ ]* 16.3 Write property test for Urdu RTL layout
    - **Property 27: Urdu RTL Layout**
    - **Validates: Requirements 13.4**

  - [ ] 16.4 Add Urdu translations for inventory forms
    - Translate all labels: product_name, sku, price, stock, etc.
    - Translate buttons: save, cancel, delete, etc.
    - Translate validation messages
    - Translate status labels: active, expired, low_stock, etc.
    - _Requirements: 13.1, 13.7_

  - [ ] 16.5 Implement language switcher
    - Add language dropdown in header: English, Urdu
    - Save language preference to user profile
    - Reload components with new language
    - Persist selection across sessions
    - _Requirements: 13.5, 13.6_

  - [ ] 16.6 Add Urdu numeral support
    - Add setting for Urdu numerals (۰۱۲۳۴۵۶۷۸۹)
    - Convert numbers when Urdu numerals enabled
    - Apply to prices, quantities, dates
    - _Requirements: 13.3_

  - [ ] 16.7 Implement bilingual labels
    - Display English as primary, Urdu as secondary
    - Format: "Product Name / نام مصنوعات"
    - Apply to all major labels and headings
    - _Requirements: 13.1_

- [ ] 17. Checkpoint - Verify Pakistani market features
  - Test textile roll tracking with sample data
  - Test garment matrix with size-color combinations
  - Test pharmacy FBR compliance with drug registration
  - Test seasonal pricing with active season
  - Test Urdu localization and RTL layout
  - Verify all property tests pass
  - Ask user if questions arise


### Phase 4: Navigation Simplification & UI Consolidation (Weeks 7-8)

- [x] 18. Create UnifiedActionPanel component
  - [x] 18.1 Create component file and tab structure
    - Create `components/inventory/UnifiedActionPanel.jsx`
    - Define props: product, businessId, category, activeTab, onTabChange
    - Create horizontal tab bar with icons: Batch, Serial, Variant, Adjustment
    - Implement tab visibility logic based on category
    - _Requirements: 2.4, 2.5_

  - [x] 18.2 Implement keyboard shortcuts
    - Add keyboard event listeners: Alt+B, Alt+S, Alt+V, Alt+A
    - Open corresponding tab on shortcut press
    - Add Esc key to close panel
    - Display keyboard shortcut hints in UI
    - _Requirements: 2.6, 20.2, 20.3, 20.4, 20.5_

  - [ ]* 18.3 Write property test for keyboard shortcut consistency
    - **Property 2: Keyboard Shortcut Consistency**
    - **Validates: Requirements 2.6**

  - [x] 18.4 Implement lazy loading for tab content
    - Use React.lazy() for BatchTrackingManager, SerialTrackingManager, VariantMatrixEditor
    - Load component only when tab is activated
    - Show loading spinner during component load
    - _Requirements: 17.7_

  - [x] 18.5 Add floating action button for mobile
    - Create FAB at bottom-right corner on mobile screens
    - Open UnifiedActionPanel as slide-in drawer
    - Add swipe-down gesture to close
    - _Requirements: 2.5_

  - [x] 18.6 Integrate with InventoryManager
    - Add UnifiedActionPanel to InventoryManager component
    - Replace existing dropdown menus with direct panel access
    - Reduce navigation clicks from 3+ to 1-2
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 19. Create ProductEntryHub component
  - [ ] 19.1 Create component file and mode selector
    - Create `components/inventory/ProductEntryHub.jsx`
    - Define props: product, category, businessId, mode, onSave, onCancel
    - Create mode selector: Quick, Standard, Excel, Template
    - Implement mode state management
    - _Requirements: 1.4, 21.1_

  - [ ] 19.2 Implement Quick mode
    - Display essential fields only: name, SKU, price, stock
    - Single-column layout
    - Add keyboard shortcuts: Enter to save, Esc to cancel
    - Validate required fields
    - _Requirements: 21.2_

  - [ ] 19.3 Implement Standard mode
    - Display all product fields including batch, serial, domain-specific
    - Create tabbed interface: Basic, Inventory, Intelligence, Media
    - Add smart defaults from domain knowledge
    - Implement inline validation with error messages
    - _Requirements: 21.3_

  - [ ] 19.4 Implement Excel mode
    - Create spreadsheet-style grid using react-data-grid or similar
    - Enable inline editing with cell validation
    - Support copy/paste from Excel
    - Add bulk save with progress indicator
    - _Requirements: 21.4_

  - [ ] 19.5 Implement Template mode
    - Create domain-specific templates: textile, garment, pharmacy
    - Pre-fill fields based on category
    - Add smart suggestions from domain knowledge
    - Load template on category selection
    - _Requirements: 21.5_

  - [ ] 19.6 Implement mode switching with data preservation
    - Preserve entered data when switching modes
    - Show confirmation dialog if unsaved changes exist
    - Remember last used mode in localStorage
    - _Requirements: 21.6, 21.7_

  - [ ] 19.7 Integrate ProductEntryHub into InventoryManager
    - Replace ProductForm, QuickAddProductModal, QuickAddTemplates, ExcelModeModal
    - Use ProductEntryHub for all product creation/editing
    - Verify all existing functionality preserved
    - _Requirements: 1.4, 1.7_

- [ ] 20. Implement batch/serial status indicators in product list
  - [ ] 20.1 Add batch status indicators
    - Display batch count badge when batch_tracking_enabled
    - Show next expiry date in product row
    - Add expiry warning icon (red) for batches expiring within 30 days
    - Use color-coded indicators: green (healthy), amber (warning), red (critical)
    - _Requirements: 2.7, 2.8, 22.1, 22.2, 22.7_

  - [ ]* 20.2 Write property test for batch/serial status display
    - **Property 3: Batch/Serial Status Display**
    - **Validates: Requirements 2.7, 2.8**

  - [ ] 20.3 Add serial status indicators
    - Display serial count badge when serial_tracking_enabled
    - Show warranty status: active count / expired count
    - Add warranty expiring icon for serials expiring within 30 days
    - _Requirements: 22.3, 22.6, 22.7_

  - [ ] 20.4 Add low stock indicators
    - Display amber indicator when stock <= min_stock
    - Show stock level prominently
    - Add reorder point indicator
    - _Requirements: 22.4_

  - [ ] 20.5 Implement status filtering
    - Add filters: expiring soon, low stock, warranty expiring
    - Filter product list based on batch/serial status
    - Display filter count badges
    - _Requirements: 22.8_

- [ ] 21. Implement keyboard shortcuts system
  - [ ] 21.1 Create keyboard shortcut manager
    - Create `lib/utils/keyboardShortcuts.js`
    - Register shortcuts: Alt+N, Alt+B, Alt+S, Alt+A, Alt+T, Ctrl+F, Alt+?
    - Handle shortcut conflicts and priority
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [ ] 21.2 Implement shortcut help panel
    - Create ShortcutHelp component
    - Display all available shortcuts with descriptions
    - Open on Alt+? keypress
    - Close on Esc or click outside
    - _Requirements: 20.8_

  - [ ] 21.3 Add visual shortcut hints
    - Display shortcut hints in button tooltips
    - Show shortcut keys in menu items
    - Highlight active shortcuts in UI
    - _Requirements: 20.8_

- [ ] 22. Update InventoryManager component
  - [ ] 22.1 Reduce component size to ≤1,500 lines
    - Extract product list into separate component
    - Extract filters into separate component
    - Extract search into separate component
    - Use composition pattern for smaller components
    - _Requirements: 19.2, 19.6_

  - [ ] 22.2 Implement tab navigation
    - Create tabs: Products, Locations, Manufacturing, Orders
    - Add keyboard shortcuts: Alt+1, Alt+2, Alt+3, Alt+4
    - Lazy load tab content
    - _Requirements: 2.5_

  - [ ] 22.3 Add global search with Ctrl+F
    - Focus search input on Ctrl+F
    - Implement debounced search (300ms)
    - Display search results within 500ms
    - _Requirements: 20.6, 17.2_

  - [ ] 22.4 Implement mobile/desktop view mode switching
    - Detect screen size and switch layout
    - Card view for mobile (<768px)
    - Table view for desktop (≥768px)
    - Add manual toggle button
    - _Requirements: 16.1_

- [ ] 23. Checkpoint - Verify navigation simplification
  - Test all keyboard shortcuts (Alt+B, Alt+S, Alt+A, Alt+N, Ctrl+F)
  - Verify navigation requires ≤2 clicks for all operations
  - Test ProductEntryHub in all 4 modes
  - Verify UnifiedActionPanel tab switching
  - Test batch/serial status indicators
  - Ask user if questions arise


### Phase 5: Mobile Optimization & Performance (Weeks 9-10)

- [ ] 24. Implement mobile batch scanner
  - [ ] 24.1 Create MobileBatchScanner component
    - Create `components/mobile/MobileBatchScanner.jsx`
    - Request camera permissions
    - Integrate barcode scanning library (react-qr-barcode-scanner or similar)
    - Display camera view with overlay guide
    - _Requirements: 14.1_

  - [ ] 24.2 Implement scan response and haptic feedback
    - Fetch batch details on successful scan
    - Display batch details within 1 second
    - Trigger haptic feedback: navigator.vibrate(200)
    - Show success animation
    - _Requirements: 14.2, 14.7_

  - [ ]* 24.3 Write property test for mobile batch scan response time
    - **Property 28: Mobile Batch Scan Response Time**
    - **Validates: Requirements 14.2**

  - [ ] 24.4 Implement offline batch scanning
    - Store scanned batches in IndexedDB when offline
    - Display offline indicator
    - Queue stock adjustments for sync
    - Auto-sync when connection restored
    - _Requirements: 14.3_

  - [ ]* 24.5 Write property test for mobile offline queue persistence
    - **Property 29: Mobile Offline Queue Persistence**
    - **Validates: Requirements 14.3**

  - [ ] 24.6 Add quick actions after scan
    - Display slide-up panel with batch details
    - Add buttons: Adjust Qty, View Details, Next Scan
    - Implement swipe-down to dismiss
    - _Requirements: 14.4_

  - [ ] 24.7 Implement bulk batch scanning
    - Enable continuous scanning mode
    - Display scanned batch list
    - Add batch count and total quantity
    - Bulk submit all scanned batches
    - _Requirements: 14.6_

- [ ] 25. Implement mobile stock transfer interface
  - [ ] 25.1 Create MobileStockTransfer component
    - Create `components/mobile/MobileStockTransfer.jsx`
    - Use bottom sheet UI pattern
    - Add touch-optimized controls (min 44px touch targets)
    - _Requirements: 15.1_

  - [ ] 25.2 Implement product selection with barcode
    - Add barcode scan button
    - Implement product search with autocomplete
    - Display available stock at source location
    - _Requirements: 15.2, 15.3_

  - [ ] 25.3 Implement location picker
    - Create visual warehouse map (optional)
    - Add from/to location dropdowns
    - Display stock levels at each location
    - _Requirements: 15.1_

  - [ ] 25.4 Implement quantity stepper
    - Create touch-friendly +/- buttons
    - Add direct input option
    - Validate quantity <= available stock
    - Display remaining stock after transfer
    - _Requirements: 15.1_

  - [ ] 25.5 Implement photo capture for documentation
    - Add camera button for transfer documentation
    - Capture and compress photo
    - Attach to transfer record
    - _Requirements: 15.7_

  - [ ] 25.6 Implement push notifications for transfers
    - Send notification to receiving location on transfer initiation
    - Send notification to sender on receipt confirmation
    - Display notification badge in app
    - _Requirements: 15.5_

  - [ ] 25.7 Implement offline transfer queue
    - Queue transfers when offline
    - Display queued transfers with pending status
    - Auto-submit when connection restored
    - _Requirements: 15.8_

- [ ] 26. Implement mobile-responsive product list
  - [ ] 26.1 Create ProductCard component for mobile
    - Create `components/mobile/ProductCard.jsx`
    - Display: product image, name, SKU, stock, price
    - Add stock level indicator (color-coded)
    - Add low stock badge
    - _Requirements: 16.2, 16.6_

  - [ ] 26.2 Implement swipe gestures
    - Add swipe-left for edit action
    - Add swipe-right for delete action (with confirmation)
    - Show action icons during swipe
    - Animate swipe actions
    - _Requirements: 16.3_

  - [ ] 26.3 Implement infinite scroll
    - Load products in batches of 50
    - Detect scroll position near bottom
    - Load next batch automatically
    - Show loading indicator
    - _Requirements: 16.4_

  - [ ] 26.4 Implement touch-optimized filters
    - Create bottom sheet for filters
    - Add category, stock status, price range filters
    - Apply filters without page reload
    - Display active filter count badge
    - _Requirements: 16.5_

  - [ ] 26.5 Implement pull-to-refresh
    - Add pull-to-refresh gesture
    - Show refresh indicator
    - Reload product list
    - Maintain scroll position
    - _Requirements: 16.7, 16.8_

  - [ ] 26.6 Implement responsive breakpoints
    - Card layout for mobile (<768px)
    - Grid layout for tablet (768px-1023px)
    - Table layout for desktop (≥1024px)
    - Test on 320px, 375px, 768px, 1024px screens
    - _Requirements: 16.1, 16.8_

- [ ] 27. Implement performance optimizations
  - [ ] 27.1 Implement virtual scrolling for product list
    - Integrate @tanstack/react-virtual
    - Set estimateSize to 80px per row
    - Set overscan to 5 rows
    - Render only visible items + overscan
    - _Requirements: 17.5_

  - [ ]* 27.2 Write property test for virtual scrolling performance
    - **Property 30: Product List Virtual Scrolling**
    - **Validates: Requirements 17.5**

  - [ ] 27.3 Implement intelligent caching
    - Create useProductCache hook
    - Cache frequently accessed products in localStorage
    - Set cache expiry to 1 hour
    - Invalidate cache on product update
    - _Requirements: 17.6_

  - [ ] 27.4 Implement API response compression
    - Enable gzip compression on server
    - Set compression level to 6
    - Only compress responses > 1KB
    - _Requirements: 17.8_

  - [ ] 27.5 Implement cursor-based pagination
    - Replace offset pagination with cursor-based
    - Use last product ID as cursor
    - Limit to 50 products per page
    - Return next_cursor and has_more in response
    - _Requirements: 17.1_

  - [ ] 27.6 Optimize database queries
    - Add indexes: products(business_id, category), batches(product_id, expiry_date)
    - Add covering index: products(business_id, name) INCLUDE (sku, stock, price)
    - Use EXPLAIN ANALYZE to identify slow queries
    - Optimize queries to <100ms response time
    - _Requirements: 17.1, 17.3_

  - [ ] 27.7 Implement field selection in API
    - Add fields query parameter to product API
    - Return only requested fields
    - Reduce response size by 60-70%
    - _Requirements: 17.8_

  - [ ] 27.8 Optimize image loading
    - Implement lazy loading for product images
    - Use placeholder images during load
    - Compress images to WebP format
    - Serve responsive images based on screen size
    - _Requirements: 17.1_

- [ ] 28. Implement error handling and graceful degradation
  - [ ] 28.1 Implement network error handling
    - Detect offline status: !navigator.onLine
    - Display offline indicator in UI
    - Queue operations for later sync
    - Show helpful error messages
    - _Requirements: 4.8_

  - [ ] 28.2 Implement validation error handling
    - Display inline errors for each field
    - Show summary toast with error count
    - Focus first error field
    - Prevent form submission until errors fixed
    - _Requirements: 21.8_

  - [ ] 28.3 Implement concurrent update conflict resolution
    - Detect version conflicts (optimistic locking)
    - Show conflict resolution dialog
    - Options: keep local, keep server, merge
    - Apply resolution and retry
    - _Requirements: 4.8_

  - [ ] 28.4 Implement graceful degradation
    - Detect missing browser features (camera, localStorage, service workers)
    - Provide alternative workflows
    - Show helpful messages for unsupported browsers
    - Allow read-only access when features unavailable
    - _Requirements: 14.1, 14.3_

- [ ] 29. Checkpoint - Verify mobile optimization and performance
  - Test mobile batch scanner on actual mobile device
  - Test mobile stock transfer with offline mode
  - Test product list with 10,000+ products (virtual scrolling)
  - Verify response times <100ms for stock queries
  - Test on multiple screen sizes (320px, 375px, 768px, 1024px)
  - Verify all performance property tests pass
  - Ask user if questions arise


### Phase 6: API Implementation & Integration (Weeks 11-12)

- [ ] 30. Implement Batch API endpoints
  - [ ] 30.1 Create POST /api/batches endpoint
    - Validate required fields: business_id, product_id, batch_number, quantity
    - Check for duplicate batch_number within product
    - Insert batch record with status 'active'
    - Return created batch with success response
    - _Requirements: 1.1, 7.1_

  - [ ] 30.2 Create GET /api/batches endpoint
    - Accept query params: product_id, business_id
    - Fetch batches with FEFO sorting (ORDER BY expiry_date ASC)
    - Return batches array with success response
    - _Requirements: 7.1_

  - [ ] 30.3 Create GET /api/batches/expiring endpoint
    - Accept query params: business_id, days (default 30)
    - Fetch batches where expiry_date <= CURRENT_DATE + days
    - Return expiring batches with days_until_expiry
    - _Requirements: 11.7_

  - [ ] 30.4 Create POST /api/batches/merge endpoint
    - Validate all batches belong to same product
    - Calculate weighted average cost
    - Use earliest expiry date
    - Create merged batch and mark source batches as merged
    - Return merged batch
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 30.5 Create POST /api/batches/split endpoint
    - Validate sum of split quantities equals original quantity
    - Generate split batch numbers: ORIGINAL-S1, ORIGINAL-S2
    - Create split batches with same cost and expiry
    - Mark original batch as split
    - Return split batches array
    - _Requirements: 7.4, 7.5, 7.6_

- [ ] 31. Implement Serial API endpoints
  - [ ] 31.1 Create POST /api/serials endpoint
    - Validate required fields: business_id, product_id, serial_number
    - Check for duplicate serial_number
    - Calculate warranty_end_date from warranty_period_months
    - Insert serial record with status 'available'
    - Return created serial
    - _Requirements: 1.2_

  - [ ] 31.2 Create POST /api/serials/bulk endpoint
    - Accept array of serials
    - Validate each serial_number is unique
    - Batch insert all serials
    - Return created serials array and count
    - _Requirements: 1.2_

  - [ ] 31.3 Create GET /api/serials/:serial_number endpoint
    - Accept serial_number and business_id
    - Fetch serial with product details
    - Calculate warranty status (active, expiring, expired)
    - Return serial with warranty_status
    - _Requirements: 1.2_

  - [ ] 31.4 Create PATCH /api/serials/:id endpoint
    - Accept status, customer_id, invoice_id
    - Validate status is valid enum value
    - Update serial record
    - Return updated serial
    - _Requirements: 1.2_

- [ ] 32. Implement Stock Adjustment API endpoints
  - [ ] 32.1 Create POST /api/stock-adjustments endpoint
    - Validate required fields: business_id, product_id, quantity_change, reason_code
    - Calculate adjustment_value: quantity_change × product.cost_price
    - Check if value > approval_threshold
    - Set requires_approval and status accordingly
    - Insert adjustment record
    - If no approval required, update product stock immediately
    - Return adjustment with requires_approval flag
    - _Requirements: 5.1, 5.2, 6.1, 6.2_

  - [ ] 32.2 Create POST /api/stock-adjustments/:id/approve endpoint
    - Validate user has approval permission
    - Update adjustment status to 'approved'
    - Record approver and approval_notes
    - Update product stock quantity
    - Send notification to requester
    - Return updated adjustment
    - _Requirements: 5.4, 5.5_

  - [ ] 32.3 Create POST /api/stock-adjustments/:id/reject endpoint
    - Validate user has approval permission
    - Update adjustment status to 'rejected'
    - Record approver and rejection_reason
    - Send notification to requester with reason
    - Return updated adjustment
    - _Requirements: 5.4, 5.5_

  - [ ] 32.4 Create GET /api/stock-adjustments/pending endpoint
    - Accept business_id query param
    - Fetch adjustments where status = 'pending'
    - Filter by user's approval level
    - Return pending adjustments array
    - _Requirements: 5.7_

  - [ ] 32.5 Create GET /api/stock-adjustments/audit endpoint
    - Accept query params: product_id, from_date, to_date
    - Fetch all adjustments in date range
    - Include user details and approval history
    - Return audit trail array
    - _Requirements: 6.5_

- [ ] 33. Implement Multi-Location API endpoints
  - [ ] 33.1 Create GET /api/products/:id/locations endpoint
    - Accept product_id and business_id
    - Fetch all product_locations for product
    - Include warehouse details
    - Calculate available_quantity: quantity - reserved_quantity
    - Return locations array
    - _Requirements: 4.2_

  - [ ] 33.2 Create POST /api/stock-transfers endpoint
    - Validate required fields: product_id, from_warehouse_id, to_warehouse_id, quantity
    - Check available stock at source location
    - Reserve quantity at source: reserved_quantity += quantity
    - Create stock_transfers record with status 'pending'
    - Generate unique transfer_id
    - Send notification to receiving location
    - Return transfer with transfer_id
    - _Requirements: 4.3, 4.4_

  - [ ] 33.3 Create POST /api/stock-transfers/:id/confirm endpoint
    - Accept received_quantity (allow partial receipt)
    - Update source location: quantity -= received_quantity, reserved_quantity -= quantity
    - Update destination location: quantity += received_quantity
    - Update transfer status to 'completed'
    - Record completed_by and completed_at
    - Return updated transfer
    - _Requirements: 4.3_

  - [ ] 33.4 Implement Supabase Realtime subscription
    - Set up realtime channel for inventory updates
    - Subscribe to 'stock.updated' events
    - Broadcast events on stock changes: product_id, warehouse_id, quantity
    - Handle client-side subscription in useMultiLocationSync hook
    - _Requirements: 4.1_

- [ ] 34. Implement Costing Method API endpoints
  - [ ] 34.1 Create POST /api/costing/calculate-cogs endpoint
    - Accept: business_id, product_id, quantity_sold, costing_method
    - Fetch all active batches for product
    - Apply costing method (FIFO, LIFO, WAC) to calculate COGS
    - Return: cogs, unit_cost, batches_used array
    - _Requirements: 3.4_

  - [ ] 34.2 Create GET /api/costing/valuation endpoint
    - Accept: business_id, method (FIFO, LIFO, WAC)
    - Fetch all products with batch data
    - Calculate valuation for each product using method
    - Sum total inventory value
    - Return: total_value, products array with individual valuations
    - _Requirements: 3.8, 3.9_

- [ ] 35. Implement Excel import/export functionality
  - [ ] 35.1 Create POST /api/products/export endpoint
    - Accept: business_id, filters (category, location)
    - Fetch products with batch and serial data
    - Generate Excel file using exceljs or similar
    - Include all fields: basic, batch, serial, domain-specific
    - Return Excel file as download
    - _Requirements: 24.1_

  - [ ] 35.2 Create POST /api/products/import endpoint
    - Accept: Excel file upload
    - Parse Excel file using exceljs
    - Validate required fields for each row
    - Check for duplicate SKUs
    - Batch insert products
    - Return: success count, error array with row numbers and messages
    - _Requirements: 24.2, 24.5_

  - [ ]* 35.3 Write property test for Excel round-trip
    - **Property 31: Excel Import Round-Trip**
    - **Validates: Requirements 24.4**

  - [ ] 35.4 Create GET /api/products/template endpoint
    - Generate Excel template with headers
    - Add data type validation in Excel
    - Include example rows
    - Return template file as download
    - _Requirements: 24.3_

  - [ ] 35.5 Implement Unicode support for Urdu text
    - Ensure Excel export preserves Urdu characters
    - Test import of Urdu product names
    - Verify round-trip preserves Unicode
    - _Requirements: 24.8_

- [ ] 36. Implement backward compatibility layer
  - [ ] 36.1 Maintain existing API endpoints
    - Keep all existing GET /api/products endpoints
    - Keep all existing POST /api/products endpoints
    - Ensure response format unchanged
    - Add new fields as optional
    - _Requirements: 18.2_

  - [ ] 36.2 Handle legacy data formats
    - Check for missing fields in old records
    - Apply default values: costing_method = 'FIFO', approval_threshold = 10000
    - Handle null batch/serial fields gracefully
    - Log warnings for legacy data but continue processing
    - _Requirements: 18.3, 18.8_

  - [ ] 36.3 Create data migration scripts
    - Create script to add default costing_method to existing businesses
    - Create script to calculate warranty_end_date for existing serials
    - Create script to populate available_quantity for existing batches
    - Test scripts on copy of production data
    - _Requirements: 18.7_

  - [ ]* 36.4 Write property test for backward compatibility
    - **Property 1: Backward Compatibility Preservation**
    - **Validates: Requirements 1.7, 1.8, 18.1**

- [ ] 37. Final integration and wiring
  - [ ] 37.1 Wire all components to API endpoints
    - Connect BatchTrackingManager to batch API
    - Connect SerialTrackingManager to serial API
    - Connect StockAdjustmentManager to adjustment API
    - Connect UnifiedActionPanel to all APIs
    - Connect ProductEntryHub to product API
    - _Requirements: 1.7, 1.8_

  - [ ] 37.2 Implement error boundaries
    - Create ErrorBoundary component
    - Wrap all major components with ErrorBoundary
    - Display user-friendly error messages
    - Log errors to error tracking service
    - _Requirements: 18.8_

  - [ ] 37.3 Implement loading states
    - Add loading spinners for all async operations
    - Use skeleton screens for initial page load
    - Show progress indicators for bulk operations
    - Implement optimistic updates for better UX
    - _Requirements: 17.1_

  - [ ] 37.4 Implement success/error notifications
    - Use toast notifications for all operations
    - Success: green toast with checkmark
    - Error: red toast with error message
    - Warning: yellow toast for warnings
    - Auto-dismiss after 5 seconds
    - _Requirements: 1.7_

- [ ] 38. Final checkpoint - Complete system integration
  - Test all API endpoints with Postman or similar
  - Test all components with real API data
  - Verify all features work end-to-end
  - Test backward compatibility with legacy data
  - Verify Excel import/export round-trip
  - Run all unit tests and property tests
  - Ensure all tests pass
  - Ask user if questions arise


### Phase 7: Testing & Quality Assurance (Week 13)

- [ ] 39. Complete unit test coverage
  - [ ]* 39.1 Write unit tests for useBatchTracking hook
    - Test addBatch, updateBatch, deleteBatch functions
    - Test FEFO sorting logic
    - Test getNextExpiryBatch and getExpiringBatches
    - Test error handling and loading states
    - _Requirements: 23.2_

  - [ ]* 39.2 Write unit tests for useSerialTracking hook
    - Test registerSerial, bulkRegisterSerials functions
    - Test updateSerialStatus function
    - Test getWarrantyStatus calculation
    - Test error handling and loading states
    - _Requirements: 23.2_

  - [ ]* 39.3 Write unit tests for useStockAdjustment hook
    - Test createAdjustment with approval threshold
    - Test approveAdjustment and rejectAdjustment
    - Test getAuditTrail and getPendingApprovals
    - Test error handling and loading states
    - _Requirements: 23.2_

  - [ ]* 39.4 Write unit tests for useCostingMethod hook
    - Test FIFO calculation with known batches
    - Test LIFO calculation with known batches
    - Test WAC calculation with known batches
    - Test edge cases: zero quantity, single batch
    - _Requirements: 23.2_

  - [ ]* 39.5 Write unit tests for useMultiLocationSync hook
    - Test getProductLocations function
    - Test transferStock with reservation
    - Test confirmReceipt with partial receipt
    - Test realtime subscription setup
    - _Requirements: 23.3_

  - [ ]* 39.6 Write unit tests for BatchTrackingManager component
    - Test batch entry form submission
    - Test batch merge with weighted average
    - Test batch split with quantity validation
    - Test textile field calculations
    - _Requirements: 23.1_

  - [ ]* 39.7 Write unit tests for SerialTrackingManager component
    - Test serial registration
    - Test bulk serial registration
    - Test warranty status calculation
    - Test status update
    - _Requirements: 23.1_

  - [ ]* 39.8 Write unit tests for StockAdjustmentManager component
    - Test adjustment creation with approval check
    - Test approval workflow
    - Test rejection workflow
    - Test audit trail display
    - _Requirements: 23.1_

  - [ ]* 39.9 Write unit tests for UnifiedActionPanel component
    - Test tab switching
    - Test keyboard shortcuts
    - Test lazy loading
    - Test tab visibility logic
    - _Requirements: 23.1_

  - [ ]* 39.10 Write unit tests for ProductEntryHub component
    - Test mode switching with data preservation
    - Test Quick mode validation
    - Test Standard mode with all fields
    - Test Excel mode grid
    - Test Template mode pre-fill
    - _Requirements: 23.1_

- [ ] 40. Complete integration tests
  - [ ]* 40.1 Write integration test for multi-location sync
    - Create product at location A
    - Adjust stock at location A
    - Verify update at location B within 2 seconds
    - Test realtime subscription
    - _Requirements: 23.3_

  - [ ]* 40.2 Write integration test for approval workflow
    - Create high-value adjustment
    - Verify pending status and notification
    - Approve adjustment
    - Verify stock updated and requester notified
    - _Requirements: 23.4_

  - [ ]* 40.3 Write integration test for batch merge
    - Create 3 batches with different costs
    - Merge batches
    - Verify weighted average cost
    - Verify earliest expiry date used
    - _Requirements: 23.2_

  - [ ]* 40.4 Write integration test for stock transfer
    - Initiate transfer from location A to B
    - Verify reservation at location A
    - Confirm receipt at location B
    - Verify quantities updated correctly
    - _Requirements: 23.3_

  - [ ]* 40.5 Write integration test for costing methods
    - Create batches with different costs and dates
    - Sell quantity using FIFO
    - Verify correct batches consumed
    - Repeat for LIFO and WAC
    - _Requirements: 23.2_

- [ ] 41. Complete end-to-end tests
  - [ ]* 41.1 Write E2E test for complete stock adjustment workflow
    - Login as staff user
    - Create high-value adjustment
    - Verify pending status
    - Login as manager
    - Approve adjustment
    - Verify stock updated
    - Check audit trail
    - _Requirements: 23.4_

  - [ ]* 41.2 Write E2E test for batch tracking workflow
    - Create product with batch tracking
    - Add 3 batches with different expiry dates
    - Verify FEFO sorting
    - Merge 2 batches
    - Split 1 batch
    - Verify all operations in audit trail
    - _Requirements: 23.2_

  - [ ]* 41.3 Write E2E test for serial tracking workflow
    - Create product with serial tracking
    - Register 10 serials
    - Bulk register 20 more serials
    - Update serial status to 'sold'
    - Verify warranty status
    - _Requirements: 23.2_

  - [ ]* 41.4 Write E2E test for textile product workflow
    - Create textile product
    - Add roll with dimensions
    - Calculate area and cutting requirement
    - Sell partial roll
    - Verify remaining dimensions updated
    - _Requirements: 23.2_

  - [ ]* 41.5 Write E2E test for garment matrix workflow
    - Create garment product
    - Define size-color matrix
    - Verify SKU auto-generation
    - Set all prices
    - Distribute quantity across matrix
    - Verify low stock highlighting
    - _Requirements: 23.2_

  - [ ]* 41.6 Write E2E test for pharmacy compliance workflow
    - Create pharmacy product with drug registration
    - Add batch with expiry date
    - Attempt to sell expired batch
    - Verify sale blocked
    - Sell from valid batch with prescription
    - _Requirements: 23.2_

- [ ] 42. Complete performance tests
  - [ ]* 42.1 Write performance test for product list load time
    - Create 10,000 products
    - Measure page load time
    - Verify <2 seconds
    - _Requirements: 23.5_

  - [ ]* 42.2 Write performance test for search response time
    - Create 10,000 products
    - Perform search query
    - Measure response time
    - Verify <500ms
    - _Requirements: 23.5_

  - [ ]* 42.3 Write performance test for stock adjustment
    - Create adjustment
    - Measure operation time
    - Verify <1 second
    - _Requirements: 23.5_

  - [ ]* 42.4 Write performance test for virtual scrolling
    - Render product list with 10,000 items
    - Verify only visible items in DOM
    - Measure render time
    - Verify <100ms
    - _Requirements: 23.5_

- [ ] 43. Complete mobile responsiveness tests
  - [ ]* 43.1 Write responsiveness test for 320px screen
    - Test all components at 320px width
    - Verify no horizontal scroll
    - Verify touch targets ≥44px
    - _Requirements: 23.6_

  - [ ]* 43.2 Write responsiveness test for 375px screen
    - Test all components at 375px width
    - Verify layout adapts correctly
    - Verify all features accessible
    - _Requirements: 23.6_

  - [ ]* 43.3 Write responsiveness test for 768px screen
    - Test all components at 768px width
    - Verify tablet layout
    - Verify grid layout works
    - _Requirements: 23.6_

  - [ ]* 43.4 Write responsiveness test for touch interactions
    - Test swipe gestures on product cards
    - Test pull-to-refresh
    - Test bottom sheet interactions
    - Test FAB button
    - _Requirements: 23.6_

- [ ] 44. Complete backward compatibility tests
  - [ ]* 44.1 Write compatibility test for legacy product data
    - Load products without costing_method
    - Verify default FIFO applied
    - Verify no errors
    - _Requirements: 23.7_

  - [ ]* 44.2 Write compatibility test for legacy batch data
    - Load batches without parent_batch_id
    - Verify default values applied
    - Verify FEFO sorting works
    - _Requirements: 23.7_

  - [ ]* 44.3 Write compatibility test for legacy serial data
    - Load serials without warranty_end_date
    - Verify calculation from warranty_period_months
    - Verify warranty status correct
    - _Requirements: 23.7_

  - [ ]* 44.4 Write compatibility test for existing API contracts
    - Call existing GET /api/products endpoint
    - Verify response format unchanged
    - Verify new fields optional
    - _Requirements: 23.7_

- [ ] 45. Verify test coverage requirements
  - Run test coverage report
  - Verify overall coverage ≥80%
  - Verify consolidated components coverage ≥85%
  - Verify business logic coverage ≥90%
  - Verify API endpoints coverage ≥85%
  - Verify critical paths coverage ≥95%
  - Fix any coverage gaps
  - _Requirements: 23.1_


### Phase 8: Migration, Documentation & Deployment (Week 14)

- [ ] 46. Execute data migration
  - [ ] 46.1 Backup production database
    - Create full database backup
    - Verify backup integrity
    - Store backup in secure location
    - Document backup location and timestamp
    - _Requirements: 18.7_

  - [ ] 46.2 Run migration scripts on staging
    - Execute batch data migration script
    - Execute serial data migration script
    - Execute business settings migration script
    - Verify all migrations successful
    - Check for data integrity issues
    - _Requirements: 18.7_

  - [ ] 46.3 Verify migrated data
    - Compare record counts before/after
    - Verify all products have costing_method
    - Verify all serials have warranty_end_date
    - Verify all batches have available_quantity
    - Run data validation queries
    - _Requirements: 18.7_

  - [ ] 46.4 Test with migrated data
    - Load application with migrated data
    - Test all major workflows
    - Verify no errors or warnings
    - Check audit trail integrity
    - _Requirements: 18.7_

  - [ ] 46.5 Prepare rollback procedures
    - Document rollback steps
    - Test rollback on staging
    - Prepare rollback scripts
    - Define rollback triggers
    - _Requirements: 18.7_

- [ ] 47. Create user documentation
  - [ ] 47.1 Write user guide for consolidated components
    - Document BatchTrackingManager usage
    - Document SerialTrackingManager usage
    - Document StockAdjustmentManager usage
    - Include screenshots and examples
    - _Requirements: 1.7_

  - [ ] 47.2 Write user guide for enterprise features
    - Document costing methods (FIFO, LIFO, WAC)
    - Document multi-location sync
    - Document approval workflows
    - Document cycle counting
    - Include best practices
    - _Requirements: 3.6, 4.1, 5.1, 8.1_

  - [ ] 47.3 Write user guide for Pakistani market features
    - Document textile roll tracking
    - Document garment matrix
    - Document pharmacy compliance
    - Document seasonal pricing
    - Document Urdu localization
    - Include industry-specific examples
    - _Requirements: 9.1, 10.1, 11.1, 12.1, 13.1_

  - [ ] 47.4 Write user guide for mobile features
    - Document mobile batch scanner
    - Document mobile stock transfer
    - Document mobile product list
    - Include screenshots from mobile devices
    - _Requirements: 14.1, 15.1, 16.1_

  - [ ] 47.5 Create keyboard shortcuts reference
    - List all keyboard shortcuts
    - Organize by category
    - Include visual diagrams
    - Create printable cheat sheet
    - _Requirements: 20.8_

- [ ] 48. Create developer documentation
  - [ ] 48.1 Write API documentation
    - Document all batch API endpoints
    - Document all serial API endpoints
    - Document all stock adjustment API endpoints
    - Document all multi-location API endpoints
    - Document all costing API endpoints
    - Include request/response examples
    - _Requirements: 18.2_

  - [ ] 48.2 Write component documentation
    - Document all consolidated components
    - Document props interfaces
    - Document state management
    - Include usage examples
    - _Requirements: 1.5, 1.6_

  - [ ] 48.3 Write hook documentation
    - Document all custom hooks
    - Document parameters and return values
    - Include usage examples
    - Document error handling
    - _Requirements: 19.3, 19.4, 19.5_

  - [ ] 48.4 Write migration guide
    - Document migration steps
    - Document breaking changes (if any)
    - Document rollback procedures
    - Include troubleshooting section
    - _Requirements: 18.7_

  - [ ] 48.5 Write architecture documentation
    - Document system architecture
    - Document data flow
    - Document state management strategy
    - Include architecture diagrams
    - _Requirements: 1.7_

- [ ] 49. Implement feature flags for gradual rollout
  - [ ] 49.1 Create feature flag system
    - Add feature_flags column to businesses table
    - Create feature flag management UI
    - Implement flag checking in components
    - _Requirements: 18.6_

  - [ ] 49.2 Implement component switching logic
    - Check consolidated_inventory_v2 flag
    - Render new components if flag enabled
    - Render legacy components if flag disabled
    - Log component usage for monitoring
    - _Requirements: 18.6_

  - [ ] 49.3 Create gradual rollout plan
    - Phase 1: Enable for test businesses (5%)
    - Phase 2: Enable for early adopters (20%)
    - Phase 3: Enable for all businesses (100%)
    - Define success criteria for each phase
    - _Requirements: 18.6_

- [ ] 50. Deploy to staging environment
  - [ ] 50.1 Build production bundle
    - Run production build: npm run build
    - Verify no build errors
    - Check bundle size
    - Optimize if necessary
    - _Requirements: 17.1_

  - [ ] 50.2 Deploy to staging
    - Deploy application to staging server
    - Run database migrations
    - Verify deployment successful
    - Check application logs
    - _Requirements: 18.7_

  - [ ] 50.3 Run smoke tests on staging
    - Test all major workflows
    - Test with production-like data
    - Verify performance metrics
    - Check error rates
    - _Requirements: 23.1_

  - [ ] 50.4 Conduct user acceptance testing
    - Invite test users to staging
    - Provide testing checklist
    - Collect feedback
    - Fix critical issues
    - _Requirements: 1.7_

- [ ] 51. Deploy to production
  - [ ] 51.1 Schedule deployment window
    - Choose low-traffic time
    - Notify users of maintenance
    - Prepare deployment checklist
    - Assign roles and responsibilities
    - _Requirements: 18.7_

  - [ ] 51.2 Execute production deployment
    - Deploy application to production
    - Run database migrations
    - Verify deployment successful
    - Enable feature flags for Phase 1 (5%)
    - _Requirements: 18.6, 18.7_

  - [ ] 51.3 Monitor deployment
    - Monitor error rates
    - Monitor performance metrics
    - Monitor user feedback
    - Check application logs
    - _Requirements: 17.1_

  - [ ] 51.4 Verify production functionality
    - Test all major workflows
    - Verify data integrity
    - Check API response times
    - Verify mobile functionality
    - _Requirements: 17.1, 17.2, 17.3_

- [ ] 52. Post-deployment monitoring and optimization
  - [ ] 52.1 Set up monitoring dashboards
    - Create dashboard for error rates
    - Create dashboard for performance metrics
    - Create dashboard for feature adoption
    - Set up alerts for anomalies
    - _Requirements: 17.1_

  - [ ] 52.2 Monitor Phase 1 rollout (5% of businesses)
    - Track error rates
    - Track performance metrics
    - Collect user feedback
    - Fix critical issues
    - _Requirements: 18.6_

  - [ ] 52.3 Expand to Phase 2 rollout (20% of businesses)
    - Enable feature flags for Phase 2
    - Monitor metrics
    - Collect feedback
    - Optimize based on feedback
    - _Requirements: 18.6_

  - [ ] 52.4 Complete Phase 3 rollout (100% of businesses)
    - Enable feature flags for all businesses
    - Monitor metrics
    - Ensure stability
    - Celebrate success!
    - _Requirements: 18.6_

  - [ ] 52.5 Remove legacy components
    - Wait 1 month after 100% rollout
    - Verify no usage of legacy components
    - Remove legacy component files
    - Clean up feature flag code
    - _Requirements: 1.7_

- [ ] 53. Final verification and sign-off
  - Verify all 24 requirements implemented
  - Verify code duplication reduced by 92% (1,200 → <100 lines)
  - Verify average component size ≤250 lines
  - Verify navigation requires ≤2 clicks
  - Verify 10+ enterprise features operational
  - Verify 5+ Pakistani market features integrated
  - Verify 100% mobile responsiveness
  - Verify <100ms response time for 95% of operations
  - Verify zero data migration issues
  - Verify test coverage ≥80%
  - Verify zero breaking changes to existing APIs
  - Collect user satisfaction feedback
  - Document lessons learned
  - Archive project documentation

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions
- End-to-end tests validate complete workflows
- The implementation follows a phased approach over 14 weeks
- Feature flags enable gradual rollout with minimal risk
- Backward compatibility is maintained throughout

## Success Criteria

The project will be considered successful when:

1. All 24 requirements are implemented and tested ✓
2. Code duplication reduced by 92% (1,200 → <100 lines) ✓
3. Average component size ≤250 lines ✓
4. Navigation requires ≤2 clicks for all operations ✓
5. 10+ enterprise features operational ✓
6. 5+ Pakistani market features integrated ✓
7. 100% mobile responsiveness achieved ✓
8. <100ms response time for 95% of operations ✓
9. Zero data migration issues reported ✓
10. Test coverage ≥80% across all components ✓
11. Zero breaking changes to existing APIs ✓
12. User satisfaction score ≥4.5/5.0 ✓

