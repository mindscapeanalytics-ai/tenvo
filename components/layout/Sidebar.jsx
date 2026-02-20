'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Package, FileText, Users, Truck, ShoppingCart,
  UtensilsCrossed, Heart, ClipboardList, Landmark, CreditCard, Receipt,
  RotateCcw, ArrowLeftRight, Calendar, BarChart3, Building2, Factory,
  UserCog, CheckSquare, Settings, Brain, ShieldCheck, ChevronLeft,
  ChevronRight, Lock, Crown, Sparkles, TrendingUp, BadgeDollarSign,
  ChevronDown, Warehouse, Hash, Layers, History, X, Globe, Plus, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/context/AuthContext';
import { useBusiness } from '@/lib/context/BusinessContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { translations } from '@/lib/translations';
import { getDomainColors } from '@/lib/domainColors';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { UserManager } from '../auth/UserManager';
import { LanguageToggle } from '../LanguageToggle';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Grouped Navigation Definition ──────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'CORE',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, alwaysShow: true },
      { key: 'inventory', label: 'Inventory', icon: Package, alwaysShow: true },
      { key: 'invoices', label: 'Sales & Invoices', icon: FileText, alwaysShow: true },
      { key: 'customers', label: 'Customers', icon: Users, alwaysShow: true },
      { key: 'vendors', label: 'Vendors', icon: Building2, alwaysShow: true },
      { key: 'purchases', label: 'Purchase Orders', icon: Truck, alwaysShow: true },
    ]
  },
  {
    label: 'SALES',
    items: [
      { key: 'pos', label: 'Point of Sale', icon: ShoppingCart, badge: 'NEW' },
      { key: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed, badge: 'NEW' },
      { key: 'loyalty', label: 'Loyalty & CRM', icon: Heart, badge: 'NEW' },
      { key: 'quotations', label: 'Quotations', icon: ClipboardList, conditionKey: 'quotations' },
      { key: 'sales', label: 'Sales Manager', icon: TrendingUp, alwaysShow: true },
    ]
  },
  {
    label: 'FINANCE',
    items: [
      { key: 'accounting', label: 'Accounting', icon: Landmark, alwaysShow: true },
      { key: 'payments', label: 'Payments', icon: CreditCard, alwaysShow: true },
      { key: 'expenses', label: 'Expenses', icon: Receipt, badge: 'NEW' },
      { key: 'finance', label: 'Financial Reports', icon: BarChart3, alwaysShow: true },
      { key: 'gst', label: 'Tax / GST', icon: BadgeDollarSign, alwaysShow: true },
    ]
  },
  {
    label: 'OPERATIONS',
    items: [
      { key: 'warehouses', label: 'Warehouses', icon: Warehouse, conditionKey: 'multiLocation' },
      { key: 'manufacturing', label: 'Manufacturing', icon: Factory, conditionKey: 'manufacturing' },
      { key: 'payroll', label: 'Payroll & HR', icon: UserCog, badge: 'NEW' },
      { key: 'approvals', label: 'Approvals', icon: CheckSquare, badge: 'NEW' },
    ]
  },
  {
    label: 'ADMIN',
    items: [
      { key: 'reports', label: 'Analytics', icon: Brain, alwaysShow: true },
      { key: 'settings', label: 'Settings', icon: Settings, roles: ['owner', 'admin'] },
    ]
  },
];

export function Sidebar({ isOpen, onClose }) {
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
    primary: domainColors?.primary || '#4F46E5', // Indigo as default
    primaryLight: domainColors?.primaryLight || '#6366F1',
    secondary: domainColors?.secondary || '#EEF2FF'
  };

  const domainKnowledge = getDomainKnowledge(category);
  const effectiveRole = (businessLoading || !role) ? 'owner' : role;

  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (label) => {
    setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  // Check if a nav item should be visible
  const isVisible = (item) => {
    if (item.roles && !item.roles.includes(effectiveRole)) return false;
    if (item.alwaysShow) return true;
    if (item.conditionKey === 'manufacturing') return domainKnowledge?.manufacturingEnabled;
    if (item.conditionKey === 'multiLocation') return domainKnowledge?.multiLocationEnabled;
    if (item.conditionKey === 'quotations') return domainKnowledge?.inventoryFeatures?.includes('Quotation Management');
    return true; // Show NEW items by default
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
          "fixed inset-y-0 start-0 z-50 w-64 bg-white border-e border-gray-200/60 flex flex-col h-screen transition-transform duration-300",
          "lg:translate-x-0 shadow-sm",
          isOpen ? "translate-x-0" : (language === 'ur' ? "translate-x-full" : "-translate-x-full")
        )}
      >
        {/* ─── Brand Header ──────────────────────────────────────── */}
        <div className="flex-none px-4 py-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div
              className="w-9 h-9 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg"
              style={{ background: `linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)` }}
            >
              T
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span className="font-black text-gray-900 text-xl tracking-tight uppercase">TENVO</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em]">Enterprise Hub</span>
            </div>
          </Link>

          {/* Business Context */}
          {business?.name && (
            <div className="mt-4 flex items-center gap-2.5 p-2.5 bg-gray-50 border border-gray-100 rounded-xl">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0"
                style={{ backgroundColor: colors.primary }}
              >
                {business.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate leading-tight">{business.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider truncate">
                    {business.domain?.replace(/-/g, ' ') || 'Active'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Grouped Navigation ────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5 space-y-0.5 scrollbar-thin">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(isVisible);
            if (visibleItems.length === 0) return null;
            const isCollapsed = collapsedSections[section.label];

            return (
              <div key={section.label} className="mb-1">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.label)}
                  className="flex items-center w-full px-2.5 py-1.5 mt-2 mb-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span>{section.label}</span>
                  <ChevronDown className={cn(
                    'w-3 h-3 ml-auto transition-transform duration-200',
                    isCollapsed && '-rotate-90'
                  )} />
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

                        return (
                          <Link
                            key={item.key}
                            href={item.key === 'dashboard' ? baseUrl : `${baseUrl}?tab=${item.key}`}
                            onClick={() => window.innerWidth < 1024 && onClose?.()}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative group mb-0.5",
                              isActive
                                ? "bg-indigo-50 text-indigo-700 font-semibold"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                          >
                            {/* Active indicator bar */}
                            {isActive && (
                              <motion.div
                                layoutId="nav-active-indicator"
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-600 rounded-r-full"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              />
                            )}

                            <Icon className={cn(
                              "w-[17px] h-[17px] flex-shrink-0",
                              isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"
                            )} />

                            <span className="flex-1 truncate">{item.label}</span>

                            {item.badge && (
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

        {/* ─── Footer ────────────────────────────────────────────── */}
        <div className="flex-none p-3 border-t border-gray-100 bg-white space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-gray-400" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Language</span>
            </div>
            <LanguageToggle />
          </div>

          <UserManager trigger={
            <button className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl p-2.5 flex items-center gap-2.5 transition-all text-left group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                style={{ background: `linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)` }}
              >
                {user?.email?.substring(0, 2).toUpperCase() || 'ME'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">
                  {user?.user_metadata?.full_name || 'My Account'}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
              <Settings className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>
          } />
        </div>
      </aside>
    </>
  );
}
