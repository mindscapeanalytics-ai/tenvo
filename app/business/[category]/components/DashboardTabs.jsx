'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Tabs as BaseTabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { lazyHubTab } from '@/lib/utils/lazyHubTab';
import { isPosRelevant, isHospitality, isCampaignRelevant, isMembershipRelevant } from '@/lib/config/domains';
import { resolvePosVariant } from '@/lib/config/posDomains';
import { useResolvedBusinessId } from '@/lib/hooks/useResolvedBusinessId';

const DomainDashboard = lazyHubTab(() => import('./tabs/DomainDashboard').then(mod => mod.DomainDashboard));
const InventoryTab = lazyHubTab(() => import('./tabs/InventoryTab').then(mod => mod.InventoryTab));
const InvoiceList = lazyHubTab(() => import('./islands/InvoiceList.client').then(mod => mod.InvoiceList));
const CustomersTab = lazyHubTab(() => import('./tabs/CustomersTab').then(mod => mod.CustomersTab));
const MultiLocationInventory = lazyHubTab(() => import('@/components/MultiLocationInventory').then(mod => mod.MultiLocationInventory));
const ManufacturingModule = lazyHubTab(() => import('@/components/ManufacturingModule').then(mod => mod.ManufacturingModule));
const PurchaseOrderManager = lazyHubTab(() => import('@/components/PurchaseOrderManager').then(mod => mod.PurchaseOrderManager));
const SalesManager = lazyHubTab(() => import('@/components/SalesManager').then(mod => mod.SalesManager));
const VendorManager = lazyHubTab(() => import('@/components/VendorManager').then(mod => mod.VendorManager));
const PaymentManager = lazyHubTab(() => import('@/components/payment/PaymentManager'));
const QuotationOrderChallanManager = lazyHubTab(() => import('@/components/QuotationOrderChallanManager').then(mod => mod.QuotationOrderChallanManager));
const AdvancedAnalytics = lazyHubTab(() => import('@/components/AdvancedAnalytics').then(mod => mod.AdvancedAnalytics));
const DemandForecast = lazyHubTab(() => import('@/components/DemandForecast').then(mod => mod.DemandForecast));
const TaxComplianceManager = lazyHubTab(() => import('@/components/TaxComplianceManager').then(mod => mod.TaxComplianceManager));
const SettingsManager = lazyHubTab(() => import('@/components/SettingsManager').then(mod => mod.SettingsManager));
const SerialScanner = lazyHubTab(() => import('@/components/inventory/SerialScanner').then(mod => mod.SerialScanner));
const PosTerminal = lazyHubTab(() => import('@/components/pos/PosTerminal').then(mod => mod.PosTerminal));
const SuperStorePOS = lazyHubTab(() => import('@/components/pos/SuperStorePOS').then(mod => mod.SuperStorePOS));
const RestaurantManager = lazyHubTab(() => import('@/components/restaurant/RestaurantManager').then(mod => mod.RestaurantManager));
const RestaurantPOS = lazyHubTab(() => import('@/components/restaurant/RestaurantPOS').then(mod => mod.RestaurantPOS));
const FloorPlanEditor = lazyHubTab(() => import('@/components/restaurant/FloorPlanEditor').then(mod => mod.FloorPlanEditor));
const KitchenDisplaySystem = lazyHubTab(() => import('@/components/restaurant/KitchenDisplaySystem').then(mod => mod.KitchenDisplaySystem));
const ReservationManager = lazyHubTab(() => import('@/components/restaurant/ReservationManager').then(mod => mod.ReservationManager));
const FinanceHub = lazyHubTab(() => import('@/components/finance/FinanceHub'));
const PayrollDashboard = lazyHubTab(() => import('@/components/hr/PayrollDashboard').then(mod => mod.PayrollDashboard));
const AttendanceTracker = lazyHubTab(() => import('@/components/hr/AttendanceTracker').then(mod => mod.AttendanceTracker));
const ShiftScheduler = lazyHubTab(() => import('@/components/hr/ShiftScheduler').then(mod => mod.ShiftScheduler));
const ApprovalInbox = lazyHubTab(() => import('@/components/workflow/ApprovalInbox').then(mod => mod.ApprovalInbox));
const WorkflowBuilder = lazyHubTab(() => import('@/components/workflow/WorkflowBuilder').then(mod => mod.WorkflowBuilder));
const LoyaltyManager = lazyHubTab(() => import('@/components/crm/LoyaltyManager').then(mod => mod.LoyaltyManager));
const MembershipManager = lazyHubTab(() => import('@/components/crm/MembershipManager').then(mod => mod.MembershipManager));
const PosRefundPanel = lazyHubTab(() => import('@/components/pos/PosRefundPanel').then(mod => mod.PosRefundPanel));
const PosVoidPanel = lazyHubTab(() => import('@/components/pos/PosVoidPanel').then(mod => mod.PosVoidPanel));
const AuditTrailViewer = lazyHubTab(() => import('@/components/audit/AuditTrailViewer').then(mod => mod.AuditTrailViewer));
const PromotionEngine = lazyHubTab(() => import('@/components/crm/PromotionEngine').then(mod => mod.PromotionEngine));
const CampaignsManager = lazyHubTab(() => import('@/components/crm/CampaignsManager').then(mod => mod.CampaignsManager));
const CustomerLoyaltyPortal = lazyHubTab(() => import('@/components/crm/CustomerLoyaltyPortal').then(mod => mod.CustomerLoyaltyPortal));
const AIInsightsPanel = lazyHubTab(() => import('@/components/intelligence/AIInsightsPanel').then(mod => mod.AIInsightsPanel));
const ReportBuilder = lazyHubTab(() => import('@/components/reports/ReportBuilder').then(mod => mod.ReportBuilder));
const StoreSettingsManager = lazyHubTab(() => import('@/components/StoreSettingsManager').then(mod => mod.StoreSettingsManager));
const OrdersManager = lazyHubTab(() => import('@/components/orders/OrdersManager').then(mod => mod.OrdersManager));
const CustomerInquiriesManager = lazyHubTab(() => import('@/components/crm/CustomerInquiriesManager').then(mod => mod.CustomerInquiriesManager));
const StorefrontTabShell = lazyHubTab(() => import('@/components/storefront/mobile/StorefrontTabShell').then(mod => mod.StorefrontTabShell));
const TabGuard = lazyHubTab(() => import('@/components/guards/TabGuard').then(mod => mod.TabGuard));
const ResourceLimitBanner = lazyHubTab(() => import('@/components/ui/ResourceLimitBanner').then(mod => mod.ResourceLimitBanner));
const NotificationBell = lazyHubTab(() => import('@/components/notifications/NotificationBell').then(mod => mod.NotificationBell));

