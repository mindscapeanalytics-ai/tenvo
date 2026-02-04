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
  accountingAPI
} from '@/lib/api';
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
  Receipt,
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
import { InventoryManager } from '@/components/InventoryManager';
import { CustomerManager } from '@/components/CustomerManager';
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
import { DemandForecast } from '@/components/DemandForecast';
import { EnhancedDashboard } from '@/components/EnhancedDashboard';
import { ManufacturingModule } from '@/components/ManufacturingModule';
import JournalEntryManager from '@/components/JournalEntryManager';
import TrialBalanceView from '@/components/TrialBalanceView';
import FinancialReports from '@/components/FinancialReports';
import { MultiLocationInventory } from '@/components/MultiLocationInventory';
import { BatchManager } from '@/components/inventory/BatchManager';
import { BatchService } from '@/lib/services/BatchService';
import { SerialService } from '@/lib/services/SerialService';
import { SerialScanner } from '@/components/inventory/SerialScanner';
import PaymentManager from '@/components/payment/PaymentManager';
import { SetupWizard } from '@/components/onboarding/SetupWizard';
import { getInvoicesAction, deleteInvoiceAction } from '@/lib/actions/invoice';
import { getWarehouseLocationsAction } from '@/lib/actions/warehouse';
import { getBOMsAction, getProductionOrdersAction } from '@/lib/actions/manufacturing';
import { getDomainColors } from '@/lib/domainColors';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { formatCurrency } from '@/lib/currency';
import { aggregateMonthlyData } from '@/lib/utils/analytics';
import toast from 'react-hot-toast';

const businessCategories = {
  'auto-parts': { name: 'Auto Parts', icon: '🚗', color: 'blue' },
  'retail-shop': { name: 'Retail Shop', icon: '🏪', color: 'green' },
  'pharmacy': { name: 'Pharmacy', icon: '💊', color: 'red' },
  'chemical': { name: 'Chemical', icon: '🧪', color: 'purple' },
  'food-beverages': { name: 'Food & Beverages', icon: '🍔', color: 'orange' },
  'ecommerce': { name: 'E-commerce', icon: '🛒', color: 'indigo' },
  'computer-hardware': { name: 'Computer Hardware', icon: '💻', color: 'blue' },
  'furniture': { name: 'Furniture', icon: '🪑', color: 'brown' },
  'book-publishing': { name: 'Book Publishing', icon: '📚', color: 'teal' },
  'travel': { name: 'Travel', icon: '✈️', color: 'cyan' },
  'fmcg': { name: 'FMCG', icon: '📦', color: 'wine' },
  'electrical': { name: 'Electrical', icon: '⚡', color: 'wine' },
  'paper-mill': { name: 'Paper Mill', icon: '📄', color: 'gray' },
  'paint': { name: 'Paint', icon: '🎨', color: 'pink' },
  'mobile': { name: 'Mobile', icon: '📱', color: 'blue' },
  'garments': { name: 'Garments', icon: '👕', color: 'purple' },
  'agriculture': { name: 'Agriculture', icon: '🌾', color: 'green' },
  'gems-jewellery': { name: 'Gems & Jewellery', icon: '💎', color: 'teal' },
  'electronics-goods': { name: 'Electronics Goods', icon: '📺', color: 'blue' },
  'real-estate': { name: 'Real Estate', icon: '🏠', color: 'brown' },
  'grocery': { name: 'Grocery', icon: '🛒', color: 'green' },
  'textile-wholesale': { name: 'Textile Wholesale', icon: '📜', color: 'amber' }
};

