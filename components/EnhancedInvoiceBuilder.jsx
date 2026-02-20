// This file usually uses formatCurrency, but checking for hardcoded symbols

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Plus, Trash2, Download, Printer, Save, Calculator, FileText, Loader2, Scan, Keyboard, AlertCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateInvoicePDF } from '@/lib/pdf';
import { PakistaniPaymentSelector } from '@/components/payment/PakistaniPaymentSelector';
import { PakistaniTaxCalculator } from '@/components/tax/PakistaniTaxCalculator';
import { calculatePakistaniTax, generateFBRInvoice, formatNTN, getTaxCategoryForDomain } from '@/lib/tax/pakistaniTax';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { getDomainTheme, getDomainDefaults, getDomainUnits, getDomainUnits as getUnits, getDomainProductFields, getDomainInvoiceColumns } from '@/lib/utils/domainHelpers';
import { getDomainColors } from '@/lib/domainColors';
import { formatCurrency, formatAmount, calculateTax as baseCalculateTax } from '@/lib/utils/formatting';
import { getTaxStrategy } from '@/lib/utils/taxStrategies';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { useStockAvailability, useCreditLimitCheck, useDueDateCalculator } from '@/lib/hooks/useInvoiceHelpers';

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
  const { business, currency, regionalStandards } = useBusiness();
  const standards = regionalStandards || { taxLabel: 'Tax', taxIdLabel: 'Tax ID', currency: 'PKR', countryCode: 'PK' };
  const strategy = getTaxStrategy(standards);
  const theme = getDomainTheme(category);
  const colors = getDomainColors(category);
  const domainKnowledge = getDomainKnowledge(category);
  const isPakistaniDomain = standards.countryCode === 'PK';
  const currencySymbol = business?.settings?.financials?.currencySymbol || standards.currencySymbol;

  // Initialize invoice state with conditional fields
  const [invoice, setInvoice] = useState(() => {
    const baseInvoice = {
      invoiceNumber: `INV-${Date.now()}`,
      documentType: standards.taxLabel,
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      invoiceType: standards.taxStrategy === 'VAT' ? 'vat' : 'tax',
      customer: {
        name: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        secondaryTaxId: '',
      },
      items: [],
      taxDetails: {
        breakdown: {},
        totalTax: 0,
      },
      paymentMethod: isPakistaniDomain ? 'cod' : 'cash',
      discount: 0,
      discountType: 'percent', // percent or amount
      roundOff: 0,
      notes: '',
      terms: '',
      ewayBill: '',
      placeOfSupply: '',
    };

    if (initialData) {
      // Logic to map Source (Challan/Order) or existing Invoice back to state
      const mappedItems = (initialData.items || []).map(item => {
        const rate = item.unit_price || item.rate || 0;
        const discount = item.discount_amount || item.discount || 0;
        const taxPercent = item.tax_percent || item.taxPercent || (isPakistaniDomain ? 18 : 0);
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
          unit: item.unit || 'pcs',
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

      return {
        ...baseInvoice,
        ...initialData, // Spread original for ID and other metadata
        customer: {
          ...baseInvoice.customer,
          id: initialData.customer_id || customerDetail.id || '',
          name: initialData.customer_name || initialData.customer?.name || customerDetail.name || '',
          email: initialData.customer_email || customerDetail.email || '',
          phone: customerDetail.phone || '',
          address: initialData.delivery_address || customerDetail.address || '',
          ...customerDetail,
        },
        items: mappedItems,
        discount: initialData.discount_total || initialData.discount || 0,
        notes: initialData.notes || `Derived from document: ${initialData.invoice_number || initialData.challan_number || initialData.order_number || 'Source'}`,
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
  }, [autoDueDate]);

  // Find selected customer for credit limit check
  const selectedCustomerData = useMemo(() => {
    if (!invoice.customer?.id) return null;
    return customers.find(c => c.id === invoice.customer.id);
  }, [invoice.customer?.id, customers]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showTaxCalculator, setShowTaxCalculator] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSubmittingRef = useRef(false); // Submission lock
  const [isExporting, setIsExporting] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);

  // Update item field (Hoisted for use in barcode scan)
  const updateItem = (id, field, value) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };

          // Auto-fill from product
          if (field === 'productId' && value) {
            const product = products.find(p => p.id === value);
            if (product) {
              updated.name = product.name;
              updated.hsn = product.hsn || product.hsnCode || '';
              updated.rate = Number(product.price) || 0;
              updated.taxPercent = Number(product.taxPercent) || (isPakistaniDomain ? 18 : 0);
              updated.unit = product.unit || 'pcs';

              // Auto-fill domain metadata if available
              if (product.domain_data) {
                updated.article_no = product.domain_data.articleno || product.domain_data.article_no || '';
                updated.design_no = product.domain_data.designno || product.domain_data.design_no || '';
                updated.fabric_type = product.domain_data.fabrictype || product.domain_data.fabric_type || '';
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
              updated.rate = value / (qty * discFactor * taxFactor);
            }
          }

          // Calculate amount (Forward calculation)
          if (field === 'quantity' || field === 'rate' || field === 'discount' || field === 'taxPercent' || field === 'productId') {
            const qty = Number(updated.quantity) || 0;
            const rate = Number(updated.rate) || 0;
            const disc = Number(updated.discount) || 0;
            const tax = Number(updated.taxPercent) || 0;

            const baseAmount = qty * rate;
            const discountAmount = (baseAmount * disc) / 100;
            const taxableAmount = baseAmount - discountAmount;
            const taxAmount = (taxableAmount * tax) / 100;
            updated.amount = taxableAmount + taxAmount;
          }

          return updated;
        }
        return item;
      })
    }));
  };



  // Calculate totals - supports both GST and Pakistani tax
  const calculateTotals = useMemo(() => {
    const subtotal = invoice.items.reduce((sum, item) => {
      const baseAmount = Number(item.quantity || 0) * Number(item.rate || 0);
      const discountAmount = (baseAmount * Number(item.discount || 0)) / 100;
      return sum + baseAmount - discountAmount;
    }, 0);

    const discountAmount = invoice.discountType === 'percent'
      ? (subtotal * (invoice.discount || 0)) / 100
      : (invoice.discount || 0);

    const finalSubtotal = subtotal - discountAmount;

    const globalDiscountFactor = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;

    const itemsForTax = invoice.items.map(item => {
      const itemBase = Number(item.quantity || 0) * Number(item.rate || 0);
      const itemDiscount = (itemBase * Number(item.discount || 0)) / 100;
      const itemTaxable = itemBase - itemDiscount;

      return {
        amount: itemTaxable * globalDiscountFactor,
        taxPercent: item.taxPercent,
        category: item.taxCategory,
        domain: category
      };
    });

    const taxResult = strategy.calculateBulk(itemsForTax, standards);
    const totalTax = taxResult.totalTax;

    const total = finalSubtotal + totalTax;
    const roundedTotal = Math.round(total);
    const roundOff = roundedTotal - total;

    return {
      subtotal: finalSubtotal,
      totalTax,
      tax_total: totalTax,
      taxDetails: taxResult.details,
      total: roundedTotal,
      grand_total: roundedTotal,
      roundOff,
      discount: discountAmount,
      discount_total: discountAmount,
    };
  }, [invoice.items, invoice.discount, invoice.discountType, standards, category]);

  // Credit limit warning
  const creditWarning = useCreditLimitCheck(selectedCustomerData, calculateTotals.total);

  // Keyboard Shortcuts moved below totals declaration

  // Barcode Sniffer Logic
  const handleBarcodeScan = (code) => {
    if (!code) return;
    const product = products.find(p => p.barcode === code || p.sku === code);
    if (product) {
      const existingItem = invoice.items.find(item => item.productId === product.id);
      if (existingItem) {
        updateItem(existingItem.id, 'quantity', existingItem.quantity + 1);
      } else {
        const newItem = {
          id: Date.now(),
          productId: product.id,
          name: product.name,
          hsn: product.hsn || product.hsnCode || '',
          quantity: 1,
          unit: product.unit || 'pcs',
          rate: product.price,
          discount: 0,
          taxPercent: product.taxPercent || (isPakistaniDomain ? 18 : 0),
          amount: product.price,
          taxCategory: isPakistaniDomain ? getTaxCategoryForDomain(category) : 'retail-standard',
        };
        setInvoice(prev => ({ ...prev, items: [...prev.items, newItem] }));
      }
      toast.success(`Added: ${product.name}`);
      setBarcodeInput('');
    } else {
      toast.error('Product not found for barcode: ' + code);
    }
  };

  // Update customer details when selected
  useEffect(() => {
    if (selectedCustomer) {
      setInvoice(prev => ({
        ...prev,
        customer: {
          ...prev.customer,
          ...selectedCustomer,
          // Preserve existing tax fields if not in customer data
          gstin: selectedCustomer.gstin || prev.customer.gstin,
          ntn: selectedCustomer.ntn || prev.customer.ntn,
          srn: selectedCustomer.srn || prev.customer.srn,
        }
      }));
    }
  }, [selectedCustomer]);

  // Add item to invoice
  const addItem = () => {
    const newItem = {
      id: Date.now(),
      productId: '',
      name: '',
      hsn: '',
      quantity: 1,
      unit: 'pcs',
      rate: 0,
      discount: 0,
      taxPercent: isPakistaniDomain ? 18 : 0, // Default 18% for Pakistan (Latest)
      amount: 0,
      taxCategory: isPakistaniDomain ? getTaxCategoryForDomain(category) : 'retail-standard',
    };
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };



  // Remove item from invoice
  const removeItem = (id) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };



  const totals = calculateTotals;

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
  const handleSave = async () => {
    // Validation
    if (!invoice.customer.name) {
      toast.error('Please enter customer name');
      return;
    }
    if (invoice.items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (isPakistaniDomain) {
      // NTN is optional but recommended
      if (!invoice.customer.ntn && invoice.invoiceType === 'fbr') {
        const proceed = confirm('NTN not provided. Continue anyway?');
        if (!proceed) return;
      }
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSaving(true);

    try {
      // Generate FBR-compliant invoice for Pakistani domains
      let finalInvoice = {
        ...invoice,
        totals,
        business_id: business?.id // Ensure business_id is present
      };

      if (isPakistaniDomain) {
        finalInvoice = generateFBRInvoice({
          ...invoice,
          items: invoice.items.map(item => ({
            ...item,
            quantity: Number(item.quantity || 0),
            rate: Number(item.rate || 0),
            discount: Number(item.discount || 0),
            taxPercent: Number(item.taxPercent || 0),
            amount: Number(item.amount || 0),
            domain: category,
            article_no: item.article_no,
            design_no: item.design_no,
            fabric_type: item.fabric_type
          })),
        }, invoice.customer.province || 'punjab');
      }

      await onSave?.(finalInvoice);
      // Success toast handled by parent
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice. Please try again.');
      isSubmittingRef.current = false; // Reset only on error
    } finally {
      setIsSaving(false);
      // Note: We don't reset isSubmittingRef on success because component unmounts 
      // or we explicitly want to block further clicks until close.
      if (!onSave) isSubmittingRef.current = false;
    }
  };

  // Handle PDF export
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generateInvoicePDF(invoice, totals, business, isPakistaniDomain);
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-3xl shadow-2xl border-none">
        <CardHeader className="flex flex-row items-center justify-between border-b py-8 px-8" style={{ backgroundColor: `${colors.primary}08` }}>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black tracking-tighter uppercase italic" style={{ color: colors.primary }}>
              {standards.taxLabel} Compliance Engine
            </CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Compliance Mode:</span>
              <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-black uppercase">Active</Badge>
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: `${colors.primary}10`, color: colors.primary, borderColor: `${colors.primary}20` }}>
                {category.replace('-', ' ')}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-xl border border-white/30 text-white cursor-help" onClick={() => setShowKeyboardHints(!showKeyboardHints)}>
              <Keyboard className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Hotkeys</span>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black text-gray-400 uppercase">Document Ref</p>
              <p className="font-mono text-sm font-bold text-gray-900">{invoice.invoiceNumber}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-red-50 hover:text-red-500 transition-colors">
              <X className="w-6 h-6" />
            </Button>
          </div>
        </CardHeader>
        {showKeyboardHints && (
          <div className="bg-wine px-8 py-2 flex gap-6 text-[10px] font-bold text-white/80 uppercase tracking-widest animate-in slide-in-from-top-1">
            <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">CTRL+S</kbd> Save</span>
            <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">CTRL+B</kbd> Barcode Focus</span>
            <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">ENTER</kbd> (in items) New Row</span>
            <span className="flex items-center gap-1"><kbd className="bg-white/10 px-1 rounded">ESC</kbd> Close</span>
          </div>
        )}
        <CardContent className="space-y-8 p-8 bg-white/50">
          {/* Business Header - Your Brand */}
          {business?.name && (
            <div className="border-b-2 border-gray-200 pb-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-black text-gray-900 mb-2">
                    {business.name}
                  </h1>
                  <div className="space-y-1 text-sm text-gray-600">
                    {business.address && <p>{business.address}</p>}
                    <div className="flex gap-4">
                      {business.ntn && (
                        <p>
                          <span className="font-semibold">NTN:</span> {business.ntn}
                        </p>
                      )}
                      {business.srn && (
                        <p>
                          <span className="font-semibold">SRN:</span> {business.srn}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-4">
                      {business.phone && (
                        <p>
                          <span className="font-semibold">Phone:</span> {business.phone}
                        </p>
                      )}
                      {business.email && (
                        <p>
                          <span className="font-semibold">Email:</span> {business.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-gray-400 tracking-widest">Invoice</p>
                  <p className="text-2xl font-black" style={{ color: colors.primary }}>{invoice.invoiceNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Header */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label>Invoice Number</Label>
              <Input value={invoice.invoiceNumber} readOnly className="bg-gray-50" />
            </div>
            <div>
              <Label>Date *</Label>
              <Input
                type="date"
                value={invoice.date || ''}
                onChange={(e) => setInvoice({ ...invoice, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={invoice.dueDate || ''}
                onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Document Type</Label>
              <select
                value={invoice.invoiceType}
                onChange={(e) => setInvoice({ ...invoice, invoiceType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="tax">{standards.taxLabel} Invoice</option>
                <option value="retail">Retail Invoice</option>
                <option value="export">Export Invoice</option>
              </select>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Customer Details</h3>
              {customers.length > 0 && (
                <select
                  onChange={(e) => {
                    const customer = customers.find(c => c.id === parseInt(e.target.value));
                    if (customer) setSelectedCustomer(customer);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer Name *</Label>
                <Input
                  value={invoice.customer.name || ''}
                  onChange={(e) => setInvoice({
                    ...invoice,
                    customer: { ...invoice.customer, name: e.target.value }
                  })}
                  required
                />
              </div>
              {/* Conditional tax fields */}
              <div>
                <Label>{standards.taxIdLabel}</Label>
                <Input
                  value={invoice.customer.taxId || ''}
                  onChange={(e) => setInvoice({
                    ...invoice,
                    customer: { ...invoice.customer, taxId: e.target.value }
                  })}
                  placeholder={`${standards.taxIdLabel} Number`}
                />
              </div>
              {standards.countryCode === 'PK' && (
                <div className="mt-2 flex items-center gap-2">
                  <Label className="text-[10px] font-bold text-gray-400">Province</Label>
                  <select
                    value={invoice.customer.province}
                    onChange={(e) => setInvoice({
                      ...invoice,
                      customer: { ...invoice.customer, province: e.target.value }
                    })}
                    className="bg-transparent border-0 font-bold text-wine text-xs focus:ring-0 cursor-pointer"
                  >
                    <option value="punjab">Punjab</option>
                    <option value="sindh">Sindh</option>
                    <option value="kp">Khyber Pakhtunkhwa</option>
                    <option value="balochistan">Balochistan</option>
                    <option value="islamabad">Islamabad (Federal)</option>
                  </select>
                </div>
              )}
              {invoice.customer.credit_limit > 0 && (
                <div className={cn(
                  "col-span-2 p-3 rounded-xl border flex items-center justify-between",
                  totals.total + (invoice.customer.outstanding_balance || 0) > invoice.customer.credit_limit
                    ? "bg-red-50 border-red-100 text-red-600"
                    : "bg-emerald-50 border-emerald-100 text-emerald-600"
                )}>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Credit Profile:</span>
                    <span className="text-xs font-medium">Limit: {formatCurrency(invoice.customer.credit_limit, currency)} | Current Balance: {formatCurrency(invoice.customer.outstanding_balance || 0, currency)}</span>
                  </div>
                  {totals.total + (invoice.customer.outstanding_balance || 0) > invoice.customer.credit_limit && (
                    <div className="flex items-center gap-1 font-black text-[10px] uppercase">
                      <AlertCircle className="w-3 h-3" />
                      Credit Limit Exceeded
                    </div>
                  )}
                </div>
              )}
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={invoice.customer.email || ''}
                  onChange={(e) => setInvoice({
                    ...invoice,
                    customer: { ...invoice.customer, email: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={invoice.customer.phone || ''}
                  onChange={(e) => setInvoice({
                    ...invoice,
                    customer: { ...invoice.customer, phone: e.target.value }
                  })}
                />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input
                  value={invoice.customer.address || ''}
                  onChange={(e) => setInvoice({
                    ...invoice,
                    customer: { ...invoice.customer, address: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Payment Method - Pakistani domains only */}
          {isPakistaniDomain && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-4">Payment Method</h3>
              <PakistaniPaymentSelector
                selectedGateway={invoice.paymentMethod}
                onSelect={(gatewayId) => setInvoice({ ...invoice, paymentMethod: gatewayId })}
                amount={totals.total}
                showCOD={true}
              />
            </div>
          )}

          {/* Items Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Items</h3>
              <div className="flex gap-2">
                <div className="relative group lg:w-48">
                  <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-wine" />
                  <Input
                    id="barcode-sniffer"
                    placeholder="Scan Barcode (Ctrl+B)"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleBarcodeScan(barcodeInput);
                    }}
                    className="pl-10 h-9 rounded-xl border-dashed border-wine/30 bg-wine/5 focus:bg-white transition-all font-mono"
                  />
                </div>
                {isPakistaniDomain && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTaxCalculator(!showTaxCalculator)}
                    className="rounded-xl border-gray-200"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Tax Helper
                  </Button>
                )}
                <Button onClick={addItem} size="sm" className="text-white font-bold shadow-lg rounded-xl transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: colors.primary }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Row
                </Button>
              </div>
            </div>

            {/* Tax Calculator - Pakistani domains */}
            {isPakistaniDomain && showTaxCalculator && (
              <div className="mb-4">
                <PakistaniTaxCalculator
                  amount={totals.subtotal}
                  category={getTaxCategoryForDomain(category)}
                  province={invoice.customer.province || 'punjab'}
                  domain={category}
                  onCalculate={handleTaxCalculation}
                />
              </div>
            )}

            <div className="space-y-3">
              {invoice.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No items added yet.</p>
                  <p className="text-sm">Click "Add Item" to get started.</p>
                </div>
              ) : (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-gray-400 tracking-wider w-12">#</th>
                        <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-gray-400 tracking-wider">Item Details</th>
                        {getDomainInvoiceColumns(category).map(col => (
                          <th key={col.field} className={`px-3 py-2 text-left text-[10px] font-black uppercase text-gray-400 tracking-wider ${col.width || 'w-24'}`}>
                            {col.header}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-gray-400 tracking-wider w-24">Qty</th>
                        <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-gray-400 tracking-wider w-24">Rate</th>
                        <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-gray-400 tracking-wider w-20">Disc%</th>
                        <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-gray-400 tracking-wider w-20">Tax%</th>
                        <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-gray-400 tracking-wider w-28">Amount</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-3 py-2 text-center">{index + 1}</td>
                          <td className="px-3 py-2">
                            <select
                              value={item.productId}
                              onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="">Select Product</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </td>

                          {/* Domain Specific Columns */}
                          {getDomainInvoiceColumns(category).map(col => (
                            <td key={col.field} className="px-3 py-2">
                              <Input
                                type={col.type || 'text'}
                                value={item[col.field] || ''}
                                onChange={(e) => updateItem(item.id, col.field, e.target.value)}
                                className="h-9 text-xs rounded-lg border-gray-100 bg-gray-50/50"
                                placeholder={col.header}
                              />
                            </td>
                          ))}

                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={item.quantity || 0}
                              onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              min={0}
                              className="h-8 text-xs text-right"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={item.rate || 0}
                              onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              min={0}
                              step="0.01"
                              className="h-8 text-xs text-right"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={item.discount || 0}
                              onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                              min={0}
                              max={100}
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={item.taxPercent || 0}
                              onChange={(e) => updateItem(item.id, 'taxPercent', parseFloat(e.target.value) || 0)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (index === invoice.items.length - 1) addItem();
                                }
                              }}
                              min={0}
                              max={100}
                              className="h-8 text-xs focus:ring-wine/20"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              value={item.amount || 0}
                              onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                              min={0}
                              step={0.01}
                              className="h-8 text-xs font-semibold focus:ring-wine/20"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.id)}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(totals.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase text-gray-400">Total Discount:</span>
                    <select
                      className="bg-transparent text-[10px] font-bold border-0 p-0 h-auto focus:ring-0 cursor-pointer text-wine"
                      value={invoice.discountType}
                      onChange={(e) => setInvoice({ ...invoice, discountType: e.target.value })}
                    >
                      <option value="percent">% Ratio</option>
                      <option value="amount">Fixed {standards.currencySymbol}</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={invoice.discount || 0}
                      onChange={(e) => setInvoice({ ...invoice, discount: parseFloat(e.target.value) || 0 })}
                      className="h-6 w-16 text-right text-xs p-1 rounded border-gray-200"
                    />
                    <span className="font-semibold text-red-600">-{formatCurrency(totals.discount, currency)}</span>
                  </div>
                </div>
                {/* Render dynamic tax breakdown from strategy */}
                {Object.entries(totals.taxDetails || {}).map(([label, detail]) => {
                  const taxVal = (detail.amount * detail.rate) / 100;
                  if (taxVal <= 0) return null;
                  return (
                    <div key={label} className="flex justify-between">
                      <span>{label}:</span>
                      <span>{formatCurrency(taxVal, standards.currency)}</span>
                    </div>
                  );
                })}
                {totals.roundOff !== 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Round Off:</span>
                    <span>{totals.roundOff > 0 ? '+' : ''}{formatCurrency(totals.roundOff, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2 text-wine">
                  <span>Total:</span>
                  <span>{formatCurrency(totals.total, currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            {!isPakistaniDomain && (
              <>
                <div>
                  <Label>E-Way Bill No.</Label>
                  <Input
                    value={invoice.ewayBill || ''}
                    onChange={(e) => setInvoice({ ...invoice, ewayBill: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Place of Supply</Label>
                  <Input
                    value={invoice.placeOfSupply || ''}
                    onChange={(e) => setInvoice({ ...invoice, placeOfSupply: e.target.value })}
                  />
                </div>
              </>
            )}
            <div>
              <Label>Notes</Label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 border rounded-lg"
                value={invoice.notes || ''}
                onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
            <div>
              <Label>Terms & Conditions</Label>
              <textarea
                className="w-full min-h-[80px] px-3 py-2 border rounded-lg"
                value={invoice.terms || ''}
                onChange={(e) => setInvoice({ ...invoice, terms: e.target.value })}
                placeholder="Payment terms..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setShowTaxCalculator(true)}
                className="rounded-xl border-gray-200 font-bold text-gray-600 hover:bg-gray-50 h-12 px-6"
              >
                <Calculator className="w-4 h-4 mr-2 text-wine" /> Tax Helper
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.success('Link generated for WhatsApp message')}
                className="rounded-xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 font-bold h-12 px-6"
              >
                Share via WhatsApp
              </Button>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <Button variant="ghost" onClick={onClose} className="flex-1 md:flex-none font-bold text-gray-500 rounded-xl px-8 h-12">
                Dismiss
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={isSaving || isExporting}
                className="flex-1 md:flex-none font-bold border-gray-200 rounded-xl h-12 px-6"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
                Print {standards.taxLabel} Invoice
              </Button>
              <Button
                disabled={isSaving}
                onClick={handleSave}
                className={`flex-1 md:flex-none bg-${theme.primary} hover:opacity-90 text-white font-black px-12 h-12 rounded-xl shadow-xl shadow-${theme.primary}/20 transition-all active:scale-95`}
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Finalize & Post
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div >
  );
}
