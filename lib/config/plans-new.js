/**
 * Tenvo Plan Configuration - Modular Packaging System
 * Optimized for Pakistan Market with International Scalability
 * 
 * Pakistan Pricing Strategy (PKR):
 * - Free: ₹0 (Solo entrepreneurs testing the platform)
 * - Starter: ₹999 (~$3.50) - Micro businesses
 * - Growth: ₹2,499 (~$9) - Small shops with POS needs
 * - Professional: ₹4,999 (~$18) - Growing businesses
 * - Business: ₹9,999 (~$35) - Multi-location operations
 * - Enterprise: Custom (Negotiated deals)
 * 
 * International Pricing (USD):
 * - Free: $0
 * - Starter: $5
 * - Growth: $12
 * - Professional: $24
 * - Business: $49
 * - Enterprise: Custom
 * 
 * MODULE PACKAGES:
 * Users can select individual module packages or bundled tiers
 */

// ============================================
// MODULE PACKAGE DEFINITIONS
// ============================================

export const MODULE_PACKAGES = {
  // ESSENTIALS - Core business operations (Free tier includes this)
  essentials: {
    key: 'essentials',
    name: 'Business Essentials',
    description: 'Core invoicing, inventory, customers, and vendors management',
    icon: 'Package',
    standalone_price_pkr: 0,
    standalone_price_usd: 0,
    features: [
      'invoicing',
      'purchases',
      'customers',
      'vendors',
      'basic_accounting',
      'basic_reports',
      'quotations',
      'sales_orders',
      'delivery_challans',
    ],
  },

  // ACCOUNTS - Complete accounting & finance
  accounts: {
    key: 'accounts',
    name: 'Complete Accounting',
    description: 'Full financial management with GST, expenses, credit notes, and fiscal periods',
    icon: 'Calculator',
    standalone_price_pkr: 499,
    standalone_price_usd: 2,
    features: [
      'expense_tracking',
      'credit_notes',
      'payment_allocations',
      'fiscal_periods',
      'tax_compliance',
      'journal_entries',
      'bank_reconciliation',
      'chart_of_accounts',
    ],
  },

  // POS - Point of Sale & Retail
  pos: {
    key: 'pos',
    name: 'Point of Sale',
    description: 'Complete POS system with refunds, barcode scanning, and restaurant features',
    icon: 'ShoppingCart',
    standalone_price_pkr: 799,
    standalone_price_usd: 3,
    features: [
      'pos_terminal',
      'pos_refunds',
      'barcode_scanning',
      'multi_pos_terminals',
      'restaurant_pos',
      'kitchen_display_system',
      'table_management',
      'offline_pos_mode',
    ],
  },

  // OPERATIONS - Advanced inventory & logistics
  operations: {
    key: 'operations',
    name: 'Operations & Logistics',
    description: 'Multi-warehouse, batch/serial tracking, manufacturing, and stock management',
    icon: 'Warehouse',
    standalone_price_pkr: 1499,
    standalone_price_usd: 5,
    features: [
      'multi_warehouse',
      'batch_tracking',
      'serial_tracking',
      'manufacturing',
      'bill_of_materials',
      'production_orders',
      'stock_reservations',
      'stock_transfers',
      'inventory_forecasting',
    ],
  },

  // HR - Payroll & Human Resources
  hr: {
    key: 'hr',
    name: 'HR & Payroll',
    description: 'Complete payroll processing, attendance tracking, and shift scheduling',
    icon: 'Users',
    standalone_price_pkr: 999,
    standalone_price_usd: 4,
    features: [
      'payroll_processing',
      'salary_slips',
      'tax_deductions',
      'attendance_tracking',
      'shift_scheduling',
      'leave_management',
      'employee_self_service',
      ' biometric_integration',
    ],
  },

  // CRM - Customer Relationship & Marketing
  crm: {
    key: 'crm',
    name: 'CRM & Marketing',
    description: 'Loyalty programs, campaigns, promotions, and customer segmentation',
    icon: 'Heart',
    standalone_price_pkr: 599,
    standalone_price_usd: 2,
    features: [
      'loyalty_programs',
      'customer_segmentation',
      'campaigns_email_sms',
      'promotions_discounts',
      'price_lists',
      'supplier_quotes',
      'customer_portal',
    ],
  },

  // INTELLIGENCE - AI & Advanced Analytics
  intelligence: {
    key: 'intelligence',
    name: 'AI & Intelligence',
    description: 'AI-powered analytics, forecasting, demand prediction, and custom reports',
    icon: 'Brain',
    standalone_price_pkr: 1999,
    standalone_price_usd: 7,
    features: [
      'ai_analytics',
      'ai_demand_forecasting',
      'ai_smart_restock',
      'ai_price_optimization',
      'advanced_reports',
      'custom_report_builder',
      'predictive_insights',
      'anomaly_detection',
      'business_intelligence_dashboard',
    ],
  },

  // GOVERNANCE - Compliance & Enterprise Controls
  governance: {
    key: 'governance',
    name: 'Governance & Compliance',
    description: 'Approval workflows, audit logs, multi-branch, and compliance tools',
    icon: 'Shield',
    standalone_price_pkr: 1299,
    standalone_price_usd: 5,
    features: [
      'approval_workflows',
      'multi_level_approvals',
      'audit_logs',
      'audit_trail',
      'multi_branch',
      'multi_domain',
      'role_based_access',
      'data_retention_policies',
    ],
  },

  // PLATFORM - API & Integrations
  platform: {
    key: 'platform',
    name: 'Platform & API',
    description: 'API access, webhooks, custom workflows, and integrations',
    icon: 'Code',
    standalone_price_pkr: 799,
    standalone_price_usd: 3,
    features: [
      'api_access',
      'webhook_integrations',
      'custom_workflows',
      'third_party_integrations',
      'zapier_integration',
      'shopify_integration',
      'woocommerce_integration',
    ],
  },
};

