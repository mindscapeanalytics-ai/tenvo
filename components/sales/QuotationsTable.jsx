'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, FileText, ArrowRight, Printer } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/currency';
import { useBusiness } from '@/lib/context/BusinessContext';

export function QuotationsTable({ data, onView, onConvert, isLoading }) {
    const { currency } = useBusiness();

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading quotations...</div>;
    }

    if (data.length === 0) {
        return <div className="p-8 text-center text-muted-foreground border rounded-lg bg-gray-50">No quotations found. Create one to get started.</div>;
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Quotation #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Valid Until</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((quotation) => (
                        <TableRow key={quotation.id}>
                            <TableCell className="font-medium">{quotation.quotation_number}</TableCell>
                            <TableCell>{new Date(quotation.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{quotation.customer_name}</span>
                                    <span className="text-xs text-muted-foreground">{quotation.customer_email}</span>
                                </div>
                            </TableCell>
                            <TableCell>{new Date(quotation.valid_until).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right font-bold">
                                {formatCurrency(quotation.total_amount || quotation.grand_total || 0, currency)}
                            </TableCell>
                            <TableCell>
                                <Badge variant={quotation.status === 'draft' ? 'secondary' : 'default'} className="uppercase text-[10px]">
                                    {quotation.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => onView(quotation)}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onView(quotation)}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            Print / PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onConvert(quotation.id)}>
                                            <ArrowRight className="mr-2 h-4 w-4" />
                                            Convert to Sales Order
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
