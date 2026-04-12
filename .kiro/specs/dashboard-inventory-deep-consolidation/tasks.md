# Implementation Plan: Dashboard and Inventory System Deep Consolidation & Gap Closure

## Overview

This implementation plan consolidates dashboard and inventory systems to eliminate 25-30% code duplication, replace 100% mock data with real APIs, reduce all components to <300 lines, and establish 10+ dashboard-inventory integration points. The plan follows 11 phases over 18 weeks, extracting shared utilities, implementing unified services, creating a widget registry, and completing missing implementations from both specs.

## Tasks

- [x] 1. Extract centralized utilities and implement unified services
  - [x] 1.1 Create centralized utility modules
    - Create lib/utils/currency.js with formatCurrency function supporting PKR, USD, EUR
    - Create lib/utils/datetime.js with formatDateTime function supporting multiple formats and locales
    - Create lib/utils/number.js with formatNumber and formatPercentage functions
    - Create lib/utils/permissions.js with hasPermission function
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 1.2 Replace all duplicate utility instances with centralized imports
    - Find and replace all 15+ formatCurrency instances with imports from lib/utils/currency.js
    - Find and replace all 20+ useLanguage instances with imports from lib/hooks/useLanguage.js
    - Verify no duplicate utility code remains in components
    - _Requirements: 1.6, 1.7, 1.8, 1.9_
  
  - [x] 1.3 Implement ErrorHandlingService
    - Create lib/services/errorHandling.js with ErrorHandlingService class
    - Implement handleError, categorizeError, getErrorMessage, retryWithBackoff methods
    - Implement error logging and monitoring integration
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
  
  - [x] 1.4 Implement DataFetchingService
    - Create lib/services/dataFetching.js with DataFetchingService class
    - Implement fetchWithAuth, fetchWithRetry, fetchWithCache methods
    - Implement request deduplication and business_id validation
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_
  
  - [x] 1.5 Implement FormValidationService
    - Create lib/services/formValidation.js with FormValidationService class
    - Implement validateRequired, validateNumber, validateDate, validateCurrency methods
    - Implement validateSKU, validateBatchNumber, validateSerialNumber methods
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_
  
  - [x] 1.6 Implement Widget Registry
    - Create lib/widgets/widgetRegistry.js with WidgetRegistry class
    - Implement registerWidget, getWidget, getWidgetsByCategory, getWidgetsByPermission methods
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ]* 1.7 Write property tests for utilities and services
    - **Property 1: Utility Formatting Functions Preserve Data Integrity**
    - **Validates: Requirements 1.2, 1.4, 1.5**
  
  - [ ]* 1.8 Write property test for error handling
    - **Property 5: Error Categorization Consistency**
    - **Validates: Requirements 10.2, 10.4**
  
  - [ ]* 1.9 Write property test for exponential backoff
    - **Property 6: Exponential Backoff Retry Behavior**
    - **Validates: Requirements 7.8, 10.3**
  
  - [ ]* 1.10 Write property tests for data fetching
    - **Property 7: Data Fetching Authentication Header Injection**
    - **Property 8: Data Fetching Cache Behavior**
    - **Property 9: Request Deduplication for Concurrent Requests**
    - **Property 10: Multi-Tenant Isolation Enforcement**
    - **Validates: Requirements 11.1, 11.3, 11.6, 7.4, 11.4**
  
  - [ ]* 1.11 Write property tests for form validation
    - **Property 11: Form Validation Required Field Rejection**
    - **Property 12: Form Validation Number Range Enforcement**
    - **Property 13: Form Validation Date Range Enforcement**
    - **Property 14: Form Validation Currency Precision Enforcement**
    - **Property 15: Form Validation Batch Number Format Enforcement**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.6**
  
  - [ ]* 1.12 Write property test for Widget Registry
    - **Property 2: Widget Registry Lookup Correctness**
    - **Validates: Requirements 5.1, 5.3, 5.4, 5.5, 5.6**

