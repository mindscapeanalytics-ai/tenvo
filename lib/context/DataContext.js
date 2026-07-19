'use client';

import { createContext, useContext, useState, useCallback, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useBusiness } from './BusinessContext';
import { useFilters } from './FilterContext';
import {
    customerAPI,
    vendorAPI,
    purchaseAPI,
    quotationAPI,
} from '@/lib/api';
import {
    getInvoicesAction
} from '@/lib/actions/basic/invoice';
import {
    getWarehouseLocationsAction
} from '@/lib/actions/standard/inventory/warehouse';
import { getProductsAction } from '@/lib/actions/standard/inventory/product';
import {
    getBOMsAction,
    getProductionOrdersAction
} from '@/lib/actions/premium/manufacturing';
import {
    getPayrollEmployeesAction,
    getPayrollRunsAction
} from '@/lib/actions/standard/payroll';
import {
    getPendingApprovalsAction,
    getApprovalHistoryAction
} from '@/lib/actions/standard/workflow';
import {
    getMonthlyFinancialsAction,
} from '@/lib/actions/standard/report';
import { getExpensesAction } from '@/lib/actions/basic/expense';
import {
    getExpenseBreakdownAction,
    getAnalyticsBundleAction,
} from '@/lib/actions/premium/ai/analytics';
import { getAdvancedDashboardSnapshotAction } from '@/lib/actions/dashboard/advancedDashboardSnapshot';
import { getHubShellBootstrapAction } from '@/lib/actions/dashboard/hubShellBootstrap';
import {
    HUB_SHELL_CUSTOMER_LIMIT,
    HUB_SHELL_PRODUCT_PAGE_LIMIT,
} from '@/lib/dashboard/hubShellBootstrapConstants';
import { buildDashboardMetricsFromSnapshot } from '@/lib/dashboard/hubBootstrapMetrics';
import {
    clearHubShellCache,
    hubShellCacheKey,
    readHubShellCache,
    writeHubShellCache,
} from '@/lib/dashboard/hubShellCache';
import { getSalesPerformanceAction } from '@/lib/actions/basic/dashboard';
import { hubAnalyticsQueryKey, hubSalesPerformanceQueryKey } from '@/lib/dashboard/hubQueryKeys';
import { toAnalyticsIsoDate } from '@/lib/utils/analyticsRange';
import { scopeProductsToBusiness, isForeignTenantProduct } from '@/lib/utils/inventoryTenancy';
import toast from 'react-hot-toast';

const DataContext = createContext(undefined);