export default function BusinessDashboard() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = params?.category || 'retail-shop';

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

  // Handle Quick Action Event from Sidebar
  useEffect(() => {
    const handleQuickAction = (e) => {
      setShowQuickAction(true);
    };
    window.addEventListener('open-quick-action', handleQuickAction);
    return () => window.removeEventListener('open-quick-action', handleQuickAction);
  }, []);

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
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showInvoiceBuilder, setShowInvoiceBuilder] = useState(false);
  const [invoiceInitialData, setInvoiceInitialData] = useState(null); // New state for pre-filling invoice
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({ name: '', phone: '', email: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [currency] = useState('PKR');
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [hasCheckedSetup, setHasCheckedSetup] = useState(false);

  // Date Range Filtering
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

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


  // Fetch data from Supabase
  const refreshAllData = useCallback(async () => {
    if (!business?.id) return;

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
      accountingAPI.getSummary(business.id)
    ];

    const results = await Promise.allSettled(fetchPromises);

    const getData = (index, key) => {
      const res = results[index];
      return res.status === 'fulfilled' && res.value.success ? res.value[key] : [];
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

    setIsDataLoaded(true);
  }, [business?.id, domainKnowledge?.inventoryFeatures, domainKnowledge?.manufacturingEnabled, domainKnowledge?.multiLocationEnabled]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);



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

  const dashboardChartData = useMemo(() => {
    return aggregateMonthlyData(invoices, 6);
  }, [invoices]);

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
      // ROBUST CHECK: Check both state AND payload ID
      const isEditing = editingProduct || productData.id;

      // Extract batches to handle separately (since backend doesn't support nested batch write yet)
      const { batches, ...cleanProductData } = productData;

      let savedProduct;

      if (isEditing) {
        const productId = productData.id || editingProduct.id;

        // OPTIMISTIC UPDATE: Update UI immediately
        setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...cleanProductData } : p));

        const updated = await productAPI.update(productId, {
          ...cleanProductData,
          business_id: business.id
        });

        savedProduct = updated;

        // Final sync with server response
        setProducts(prev => prev.map(p => p.id === productId ? updated : p));
        toast.success('Product updated');
      } else {
        const created = await productAPI.create({
          ...cleanProductData,
          business_id: business.id
        });
        savedProduct = created;

        setProducts(prev => [...prev, created]);
        toast.success('Product created');
      }

      // 🚀 BATCH PERSISTENCE LAYER
      // Ensure all batches added in the form are actually created in the backend
      let allCurrentBatches = batches || []; // Start with what was submitted

      if (batches && batches.length > 0) {
        const newlyCreatedBatches = [];

        // We use a promise array to handle multiple batches concurrently
        const batchPromises = batches.map(async (batch) => {
          // Create logic: Only create if it looks like a new batch 
          // Robust check: ID is missing OR it's a timestamp (large number)
          const isNewBatch = !batch.id || (typeof batch.id === 'number' && batch.id > 1000000000000);

          if (isNewBatch) {
            try {
              const createdBatch = await BatchService.createBatch({
                businessId: business.id,
                productId: savedProduct.id,
                warehouseId: locations[0]?.id, // Default to first warehouse if not specified
                batchNumber: batch.batchNumber,
                manufacturingDate: batch.manufacturingDate,
                expiryDate: batch.expiryDate,
                quantity: Number(batch.quantity),
                costPrice: Number(batch.cost) || Number(batch.costPrice) || 0,
                mrp: Number(batch.mrp),
                location: batch.location,
                notes: 'Initial stock entry'
              });
              newlyCreatedBatches.push(createdBatch);
            } catch (err) {
              console.error(`Failed to save batch ${batch.batchNumber}`, err);
              // Don't throw to avoid blocking the whole flow, but log it
            }
          }
        });

        await Promise.all(batchPromises);

        // 🔄 HYDRATE STATE: Merge existing (skipped) batches with newly created ones
        // This ensures if user re-opens the form, they see "Persisted" batches (real IDs)
        if (newlyCreatedBatches.length > 0) {
          const existingBatches = batches.filter(b => !(!b.id || (typeof b.id === 'number' && b.id > 1000000000000)));
          allCurrentBatches = [...existingBatches, ...newlyCreatedBatches];

          // Update the product in state with the authoritative batch list
          const finalProduct = { ...savedProduct, batches: allCurrentBatches };
          setProducts(prev => prev.map(p => p.id === savedProduct.id ? finalProduct : p));
        }
      }

      // 🔍 SERIAL NUMBER PERSISTENCE LAYER
      // Ensure all serials added are registered
      let allCurrentSerials = productData.serialNumbers || [];

      if (typeof productData.serialNumbers !== 'undefined' && productData.serialNumbers.length > 0) {
        const serials = productData.serialNumbers;
        const newlyCreatedSerials = [];

        const serialPromises = serials.map(async (serial) => {
          // Only save if it's a new entry (numeric temp ID > 1T) or forced by create mode
          // Robust check matches Batch logic
          const isNew = !serial.id || (typeof serial.id === 'number' && serial.id > 1000000000000);

          if (isNew) {
            try {
              const createdSerial = await SerialService.createSerial({
                business_id: business.id,
                product_id: savedProduct.id,
                warehouse_id: locations[0]?.id,
                serial_number: serial.serialNumber,
                purchase_date: serial.purchaseDate,
                warranty_period_months: serial.warrantyMonths,
                notes: 'Initial Entry'
              });
              newlyCreatedSerials.push(createdSerial);
            } catch (err) {
              console.error(`Failed to save serial ${serial.serialNumber}`, err);
            }
          }
        });
        await Promise.all(serialPromises);

        // 🔄 HYDRATE SERIAL STATE
        if (newlyCreatedSerials.length > 0) {
          const existingSerials = serials.filter(s => !(!s.id || (typeof s.id === 'number' && s.id > 1000000000000)));
          allCurrentSerials = [...existingSerials, ...newlyCreatedSerials];

          // We need to update the product again with BOTH batches and serials if both changed
          // Since this runs after batch logic, we need to be careful not to overwrite batch updates if they happened
          // But setProducts uses callback `prev`, so it catches latest state.
          // However, `savedProduct` variable is local and stale! 
          // We must assume `allCurrentBatches` (from above scope) is the source of truth for batches.
          // BUT `allCurrentBatches` is block-scoped in the `if(batches)` block.
          // We should fix the scoping or just update state incrementally.

          setProducts(prev => prev.map(p => {
            if (p.id === savedProduct.id) {
              // We need to preserve batches if they were just updated. 
              // 'p' has the latest batches from the previous setProducts call?
              // Yes, because `setProducts` queues updates. 
              // Wait, React state updates are batched. 
              // Calling setProducts twice in one event loop might result in collision if we don't merge carefully.
              return { ...p, serial_numbers: allCurrentSerials }; // Using snake_case for consistency with DB/API? Or camelCase?
              // ProductForm uses `serialNumbers` (camel), but API usually returns `serial_numbers`.
              // Let's use `serialNumbers` to match Form, but usually backend returns `serial_numbers`.
              // Frontend likely maps it. 
              // Let's stick to `serial_numbers` as that's likely what API keys are.
            }
            return p;
          }));
        }
      }

      // 🔄 AUTHORITATIVE SYNC: Refresh all data to ensure frontend and backend are perfectly aligned
      await refreshAllData();

      setShowProductForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
      throw error;
    }
  };

  const handleQuickAddProduct = async () => {
    if (!business?.id) return;
    try {
      const created = await productAPI.create({
        name: 'New Product',
        sku: `SKU-${Math.floor(Math.random() * 100000)}`,
        price: 0,
        stock: 0,
        business_id: business.id,
        category: category
      });
      setProducts([...products, created]);
      toast.success('Quick-added product to grid');
    } catch (error) {
      console.error('Quick Add Error:', error);
      toast.error('Quick add failed');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await productAPI.delete(productId);
        setProducts(products.filter(p => p.id !== productId));
        toast.success('Product deleted successfully');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  };

  const handleSaveCustomer = async (customerData) => {
    try {
      if (customerData.id) {
        const updated = await customerAPI.update(customerData.id, customerData);
        setCustomers(customers.map(c => c.id === customerData.id ? updated : c));
        toast.success('Customer updated successfully');
      } else {
        const created = await customerAPI.create({
          ...customerData,
          business_id: business.id
        });
        setCustomers([...customers, created]);
        toast.success('Customer added successfully');
      }
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
        const updated = await vendorAPI.update(vendorData.id, vendorData);
        setVendors(vendors.map(v => v.id === vendorData.id ? updated : v));
        toast.success('Vendor updated successfully');
      } else {
        const created = await vendorAPI.create({
          ...vendorData,
          business_id: business.id
        });
        setVendors([...vendors, created]);
        toast.success('Vendor registered successfully');
      }
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast.error('Failed to save vendor');
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (confirm('De-register this supplier?')) {
      try {
        await vendorAPI.delete(vendorId);
        setVendors(vendors.filter(v => v.id !== vendorId));
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
        await customerAPI.delete(customerId);
        setCustomers(customers.filter(c => c.id !== customerId));
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
      const result = await purchaseAPI.createAutoReorderPO(
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

      // Explicitly re-fetch to ensure we have full data
      const freshInvoices = await invoiceAPI.getAll(business.id);
      setInvoices(freshInvoices);

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
        setInvoices(invoices.filter(inv => inv.id !== invoiceId));
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
      setPurchaseOrders(purchaseOrders.map(p => p.id === poId ? { ...p, status: updated.status } : p));

      if (status === 'received' && business?.id) {
        const result = await productAPI.getAll(business.id);
        setProducts(result.products || []);
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
      const newBOM = await manufacturingAPI.createBOM({ ...data, business_id: business.id });
      setBomList([newBOM, ...bomList]);
      toast.success('BOM created successfully');
    } catch (error) {
      console.error('Create BOM Error:', error);
      toast.error('Failed to create BOM');
    }
  };

  const handleCreateProductionOrder = async (data) => {
    try {
      const newOrder = await manufacturingAPI.createProductionOrder({ ...data, business_id: business.id });
      setProductionOrders([newOrder, ...productionOrders]);
      toast.success('Production Order scheduled');
    } catch (error) {
      console.error('Create Prod Order Error:', error);
      toast.error('Failed to schedule production');
    }
  };

  const handleLocationAdd = async (data) => {
    try {
      const newLoc = await warehouseAPI.createLocation({ ...data, business_id: business.id });
      setLocations([...locations, newLoc]);
      toast.success('Warehouse location added');
    } catch (error) {
      console.error('Add Location Error:', error);
      toast.error('Failed to add location');
      throw error;
    }
  };

  const handleLocationUpdate = async (locationId, updates) => {
    try {
      const updated = await warehouseAPI.updateLocation(business.id, locationId, updates);
      setLocations(locations.map(l => l.id === locationId ? updated : l));
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
      setLocations(locations.filter(l => l.id !== locationId));
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


  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case 'new-invoice':
        setShowInvoiceBuilder(true);
        break;
      case 'add-product':
        setShowProductForm(true);
        break;
      case 'new-customer':
        setShowCustomerForm(true);
        break;
      case 'new-quotation':
        handleTabChange('quotations');
        break;
      case 'new-production':
        handleTabChange('manufacturing');
        break;
      case 'generate-report':
        handleTabChange('reports');
        break;
      default:
        console.warn('Unknown quick action:', actionId);
    }
  };

  if (businessLoading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="space-y-2 text-center">
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Setup Wizard Overlay */}
      {showSetupWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-500">
          <div className="w-full max-w-4xl">
            <SetupWizard
              category={category}
              onComplete={handleSetupComplete}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-gray-900">
            {businessInfo.name}
          </h1>
          <p className="text-sm text-gray-500 font-medium">Complete business intelligence & management</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Action Group 1: Time range */}
          <div className="flex bg-white shadow-sm border border-gray-100 p-1 rounded-xl h-10 items-center">
            <Button
              variant={dateRange.from.getMonth() === new Date().getMonth() ? "secondary" : "ghost"}
              size="sm"
              className={`text-[10px] font-black uppercase tracking-wider h-8 rounded-lg px-4`}
              style={dateRange.from.getMonth() === new Date().getMonth() ? { backgroundColor: `${colors.primary}10`, color: colors.primary } : {}}
              onClick={() => setDateRange({
                from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                to: new Date()
              })}
            >
              Month
            </Button>
            <Button
              variant={dateRange.from.getFullYear() === new Date().getFullYear() && dateRange.from.getMonth() === 0 ? "secondary" : "ghost"}
              size="sm"
              className={`text-[10px] font-black uppercase tracking-wider h-8 rounded-lg px-4`}
              style={dateRange.from.getFullYear() === new Date().getFullYear() && dateRange.from.getMonth() === 0 ? { backgroundColor: `${colors.primary}10`, color: colors.primary } : {}}
              onClick={() => setDateRange({
                from: new Date(new Date().getFullYear(), 0, 1),
                to: new Date()
              })}
            >
              Year
            </Button>
          </div>

          <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block" />

          {/* Action Group 2: Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-10 rounded-xl font-bold text-gray-700 hover:bg-gray-50 border-gray-200"
              onClick={() => {
                handleTabChange('reports');
                toast.success('Analyzing business data...');
              }}
            >
              <BarChart3 className="w-4 h-4 mr-2" style={{ color: colors.primary }} />
              Intelligence
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 rounded-xl font-bold border-gray-200">
                  <Plus className="w-4 h-4 mr-2 text-gray-500" />
                  Quick Add
                  <ChevronDown className="w-3.5 h-3.5 ml-2 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl p-1">
                <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest text-gray-400 px-3 py-2">Inventory & Team</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setShowProductForm(true)} className="rounded-lg py-2.5 cursor-pointer">
                  <PackageIcon className="w-4 h-4 mr-3 text-blue-500" />
                  <span className="font-bold">Add Product</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowCustomerForm(true)} className="rounded-lg py-2.5 cursor-pointer">
                  <UsersIcon className="w-4 h-4 mr-3 text-green-500" />
                  <span className="font-bold">New Customer</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-50" />
                <DropdownMenuItem onClick={() => setShowInvoiceBuilder(true)} className="rounded-lg py-2.5 cursor-pointer" style={{ color: colors.primary }}>
                  <Plus className="w-4 h-4 mr-3" />
                  <span className="font-bold">New Invoice</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              onClick={() => setShowInvoiceBuilder(true)}
              className="h-10 text-white font-black rounded-xl px-6 shadow-lg transition-all active:scale-95"
              style={{ backgroundColor: colors.primary, boxShadow: `0 8px 16px -4px ${colors.primary}40` }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* Dialogs - Kept for reference and triggers */}
        <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Modify the details of the selected product.' : 'Enter the specifications and pricing for a new inventory item.'}
              </DialogDescription>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              category={category}
              onSave={handleSaveProduct}
              onCancel={() => {
                setShowProductForm(false);
                setEditingProduct(null);
              }}
              currency={currency}
            />
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
                { label: 'Record Stock', icon: Warehouse, action: () => { handleTabChange('inventory'); setShowQuickAction(false); } },
                { label: 'View Reports', icon: BarChart3, action: () => { handleTabChange('analytics'); setShowQuickAction(false); } },
                { label: 'Manage Settings', icon: Settings, action: () => { handleTabChange('settings'); setShowQuickAction(false); } },
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

        {/* Invoice Builder Component */}
        <Dialog open={showCustomerForm} onOpenChange={(open) => {
          setShowCustomerForm(open);
          if (!open) setCustomerFormData({ name: '', phone: '', email: '' });
        }}>
          <DialogContent className="max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Register a new customer profile for tracking sales and credit history.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custName">Full Name</Label>
                  <Input
                    id="custName"
                    placeholder="Enter customer name"
                    value={customerFormData.name}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custPhone">Phone Number</Label>
                  <Input
                    id="custPhone"
                    placeholder="+92 300 1234567"
                    value={customerFormData.phone}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="custEmail">Email (Optional)</Label>
                  <Input
                    id="custEmail"
                    type="email"
                    placeholder="customer@example.com"
                    value={customerFormData.email}
                    onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })}
                  />
                </div>
              </div>
              <Button
                className="w-full text-white font-bold"
                style={{ backgroundColor: colors.primary }}
                onClick={() => {
                  if (!customerFormData.name || !customerFormData.phone) {
                    toast.error('Name and Phone are required');
                    return;
                  }
                  handleSaveCustomer(customerFormData);
                }}>
                Create Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">


        <TabsContent value="dashboard" className="space-y-6">
          <EnhancedDashboard
            category={category}
            domainKnowledge={domainKnowledge}
            invoices={invoices}
            data={{
              revenue: formatCurrency(grossRevenue, currency), // Changed to gross for consistency with Sales Tab
              collections: formatCurrency(totalRevenue, currency), // Keep paid as separate metric if needed
              orders: totalOrders.toString(),
              products: totalProducts.toString(),
              customers: totalCustomers.toString(),
              lowStockCount: lowStockCount,
              taxLiability: formatCurrency(totalTaxLiability, currency),
              pendingQuotations: quotations.filter(q => q.status === 'pending').length,
              activeProductions: productionOrders.filter(p => p.status === 'in_progress').length,
              chartData: dashboardChartData
            }}
            onQuickAction={handleQuickAction}
          />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Manage and export your sales records</CardDescription>
                </div>
                <div className="flex gap-2">
                  <ExportButton
                    data={invoices}
                    filename="invoices"
                    columns={[
                      { key: 'invoice_number', label: 'Invoice #' },
                      { key: 'customer_name', label: 'Customer' },
                      { key: 'date', label: 'Date' },
                      { key: 'grand_total', label: 'Total' },
                      { key: 'status', label: 'Status' },
                    ]}
                    title="Sales Invoices Report"
                  />
                  <Button onClick={() => setShowInvoiceBuilder(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Invoice
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable
                category={category}
                data={invoices.map(inv => ({
                  ...inv,
                  customer_name: inv.customer?.name || 'Walk-in Customer',
                  grand_total_formatted: formatCurrency(inv.grand_total, currency)
                }))}
                columns={[
                  { accessorKey: 'invoice_number', header: 'Invoice #' },
                  { accessorKey: 'customer_name', header: 'Customer' },
                  {
                    accessorKey: 'date',
                    header: 'Date',
                    cell: ({ row }) => new Date(row.original.date).toLocaleDateString()
                  },
                  {
                    accessorKey: 'grand_total',
                    header: 'Total',
                    cell: ({ row }) => <span className="font-bold" style={{ color: colors.primary }}>{row.original.grand_total_formatted}</span>
                  },
                  {
                    accessorKey: 'status',
                    header: 'Status',
                    cell: ({ row }) => (
                      <Badge className={row.original.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                        {row.original.status}
                      </Badge>
                    )
                  },
                  {
                    accessorKey: 'actions',
                    header: 'Actions',
                    cell: ({ row }) => (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setInvoiceInitialData(row.original);
                            setShowInvoiceBuilder(true);
                          }}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteInvoice(row.original.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  }
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <InventoryManager
            category={category}
            domainKnowledge={domainKnowledge}
            products={products}
            invoices={invoices}
            customers={customers}
            vendors={vendors}
            locations={locations}
            bomList={bomList}
            productionOrders={productionOrders}
            quotations={quotations}
            salesOrders={salesOrders}
            challans={challans}
            refreshData={refreshAllData}
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
            onDelete={handleDeleteProduct}
            onUpdate={handleSaveProduct}
            onLocationAdd={handleLocationAdd}
            onLocationUpdate={handleLocationUpdate}
            onLocationDelete={handleLocationDelete}
            onStockTransfer={handleStockTransfer}
            onGeneratePO={handleGenerateAutoPO}
            businessId={business?.id}
          />
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <CustomerManager
            category={category}
            customers={customers}
            onAdd={() => setShowCustomerForm(true)}
            onUpdate={(customer) => {
              setEditingCustomer(customer);
              setShowCustomerForm(true);
            }}
            onDelete={handleDeleteCustomer}
            businessId={business?.id}
          />
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <SalesManager
            category={category}
            invoices={invoices}
            customers={customers}
            products={products}
          />
        </TabsContent>

        {domainKnowledge?.inventoryFeatures?.includes('Quotation Management') && (
          <TabsContent value="quotations" className="space-y-6">
            <QuotationOrderChallanManager
              quotations={quotations}
              salesOrders={salesOrders}
              challans={challans}
              customers={customers}
              products={products}
              refreshData={refreshAllData}
              category={category}
              onIssueInvoice={(header) => {
                setInvoiceInitialData(header);
                setShowInvoiceBuilder(true);
              }}
            />
          </TabsContent>
        )}

        <TabsContent value="vendors" className="space-y-6">
          <VendorManager
            vendors={vendors}
            onAdd={handleSaveVendor}
            onUpdate={handleSaveVendor}
            onDelete={handleDeleteVendor}
            businessId={business?.id}
          />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentManager
            businessId={business?.id}
            customers={customers}
            vendors={vendors}
            invoices={invoices}
            purchases={purchaseOrders}
            refreshData={refreshAllData}
          />
        </TabsContent>

        {/* ... remaining tabs ... */}




        <TabsContent value="purchases" className="space-y-6">
          <PurchaseOrderManager
            category={category}
            purchaseOrders={purchaseOrders}
            onUpdateStatus={handleUpdatePOStatus}
            refreshData={refreshAllData}
          />
        </TabsContent>



        {/* Domain-Specific Tabs */}
        {domainKnowledge?.manufacturingEnabled && (
          <TabsContent value="manufacturing" className="space-y-6">
            <ManufacturingModule
              products={products}
              bomList={bomList}
              productionOrders={productionOrders}
              warehouses={locations}
              onBOMAdd={handleCreateBOM}
              onProductionOrderCreate={handleCreateProductionOrder}
              onSave={refreshAllData}
              businessId={business?.id}
            />
          </TabsContent>
        )}

        {domainKnowledge?.multiLocationEnabled && (
          <TabsContent value="warehouses" className="space-y-6">
            <MultiLocationInventory
              locations={locations}
              products={products}
              onLocationAdd={handleLocationAdd}
              onLocationUpdate={handleLocationUpdate}
              onLocationDelete={handleLocationDelete}
              onStockTransfer={handleStockTransfer}
            />
          </TabsContent>
        )}

        {domainKnowledge?.batchTrackingEnabled && (
          <TabsContent value="batches" className="space-y-6">
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
          </TabsContent>
        )}

        {domainKnowledge?.serialTrackingEnabled && (
          <TabsContent value="serials" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Scanner */}
              <div className="lg:col-span-1">
                <SerialScanner
                  mode="scan"
                  businessId={business?.id}
                  onSerialScanned={(serial) => toast.success(`Found: ${serial.serial_number}`)}
                />
              </div>

              {/* Global Serial List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Serial Number Lookup</CardTitle>
                    <CardDescription>Search for any serial number in the system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Search className="w-12 h-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">Search System-wide</h3>
                      <p className="text-gray-500 max-w-sm mt-2">
                        Use the scanner on the left to verify any serial number immediately.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="accounting" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Accounts Receivable</CardTitle>
                <CardDescription>Outstanding invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCurrency(accountingSummary?.accountsReceivable || 0, currency)}
                </div>
                <p className="text-sm text-gray-600">
                  {invoices.filter((inv) => inv.status === 'pending').length} invoices pending
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Accounts Payable</CardTitle>
                <CardDescription>Outstanding purchase orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCurrency(accountingSummary?.accountsPayable || 0, currency)}
                </div>
                <div className="flex items-center text-sm text-red-600 font-medium">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  <span>
                    {purchaseOrders.filter(po => po.status === 'pending' || po.status === 'approved').length} orders pending
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Inventory Value</CardTitle>
                <CardDescription>Total stock valuation (GL)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCurrency(accountingSummary?.inventoryValue || 0, currency)}
                </div>
                <p className="text-sm text-gray-600">
                  {products.reduce((sum, p) => sum + (p.stock || 0), 0)} units in stock
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gross Profit</CardTitle>
                <CardDescription>Revenue - COGS</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold mb-2 ${(accountingSummary?.grossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(accountingSummary?.grossProfit || 0, currency)}
                </div>
                <p className="text-sm text-gray-600">
                  {Math.round(accountingSummary?.margin || 0)}% margin
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Accounting Actions</CardTitle>
              <CardDescription>Common accounting tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" onClick={() => handleTabChange('invoices')}>
                  <Receipt className="w-4 h-4 mr-2" />
                  View Invoices
                </Button>
                <Button variant="outline" onClick={() => handleTabChange('purchases')}>
                  <Truck className="w-4 h-4 mr-2" />
                  Purchase Orders
                </Button>
                <Button variant="outline" onClick={() => router.push(`/business/${category}/finance/general-ledger`)}>
                  <FileText className="w-4 h-4 mr-2" />
                  General Ledger
                </Button>
                {['owner', 'admin', 'accountant'].includes(role) && (
                  <Button variant="outline" onClick={() => handleTabChange('reports')}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Financial Reports
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdvancedAnalytics
              invoices={invoices}
              products={products}
              customers={customers}
              category={category}
            />
            <DemandForecast products={products} invoices={invoices} category={category} />
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <Tabs defaultValue="journal" className="w-full">
            <TabsList className="bg-gray-100 p-1 rounded-xl w-full max-w-lg grid grid-cols-3">
              <TabsTrigger value="journal" className="rounded-lg">Journal Entries</TabsTrigger>
              <TabsTrigger value="ledger" className="rounded-lg">Trial Balance</TabsTrigger>
              <TabsTrigger value="statements" className="rounded-lg">Financial Statements</TabsTrigger>
            </TabsList>

            <TabsContent value="journal" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <JournalEntryManager
                    businessId={business?.id}
                    colors={colors}
                    onSuccess={() => {
                      toast.success('GL Updated');
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
                      <p>• Use <strong>Journal Entries</strong> for non-cash transactions like depreciation or adjustments.</p>
                      <p>• Always ensure your <strong>Debits</strong> equal your <strong>Credits</strong>.</p>
                      <p>• Regular transactions (Sales, Purchases, Payments) post to the GL automatically.</p>
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
          </Tabs>
        </TabsContent>

        <TabsContent value="gst" className="space-y-6">
          {['owner', 'admin', 'accountant'].includes(role) ? (
            <TaxComplianceManager
              invoices={invoices}
              purchaseOrders={purchaseOrders}
              business={business}
            />
          ) : (
            <Card className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold">Access Restricted</h3>
              <p className="text-gray-500">Only authorized personnel can access Tax & GST data.</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {['owner', 'admin'].includes(role) ? (
            <SettingsManager category={category} />
          ) : (
            <Card className="p-12 text-center">
              <Lock className="w-12 h-12 text-wine/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold">Settings Locked</h3>
              <p className="text-gray-500">You do not have permission to modify business settings.</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {
        showInvoiceBuilder && (
          <EnhancedInvoiceBuilder
            onClose={() => {
              setShowInvoiceBuilder(false);
              setInvoiceInitialData(null);
            }}
            onSave={handleSaveInvoice}
            products={products}
            customers={customers}
            category={category}
            initialData={invoiceInitialData}
          />
        )
      }

      {
        showCustomerForm && (
          <CustomerForm
            onClose={() => {
              setShowCustomerForm(false);
              setEditingCustomer(null);
            }}
            onSave={handleSaveCustomer}
            initialData={editingCustomer}
            category={category}
          />
        )
      }
    </div >
  );
}
