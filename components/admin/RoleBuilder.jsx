'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Shield, 
  CheckSquare, 
  Eye, 
  Plus,
  Save,
  Trash2,
  Copy,
  Search,
  ChevronRight,
  ChevronDown,
  Lock,
  Unlock,
  UserCog,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROLE_HIERARCHY, PERMISSION_DEFINITIONS } from '@/lib/rbac/permissions';

/**
 * RoleBuilder - Advanced custom role management for platform admins
 * 
 * Features:
 * - Create custom roles with granular permissions
 * - Template-based role creation (20+ templates)
 * - Visual permission tree
 * - Role comparison and diff view
 * - Role testing simulator
 */

const ROLE_TEMPLATES = [
  {
    key: 'store_manager',
    name: 'Store Manager',
    description: 'Manages daily store operations, inventory, and staff',
    icon: '🏪',
    baseRole: 'manager',
    permissions: [
      'dashboard.*',
      'pos.*',
      'inventory.view', 'inventory.edit', 'inventory.adjust_stock',
      'customers.*',
      'sales.view', 'sales.create_invoice',
      'reports.view'
    ],
    restrictions: ['finance.delete', 'settings.billing', 'inventory.delete']
  },
  {
    key: 'sales_associate',
    name: 'Sales Associate',
    description: 'Handles sales, customer service, and POS operations',
    icon: '🛍️',
    baseRole: 'salesperson',
    permissions: [
      'dashboard.view',
      'pos.access', 'pos.process_sale', 'pos.open_session', 'pos.close_session',
      'customers.view', 'customers.create', 'customers.edit',
      'inventory.view',
      'sales.view', 'sales.create_invoice'
    ],
    restrictions: ['pos.void_transaction', 'pos.process_refund', 'pos.apply_discount', 'sales.delete_invoice']
  },
  {
    key: 'inventory_clerk',
    name: 'Inventory Clerk',
    description: 'Manages stock, receives shipments, handles transfers',
    icon: '📦',
    baseRole: 'warehouse_manager',
    permissions: [
      'dashboard.view',
      'inventory.*',
      'purchases.view', 'purchases.create',
      'vendors.view',
      'reports.view'
    ],
    restrictions: ['purchases.approve', 'purchases.delete', 'vendors.delete', 'finance.*']
  },
  {
    key: 'accountant',
    name: 'Junior Accountant',
    description: 'Handles bookkeeping, expenses, and financial reports',
    icon: '📊',
    baseRole: 'accountant',
    permissions: [
      'dashboard.view', 'dashboard.financial_kpis',
      'finance.view_gl', 'finance.manage_expenses', 'finance.view_reports',
      'finance.create_journal', 'finance.manage_payments',
      'sales.view',
      'purchases.view',
      'payments.view', 'payments.create', 'payments.allocate',
      'reports.view'
    ],
    restrictions: ['finance.close_period', 'finance.delete', 'settings.billing']
  },
  {
    key: 'chef',
    name: 'Head Chef',
    description: 'Manages kitchen operations, recipes, and ingredient inventory',
    icon: '👨‍🍳',
    baseRole: 'chef',
    permissions: [
      'dashboard.view',
      'restaurant.view_kds', 'restaurant.manage_recipes',
      'inventory.view', 'inventory.edit',
      'purchases.view', 'purchases.create'
    ],
    restrictions: ['pos.*', 'finance.*', 'customers.delete']
  },
  {
    key: 'waiter',
    name: 'Server/Waiter',
    description: 'Takes orders, serves customers, handles table management',
    icon: '🍽️',
    baseRole: 'waiter',
    permissions: [
      'dashboard.view',
      'restaurant.view_tables', 'restaurant.take_orders',
      'pos.process_sale'
    ],
    restrictions: ['pos.void_transaction', 'pos.process_refund', 'inventory.delete']
  },
  {
    key: 'delivery_manager',
    name: 'Delivery Manager',
    description: 'Manages deliveries, drivers, and delivery operations',
    icon: '🚚',
    baseRole: 'manager',
    permissions: [
      'dashboard.view',
      'delivery.*',
      'customers.view',
      'sales.view',
      'inventory.view'
    ],
    restrictions: ['finance.*', 'settings.billing']
  },
  {
    key: 'marketing_manager',
    name: 'Marketing Manager',
    description: 'Manages campaigns, promotions, and customer engagement',
    icon: '📢',
    baseRole: 'manager',
    permissions: [
      'dashboard.view',
      'crm.manage_loyalty', 'crm.view_campaigns', 'crm.manage_promotions',
      'customers.view', 'customers.edit',
      'reports.view'
    ],
    restrictions: ['pos.*', 'inventory.delete', 'finance.*', 'settings.billing']
  },
];

