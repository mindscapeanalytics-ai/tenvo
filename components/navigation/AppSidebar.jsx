'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard, Package, FileText, Users, Truck, ShoppingCart,
    UtensilsCrossed, Heart, ClipboardList, Landmark, CreditCard, Receipt,
    RotateCcw, ArrowLeftRight, Calendar, BarChart3, Building2, Factory,
    UserCog, CheckSquare, Settings, Brain, ShieldCheck, ChevronLeft,
    ChevronRight, Lock, Crown, Sparkles, TrendingUp, BadgeDollarSign,
    ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const NAV_SECTIONS = [
    {
        label: 'CORE',
        items: [
            { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, plan: 'basic' },
            { key: 'inventory', label: 'Inventory', icon: Package, plan: 'basic' },
            { key: 'invoices', label: 'Invoices & Sales', icon: FileText, plan: 'basic' },
            { key: 'customers', label: 'Customers', icon: Users, plan: 'basic' },
            { key: 'vendors', label: 'Vendors & Purchases', icon: Truck, plan: 'basic' },
        ]
    },
    {
        label: 'SALES',
        items: [
            { key: 'pos', label: 'Point of Sale', icon: ShoppingCart, plan: 'standard', badge: 'NEW' },
            { key: 'restaurant', label: 'Restaurant', icon: UtensilsCrossed, plan: 'standard', badge: 'NEW' },
            { key: 'loyalty', label: 'Loyalty & CRM', icon: Heart, plan: 'standard', badge: 'NEW' },
            { key: 'quotations', label: 'Quotations', icon: ClipboardList, plan: 'basic' },
        ]
    },
    {
        label: 'FINANCE',
        items: [
            { key: 'accounting', label: 'Accounting', icon: Landmark, plan: 'basic' },
            { key: 'payments', label: 'Payments', icon: CreditCard, plan: 'basic' },
            { key: 'expenses', label: 'Expenses', icon: Receipt, plan: 'standard', badge: 'NEW' },
            { key: 'credit-notes', label: 'Credit Notes', icon: RotateCcw, plan: 'basic', badge: 'NEW' },
            { key: 'exchange-rates', label: 'Exchange Rates', icon: ArrowLeftRight, plan: 'premium' },
            { key: 'fiscal', label: 'Fiscal Periods', icon: Calendar, plan: 'standard' },
            { key: 'finance', label: 'Financial Statements', icon: BarChart3, plan: 'basic' },
            { key: 'gst', label: 'Tax / GST', icon: BadgeDollarSign, plan: 'standard' },
        ]
    },
    {
        label: 'OPERATIONS',
        items: [
            { key: 'warehouses', label: 'Warehouses', icon: Building2, plan: 'standard' },
            { key: 'manufacturing', label: 'Manufacturing', icon: Factory, plan: 'standard' },
            { key: 'payroll', label: 'Payroll & HR', icon: UserCog, plan: 'enterprise', badge: 'NEW' },
            { key: 'approvals', label: 'Approvals', icon: CheckSquare, plan: 'enterprise', badge: 'NEW' },
        ]
    },
    {
        label: 'ADMIN',
        items: [
            { key: 'reports', label: 'Analytics & AI', icon: Brain, plan: 'premium' },
            { key: 'settings', label: 'Settings', icon: Settings, plan: 'basic', roles: ['owner', 'admin'] },
        ]
    },
];

const PLAN_ORDER = ['basic', 'standard', 'premium', 'enterprise'];
const PLAN_COLORS = {
    basic: 'bg-gray-100 text-gray-600',
    standard: 'bg-blue-100 text-blue-700',
    premium: 'bg-amber-100 text-amber-700',
    enterprise: 'bg-purple-100 text-purple-700',
};

function isPlanUnlocked(currentPlan, requiredPlan) {
    return PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(requiredPlan);
}

