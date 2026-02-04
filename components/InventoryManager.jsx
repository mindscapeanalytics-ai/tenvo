'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Package,
  Layers,
  Hash,
  ScanBarcode,
  Eye,
  Edit,
  Trash2,
  Factory,
  Warehouse,
  FileText,
  BarChart3,
  BrainCircuit,
  TrendingUp,
  Settings,
  Keyboard
} from 'lucide-react';
import { DataTable } from './DataTable';
import { getDomainColors } from '@/lib/domainColors';
import { cn } from '@/lib/utils';
import { BusyGrid } from './BusyGrid';
import { getDomainTableColumns, normalizeKey } from '@/lib/utils/domainHelpers';
import { ShortcutsHelp } from './inventory/ShortcutsHelp';
import { AdvancedSearch } from './AdvancedSearch';
import { SmartRestockEngine } from './SmartRestockEngine';
import { DemandForecast } from './DemandForecast';
import { ExportButton } from './ExportButton';
import { BarcodeScanner } from './BarcodeScanner';
import { AdvancedInventoryFeatures } from './AdvancedInventoryFeatures';
import { MultiLocationInventory } from './MultiLocationInventory';
import { ManufacturingModule } from './ManufacturingModule';
import { QuotationOrderChallanManager } from './QuotationOrderChallanManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'react-hot-toast';
import { useBusiness } from '@/lib/context/BusinessContext';
import { formatCurrency } from '@/lib/currency';
import { VariantMatrixEditor } from './inventory/VariantMatrixEditor';
import { BatchManager } from './inventory/BatchManager';
import { SerialScanner } from './inventory/SerialScanner';
import { PriceListManager } from './inventory/PriceListManager';
import { DiscountSchemeManager } from './inventory/DiscountSchemeManager';
import { StockReservation } from './inventory/StockReservation';
import { StockAdjustment } from './inventory/StockAdjustment';
import { AutoReorderManager } from './inventory/AutoReorderManager';
import { exportProducts } from '@/lib/utils/export';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductForm } from './ProductForm';
import { isBatchTrackingEnabled, isSerialTrackingEnabled, isSizeColorMatrixEnabled } from '@/lib/utils/domainHelpers';
import { VariantManager } from './domain/VariantManager';
import { ProductDetailsDialog } from './ProductDetailsDialog';
import { CustomParametersManager } from './inventory/CustomParametersManager';

/**
 * Inventory Manager Component
 * A comprehensive dashboard for managing products, batches, serials, and inventory logistics.
 */