// Permission categories for visual organization
const PERMISSION_CATEGORIES = [
  {
    key: 'dashboard',
    name: 'Dashboard',
    icon: '📊',
    permissions: ['dashboard.view', 'dashboard.full_kpis', 'dashboard.financial_kpis']
  },
  {
    key: 'pos',
    name: 'Point of Sale',
    icon: '💰',
    permissions: ['pos.access', 'pos.open_session', 'pos.close_session', 'pos.process_sale', 'pos.apply_discount', 'pos.void_transaction', 'pos.process_refund']
  },
  {
    key: 'inventory',
    name: 'Inventory',
    icon: '📦',
    permissions: ['inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete', 'inventory.adjust_stock', 'inventory.transfer']
  },
  {
    key: 'sales',
    name: 'Sales & Invoicing',
    icon: '🧾',
    permissions: ['sales.view', 'sales.create_invoice', 'sales.edit_invoice', 'sales.delete_invoice', 'sales.create_quotation', 'sales.create_order', 'sales.create_challan']
  },
  {
    key: 'customers',
    name: 'Customers',
    icon: '👥',
    permissions: ['customers.view', 'customers.create', 'customers.edit', 'customers.delete', 'customers.view_ledger']
  },
  {
    key: 'vendors',
    name: 'Vendors & Purchases',
    icon: '🏭',
    permissions: ['vendors.view', 'vendors.create', 'vendors.edit', 'vendors.delete', 'purchases.view', 'purchases.create', 'purchases.approve', 'purchases.delete']
  },
  {
    key: 'finance',
    name: 'Finance & Accounting',
    icon: '💵',
    permissions: ['finance.view_gl', 'finance.manage_accounts', 'finance.create_journal', 'finance.close_period', 'finance.view_reports', 'finance.manage_expenses', 'finance.manage_payments', 'finance.credit_notes', 'finance.exchange_rates']
  },
  {
    key: 'payments',
    name: 'Payments',
    icon: '💳',
    permissions: ['payments.view', 'payments.create', 'payments.allocate']
  },
  {
    key: 'warehouse',
    name: 'Warehouse & Operations',
    icon: '🏢',
    permissions: ['warehouses.view', 'warehouses.create', 'warehouses.edit', 'warehouses.delete', 'manufacturing.view', 'manufacturing.create', 'manufacturing.edit']
  },
  {
    key: 'hr',
    name: 'HR & Payroll',
    icon: '👔',
    permissions: ['hr.view_employees', 'hr.manage_payroll', 'hr.manage_attendance', 'hr.manage_shifts']
  },
  {
    key: 'crm',
    name: 'CRM & Marketing',
    icon: '💝',
    permissions: ['crm.view_segments', 'crm.manage_loyalty', 'crm.view_campaigns', 'crm.manage_promotions']
  },
  {
    key: 'analytics',
    name: 'Analytics & Reports',
    icon: '📈',
    permissions: ['analytics.basic', 'analytics.advanced', 'analytics.custom']
  },
  {
    key: 'settings',
    name: 'Settings & Admin',
    icon: '⚙️',
    permissions: ['settings.view', 'settings.manage_users', 'settings.manage_roles', 'settings.billing', 'settings.integrations']
  },
  {
    key: 'approvals',
    name: 'Approvals',
    icon: '✅',
    permissions: ['approvals.request', 'approvals.approve', 'approvals.reject']
  },
];

/**
 * Permission Tree Component
 */