export function AppSidebar({
    activeTab,
    onTabChange,
    currentPlan = 'basic',
    role = 'owner',
    businessName = '',
    category = '',
    collapsed = false,
    onCollapsedChange,
}) {
    const [expandedSections, setExpandedSections] = useState(
        NAV_SECTIONS.reduce((acc, s) => ({ ...acc, [s.label]: true }), {})
    );

    const toggleSection = (label) => {
        setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }));
    };

    return (
        <TooltipProvider delayDuration={0}>
            <motion.aside
                className={cn(
                    'h-screen sticky top-0 bg-white border-r border-gray-200/60 flex flex-col',
                    'transition-all duration-300 ease-in-out z-40 shadow-sm',
                    collapsed ? 'w-[68px]' : 'w-[260px]'
                )}
                layout
            >
                {/* Header */}
                <div className={cn(
                    'flex items-center border-b border-gray-100 px-4 py-4',
                    collapsed ? 'justify-center' : 'justify-between'
                )}>
                    {!collapsed && (
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-200">
                                T
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{businessName || 'Tenvo'}</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider truncate">{category}</p>
                            </div>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-200">
                            T
                        </div>
                    )}
                </div>

                {/* Plan Badge */}
                {!collapsed && (
                    <div className="px-3 py-2">
                        <div className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold',
                            PLAN_COLORS[currentPlan]
                        )}>
                            <Crown className="w-3.5 h-3.5" />
                            <span>{currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan</span>
                            {currentPlan !== 'enterprise' && (
                                <button
                                    className="ml-auto text-[10px] underline opacity-70 hover:opacity-100"
                                    onClick={() => onTabChange?.('settings')}
                                >
                                    Upgrade
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-1 scrollbar-thin">
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.label}>
                            {!collapsed && (
                                <button
                                    onClick={() => toggleSection(section.label)}
                                    className="flex items-center w-full px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <span>{section.label}</span>
                                    <ChevronDown className={cn(
                                        'w-3 h-3 ml-auto transition-transform',
                                        !expandedSections[section.label] && '-rotate-90'
                                    )} />
                                </button>
                            )}

                            <AnimatePresence initial={false}>
                                {(collapsed || expandedSections[section.label]) && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        {section.items.map((item) => {
                                            const isLocked = !isPlanUnlocked(currentPlan, item.plan);
                                            const isRoleLocked = item.roles && !item.roles.includes(role);
                                            const isActive = activeTab === item.key;
                                            const Icon = item.icon;

                                            if (isRoleLocked) return null;

                                            const navButton = (
                                                <button
                                                    key={item.key}
                                                    onClick={() => {
                                                        if (!isLocked) onTabChange?.(item.key);
                                                    }}
                                                    className={cn(
                                                        'flex items-center w-full rounded-lg text-sm transition-all duration-150 group relative',
                                                        collapsed ? 'justify-center p-2.5 mx-auto' : 'gap-3 px-3 py-2',
                                                        isActive && !isLocked
                                                            ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                                                            : isLocked
                                                                ? 'text-gray-300 cursor-not-allowed'
                                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                    )}
                                                >
                                                    <div className="relative">
                                                        <Icon className={cn(
                                                            'w-[18px] h-[18px] flex-shrink-0',
                                                            isActive && !isLocked ? 'text-indigo-600' : ''
                                                        )} />
                                                        {isLocked && (
                                                            <Lock className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 text-gray-400" />
                                                        )}
                                                    </div>

                                                    {!collapsed && (
                                                        <>
                                                            <span className="flex-1 text-left truncate">{item.label}</span>
                                                            {item.badge && !isLocked && (
                                                                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-700">
                                                                    {item.badge}
                                                                </span>
                                                            )}
                                                            {isLocked && (
                                                                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-gray-100 text-gray-400">
                                                                    {item.plan}
                                                                </span>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Active indicator */}
                                                    {isActive && !isLocked && (
                                                        <motion.div
                                                            layoutId="sidebar-active"
                                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-600 rounded-r-full"
                                                        />
                                                    )}
                                                </button>
                                            );

                                            if (collapsed) {
                                                return (
                                                    <Tooltip key={item.key}>
                                                        <TooltipTrigger asChild>
                                                            {navButton}
                                                        </TooltipTrigger>
                                                        <TooltipContent side="right" className="font-medium">
                                                            {item.label}
                                                            {isLocked && <span className="text-gray-400 ml-1">({item.plan})</span>}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                );
                                            }

                                            return navButton;
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {!collapsed && <div className="h-px bg-gray-100 my-1.5" />}
                        </div>
                    ))}
                </nav>

                {/* Collapse Toggle */}
                <div className="border-t border-gray-100 p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center text-gray-400 hover:text-gray-600"
                        onClick={() => onCollapsedChange?.(!collapsed)}
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
                    </Button>
                </div>
            </motion.aside>
        </TooltipProvider>
    );
}