/** Tabs that stay mounted after first visit (SWR keep-alive — no remount refetch storms). */
const KEEP_ALIVE_TABS = new Set([
    'dashboard',
    'inventory',
    'invoices',
    'finance',
    'sales',
    'reports',
    'customers',
    'purchases',
    'settings',
    'store-settings',
    'pos',
    'orders',
    'campaigns',
    'memberships',
    'payments',
    'audit',
    'loyalty',
    'vendors',
    'gst',
    'restaurant',
    'inquiries',
]);

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
    dashboardMetrics,
    expenseBreakdown = [],
    expenses = [],
    advancedDashboardSnapshot = null,
    dateRange,
    currency,
    colors,
    planTier = 'free',
    resourceLimits,
    domainKnowledge,
    handlers,
    user,
    financeInitialTab = null,
    onFinanceInitialTabConsumed,
    inventoryLoading = false,
    customersLoading = false,
    isAnalyticsLoading = false,
    isSalesLoading = false,
    isInventoryLoading = false,
    isFinanceLoading = false,
    isExpensesLoading = false,
    isDataLoaded = false,
    activityFeed,
    productTotal = 0,
    hasMoreProducts = false,
    onLoadMoreProducts,
}) {
    // Single tenant id for every hub tab — avoids `business?.id` hydrate gaps and prop/context drift.
    const activeBusinessId = useResolvedBusinessId(business?.id);
    const posRelevant = isPosRelevant(category, domainKnowledge);
    const hospitalityDomain = isHospitality(category);
    const campaignRelevant = isCampaignRelevant(category, domainKnowledge);
    const membershipRelevant = isMembershipRelevant(category);

    // Visit-based forceMount: first open loads once; leave/return keeps state (no tab-switch storms).
    // Inactive panels stay mounted but must be CSS-hidden — see TabsContent data-[state=inactive]:hidden.
    // Reset visited set on tenant change so force-mounted panels remount with the new business_id.
    const keepAliveVisitedRef = React.useRef(new Set(['dashboard']));
    const keepAliveBusinessRef = React.useRef(activeBusinessId);
    if (activeBusinessId && keepAliveBusinessRef.current !== activeBusinessId) {
        keepAliveBusinessRef.current = activeBusinessId;
        const seed =
            typeof activeTab === 'string' && KEEP_ALIVE_TABS.has(activeTab)
                ? activeTab
                : 'dashboard';
        keepAliveVisitedRef.current = new Set([seed]);
    }
    if (typeof activeTab === 'string' && KEEP_ALIVE_TABS.has(activeTab)) {
        keepAliveVisitedRef.current.add(activeTab);
    }
    const shouldForceMount = (tab) =>
        KEEP_ALIVE_TABS.has(tab) && keepAliveVisitedRef.current.has(tab);

    // Reports sub-views: keep visited panels mounted (CSS-hide) so Forecast/AI/Builder do not cold-remount.
    const [reportsView, setReportsView] = React.useState('analytics');
    const reportsVisitedRef = React.useRef(new Set(['analytics']));
    const reportsBusinessRef = React.useRef(activeBusinessId);
    if (activeBusinessId && reportsBusinessRef.current !== activeBusinessId) {
        reportsBusinessRef.current = activeBusinessId;
        reportsVisitedRef.current = new Set([reportsView || 'analytics']);
    }
    if (typeof reportsView === 'string') {
        reportsVisitedRef.current.add(reportsView);
    }
    const shouldShowReportsView = (view) => reportsVisitedRef.current.has(view);

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
            v.phone?.toLowerCase().includes(lowerTerm) ||
            v.ntn?.toLowerCase().includes(lowerTerm) ||
            v.email?.toLowerCase().includes(lowerTerm) ||
            v.contact_person?.toLowerCase().includes(lowerTerm)
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
            po.purchase_number?.toLowerCase().includes(lowerTerm) ||
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
    const [restaurantView, setRestaurantView] = React.useState('manager');
    const [hrView, setHrView] = React.useState('payroll');
    const [approvalsView, setApprovalsView] = React.useState('inbox'); // 'inbox' | 'builder'

    const {
        handleTabChange,
        handleDeleteInvoice,
        handleBulkDelete,
        handleExport,
        handleSaveProduct,
        handleDeleteProduct,
        handleLocationAdd,
        handleLocationUpdate,
        handleLocationDelete,
        handleStockTransfer,
        handleGenerateAutoPO,
        handleDeleteCustomer,
        handleDeleteVendor,
        handleUpdatePOStatus,
        handleCreateBOM,
        handleCreateProductionOrder,
        refreshAllData,
        fetchInventory,
        fetchPurchases,
        fetchSales,
        fetchFinance,
        fetchExpenses,
        setShowInvoiceBuilder,
        setShowProductForm,
        setShowCustomerForm,
        setEditingProduct,
        setEditingCustomer,
        setInvoiceInitialData,
        handleDateRangePreset,
        setShowVendorForm,
        setEditingVendor,
        setShowPOBuilder,
        // POS & Restaurant
        posSession,
        handleStartPosSession,
        handleClosePosSession,
        restaurantTables,
        kitchenQueue,
        handlePosCheckout,
        handleTableAction,
        handleNewRestaurantOrder,
        handleKitchenStatusUpdate,
    } = handlers;

    const tabVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 }
    };

    const wrapTab = (content) => (
        <motion.div
            key={activeBusinessId || 'hub'}
            className="min-w-0 overflow-x-hidden"
            variants={tabVariants}
            initial={false}
            animate="animate"
            exit="exit"
            transition={{ duration: 0.08, ease: 'easeOut' }}
        >
            {content}
        </motion.div>
    );

    return (
        <>
                <TabsContent value="dashboard" forceMount={shouldForceMount('dashboard')} className="space-y-6 outline-none">
                    {wrapTab(
                        <DomainDashboard
                            businessId={activeBusinessId}
                            category={category}
                            invoices={invoices}
                            products={products}
                            customers={customers}
                            dateRange={dateRange}
                            currency={currency}
                            onQuickAction={handlers.handleQuickAction}
                            onDateRangePresetChange={handleDateRangePreset}
                            dashboardMetrics={dashboardMetrics}
                            chartData={dashboardChartData}
                            accountingSummary={accountingSummary}
                            expenseBreakdown={expenseBreakdown}
                            expenses={expenses}
                            advancedDashboardSnapshot={advancedDashboardSnapshot}
                            domainKnowledge={domainKnowledge}
                            user={user}
                            isAnalyticsLoading={isAnalyticsLoading}
                            isSalesLoading={isSalesLoading}
                            isInventoryLoading={isInventoryLoading}
                            isFinanceLoading={isFinanceLoading}
                            isExpensesLoading={isExpensesLoading}
                            isDataLoaded={isDataLoaded}
                            activityFeed={activityFeed}
                            productTotal={productTotal}
                            hasMoreProducts={hasMoreProducts}
                            onLoadMoreProducts={onLoadMoreProducts}
                        />
                    )}
                </TabsContent>

                <TabsContent value="invoices" forceMount={shouldForceMount('invoices')} className="space-y-6 outline-none">
                    <ResourceLimitBanner
                        message={resourceLimits?.getLimitMessage?.('invoices')}
                        isAtLimit={resourceLimits?.limitReached?.('invoices')}
                        onUpgrade={handlers?.handleUpgrade}
                    />
                    {wrapTab(
                        <TabGuard tabKey="invoices" role={role} planTier={planTier} featureName="Invoices" onUpgrade={() => handleTabChange('settings')}>
                            <InvoiceList
                                invoices={filteredInvoices}
                                currency={currency}
                                onAdd={() => handlers?.setShowInvoiceBuilder?.(true)}
                                onInvoiceDelete={handlers?.handleDeleteInvoice}
                                onView={handlers?.handleViewInvoice}
                                onEdit={(invoice) => {
                                    handlers?.setInvoiceInitialData?.(invoice);
                                    handlers?.setShowInvoiceBuilder?.(true);
                                }}
                                onRecordPayment={handlers?.handleRecordPayment}
                                onBulkDelete={handlers?.handleBulkDeleteInvoices}
                                onBulkImport={handlers?.handleBulkImportInvoices}
                                onExport={handlers?.handleExportInvoices}
                                category={category}
                                colors={colors}
                            />
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="inventory" forceMount={shouldForceMount('inventory')} className="space-y-6 outline-none">
                    <ResourceLimitBanner
                        message={resourceLimits?.getLimitMessage?.('products')}
                        isAtLimit={resourceLimits?.limitReached?.('products')}
                        onUpgrade={handlers?.handleUpgrade}
                    />
                    {hasMoreProducts ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                            <span>
                                Showing {products.length} of {productTotal || products.length} products
                            </span>
                            <button
                                type="button"
                                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                                onClick={() => void onLoadMoreProducts?.()}
                            >
                                Load more
                            </button>
                        </div>
                    ) : null}
                    {wrapTab(
                        <TabGuard tabKey="inventory" role={role} planTier={planTier} featureName="Inventory" onUpgrade={() => handleTabChange('settings')}>
                            <InventoryTab
                                products={filteredProducts}
                                businessId={activeBusinessId}
                                category={category}
                                onProductSave={handleSaveProduct}
                                onProductDelete={handleDeleteProduct}
                                refreshData={() =>
                                  fetchInventory({ force: true, detailLevel: 'grid' })
                                }
                                resyncCatalog={() =>
                                  fetchInventory({ force: true, detailLevel: 'grid', fullCatalog: true })
                                }
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
                                onEdit={(product) => {
                                    setEditingProduct(product);
                                    setShowProductForm(true);
                                }}
                                onUpdate={async (product) => {
                                    // Busy grid + Excel bulk: same composite upsert as the form. Supports creates
                                    // when `product.id` is missing (Excel new rows). Avoid hardcoding isUpdate.
                                    const persisted = Boolean(product?.id);
                                    const fullProduct = persisted ? products.find((p) => p.id === product.id) : null;
                                    const firstNonEmpty = (...candidates) => {
                                        for (const c of candidates) {
                                            if (Array.isArray(c) && c.length > 0) return c;
                                        }
                                        return null;
                                    };
                                    const batches =
                                        firstNonEmpty(fullProduct?.batches, product.batches) || [];
                                    // Never prefer empty [] over deferred/missing — that drops serial tracking on Busy save.
                                    const serialsDeferred = Boolean(
                                        fullProduct?._serialsDeferred || product?._serialsDeferred
                                    );
                                    const serialNumbers = firstNonEmpty(
                                        serialsDeferred ? null : fullProduct?.serial_numbers,
                                        serialsDeferred ? null : fullProduct?.serialNumbers,
                                        product.serialNumbers,
                                        product.serial_numbers
                                    );

                                    const payload = {
                                        ...product,
                                        batches,
                                        business_id: business.id,
                                    };
                                    if (serialNumbers) {
                                        payload.serialNumbers = serialNumbers;
                                    } else if (serialsDeferred) {
                                        // Omit serials so composite does not treat this as "clear serial mode".
                                        delete payload.serialNumbers;
                                        delete payload.serial_numbers;
                                        payload._serialsDeferred = true;
                                    } else {
                                        payload.serialNumbers = [];
                                    }

                                    const saved = await handleSaveProduct(payload, {
                                        skipFullWorkspaceRefresh: true,
                                        silentToast: true,
                                    });
                                    return saved;
                                }}
                                onLocationAdd={handleLocationAdd}
                                onLocationUpdate={handleLocationUpdate}
                                onLocationDelete={handleLocationDelete}
                                onStockTransfer={handleStockTransfer}
                                onGeneratePO={handleGenerateAutoPO}
                                isLoading={inventoryLoading}
                            />
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="customers" forceMount={shouldForceMount('customers')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="customers" role={role} planTier={planTier} featureName="Customers" onUpgrade={() => handleTabChange('settings')}>
                            <CustomersTab
                                customers={filteredCustomers}
                                businessId={activeBusinessId}
                                category={category}
                                isLoading={customersLoading}
                                onCustomerDelete={handleDeleteCustomer}
                                onAdd={() => setShowCustomerForm(true)}
                                onUpdate={(customer) => {
                                    setEditingCustomer(customer);
                                    setShowCustomerForm(true);
                                }}
                            />
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="vendors" forceMount={shouldForceMount('vendors')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="vendors" role={role} planTier={planTier} featureName="Vendors" onUpgrade={() => handleTabChange('settings')}>
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
                                businessId={activeBusinessId}
                                category={category}
                            />
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="payments" forceMount={shouldForceMount('payments')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="payments" role={role} planTier={planTier} featureName="Payments" onUpgrade={() => handleTabChange('settings')}>
                            <PaymentManager
                                businessId={activeBusinessId}
                                customers={filteredCustomers}
                                vendors={filteredVendors}
                                invoices={filteredInvoices}
                                purchases={purchaseOrders}
                                refreshData={async () => {
                                    await Promise.all([
                                        fetchSales({ force: true }),
                                        fetchFinance({ force: true }),
                                    ]);
                                }}
                            />
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="purchases" forceMount={shouldForceMount('purchases')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="purchases" role={role} planTier={planTier} featureName="Purchases" onUpgrade={() => handleTabChange('settings')}>
                            <PurchaseOrderManager
                                category={category}
                                purchaseOrders={filteredPurchaseOrders}
                                onUpdateStatus={handleUpdatePOStatus}
                                refreshData={() => fetchPurchases({ force: true })}
                                onCreate={() => setShowPOBuilder(true)}
                            />
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="sales" forceMount={shouldForceMount('sales')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="sales" role={role} planTier={planTier} featureName="Sales" onUpgrade={() => handleTabChange('settings')}>
                            <StorefrontTabShell activeTab="sales">
                            <SalesManager
                                invoices={invoices}
                                customers={customers}
                                products={products}
                                category={category}
                                businessId={activeBusinessId}
                                currency={currency}
                            />
                            </StorefrontTabShell>
                        </TabGuard>
                    )}
                </TabsContent>

                {domainKnowledge?.manufacturingEnabled && (
                    <TabsContent value="manufacturing" className="space-y-6 outline-none">
                        {wrapTab(
                            <TabGuard tabKey="manufacturing" role={role} planTier={planTier} featureName="Manufacturing" onUpgrade={() => handleTabChange('settings')}>
                                <ManufacturingModule
                                    products={filteredProducts}
                                    bomList={filteredBoms}
                                    productionOrders={filteredProductionOrders}
                                    warehouses={locations}
                                    onBOMAdd={handleCreateBOM}
                                    onProductionOrderCreate={handleCreateProductionOrder}
                                    onSave={refreshAllData}
                                    businessId={activeBusinessId}
                                />
                            </TabGuard>
                        )}
                    </TabsContent>
                )}

                {domainKnowledge?.multiLocationEnabled && (
                    <TabsContent value="warehouses" className="space-y-6 outline-none">
                        {wrapTab(
                            <TabGuard tabKey="warehouses" role={role} planTier={planTier} featureName="Warehouses" requiredPlan="professional" onUpgrade={() => handleTabChange('settings')}>
                                <MultiLocationInventory
                                    businessId={activeBusinessId}
                                    locations={locations}
                                    products={filteredProducts}
                                    onLocationAdd={handleLocationAdd}
                                    onLocationUpdate={handleLocationUpdate}
                                    onLocationDelete={handleLocationDelete}
                                    onStockTransfer={handleStockTransfer}
                                />
                            </TabGuard>
                        )}
                    </TabsContent>
                )}

                <TabsContent value="quotations" className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="quotations" role={role} planTier={planTier} featureName="Quotations" onUpgrade={() => handleTabChange('settings')}>
                            <StorefrontTabShell activeTab="quotations">
                            <QuotationOrderChallanManager
                                quotations={filteredQuotations}
                                salesOrders={filteredSalesOrders}
                                challans={filteredChallans}
                                customers={filteredCustomers}
                                products={filteredProducts}
                                refreshData={() => fetchSales({ force: true })}
                                category={category}
                                onIssueInvoice={(header) => {
                                    setInvoiceInitialData(header);
                                    setShowInvoiceBuilder(true);
                                }}
                            />
                            </StorefrontTabShell>
                        </TabGuard>
                    )}
                </TabsContent>

                {domainKnowledge?.batchTrackingEnabled && (
                    <TabsContent value="batches" className="space-y-6 outline-none">
                        {wrapTab(
                            <TabGuard tabKey="batches" role={role} planTier={planTier} featureName="Batches & Serials" requiredPlan="professional" onUpgrade={() => handleTabChange('settings')}>
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Global Batch Monitoring</CardTitle>
                                            <CardDescription>Select a product from the Inventory tab to manage specific batches.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="h-[360px] flex flex-col items-center justify-center text-center">
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

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Serial Verification</CardTitle>
                                            <CardDescription>Scan or enter serial numbers to validate inventory authenticity and status.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <SerialScanner
                                                businessId={activeBusinessId}
                                                mode="scan"
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabGuard>
                        )}
                    </TabsContent>
                )}

                {/* Legacy accounting/expenses/credit-notes/fiscal/exchange-rates tabs alias → finance via tabs.js */}
                <TabsContent value="finance" forceMount={shouldForceMount('finance')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="finance" role={role} planTier={planTier} featureName="Finance" onUpgrade={() => handleTabChange('settings')}>
                            <FinanceHub
                                businessId={activeBusinessId}
                                businessCategory={category}
                                initialTab={financeInitialTab || undefined}
                                onInitialTabConsumed={onFinanceInitialTabConsumed}
                            />
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="reports" forceMount={shouldForceMount('reports')} className="space-y-4 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="reports" role={role} planTier={planTier} featureName="Analytics & AI" onUpgrade={() => handleTabChange('settings')}>
                            <div className="min-w-0 space-y-4 overflow-x-hidden">
                                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                                    <h2 className="hidden shrink-0 text-sm font-semibold tracking-tight text-gray-900 sm:block">
                                        Reports
                                    </h2>
                                    <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto overscroll-x-contain rounded-xl bg-gray-100 p-1 scrollbar-none snap-x snap-mandatory">
                                        {[
                                            { key: 'analytics', label: 'Analytics', short: 'Analytics' },
                                            { key: 'forecast', label: 'Demand Forecast', short: 'Forecast' },
                                            { key: 'ai', label: 'AI Insights', short: 'AI' },
                                            { key: 'builder', label: 'Report Builder', short: 'Builder' },
                                        ].map(v => (
                                            <button
                                                key={v.key}
                                                type="button"
                                                onClick={() => setReportsView(v.key)}
                                                className={`shrink-0 snap-start rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all sm:px-3 sm:text-xs ${reportsView === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                <span className="sm:hidden">{v.short}</span>
                                                <span className="hidden sm:inline">{v.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {shouldShowReportsView('analytics') ? (
                                    <div
                                        className={reportsView === 'analytics' ? 'space-y-4' : 'hidden'}
                                        aria-hidden={reportsView !== 'analytics'}
                                    >
                                        <AdvancedAnalytics businessId={activeBusinessId} category={category} currency={currency} dateRange={dateRange} />
                                    </div>
                                ) : null}
                                {shouldShowReportsView('forecast') ? (
                                    <div
                                        className={reportsView === 'forecast' ? 'space-y-4' : 'hidden'}
                                        aria-hidden={reportsView !== 'forecast'}
                                    >
                                        <DemandForecast businessId={activeBusinessId} category={category} products={products} invoices={invoices} domainKnowledge={domainKnowledge} dateRange={dateRange} />
                                    </div>
                                ) : null}
                                {shouldShowReportsView('ai') ? (
                                    <div
                                        className={reportsView === 'ai' ? 'space-y-4' : 'hidden'}
                                        aria-hidden={reportsView !== 'ai'}
                                    >
                                        <AIInsightsPanel businessId={activeBusinessId} category={category} currency={currency} dateRange={dateRange} />
                                    </div>
                                ) : null}
                                {shouldShowReportsView('builder') ? (
                                    <div
                                        className={reportsView === 'builder' ? 'space-y-4' : 'hidden'}
                                        aria-hidden={reportsView !== 'builder'}
                                    >
                                        <ReportBuilder businessId={activeBusinessId} currency={currency} dateRange={dateRange} />
                                    </div>
                                ) : null}
                            </div>
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="campaigns" forceMount={shouldForceMount('campaigns')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="campaigns" role={role} planTier={planTier} domainCheck={campaignRelevant} domainTitle="Campaigns & Marketing not relevant for this domain" domainMessage="Marketing automations are enabled for customer-facing retail and service domains." requiredPlan="business" featureName="Campaigns & Marketing" onUpgrade={() => handleTabChange('settings')}>
                            <CampaignsManager
                                businessId={activeBusinessId}
                                currency={currency}
                                customerCount={
                                    (customers || []).filter((c) => !c.is_deleted).length || (customers || []).length
                                }
                                category={category}
                            />
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="gst" forceMount={shouldForceMount('gst')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="gst" role={role} planTier={planTier} featureName="Tax & GST" onUpgrade={() => handleTabChange('settings')}>
                            <TaxComplianceManager
                                invoices={filteredInvoices}
                                purchaseOrders={filteredPurchaseOrders}
                                business={business}
                            />
                        </TabGuard>
                    )}
                </TabsContent>

                {/* --- Phase 3+5+6: New Module Tabs ---------------------------- */}

                <TabsContent value="pos" forceMount={shouldForceMount('pos')} className="outline-none mt-0 pt-2 lg:pt-3">
                    {wrapTab(
                        <TabGuard
                            tabKey="pos"
                            role={role}
                            planTier={planTier}
                            domainCheck={posRelevant}
                            domainTitle="Point of Sale not relevant for this domain"
                            domainMessage="Switch to a retail or hospitality domain profile to enable POS workflows."
                            featureName="Point of Sale"
                            onUpgrade={() => handleTabChange('settings')}
                        >
                            <StorefrontTabShell activeTab="pos">
                            {resolvePosVariant(category) === 'restaurant' ? (
                                <RestaurantPOS
                                    businessId={activeBusinessId}
                                    products={filteredProducts}
                                    customers={filteredCustomers}
                                    onStartSession={handleStartPosSession}
                                    onOrderSent={handleNewRestaurantOrder}
                                    onOrderComplete={() => refreshAllData?.()}
                                    currency={currency}
                                    session={posSession}
                                />
                            ) : resolvePosVariant(category) === 'superstore' ? (
                                <SuperStorePOS
                                    businessId={activeBusinessId}
                                    category={category}
                                    products={filteredProducts}
                                    customers={filteredCustomers}
                                    onStartSession={handleStartPosSession}
                                    onCloseSession={handleClosePosSession}
                                    onCompleteSale={handlePosCheckout}
                                    currency={currency}
                                    session={posSession}
                                />
                            ) : (
                                <PosTerminal
                                    businessId={activeBusinessId}
                                    category={category}
                                    products={filteredProducts}
                                    customers={filteredCustomers}
                                    onStartSession={handleStartPosSession}
                                    onCloseSession={handleClosePosSession}
                                    onCompleteSale={handlePosCheckout}
                                    currency={currency}
                                    session={posSession}
                                />
                            )}
                            </StorefrontTabShell>
                        </TabGuard>
                    )}
                </TabsContent>

                {/* --- Orders Tab - Storefront Orders ----------------------- */}
                <TabsContent value="orders" forceMount={shouldForceMount('orders')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard
                            tabKey="orders"
                            role={role}
                            planTier={planTier}
                            featureName="Orders Management"
                            onUpgrade={() => handleTabChange('settings')}
                        >
                            <StorefrontTabShell activeTab="orders">
                            <OrdersManager
                                business={business}
                                category={category}
                            />
                            </StorefrontTabShell>
                        </TabGuard>
                    )}
                </TabsContent>

                {/* --- Customer Inquiries Tab - Storefront contact messages --- */}
                <TabsContent value="inquiries" forceMount={shouldForceMount('inquiries')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard
                            tabKey="inquiries"
                            role={role}
                            planTier={planTier}
                            featureName="Customer Inquiries"
                            onUpgrade={() => handleTabChange('settings')}
                        >
                            <StorefrontTabShell activeTab="inquiries">
                                <CustomerInquiriesManager business={business} />
                            </StorefrontTabShell>
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="restaurant" forceMount={shouldForceMount('restaurant')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard
                            tabKey="restaurant"
                            role={role}
                            planTier={planTier}
                            domainCheck={hospitalityDomain}
                            domainTitle="Restaurant module is domain-specific"
                            domainMessage="This module is available for bakery, restaurant, and hotel domains only."
                            requiredPlan="starter"
                            featureName="Restaurant Operations"
                            onUpgrade={() => handleTabChange('settings')}
                        >
                            <StorefrontTabShell activeTab="restaurant">
                            <div className="space-y-4 lg:space-y-6">
                                <div className="hidden items-center justify-between lg:flex">
                                    <h2 className="text-xl font-semibold uppercase tracking-tight text-gray-900">Restaurant Operations</h2>
                                    <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
                                        {[
                                            { key: 'manager', label: 'Manager' },
                                            { key: 'floorplan', label: 'Floor Plan' },
                                            { key: 'reservations', label: 'Reservations' },
                                        ].map(v => (
                                            <button
                                                key={v.key}
                                                onClick={() => setRestaurantView(v.key)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${restaurantView === v.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                {v.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100/80 p-0.5 lg:hidden">
                                    {[
                                        { key: 'manager', label: 'Manager' },
                                        { key: 'floorplan', label: 'Floor' },
                                        { key: 'reservations', label: 'Bookings' },
                                    ].map((v) => (
                                        <button
                                            key={v.key}
                                            type="button"
                                            onClick={() => setRestaurantView(v.key)}
                                            className={`shrink-0 rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all ${restaurantView === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                                        >
                                            {v.label}
                                        </button>
                                    ))}
                                </div>

                                {restaurantView === 'floorplan' && (
                                    <FloorPlanEditor
                                        businessId={activeBusinessId}
                                        initialTables={restaurantTables || []}
                                        onSave={(data) => {
                                            handleTableAction('bulk_update', null, data);
                                            setRestaurantView('manager');
                                        }}
                                    />
                                )}
                                {restaurantView === 'reservations' && (
                                    <ReservationManager
                                        businessId={activeBusinessId}
                                        tables={restaurantTables || []}
                                    />
                                )}
                                {restaurantView === 'manager' && (
                                    <>
                                        <RestaurantManager
                                            businessId={activeBusinessId}
                                            tables={restaurantTables || []}
                                            kitchenQueue={kitchenQueue || []}
                                            onTableAction={(table) => {
                                                // RestaurantManager passes the table object; adapt to handleTableAction(action, tableId)
                                                if (!table?.id) return;
                                                const nextStatus = table.status === 'occupied' ? 'clear'
                                                    : table.status === 'available' ? 'occupy'
                                                    : table.status;
                                                handleTableAction(nextStatus, table.id, table);
                                            }}
                                            onNewOrder={handleNewRestaurantOrder}
                                            onKitchenStatusUpdate={handleKitchenStatusUpdate}
                                            onRefresh={refreshAllData}
                                        />
                                        <KitchenDisplaySystem businessId={activeBusinessId} />
                                    </>
                                )}
                            </div>
                            </StorefrontTabShell>
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="payroll" className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="payroll" role={role} planTier={planTier} requiredPlan="business" featureName="HR & Payroll" onUpgrade={() => handleTabChange('settings')}>
                            <div className="min-w-0 space-y-4 overflow-x-hidden lg:space-y-6">
                                <h2 className="hidden text-xl font-semibold uppercase tracking-tight text-gray-900 lg:block">HR & Payroll</h2>
                                <div className="flex min-w-0 gap-1 overflow-x-auto overscroll-x-contain rounded-xl bg-gray-100 p-1 scrollbar-none snap-x snap-mandatory lg:hidden">
                                    {[
                                        { key: 'payroll', label: 'Payroll' },
                                        { key: 'attendance', label: 'Attendance' },
                                        { key: 'shifts', label: 'Shifts' },
                                    ].map(v => (
                                        <button
                                            key={v.key}
                                            type="button"
                                            onClick={() => setHrView(v.key)}
                                            className={`shrink-0 snap-start rounded-lg px-3 py-2 text-[11px] font-bold transition-all ${hrView === v.key ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}
                                        >
                                            {v.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="hidden items-center justify-end lg:flex">
                                    <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
                                        {[
                                            { key: 'payroll', label: 'Payroll' },
                                            { key: 'attendance', label: 'Attendance' },
                                            { key: 'shifts', label: 'Shifts' },
                                        ].map(v => (
                                            <button
                                                key={v.key}
                                                onClick={() => setHrView(v.key)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${hrView === v.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                {v.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {hrView === 'payroll' && (
                                    <PayrollDashboard
                                        businessId={activeBusinessId}
                                        employees={handlers.payrollEmployees || []}
                                        payrollRuns={handlers.payrollRuns || []}
                                        onProcessPayroll={handlers.handleProcessPayroll}
                                        onViewPayslips={handlers.handleViewPayslips}
                                        onAddEmployee={handlers.handleAddEmployee}
                                        currency={currency}
                                    />
                                )}
                                {hrView === 'attendance' && (
                                    <AttendanceTracker 
                                        businessId={activeBusinessId} 
                                        employees={(handlers.payrollEmployees || []).map(emp => ({
                                            id: emp.id,
                                            name: emp.full_name || 'Unnamed Employee',
                                            role: emp.designation || 'Staff',
                                            department: emp.department || 'Operations'
                                        }))}
                                    />
                                )}
                                {hrView === 'shifts' && (
                                    <ShiftScheduler 
                                        businessId={activeBusinessId} 
                                        employees={(handlers.payrollEmployees || []).map(emp => ({
                                            id: emp.id,
                                            name: emp.full_name || 'Unnamed Employee',
                                            role: emp.designation || 'Staff',
                                            department: emp.department || 'Operations'
                                        }))}
                                    />
                                )}
                            </div>
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="approvals" className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="approvals" role={role} planTier={planTier} requiredPlan="business" featureName="Approval Workflows" onUpgrade={() => handleTabChange('settings')}>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold text-gray-900 uppercase tracking-tight">Approvals & Workflows</h2>
                                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                                        {[
                                            { key: 'inbox', label: 'Approval Inbox' },
                                            { key: 'builder', label: 'Workflow Builder' },
                                        ].map(v => (
                                            <button
                                                key={v.key}
                                                onClick={() => setApprovalsView(v.key)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${approvalsView === v.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                {v.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {approvalsView === 'inbox' && (
                                    <ApprovalInbox
                                        pendingRequests={handlers.pendingApprovals || []}
                                        historyRequests={handlers.approvalHistory || []}
                                        onApprove={handlers.handleApproveRequest}
                                        onReject={handlers.handleRejectRequest}
                                        currency={currency}
                                    />
                                )}
                                {approvalsView === 'builder' && (
                                    <WorkflowBuilder businessId={activeBusinessId} />
                                )}
                            </div>
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="loyalty" forceMount={shouldForceMount('loyalty')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="loyalty" role={role} planTier={planTier} domainCheck={posRelevant} domainTitle="Loyalty & CRM not relevant for this domain" domainMessage="Loyalty and POS CRM are available for customer-facing retail and hospitality domains." requiredPlan="starter" featureName="Loyalty & CRM" onUpgrade={() => handleTabChange('settings')}>
                            <StorefrontTabShell activeTab="loyalty">
                            <div className="space-y-6 lg:space-y-8">
                                <CustomerLoyaltyPortal businessId={activeBusinessId} currency={currency} />
                                <div className="border-t border-gray-100 pt-6 lg:pt-8">
                                    <PromotionEngine businessId={activeBusinessId} currency={currency} />
                                </div>
                                <div className="border-t border-gray-100 pt-6 lg:pt-8">
                                    <LoyaltyManager businessId={activeBusinessId} />
                                </div>
                            </div>
                            </StorefrontTabShell>
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="memberships" forceMount={shouldForceMount('memberships')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="memberships" role={role} planTier={planTier} domainCheck={membershipRelevant} domainTitle="Memberships not relevant for this domain" domainMessage="Membership management is available for gym, spa, salon, and similar service verticals." requiredPlan="professional" featureName="Membership Management" onUpgrade={() => handleTabChange('settings')}>
                            <StorefrontTabShell activeTab="memberships">
                            <MembershipManager businessId={activeBusinessId} category={category} />
                            </StorefrontTabShell>
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="refunds" className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="refunds" role={role} planTier={planTier} domainCheck={posRelevant} domainTitle="Refunds & Returns not relevant for this domain" domainMessage="Refund workflows are available only for POS-enabled domains." requiredPlan="starter" featureName="POS & Refunds" onUpgrade={() => handleTabChange('settings')}>
                            <StorefrontTabShell activeTab="refunds">
                            <PosRefundPanel businessId={activeBusinessId} />
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Manager void
                                </p>
                                <PosVoidPanel businessId={activeBusinessId} currency={currency} />
                            </div>
                            </StorefrontTabShell>
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="audit" forceMount={shouldForceMount('audit')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="audit" role={role} planTier={planTier} requiredPlan="business" featureName="Audit Trail" onUpgrade={() => handleTabChange('settings')}>
                            <AuditTrailViewer businessId={activeBusinessId} />
                        </TabGuard>
                    )}
                </TabsContent>

                <TabsContent value="settings" forceMount={shouldForceMount('settings')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="settings" role={role} planTier={planTier} featureName="Settings" onUpgrade={() => handleTabChange('settings')}>
                            <SettingsManager category={category} />
                        </TabGuard>
                    )}
                </TabsContent>

                {/* --- Store Settings Tab --- */}
                <TabsContent value="store-settings" forceMount={shouldForceMount('store-settings')} className="space-y-6 outline-none">
                    {wrapTab(
                        <TabGuard tabKey="store-settings" role={role} planTier={planTier} featureName="Store Settings" onUpgrade={() => handleTabChange('settings')}>
                            <StorefrontTabShell activeTab="store-settings">
                            <StoreSettingsManager business={business} category={category} />
                            </StorefrontTabShell>
                        </TabGuard>
                    )}
                </TabsContent>

        </>
    );
}