// ============================================
// TIER CONFIGURATION
// ============================================

export const PLAN_TIERS = {
  // ----------------------------------
  // TIER 1: FREE - Solo Entrepreneurs
  // ----------------------------------
  free: {
    key: 'free',
    name: 'Free',
    tagline: 'Perfect for solo entrepreneurs getting started',
    description: 'Essential tools to start your business - Invoicing, customers, basic inventory, and vendors',
    price_pkr: 0,
    price_usd: 0,
    billing: 'free',
    badge: null,
    
    // Included Module Packages
    included_modules: ['essentials'],
    
    limits: {
      max_users: 1,
      max_products: 100,
      max_customers: 100,
      max_vendors: 50,
      max_warehouses: 1,
      max_invoices_per_month: 100,
      max_pos_terminals: 0,
      max_storage_mb: 100,
      max_branches: 1,
      max_transactions_per_month: 500,
    },
    
    features: {
      // CORE ESSENTIALS
      invoicing: true,
      purchases: true,
      customers: true,
      vendors: true,
      basic_accounting: true,
      basic_reports: true,
      quotations: true,
      sales_orders: false,
      delivery_challans: false,

      // POS - Not available in Free
      pos_terminal: false,
      pos_refunds: false,
      barcode_scanning: false,
      multi_pos_terminals: false,
      restaurant_pos: false,
      kitchen_display_system: false,
      table_management: false,
      offline_pos_mode: false,

      // ACCOUNTS
      expense_tracking: false,
      credit_notes: false,
      payment_allocations: true,  // Basic only
      fiscal_periods: false,
      tax_compliance: true,  // Basic GST only
      journal_entries: false,
      bank_reconciliation: true,
      chart_of_accounts: false,

      // OPERATIONS
      multi_warehouse: false,
      batch_tracking: false,
      serial_tracking: false,
      manufacturing: false,
      bill_of_materials: false,
      production_orders: false,
      stock_reservations: false,
      stock_transfers: false,
      inventory_forecasting: false,

      // HR
      payroll_processing: false,
      salary_slips: false,
      tax_deductions: false,
      attendance_tracking: false,
      shift_scheduling: false,
      leave_management: false,
      employee_self_service: false,
      biometric_integration: false,

      // CRM
      loyalty_programs: false,
      customer_segmentation: false,
      campaigns_email_sms: false,
      promotions_discounts: false,
      price_lists: false,
      supplier_quotes: true,
      customer_portal: false,

      // INTELLIGENCE
      ai_analytics: false,
      ai_demand_forecasting: false,
      ai_smart_restock: false,
      ai_price_optimization: false,
      advanced_reports: false,
      custom_report_builder: false,
      predictive_insights: false,
      anomaly_detection: false,
      business_intelligence_dashboard: false,

      // GOVERNANCE
      approval_workflows: false,
      multi_level_approvals: false,
      audit_logs: false,
      audit_trail: false,
      multi_branch: false,
      multi_domain: false,
      role_based_access: false,
      data_retention_policies: false,

      // PLATFORM
      api_access: false,
      webhook_integrations: false,
      custom_workflows: false,
      third_party_integrations: false,
      zapier_integration: false,
      shopify_integration: false,
      woocommerce_integration: false,

      // SUPPORT
      priority_support: false,
      dedicated_account_manager: false,
      white_label: false,
      custom_domain: false,
    },
  },

  // ----------------------------------
  // TIER 2: STARTER - Micro Businesses
  // ----------------------------------
  starter: {
    key: 'starter',
    name: 'Starter',
    tagline: 'Everything to run your small business',
    description: 'Complete business management with POS, accounting, and essential operations',
    price_pkr: 999,
    price_usd: 5,
    billing: 'monthly',
    badge: 'Popular',
    
    // Included Module Packages
    included_modules: ['essentials', 'accounts', 'pos'],
    
    limits: {
      max_users: 3,
      max_products: 500,
      max_customers: 500,
      max_vendors: 200,
      max_warehouses: 1,
      max_invoices_per_month: 500,
      max_pos_terminals: 1,
      max_storage_mb: 500,
      max_branches: 1,
      max_transactions_per_month: 2000,
    },
    
    features: {
      // CORE ESSENTIALS
      invoicing: true,
      purchases: true,
      customers: true,
      vendors: true,
      basic_accounting: true,
      basic_reports: true,
      quotations: true,
      sales_orders: true,
      delivery_challans: false,

      // POS - Now available!
      pos_terminal: true,
      pos_refunds: true,
      barcode_scanning: true,
      multi_pos_terminals: false,  // Only 1 terminal
      restaurant_pos: true,
      kitchen_display_system: false,
      table_management: false,
      offline_pos_mode: true,

      // ACCOUNTS
      expense_tracking: true,
      credit_notes: true,
      payment_allocations: true,
      fiscal_periods: false,
      tax_compliance: true,
      journal_entries: false,
      bank_reconciliation: true,
      chart_of_accounts: false,

      // OPERATIONS
      multi_warehouse: false,
      batch_tracking: false,
      serial_tracking: false,
      manufacturing: false,
      bill_of_materials: false,
      production_orders: false,
      stock_reservations: false,
      stock_transfers: false,
      inventory_forecasting: false,

      // HR
      payroll_processing: false,
      salary_slips: false,
      tax_deductions: false,
      attendance_tracking: false,
      shift_scheduling: false,
      leave_management: false,
      employee_self_service: false,
      biometric_integration: false,

      // CRM
      loyalty_programs: true,  // Basic loyalty
      customer_segmentation: false,
      campaigns_email_sms: false,
      promotions_discounts: true,
      price_lists: false,
      supplier_quotes: true,
      customer_portal: false,

      // INTELLIGENCE
      ai_analytics: false,
      ai_demand_forecasting: false,
      ai_smart_restock: false,
      ai_price_optimization: false,
      advanced_reports: false,
      custom_report_builder: false,
      predictive_insights: false,
      anomaly_detection: false,
      business_intelligence_dashboard: false,

      // GOVERNANCE
      approval_workflows: false,
      multi_level_approvals: false,
      audit_logs: false,
      audit_trail: false,
      multi_branch: false,
      multi_domain: false,
      role_based_access: false,
      data_retention_policies: false,

      // PLATFORM
      api_access: true,  // API access starts here
      webhook_integrations: false,
      custom_workflows: false,
      third_party_integrations: false,
      zapier_integration: false,
      shopify_integration: false,
      woocommerce_integration: false,

      // SUPPORT
      priority_support: false,
      dedicated_account_manager: false,
      white_label: false,
      custom_domain: false,
    },
  },

  // ----------------------------------
  // TIER 3: GROWTH - Small Shops & Retailers
  // ----------------------------------
  growth: {
    key: 'growth',
    name: 'Growth',
    tagline: 'Scale your business with advanced tools',
    description: 'Multi-currency, inventory management, projects, and multi-user collaboration',
    price_pkr: 2499,
    price_usd: 12,
    billing: 'monthly',
    badge: 'Best Value',
    
    // Included Module Packages
    included_modules: ['essentials', 'accounts', 'pos', 'crm'],
    
    limits: {
      max_users: 5,
      max_products: 2000,
      max_customers: 2000,
      max_vendors: 500,
      max_warehouses: 3,
      max_invoices_per_month: 2000,
      max_pos_terminals: 3,
      max_storage_mb: 2000,
      max_branches: 1,
      max_transactions_per_month: 10000,
    },
    
    features: {
      // CORE ESSENTIALS
      invoicing: true,
      purchases: true,
      customers: true,
      vendors: true,
      basic_accounting: true,
      basic_reports: true,
      quotations: true,
      sales_orders: true,
      delivery_challans: true,

      // POS
      pos_terminal: true,
      pos_refunds: true,
      barcode_scanning: true,
      multi_pos_terminals: true,  // Up to 3
      restaurant_pos: true,
      kitchen_display_system: true,
      table_management: true,
      offline_pos_mode: true,

      // ACCOUNTS - Full accounting
      expense_tracking: true,
      credit_notes: true,
      payment_allocations: true,
      fiscal_periods: true,
      tax_compliance: true,
      journal_entries: true,
      bank_reconciliation: true,
      chart_of_accounts: true,
      multi_currency: true,  // NEW

      // OPERATIONS - Basic operations
      multi_warehouse: true,  // Up to 3 warehouses
      batch_tracking: false,
      serial_tracking: false,
      manufacturing: false,
      bill_of_materials: false,
      production_orders: false,
      stock_reservations: true,
      stock_transfers: true,
      inventory_forecasting: false,

      // HR
      payroll_processing: false,
      salary_slips: false,
      tax_deductions: false,
      attendance_tracking: false,
      shift_scheduling: false,
      leave_management: false,
      employee_self_service: false,
      biometric_integration: false,

      // CRM - Full CRM
      loyalty_programs: true,
      customer_segmentation: true,
      campaigns_email_sms: true,
      promotions_discounts: true,
      price_lists: true,
      supplier_quotes: true,
      customer_portal: true,

      // INTELLIGENCE
      ai_analytics: false,
      ai_demand_forecasting: false,
      ai_smart_restock: true,  // Basic restock alerts
      ai_price_optimization: false,
      advanced_reports: true,
      custom_report_builder: false,
      predictive_insights: false,
      anomaly_detection: false,
      business_intelligence_dashboard: false,

      // GOVERNANCE
      approval_workflows: false,
      multi_level_approvals: false,
      audit_logs: false,
      audit_trail: false,
      multi_branch: false,
      multi_domain: false,
      role_based_access: true,
      data_retention_policies: false,

      // PLATFORM
      api_access: true,
      webhook_integrations: true,
      custom_workflows: false,
      third_party_integrations: true,
      zapier_integration: true,
      shopify_integration: true,
      woocommerce_integration: true,

      // SUPPORT
      priority_support: false,
      dedicated_account_manager: false,
      white_label: false,
      custom_domain: false,
    },
  },

  // ----------------------------------
  // TIER 4: PROFESSIONAL - Growing Businesses
  // ----------------------------------
  professional: {
    key: 'professional',
    name: 'Professional',
    tagline: 'Complete operations with manufacturing & advanced inventory',
    description: 'Multi-warehouse, batch/serial tracking, manufacturing, and advanced reporting',
    price_pkr: 4999,
    price_usd: 24,
    billing: 'monthly',
    badge: 'Advanced',
    
    // Included Module Packages
    included_modules: ['essentials', 'accounts', 'pos', 'crm', 'operations'],
    
    limits: {
      max_users: 10,
      max_products: 10000,
      max_customers: 10000,
      max_vendors: 2000,
      max_warehouses: 10,
      max_invoices_per_month: 10000,
      max_pos_terminals: 5,
      max_storage_mb: 10000,
      max_branches: 3,
      max_transactions_per_month: 50000,
    },
    
    features: {
      // CORE ESSENTIALS
      invoicing: true,
      purchases: true,
      customers: true,
      vendors: true,
      basic_accounting: true,
      basic_reports: true,
      quotations: true,
      sales_orders: true,
      delivery_challans: true,

      // POS
      pos_terminal: true,
      pos_refunds: true,
      barcode_scanning: true,
      multi_pos_terminals: true,  // Up to 5
      restaurant_pos: true,
      kitchen_display_system: true,
      table_management: true,
      offline_pos_mode: true,

      // ACCOUNTS
      expense_tracking: true,
      credit_notes: true,
      payment_allocations: true,
      fiscal_periods: true,
      tax_compliance: true,
      journal_entries: true,
      bank_reconciliation: true,
      chart_of_accounts: true,
      multi_currency: true,
      exchange_rates: true,  // NEW

      // OPERATIONS - Full operations
      multi_warehouse: true,
      batch_tracking: true,
      serial_tracking: true,
      manufacturing: true,
      bill_of_materials: true,
      production_orders: true,
      stock_reservations: true,
      stock_transfers: true,
      inventory_forecasting: true,

      // HR
      payroll_processing: false,
      salary_slips: false,
      tax_deductions: false,
      attendance_tracking: false,
      shift_scheduling: false,
      leave_management: false,
      employee_self_service: false,
      biometric_integration: false,

      // CRM
      loyalty_programs: true,
      customer_segmentation: true,
      campaigns_email_sms: true,
      promotions_discounts: true,
      price_lists: true,
      supplier_quotes: true,
      customer_portal: true,

      // INTELLIGENCE - Basic AI
      ai_analytics: true,
      ai_demand_forecasting: true,
      ai_smart_restock: true,
      ai_price_optimization: false,
      advanced_reports: true,
      custom_report_builder: true,
      predictive_insights: false,
      anomaly_detection: true,
      business_intelligence_dashboard: true,

      // GOVERNANCE
      approval_workflows: true,
      multi_level_approvals: false,
      audit_logs: false,
      audit_trail: false,
      multi_branch: true,  // Up to 3 branches
      multi_domain: false,
      role_based_access: true,
      data_retention_policies: false,

      // PLATFORM
      api_access: true,
      webhook_integrations: true,
      custom_workflows: true,
      third_party_integrations: true,
      zapier_integration: true,
      shopify_integration: true,
      woocommerce_integration: true,

      // SUPPORT
      priority_support: false,
      dedicated_account_manager: false,
      white_label: false,
      custom_domain: true,
    },
  },

  // ----------------------------------
  // TIER 5: BUSINESS - Multi-Location Operations
  // ----------------------------------
  business: {
    key: 'business',
    name: 'Business',
    tagline: 'Full ERP suite with HR, AI, and governance',
    description: 'Complete ERP with payroll, AI analytics, approval workflows, and multi-branch',
    price_pkr: 9999,
    price_usd: 49,
    billing: 'monthly',
    badge: 'Full ERP',
    
    // Included Module Packages
    included_modules: ['essentials', 'accounts', 'pos', 'crm', 'operations', 'hr', 'intelligence', 'governance'],
    
    limits: {
      max_users: 25,
      max_products: 50000,
      max_customers: 50000,
      max_vendors: 10000,
      max_warehouses: 25,
      max_invoices_per_month: 100000,
      max_pos_terminals: 15,
      max_storage_mb: 50000,
      max_branches: 10,
      max_transactions_per_month: 500000,
    },
    
    features: {
      // CORE ESSENTIALS
      invoicing: true,
      purchases: true,
      customers: true,
      vendors: true,
      basic_accounting: true,
      basic_reports: true,
      quotations: true,
      sales_orders: true,
      delivery_challans: true,

      // POS
      pos_terminal: true,
      pos_refunds: true,
      barcode_scanning: true,
      multi_pos_terminals: true,  // Up to 15
      restaurant_pos: true,
      kitchen_display_system: true,
      table_management: true,
      offline_pos_mode: true,

      // ACCOUNTS
      expense_tracking: true,
      credit_notes: true,
      payment_allocations: true,
      fiscal_periods: true,
      tax_compliance: true,
      journal_entries: true,
      bank_reconciliation: true,
      chart_of_accounts: true,
      multi_currency: true,
      exchange_rates: true,

      // OPERATIONS
      multi_warehouse: true,
      batch_tracking: true,
      serial_tracking: true,
      manufacturing: true,
      bill_of_materials: true,
      production_orders: true,
      stock_reservations: true,
      stock_transfers: true,
      inventory_forecasting: true,

      // HR - Full HR
      payroll_processing: true,
      salary_slips: true,
      tax_deductions: true,
      attendance_tracking: true,
      shift_scheduling: true,
      leave_management: true,
      employee_self_service: true,
      biometric_integration: true,

      // CRM
      loyalty_programs: true,
      customer_segmentation: true,
      campaigns_email_sms: true,
      promotions_discounts: true,
      price_lists: true,
      supplier_quotes: true,
      customer_portal: true,

      // INTELLIGENCE - Full AI
      ai_analytics: true,
      ai_demand_forecasting: true,
      ai_smart_restock: true,
      ai_price_optimization: true,
      advanced_reports: true,
      custom_report_builder: true,
      predictive_insights: true,
      anomaly_detection: true,
      business_intelligence_dashboard: true,

      // GOVERNANCE - Full governance
      approval_workflows: true,
      multi_level_approvals: true,
      audit_logs: true,
      audit_trail: true,
      multi_branch: true,
      multi_domain: false,
      role_based_access: true,
      data_retention_policies: true,

      // PLATFORM
      api_access: true,
      webhook_integrations: true,
      custom_workflows: true,
      third_party_integrations: true,
      zapier_integration: true,
      shopify_integration: true,
      woocommerce_integration: true,

      // SUPPORT
      priority_support: true,
      dedicated_account_manager: false,
      white_label: false,
      custom_domain: true,
    },
  },

  // ----------------------------------
  // TIER 6: ENTERPRISE - Custom Packages
  // ----------------------------------
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    tagline: 'Unlimited scale with custom packages',
    description: 'Negotiated pricing, custom feature bundles, dedicated support, and SLA guarantees',
    price_pkr: null,  // Custom pricing
    price_usd: null,
    billing: 'custom',
    badge: 'Custom',
    
    // Can pick any combination of modules
    included_modules: null,  // Custom selection
    
    limits: {
      max_users: -1,  // Unlimited
      max_products: -1,
      max_customers: -1,
      max_vendors: -1,
      max_warehouses: -1,
      max_invoices_per_month: -1,
      max_pos_terminals: -1,
      max_storage_mb: -1,
      max_branches: -1,
      max_transactions_per_month: -1,
    },
    
    // All features enabled - custom packages can exclude if needed
    features: Object.fromEntries(
      Object.keys(PLAN_TIERS.business.features).map(key => [key, true])
    ),
    
    // Enterprise-specific capabilities
    enterprise_features: {
      custom_development: true,
      sla_guarantee: true,
      dedicated_infrastructure: true,
      custom_integrations: true,
      data_residency_options: true,
      advanced_security_compliance: true,
      white_label_rebranding: true,
      multi_tenant_management: true,
    },
  },
};

