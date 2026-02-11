'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Save, BrainCircuit, Hash, Package, TrendingUp, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { getDomainKnowledge, getDomainDefaults } from '@/lib/domainKnowledge';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

/**
 * SmartQuickAddModal
 * A condensed, high-speed product entry interface for domain experts.
 * Features: Margin-first pricing, Auto-SKU, Domain presets.
 */
export function SmartQuickAddModal({
    isOpen,
    onClose,
    onSave,
    category = 'retail-shop',
    businessId,
    currency = 'PKR'
}) {
    const knowledge = getDomainKnowledge(category);
    const defaults = getDomainDefaults(category);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        costPrice: 0,
        marginPercent: 20, // Default 20% margin
        price: 0,
        stock: 0,
        unit: defaults.defaultUnit || 'pcs',
        taxPercent: defaults.defaultTax || 17,
        category: knowledge.name || 'General'
    });

    const [isGeneratingSku, setIsGeneratingSku] = useState(false);

    // Auto-calculate selling price when cost or margin changes
    useEffect(() => {
        const cost = Number(formData.costPrice) || 0;
        const margin = Number(formData.marginPercent) || 0;
        const calculatedPrice = cost + (cost * (margin / 100));

        // Only update if it's different to avoid loops
        if (Math.abs(formData.price - calculatedPrice) > 0.01) {
            setFormData(prev => ({ ...prev, price: Math.round(calculatedPrice) }));
        }
    }, [formData.costPrice, formData.marginPercent]);

    // Auto-calculate margin if price is edited manually
    const handlePriceChange = (val) => {
        const price = Number(val) || 0;
        const cost = Number(formData.costPrice) || 0;

        let margin = 0;
        if (cost > 0) {
            margin = ((price - cost) / cost) * 100;
        }

        setFormData(prev => ({
            ...prev,
            price,
            marginPercent: Number(margin.toFixed(2))
        }));
    };

    // Auto-SKU Generator
    const generateSku = () => {
        setIsGeneratingSku(true);
        setTimeout(() => {
            const prefix = (knowledge.name || category).substring(0, 3).toUpperCase();
            const date = new Date().toISOString().slice(2, 4) + new Date().toISOString().slice(5, 7);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const newSku = `${prefix}-${date}-${random}`;

            setFormData(prev => ({ ...prev, sku: newSku }));
            setIsGeneratingSku(false);
            toast.success("Intelligent SKU generated");
        }, 300);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!formData.name) {
            toast.error("Product name is required");
            return;
        }

        const payload = {
            ...formData,
            business_id: businessId,
            cost_price: formData.costPrice,
            tax_percent: formData.taxPercent,
            mrp: formData.price, // Default MRP to Price for quick add
            is_active: true,
            domain_data: {
                is_quick_add: true,
                source: 'smart-quick-add'
            }
        };

        try {
            await onSave(payload);
            setFormData({
                name: '',
                sku: '',
                costPrice: 0,
                marginPercent: 20,
                price: 0,
                stock: 0,
                unit: defaults.defaultUnit || 'pcs',
                taxPercent: defaults.defaultTax || 17,
                category: knowledge.name || 'General'
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl bg-white/95 backdrop-blur-xl rounded-3xl">
                <DialogHeader className="p-8 pb-4 bg-slate-900 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-primary/20 backdrop-blur-md text-primary-foreground">
                            <BrainCircuit className="w-5 h-5 text-blue-400" />
                        </div>
                        <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400 font-black uppercase tracking-widest">
                            Intelligent Entry
                        </Badge>
                    </div>
                    <DialogTitle className="text-2xl font-black tracking-tight">Smart Quick-Add</DialogTitle>
                    <DialogDescription className="text-slate-400 font-medium">
                        Optimized for <span className="text-blue-400 font-bold">{category.replace('-', ' ')}</span> standards.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6">
                    <div className="space-y-4">
                        {/* Identity Section */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Product Name</Label>
                                <Input
                                    placeholder="e.g. Premium Cotton Roll"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="h-12 rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center justify-between">
                                    SKU / Code
                                    <button
                                        type="button"
                                        onClick={generateSku}
                                        className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors"
                                    >
                                        <RefreshCw className={cn("w-3 h-3", isGeneratingSku && "animate-spin")} />
                                        Auto-Gen
                                    </button>
                                </Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="Generating..."
                                        value={formData.sku}
                                        onChange={e => setFormData(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                                        className="h-12 pl-10 rounded-xl font-mono text-sm uppercase"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Inventory Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Opening Stock</Label>
                                <div className="relative">
                                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        value={formData.stock}
                                        onChange={e => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                                        className="h-12 pl-10 rounded-xl font-bold"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Unit</Label>
                                <select
                                    value={formData.unit}
                                    onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                                    className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50/50 px-3 text-sm font-bold focus:bg-white outline-none transition-all"
                                >
                                    {knowledge.units?.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Pricing Section (Margin-First) */}
                        <div className="p-6 rounded-3xl bg-blue-50/50 border border-blue-100/50 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs font-black uppercase text-blue-900 tracking-widest">Margin-First Pricing</span>
                                </div>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Info className="w-3 h-3 text-blue-400 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-slate-900 text-white p-3 rounded-xl border-none shadow-xl">
                                            <p className="text-xs font-medium">Set your cost and target margin. We'll handle the math.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-blue-800 tracking-wide">Net Cost</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₨</span>
                                        <Input
                                            type="number"
                                            value={formData.costPrice || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                                            className="h-10 pl-8 rounded-lg border-blue-200 focus:ring-blue-500 font-bold"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-bold text-blue-800 tracking-wide">Margin %</Label>
                                    <div className="relative">
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 font-bold text-xs">%</span>
                                        <Input
                                            type="number"
                                            value={formData.marginPercent || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, marginPercent: parseFloat(e.target.value) || 0 }))}
                                            className="h-10 pr-8 rounded-lg border-blue-200 focus:ring-blue-500 font-bold text-blue-700"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-4 rounded-2xl bg-white border border-blue-100 flex items-center justify-between shadow-sm">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Selling Price (Auto)</p>
                                    <p className="text-2xl font-black text-gray-900">{formatCurrency(formData.price, currency)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Est. Profit</p>
                                    <p className="text-lg font-black text-emerald-600">
                                        +{formatCurrency(formData.price - formData.costPrice, currency)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="rounded-xl font-bold text-gray-500 hover:text-gray-900"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 px-8 font-bold shadow-lg shadow-slate-200"
                        >
                            Deploy Product
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Helper: Refresh icon for Auto-Gen (missing in main lucide imports)
function RefreshCw({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24" height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    );
}
