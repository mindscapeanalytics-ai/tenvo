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
import { MoreHorizontal, FileText, Truck, FileCheck, Printer, ShoppingCart } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/currency';
import { formatDisplayDate } from '@/lib/utils/formatDisplayDate';
import { useBusiness } from '@/lib/context/BusinessContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { HubEntityMobileList } from '@/components/mobile/HubEntityMobileList';

export function SalesOrdersTable({ data, onView, onConvert, isLoading }) {
    const { currency } = useBusiness();

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading sales orders...</div>;
    }

    if (data.length === 0) {
        return <EmptyState module="orders" compact />;
    }

    return (
        <div className="min-w-0 overflow-x-hidden">
            <div className="hidden rounded-md border lg:block">
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
                                <TableCell>{formatDisplayDate(order.date)}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{order.customer_name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{order.delivery_date ? formatDisplayDate(order.delivery_date) : '—'}</TableCell>
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

            <div className="lg:hidden">
                <HubEntityMobileList
                    items={data}
                    getKey={(o) => o.id}
                    onRowPress={onView}
                    renderIcon={() => <ShoppingCart className="h-5 w-5 text-wine" />}
                    getTitle={(o) => o.order_number}
                    getSubtitle={(o) => {
                        const delivery = o.delivery_date ? formatDisplayDate(o.delivery_date) : 'No delivery date';
                        return `${o.customer_name} · ${delivery}`;
                    }}
                    getAmount={(o) => formatCurrency(o.total_amount || o.grand_total || 0, currency)}
                    renderBadge={(o) => (
                        <Badge variant={o.status === 'pending' ? 'outline' : 'success'} className="uppercase text-[10px]">
                            {o.status}
                        </Badge>
                    )}
                    getActions={(o) => [
                        { id: 'view', icon: FileText, label: 'View details', onClick: () => onView(o) },
                        { id: 'print', icon: Printer, label: 'Print / PDF', onClick: () => onView(o) },
                        { id: 'challan', icon: Truck, label: 'Create delivery challan', onClick: () => onConvert(o.id, 'challan') },
                        { id: 'invoice', icon: FileCheck, label: 'Issue invoice', onClick: () => onConvert(o.id, 'invoice') },
                    ]}
                />
            </div>
        </div>
    );
}
