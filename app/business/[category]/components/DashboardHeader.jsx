'use client';

import React from 'react';
import { Search, Plus, ListFilter, Download, LayoutGrid, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/context/LanguageContext';

export function DashboardHeader({
    activeTab,
    onQuickAction,
    onExport,
}) {
    const { t } = useLanguage();

    return (
        <div className="sticky top-0 z-30 pb-2.5 pt-1 -mx-4 px-4 bg-gray-50/40 backdrop-blur-sm border-b border-gray-200/30">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
                {/* Contextual Info / Breadcrumb extension */}
                <div className="flex items-center gap-2">
                    <div className="h-4 w-px bg-gray-200 mx-2" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Contextual Tools
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Filters & Actions */}
                    <div className="flex items-center gap-1.5 mr-2 pr-2 border-r border-gray-100">
                        <Button variant="ghost" className="h-8 px-2.5 rounded-lg gap-2 text-gray-500 hover:text-indigo-600 hover:bg-white transition-all">
                            <ListFilter className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Filters</span>
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 rounded-lg gap-2 text-gray-500 hover:text-indigo-600 hover:bg-white transition-all"
                            onClick={onExport}
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Export</span>
                        </Button>
                    </div>

                    <Button
                        size="sm"
                        className="h-8 rounded-lg gap-1.5 px-3 font-bold text-[10px] uppercase tracking-wider bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-indigo-200 transition-all shadow-sm"
                        onClick={() => {
                            if (activeTab === 'inventory') onQuickAction?.('add-product');
                            else if (activeTab === 'invoices') onQuickAction?.('add-invoice');
                            else if (activeTab === 'customers') onQuickAction?.('add-customer');
                            else onQuickAction?.('add-product');
                        }}
                    >
                        <Plus className="w-3.5 h-3.5 text-indigo-500" />
                        <span>
                            {activeTab === 'inventory' ? 'Add Product' :
                                activeTab === 'invoices' ? 'New Invoice' :
                                    activeTab === 'customers' ? 'New Customer' : 'Quick Add'}
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