- [x] 2. Implement shared component library
  - [x] 2.1 Create DashboardStatsGrid component
    - Create components/shared/DashboardStatsGrid.jsx accepting stats array, colorTheme, onStatClick
    - Implement grid layout with responsive columns
    - _Requirements: 2.1, 2.9_
  
  - [x] 2.2 Create DashboardLoadingSkeleton component
    - Create components/shared/DashboardLoadingSkeleton.jsx with configurable cardCount and layout
    - Implement skeleton cards with shimmer animation
    - _Requirements: 2.2_
  
  - [x] 2.3 Create RevenueChartSection component
    - Create components/shared/RevenueChartSection.jsx with time range selection and export
    - Implement useDashboardMetrics hook for data fetching
    - Integrate with DataFetchingService for real API calls
    - _Requirements: 2.3, 2.4_
  
  - [x] 2.4 Create supporting shared components
    - Create components/shared/StatsCard.jsx for individual metric display
    - Create components/shared/WidgetContainer.jsx with error boundary and consistent chrome
    - Create components/shared/EmptyState.jsx for no-data scenarios
    - Create components/shared/ErrorState.jsx for error scenarios with retry
    - _Requirements: 2.5, 2.6, 2.7, 2.8_
  
  - [ ]* 2.5 Write unit tests for shared components
    - Test DashboardStatsGrid with various stat configurations
    - Test DashboardLoadingSkeleton with different card counts
    - Test RevenueChartSection with mock data
    - Test StatsCard, WidgetContainer, EmptyState, ErrorState
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8_
  
  - [x] 2.6 Update existing components to use shared components
    - Replace inline stats grids with DashboardStatsGrid in all dashboard templates
    - Replace inline loading skeletons with DashboardLoadingSkeleton
    - Verify duplication reduction from 5 implementations to 1
    - _Requirements: 2.10_

- [x] 3. Checkpoint - Verify foundation and shared components
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Extract widgets and replace mock data
  - [ ] 4.1 Extract manager dashboard widgets
    - Extract TeamPerformanceWidget from ManagerDashboard to components/dashboard/widgets/
    - Extract InventoryAlertsWidget from ManagerDashboard
    - Extract SalesTargetsWidget from ManagerDashboard
    - Register all three widgets in Widget Registry
    - _Requirements: 4.1, 4.2, 4.3, 4.11_
  
  - [ ] 4.2 Extract sales dashboard widgets
    - Extract TodaysSalesWidget from SalesDashboard to components/dashboard/widgets/
    - Extract CommissionWidget from SalesDashboard
    - Extract CustomersWidget from SalesDashboard
    - Register all three widgets in Widget Registry
    - _Requirements: 4.4, 4.5, 4.6, 4.11_
  
  - [ ] 4.3 Extract inventory dashboard widgets
    - Extract StockLevelsWidget from InventoryDashboard to components/dashboard/widgets/
    - Extract ReorderAlertsWidget from InventoryDashboard
    - Extract CycleCountTasksWidget from InventoryDashboard
    - Register all three widgets in Widget Registry
    - _Requirements: 4.7, 4.8, 4.9, 4.11_
  
  - [ ] 4.4 Extract system health widget
    - Extract SystemHealthWidget to components/dashboard/widgets/
    - Register widget in Widget Registry
    - _Requirements: 4.10, 4.11_
  
  - [ ] 4.5 Replace mock data in manager dashboard widgets
    - Replace TeamPerformanceWidget mock data with real API call to /api/dashboard/team-performance
    - Replace InventoryAlertsWidget mock data with real API call to /api/inventory/alerts
    - Replace SalesTargetsWidget mock data with real API call to /api/dashboard/sales-targets
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ] 4.6 Replace mock data in sales dashboard widgets
    - Replace TodaysSalesWidget mock data with real API call to /api/dashboard/todays-sales
    - Replace CommissionWidget mock data with real API call to /api/dashboard/commission
    - Replace CustomersWidget mock data with real API call to /api/dashboard/customers
    - _Requirements: 3.5, 3.6, 3.7_
  
  - [ ] 4.7 Replace mock data in inventory dashboard widgets
    - Replace StockLevelsWidget mock data with real API call to /api/inventory/stock-levels
    - Replace ReorderAlertsWidget mock data with real API call to /api/inventory/reorder-alerts
    - Replace CycleCountTasksWidget mock data with real API call to /api/inventory/cycle-count-tasks
    - _Requirements: 3.8, 3.9, 3.10_
  
  - [ ] 4.8 Replace mock data in system health widget
    - Replace SystemHealthWidget mock data with real API call to /api/system/health
    - _Requirements: 3.1_
  
  - [ ]* 4.9 Write unit tests for extracted widgets
    - Test each widget renders correctly with data
    - Test each widget handles loading and error states
    - Test each widget makes correct API calls
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_
  
  - [ ]* 4.10 Write property test for mock data elimination
    - **Property 26: Widget Loads Fetch Real API Data**
    - **Validates: Requirements 3.11**

