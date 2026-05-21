# Tenvo Admin & User Management System Analysis

## Current System Overview

### Platform Owner (Super Admin)
- **Email-based identification**: `zeeshan.keerio@mindscapeanalytics.com`
- **Full system access**: All businesses, users, billing, feature flags
- **Bypasses all guards**: No plan restrictions, no limits
- **Admin Panel**: `/admin` route with PlatformAdminPanel component

### Current Admin Capabilities
1. **Business Management**
   - List all businesses with pagination and search
   - View business details including team members
   - Update business plan tiers
   - Extend trials
   - View plan distribution across platform

2. **User Management**
   - List all platform users
   - Change user roles within businesses
   - Deactivate/reactivate business users
   - Set platform-level roles

3. **Subscription Management**
   - View subscription statistics
   - Trial management (extend trials)
   - Plan tier changes

4. **Role Management**
   - 10 predefined roles: viewer → owner
   - Permission-based access control (RBAC)
   - Custom role support via database

### Business-Level Roles (10 Tiers)
```
owner (9) > admin (8) > manager (7) > warehouse_manager (6) > accountant (5) > 
cashier (4) > salesperson (3) > chef (2) > waiter (1) > viewer (0)
```

### Current Gaps vs Zoho

| Feature | Tenvo Current | Zoho Inventory | Gap Level |
|---------|--------------|----------------|-----------|
| **Custom Roles** | ❌ Not Available | ✅ Full CRUD | **HIGH** |
| **Role Templates** | ❌ Not Available | ✅ Predefined | **HIGH** |
| **Granular Permissions** | ✅ Module-level | ✅ Field-level | **MEDIUM** |
| **User Invitation** | ❌ Manual only | ✅ Email invite | **HIGH** |
| **User Deactivation** | ✅ Available | ✅ Available | **NONE** |
| **Audit Logs per User** | ❌ Limited | ✅ Detailed | **MEDIUM** |
| **Platform Analytics** | ✅ Basic | ✅ Advanced | **MEDIUM** |
| **Feature Flag Override** | ❌ Manual DB | ✅ Admin UI | **HIGH** |
| **Custom Package Builder** | ❌ Not Available | ✅ Enterprise | **HIGH** |
| **Billing Management** | ❌ View only | ✅ Full control | **HIGH** |
| **Impersonation** | ❌ Not Available | ✅ Admin feature | **MEDIUM** |
| **User Activity Tracking** | ❌ Limited | ✅ Detailed logs | **MEDIUM** |

---

## Recommended Improvements

### 1. Enhanced Custom Role Management

#### Current State
- 10 hardcoded roles in `lib/rbac/permissions.js`
- Permission definitions in code
- No UI for creating custom roles

#### Proposed Enhancement
```javascript
// New: Custom Role Management System
const ROLE_TEMPLATES = {
  'store_manager': {
    name: 'Store Manager',
    description: 'Manages daily store operations',
    inherits: 'manager',
    permissions: ['pos.*', 'inventory.view', 'inventory.edit', 'customers.*'],
    restrictions: ['finance.delete', 'settings.billing']
  },
  'sales_associate': {
    name: 'Sales Associate',
    description: 'Handles sales and customer interactions',
    inherits: 'salesperson',
    permissions: ['pos.process_sale', 'customers.view', 'customers.create'],
    restrictions: ['pos.void_transaction', 'inventory.delete']
  },
  'inventory_clerk': {
    name: 'Inventory Clerk',
    description: 'Manages stock and warehouse',
    inherits: 'warehouse_manager',
    permissions: ['inventory.*', 'purchases.view'],
    restrictions: ['purchases.approve', 'finance.*']
  }
};
```

#### UI Components Needed
1. **Role Builder Wizard**
   - Drag-drop permission assignment
   - Template selection (20+ templates)
   - Visual permission tree
   - Role testing simulator

2. **Role Comparison Tool**
   - Side-by-side permission comparison
   - Diff view between roles
   - Impact analysis ("What will user lose/gain?")

3. **Role Analytics**
   - Most used roles
   - Permission utilization rates
   - Security risk scoring

### 2. Advanced User Management

#### Missing Features

