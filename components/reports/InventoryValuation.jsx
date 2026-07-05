'use client';

import { useState, useEffect } from 'react';
import { Package, Download, RefreshCw, TrendingUp, DollarSign, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useCostingMethod } from '@/lib/hooks/useCostingMethod';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';
import { ResponsiveManagerHeader } from '@/components/mobile/HubSectionHeader';
import * as XLSX from 'xlsx';

/**
 * InventoryValuation Component
 * 
 * Displays inventory valuation report using selected costing method
 * Supports FIFO, LIFO, and WAC calculations
 * Includes export to Excel functionality
 * 
 * @param {Object} props
 * @param {string} props.businessId - Business ID
 * @param {string} props.costingMethod - Costing method (FIFO/LIFO/WAC)
 * @param {string} [props.currency] - Currency code
 */
export function InventoryValuation({ businessId, costingMethod = 'FIFO', currency = 'PKR' }) {
    const [valuation, setValuation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const { getInventoryValuation, loading } = useCostingMethod(businessId, costingMethod);

    useEffect(() => {
        loadValuation();
    }, [businessId, costingMethod]);

    const loadValuation = async () => {
        try {
            const result = await getInventoryValuation();
            setValuation(result);
        } catch (error) {
            console.error('Failed to load valuation:', error);
            toast.error('Failed to load inventory valuation');
        }
    };

    const handleExportToExcel = () => {
        if (!valuation || !valuation.products || valuation.products.length === 0) {
            toast.error('No data to export');
            return;
        }

        try {
            // Prepare data for Excel
            const excelData = valuation.products.map(product => ({
                'Product Name': product.product_name,
                'SKU': product.product_sku,
                'Category': product.category || 'N/A',
                'Quantity': product.total_quantity,
                'Unit Cost': product.unit_cost.toFixed(2),
                'Total Value': product.total_value.toFixed(2),
                'Batches': product.batches.length
            }));

            // Add summary row
            excelData.push({
                'Product Name': 'TOTAL',
                'SKU': '',
                'Category': '',
                'Quantity': valuation.total_quantity,
                'Unit Cost': valuation.average_unit_cost.toFixed(2),
                'Total Value': valuation.total_value.toFixed(2),
                'Batches': ''
            });

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(excelData);

            // Set column widths
            ws['!cols'] = [
                { wch: 30 }, // Product Name
                { wch: 15 }, // SKU
                { wch: 20 }, // Category
                { wch: 10 }, // Quantity
                { wch: 12 }, // Unit Cost
                { wch: 15 }, // Total Value
                { wch: 10 }  // Batches
            ];

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Inventory Valuation');

            // Add metadata sheet
            const metadata = [
                ['Report', 'Inventory Valuation'],
                ['Costing Method', costingMethod],
                ['Generated At', new Date(valuation.calculated_at).toLocaleString()],
                ['Currency', currency],
                ['Total Products', valuation.products.length],
                ['Total Quantity', valuation.total_quantity],
                ['Total Value', valuation.total_value.toFixed(2)]
            ];
            const metaWs = XLSX.utils.aoa_to_sheet(metadata);
            XLSX.utils.book_append_sheet(wb, metaWs, 'Report Info');

            // Generate filename
            const filename = `inventory_valuation_${costingMethod}_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Download
            XLSX.writeFile(wb, filename);
            toast.success('Report exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export report');
        }
    };

    // Filter products
    const filteredProducts = valuation?.products?.filter(product => {
        const matchesSearch = !searchQuery || 
            product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.product_sku.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
    }) || [];

    // Get unique categories
    const categories = valuation?.products 
        ? ['all', ...new Set(valuation.products.map(p => p.category).filter(Boolean))]
        : ['all'];

    return (
        <div className="min-w-0 space-y-6 overflow-x-hidden">
            <ResponsiveManagerHeader
                title="Inventory Valuation Report"
                subtitle={`Using ${costingMethod} costing method${valuation ? ` · Generated ${new Date(valuation.calculated_at).toLocaleString()}` : ''}`}
                titleClassName="lg:text-2xl"
                actions={[
                    {
                        id: 'refresh',
                        label: 'Refresh',
                        icon: RefreshCw,
                        variant: 'outline',
                        disabled: loading,
                        onClick: loadValuation,
                    },
                    {
                        id: 'export',
                        label: 'Export to Excel',
                        icon: Download,
                        className: 'bg-green-600 hover:bg-green-700 text-white',
                        disabled: loading || !valuation,
                        onClick: handleExportToExcel,
                    },
                ]}
            />

            {/* Summary Cards */}
            {valuation && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-blue-100">
                                    <Package className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Products</p>
                                    <p className="text-2xl font-bold text-gray-900">{valuation.products.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-green-100">
                                    <Layers className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Quantity</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {valuation.total_quantity.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-wine-100">
                                    <TrendingUp className="w-6 h-6 text-wine-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Avg Unit Cost</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(valuation.average_unit_cost, currency)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-lg bg-wine/10">
                                    <DollarSign className="w-6 h-6 text-wine" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Value</p>
                                    <p className="text-2xl font-bold text-wine">
                                        {formatCurrency(valuation.total_value, currency)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by product name or SKU..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2 border rounded-md bg-white"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Products Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Product Valuation Details</CardTitle>
                    <CardDescription>
                        Showing {filteredProducts.length} of {valuation?.products?.length || 0} products
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12">
                            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-wine" />
                            <p className="text-gray-600">Loading valuation...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <p>No products found</p>
                        </div>
                    ) : (
                        <>
                        <div className="hidden overflow-x-auto lg:block">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            SKU
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                            Category
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                            Quantity
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                            Unit Cost
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                            Total Value
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                                            Batches
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.product_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">
                                                    {product.product_name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-gray-600 font-mono">
                                                    {product.product_sku || '--'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {product.category ? (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {product.category}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-sm text-gray-400">--</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {product.total_quantity.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-sm text-gray-900">
                                                    {formatCurrency(product.unit_cost, currency)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className="text-sm font-semibold text-wine">
                                                    {formatCurrency(product.total_value, currency)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge className="bg-blue-100 text-blue-700">
                                                    {product.batches.length}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                                    <tr>
                                        <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-900">
                                            TOTAL
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                                            {filteredProducts.reduce((sum, p) => sum + p.total_quantity, 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                                            {formatCurrency(
                                                filteredProducts.reduce((sum, p) => sum + p.total_value, 0) /
                                                filteredProducts.reduce((sum, p) => sum + p.total_quantity, 0),
                                                currency
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-wine">
                                            {formatCurrency(
                                                filteredProducts.reduce((sum, p) => sum + p.total_value, 0),
                                                currency
                                            )}
                                        </td>
                                        <td className="px-4 py-3"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="divide-y divide-gray-100 lg:hidden">
                            {filteredProducts.map((product) => (
                                <div key={product.product_id} className="px-3 py-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate text-[13px] font-bold text-gray-900">{product.product_name}</p>
                                            <p className="mt-0.5 font-mono text-[11px] text-gray-500">{product.product_sku || '—'}</p>
                                            {product.category && (
                                                <Badge variant="secondary" className="mt-1 text-[10px]">{product.category}</Badge>
                                            )}
                                        </div>
                                        <p className="shrink-0 text-[13px] font-bold tabular-nums text-wine">
                                            {formatCurrency(product.total_value, currency)}
                                        </p>
                                    </div>
                                    <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] tabular-nums">
                                        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                                            <p className="text-[10px] uppercase text-gray-400">Qty</p>
                                            <p className="font-semibold">{product.total_quantity.toLocaleString()}</p>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                                            <p className="text-[10px] uppercase text-gray-400">Unit</p>
                                            <p className="font-semibold">{formatCurrency(product.unit_cost, currency)}</p>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
                                            <p className="text-[10px] uppercase text-gray-400">Batches</p>
                                            <p className="font-semibold">{product.batches.length}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="bg-gray-50 px-3 py-3 text-sm font-bold">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total value</span>
                                    <span className="text-wine tabular-nums">
                                        {formatCurrency(filteredProducts.reduce((sum, p) => sum + p.total_value, 0), currency)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

