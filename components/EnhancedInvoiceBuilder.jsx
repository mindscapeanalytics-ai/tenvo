// This file usually uses formatCurrency, but checking for hardcoded symbols

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { X, Plus, Trash2, Download, Printer, Save, Calculator, FileText, Loader2, Scan, Keyboard, AlertCircle, ShoppingCart, WandSparkles, Send, Clock3, CheckCircle2, XCircle, ShieldCheck, MoreHorizontal, User, Edit2, ChevronDown, ChevronUp, Building2, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateInvoicePDF } from '@/lib/pdf';
import { printInvoiceThermalFromRow } from '@/lib/print/clientInvoicePrint';
import { PakistaniPaymentSelector } from '@/components/payment/PakistaniPaymentSelector';
import { PakistaniTaxCalculator } from '@/components/tax/PakistaniTaxCalculator';
import { calculatePakistaniTax, generateFBRInvoice, formatNTN, getTaxCategoryForDomain } from '@/lib/tax/pakistaniTax';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { getDomainDefaults, getDomainUnits, getDomainUnits as getUnits, getDomainProductFields, getDomainInvoiceColumns } from '@/lib/utils/domainHelpers';
import { resolveTextileLineQty, autoFillTextileLineOnUnitChange, resolveProductPrice } from '@/lib/utils/invoiceHelpers';
import { getDomainConfig } from '@/lib/config/domains';
import { getDomainColors } from '@/lib/domainColors';
import { formatCurrency } from '@/lib/utils/formatting';
import { getTaxStrategy } from '@/lib/utils/taxStrategies';
import { cn } from '@/lib/utils';
import { Combobox } from '@/components/ui/combobox';
import { useFormRegionalContext } from '@/lib/hooks/useFormRegionalContext';
import { getRegionalStandards } from '@/lib/utils/regionalHelpers';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { useStockAvailability, useCreditLimitCheck, useDueDateCalculator } from '@/lib/hooks/useInvoiceHelpers';
import { invoiceSchema, validateWithSchema } from '@/lib/validation/schemas';
import { getCurrentSeason, getSeasonalDiscount } from '@/lib/domainData/pakistaniSeasons';
import { hasSeasonalPricing } from '@/lib/utils/pakistaniFeatures';
import { ExpertActionPanel } from '@/components/domain/ExpertActionPanel';
import { submitInvoiceForApprovalAction, getApprovalHistoryAction, schedulePaymentRemindersAction } from '@/lib/actions/standard/invoice-approval';
import { MOBILE_OVERLAY, MOBILE_OVERLAY_CARD, MOBILE_FORM_FOOTER, MOBILE_GRID_FIELDS } from '@/lib/utils/formMobileStyles';
import { InvoiceMobileLineItems } from '@/components/invoice/mobile/InvoiceMobileLineItems';
import { DomainMultiRowLineItems } from '@/components/invoice/DomainMultiRowLineItems';
import { VehicleAgreementSection, isAutomotiveDomain } from '@/components/invoice/VehicleAgreementSection';
import { printVehicleBuyerSellerReceiptHtml } from '@/lib/print/vehicleBuyerSellerReceiptHtml';
import { generateInstallmentFormPdf } from '@/lib/pdf/installmentFormPdf';
import { findProductByScanCode } from '@/lib/utils/productScanLookup';
import { lookupProductByScanCodeAction } from '@/lib/actions/standard/inventory/lookup';
import { BarcodeScanTrigger } from '@/components/inventory/BarcodeScanTrigger';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * Enhanced Invoice Builder Component
 * Fully localized for Pakistani (FBR) and FBR-certified tax systems
 * Conditionally shows features based on domain category
 * 
 * @param {Object} props
 * @param {() => void} props.onClose
 * @param {(inv: any) => void} props.onSave
 * @param {any[]} [props.products]
 * @param {any[]} [props.customers]
 * @param {string} [props.category]
 * @param {any} [props.initialData]
 */
