'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Receipt, Plus, Filter, Trash2, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/formatDisplayDate';
import { ExpenseEntryForm } from '@/components/ExpenseEntryForm';
import { deleteExpenseAction } from '@/lib/actions/basic/expense';
import {
    getExpenseCategoriesForDomain,
    normalizeExpenseCategory,
    findExpenseCategory,
} from '@/lib/utils/expenseCategories';
import toast from 'react-hot-toast';
import { showActionError } from '@/lib/utils/formErrorHandler';

export function ExpenseManager({
    businessId,
    expenses = [],
    onCreateExpense,
    onDeleteExpense,
    currency = 'Rs.',
    vendors = [],
    businessCategory = 'retail-shop',
}) {
    const [showForm, setShowForm] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');
    const [deletingId, setDeletingId] = useState(null);

    const categories = useMemo(
        () => getExpenseCategoriesForDomain(businessCategory),
        [businessCategory]
    );

    const filtered = useMemo(() => {
        if (filterCategory === 'all') return expenses;
        return expenses.filter(
            (e) => normalizeExpenseCategory(e.category) === filterCategory
        );
    }, [expenses, filterCategory]);

    const totalExpenses = expenses.reduce(
        (sum, e) => sum + parseFloat(e.amount || 0),
        0
    );
    const thisMonth = expenses
        .filter((e) => new Date(e.date).getMonth() === new Date().getMonth())
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const breakdown = categories
        .map((cat) => ({
            ...cat,
            total: expenses
                .filter((e) => normalizeExpenseCategory(e.category) === cat.value)
                .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0),
        }))
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total);

    const handleDelete = async (expense) => {
        if (!businessId || !expense?.id) return;
        const label = expense.description || expense.expense_number || 'this expense';
        if (
            typeof window !== 'undefined' &&
            !window.confirm(`Delete ${label}? This reverses the GL posting.`)
        ) {
            return;
        }
        setDeletingId(expense.id);
        try {
            const result = await deleteExpenseAction(businessId, expense.id);
            if (result.success) {
                toast.success('Expense deleted');
                onDeleteExpense?.();
            } else {
                showActionError(result);
            }
        } catch (err) {
            toast.error(err.message || 'Failed to delete expense');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-gray-500">Total Expenses</p>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">
                            {currency}
                            {totalExpenses.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-gray-500">This Month</p>
                        <p className="mt-1 text-2xl font-semibold text-red-600">
                            {currency}
                            {thisMonth.toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-gray-500">Top Category</p>
                        <p className="mt-1 text-lg font-bold text-gray-900">
                            {breakdown[0]?.label || '--'}
                        </p>
                        <p className="text-xs text-gray-400">
                            {currency}
                            {(breakdown[0]?.total || 0).toLocaleString()}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full items-center gap-2 sm:w-auto">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="h-9 w-full rounded-xl text-xs sm:w-[180px]">
                            <Filter className="mr-2 h-3 w-3" />
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    className="rounded-xl bg-brand-primary text-xs font-bold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-dark"
                >
                    <Plus className="mr-1 h-4 w-4" /> Record Expense
                </Button>
            </div>

            {breakdown.length > 0 && (
                <Card className="border-none shadow-sm">
                    <CardContent className="space-y-3 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                            Breakdown
                        </p>
                        {breakdown.map((cat) => (
                            <div key={cat.value} className="flex items-center gap-3">
                                <Badge className={cn('px-2 text-[10px]', cat.color)}>
                                    {cat.label}
                                </Badge>
                                <div className="h-2 flex-1 rounded-full bg-gray-100">
                                    <div
                                        className="h-2 rounded-full bg-brand-primary transition-all"
                                        style={{
                                            width: `${Math.min(
                                                (cat.total / totalExpenses) * 100,
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>
                                <span className="w-24 text-right text-xs font-bold text-gray-700">
                                    {currency}
                                    {cat.total.toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card className="border-none shadow-sm">
                <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                        {filtered.map((expense, idx) => {
                            const cat =
                                findExpenseCategory(expense.category, businessCategory) ||
                                categories.find(
                                    (c) =>
                                        c.value ===
                                        normalizeExpenseCategory(expense.category)
                                );
                            return (
                                <motion.div
                                    key={expense.id || idx}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                                >
                                    <div
                                        className={cn(
                                            'flex h-8 w-8 items-center justify-center rounded-lg',
                                            cat?.color || 'bg-gray-100 text-gray-500'
                                        )}
                                    >
                                        <Receipt className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-gray-900">
                                            {expense.description}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {formatDisplayDate(expense.date)} ·{' '}
                                            {cat?.label || expense.category}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold text-red-600">
                                        {currency}
                                        {parseFloat(expense.amount).toLocaleString()}
                                    </span>
                                    {onDeleteExpense && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-600"
                                            disabled={deletingId === expense.id}
                                            onClick={() => handleDelete(expense)}
                                            aria-label="Delete expense"
                                        >
                                            {deletingId === expense.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                </motion.div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="py-12 text-center text-gray-400">
                                <Receipt className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                <p className="text-sm">No expenses recorded</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {showForm && (
                <ExpenseEntryForm
                    vendors={vendors}
                    category={businessCategory}
                    onClose={() => setShowForm(false)}
                    onSave={() => onCreateExpense?.()}
                />
            )}
        </div>
    );
}
