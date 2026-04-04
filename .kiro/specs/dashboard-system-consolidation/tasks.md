# Implementation Plan: Dashboard System Consolidation & Enterprise Integration

## Overview

This implementation plan consolidates two separate dashboard systems (DashboardTab.tsx and EnhancedDashboard.jsx) into a unified, enterprise-grade architecture. The plan follows a 5-phase migration strategy over 10 weeks, reducing code duplication by 60% while maintaining all existing functionality and ensuring zero downtime.

**Key Deliverables**:
- Shared component library (DashboardStatsGrid, DashboardLoadingSkeleton, RevenueChartSection, useDashboardMetrics)
- Integrated RoleBasedDashboardController with permission filtering
- Migrated domain templates using shared components
- Comprehensive test coverage (46 property-based tests + unit tests)
- Feature flag-based gradual rollout

**Migration Timeline**: 10 weeks (5 phases)
**Code Reduction Target**: 60%+ duplication elimination
**Performance Target**: <2s dashboard load, <1s widget load

## Tasks

## Phase 1: Component Extraction (Week 1-2)

- [ ] 1. Create shared component library structure
  - Create `components/dashboard/common/` directory
  - Set up component exports in index file
  - Configure Storybook for component documentation
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [ ] 2. Implement DashboardStatsGrid shared component
  - [ ] 2.1 Create DashboardStatsGrid component with TypeScript interface
    - Implement StatCard interface with id, label, value, change, trend, icon, target, unit
    - Implement responsive grid layout with configurable columns (2, 3, 4)
    - Add domain color theming support
    - Implement click handlers for stat cards
    - Add progress bars for target tracking
    - Add trend indicators (up/down/neutral)
    - _Requirements: 2.1, 2.2, 2.9_

  - [ ]* 2.2 Write unit tests for DashboardStatsGrid
    - Test rendering with various stat configurations
    - Test click handler invocation
    - Test responsive column layouts
    - Test progress bar calculations
    - _Requirements: 2.1, 2.2, 19.1_

  - [ ]* 2.3 Write property test for DashboardStatsGrid
    - **Property 3: Stats Grid Rendering**
    - **Validates: Requirements 2.1, 2.2**
    - Test that any valid stats array renders correct number of cards

  - [ ] 2.4 Create Storybook stories for DashboardStatsGrid
    - Create stories for different stat configurations
    - Create stories for different color themes
    - Create stories for responsive layouts
    - _Requirements: 2.1, 2.2_

- [ ] 3. Implement DashboardLoadingSkeleton shared component
  - [ ] 3.1 Create DashboardLoadingSkeleton component
    - Implement configurable skeleton card count
    - Support showChart, showWidgets, layout props
    - Match dashboard layout structure
    - Add smooth loading animations
    - _Requirements: 2.3, 2.4_

  - [ ]* 3.2 Write unit tests for DashboardLoadingSkeleton
    - Test rendering with different card counts
    - Test grid vs list layouts
    - Test chart and widget visibility
    - _Requirements: 2.4, 19.1_

  - [ ]* 3.3 Write property test for DashboardLoadingSkeleton
    - **Property 4: Loading Skeleton Configuration**
    - **Validates: Requirements 2.4**
    - Test that any valid card count renders exactly that many skeletons

  - [ ] 3.4 Create Storybook stories for DashboardLoadingSkeleton
    - Create stories for different card counts
    - Create stories for different layouts
    - _Requirements: 2.3, 2.4_

- [ ] 4. Implement useDashboardMetrics hook
  - [ ] 4.1 Create useDashboardMetrics hook with React Query
    - Implement DashboardMetrics TypeScript interface
    - Set up React Query with 5-minute cache TTL
    - Call getDashboardMetricsAction server action
    - Return metrics, loading, error, refetch
    - Handle businessId changes with automatic refetch
    - _Requirements: 2.5, 2.6, 11.4, 11.5_

  - [ ]* 4.2 Write unit tests for useDashboardMetrics hook
    - Test successful data fetching
    - Test loading states
    - Test error handling
    - Test refetch functionality
    - Test businessId change behavior
    - _Requirements: 2.6, 19.1_

  - [ ]* 4.3 Write property test for useDashboardMetrics hook
    - **Property 5: Dashboard Metrics Hook Contract**
    - **Validates: Requirements 2.5, 2.6**
    - Test that any valid businessId returns object with metrics, loading, error, refetch

- [ ] 5. Implement RevenueChartSection shared component
  - [ ] 5.1 Create RevenueChartSection component
    - Implement ChartDataPoint interface
    - Create revenue area chart with Recharts
    - Add time range selector (7d, 30d, 90d, 1y)
    - Implement data export functionality
    - Apply domain color theming
    - Show revenue vs expenses comparison
    - _Requirements: 2.7, 2.8_

  - [ ]* 5.2 Write unit tests for RevenueChartSection
    - Test chart rendering with data
    - Test time range selection
    - Test export functionality
    - Test color theming
    - _Requirements: 2.8, 19.1_

  - [ ]* 5.3 Write property test for RevenueChartSection
    - **Property 6: Chart Time Range Support**
    - **Validates: Requirements 2.8**
    - Test that any valid time range triggers onTimeRangeChange handler

  - [ ] 5.4 Create Storybook stories for RevenueChartSection
    - Create stories for different time ranges
    - Create stories for different data sets
    - Create stories for different color themes
    - _Requirements: 2.7, 2.8_

