'use client';
// v2: Removed ActionModalsHeader

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Plus,
    FileText,
    Package,
    Users,
    Settings,
    Warehouse,
    BarChart3,
} from 'lucide-react';
import { VendorForm } from '@/components/VendorForm';
import EnhancedPOBuilder from '@/components/EnhancedPOBuilder';
import { ProductForm } from '@/components/ProductForm';
import { ProductWizard } from '@/components/inventory/ProductWizard';
import { EnhancedInvoiceBuilder } from '@/components/EnhancedInvoiceBuilder';
import { CustomerForm } from '@/components/CustomerForm';
import toast from 'react-hot-toast';
import { EntityDetailsDialog } from '@/components/EntityDetailsDialog';

export function ActionModals({
    // Visibility States
    showProductForm,
    setShowProductForm,
    showQuickAction,
    setShowQuickAction,
    showCustomerForm,
    setShowCustomerForm,
    showInvoiceBuilder,
    setShowInvoiceBuilder,

    // Data
    editingProduct,
    setEditingProduct,
    editingCustomer,
    setEditingCustomer,
    invoiceInitialData,
    setInvoiceInitialData,
    customerFormData,
    setCustomerFormData,
    products,
    customers,
    category,
    colors,
    currency,

    // Handlers
    onSaveProduct,
    onSaveCustomer,
    onSaveInvoice,
    onTabChange,
    formatCurrency,
    loadProducts,

    // Vendor Props
    showVendorForm,
    setShowVendorForm,
    editingVendor,
    setEditingVendor,
    onSaveVendor,

    // PO Props
    showPOBuilder,
    setShowPOBuilder,
    poInitialData,
    setPoInitialData,
    refreshData,
    business,

    // Details Viewer Props
    viewingItem,
    setViewingItem,
    viewingType,
    setViewingType
}) {
    return (
        <>
            <EntityDetailsDialog
                item={viewingItem}
                type={viewingType}
                open={!!viewingItem}
                onClose={() => {
                    setViewingItem(null);
                    setViewingType(null);
                }}
                category={category}
            />

            {/* Product Form Modal — Wizard for new, Full form for edit */}
            <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
                <DialogContent className={editingProduct ? "max-w-4xl max-h-[90vh] overflow-y-auto" : "max-w-3xl p-0 border-none bg-transparent shadow-none"}>
                    <DialogHeader className="sr-only">
                        <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                        <DialogDescription>
                            {editingProduct ? 'Modify the details of the selected product.' : 'Add a new product using the guided wizard.'}
                        </DialogDescription>
                    </DialogHeader>
                    {editingProduct ? (
                        <ProductForm
                            product={editingProduct}
                            category={category}
                            onSave={onSaveProduct}
                            onCancel={() => {
                                setShowProductForm(false);
                                setEditingProduct(null);
                            }}
                            currency={currency}
                        />
                    ) : (
                        <ProductWizard
                            category={category}
                            onSave={async (data) => {
                                await onSaveProduct?.(data);
                                setShowProductForm(false);
                            }}
                            onCancel={() => {
                                setShowProductForm(false);
                                setEditingProduct(null);
                            }}
                            currency={currency}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Quick Action Modal */}
            <Dialog open={showQuickAction} onOpenChange={setShowQuickAction}>
                <DialogContent className="max-w-xl p-8 rounded-3xl border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black flex items-center gap-2">
                            <span className="p-2 rounded-xl" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                                <Plus className="w-6 h-6" />
                            </span>
                            Quick Actions
                        </DialogTitle>
                        <DialogDescription>Select a task to jump directly into action</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        {[
                            { label: 'New Invoice', icon: FileText, action: () => { setShowInvoiceBuilder(true); setShowQuickAction(false); } },
                            { label: 'Add Product', icon: Package, action: () => { setEditingProduct(null); setShowProductForm(true); setShowQuickAction(false); } },
                            { label: 'New Customer', icon: Users, action: () => { setShowCustomerForm(true); setShowQuickAction(false); } },
                            { label: 'Record Stock', icon: Warehouse, action: () => { onTabChange('inventory'); setShowQuickAction(false); } },
                            { label: 'View Reports', icon: BarChart3, action: () => { onTabChange('analytics'); setShowQuickAction(false); } },
                            { label: 'Manage Settings', icon: Settings, action: () => { onTabChange('settings'); setShowQuickAction(false); } },
                        ].map((item, i) => (
                            <button
                                key={i}
                                onClick={item.action}
                                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-100 hover:shadow-xl transition-all group text-left"
                            >
                                <div className="p-3 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform" style={{ color: colors.primary }}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-gray-900">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showCustomerForm} onOpenChange={(open) => {
                setShowCustomerForm(open);
                if (!open) setEditingCustomer(null);
            }}>
                <DialogContent className="p-0 border-none max-w-2xl bg-transparent shadow-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Customer Form</DialogTitle>
                    </DialogHeader>
                    <CustomerForm
                        initialData={editingCustomer}
                        category={category}
                        onSave={onSaveCustomer}
                        onClose={() => {
                            setShowCustomerForm(false);
                            setEditingCustomer(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Invoice Builder */}
            {showInvoiceBuilder && (
                <EnhancedInvoiceBuilder
                    onClose={() => {
                        setShowInvoiceBuilder(false);
                        setInvoiceInitialData(null);
                    }}
                    onSave={onSaveInvoice}
                    products={products}
                    customers={customers}
                    category={category}
                    initialData={invoiceInitialData}
                />
            )}

            <Dialog open={showVendorForm} onOpenChange={(open) => {
                setShowVendorForm(open);
                if (!open) setEditingVendor(null);
            }}>
                <DialogContent className="p-0 border-none max-w-2xl bg-transparent shadow-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Vendor Form</DialogTitle>
                    </DialogHeader>
                    <VendorForm
                        initialData={editingVendor}
                        category={category}
                        onSave={onSaveVendor}
                        onClose={() => {
                            setShowVendorForm(false);
                            setEditingVendor(null);
                        }}
                        business={business}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showPOBuilder} onOpenChange={setShowPOBuilder}>
                <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Purchase Order Builder</DialogTitle>
                    </DialogHeader>
                    <EnhancedPOBuilder
                        businessId={business?.id}
                        category={category}
                        colors={colors}
                        onSuccess={() => {
                            setShowPOBuilder(false);
                            refreshData?.();
                        }}
                        onCancel={() => setShowPOBuilder(false)}
                    />
                </DialogContent>
            </Dialog>

        </>
    );
}
