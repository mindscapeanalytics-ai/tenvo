# Requirements Document: Dashboard System Consolidation & Enterprise Integration

## Introduction

This document specifies requirements for consolidating two separate dashboard systems (DashboardTab.tsx and EnhancedDashboard.jsx) into a unified, enterprise-grade dashboard architecture. The consolidation addresses critical issues including 60% code duplication across 11 templates, disabled role-based functionality, poor tab integration, and architectural inconsistencies. The unified system will maintain all existing functionality while providing a single source of truth for dashboard rendering, enabling role-based templates, extracting reusable components, and ensuring perfect multi-tenant/multi-domain isolation.

## Glossary

- **Dashboard_System**: The unified dashboard architecture that consolidates DashboardTab and EnhancedDashboard
- **Widget**: A self-contained UI component that displays specific business metrics or functionality
- **Template**: A pre-configured dashboard layout with specific widgets for a domain or role
- **Domain**: A business category (Pharmacy, Textile, Electronics, Garments, Retail)
- **Role**: A user's permission level (Owner, Manager, Sales, Inventory, Accountant)
- **Business_Context**: The combination of business_id, domain, and user role that determines dashboard configuration
- **Layout_Engine**: The component responsible for rendering widgets in a grid layout
- **Widget_Registry**: The centralized catalog of all available widgets with their metadata
- **RLS_Policy**: Row-Level Security policy that enforces tenant isolation at database level
- **Costing_Method**: Inventory valuation method (FIFO, LIFO, WAC)
- **Multi_Tenant**: Architecture supporting multiple isolated business accounts
- **DashboardTab**: The NetSuite-style dashboard component in the tab navigation system
- **EnhancedDashboard**: The card-based dashboard component with domain/role templates
- **RoleBasedDashboardController**: The controller component that manages role-based dashboard logic
- **DashboardTemplateSelector**: The component that selects appropriate dashboard template based on domain

## Requirements

### Requirement 1: System Consolidation

**User Story:** As a developer, I want a single unified dashboard system, so that I can maintain one codebase instead of two separate implementations.

#### Acceptance Criteria

1. THE Dashboard_System SHALL integrate RoleBasedDashboardController into DashboardTab as the primary rendering mechanism
2. THE Dashboard_System SHALL deprecate standalone EnhancedDashboard usage outside of the tab system
3. THE Dashboard_System SHALL maintain backward compatibility with all existing dashboard routes during migration
4. WHEN a user navigates to any dashboard route, THE Dashboard_System SHALL render through the unified DashboardTab component
5. THE Dashboard_System SHALL preserve all existing widget functionality from both systems
6. THE Dashboard_System SHALL use a single Layout_Engine for all dashboard rendering
7. THE Dashboard_System SHALL maintain the NetSuite-style grid layout as the primary layout system

### Requirement 2: Component Extraction and Reusability

**User Story:** As a developer, I want reusable dashboard components, so that I can eliminate 60% code duplication across templates.

#### Acceptance Criteria

1. THE Dashboard_System SHALL provide a DashboardStatsGrid component that renders stat cards with consistent styling
2. THE DashboardStatsGrid SHALL accept stats data, color configuration, and click handlers as props
3. THE Dashboard_System SHALL provide a DashboardLoadingSkeleton component for loading states
4. THE DashboardLoadingSkeleton SHALL support configurable skeleton card counts
5. THE Dashboard_System SHALL provide a useDashboardMetrics hook for data fetching
6. THE useDashboardMetrics hook SHALL return metrics, loading state, error state, and refetch function
7. THE Dashboard_System SHALL provide a RevenueChartSection component for revenue visualization
8. THE RevenueChartSection SHALL support time range selection and data export
9. WHEN any template uses these shared components, THE Dashboard_System SHALL render identical UI patterns
10. THE Dashboard_System SHALL reduce template code duplication by at least 60% compared to the current implementation

### Requirement 3: Role-Based Dashboard Activation

**User Story:** As a user, I want to see a dashboard tailored to my role, so that I can focus on relevant metrics and actions.