// ============================================
// MODULE PICKER CONFIGURATION
// ============================================

/**
 * Module picker allows users to build custom plans by selecting individual modules
 * Base price + sum of selected module prices
 */
export const MODULE_PICKER_CONFIG = {
  // Minimum base tier required for module picker
  min_base_tier: 'starter',
  
  // Base price for custom package (includes essentials)
  base_price_pkr: 999,
  base_price_usd: 5,
  
  // Available modules for picking (after Growth tier)
  available_modules: [
    'accounts',
    'pos',
    'operations',
    'hr',
    'crm',
    'intelligence',
    'governance',
    'platform',
  ],
  
  // Bundle discounts
  bundle_discounts: {
    any_3_modules: 0.10,  // 10% off
    any_5_modules: 0.20,  // 20% off
    all_modules: 0.30,    // 30% off
  },
};

// ============================================
// ADD-ONS CONFIGURATION
// ============================================

export const ADDONS = {
  // POS Terminals
  pos_terminal: {
    name: 'Additional POS Terminal',
    price_pkr: 299,
    price_usd: 1,
    description: 'Add an extra POS terminal to your location',
    available_from_tier: 'starter',
    max_quantity: 100,
  },
  
  // Storage
  storage_10gb: {
    name: 'Additional Storage (10GB)',
    price_pkr: 199,
    price_usd: 0.75,
    description: 'Extra 10GB storage for documents and attachments',
    available_from_tier: 'free',
    max_quantity: 1000,
  },
  
  // Users
  additional_user: {
    name: 'Additional User',
    price_pkr: 399,
    price_usd: 1.50,
    description: 'Add an extra team member beyond your tier limit',
    available_from_tier: 'starter',
    max_quantity: 500,
  },
  
  // Priority Support
  priority_support: {
    name: 'Priority Support',
    price_pkr: 999,
    price_usd: 4,
    description: '24/7 priority support with 2-hour response guarantee',
    available_from_tier: 'starter',
    max_quantity: 1,
  },
  
  // White Label
  white_label: {
    name: 'White Label Branding',
    price_pkr: 2499,
    price_usd: 10,
    description: 'Remove Tenvo branding and use your own logo and colors',
    available_from_tier: 'growth',
    max_quantity: 1,
  },
  
  // Custom Domain
  custom_domain: {
    name: 'Custom Domain',
    price_pkr: 499,
    price_usd: 2,
    description: 'Use your own domain for the customer portal',
    available_from_tier: 'growth',
    max_quantity: 1,
  },
  
  // Advanced API
  api_advanced: {
    name: 'Advanced API Access',
    price_pkr: 1499,
    price_usd: 6,
    description: 'Higher rate limits and advanced API endpoints',
    available_from_tier: 'starter',
    max_quantity: 1,
  },
};