- [ ] 6. Checkpoint - Verify shared components
  - Ensure all shared components render correctly in Storybook
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Ask the user if questions arise

## Phase 2: Controller Integration (Week 3-4)

- [x] 7. Set up feature flag infrastructure
  - Add NEXT_PUBLIC_ENABLE_UNIFIED_DASHBOARD environment variable
  - Create feature flag configuration in lib/config/featureFlags.js
  - Add feature flag check utility function
  - Document feature flag usage
  - _Requirements: 20.1_

- [ ] 8. Update DashboardTab to accept user context
  - [ ] 8.1 Update DashboardTab TypeScript interface
    - Add user prop with User interface (id, role, permissions)
    - Add dateRange, currency, onQuickAction props
    - Update component to pass user context to children
    - _Requirements: 1.1, 5.6_

  - [ ]* 8.2 Write unit tests for DashboardTab user context
    - Test user prop is passed correctly
    - Test role detection
    - Test permission context
    - _Requirements: 5.6, 19.2_

- [x] 9. Integrate RoleBasedDashboardController into DashboardTab
  - [x] 9.1 Update DashboardTab to render RoleBasedDashboardController
    - Wrap RoleBasedDashboardController in feature flag check
    - Pass businessId, category, user, onQuickAction props
    - Maintain backward compatibility with old system
    - _Requirements: 1.1, 3.1, 5.6, 5.7_

  - [x] 9.2 Implement role detection logic in RoleBasedDashboardController
    - Detect user role from user.role field
    - Map roles to permission sets
    - Create hasPermission() function for widget filtering
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 9.3 Implement permission-based widget filtering
    - Filter widgets based on user permissions
    - Hide widgets without required permissions
    - Pass hasPermission function to child components
    - _Requirements: 3.7, 3.8, 8.3_

  - [ ]* 9.4 Write unit tests for RoleBasedDashboardController
    - Test role detection for all roles (owner, manager, sales, inventory, accountant)
    - Test permission filtering logic
    - Test hasPermission function
    - _Requirements: 3.1, 3.7, 19.2_

  - [ ]* 9.5 Write property test for permission-based widget filtering
    - **Property 7: Permission-Based Widget Filtering**
    - **Validates: Requirements 3.7, 3.8, 8.3**
    - Test that any role without widget permission does not render that widget

- [ ] 10. Implement DashboardTemplateSelector
  - [ ] 10.1 Create DashboardTemplateSelector component
    - Map business category to template type
    - Load domain knowledge using getDomainKnowledge
    - Lazy load appropriate template component
    - Pass role, permissions, hasPermission to template
    - Support forceTemplate prop for testing
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.8, 7.1, 7.2_

  - [ ]* 10.2 Write unit tests for DashboardTemplateSelector
    - Test pharmacy category loads PharmacyDashboard
    - Test textile category loads TextileDashboard
    - Test electronics category loads ElectronicsDashboard
    - Test garments category loads GarmentsDashboard
    - Test retail category loads RetailDashboard
    - Test fallback to EnhancedDashboard for unknown categories
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 19.2_

  - [ ]* 10.3 Write property test for domain detection
    - **Property 9: Domain Detection**
    - **Validates: Requirements 4.6, 7.1, 7.2**
    - Test that any business with category field loads correct domain knowledge

  - [ ]* 10.4 Write property test for template selection
    - **Property 12: Template Selection**
    - **Validates: Requirements 5.8**
    - Test that any valid domain-role combination renders correct template

- [ ] 11. Update routing to pass user context
  - Update app/business/[category]/page.js to fetch user data
  - Pass user object to DashboardTab component
  - Ensure user permissions are loaded
  - _Requirements: 5.4, 5.6_

- [ ] 12. Implement domain-role widget merging
  - [ ] 12.1 Create widget merging logic
    - Merge domain-specific widgets with role-specific widgets
    - Prioritize domain-specific widgets in layout
    - Remove duplicate widgets
    - _Requirements: 4.7, 4.8_

  - [ ]* 12.2 Write property test for domain-role widget merging
    - **Property 10: Domain-Role Widget Merging**
    - **Validates: Requirements 4.7**
    - Test that any domain-role combination includes widgets from both sets

  - [ ]* 12.3 Write property test for domain widget prioritization
    - **Property 11: Domain Widget Prioritization**
    - **Validates: Requirements 4.8**
    - Test that domain-specific widgets appear before generic widgets

- [ ] 13. Checkpoint - Test controller integration
  - Enable feature flag in development environment
  - Test role-based template selection for all roles
  - Test permission filtering for all widget types
  - Test domain template selection for all domains
  - Ensure all tests pass
  - Ask the user if questions arise