- [ ] 5. Refactor dashboard templates and implement filtering
  - [ ] 5.1 Refactor ManagerDashboard to use shared components
    - Replace inline components with DashboardStatsGrid, WidgetContainer
    - Use extracted widgets instead of inline implementations
    - Reduce component size from 485 lines to <300 lines
    - _Requirements: 6.2, 6.5, 6.7_
  
  - [ ] 5.2 Refactor other dashboard templates
    - Refactor OwnerDashboard, SalesDashboard, InventoryDashboard, AccountantDashboard
    - Use shared components and extracted widgets
    - Ensure all templates are <300 lines
    - _Requirements: 6.5, 6.7, 6.10_
  
  - [ ] 5.3 Implement permission-based widget filtering
    - Implement hasPermission function in lib/utils/permissions.js
    - Filter widgets based on user role and requiredPermissions from Widget Registry
    - Apply filtering in RoleBasedDashboardController
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10_
  
  - [ ] 5.4 Implement domain-role widget merging
    - Merge domain-specific widgets with role-specific widgets
    - Remove duplicate widgets when merging
    - Prioritize domain-specific widgets in layout
    - Load domain knowledge using getDomainKnowledge
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10_
  
  - [ ]* 5.5 Write property test for permission-based filtering
    - **Property 21: Permission-Based Widget Filtering**
    - **Validates: Requirements 13.1, 13.2**
  
  - [ ]* 5.6 Write property tests for domain-role merging
    - **Property 22: Domain-Role Widget Merging Without Duplicates**
    - **Property 23: Domain Widget Prioritization in Layout**
    - **Validates: Requirements 14.1, 14.5, 14.4**
  
  - [ ]* 5.7 Write integration tests for dashboard templates
    - Test each template renders with correct widgets
    - Test permission filtering works correctly
    - Test domain-role merging works correctly
    - _Requirements: 13.10, 14.10_

- [ ] 6. Checkpoint - Verify widget extraction and dashboard refactoring
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Advanced/Easy Mode dashboard switching
  - [ ] 7.1 Create mode toggle component
    - Create components/dashboard/ModeToggle.jsx with toggle button
    - Implement smooth transition animation (fade-out/fade-in, 300ms)
    - Add tooltip explaining mode differences
    - _Requirements: 28.5, 28.10, 28.11_
  
  - [ ] 7.2 Implement mode preference persistence
    - Create lib/services/modePreference.js with ModePreferenceService class
    - Implement saveModePreference and loadModePreference methods
    - Store preferences in user_preferences table with user_id and business_id
    - _Requirements: 28.6, 28.7_
  
  - [ ] 7.3 Implement separate layout storage per mode
    - Implement saveLayoutConfig and loadLayoutConfig methods in ModePreferenceService
    - Store separate layouts for Advanced and Easy modes per user
    - Implement getDefaultLayout for each mode
    - _Requirements: 28.14_
  
  - [ ] 7.4 Implement mode switching with layout preservation
    - Save current layout when switching modes
    - Restore previous layout when switching back
    - Apply Easy Mode preset layout (6-8 essential widgets)
    - Restore Advanced Mode layout (all 25+ widgets)
    - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.8, 28.9, 28.12, 28.13, 28.15_
  
  - [ ]* 7.5 Write property tests for mode preference
    - **Property 24: Mode Preference Persistence Round-Trip**
    - **Property 25: Separate Layout Storage Per Mode**
    - **Validates: Requirements 28.6, 28.14**
  
  - [ ]* 7.6 Write integration tests for mode switching
    - Test mode toggle switches between Advanced and Easy
    - Test layout preservation when switching modes
    - Test preference persistence across sessions
    - _Requirements: 28.5, 28.8, 28.9_

