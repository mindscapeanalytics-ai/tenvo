'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Barcode, ShoppingCart, Plus, Minus, Trash2, X, CreditCard,
    Banknote, Smartphone, SplitSquareHorizontal, User, Clock, Hash,
    Receipt, CheckCircle2, Star, Gift, ChevronDown, RotateCcw, ArrowLeft,
    Layers, Weight, Package, ScanLine, Volume2, AlertTriangle, Filter,
    Maximize, Minimize, Printer, FileDown, Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { getDomainConfig } from '@/lib/config/domains';
import { buildPosCheckoutPayload, computePosOrderTotals, getPosUiConfig } from '@/lib/utils/posHelpers';
import {
    buildPosDepartments,
    countProductsByDepartment,
    filterProductsByDepartment,
    getPosDomainFlags,
} from '@/lib/config/posDomains';
import { PosSessionBar } from '@/components/pos/shared/PosSessionBar';
import { PosCloseShiftDialog } from '@/components/pos/shared/PosCloseShiftDialog';
import { PosSplitPaymentDialog } from '@/components/pos/shared/PosSplitPaymentDialog';
import { PosProductBrowseGrid } from '@/components/pos/shared/PosProductBrowseGrid';
import { PosCartLines } from '@/components/pos/shared/PosCartLines';
import { PosHeldSalesSheet } from '@/components/pos/shared/PosHeldSalesSheet';
import { PosCameraScanner } from '@/components/pos/shared/PosCameraScanner';
import { getBulkQuickAdds } from '@/lib/utils/posWholesale';
import { canUseBarcodeScan } from '@/lib/utils/barcodeAccess';
import { PosPharmacyBatchDialog } from '@/components/pos/shared/PosPharmacyBatchDialog';
import { PosMobileCheckoutBar } from '@/components/pos/shared/PosMobileCheckoutBar';
import { PosOfflineBanner } from '@/components/pos/shared/PosOfflineBanner';
import { usePosSettings } from '@/lib/hooks/usePosSettings';
import { usePosOffline } from '@/lib/hooks/usePosOffline';
import { usePosOfflineCatalog } from '@/lib/hooks/usePosOfflineCatalog';
import { usePosProductAdd } from '@/lib/hooks/usePosProductAdd';
import { planHasFeatureWithPackaging } from '@/lib/subscription/effectivePlanAccess';
import {
    getPosShellHeightClass,
    POS_SHELL_FOOTER,
} from '@/lib/utils/posLayout';
import { usePosFullscreen } from '@/lib/hooks/usePosFullscreen';
import { usePosReceipt } from '@/lib/hooks/usePosReceipt';
import { getEffectiveProductImageUrl } from '@/lib/storefront/productImageFallback';
import { PosHotkeyDock } from '@/components/pos/shared/PosHotkeyDock';
import { PosTaxPanel } from '@/components/pos/shared/PosTaxPanel';
import { usePosManagerGate } from '@/components/pos/shared/PosManagerPinGate';
import { PosCashToolsPanel } from '@/components/pos/shared/PosCashToolsPanel';
import { usePosHotkeys, focusPosScanInput } from '@/lib/hooks/usePosHotkeys';
import { usePosHeldSales } from '@/lib/hooks/usePosHeldSales';
import { usePosTaxConfig } from '@/lib/hooks/usePosTaxConfig';
import { nextPosPaymentMethod } from '@/lib/config/posHotkeys';
import { computePosCartTax } from '@/lib/utils/posTaxComponents';
import { openCashDrawer } from '@/lib/utils/posCashDrawer';
import toast from 'react-hot-toast';

// --- Department Filter Bar ---------------------------------------------------