## Phase 3: Template Migration (Week 5-6)

- [ ] 14. Migrate PharmacyDashboard template
  - [ ] 14.1 Update PharmacyDashboard to use shared components
    - Replace duplicate stats grid with DashboardStatsGrid
    - Replace duplicate loading skeleton with DashboardLoadingSkeleton
    - Replace duplicate metrics fetching with useDashboardMetrics hook
    - Replace duplicate revenue chart with RevenueChartSection
    - Remove duplicate code
    - _Requirements: 2.1, 2.3, 2.5, 2.7, 2.10, 4.1_

  - [ ]* 14.2 Write unit tests for migrated PharmacyDashboard
    - Test rendering with pharmacy-specific widgets
    - Test drug expiry calendar widget
    - Test FBR compliance widget
    - _Requirements: 4.1, 19.1_

- [ ] 15. Migrate TextileDashboard template
  - [ ] 15.1 Update TextileDashboard to use shared components
    - Replace duplicate stats grid with DashboardStatsGrid
    - Replace duplicate loading skeleton with DashboardLoadingSkeleton
    - Replace duplicate metrics fetching with useDashboardMetrics hook
    - Replace duplicate revenue chart with RevenueChartSection
    - Remove duplicate code
    - _Requirements: 2.1, 2.3, 2.5, 2.7, 2.10, 4.2_

  - [ ]* 15.2 Write unit tests for migrated TextileDashboard
    - Test rendering with textile-specific widgets
    - Test roll/bale inventory widget
    - Test fabric type distribution widget
    - _Requirements: 4.2, 19.1_

- [ ] 16. Migrate ElectronicsDashboard template
  - [ ] 16.1 Update ElectronicsDashboard to use shared components
    - Replace duplicate stats grid with DashboardStatsGrid
    - Replace duplicate loading skeleton with DashboardLoadingSkeleton
    - Replace duplicate metrics fetching with useDashboardMetrics hook
    - Replace duplicate revenue chart with RevenueChartSection
    - Remove duplicate code
    - _Requirements: 2.1, 2.3, 2.5, 2.7, 2.10, 4.3_

  - [ ]* 16.2 Write unit tests for migrated ElectronicsDashboard
    - Test rendering with electronics-specific widgets
    - Test serial tracking widget
    - Test warranty management widget
    - _Requirements: 4.3, 19.1_

- [ ] 17. Migrate GarmentsDashboard template
  - [ ] 17.1 Update GarmentsDashboard to use shared components
    - Replace duplicate stats grid with DashboardStatsGrid
    - Replace duplicate loading skeleton with DashboardLoadingSkeleton
    - Replace duplicate metrics fetching with useDashboardMetrics hook
    - Replace duplicate revenue chart with RevenueChartSection
    - Remove duplicate code
    - _Requirements: 2.1, 2.3, 2.5, 2.7, 2.10, 4.4_

  - [ ]* 17.2 Write unit tests for migrated GarmentsDashboard
    - Test rendering with garments-specific widgets
    - Test size-color matrix widget
    - Test seasonal collections widget
    - _Requirements: 4.4, 19.1_

- [ ] 18. Migrate RetailDashboard template
  - [ ] 18.1 Update RetailDashboard to use shared components
    - Replace duplicate stats grid with DashboardStatsGrid
    - Replace duplicate loading skeleton with DashboardLoadingSkeleton
    - Replace duplicate metrics fetching with useDashboardMetrics hook
    - Replace duplicate revenue chart with RevenueChartSection
    - Remove duplicate code
    - _Requirements: 2.1, 2.3, 2.5, 2.7, 2.10, 4.5_

  - [ ]* 18.2 Write unit tests for migrated RetailDashboard
    - Test rendering with retail-specific widgets
    - Test category performance widget
    - Test fast-moving items widget
    - _Requirements: 4.5, 19.1_

- [ ] 19. Migrate role-based templates
  - [ ] 19.1 Update OwnerDashboard to use shared components
    - Replace duplicate components with shared components
    - Ensure full system access widgets are included
    - _Requirements: 2.10, 3.2_

  - [ ] 19.2 Update ManagerDashboard to use shared components
    - Replace duplicate components with shared components
    - Ensure approval queue prominence
    - _Requirements: 2.10, 3.3_

  - [ ] 19.3 Update SalesDashboard to use shared components
    - Replace duplicate components with shared components
    - Ensure quick invoice creation widget
    - _Requirements: 2.10, 3.4_

  - [ ] 19.4 Update InventoryDashboard to use shared components
    - Replace duplicate components with shared components
    - Ensure stock management focus
    - _Requirements: 2.10, 3.5_

  - [ ] 19.5 Update AccountantDashboard to use shared components
    - Replace duplicate components with shared components
    - Ensure financial metrics prominence
    - _Requirements: 2.10, 3.6_

