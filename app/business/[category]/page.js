'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useBusiness } from '@/lib/context/BusinessContext';
import {
  productAPI,
  customerAPI,
  businessAPI,
  invoiceAPI,
  vendorAPI,
  purchaseOrderAPI,
  manufacturingAPI,
  warehouseAPI,
  quotationAPI,
} from '@/lib/api';
import { bulkDeleteAction } from '@/lib/actions/premium/automation/bulk';
import {
  Plus,
  FileText,
  Package,
  Users,
  DollarSign,
  Search,
  Bell,
  Settings,
  TrendingDown,
  TrendingUp,
  BarChart3,
  ShoppingCart,
  LayoutDashboard,
  Package as PackageIcon,
  Users as UsersIcon,
  DollarSign as DollarIcon,
  Truck,
  AlertTriangle,
  ChevronDown,
  Building2,
  Factory,
  Warehouse,
  Layers,
  Hash,
  ClipboardList,
  Pencil, // Replaces Edit
  Trash2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EnhancedInvoiceBuilder } from '@/components/EnhancedInvoiceBuilder';
import { CustomerForm } from '@/components/CustomerForm';
import { SalesManager } from '@/components/SalesManager';
import { VendorsAndPO } from '@/components/VendorsAndPO';
import { VendorManager } from '@/components/VendorManager';
import { PurchaseOrderManager } from '@/components/PurchaseOrderManager';
import { QuotationOrderChallanManager } from '@/components/QuotationOrderChallanManager';
import { ExportButton } from '@/components/ExportButton';
import { DataTable } from '@/components/DataTable';
import { ProductForm } from '@/components/ProductForm';
import { SettingsManager } from '@/components/SettingsManager';
import { TaxComplianceManager } from '@/components/TaxComplianceManager';
import { AdvancedAnalytics } from '@/components/AdvancedAnalytics';
import { RevenueAreaChart } from '@/components/AdvancedCharts';
import { DemandForecast } from '@/components/DemandForecast';
import { ManufacturingModule } from '@/components/ManufacturingModule';
import JournalEntryManager from '@/components/JournalEntryManager';
import TrialBalanceView from '@/components/TrialBalanceView';
import FinancialReports from '@/components/FinancialReports';
import { MultiLocationInventory } from '@/components/MultiLocationInventory';
import { FinancialOverview } from '@/components/dashboard/FinancialOverview';
import { BatchManager } from '@/components/inventory/BatchManager';
import { SerialScanner } from '@/components/inventory/SerialScanner';
import PaymentManager from '@/components/payment/PaymentManager';
import { SetupWizard } from '@/components/onboarding/SetupWizard';
import { getInvoicesAction, deleteInvoiceAction, createInvoiceAction, updateInvoiceAction } from '@/lib/actions/basic/invoice';
import { getWarehouseLocationsAction } from '@/lib/actions/standard/inventory/warehouse';
import { getBOMsAction, getProductionOrdersAction } from '@/lib/actions/premium/manufacturing';
import { getDomainColors } from '@/lib/domainColors';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { formatCurrency } from '@/lib/currency';
// import { aggregateMonthlyData } from '@/lib/utils/analytics'; // DEPRECATED: Using Server Action now
import { getMonthlyFinancialsAction, getAccountingSummaryAction } from '@/lib/actions/standard/report';
import toast from 'react-hot-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardTab } from './components/tabs/DashboardTab';
import { InventoryTab } from './components/tabs/InventoryTab';
import { InvoiceTab } from './components/tabs/InvoiceTab';
import { CustomersTab } from './components/tabs/CustomersTab';
import { useFilters } from '@/lib/context/FilterContext';
import { useData } from '@/lib/context/DataContext';
import { ActionModals } from './components/ActionModals';
import { DashboardTabs } from './components/DashboardTabs';