export function EnhancedInvoiceBuilder({
  onClose,
  onSave,
  products = [],
  customers = [],
  category = 'retail-shop', // Domain category for conditional features
  initialData = null,
  ...props
}) {
  const {
    business,
    currency: ctxCurrency,
    currencySymbol: ctxCurrencySymbol,
    registry: regionalStandards,
    defaultTaxRate,
    taxEnabled,
    isPakistanMarket,
    domainKnowledge,
    taxLabel: regionalTaxLabel,
  } = useFormRegionalContext(category);
  const standards = regionalStandards || getRegionalStandards('PK');
  const currency = ctxCurrency || standards.currency;
  const strategy = getTaxStrategy(standards);
  const colors = getDomainColors(category);
  const brandAccent =
    business?.settings?.brand?.primaryColor ||
    business?.settings?.storefront?.brand?.primaryColor ||
    colors.primary;
  const domainInvoiceLabel =
    getDomainConfig(category)?.label_overrides?.invoice || 'Sales Invoice';
  const isPakistaniDomain = isPakistanMarket;
  const showTaxUi = taxEnabled === true;
  const lineDefaultTaxRate = showTaxUi ? defaultTaxRate : 0;
  const currencySymbol = business?.settings?.financials?.currencySymbol || ctxCurrencySymbol || standards.currencySymbol;

  // Textile wholesale domains default to 'thaan' as the primary billing unit
  const isTextileDomain = category === 'textile-wholesale' || category === 'textile';
  const defaultLineUnit = isTextileDomain ? 'thaan' : 'pcs';

  const normalizeProvince = (value = 'sindh') => {
    const raw = String(value || '').trim().toLowerCase();
    const map = {
      sindh: 'sindh',
      punjab: 'punjab',
      kp: 'kp',
      kpk: 'kp',
      'khyber pakhtunkhwa': 'kp',
      balochistan: 'balochistan',
      'islamabad (federal)': 'islamabad',
      islamabad: 'islamabad',
    };
    return map[raw] || 'sindh';
  };

  const mapPreferredPaymentMethod = (value) => {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return null;
    if (raw.includes('jazz')) return 'jazzcash';
    if (raw.includes('easy')) return 'easypaisa';
    if (raw.includes('payfast') || raw.includes('card')) return 'payfast';
    if (raw.includes('bank')) return 'bank_transfer';
    if (raw.includes('cod') || raw.includes('cash on delivery') || raw === 'cash') return 'cod';
    return null;
  };

  const extractCreditDays = (customer) => {
    const direct = Number(customer?.credit_days || customer?.creditDays || 0);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const term = String(customer?.payment_terms || customer?.paymentTerms || '').match(/(\d{1,3})/);
    const parsed = Number(term?.[1] || 0);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  };

  const addDaysLocal = (dateString, daysToAdd) => {
    const [year, month, day] = String(dateString || '').split('-').map(Number);
    if (!year || !month || !day) return '';
    const localDate = new Date(year, month - 1, day);
    localDate.setDate(localDate.getDate() + Number(daysToAdd || 0));
    const y = localDate.getFullYear();
    const m = String(localDate.getMonth() + 1).padStart(2, '0');
    const d = String(localDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Initialize invoice state with conditional fields
  const [invoice, setInvoice] = useState(() => {
    const baseInvoice = {
      invoiceNumber: '', // Will be generated by server using DocumentSequenceService
      documentType: regionalTaxLabel || standards.taxLabel,
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      invoiceType: 'retail',
      customer: {
        name: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        secondaryTaxId: '',
        province: 'punjab',
      },
      items: [],
      taxDetails: {
        breakdown: {},
        totalTax: 0,
      },
      paymentMethod: isPakistaniDomain ? 'cod' : 'cash',
      category,
      discount: 0,
      discountType: 'percent', // percent or amount
      roundOff: 0,
      notes: '',
      terms: '',
      ewayBill: '',
      placeOfSupply: '',
      vehicleAgreement: initialData?.taxDetails?.vehicleAgreement || initialData?.tax_details?.vehicleAgreement || {},
      biltiDetails: initialData?.biltiDetails || initialData?.taxDetails?.biltiDetails || initialData?.tax_details?.biltiDetails || {
        transportName: '',
        biltiNo: '',
        destinationCity: '',
        baleCount: '',
        freightStatus: 'To Pay',
        freightCharges: 0,
      },
      brokerDetails: initialData?.brokerDetails || initialData?.taxDetails?.brokerDetails || initialData?.tax_details?.brokerDetails || {
        brokerName: '',
        brokerCommission: '',
      },
      lathaFoldingCharges: initialData?.lathaFoldingCharges || initialData?.taxDetails?.lathaFoldingCharges || 0,
    };

    if (initialData) {
      // Logic to map Source (Challan/Order) or existing Invoice back to state
      const mappedItems = (initialData.items || []).map(item => {
        const rate = item.unit_price || item.rate || 0;
        const discount = item.discount_amount || item.discount || 0;
        const taxPercent = showTaxUi
          ? (item.tax_percent || item.taxPercent || (isPakistaniDomain ? lineDefaultTaxRate : 0))
          : 0;
        const quantity = item.quantity || 1;

        // Calculate line amount
        const baseAmount = quantity * rate;
        const discountVal = (baseAmount * discount) / 100;
        const taxable = baseAmount - discountVal;
        const taxVal = (taxable * taxPercent) / 100;

        return {
          id: item.id || Date.now() + Math.random(),
          productId: item.product_id || item.productId || '',
          name: item.product_name || item.name || '',
          hsn: item.hsn_code || item.hsn || '',
          quantity,
          unit: item.unit || item.metadata?.unit || defaultLineUnit,
          rate,
          discount,
          taxPercent,
          amount: taxable + taxVal,
          taxCategory: item.tax_category || item.taxCategory || (isPakistaniDomain ? getTaxCategoryForDomain(category) : 'retail-standard'),
          batchNumber: item.batch_number || item.batchNumber || '',
          serialNumber: item.serial_number || item.serialNumber || '',
          expiryDate: item.expiry_date || item.expiryDate || '',
        };
      });

      // Find customer details if ID exists
      const customerDetail = customers.find(c => c.id === (initialData.customer_id || initialData.customer?.id)) || {};

      // Normalize DB dates (ISO timestamps) to YYYY-MM-DD for HTML date inputs
      const normalizeDate = (val) => {
        if (!val) return '';
        // Already YYYY-MM-DD (10 chars)
        if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        // ISO timestamp: take first 10 chars
        if (typeof val === 'string') return val.slice(0, 10);
        if (val instanceof Date) {
          const y = val.getFullYear();
          const m = String(val.getMonth() + 1).padStart(2, '0');
          const d = String(val.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
        return '';
      };

      return {
        ...baseInvoice,
        ...initialData, // Spread original for ID and other metadata
        // Override date fields with normalized YYYY-MM-DD strings for <input type="date">
        date: normalizeDate(initialData.date) || baseInvoice.date,
        dueDate: normalizeDate(initialData.due_date || initialData.dueDate) || '',
        invoiceNumber: initialData.invoice_number || initialData.invoiceNumber || '',
        invoiceType:
          initialData.invoiceType ||
          initialData.invoice_type ||
          initialData.tax_details?.invoice_type ||
          initialData.taxDetails?.invoice_type ||
          'retail',
        paymentMethod:
          initialData.payment_method ||
          initialData.paymentMethod ||
          baseInvoice.paymentMethod,
        category: category || initialData.category || baseInvoice.category,
        customer: {
          ...baseInvoice.customer,
          id: initialData.customer_id || customerDetail.id || '',
          name: initialData.customer_name || initialData.customer?.name || customerDetail.name || '',
          email: initialData.customer_email || customerDetail.email || '',
          phone: customerDetail.phone || '',
          address: initialData.delivery_address || customerDetail.address || '',
          taxId: initialData.customer_tax_id || initialData.customer?.taxId || customerDetail.tax_id || customerDetail.ntn || customerDetail.gstin || '',
          province: normalizeProvince(initialData.customer?.province || customerDetail.province || 'punjab'),
          ...customerDetail,
        },
        items: mappedItems,
        discount: initialData.discount_total || initialData.discount || 0,
        notes: initialData.notes || '',
      };
    }

    return baseInvoice;
  });

  // Invoice Intelligence Hooks
  const { checkAvailability, getStockStatus } = useStockAvailability(business?.id);
  const autoDueDate = useDueDateCalculator(invoice.date, 30); // 30 days payment terms

  // Auto-update due date if not manually set
  useEffect(() => {
    if (autoDueDate && !invoice.dueDate) {
      setInvoice(prev => ({ ...prev, dueDate: autoDueDate }));
    }
  }, [autoDueDate, invoice.dueDate]);

  // Find selected customer for credit limit check
  const selectedCustomerData = useMemo(() => {
    if (!invoice.customer?.id) return null;
    return customers.find(c => c.id === invoice.customer.id);
  }, [invoice.customer?.id, customers]);

  const customerDiscountStats = useMemo(() => {
    if (!selectedCustomerData) return null;
    const historyTotal = Number(
      selectedCustomerData.domain_data?.discounts_availed ||
      selectedCustomerData.domain_data?.total_discounts ||
      selectedCustomerData.discounts_availed ||
      0
    );
    const preferredPct = Number(
      selectedCustomerData.domain_data?.preferred_discount ||
      selectedCustomerData.domain_data?.discount_rate ||
      (historyTotal > 0 ? 10 : 5)
    );
    return { historyTotal, preferredPct };
  }, [selectedCustomerData]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDueDateManuallyEdited, setIsDueDateManuallyEdited] = useState(Boolean(initialData?.due_date || initialData?.dueDate));
  const [smartDraftMeta, setSmartDraftMeta] = useState(null);
  const [showTaxCalculator, setShowTaxCalculator] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const isSubmittingRef = useRef(false); // Submission lock
  const [isExporting, setIsExporting] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [showCustomerDetails, setShowCustomerDetails] = useState(() => !initialData?.customer?.name && !initialData?.customer_name);

  const approvalStatus = String(invoice.approval_status || 'none').toLowerCase();
  const canSubmitForApproval = Boolean(
    business?.id &&
    !isSaving &&
    !isSubmittingApproval &&
    invoice.items.length > 0 &&
    invoice.customer?.name &&
    approvalStatus !== 'approved' &&
    approvalStatus !== 'pending'
  );

  const approvalStatusConfig = {
    none: {
      label: 'Draft',
      icon: FileText,
      className: 'bg-slate-100 text-slate-700 border-slate-200',
      helper: 'Save draft to continue editing.',
    },
    pending: {
      label: 'Pending Approval',
      icon: Clock3,
      className: 'bg-amber-100 text-amber-800 border-amber-200',
      helper: 'Awaiting reviewer decision.',
    },
    approved: {
      label: 'Approved',
      icon: CheckCircle2,
      className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      helper: 'Ready for dispatch and payment follow-up.',
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      className: 'bg-rose-100 text-rose-800 border-rose-200',
      helper: 'Update invoice details and resubmit.',
    },
  };

  const activeApprovalStatus = approvalStatusConfig[approvalStatus] || approvalStatusConfig.none;

  // Pakistani Seasonal Pricing
  const seasonalPricingEnabled = hasSeasonalPricing(category);
  const currentSeason = seasonalPricingEnabled ? getCurrentSeason() : null;

  // Update item field (Hoisted for use in barcode scan)
  const updateItem = (id, field, value) => {
    const clampNumber = (num, min, max) => Math.min(max, Math.max(min, num));

    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          let normalizedValue = value;

          if (field === 'quantity') {
            normalizedValue = clampNumber(Number(value) || 0, 0, 999999);
          }
          if (field === 'rate' || field === 'amount') {
            normalizedValue = clampNumber(Number(value) || 0, 0, 999999999);
          }
          if (field === 'discount' || field === 'taxPercent') {
            normalizedValue = clampNumber(Number(value) || 0, 0, 100);
          }

          const updated = { ...item, [field]: normalizedValue };

          // Auto-fill from product
          if (field === 'productId' && value) {
            const product = products.find(p => p.id === value);
            if (product) {
              updated.name = product.name;
              updated.hsn = product.hsn || product.hsnCode || '';
              updated.rate = resolveProductPrice(product);
              updated.taxPercent = showTaxUi
                ? (Number(product.taxPercent) || (isPakistaniDomain ? lineDefaultTaxRate : 0))
                : 0;
              updated.unit = product.unit || 'pcs';

              // Auto-fill domain metadata if available
              if (product.domain_data) {
                updated.article_no = product.domain_data.articleno || product.domain_data.article_no || '';
                updated.design_no = product.domain_data.designno || product.domain_data.design_no || '';
                updated.fabric_type = product.domain_data.fabrictype || product.domain_data.fabric_type || '';
                updated.color_shade = product.domain_data.colorshade || product.domain_data.color_shade || product.domain_data.color || '';
                // Pre-populate thaan_length from product domain_data so conversion works immediately
                if (!updated.thaan_length) {
                  updated.thaan_length = Number(product.domain_data.thaanlength || product.domain_data.thaan_length || 0) || '';
                }
                // Pre-populate roll_bale_no from batch if available
                if (!updated.roll_bale_no && product.domain_data.batch_number) {
                  updated.roll_bale_no = product.domain_data.batch_number || '';
                }
              }
            }
          }

          // Back-calculate Rate if Amount is changed manually
          if (field === 'amount') {
            const taxPerc = Number(updated.taxPercent) || 0;
            const discPerc = Number(updated.discount) || 0;
            const qty = Number(updated.quantity) || 1;

            const taxFactor = 1 + (taxPerc / 100);
            const discFactor = 1 - (discPerc / 100);

            if (qty > 0 && discFactor > 0 && taxFactor > 0) {
              updated.rate = normalizedValue / (qty * discFactor * taxFactor);
            }
          }

          // Calculate amount (Forward calculation)
          if (field === 'quantity' || field === 'rate' || field === 'discount' || field === 'taxPercent' || field === 'productId' || field === 'unit' || field === 'thaan_length' || field === 'suit_cutting') {
            const isTextileDomain = category === 'textile-wholesale' || category === 'textile';
            const textileConv = isTextileDomain ? resolveTextileLineQty(updated) : null;
            const effectiveQty =
              textileConv?.totalMeters &&
              updated._rate_basis !== 'per_thaan' &&
              updated._rate_basis !== 'per_suit'
                ? textileConv.totalMeters
                : (Number(updated.quantity) || 0);

            const rate = Number(updated.rate) || 0;
            const disc = Number(updated.discount) || 0;
            const tax = Number(updated.taxPercent) || 0;

            const baseAmount = effectiveQty * rate;
            const discountAmount = (baseAmount * disc) / 100;
            const taxableAmount = baseAmount - discountAmount;
            const taxAmount = (taxableAmount * tax) / 100;
            updated.amount = taxableAmount + taxAmount;
          }

          // Auto-fill fabric unit conversions for textile domains
          const isTextileDomain = category === 'textile-wholesale' || category === 'textile';
          if (isTextileDomain && field === 'unit') {
            const matchedProduct = products.find(p => p.id === item.productId);
            const textilePatches = autoFillTextileLineOnUnitChange(item, matchedProduct, normalizedValue);
            Object.assign(updated, textilePatches);
          }

          // Auto-recalculate amount when thaan_length changes (thaan billing)
          if (isTextileDomain && field === 'thaan_length') {
            if (String(item.unit || '').toLowerCase() === 'thaan') {
              const newThaanLen = Number(normalizedValue) || 0;
              if (newThaanLen > 0 && item._per_meter_rate) {
                updated.rate = Math.round(item._per_meter_rate * newThaanLen * 100) / 100;
              }
              updated.thaan_length = newThaanLen;
            }
          }

          return updated;
        }
        return item;
      })
    }));
  };



  // Calculate totals - supports both GST and Pakistani tax
  const calculateTotals = useMemo(() => {
    const isTextileDomain = category === 'textile-wholesale' || category === 'textile';
    const subtotal = invoice.items.reduce((sum, item) => {
      const textileConv = isTextileDomain ? resolveTextileLineQty(item) : null;
      const effectiveQty =
        textileConv?.totalMeters &&
        item._rate_basis !== 'per_thaan' &&
        item._rate_basis !== 'per_suit'
          ? textileConv.totalMeters
          : (Number(item.quantity) || 0);

      const baseAmount = effectiveQty * Number(item.rate || 0);
      const discountAmount = (baseAmount * Number(item.discount || 0)) / 100;
      return sum + baseAmount - discountAmount;
    }, 0);

    const discountAmount = invoice.discountType === 'percent'
      ? (subtotal * (invoice.discount || 0)) / 100
      : (invoice.discount || 0);

    // Calculate seasonal discount if applicable
    let seasonalDiscountAmount = 0;
    let seasonalDiscountDetails = [];
    
    if (seasonalPricingEnabled && currentSeason) {
      invoice.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product && product.category) {
          const seasonalDiscount = getSeasonalDiscount(product.category);
          if (seasonalDiscount > 0) {
            const itemBase = Number(item.quantity || 0) * Number(item.rate || 0);
            const itemDiscount = (itemBase * Number(item.discount || 0)) / 100;
            const itemAfterDiscount = itemBase - itemDiscount;
            const seasonalAmount = (itemAfterDiscount * seasonalDiscount) / 100;
            seasonalDiscountAmount += seasonalAmount;
            seasonalDiscountDetails.push({
              itemName: item.name,
              category: product.category,
              discountPercent: seasonalDiscount,
              amount: seasonalAmount
            });
          }
        }
      });
    }

    const finalSubtotal = subtotal - discountAmount - seasonalDiscountAmount;

    const globalDiscountFactor = subtotal > 0 ? (subtotal - discountAmount - seasonalDiscountAmount) / subtotal : 1;

    const itemsForTax = invoice.items.map(item => {
      const itemBase = Number(item.quantity || 0) * Number(item.rate || 0);
      const itemDiscount = (itemBase * Number(item.discount || 0)) / 100;
      const itemTaxable = itemBase - itemDiscount;

      return {
        amount: itemTaxable * globalDiscountFactor,
        taxPercent: showTaxUi ? item.taxPercent : 0,
        category: item.taxCategory,
        domain: category
      };
    });

    const taxResult = showTaxUi
      ? strategy.calculateBulk(itemsForTax, standards)
      : { totalTax: 0, taxAmount: 0, details: {} };
    // taxResult.totalTax is the canonical field; fall back to taxAmount for safety
    const totalTax = showTaxUi ? Number(taxResult.totalTax ?? taxResult.taxAmount ?? 0) : 0;

    const total = Number((finalSubtotal + totalTax).toFixed(2));
    const manualRoundOff = Number(invoice.roundOff || 0) || 0;
    const grandTotal = Number((total + manualRoundOff).toFixed(2));

    return {
      subtotal: finalSubtotal,
      rawSubtotal: subtotal,
      totalTax,
      tax_total: totalTax,
      taxDetails: taxResult.details,
      total: grandTotal,
      grand_total: grandTotal,
      roundOff: manualRoundOff,
      discount: discountAmount,
      discount_total: discountAmount,
      seasonalDiscount: seasonalDiscountAmount,
      seasonalDiscountDetails,
    };
  }, [invoice.items, invoice.discount, invoice.discountType, invoice.roundOff, standards, category, seasonalPricingEnabled, currentSeason, products, showTaxUi, strategy]);

  // Credit limit warning
  const creditWarning = useCreditLimitCheck(selectedCustomerData, calculateTotals.total);

  // Keyboard Shortcuts moved below totals declaration

  // Barcode scan — client catalog + live DB fallback
  const addProductFromScan = useCallback(async (code) => {
    if (!code) return false;
    let product = findProductByScanCode(products, code);
    if (!product && business?.id) {
      try {
        const result = await lookupProductByScanCodeAction(business.id, code);
        if (result.success && result.product) product = result.product;
      } catch {
        /* client-only */
      }
    }
    if (!product) {
      toast.error(`Product not found for barcode: ${code}`);
      return false;
    }

    const existingItem = invoice.items.find((item) => item.productId === product.id);
    if (existingItem) {
      updateItem(existingItem.id, 'quantity', existingItem.quantity + 1);
    } else {
      const newItem = {
        id: Date.now(),
        productId: product.id,
        name: product.name,
        hsn: product.hsn || product.hsnCode || product.hsn_code || '',
        quantity: 1,
        unit: product.unit || 'pcs',
        rate: resolveProductPrice(product),
        discount: 0,
        taxPercent: showTaxUi
          ? (product.taxPercent || product.tax_percent || (isPakistaniDomain ? lineDefaultTaxRate : 0))
          : 0,
        amount: resolveProductPrice(product),
        taxCategory: isPakistaniDomain ? getTaxCategoryForDomain(category) : 'retail-standard',
      };
      setInvoice((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    }
    toast.success(`Added: ${product.name}`);
    setBarcodeInput('');
    return true;
  }, [
    products,
    business?.id,
    invoice.items,
    updateItem,
    isPakistaniDomain,
    lineDefaultTaxRate,
    showTaxUi,
    category,
  ]);

  const handleBarcodeScan = (code) => {
    void addProductFromScan(code);
  };

  // Update customer details when selected
  const applyCustomerProfile = (customer, preserveDueDate = false) => {
    if (!customer) return;

    const preferredGateway = mapPreferredPaymentMethod(
      customer.preferred_payment_method || customer.payment_method || customer.preferredPaymentMethod
    );
    const creditDays = extractCreditDays(customer);

    setInvoice(prev => {
      const computedDueDate = creditDays > 0
        ? addDaysLocal(prev.date || new Date().toISOString().split('T')[0], creditDays)
        : '';

      return {
        ...prev,
        paymentMethod: preferredGateway || prev.paymentMethod,
        dueDate: preserveDueDate ? prev.dueDate : (computedDueDate || prev.dueDate),
        customer: {
          ...prev.customer,
          id: customer.id || prev.customer.id,
          name: customer.name || prev.customer.name,
          email: customer.email || prev.customer.email,
          phone: customer.phone || prev.customer.phone,
          address: customer.address || customer.delivery_address || prev.customer.address,
          taxId: customer.tax_id || customer.ntn || customer.gstin || prev.customer.taxId,
          secondaryTaxId: customer.srn || prev.customer.secondaryTaxId,
          province: normalizeProvince(customer.province || prev.customer.province || 'punjab'),
          credit_limit: Number(customer.credit_limit || customer.creditLimit || prev.customer.credit_limit || 0),
          outstanding_balance: Number(customer.outstanding_balance || customer.outstandingBalance || prev.customer.outstanding_balance || 0),
        }
      };
    });

    if (!preserveDueDate) {
      setIsDueDateManuallyEdited(false);
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      applyCustomerProfile(selectedCustomer, isDueDateManuallyEdited);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (!selectedCustomer || isDueDateManuallyEdited) return;
    const creditDays = extractCreditDays(selectedCustomer);
    if (creditDays <= 0) return;

    const recomputedDueDate = addDaysLocal(invoice.date || new Date().toISOString().split('T')[0], creditDays);

    if (invoice.dueDate !== recomputedDueDate) {
      setInvoice(prev => ({ ...prev, dueDate: recomputedDueDate }));
    }
  }, [invoice.date, selectedCustomer, isDueDateManuallyEdited]);

  useEffect(() => {
    const invoiceId = invoice?.id || initialData?.id;
    if (!business?.id || !invoiceId) {
      setApprovalHistory([]);
      return;
    }

    let ignore = false;
    const loadApprovalHistory = async () => {
      try {
        const result = await getApprovalHistoryAction(business.id, invoiceId);
        if (!ignore) {
          setApprovalHistory(result?.success ? (result.history || []) : []);
        }
      } catch (error) {
        if (!ignore) setApprovalHistory([]);
      }
    };

    loadApprovalHistory();
    return () => { ignore = true; };
  }, [business?.id, invoice?.id, initialData?.id]);

  // Add item to invoice
  const addItem = () => {
    const lastItem = invoice.items[invoice.items.length - 1];
    const newItem = {
      id: Date.now(),
      productId: '',
      name: '',
      hsn: '',
      quantity: 1,
      unit: lastItem?.unit || defaultLineUnit,
      rate: 0,
      discount: 0,
      taxPercent: showTaxUi
        ? (lastItem?.taxPercent ?? (isPakistaniDomain ? lineDefaultTaxRate : 0))
        : 0,
      amount: 0,
      taxCategory: isPakistaniDomain ? getTaxCategoryForDomain(category) : 'retail-standard',
    };
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const applySmartDraft = (scope = 'items') => {
    if (!products?.length) {
      toast.error('No products available for smart draft');
      return;
    }

    if (invoice.items.length > 0) {
      const proceed = confirm('Smart Draft will replace current line items. Continue?');
      if (!proceed) return;
    }

    const domainHint = String(category || '').split('-')[0].toLowerCase();
    const getCustomerScore = (customer) => {
      const spend = Number(customer?.total_spent || customer?.lifetime_value || 0) || 0;
      const orders = Number(customer?.order_count || customer?.total_orders || 0) || 0;
      const outstanding = Number(customer?.outstanding_balance || 0) || 0;
      const contactBonus = customer?.phone || customer?.email ? 200 : 0;
      return (spend * 0.1) + (orders * 50) - (outstanding * 0.05) + contactBonus;
    };

    const getProductScore = (product) => {
      const sold = Number(product?.total_sold || product?.sales_count || product?.sold_quantity || 0) || 0;
      const stock = Number(product?.stock || 0) || 0;
      const categoryMatch = String(product?.category || '').toLowerCase().includes(domainHint) ? 150 : 0;
      return (sold * 20) + (stock * 2) + categoryMatch;
    };

    const recommendedCustomer = [...(customers || [])]
      .filter(c => c?.id)
      .sort((a, b) => getCustomerScore(b) - getCustomerScore(a))[0] || null;

    const candidateProducts = [...products]
      .filter(product => {
        const price = Number(product?.price || product?.selling_price || 0) || 0;
        return product?.is_active !== false && price > 0;
      })
      .sort((a, b) => getProductScore(b) - getProductScore(a))
      .slice(0, 3);

    if (candidateProducts.length === 0) {
      toast.error('No priced products available for smart draft');
      return;
    }

    const suggestedItems = candidateProducts.map((product, index) => {
      const quantity = 1;
      const rate = Number(product?.price || product?.selling_price || 0) || 0;
      const taxPercent = showTaxUi
        ? (Number(product?.taxPercent || product?.tax_percent || (isPakistaniDomain ? lineDefaultTaxRate : 0)) || 0)
        : 0;
      const amount = rate + ((rate * taxPercent) / 100);

      return {
        id: Date.now() + index,
        productId: product.id,
        name: product.name || 'Item',
        hsn: product.hsn || product.hsn_code || product.hsnCode || '',
        quantity,
        unit: product.unit || 'pcs',
        rate,
        discount: 0,
        taxPercent,
        amount,
        taxCategory: isPakistaniDomain ? getTaxCategoryForDomain(category) : 'retail-standard',
        article_no: product?.domain_data?.articleno || product?.domain_data?.article_no || '',
        design_no: product?.domain_data?.designno || product?.domain_data?.design_no || '',
        fabric_type: product?.domain_data?.fabrictype || product?.domain_data?.fabric_type || '',
      };
    });

    const hasManualCustomer = Boolean(invoice.customer?.id || invoice.customer?.name);
    const shouldApplyCustomer = scope === 'full' && recommendedCustomer;

    if (shouldApplyCustomer) {
      setSelectedCustomer(recommendedCustomer);
      applyCustomerProfile(recommendedCustomer, false);
    }

    setInvoice(prev => ({
      ...prev,
      items: suggestedItems,
      notes: prev.notes || `Smart draft generated for ${category.replace('-', ' ')} workflow.`,
    }));

    setSmartDraftMeta({
      generatedAt: new Date().toISOString(),
      customerLabel: shouldApplyCustomer
        ? (recommendedCustomer?.name || 'No customer recommendation')
        : (invoice.customer?.name || 'Customer unchanged'),
      productLabels: suggestedItems.map(item => item.name).slice(0, 3),
      customerMode: shouldApplyCustomer ? 'recommended' : (hasManualCustomer ? 'preserved' : 'unchanged'),
      scope,
    });

    toast.success(
      scope === 'full'
        ? `Smart draft applied (customer + ${suggestedItems.length} item${suggestedItems.length > 1 ? 's' : ''})`
        : `Smart items applied (${suggestedItems.length} suggestion${suggestedItems.length > 1 ? 's' : ''})`
    );
  };



  // Remove item from invoice
  const removeItem = (id) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };



  const totals = calculateTotals;

  const postingHealth = useMemo(() => {
    const grandTotal = Number(totals.total) || 0;
    const rawSubtotal = Number(totals.rawSubtotal ?? totals.subtotal) || 0;
    const tax = Number(totals.totalTax || totals.tax_total || 0) || 0;
    const discount = Number(totals.discount || 0) || 0;
    const seasonal = Number(totals.seasonalDiscount || 0) || 0;
    const roundOff = Number(totals.roundOff || 0) || 0;
    // Expected: rawSubtotal - discount - seasonal + tax + roundOff = grandTotal
    const expected = Number((rawSubtotal - discount - seasonal + tax + roundOff).toFixed(2));
    const difference = Math.abs(grandTotal - expected);
    return {
      debit: grandTotal,
      credit: expected,
      balanced: difference < 0.02,
      difference,
    };
  }, [totals]);

  const duplicateItemSignals = useMemo(() => {
    const grouped = new Map();

    invoice.items.forEach((item, index) => {
      const key = String(item.productId || item.name || '').trim().toLowerCase();
      if (!key) return;

      if (!grouped.has(key)) {
        grouped.set(key, { key, indexes: [], label: item.name || `Item ${index + 1}` });
      }

      const bucket = grouped.get(key);
      bucket.indexes.push(index + 1);
    });

    return Array.from(grouped.values()).filter((entry) => entry.indexes.length > 1);
  }, [invoice.items]);

  // Keyboard Shortcuts (Re-inserted here to access totals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl + B: Barcode Focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        document.getElementById('barcode-sniffer')?.focus();
      }
      // Escape: Dismiss
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [invoice, totals]);

  // Handle save with validation
  const persistInvoice = async () => {
    if (!invoice.items.length) {
      toast.error('Add at least one item before finalizing invoice');
      return null;
    }

    const invalidRowIndex = invoice.items.findIndex(item => {
      const quantity = Number(item.quantity || 0);
      const rate = Number(item.rate || 0);
      return !item.name || quantity <= 0 || rate < 0;
    });

    if (invalidRowIndex !== -1) {
      toast.error(`Please complete row ${invalidRowIndex + 1} (item, quantity, rate)`);
      return null;
    }

    if (invoice.dueDate && invoice.date && invoice.dueDate < invoice.date) {
      toast.error('Due date cannot be earlier than invoice date');
      return null;
    }

    if (duplicateItemSignals.length > 0) {
      const duplicateSummary = duplicateItemSignals
        .slice(0, 3)
        .map((entry) => `${entry.label} (rows ${entry.indexes.join(', ')})`)
        .join('\n');

      const continueWithDuplicates = confirm(
        `Duplicate line items detected:\n${duplicateSummary}\n\nContinue anyway?`
      );

      if (!continueWithDuplicates) return null;
    }

    // Zod schema validation
    const schemaData = {
      business_id: business?.id,
      customer_id: invoice.customer?.id || null,
      invoice_number: invoice.invoiceNumber || `INV-${Date.now()}`,
      date: invoice.date || new Date().toISOString(),
      due_date: invoice.dueDate || null,
      items: invoice.items.map(item => ({
        product_id: item.productId || item.product_id || null,
        name: item.name || item.description || 'Item',
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.rate || item.unit_price || 0),
        tax_percent: Number(item.taxPercent || (showTaxUi ? lineDefaultTaxRate : 0) || 0),
        discount_amount: ((Number(item.quantity || 0) * Number(item.rate || 0)) * Number(item.discount || 0)) / 100,
      })),
      subtotal: totals.subtotal || 0,
      total_tax: totals.totalTax || totals.tax_total || 0,
      discount_total: totals.discount || 0,
      grand_total: totals.total || 0,
      status: 'draft',
      notes: invoice.notes || null,
      terms: invoice.terms || null,
    };
    const validation = validateWithSchema(invoiceSchema, schemaData);
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError || 'Please fix validation errors');
      return null;
    }

    // Additional UI checks
    if (!invoice.customer.name) {
      toast.error('Please enter customer name');
      return null;
    }

    if (!postingHealth.balanced) {
      toast.error(`Posting check failed: debit ${postingHealth.debit.toFixed(2)} vs credit ${postingHealth.credit.toFixed(2)}`);
      return null;
    }

    if (isPakistaniDomain) {
      // NTN is optional but recommended
      if (!invoice.customer.taxId && invoice.invoiceType === 'fbr') {
        const proceed = confirm('NTN not provided. Continue anyway?');
        if (!proceed) return null;
      }
    }

    if (isSubmittingRef.current) return null;
    isSubmittingRef.current = true;
    setIsSaving(true);

    try {
      const normalizedItems = invoice.items.map(item => {
        const serialNumbers = Array.isArray(item.serial_numbers)
          ? item.serial_numbers
          : item.serialNumber
          ? [item.serialNumber]
          : [];

        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.rate || item.unit_price || 0);
        const discountPct = Number(item.discount || 0);
        const taxPercent = Number(item.taxPercent || item.tax_percent || 0);
        const lineBase = quantity * unitPrice;
        const discountAmount = (lineBase * discountPct) / 100;
        const taxable = Math.max(0, lineBase - discountAmount);
        const taxAmount = Number.isFinite(Number(item.tax_amount ?? item.taxAmount))
          ? Number(item.tax_amount ?? item.taxAmount)
          : Math.round((taxable * taxPercent) / 100 * 100) / 100;

        return {
          ...item,
          quantity,
          rate: unitPrice,
          unit_price: unitPrice,
          discount: discountPct,
          discount_amount: discountAmount,
          taxPercent,
          tax_percent: taxPercent,
          tax_amount: taxAmount,
          taxAmount,
          amount: Number(item.amount || taxable + taxAmount),
          total_amount: Number(item.amount || taxable + taxAmount),
          batch_number: item.batch_number || item.batchNumber || '',
          batch_id: item.batch_id || item.batchId || null,
          serial_numbers: serialNumbers,
          metadata: {
            ...(item.metadata || {}),
            unit: item.unit || item.metadata?.unit || defaultLineUnit,
            article_no: item.article_no || item.metadata?.article_no || '',
            design_no: item.design_no || item.metadata?.design_no || '',
            fabric_type: item.fabric_type || item.metadata?.fabric_type || '',
            batch_number: item.batch_number || item.batchNumber || item.metadata?.batch_number || null,
            batch_id: item.batch_id || item.batchId || item.metadata?.batch_id || null,
            serial_numbers: serialNumbers,
          },
        };
      });

      const taxTotal = Number(totals.totalTax || totals.tax_total || 0);

      const updatedCustomerDomainData = {
        ...(selectedCustomerData?.domain_data || {}),
        discounts_availed: Number(selectedCustomerData?.domain_data?.discounts_availed || 0) + Number(totals.discount || 0),
        cnic: invoice.vehicleAgreement?.buyerCnic || selectedCustomerData?.cnic || selectedCustomerData?.domain_data?.cnic || '',
      };

      // Generate FBR-compliant invoice for Pakistani domains
      let finalInvoice = {
        ...invoice,
        category,
        vehicleAgreement: invoice.vehicleAgreement || {},
        vehicle_meta: invoice.vehicleAgreement || {},
        customer_domain_data_patch: updatedCustomerDomainData,
        payment_method: invoice.paymentMethod || invoice.payment_method || (isPakistaniDomain ? 'cod' : 'cash'),
        paymentMethod: invoice.paymentMethod || invoice.payment_method || (isPakistaniDomain ? 'cod' : 'cash'),
        invoiceType: invoice.invoiceType || 'retail',
        tax_details: {
          ...(invoice.taxDetails || {}),
          ...(invoice.tax_details || {}),
          invoice_type: invoice.invoiceType || 'retail',
          vehicleAgreement: invoice.vehicleAgreement || {},
        },
        items: normalizedItems,
        totals: {
          ...totals,
          totalTax: taxTotal,
          tax_total: taxTotal,
          total_tax: taxTotal,
        },
        tax_total: taxTotal,
        total_tax: taxTotal,
        business_id: business?.id // Ensure business_id is present
      };

      if (isPakistaniDomain) {
        finalInvoice = generateFBRInvoice({
          ...finalInvoice,
          items: normalizedItems.map(item => ({
            ...item,
            domain: category,
          })),
        }, invoice.customer.province || 'punjab');
        // Re-ensure vehicleAgreement is attached after FBR transform
        finalInvoice.vehicleAgreement = invoice.vehicleAgreement || {};
        finalInvoice.vehicle_meta = invoice.vehicleAgreement || {};
        finalInvoice.customer_domain_data_patch = updatedCustomerDomainData;
        finalInvoice.tax_details = {
          ...(finalInvoice.tax_details || {}),
          vehicleAgreement: invoice.vehicleAgreement || {},
        };
      }

      const savedInvoice = await onSave?.(finalInvoice);
      return savedInvoice || null;
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(error?.message || 'Failed to save invoice. Please try again.');
      isSubmittingRef.current = false; // Reset only on error
      return null;
    } finally {
      setIsSaving(false);
      // Note: We don't reset isSubmittingRef on success because component unmounts 
      // or we explicitly want to block further clicks until close.
      if (!onSave) isSubmittingRef.current = false;
    }
  };

  // Handle save with validation
  const handleSave = async () => {
    const saved = await persistInvoice();
    if (saved) {
      onClose();
    }
  };

  const handleSaveAndSubmitForApproval = async () => {
    if (!canSubmitForApproval) {
      toast.error('Complete customer and item details before saving');
      return;
    }

    setIsSubmittingApproval(true);
    try {
      const savedInvoice = await persistInvoice();
      if (savedInvoice) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error(error?.message || 'Failed to save invoice');
    } finally {
      setIsSubmittingApproval(false);
      isSubmittingRef.current = false;
    }
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generateInvoicePDF(
        { ...invoice, category, invoiceType: invoice.invoiceType || 'retail' },
        totals,
        business,
        isPakistaniDomain
      );
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  /** Exact-size 58mm/80mm thermal receipt (same path as POS). */
  const handlePrintThermal = async () => {
    if (!business) {
      toast.error('No business selected');
      return;
    }
    setIsExporting(true);
    try {
      const draftInvoice = {
        invoice_number: invoice.invoiceNumber || 'DRAFT',
        date: invoice.date || new Date().toISOString(),
        customer_name: invoice.customer?.name || null,
        payment_method: invoice.paymentMethod || 'cash',
        subtotal: totals.subtotal,
        tax_total: totals.tax || totals.taxAmount || 0,
        discount_total: totals.discount || totals.discountAmount || 0,
        grand_total: totals.total,
        items: (invoice.items || []).map((item) => ({
          name: item.name || item.product_name || 'Item',
          sku: item.sku,
          quantity: item.quantity,
          unit_price: item.rate ?? item.unitPrice ?? item.unit_price ?? 0,
          amount: item.amount ?? item.total ?? ((item.rate || 0) * (item.quantity || 1)),
        })),
      };
      const ok = await printInvoiceThermalFromRow(draftInvoice, business, category);
      if (ok === false) toast.error('Could not open thermal print');
      else toast.success('Thermal receipt opened');
    } catch (error) {
      console.error('Error printing thermal receipt:', error);
      toast.error('Failed to print thermal receipt');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle tax calculation from calculator
  const handleTaxCalculation = (taxBreakdown) => {
    setInvoice(prev => ({
      ...prev,
      pakistaniTax: {
        federalSalesTax: taxBreakdown.federalSalesTax,
        provincialSalesTax: taxBreakdown.provincialSalesTax,
        withholdingTax: taxBreakdown.withholdingTax,
        totalTax: taxBreakdown.totalTax,
        province: prev.customer.province || 'punjab',
      }
    }));
    setShowTaxCalculator(false);
    toast.success('Tax calculated and applied');
  };

  return (
    <div className={cn(MOBILE_OVERLAY, 'animate-in fade-in duration-300')}>
      <Card className={cn(MOBILE_OVERLAY_CARD, 'max-w-6xl shadow-2xl border-0 overflow-hidden flex flex-col')}>
        {/* Header Bar - Light & Theme-Aware */}
        <CardHeader className="relative shrink-0 flex flex-col gap-2 border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
          <div className="min-w-0 space-y-1 pr-10 sm:pr-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl flex items-center gap-2">
                <FileText className="w-5.5 h-5.5" style={{ color: brandAccent }} />
                {initialData ? 'Edit Invoice' : 'New Invoice'}
              </CardTitle>
              <Badge variant="outline" className="text-[11px] font-semibold bg-white text-slate-700 border-slate-200 shadow-2xs">
                {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge className={cn('text-[10px] font-bold uppercase tracking-wider border shadow-2xs', activeApprovalStatus.className)}>
                <activeApprovalStatus.icon className="w-3.5 h-3.5 mr-1" />
                {activeApprovalStatus.label}
              </Badge>
              {currentSeason && (
                <Badge variant="outline" className="text-[10px] font-bold text-orange-700 border-orange-200 bg-orange-50 uppercase tracking-wider">
                  {currentSeason.name.en} ({currentSeason.discountPercent}% OFF)
                </Badge>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div
              className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 cursor-pointer shadow-2xs"
              onClick={() => setShowKeyboardHints(!showKeyboardHints)}
              title="Toggle Hotkeys"
            >
              <Keyboard className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Hotkeys</span>
            </div>
            <div className="text-right hidden md:block border-l border-slate-200 pl-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Invoice Number</p>
              <p className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 px-2.5 py-0.5 rounded shadow-2xs">
                {invoice.invoiceNumber || 'AUTO-GEN'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-2 top-2.5 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors sm:static sm:ml-2"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        {showKeyboardHints && (
          <div className="border-b border-slate-200 bg-slate-800 px-4 py-2 text-[10px] font-medium text-slate-200 shadow-inner sm:px-6 sm:text-[11px]">
            <div className="flex flex-wrap gap-4 sm:gap-6">
              <span className="flex items-center gap-1.5"><kbd className="bg-slate-700 border border-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px] text-indigo-300 shadow-2xs">CTRL+S</kbd> Save Invoice</span>
              <span className="flex items-center gap-1.5"><kbd className="bg-slate-700 border border-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px] text-indigo-300 shadow-2xs">CTRL+B</kbd> Barcode Focus</span>
              <span className="flex items-center gap-1.5"><kbd className="bg-slate-700 border border-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px] text-indigo-300 shadow-2xs">ENTER</kbd> New Item Line</span>
              <span className="flex items-center gap-1.5"><kbd className="bg-slate-700 border border-slate-600 px-1.5 py-0.5 rounded font-mono text-[10px] text-indigo-300 shadow-2xs">ESC</kbd> Close</span>
            </div>
          </div>
        )}

        <CardContent className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-slate-50/50 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:space-y-6 sm:p-6 sm:pb-6">
          {/* Business Header Info (if configured) */}
          {business?.name && (
            <div className="rounded-xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">
                  {business.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900 leading-tight">
                    {business.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                    {business.address && <span>{business.address}</span>}
                    {business.ntn && <span><span className="font-semibold text-slate-700">NTN:</span> {business.ntn}</span>}
                    {business.phone && <span><span className="font-semibold text-slate-700">Tel:</span> {business.phone}</span>}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="self-start sm:self-auto text-[10px] font-mono font-semibold text-slate-600 bg-slate-50 border-slate-200">
                Tenant ID: {business.id?.slice(0, 8)}
              </Badge>
            </div>
          )}

          {/* Top Document Header Grid: Split View (Customer Card + Invoice Meta Card) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left Card: Customer & Bill-To (lg:col-span-7) */}
            <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  Customer & Billing Details
                </h3>
                {customers.length > 0 && (
                  <Combobox
                    options={customers.map(c => ({
                      value: String(c.id),
                      label: c.name,
                      description: c.phone || c.email || (c.ntn ? `NTN: ${c.ntn}` : '')
                    }))}
                    value={String(invoice.customer?.id || '')}
                    onChange={(val) => {
                      const customer = customers.find(c => String(c.id) === String(val));
                      if (customer) {
                        setSelectedCustomer(customer);
                        applyCustomerProfile(customer, isDueDateManuallyEdited);
                      }
                    }}
                    placeholder="Search customers..."
                    emptyText="No customer found"
                    className="h-8 text-xs w-full sm:w-[240px] shadow-2xs"
                  />
                )}
              </div>

              {/* Compact Customer Summary View when selected and collapsed */}
              {!showCustomerDetails && invoice.customer.name ? (
                <div className="rounded-lg border border-slate-200/80 bg-slate-50 p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{invoice.customer.name}</span>
                      {invoice.customer.taxId && (
                        <Badge variant="outline" className="text-[10px] font-mono bg-white text-slate-700 border-slate-200">
                          {standards.taxIdLabel}: {invoice.customer.taxId}
                        </Badge>
                      )}
                      {invoice.customer.province && standards.countryCode === 'PK' && (
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold bg-white text-slate-600 border-slate-200">
                          {invoice.customer.province}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      {invoice.customer.phone && <span>Tel: {invoice.customer.phone}</span>}
                      {invoice.customer.email && <span>Email: {invoice.customer.email}</span>}
                      {invoice.customer.address && <span className="truncate max-w-[280px]">Addr: {invoice.customer.address}</span>}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomerDetails(true)}
                    className="h-7 px-2 text-[11px] font-semibold text-slate-700 border-slate-200 hover:bg-slate-100 shrink-0"
                  >
                    <Edit2 className="w-3 h-3 mr-1 text-slate-500" />
                    Edit
                  </Button>
                </div>
              ) : (
                /* Full Customer Details Input Grid */
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Customer Name *</Label>
                      <Input
                        value={invoice.customer.name || ''}
                        onChange={(e) => setInvoice({
                          ...invoice,
                          customer: { ...invoice.customer, name: e.target.value }
                        })}
                        required
                        placeholder="Enter customer name..."
                        className="h-8.5 text-xs shadow-2xs border-slate-200 focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{standards.taxIdLabel}</Label>
                      <Input
                        value={invoice.customer.taxId || ''}
                        onChange={(e) => setInvoice({
                          ...invoice,
                          customer: { ...invoice.customer, taxId: e.target.value }
                        })}
                        onBlur={() => {
                          const entered = String(invoice.customer.taxId || '').trim().toLowerCase();
                          if (!entered || selectedCustomer) return;
                          const matched = customers.find(c => {
                            const candidate = String(c.tax_id || c.ntn || c.gstin || '').trim().toLowerCase();
                            return candidate && candidate === entered;
                          });
                          if (matched) {
                            setSelectedCustomer(matched);
                            applyCustomerProfile(matched, isDueDateManuallyEdited);
                            toast.success('Customer auto-filled from tax ID');
                          }
                        }}
                        placeholder={`${standards.taxIdLabel} Number`}
                        className="h-8.5 text-xs shadow-2xs border-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {standards.countryCode === 'PK' && (
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Province</Label>
                        <select
                          value={invoice.customer.province}
                          onChange={(e) => setInvoice({
                            ...invoice,
                            customer: { ...invoice.customer, province: e.target.value }
                          })}
                          className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 cursor-pointer h-8.5"
                        >
                          <option value="punjab">Punjab</option>
                          <option value="sindh">Sindh</option>
                          <option value="kp">Khyber Pakhtunkhwa</option>
                          <option value="balochistan">Balochistan</option>
                          <option value="islamabad">Islamabad (Federal)</option>
                        </select>
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Email</Label>
                      <Input
                        type="email"
                        value={invoice.customer.email || ''}
                        onChange={(e) => setInvoice({
                          ...invoice,
                          customer: { ...invoice.customer, email: e.target.value }
                        })}
                        placeholder="customer@domain.com"
                        className="h-8.5 text-xs shadow-2xs border-slate-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Phone</Label>
                      <Input
                        value={invoice.customer.phone || ''}
                        onChange={(e) => setInvoice({
                          ...invoice,
                          customer: { ...invoice.customer, phone: e.target.value }
                        })}
                        onBlur={() => {
                          const entered = String(invoice.customer.phone || '').replace(/\D/g, '');
                          if (!entered || selectedCustomer) return;
                          const matched = customers.find(c => String(c.phone || '').replace(/\D/g, '') === entered);
                          if (matched) {
                            setSelectedCustomer(matched);
                            applyCustomerProfile(matched, isDueDateManuallyEdited);
                            toast.success('Customer auto-filled from phone');
                          }
                        }}
                        placeholder="0300-1234567"
                        className="h-8.5 text-xs shadow-2xs border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Billing / Delivery Address</Label>
                    <Input
                      value={invoice.customer.address || ''}
                      onChange={(e) => setInvoice({
                        ...invoice,
                        customer: { ...invoice.customer, address: e.target.value }
                      })}
                      placeholder="Street address, city..."
                      className="h-8.5 text-xs shadow-2xs border-slate-200"
                    />
                  </div>

                  {invoice.customer.name && (
                    <div className="flex justify-end pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCustomerDetails(false)}
                        className="h-6 text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        <ChevronUp className="w-3 h-3 mr-1" /> Collapse Customer Form
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Discount & Credit Banners */}
              {customerDiscountStats && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded-lg border border-indigo-100 bg-indigo-50/80 p-2 text-indigo-900 text-xs">
                  <div className="flex items-center gap-2">
                    <WandSparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <span className="font-bold">Discount Profile:</span>{' '}
                      <span className="font-semibold text-indigo-700 font-mono">
                        {formatCurrency(customerDiscountStats.historyTotal, currency)}
                      </span>{' '}
                      availed
                      {customerDiscountStats.preferredPct > 0 && (
                        <span className="ml-1 text-[11px] text-indigo-600 font-semibold">
                          ({customerDiscountStats.preferredPct}% Tier)
                        </span>
                      )}
                    </div>
                  </div>
                  {customerDiscountStats.preferredPct > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setInvoice((prev) => ({
                          ...prev,
                          discount: customerDiscountStats.preferredPct,
                          discountType: 'percent',
                        }));
                        toast.success(`Applied ${customerDiscountStats.preferredPct}% customer discount`);
                      }}
                      className="h-6 px-2 rounded-md text-[10px] font-bold text-indigo-700 border-indigo-300 bg-white hover:bg-indigo-100 shadow-2xs shrink-0"
                    >
                      Apply {customerDiscountStats.preferredPct}%
                    </Button>
                  )}
                </div>
              )}

              {invoice.customer.credit_limit > 0 && (
                <div className={cn(
                  "flex flex-col gap-1.5 rounded-lg border p-2 text-xs sm:flex-row sm:items-center sm:justify-between",
                  totals.total + (invoice.customer.outstanding_balance || 0) > invoice.customer.credit_limit
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-slate-50 border-slate-200 text-slate-700"
                )}>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 shrink-0 text-slate-400" />
                    <span className="font-semibold">Credit Limit: {formatCurrency(invoice.customer.credit_limit, currency)}</span>
                    <span className="text-slate-300">|</span>
                    <span>Balance: {formatCurrency(invoice.customer.outstanding_balance || 0, currency)}</span>
                  </div>
                  {totals.total + (invoice.customer.outstanding_balance || 0) > invoice.customer.credit_limit && (
                    <div className="flex items-center gap-1 font-bold text-[10px] uppercase tracking-wider bg-red-100 px-2 py-0.5 rounded text-red-600 shrink-0">
                      <AlertCircle className="w-3 h-3" />
                      Limit Exceeded
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Card: Invoice Metadata (lg:col-span-5) */}
            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Invoice Metadata & Terms
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Invoice Ref #</Label>
                  <Input
                    value={invoice.invoiceNumber || ''}
                    readOnly
                    placeholder="Auto-generated"
                    className="h-8.5 text-xs bg-slate-50 border-slate-200 font-mono font-semibold text-slate-700 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Document Type</Label>
                  <Combobox
                    options={[
                      { value: 'retail', label: domainInvoiceLabel },
                      { value: 'tax', label: `${standards.taxLabel} Invoice` },
                      { value: 'export', label: 'Export Invoice' },
                    ]}
                    value={invoice.invoiceType || 'retail'}
                    onChange={(val) => setInvoice({ ...invoice, invoiceType: val })}
                    placeholder="Select document type..."
                    className="h-8.5 text-xs shadow-2xs border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Invoice Date *</Label>
                  <Input
                    type="date"
                    value={invoice.date || ''}
                    onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
                    required
                    className="h-8.5 text-xs shadow-2xs border-slate-200 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Payment Due Date</Label>
                  <Input
                    type="date"
                    value={invoice.dueDate || ''}
                    onChange={(e) => {
                      setIsDueDateManuallyEdited(true);
                      setInvoice({ ...invoice, dueDate: e.target.value });
                    }}
                    className="h-8.5 text-xs shadow-2xs border-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items Section (HERO TABLE AREA) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <ShoppingCart className="w-4.5 h-4.5 text-indigo-600" />
                Line Items
                <Badge variant="secondary" className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                  {invoice.items.length} {invoice.items.length === 1 ? 'item' : 'items'}
                </Badge>
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative group w-full sm:w-52 flex gap-1">
                  <Scan className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 z-10" />
                  <Input
                    id="barcode-sniffer"
                    placeholder="Scan barcode..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleBarcodeScan(barcodeInput);
                    }}
                    className="h-8 w-full rounded-lg border-dashed border-slate-300 bg-slate-50 pl-8 font-mono text-xs shadow-2xs transition-all focus:bg-white focus:border-indigo-500"
                  />
                  <BarcodeScanTrigger
                    business={business}
                    onScan={handleBarcodeScan}
                    className="h-8 w-8 shrink-0"
                    title="Camera scan"
                  />
                </div>

                {isPakistaniDomain && showTaxUi && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTaxCalculator(!showTaxCalculator)}
                    className="h-8 text-xs font-semibold border-slate-200 shadow-2xs"
                  >
                    <Calculator className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    Tax Calc
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={addItem}
                  size="sm"
                  className="h-8 text-xs font-bold text-white shadow-xs transition-all hover:opacity-95"
                  style={{ backgroundColor: brandAccent }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Line Item
                </Button>
              </div>
            </div>

            {/* Tax Calculator popup banner */}
            {isPakistaniDomain && showTaxUi && showTaxCalculator && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 shadow-2xs">
                <PakistaniTaxCalculator
                  amount={totals.subtotal}
                  category={getTaxCategoryForDomain(category)}
                  province={invoice.customer.province || 'punjab'}
                  domain={category}
                  onCalculate={handleTaxCalculation}
                />
              </div>
            )}

            {/* Line items component */}
            <div className="space-y-3">
              <DomainMultiRowLineItems
                items={invoice.items}
                products={products}
                category={category}
                currency={currency}
                colors={{ ...colors, primary: brandAccent }}
                updateItem={updateItem}
                removeItem={removeItem}
                addItem={addItem}
                business={business}
                onScanBarcode={handleBarcodeScan}
                showTax={showTaxUi}
              />
            </div>
          </div>

          {/* Vehicle Agreement Section (Automotive Domains) */}
          {isAutomotiveDomain(category) && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
              <VehicleAgreementSection
                value={invoice.vehicleAgreement || {}}
                onChange={(val) => setInvoice((prev) => ({ ...prev, vehicleAgreement: val }))}
                category={category}
                customer={invoice.customer}
                business={business}
                onPrintReceipt={() => {
                  printVehicleBuyerSellerReceiptHtml(
                    { ...invoice, items: invoice.items, totals },
                    business,
                    category
                  );
                }}
                onDownloadPdf={() => {
                  try {
                    generateInvoicePDF(
                      { ...invoice, items: invoice.items, category, vehicleAgreement: invoice.vehicleAgreement },
                      totals,
                      business
                    );
                    toast.success('Vehicle Buyer-Seller Receipt PDF downloaded');
                  } catch (e) {
                    toast.error('Failed to generate PDF');
                  }
                }}
                onDownloadInstallmentForm={() => {
                  try {
                    const itemsList = invoice.items || [];
                    const selectedVehicle =
                      invoice.vehicleAgreement?.makeModel || (itemsList[0]?.name || itemsList[0]?.product_name) || 'Vehicle / Product';
                    const productPrice = Number(totals.total || 0);
                    const downPaymentPct = Number(invoice.vehicleAgreement?.downPaymentPct || 20);
                    const downPaymentAmount = Number(
                      invoice.vehicleAgreement?.downPaymentAmount || Math.round(productPrice * (downPaymentPct / 100))
                    );
                    const durationMonths = Number(invoice.vehicleAgreement?.durationMonths || 24);
                    const monthlyInstallment = Number(
                      invoice.vehicleAgreement?.monthlyInstallment ||
                        Math.round(((productPrice - downPaymentAmount) * 1.25) / durationMonths)
                    );

                    void generateInstallmentFormPdf({
                      storeName: business?.name || business?.business_name || 'Showroom',
                      selectedVehicle,
                      productPrice,
                      downPaymentAmount,
                      downPaymentPct,
                      durationMonths,
                      monthlyInstallment,
                      applicant: {
                        fullName: invoice.vehicleAgreement?.buyerName || invoice.customer?.name || '',
                        phone: invoice.vehicleAgreement?.buyerPhone || invoice.customer?.phone || '',
                        cnic: invoice.vehicleAgreement?.buyerCnic || invoice.customer?.cnic || invoice.customer?.domain_data?.cnic || '',
                        address: invoice.vehicleAgreement?.buyerAddress || invoice.customer?.address || '',
                        city: invoice.customer?.city || '',
                        witness1Name: invoice.vehicleAgreement?.witness1Name || '',
                        witness1Phone: invoice.vehicleAgreement?.witness1Phone || '',
                        witness1Cnic: invoice.vehicleAgreement?.witness1Cnic || '',
                        witness2Name: invoice.vehicleAgreement?.witness2Name || '',
                        witness2Phone: invoice.vehicleAgreement?.witness2Phone || '',
                        witness2Cnic: invoice.vehicleAgreement?.witness2Cnic || '',
                      },
                      contact: {
                        phone: business?.phone || business?.phone_number || '',
                        email: business?.email || '',
                      },
                      category,
                      business,
                    }).then((doc) => {
                      doc.save(`Installment-Application-Form-${invoice.invoiceNumber || 'Draft'}.pdf`);
                      toast.success('Installment Application Form downloaded');
                    });
                  } catch (e) {
                    toast.error('Failed to generate Installment Form PDF');
                  }
                }}
              />
            </div>
          )}

          {/* Bottom Split Section: Payment & Notes (Left) | Order Summary & Totals (Right) */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Left Box: Payment Gateway, Notes, Workflow (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Karachi Wholesale Market Transport, Bilti & Broker Details */}
              {(category === 'textile-wholesale' || category === 'textile') && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      Karachi Wholesale Market Transport, Bilti & Broker Details
                    </h4>
                    <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300 text-[10px] font-semibold">
                      Textile Wholesale
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Adda / Transport Name</Label>
                      <Input
                        placeholder="e.g. Faisalabad Express / Tariq Adda"
                        value={invoice.biltiDetails?.transportName || ''}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            biltiDetails: { ...prev.biltiDetails, transportName: e.target.value },
                          }))
                        }
                        className="h-8.5 text-xs bg-white shadow-2xs border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Bilti / GR #</Label>
                      <Input
                        placeholder="e.g. B-48920"
                        value={invoice.biltiDetails?.biltiNo || ''}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            biltiDetails: { ...prev.biltiDetails, biltiNo: e.target.value },
                          }))
                        }
                        className="h-8.5 text-xs bg-white font-mono shadow-2xs border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Booking Station / City</Label>
                      <Input
                        placeholder="e.g. Faisalabad / Multan / Quetta"
                        value={invoice.biltiDetails?.destinationCity || ''}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            biltiDetails: { ...prev.biltiDetails, destinationCity: e.target.value },
                          }))
                        }
                        className="h-8.5 text-xs bg-white shadow-2xs border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Total Bales / Packages</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 3"
                        value={invoice.biltiDetails?.baleCount || ''}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            biltiDetails: { ...prev.biltiDetails, baleCount: e.target.value },
                          }))
                        }
                        className="h-8.5 text-xs bg-white shadow-2xs border-slate-200 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Broker / Agent Name</Label>
                      <Input
                        placeholder="e.g. Haji Usman Broker"
                        value={invoice.brokerDetails?.brokerName || ''}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            brokerDetails: { ...prev.brokerDetails, brokerName: e.target.value },
                          }))
                        }
                        className="h-8.5 text-xs bg-white shadow-2xs border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Broker Commission</Label>
                      <Input
                        placeholder="e.g. 1% or Rs 500"
                        value={invoice.brokerDetails?.brokerCommission || ''}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            brokerDetails: { ...prev.brokerDetails, brokerCommission: e.target.value },
                          }))
                        }
                        className="h-8.5 text-xs bg-white shadow-2xs border-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Gateway Selector */}
              {isPakistaniDomain && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Payment Settlement Method
                  </h4>
                  <PakistaniPaymentSelector
                    selectedGateway={invoice.paymentMethod}
                    onSelect={(gatewayId) => setInvoice({ ...invoice, paymentMethod: gatewayId })}
                    amount={totals.total}
                    showCOD={true}
                    showHeader={false}
                    compact={true}
                  />
                </div>
              )}

              {/* Notes & Terms */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Customer Notes</Label>
                    <textarea
                      className="w-full min-h-[70px] px-3 py-2 text-xs border border-slate-200 rounded-lg shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      value={invoice.notes || ''}
                      onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                      placeholder="Add custom notes visible to customer..."
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-slate-700">Terms & Conditions</Label>
                    <textarea
                      className="w-full min-h-[70px] px-3 py-2 text-xs border border-slate-200 rounded-lg shadow-2xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      value={invoice.terms || ''}
                      onChange={(e) => setInvoice({ ...invoice, terms: e.target.value })}
                      placeholder="Specify payment or warranty terms..."
                    />
                  </div>
                </div>
              </div>

              {/* Workflow & Approvals */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
                <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-bold">Workflow:</span>
                    <span>{activeApprovalStatus.helper}</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-500">Ref: {invoice.invoiceNumber || 'Draft'}</span>
                </div>

                {approvalHistory.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approval Audit Log</p>
                    {approvalHistory.slice(0, 2).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-semibold capitalize">{entry.approval_status}</span>
                        <span className="text-slate-400">{new Date(entry.created_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Box: Order Summary & Financial Totals (lg:col-span-5) */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 sticky top-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100 pb-2">
                  Financial Summary
                </h4>

                <div className="space-y-2.5 text-xs text-slate-700">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Subtotal:</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {formatCurrency(totals.rawSubtotal ?? totals.subtotal, currency)}
                    </span>
                  </div>

                  {/* Discount row */}
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600 font-medium">Discount:</span>
                      <select
                        className="h-6 border border-slate-200 bg-slate-50 px-1 py-0 text-[10px] font-bold text-indigo-700 rounded focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        value={invoice.discountType}
                        onChange={(e) => setInvoice({ ...invoice, discountType: e.target.value })}
                      >
                        <option value="percent">% Ratio</option>
                        <option value="amount">Fixed {standards.currencySymbol}</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        value={invoice.discount || 0}
                        onChange={(e) => setInvoice({ ...invoice, discount: parseFloat(e.target.value) || 0 })}
                        className="h-6 w-16 text-right text-xs p-1 font-mono rounded border-slate-200"
                      />
                      <span className="font-mono font-bold text-rose-600">
                        -{formatCurrency(totals.discount, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Seasonal Discount (if active) */}
                  {totals.seasonalDiscount > 0 && currentSeason && (
                    <div className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/70 p-2 text-xs">
                      <span className="font-bold text-orange-700">{currentSeason.name.en} Discount ({currentSeason.discountPercent}%):</span>
                      <span className="font-mono font-bold text-orange-700">-{formatCurrency(totals.seasonalDiscount, currency)}</span>
                    </div>
                  )}

                  {/* Regional Tax Breakdown */}
                  {showTaxUi && Object.entries(totals.taxDetails || {}).map(([label, detail]) => {
                    const taxVal = Number(detail?.amount ?? 0);
                    if (taxVal <= 0) return null;
                    return (
                      <div key={label} className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-1.5">
                        <span>{label} ({((detail?.rate ?? 0) * 100).toFixed(0)}%):</span>
                        <span className="font-mono font-semibold">{formatCurrency(taxVal, currency || 'PKR')}</span>
                      </div>
                    );
                  })}

                  {showTaxUi && Number(totals.totalTax || 0) > 0 && !Object.keys(totals.taxDetails || {}).length && (
                    <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-1.5">
                      <span>{regionalTaxLabel || 'Tax'}:</span>
                      <span className="font-mono font-semibold">{formatCurrency(totals.totalTax, currency || 'PKR')}</span>
                    </div>
                  )}

                  {/* Round off adjustment */}
                  {totals.roundOff !== 0 && (
                    <div className="flex justify-between items-center text-slate-500 text-xs border-t border-slate-100 pt-1.5">
                      <span>Round Off:</span>
                      <span className="font-mono">{totals.roundOff > 0 ? '+' : ''}{formatCurrency(totals.roundOff, currency)}</span>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="flex justify-between items-baseline border-t-2 border-slate-900 pt-3 text-slate-900">
                    <span className="text-base font-extrabold tracking-tight">Grand Total:</span>
                    <span className="font-mono text-xl font-black text-emerald-600">
                      {formatCurrency(totals.total, currency)}
                    </span>
                  </div>

                  {/* Posting Health Balance Check */}
                  <div className={cn(
                    'flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold mt-2',
                    postingHealth.balanced ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                  )}>
                    <span className="uppercase tracking-wider">Posting Balance Check</span>
                    <span>{postingHealth.balanced ? 'Balanced ✓' : `Diff ${postingHealth.difference.toFixed(2)}`}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Sticky Action Dock (Footer) */}
        <div className={cn(MOBILE_FORM_FOOTER, 'border-t border-slate-200 bg-white px-4 py-3 sm:px-6 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]')}>
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Utility actions (Left) */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applySmartDraft('items')}
                  className="h-8.5 rounded-lg border-indigo-200 px-3 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-50"
                >
                  <WandSparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-500" /> Smart Items
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applySmartDraft('full')}
                  className="h-8.5 rounded-lg border-violet-200 px-3 text-xs font-semibold text-violet-700 shadow-2xs hover:bg-violet-50"
                >
                  <WandSparkles className="mr-1.5 h-3.5 w-3.5 text-violet-500" /> Smart Full
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success('Link generated for WhatsApp message')}
                  className="h-8.5 rounded-lg border-emerald-200 px-3 text-xs font-semibold text-emerald-700 shadow-2xs hover:bg-emerald-50"
                >
                  WhatsApp Share
                </Button>
              </div>

              {/* Output & Save Actions (Right) */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="h-8.5 px-3.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrintThermal}
                  disabled={isSaving || isExporting}
                  className="h-8.5 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 shadow-2xs"
                >
                  {isExporting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Printer className="mr-1.5 h-3.5 w-3.5 text-slate-500" />}
                  Thermal
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExportPDF}
                  disabled={isSaving || isExporting}
                  className="h-8.5 rounded-lg border-slate-200 px-3 text-xs font-semibold text-slate-700 shadow-2xs"
                >
                  {isExporting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5 text-slate-500" />}
                  A4 PDF
                </Button>
                <Button
                  type="button"
                  disabled={isSaving || isSubmittingApproval}
                  onClick={handleSave}
                  className="h-8.5 rounded-lg bg-emerald-600 px-5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all"
                >
                  {isSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                  Save Invoice
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
