'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Save, Loader2, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { useBusiness } from '@/lib/context/BusinessContext';
import { createExpenseAction } from '@/lib/actions/basic/expense';
import { getGLAccountsAction } from '@/lib/actions/basic/accounting';
import toast from 'react-hot-toast';
import { showActionError, formatValidationErrors, isValidationError } from '@/lib/utils/formErrorHandler';
import { expenseSchema, validateWithSchema } from '@/lib/validation/schemas';
import { cn } from '@/lib/utils';
import { MOBILE_OVERLAY, MOBILE_OVERLAY_CARD, MOBILE_FORM_FOOTER, MOBILE_GRID_FIELDS } from '@/lib/utils/formMobileStyles';
import {
    getExpenseCategoriesForDomain,
    normalizeExpenseCategory,
} from '@/lib/utils/expenseCategories';

export function ExpenseEntryForm({
    onClose,
    onSave,
    vendors = [],
    initialData = null,
    category = 'retail-shop',
}) {
    const { business, currency } = useBusiness();
    const domainKey = category || business?.category || 'retail-shop';

    const expenseCategories = useMemo(
        () => getExpenseCategoriesForDomain(domainKey),
        [domainKey]
    );

    const [isSaving, setIsSaving] = useState(false);
    const [glAccounts, setGlAccounts] = useState([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

    const [formData, setFormData] = useState({
        businessId: business?.id,
        accountId: initialData?.account_id || '',
        category: initialData?.category
            ? normalizeExpenseCategory(initialData.category)
            : '',
        amount: initialData?.amount || 0,
        taxAmount: initialData?.tax_amount || 0,
        vendorId: initialData?.vendor_id || '',
        paymentMethod: initialData?.payment_method || 'cash',
        date: initialData?.date || new Date().toISOString().split('T')[0],
        description: initialData?.description || '',
        receiptUrl: initialData?.receipt_url || '',
    });

    useEffect(() => {
        async function fetchAccounts() {
            if (!business?.id) return;
            try {
                const result = await getGLAccountsAction(business.id);
                if (result.success) {
                    setGlAccounts(result.accounts.filter((a) => a.type === 'expense'));
                }
            } catch (error) {
                console.error('Error fetching GL accounts:', error);
                toast.error('Failed to load expense accounts');
            } finally {
                setIsLoadingAccounts(false);
            }
        }
        fetchAccounts();
    }, [business?.id]);

    const suggestAccountForCategory = (categoryValue) => {
        const cat = expenseCategories.find((c) => c.value === categoryValue);
        if (!cat?.account_code || !glAccounts.length) return '';
        const match = glAccounts.find((a) => String(a.code) === String(cat.account_code));
        return match ? String(match.id) : '';
    };

    const handleCategoryChange = (val) => {
        const normalized = normalizeExpenseCategory(val);
        setFormData((prev) => {
            const suggested = suggestAccountForCategory(normalized);
            return {
                ...prev,
                category: normalized,
                accountId: suggested || prev.accountId,
            };
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();

        const validation = validateWithSchema(expenseSchema, {
            ...formData,
            amount: parseFloat(formData.amount),
            taxAmount: parseFloat(formData.taxAmount || 0),
        });
        if (!validation.success) {
            const firstError = Object.values(validation.errors)[0];
            toast.error(firstError || 'Please fix validation errors');
            return;
        }

        if (!formData.accountId) {
            toast.error('Please select an expense account');
            return;
        }

        setIsSaving(true);
        try {
            const result = await createExpenseAction({
                ...formData,
                category: formData.category
                    ? normalizeExpenseCategory(formData.category)
                    : '',
                amount: parseFloat(formData.amount),
                taxAmount: parseFloat(formData.taxAmount || 0),
            });

            if (result.success) {
                toast.success('Expense recorded successfully');
                onSave?.(result.expense);
                onClose?.();
            } else if (isValidationError(result)) {
                formatValidationErrors(result);
                toast.error('Please fix validation errors');
            } else {
                showActionError(result);
            }
        } catch (error) {
            console.error('Error saving expense:', error);
            toast.error(`Failed to record expense: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={MOBILE_OVERLAY}>
            <Card className={cn(MOBILE_OVERLAY_CARD, 'max-w-2xl')}>
                <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b bg-gradient-to-r from-red-900 to-red-800 px-3 py-3 text-white sm:p-6">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <div className="shrink-0 rounded-xl bg-white/10 p-2 text-white ring-1 ring-white/20 sm:rounded-2xl sm:p-3">
                            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-semibold uppercase tracking-tighter sm:text-2xl">
                                Record Expense
                            </CardTitle>
                            <p className="mt-0.5 hidden text-xs font-bold uppercase tracking-widest text-red-200 sm:block">
                                {business?.name} · Financial Transactions
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>

                <CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white p-3 sm:p-6">
                    <form onSubmit={handleSave} className="space-y-4 sm:space-y-6">
                        <div className={cn(MOBILE_GRID_FIELDS, 'sm:gap-6')}>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                    Expense Account (GL) *
                                </Label>
                                <Combobox
                                    options={glAccounts.map((a) => ({
                                        value: String(a.id),
                                        label: `${a.code} - ${a.name}`,
                                        description: a.type || 'Expense',
                                    }))}
                                    value={String(formData.accountId || '')}
                                    onChange={(val) =>
                                        setFormData((prev) => ({ ...prev, accountId: val }))
                                    }
                                    placeholder={
                                        isLoadingAccounts
                                            ? 'Loading accounts...'
                                            : 'Search GL accounts...'
                                    }
                                    emptyText="No expense accounts found"
                                    className="h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                    Category Tag
                                </Label>
                                <Combobox
                                    options={expenseCategories.map((c) => ({
                                        value: c.value,
                                        label: c.label,
                                    }))}
                                    value={formData.category || ''}
                                    onChange={handleCategoryChange}
                                    placeholder="Select category..."
                                    emptyText="No categories found"
                                    className="h-12"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                    Amount ({currency}) *
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="h-12 rounded-xl border-gray-200 pl-10 text-lg font-bold shadow-sm transition-all focus:ring-2 focus:ring-red-500"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                amount: e.target.value,
                                            }))
                                        }
                                        required
                                    />
                                    <DollarSign className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                    Tax Included (Optional)
                                </Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    className="h-12 rounded-xl border-gray-200 shadow-sm transition-all focus:ring-2 focus:ring-red-500"
                                    placeholder="0.00"
                                    value={formData.taxAmount}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            taxAmount: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                    Date
                                </Label>
                                <div className="relative">
                                    <Input
                                        type="date"
                                        className="h-12 rounded-xl border-gray-200 shadow-sm transition-all focus:ring-2 focus:ring-red-500"
                                        value={formData.date}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                date: e.target.value,
                                            }))
                                        }
                                    />
                                    <Calendar className="pointer-events-none absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                    Payment Method
                                </Label>
                                <div className="flex gap-2">
                                    {['cash', 'bank', 'credit'].map((method) => (
                                        <Button
                                            key={method}
                                            type="button"
                                            variant={
                                                formData.paymentMethod === method
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className={`h-12 flex-1 rounded-xl text-[10px] font-semibold uppercase tracking-widest transition-all ${
                                                formData.paymentMethod === method
                                                    ? 'border-none bg-red-600 text-white hover:bg-red-700'
                                                    : 'border-gray-200 text-gray-400 hover:text-gray-900'
                                            }`}
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    paymentMethod: method,
                                                }))
                                            }
                                        >
                                            <CreditCard className="mr-2 h-3 w-3" />
                                            {method}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                Paid to Vendor (Optional)
                            </Label>
                            <Combobox
                                options={vendors.map((v) => ({
                                    value: String(v.id),
                                    label: v.name,
                                    description: v.city || v.phone || '',
                                }))}
                                value={String(formData.vendorId || '')}
                                onChange={(val) =>
                                    setFormData((prev) => ({ ...prev, vendorId: val }))
                                }
                                placeholder="Search vendors..."
                                emptyText="No vendors -- internal expense"
                                className="h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                Description / Narrative
                            </Label>
                            <textarea
                                className="h-24 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium shadow-sm outline-none transition-all focus:ring-2 focus:ring-red-500"
                                placeholder="Purpose of this expense..."
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        description: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </form>
                </CardContent>

                <div className={cn(MOBILE_FORM_FOOTER, 'bg-gray-50')}>
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSaving}
                            className="h-9 text-xs font-semibold uppercase tracking-widest text-gray-400 hover:text-gray-900"
                        >
                            Discard
                        </Button>
                        <Button
                            disabled={isSaving}
                            onClick={handleSave}
                            className="flex h-9 items-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-semibold uppercase tracking-widest text-white shadow-xl shadow-red-500/20 transition-all hover:bg-emerald-700 active:scale-95 sm:h-12 sm:px-10"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Record Expense
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