#### Acceptance Criteria

1. THE Dashboard_System SHALL enable role-based template selection by default
2. WHEN a user with Owner role accesses the dashboard, THE Dashboard_System SHALL display the Owner template with full system access
3. WHEN a user with Manager role accesses the dashboard, THE Dashboard_System SHALL display the Manager template with approval queue prominence
4. WHEN a user with Sales role accesses the dashboard, THE Dashboard_System SHALL display the Sales template with quick invoice creation
5. WHEN a user with Inventory role accesses the dashboard, THE Dashboard_System SHALL display the Inventory template with stock management focus
6. WHEN a user with Accountant role accesses the dashboard, THE Dashboard_System SHALL display the Accountant template with financial metrics
7. THE Dashboard_System SHALL filter widgets based on role permissions
8. IF a user attempts to access a widget without required permissions, THEN THE Dashboard_System SHALL hide the widget from the layout
9. THE Dashboard_System SHALL persist role-based layout customizations per user

### Requirement 4: Domain-Specific Dashboard Templates

**User Story:** As a business owner, I want a dashboard specific to my industry, so that I see metrics relevant to my business type.

#### Acceptance Criteria

1. WHEN a business has category "Pharmacy", THE Dashboard_System SHALL display Pharmacy-specific widgets including drug expiry calendar and FBR compliance
2. WHEN a business has category "Textile", THE Dashboard_System SHALL display Textile-specific widgets including roll/bale inventory and fabric type distribution
3. WHEN a business has category "Electronics", THE Dashboard_System SHALL display Electronics-specific widgets including serial tracking and warranty management
4. WHEN a business has category "Garments", THE Dashboard_System SHALL display Garments-specific widgets including size-color matrix and seasonal collections
5. WHEN a business has category "Retail", THE Dashboard_System SHALL display Retail-specific widgets including category performance and fast-moving items
6. THE Dashboard_System SHALL automatically detect business domain from business.category field
7. THE Dashboard_System SHALL merge domain-specific widgets with role-based widgets when both apply
8. THE Dashboard_System SHALL prioritize domain-specific widgets over generic widgets in layout

### Requirement 5: Tab Integration

**User Story:** As a user, I want seamless dashboard integration with the tab system, so that I have consistent navigation across the application.

#### Acceptance Criteria

1. THE Dashboard_System SHALL render all dashboards within the DashboardTab component
2. THE DashboardTab SHALL provide consistent header, navigation, and layout structure
3. WHEN a user switches between tabs, THE Dashboard_System SHALL maintain dashboard state
4. THE Dashboard_System SHALL provide a single routing path to dashboards through the tab system
5. THE Dashboard_System SHALL eliminate duplicate routing paths to dashboard functionality
6. THE DashboardTab SHALL pass Business_Context to RoleBasedDashboardController
7. THE RoleBasedDashboardController SHALL pass template selection to DashboardTemplateSelector
8. THE DashboardTemplateSelector SHALL render the appropriate template based on domain and role

### Requirement 6: Multi-Tenant Isolation

**User Story:** As a business owner, I want to see only my business data, so that my information remains private and secure.

#### Acceptance Criteria

1. THE Dashboard_System SHALL filter all data queries by business_id
2. THE Dashboard_System SHALL enforce RLS_Policy at the database level for all dashboard queries
3. WHEN a user switches businesses, THE Dashboard_System SHALL reload all widgets with the new business_id
4. THE Dashboard_System SHALL prevent cross-tenant data leakage in all widget components
5. IF a widget query fails RLS_Policy validation, THEN THE Dashboard_System SHALL display an error state without exposing other tenant data
6. THE Dashboard_System SHALL validate business_id on every data fetch operation
7. THE Dashboard_System SHALL clear cached data when business context changes

### Requirement 7: Multi-Domain Support

**User Story:** As a platform administrator, I want to support multiple business domains, so that each industry gets appropriate features.

#### Acceptance Criteria

