'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Package, FileText, Users, Truck, ShoppingCart,
  UtensilsCrossed, Heart, ClipboardList, Landmark, CreditCard, Receipt,
  BarChart3, Building2, Factory,
  UserCog, CheckSquare, Settings, Brain, ShieldCheck,
  Lock, Crown, Sparkles, TrendingUp, BadgeDollarSign,
  ChevronDown, Warehouse, Hash, History, X, Globe, Megaphone,
  Scale, RefreshCcw, BookOpen, ScrollText, FileCheck,
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/context/AuthContext';
import { useBusiness } from '@/lib/context/BusinessContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { translations } from '@/lib/translations';
import { getDomainColors } from '@/lib/domainColors';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { getNavItemAccess } from '@/lib/rbac/permissions';
import { PLAN_TIERS, FEATURE_LABELS, FEATURE_MIN_PLAN } from '@/lib/config/plans';
import { UserManager } from '../auth/UserManager';
import { LanguageToggle } from '../LanguageToggle';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Grouped Navigation Definition ──────────────────────────────────────────
// Each item has: key (matches tab param), label, icon, and optional:
//   - alwaysShow: bypass all gating checks
//   - conditionKey: domain-knowledge condition (manufacturing, multiLocation, etc.)
//   - domainOnly: array of domain categories where this item appears
//   - badge: text badge like 'NEW' or 'BETA'

const NAV_SECTIONS = [
  {
    label: 'ESSENTIALS',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, alwaysShow: true },
      { key: 'inventory', label: 'Inventory & Stock', icon: Package, alwaysShow: true },
      { key: 'invoices', label: 'Sales & Invoicing', icon: FileText, alwaysShow: true },
      { key: 'customers', label: 'Customers', icon: Users, alwaysShow: true },
      { key: 'vendors', label: 'Vendors & Procurement', icon: Building2, alwaysShow: true },
      { key: 'purchases', label: 'Purchase Orders', icon: Truck, alwaysShow: true },
    ]
  },
  {
    label: 'STOREFRONT',
    items: [
      { key: 'pos', label: 'Point of Sale', icon: ShoppingCart },
      { key: 'refunds', label: 'Refunds & Returns', icon: RefreshCcw },
      {
        key: 'restaurant',
        label: 'Restaurant',
        icon: UtensilsCrossed,
        domainOnly: ['restaurant-cafe', 'bakery-confectionery', 'hotel-guesthouse'],
      },
      { key: 'loyalty', label: 'Loyalty & CRM', icon: Heart },
      { key: 'quotations', label: 'Quotations', icon: ClipboardList, conditionKey: 'quotations' },
      { key: 'sales', label: 'Sales Manager', icon: TrendingUp, alwaysShow: true },
    ]
  },
  {
    label: 'FINANCE',
    items: [
      { key: 'accounting', label: 'Accounting', icon: Landmark, alwaysShow: true },
      { key: 'payments', label: 'Payments', icon: CreditCard, alwaysShow: true },
      { key: 'finance', label: 'Finance Hub', icon: BarChart3, alwaysShow: true },
      { key: 'gst', label: 'Tax / GST', icon: BadgeDollarSign, alwaysShow: true },
    ]
  },
  {
    label: 'OPERATIONS',
    items: [
      { key: 'warehouses', label: 'Warehouses', icon: Warehouse, conditionKey: 'multiLocation' },
      { key: 'manufacturing', label: 'Manufacturing', icon: Factory, conditionKey: 'manufacturing' },
      { key: 'payroll', label: 'Payroll & HR', icon: UserCog },
      { key: 'approvals', label: 'Approvals', icon: CheckSquare },
    ]
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { key: 'reports', label: 'Analytics & AI', icon: Brain, alwaysShow: true },
      { key: 'campaigns', label: 'Campaigns & Marketing', icon: Megaphone },
      { key: 'audit', label: 'Audit Trail', icon: ScrollText },
    ]
  },
  {
    label: 'SYSTEM',
    items: [
      { key: 'settings', label: 'Settings', icon: Settings },
    ]
  },
];

