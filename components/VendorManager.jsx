'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Phone, MapPin, Edit, Trash2, Plus, Search, Eye, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from './DataTable';
import { ExportButton } from './ExportButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/currency';
import { getDomainColors } from '@/lib/domainColors';
import { cn } from '@/lib/utils';
import { hubDialogContentClass } from '@/lib/utils/formMobileStyles';
import { getDomainVendorColumns } from '@/lib/utils/domainHelpers';
import StakeholderLedger from './StakeholderLedger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileTabHeader, MobileStatStrip } from '@/components/mobile/MobileTabHeader';
import { HubEntityMobileList } from '@/components/mobile/HubEntityMobileList';
import { MOBILE_BOTTOM_NAV_CLASS, MOBILE_FLOATING_Z, MOBILE_MODULE_FAB_RIGHT } from '@/lib/utils/mobileLayout';
import { useBusiness } from '@/lib/context/BusinessContext';

function matchesVendorSearch(vendor, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    vendor.name,
    vendor.email,
    vendor.phone,
    vendor.ntn,
    vendor.srn,
    vendor.contact_person,
    vendor.city,
    vendor.payment_terms,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

/**
 * Vendor Manager — supplier list, search, view/ledger, soft-delete.
 */
export function VendorManager({ vendors = [], onAdd, onUpdate, onDelete, category = 'retail-shop', businessId }) {
  const { business, currency: businessCurrency } = useBusiness();
  const currency = businessCurrency || 'PKR';
  const colors = getDomainColors(category);
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorToView, setVendorToView] = useState(null);
  const [vendorToDelete, setVendorToDelete] = useState(null);

  const filteredVendors = vendors.filter((v) => matchesVendorSearch(v, searchTerm));
  const domainColumns = getDomainVendorColumns(category);

  const columns = [
    {
      accessorKey: 'name',
      header: 'Supplier',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2" style={{ backgroundColor: `${colors.primary}10`, color: colors.primary }}>
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold leading-none text-gray-900">{row.original.name}</p>
            <p className="mt-1 text-xs text-gray-500">
              {row.original.contact_person || row.original.email || 'No contact'}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="flex flex-col text-sm font-medium text-gray-600">
          <span className="flex items-center gap-1.5">
            <Phone className="h-3 w-3" style={{ color: colors.primary }} />
            {row.original.phone || '—'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'payment_terms',
      header: 'Payment Terms',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-600">
          {row.original.payment_terms || 'Standard'}
        </span>
      ),
    },
    {
      accessorKey: 'outstanding_balance',
      header: 'Payables',
      cell: ({ row }) => (
        <span className={`font-semibold ${Number(row.original.outstanding_balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(row.original.outstanding_balance || 0, currency)}
        </span>
      ),
    },
    {
      accessorKey: 'city',
      header: 'Location',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
          <MapPin className="h-3 w-3" style={{ color: colors.primary }} />
          {row.original.city || business?.country || '—'}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-gray-400 hover:bg-gray-100"
            onClick={() => setVendorToView(row.original)}
            title="View Details"
          >
            <Eye className="h-4 w-4 text-blue-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-gray-400 hover:bg-gray-100"
            style={{ color: colors.primary }}
            title="Edit Supplier"
            onClick={() => onUpdate?.(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600"
            onClick={() => setVendorToDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const allColumns = [
    columns[0],
    columns[1],
    columns[2],
    columns[3],
    ...domainColumns,
    columns[4],
    columns[5],
  ];

  const handleOpenAdd = () => {
    onAdd?.();
  };

  const totalPayables = vendors.reduce((s, v) => s + (Number(v.outstanding_balance) || 0), 0);

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden touch-manipulation lg:space-y-6">
      <MobileTabHeader
        icon={Building2}
        iconClassName="bg-blue-100 text-blue-600"
        title="Vendor Network"
        subtitle={`${vendors.length} suppliers · supply chain`}
      />

      <MobileStatStrip
        layout="grid"
        items={[
          { label: 'Vendors', value: vendors.length },
          {
            label: 'Payables',
            value: formatCurrency(totalPayables, currency),
            valueTone: 'text-red-600',
          },
        ]}
      />

      <div className="hidden flex-col gap-4 md:flex-row md:items-center md:justify-between lg:flex">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Vendor Network</h2>
          <p className="font-medium text-gray-500">Manage your supply chain and trade credit</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleOpenAdd}
            className="h-10 rounded-xl bg-emerald-600 px-5 font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
          <ExportButton
            data={filteredVendors}
            filename="vendors"
            columns={columns}
            title="Suppliers Report"
          />
        </div>
      </div>

      <div className="hidden grid-cols-1 gap-4 md:grid-cols-4 lg:grid">
        <Card className="border-none bg-white shadow-md">
          <CardContent className="pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Active Vendors</p>
            <p className="text-2xl font-semibold text-gray-900">{vendors.length}</p>
          </CardContent>
        </Card>
        <Card className="border-none bg-white shadow-md">
          <CardContent className="pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Total Payables</p>
            <p className="text-2xl font-semibold text-red-600">
              {formatCurrency(totalPayables, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-wine/5 bg-white/50 shadow-xl backdrop-blur-md lg:block">
        <CardHeader className="hidden pb-4 lg:block">
          <div className="group relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-wine" />
            <Input
              placeholder="Search by name, phone, NTN, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-xl border-gray-100 bg-white pl-10 focus:border-wine/30"
            />
          </div>
        </CardHeader>
        <CardContent className="hidden lg:block">
          <DataTable
            category={category}
            data={filteredVendors}
            columns={allColumns}
            emptyComponent={<EmptyState module="vendors" compact onAction={onAdd} />}
          />
        </CardContent>
      </Card>

      <div className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:hidden">
        <HubEntityMobileList
          items={vendors}
          search={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search vendors..."
          emptyIcon={Building2}
          emptyTitle="No vendors yet"
          emptySubtitle="Add suppliers to track payables"
          emptyActionLabel="Add vendor"
          onEmptyAction={handleOpenAdd}
          getKey={(v) => v.id}
          onRowPress={(v) => setVendorToView(v)}
          renderIcon={() => <Building2 className="h-5 w-5" style={{ color: colors.primary }} />}
          getTitle={(v) => v.name}
          getSubtitle={(v) => v.phone || v.city || v.email || 'No contact'}
          getAmount={(v) => formatCurrency(v.outstanding_balance || 0, currency)}
          getAmountClassName={(v) => (Number(v.outstanding_balance) > 0 ? 'text-red-600' : 'text-green-600')}
          filterItems={(list, q) => list.filter((v) => matchesVendorSearch(v, q))}
          getActions={(v) => [
            { id: 'view', icon: Eye, label: 'View supplier', onClick: () => setVendorToView(v) },
            { id: 'edit', icon: Edit, label: 'Edit vendor', onClick: () => onUpdate?.(v) },
            { id: 'delete', icon: Trash2, label: 'Remove vendor', destructive: true, onClick: () => setVendorToDelete(v) },
          ]}
        />
      </div>

      <button
        type="button"
        onClick={handleOpenAdd}
        className={cn(
          'fixed flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95 lg:hidden',
          MOBILE_MODULE_FAB_RIGHT,
          MOBILE_BOTTOM_NAV_CLASS,
          MOBILE_FLOATING_Z
        )}
        aria-label="Add vendor"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Dialog open={!!vendorToView} onOpenChange={(open) => !open && setVendorToView(null)}>
        <DialogContent className={cn(hubDialogContentClass({ wide: true, maxWidth: 'lg:max-w-3xl' }), 'flex flex-col overflow-hidden p-0 lg:gap-0 lg:p-0')}>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-400" />
              {vendorToView?.name}
            </DialogTitle>
            <DialogDescription>Supplier Details & History</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto px-6 pb-6">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="mb-4 grid w-full grid-cols-2 rounded-xl bg-gray-100/50 p-1">
                <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Profile Details</TabsTrigger>
                <TabsTrigger value="ledger" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Ledger / History</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="mt-0 space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400">Contact Person</label>
                    <p className="font-medium">{vendorToView?.contact_person || vendorToView?.domain_data?.contact_person || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400">City</label>
                    <p className="font-medium">{vendorToView?.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400">Phone</label>
                    <p className="font-medium">{vendorToView?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400">Email</label>
                    <p className="font-medium">{vendorToView?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400">NTN</label>
                    <p className="font-medium">{vendorToView?.ntn || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400">Payment Terms</label>
                    <p className="font-medium">{vendorToView?.payment_terms || 'Standard'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-400">Address</label>
                    <p className="font-medium">{vendorToView?.address || 'N/A'}</p>
                  </div>
                </div>

                {vendorToView?.domain_data && Object.keys(vendorToView.domain_data).length > 0 && (
                  <div className="mt-2 rounded-lg bg-gray-50 p-3">
                    <h4 className="mb-2 text-xs font-semibold text-gray-500">Domain Data</h4>
                    <div className="space-y-1 text-xs">
                      {Object.entries(vendorToView.domain_data).map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-2">
                          <span className="capitalize text-gray-500">{k.replace(/_/g, ' ')}:</span>
                          <span className="text-right font-medium">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ledger" className="mt-0 min-h-[400px] pt-2">
                <StakeholderLedger
                  entityId={vendorToView?.id}
                  entityType="vendor"
                  businessId={businessId}
                  currency={currency}
                  colors={colors}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!vendorToDelete} onOpenChange={(open) => !open && setVendorToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <span className="font-semibold text-gray-900">{vendorToDelete?.name}</span>?
              This will remove them from your active suppliers.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setVendorToDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (vendorToDelete) {
                  onDelete?.(vendorToDelete.id);
                  setVendorToDelete(null);
                }
              }}
            >
              Remove Supplier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
