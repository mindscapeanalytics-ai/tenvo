'use client';

import React from 'react';
import { Search, Plus, ListFilter, Download, LayoutGrid, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/context/LanguageContext';

export function DashboardHeader({
    category,
    colors,
    domainKnowledge,
    activeTab,
    onQuickAction,
    onExport,
    searchValue,
    onSearchChange,
    children // kept for backward compatibility but no longer renders tabs
}) {
    const { t, language } = useLanguage();

    return (
        <div className="sticky top-0 z-30 pb-3 pt-2 -mx-4 px-4 bg-gray-50/80 backdrop-blur-xl border-b border-gray-200/50">
            <div className="max-w-[1600px] mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-md group">
                            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors ${language === 'ur' ? 'right-3' : 'left-3'}`} />
                            <Input
                                id="dashboard-search"
                                placeholder={t.search_placeholder}
                                className={`h-10 bg-white/70 border-gray-200/50 focus:bg-white focus:ring-indigo-500/20 focus:border-indigo-300 transition-all rounded-xl ${language === 'ur' ? 'pr-10' : 'pl-10'}`}
                                value={searchValue}
                                onChange={(e) => onSearchChange?.(e.target.value)}
                            />
                            {searchValue && (
                                <button
                                    onClick={() => onSearchChange?.('')}
                                    className={`absolute top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors ${language === 'ur' ? 'left-3' : 'right-3'}`}
                                >
                                    <X className="w-3 h-3 text-gray-400" />
                                </button>
                            )}
                        </div>

                        {/* Quick Filter */}
                        <Button variant="outline" className="h-10 px-3 rounded-xl gap-2 border-gray-200/50 bg-white/50 hover:bg-white">
                            <ListFilter className="w-4 h-4" />
                            <span className="hidden sm:inline text-xs">Filters</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 rounded-xl gap-2 border-gray-200/50 bg-white/50 hover:bg-white"
                            onClick={onExport}
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden lg:inline text-xs">Export</span>
                        </Button>

                        <Button
                            className="h-10 rounded-xl gap-2 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all px-4 font-bold bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => {
                                if (activeTab === 'inventory') {
                                    onQuickAction?.('add-product');
                                } else if (activeTab === 'invoices') {
                                    onQuickAction?.('add-invoice');
                                } else if (activeTab === 'customers') {
                                    onQuickAction?.('add-customer');
                                } else {
                                    onQuickAction?.('add-product');
                                }
                            }}
                        >
                            <Plus className="w-5 h-5" />
                            <span>
                                {activeTab === 'inventory' ? 'Add Product' :
                                    activeTab === 'invoices' ? 'New Invoice' :
                                        activeTab === 'customers' ? 'New Customer' : 'Quick Add'}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