export function Sidebar({ isOpen, onClose, isSidebarCollapsed, setIsSidebarCollapsed }) {
  const { user } = useAuth();
  const { business, role, isLoading: businessLoading } = useBusiness();
  const { language } = useLanguage();
  const t = translations[language];
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'dashboard';

  const pathParts = pathname?.split('/') || [];
  const category = pathParts[2] || 'retail-shop';
  const baseUrl = `/business/${category}`;

  const domainColors = getDomainColors(category);
  const colors = {
    primary: domainColors?.primary || '#4F46E5',
    primaryLight: domainColors?.primaryLight || '#6366F1',
    secondary: domainColors?.secondary || '#EEF2FF'
  };

  const domainKnowledge = getDomainKnowledge(category);
  const effectiveRole = (businessLoading || !role) ? 'owner' : role;
  const planTier = business?.plan_tier || 'basic';
  const planName = PLAN_TIERS[planTier]?.name || 'Basic';

  const [collapsedSections, setCollapsedSections] = useState({});

  // Keyboard shortcut Ctrl+B
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSection = (label) => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      setCollapsedSections(prev => ({ ...prev, [label]: false }));
      return;
    }
    setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // ─── Navigation access control ─────────────────────────────────────────────
  // Check if a nav item should be visible + whether it's locked behind subscription
  const getItemState = (item) => {
    // Always-show items bypass all checks
    if (item.alwaysShow) {
      return { visible: true, locked: false, requiredPlan: null };
    }

    // Domain-only items: only show for specific business domains
    if (item.domainOnly && !item.domainOnly.includes(category)) {
      return { visible: false, locked: false, requiredPlan: null };
    }

    // Domain knowledge conditions (manufacturing, multiLocation, etc.)
    if (item.conditionKey === 'manufacturing' && !domainKnowledge?.manufacturingEnabled) {
      return { visible: false, locked: false, requiredPlan: null };
    }
    if (item.conditionKey === 'multiLocation' && !domainKnowledge?.multiLocationEnabled) {
      return { visible: false, locked: false, requiredPlan: null };
    }
    if (item.conditionKey === 'quotations' && !domainKnowledge?.inventoryFeatures?.includes('Quotation Management')) {
      return { visible: false, locked: false, requiredPlan: null };
    }

    // RBAC + Subscription check via the permissions system
    return getNavItemAccess(item.key, effectiveRole, planTier);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 bg-white border-e border-gray-200/60 flex flex-col h-screen transition-all duration-300 ease-in-out",
          "lg:translate-x-0 shadow-sm",
          isSidebarCollapsed ? "w-20" : "w-64",
          isOpen ? "translate-x-0" : (language === 'ur' ? "translate-x-full" : "-translate-x-full")
        )}
      >
        {/* ─── Brand Header ──────────────────────────────────────── */}
        <div className={cn(
          "flex-none px-4 h-14 flex items-center border-b border-gray-100 relative group/header",
          isSidebarCollapsed && "px-0 flex flex-col justify-center"
        )}>
          <Link href="/" className={cn(
            "flex items-center gap-3 hover:opacity-90 transition-opacity",
            isSidebarCollapsed && "flex-col gap-1"
          )}>
            <div
              className="w-9 h-9 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)` }}
            >
              T
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col -space-y-0.5">
                <span className="font-black text-gray-900 text-xl tracking-tight uppercase">TENVO</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Enterprise Hub</span>
              </div>
            )}
          </Link>

          {/* Collapse Toggle Button (Hover visible) */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={cn(
              "absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm z-50",
              "hover:bg-gray-50 hover:border-indigo-200 transition-all",
              "opacity-0 group-hover/header:opacity-100 lg:opacity-100" // Always show on desktop for discoverability
            )}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>

          {/* Business Context */}
          {business?.name && (
            <div className={cn(
              "mt-3 flex items-center gap-2.5 p-2 bg-gray-50 border border-gray-100 rounded-xl transition-all",
              isSidebarCollapsed ? "mx-1.5 p-1 justify-center border-none bg-transparent" : "mx-0"
            )}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0"
                style={{ backgroundColor: colors.primary }}
              >
                {business.name.substring(0, 2).toUpperCase()}
              </div>
              {!isSidebarCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate leading-tight">{business.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider truncate">
                        {business.domain?.replace(/-/g, ' ') || 'Active'}
                      </p>
                    </div>
                  </div>
                  {/* Plan Badge */}
                  <span className={cn(
                    "px-1.5 py-0.5 text-[8px] font-black rounded-full leading-none shrink-0",
                    planTier === 'enterprise' && "bg-violet-100 text-violet-700",
                    planTier === 'premium' && "bg-amber-100 text-amber-700",
                    planTier === 'standard' && "bg-blue-100 text-blue-700",
                    planTier === 'basic' && "bg-gray-100 text-gray-500",
                  )}>
                    {planName}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── Grouped Navigation ────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5 space-y-0.5 scrollbar-thin">
          {NAV_SECTIONS.map((section) => {
            // Filter items for this section based on RBAC + subscription + domain
            const processedItems = section.items.map(item => ({
              ...item,
              ...getItemState(item),
            }));

            const visibleItems = processedItems.filter(i => i.visible);
            if (visibleItems.length === 0) return null;
            const isCollapsed = collapsedSections[section.label];

            return (
              <div key={section.label} className="mb-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.label)}
                  className={cn(
                    "flex items-center w-full px-2.5 py-1.5 mt-2 mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 hover:text-gray-600 transition-colors",
                    isSidebarCollapsed && "justify-center"
                  )}
                >
                  {!isSidebarCollapsed && <span>{section.label}</span>}
                  {!isSidebarCollapsed ? (
                    <ChevronDown className={cn(
                      'w-3 h-3 ml-auto transition-transform duration-200',
                      isCollapsed && '-rotate-90'
                    )} />
                  ) : (
                    <div className="w-4 h-0.5 bg-gray-200 rounded-full" />
                  )}
                </button>

                {/* Nav Items */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      {visibleItems.map((item) => {
                        const isActive = currentTab === item.key;
                        const Icon = item.icon;
                        const isLocked = item.locked;

                        return (
                          <Link
                            key={item.key}
                            href={isLocked ? '#' : (item.key === 'dashboard' ? baseUrl : `${baseUrl}?tab=${item.key}`)}
                            onClick={(e) => {
                              if (isLocked) {
                                e.preventDefault();
                                // Could trigger upgrade modal here in future
                                return;
                              }
                              if (window.innerWidth < 1024) onClose?.();
                            }}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative group mb-0.5",
                              isSidebarCollapsed && "justify-center",
                              isLocked
                                ? "text-gray-400 cursor-not-allowed opacity-60 hover:bg-gray-50"
                                : isActive
                                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                          >
                            {/* Active indicator bar */}
                            {isActive && !isLocked && (
                              <motion.div
                                layoutId="nav-active-indicator"
                                className={cn(
                                  "absolute top-1/2 -translate-y-1/2 bg-indigo-600",
                                  isSidebarCollapsed ? "inset-0 bg-indigo-50/50 rounded-lg -z-10 h-full w-full" : "left-0 w-[3px] h-5 rounded-r-full"
                                )}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              />
                            )}

                            <Icon className={cn(
                              "w-[18px] h-[18px] flex-shrink-0",
                              isLocked
                                ? "text-gray-300"
                                : isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                            )} />

                            {!isSidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}

                            {/* Tooltip for collapsed mode */}
                            {isSidebarCollapsed && (
                              <span className="absolute left-14 px-2.5 py-1.5 text-xs font-bold bg-gray-900 text-white rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-1 group-hover:translate-x-0 z-[60] shadow-xl whitespace-nowrap">
                                {item.label}
                                {isLocked && " (Locked)"}
                                <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-[6px] border-y-transparent border-r-[6px] border-r-gray-900" />
                              </span>
                            )}

                            {/* Lock icon for subscription-gated items */}
                            {isLocked && !isSidebarCollapsed && (
                              <span className="relative group/lock">
                                <Lock className="w-3.5 h-3.5 text-gray-300" />
                                {/* Tooltip */}
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[9px] font-semibold bg-gray-900 text-white rounded-md whitespace-nowrap opacity-0 group-hover/lock:opacity-100 transition-opacity pointer-events-none z-50">
                                  Requires {PLAN_TIERS[item.requiredPlan]?.name || 'upgrade'}
                                </span>
                              </span>
                            )}

                            {/* Badge for non-locked items */}
                            {!isLocked && item.badge && !isSidebarCollapsed && (
                              <span className="px-1.5 py-0.5 text-[8px] font-black rounded-full bg-emerald-100 text-emerald-700 leading-none">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* ─── Upgrade Banner (shown for basic/standard plans, hidden in compact mode) ─── */}
        {!isSidebarCollapsed && (planTier === 'basic' || planTier === 'standard') && (
          <div className="flex-none mx-3 mb-2.5">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 rounded-xl p-3 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-amber-300" />
                <span className="text-[11px] font-bold">Unlock more features</span>
              </div>
              <p className="text-[9px] text-indigo-100 leading-relaxed mb-2">
                {planTier === 'basic'
                  ? 'Get POS, Expenses, CRM and more with Standard'
                  : 'Get Manufacturing, Payroll, AI and more with Premium'}
              </p>
              <Link
                href={`${baseUrl}?tab=settings&section=billing`}
                className="block text-center text-[10px] font-bold bg-white/20 hover:bg-white/30 rounded-lg py-1.5 transition-colors"
              >
                Upgrade Now →
              </Link>
            </div>
          </div>
        )}

        {/* ─── Footer ────────────────────────────────────────────── */}
        <div className={cn(
          "flex-none p-2 border-t border-gray-100 bg-white space-y-2",
          isSidebarCollapsed && "p-2 items-center flex flex-col"
        )}>
          <div className="flex items-center justify-between px-1">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-gray-400" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Language</span>
              </div>
            )}
            <LanguageToggle isCompact={isSidebarCollapsed} />
          </div>

          <UserManager trigger={
            <button className={cn(
              "w-full bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl p-2 flex items-center gap-2.5 transition-all text-left group",
              isSidebarCollapsed && "p-1.5 border-none bg-transparent"
            )}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0"
                style={{ background: `linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)` }}
              >
                {user?.email?.substring(0, 2).toUpperCase() || 'ME'}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {user?.user_metadata?.full_name || 'My Account'}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1)} · {user?.email}
                  </p>
                </div>
              )}
              {!isSidebarCollapsed && <Settings className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />}
            </button>
          } />
        </div>
      </aside>
    </>
  );
}
