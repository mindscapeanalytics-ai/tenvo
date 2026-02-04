'use client';

import { useState, useEffect } from 'react';
// import { supabase } from '@/lib/supabase/client'; // Removed
import { getGLEntriesAction, getGLAccountsAction } from '@/lib/actions/accounting';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';
import { BookOpen, Filter, Download } from 'lucide-react';
import { useBusiness } from '@/lib/context/BusinessContext';

export function GeneralLedgerReport({ businessId }) {
    const { currency } = useBusiness();
    const [accounts, setAccounts] = useState([]);

    const [selectedAccount, setSelectedAccount] = useState('all');
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    // Fetch Chart of Accounts
    useEffect(() => {
        async function fetchAccounts() {
            const result = await getGLAccountsAction(businessId);
            if (result.success) {
                setAccounts(result.accounts);
            } else {
                console.error('Failed to fetch accounts', result.error);
            }
        }
        if (businessId) fetchAccounts();
    }, [businessId]);

    // Fetch Ledger Entries
    const fetchLedger = async () => {
        setLoading(true);
        try {
            const result = await getGLEntriesAction(businessId, {
                startDate,
                endDate,
                accountId: selectedAccount
            });

            if (!result.success) throw new Error(result.error);
            setEntries(result.entries || []);
        } catch (error) {
            console.error('Error fetching GL:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId) fetchLedger();
    }, [businessId, selectedAccount]);
    // Should ideally be triggered by a "Search" button for dates, but auto-searching on account change is okay.

    const calculateRunningBalance = (currentEntries) => {
        let balance = 0;
        return currentEntries.map(entry => {
            // Asset/Expense: Debit +, Credit -
            // Liability/Equity/Income: Credit +, Debit -
            // For a mixed ledger view, standardizing on Debit - Credit is common, or simplified Dr/Cr columns.
            // Let's just show Dr and Cr.
            return { ...entry };
        });
    };

    return (
        <Card className="w-full shadow-sm">
            <CardHeader className="bg-gray-50/50 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                            <BookOpen className="w-6 h-6 text-wine" />
                            General Ledger
                        </CardTitle>
                        <CardDescription>Double-entry accounting records with full audit trail</CardDescription>
                    </div>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-4">
                    <div className="w-[200px]">
                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="All Accounts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Accounts</SelectItem>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.code} - {acc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="bg-white w-[140px]"
                        />
                        <span className="text-gray-400">to</span>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="bg-white w-[140px]"
                        />
                    </div>
                    <Button onClick={fetchLedger} className="bg-wine hover:bg-wine/90 text-white">
                        <Filter className="w-4 h-4 mr-2" /> Filter
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 border-b border-gray-100">
                            <TableHead className="w-[120px]">Date</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-gray-400">Loading records...</TableCell>
                            </TableRow>
                        ) : entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-12 text-gray-400">No entries found for this period.</TableCell>
                            </TableRow>
                        ) : (
                            entries.map(entry => (
                                <TableRow key={entry.id} className="hover:bg-gray-50/50">
                                    <TableCell className="font-mono text-xs text-gray-600">
                                        {format(new Date(entry.transaction_date), 'dd MMM yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm text-gray-700">{entry.account?.name}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">{entry.account?.code}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">
                                        {entry.description}
                                        <div className="text-[10px] text-gray-400 mt-0.5 capitalize">
                                            Ref: {entry.reference_type} #{entry.reference_id?.slice(0, 8)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-gray-900 border-r border-gray-50 bg-gray-50/30">
                                        {entry.debit > 0 ? formatCurrency(entry.debit, currency) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-gray-900">
                                        {entry.credit > 0 ? formatCurrency(entry.credit, currency) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
