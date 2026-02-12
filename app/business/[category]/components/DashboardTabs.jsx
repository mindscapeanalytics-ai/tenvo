'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs as BaseTabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Search, AlertTriangle, Lock, ShoppingCart, DollarSign as DollarIcon, TrendingUp, TrendingDown, Package as PackageIcon } from 'lucide-react';
import { DashboardTab } from './tabs/DashboardTab';
import { InventoryTab } from './tabs/InventoryTab';
import { InvoiceTab } from './tabs/InvoiceTab';
import { CustomersTab } from './tabs/CustomersTab';
import { MultiLocationInventory } from '@/components/MultiLocationInventory';
import { ManufacturingModule } from '@/components/ManufacturingModule';
import { PurchaseOrderManager } from '@/components/PurchaseOrderManager';
import { SalesManager } from '@/components/SalesManager';
import { VendorManager } from '@/components/VendorManager';
import PaymentManager from '@/components/payment/PaymentManager';
import { QuotationOrderChallanManager } from '@/components/QuotationOrderChallanManager';
import { AdvancedAnalytics } from '@/components/AdvancedAnalytics';
import { DemandForecast } from '@/components/DemandForecast';
import JournalEntryManager from '@/components/JournalEntryManager';
import TrialBalanceView from '@/components/TrialBalanceView';
import FinancialReports from '@/components/FinancialReports';
import { FinancialOverview } from '@/components/dashboard/FinancialOverview';
import { TaxComplianceManager } from '@/components/TaxComplianceManager';
import { SettingsManager } from '@/components/SettingsManager';
import { SerialScanner } from '@/components/inventory/SerialScanner';