**A. User Invitation System**
```javascript
// New: Invitation Management
{
  invitation_id: 'uuid',
  email: 'user@example.com',
  role: 'sales_associate',
  business_id: 'business_uuid',
  invited_by: 'admin_user_id',
  status: 'pending|accepted|expired',
  expires_at: '2024-12-31T23:59:59Z',
  custom_message: 'Welcome to our team!',
  onboarding_checklist: ['complete_profile', 'watch_training', 'setup_2fa']
}
```

**B. User Onboarding Flows**
- Role-specific onboarding checklists
- Training video assignments
- Progress tracking
- Automated reminders

**C. User Activity Dashboard**
```javascript
// New: Activity Tracking
{
  user_id: 'uuid',
  sessions: [
    {
      started_at: 'timestamp',
      ended_at: 'timestamp',
      ip_address: 'xxx.xxx.xxx.xxx',
      device: 'Chrome/Windows',
      actions: ['viewed_invoice', 'created_customer', 'processed_sale']
    }
  ],
  last_active: 'timestamp',
  login_count: 42,
  features_used: ['pos', 'inventory', 'reports']
}
```

#### UI Components Needed
1. **User Directory**
   - Grid/List view toggle
   - Advanced filters (role, last active, status)
   - Bulk actions (activate, deactivate, delete)
   - Export to CSV/Excel

2. **User Profile Page**
   - Activity timeline
   - Permission audit
   - Feature usage analytics
   - Security settings (2FA, sessions)

3. **Invitation Manager**
   - Pending invitations list
   - Resend/Revoke buttons
   - Invitation analytics (acceptance rate)
   - Bulk invitation upload (CSV)

### 3. Feature Flag Management System

#### Current State
- Feature flags in `lib/config/plans.js`
- Manual database updates required
- No UI for real-time toggling

#### Proposed Enhancement: Feature Flag Admin Panel

```javascript
// New: Feature Flag Management
const FEATURE_FLAG_SYSTEM = {
  // Global Feature Flags (Platform-wide)
  global: {
    'new_ui_enabled': {
      type: 'boolean',
      value: true,
      description: 'Enable new dashboard UI',
      rollout_percentage: 100,
      allowed_businesses: [], // empty = all
      blocked_businesses: []
    },
    'beta_ai_features': {
      type: 'percentage_rollout',
      value: false,
      rollout_percentage: 25,
      description: 'Beta AI features for select users'
    }
  },
  
  // Per-Business Feature Overrides
  business: {
    'business_uuid': {
      'custom_feature_x': {
        enabled: true,
        expires_at: '2024-12-31',
        reason: 'Enterprise deal negotiation'
      }
    }
  },
  
  // Per-User Feature Overrides
  user: {
    'user_uuid': {
      'early_access_reports': {
        enabled: true,
        granted_by: 'admin_uuid',
        granted_at: 'timestamp'
      }
    }
  }
};
```

#### UI Components Needed

1. **Feature Flag Dashboard**
   - Real-time toggle switches
   - Rollout percentage slider
   - Business/user search for overrides
   - Feature usage analytics
   - A/B test configuration

2. **Override Manager**
   - Grant feature to specific business
   - Grant feature to specific user
   - Set expiration dates
   - Add override reasons
   - Audit trail of all changes

3. **Feature Analytics**
   - Usage rates per feature
   - Feature adoption curves
   - Revenue impact analysis
   - User feedback aggregation

### 4. Custom Package Builder (Enterprise Deals)

#### Current State
- Fixed 6-tier structure
- No custom package UI
- Manual database updates for custom deals

#### Proposed Enhancement

```javascript
// New: Custom Package Builder
const CUSTOM_PACKAGE_BUILDER = {
  // Base Configuration
  base: {
    tier: 'enterprise', // Starting tier
    price_pkr: 25000,
    billing_cycle: 'annual' // monthly | annual | multi-year
  },
  
  // Feature Selection
  features: {
    included: [
      'all_essentials',
      'all_pos',
      'all_finance'
    ],
    excluded: [
      'white_label', // Removed for this deal
    ],
    custom_limits: {
      max_users: 100,
      max_products: 50000,
      max_pos_terminals: 20,
      max_warehouses: 15
    }
  },
  
  // Module Selection
  modules: {
    included: ['essentials', 'accounts', 'pos', 'operations'],
    add_ons: [
      { module: 'intelligence', discount: 50 }, // 50% off
      { module: 'governance', discount: 100 } // Free
    ]
  },
  
  // SLA & Support
  sla: {
    uptime: 99.99,
    support_response_hours: 1,
    dedicated_manager: true,
    onboarding_assistance: '2_weeks'
  },
  
  // Special Terms
  terms: {
    contract_length: 24, // months
    trial_extension_days: 30,
    payment_terms: 'net_30',
    price_lock: true // Lock price for contract duration
  }
};
```

