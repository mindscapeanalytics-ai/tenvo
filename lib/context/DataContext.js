'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useBusiness } from './BusinessContext';
import { useFilters } from './FilterContext';
import {
    productAPI,
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
    getDashboardMetricsAction,
    getExpenseBreakdownAction
} from '@/lib/actions/premium/ai/analytics';
import { getAdvancedDashboardSnapshotAction } from '@/lib/actions/dashboard/advancedDashboardSnapshot';
import { buildDashboardMetricsFromSnapshot } from '@/lib/dashboard/hubBootstrapMetrics';
import toast from 'react-hot-toast';

const DataContext = createContext(undefined);

export function DataProvider({ children }) {
    const { business } = useBusiness();
    const { dateRange } = useFilters();

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

    const [loadingModules, setLoadingModules] = useState({});
    /** Per-module fetch completed for current business (avoids tab-switch refetch storms). */
    const [moduleReady, setModuleReady] = useState({});
    /** True once minimal dashboard data is available — unblocks main content shell. */
    const [isShellReady, setIsShellReady] = useState(false);
    /** True once all background module fetches for the current business have settled. */
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const fetchGenerationRef = useRef(0);
    const shellReadyBusinessIdRef = useRef(null);
    const financeDateKeyRef = useRef(null);
    const salesDateKeyRef = useRef(null);
    const moduleInFlightRef = useRef({});
    /** Sync module-ready flags (ref avoids recreating fetch callbacks). */
    const moduleReadyRef = useRef({});
    /** 'bootstrap' = slim headers; 'full' = line items for invoice builder grids. */
    const salesListDepthRef = useRef('bootstrap');
    /** False until full product catalog has been loaded (inventory/POS tab). */
    const inventoryCatalogReadyRef = useRef(false);

    // Stable primitives for dependency arrays — prevents callbacks from being
    // recreated when the business object reference changes but the id stays the same.
    const businessId = business?.id;
    const dateFromISO = dateRange.from.toISOString();
    const dateToISO = dateRange.to.toISOString();

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

    // Refetch GL + advanced snapshot when the global date filter changes (Header presets / picker).
    useEffect(() => {
        if (!businessId || !isShellReady) return;
        const key = `${businessId}|${dateFromISO}|${dateToISO}`;
        if (financeDateKeyRef.current === key) return;
        const hadPriorKey = financeDateKeyRef.current != null;
        financeDateKeyRef.current = key;
        if (hadPriorKey) fetchFinance({ force: true });
    }, [businessId, dateFromISO, dateToISO, isShellReady, fetchFinance]);

    const fetchInventory = useCallback(async ({ force = false, includeSerials, fullCatalog = true } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;
        
        // Match finance: wait for in-flight work instead of dropping a forced refresh after 100ms.
        if (moduleInFlightRef.current.inventory) {
            if (!force) return;
            let waited = 0;
            while (moduleInFlightRef.current.inventory && waited < 8000) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                waited += 100;
                if (isStale()) return;
            }
            if (moduleInFlightRef.current.inventory || isStale()) return;
        }
        
        if (!force && moduleReadyRef.current.inventory) {
            if (!fullCatalog || inventoryCatalogReadyRef.current) return;
        }
        if (isStale()) return;
        
        moduleInFlightRef.current.inventory = true;
        setLoadingModules(prev => ({ ...prev, inventory: true }));

        const wantsFullCatalog = fullCatalog !== false;
        const loadSerials = includeSerials === true;

        try {
            if (wantsFullCatalog) {
                const [prodRes, locRes] = await Promise.all([
                    productAPI.getAll(
                        businessId,
                        loadSerials ? { includeSerials: true } : { includeSerials: false }
                    ),
                    getWarehouseLocationsAction(businessId)
                ]);

                if (isStale()) return;

                setProducts(prodRes || []);
                setLocations(locRes.success ? locRes.locations : []);
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

            if (wantsFullCatalog) {
                setProducts([]);
            }
            setLocations([]);
            if (wantsFullCatalog) {
                inventoryCatalogReadyRef.current = false;
            }
            moduleReadyRef.current.inventory = true;
            setModuleReady(prev => ({
                ...prev,
                inventory: true,
                inventoryCatalog: wantsFullCatalog ? false : prev.inventoryCatalog,
            }));

            if (!isSessionFailure) {
                console.error('Fetch Inventory Error:', error);
            }
        } finally {
            if (!isStale()) {
                moduleInFlightRef.current.inventory = false;
                setLoadingModules(prev => ({ ...prev, inventory: false }));
            }
        }
    }, [businessId]);

    const fetchAnalytics = useCallback(async ({ force = false } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;
        
        // PHASE 2A FIX #1: Stale-While-Revalidate Cache Pattern
        // Check sessionStorage cache for instant loads on repeat visits
        let allowStaleRevalidate = false;
        if (!force && typeof sessionStorage !== 'undefined') {
            try {
                const cacheKey = `dashboard_metrics_${businessId}`;
                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    const age = Date.now() - timestamp;
                    
                    if (age < 60000) {
                        // Fresh (< 1 minute) - use immediately, skip fetch
                        setDashboardMetrics(data);
                        moduleReadyRef.current.analytics = true;
                        setModuleReady(prev => ({ ...prev, analytics: true }));
                        return;
                    } else if (age < 300000) {
                        // Stale (1-5 minutes) - show cached KPIs, then revalidate below.
                        setDashboardMetrics(data);
                        setModuleReady(prev => ({ ...prev, analytics: true }));
                        allowStaleRevalidate = true;
                    }
                    // Older than 5 minutes - discard cache, fetch fresh
                }
            } catch (cacheError) {
                // Silent fail - sessionStorage might be disabled
                console.warn('Analytics cache read failed:', cacheError);
            }
        }
        
        if (moduleInFlightRef.current.analytics) {
            if (!force) return;
            let waited = 0;
            while (moduleInFlightRef.current.analytics && waited < 8000) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                waited += 100;
                if (isStale()) return;
            }
            if (moduleInFlightRef.current.analytics || isStale()) return;
        }
        if (!force && !allowStaleRevalidate && moduleReadyRef.current.analytics) return;
        if (isStale()) return;
        moduleInFlightRef.current.analytics = true;
        setLoadingModules(prev => ({ ...prev, analytics: true }));
        try {
            const res = await getDashboardMetricsAction(businessId);
            if (isStale()) return;
            if (res.success) {
                setDashboardMetrics(res.data);
                
                // Cache the result for stale-while-revalidate
                if (typeof sessionStorage !== 'undefined') {
                    try {
                        const cacheKey = `dashboard_metrics_${businessId}`;
                        sessionStorage.setItem(cacheKey, JSON.stringify({
                            data: res.data,
                            timestamp: Date.now()
                        }));
                    } catch (cacheError) {
                        // Silent fail - sessionStorage might be full
                        console.warn('Analytics cache write failed:', cacheError);
                    }
                }
            }
            moduleReadyRef.current.analytics = true;
            setModuleReady(prev => ({ ...prev, analytics: true }));
        } catch (error) {
            if (!isStale()) {
                console.error('Fetch Analytics Error:', error);
                moduleReadyRef.current.analytics = true;
                setModuleReady(prev => ({ ...prev, analytics: true }));
            }
        } finally {
            if (!isStale()) {
                moduleInFlightRef.current.analytics = false;
                setLoadingModules(prev => ({ ...prev, analytics: false }));
            }
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

    const fetchSales = useCallback(async ({ force = false, mode = 'bootstrap' } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;
        const wantsFullList = mode === 'full';
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
        if (!force && moduleReadyRef.current.sales) {
            if (!wantsFullList || salesListDepthRef.current === 'full') return;
        }
        if (isStale()) return;
        moduleInFlightRef.current.sales = true;
        setLoadingModules(prev => ({ ...prev, sales: true }));
        try {
            // Bootstrap: invoices + customers only (3 quotation/SO/challan actions are deferred
            // until quotations tab / full sales mode — avoids 3 extra withGuard round-trips).
            const invoicePromise = getInvoicesAction(businessId, {
                limit: wantsFullList ? 500 : 200,
                offset: 0,
                dateFrom: dateFromISO || null,
                dateTo: dateToISO || null,
                includeItems: wantsFullList,
            });
            const customerPromise = customerAPI.getAll(businessId);
            const quotationPromise = wantsFullList
                ? quotationAPI.getAll(businessId)
                : Promise.resolve({ success: true, quotations: [], salesOrders: [], challans: [] });

            const [invRes, custRes, quotRes] = await Promise.all([
                invoicePromise,
                customerPromise,
                quotationPromise,
            ]);
            if (isStale()) return;
            setInvoices(invRes.success ? invRes.invoices : []);
            setCustomers(custRes || []);
            if (wantsFullList || quotRes?.quotations?.length || quotRes?.salesOrders?.length) {
                setQuotations(quotRes.success ? quotRes.quotations : []);
                setSalesOrders(quotRes.success ? quotRes.salesOrders : []);
                setChallans(quotRes.success ? quotRes.challans : []);
            }
            salesListDepthRef.current = wantsFullList ? 'full' : 'bootstrap';
            moduleReadyRef.current.sales = true;
            setModuleReady(prev => ({
                ...prev,
                sales: true,
                salesListDepth: wantsFullList ? 'full' : 'bootstrap',
            }));
        } catch (error) {
            if (!isStale()) {
                console.error('Fetch Sales Error:', error);
                moduleReadyRef.current.sales = true;
                setModuleReady(prev => ({ ...prev, sales: true }));
            }
        } finally {
            if (!isStale()) {
                moduleInFlightRef.current.sales = false;
                setLoadingModules(prev => ({ ...prev, sales: false }));
            }
        }
    }, [businessId, dateFromISO, dateToISO]);

    // Mirror finance: refetch sales when date range changes so period tiles stay aligned.
    useEffect(() => {
        if (!businessId || !isShellReady) return;
        const key = `${businessId}|${dateFromISO}|${dateToISO}`;
        if (salesDateKeyRef.current === key) return;
        const hadPriorKey = salesDateKeyRef.current != null;
        salesDateKeyRef.current = key;
        if (hadPriorKey) {
            const listMode = salesListDepthRef.current === 'full' ? 'full' : 'bootstrap';
            fetchSales({ force: true, mode: listMode });
        }
    }, [businessId, dateFromISO, dateToISO, isShellReady, fetchSales]);

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
            if (idx === -1) return [invoice, ...list];
            const next = list.slice();
            next[idx] = { ...next[idx], ...invoice };
            return next;
        });
        moduleReadyRef.current.sales = true;
        setModuleReady((prev) => ({ ...prev, sales: true }));
        return true;
    }, []);

    /** Remove an invoice from hub sales state after delete. */
    const removeInvoiceFromState = useCallback((invoiceId) => {
        if (!invoiceId) return;
        setInvoices((prev) => (Array.isArray(prev) ? prev.filter((inv) => inv?.id !== invoiceId) : []));
    }, []);

    /** Patch one product into hub catalog state without a full list refetch. */
    const upsertProductInState = useCallback((product) => {
        if (!product?.id) return false;
        setProducts((prev) => {
            const list = Array.isArray(prev) ? prev : [];
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
        return true;
    }, []);

    /** Remove a product from hub catalog state after a successful archive. */
    const removeProductFromState = useCallback((productId) => {
        if (!productId) return;
        setProducts((prev) => (Array.isArray(prev) ? prev.filter((p) => p?.id !== productId) : []));
    }, []);

    const analyticsRefreshTimerRef = useRef(null);
    /** Debounced analytics force-refresh after inventory mutations (keeps KPI tiles fresh). */
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
            void fetchAnalytics({ force: true });
        }, 1500);
    }, [businessId, fetchAnalytics]);

    const refreshAllData = useCallback(async () => {
        if (!businessId) return;
        setLoadingModules(prev => ({ ...prev, refreshing: true }));
        try {
            await Promise.allSettled([
                fetchFinance({ force: true }),
                fetchInventory({ force: true, fullCatalog: true }),
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
    }, [businessId, fetchFinance, fetchInventory, fetchSales, fetchPurchases, fetchManufacturing, fetchAnalytics, fetchPayroll, fetchApprovals, fetchExpenses]);

    // Keep a ref to the latest fetch functions so the init effect doesn't need
    // them in its dep array (avoids re-running when callbacks are recreated)
    const fetchersRef = useRef({});
    useEffect(() => {
        fetchersRef.current = { fetchFinance, fetchSales, fetchAnalytics, fetchInventory, fetchPurchases, fetchExpenses };
    });

    // Initial load: shell-first bootstrap, then background modules.
    // Only re-run when business.id changes. Generation token prevents stale races.
    useEffect(() => {
        const id = businessId;
        if (!id) {
            shellReadyBusinessIdRef.current = null;
            queueMicrotask(() => {
                setIsShellReady(false);
                setIsDataLoaded(false);
            });
            return;
        }
        if (shellReadyBusinessIdRef.current === id) return;

        const generation = ++fetchGenerationRef.current;
        moduleInFlightRef.current = {};
        moduleReadyRef.current = {};

        if (analyticsRefreshTimerRef.current) {
            clearTimeout(analyticsRefreshTimerRef.current);
            analyticsRefreshTimerRef.current = null;
        }

        // One microtask keeps the original order (resets -> shell ready -> fetch kickoff)
        // while avoiding synchronous setState cascades inside the effect body.
        queueMicrotask(() => {
            if (fetchGenerationRef.current !== generation) return;

            // Clear all module data so the previous business's rows never leak through.
            setModuleReady({});
            setLoadingModules({});
            setIsDataLoaded(false);
            setDashboardMetrics(null);
            setAccountingSummary(null);
            setDashboardChartData([]);
            setExpenseBreakdown([]);
            setAdvancedDashboardSnapshot(null);
            setInvoices([]);
            setProducts([]);
            setCustomers([]);
            setVendors([]);
            setQuotations([]);
            setSalesOrders([]);
            setChallans([]);
            setPurchaseOrders([]);
            setLocations([]);
            setBomList([]);
            setProductionOrders([]);
            setPayrollEmployees([]);
            setPayrollRuns([]);
            setPendingApprovals([]);
            setApprovalHistory([]);
            setExpenses([]);

            salesListDepthRef.current = 'bootstrap';
            inventoryCatalogReadyRef.current = false;

            // Zoho/Busy/Odoo-style: paint shell immediately; stream lean modules in parallel.
            const markShellReady = () => {
                shellReadyBusinessIdRef.current = id;
                const dateKey = `${id}|${dateFromISO}|${dateToISO}`;
                financeDateKeyRef.current = dateKey;
                salesDateKeyRef.current = dateKey;
                setIsShellReady(true);
            };
            markShellReady();

            const {
                fetchFinance,
                fetchSales,
                fetchInventory,
                fetchPurchases,
                fetchExpenses,
            } = fetchersRef.current;

            // Critical path only: finance KPIs + lean sales + locations + expenses.
            // Purchases/vendors and heavy analytics are deferred (tab open / post-shell).
            Promise.allSettled([
                fetchFinance(),
                fetchSales({ mode: 'bootstrap' }),
                fetchInventory({ fullCatalog: false }),
                fetchExpenses(),
            ]).then(() => {
                if (fetchGenerationRef.current !== generation) return;
                setIsDataLoaded(true);
                // Do not cold-load getDashboardMetricsAction — snapshot already hydrated KPIs.
                // Purchases load in background so Purchases tab is warm without blocking Overview.
                void fetchPurchases?.();
            });
        });
    }, [businessId, dateFromISO, dateToISO]);

    // After lean bootstrap unlocks the shell, hydrate the product catalog in the background
    // so Easy Stock / Inventory tabs do not wait on the critical path.
    useEffect(() => {
        if (!isDataLoaded || !businessId) return;
        if (inventoryCatalogReadyRef.current) return;
        void fetchInventory({ fullCatalog: true });
    }, [isDataLoaded, businessId, fetchInventory]);

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
        isShellReady,
        isDataLoaded,
        isLoading: Object.values(loadingModules).some(Boolean),
        loadingModules,
        moduleReady,
        refreshAllData,
        fetchFinance,
        fetchAnalytics,
        fetchInventory,
        fetchSales,
        fetchManufacturing,
        fetchPurchases,
        fetchPayroll,
        fetchApprovals,
        fetchExpenses,
        upsertProductInState,
        removeProductFromState,
        upsertInvoiceInState,
        removeInvoiceFromState,
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
        isShellReady,
        isDataLoaded,
        loadingModules,
        moduleReady,
        refreshAllData,
        fetchFinance,
        fetchAnalytics,
        fetchInventory,
        fetchSales,
        fetchManufacturing,
        fetchPurchases,
        fetchPayroll,
        fetchApprovals,
        fetchExpenses,
        upsertProductInState,
        removeProductFromState,
        upsertInvoiceInState,
        removeInvoiceFromState,
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
