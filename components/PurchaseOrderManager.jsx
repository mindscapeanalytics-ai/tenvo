'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, CheckCircle2, Clock, X, Package, Search, ExternalLink } from 'lucide-react';
import { DataTable } from './DataTable';
import { ExportButton } from './ExportButton';
import { formatCurrency } from '@/lib/currency';
import { getDomainColors } from '@/lib/domainColors';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EnhancedPOBuilder from './EnhancedPOBuilder';
import GRNView from './GRNView';
import { useBusiness } from '@/lib/context/BusinessContext';
import { Printer, FileText } from 'lucide-react';

/**
 * Purchase Order Manager
 * Tracking procurement and inventory inflow
 */
export function PurchaseOrderManager({ purchaseOrders = [], onCreate, onUpdateStatus, category = 'retail-shop', refreshData }) {
  const { business } = useBusiness();
  const colors = getDomainColors(category);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [poToView, setPoToView] = useState(null);

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      sent: 'bg-blue-100 text-blue-700 border-blue-200',
      received: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[status] || styles.draft;
  };

  const columns = [
    {
      accessorKey: 'purchase_number',
      header: 'PO Identifier',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <p className="font-black text-gray-900 leading-none">{row.original.purchase_number}</p>
            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">
              {new Date(row.original.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'vendor_name',
      header: 'Vendor',
      cell: ({ row }) => (
        <span className="font-bold text-gray-600">{row.original.vendor_name || 'Unknown Supplier'}</span>
      )
    },
    {
      accessorKey: 'total_amount',
      header: 'Amount',
      cell: ({ row }) => (
        <span className="font-black text-gray-900">{formatCurrency(row.original.total_amount, 'PKR')}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline" className={`font-black uppercase text-[10px] px-2 py-0.5 rounded-full ${getStatusBadge(row.original.status)}`}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          {row.original.status !== 'received' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-green-200 text-green-700 hover:bg-green-50 font-bold px-3 rounded-lg"
              onClick={() => onUpdateStatus?.(row.original.id, 'received')}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Received
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            style={{ color: colors.primary, '--hover-bg': `${colors.primary}10` }}
            onClick={() => setPoToView(row.original)}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  const filteredOrders = purchaseOrders.filter(o =>
    !searchTerm ||
    (o.purchase_number && o.purchase_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (o.vendor_name && o.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-right-5 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Purchase Orders</h2>
          <p className="text-muted-foreground font-medium">Coordinate inventory procurement and tracking</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredOrders}
            filename="purchase_orders"
            columns={columns}
            title="Purchase Orders Report"
          />
          <Dialog open={showBuilder} onOpenChange={setShowBuilder}>
            <DialogTrigger asChild>
              <Button className="text-primary-foreground font-bold shadow-sm rounded-xl px-6" style={{ backgroundColor: colors.primary }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  New Purchase Order
                </DialogTitle>
                <DialogDescription>Draft a new procurement request for your suppliers.</DialogDescription>
              </DialogHeader>
              <EnhancedPOBuilder
                businessId={business?.id}
                category={category}
                colors={colors}
                onSuccess={() => {
                  setShowBuilder(false);
                  refreshData?.();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm bg-card">
          <CardContent className="pt-6">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Open Orders</p>
            <p className="text-2xl font-bold text-foreground">
              {purchaseOrders.filter(p => ['draft', 'sent'].includes(p.status)).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm bg-card">
          <CardContent className="pt-6">
            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Procurement Value</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(purchaseOrders.reduce((s, o) => s + (Number(o.total_amount) || 0), 0), 'PKR')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm bg-card">
        <CardHeader className="pb-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground group-focus-within:text-primary w-4 h-4 transition-colors" />
            <Input
              placeholder="Search by PO# or Vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-background border-input focus:border-ring rounded-xl"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable category={category} data={filteredOrders} columns={columns} searchable={false} />
        </CardContent>
      </Card>
      <Dialog open={!!poToView} onOpenChange={(open) => !open && setPoToView(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              {poToView?.status === 'received' ? 'Good Receipt Note (GRN)' : 'Purchase Order Detail'}
            </DialogTitle>
            <DialogDescription>
              Reference: <span className="font-bold text-gray-900">{poToView?.purchase_number}</span>
            </DialogDescription>
          </DialogHeader>

          <GRNView
            poId={poToView?.id}
            businessId={business?.id}
            business={business}
            colors={colors}
            onUpdateStatus={(id, status) => {
              onUpdateStatus?.(id, status);
              setPoToView(null);
              refreshData?.();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
