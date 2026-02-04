'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VendorManager } from './VendorManager';
import { PurchaseOrderManager } from './PurchaseOrderManager';

/**
 * Supply Chain Management Tab Wrapper
 */
export function VendorsAndPO({
  category,
  vendors,
  purchaseOrders,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onUpdatePOStatus,
  onCreatePurchaseOrder
}) {
  return (
    <Tabs defaultValue="vendors" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-gray-100/50 p-1 rounded-xl">
        <TabsTrigger value="vendors" className="rounded-lg font-bold">Suppliers</TabsTrigger>
        <TabsTrigger value="purchase-orders" className="rounded-lg font-bold">Purchase Orders</TabsTrigger>
      </TabsList>

      <TabsContent value="vendors" className="space-y-4 pt-4 animate-in fade-in duration-300">
        <VendorManager
          vendors={vendors}
          onAdd={onAddVendor}
          onUpdate={onUpdateVendor}
          onDelete={onDeleteVendor}
        />
      </TabsContent>

      <TabsContent value="purchase-orders" className="space-y-4 pt-4 animate-in fade-in duration-300">
        <PurchaseOrderManager
          purchaseOrders={purchaseOrders}
          onUpdateStatus={onUpdatePOStatus}
          onCreate={onCreatePurchaseOrder}
        />
      </TabsContent>
    </Tabs>
  );
}
