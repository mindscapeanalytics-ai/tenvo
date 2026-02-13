'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useBusiness } from './BusinessContext';
import { useFilters } from './FilterContext';
import {
    productAPI,
    customerAPI,
    invoiceAPI,
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
    getMonthlyFinancialsAction,
    getAccountingSummaryAction
} from '@/lib/actions/standard/report';
import {
    getDashboardMetricsAction,
    getExpenseBreakdownAction
} from '@/lib/actions/premium/ai/analytics';
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
    const [accountingSummary, setAccountingSummary] = useState(null);
    const [dashboardChartData, setDashboardChartData] = useState([]);
    const [dashboardMetrics, setDashboardMetrics] = useState(null);
    const [expenseBreakdown, setExpenseBreakdown] = useState([]);

    const [loadingModules, setLoadingModules] = useState({});
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Modular Fetchers
    const fetchFinance = useCallback(async () => {
        if (!business?.id) return;
        setLoadingModules(prev => ({ ...prev, finance: true }));
        try {
            const [summary, financials, breakdown] = await Promise.all([
                getAccountingSummaryAction(business.id, dateRange.from.toISOString(), dateRange.to.toISOString()),
                getMonthlyFinancialsAction(business.id, 6),
                getExpenseBreakdownAction(business.id)
            ]);
            setAccountingSummary(summary.success ? summary.summary : null);
            setDashboardChartData(financials.success ? financials.analytics : []);
            setExpenseBreakdown(breakdown.success ? breakdown.data : []);
        } catch (error) {
            console.error('Fetch Finance Error:', error);
            toast.error('Failed to load financial data');
        } finally {
            setLoadingModules(prev => ({ ...prev, finance: false }));
        }
    }, [business?.id, dateRange.from, dateRange.to]);

    const fetchInventory = useCallback(async () => {
        if (!business?.id) return;
        setLoadingModules(prev => ({ ...prev, inventory: true }));
        try {
            const [prodRes, locRes] = await Promise.all([
                productAPI.getAll(business.id),
                getWarehouseLocationsAction(business.id)
            ]);
            // productAPI.getAll returns the products array directly
            setProducts(prodRes || []);
            setLocations(locRes.success ? locRes.locations : []);
        } catch (error) {
            console.error('Fetch Inventory Error:', error);
        } finally {
            setLoadingModules(prev => ({ ...prev, inventory: false }));
        }
    }, [business?.id]);

    const fetchAnalytics = useCallback(async () => {
        if (!business?.id) return;
        setLoadingModules(prev => ({ ...prev, analytics: true }));
        try {
            const res = await getDashboardMetricsAction(business.id);
            if (res.success) {
                setDashboardMetrics(res.data);
            }
        } catch (error) {
            console.error('Fetch Analytics Error:', error);
        } finally {
            setLoadingModules(prev => ({ ...prev, analytics: false }));
        }
    }, [business?.id]);

    const fetchPurchases = useCallback(async () => {
        if (!business?.id) return;
        setLoadingModules(prev => ({ ...prev, purchases: true }));
        try {
            const [vendRes, poRes] = await Promise.all([
                vendorAPI.getAll(business.id),
                purchaseAPI.getAll(business.id)
            ]);
            setVendors(vendRes || []);
            setPurchaseOrders(poRes.purchaseOrders || []);
        } catch (error) {
            console.error('Fetch Purchases Error:', error);
        } finally {
            setLoadingModules(prev => ({ ...prev, purchases: false }));
        }
    }, [business?.id]);

    const fetchSales = useCallback(async () => {
        if (!business?.id) return;
        setLoadingModules(prev => ({ ...prev, sales: true }));
        try {
            const [invRes, custRes, quotRes] = await Promise.all([
                getInvoicesAction(business.id),
                customerAPI.getAll(business.id),
                quotationAPI.getAll(business.id)
            ]);
            setInvoices(invRes.success ? invRes.invoices : []);
            // customerAPI.getAll returns the customers array directly
            setCustomers(custRes || []);
            setQuotations(quotRes.success ? quotRes.quotations : []);
            setSalesOrders(quotRes.success ? quotRes.salesOrders : []);
            setChallans(quotRes.success ? quotRes.challans : []);
        } catch (error) {
            console.error('Fetch Sales Error:', error);
        } finally {
            setLoadingModules(prev => ({ ...prev, sales: false }));
        }
    }, [business?.id]);

    const fetchManufacturing = useCallback(async () => {
        if (!business?.id) return;
        setLoadingModules(prev => ({ ...prev, manufacturing: true }));
        try {
            const [bomRes, poRes] = await Promise.all([
                getBOMsAction(business.id),
                getProductionOrdersAction(business.id)
            ]);
            setBomList(bomRes.success ? bomRes.boms : []);
            setProductionOrders(poRes.success ? poRes.productionOrders : []);
        } finally {
            setLoadingModules(prev => ({ ...prev, manufacturing: false }));
        }
    }, [business?.id]);

    const refreshAllData = useCallback(async () => {
        if (!business?.id) return;
        setLoadingModules(prev => ({ ...prev, refreshing: true }));
        try {
            await Promise.allSettled([
                fetchFinance(),
                fetchInventory(),
                fetchSales(),
                fetchPurchases(),
                fetchManufacturing(),
                fetchAnalytics()
            ]);
            setIsDataLoaded(true);
        } finally {
            setLoadingModules(prev => ({ ...prev, refreshing: false }));
        }
    }, [business?.id, fetchFinance, fetchInventory, fetchSales, fetchPurchases, fetchManufacturing, fetchAnalytics]);

    // Intelligent loading: only load essential data on mount/business change
    useEffect(() => {
        if (business?.id) {
            // Priority 1: Dashboard and Sales (most common)
            fetchFinance();
            fetchSales();
            fetchAnalytics();
            // Priority 2: Defer inventory, purchases and manufacturing slightly
            fetchInventory();
            fetchPurchases();
        }
    }, [business?.id, fetchFinance, fetchSales, fetchInventory, fetchAnalytics, fetchPurchases]);

    const value = {
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
        accountingSummary,
        dashboardChartData,
        dashboardMetrics,
        expenseBreakdown,
        isDataLoaded,
        isLoading: Object.values(loadingModules).some(Boolean),
        loadingModules,
        refreshAllData,
        fetchFinance,
        fetchInventory,
        fetchSales,
        fetchManufacturing
    };


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