- [ ] 8. Implement dashboard-inventory integration
  - [ ] 8.1 Implement inventory valuation integration
    - Create calculateInventoryValuation function supporting FIFO, LIFO, WAC
    - Integrate inventory valuation into dashboard financial widgets
    - Display inventory value and COGS in financial summary
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10, 9.1_
  
  - [ ] 8.2 Implement batch expiry alert integration
    - Create getBatchExpiryAlerts function with severity classification
    - Integrate batch expiry alerts into InventoryAlertsWidget
    - Display expiry count badges with color coding
    - Implement navigation to batch management on click
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9, 16.10, 9.2_
  
  - [ ] 8.3 Implement low stock alert integration
    - Create getLowStockAlerts function identifying products below minimum stock
    - Integrate low stock alerts into ReorderAlertsWidget
    - Calculate days until stockout based on average daily sales
    - Implement navigation to product reorder screen on click
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10, 9.3_
  
  - [ ] 8.4 Implement cycle count task integration
    - Create getCycleCountTasks function filtering by user and business
    - Integrate cycle count tasks into CycleCountTasksWidget
    - Display task details with status badges
    - Implement navigation to cycle count execution screen on click
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 18.10, 9.4_
  
  - [ ] 8.5 Implement stock transfer approval integration
    - Create getPendingStockTransfers function filtering by business
    - Integrate stock transfers into manager approval queue widget
    - Display transfer details with value calculation
    - Implement approval dialog with approve/reject actions
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9, 19.10, 9.5_
  
  - [ ] 8.6 Implement serial warranty and warehouse distribution integration
    - Integrate serial warranty status into SystemHealthWidget
    - Integrate warehouse distribution into multi-location widgets
    - Implement navigation to relevant inventory screens on click
    - _Requirements: 9.6, 9.7_
  
  - [ ]* 8.7 Write property tests for inventory integration
    - **Property 16: Inventory Valuation Calculation Correctness**
    - **Property 17: Batch Expiry Severity Classification**
    - **Property 18: Low Stock Alert Identification**
    - **Property 19: Cycle Count Task Retrieval**
    - **Property 20: Stock Transfer Approval Retrieval**
    - **Validates: Requirements 15.1, 16.1, 16.2, 17.1, 17.2, 18.1, 19.1**
  
  - [ ]* 8.8 Write integration tests for dashboard-inventory integration
    - Test inventory valuation displays in financial widgets
    - Test batch expiry alerts display in inventory widgets
    - Test low stock alerts display in reorder widgets
    - Test cycle count tasks display in inventory staff widgets
    - Test stock transfer approvals display in manager widgets
    - Test real-time updates when inventory data changes
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.8, 9.9, 9.10_

- [ ] 9. Checkpoint - Verify mode switching and inventory integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement layout persistence and serialization
  - [ ] 10.1 Implement layout persistence
    - Create API endpoints for saving and loading dashboard layouts
    - Implement layout save functionality in dashboard templates
    - Implement layout load functionality with restoration on dashboard load
    - Implement layout reset-to-default functionality
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 10.2 Implement layout export/import with JSON serialization
    - Implement exportLayout function serializing layout to JSON
    - Implement importLayout function parsing JSON and validating widget IDs
    - Implement layout versioning for backward compatibility
    - Handle missing widgets gracefully with warnings
    - _Requirements: 26.1, 26.2, 26.3, 26.5, 26.6, 26.7, 26.8_
  
  - [ ]* 10.3 Write property test for layout serialization
    - **Property 3: Dashboard Layout Round-Trip Preservation**
    - **Validates: Requirements 7.1, 26.1, 26.3, 26.4**
  
  - [ ]* 10.4 Write unit tests for layout persistence
    - Test layout save stores correct data
    - Test layout load restores correct layout
    - Test layout reset returns to default
    - Test layout export produces valid JSON
    - Test layout import handles invalid data
    - _Requirements: 7.1, 7.2, 7.3, 26.1, 26.2, 26.5_

