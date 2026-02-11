'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useBusiness } from './BusinessContext';
import { useFilters } from './FilterContext';
import {
    productAPI,
    customerAPI,
    invoiceAPI,
    vendorAPI,
    purchaseOrderAPI,
    quotationAPI,
} from '@/lib/api';
import {
    getInvoicesAction
} from '@/lib/actions/invoice';
import {
    getWarehouseLocationsAction
} from '@/lib/actions/warehouse';
import {
    getBOMsAction,
    getProductionOrdersAction
} from '@/lib/actions/manufacturing';
import {
    getMonthlyFinancialsAction,
    getAccountingSummaryAction
} from '@/lib/actions/report';
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
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const refreshAllData = useCallback(async () => {
        if (!business?.id) return;

        setIsLoading(true);
        try {
            const fetchPromises = [
                getInvoicesAction(business.id),
                productAPI.getAll(business.id),
                customerAPI.getAll(business.id),
                vendorAPI.getAll(business.id),
                quotationAPI.getAll(business.id),
                purchaseOrderAPI.getAll(business.id),
                getWarehouseLocationsAction(business.id),
                getBOMsAction(business.id),
                getProductionOrdersAction(business.id),
                getAccountingSummaryAction(business.id, dateRange.from.toISOString(), dateRange.to.toISOString()),
                getMonthlyFinancialsAction(business.id, 6)
            ];

            const results = await Promise.allSettled(fetchPromises);

            const getData = (index, key) => {
                const res = results[index];
                if (res.status !== 'fulfilled') return [];
                if (Array.isArray(res.value)) return res.value;
                return res.value.success ? res.value[key] : [];
            };

            setInvoices(getData(0, 'invoices'));
            setProducts(getData(1, 'products'));
            setCustomers(getData(2, 'customers'));
            setVendors(getData(3, 'vendors'));

            const quotData = results[4].status === 'fulfilled' && results[4].value.success ? results[4].value : {};
            setQuotations(quotData.quotations || []);
            setSalesOrders(quotData.salesOrders || []);
            setChallans(quotData.challans || []);

            setPurchaseOrders(getData(5, 'purchaseOrders'));
            setLocations(getData(6, 'locations'));
            setBomList(getData(7, 'boms'));
            setProductionOrders(getData(8, 'productionOrders'));
            setAccountingSummary(getData(9, 'summary'));
            setDashboardChartData(getData(10, 'analytics') || []);

            setIsDataLoaded(true);
        } catch (error) {
            console.error('Data Load Error:', error);
            toast.error('Failed to sync business data');
        } finally {
            setIsLoading(false);
        }
    }, [business?.id, dateRange.from, dateRange.to]);

    useEffect(() => {
        refreshAllData();
    }, [refreshAllData]);

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
        isDataLoaded,
        isLoading,
        refreshAllData
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