export function InventoryManager({
  products = [],
  invoices = [],
  customers = [],
  locations = [],
  bomList = [],
  productionOrders = [],
  quotations = [],
  salesOrders = [],
  challans = [],
  businessId,
  category = 'retail-shop',
  domainKnowledge = {},
  onUpdate,
  onAdd,
  onQuickAdd,
  onEdit,
  onDelete,
  onIssueInvoice,
  onLocationAdd,
  onLocationUpdate,
  onLocationDelete,
  onStockTransfer,
  refreshData
}) {
  const colors = getDomainColors(category);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'busy'

  // New feature dialogs
  const [showBatchManager, setShowBatchManager] = useState(false);
  const [showSerialScanner, setShowSerialScanner] = useState(false);
  const [showVariantEditor, setShowVariantEditor] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductFormInternal, setShowProductFormInternal] = useState(false);
  const [productToView, setProductToView] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productsToBulkDelete, setProductsToBulkDelete] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Domain Feature Flags
  const isBatchEnabled = domainKnowledge?.batchTrackingEnabled;
  const isSerialEnabled = domainKnowledge?.serialTrackingEnabled;
  const isExpiryEnabled = domainKnowledge?.expiryTrackingEnabled;
  const isMultiLocationEnabled = domainKnowledge?.multiLocationEnabled;
  const isManufacturingEnabled = domainKnowledge?.manufacturingEnabled;
  const isVariantEnabled = domainKnowledge?.productFields?.some(f => f.includes('Size') || f.includes('Color') || f.includes('Matrix'));

  // Keyboard Shortcuts for Tab Switching
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      // ALT + 1 through 5 for Main Tabs
      if (e.altKey && e.key >= '1' && e.key <= '5') {
        const tabMap = {
          '1': 'products',
          '2': 'locations',
          '3': 'manufacturing',
          '4': 'orders',
          '5': 'reports'
        };
        const target = tabMap[e.key];
        if (target) {
          e.preventDefault();
          setActiveTab(target);
          toast.success(`Tab: ${target.toUpperCase()}`, { duration: 1000, position: 'bottom-center' });
        }
      }
      // ALT + V (Visual) or ALT + B (Busy)
      if (e.altKey && (e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 'b')) {
        const mode = e.key.toLowerCase() === 'v' ? 'visual' : 'busy';
        e.preventDefault();
        setViewMode(mode);
        toast.success(`Mode: ${mode.toUpperCase()}`, { duration: 1000, position: 'bottom-center' });
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, []);

  const calculateLowStock = () => {
    return products.filter(p => p.stock <= (p.minStock || 0));
  };

  // ABC Analysis
  const performABCAnalysis = () => {
    const sorted = [...products].sort((a, b) => (b.price * b.stock) - (a.price * a.stock));
    const totalValue = sorted.reduce((sum, p) => sum + (p.price * p.stock), 0);
    let cumulative = 0;

    return sorted.map(p => {
      const value = p.price * p.stock;
      cumulative += value;
      const percentage = (cumulative / totalValue) * 100;
      let category = 'C';
      if (percentage <= 80) category = 'A';
      else if (percentage <= 95) category = 'B';

      return { ...p, category, value, percentage };
    });
  };

  // Demand forecasting (simple moving average)
  const forecastDemand = (product) => {
    // Mock: In real app, this would use historical sales data
    const avgSales = product.avgMonthlySales || 0;
    const leadTime = product.leadTime || 7; // days
    const safetyStock = avgSales * (leadTime / 30) * 1.5;
    return Math.ceil(safetyStock);
  };

  const getDomainBatchLabel = (cat) => {
    switch (cat) {
      case 'textile-wholesale': return 'ROLL / BALE';
      case 'garments': return 'LOT INFO';
      case 'electronics': return 'BATCH ID';
      case 'food-beverages': return 'BATCH CODE';
      default: return 'BATCH INFO';
    }
  };

  const getDomainSerialLabel = (cat) => {
    switch (cat) {
      case 'mobile-phones':
      case 'telecom': return 'IMEI LIST';
      case 'auto-parts': return 'CHASSIS NO';
      case 'electronics': return 'SERIALS';
      default: return 'SERIALS';
    }
  };

  // Column Definitions with Optimized Widths & Alignment
  const columns = useMemo(() => {
    // Base Columns with Professional Styling
    const baseCols = [
      {
        id: 'actions',
        header: '',
        size: 50,
        minSize: 50,
        maxSize: 50,
        enableResizing: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-gray-100">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-3.5 w-3.5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setProductToView(row.original)} className="text-sm">
                <Eye className="mr-2 h-3.5 w-3.5" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setEditingProduct(row.original); setShowProductFormInternal(true); }} className="text-sm">
                <Edit className="mr-2 h-3.5 w-3.5" /> Edit Product
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isBatchEnabled && (
                <DropdownMenuItem onClick={() => { setSelectedProduct(row.original); setShowBatchManager(true); }} className="text-sm">
                  <Package className="mr-2 h-3.5 w-3.5" /> Manage Batches
                </DropdownMenuItem>
              )}
              {isSerialEnabled && (
                <DropdownMenuItem onClick={() => { setSelectedProduct(row.original); setShowSerialScanner(true); }} className="text-sm">
                  <Hash className="mr-2 h-3.5 w-3.5" /> Serial Numbers
                </DropdownMenuItem>
              )}
              {isVariantEnabled && (
                <DropdownMenuItem onClick={() => { setSelectedProduct(row.original); setShowVariantEditor(true); }} className="text-sm">
                  <Layers className="mr-2 h-3.5 w-3.5" /> Manage Variants
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => { setSelectedProduct(row.original); setShowAdvancedFeatures(true); }} className="text-sm">
                <Settings className="mr-2 h-3.5 w-3.5" /> Advanced Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setProductToDelete(row.original)} className="text-red-600 focus:text-red-600 focus:bg-red-50 text-sm">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: 'PRODUCT NAME',
        size: 220,
        minSize: 180,
        cell: ({ row }) => (
          <div className="flex flex-col py-1">
            <span className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">{row.original.name}</span>
            {row.original.brand && <span className="text-[11px] text-gray-500 mt-0.5">{row.original.brand}</span>}
          </div>
        ),
      },
      {
        id: 'sku',
        accessorKey: 'sku',
        header: 'SKU',
        size: 110,
        minSize: 90,
        cell: ({ row }) => <span className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200">{row.original.sku || '-'}</span>
      },
      {
        id: 'category',
        accessorKey: 'category',
        header: 'CATEGORY',
        size: 130,
        minSize: 110,
        cell: ({ row }) => (
          <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-700 border border-gray-200">
            {row.original.category}
          </span>
        )
      },
      {
        id: 'stock',
        accessorKey: 'stock',
        header: () => <div className="text-right font-semibold">STOCK</div>,
        size: 90,
        minSize: 80,
        cell: ({ row }) => {
          const stock = row.original.stock || 0;
          const minStock = row.original.min_stock || row.original.minStock || 10;
          const isLow = stock <= minStock;

          return (
            <div className="flex items-center justify-end gap-2 pr-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                stock <= 0 ? "bg-red-500 animate-pulse" :
                  isLow ? "bg-amber-500" : "bg-emerald-500"
              )} />
              <span className={cn(
                "font-bold text-sm tabular-nums",
                stock <= 0 ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-700'
              )}>{stock}</span>
              {isLow && <Badge variant="outline" className="text-[10px] py-0 h-4 px-1 bg-amber-50 text-amber-600 border-amber-200">LOW</Badge>}
            </div>
          );
        },
      },
      {
        id: 'price',
        accessorKey: 'price',
        header: () => <div className="text-right font-semibold">PRICE</div>,
        size: 110,
        minSize: 100,
        cell: ({ row }) => <div className="text-right font-semibold text-sm text-gray-900 tabular-nums pr-2">{formatCurrency(row.original.price || 0, 'PKR')}</div>
      },
      {
        id: 'value',
        accessorKey: 'value',
        header: () => <div className="text-right font-semibold">VALUE</div>,
        size: 120,
        minSize: 110,
        cell: ({ row }) => <div className="text-right text-sm text-gray-600 font-medium tabular-nums pr-2">{formatCurrency((row.original.price || 0) * (row.original.stock || 0), 'PKR')}</div>
      }
    ];

    // Extended Features Columns (Batch, Expiry, Manufacturing) - Professional Styling
    if (isBatchEnabled) {
      baseCols.push({
        id: 'batch_number',
        accessorKey: 'batch_number',
        header: getDomainBatchLabel(category),
        size: 130,
        minSize: 110,
        cell: ({ row }) => {
          const batches = row.original.batches || [];
          const singleBatch = row.original.batch_number;

          if (batches.length > 0) {
            return (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-[10px]">
                {batches.length} {batches.length === 1 ? 'Batch' : 'Batches'}
              </Badge>
            );
          }
          return singleBatch ? (
            <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
              {singleBatch}
            </span>
          ) : <span className="text-gray-300">-</span>;
        }
      });
    }

    if (isSerialEnabled) {
      baseCols.push({
        id: 'serials',
        accessorKey: 'serial_numbers',
        header: getDomainSerialLabel(category),
        size: 110,
        minSize: 100,
        cell: ({ row }) => {
          const serials = row.original.serial_numbers || [];
          if (serials.length > 0) {
            return (
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[10px]">
                {serials.length} Items
              </Badge>
            );
          }
          return <span className="text-gray-300">-</span>;
        }
      });
    }

    if (isManufacturingEnabled) {
      baseCols.push({
        id: 'mfg_date',
        accessorKey: 'manufacturing_date',
        header: 'MFG DATE',
        size: 100,
        minSize: 90,
        cell: ({ row }) => <span className="text-xs text-gray-500">{row.original.manufacturing_date ? new Date(row.original.manufacturing_date).toLocaleDateString('en-GB') : '-'}</span>
      });
    }

    if (isExpiryEnabled) {
      baseCols.push({
        id: 'expiry_date',
        accessorKey: 'expiry_date',
        header: 'EXPIRY',
        size: 100,
        minSize: 90,
        cell: ({ row }) => {
          const expiry = row.original.expiry_date;
          if (!expiry) return <span className="text-gray-300">-</span>;

          const isExpired = new Date(expiry) < new Date();
          const isExpiringSoon = new Date(expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          return (
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded",
              isExpired ? 'bg-red-50 text-red-600 border border-red-100' :
                isExpiringSoon ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                  'text-gray-600'
            )}>
              {new Date(expiry).toLocaleDateString('en-GB')}
            </span>
          );
        }
      });
    }

    // Domain Specific Columns (Dynamic) - Clean & Compact
    if (domainKnowledge?.productFields) {
      const standardFields = ['name', 'price', 'stock', 'category', 'sku', 'barcode', 'expiry_date', 'batch_number', 'manufacturing_date', 'brand', 'images'];

      domainKnowledge.productFields.forEach(field => {
        const attrKey = normalizeKey(field);
        if (standardFields.includes(attrKey)) return;

        baseCols.push({
          id: `domain_${attrKey}`,
          header: field.replace(/_/g, ' ').toUpperCase(),
          accessorKey: `domain_data.${attrKey}`,
          size: 120,
          minSize: 100,
          cell: ({ row }) => {
            // Robust data retrieval strategy
            const normalized = normalizeKey(field);
            const snakeCase = field.toLowerCase().replace(/\s+/g, '_');
            const raw = field;

            const val =
              row.original.domain_data?.[normalized] ||
              row.original.domain_data?.[snakeCase] ||
              row.original.domain_data?.[raw] ||
              row.original[normalized] ||
              row.original[snakeCase] ||
              row.original.attributes?.[normalized] ||
              '-';

            return <span className="text-xs text-gray-600 line-clamp-1">{String(val)}</span>;
          }
        });
      });
    }

    return baseCols;
  }, [domainKnowledge, isExpiryEnabled, isBatchEnabled, isManufacturingEnabled, isSerialEnabled, isVariantEnabled, category]);

  // Removed standard columns.push since it's now in useMemo initialization


  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();

    // Standard checks
    if (p.name.toLowerCase().includes(term)) return true;
    if (p.sku?.toLowerCase().includes(term)) return true;

    // Domain field checks
    if (domainKnowledge?.productFields) {
      return domainKnowledge.productFields.some(field => {
        const key = normalizeKey(field);
        const val = p.domain_data?.[key] || p.attributes?.[key];
        return val && String(val).toLowerCase().includes(term);
      });
    }

    return false;
  });

  const abcAnalysis = performABCAnalysis();

  const handleBulkDelete = (items) => {
    setProductsToBulkDelete(items);
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const deletePromises = productsToBulkDelete.map(p => onDelete(p.id));
      await Promise.all(deletePromises);
      toast.success(`Successfully deleted ${productsToBulkDelete.length} items`);
      setProductsToBulkDelete([]);
      setShowBulkDeleteConfirm(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some items');
    }
  };

  // Shared Actions column for both views
  const gridColumns = useMemo(() => {
    const actionsCol = columns.find(c => c.id === 'actions');
    return [
      actionsCol, // Actions column first
      ...getDomainTableColumns(category)
    ].filter(Boolean);
  }, [category, columns]);



  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-600">Complete inventory system with all Busy.in features</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 p-1 rounded-lg flex items-center mr-2 border border-gray-200">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'visual' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              style={viewMode === 'visual' ? { color: colors.primary } : {}}
            >
              Visual View
            </button>
            <button
              onClick={() => setViewMode('busy')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === 'busy' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              style={viewMode === 'busy' ? { color: colors.primary } : {}}
            >
              Busy Mode (Fast)
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-green-700 uppercase tracking-tighter">Real-time Sync Active</span>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton
              data={products}
              filename="inventory_report"
              columns={[
                { key: 'name', label: 'Product Name' },
                { key: 'sku', label: 'SKU' },
                { key: 'category', label: 'Category' },
                { key: 'stock', label: 'Stock' },
                { key: 'price', label: 'Price' }
              ]}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBarcodeScanner(true)}
              className="h-10 rounded-xl font-bold border-gray-200"
            >
              <ScanBarcode className="w-4 h-4 mr-2" />
              Scan
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShortcutsHelp(true)}
              className="h-10 rounded-xl font-bold border-gray-200"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Shortcuts
            </Button>
            <Button
              size="sm"
              onClick={onAdd}
              className="h-10 text-white rounded-xl shadow-lg px-6 font-black"
              style={{ backgroundColor: colors.primary, boxShadow: `0 8px 16px -4px ${colors.primary}40` }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="products">
            <Package className="w-4 h-4 mr-2" />
            Products
          </TabsTrigger>
          {isMultiLocationEnabled && (
            <TabsTrigger value="locations">
              <Warehouse className="w-4 h-4 mr-2" />
              Locations
            </TabsTrigger>
          )}
          {isManufacturingEnabled && (
            <TabsTrigger value="manufacturing">
              <Factory className="w-4 h-4 mr-2" />
              Manufacturing
            </TabsTrigger>
          )}
          <TabsTrigger value="orders">
            <FileText className="w-4 h-4 mr-2" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">

          {/* Alerts and Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-black">{products.length}</p>
                </div>
                <Package className="w-8 h-8" style={{ color: colors.primary }} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600">{calculateLowStock().length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-black">
                    {formatCurrency(products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0), 'PKR')}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ABC Category A</p>
                  <p className="text-2xl font-bold text-black">
                    {abcAnalysis.filter(p => p.category === 'A').length}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8" style={{ color: colors.primary }} />
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          {calculateLowStock().length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-900">Low Stock Alerts</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {calculateLowStock().slice(0, 6).map(product => (
                  <div key={product.id} className="flex items-center justify-between bg-white p-2 rounded">
                    <span className="text-sm font-medium">{product.name}</span>
                    <span className="text-sm text-red-600">
                      Stock: {product.stock} (Min: {product.minStock || 0})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <AdvancedSearch
            onSearch={(term) => setSearchTerm(term)}
            placeholder="Search products by name or SKU..."
            filters={[
              { key: 'category', label: 'Category', type: 'select', options: [] },
              {
                key: 'stock', label: 'Stock Status', type: 'select', options: [
                  { value: 'low', label: 'Low Stock' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'high', label: 'High Stock' },
                ]
              },
            ]}
          />

          {/* Data Table or Busy Grid */}
          <div className="bg-white rounded-lg border border-gray-200 p-0 overflow-hidden">
            {viewMode === 'busy' ? (
              <div className="h-[600px]">
                <BusyGrid
                  data={filteredProducts}
                  columns={gridColumns}
                  category={category}
                  onRowClick={(product) => {
                    setEditingProduct(product);
                    setShowProductFormInternal(true);
                  }}
                  onAddRow={async () => {
                    // One-click quick add for Busy Mode
                    if (onQuickAdd) {
                      await onQuickAdd();
                    } else {
                      await onAdd?.();
                    }
                  }}
                  onDeleteRow={(product) => setProductToDelete(product)}
                  onAdvancedSettings={(product) => { setSelectedProduct(product); setShowAdvancedFeatures(true); }}
                  onCellEdit={(product, field, value) => {
                    // Update state immediately for responsiveness
                    let processedValue = value;
                    const numericFields = [
                      'stock', 'price', 'cost_price', 'costPrice',
                      'minStock', 'min_stock', 'maxStock', 'max_stock',
                      'reorderPoint', 'reorder_point', 'reorderQuantity', 'reorder_quantity',
                      'mrp', 'taxPercent', 'tax_percent'
                    ];

                    if (numericFields.includes(field) || field.includes('width') || field.includes('length')) {
                      processedValue = parseFloat(value) || 0;
                    }

                    const updatedProduct = JSON.parse(JSON.stringify(product)); // Deep clone

                    // Handle nested keys (e.g., 'domain_data.article')
                    if (field.includes('.')) {
                      const parts = field.split('.');
                      let current = updatedProduct;
                      for (let i = 0; i < parts.length - 1; i++) {
                        if (!current[parts[i]]) current[parts[i]] = {};
                        current = current[parts[i]];
                      }
                      current[parts[parts.length - 1]] = processedValue;
                    } else {
                      // Check if it's a domain field that should be in domain_data
                      const isDomainField = domainKnowledge?.productFields?.some(f => normalizeKey(f) === field);
                      if (isDomainField) {
                        updatedProduct.domain_data = {
                          ...(updatedProduct.domain_data || {}),
                          [field]: processedValue
                        };
                      } else {
                        updatedProduct[field] = processedValue;
                      }
                    }

                    // Show instantaneous feedback
                    toast.success(`Updated ${field}`, { id: `save-${field}`, position: 'bottom-right' });

                    onUpdate?.(updatedProduct);
                  }}
                />
              </div>
            ) : (
              <div className="p-4">
                <DataTable
                  category={category}
                  data={filteredProducts}
                  columns={columns}
                  searchable={false}
                  exportable={true}
                  onBulkDelete={handleBulkDelete}
                  onExport={async (items) => {
                    const dataToExport = items || filteredProducts;
                    try {
                      await exportProducts(dataToExport, 'excel');
                      toast.success(`Exported ${dataToExport.length} items successfully`);
                    } catch (error) {
                      toast.error('Failed to export inventory');
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* ABC Analysis Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">ABC Analysis</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">A</div>
                <p className="text-sm text-gray-600">High Value (80%)</p>
                <p className="text-lg font-semibold">{abcAnalysis.filter(p => p.category === 'A').length} items</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">B</div>
                <p className="text-sm text-gray-600">Medium Value (15%)</p>
                <p className="text-lg font-semibold">{abcAnalysis.filter(p => p.category === 'B').length} items</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">C</div>
                <p className="text-sm text-gray-600">Low Value (5%)</p>
                <p className="text-lg font-semibold">{abcAnalysis.filter(p => p.category === 'C').length} items</p>
              </div>
            </div>
          </div>

        </TabsContent>



        {/* Variants Tab */}
        {isVariantEnabled && (
          <TabsContent value="variants" className="space-y-6">
            {selectedProduct ? (
              <VariantManager
                value={selectedProduct.variants || []}
                onChange={(variants) => {
                  onUpdate?.({ ...selectedProduct, variants });
                  setSelectedProduct({ ...selectedProduct, variants });
                }}
                product={selectedProduct}
                category={category}
                currency="PKR"
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Layers className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">Select a product from the Products tab to manage variants</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Price Lists</CardTitle>
                <CardDescription>Manage multiple price lists for different scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <PriceListManager
                  priceLists={[]}
                  products={products}
                  customers={[]}
                  onSave={(lists) => {
                    toast.success('Price lists updated');
                  }}
                  currency="PKR"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Discount Schemes</CardTitle>
                <CardDescription>Manage discount rules and promotions</CardDescription>
              </CardHeader>
              <CardContent>
                <DiscountSchemeManager
                  schemes={[]}
                  products={products}
                  customers={[]}
                  onSave={(schemes) => {
                    toast.success('Discount schemes updated');
                  }}
                  currency="PKR"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Locations Tab */}
        {isMultiLocationEnabled && (
          <TabsContent value="locations" className="space-y-6">
            <MultiLocationInventory
              locations={locations}
              products={products}
              category={category}
              domainKnowledge={domainKnowledge}
              businessId={businessId}
              refreshData={refreshData}
              onAdd={onLocationAdd}
              onUpdate={onLocationUpdate}
              onDelete={onLocationDelete}
              onStockTransfer={onStockTransfer}
            />
          </TabsContent>
        )}

        {/* Manufacturing Tab */}
        {isManufacturingEnabled && (
          <TabsContent value="manufacturing" className="space-y-6">
            <ManufacturingModule
              products={products}
              bomList={bomList}
              productionOrders={productionOrders}
              businessId={businessId}
              warehouses={locations}
              onSave={() => {
                toast.success('Production updated');
                refreshData?.();
              }}
            />
          </TabsContent>
        )}

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <QuotationOrderChallanManager
            quotations={quotations}
            salesOrders={salesOrders}
            challans={challans}
            customers={customers}
            products={products}
            warehouses={locations}
            refreshData={refreshData}
            category={category}
            onIssueInvoice={onIssueInvoice}
          />

          {/* Additional Order Management Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <StockReservation
              reservations={[]}
              products={products}
              customers={[]}
              onSave={(reservations) => {
                toast.success('Reservations updated');
              }}
              currency="PKR"
            />
            <StockAdjustment
              adjustments={[]}
              products={products}
              onAdjust={(data) => {
                const product = products.find(p => p.id === data.productId);
                if (product) {
                  onUpdate?.({ ...product, stock: data.newStock });
                }
                toast.success('Stock adjusted successfully');
              }}
              currency="PKR"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Auto Reorder Manager</CardTitle>
              <CardDescription>Automatically generate purchase orders for low stock items</CardDescription>
            </CardHeader>
            <CardContent>
              <AutoReorderManager
                products={products}
                vendors={[]}
                onGeneratePO={(poData) => {
                  const product = products.find(p => p.id === poData.productId);
                  toast.success(`Purchase order generated for ${product?.name || 'product'}`);
                }}
                currency="PKR"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-blue-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-blue-900">Total SKU</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-blue-600">{products.length}</p>
                <p className="text-xs text-blue-400 font-medium">Items in inventory</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-emerald-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-emerald-900">Valuation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-emerald-600">
                  {formatCurrency(products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0), 'PKR')}
                </p>
                <p className="text-xs text-emerald-400 font-medium">Market value</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-amber-900">Safety Risk</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-amber-600">{calculateLowStock().length}</p>
                <p className="text-xs text-amber-400 font-medium">Below reorder point</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm bg-purple-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-purple-900">Stock Turnover</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black text-purple-600">4.2x</p>
                <p className="text-xs text-purple-400 font-medium">Monthly average</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Stock Aging Analysis</CardTitle>
                <CardDescription>Breakdown of inventory by time in stock</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: '0-30 Days', val: 65, color: 'bg-green-500' },
                    { label: '31-60 Days', val: 20, color: 'bg-blue-500' },
                    { label: '61-90 Days', val: 10, color: 'bg-amber-500' },
                    { label: '90+ Days', val: 5, color: 'bg-red-500' },
                  ].map(age => (
                    <div key={age.label} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-gray-500">{age.label}</span>
                        <span>{age.val}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${age.color}`} style={{ width: `${age.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Top Performing Categories</CardTitle>
                <CardDescription>By revenue contribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(new Set(products.map(p => p.category))).slice(0, 4).map((cat, i) => (
                    <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-xs">
                          {i + 1}
                        </div>
                        <span className="font-bold text-sm text-gray-700">{cat || 'Uncategorized'}</span>
                      </div>
                      <Badge variant="outline" className="bg-white border-gray-200">
                        {Math.floor(Math.random() * 40 + 10)}% share
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Demand Forecasting */}
          <div className="mt-8">
            <DemandForecast
              products={products}
              invoices={invoices}
              category={category}
              domainKnowledge={domainKnowledge}
            />
          </div>

          {/* Domain-specific reports */}
          {domainKnowledge?.reports && domainKnowledge.reports.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Available Reports</CardTitle>
                <CardDescription>Domain-specific reports based on your business category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {domainKnowledge.reports.map((report, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start h-auto py-3"
                      onClick={() => {
                        toast.success(`Generating ${report}...`);
                        // Report generation logic here
                      }}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      <div className="text-left">
                        <div className="font-medium">{report}</div>
                        <div className="text-xs text-gray-500">Click to generate</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Smart Restock Engine */}
      <div className="mt-8">
        <SmartRestockEngine
          products={products}
          invoices={invoices}
          category={category}
          domainKnowledge={domainKnowledge}
          businessId={businessId}
          refreshData={refreshData}
        />
      </div>

      {/* Advanced Features Modal */}
      {showAdvancedFeatures && selectedProduct && (
        <AdvancedInventoryFeatures
          product={selectedProduct}
          domainKnowledge={domainKnowledge}
          onSave={(data) => {
            onUpdate?.({ ...selectedProduct, ...data });
            toast.success('Advanced features updated');
            setShowAdvancedFeatures(false);
            setSelectedProduct(null);
          }}
          onClose={() => {
            setShowAdvancedFeatures(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScan={(barcode) => {
            toast.success(`Scanned: ${barcode}`);
            setShowBarcodeScanner(false);
          }}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}

      {/* Batch Manager Dialog */}
      <Dialog open={showBatchManager} onOpenChange={setShowBatchManager}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Management</DialogTitle>
            <DialogDescription>
              Manage product batches, tracking numbers, and expiry dates.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <BatchManager
              product={selectedProduct}
              businessId={selectedProduct.business_id}
              warehouseId={locations[0]?.id}
              onBatchCreated={() => {
                toast.success('Batch created successfully');
                onUpdate?.(selectedProduct);
              }}
              onClose={() => setShowBatchManager(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Serial Scanner Dialog */}
      <Dialog open={showSerialScanner} onOpenChange={setShowSerialScanner}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Serial Number Management</DialogTitle>
            <DialogDescription>
              Track individual items by their unique serial numbers or IMEI.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <SerialScanner
              product={selectedProduct}
              businessId={selectedProduct.business_id}
              warehouseId={locations[0]?.id}
              mode="view"
              onSerialScanned={(serial) => {
                toast.success(`Serial scanned: ${serial.serial_number}`);
              }}
              onClose={() => setShowSerialScanner(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Variant Matrix Editor Dialog */}
      <Dialog open={showVariantEditor} onOpenChange={setShowVariantEditor}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Variant Matrix Editor</DialogTitle>
            <DialogDescription>
              Manage product variations across different sizes, colors, and parameters.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <VariantMatrixEditor
              product={selectedProduct}
              businessId={selectedProduct.business_id}
              onVariantsUpdated={() => {
                toast.success('Variants updated successfully');
                onUpdate?.(selectedProduct);
              }}
              onClose={() => setShowVariantEditor(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={showProductFormInternal} onOpenChange={setShowProductFormInternal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm
              product={editingProduct}
              onSave={async (data) => {
                await onUpdate?.({ ...editingProduct, ...data });
                setShowProductFormInternal(false);
                setEditingProduct(null);
                toast.success('Product updated successfully');
              }}
              onCancel={() => {
                setShowProductFormInternal(false);
                setEditingProduct(null);
              }}
              category={category}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Product Details Viewer */}
      <ProductDetailsDialog
        product={productToView}
        open={!!productToView}
        onClose={() => setProductToView(null)}
        category={category}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              <span className="font-semibold text-gray-900"> {productToDelete?.name} </span>
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                onDelete?.(productToDelete.id);
                setProductToDelete(null);
                toast.success('Product deleted');
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feature Dialogs definitions are already handled above with Dialog components */}
      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 font-black uppercase tracking-tighter">
              <Trash2 className="w-5 h-5" />
              Confirm Bulk Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 font-medium">
              This will permanently delete <span className="font-bold text-gray-900">{productsToBulkDelete.length} products</span>.
              This action cannot be undone and will remove all associated stock and batch history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="font-bold uppercase text-xs tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700 font-bold uppercase text-xs tracking-widest">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div >
  );
}

export default InventoryManager;