#### UI Components Needed

1. **Deal Configurator**
   - Visual tier builder
   - Feature toggle matrix
   - Limit configuration sliders
   - Real-time price calculator
   - Proposal PDF generator

2. **Contract Manager**
   - Contract templates
   - Digital signature integration
   - Renewal reminders
   - Amendment tracking

3. **Revenue Analytics**
   - MRR/ARR per custom deal
   - Profit margin analysis
   - Deal comparison tools
   - Sales rep performance

### 5. Platform-Wide Analytics & Monitoring

#### Missing Dashboards

**A. Business Health Dashboard**
```javascript
{
  // Business Lifecycle Metrics
  total_businesses: 1250,
  active_businesses: 980,
  churned_this_month: 12,
  at_risk_businesses: 45, // AI prediction
  
  // Engagement Metrics
  avg_daily_active_users: 3200,
  avg_session_duration: '45m',
  feature_adoption_rates: {
    'pos': 78,
    'inventory': 85,
    'ai_analytics': 32
  },
  
  // Revenue Metrics
  mrr: 850000, // PKR
  arr: 10200000,
  trial_to_paid_rate: 23,
  upgrade_rate: 8,
  downgrade_rate: 3
}
```

**B. System Health Dashboard**
- API response times
- Error rates by module
- Database performance
- Feature flag impact
- User satisfaction scores

**C. Security Dashboard**
- Failed login attempts
- Suspicious activity alerts
- Permission violations
- Data access audit
- 2FA adoption rates

### 6. User Impersonation & Support Tools

#### Missing Features

**A. Impersonation System**
```javascript
// Secure user impersonation for support
{
  impersonation_session: {
    admin_id: 'admin_uuid',
    target_user_id: 'user_uuid',
    business_id: 'business_uuid',
    started_at: 'timestamp',
    expires_at: 'timestamp+1hour',
    reason: 'Investigating invoice issue #12345',
    actions_taken: ['viewed_invoice', 'checked_customer_record'],
    audit_log: true // All actions logged as admin
  }
}
```

**B. Support Ticket Integration**
- Link tickets to user sessions
- View user activity during ticket
- One-click impersonate from ticket
- Screen recording consent

#### UI Components Needed

1. **Impersonation Bar**
   - Red banner: "Acting as [User Name]"
   - Session timer
   - Quick actions (reset password, view logs)
   - End session button

2. **Support Context Panel**
   - User's recent activity
   - Current open tickets
   - Feature usage history
   - Previous support interactions

### 7. Advanced Billing & Subscription Management

#### Current Gaps
- No billing dashboard in admin
- No invoice management
- No refund processing UI
- No subscription pause/resume

#### Proposed Enhancement

```javascript
// Billing Management System
{
  // Invoice Management
  invoices: {
    list_all: true,
    filter_by: ['status', 'date', 'amount', 'business'],
    actions: ['download', 'resend', 'void', 'refund']
  },
  
  // Subscription Lifecycle
  subscriptions: {
    pause: { // Temporarily pause billing
      duration_days: 30,
      grace_period: true
    },
    resume: { // Resume paused subscription
      prorate: true
    },
    cancel: {
      at_period_end: true,
      immediate: true,
      reason_capture: true
    },
    change_plan: {
      immediate: true,
      at_period_end: true,
      prorate: true
    }
  },
  
  // Payment Management
  payments: {
    retry_failed: true,
    update_payment_method: true,
    offline_payments: { // For bank transfers/cash
      record_manual_payment: true,
      upload_receipt: true
    }
  },
  
  // Credits & Adjustments
  credits: {
    issue_credit: true,
    apply_to_invoice: true,
    expiration_dates: true
  }
}
```

#### UI Components Needed

1. **Billing Dashboard**
   - Monthly recurring revenue (MRR)
   - Outstanding invoices
   - Failed payments list
   - Revenue forecasts

2. **Invoice Manager**
   - List all invoices (platform-wide)
   - Advanced filters
   - Bulk actions
   - Refund processing