const businessCategories = {
  // Retail & FMCG (12)
  'retail-shop': { name: 'Retail Shop', icon: '🏪', color: 'green' },
  'grocery': { name: 'Grocery Store', icon: '🛒', color: 'green' },
  'fmcg': { name: 'FMCG Distribution', icon: '📦', color: 'wine' },
  'ecommerce': { name: 'E-commerce', icon: '🌐', color: 'indigo' },
  'supermarket': { name: 'Supermarket', icon: '🛒', color: 'green' },
  'bakery-confectionery': { name: 'Bakery & Confectionery', icon: '🍰', color: 'orange' },
  'boutique-fashion': { name: 'Boutique & Fashion', icon: '👗', color: 'pink' },
  'bookshop-stationery': { name: 'Bookshop & Stationery', icon: '📔', color: 'blue' },
  'garments': { name: 'Garments Store', icon: '👕', color: 'purple' },
  'mobile': { name: 'Mobile & Accessories', icon: '📱', color: 'blue' },
  'electronics-goods': { name: 'Electronics Goods', icon: '📺', color: 'blue' },
  'pharmacy': { name: 'Pharmacy (Medical Store)', icon: '💊', color: 'red' },

  // Industrial & Manufacturing (12)
  'chemical': { name: 'Chemical Industry', icon: '🧪', color: 'purple' },
  'paper-mill': { name: 'Paper Mill', icon: '📄', color: 'gray' },
  'paint': { name: 'Paint Industry', icon: '🎨', color: 'pink' },
  'plastic-manufacturing': { name: 'Plastic Manufacturing', icon: '♻️', color: 'green' },
  'textile-mill': { name: 'Textile Mill', icon: '🧵', color: 'amber' },
  'printing-packaging': { name: 'Printing & Packaging', icon: '🖨️', color: 'blue' },
  'furniture': { name: 'Furniture Manufacturing', icon: '🪑', color: 'brown' },
  'ceramics-tiles': { name: 'Ceramics & Tiles', icon: '🧱', color: 'gray' },
  'flour-mill': { name: 'Flour Mill (Chakki)', icon: '🌾', color: 'orange' },
  'rice-mill': { name: 'Rice Mill', icon: '🍚', color: 'gray' },
  'sugar-mill': { name: 'Sugar Mill', icon: '🍭', color: 'wine' },
  'steel-iron': { name: 'Steel & Iron Mill', icon: '🏗️', color: 'gray' },

  // Specialized & Wholesale (12)
  'auto-parts': { name: 'Auto Parts Wholesale', icon: '🚗', color: 'blue' },
  'textile-wholesale': { name: 'Textile Wholesale', icon: '📜', color: 'amber' },
  'distribution-wholesale': { name: 'General Distribution', icon: '📦', color: 'wine' },
  'hardware-sanitary': { name: 'Hardware & Sanitary', icon: '🔧', color: 'gray' },
  'construction-material': { name: 'Construction Material', icon: '🏗️', color: 'orange' },
  'agriculture': { name: 'Agriculture & Fertilizer', icon: '🌾', color: 'green' },
  'poultry-farm': { name: 'Poultry Farm', icon: '🐔', color: 'orange' },
  'dairy-farm': { name: 'Dairy Farm', icon: '🐄', color: 'blue' },
  'solar-energy': { name: 'Solar Energy Solutions', icon: '☀️', color: 'yellow' },
  'petrol-pump': { name: 'Petrol Pump (Fuel Station)', icon: '⛽', color: 'red' },
  'cold-storage': { name: 'Cold Storage (Warehouse)', icon: '❄️', color: 'cyan' },
  'gems-jewellery': { name: 'Gems & Jewellery', icon: '💎', color: 'teal' },

  // Services & Healthcare (12)
  'travel': { name: 'Travel & Tourism', icon: '✈️', color: 'cyan' },
  'auto-workshop': { name: 'Auto Workshop / Service', icon: '🛠️', color: 'blue' },
  'diagnostic-lab': { name: 'Diagnostic Lab', icon: '🔬', color: 'purple' },
  'clinics-healthcare': { name: 'Clinics & Healthcare', icon: '👨‍⚕️', color: 'red' },
  'restaurant-cafe': { name: 'Restaurant & Cafe', icon: '🍲', color: 'orange' },
  'gym-fitness': { name: 'Gym & Fitness Center', icon: '🏋️', color: 'blue' },
  'hotel-guesthouse': { name: 'Hotel & Guesthouse', icon: '🏨', color: 'indigo' },
  'event-management': { name: 'Event Management', icon: '🎉', color: 'pink' },
  'rent-a-car': { name: 'Rent-a-Car Service', icon: '🚘', color: 'blue' },
  'school-library': { name: 'School & Library', icon: '🎓', color: 'indigo' },
  'courier-logistics': { name: 'Courier & Logistics', icon: '🚚', color: 'wine' },
  'logistics-transport': { name: 'Logistics & Transport', icon: '🚛', color: 'wine' },

  // Others & Real Estate (3+)
  'real-estate': { name: 'Real Estate & Property', icon: '🏠', color: 'brown' },
  'computer-hardware': { name: 'Computer Hardware', icon: '💻', color: 'blue' },
  'book-publishing': { name: 'Book Publishing', icon: '📚', color: 'teal' },
};

function BusinessDashboardContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = String(params?.category || 'retail-shop');

  // Initialize tab from URL or default to 'dashboard'
  const initialTab = searchParams.get('tab') || 'dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync state with URL when URL changes (e.g. sidebar click)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') || 'dashboard';
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  // Sync URL when state changes (e.g. valid tab click)
  const handleTabChange = useCallback((val) => {
    setActiveTab(val);
    router.push(`/business/${category}?tab=${val}`, { scroll: false });
  }, [category, router]);

  const [showQuickAction, setShowQuickAction] = useState(false);

  const handleQuickAction = useCallback((actionId) => {
    switch (actionId) {
      case 'sales':
      case 'invoices':
        handleTabChange('invoices');
        break;
      case 'inventory':
        handleTabChange('inventory');
        break;
      case 'customers':
        handleTabChange('customers');
        break;
      case 'analytics':
        handleTabChange('analytics');
        break;
      case 'manufacturing':
      case 'new-production':
        handleTabChange('manufacturing');
        break;
      case 'accounting':
        handleTabChange('accounting');
        break;
      case 'new-invoice':
      case 'add-invoice':
        setShowInvoiceBuilder(true);
        break;
      case 'new-product':
      case 'add-product':
        setShowProductForm(true);
        break;
      case 'new-customer':
      case 'add-customer':
        setShowCustomerForm(true);
        break;
      case 'new-vendor':
      case 'add-vendor':
        setEditingVendor(null);
        setShowVendorForm(true);
        break;
      case 'new-purchase':
      case 'add-purchase':
        setPoInitialData(null);
        setShowPOBuilder(true);
        break;
      case 'new-quotation':
        handleTabChange('quotations');
        break;
      case 'generate-report':
        handleTabChange('reports');
        break;
      case 'excel-mode':
      case 'fast-entry':
        handleTabChange('inventory');
        toast.success("Excel Mode active in Inventory", { icon: '📊' });
        break;
      default:
        // No default modal opening
        break;
    }
  }, [handleTabChange]);

  // Handle Events from Palette and Sidebar
  useEffect(() => {
    const onQuickActionEvent = (e) => handleQuickAction(e.detail?.actionId);
    const onOpenModalEvent = (e) => {
      const modalId = e.detail?.modalId;
      if (modalId === 'invoice') setShowInvoiceBuilder(true);
      if (modalId === 'product') {
        setEditingProduct(null);
        setShowProductForm(true);
      }
      if (modalId === 'customer') setShowCustomerForm(true);
      if (modalId === 'vendor') setShowVendorForm(true);
      if (modalId === 'purchase') setShowPOBuilder(true);
    };

    const onSwitchTabEvent = (e) => {
      const tabId = e.detail?.tab;
      if (tabId) handleTabChange(tabId);
    };

    const onViewDetailsEvent = (e) => {
      setViewingItem(e.detail?.item);
      setViewingType(e.detail?.type);
    };

    window.addEventListener('open-quick-action', onQuickActionEvent);
    window.addEventListener('open-modal', onOpenModalEvent);
    window.addEventListener('switch-tab', onSwitchTabEvent);
    window.addEventListener('view-details', onViewDetailsEvent);

    return () => {
      window.removeEventListener('open-quick-action', onQuickActionEvent);
      window.removeEventListener('open-modal', onOpenModalEvent);
      window.removeEventListener('switch-tab', onSwitchTabEvent);
      window.removeEventListener('view-details', onViewDetailsEvent);
    };
  }, [handleQuickAction]);

  // Fallback logic for domains not in the static businessCategories map
  const businessInfo = useMemo(() => {
    const staticInfo = businessCategories[category];
    if (staticInfo) return staticInfo;

    // Dynamically derive from domainKnowledge
    const knowledge = getDomainKnowledge(category);
    return {
      name: category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: knowledge.icon || '🚀',
      color: 'wine' // Default theme color
    };
  }, [category]);

  const colors = getDomainColors(category);
  const domainKnowledge = getDomainKnowledge(category);

  const {
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
    refreshAllData,
    fetchInventory,
    fetchSales,
    fetchPurchases
  } = useData();
  const [showInvoiceBuilder, setShowInvoiceBuilder] = useState(false);
  const [invoiceInitialData, setInvoiceInitialData] = useState(null); // New state for pre-filling invoice
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({ name: '', phone: '', email: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [showPOBuilder, setShowPOBuilder] = useState(false);
  const [poInitialData, setPoInitialData] = useState(null);
  const [currency] = useState('PKR');
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [hasCheckedSetup, setHasCheckedSetup] = useState(false);
  // Date Range and Search Filtering
  const { dateRange, setDateRange, searchQuery, setSearchQuery } = useFilters();
  const [viewingItem, setViewingItem] = useState(null);
  const [viewingType, setViewingType] = useState(null);

  const { user, loading: authLoading } = useAuth();
  const { business, role, updateBusiness, isLoading: businessLoading, switchBusinessByDomain } = useBusiness();

  // Load business if not in context but id exists in localStorage or searchParams
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Domain Validation & Auto-Switching
  useEffect(() => {
    if (!businessLoading && !authLoading && business && business.domain !== category) {
      console.log(`Domain mismatch: context ${business.domain}, URL ${category}. Attempting switch...`);

      const trySwitch = async () => {
        const result = await switchBusinessByDomain(category);
        if (!result.success) {
          console.error("Access denied to domain:", category, result.error);
          toast.error("Access denied to this business");
          router.replace(`/business/${business.domain}${window.location.search}`);
        }
      };

      trySwitch();
    }
  }, [business, businessLoading, authLoading, category, router, switchBusinessByDomain]);


  // Data is now managed by DataProvider and synced via useData hook
  // Local page state only manages UI toggles and local interactions



  const handleSetupComplete = async () => {
    setShowSetupWizard(false);
    if (business?.id) {
      try {
        // Persist setup completion to database
        const updatedSettings = {
          ...(business.settings || {}),
          setup_completed: true,
          setup_at: new Date().toISOString()
        };
        await businessAPI.update(business.id, { settings: updatedSettings });
        toast.success('Business setup finalized');
        refreshAllData();
      } catch (error) {
        console.error('Failed to save setup status:', error);
      }
    }
  };

  // Check if we should show the setup wizard
  useEffect(() => {
    // Only check once per session when data is loaded
    if (!isDataLoaded || !business?.id || businessLoading) return;

    const isSetupCompleted = business?.settings?.setup_completed;

    // Strict check: Only show if NOT completed AND NO products exist
    // This handles the case where setup was done but flag wasn't set (legacy)
    if (!isSetupCompleted && products.length === 0 && !hasCheckedSetup) {
      setShowSetupWizard(true);
      setHasCheckedSetup(true);
    } else if (products.length > 0 || isSetupCompleted) {
      // If products exist, we assume setup is done or not needed
      setHasCheckedSetup(true);

      // Auto-fix: If products exist but flag is false, silent update
      if (!isSetupCompleted && products.length > 0) {
        const fixSettings = async () => {
          try {
            await businessAPI.update(business.id, {
              settings: { ...(business.settings || {}), setup_completed: true }
            });
          } catch (e) { console.error('Silent setup fix failed', e); }
        };
        fixSettings();
      }
    }
  }, [isDataLoaded, business?.id, business?.settings?.setup_completed, products.length, businessLoading, hasCheckedSetup, business?.settings]);

  // Calculate stats
  const totalRevenue = useMemo(() => invoices
    .filter(inv => {
      const invDate = new Date(inv.date);
      return inv.status === 'paid' && invDate >= dateRange.from && invDate <= dateRange.to;
    })
    .reduce((sum, inv) => sum + (Number(inv.grand_total) || Number(inv.amount) || 0), 0), [invoices, dateRange]);

  const grossRevenue = useMemo(() => invoices
    .filter(inv => {
      const invDate = new Date(inv.date);
      return invDate >= dateRange.from && invDate <= dateRange.to;
    })
    .reduce((sum, inv) => sum + (Number(inv.grand_total) || Number(inv.amount) || 0), 0), [invoices, dateRange]);

  const totalOrders = invoices.filter(inv => {
    const invDate = new Date(inv.date);
    return invDate >= dateRange.from && invDate <= dateRange.to;
  }).length;

  const totalProducts = products.length;
  const totalCustomers = customers.length;

  const lowStockCount = products.filter(p => (p.stock || 0) <= (p.min_stock || 10)).length;

  const totalTaxLiability = useMemo(() => {
    const outputTax = invoices.reduce((sum, inv) => sum + (Number(inv.tax_total) || 0), 0);
    const inputTax = purchaseOrders.reduce((sum, po) => sum + (Number(po.tax_total) || 0), 0);
    return Math.max(0, outputTax - inputTax);
  }, [invoices, purchaseOrders]);

  const handleSaveProduct = async (productData) => {
    if (!business?.id) {
      toast.error('System is initializing. Please try again in 2 seconds.');
      return;
    }
    try {
      const isEditing = !!(editingProduct || productData.id);
      const productId = productData.id || editingProduct?.id;

      // Extract batches and serials (Send ALL to backend for reconciliation)
      const allBatches = productData.batches || [];
      const allSerials = productData.serialNumbers || [];

      // 🚀 ATOMIC PERSISTENCE CALL
      // This single call replaces 3+ sequential network requests with a single ACID transaction
      await productAPI.upsertIntegrated({
        productData: {
          ...productData,
          business_id: business.id,
          batches: undefined, // Don't send nested arrays in cleanProductData if not handled by action
          serialNumbers: undefined
        },
        batches: allBatches,
        serialNumbers: allSerials,
        isUpdate: isEditing,
        productId: productId || productData.id
      });

      toast.success(isEditing ? 'Product updated' : 'Product created');

      // 🔄 AUTHORITATIVE SYNC: Refresh all data to ensure frontend and backend are perfectly aligned
      await refreshAllData();

      setShowProductForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product: ' + (error.message || 'Unknown error'));
    }
  };



  const handleDeleteProduct = async (productId) => {
    try {
      await productAPI.delete(productId, business.id);
      await fetchInventory();
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleSaveCustomer = async (customerData) => {
    try {
      if (customerData.id) {
        await customerAPI.update(customerData.id, customerData);
        toast.success('Customer updated successfully');
      } else {
        await customerAPI.create({
          ...customerData,
          business_id: business.id
        });
        toast.success('Customer added successfully');
      }
      await fetchSales();
      setShowCustomerForm(false);
      setEditingCustomer(null);
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error('Failed to save customer');
    }
  };

  const handleSaveVendor = async (vendorData) => {
    try {
      if (vendorData.id) {
        await vendorAPI.update(vendorData.id, vendorData);
        toast.success('Vendor updated');
      } else {
        await vendorAPI.create({
          ...vendorData,
          business_id: business.id
        });
        toast.success('Vendor added');
      }
      await fetchPurchases();
      setShowVendorForm(false);
      setEditingVendor(null);
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast.error('Failed to save vendor');
    }
  };

  const handleExport = (data) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Simple CSV Export
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(obj =>
      Object.values(obj).map(val =>
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQuickAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleBulkDelete = async (ids) => {
    if (!ids || ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} items? This cannot be undone.`)) return;

    try {
      // Determine entity type based on active tab
      let entityType = activeTab;
      if (activeTab === 'inventory') entityType = 'products';

      const res = await bulkDeleteAction(business.id, entityType, ids);

      if (res.success) {
        toast.success(`${res.count} items deleted`);
        refreshAllData();
      } else {
        toast.error(res.error || 'Bulk delete failed');
      }
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error('Deletion failed');
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (confirm('De-register this supplier?')) {
      try {
        await vendorAPI.delete(business.id, vendorId);
        await fetchPurchases();
        toast.success('Vendor removed');
      } catch (error) {
        console.error('Error deleting vendor:', error);
        toast.error('Failed to remove vendor');
      }
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerAPI.delete(customerId, business.id);
        await fetchSales();
        toast.success('Customer deleted successfully');
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer');
      }
    }
  };

  const handleGenerateAutoPO = async (poData) => {
    if (!business?.id) return;
    try {
      const result = await purchaseOrderAPI.createAutoReorderPO(
        business.id,
        poData.productId,
        poData.quantity,
        poData.vendorId
      );
      if (result.success) {
        toast.success(`Purchase order ${result.purchaseNumber} generated successfully`);
        refreshAllData();
      }
    } catch (error) {
      console.error("Error generating auto PO:", error);
      toast.error("Failed to generate purchase order");
    }
  };

  const handleSaveInvoice = async (invoiceData) => {
    try {
      const { items, totals, ...header } = invoiceData;
      const invoiceTotals = totals || header;

      const payload = {
        ...header,
        business_id: business.id,
        invoice_number: header.invoiceNumber || header.invoice_number || `INV-${Date.now()}`,
        grand_total: invoiceTotals.total || invoiceTotals.grand_total || header.grand_total || items.reduce((sum, item) => sum + (item.amount || item.total || 0), 0) || 0,
        subtotal: invoiceTotals.subtotal || header.subtotal || items.reduce((sum, item) => sum + (item.quantity * item.rate), 0) || 0,
        tax_total: invoiceTotals.taxTotal || invoiceTotals.tax_total || invoiceTotals.totalTax || header.tax_total || 0,
        discount_total: invoiceTotals.discount || invoiceTotals.discount_total || header.discount_total || 0
      };

      const mappedItems = items.map(item => ({
        ...item,
        total_amount: item.total || item.amount || 0
      }));

      // 1. Actually call the API to persist data
      const isUpdate = invoiceInitialData?.id && typeof invoiceInitialData.id === 'string' && invoiceInitialData.id.length > 20;

      if (isUpdate) {
        await invoiceAPI.update(invoiceInitialData.id, payload, mappedItems);
        toast.success('Invoice updated successfully');
      } else {
        await invoiceAPI.create(payload, mappedItems);
        toast.success('Invoice created successfully');
      }

      // 2. Clear state and refresh UI
      setShowInvoiceBuilder(false);
      setInvoiceInitialData(null);

      // Refresh products as stock might have changed
      refreshAllData();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(error.message || 'Failed to save invoice');
      throw error; // Propagate error so child component knows it failed
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (confirm('Are you sure you want to delete this invoice? Stock will be restored to inventory.')) {
      try {
        await invoiceAPI.delete(business.id, invoiceId);
        toast.success('Invoice deleted and stock restored');
        refreshAllData();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        toast.error('Failed to delete invoice');
        throw error;
      }
    }
  };

  const handleUpdatePOStatus = async (poId, status) => {
    try {
      const updated = await purchaseOrderAPI.updateStatus(business.id, poId, status);
      await fetchPurchases();

      if (status === 'received' && business?.id) {
        await fetchInventory();
        toast.success('Inventory updated automatically');
      } else {
        toast.success(`Order marked as ${status}`);
      }
    } catch (error) {
      console.error('Error updating PO status:', error);
      toast.error('Failed to update order status');
    }
  };

  // --- Handlers for Advanced Features ---


  const handleCreateBOM = async (data) => {
    try {
      await manufacturingAPI.createBOM({ ...data, business_id: business.id });
      await fetchManufacturing();
      toast.success('BOM created successfully');
    } catch (error) {
      console.error('Create BOM Error:', error);
      toast.error('Failed to create BOM');
    }
  };

  const handleCreateProductionOrder = async (data) => {
    try {
      await manufacturingAPI.createProductionOrder({ ...data, business_id: business.id });
      await fetchManufacturing();
      toast.success('Production Order scheduled');
    } catch (error) {
      console.error('Create Prod Order Error:', error);
      toast.error('Failed to schedule production');
    }
  };

  const handleLocationAdd = async (data) => {
    try {
      await warehouseAPI.createLocation({ ...data, business_id: business.id });
      await fetchInventory();
      toast.success('Warehouse location added');
    } catch (error) {
      console.error('Add Location Error:', error);
      toast.error('Failed to add location');
      throw error;
    }
  };

  const handleLocationUpdate = async (locationId, updates) => {
    try {
      await warehouseAPI.updateLocation(business.id, locationId, updates);
      await fetchInventory();
      toast.success('Location updated successfully');
    } catch (error) {
      console.error('Update Location Error:', error);
      toast.error(error.message || 'Failed to update location');
      throw error;
    }
  };

  const handleLocationDelete = async (locationId) => {
    try {
      await warehouseAPI.deleteLocation(business.id, locationId);
      await fetchInventory();
      toast.success('Location deleted successfully');
    } catch (error) {
      console.error('Delete Location Error:', error);
      toast.error(error.message || 'Failed to delete location');
    }
  };

  const handleStockTransfer = async (data) => {
    try {
      await warehouseAPI.createTransfer({ ...data, business_id: business.id });
      toast.success('Stock transfer initiated');
      // Refresh products to reflect stock changes
      const result = await productAPI.getAll(business.id);
      setProducts(result.products || []);
    } catch (error) {
      console.error('Stock Transfer Error:', error);
      toast.error('Failed to transfer stock');
    }
  };


  // BLOCKING LOADER REMOVED FOR INSTANT SHELL RENDER
  // if (businessLoading || authLoading) {
  //   return (
  //     <div className="flex h-screen w-full items-center justify-center bg-gray-50/50">
  //       ...
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Onboarding Wizard - Global */}
      {!businessLoading && !business && (
        <div className="mb-8">
          <SetupWizard onComplete={() => window.location.reload()} />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-2">
        <DashboardTabs
          activeTab={activeTab}
          searchTerm={searchQuery}
          category={category}
          business={business}
          role={role}
          invoices={invoices}
          products={products}
          customers={customers}
          vendors={vendors}
          quotations={quotations}
          salesOrders={salesOrders}
          challans={challans}
          purchaseOrders={purchaseOrders}
          locations={locations}
          bomList={bomList}
          productionOrders={productionOrders}
          accountingSummary={accountingSummary}
          dashboardChartData={dashboardChartData}
          dashboardMetrics={dashboardMetrics}
          expenseBreakdown={expenseBreakdown}
          dateRange={dateRange}
          currency={currency}
          colors={colors}
          colors={colors}
          domainKnowledge={domainKnowledge}
          isLoading={!isDataLoaded}
          handlers={{
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
            formatCurrency,
            handleQuickAction,
            setShowVendorForm,
            setEditingVendor,
            setShowPOBuilder
          }}
        />
      </Tabs >

      <ActionModals
        showProductForm={showProductForm}
        setShowProductForm={setShowProductForm}
        showQuickAction={showQuickAction}
        setShowQuickAction={setShowQuickAction}
        showCustomerForm={showCustomerForm}
        setShowCustomerForm={setShowCustomerForm}
        showInvoiceBuilder={showInvoiceBuilder}
        setShowInvoiceBuilder={setShowInvoiceBuilder}
        // Excel functionality is now handled locally within InventoryManager
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        editingCustomer={editingCustomer}
        setEditingCustomer={setEditingCustomer}
        invoiceInitialData={invoiceInitialData}
        setInvoiceInitialData={setInvoiceInitialData}
        customerFormData={customerFormData}
        setCustomerFormData={setCustomerFormData}
        products={products}
        customers={customers}
        category={category}
        colors={colors}
        currency={currency}
        onSaveProduct={handleSaveProduct}
        onSaveCustomer={handleSaveCustomer}
        onSaveInvoice={handleSaveInvoice}
        onTabChange={handleTabChange}
        formatCurrency={formatCurrency}
        loadProducts={refreshAllData}

        // Vendor & PO States
        showVendorForm={showVendorForm}
        setShowVendorForm={setShowVendorForm}
        editingVendor={editingVendor}
        setEditingVendor={setEditingVendor}
        onSaveVendor={handleSaveVendor}

        showPOBuilder={showPOBuilder}
        setShowPOBuilder={setShowPOBuilder}
        poInitialData={poInitialData}
        setPoInitialData={setPoInitialData}
        refreshData={refreshAllData}
        business={business}

        // Details Viewer Props
        viewingItem={viewingItem}
        setViewingItem={setViewingItem}
        viewingType={viewingType}
        setViewingType={setViewingType}
      />
    </div >
  );
}

export default function Page() {
  return (
    <ErrorBoundary>
      <BusinessDashboardContent />
    </ErrorBoundary>
  );
}