// ============================================
// FEATURE LABELS (Human Readable)
// ============================================

export const FEATURE_LABELS = {
  // CORE
  invoicing: 'Unlimited Invoicing',
  purchases: 'Purchase Order Management',
  customers: 'Customer Management',
  vendors: 'Vendor Management',
  basic_accounting: 'Basic Accounting',
  basic_reports: 'Basic Reports (50+)',
  quotations: 'Quotations & Estimates',
  sales_orders: 'Sales Orders',
  delivery_challans: 'Delivery Challans',

  // POS
  pos_terminal: 'POS Terminal',
  pos_refunds: 'POS Refunds & Returns',
  barcode_scanning: 'Barcode Scanning',
  multi_pos_terminals: 'Multiple POS Terminals',
  restaurant_pos: 'Restaurant POS',
  kitchen_display_system: 'Kitchen Display System (KDS)',
  table_management: 'Table & Floor Management',
  offline_pos_mode: 'Offline POS Mode',

  // ACCOUNTS
  expense_tracking: 'Expense Tracking',
  credit_notes: 'Credit Notes',
  payment_allocations: 'Payment Allocations',
  fiscal_periods: 'Fiscal Period Management',
  tax_compliance: 'Tax / GST Compliance',
  journal_entries: 'Journal Entries',
  bank_reconciliation: 'Bank Reconciliation',
  chart_of_accounts: 'Chart of Accounts',
  multi_currency: 'Multi-Currency Support',
  exchange_rates: 'Exchange Rate Management',

  // OPERATIONS
  multi_warehouse: 'Multi-Warehouse Management',
  batch_tracking: 'Batch Tracking',
  serial_tracking: 'Serial Number Tracking',
  manufacturing: 'Manufacturing & BOM',
  bill_of_materials: 'Bill of Materials',
  production_orders: 'Production Orders',
  stock_reservations: 'Stock Reservations',
  stock_transfers: 'Inter-Warehouse Transfers',
  inventory_forecasting: 'Inventory Forecasting',

  // HR
  payroll_processing: 'Payroll Processing',
  salary_slips: 'Automated Salary Slips',
  tax_deductions: 'Tax Deductions (Pakistani Tax)',
  attendance_tracking: 'Attendance Tracking',
  shift_scheduling: 'Shift Scheduling',
  leave_management: 'Leave Management',
  employee_self_service: 'Employee Self-Service Portal',
  biometric_integration: 'Biometric Integration',

  // CRM
  loyalty_programs: 'Loyalty Programs',
  customer_segmentation: 'Customer Segmentation',
  campaigns_email_sms: 'Email & SMS Campaigns',
  promotions_discounts: 'Promotions & Discounts',
  price_lists: 'Multiple Price Lists',
  supplier_quotes: 'Supplier Quote Management',
  customer_portal: 'Customer Self-Service Portal',

  // INTELLIGENCE
  ai_analytics: 'AI-Powered Analytics',
  ai_demand_forecasting: 'AI Demand Forecasting',
  ai_smart_restock: 'AI Smart Restock Alerts',
  ai_price_optimization: 'AI Price Optimization',
  advanced_reports: 'Advanced Reports',
  custom_report_builder: 'Custom Report Builder',
  predictive_insights: 'Predictive Business Insights',
  anomaly_detection: 'Anomaly Detection',
  business_intelligence_dashboard: 'BI Dashboard',

  // GOVERNANCE
  approval_workflows: 'Approval Workflows',
  multi_level_approvals: 'Multi-Level Approvals',
  audit_logs: 'Audit Logs',
  audit_trail: 'Complete Audit Trail',
  multi_branch: 'Multi-Branch Management',
  multi_domain: 'Multi-Domain Support',
  role_based_access: 'Role-Based Access Control',
  data_retention_policies: 'Data Retention Policies',

  // PLATFORM
  api_access: 'API Access',
  webhook_integrations: 'Webhook Integrations',
  custom_workflows: 'Custom Workflows',
  third_party_integrations: 'Third-Party Integrations',
  zapier_integration: 'Zapier Integration',
  shopify_integration: 'Shopify Integration',
  woocommerce_integration: 'WooCommerce Integration',

  // SUPPORT
  priority_support: 'Priority Support (2hr response)',
  dedicated_account_manager: 'Dedicated Account Manager',
  white_label: 'White-Label Branding',
  custom_domain: 'Custom Domain',
};

