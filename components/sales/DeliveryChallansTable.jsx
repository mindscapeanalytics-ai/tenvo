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
import { MoreHorizontal, FileText, Printer, FileCheck } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DeliveryChallansTable({ data, onView, onIssueInvoice, isLoading }) {
    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading delivery challans...</div>;
    }

    if (data.length === 0) {
        return <div className="p-8 text-center text-muted-foreground border rounded-lg bg-gray-50">No delivery challans found.</div>;
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Challan #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vehicle / Driver</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((challan) => (
                        <TableRow key={challan.id}>
                            <TableCell className="font-medium">{challan.challan_number}</TableCell>
                            <TableCell>{new Date(challan.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{challan.customer_name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col text-xs">
                                    {challan.vehicle_number && <span className="font-semibold">{challan.vehicle_number}</span>}
                                    {challan.driver_name && <span>{challan.driver_name}</span>}
                                    {!challan.vehicle_number && !challan.driver_name && <span className="text-muted-foreground">-</span>}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={challan.status === 'issued' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                                    {challan.status}
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
                                        <DropdownMenuItem onClick={() => onView(challan)}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onView(challan)}>
                                            <Printer className="mr-2 h-4 w-4" />
                                            Print Challan
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onIssueInvoice(challan.id)}>
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
