'use client';

import { useState, useCallback } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';

const REQUIRED_COLUMNS = ['name', 'quantity', 'unit_price'];
const OPTIONAL_COLUMNS = ['description', 'tax_percent', 'discount_amount', 'customer_name', 'customer_email', 'customer_phone', 'due_date'];

export function BulkImportModal({
    isOpen,
    onClose,
    onImport,
    currency = 'PKR'
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('upload');
    const [parsedData, setParsedData] = useState(null);
    const [errors, setErrors] = useState([]);
    const [previewData, setPreviewData] = useState([]);

    const downloadTemplate = () => {
        const headers = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].join(',');
        const sampleRow = 'Product A,2,100,Description here,18,0,John Doe,john@example.com,555-0123,2025-12-31';
        const csvContent = `${headers}\n${sampleRow}`;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'invoice_import_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success('Template downloaded!');
    };

    const parseCSV = (content) => {
        const lines = content.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must have at least a header row and one data row');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Check required columns
        const missingRequired = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
        if (missingRequired.length > 0) {
            throw new Error(`Missing required columns: ${missingRequired.join(', ')}`);
        }

        const rows = [];
        const parseErrors = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            
            if (values.length !== headers.length) {
                parseErrors.push(`Row ${i}: Column count mismatch`);
                continue;
            }

            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });

            // Validate required fields
            if (!row.name || row.name.trim() === '') {
                parseErrors.push(`Row ${i}: Missing item name`);
                continue;
            }

            const qty = parseFloat(row.quantity);
            if (isNaN(qty) || qty <= 0) {
                parseErrors.push(`Row ${i}: Invalid quantity "${row.quantity}"`);
                continue;
            }

            const price = parseFloat(row.unit_price);
            if (isNaN(price) || price < 0) {
                parseErrors.push(`Row ${i}: Invalid unit price "${row.unit_price}"`);
                continue;
            }

            // Calculate totals
            const quantity = parseFloat(row.quantity);
            const unitPrice = parseFloat(row.unit_price);
            const taxPercent = parseFloat(row.tax_percent) || 0;
            const discountAmount = parseFloat(row.discount_amount) || 0;

            const subtotal = quantity * unitPrice;
            const taxAmount = (subtotal * taxPercent) / 100;
            const total = subtotal + taxAmount - discountAmount;

            rows.push({
                ...row,
                parsed_quantity: quantity,
                parsed_unit_price: unitPrice,
                parsed_tax_percent: taxPercent,
                parsed_discount_amount: discountAmount,
                calculated_subtotal: subtotal,
                calculated_tax: taxAmount,
                calculated_total: total
            });
        }

        return { rows, errors: parseErrors };
    };

    const handleFileUpload = useCallback((event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            toast.error('Please upload a CSV file');
            return;
        }

        setIsLoading(true);
        setErrors([]);
        setParsedData(null);
        setPreviewData([]);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result;
                const { rows, errors: parseErrors } = parseCSV(content);

                if (parseErrors.length > 0) {
                    setErrors(parseErrors);
                    setActiveTab('errors');
                    toast.error(`Found ${parseErrors.length} error(s)`);
                } else {
                    setParsedData(rows);
                    setPreviewData(rows.slice(0, 5)); // Show first 5 rows
                    setActiveTab('preview');
                    toast.success(`${rows.length} items parsed successfully!`);
                }
            } catch (error) {
                toast.error(error.message);
                setErrors([error.message]);
                setActiveTab('errors');
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
            toast.error('Failed to read file');
            setIsLoading(false);
        };
        reader.readAsText(file);
    }, []);

    const handleImport = async () => {
        if (!parsedData || parsedData.length === 0) {
            toast.error('No data to import');
            return;
        }

        setIsLoading(true);
        try {
            // Group items by customer (if customer info provided)
            const invoices = [];
            let currentInvoice = {
                items: [],
                customer: null
            };

            parsedData.forEach(row => {
                const item = {
                    name: row.name,
                    description: row.description || '',
                    quantity: row.parsed_quantity,
                    unit_price: row.parsed_unit_price,
                    tax_percent: row.parsed_tax_percent,
                    tax_amount: row.calculated_tax,
                    discount_amount: row.parsed_discount_amount,
                    total_amount: row.calculated_total
                };

                currentInvoice.items.push(item);

                // If customer info provided, attach it
                if (row.customer_name) {
                    currentInvoice.customer = {
                        name: row.customer_name,
                        email: row.customer_email || '',
                        phone: row.customer_phone || ''
                    };
                }

                // If due date provided
                if (row.due_date) {
                    currentInvoice.due_date = row.due_date;
                }
            });

            if (currentInvoice.items.length > 0) {
                invoices.push(currentInvoice);
            }

            await onImport(invoices);
            
            toast.success(`Successfully imported ${parsedData.length} items!`);
            onClose();
        } catch (error) {
            console.error('Import error:', error);
            toast.error(error.message || 'Failed to import invoices');
        } finally {
            setIsLoading(false);
        }
    };

    const resetState = () => {
        setParsedData(null);
        setErrors([]);
        setPreviewData([]);
        setActiveTab('upload');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                resetState();
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Bulk Import Invoices
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="upload" disabled={isLoading}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                        </TabsTrigger>
                        <TabsTrigger value="preview" disabled={!parsedData || isLoading}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Preview
                        </TabsTrigger>
                        <TabsTrigger value="errors" disabled={errors.length === 0}>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Errors {errors.length > 0 && `(${errors.length})`}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="upload" className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">CSV Format Requirements</h4>
                            <p className="text-sm text-blue-800 mb-2">
                                Required columns: <strong>{REQUIRED_COLUMNS.join(', ')}</strong>
                            </p>
                            <p className="text-sm text-blue-700 mb-3">
                                Optional: {OPTIONAL_COLUMNS.join(', ')}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={downloadTemplate}
                                className="text-blue-700 border-blue-300 hover:bg-blue-100"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download Template
                            </Button>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-400 transition-colors">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="csv-upload"
                                disabled={isLoading}
                            />
                            <label
                                htmlFor="csv-upload"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-12 h-12 text-gray-400 animate-spin mb-4" />
                                ) : (
                                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                                )}
                                <span className="text-lg font-medium text-gray-700">
                                    {isLoading ? 'Parsing...' : 'Click to upload CSV'}
                                </span>
                                <span className="text-sm text-gray-500 mt-1">
                                    or drag and drop
                                </span>
                            </label>
                        </div>
                    </TabsContent>

                    <TabsContent value="preview" className="space-y-4">
                        {previewData.length > 0 ? (
                            <>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    <span className="text-green-800">
                                        Ready to import <strong>{parsedData.length}</strong> items
                                        {parsedData.length > 5 && ' (showing first 5)'}
                                    </span>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium">Item</th>
                                                <th className="px-3 py-2 text-center font-medium">Qty</th>
                                                <th className="px-3 py-2 text-right font-medium">Price</th>
                                                <th className="px-3 py-2 text-right font-medium">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, idx) => (
                                                <tr key={idx} className="border-t">
                                                    <td className="px-3 py-2">{row.name}</td>
                                                    <td className="px-3 py-2 text-center">{row.parsed_quantity}</td>
                                                    <td className="px-3 py-2 text-right">
                                                        {currency === 'PKR' ? '₨' : '$'}{row.parsed_unit_price.toFixed(2)}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-medium">
                                                        {currency === 'PKR' ? '₨' : '$'}{row.calculated_total.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={resetState}
                                        className="flex-1"
                                        disabled={isLoading}
                                    >
                                        Upload Different File
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleImport}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                Import {parsedData.length} Items
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No data to preview. Upload a CSV file first.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="errors" className="space-y-4">
                        {errors.length > 0 ? (
                            <>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                    <span className="text-red-800">
                                        Found <strong>{errors.length}</strong> error(s) in your file
                                    </span>
                                </div>

                                <div className="border border-red-200 rounded-lg overflow-hidden">
                                    <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                                        <span className="font-medium text-red-800">Errors</span>
                                    </div>
                                    <ul className="divide-y divide-red-100 max-h-60 overflow-y-auto">
                                        {errors.map((error, idx) => (
                                            <li key={idx} className="px-4 py-2 text-sm text-red-700">
                                                {error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetState}
                                    className="w-full"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Try Again
                                </Button>
                            </>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No errors found. Your file looks good!
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