// ============================================
// TEVNO ADVANTAGES OVER ZOHO
// ============================================

export const TENVO_ADVANTAGES = {
  // Price advantages
  pricing: {
    title: 'Better Pricing for Pakistan',
    points: [
      'Starter: ₹999 vs Zoho Standard ₹2,000+',
      'Growth: ₹2,499 vs Zoho Professional ₹5,000+',
      'No per-user pricing - unlimited users within tier',
      'Free tier includes 100 customers (Zoho: 50K revenue limit)',
    ],
  },
  
  // Feature advantages
  features: {
    title: 'Superior Features',
    points: [
      'AI-powered demand forecasting (Zoho: Only in highest tiers)',
      'Offline POS mode (Zoho: Internet required)',
      'Pakistani tax compliance built-in (Zoho: Generic)',
      'Urdu language support (Zoho: Limited)',
      'Biometric integration for attendance (Zoho: Not available)',
      'Restaurant KDS included in Growth (Zoho: Separate product)',
    ],
  },
  
  // Integration advantages
  integrations: {
    title: 'Better Integration',
    points: [
      'Shopify integration in Growth tier (Zoho: Elite only)',
      'WooCommerce native support',
      'Local Pakistani payment gateways (Easypaisa, JazzCash)',
      'FBR tax integration',
      'SMS gateways (Twilio, local providers)',
    ],
  },
  
  // Support advantages
  support: {
    title: 'Local Support',
    points: [
      'Urdu support available',
      'Pakistan business hours support',
      'Local phone numbers for support',
      'On-site training available (Enterprise)',
    ],
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const PLAN_ORDER = { 
  free: 0, 
  starter: 1, 
  growth: 2, 
  professional: 3, 
  business: 4, 
  enterprise: 5 
};

export const PLAN_ALIASES = {
  basic: 'free',
  standard: 'starter',
  premium: 'business',
  // Legacy mappings
  professional_old: 'growth',
};

export function resolvePlanTier(tier) {
  if (PLAN_TIERS[tier]) return tier;
  return PLAN_ALIASES[tier] || 'free';
}

export function planHasFeature(planTier, feature) {
  const resolved = resolvePlanTier(planTier);
  const plan = PLAN_TIERS[resolved];
  if (!plan) return false;
  return plan.features[feature] === true;
}

export function planWithinLimit(planTier, limitKey, currentCount) {
  const resolved = resolvePlanTier(planTier);
  const plan = PLAN_TIERS[resolved];
  if (!plan) return false;
  const limit = plan.limits[limitKey];
  if (limit === -1) return true;
  return currentCount < limit;
}

export function planAtLeast(planA, planB) {
  const resolvedA = resolvePlanTier(planA);
  const resolvedB = resolvePlanTier(planB);
  return (PLAN_ORDER[resolvedA] || 0) >= (PLAN_ORDER[resolvedB] || 0);
}

export function getUpgradeBenefits(currentTier, targetTier) {
  const resolvedCurrent = resolvePlanTier(currentTier);
  const resolvedTarget = resolvePlanTier(targetTier);
  const currentPlan = PLAN_TIERS[resolvedCurrent];
  const targetPlan = PLAN_TIERS[resolvedTarget];
  if (!currentPlan || !targetPlan) return [];

  return Object.keys(targetPlan.features)
    .filter(f => targetPlan.features[f] && !currentPlan.features[f])
    .map(f => FEATURE_LABELS[f] || f);
}

export function getNextTier(currentTier) {
  const resolved = resolvePlanTier(currentTier);
  const tiers = Object.keys(PLAN_ORDER);
  const idx = tiers.indexOf(resolved);
  return idx >= 0 && idx < tiers.length - 1 ? tiers[idx + 1] : null;
}

export function getAllPlansOrdered() {
  return Object.keys(PLAN_ORDER)
    .sort((a, b) => PLAN_ORDER[a] - PLAN_ORDER[b])
    .map(key => PLAN_TIERS[key]);
}

/**
 * Calculate custom package price based on selected modules
 */
export function calculateCustomPackagePrice(selectedModules, currency = 'pkr') {
  const { base_price_pkr, base_price_usd, bundle_discounts } = MODULE_PICKER_CONFIG;
  const priceKey = currency === 'pkr' ? 'standalone_price_pkr' : 'standalone_price_usd';
  const basePrice = currency === 'pkr' ? base_price_pkr : base_price_usd;
  
  let moduleTotal = selectedModules.reduce((sum, moduleKey) => {
    const module = MODULE_PACKAGES[moduleKey];
    return sum + (module ? module[priceKey] : 0);
  }, 0);
  
  // Apply bundle discount
  let discount = 0;
  if (selectedModules.length >= 5) {
    discount = bundle_discounts.all_modules;
  } else if (selectedModules.length >= 3) {
    discount = bundle_discounts.any_3_modules;
  } else if (selectedModules.length >= 5) {
    discount = bundle_discounts.any_5_modules;
  }
  
  const finalPrice = Math.round((basePrice + moduleTotal) * (1 - discount));
  
  return {
    basePrice,
    moduleTotal,
    discount,
    discountAmount: Math.round((basePrice + moduleTotal) * discount),
    finalPrice,
  };
}

/**
 * Get features by module package
 */
export function getModuleFeatures(moduleKey) {
  const module = MODULE_PACKAGES[moduleKey];
  if (!module) return [];
  
  return module.features.map(featureKey => ({
    key: featureKey,
    label: FEATURE_LABELS[featureKey] || featureKey,
  }));
}

/**
 * Get included modules for a tier
 */
export function getTierModules(tierKey) {
  const tier = PLAN_TIERS[tierKey];
  if (!tier || !tier.included_modules) return [];
  
  return tier.included_modules.map(moduleKey => ({
    key: moduleKey,
    ...MODULE_PACKAGES[moduleKey],
  }));
}

// ============================================
// LEGACY COMPATIBILITY
// ============================================

// Keep backward compatibility with old feature names
export const LEGACY_FEATURE_MAP = {
  'basic_accounting': ['accounts'],
  'pos': ['pos_terminal', 'pos_refunds', 'barcode_scanning'],
  'finance': ['expense_tracking', 'credit_notes', 'payment_allocations', 'fiscal_periods'],
  'operations': ['multi_warehouse', 'batch_tracking', 'serial_tracking', 'manufacturing'],
  'crm': ['loyalty_programs', 'campaigns_email_sms', 'promotions_discounts'],
  'hr': ['payroll_processing', 'attendance_tracking', 'shift_scheduling'],
  'intelligence': ['ai_analytics', 'ai_demand_forecasting', 'ai_smart_restock'],
  'governance': ['approval_workflows', 'audit_logs', 'multi_branch'],
};

export function getLegacyModuleFeatures(moduleName) {
  const features = LEGACY_FEATURE_MAP[moduleName];
  if (!features) return [];
  
  return features.map(key => ({
    key,
    label: FEATURE_LABELS[key] || key,
  }));
}
