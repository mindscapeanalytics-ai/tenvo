/**
 * Invoice Tab - Server Component with Lazy Loading
 * Displays invoice list and invoice builder
 */


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, type CurrencyCode } from '@/lib/currency';
import { DataTable } from '@/components/DataTable';
import { ExportButton } from '@/components/ExportButton';

import type { Invoice } from '@/types';

interface InvoiceTabProps {
    invoices: Invoice[];
    currency?: CurrencyCode;
    onInvoiceDelete?: (id: string) => Promise<void>;
    onEdit?: (invoice: Invoice) => void;
    onBulkDelete?: (ids: string[]) => Promise<void>;
    onExport?: (data: any[]) => void;
    category?: string;
    colors?: any;
}

export function InvoiceTab({
    invoices,
    currency = 'PKR',
    onInvoiceDelete,
    onEdit,
    onBulkDelete,
    onExport,
    category = 'retail-shop',
    colors = { primary: '#000' }
}: InvoiceTabProps) {
    // Server-side calculations
    const stats = {
        total: invoices.length,
        paid: invoices.filter(inv => inv.status === 'paid').length,
        pending: invoices.filter(inv => inv.status === 'pending').length,
        overdue: invoices.filter(inv => inv.status === 'overdue').length,
        totalAmount: invoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0)
    };

    return (
        <div className="space-y-6">
            {/* Invoice Stats - Server Component */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Invoices</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Paid</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Pending</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Overdue</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Invoice List - Card with DataTable */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Invoices</CardTitle>
                            <CardDescription>
                                Total value: {formatCurrency(stats.totalAmount, currency)}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <ExportButton
                                data={invoices}
                                filename="invoices"
                                columns={[
                                    { key: 'invoice_number', label: 'Invoice #' },
                                    { key: 'customer_name', label: 'Customer' },
                                    { key: 'date', label: 'Date' },
                                    { key: 'grand_total', label: 'Total' },
                                    { key: 'status', label: 'Status' },
                                ]}
                                title="Sales Invoices Report"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <DataTable
                        category={category}
                        data={invoices.map(inv => ({
                            ...inv,
                            customer_name: inv.customer?.name || 'Walk-in Customer',
                            grand_total_formatted: formatCurrency(Number(inv.grand_total || inv.amount || 0), currency as any)
                        }))}
                        onExport={onExport}
                        onBulkDelete={onBulkDelete}
                        columns={[
                            { accessorKey: 'invoice_number', header: 'Invoice #' },
                            { accessorKey: 'customer_name', header: 'Customer' },
                            {
                                accessorKey: 'date',
                                header: 'Date',
                                cell: ({ row }: any) => new Date(row.original.date).toLocaleDateString()
                            },
                            {
                                accessorKey: 'grand_total',
                                header: 'Total',
                                cell: ({ row }: any) => (
                                    <span className="font-bold" style={{ color: colors.primary }}>
                                        {row.original.grand_total_formatted}
                                    </span>
                                )
                            },
                            {
                                accessorKey: 'status',
                                header: 'Status',
                                cell: ({ row }: any) => (
                                    <Badge className={getStatusColor(row.original.status)}>
                                        {row.original.status}
                                    </Badge>
                                )
                            },
                            {
                                id: 'actions',
                                header: 'Actions',
                                cell: ({ row }: any) => (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit?.(row.original)}
                                            className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onInvoiceDelete?.(row.original.id)}
                                            className="h-8 w-8 text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )
                            }
                        ]}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'paid':
            return 'bg-green-100 text-green-800 hover:bg-green-200';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
        case 'overdue':
            return 'bg-red-100 text-red-800 hover:bg-red-200';
        default:
            return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
}