- [ ] 20. Implement domain knowledge feature flags
  - [ ] 20.1 Add batch tracking widget conditional rendering
    - Check domain knowledge batchTrackingEnabled flag
    - Show/hide batch-related widgets based on flag
    - _Requirements: 7.3_

  - [ ] 20.2 Add serial tracking widget conditional rendering
    - Check domain knowledge serialTrackingEnabled flag
    - Show/hide serial-related widgets based on flag
    - _Requirements: 7.4_

  - [ ] 20.3 Add multi-location widget conditional rendering
    - Check domain knowledge multiLocationEnabled flag
    - Show/hide warehouse distribution widgets based on flag
    - _Requirements: 7.5_

  - [ ]* 20.4 Write property test for domain knowledge feature flags
    - **Property 15: Domain Knowledge Feature Flags**
    - **Validates: Requirements 7.3, 7.4, 7.5**
    - Test that feature flags control widget visibility

  - [ ]* 20.5 Write property test for domain feature isolation
    - **Property 16: Domain Feature Isolation**
    - **Validates: Requirements 7.7**
    - Test that domain-specific features don't appear in other domains

- [ ] 21. Verify code duplication reduction
  - Run code analysis to measure duplication
  - Ensure 60%+ reduction in duplicate code
  - Document code reduction metrics
  - _Requirements: 2.10_

- [ ] 22. Checkpoint - Verify template migration
  - Test all migrated templates render correctly
  - Test all domain-specific widgets work
  - Test all role-specific widgets work
  - Ensure all tests pass
  - Verify 60%+ code reduction achieved
  - Ask the user if questions arise

## Phase 4: Full Rollout (Week 7-8)

- [ ] 23. Implement Widget Registry
  - [ ] 23.1 Create widgetRegistry.js with all widget definitions
    - Define WidgetDefinition TypeScript interface
    - Register all 25+ widgets with metadata
    - Include id, name, category, requiredPermissions, sizes
    - Include domain and role filters
    - _Requirements: 8.1, 8.2, 8.6, 8.7_

  - [ ]* 23.2 Write unit tests for Widget Registry
    - Test getWidget function
    - Test getWidgetsByCategory function
    - Test getWidgetsByPermission function
    - Test registerWidget function
    - _Requirements: 8.1, 8.2, 19.1_

  - [ ]* 23.3 Write property test for widget registry metadata
    - **Property 17: Widget Registry Metadata**
    - **Validates: Requirements 8.2, 8.7**
    - Test that any widget has all required metadata fields

- [ ] 24. Implement layout persistence
  - [ ] 24.1 Create dashboard_layouts database table
    - Create table with user_id, business_id, layout_name, widgets, timestamps
    - Add unique constraint on (user_id, business_id, layout_name)
    - Add is_default boolean field
    - Implement RLS policy for multi-tenant isolation
    - _Requirements: 9.1, 9.2, 6.2_

  - [ ] 24.2 Implement saveDashboardLayoutAction server action
    - Validate user has access to business
    - Validate widget configurations
    - Upsert dashboard_layouts record
    - Handle is_default flag (unset other defaults)
    - Return layout ID
    - _Requirements: 9.3, 9.6_

  - [ ] 24.3 Implement getDashboardLayoutAction server action
    - Fetch layout by name or default layout
    - Fall back to template default if no saved layout
    - Return layout configuration
    - _Requirements: 9.4, 9.7_

  - [ ]* 24.4 Write unit tests for layout persistence actions
    - Test save layout success
    - Test save layout validation
    - Test get layout by name
    - Test get default layout
    - Test fallback to template default
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 19.1_

  - [ ]* 24.5 Write property test for layout persistence round-trip
    - **Property 8: Layout Persistence Round-Trip**
    - **Validates: Requirements 3.9, 9.3, 9.4**
    - Test that any saved layout can be loaded with same configuration

  - [ ]* 24.6 Write property test for multiple layout presets
    - **Property 19: Multiple Layout Presets**
    - **Validates: Requirements 9.5, 9.6**
    - Test that user can save multiple layouts with at most one default

- [ ] 25. Implement multi-tenant isolation
  - [ ] 25.1 Add business_id filtering to all data queries
    - Update getDashboardMetricsAction to filter by business_id
    - Update all widget data queries to filter by business_id
    - Validate business_id on every request
    - _Requirements: 6.1, 6.6_

  - [ ] 25.2 Implement business context switching
    - Clear cached data when business_id changes
    - Reload all widgets with new business_id
    - Update useDashboardMetrics to handle business switching
    - _Requirements: 6.3, 6.7_

  - [ ]* 25.3 Write unit tests for multi-tenant isolation
    - Test business_id filtering in queries
    - Test cache clearing on business switch
    - Test RLS policy enforcement
    - _Requirements: 6.1, 6.2, 6.3, 19.1_

  - [ ]* 25.4 Write property test for multi-tenant data isolation
    - **Property 13: Multi-Tenant Data Isolation**
    - **Validates: Requirements 6.1, 6.4, 6.6**
    - Test that any data query includes business_id filter

  - [ ]* 25.5 Write property test for business context switching
    - **Property 14: Business Context Switching**
    - **Validates: Requirements 6.3, 6.7, 12.3**
    - Test that business switch clears cache and refetches with new business_id

