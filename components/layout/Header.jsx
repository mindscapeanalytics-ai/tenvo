'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';

import {
    ChevronRight as ChevronIcon,
    BarChart3,
    ChevronDown,
    Package as PackageIcon,
    Users as UsersIcon,
    Menu,
    Search,
    Plus,
    Bell,
    X,
    ClipboardList,
    FileText,
    TrendingUp,
    Truck,
    Factory,
    Layers,
    Warehouse,
    ShoppingCart,
    History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DateRangePicker } from '@/components/islands/DateRangePicker.client';
import { useFilters } from '@/lib/context/FilterContext';
import { useBusiness } from '@/lib/context/BusinessContext';
import { useData } from '@/lib/context/DataContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useSearchParams, usePathname } from 'next/navigation';
import { getDomainColors } from '@/lib/domainColors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuShortcut
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export function Header({ onMenuClick }) {
    const { dateRange, setDateRange, searchQuery, setSearchQuery } = useFilters();
    const { business } = useBusiness();
    const {
        products,
        invoices,
        customers,
        vendors,
        bomList,
        productionOrders,
        purchaseOrders,
        quotations,
        salesOrders,
        challans
    } = useData();
    const { t, language } = useLanguage();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentTab = searchParams.get('tab') || 'dashboard';

    const [isSearchFocused, setIsSearchFocused] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const searchRef = React.useRef(null);

    // Highlight helper
    const highlightMatch = (text, term) => {
        if (!term || !text) return text;
        const parts = text.split(new RegExp(`(${term})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === term.toLowerCase()
                ? <span key={i} className="text-wine bg-wine/10 font-black">{part}</span>
                : part
        );
    };

    // Close results on click outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search Results Logic
    const searchResults = React.useMemo(() => {
        if (!searchQuery || searchQuery.length < 2 || !isSearchFocused) return null;
        const term = searchQuery.toLowerCase();

        const results = {
            inventory: products.filter(p =>
                p.name?.toLowerCase().includes(term) ||
                p.sku?.toLowerCase().includes(term) ||
                p.category?.toLowerCase().includes(term) ||
                p.brand?.toLowerCase().includes(term)
            ).slice(0, 5),
            sales: invoices.filter(i =>
                i.number?.toLowerCase().includes(term) ||
                i.customer_name?.toLowerCase().includes(term)
            ).slice(0, 5),
            crm: [
                ...customers.filter(c => c.name?.toLowerCase().includes(term) || c.phone?.toLowerCase().includes(term)),
                ...vendors.filter(v => v.name?.toLowerCase().includes(term) || v.company_name?.toLowerCase().includes(term))
            ].slice(0, 5),
            manufacturing: [
                ...bomList.filter(b => b.name?.toLowerCase().includes(term) || b.product_name?.toLowerCase().includes(term)),
                ...productionOrders.filter(o => o.status?.toLowerCase().includes(term) || o.product_name?.toLowerCase().includes(term))
            ].slice(0, 5),
            management: [
                ...purchaseOrders.filter(po => po.number?.toLowerCase().includes(term) || po.vendor_name?.toLowerCase().includes(term)),
                ...quotations.filter(q => q.number?.toLowerCase().includes(term) || q.customer_name?.toLowerCase().includes(term)),
                ...salesOrders.filter(so => so.number?.toLowerCase().includes(term) || so.customer_name?.toLowerCase().includes(term)),
                ...challans.filter(c => c.number?.toLowerCase().includes(term) || c.customer_name?.toLowerCase().includes(term))
            ].slice(0, 5)
        };

        const totalResults = Object.values(results).flat().length;
        if (totalResults === 0) return { empty: true };

        // Flatten for keyboard navigation mapping
        const flatItems = [];
        Object.entries(results).forEach(([cat, items]) => {
            items.forEach(item => flatItems.push({ cat, item }));
        });

        return { ...results, flatItems };
    }, [searchQuery, products, invoices, customers, vendors, bomList, productionOrders, purchaseOrders, quotations, salesOrders, challans, isSearchFocused]);

    const handleResultClick = (type, item) => {
        setIsSearchFocused(false);
        setActiveIndex(-1);
        let tab = 'dashboard';
        let detailType = type;

        switch (type) {
            case 'inventory':
                tab = 'inventory';
                detailType = 'product';
                break;
            case 'sales':
                tab = 'invoices';
                detailType = 'invoice';
                break;
            case 'crm':
                tab = item.company_name ? 'vendors' : 'customers';
                detailType = item.company_name ? 'vendor' : 'customer';
                break;
            case 'manufacturing':
                tab = 'manufacturing';
                detailType = item.sku ? 'bom' : 'production_order'; // Basic heuristic
                break;
            case 'management':
                if (item.number?.startsWith('PO')) {
                    tab = 'purchases';
                    detailType = 'purchase_order';
                } else if (item.number?.startsWith('QT')) {
                    tab = 'quotations';
                    detailType = 'quotation';
                } else if (item.number?.startsWith('SO')) {
                    tab = 'quotations';
                    detailType = 'sales_order';
                } else if (item.number?.startsWith('CH')) {
                    tab = 'quotations';
                    detailType = 'challan';
                }
                break;
        }

        window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab } }));
        window.dispatchEvent(new CustomEvent('view-details', {
            detail: { item, type: detailType }
        }));
    };

    const handleKeyDown = (e) => {
        if (!searchResults || searchResults.empty) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < searchResults.flatItems.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            const target = searchResults.flatItems[activeIndex];
            handleResultClick(target.cat, target.item);
        } else if (e.key === 'Escape') {
            setIsSearchFocused(false);
            setActiveIndex(-1);
        }
    };

    React.useEffect(() => {
        setActiveIndex(-1);
    }, [searchQuery]);

    // Extract category from URL
    const pathParts = pathname?.split('/') || [];
    const category = pathParts[2] || 'retail-shop';
    const colors = getDomainColors(category);

    const labels = {
        dashboard: 'Command Overview',
        inventory: 'Inventory Engine',
        invoices: 'Billing & Invoicing',
        customers: 'CRM & Client Hub',
        sales: 'Sales Performance',
        quotations: 'Estimates & Quotes',
        vendors: 'Supplier Network',
        payments: 'Financial Settlements',
        purchases: 'Procurement Ops',
        manufacturing: 'Production Control',
        warehouses: 'Location Manager',
        batches: 'Batch Tracking',
        serials: 'Serial Management',
        gst: 'Tax & Compliance',
        settings: 'System Configs',
        reports: 'Analytics Hub',
        analytics: 'Intelligence Center'
    };

    const activeTitle = labels[currentTab] || currentTab;

    return (
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center px-4 lg:px-6 sticky top-0 z-40 shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between w-full max-w-[1600px] mx-auto gap-4">
                {/* Left: Mobile Menu & Breadcrumb Branding */}
                <div className="flex items-center gap-3 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden shrink-0 h-9 w-9"
                        onClick={onMenuClick}
                    >
                        <Menu className="w-5 h-5 text-gray-600" />
                    </Button>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-gray-50 rounded-lg border border-gray-100">
                            <div
                                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black text-white shrink-0"
                                style={{ backgroundColor: colors?.primary || '#1a1a1a' }}
                            >
                                {business?.name?.substring(0, 1).toUpperCase() || 'B'}
                            </div>
                            <span className="text-[11px] font-black text-gray-900 truncate max-w-[100px]">
                                {business?.name || 'Business'}
                            </span>
                        </div>
                        <ChevronIcon className="w-3 h-3 text-gray-300 shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-gray-900 uppercase tracking-tight">
                                {activeTitle}
                            </span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                                Universal Control
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center: Search (Compact) */}
                <div className="hidden xl:flex flex-1 justify-center max-w-sm px-2" ref={searchRef}>
                    <div className="relative w-full group">
                        <Search className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-wine transition-colors ${language === 'ur' ? 'right-3' : 'left-3'}`} />
                        <Input
                            placeholder={t.search_placeholder}
                            className={`h-8 text-xs bg-gray-100/50 border-transparent focus:bg-white focus:border-wine/30 focus:ring-wine/20 transition-all rounded-lg ${language === 'ur' ? 'pr-9' : 'pl-9'}`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onKeyDown={handleKeyDown}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className={`absolute top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors ${language === 'ur' ? 'left-3' : 'right-3'}`}
                            >
                                <X className="w-3 h-3 text-gray-400" />
                            </button>
                        )}

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {searchResults && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[80vh] overflow-y-auto custom-scrollbar"
                                >
                                    {searchResults.empty ? (
                                        <div className="p-8 text-center">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Search className="w-6 h-6 text-gray-300" />
                                            </div>
                                            <p className="text-xs font-black text-gray-900 uppercase tracking-tight mb-1">No matches found</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Try a different search term</p>
                                        </div>
                                    ) : (
                                        <>
                                            {(() => {
                                                let globalIdx = 0;
                                                return Object.entries(searchResults).map(([category, items]) => {
                                                    if (category === 'flatItems' || category === 'empty' || items.length === 0) return null;
                                                    return (
                                                        <div key={category} className="p-2 border-b border-gray-50 last:border-0">
                                                            <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50/50 rounded-lg mb-1">
                                                                {category === 'inventory' && <PackageIcon className="w-3 h-3 text-blue-500" />}
                                                                {category === 'sales' && <FileText className="w-3 h-3 text-wine" />}
                                                                {category === 'crm' && <UsersIcon className="w-3 h-3 text-green-500" />}
                                                                {category === 'manufacturing' && <Factory className="w-3 h-3 text-orange-500" />}
                                                                {category === 'management' && <ClipboardList className="w-3 h-3 text-indigo-500" />}
                                                                {category}
                                                            </div>
                                                            <div className="space-y-0.5">
                                                                {items.map((item, idx) => {
                                                                    const isSelected = activeIndex === globalIdx;
                                                                    const currentGlobalIdx = globalIdx++;
                                                                    return (
                                                                        <button
                                                                            key={idx}
                                                                            onClick={() => handleResultClick(category, item)}
                                                                            onMouseEnter={() => setActiveIndex(currentGlobalIdx)}
                                                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group text-left border border-transparent ${isSelected ? 'bg-wine/5 border-wine/20' : 'hover:bg-gray-50'}`}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className={`text-xs font-bold uppercase tracking-tight ${isSelected ? 'text-wine' : 'text-gray-900'}`}>
                                                                                    {highlightMatch(item.name || item.number || item.product_name || 'Unnamed Item', searchQuery)}
                                                                                </span>
                                                                                <span className="text-[10px] text-gray-500 line-clamp-1">
                                                                                    {highlightMatch(item.sku || item.customer_name || item.company_name || item.category || item.status || '', searchQuery)}
                                                                                </span>
                                                                            </div>
                                                                            <ChevronIcon className={`w-3 h-3 transition-all ${isSelected ? 'text-wine translate-x-0.5' : 'text-gray-300'}`} />
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                            <div className="p-2 bg-gray-50/30 text-center">
                                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                                                    Use Arrow Keys to Navigate • Enter to Open
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right: Actions & Filters */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2 mr-2 border-r border-gray-100 pr-2">
                        <DateRangePicker
                            date={dateRange}
                            onDateChange={(newRange) => {
                                if (newRange?.from && newRange?.to) {
                                    setDateRange(newRange);
                                }
                            }}
                            className="w-[240px]"
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-lg font-black text-[9px] uppercase tracking-widest text-gray-500 hover:bg-gray-50 border-gray-100 hidden md:flex"
                            onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'analytics' } }))}
                        >
                            <BarChart3 className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                            INTEL
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-9 rounded-lg px-3 font-black text-[9px] uppercase tracking-widest border-gray-100 text-gray-600 bg-gray-50/50">
                                    <Plus className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                    Quick Add
                                    <ChevronDown className="w-3 h-3 ml-1.5 opacity-40" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl p-2 border-gray-100">
                                <DropdownMenuLabel className="text-[9px] uppercase font-black tracking-[0.2em] text-gray-400 px-3 py-2">Universal Add</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'product' } }))} className="rounded-lg py-2 cursor-pointer">
                                    <PackageIcon className="w-4 h-4 mr-3 text-blue-500" />
                                    <span className="font-bold text-xs uppercase tracking-tight">Product</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'customer' } }))} className="rounded-lg py-2 cursor-pointer">
                                    <UsersIcon className="w-4 h-4 mr-3 text-green-500" />
                                    <span className="font-bold text-xs uppercase tracking-tight">Customer</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-50 my-1" />
                                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'invoice' } }))} className="rounded-lg py-2 cursor-pointer" style={{ color: colors?.primary || '#1a1a1a' }}>
                                    <Plus className="w-4 h-4 mr-3" />
                                    <span className="font-bold text-xs uppercase tracking-tight">New Invoice</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            size="sm"
                            onClick={() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'invoice' } }))}
                            className="h-9 text-white font-black text-[9px] uppercase tracking-widest rounded-lg px-4 shadow-md transition-all active:scale-95 border-none hidden sm:flex"
                            style={{
                                backgroundColor: colors?.primary || '#1a1a1a',
                            }}
                        >
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            NEW INVOICE
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-gray-100 mx-1 hidden sm:block"></div>

                    <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-wine hover:bg-wine/5 rounded-lg transition-colors h-9 w-9">
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                    </Button>
                </div>
            </div>
        </header >
    );
}

