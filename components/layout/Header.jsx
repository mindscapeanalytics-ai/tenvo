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
    History,
    ListFilter,
    Download,
    LayoutGrid,
    Eye
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
                ? <span key={i} className="text-indigo-600 bg-indigo-50 font-black">{part}</span>
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
        <header className="h-14 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 flex items-center px-4 lg:px-6 sticky top-0 z-40 shadow-sm">
            <div className="flex items-center justify-between w-full max-w-[1600px] mx-auto gap-4">
                {/* Left: Mobile Menu & Module Breadcrumb */}
                <div className="flex items-center gap-3 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden shrink-0 h-8 w-8 text-gray-400"
                        onClick={onMenuClick}
                    >
                        <Menu className="w-4 h-4" />
                    </Button>

                    <div className="flex flex-col -space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none">
                            {business?.domain?.replace(/-/g, ' ') || 'Dashboard'}
                        </span>
                        <h1 className="text-sm font-black text-gray-900 tracking-tight">
                            {activeTitle}
                        </h1>
                    </div>
                </div>

                {/* Center: Global Search Bar */}
                <div className="hidden md:flex flex-1 justify-center max-w-lg px-4" ref={searchRef}>
                    <div className="relative w-full group">
                        <Search className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-indigo-600 transition-colors ${language === 'ur' ? 'right-3' : 'left-3'}`} />
                        <Input
                            placeholder={t.search_placeholder + '...'}
                            className={`h-9 text-xs bg-gray-50 border-gray-200/50 focus:bg-white focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/5 transition-all rounded-xl ${language === 'ur' ? 'pr-9' : 'pl-9'}`}
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
                                                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors group text-left border border-transparent ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'}`}
                                                                        >
                                                                            <div className="flex flex-col">
                                                                                <span className={`text-xs font-bold tracking-tight ${isSelected ? 'text-indigo-700' : 'text-gray-900'}`}>
                                                                                    {highlightMatch(item.name || item.number || item.product_name || 'Unnamed Item', searchQuery)}
                                                                                </span>
                                                                                <span className="text-[10px] text-gray-500 line-clamp-1">
                                                                                    {highlightMatch(item.sku || item.customer_name || item.company_name || item.category || item.status || '', searchQuery)}
                                                                                </span>
                                                                            </div>
                                                                            <ChevronIcon className={`w-3 h-3 transition-all ${isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-gray-300'}`} />
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

                {/* Right: Consolidated Actions */}
                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="flex items-center gap-2 border-r border-gray-100 pr-2.5">
                        <DateRangePicker
                            date={dateRange}
                            onDateChange={(newRange) => {
                                if (newRange?.from && newRange?.to) {
                                    setDateRange(newRange);
                                }
                            }}
                            className="w-[220px]"
                        />

                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 px-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all hidden lg:flex"
                            onClick={() => window.dispatchEvent(new CustomEvent('switch-tab', { detail: { tab: 'analytics' } }))}
                        >
                            <BarChart3 className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                            INTEL
                        </Button>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-9 rounded-xl px-3 font-bold text-[10px] uppercase tracking-wider border-gray-200/60 bg-white hover:bg-gray-50 text-gray-600 transition-all">
                                    <ListFilter className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                    Controls
                                    <ChevronDown className="w-3 h-3 ml-1.5 opacity-30" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-xl p-2 border-gray-100/80 backdrop-blur-xl">
                                <DropdownMenuLabel className="text-[9px] uppercase font-black tracking-[0.2em] text-gray-400 px-3 py-2">Page Controls</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('toggle-filters'))} className="rounded-xl py-2.5 cursor-pointer">
                                    <ListFilter className="w-4 h-4 mr-3 text-indigo-500" />
                                    <span className="font-bold text-xs">Toggle Filters</span>
                                    <DropdownMenuShortcut>⌘F</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('export-data'))} className="rounded-xl py-2.5 cursor-pointer">
                                    <Download className="w-4 h-4 mr-3 text-emerald-500" />
                                    <span className="font-bold text-xs">Export Data</span>
                                    <DropdownMenuShortcut>S</DropdownMenuShortcut>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-50 my-1" />
                                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('change-layout'))} className="rounded-xl py-2.5 cursor-pointer">
                                    <LayoutGrid className="w-4 h-4 mr-3 text-orange-500" />
                                    <span className="font-bold text-xs">Change Layout</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('personalize-view'))} className="rounded-xl py-2.5 cursor-pointer">
                                    <Eye className="w-4 h-4 mr-3 text-blue-500" />
                                    <span className="font-bold text-xs">Personalize View</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-9 rounded-xl px-3 font-bold text-[10px] uppercase tracking-wider border-gray-200/60 bg-white hover:bg-gray-50 text-gray-600 transition-all">
                                    <Plus className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                    Add
                                    <ChevronDown className="w-3 h-3 ml-1.5 opacity-30" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 rounded-2xl shadow-xl p-2 border-gray-100/80 backdrop-blur-xl">
                                <DropdownMenuLabel className="text-[9px] uppercase font-black tracking-[0.2em] text-gray-400 px-3 py-2">Quick Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'product' } }))} className="rounded-xl py-2.5 cursor-pointer">
                                    <PackageIcon className="w-4 h-4 mr-3 text-blue-500" />
                                    <span className="font-bold text-xs">New Product</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'customer' } }))} className="rounded-xl py-2.5 cursor-pointer">
                                    <UsersIcon className="w-4 h-4 mr-3 text-green-500" />
                                    <span className="font-bold text-xs">New Customer</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-50 my-1" />
                                <DropdownMenuItem onClick={() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'invoice' } }))} className="rounded-xl py-2.5 cursor-pointer text-indigo-600 bg-indigo-50/50">
                                    <Plus className="w-4 h-4 mr-3" />
                                    <span className="font-bold text-xs">Create Invoice</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            size="sm"
                            onClick={() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'invoice' } }))}
                            className="h-9 font-bold text-xs rounded-xl px-4 shadow-sm shadow-indigo-200 transition-all active:scale-95 bg-indigo-600 hover:bg-indigo-700 text-white hidden sm:flex"
                        >
                            <Plus className="w-4 h-4 mr-1.5" />
                            New Invoice
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-gray-100 mx-1"></div>

                    <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all h-9 w-9">
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                    </Button>
                </div>
            </div>
        </header >
    );
}

