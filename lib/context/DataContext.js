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
    const moduleInFlightRef = useRef({});
    /** Sync module-ready flags (ref avoids recreating fetch callbacks). */
    const moduleReadyRef = useRef({});

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
                    ? { finance: snapshot.finance, range: snapshot.range }
                    : null
            );
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

    const fetchInventory = useCallback(async ({ force = false, includeSerials } = {}) => {
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
        
        if (!force && moduleReadyRef.current.inventory) return;
        if (isStale()) return;
        
        moduleInFlightRef.current.inventory = true;
        setLoadingModules(prev => ({ ...prev, inventory: true }));

        // Lean list by default. Serials are deferred (`_serialsDeferred`) so saves cannot wipe them.
        // Only load serials when explicitly requested (rare export/edit paths).
        const loadSerials = includeSerials === true;

        try {
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
            moduleReadyRef.current.inventory = true;
            setModuleReady(prev => ({ ...prev, inventory: true }));
        } catch (error) {
            if (isStale()) return;
            
            const message = error?.message || '';
            const isSessionFailure =
                message.includes('Unauthorized') ||
                message.includes('Failed to get session') ||
                message.includes('Session lookup failed');

            // Set empty arrays to clear stale data
            setProducts([]);
            setLocations([]);
            moduleReadyRef.current.inventory = true;
            setModuleReady(prev => ({ ...prev, inventory: true }));

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

    const fetchSales = useCallback(async ({ force = false } = {}) => {
        if (!businessId) return;
        const generation = fetchGenerationRef.current;
        const isStale = () => fetchGenerationRef.current !== generation;
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
        if (!force && moduleReadyRef.current.sales) return;
        if (isStale()) return;
        moduleInFlightRef.current.sales = true;
        setLoadingModules(prev => ({ ...prev, sales: true }));
        try {
            const [invRes, custRes, quotRes] = await Promise.all([
                getInvoicesAction(businessId, {
                    limit: 500,
                    offset: 0,
                    dateFrom: dateFromISO || null,
                    dateTo: dateToISO || null,
                    includeItems: true,
                }),
                customerAPI.getAll(businessId),
                quotationAPI.getAll(businessId)
            ]);
            if (isStale()) return;
            setInvoices(invRes.success ? invRes.invoices : []);
            // customerAPI.getAll returns the customers array directly
            setCustomers(custRes || []);
            setQuotations(quotRes.success ? quotRes.quotations : []);
            setSalesOrders(quotRes.success ? quotRes.salesOrders : []);
            setChallans(quotRes.success ? quotRes.challans : []);
            moduleReadyRef.current.sales = true;
            setModuleReady(prev => ({ ...prev, sales: true }));
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
        moduleReadyRef.current.inventory = true;
        setModuleReady((prev) => ({ ...prev, inventory: true }));
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
        const force = { force: true };
        try {
            await Promise.allSettled([
                fetchFinance(force),
                fetchInventory(force),
                fetchSales(force),
                fetchPurchases(force),
                fetchManufacturing(force),
                fetchAnalytics(force),
                fetchPayroll(force),
                fetchApprovals(force),
                fetchExpenses(force)
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

        // Batch state resets via microtask to avoid synchronous cascading renders
        queueMicrotask(() => {
            setModuleReady({});
            setLoadingModules({});
            setIsShellReady(false);
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
        });

        if (analyticsRefreshTimerRef.current) {
            clearTimeout(analyticsRefreshTimerRef.current);
            analyticsRefreshTimerRef.current = null;
        }

        const {
            fetchFinance,
            fetchSales,
            fetchAnalytics,
            fetchInventory,
            fetchPurchases,
            fetchExpenses,
        } = fetchersRef.current;

        const markShellReady = () => {
            if (fetchGenerationRef.current !== generation) return;
            shellReadyBusinessIdRef.current = id;
            financeDateKeyRef.current = `${id}|${dateFromISO}|${dateToISO}`;
            setIsShellReady(true);
        };

        // Zoho/Busy/Odoo-style: paint shell immediately; stream all modules in parallel.
        // Do not gate chrome/dashboard on heavy getDashboardMetricsAction.
        markShellReady();

        Promise.allSettled([
            fetchAnalytics(),
            fetchFinance(),
            fetchSales(),
            fetchInventory(),
            fetchPurchases(),
            fetchExpenses(),
        ]).then(() => {
            if (fetchGenerationRef.current !== generation) return;
            setIsDataLoaded(true);
        });
    }, [businessId, dateFromISO, dateToISO]);
    
    // Prefetch critical modules after shell ready (non-blocking background)
    useEffect(() => {
        if (!isShellReady || !businessId) return;
        
        const prefetchTimer = setTimeout(() => {
            if (fetchGenerationRef.current === 0) return;
            
            if (!moduleReadyRef.current.analytics && !moduleInFlightRef.current.analytics) {
                fetchAnalytics().catch(err => {
                    console.warn('Prefetch analytics failed:', err);
                });
            }
            if (!moduleReadyRef.current.sales && !moduleInFlightRef.current.sales) {
                fetchSales().catch(err => {
                    console.warn('Prefetch sales failed:', err);
                });
            }
            if (!moduleReadyRef.current.inventory && !moduleInFlightRef.current.inventory) {
                fetchInventory().catch(err => {
                    console.warn('Prefetch inventory failed:', err);
                });
            }
        }, 150);
        
        return () => clearTimeout(prefetchTimer);
    }, [isShellReady, businessId, fetchAnalytics, fetchSales, fetchInventory]);

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