1. THE Dashboard_System SHALL detect business domain from the business.category field
2. THE Dashboard_System SHALL load domain-specific knowledge using getDomainKnowledge function
3. WHEN domain knowledge indicates batch tracking is enabled, THE Dashboard_System SHALL display batch-related widgets
4. WHEN domain knowledge indicates serial tracking is enabled, THE Dashboard_System SHALL display serial-related widgets
5. WHEN domain knowledge indicates multi-location is enabled, THE Dashboard_System SHALL display warehouse distribution widgets
6. THE Dashboard_System SHALL support domain-based routing using business.domain field
7. THE Dashboard_System SHALL provide domain-specific features without affecting other domains

### Requirement 8: Widget Registry and Management

**User Story:** As a developer, I want a centralized widget registry, so that I can easily add, remove, and configure widgets.

#### Acceptance Criteria

1. THE Dashboard_System SHALL maintain a Widget_Registry with all available widgets
2. THE Widget_Registry SHALL store widget metadata including id, name, category, required permissions, and default size
3. THE Dashboard_System SHALL validate widget permissions before rendering
4. WHEN a template requests a widget, THE Dashboard_System SHALL look up the widget in the Widget_Registry
5. IF a widget is not found in the Widget_Registry, THEN THE Dashboard_System SHALL log an error and skip rendering
6. THE Widget_Registry SHALL support widget categories: inventory, sales, finance, pakistani, general
7. THE Widget_Registry SHALL specify minimum and maximum widget sizes
8. THE Dashboard_System SHALL enforce widget size constraints during layout

### Requirement 9: Layout Persistence

**User Story:** As a user, I want my dashboard layout to be saved, so that my customizations persist across sessions.

#### Acceptance Criteria

1. THE Dashboard_System SHALL save dashboard layouts to the dashboard_layouts table
2. THE dashboard_layouts table SHALL store user_id, business_id, layout_name, widgets configuration, and timestamps
3. WHEN a user customizes widget positions, THE Dashboard_System SHALL save the layout within 2 seconds
4. WHEN a user reloads the dashboard, THE Dashboard_System SHALL restore the saved layout
5. THE Dashboard_System SHALL support multiple layout presets per user
6. THE Dashboard_System SHALL mark one layout as default per user per business
7. IF no saved layout exists, THEN THE Dashboard_System SHALL use the default template layout for the user's role and domain
8. THE Dashboard_System SHALL provide a reset-to-default option that restores the template layout

### Requirement 10: Inventory Metrics Integration

**User Story:** As a business owner, I want to see real-time inventory metrics on my dashboard, so that I can monitor stock levels and valuation.

#### Acceptance Criteria

1. THE Dashboard_System SHALL display inventory valuation calculated using the configured Costing_Method
2. WHEN Costing_Method is FIFO, THE Dashboard_System SHALL calculate valuation using first-in-first-out logic
3. WHEN Costing_Method is LIFO, THE Dashboard_System SHALL calculate valuation using last-in-first-out logic
4. WHEN Costing_Method is WAC, THE Dashboard_System SHALL calculate valuation using weighted average cost
5. THE Dashboard_System SHALL display batch expiry alerts for batches expiring within 90 days
6. THE Dashboard_System SHALL categorize batch expiry severity as critical (<30 days), warning (30-90 days), or normal (>90 days)
7. THE Dashboard_System SHALL display serial warranty status for products with serial tracking
8. THE Dashboard_System SHALL display warehouse distribution showing stock levels by location
9. THE Dashboard_System SHALL update inventory metrics in real-time when stock changes occur
10. THE Dashboard_System SHALL display low stock alerts for products below minimum stock level

### Requirement 11: Performance Requirements

**User Story:** As a user, I want fast dashboard loading, so that I can quickly access my business metrics.

#### Acceptance Criteria