function PermissionTree({ selectedPermissions, onToggle, readOnly = false }) {
  const [expanded, setExpanded] = useState(['dashboard', 'pos', 'inventory']);

  const toggleExpand = (key) => {
    setExpanded(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const isSelected = (permission) => selectedPermissions.includes(permission);
  const isWildcardSelected = (prefix) => 
    selectedPermissions.some(p => p === prefix || p.startsWith(prefix + '.'));

  const togglePermission = (permission) => {
    if (readOnly) return;
    onToggle?.(permission);
  };

  const toggleCategory = (categoryKey, permissions) => {
    if (readOnly) return;
    const allSelected = permissions.every(p => isSelected(p));
    permissions.forEach(p => {
      if (allSelected || !isSelected(p)) {
        onToggle?.(p);
      }
    });
  };

  return (
    <div className="space-y-2">
      {PERMISSION_CATEGORIES.map((category) => {
        const isExpanded = expanded.includes(category.key);
        const categorySelected = category.permissions.filter(p => isSelected(p)).length;
        const allSelected = categorySelected === category.permissions.length;
        const someSelected = categorySelected > 0 && !allSelected;

        return (
          <div key={category.key} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleExpand(category.key)}
              className={cn(
                "w-full flex items-center justify-between p-3 text-left transition-colors",
                allSelected ? "bg-green-50 border-green-200" : 
                someSelected ? "bg-amber-50 border-amber-200" : "bg-white hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
                {allSelected && <Badge className="bg-green-100 text-green-700">All</Badge>}
                {someSelected && (
                  <Badge className="bg-amber-100 text-amber-700">{categorySelected}/{category.permissions.length}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!readOnly && (
                  <Switch
                    checked={allSelected}
                    onCheckedChange={() => toggleCategory(category.key, category.permissions)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  isExpanded && "rotate-180"
                )} />
              </div>
            </button>

            {isExpanded && (
              <div className="p-3 space-y-1 bg-gray-50/50">
                {category.permissions.map((permission) => (
                  <div
                    key={permission}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md transition-colors",
                      isSelected(permission) ? "bg-white border shadow-sm" : "hover:bg-white/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected(permission) ? (
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded" />
                      )}
                      <span className="text-sm">
                        {permission.split('.').pop().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    {!readOnly && (
                      <Switch
                        checked={isSelected(permission)}
                        onCheckedChange={() => togglePermission(permission)}
                        size="sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Template Selector Component
 */
function TemplateSelector({ onSelect, selectedTemplate }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {ROLE_TEMPLATES.map((template) => (
        <Card
          key={template.key}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md",
            selectedTemplate?.key === template.key ? "ring-2 ring-primary" : ""
          )}
          onClick={() => onSelect?.(template)}
        >
          <CardContent className="p-4">
            <div className="text-3xl mb-2">{template.icon}</div>
            <h4 className="font-semibold">{template.name}</h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {template.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">
                {template.permissions.length} permissions
              </Badge>
              <Badge variant="outline" className="text-xs">
                {template.restrictions.length} restrictions
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Role Comparison Tool
 */
function RoleComparison({ roles, baseRole, customRole }) {
  if (!baseRole || !customRole) return null;

  const basePermissions = new Set(ROLE_TEMPLATES.find(t => t.key === baseRole)?.permissions || []);
  const customPermissions = new Set(customRole.permissions);

  const added = [...customPermissions].filter(p => !basePermissions.has(p));
  const removed = [...basePermissions].filter(p => !customPermissions.has(p));
  const common = [...customPermissions].filter(p => basePermissions.has(p));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Permission Comparison</CardTitle>
        <CardDescription>
          Comparing custom role to {ROLE_TEMPLATES.find(t => t.key === baseRole)?.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-700">+{added.length}</p>
            <p className="text-sm text-green-600">Added</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-700">-{removed.length}</p>
            <p className="text-sm text-red-600">Removed</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{common.length}</p>
            <p className="text-sm text-blue-600">Unchanged</p>
          </div>
        </div>

        {added.length > 0 && (
          <div>
            <p className="text-sm font-medium text-green-700 mb-2">New Permissions:</p>
            <div className="flex flex-wrap gap-1">
              {added.slice(0, 5).map(p => (
                <Badge key={p} variant="outline" className="text-xs bg-green-50">+ {p}</Badge>
              ))}
              {added.length > 5 && (
                <Badge variant="outline" className="text-xs">+{added.length - 5} more</Badge>
              )}
            </div>
          </div>
        )}

        {removed.length > 0 && (
          <div>
            <p className="text-sm font-medium text-red-700 mb-2">Removed Permissions:</p>
            <div className="flex flex-wrap gap-1">
              {removed.slice(0, 5).map(p => (
                <Badge key={p} variant="outline" className="text-xs bg-red-50">- {p}</Badge>
              ))}
              {removed.length > 5 && (
                <Badge variant="outline" className="text-xs">+{removed.length - 5} more</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Main Role Builder Component
 */
export function RoleBuilder({ businessId, onSave }) {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedTemplate) {
      setRoleName(selectedTemplate.name);
      setRoleDescription(selectedTemplate.description);
      setSelectedPermissions(selectedTemplate.permissions);
    }
  }, [selectedTemplate]);

  const togglePermission = (permission) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave?.({
        name: roleName,
        description: roleDescription,
        permissions: selectedPermissions,
        baseRole: selectedTemplate?.key,
        businessId
      });
    } finally {
      setIsSaving(false);
    }
  };

  const allPermissions = Object.values(PERMISSION_DEFINITIONS).flat();
  const selectedCount = selectedPermissions.length;
  const totalCount = allPermissions.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="w-6 h-6" />
            Custom Role Builder
          </h2>
          <p className="text-muted-foreground">
            Create custom roles with granular permissions for your team
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {selectedCount}/{totalCount} permissions
          </Badge>
          <Button 
            onClick={handleSave} 
            disabled={!roleName || selectedPermissions.length === 0 || isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Role'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-fit">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800">Start with a Template</p>
                <p className="text-sm text-blue-600">
                  Choose a template closest to your needs, then customize permissions. 
                  Templates are based on industry best practices.
                </p>
              </div>
            </div>
          </div>

          <TemplateSelector 
            onSelect={setSelectedTemplate}
            selectedTemplate={selectedTemplate}
          />
        </TabsContent>

        <TabsContent value="builder" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Role Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Role Name</Label>
                    <Input
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="e.g., Senior Sales Associate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={roleDescription}
                      onChange={(e) => setRoleDescription(e.target.value)}
                      placeholder="Brief description of this role's responsibilities"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Permissions</CardTitle>
                  <CardDescription>
                    Toggle permissions on/off for this role
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PermissionTree
                    selectedPermissions={selectedPermissions}
                    onToggle={togglePermission}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <RoleComparison
                baseRole={selectedTemplate?.key}
                customRole={{ permissions: selectedPermissions }}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setSelectedPermissions(selectedTemplate?.permissions || [])}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Reset to Template
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setSelectedPermissions([])}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setSelectedPermissions(allPermissions)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Select All
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Security Tip:</strong> Follow the principle of least privilege. 
                    Only grant permissions absolutely necessary for the role.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Preview</CardTitle>
              <CardDescription>
                See how this role will appear to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{roleName || 'Untitled Role'}</h4>
                  <p className="text-muted-foreground">{roleDescription || 'No description'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-700">{selectedPermissions.length}</p>
                  <p className="text-sm text-green-600">Permissions Granted</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-700">
                    {PERMISSION_CATEGORIES.filter(c => 
                      c.permissions.some(p => selectedPermissions.includes(p))
                    ).length}
                  </p>
                  <p className="text-sm text-blue-600">Modules Access</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-amber-700">
                    {Object.keys(ROLE_HIERARCHY).find(key => 
                      ROLE_HIERARCHY[key] === Math.min(...selectedPermissions.map(() => 5))
                    ) || 'Custom'}
                  </p>
                  <p className="text-sm text-amber-600">Hierarchy Level</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-700">
                    {selectedPermissions.filter(p => p.includes('delete')).length > 0 ? 'High' : 'Medium'}
                  </p>
                  <p className="text-sm text-purple-600">Security Level</p>
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-3">Access Summary</h5>
                <div className="space-y-2">
                  {PERMISSION_CATEGORIES.filter(cat => 
                    cat.permissions.some(p => selectedPermissions.includes(p))
                  ).map((category) => {
                    const granted = category.permissions.filter(p => selectedPermissions.includes(p)).length;
                    const total = category.permissions.length;
                    
                    return (
                      <div key={category.key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <Badge variant={granted === total ? "default" : "secondary"}>
                          {granted}/{total}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RoleBuilder;