- [ ] 26. Implement inventory metrics integration
  - [ ] 26.1 Create inventory valuation calculation functions
    - Implement FIFO costing method
    - Implement LIFO costing method
    - Implement WAC (Weighted Average Cost) costing method
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 26.2 Create batch expiry alert logic
    - Filter batches expiring within 90 days
    - Classify severity (critical <30d, warning 30-90d, normal >90d)
    - _Requirements: 10.5, 10.6_

  - [ ] 26.3 Create low stock alert logic
    - Filter products where current stock < minimum stock level
    - _Requirements: 10.10_

  - [ ]* 26.4 Write unit tests for inventory calculations
    - Test FIFO calculation with sample data
    - Test LIFO calculation with sample data
    - Test WAC calculation with sample data
    - Test batch expiry filtering
    - Test batch severity classification
    - Test low stock filtering
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.10, 19.1_

  - [ ]* 26.5 Write property test for inventory costing calculations
    - **Property 20: Inventory Costing Calculations**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
    - Test that any costing method correctly applies its algorithm

  - [ ]* 26.6 Write property test for batch expiry alerts
    - **Property 21: Batch Expiry Alerts**
    - **Validates: Requirements 10.5**
    - Test that any batch expiring within 90 days appears in alerts

  - [ ]* 26.7 Write property test for batch expiry severity
    - **Property 22: Batch Expiry Severity Classification**
    - **Validates: Requirements 10.6**
    - Test that any batch is classified with correct severity

  - [ ]* 26.8 Write property test for low stock alerts
    - **Property 23: Low Stock Alerts**
    - **Validates: Requirements 10.10**
    - Test that any product below minimum stock appears in alerts

- [ ] 27. Implement performance optimizations
  - [ ] 27.1 Set up React Query caching
    - Configure 5-minute staleTime
    - Configure 10-minute cacheTime
    - Disable refetchOnWindowFocus
    - _Requirements: 11.4, 11.5_

  - [ ] 27.2 Implement incremental widget loading
    - Use Intersection Observer for below-fold widgets
    - Defer data fetching until widget is visible
    - _Requirements: 11.6_

  - [ ] 27.3 Add React.memo to widget components
    - Memoize all widget components
    - Optimize re-render performance
    - _Requirements: 11.8_

  - [ ] 27.4 Implement code splitting for templates
    - Lazy load all dashboard templates
    - Lazy load widget components
    - _Requirements: 11.1, 11.2_

  - [ ]* 27.5 Write performance tests
    - Test dashboard load time <2 seconds
    - Test widget load time <1 second
    - Test refresh time <3 seconds
    - _Requirements: 11.1, 11.2, 11.3, 19.8_

  - [ ]* 27.6 Write property test for dashboard load performance
    - **Property 24: Dashboard Load Performance**
    - **Validates: Requirements 11.1, 11.2**
    - Test that dashboard loads within 2s and widgets within 1s

  - [ ]* 27.7 Write property test for metrics caching
    - **Property 25: Metrics Caching**
    - **Validates: Requirements 11.4**
    - Test that valid cached data is returned without database query

  - [ ]* 27.8 Write property test for incremental widget loading
    - **Property 26: Incremental Widget Loading**
    - **Validates: Requirements 11.6**
    - Test that below-fold widgets don't fetch until visible

  - [ ]* 27.9 Write property test for loading state display
    - **Property 27: Loading State Display**
    - **Validates: Requirements 11.7**
    - Test that loading widgets show skeleton

- [ ] 28. Implement header integration
  - [ ] 28.1 Create business switcher component
    - Fetch all businesses user has access to
    - Display business list in dropdown
    - Handle business selection and context switch
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ] 28.2 Create quick actions menu
    - Add shortcuts for common actions (create invoice, add product, view reports)
    - _Requirements: 12.4_

  - [ ] 28.3 Create notifications menu
    - Display recent notifications
    - Sort by priority
    - _Requirements: 12.5_

  - [ ] 28.4 Create user menu
    - Display user profile, settings, logout options
    - _Requirements: 12.6_

  - [ ] 28.5 Make header fixed and responsive
    - Fix header at top during scrolling
    - Adapt to mobile screen sizes
    - _Requirements: 12.7, 12.8_

  - [ ]* 28.6 Write unit tests for header components
    - Test business switcher displays all accessible businesses
    - Test business switching functionality
    - Test quick actions menu
    - Test notifications sorting
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 19.1_

  - [ ]* 28.7 Write property test for business switcher content
    - **Property 28: Business Switcher Content**
    - **Validates: Requirements 12.2**
    - Test that business switcher shows all and only accessible businesses

  - [ ]* 28.8 Write property test for notification priority sorting
    - **Property 29: Notification Priority Sorting**
    - **Validates: Requirements 12.5**
    - Test that notifications are sorted by priority