3. **Subscription Manager**
   - View all active subscriptions
   - Pause/Resume/Upgrade/Downgrade
   - Churn analysis
   - Retention tools

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. ✅ Update permission system for granular control
2. ✅ Create custom role database schema
3. ✅ Build role management API endpoints
4. ✅ Create basic role builder UI

### Phase 2: User Management (Week 3-4)
1. Build user invitation system
2. Create user directory with advanced filters
3. Add user activity tracking
4. Implement user profile pages

### Phase 3: Feature Flags (Week 5-6)
1. Create feature flag database schema
2. Build feature flag admin UI
3. Add override management
4. Implement analytics tracking

### Phase 4: Custom Packages (Week 7-8)
1. Build deal configurator
2. Create proposal generator
3. Add contract management
4. Implement revenue analytics

### Phase 5: Support Tools (Week 9-10)
1. Add impersonation system
2. Build support context panel
3. Create health dashboards
4. Add billing management

---

## Database Schema Updates Needed

### New Tables

```sql
-- Custom Roles
CREATE TABLE custom_roles (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Invitations
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  business_id UUID REFERENCES businesses(id),
  role VARCHAR(50) NOT NULL,
  invited_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending',
  token VARCHAR(255) UNIQUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feature Flags
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200),
  description TEXT,
  type VARCHAR(50), -- boolean, percentage, business_list
  default_value JSONB,
  rollout_percentage INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feature Flag Overrides
CREATE TABLE feature_flag_overrides (
  id UUID PRIMARY KEY,
  feature_flag_id UUID REFERENCES feature_flags(id),
  target_type VARCHAR(20), -- 'business', 'user'
  target_id UUID,
  value JSONB,
  expires_at TIMESTAMP,
  reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Custom Packages
CREATE TABLE custom_packages (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  name VARCHAR(200),
  base_tier VARCHAR(50),
  custom_price_pkr INTEGER,
  custom_price_usd INTEGER,
  billing_cycle VARCHAR(20),
  features JSONB,
  limits JSONB,
  contract_start DATE,
  contract_end DATE,
  sla_details JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Activity Logs
CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  business_id UUID REFERENCES businesses(id),
  session_id VARCHAR(255),
  action VARCHAR(100),
  module VARCHAR(50),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Impersonation Sessions
CREATE TABLE impersonation_sessions (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  business_id UUID REFERENCES businesses(id),
  reason TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  actions_taken JSONB DEFAULT '[]'
);
```

---

## Competitive Analysis: Tenvo vs Zoho

### User Management
| Feature | Tenvo (Current) | Tenvo (Proposed) | Zoho |
|---------|-----------------|------------------|------|
| Predefined Roles | 10 roles | 10 + templates | 5-6 roles |
| Custom Roles | ❌ | ✅ Full CRUD | ✅ Full CRUD |
| Role Templates | ❌ | ✅ 20+ templates | ❌ |
| User Invitation | ❌ | ✅ Email + bulk | ✅ Email |
| Activity Tracking | ❌ | ✅ Detailed | ✅ Detailed |
| Permission Granularity | Module | Field-level | Field-level |

### Admin Capabilities
| Feature | Tenvo (Current) | Tenvo (Proposed) | Zoho |
|---------|-----------------|------------------|------|
| Platform Analytics | Basic | Advanced | Advanced |
| Feature Flagging | ❌ | ✅ Real-time | ❌ |
| Custom Packages | ❌ | ✅ Full builder | ✅ Enterprise |
| Billing Management | ❌ | ✅ Full control | ✅ Full |
| Impersonation | ❌ | ✅ Secure | ✅ Available |
| Support Tools | ❌ | ✅ Context panel | ✅ Basic |

### Unique Tenvo Advantages
1. **Real-time Feature Flagging** - Zoho doesn't have this
2. **AI-powered User Insights** - Predict churn, engagement
3. **Pakistani Market Focus** - JazzCash, Urdu, local support
4. **Modular Custom Roles** - More flexible than Zoho
5. **Integrated Helpdesk** - All-in-one platform

---

## Next Steps

1. **Database Migration** - Create new tables
2. **API Development** - Build admin endpoints
3. **UI Components** - Create management interfaces
4. **Testing** - Unit and integration tests
5. **Documentation** - Admin user guides

**Estimated Timeline**: 10 weeks for full implementation
**Priority**: High - Critical for enterprise sales