export function DataProvider({ children }) {
    const { business } = useBusiness();
    const { dateRange } = useFilters();
    const queryClient = useQueryClient();

    const [invoices, setInvoices] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [quotations, setQuotations] = useState([]);
    const [salesOrders, setSalesOrders] = useState([]);
    const [challans, setChallans] = useState([]);
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [locations, setLocations] = useState([]);
    const [bomList, setBomList] = useState([]);
    const [productionOrders, setProductionOrders] = useState([]);
    const [payrollEmployees, setPayrollEmployees] = useState([]);
    const [payrollRuns, setPayrollRuns] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [approvalHistory, setApprovalHistory] = useState([]);
    const [accountingSummary, setAccountingSummary] = useState(null);
    const [dashboardChartData, setDashboardChartData] = useState([]);
    const [dashboardMetrics, setDashboardMetrics] = useState(null);
    const [expenseBreakdown, setExpenseBreakdown] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [advancedDashboardSnapshot, setAdvancedDashboardSnapshot] = useState(null);
    const [activityFeed, setActivityFeed] = useState([]);
    const [productTotal, setProductTotal] = useState(0);
    const [hasMoreProducts, setHasMoreProducts] = useState(false);

    const [loadingModules, setLoadingModules] = useState({});
    /** Per-module fetch completed for current business (avoids tab-switch refetch storms). */
    const [moduleReady, setModuleReady] = useState({});
    /** True once minimal dashboard data is available — unblocks main content shell. */
    const [isShellReady, setIsShellReady] = useState(false);
    /** True once all background module fetches for the current business have settled. */
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const fetchGenerationRef = useRef(0);
    const shellReadyBusinessIdRef = useRef(null);
    /** Tracks last business id that completed a tenant switch reset (not date-only). */
    const lastTenantResetBusinessIdRef = useRef(null);
    const financeDateKeyRef = useRef(null);
    const salesDateKeyRef = useRef(null);
    const moduleInFlightRef = useRef({});
    /** Sync module-ready flags (ref avoids recreating fetch callbacks). */
    const moduleReadyRef = useRef({});
    /** 'bootstrap' | 'invoices' | 'full' — invoices depth; customers/quotations are separate modules. */
    const salesListDepthRef = useRef('bootstrap');
    /** True once CRM customer list has been painted (shell or fetchCustomers). */
    const customersReadyRef = useRef(false);
    /** True once quotations / sales orders / challans have been loaded. */
    const quotationsReadyRef = useRef(false);
    /** True once page-0 (or fuller) product list has been loaded for inventory UI. */
    const inventoryCatalogReadyRef = useRef(false);
    const productOffsetRef = useRef(0);
    /** businessId|from|to — set when shell KPIs are painted (SSR, cache, or network). */
    const shellPaintedKeyRef = useRef(null);
    /** Prevents soft-revalidate storms when layout effect re-runs for the same painted key. */
    const shellSoftFetchKeyRef = useRef(null);

    // Stable primitives for dependency arrays — local YYYY-MM-DD aligns shell cache, bootstrap, and RQ keys.
    const businessId = business?.id;
    const dateFromISO = toAnalyticsIsoDate(dateRange.from) || toAnalyticsIsoDate(new Date());
    const dateToISO = toAnalyticsIsoDate(dateRange.to) || toAnalyticsIsoDate(new Date());

    const shellRangeKey = useCallback((id, from, to) => `${id}|${from}|${to}`, []);

    const applyHubShellPayload = useCallback((payload, { markReady = true, paintedKey = null, businessId: payloadBusinessId = null } = {}) => {
        if (!payload) return;

        const scopedBusinessId = payloadBusinessId || businessId || null;
        const scopedProducts = scopeProductsToBusiness(payload.products, scopedBusinessId);

        setAccountingSummary(payload.glSummary || null);
        setDashboardChartData(Array.isArray(payload.chartSeries) ? payload.chartSeries : []);
        setExpenseBreakdown(Array.isArray(payload.expenseBreakdown) ? payload.expenseBreakdown : []);
        setAdvancedDashboardSnapshot({
            finance: payload.finance || null,
            range: payload.range || null,
            kpis: payload.kpis || null,
        });
        const metricsFromSnapshot = buildDashboardMetricsFromSnapshot(payload);
        if (metricsFromSnapshot) {
            setDashboardMetrics(metricsFromSnapshot);
        }
        // Shell KPIs are the Overview source of truth — mark analytics ready without a second metrics fetch.
        moduleReadyRef.current.analytics = true;
        setInvoices(Array.isArray(payload.invoices) ? payload.invoices : []);
        setProducts(scopedProducts);
        setLocations(Array.isArray(payload.locations) ? payload.locations : []);
        setActivityFeed(Array.isArray(payload.activity) ? payload.activity : []);

        // CRM integrity: shell may return customers: [] with errors.customers on partial failure.
        // Never treat that as a successful empty tenant, and never wipe a painted list.
        const shellCustomersFailed = Boolean(
            payload?.errors &&
                typeof payload.errors === 'object' &&
                payload.errors.customers
        );
        const nextCustomers = Array.isArray(payload.customers) ? payload.customers : null;
        let customersMarkedReady = false;
        if (shellCustomersFailed) {
            setCustomers((prev) =>
                Array.isArray(prev) && prev.length > 0 ? prev : Array.isArray(prev) ? prev : []
            );
            // Leave customersReadyRef as-is when we already painted; otherwise stay false for refetch.
        } else if (nextCustomers) {
            setCustomers(nextCustomers);
            customersReadyRef.current = true;
            moduleReadyRef.current.customers = true;
            customersMarkedReady = true;
        }

        setProductTotal(
            Number.isFinite(Number(payload.productTotal))
                ? Number(payload.productTotal)
                : scopedProducts.length
        );
        setHasMoreProducts(Boolean(payload.hasMoreProducts));
        productOffsetRef.current = scopedProducts.length;
        salesListDepthRef.current = 'bootstrap';
        inventoryCatalogReadyRef.current = true;
        if (paintedKey) {
            shellPaintedKeyRef.current = paintedKey;
        }

        if (markReady) {
            moduleReadyRef.current = {
                ...moduleReadyRef.current,
                finance: true,
                sales: true,
                inventory: true,
                inventoryCatalog: true,
                expenses: true,
                analytics: true,
                ...(customersMarkedReady ? { customers: true } : {}),
            };
            setModuleReady((prev) => ({
                ...prev,
                finance: true,
                sales: true,
                inventory: true,
                inventoryCatalog: true,
                expenses: true,
                analytics: true,
                salesListDepth: 'bootstrap',
                ...(customersMarkedReady ? { customers: true } : {}),
            }));
        } else {
            setModuleReady((prev) => ({
                ...prev,
                analytics: true,
                ...(customersMarkedReady ? { customers: true } : {}),
            }));
        }
    }, [businessId]);

    const hydrateHubShellFromServer = useCallback((payload, meta = {}) => {
        const id = meta.businessId;
        const from = meta.dateFrom;
        const to = meta.dateTo;
        if (!payload || !id || !from || !to) return;

        // Never paint another tenant's shell into the live context.
        if (businessId && String(businessId) !== String(id)) {
            return;
        }

        const paintedKey = shellRangeKey(id, from, to);
        applyHubShellPayload(payload, { markReady: true, paintedKey, businessId: id });
        const customersFailed = Boolean(payload?.errors?.customers);
        writeHubShellCache(hubShellCacheKey(id, from, to), {
            kpis: payload.kpis,
            finance: payload.finance,
            glSummary: payload.glSummary,
            chartSeries: payload.chartSeries,
            expenseBreakdown: payload.expenseBreakdown,
            activity: payload.activity,
            invoices: payload.invoices,
            // Do not cache a failed empty CRM as truth for the next warm paint.
            ...(customersFailed
                ? {}
                : { customers: Array.isArray(payload.customers) ? payload.customers : [] }),
            products: scopeProductsToBusiness(payload.products, id),
            productTotal: payload.productTotal,
            hasMoreProducts: payload.hasMoreProducts,
            locations: payload.locations,
            range: payload.range,
            meta: payload.meta,
            ...(payload.errors ? { errors: payload.errors } : {}),
        });
        shellReadyBusinessIdRef.current = id;
        financeDateKeyRef.current = paintedKey;
        salesDateKeyRef.current = paintedKey;
        setIsShellReady(true);
    }, [applyHubShellPayload, shellRangeKey, businessId]);

    const fetchHubShell = useCallback(async ({ force = false } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;
        const cacheKey = hubShellCacheKey(businessId, dateFromISO, dateToISO);
        const paintedKey = shellRangeKey(businessId, dateFromISO, dateToISO);
        const alreadyPainted =
            shellPaintedKeyRef.current === paintedKey || Boolean(readHubShellCache(cacheKey));

        if (moduleInFlightRef.current.hubShell) {
            if (!force) return;
            let waited = 0;
            while (moduleInFlightRef.current.hubShell && waited < 8000) {
                await new Promise((resolve) => setTimeout(resolve, 40));
                waited += 40;
            }
            if (moduleInFlightRef.current.hubShell || isStale()) return;
        }

        moduleInFlightRef.current.hubShell = true;
        // Soft revalidate: keep Overview tiles live when SSR/cache already painted KPIs.
        if (!alreadyPainted || force) {
            setLoadingModules((prev) => ({
                ...prev,
                finance: true,
                sales: true,
                inventory: true,
                expenses: true,
                hubShell: true,
            }));
        }

        try {
            if (!force) {
                const cached = readHubShellCache(cacheKey);
                if (cached && !isStale()) {
                    applyHubShellPayload(cached, { markReady: true, paintedKey, businessId });
                }
            }
            // Do not clear session cache before fetch — warm paint stays available on miss/retry;
            // successful write overwrites the range key.

            const result = await getHubShellBootstrapAction(businessId, {
                from: dateFromISO,
                to: dateToISO,
            });
            if (isStale()) return;

            if (!result?.success) {
                throw new Error(result?.error || 'Hub shell bootstrap failed');
            }

            applyHubShellPayload(result, { markReady: true, paintedKey, businessId });
            const prevShellCache = readHubShellCache(cacheKey);
            const customersFailed = Boolean(result?.errors?.customers);
            const customersForCache = customersFailed
                ? (Array.isArray(prevShellCache?.customers) ? prevShellCache.customers : undefined)
                : (Array.isArray(result.customers) ? result.customers : []);
            writeHubShellCache(cacheKey, {
                kpis: result.kpis,
                finance: result.finance,
                glSummary: result.glSummary,
                chartSeries: result.chartSeries,
                expenseBreakdown: result.expenseBreakdown,
                activity: result.activity,
                invoices: result.invoices,
                ...(customersForCache !== undefined ? { customers: customersForCache } : {}),
                products: scopeProductsToBusiness(result.products, businessId),
                productTotal: result.productTotal,
                hasMoreProducts: result.hasMoreProducts,
                locations: result.locations,
                range: result.range,
                meta: result.meta,
                ...(result.errors ? { errors: result.errors } : {}),
            });
        } catch (error) {
            if (!isStale()) {
                console.error('Hub shell bootstrap error:', error);
                moduleReadyRef.current = {
                    ...moduleReadyRef.current,
                    finance: true,
                    sales: true,
                    inventory: true,
                    inventoryCatalog: true,
                    expenses: true,
                };
                setModuleReady((prev) => ({
                    ...prev,
                    finance: true,
                    sales: true,
                    inventory: true,
                    inventoryCatalog: true,
                    expenses: true,
                }));
            }
        } finally {
            if (!isStale()) {
                moduleInFlightRef.current.hubShell = false;
                setLoadingModules((prev) => ({
                    ...prev,
                    finance: false,
                    sales: false,
                    inventory: false,
                    expenses: false,
                    hubShell: false,
                }));
            }
        }
    }, [businessId, dateFromISO, dateToISO, applyHubShellPayload, shellRangeKey]);

    const fetchFinance = useCallback(async ({ force = false } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;
        // Queue force refetch when in-flight so date-preset changes are not dropped.
        if (moduleInFlightRef.current.finance) {
            if (!force) return;
            let waited = 0;
            while (moduleInFlightRef.current.finance && waited < 8000) {
                await new Promise((resolve) => setTimeout(resolve, 40));
                waited += 40;
            }
            if (moduleInFlightRef.current.finance || isStale()) return;
        }
        if (!force && moduleReadyRef.current.finance) return;
        if (isStale()) return;
        moduleInFlightRef.current.finance = true;
        setLoadingModules(prev => ({ ...prev, finance: true }));
        try {
            const [financials, breakdown, snapshot] = await Promise.all([
                getMonthlyFinancialsAction(businessId, 6),
                getExpenseBreakdownAction(businessId, { from: dateFromISO, to: dateToISO }),
                getAdvancedDashboardSnapshotAction(businessId, { from: dateFromISO, to: dateToISO }),
            ]);
            if (isStale()) return;
            // Extract GL summary from snapshot (avoids a separate getAccountingSummaryAction round-trip)
            setAccountingSummary(snapshot.success ? (snapshot.glSummary || null) : null);
            setDashboardChartData(financials.success ? financials.analytics : []);
            setExpenseBreakdown(breakdown.success ? breakdown.data : []);
            setAdvancedDashboardSnapshot(
                snapshot.success
                    ? { finance: snapshot.finance, range: snapshot.range, kpis: snapshot.kpis }
                    : null
            );
            const metricsFromSnapshot = snapshot.success
                ? buildDashboardMetricsFromSnapshot(snapshot)
                : null;
            if (metricsFromSnapshot) {
                setDashboardMetrics((prev) => {
                    if (!prev) return metricsFromSnapshot;
                    if (!force) return prev;
                    return {
                        ...prev,
                        revenue: metricsFromSnapshot.revenue ?? prev.revenue,
                        orders: metricsFromSnapshot.orders ?? prev.orders,
                        alerts: { ...(prev.alerts || {}), ...(metricsFromSnapshot.alerts || {}) },
                        inventory: { ...(prev.inventory || {}), ...(metricsFromSnapshot.inventory || {}) },
                    };
                });
            }
            moduleReadyRef.current.finance = true;
            setModuleReady(prev => ({ ...prev, finance: true }));
        } catch (error) {
            if (!isStale()) {
                console.error('Fetch Finance Error:', error);
                toast.error('Failed to load financial data');
                // Settle so Easy tiles leave skeleton (Busy/Zoho-style module unlock).
                moduleReadyRef.current.finance = true;
                setModuleReady(prev => ({ ...prev, finance: true }));
            }
        } finally {
            // Stale generations must not clear the new business's in-flight flags
            // (init resets moduleInFlightRef; a new fetch may already own the key).
            if (!isStale()) {
                moduleInFlightRef.current.finance = false;
                setLoadingModules(prev => ({ ...prev, finance: false }));
            }
        }
    }, [businessId, dateFromISO, dateToISO]);

    useEffect(() => {
        financeDateKeyRef.current = null;
        salesDateKeyRef.current = null;
        salesListDepthRef.current = 'bootstrap';
        inventoryCatalogReadyRef.current = false;
    }, [businessId]);

    // Refetch hub shell when the global date filter changes (Header presets / picker).
    // Zoho-style: paint target-range cache instantly; on miss clear stale KPIs then bootstrap.
    useEffect(() => {
        if (!businessId || !isShellReady) return;
        const key = shellRangeKey(businessId, dateFromISO, dateToISO);
        if (financeDateKeyRef.current === key) return;
        const hadPriorKey = financeDateKeyRef.current != null;
        financeDateKeyRef.current = key;
        salesDateKeyRef.current = key;
        if (!hadPriorKey) return;

        const cacheKey = hubShellCacheKey(businessId, dateFromISO, dateToISO);
        const cached = readHubShellCache(cacheKey);
        if (cached) {
            applyHubShellPayload(cached, { markReady: true, paintedKey: key, businessId });
            void fetchHubShell({ force: false });
            return;
        }

        // Cache miss: never leave previous-range KPIs marked as ready for the new preset.
        shellPaintedKeyRef.current = null;
        setDashboardMetrics(null);
        setAdvancedDashboardSnapshot(null);
        setAccountingSummary(null);
        setDashboardChartData([]);
        setExpenseBreakdown([]);
        setActivityFeed([]);
        moduleReadyRef.current = {
            ...moduleReadyRef.current,
            finance: false,
            sales: false,
            analytics: false,
            expenses: false,
        };
        setModuleReady((prev) => ({
            ...prev,
            finance: false,
            sales: false,
            analytics: false,
            expenses: false,
        }));
        void fetchHubShell({ force: true });
    }, [businessId, dateFromISO, dateToISO, isShellReady, fetchHubShell, applyHubShellPayload, shellRangeKey]);

    /** Trailing force when inventory fetch is already in flight (no busy-wait spin). */
    const inventoryPendingForceRef = useRef(null);

    const fetchInventory = useCallback(async ({
        force = false,
        includeSerials,
        detailLevel,
        fullCatalog = true,
        limit = HUB_SHELL_PRODUCT_PAGE_LIMIT,
        offset = 0,
        append = false,
    } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;

        // Coalesce: queue one trailing force instead of spinning up to 8s.
        if (moduleInFlightRef.current.inventory) {
            if (!force && !append) return;
            if (force) {
                inventoryPendingForceRef.current = {
                    includeSerials,
                    detailLevel,
                    fullCatalog,
                    limit,
                    offset: 0,
                    append: false,
                };
            }
            return;
        }
        
        if (!force && !append && moduleReadyRef.current.inventory) {
            if (!fullCatalog || inventoryCatalogReadyRef.current) return;
        }
        if (isStale()) return;
        
        moduleInFlightRef.current.inventory = true;
        setLoadingModules(prev => ({ ...prev, inventory: true }));

        const wantsProductPage = fullCatalog !== false;
        const loadSerials = includeSerials === true;
        // Default list for shell/refresh; grid when Inventory UI needs batches/variant fields.
        const resolvedDetailLevel = loadSerials
            ? 'full'
            : (detailLevel === 'grid' || detailLevel === 'full' || detailLevel === 'list'
                ? detailLevel
                : 'list');
        const pageLimit = Math.min(Math.max(Number(limit) || HUB_SHELL_PRODUCT_PAGE_LIMIT, 1), 200);
        const pageOffset = Math.max(Number(offset) || 0, 0);

        try {
            if (wantsProductPage) {
                const [prodRes, locRes] = await Promise.all([
                    getProductsAction(businessId, {
                        includeSerials: loadSerials,
                        detailLevel: resolvedDetailLevel,
                        limit: pageLimit,
                        offset: pageOffset,
                    }),
                    getWarehouseLocationsAction(businessId),
                ]);

                if (isStale()) return;

                if (!prodRes?.success) {
                    throw new Error(prodRes?.error || 'Failed to load products');
                }

                const pageProducts = scopeProductsToBusiness(prodRes.products || [], businessId);
                const total = Number(prodRes.total ?? pageProducts.length);
                const more = Boolean(prodRes.hasMore);

                setProducts((prev) => {
                    if (!append) return pageProducts;
                    const scopedPrev = scopeProductsToBusiness(prev, businessId);
                    return [...scopedPrev, ...pageProducts];
                });
                setLocations(locRes.success ? locRes.locations : []);
                setProductTotal(total);
                setHasMoreProducts(more);
                productOffsetRef.current = append
                    ? productOffsetRef.current + pageProducts.length
                    : pageProducts.length;
                inventoryCatalogReadyRef.current = true;
                moduleReadyRef.current.inventory = true;
                setModuleReady(prev => ({ ...prev, inventory: true, inventoryCatalog: true }));
            } else {
                const locRes = await getWarehouseLocationsAction(businessId);
                if (isStale()) return;
                setLocations(locRes.success ? locRes.locations : []);
                moduleReadyRef.current.inventory = true;
                setModuleReady(prev => ({ ...prev, inventory: true, inventoryCatalog: false }));
            }
        } catch (error) {
            if (isStale()) return;
            
            const message = error?.message || '';
            const isSessionFailure =
                message.includes('Unauthorized') ||
                message.includes('Failed to get session') ||
                message.includes('Session lookup failed');

            if (wantsProductPage && !append) {
                setProducts([]);
                setProductTotal(0);
                setHasMoreProducts(false);
            }
            setLocations([]);
            if (wantsProductPage && !append) {
                inventoryCatalogReadyRef.current = false;
            }
            moduleReadyRef.current.inventory = true;
            setModuleReady(prev => ({
                ...prev,
                inventory: true,
                inventoryCatalog: wantsProductPage && !append ? false : prev.inventoryCatalog,
            }));

            if (!isSessionFailure) {
                console.error('Fetch Inventory Error:', error);
            }
        } finally {
            if (!isStale()) {
                moduleInFlightRef.current.inventory = false;
                setLoadingModules(prev => ({ ...prev, inventory: false }));
                const pending = inventoryPendingForceRef.current;
                if (pending) {
                    inventoryPendingForceRef.current = null;
                    queueMicrotask(() => {
                        void fetchInventory({ force: true, ...pending });
                    });
                }
            }
        }
    }, [businessId]);

    const fetchMoreProducts = useCallback(async () => {
        if (!businessId || !hasMoreProducts) return;
        await fetchInventory({
            force: true,
            fullCatalog: true,
            limit: HUB_SHELL_PRODUCT_PAGE_LIMIT,
            offset: productOffsetRef.current,
            append: true,
        });
    }, [businessId, hasMoreProducts, fetchInventory]);

    const fetchAnalytics = useCallback(async ({ force = false } = {}) => {
        if (!businessId) return;
        // Overview KPIs are owned by hub shell / advanced snapshot (filter-range, unified channels).
        // Do not overwrite dashboardMetrics with getDashboardMetricsAction (calendar-month formula).
        if (!force && moduleReadyRef.current.analytics) return;
        moduleInFlightRef.current.analytics = true;
        setLoadingModules((prev) => ({ ...prev, analytics: true }));
        try {
            if (typeof sessionStorage !== 'undefined') {
                try {
                    sessionStorage.removeItem(`dashboard_metrics_${businessId}`);
                } catch {
                    // ignore
                }
            }
            moduleReadyRef.current.analytics = true;
            setModuleReady((prev) => ({ ...prev, analytics: true }));
        } finally {
            moduleInFlightRef.current.analytics = false;
            setLoadingModules((prev) => ({ ...prev, analytics: false }));
        }
    }, [businessId]);

    const fetchPurchases = useCallback(async ({ force = false } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;
        if (moduleInFlightRef.current.purchases) {
            if (!force) return;
            let waited = 0;
            while (moduleInFlightRef.current.purchases && waited < 8000) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                waited += 100;
                if (isStale()) return;
            }
            if (moduleInFlightRef.current.purchases || isStale()) return;
        }
        if (!force && moduleReadyRef.current.purchases) return;
        if (isStale()) return;
        moduleInFlightRef.current.purchases = true;
        setLoadingModules(prev => ({ ...prev, purchases: true }));
        try {
            const [vendRes, poRes] = await Promise.all([
                vendorAPI.getAll(businessId),
                purchaseAPI.getAll(businessId)
            ]);
            if (isStale()) return;
            setVendors(vendRes || []);
            setPurchaseOrders(poRes.purchaseOrders || []);
            moduleReadyRef.current.purchases = true;
            setModuleReady(prev => ({ ...prev, purchases: true }));
        } catch (error) {
            if (!isStale()) console.error('Fetch Purchases Error:', error);
        } finally {
            if (!isStale()) {
                moduleInFlightRef.current.purchases = false;
                setLoadingModules(prev => ({ ...prev, purchases: false }));
            }
        }
    }, [businessId]);

    /**
     * Sales module fetch — split by tab so opening Invoices does not wait on CRM/quotations.
     * @param {{ force?: boolean; mode?: 'bootstrap' | 'invoices' | 'customers' | 'quotations' | 'full' }} [opts]
     */
    const fetchSales = useCallback(async ({ force = false, mode = 'bootstrap' } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;
        const wantsInvoices = mode === 'bootstrap' || mode === 'invoices' || mode === 'full';
        const wantsCustomers = mode === 'customers' || mode === 'full';
        const wantsQuotations = mode === 'quotations' || mode === 'full';

        if (moduleInFlightRef.current.sales) {
            if (!force) return;
            let waited = 0;
            while (moduleInFlightRef.current.sales && waited < 8000) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                waited += 100;
                if (isStale()) return;
            }
            if (moduleInFlightRef.current.sales || isStale()) return;
        }

        if (!force) {
            if (wantsInvoices && salesListDepthRef.current !== 'bootstrap' && mode !== 'full') {
                // Soft invoice revalidate already done for this range.
                if (!wantsCustomers && !wantsQuotations) return;
            }
            if (wantsCustomers && customersReadyRef.current && !wantsInvoices && !wantsQuotations) return;
            if (wantsQuotations && quotationsReadyRef.current && !wantsInvoices && !wantsCustomers) return;
            if (
                mode === 'full' &&
                salesListDepthRef.current === 'full' &&
                customersReadyRef.current &&
                quotationsReadyRef.current
            ) {
                return;
            }
            if (mode === 'bootstrap' && moduleReadyRef.current.sales) return;
        }
        if (isStale()) return;

        moduleInFlightRef.current.sales = true;
        // Soft invoice refresh: keep painted shell rows visible (no sales spinner wipe).
        const softInvoiceOnly =
            mode === 'invoices' &&
            salesListDepthRef.current === 'bootstrap' &&
            moduleReadyRef.current.sales;
        if (!softInvoiceOnly) {
            setLoadingModules((prev) => ({
                ...prev,
                sales: true,
                ...(wantsCustomers ? { customers: true } : {}),
            }));
        } else if (wantsCustomers) {
            setLoadingModules((prev) => ({ ...prev, customers: true }));
        }

        try {
            // List modes never bulk-load line items (enterprise: open invoice loads items).
            const invoicePromise = wantsInvoices
                ? getInvoicesAction(businessId, {
                      limit: mode === 'full' ? 500 : 200,
                      offset: 0,
                      dateFrom: dateFromISO || null,
                      dateTo: dateToISO || null,
                      includeItems: false,
                  })
                : Promise.resolve(null);
            const customerPromise = wantsCustomers
                ? customerAPI.getAll(businessId, {
                      limit: mode === 'full' ? 500 : HUB_SHELL_CUSTOMER_LIMIT,
                      lean: true,
                  })
                : Promise.resolve(null);
            const quotationPromise = wantsQuotations
                ? quotationAPI.getAll(businessId)
                : Promise.resolve(null);

            const [invRes, custRes, quotRes] = await Promise.all([
                invoicePromise,
                customerPromise,
                quotationPromise,
            ]);
            if (isStale()) return;

            if (invRes) {
                setInvoices(invRes.success ? invRes.invoices : []);
                if (mode === 'full') {
                    salesListDepthRef.current = 'full';
                } else if (salesListDepthRef.current === 'bootstrap') {
                    salesListDepthRef.current = 'invoices';
                }
            }
            if (custRes) {
                setCustomers(custRes || []);
                customersReadyRef.current = true;
                moduleReadyRef.current.customers = true;
            }
            if (quotRes) {
                setQuotations(quotRes.success ? quotRes.quotations : []);
                setSalesOrders(quotRes.success ? quotRes.salesOrders : []);
                setChallans(quotRes.success ? quotRes.challans : []);
                quotationsReadyRef.current = true;
                moduleReadyRef.current.quotations = true;
            }

            moduleReadyRef.current.sales = true;
            setModuleReady((prev) => ({
                ...prev,
                sales: true,
                salesListDepth: salesListDepthRef.current,
                ...(custRes ? { customers: true } : {}),
                ...(quotRes ? { quotations: true } : {}),
            }));
        } catch (error) {
            if (!isStale()) {
                console.error('Fetch Sales Error:', error);
                moduleReadyRef.current.sales = true;
                setModuleReady((prev) => ({ ...prev, sales: true }));
            }
        } finally {
            if (!isStale()) {
                moduleInFlightRef.current.sales = false;
                setLoadingModules((prev) => ({
                    ...prev,
                    sales: false,
                    customers: false,
                }));
            }
        }
    }, [businessId, dateFromISO, dateToISO]);

    /** CRM-only fetch — own in-flight lock so it never races soft invoice revalidate. */
    const fetchCustomers = useCallback(async ({ force = false } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;
        if (!force && customersReadyRef.current) return;
        if (moduleInFlightRef.current.customers) {
            if (!force) return;
            let waited = 0;
            while (moduleInFlightRef.current.customers && waited < 8000) {
                await new Promise((resolve) => setTimeout(resolve, 50));
                waited += 50;
                if (isStale()) return;
            }
            if (moduleInFlightRef.current.customers || isStale()) return;
        }
        if (isStale()) return;

        moduleInFlightRef.current.customers = true;
        const showSpinner = !customersReadyRef.current;
        if (showSpinner) {
            setLoadingModules((prev) => ({ ...prev, customers: true }));
        }
        try {
            const custRes = await customerAPI.getAll(businessId, {
                limit: HUB_SHELL_CUSTOMER_LIMIT,
                lean: true,
            });
            if (isStale()) return;
            setCustomers(custRes || []);
            customersReadyRef.current = true;
            moduleReadyRef.current.customers = true;
            setModuleReady((prev) => ({ ...prev, customers: true }));
        } catch (error) {
            if (!isStale()) {
                console.error('Fetch Customers Error:', error);
                moduleReadyRef.current.customers = true;
                setModuleReady((prev) => ({ ...prev, customers: true }));
            }
        } finally {
            if (!isStale()) {
                moduleInFlightRef.current.customers = false;
                setLoadingModules((prev) => ({ ...prev, customers: false }));
            }
        }
    }, [businessId]);

    // Date-range refetch is owned by fetchHubShell (financeDateKeyRef) above.

    const fetchManufacturing = useCallback(async ({ force = false } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;
        if (moduleInFlightRef.current.manufacturing) return;
        if (!force && moduleReadyRef.current.manufacturing) return;
        if (isStale()) return;
        moduleInFlightRef.current.manufacturing = true;
        setLoadingModules(prev => ({ ...prev, manufacturing: true }));
        try {
            const [bomRes, poRes] = await Promise.all([
                getBOMsAction(businessId),
                getProductionOrdersAction(businessId)
            ]);
            if (isStale()) return;
            setBomList(bomRes.success ? bomRes.boms : []);
            setProductionOrders(poRes.success ? poRes.productionOrders : []);
            moduleReadyRef.current.manufacturing = true;
            setModuleReady(prev => ({ ...prev, manufacturing: true }));
        } finally {
            if (!isStale()) {
                moduleInFlightRef.current.manufacturing = false;
                setLoadingModules(prev => ({ ...prev, manufacturing: false }));
            }
        }
    }, [businessId]);

    const fetchPayroll = useCallback(async ({ force = false } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;
        if (moduleInFlightRef.current.payroll) return;
        if (!force && moduleReadyRef.current.payroll) return;
        if (isStale()) return;
        moduleInFlightRef.current.payroll = true;
        setLoadingModules(prev => ({ ...prev, payroll: true }));
        try {
            const [empRes, runsRes] = await Promise.all([
                getPayrollEmployeesAction(businessId),
                getPayrollRunsAction(businessId)
            ]);
            if (isStale()) return;
            setPayrollEmployees(empRes.success ? empRes.employees : []);
            setPayrollRuns(runsRes.success ? runsRes.runs : []);
            moduleReadyRef.current.payroll = true;
            setModuleReady(prev => ({ ...prev, payroll: true }));
        } catch (error) {
            if (!isStale()) console.error('Fetch Payroll Error:', error);
        } finally {
            if (!isStale()) {
                moduleInFlightRef.current.payroll = false;
                setLoadingModules(prev => ({ ...prev, payroll: false }));
            }
        }
    }, [businessId]);

    const fetchApprovals = useCallback(async ({ force = false } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;
        if (moduleInFlightRef.current.approvals) return;
        if (!force && moduleReadyRef.current.approvals) return;
        if (isStale()) return;
        moduleInFlightRef.current.approvals = true;
        setLoadingModules(prev => ({ ...prev, approvals: true }));
        try {
            const [pendingRes, historyRes] = await Promise.all([
                getPendingApprovalsAction(businessId),
                getApprovalHistoryAction(businessId)
            ]);
            if (isStale()) return;
            setPendingApprovals(pendingRes.success ? pendingRes.requests : []);
            setApprovalHistory(historyRes.success ? historyRes.requests : []);
            moduleReadyRef.current.approvals = true;
            setModuleReady(prev => ({ ...prev, approvals: true }));
        } catch (error) {
            if (!isStale()) console.error('Fetch Approvals Error:', error);
        } finally {
            if (!isStale()) {
                moduleInFlightRef.current.approvals = false;
                setLoadingModules(prev => ({ ...prev, approvals: false }));
            }
        }
    }, [businessId]);

    const fetchExpenses = useCallback(async ({ force = false } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;
        if (moduleInFlightRef.current.expenses) return;
        if (!force && moduleReadyRef.current.expenses) return;
        if (isStale()) return;
        moduleInFlightRef.current.expenses = true;
        setLoadingModules(prev => ({ ...prev, expenses: true }));
        try {
            const res = await getExpensesAction(businessId, { limit: 200, offset: 0 });
            if (isStale()) return;
            if (res.success) {
                setExpenses(res.expenses || []);
            }
            moduleReadyRef.current.expenses = true;
            setModuleReady(prev => ({ ...prev, expenses: true }));
        } catch (error) {
            if (!isStale()) console.error('Fetch Expenses Error:', error);
        } finally {
            if (!isStale()) {
                moduleInFlightRef.current.expenses = false;
                setLoadingModules(prev => ({ ...prev, expenses: false }));
            }
        }
    }, [businessId]);

    /** Patch one invoice into hub sales state without a full list refetch. */
    const upsertInvoiceInState = useCallback((invoice) => {
        if (!invoice?.id) return false;
        setInvoices((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const idx = list.findIndex((inv) => inv?.id === invoice.id);
            const clean = {};
            for (const [k, v] of Object.entries(invoice)) {
                if (v !== undefined) clean[k] = v;
            }
            if (idx === -1) return [clean, ...list];
            const next = list.slice();
            next[idx] = { ...next[idx], ...clean };
            return next;
        });
        moduleReadyRef.current.sales = true;
        setModuleReady((prev) => ({ ...prev, sales: true }));
        if (businessId) {
            clearHubShellCache(businessId);
            void queryClient.invalidateQueries({ queryKey: ['hubShell', businessId] });
            void queryClient.invalidateQueries({ queryKey: ['hubAnalytics', businessId] });
            void queryClient.invalidateQueries({ queryKey: ['hubSalesPerformance', businessId] });
        }
        return true;
    }, [businessId, queryClient]);

    /** Remove an invoice from hub sales state after delete. */
    const removeInvoiceFromState = useCallback((invoiceId) => {
        if (!invoiceId) return;
        setInvoices((prev) => (Array.isArray(prev) ? prev.filter((inv) => inv?.id !== invoiceId) : []));
        if (businessId) {
            clearHubShellCache(businessId);
            void queryClient.invalidateQueries({ queryKey: ['hubShell', businessId] });
            void queryClient.invalidateQueries({ queryKey: ['hubAnalytics', businessId] });
            void queryClient.invalidateQueries({ queryKey: ['hubSalesPerformance', businessId] });
        }
    }, [businessId, queryClient]);

    /** Patch one product into hub catalog state without a full list refetch. */
    const upsertProductInState = useCallback((product) => {
        if (!product?.id) return false;
        if (isForeignTenantProduct(product, businessId)) return false;
        setProducts((prev) => {
            const list = scopeProductsToBusiness(Array.isArray(prev) ? prev : [], businessId);
            const idx = list.findIndex((p) => p?.id === product.id);
            if (idx === -1) return [product, ...list];
            const next = list.slice();
            const merged = { ...next[idx] };
            for (const [k, v] of Object.entries(product)) {
                if (v !== undefined) merged[k] = v;
            }
            next[idx] = merged;
            return next;
        });
        inventoryCatalogReadyRef.current = true;
        moduleReadyRef.current.inventory = true;
        setModuleReady((prev) => ({ ...prev, inventory: true, inventoryCatalog: true }));
        if (businessId) {
            clearHubShellCache(businessId);
            void queryClient.invalidateQueries({ queryKey: ['hubShell', businessId] });
            void queryClient.invalidateQueries({ queryKey: ['hubAnalytics', businessId] });
            void queryClient.invalidateQueries({ queryKey: ['hubSalesPerformance', businessId] });
        }
        return true;
    }, [businessId, queryClient]);

    /** Remove a product from hub catalog state after a successful archive. */
    const removeProductFromState = useCallback((productId) => {
        if (!productId) return;
        setProducts((prev) => (Array.isArray(prev) ? prev.filter((p) => p?.id !== productId) : []));
        if (businessId) {
            clearHubShellCache(businessId);
            void queryClient.invalidateQueries({ queryKey: ['hubShell', businessId] });
            void queryClient.invalidateQueries({ queryKey: ['hubAnalytics', businessId] });
            void queryClient.invalidateQueries({ queryKey: ['hubSalesPerformance', businessId] });
        }
    }, [businessId, queryClient]);

    /** Patch or replace warehouse locations without a full product catalog refetch. */
    const upsertLocationsInState = useCallback((nextLocations) => {
        if (!Array.isArray(nextLocations)) return false;
        setLocations(nextLocations);
        if (businessId) {
            clearHubShellCache(businessId);
            void queryClient.invalidateQueries({ queryKey: ['hubShell', businessId] });
            void queryClient.invalidateQueries({ queryKey: ['hubAnalytics', businessId] });
            void queryClient.invalidateQueries({ queryKey: ['hubSalesPerformance', businessId] });
        }
        return true;
    }, [businessId, queryClient]);

    /** Merge one customer into hub CRM state without a full sales refetch. */
    const upsertCustomerInState = useCallback((customer) => {
        if (!customer?.id) return false;
        setCustomers((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const idx = list.findIndex((c) => c?.id === customer.id);
            if (idx === -1) return [customer, ...list];
            const next = list.slice();
            next[idx] = { ...next[idx], ...customer };
            return next;
        });
        customersReadyRef.current = true;
        moduleReadyRef.current.customers = true;
        setModuleReady((prev) => ({ ...prev, customers: true }));
        return true;
    }, []);

    const analyticsRefreshTimerRef = useRef(null);
    /** Debounced hub-shell refresh after inventory mutations (keeps Overview KPIs in sync). */
    const scheduleAnalyticsRefresh = useCallback(() => {
        if (!businessId) return;
        if (typeof sessionStorage !== 'undefined') {
            try {
                sessionStorage.removeItem(`dashboard_metrics_${businessId}`);
            } catch {
                // ignore
            }
        }
        if (analyticsRefreshTimerRef.current) {
            clearTimeout(analyticsRefreshTimerRef.current);
        }
        analyticsRefreshTimerRef.current = setTimeout(() => {
            analyticsRefreshTimerRef.current = null;
            void fetchHubShell({ force: true });
            void fetchAnalytics({ force: true });
        }, 1500);
    }, [businessId, fetchHubShell, fetchAnalytics]);

    const refreshAllData = useCallback(async () => {
        if (!businessId) return;
        setLoadingModules(prev => ({ ...prev, refreshing: true }));
        try {
            await Promise.allSettled([
                fetchHubShell({ force: true }),
                fetchSales({ force: true, mode: 'full' }),
                fetchPurchases({ force: true }),
                fetchManufacturing({ force: true }),
                fetchAnalytics({ force: true }),
                fetchPayroll({ force: true }),
                fetchApprovals({ force: true }),
                fetchExpenses({ force: true })
            ]);
            setIsShellReady(true);
            setIsDataLoaded(true);
            shellReadyBusinessIdRef.current = businessId;
        } finally {
            setLoadingModules(prev => ({ ...prev, refreshing: false }));
        }
    }, [businessId, fetchHubShell, fetchSales, fetchPurchases, fetchManufacturing, fetchAnalytics, fetchPayroll, fetchApprovals, fetchExpenses]);

    // Keep a ref to the latest fetch functions so the init effect doesn't need
    // them in its dep array (avoids re-running when callbacks are recreated)
    const fetchersRef = useRef({});
    useEffect(() => {
        fetchersRef.current = {
            fetchHubShell,
            fetchFinance,
            fetchSales,
            fetchCustomers,
            fetchAnalytics,
            fetchInventory,
            fetchPurchases,
            fetchExpenses,
        };
    });

    // Initial load: paint SSR/session cache before browser paint, then soft-revalidate.
    // Only re-run when business.id / range identity changes. Generation token prevents stale races.
    useLayoutEffect(() => {
        const id = businessId;
        if (!id) {
            // Do not clear shellPaintedKeyRef — HubShellHydrator may paint before BusinessContext resolves.
            shellReadyBusinessIdRef.current = null;
            lastTenantResetBusinessIdRef.current = null;
            queueMicrotask(() => {
                setIsShellReady(false);
                setIsDataLoaded(false);
            });
            return;
        }

        const paintedKey = shellRangeKey(id, dateFromISO, dateToISO);
        const alreadyReadyForKey =
            shellReadyBusinessIdRef.current === id &&
            shellPaintedKeyRef.current === paintedKey;

        if (alreadyReadyForKey) {
            // SSR/cache already painted this range — soft-revalidate once without blanking Overview.
            if (shellSoftFetchKeyRef.current === paintedKey) return;
            shellSoftFetchKeyRef.current = paintedKey;
            const generation = fetchGenerationRef.current;
            const { fetchHubShell, fetchPurchases } = fetchersRef.current;
            Promise.resolve(fetchHubShell?.({ force: false }))
                .catch(() => {})
                .finally(() => {
                    if (fetchGenerationRef.current !== generation) return;
                    setIsDataLoaded(true);
                    void fetchPurchases?.();
                });
            return;
        }

        const generation = ++fetchGenerationRef.current;
        shellSoftFetchKeyRef.current = paintedKey;
        moduleInFlightRef.current = {};
        moduleReadyRef.current = {};

        if (analyticsRefreshTimerRef.current) {
            clearTimeout(analyticsRefreshTimerRef.current);
            analyticsRefreshTimerRef.current = null;
        }

        const cacheKey = hubShellCacheKey(id, dateFromISO, dateToISO);
        const cached = readHubShellCache(cacheKey);
        const serverAlreadyPainted = shellPaintedKeyRef.current === paintedKey;
        const tenantChanged = lastTenantResetBusinessIdRef.current !== id;

        setIsDataLoaded(false);

        // Hard-clear inventory only on shop switch — never blank the catalog on date-range changes.
        if (tenantChanged) {
            setProducts([]);
            setLocations([]);
            setInvoices([]);
            setProductTotal(0);
            setHasMoreProducts(false);
            inventoryCatalogReadyRef.current = false;
            productOffsetRef.current = 0;

            // Secondary modules reset on tenant change (customers may repaint from shell cache).
            setCustomers([]);
            setVendors([]);
            setQuotations([]);
            setSalesOrders([]);
            setChallans([]);
            setPurchaseOrders([]);
            setBomList([]);
            setProductionOrders([]);
            setPayrollEmployees([]);
            setPayrollRuns([]);
            setPendingApprovals([]);
            setApprovalHistory([]);
            setExpenses([]);
            customersReadyRef.current = false;
            quotationsReadyRef.current = false;
            lastTenantResetBusinessIdRef.current = id;
        }

        salesListDepthRef.current = 'bootstrap';

        if (cached) {
            // SWR: paint warm shell for this business+range before network revalidate.
            setModuleReady({});
            setLoadingModules({});
            applyHubShellPayload(cached, { markReady: true, paintedKey, businessId: id });
        } else if (serverAlreadyPainted) {
            // RSC hydrator already painted this tenant — keep Overview live; do not wipe moduleReady.
            setLoadingModules({});
        } else {
            // No cache for this tenant/range — clear remaining shell-owned KPI state.
            // Keep inventory rows on date-only miss when tenant did not change.
            setModuleReady((prev) => (tenantChanged ? {} : prev));
            setLoadingModules({});
            if (!tenantChanged) {
                // Date-only: drop range KPIs/invoices but keep catalog.
                setDashboardMetrics(null);
                setAccountingSummary(null);
                setDashboardChartData([]);
                setExpenseBreakdown([]);
                setAdvancedDashboardSnapshot(null);
                setActivityFeed([]);
                setInvoices([]);
            } else {
                shellPaintedKeyRef.current = null;
                setDashboardMetrics(null);
                setAccountingSummary(null);
                setDashboardChartData([]);
                setExpenseBreakdown([]);
                setAdvancedDashboardSnapshot(null);
                setActivityFeed([]);
            }
        }

        shellReadyBusinessIdRef.current = id;
        financeDateKeyRef.current = paintedKey;
        salesDateKeyRef.current = paintedKey;
        setIsShellReady(true);

        const { fetchHubShell, fetchPurchases } = fetchersRef.current;

        Promise.resolve(fetchHubShell?.())
            .catch(() => {})
            .finally(() => {
                if (fetchGenerationRef.current !== generation) return;
                setIsDataLoaded(true);
                void fetchPurchases?.();
            });
    }, [businessId, dateFromISO, dateToISO, applyHubShellPayload, shellRangeKey]);

    // Idle-prefetch analytics + soft invoice/CRM depth after shell (does not block Overview/tabs).
    useEffect(() => {
        if (!isDataLoaded || !businessId) return undefined;
        const run = () => {
            // Soft-upgrade invoice page + ensure CRM if shell omitted or failed customers.
            if (salesListDepthRef.current === 'bootstrap') {
                void fetchSales({ mode: 'invoices' });
            }
            if (!customersReadyRef.current) {
                void fetchCustomers({ force: false });
            }
            void queryClient.prefetchQuery({
                queryKey: hubAnalyticsQueryKey(businessId, dateFromISO, dateToISO),
                queryFn: async () => {
                    const bundle = await getAnalyticsBundleAction(businessId, {
                        from: dateFromISO,
                        to: dateToISO,
                    });
                    if (!bundle?.success) {
                        return { salesTrend: [], topProducts: [], categoryData: [] };
                    }
                    return bundle.data || { salesTrend: [], topProducts: [], categoryData: [] };
                },
                staleTime: 60_000,
            });
            void queryClient.prefetchQuery({
                queryKey: hubSalesPerformanceQueryKey(businessId, dateFromISO, dateToISO, 'all', null),
                queryFn: async () => {
                    const res = await getSalesPerformanceAction(businessId, {
                        from: dateFromISO,
                        to: dateToISO,
                        channel: 'all',
                        category: null,
                        topLimit: 8,
                    });
                    if (!res?.success) return null;
                    return {
                        meta: res.meta,
                        categories: res.categories || [],
                        salesTrend: res.salesTrend,
                        topProducts: res.topProducts,
                        topCustomers: res.topCustomers || [],
                        recentActivity: res.recentActivity,
                        kpi: res.kpi,
                    };
                },
                staleTime: 60_000,
            });
        };
        let idleId;
        let timeoutId;
        if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
            idleId = window.requestIdleCallback(run, { timeout: 2000 });
        } else {
            timeoutId = setTimeout(run, 1000);
        }
        return () => {
            if (idleId != null && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(idleId);
            }
            if (timeoutId != null) clearTimeout(timeoutId);
        };
    }, [isDataLoaded, businessId, dateFromISO, dateToISO, queryClient, fetchSales, fetchCustomers]);

    const value = useMemo(() => ({
        invoices,
        products,
        customers,
        vendors,
        quotations,
        salesOrders,
        challans,
        purchaseOrders,
        locations,
        bomList,
        productionOrders,
        payrollEmployees,
        payrollRuns,
        pendingApprovals,
        approvalHistory,
        accountingSummary,
        dashboardChartData,
        dashboardMetrics,
        expenseBreakdown,
        expenses,
        advancedDashboardSnapshot,
        activityFeed,
        productTotal,
        hasMoreProducts,
        isShellReady,
        isDataLoaded,
        isLoading: Object.values(loadingModules).some(Boolean),
        loadingModules,
        moduleReady,
        refreshAllData,
        fetchHubShell,
        hydrateHubShellFromServer,
        fetchFinance,
        fetchAnalytics,
        fetchInventory,
        fetchMoreProducts,
        fetchSales,
        fetchCustomers,
        fetchManufacturing,
        fetchPurchases,
        fetchPayroll,
        fetchApprovals,
        fetchExpenses,
        upsertProductInState,
        removeProductFromState,
        upsertInvoiceInState,
        removeInvoiceFromState,
        upsertLocationsInState,
        upsertCustomerInState,
        scheduleAnalyticsRefresh,
    }), [
        invoices,
        products,
        customers,
        vendors,
        quotations,
        salesOrders,
        challans,
        purchaseOrders,
        locations,
        bomList,
        productionOrders,
        payrollEmployees,
        payrollRuns,
        pendingApprovals,
        approvalHistory,
        accountingSummary,
        dashboardChartData,
        dashboardMetrics,
        expenseBreakdown,
        expenses,
        advancedDashboardSnapshot,
        activityFeed,
        productTotal,
        hasMoreProducts,
        isShellReady,
        isDataLoaded,
        loadingModules,
        moduleReady,
        refreshAllData,
        fetchHubShell,
        hydrateHubShellFromServer,
        fetchFinance,
        fetchAnalytics,
        fetchInventory,
        fetchMoreProducts,
        fetchSales,
        fetchCustomers,
        fetchManufacturing,
        fetchPurchases,
        fetchPayroll,
        fetchApprovals,
        fetchExpenses,
        upsertProductInState,
        removeProductFromState,
        upsertInvoiceInState,
        removeInvoiceFromState,
        upsertLocationsInState,
        upsertCustomerInState,
        scheduleAnalyticsRefresh,
    ]);


    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

/** Safe outside DataProvider (e.g. isolated inventory demos). */
export function useDataOptional() {
    return useContext(DataContext);
}