- [ ] 29. Implement responsive design
  - [ ] 29.1 Add responsive grid layout
    - Support screen widths 320px to 2560px
    - Switch to mobile layout below 768px (stacked widgets)
    - Adapt grid columns (1 mobile, 2 tablet, 4 desktop)
    - _Requirements: 13.1, 13.2, 13.4_

  - [ ] 29.2 Add touch-optimized controls
    - Ensure minimum 44px touch targets on mobile
    - Add swipe gestures for navigation
    - _Requirements: 13.3, 13.6_

  - [ ] 29.3 Optimize mobile performance
    - Hide non-essential widgets on mobile
    - Optimize font sizes for small screens
    - _Requirements: 13.5, 13.7_

  - [ ]* 29.4 Write unit tests for responsive design
    - Test mobile layout rendering
    - Test tablet layout rendering
    - Test desktop layout rendering
    - Test touch target sizes
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 19.1_

- [ ] 30. Implement error handling
  - [ ] 30.1 Add widget-level error handling
    - Display error state with retry button
    - Implement exponential backoff (1s, 2s, 4s, 8s)
    - Stop after 3 retry attempts
    - Fall back to cached data if available
    - Log errors to monitoring system
    - _Requirements: 14.1, 14.4, 14.5, 14.6, 14.7_

  - [ ] 30.2 Add dashboard-level error handling
    - Display global error banner for critical errors
    - Provide recovery actions (refresh, switch business, contact support)
    - Maintain partial functionality when possible
    - _Requirements: 14.2, 14.8_

  - [ ] 30.3 Add network error handling
    - Display connection status indicator
    - Show offline notification after 30 seconds
    - _Requirements: 14.2_

  - [ ]* 30.4 Write unit tests for error handling
    - Test widget error state display
    - Test retry button functionality
    - Test exponential backoff timing
    - Test cached data fallback
    - Test error logging
    - Test network error handling
    - _Requirements: 14.1, 14.2, 14.4, 14.5, 14.6, 19.1_

  - [ ]* 30.5 Write property test for widget error handling
    - **Property 30: Widget Error Handling**
    - **Validates: Requirements 14.1**
    - Test that any failed widget shows error state with retry button

  - [ ]* 30.6 Write property test for error logging
    - **Property 31: Error Logging**
    - **Validates: Requirements 14.4**
    - Test that any error is logged with appropriate context

  - [ ]* 30.7 Write property test for cached data fallback
    - **Property 32: Cached Data Fallback**
    - **Validates: Requirements 14.5**
    - Test that failed fetch with valid cache shows cached data

  - [ ]* 30.8 Write property test for exponential backoff retry
    - **Property 33: Exponential Backoff Retry**
    - **Validates: Requirements 14.6**
    - Test that retries follow exponential backoff timing

- [ ] 31. Implement data consistency
  - [ ] 31.1 Centralize data fetching in getDashboardMetricsAction
    - Ensure all widgets use same data snapshot
    - Add timestamps to all metrics
    - _Requirements: 15.1, 15.2, 15.7_

  - [ ] 31.2 Add data validation
    - Validate data against expected schema
    - Display error for invalid data
    - Log validation failures
    - _Requirements: 15.4, 15.5_

  - [ ] 31.3 Implement consistent number formatting
    - Use business currency settings for all numbers
    - Ensure consistent decimal places and separators
    - _Requirements: 15.6_

  - [ ]* 31.4 Write unit tests for data consistency
    - Test centralized data fetching
    - Test data validation
    - Test number formatting consistency
    - Test timestamp display
    - _Requirements: 15.1, 15.2, 15.4, 15.6, 15.7, 19.1_

  - [ ]* 31.5 Write property test for data timestamp consistency
    - **Property 34: Data Timestamp Consistency**
    - **Validates: Requirements 15.2, 15.3**
    - Test that all widgets show data from same time snapshot

  - [ ]* 31.6 Write property test for data validation
    - **Property 35: Data Validation**
    - **Validates: Requirements 15.4**
    - Test that invalid data triggers error state

  - [ ]* 31.7 Write property test for number formatting consistency
    - **Property 36: Number Formatting Consistency**
    - **Validates: Requirements 15.6**
    - Test that numeric values use consistent formatting

  - [ ]* 31.8 Write property test for metric timestamps
    - **Property 37: Metric Timestamps**
    - **Validates: Requirements 15.7**
    - Test that any metric displays timestamp