- [ ] 11. Implement product data import/export
  - [ ] 11.1 Implement product data export to Excel
    - Create exportProductsToExcel function with all fields including batch and serial
    - Implement Excel template generation with pre-filled headers
    - Handle Unicode characters (Urdu text) correctly
    - _Requirements: 27.1, 27.3, 27.8_
  
  - [ ] 11.2 Implement product data import from Excel
    - Create importProductsFromExcel function with validation
    - Validate required fields (SKU, Name, Category, Price, Stock)
    - Validate data types and formats
    - Return descriptive error messages with row and column numbers
    - _Requirements: 27.2, 27.5, 27.7_
  
  - [ ] 11.3 Implement Excel formula support and data type preservation
    - Support Excel formulas in price and stock columns
    - Preserve data types (numbers, dates, text) during export and import
    - _Requirements: 27.6, 27.7_
  
  - [ ]* 11.4 Write property test for product import/export
    - **Property 4: Product Data Export/Import Round-Trip Preservation**
    - **Validates: Requirements 27.1, 27.4, 27.8**
  
  - [ ]* 11.5 Write unit tests for product import/export
    - Test export produces valid Excel file
    - Test import validates required fields
    - Test import handles invalid data with descriptive errors
    - Test Unicode character handling
    - _Requirements: 27.1, 27.2, 27.5, 27.8_

- [ ] 12. Complete missing dashboard implementations
  - [ ] 12.1 Implement multi-tenant isolation
    - Add business_id filtering to all dashboard queries
    - Implement business context switching with cache clearing
    - Validate business_id on all API requests
    - _Requirements: 7.4, 7.5_
  
  - [ ] 12.2 Implement performance optimizations
    - Implement React Query caching with 5-minute staleTime
    - Implement code splitting for dashboard templates
    - Implement lazy loading for below-fold widgets
    - Implement React.memo for widget components
    - _Requirements: 7.6, 7.7, 20.1, 20.2, 20.5, 20.6, 20.7, 20.9_
  
  - [ ] 12.3 Implement error handling and recovery
    - Implement widget-level error states with retry buttons
    - Implement dashboard-level error recovery with fallback to cached data
    - Replace inline error handlers with ErrorHandlingService
    - _Requirements: 7.8, 7.9, 7.10, 10.7, 10.9_
  
  - [ ] 12.4 Implement real-time updates via WebSocket
    - Establish WebSocket connection for dashboard metrics
    - Implement cache invalidation on inventory changes
    - Implement widget refresh on real-time updates
    - _Requirements: 7.11, 9.8_
  
  - [ ] 12.5 Implement accessibility features
    - Add keyboard navigation for all interactive elements
    - Add ARIA labels for all widgets
    - Ensure color contrast ratios of at least 4.5:1
    - Add focus indicators for keyboard navigation
    - _Requirements: 7.12, 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 22.8, 22.9_

- [ ] 13. Complete missing inventory implementations
  - [ ] 13.1 Implement Pakistani market features
    - Implement textile roll/bale tracking with dimensions and weight
    - Implement garment lot tracking with size-color matrix
    - Implement pharmacy FBR compliance with drug registration validation
    - Implement seasonal inventory adjustments with pricing rules
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [ ] 13.2 Implement Urdu localization
    - Implement Urdu localization for inventory forms
    - Implement RTL layout support
    - _Requirements: 8.5_
  
  - [ ] 13.3 Implement mobile-first interfaces
    - Implement mobile-first batch scanning with camera access
    - Implement mobile stock transfer interface with offline support
    - Implement mobile-responsive product list with swipe gestures
    - _Requirements: 8.6, 8.7, 8.8_
  
  - [ ] 13.4 Implement navigation simplification
    - Implement UnifiedActionPanel with tabs for batch, serial, variant, adjustment
    - Implement keyboard shortcuts (Alt+B, Alt+S, Alt+A, Alt+T)
    - Implement ProductEntryHub with Quick, Standard, Excel, Template modes
    - Reduce clicks from 3+ to 1-2 for common actions
    - _Requirements: 8.9, 8.10, 8.11, 8.12_
  
  - [ ] 13.5 Refactor large inventory components
    - Refactor BatchTrackingManager from 638 lines to <300 lines
    - Refactor InventoryManager from 1500+ lines to <300 lines per sub-component
    - Refactor ProductForm from 800+ lines to <300 lines
    - Extract business logic into custom hooks
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6, 6.8_

