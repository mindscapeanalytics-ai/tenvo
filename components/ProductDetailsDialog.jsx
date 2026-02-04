'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Package,
    Tag,
    Calendar,
    DollarSign,
    BarChart3,
    Layers,
    Hash,
    AlertTriangle,
    CheckCircle2,
    Info
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { getDomainDefaults } from '@/lib/domainKnowledge';

const DetailSection = ({ title, icon: Icon, children }) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            {Icon && <Icon className="w-4 h-4 text-gray-500" />}
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children}
        </div>
    </div>
);

const DetailItem = ({ label, value, className = "", fullWidth = false }) => (
    <div className={`space-y-1 ${fullWidth ? 'col-span-full' : ''}`}>
        <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</label>
        <div className={`text-sm font-medium text-gray-900 break-words ${className}`}>
            {value || <span className="text-gray-400 italic">Not set</span>}
        </div>
    </div>
);

export function ProductDetailsDialog({
    product,
    open,
    onClose,
    category = 'retail-shop'
}) {
    if (!product) return null;

    const domainFields = getDomainDefaults(category).productFields || [];
    const stockValue = (product.price || 0) * (product.stock || 0);
    const isLowStock = (product.stock || 0) <= (product.min_stock || 0);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl">
                <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <DialogTitle className="text-xl font-bold text-gray-900">
                                    {product.name}
                                </DialogTitle>
                                <Badge variant={isLowStock ? "destructive" : "outline"} className={isLowStock ? "" : "bg-emerald-50 text-emerald-700 border-emerald-200"}>
                                    {isLowStock ? "Low Stock" : "In Stock"}
                                </Badge>
                            </div>
                            <DialogDescription className="text-sm text-gray-500 line-clamp-1">
                                {product.description || 'No description available'}
                            </DialogDescription>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(product.price, 'PKR')}
                            </div>
                            <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Selling Price</div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-8">
                        {/* Basic Information */}
                        <DetailSection title="Product Identity" icon={Package}>
                            <DetailItem label="SKU" value={product.sku} className="font-mono bg-gray-100 px-2 py-1 rounded w-fit text-xs" />
                            <DetailItem label="Barcode" value={product.barcode} className="font-mono" />
                            <DetailItem label="Brand" value={product.brand} />
                            <DetailItem label="Category" value={product.category} />
                            <DetailItem label="Unit" value={product.unit} />
                            <DetailItem label="Tax Rate" value={`${product.tax_percent || 0}%`} />
                        </DetailSection>

                        {/* Inventory Status */}
                        <DetailSection title="Inventory Status" icon={BarChart3}>
                            <div className="p-4 bg-gray-50 rounded-xl col-span-full grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 uppercase">Current Stock</span>
                                    <div className={`text-xl font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                        {product.stock || 0}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 uppercase">Stock Value</span>
                                    <div className="text-xl font-bold text-gray-900">
                                        {formatCurrency(stockValue, 'PKR')}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 uppercase">Min Stock</span>
                                    <div className="text-xl font-bold text-gray-700">{product.min_stock || 0}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-gray-500 uppercase">Reorder Point</span>
                                    <div className="text-xl font-bold text-gray-700">{product.reorder_point || 0}</div>
                                </div>
                            </div>
                        </DetailSection>

                        {/* Pricing Details */}
                        <DetailSection title="Financials" icon={DollarSign}>
                            <DetailItem label="Cost Price" value={formatCurrency(product.cost_price || 0, 'PKR')} />
                            <DetailItem label="MRP" value={formatCurrency(product.mrp || 0, 'PKR')} />
                            <DetailItem label="Profit Margin"
                                value={product.cost_price && product.price ?
                                    `${(((product.price - product.cost_price) / product.cost_price) * 100).toFixed(1)}%` :
                                    '-'}
                                className="text-emerald-600 font-bold"
                            />
                        </DetailSection>

                        {/* Advanced Tracking */}
                        {/* Advanced Tracking - Batches */}
                        {(product.batches?.length > 0 || product.batch_number) && (
                            <DetailSection title="Batch Information" icon={Calendar}>
                                {product.batches?.length > 0 ? (
                                    <div className="col-span-full space-y-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {product.batches.map((batch, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-100 transition-colors">
                                                    <div className="space-y-0.5">
                                                        <div className="font-mono font-bold text-gray-900 text-sm">{batch.batch_number}</div>
                                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">
                                                            Exp: {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}
                                                        </div>
                                                    </div>
                                                    <Badge variant="secondary" className="bg-white border border-gray-200 shadow-sm text-gray-700">
                                                        Qty: {batch.quantity}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <DetailItem label="Batch Number" value={product.batch_number} />
                                        <DetailItem label="Manufacturing Date" value={product.manufacturing_date ? new Date(product.manufacturing_date).toLocaleDateString() : null} />
                                        <DetailItem label="Expiry Date"
                                            value={product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : null}
                                            className={product.expiry_date && new Date(product.expiry_date) < new Date() ? 'text-red-600 font-bold' : ''}
                                        />
                                    </>
                                )}
                            </DetailSection>
                        )}

                        {/* Advanced Tracking - Serials */}
                        {product.serial_numbers?.length > 0 && (
                            <DetailSection title="Serial Numbers" icon={Hash}>
                                <div className="col-span-full">
                                    <div className="flex flex-wrap gap-2">
                                        {product.serial_numbers.map((serial, idx) => (
                                            <Badge key={idx} variant="outline" className="font-mono text-xs py-1 px-2 border-gray-300 text-gray-700 bg-gray-50">
                                                {typeof serial === 'string' ? serial : serial.serial_number}
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 text-right">
                                        Total Serials: {product.serial_numbers.length}
                                    </p>
                                </div>
                            </DetailSection>
                        )}

                        {/* Domain Specific Data */}
                        {domainFields.length > 0 && product.domain_data && Object.keys(product.domain_data).length > 0 && (
                            <DetailSection title="Domain Specifications" icon={Info}>
                                {domainFields.map(field => {
                                    const key = field.toLowerCase().replace(/[^a-z0-9]/g, '');
                                    const snakeKey = field.toLowerCase().replace(/\s+/g, '_');
                                    const value = product.domain_data[key] || product.domain_data[snakeKey] || product.domain_data[field];

                                    if (!value) return null;

                                    return (
                                        <DetailItem
                                            key={field}
                                            label={field.replace(/_/g, ' ')}
                                            value={String(value)}
                                        />
                                    );
                                })}
                            </DetailSection>
                        )}

                        {/* System Info */}
                        <DetailSection title="System Info" icon={Hash}>
                            <DetailItem label="Product ID" value={product.id} className="font-mono text-[10px] text-gray-400" fullWidth />
                            <div className="grid grid-cols-2 gap-4 col-span-full">
                                <DetailItem label="Created At" value={product.created_at ? new Date(product.created_at).toLocaleString() : '-'} className="text-xs" />
                                <DetailItem label="Last Updated" value={product.updated_at ? new Date(product.updated_at).toLocaleString() : '-'} className="text-xs" />
                            </div>
                        </DetailSection>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