- [ ] 32. Implement widget customization
  - [ ] 32.1 Add drag-and-drop widget arrangement
    - Integrate react-grid-layout
    - Show visual preview during drag
    - Save layout on drop
    - _Requirements: 16.1, 16.5, 16.6_

  - [ ] 32.2 Add widget library panel
    - Display all available widgets from Widget Registry
    - Filter by user permissions and domain
    - Allow adding widgets to dashboard
    - _Requirements: 16.2, 16.7, 16.8_

  - [ ] 32.3 Add widget removal functionality
    - Allow users to remove widgets from dashboard
    - _Requirements: 16.3_

  - [ ] 32.4 Add widget resize functionality
    - Allow users to resize widgets
    - Enforce min/max size constraints
    - _Requirements: 16.4_

  - [ ]* 32.5 Write unit tests for widget customization
    - Test drag-and-drop functionality
    - Test widget addition
    - Test widget removal
    - Test widget resizing
    - Test layout auto-save
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 19.1_

  - [ ]* 32.6 Write property test for widget addition and removal
    - **Property 38: Widget Addition and Removal**
    - **Validates: Requirements 16.2, 16.3**
    - Test that any permitted widget can be added and removed

  - [ ]* 32.7 Write property test for widget resize constraints
    - **Property 39: Widget Resize Constraints**
    - **Validates: Requirements 16.4**
    - Test that resize is constrained to min/max bounds

  - [ ]* 32.8 Write property test for layout auto-save
    - **Property 40: Layout Auto-Save**
    - **Validates: Requirements 16.6**
    - Test that layout changes are saved within 2 seconds

  - [ ]* 32.9 Write property test for widget library filtering
    - **Property 41: Widget Library Filtering**
    - **Validates: Requirements 16.8**
    - Test that widget library shows only permitted and applicable widgets

- [ ] 33. Implement real-time updates
  - [ ] 33.1 Set up Supabase Realtime WebSocket connection
    - Establish WebSocket connection for dashboard channel
    - Subscribe to metrics_updated, inventory_alert, order_created, payment_received events
    - _Requirements: 17.1, 17.2_

  - [ ] 33.2 Handle real-time updates in widgets
    - Update affected widgets without page reload
    - Display visual indicator during update
    - _Requirements: 17.3, 17.4_

  - [ ] 33.3 Implement WebSocket reconnection logic
    - Attempt automatic reconnection on disconnect
    - Queue updates during disconnection
    - Sync queued updates on reconnection
    - Notify user if offline >30 seconds
    - Fall back to polling if WebSocket unavailable
    - _Requirements: 17.5, 17.6, 17.7, 17.8_

  - [ ]* 33.4 Write unit tests for real-time updates
    - Test WebSocket connection establishment
    - Test event handling
    - Test widget updates without reload
    - Test reconnection logic
    - Test update queuing
    - Test offline notification
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 19.1_

  - [ ]* 33.5 Write property test for real-time update performance
    - **Property 42: Real-Time Update Performance**
    - **Validates: Requirements 17.2**
    - Test that updates are received within 2 seconds

  - [ ]* 33.6 Write property test for real-time update without reload
    - **Property 43: Real-Time Update Without Reload**
    - **Validates: Requirements 17.3**
    - Test that updates don't cause page reload

  - [ ]* 33.7 Write property test for update indicator display
    - **Property 44: Update Indicator Display**
    - **Validates: Requirements 17.4**
    - Test that updating widgets show visual indicator

  - [ ]* 33.8 Write property test for offline update queuing
    - **Property 45: Offline Update Queuing**
    - **Validates: Requirements 17.6**
    - Test that updates are queued during disconnection and synced on reconnection

- [ ] 34. Implement accessibility features
  - [ ] 34.1 Add keyboard navigation
    - Ensure all interactive elements are keyboard accessible
    - Add focus indicators
    - Implement keyboard shortcuts for common actions
    - _Requirements: 18.1, 18.4, 18.5, 18.7_

  - [ ] 34.2 Add screen reader support
    - Add proper ARIA labels to all components
    - Announce dynamic content changes
    - Provide alternative text for icons and images
    - _Requirements: 18.2, 18.6, 18.8_

  - [ ] 34.3 Ensure color contrast compliance
    - Maintain 4.5:1 contrast ratio for text
    - _Requirements: 18.3_

  - [ ]* 34.4 Write accessibility tests
    - Test keyboard navigation
    - Test screen reader compatibility
    - Test color contrast ratios
    - Test focus indicators
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 19.1_

- [ ] 35. Implement backward compatibility routes
  - [ ] 35.1 Maintain all existing dashboard routes
    - Keep legacy route paths active during migration
    - Redirect to unified system when feature flag enabled
    - _Requirements: 1.3, 20.2_

  - [ ]* 35.2 Write property test for route backward compatibility
    - **Property 1: Route Backward Compatibility**
    - **Validates: Requirements 1.3, 1.4, 20.2**
    - Test that any existing route renders successfully

  - [ ]* 35.3 Write property test for widget functionality preservation
    - **Property 2: Widget Functionality Preservation**
    - **Validates: Requirements 1.5**
    - Test that any widget from old systems works in unified system

- [ ] 36. Create migration documentation
  - Document migration process and timeline
  - Create user guide for new dashboard features
  - Document rollback procedures
  - _Requirements: 20.7, 20.8_

- [ ] 37. Set up monitoring and alerting
  - Configure dashboard load time monitoring
  - Configure widget load time monitoring
  - Configure error rate monitoring
  - Set up alerts for performance degradation
  - Set up alerts for error rate spikes
  - _Requirements: 11.1, 11.2, 14.4_

