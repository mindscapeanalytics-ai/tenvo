'use client';

import { useState, useEffect } from 'react';
// import { supabase } from '@/lib/supabase/client';
import { getStockMovementsAction } from '@/lib/actions/stock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, History, RefreshCcw } from 'lucide-react';

export function StockHistory({ productId, businessId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const result = await getStockMovementsAction(productId);
            if (!result.success) throw new Error(result.error);
            setHistory(result.movements || []);
        } catch (error) {
            console.error('Error fetching stock history:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (productId) {
            fetchHistory();
        }
    }, [productId]);

    const getTypeColor = (type) => {
        switch (type) {
            case 'purchase': return 'bg-green-100 text-green-800 border-green-200';
            case 'sale': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'adjustment': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'manufacturing': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'return': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <Card className="shadow-none border-0">
            <CardHeader className="px-0 pt-0 pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-500" />
                        Stock Ledger (Audit Trail)
                    </CardTitle>
                    <button
                        onClick={fetchHistory}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <RefreshCcw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="px-0">
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="w-[180px]">Date & Time</TableHead>
                                <TableHead>Transaction</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead className="text-right">Change</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        Loading ledger entries...
                                    </TableCell>
                                </TableRow>
                            ) : history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                        No stock movements recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map((entry) => (
                                    <TableRow key={entry.id} className="hover:bg-gray-50/50">
                                        <TableCell className="font-mono text-xs text-gray-600">
                                            {format(new Date(entry.created_at), 'dd MMM yyyy, HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`${getTypeColor(entry.transaction_type)} capitalize`}>
                                                {entry.transaction_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {entry.notes || '-'}
                                            {entry.batch_number && (
                                                <span className="ml-2 text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 border border-gray-200">
                                                    Batch: {entry.batch_number}
                                                </span>
                                            )}
                                            {entry.domain_data && Object.keys(entry.domain_data).length > 0 && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {Object.entries(entry.domain_data).map(([key, value]) => (
                                                        <span key={key} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 capitalize">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}: {value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`font-mono font-bold flex items-center justify-end gap-1 ${entry.quantity_change > 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {entry.quantity_change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                                {entry.quantity_change > 0 ? '+' : ''}{entry.quantity_change}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-semibold text-gray-900">
                                            {entry.running_balance}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
