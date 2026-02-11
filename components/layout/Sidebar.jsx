'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  BarChart3,
  Settings,
  Truck,
  History,
  X,
  ChevronRight,
  Building2,
  Factory,
  Warehouse,
  Layers,
  Hash,
  Receipt,
  ClipboardList,
  TrendingUp,
  ArrowLeftRight,
  PlusCircle,
  LayoutGrid,
  CreditCard
} from 'lucide-react';
import { getDomainColors } from '@/lib/domainColors';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/context/AuthContext';
import { useBusiness } from '@/lib/context/BusinessContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { translations } from '@/lib/translations';
import { UserManager } from '../auth/UserManager';
import { Plus, Zap, Globe } from 'lucide-react';
import { LanguageToggle } from '../LanguageToggle';

export function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const { business, role } = useBusiness();
  const { language } = useLanguage();
  const t = translations[language];
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';

  // Extract category from pathname if present
  // Expected format: /business/[category]/...
  const pathParts = pathname?.split('/') || [];
  const category = pathParts[2] || 'retail-shop';
  const baseUrl = `/business/${category}`;

  // Robust color handling with fallbacks
  const domainColors = getDomainColors(category);
  const colors = {
    primary: domainColors?.primary || '#8B1538', // Fallback to wine
    primaryLight: domainColors?.primaryLight || (domainColors?.primary ? `${domainColors.primary}dd` : '#A41941'),
    secondary: domainColors?.secondary || '#FDF2F4'
  };

  // Get domain-specific capabilities
  const domainKnowledge = getDomainKnowledge(category);

  // Build navigation items based on domain capabilities
  const allNavItems = [
    // Core items - Always visible (Role: owner, admin, accountant, salesperson, manager)
    {
      label: t.dashboard,
      icon: LayoutDashboard,
      href: baseUrl,
      tab: 'dashboard',
      roles: ['owner', 'admin', 'accountant', 'salesperson', 'manager'],
      alwaysShow: true
    },
    {
      label: t.sales_invoices,
      icon: ShoppingCart,
      href: `${baseUrl}?tab=invoices`,
      tab: 'invoices',
      roles: ['owner', 'admin', 'accountant', 'salesperson', 'manager'],
      alwaysShow: true
    },
    {
      label: t.inventory,
      icon: Package,
      href: `${baseUrl}?tab=inventory`,
      tab: 'inventory',
      roles: ['owner', 'admin', 'accountant', 'salesperson', 'manager'],
      alwaysShow: true
    },

    {
      label: t.sales,
      icon: TrendingUp,
      href: `${baseUrl}?tab=sales`,
      tab: 'sales',
      roles: ['owner', 'admin', 'accountant', 'salesperson', 'manager'],
      alwaysShow: true
    },
    {
      label: t.customers,
      icon: Users,
      href: `${baseUrl}?tab=customers`,
      tab: 'customers',
      roles: ['owner', 'admin', 'accountant', 'salesperson', 'manager'],
      alwaysShow: true
    },

    // Sales & Orders - Extended
    {
      label: t.quotations_orders,
      icon: ClipboardList,
      href: `${baseUrl}?tab=quotations`,
      tab: 'quotations',
      roles: ['owner', 'admin', 'manager', 'salesperson'],
      condition: domainKnowledge?.inventoryFeatures?.includes('Quotation Management')
    },

    // Vendors - Separate from Purchase Orders
    {
      label: t.vendors,
      icon: Building2,
      href: `${baseUrl}?tab=vendors`,
      tab: 'vendors',
      roles: ['owner', 'admin', 'accountant', 'manager'],
      alwaysShow: true
    },
    {
      label: t.purchase_orders,
      icon: Truck,
      href: `${baseUrl}?tab=purchases`,
      tab: 'purchases',
      roles: ['owner', 'admin', 'accountant', 'manager'],
      alwaysShow: true
    },

    // Domain-specific features - Conditional
    {
      label: t.manufacturing,
      icon: Factory,
      href: `${baseUrl}/manufacturing`,
      roles: ['owner', 'admin', 'manager'],
      condition: domainKnowledge?.manufacturingEnabled
    },

    {
      label: t.multi_location,
      icon: Warehouse,
      href: `${baseUrl}?tab=warehouses`,
      tab: 'warehouses',
      roles: ['owner', 'admin', 'manager'],
      condition: domainKnowledge?.multiLocationEnabled
    },
    {
      label: t.batch_tracking,
      icon: Layers,
      href: `${baseUrl}?tab=batches`,
      tab: 'batches',
      roles: ['owner', 'admin', 'manager'],
      condition: domainKnowledge?.batchTrackingEnabled
    },
    {
      label: t.serial_numbers,
      icon: Hash,
      href: `${baseUrl}?tab=serials`,
      tab: 'serials',
      roles: ['owner', 'admin', 'manager'],
      condition: domainKnowledge?.serialTrackingEnabled
    },

    // Finance & Accounting
    {
      label: t.accounting,
      icon: FileText,
      href: `${baseUrl}?tab=accounting`,
      tab: 'accounting',
      roles: ['owner', 'admin', 'accountant'],
      alwaysShow: true
    },
    {
      label: t.payments,
      icon: CreditCard,
      href: `${baseUrl}?tab=payments`,
      tab: 'payments',
      roles: ['owner', 'admin', 'accountant'],
      alwaysShow: true
    },
    {
      label: t.general_ledger,
      icon: History,
      href: `${baseUrl}/finance/general-ledger`,
      tab: 'general-ledger',
      roles: ['owner', 'admin', 'accountant'],
      alwaysShow: true
    },
    {
      label: t.reports,
      icon: BarChart3,
      href: `${baseUrl}?tab=reports`,
      tab: 'reports',
      roles: ['owner', 'admin', 'accountant', 'manager'],
      alwaysShow: true
    },
    {
      label: t.tax_gst,
      icon: Receipt,
      href: `${baseUrl}?tab=gst`,
      tab: 'gst',
      roles: ['owner', 'admin', 'accountant'],
      alwaysShow: true
    },
    {
      label: t.settings,
      icon: Settings,
      href: `${baseUrl}?tab=settings`,
      tab: 'settings',
      roles: ['owner', 'admin'],
      alwaysShow: true
    },
  ];

  // Filter items based on role and domain capabilities
  const navItems = allNavItems.filter(item => {
    // Check role permission (default to owner if loading/null)
    const effectiveRole = role || 'owner';
    const hasRole = item.roles.includes(effectiveRole);
    // Check domain condition (if specified)
    const meetsCondition = item.alwaysShow || item.condition === true;
    return hasRole && meetsCondition;
  });

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden user-select-none"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 w-64 bg-white border-e border-gray-200 shadow-sm transform transition-transform duration-300 lg:translate-x-0 flex flex-col h-screen",
          isOpen ? "translate-x-0" : (language === 'ur' ? "translate-x-full" : "-translate-x-full")
        )}
      >
        {/* Header / Business Branding */}
        <div className="flex-none flex flex-col gap-3 px-4 py-6 border-b border-gray-100">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div
              className="w-10 h-10 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg transform -rotate-3 transition-transform hover:rotate-0"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)` }}
            >
              {language === 'ur' ? 'ٹ' : 'T'}
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="font-black text-gray-900 text-2xl tracking-tighter uppercase">{t.app_name}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ps-0.5">Enterprise Hub</span>
            </div>
          </Link>

          {/* Business Name - Dynamic Branding */}
          {business?.name && (
            <div className="flex items-center gap-3 p-3.5 bg-gray-50/50 border border-gray-100/50 rounded-2xl mt-4 relative overflow-hidden group">
              <div
                className="absolute inset-y-0 left-0 w-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: colors.primary }}
              />
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0"
                style={{ backgroundColor: colors.primary }}
              >
                {business.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-black text-gray-900 text-sm truncate leading-tight">
                  {business.name}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest truncate">
                    {business.domain?.replace(/-/g, ' ') || 'Dashboard'}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1.5">
          {navItems.map((item) => {
            // Improved active state logic
            const isTabActive = item.tab && item.tab === currentTab;
            const isRouteActive = item.href === pathname && !item.tab;
            const isDefaultDashboard = item.tab === 'dashboard' && !searchParams.get('tab') && pathname === baseUrl;

            const isActive = isTabActive || isRouteActive || isDefaultDashboard;

            return (
              <Link
                key={`${item.label}-${item.tab || 'clean'}`}
                href={item.href}
                onClick={() => window.innerWidth < 1024 && onClose?.()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group relative overflow-hidden mb-0.5",
                  isActive
                    ? "text-white shadow-lg"
                    : "text-gray-500 hover:text-gray-900"
                )}
                style={isActive ? {
                  background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
                  boxShadow: `0 8px 16px -4px ${colors.primary}40`
                } : {
                  // Subtle domain-aware hover
                  '--hover-bg': `${colors.primary}08`,
                  '--hover-text': colors.primary
                }}
              >
                {/* Hover Background Layer */}
                {!isActive && (
                  <div
                    className="absolute inset-0 bg-[var(--hover-bg)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"
                  />
                )}
                <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-all duration-300", isActive ? "text-white scale-110" : "text-gray-400 group-hover:text-[var(--hover-text)] group-hover:scale-110")} />
                <span className={cn("truncate transition-all duration-300", isActive ? "font-black tracking-tight" : "group-hover:translate-x-0.5 group-hover:font-bold")}>{item.label || 'Item'}</span>

                {/* Active Indicator Piller */}
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-l bg-white/20" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Area */}
        <div className="p-4 border-t border-gray-100 flex-none bg-white space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Region & Language</span>
            </div>
            <LanguageToggle />
          </div>

          <UserManager trigger={
            <button className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-2xl p-3 flex items-center gap-3 transition-all text-left group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs"
                style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}
              >
                {user?.email?.substring(0, 2).toUpperCase() || 'MY'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-900 truncate">
                  {user?.user_metadata?.full_name || 'My Account'}
                </p>
                <p className="text-[10px] text-gray-500 font-bold truncate">
                  {user?.email}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 group-hover:text-gray-600 transition-colors">
                <Settings className="w-4 h-4" />
              </div>
            </button>
          } />
        </div>
      </aside>
    </>
  );
}