function DepartmentBar({ departments, activeDepartment, onDepartmentChange, productCounts }) {
    return (
        <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-thin
                        bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            {departments.map(dept => {
                const count = productCounts[dept.key] || 0;
                const isActive = activeDepartment === dept.key;
                if (dept.key !== 'all' && count === 0) return null;

                return (
                    <button
                        key={dept.key}
                        onClick={() => onDepartmentChange(dept.key)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0',
                            isActive
                                ? `${dept.color} text-white shadow-lg`
                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                        )}
                    >
                        <span className="text-sm">{dept.icon}</span>
                        <span>{dept.label}</span>
                        {dept.key !== 'all' && (
                            <span className={cn(
                                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none",
                                isActive ? "bg-white/20" : "bg-gray-100 text-gray-500"
                            )}>
                                {count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

// --- Barcode Scanner Input ---------------------------------------------------

function BarcodeScannerInput({ onScan, onSearchChange, searchTerm, isScanning }) {
    const inputRef = useRef(null);
    const scanBufferRef = useRef('');
    const scanTimerRef = useRef(null);

    useEffect(() => {
        // Auto-focus the barcode input on mount
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = useCallback((e) => {
        // Barcode scanners typically send Enter after the barcode
        if (e.key === 'Enter' && scanBufferRef.current.length >= 3) {
            e.preventDefault();
            onScan(scanBufferRef.current.trim());
            scanBufferRef.current = '';
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        // Buffer rapid keystrokes (barcode scanner speed)
        clearTimeout(scanTimerRef.current);
        scanBufferRef.current += e.key.length === 1 ? e.key : '';
        scanTimerRef.current = setTimeout(() => {
            scanBufferRef.current = '';
        }, 200); // Scanner sends chars faster than 200ms between keys
    }, [onScan]);

    return (
        <div className="relative flex-1">
            <ScanLine className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors",
                isScanning ? "text-emerald-500 animate-pulse" : "text-gray-400"
            )} />
            <Input
                ref={inputRef}
                data-pos-role="scan"
                placeholder="Scan barcode or type product name... (F1)"
                className="pl-11 h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white text-sm font-medium
                           focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck={false}
            />
            {searchTerm && (
                <button
                    onClick={() => {
                        onSearchChange('');
                        inputRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            )}
        </div>
    );
}

// --- Cart Summary (Right Panel) — lines live here, browse stays left --------

function CartSummary({
    items, customer, onCustomerSelect,
    discount = 0, onDiscountChange, discountType = 'fixed', onDiscountTypeChange,
    onPaymentMethodSelect,
    onCompleteSale, onHoldSale, onClearSale, isProcessing,
    currency = 'Rs.', heldOrders = [], onOpenHeldSales, onPrintBill, onDownloadBillPdf,
    onBack, taxLabel = 'Tax', taxBreakdown = [], discountInputRef,
    onOpenTax, taxMode = 'standard', taxEnabled = true,
    businessCategory,
    onQuantityChange, onWeightChange, onRemoveItem,
    showBulkQuickAdds = false, bulkQuickAdds = [5, 12],
}) {
    const itemCount = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const totalTax = items.reduce((sum, i) => {
        const itemTax = (i.unitPrice * i.quantity) * ((i.taxPercent || 0) / 100);
        return sum + itemTax;
    }, 0);
    const taxAmount = Math.round(totalTax * 100) / 100;
    const rawDiscount = parseFloat(discount || 0) || 0;
    const discountAmount = discountType === 'percentage'
        ? Math.round(subtotal * (rawDiscount / 100) * 100) / 100
        : rawDiscount;
    const total = Math.round((subtotal + taxAmount - discountAmount) * 100) / 100;
    const showBreakdown = Array.isArray(taxBreakdown) && taxBreakdown.length > 1;

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white touch-manipulation min-h-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 max-lg:px-3 py-3 max-lg:py-2 border-b border-slate-700/50 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    {onBack ? (
                        <button type="button" onClick={onBack} className="p-1.5 -ml-1 rounded-lg hover:bg-slate-800" aria-label="Back">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                    ) : null}
                    <ShoppingCart className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-sm font-semibold tracking-tight">CART</span>
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {items.length} items * {itemCount} qty
                    </Badge>
                </div>
                {heldOrders.length > 0 && (
                    <button
                        type="button"
                        onClick={onOpenHeldSales}
                        className="inline-flex"
                        aria-label={`Open ${heldOrders.length} held sales`}
                    >
                        <Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px] cursor-pointer hover:bg-amber-500/10">
                            <Clock className="w-3 h-3 mr-1" />
                            {heldOrders.length} held
                        </Badge>
                    </button>
                )}
            </div>

            <div className="px-3 py-2 border-b border-slate-800 shrink-0">
                <button
                    type="button"
                    onClick={onCustomerSelect}
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors text-xs"
                >
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-300 flex-1 text-left truncate">{customer?.name || 'Walk-in Customer'}</span>
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
            </div>

            <PosCartLines
                items={items}
                currency={currency}
                businessCategory={businessCategory}
                theme="dark"
                onQuantityChange={onQuantityChange}
                onWeightChange={onWeightChange}
                onRemoveItem={onRemoveItem}
                showBulkQuickAdds={showBulkQuickAdds}
                bulkQuickAdds={bulkQuickAdds}
                emptyTitle="Cart is empty"
                emptyHint="Scan or tap products on the left to add"
            />

            <div className="shrink-0 border-t border-slate-700/50 px-4 py-3 space-y-2">
                <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-400">
                        <span>Subtotal ({items.length} items)</span>
                        <span>{currency}{subtotal.toLocaleString()}</span>
                    </div>
                    {taxEnabled && showBreakdown ? (
                        taxBreakdown.map((row) => (
                            <button
                                key={row.key}
                                type="button"
                                onClick={onOpenTax}
                                disabled={!onOpenTax}
                                className="flex w-full justify-between text-gray-400 enabled:hover:text-emerald-300 disabled:cursor-default"
                            >
                                <span>{row.label} ({row.rate}%)</span>
                                <span>{currency}{row.amount.toLocaleString()}</span>
                            </button>
                        ))
                    ) : taxEnabled ? (
                        <button
                            type="button"
                            onClick={onOpenTax}
                            disabled={!onOpenTax}
                            className="flex w-full justify-between text-gray-400 enabled:hover:text-emerald-300 disabled:cursor-default"
                        >
                            <span>{taxLabel}{taxMode && taxMode !== 'standard' ? ` · ${taxMode === 'gst_only' ? 'GST only' : 'Exempt'}` : ''}</span>
                            <span>{currency}{taxAmount.toLocaleString()}</span>
                        </button>
                    ) : null}
                    <div className="flex items-center justify-between text-gray-400 gap-2">
                        <span>Discount</span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => onDiscountTypeChange?.(discountType === 'fixed' ? 'percentage' : 'fixed')}
                                className="h-6 px-1.5 rounded text-[9px] font-semibold border border-slate-700 bg-slate-800 text-slate-300 hover:border-emerald-500/40"
                                aria-label="Toggle discount type"
                            >
                                {discountType === 'percentage' ? '%' : currency}
                            </button>
                            <Input
                                ref={discountInputRef}
                                type="number"
                                data-pos-role="discount"
                                value={discount}
                                onChange={(e) => onDiscountChange?.(e.target.value)}
                                className="w-20 h-6 text-right text-xs bg-slate-800 border-slate-700 text-white rounded px-2"
                                min={0}
                            />
                        </div>
                    </div>
                    <div className="flex justify-between text-2xl max-lg:text-xl font-semibold text-white pt-3 max-lg:pt-2 border-t border-slate-700">
                        <span>TOTAL</span>
                        <span className="text-emerald-400">{currency}{total.toLocaleString()}</span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 max-lg:gap-1 pt-2 max-lg:pt-1.5">
                    {[
                        { key: 'cash', icon: Banknote, label: 'Cash', color: 'hover:bg-emerald-500/20 hover:border-emerald-500/40' },
                        { key: 'card', icon: CreditCard, label: 'Card', color: 'hover:bg-brand-primary/20 hover:border-brand-primary/40' },
                        { key: 'wallet', icon: Smartphone, label: 'Mobile', color: 'hover:bg-wine-500/20 hover:border-wine-500/40' },
                        { key: 'split', icon: SplitSquareHorizontal, label: 'Split', color: 'hover:bg-amber-500/20 hover:border-amber-500/40' },
                    ].map(({ key, icon: Icon, label, color }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onPaymentMethodSelect?.(key)}
                            className={cn(
                                'flex flex-col items-center gap-1 py-2 max-lg:py-1.5 rounded-lg border border-slate-700 bg-slate-800 transition-all text-gray-400 touch-manipulation',
                                color
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-[10px] font-medium">{label}</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onHoldSale}
                        className="h-9 rounded-lg text-[10px] font-bold border-slate-700 text-gray-400 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/30"
                    >
                        <Clock className="w-3.5 h-3.5 mr-1.5" /> HOLD
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearSale}
                        className="h-9 rounded-lg text-[10px] font-bold border-slate-700 text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                    >
                        <X className="w-3.5 h-3.5 mr-1.5" /> CLEAR
                    </Button>
                </div>

                {heldOrders.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenHeldSales}
                        className="w-full h-9 rounded-lg text-[10px] font-bold border-amber-600/30 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20"
                    >
                        <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> HELD SALES ({heldOrders.length})
                    </Button>
                )}

                {onPrintBill ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onPrintBill({ subtotal, taxAmount, discountAmount, total })}
                        disabled={isProcessing || items.length === 0}
                        className="w-full h-9 rounded-lg text-[10px] font-bold border-slate-700 text-gray-300 bg-slate-800 hover:bg-slate-700"
                    >
                        <Printer className="w-3.5 h-3.5 mr-1.5" /> PRINT
                    </Button>
                ) : null}
                {onDownloadBillPdf ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onDownloadBillPdf({ subtotal, taxAmount, discountAmount, total })}
                        disabled={isProcessing || items.length === 0}
                        className="w-full h-9 rounded-lg text-[10px] font-bold border-slate-700 text-gray-300 bg-slate-800 hover:bg-slate-700"
                    >
                        <FileDown className="w-3.5 h-3.5 mr-1.5" /> PDF
                    </Button>
                ) : null}

                <Button
                    onClick={onCompleteSale}
                    disabled={isProcessing || items.length === 0}
                    className="w-full h-14 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600
                               hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20 disabled:opacity-50 tracking-tight"
                >
                    {isProcessing ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Processing...
                        </div>
                    ) : (
                        <>
                            <CheckCircle2 className="w-5 h-5 mr-2" />
                            CHECKOUT - {currency}{total.toLocaleString()}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

// --- Main Super Store POS ----------------------------------------------------

export function SuperStorePOS({ 
    businessId, products = [], customers = [], onStartSession, onCloseSession,
    onCompleteSale, currency = 'Rs.', session, taxConfig: taxConfigProp, category: categoryProp,
}) {
    const { business, currencySymbol, planTier } = useBusiness();
    const category = categoryProp || business?.category || 'supermarket';
    const {
        taxMode,
        setTaxMode,
        components: taxComponents,
        effectiveTaxRate,
        taxLabel,
        taxEnabled,
        taxConfig: loadedTaxConfig,
        posUi,
    } = usePosTaxConfig(category);
    const taxConfig = taxConfigProp || loadedTaxConfig;
    const posSettings = usePosSettings();
    const canOfflinePos =
        Boolean(posSettings.offlineModeEnabled)
        && planHasFeatureWithPackaging(planTier, 'offline_pos_mode', business?.settings);
    const { isOnline, pendingCount, isSyncing, queueSale, syncPending } = usePosOffline(businessId, {
        enabled: canOfflinePos,
    });
    const { catalogReady, catalogProducts } = usePosOfflineCatalog(businessId, {
        enabled: canOfflinePos,
        products,
    });
    const sellableProducts = useMemo(() => {
        if (Array.isArray(products) && products.length > 0) return products;
        if (!isOnline && catalogReady && catalogProducts.length > 0) return catalogProducts;
        return products;
    }, [products, isOnline, catalogReady, catalogProducts]);
    const departments = useMemo(
        () => buildPosDepartments(category, sellableProducts, posUi.maxCategoryChips + 2),
        [category, sellableProducts, posUi.maxCategoryChips]
    );
    const domainConfig = getDomainConfig(category);
    const documentLabel = posUi.receiptLabel || domainConfig?.label_overrides?.invoice || 'Receipt';
    const currencyCode = posUi.currencyCode;
    const displayCurrency = currencySymbol || posUi.currencySymbol;
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDepartment, setActiveDepartment] = useState('all');
    const [customer, setCustomer] = useState(null);
    const [customerQuery, setCustomerQuery] = useState('');
    const [showCustomerDialog, setShowCustomerDialog] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState('fixed');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [splitPayments, setSplitPayments] = useState(null);
    const [showSplitDialog, setShowSplitDialog] = useState(false);
    const [showCloseShiftDialog, setShowCloseShiftDialog] = useState(false);
    const [showTaxPanel, setShowTaxPanel] = useState(false);
    const [showCashTools, setShowCashTools] = useState(false);
    const [showHeldSheet, setShowHeldSheet] = useState(false);
    const [mobilePane, setMobilePane] = useState('browse');
    const [showCameraScanner, setShowCameraScanner] = useState(false);
    const [pharmacyProduct, setPharmacyProduct] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isStartingSession, setIsStartingSession] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [lastScannedItem, setLastScannedItem] = useState(null);
    const discountInputRef = useRef(null);
    const { heldOrders, holdSale, resumeHeld, removeHeld } = usePosHeldSales(businessId || business?.id);
    const domainFlags = useMemo(() => getPosDomainFlags(category), [category]);
    const bulkQuickAdds = useMemo(() => {
        if (domainFlags.wholesaleMode) return getBulkQuickAdds(1);
        return [5, 12];
    }, [domainFlags.wholesaleMode]);
    const { requestApproval, managerPinDialog } = usePosManagerGate({
        businessId: businessId || business?.id,
        posSettings,
    });
    const { containerRef, isFullscreen, toggleFullscreen } = usePosFullscreen();
    const {
        autoPrintEnabled,
        toggleAutoPrint,
        lastSale,
        showSuccess,
        dismissSuccess,
        printBillFromCart,
        downloadBillPdfFromCart,
        recordSuccessfulSale,
        printLastReceipt,
        downloadLastReceiptPdf,
        formatSaleError,
    } = usePosReceipt({
        business,
        documentLabel,
        category,
        currencyCode,
    });
    const hasSession = Boolean(
        session?.id
        && session?.id !== 'sess-initial'
        && (session?.status === 'open' || session?.opened_at || session?.startTime)
    );
    const sessionStartedAt = session?.opened_at || session?.startTime;
    const sessionStartedLabel = sessionStartedAt
        ? new Date(sessionStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null;
    const terminalLabel = session?.terminalName || session?.terminal_name || posUi.terminalLabel;

    const filteredCustomers = useMemo(() => {
        if (!customerQuery.trim()) return (customers || []).slice(0, 40);
        const lower = customerQuery.toLowerCase();
        return (customers || []).filter(c =>
            c.name?.toLowerCase().includes(lower)
            || c.phone?.toLowerCase().includes(lower)
            || c.email?.toLowerCase().includes(lower)
        ).slice(0, 40);
    }, [customers, customerQuery]);

    useEffect(() => {
        setCart((prev) => prev.map((line) => (
            line.taxExempt || line.tax_exempt
                ? line
                : { ...line, taxPercent: effectiveTaxRate }
        )));
    }, [effectiveTaxRate]);

    const handlePrintReceipt = useCallback(() => {
        printLastReceipt();
    }, [printLastReceipt]);

    const handleDownloadBillPdf = useCallback((totalsFromCart) => {
        downloadBillPdfFromCart({
            cart,
            customer,
            paymentMethod,
            discount,
            discountType,
            totalsFromCart,
        });
    }, [cart, customer, discount, discountType, paymentMethod, downloadBillPdfFromCart]);

    const handlePrintBill = useCallback((totalsFromCart) => {
        printBillFromCart({
            cart,
            customer,
            paymentMethod,
            discount,
            discountType,
            totalsFromCart,
        });
    }, [cart, customer, discount, discountType, paymentMethod, printBillFromCart]);

    const handleStartSession = useCallback(async () => {
        if (!onStartSession || isStartingSession) return;
        setIsStartingSession(true);
        try {
            await onStartSession();
        } finally {
            setIsStartingSession(false);
        }
    }, [onStartSession, isStartingSession]);

    // --- Derived Data --------------------------------------------------------

    const productCounts = useMemo(() => countProductsByDepartment(sellableProducts), [sellableProducts]);

    const filteredProducts = useMemo(() => {
        let items = filterProductsByDepartment(sellableProducts, activeDepartment);
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            items = items.filter(p =>
                p.name?.toLowerCase().includes(lower) ||
                p.sku?.toLowerCase().includes(lower) ||
                p.barcode?.toLowerCase().includes(lower)
            );
        }
        return items;
    }, [sellableProducts, activeDepartment, searchTerm]);

    const handlePaymentMethodSelect = useCallback((method) => {
        if (method === 'split') {
            setShowSplitDialog(true);
            return;
        }
        setSplitPayments(null);
        setPaymentMethod(method);
    }, []);

    const { tryAddProduct, handleScanCode } = usePosProductAdd({
        category,
        posSettings,
        effectiveTaxRate,
        businessId: businessId || business?.id,
        setCart,
        setPharmacyProduct,
        onAdded: (product) => {
            setLastScannedItem(product.name);
            setTimeout(() => setLastScannedItem(null), 1500);
        },
    });

    const addToCart = tryAddProduct;

    const barcodeScanAllowed = canUseBarcodeScan(business);
    const showCamera = barcodeScanAllowed && (
        posSettings.barcodeMode === 'camera' || posSettings.barcodeMode === 'auto'
    );

    // --- Cart Operations -----------------------------------------------------

    const handleBarcodeScan = useCallback((barcode) => {
        setIsScanning(true);
        void handleScanCode(sellableProducts, barcode, { clearSearch: () => setSearchTerm('') }).then((product) => {
            if (!product) {
                setLastScannedItem(`[WARNING] "${barcode}" not found`);
                setTimeout(() => setLastScannedItem(null), 2000);
            }
            setTimeout(() => setIsScanning(false), 300);
        });
    }, [sellableProducts, handleScanCode]);

    const handleQuantityChange = useCallback((idx, qty) => {
        setCart((prev) => prev.map((item, i) => {
            if (i !== idx) return item;
            let next = Math.round(Number(qty) * 100) / 100;
            const minQty = item.isWeightItem ? 0.1 : 1;
            if (!Number.isFinite(next) || next < minQty) next = minQty;
            const cap = Number(item.maxStock);
            if (Number.isFinite(cap) && cap > 0 && next > cap) {
                toast.error('Not enough stock', { id: 'pos-stock-cap' });
                next = cap;
            }
            return { ...item, quantity: next };
        }));
    }, []);

    const handleWeightChange = useCallback((idx, weight) => {
        handleQuantityChange(idx, weight);
    }, [handleQuantityChange]);

    const handleRemoveItem = useCallback((idx) => {
        setCart(prev => prev.filter((_, i) => i !== idx));
    }, []);

    const handleHoldSale = useCallback(() => {
        if (cart.length === 0) {
            toast.error('Cart is empty', { id: 'pos-hold' });
            return;
        }
        const ok = holdSale({
            items: cart,
            customer,
            discount,
            discountType,
            taxMode,
            paymentMethod,
        });
        if (!ok) return;
        setCart([]);
        setCustomer(null);
        setDiscount(0);
        setDiscountType('fixed');
        setTaxMode('standard');
        toast.success('Sale held', { id: 'pos-hold' });
    }, [cart, customer, discount, discountType, taxMode, paymentMethod, holdSale, setTaxMode]);

    const handleVoidSale = useCallback(() => {
        const run = () => {
            setCart([]);
            setCustomer(null);
            setDiscount(0);
            setDiscountType('fixed');
            setTaxMode('standard');
        };
        requestApproval('clear', run);
    }, [setTaxMode, requestApproval]);

    const handleTaxModeChange = useCallback((mode) => {
        if (mode === 'exempt') {
            requestApproval('tax_exempt', () => setTaxMode('exempt'));
            return;
        }
        setTaxMode(mode);
    }, [requestApproval, setTaxMode]);

    const applyHeldSnapshot = useCallback((restored) => {
        if (!restored) return;
        setCart(restored.items || []);
        setCustomer(restored.customer || null);
        setDiscount(restored.discount || 0);
        setDiscountType(restored.discountType === 'percentage' ? 'percentage' : 'fixed');
        if (restored.taxMode) setTaxMode(restored.taxMode);
        if (restored.paymentMethod) setPaymentMethod(restored.paymentMethod);
        setShowHeldSheet(false);
        toast.success('Held sale restored', { id: 'pos-hold' });
    }, [setTaxMode]);

    const handleResumeHeldSale = useCallback((id) => {
        if (cart.length > 0) {
            toast.error('Clear or checkout the current cart before resuming a held sale', {
                id: 'pos-hold',
            });
            return;
        }
        const restored = resumeHeld(id);
        applyHeldSnapshot(restored);
    }, [cart.length, resumeHeld, applyHeldSnapshot]);

    const handleDiscardHeldSale = useCallback((id) => {
        removeHeld(id);
        toast.success('Held sale discarded', { id: 'pos-hold' });
    }, [removeHeld]);

    const handleCompleteSale = useCallback(async () => {
        if (cart.length === 0 || isProcessing) return;
        const sub = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

        const runSale = async () => {
        setIsProcessing(true);
        try {
            const payload = buildPosCheckoutPayload({
                businessId,
                sessionId: session?.id,
                customerId: customer?.id || null,
                cart: cart.map((i) => ({
                    ...i,
                    taxPercent: i.taxPercent ?? effectiveTaxRate,
                    batchId: i.batchId || null,
                    variantId: i.variantId || null,
                    serialNumber: i.serialNumber || null,
                })),
                discount,
                discountType,
                paymentMethod: splitPayments?.length ? 'split' : paymentMethod,
                payments: splitPayments || undefined,
            });

            if (!isOnline && canOfflinePos) {
                if (!catalogReady) {
                    toast.error('Connect once to cache products before selling offline', {
                        id: 'pos-offline',
                    });
                    return;
                }
                await queueSale(payload);
                toast.success('Sale saved offline - will sync when online', { id: 'pos-offline' });
                setCart([]);
                setCustomer(null);
                setDiscount(0);
                setDiscountType('fixed');
                setSplitPayments(null);
                setPaymentMethod('cash');
                setTaxMode('standard');
                setMobilePane('browse');
                return;
            }

            const result = await onCompleteSale?.({
                ...payload,
                metadata: { domain: category, taxRate: effectiveTaxRate, taxMode },
            });

            if (result?.success) {
                recordSuccessfulSale({
                    result,
                    payload,
                    cart,
                    customer,
                    paymentMethod,
                    hasSession,
                });
                const tender = splitPayments?.length ? 'split' : paymentMethod;
                if (
                    posSettings.cashDrawerKickOnCashSale
                    && (tender === 'cash' || tender === 'split')
                ) {
                    openCashDrawer({ label: 'Sale' });
                }
                setCart([]);
                setCustomer(null);
                setDiscount(0);
                setDiscountType('fixed');
                setSplitPayments(null);
                setPaymentMethod('cash');
                setTaxMode('standard');
                setMobilePane('browse');
            } else if (result?.error) {
                toast.error(formatSaleError(result), { id: 'pos-sale-error' });
            }
        } catch (err) {
            console.error('SuperStore POS sale error:', err);
            toast.error(err?.message || 'Sale failed', { id: 'pos-sale-error' });
        } finally {
            setIsProcessing(false);
        }
        };

        const discPct = discountType === 'percentage'
            ? (Number(discount) || 0)
            : (sub > 0 ? ((Number(discount) || 0) / sub) * 100 : 0);
        requestApproval('discount', () => { void runSale(); }, { discountPercent: discPct });
    }, [cart, businessId, session, customer, discount, discountType, paymentMethod, splitPayments, isProcessing, onCompleteSale, hasSession, effectiveTaxRate, category, recordSuccessfulSale, formatSaleError, isOnline, posSettings, queueSale, taxMode, setTaxMode, requestApproval, canOfflinePos, catalogReady]);

    const cartTax = useMemo(
        () => computePosCartTax(cart, taxComponents),
        [cart, taxComponents]
    );

    const cartSummary = useMemo(() => {
        const totals = computePosOrderTotals(cart, {
            discount,
            discountType,
            taxComponents,
            precomputedTax: cartTax,
        });
        const itemCount = cart.reduce((s, i) => s + (i.isWeightItem ? 1 : i.quantity), 0);
        return {
            subtotal: totals.subtotal,
            taxAmount: totals.taxAmount,
            taxBreakdown: totals.taxBreakdown || cartTax.breakdown || [],
            discountAmount: totals.discountAmount,
            total: totals.total,
            itemCount,
        };
    }, [cart, discount, discountType, taxComponents, cartTax]);

    const focusScanSearch = useCallback(() => {
        setMobilePane('browse');
        requestAnimationFrame(() => {
            focusPosScanInput(containerRef.current);
        });
    }, []);

    const hotkeyHandlers = useMemo(() => ({
        search: focusScanSearch,
        customer: () => setShowCustomerDialog(true),
        discount: () => discountInputRef.current?.focus(),
        hold: handleHoldSale,
        pay: () => {
            if (cart.length > 0 && !isProcessing) handleCompleteSale();
        },
        payment: () => handlePaymentMethodSelect(nextPosPaymentMethod(paymentMethod)),
        tax: () => { if (taxEnabled) setShowTaxPanel(true); },
        clear: handleVoidSale,
        print: () => handlePrintBill({
            subtotal: cartSummary.subtotal,
            taxAmount: cartSummary.taxAmount,
            discountAmount: cartSummary.discountAmount,
            total: cartSummary.total,
        }),
    }), [
        focusScanSearch,
        handleHoldSale,
        cart.length,
        isProcessing,
        handleCompleteSale,
        handlePaymentMethodSelect,
        paymentMethod,
        taxEnabled,
        handleVoidSale,
        handlePrintBill,
        cartSummary,
    ]);

    usePosHotkeys({
        enabled: !showCustomerDialog && !showSplitDialog && !showTaxPanel && !showCashTools && !showHeldSheet,
        handlers: hotkeyHandlers,
        onFullscreen: toggleFullscreen,
    });

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                focusScanSearch();
            }
            if (e.key === 'Escape' && searchTerm) {
                setSearchTerm('');
                focusScanSearch();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [searchTerm, focusScanSearch]);

    // --- Render --------------------------------------------------------------

    const cartSummaryProps = {
        items: cart,
        customer,
        onCustomerSelect: () => setShowCustomerDialog(true),
        discount,
        onDiscountChange: setDiscount,
        discountType,
        onDiscountTypeChange: setDiscountType,
        onPaymentMethodSelect: handlePaymentMethodSelect,
        onCompleteSale: handleCompleteSale,
        onHoldSale: handleHoldSale,
        onClearSale: handleVoidSale,
        onOpenHeldSales: () => setShowHeldSheet(true),
        onPrintBill: handlePrintBill,
        onDownloadBillPdf: handleDownloadBillPdf,
        isProcessing,
        currency: displayCurrency,
        heldOrders,
        taxLabel: taxLabel || posUi.taxLabel,
        taxBreakdown: cartSummary.taxBreakdown,
        discountInputRef,
        onOpenTax: taxEnabled ? () => setShowTaxPanel(true) : undefined,
        taxMode,
        taxEnabled,
        businessCategory: category,
        onQuantityChange: handleQuantityChange,
        onWeightChange: handleWeightChange,
        onRemoveItem: handleRemoveItem,
        showBulkQuickAdds: Boolean(domainFlags.supportsBulkQty || domainFlags.wholesaleMode),
        bulkQuickAdds,
    };
    return (
        <div
            ref={containerRef}
            data-pos-root="superstore"
            className={cn(
                'flex flex-col min-h-0 overflow-hidden bg-gray-50 border border-gray-200 touch-manipulation transition-all',
                getPosShellHeightClass(isFullscreen, 'terminal'),
                isFullscreen ? 'fixed inset-0 z-[100] rounded-none border-0' : 'rounded-xl shadow-sm'
            )}
        >
            {/* Desktop split */}
            <div className="hidden lg:flex flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 min-w-0 bg-white flex flex-col min-h-0">
                    <PosSessionBar hasSession={hasSession} terminalLabel={terminalLabel} sessionStartedLabel={sessionStartedLabel} isStartingSession={isStartingSession} onStartSession={handleStartSession} onCloseSession={hasSession ? () => setShowCloseShiftDialog(true) : undefined} />
                    <PosOfflineBanner
                        isOnline={isOnline}
                        pendingCount={pendingCount}
                        isSyncing={isSyncing}
                        catalogReady={catalogReady}
                        offlineEnabled={canOfflinePos}
                        onSync={syncPending}
                    />
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
                        <BarcodeScannerInput onScan={handleBarcodeScan} searchTerm={searchTerm} onSearchChange={setSearchTerm} isScanning={isScanning} />
                        <div className="flex items-center gap-1.5 shrink-0">
                            {(showCamera) && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowCameraScanner(true)} aria-label="Camera scan"><Camera className="w-4 h-4" /></Button>
                            )}
                            <Badge variant="outline" className={cn('text-[10px] h-7 px-2 font-bold', lastScannedItem?.startsWith('[WARNING]') ? 'border-red-300 text-red-500' : lastScannedItem ? 'border-emerald-300 text-emerald-600' : 'border-gray-200 text-gray-400')}>{lastScannedItem || 'Ready to scan'}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => setShowCashTools(true)} className="h-8 px-2 text-[10px] text-gray-500">
                                <Banknote className="w-3.5 h-3.5 mr-1" />Cash
                            </Button>
                            <Button variant="ghost" size="sm" onClick={toggleAutoPrint} className={cn('h-8 px-2 text-[10px]', autoPrintEnabled ? 'text-emerald-600' : 'text-gray-400')}><Printer className="w-3.5 h-3.5 mr-1" />Auto</Button>
                            <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-8 w-8">{isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}</Button>
                        </div>
                    </div>
                    <DepartmentBar departments={departments} activeDepartment={activeDepartment} onDepartmentChange={setActiveDepartment} productCounts={productCounts} />
                    <PosProductBrowseGrid products={filteredProducts} onAddToCart={addToCart} currency={displayCurrency} businessCategory={category} />
                    {searchTerm && (
                        <div className="border-t overflow-y-auto max-h-64 bg-gray-50/50">{filteredProducts.slice(0, 8).map((p) => (
                            <button key={p.id} type="button" onClick={() => { addToCart(p); setSearchTerm(''); }} className="flex w-full px-4 py-2 text-left hover:bg-emerald-50/50 text-xs font-bold">{p.name}</button>
                        ))}</div>
                    )}
                </div>
                <aside className="w-[min(100%,400px)] shrink-0 flex flex-col min-h-0">
                    <CartSummary {...cartSummaryProps} />
                </aside>
            </div>

            {/* Mobile app-style panes */}
            <div className="lg:hidden flex flex-col flex-1 min-h-0 overflow-hidden">
                {mobilePane === 'browse' ? (
                    <>
                        <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden">
                            <PosSessionBar hasSession={hasSession} terminalLabel={terminalLabel} sessionStartedLabel={sessionStartedLabel} isStartingSession={isStartingSession} onStartSession={handleStartSession} onCloseSession={hasSession ? () => setShowCloseShiftDialog(true) : undefined} className="mx-2 mt-2 max-lg:mx-1.5 max-lg:mt-1 max-lg:pt-[env(safe-area-inset-top)]" />
                            <PosOfflineBanner
                                isOnline={isOnline}
                                pendingCount={pendingCount}
                                isSyncing={isSyncing}
                                catalogReady={catalogReady}
                                offlineEnabled={canOfflinePos}
                                onSync={syncPending}
                                className="mx-2 max-lg:mx-1.5"
                            />
                            <div className="flex items-center gap-1.5 px-3 max-lg:px-2 py-2 max-lg:py-1.5 border-b shrink-0">
                                <BarcodeScannerInput onScan={handleBarcodeScan} searchTerm={searchTerm} onSearchChange={setSearchTerm} isScanning={isScanning} />
                                {showCamera && (
                                    <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 touch-manipulation" onClick={() => setShowCameraScanner(true)} aria-label="Scan with camera"><Camera className="w-5 h-5" /></Button>
                                )}
                            </div>
                            <DepartmentBar departments={departments} activeDepartment={activeDepartment} onDepartmentChange={setActiveDepartment} productCounts={productCounts} />
                            <PosProductBrowseGrid products={filteredProducts} onAddToCart={addToCart} currency={displayCurrency} businessCategory={category} />
                        </div>
                        {cartSummary.itemCount > 0 ? (
                            <PosMobileCheckoutBar
                                itemCount={cartSummary.itemCount}
                                total={cartSummary.total}
                                currency={displayCurrency}
                                onOpenCheckout={() => setMobilePane('checkout')}
                            />
                        ) : (
                            <footer className="shrink-0 px-4 py-2.5 text-center text-[11px] text-gray-400 border-t bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
                                Tap a product or scan barcode to add
                            </footer>
                        )}
                    </>
                ) : (
                    <div className="flex-1 min-h-0 flex flex-col">
                        <CartSummary {...cartSummaryProps} onBack={() => setMobilePane('browse')} />
                    </div>
                )}
            </div>

            <PosHotkeyDock
                className="hidden lg:block"
                onAction={(action) => hotkeyHandlers[action]?.()}
                disabledActions={{
                    hold: cart.length === 0,
                    pay: cart.length === 0 || isProcessing,
                    print: cart.length === 0,
                    clear: cart.length === 0,
                    tax: !taxEnabled,
                }}
            />

            {taxEnabled && (
            <PosTaxPanel
                open={showTaxPanel}
                onOpenChange={setShowTaxPanel}
                taxMode={taxMode}
                onTaxModeChange={handleTaxModeChange}
                components={taxComponents}
                currency={displayCurrency}
                sampleTaxAmount={cartSummary.taxAmount}
            />
            )}

            <PosCashToolsPanel
                open={showCashTools}
                onOpenChange={setShowCashTools}
                businessId={businessId || business?.id}
                sessionId={hasSession ? session?.id : null}
                onRequirePinForPaidOut={(run) => requestApproval('paid_out', run)}
            />

            {managerPinDialog}

            {/* Sale Success Toast */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="fixed bottom-20 left-4 right-4 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-md z-50 flex items-center gap-3 px-6 py-4 rounded-2xl bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30"
                    >
                        <CheckCircle2 className="w-6 h-6" />
                        <div>
                            <p className="font-bold text-sm">Sale Complete!</p>
                            <p className="text-xs text-emerald-100">
                                {lastSale?.transaction_number} - {displayCurrency}{lastSale?.total?.toLocaleString()} ({lastSale?.mode === 'invoice-fallback' ? 'Invoice Mode' : 'POS Mode'})
                            </p>
                        </div>
                        <Button
                            variant="ghost" size="sm"
                            className="text-emerald-100 hover:text-white hover:bg-emerald-500 ml-2"
                            onClick={handlePrintReceipt}
                        >
                            <Printer className="w-4 h-4 mr-1" /> Print
                        </Button>
                        <Button
                            variant="ghost" size="sm"
                            className="text-emerald-100 hover:text-white hover:bg-emerald-500"
                            onClick={() => downloadLastReceiptPdf()}
                            aria-label="Download PDF"
                        >
                            <FileDown className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost" size="sm"
                            className="text-emerald-100 hover:text-white hover:bg-emerald-500"
                            onClick={dismissSuccess}
                            aria-label="Dismiss"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Select Customer</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input
                            value={customerQuery}
                            onChange={(e) => setCustomerQuery(e.target.value)}
                            placeholder="Search by name, phone or email"
                        />
                        <button
                            onClick={() => {
                                setCustomer(null);
                                setShowCustomerDialog(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
                        >
                            Walk-in Customer
                        </button>
                        <div className="max-h-72 overflow-y-auto space-y-1">
                            {filteredCustomers.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => {
                                        setCustomer(c);
                                        setShowCustomerDialog(false);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:bg-brand-50"
                                >
                                    <p className="text-sm font-semibold text-gray-900">{c.name || 'Unnamed customer'}</p>
                                    <p className="text-xs text-gray-500">{c.phone || c.email || 'No contact details'}</p>
                                </button>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <p className="text-xs text-gray-500 px-1 py-2">No customers found</p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <PosCameraScanner open={showCameraScanner} onClose={() => setShowCameraScanner(false)} onScan={handleBarcodeScan} />

            <PosHeldSalesSheet
                open={showHeldSheet}
                onOpenChange={setShowHeldSheet}
                heldOrders={heldOrders}
                currency={displayCurrency}
                onResume={handleResumeHeldSale}
                onDiscard={handleDiscardHeldSale}
            />

            <PosPharmacyBatchDialog
                open={Boolean(pharmacyProduct)}
                onOpenChange={(open) => !open && setPharmacyProduct(null)}
                businessId={businessId}
                product={pharmacyProduct}
                onConfirm={(batchMeta) => pharmacyProduct && tryAddProduct(pharmacyProduct, batchMeta)}
            />

            <PosSplitPaymentDialog
                open={showSplitDialog}
                onOpenChange={setShowSplitDialog}
                total={computePosOrderTotals(
                    cart.map((i) => ({
                        productId: i.productId,
                        unitPrice: i.unitPrice,
                        quantity: i.quantity,
                        taxPercent: i.taxPercent ?? effectiveTaxRate,
                    })),
                    { discount, discountType }
                ).total}
                currency={displayCurrency}
                onConfirm={(payments) => {
                    setSplitPayments(payments);
                    setPaymentMethod('split');
                }}
            />

            <PosCloseShiftDialog
                open={showCloseShiftDialog}
                onOpenChange={setShowCloseShiftDialog}
                businessId={businessId}
                session={session}
                currency={displayCurrency}
                onClosed={() => {
                    onCloseSession?.();
                    setShowCloseShiftDialog(false);
                }}
            />
        </div>
    );
}