- [ ] 38. Checkpoint - Pre-rollout verification
  - Enable feature flag in staging environment
  - Test all functionality end-to-end
  - Verify all 46 property tests pass
  - Verify all unit tests pass
  - Verify performance requirements met
  - Verify accessibility requirements met
  - Ensure all tests pass
  - Ask the user if questions arise

- [ ] 39. Execute gradual rollout
  - [ ] 39.1 Day 1: Enable for 10% of users
    - Monitor error rates and performance
    - Collect user feedback
    - _Requirements: 20.1_

  - [ ] 39.2 Day 2: Enable for 25% of users
    - Monitor error rates and performance
    - Address any issues from Day 1
    - _Requirements: 20.1_

  - [ ] 39.3 Day 3: Enable for 50% of users
    - Monitor error rates and performance
    - Verify no critical issues
    - _Requirements: 20.1_

  - [ ] 39.4 Day 4: Enable for 75% of users
    - Monitor error rates and performance
    - Prepare for full rollout
    - _Requirements: 20.1_

  - [ ] 39.5 Day 5: Enable for 100% of users
    - Monitor error rates and performance
    - Provide user support
    - _Requirements: 20.1_

- [ ] 40. Checkpoint - Post-rollout verification
  - Verify dashboard load time <2s (95th percentile)
  - Verify widget load time <1s (95th percentile)
  - Verify error rate <0.1%
  - Verify user satisfaction >4.5/5
  - Monitor support ticket volume
  - Ask the user if questions arise

## Phase 5: Cleanup (Week 9-10)

- [ ] 41. Remove legacy code
  - [ ] 41.1 Remove standalone EnhancedDashboard routes
    - Remove legacy route definitions
    - Update all references to use DashboardTab
    - _Requirements: 1.2, 20.2_

  - [ ] 41.2 Remove duplicate code from old system
    - Remove duplicate stats grid implementations
    - Remove duplicate loading skeleton implementations
    - Remove duplicate metrics fetching logic
    - Remove duplicate revenue chart implementations
    - _Requirements: 2.10_

  - [ ] 41.3 Archive old dashboard components
    - Move legacy components to archive directory
    - Document archived components
    - _Requirements: 20.6_

- [ ] 42. Clean up feature flags
  - Remove ENABLE_UNIFIED_DASHBOARD feature flag
  - Remove feature flag checks from code
  - Update configuration files
  - _Requirements: 20.1_

- [ ] 43. Update documentation
  - Update API documentation
  - Update component documentation
  - Update architecture diagrams
  - Update user guides
  - _Requirements: 20.8_

- [ ] 44. Create data migration script
  - [ ] 44.1 Implement layout migration script
    - Migrate existing layouts to new format
    - Map old widget types to new widget types
    - Validate migrated layouts
    - _Requirements: 20.3, 20.4_

  - [ ] 44.2 Run migration script on production data
    - Backup database before migration
    - Run migration script
    - Verify all layouts migrated successfully
    - Test migrated layouts render correctly
    - _Requirements: 20.3, 20.4, 20.6_

  - [ ]* 44.3 Write property test for migration customization preservation
    - **Property 46: Migration Customization Preservation**
    - **Validates: Requirements 20.4**
    - Test that user customizations are preserved after migration

- [ ] 45. Verify code metrics
  - Run code analysis to measure final duplication
  - Verify 60%+ code reduction achieved
  - Verify 80%+ test coverage achieved
  - Document final metrics
  - _Requirements: 2.10, 19.6_

- [ ] 46. Create rollback plan documentation
  - Document rollback procedures
  - Document data restoration procedures
  - Test rollback in staging environment
  - _Requirements: 20.5_

- [ ] 47. Final checkpoint - Consolidation complete
  - Verify all legacy code removed
  - Verify all documentation updated
  - Verify all feature flags cleaned up
  - Verify all tests passing
  - Verify performance requirements met
  - Verify code reduction target achieved
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Property tests validate universal correctness properties (46 total)
- Unit tests validate specific examples and edge cases
- The 5-phase migration ensures zero downtime and gradual rollout
- Feature flags enable safe rollback if issues arise
- All data queries enforce multi-tenant isolation via business_id filtering
- Performance targets: <2s dashboard load, <1s widget load, 60%+ code reduction
- Test coverage target: 80%+ code coverage

## Property-Based Tests Summary

This implementation includes 46 property-based tests covering:
- Route compatibility and widget preservation (Properties 1-2)
- Shared component behavior (Properties 3-6)
- Permission filtering and layout persistence (Properties 7-8)
- Domain detection and template selection (Properties 9-12)
- Multi-tenant isolation (Properties 13-14)
- Domain feature flags and isolation (Properties 15-16)
- Widget registry and constraints (Properties 17-19)
- Inventory calculations and alerts (Properties 20-23)
- Performance and caching (Properties 24-27)
- Header and business switching (Properties 28-29)
- Error handling and recovery (Properties 30-33)
- Data consistency and validation (Properties 34-37)
- Widget customization (Properties 38-41)
- Real-time updates (Properties 42-45)
- Migration preservation (Property 46)

Each property test validates universal correctness across all valid inputs, complementing unit tests that verify specific examples.
