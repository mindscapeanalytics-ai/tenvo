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
import { MoreHorizontal, FileText, Truck, FileCheck, Printer } from 'lucide-react';
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

export function SalesOrdersTable({ data, onView, onConvert, isLoading }) {
    const { currency } = useBusiness();

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading sales orders...</div>;
    }

    if (data.length === 0) {
        return <div className="p-8 text-center text-muted-foreground border rounded-lg bg-gray-50">No sales orders found.</div>;
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Delivery Date</TableHead>
                        <TableHead className="text-right">Total Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.order_number}</TableCell>
                            <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{order.customer_name}</span>
                                </div>
                            </TableCell>
                            <TableCell>{order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : '-'}</TableCell>
                            <TableCell className="text-right font-bold">
                                {formatCurrency(order.total_amount || order.grand_total || 0, currency)}
                            </TableCell>
                            <TableCell>
                                <Badge variant={order.status === 'pending' ? 'outline' : 'success'} className="uppercase text-[10px]">
                                    {order.status}
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
                                        <DropdownMenuItem onClick={() => onView(order)}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onView(order)}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            Print / PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onConvert(order.id, 'challan')}>
                                            <Truck className="mr-2 h-4 w-4" />
                                            Create Delivery Challan
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onConvert(order.id, 'invoice')}>
                                            <FileCheck className="mr-2 h-4 w-4" />
                                            Issue Invoice
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