export function DashboardTabs({
    activeTab,
    searchTerm = '',
    category,
    business,
    role,
    invoices = [],
    products = [],
    customers = [],
    vendors = [],
    quotations = [],
    salesOrders = [],
    challans = [],
    purchaseOrders = [],
    locations = [],
    bomList = [],
    productionOrders = [],
    accountingSummary,
    dashboardChartData,
    dateRange,
    currency,
    colors,
    domainKnowledge,
    handlers
}) {
    // Memoized Filtering Logic
    const filteredProducts = React.useMemo(() => {
        if (!searchTerm) return products;
        const lowerTerm = searchTerm.toLowerCase();
        return products.filter(p =>
            (p.name && p.name.toLowerCase().includes(lowerTerm)) ||
            (p.sku && p.sku.toLowerCase().includes(lowerTerm)) ||
            (p.category && p.category.toLowerCase().includes(lowerTerm)) ||
            (p.brand && p.brand.toLowerCase().includes(lowerTerm))
        );
    }, [products, searchTerm]);

    const filteredInvoices = React.useMemo(() => {
        if (!searchTerm) return invoices;
        const lowerTerm = searchTerm.toLowerCase();
        return invoices.filter(inv =>
            inv.number?.toLowerCase().includes(lowerTerm) ||
            inv.customer_name?.toLowerCase().includes(lowerTerm) ||
            inv.customer?.name?.toLowerCase().includes(lowerTerm)
        );
    }, [invoices, searchTerm]);

    const filteredCustomers = React.useMemo(() => {
        if (!searchTerm) return customers;
        const lowerTerm = searchTerm.toLowerCase();
        return customers.filter(c =>
            c.name?.toLowerCase().includes(lowerTerm) ||
            c.phone?.toLowerCase().includes(lowerTerm) ||
            c.email?.toLowerCase().includes(lowerTerm)
        );
    }, [customers, searchTerm]);

    const filteredVendors = React.useMemo(() => {
        if (!searchTerm) return vendors;
        const lowerTerm = searchTerm.toLowerCase();
        return vendors.filter(v =>
            v.name?.toLowerCase().includes(lowerTerm) ||
            v.company_name?.toLowerCase().includes(lowerTerm) ||
            v.phone?.toLowerCase().includes(lowerTerm)
        );
    }, [vendors, searchTerm]);

    const filteredQuotations = React.useMemo(() => {
        if (!searchTerm) return quotations;
        const lowerTerm = searchTerm.toLowerCase();
        return quotations.filter(q =>
            q.number?.toLowerCase().includes(lowerTerm) ||
            q.customer_name?.toLowerCase().includes(lowerTerm) ||
            q.customer?.name?.toLowerCase().includes(lowerTerm)
        );
    }, [quotations, searchTerm]);

    const filteredSalesOrders = React.useMemo(() => {
        if (!searchTerm) return salesOrders;
        const lowerTerm = searchTerm.toLowerCase();
        return salesOrders.filter(so =>
            so.number?.toLowerCase().includes(lowerTerm) ||
            so.customer_name?.toLowerCase().includes(lowerTerm)
        );
    }, [salesOrders, searchTerm]);

    const filteredChallans = React.useMemo(() => {
        if (!searchTerm) return challans;
        const lowerTerm = searchTerm.toLowerCase();
        return challans.filter(c =>
            c.number?.toLowerCase().includes(lowerTerm) ||
            c.customer_name?.toLowerCase().includes(lowerTerm)
        );
    }, [challans, searchTerm]);

    const filteredPurchaseOrders = React.useMemo(() => {
        if (!searchTerm) return purchaseOrders;
        const lowerTerm = searchTerm.toLowerCase();
        return purchaseOrders.filter(po =>
            po.number?.toLowerCase().includes(lowerTerm) ||
            po.vendor_name?.toLowerCase().includes(lowerTerm) ||
            po.vendor?.name?.toLowerCase().includes(lowerTerm)
        );
    }, [purchaseOrders, searchTerm]);

    const filteredBoms = React.useMemo(() => {
        if (!searchTerm) return bomList;
        const lowerTerm = searchTerm.toLowerCase();
        return bomList.filter(b =>
            (b.name && b.name.toLowerCase().includes(lowerTerm)) ||
            (b.productName && b.productName.toLowerCase().includes(lowerTerm)) ||
            (b.product_name && b.product_name.toLowerCase().includes(lowerTerm))
        );
    }, [bomList, searchTerm]);

    const filteredProductionOrders = React.useMemo(() => {
        if (!searchTerm) return productionOrders;
        const lowerTerm = searchTerm.toLowerCase();
        return productionOrders.filter(o =>
            (o.productName && o.productName.toLowerCase().includes(lowerTerm)) ||
            (o.product_name && o.product_name.toLowerCase().includes(lowerTerm)) ||
            (o.bomName && o.bomName.toLowerCase().includes(lowerTerm)) ||
            (o.status && o.status.toLowerCase().includes(lowerTerm))
        );
    }, [productionOrders, searchTerm]);
    const {
        handleTabChange,
        handleDeleteInvoice,
        handleBulkDelete,
        handleExport,
        handleSaveProduct,
        handleDeleteProduct,
        handleQuickAddProduct,
        handleLocationAdd,
        handleLocationUpdate,
        handleLocationDelete,
        handleStockTransfer,
        handleGenerateAutoPO,
        handleDeleteCustomer,
        handleSaveVendor,
        handleDeleteVendor,
        handleUpdatePOStatus,
        handleCreateBOM,
        handleCreateProductionOrder,
        refreshAllData,
        setShowInvoiceBuilder,
        setShowProductForm,
        setShowCustomerForm,
        setEditingProduct,
        setEditingCustomer,
        setInvoiceInitialData,
        setShowVendorForm,
        setEditingVendor,
        setShowPOBuilder,
        formatCurrency
    } = handlers;

    const tabVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    const wrapTab = (content) => (
        <motion.div
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            {content}
        </motion.div>
    );

    return (
        <AnimatePresence mode="wait">
            <div key={activeTab}>
                <TabsContent value="dashboard" className="space-y-6 outline-none">
                    {wrapTab(
                        <DashboardTab
                            businessId={business?.id}
                            category={category}
                            invoices={filteredInvoices}
                            products={filteredProducts}
                            customers={filteredCustomers}
                            dateRange={dateRange}
                            currency={currency}
                            onQuickAction={handlers.handleQuickAction}
                            accountingSummary={accountingSummary}
                            chartData={dashboardChartData}
                            domainKnowledge={domainKnowledge}
                        />
                    )}
                </TabsContent>

                <TabsContent value="invoices" className="space-y-6 outline-none">
                    {wrapTab(
                        <InvoiceTab
                            invoices={filteredInvoices}
                            currency={currency}
                            onInvoiceDelete={handleDeleteInvoice}
                            onEdit={(invoice) => {
                                setInvoiceInitialData(invoice);
                                setShowInvoiceBuilder(true);
                            }}
                            onBulkDelete={handleBulkDelete}
                            onExport={handleExport}
                            category={category}
                            colors={colors}
                        />
                    )}
                </TabsContent>

                <TabsContent value="inventory" className="space-y-6 outline-none">
                    {wrapTab(
                        <InventoryTab
                            products={filteredProducts}
                            businessId={business?.id}
                            category={category}
                            onProductSave={handleSaveProduct}
                            onProductDelete={handleDeleteProduct}
                            refreshData={refreshAllData}
                            domainKnowledge={domainKnowledge}
                            invoices={filteredInvoices}
                            customers={filteredCustomers}
                            vendors={filteredVendors}
                            locations={locations}
                            bomList={bomList}
                            productionOrders={productionOrders}
                            quotations={quotations}
                            salesOrders={salesOrders}
                            challans={challans}
                            onIssueInvoice={(header) => {
                                setInvoiceInitialData(header);
                                setShowInvoiceBuilder(true);
                            }}
                            onAdd={() => {
                                setEditingProduct(null);
                                setShowProductForm(true);
                            }}
                            onQuickAdd={handleQuickAddProduct}
                            onEdit={(product) => {
                                setEditingProduct(product);
                                setShowProductForm(true);
                            }}
                            onUpdate={async (product) => {
                                // ✅ CRITICAL FIX: Preserve batch/serial data during inline edits
                                // BusyGrid sends partial product data, we must fetch full data to preserve batches
                                const fullProduct = products.find(p => p.id === product.id);

                                await handleSaveProduct({
                                    ...product,  // Include all edited fields
                                    batches: fullProduct?.batches || product.batches || [],
                                    serialNumbers: fullProduct?.serial_numbers || fullProduct?.serialNumbers || product.serialNumbers || product.serial_numbers || [],
                                    business_id: business.id,
                                    isUpdate: true,
                                    productId: product.id
                                });
                            }}
                            onLocationAdd={handleLocationAdd}
                            onLocationUpdate={handleLocationUpdate}
                            onLocationDelete={handleLocationDelete}
                            onStockTransfer={handleStockTransfer}
                            onGeneratePO={handleGenerateAutoPO}
                        />
                    )}
                </TabsContent>

                <TabsContent value="customers" className="space-y-6 outline-none">
                    {wrapTab(
                        <CustomersTab
                            customers={filteredCustomers}
                            businessId={business?.id}
                            onCustomerDelete={handleDeleteCustomer}
                            onUpdate={(customer) => {
                                setEditingCustomer(customer);
                                setShowCustomerForm(true);
                            }}
                        />
                    )}
                </TabsContent>

                <TabsContent value="vendors" className="space-y-6 outline-none">
                    {wrapTab(
                        <VendorManager
                            vendors={filteredVendors}
                            onAdd={() => {
                                setEditingVendor(null);
                                setShowVendorForm(true);
                            }}
                            onUpdate={(vendor) => {
                                setEditingVendor(vendor);
                                setShowVendorForm(true);
                            }}
                            onDelete={handleDeleteVendor}
                            businessId={business?.id}
                            category={category}
                        />
                    )}
                </TabsContent>

                <TabsContent value="payments" className="space-y-6 outline-none">
                    {wrapTab(
                        <PaymentManager
                            businessId={business?.id}
                            customers={filteredCustomers}
                            vendors={filteredVendors}
                            invoices={filteredInvoices}
                            purchases={purchaseOrders}
                            refreshData={refreshAllData}
                        />
                    )}
                </TabsContent>

                <TabsContent value="purchases" className="space-y-6 outline-none">
                    {wrapTab(
                        <PurchaseOrderManager
                            category={category}
                            purchaseOrders={filteredPurchaseOrders}
                            onUpdateStatus={handleUpdatePOStatus}
                            refreshData={refreshAllData}
                            onCreate={() => setShowPOBuilder(true)}
                        />
                    )}
                </TabsContent>

                <TabsContent value="sales" className="space-y-6 outline-none">
                    {wrapTab(
                        <SalesManager
                            invoices={invoices}
                            customers={customers}
                            products={products}
                            category={category}
                        />
                    )}
                </TabsContent>

                {domainKnowledge?.manufacturingEnabled && (
                    <TabsContent value="manufacturing" className="space-y-6 outline-none">
                        {wrapTab(
                            <ManufacturingModule
                                products={filteredProducts}
                                bomList={filteredBoms}
                                productionOrders={filteredProductionOrders}
                                warehouses={locations}
                                onBOMAdd={handleCreateBOM}
                                onProductionOrderCreate={handleCreateProductionOrder}
                                onSave={refreshAllData}
                                businessId={business?.id}
                            />
                        )}
                    </TabsContent>
                )}

                {domainKnowledge?.multiLocationEnabled && (
                    <TabsContent value="warehouses" className="space-y-6 outline-none">
                        {wrapTab(
                            <MultiLocationInventory
                                businessId={business?.id}
                                locations={locations}
                                products={filteredProducts}
                                onLocationAdd={handleLocationAdd}
                                onLocationUpdate={handleLocationUpdate}
                                onLocationDelete={handleLocationDelete}
                                onStockTransfer={handleStockTransfer}
                            />
                        )}
                    </TabsContent>
                )}

                {domainKnowledge?.inventoryFeatures?.includes('Quotation Management') && (
                    <TabsContent value="quotations" className="space-y-6 outline-none">
                        {wrapTab(
                            <QuotationOrderChallanManager
                                quotations={filteredQuotations}
                                salesOrders={filteredSalesOrders}
                                challans={filteredChallans}
                                customers={filteredCustomers}
                                products={filteredProducts}
                                refreshData={refreshAllData}
                                category={category}
                                onIssueInvoice={(header) => {
                                    setInvoiceInitialData(header);
                                    setShowInvoiceBuilder(true);
                                }}
                            />
                        )}
                    </TabsContent>
                )}

                {domainKnowledge?.batchTrackingEnabled && (
                    <TabsContent value="batches" className="space-y-6 outline-none">
                        {wrapTab(
                            <Card>
                                <CardHeader>
                                    <CardTitle>Global Batch Monitoring</CardTitle>
                                    <CardDescription>Select a product from the Inventory tab to manage specific batches.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[400px] flex flex-col items-center justify-center text-center">
                                    <Package className="w-12 h-12 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900">Batch details are product-specific</h3>
                                    <p className="text-gray-500 max-w-sm mt-2">
                                        To manage batches, go to the <strong>Inventory</strong> tab, click the actions menu on any product, and select <strong>Manage Batches</strong>.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="mt-6"
                                        onClick={() => handleTabChange('inventory')}
                                    >
                                        Go to Inventory
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                )}

                <TabsContent value="accounting" className="space-y-6 outline-none">
                    {wrapTab(
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium text-gray-500">Accounts Receivable</CardTitle>
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                <DollarIcon className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-black text-gray-900">
                                            {formatCurrency(accountingSummary?.accountsReceivable || 0, currency)}
                                        </div>
                                        <div className="flex items-center mt-1 text-xs font-medium text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-full">
                                            {accountingSummary?.pendingInvoiceCount || 0} invoices pending
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium text-gray-500">Accounts Payable</CardTitle>
                                            <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                                <ShoppingCart className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-black text-gray-900">
                                            {formatCurrency(accountingSummary?.accountsPayable || 0, currency)}
                                        </div>
                                        <div className="flex items-center mt-1 text-xs font-medium text-red-600 bg-red-50 w-fit px-2 py-0.5 rounded-full">
                                            <TrendingDown className="w-3 h-3 mr-1" />
                                            {accountingSummary?.pendingPurchaseCount || 0} orders pending
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium text-gray-500">Inventory Value</CardTitle>
                                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                                <PackageIcon className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-black text-gray-900">
                                            {formatCurrency(accountingSummary?.inventoryValue || 0, currency)}
                                        </div>
                                        <div className="mt-1 text-xs font-medium text-gray-500">
                                            {products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0).toLocaleString()} units in stock
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium text-gray-500">Gross Profit</CardTitle>
                                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                                <TrendingUp className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-2xl font-black ${(accountingSummary?.grossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatCurrency(accountingSummary?.grossProfit || 0, currency)}
                                        </div>
                                        <div className="flex items-center mt-1 text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-0.5 rounded-full">
                                            {Math.round(accountingSummary?.margin || 0)}% net margin
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <FinancialOverview
                                businessId={business?.id}
                                category={category}
                                accountingSummary={accountingSummary}
                                chartData={dashboardChartData}
                                currency={currency}
                                role={role}
                                onTabChange={handleTabChange}
                            />
                        </>
                    )}
                </TabsContent>

                <TabsContent value="reports" className="space-y-6 outline-none">
                    {wrapTab(
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <AdvancedAnalytics businessId={business?.id} category={category} />
                            <DemandForecast businessId={business?.id} category={category} />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="finance" className="space-y-6 outline-none">
                    {wrapTab(
                        <BaseTabs defaultValue="journal" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 rounded-xl p-1">
                                <TabsTrigger value="journal" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold">Journal Entry</TabsTrigger>
                                <TabsTrigger value="ledger" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold">General Ledger</TabsTrigger>
                                <TabsTrigger value="statements" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg font-bold">Financial Statements</TabsTrigger>
                            </TabsList>
                            {/* Internal tabs for Finance */}
                            <div className="TabsContent-Finance-Scroll-Fix">
                                <TabsContent value="journal" className="mt-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2">
                                            <JournalEntryManager
                                                businessId={business?.id}
                                                colors={colors}
                                                onSuccess={() => {
                                                    refreshAllData();
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-6">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base text-gray-500 uppercase tracking-wide font-bold">Quick Tips</CardTitle>
                                                </CardHeader>
                                                <CardContent className="space-y-4 text-sm text-gray-600">
                                                    <p>• Use <strong>Journal Entries</strong> for non-cash transactions.</p>
                                                    <p>• Debits must equal Credits.</p>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="ledger" className="mt-6">
                                    <TrialBalanceView businessId={business?.id} colors={colors} />
                                </TabsContent>
                                <TabsContent value="statements" className="mt-6">
                                    <FinancialReports businessId={business?.id} category={category} />
                                </TabsContent>
                            </div>
                        </BaseTabs>
                    )}
                </TabsContent>

                <TabsContent value="gst" className="space-y-6 outline-none">
                    {wrapTab(
                        ['owner', 'admin', 'accountant'].includes(role) ? (
                            <TaxComplianceManager
                                invoices={filteredInvoices}
                                purchaseOrders={purchaseOrders}
                                business={business}
                            />
                        ) : (
                            <Card className="p-12 text-center border-none shadow-sm">
                                <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold">Access Restricted</h3>
                                <p className="text-gray-500">Only authorized personnel can access Tax & GST data.</p>
                            </Card>
                        )
                    )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-6 outline-none">
                    {wrapTab(
                        ['owner', 'admin'].includes(role) ? (
                            <SettingsManager category={category} />
                        ) : (
                            <Card className="p-12 text-center border-none shadow-sm">
                                <Lock className="w-12 h-12 text-wine/40 mx-auto mb-4" />
                                <h3 className="text-xl font-bold">Settings Locked</h3>
                                <p className="text-gray-500">You do not have permission to modify settings.</p>
                            </Card>
                        )
                    )}
                </TabsContent>
            </div>
        </AnimatePresence>
    );
}