1. THE Dashboard_System SHALL load and render the dashboard within 2 seconds on initial page load
2. THE Dashboard_System SHALL load individual widgets within 1 second of dashboard render
3. WHEN a user refreshes the dashboard, THE Dashboard_System SHALL complete the refresh within 3 seconds
4. THE Dashboard_System SHALL implement caching for dashboard metrics with 5-minute TTL
5. THE Dashboard_System SHALL use React Query for data fetching and caching
6. THE Dashboard_System SHALL implement incremental loading for widgets below the fold
7. THE Dashboard_System SHALL display loading skeletons during data fetching
8. THE Dashboard_System SHALL optimize re-renders using React.memo for widget components

### Requirement 12: Header Integration

**User Story:** As a user, I want a comprehensive header with business switching and quick actions, so that I can efficiently navigate the application.

#### Acceptance Criteria

1. THE Dashboard_System SHALL display a header with business switcher, quick actions, notifications, and user menu
2. THE business switcher SHALL display all businesses the user has access to
3. WHEN a user selects a different business, THE Dashboard_System SHALL switch context and reload the dashboard
4. THE quick actions menu SHALL provide shortcuts to common actions (create invoice, add product, view reports)
5. THE notifications menu SHALL display recent system notifications with priority sorting
6. THE user menu SHALL display user profile, settings, and logout options
7. THE header SHALL remain fixed at the top during scrolling
8. THE header SHALL be responsive and adapt to mobile screen sizes

### Requirement 13: Responsive Design

**User Story:** As a mobile user, I want the dashboard to work on my phone, so that I can monitor my business on the go.

#### Acceptance Criteria

1. THE Dashboard_System SHALL support screen widths from 320px to 2560px
2. WHEN screen width is below 768px, THE Dashboard_System SHALL switch to mobile layout with stacked widgets
3. THE Dashboard_System SHALL use touch-optimized controls with minimum 44px touch targets on mobile
4. THE Dashboard_System SHALL adapt grid columns based on screen size (1 column on mobile, 2 on tablet, 4 on desktop)
5. THE Dashboard_System SHALL hide non-essential widgets on mobile to improve performance
6. THE Dashboard_System SHALL provide swipe gestures for navigation on mobile
7. THE Dashboard_System SHALL optimize font sizes for readability on small screens

### Requirement 14: Error Handling and Recovery

**User Story:** As a user, I want clear error messages and recovery options, so that I can resolve issues quickly.

#### Acceptance Criteria

1. WHEN a widget fails to load data, THE Dashboard_System SHALL display an error state with a retry button
2. WHEN a network error occurs, THE Dashboard_System SHALL display a connection status indicator
3. WHEN a permission error occurs, THE Dashboard_System SHALL display a permission denied message
4. THE Dashboard_System SHALL log all errors to the monitoring system
5. THE Dashboard_System SHALL provide fallback to cached data when real-time data is unavailable
6. THE Dashboard_System SHALL implement automatic retry with exponential backoff (1s, 2s, 4s, 8s)
7. IF a widget repeatedly fails (>3 retries), THEN THE Dashboard_System SHALL stop retrying and display a persistent error state
8. THE Dashboard_System SHALL provide a global refresh button to reload all widgets

### Requirement 15: Data Consistency

**User Story:** As a user, I want accurate and consistent data across all widgets, so that I can trust the metrics displayed.

#### Acceptance Criteria

1. THE Dashboard_System SHALL use centralized data fetching via getDashboardMetricsAction
2. THE Dashboard_System SHALL ensure all widgets display data from the same time snapshot
3. WHEN dashboard metrics are updated, THE Dashboard_System SHALL update all dependent widgets simultaneously
4. THE Dashboard_System SHALL validate data integrity before rendering
5. IF data validation fails, THEN THE Dashboard_System SHALL display an error and log the validation failure
6. THE Dashboard_System SHALL use consistent number formatting across all widgets (currency, percentages, quantities)
7. THE Dashboard_System SHALL display timestamps for all metrics to indicate data freshness

### Requirement 16: Widget Customization

**User Story:** As a user, I want to customize my dashboard layout, so that I can prioritize the metrics most important to me.

#### Acceptance Criteria

