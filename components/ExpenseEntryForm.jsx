'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    X, Save, Loader2, Wallet, Calendar, CreditCard, ChevronDown, ChevronUp, Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/ui/combobox';
import { useBusiness } from '@/lib/context/BusinessContext';
import { useLanguage } from '@/lib/context/LanguageContext';
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
    getExpenseCategoryShopLabel,
    expenseCategoryTranslationKey,
} from '@/lib/utils/expenseCategories';

function lastCategoryStorageKey(businessId) {
    return businessId ? `tenvo-expense-last-cat:${businessId}` : null;
}

function readLastCategory(businessId) {
    try {
        const key = lastCategoryStorageKey(businessId);
        if (!key || typeof window === 'undefined') return '';
        return String(localStorage.getItem(key) || '').trim();
    } catch {
        return '';
    }
}

function writeLastCategory(businessId, category) {
    try {
        const key = lastCategoryStorageKey(businessId);
        if (!key || !category) return;
        localStorage.setItem(key, category);
    } catch {
        /* ignore */
    }
}

function tx(t, key, fallback) {
    const v = t?.[key];
    return typeof v === 'string' && v.trim() ? v : fallback;
}

export function ExpenseEntryForm({
    onClose,
    onSave,
    vendors = [],
    initialData = null,
    category = 'retail-shop',
}) {
    const { business, currencySymbol, currency: currencyCode } = useBusiness();
    const { language, t } = useLanguage();
    const domainKey = category || business?.category || 'retail-shop';
    const isUrdu = language === 'ur';
    const displayCurrency = currencySymbol || currencyCode || '';

    const expenseCategories = useMemo(
        () => getExpenseCategoriesForDomain(domainKey),
        [domainKey]
    );

    const categoryLabel = (cat) => {
        const key = expenseCategoryTranslationKey(cat.value);
        return tx(t, key, getExpenseCategoryShopLabel(cat));
    };

    const [showAccurate, setShowAccurate] = useState(Boolean(initialData?.account_id));
    const [isSaving, setIsSaving] = useState(false);
    const [glAccounts, setGlAccounts] = useState([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

    const [formData, setFormData] = useState(() => {
        const initialCat = initialData?.category
            ? normalizeExpenseCategory(initialData.category)
            : '';
        return {
            businessId: business?.id,
            accountId: initialData?.account_id || '',
            category: initialCat,
            amount: initialData?.amount || '',
            taxAmount: initialData?.tax_amount || 0,
            vendorId: initialData?.vendor_id || '',
            paymentMethod: initialData?.payment_method || 'cash',
            date: initialData?.date || new Date().toISOString().split('T')[0],
            description: initialData?.description || '',
            receiptUrl: initialData?.receipt_url || '',
        };
    });

    // Initialize business ID - only runs when business changes
    useEffect(() => {
        if (business?.id && formData.businessId !== business.id) {
            setFormData((prev) => ({ ...prev, businessId: business.id }));
        }
    }, [business?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load last category from localStorage - only once on mount if no initial category
    useEffect(() => {
        if (initialData?.category || !business?.id) return;
        const raw = readLastCategory(business.id);
        if (!raw) return;
        const last = normalizeExpenseCategory(raw);
        const exists = expenseCategories.some((c) => c.value === last);
        if (!exists || formData.category) return;
        setFormData((prev) => ({ ...prev, category: last }));
    }, [business?.id, expenseCategories, initialData?.category]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        async function fetchAccounts() {
            if (!business?.id) return;
            try {
                const result = await getGLAccountsAction(business.id);
                if (result.success) {
                    setGlAccounts(
                        (result.accounts || []).filter(
                            (a) => String(a.type || '').toLowerCase() === 'expense'
                        )
                    );
                }
            } catch (error) {
                console.error('Error fetching GL accounts:', error);
                toast.error(tx(t, 'expense_err_accounts', 'Failed to load expense accounts'));
            } finally {
                setIsLoadingAccounts(false);
            }
        }
        fetchAccounts();
    }, [business?.id, t]);

    const suggestAccountForCategory = (categoryValue, accounts = glAccounts) => {
        const cat = expenseCategories.find((c) => c.value === categoryValue);
        if (!cat?.account_code || !accounts.length) return '';
        const match = accounts.find((a) => String(a.code) === String(cat.account_code));
        return match ? String(match.id) : '';
    };

    // When GL accounts arrive after a category was already chosen, fill empty account only.
    useEffect(() => {
        if (!formData.category || !glAccounts.length) return;
        const suggested = suggestAccountForCategory(formData.category, glAccounts);
        if (!suggested) return;
        setFormData((prev) => {
            if (prev.accountId) return prev;
            return { ...prev, accountId: suggested };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [glAccounts, formData.category]);

    const handleCategoryChange = (val) => {
        const normalized = normalizeExpenseCategory(val);
        setFormData((prev) => {
            const suggested = suggestAccountForCategory(normalized);
            return {
                ...prev,
                category: normalized,
                // Never keep a previous category's GL account (would mis-post).
                accountId: suggested || '',
            };
        });
    };

    const buildExpensePayload = () => {
        const businessId = business?.id || formData.businessId;
        const categoryValue = formData.category
            ? normalizeExpenseCategory(formData.category)
            : null;
        const catMeta = expenseCategories.find((c) => c.value === categoryValue);
        const categoryLabelText = catMeta ? categoryLabel(catMeta) : categoryValue;
        const description =
            String(formData.description || '').trim() ||
            (categoryLabelText ? `${categoryLabelText}` : null);
        const vendorRaw = String(formData.vendorId || '').trim();
        const accountRaw = String(formData.accountId || '').trim();
        // Easy mode: let the server resolve GL from category. Accurate: honor explicit account.
        const accountId = showAccurate && accountRaw ? accountRaw : null;
        const amountNum = Number.parseFloat(String(formData.amount ?? '').replace(/,/g, ''));
        const taxNum = Number.parseFloat(String(formData.taxAmount ?? 0).replace(/,/g, ''));

        return {
            businessId,
            accountId,
            category: categoryValue,
            domainKey,
            amount: Number.isFinite(amountNum) ? amountNum : NaN,
            taxAmount: Number.isFinite(taxNum) ? Math.max(0, taxNum) : 0,
            vendorId: vendorRaw || null,
            paymentMethod: formData.paymentMethod || 'cash',
            date: formData.date,
            description,
            receiptUrl: String(formData.receiptUrl || '').trim() || null,
        };
    };

    const handleSave = async (e) => {
        e?.preventDefault?.();

        const payload = buildExpensePayload();

        if (!payload.businessId) {
            toast.error(tx(t, 'expense_err_business', 'Business is not ready. Refresh and try again.'));
            return;
        }
        if (!payload.category && !payload.accountId) {
            toast.error(tx(t, 'expense_err_category', 'Select what the money was for'));
            return;
        }
        if (!(Number(payload.amount) > 0)) {
            toast.error(tx(t, 'expense_err_amount', 'Enter a valid amount'));
            return;
        }

        const validation = validateWithSchema(expenseSchema, payload);
        if (!validation.success) {
            const firstError = Object.values(validation.errors)[0];
            toast.error(firstError || tx(t, 'expense_err_validation', 'Please fix validation errors'));
            return;
        }

        setIsSaving(true);
        try {
            const result = await createExpenseAction(payload);

            if (result.success) {
                if (payload.category) writeLastCategory(payload.businessId, payload.category);
                toast.success(tx(t, 'expense_saved', 'Expense recorded'));
                onSave?.(result.expense);
                onClose?.();
            } else if (isValidationError(result)) {
                formatValidationErrors(result);
                toast.error(tx(t, 'expense_err_validation', 'Please fix validation errors'));
            } else {
                showActionError(result);
            }
        } catch (error) {
            console.error('Error saving expense:', error);
            toast.error(
                `${tx(t, 'expense_err_save', 'Failed to record expense')}: ${error.message}`
            );
        } finally {
            setIsSaving(false);
        }
    };

    const paymentMethods = [
        { key: 'cash', label: tx(t, 'expense_pay_cash', 'Cash'), icon: Banknote },
        { key: 'bank', label: tx(t, 'expense_pay_bank', 'Bank'), icon: CreditCard },
        { key: 'credit', label: tx(t, 'expense_pay_credit', 'Pay later'), icon: Calendar },
    ];

    return (
        <div className={MOBILE_OVERLAY}>
            <Card className={cn(MOBILE_OVERLAY_CARD, 'max-w-lg', isUrdu && 'font-urdu')}>
                <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b bg-gradient-to-r from-rose-800 to-rose-700 px-3 py-3 text-white sm:p-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="shrink-0 rounded-xl bg-white/10 p-2 text-white ring-1 ring-white/20">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <CardTitle className="text-base font-semibold tracking-tight sm:text-lg">
                                {tx(t, 'expense_record_title', 'Record money out')}
                            </CardTitle>
                            <p className="mt-0.5 truncate text-[11px] text-rose-100/90">
                                {tx(t, 'expense_record_subtitle', 'What you paid from the shop today')}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                        aria-label={tx(t, 'expense_close', 'Close')}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>

                <CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white p-3 sm:p-5">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {tx(t, 'expense_what_for', 'What for?')} *
                            </Label>
                            <div className="grid max-h-44 grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3">
                                {expenseCategories.map((cat) => {
                                    const selected = formData.category === cat.value;
                                    return (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => handleCategoryChange(cat.value)}
                                            className={cn(
                                                'rounded-xl border px-2.5 py-2.5 text-left text-[11px] font-semibold leading-snug transition-colors',
                                                selected
                                                    ? 'border-rose-400 bg-rose-50 text-rose-900 ring-1 ring-rose-300'
                                                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300 hover:bg-white'
                                            )}
                                        >
                                            {categoryLabel(cat)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {tx(t, 'expense_how_much', 'How much?')} ({displayCurrency}) *
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                className="h-14 rounded-xl border-gray-200 text-2xl font-semibold tabular-nums focus-visible:ring-rose-500/30"
                                placeholder="0"
                                value={formData.amount}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                                }
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {tx(t, 'expense_paid_how', 'Paid how?')}
                            </Label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {paymentMethods.map(({ key, label, icon: Icon }) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({ ...prev, paymentMethod: key }))
                                        }
                                        className={cn(
                                            'flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11px] font-semibold transition-all',
                                            formData.paymentMethod === key
                                                ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                                                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-semibold text-gray-600">
                                {tx(t, 'expense_note_optional', 'Note (optional)')}
                            </Label>
                            <Input
                                className="h-11 rounded-xl border-gray-200"
                                placeholder={tx(t, 'expense_note_placeholder', 'e.g. fuel for morning route')}
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                                }
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowAccurate((v) => !v)}
                            className="flex w-full items-center justify-between rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
                        >
                            <span>{tx(t, 'expense_more_details', 'More details (account, tax, vendor)')}</span>
                            {showAccurate ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </button>

                        {showAccurate ? (
                            <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                                <div className={cn(MOBILE_GRID_FIELDS, 'sm:gap-4')}>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                            {tx(t, 'expense_gl_account', 'Expense account (books)')}
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
                                                    ? tx(t, 'expense_loading_accounts', 'Loading accounts...')
                                                    : tx(t, 'expense_search_accounts', 'Search accounts...')
                                            }
                                            emptyText={tx(t, 'expense_no_accounts', 'No expense accounts found')}
                                            className="h-11"
                                        />
                                        <p className="text-[10px] text-gray-400">
                                            {tx(
                                                t,
                                                'expense_gl_hint',
                                                'Leave blank to pick the account automatically from the category'
                                            )}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                            {tx(t, 'expense_date', 'Date')}
                                        </Label>
                                        <Input
                                            type="date"
                                            className="h-11 rounded-xl border-gray-200 bg-white"
                                            value={formData.date}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    date: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                        {tx(t, 'expense_tax_optional', 'Tax included (optional)')}
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        className="h-11 rounded-xl border-gray-200 bg-white"
                                        value={formData.taxAmount}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                taxAmount: e.target.value,
                                            }))
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                        {tx(t, 'expense_vendor_optional', 'Paid to supplier (optional)')}
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
                                        placeholder={tx(t, 'expense_search_vendors', 'Search suppliers...')}
                                        emptyText={tx(t, 'expense_no_vendors', 'No suppliers — shop expense')}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        ) : null}
                    </form>
                </CardContent>

                <div className={cn(MOBILE_FORM_FOOTER, 'bg-gray-50')}>
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isSaving}
                            className="h-10 text-xs font-semibold text-gray-500 hover:text-gray-900"
                        >
                            {tx(t, 'expense_discard', 'Cancel')}
                        </Button>
                        <Button
                            disabled={isSaving}
                            onClick={handleSave}
                            className="flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] sm:px-8"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {tx(t, 'expense_save', 'Save expense')}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