- [ ] 14. Checkpoint - Verify missing implementations complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Comprehensive testing and quality assurance
  - [ ]* 15.1 Achieve minimum 80% code coverage
    - Write unit tests for all shared components
    - Write unit tests for all extracted widgets
    - Write unit tests for all utility functions
    - Write integration tests for dashboard-inventory integration
    - Write end-to-end tests for critical user flows
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.9_
  
  - [ ]* 15.2 Write remaining property-based tests
    - Ensure all 26 correctness properties have property tests
    - Run all property tests with minimum 100 iterations
    - Tag all property tests with feature and property references
    - _Requirements: 21.6, 21.7, 21.8_
  
  - [ ]* 15.3 Perform accessibility audit
    - Test keyboard navigation for all interactive elements
    - Test screen reader compatibility with ARIA labels
    - Verify color contrast ratios
    - Test focus indicators
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.10_
  
  - [ ]* 15.4 Perform performance audit
    - Verify dashboard load time <2 seconds
    - Verify widget load time <1 second
    - Verify inventory product list load time <2 seconds for 10,000 products
    - Verify stock adjustment operations <1 second
    - Verify cache hit rate >70%
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.8, 20.10_
  
  - [ ] 15.5 Verify code quality metrics
    - Verify code duplication rate <10%
    - Verify duplicate utility code <50 lines
    - Verify 0 components >300 lines
    - Verify average component size <250 lines
    - Verify 0% mock data usage
    - _Requirements: 24.1, 24.2, 24.8, 24.9, 1.9, 3.12_

- [ ] 16. Migration and deployment preparation
  - [ ] 16.1 Create migration scripts
    - Create script to migrate existing dashboard layouts to new format
    - Create script to migrate user preferences
    - Create script to convert existing data
    - _Requirements: 23.4, 23.5_
  
  - [ ] 16.2 Implement feature flags for gradual rollout
    - Implement feature flags for new dashboard features
    - Implement feature flags for new inventory features
    - Support both old and new interfaces during transition
    - _Requirements: 23.1, 23.10_
  
  - [ ] 16.3 Implement backward compatibility
    - Maintain all existing dashboard routes during migration
    - Maintain all existing inventory API endpoints during migration
    - Provide rollback mechanism for critical issues
    - _Requirements: 23.2, 23.3, 23.6_
  
  - [ ] 16.4 Implement migration logging and documentation
    - Log all migration activities for audit
    - Notify users of changes to their experience
    - Provide documentation for migration process
    - _Requirements: 23.7, 23.8, 23.9_
  
  - [ ] 16.5 Write comprehensive documentation
    - Write architecture documentation explaining consolidation decisions
    - Write API documentation for shared utilities and services
    - Write component documentation with usage examples
    - Write widget development guide
    - Write integration guide for dashboard-inventory connections
    - Write migration guide for upgrading existing installations
    - Write troubleshooting guide for common issues
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6, 25.7, 25.8_

- [ ] 17. Final checkpoint and deployment
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties (26 properties total)
- Unit tests validate specific examples and edge cases
- Integration tests validate dashboard-inventory integration points
- The implementation follows 11 phases over 18 weeks as defined in the design
- All widgets must fetch real data from APIs (0% mock data target)
- All components must be <300 lines (component size reduction target)
- Code duplication must be <10% (from 25-30% current)
- Dashboard-inventory integration must have 10+ touchpoints (from 2 current)