1. THE Dashboard_System SHALL provide drag-and-drop widget arrangement using react-grid-layout
2. THE Dashboard_System SHALL allow users to add widgets from the Widget_Registry
3. THE Dashboard_System SHALL allow users to remove widgets from their dashboard
4. THE Dashboard_System SHALL allow users to resize widgets within min/max constraints
5. WHEN a user drags a widget, THE Dashboard_System SHALL show a visual preview of the new position
6. WHEN a user drops a widget, THE Dashboard_System SHALL save the new layout immediately
7. THE Dashboard_System SHALL provide a widget library panel showing all available widgets
8. THE Dashboard_System SHALL filter the widget library based on user permissions and domain

### Requirement 17: Real-Time Updates

**User Story:** As a user, I want real-time dashboard updates, so that I always see current business metrics.

#### Acceptance Criteria

1. THE Dashboard_System SHALL establish WebSocket connection via Supabase Realtime
2. WHEN a relevant data change occurs, THE Dashboard_System SHALL receive a real-time update within 2 seconds
3. THE Dashboard_System SHALL update affected widgets without full page reload
4. THE Dashboard_System SHALL display a visual indicator when data is being updated
5. IF WebSocket connection drops, THEN THE Dashboard_System SHALL attempt automatic reconnection
6. THE Dashboard_System SHALL queue updates during disconnection and sync on reconnection
7. THE Dashboard_System SHALL notify users if offline for more than 30 seconds
8. THE Dashboard_System SHALL fall back to polling every 30 seconds if WebSocket is unavailable

### Requirement 18: Accessibility

**User Story:** As a user with accessibility needs, I want the dashboard to be accessible, so that I can use it effectively.

#### Acceptance Criteria

1. THE Dashboard_System SHALL provide keyboard navigation for all interactive elements
2. THE Dashboard_System SHALL support screen readers with proper ARIA labels
3. THE Dashboard_System SHALL maintain color contrast ratios of at least 4.5:1 for text
4. THE Dashboard_System SHALL provide focus indicators for keyboard navigation
5. THE Dashboard_System SHALL support keyboard shortcuts for common actions
6. THE Dashboard_System SHALL provide alternative text for all icons and images
7. THE Dashboard_System SHALL ensure all interactive elements are reachable via keyboard
8. THE Dashboard_System SHALL announce dynamic content changes to screen readers

### Requirement 19: Testing and Quality Assurance

**User Story:** As a developer, I want comprehensive test coverage, so that I can confidently make changes without breaking functionality.

#### Acceptance Criteria

1. THE Dashboard_System SHALL have unit tests for all shared components (DashboardStatsGrid, DashboardLoadingSkeleton, RevenueChartSection)
2. THE Dashboard_System SHALL have integration tests for dashboard template selection logic
3. THE Dashboard_System SHALL have property-based tests for inventory valuation calculations
4. THE Dashboard_System SHALL have property-based tests for layout persistence (save/load round-trip)
5. THE Dashboard_System SHALL have property-based tests for multi-tenant isolation
6. THE Dashboard_System SHALL achieve at least 80% code coverage
7. THE Dashboard_System SHALL have end-to-end tests for critical user flows (dashboard load, widget customization, business switching)
8. THE Dashboard_System SHALL have performance tests to validate 2-second load time requirement

### Requirement 20: Migration and Backward Compatibility

**User Story:** As a developer, I want a smooth migration path, so that existing users experience no disruption during the consolidation.

#### Acceptance Criteria

1. THE Dashboard_System SHALL support feature flags for gradual rollout of the unified system
2. THE Dashboard_System SHALL maintain all existing dashboard routes during migration
3. THE Dashboard_System SHALL provide a migration script to convert existing layouts to the new format
4. THE Dashboard_System SHALL preserve all user customizations during migration
5. THE Dashboard_System SHALL provide a rollback mechanism in case of critical issues
6. THE Dashboard_System SHALL log all migration activities for audit purposes
7. THE Dashboard_System SHALL notify users of any changes to their dashboard experience
8. THE Dashboard_System SHALL provide documentation for the migration process
