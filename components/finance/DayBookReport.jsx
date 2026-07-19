'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import { accountingAPI } from '@/lib/api/accounting';
import { useBusiness } from '@/lib/context/BusinessContext';
import { formatCurrency } from '@/lib/currency';
import { generateFinanceStatementPDF, buildFinancePdfMeta } from '@/lib/pdf/financeStatementPdf';
import { resolveDisplayCurrency } from '@/lib/utils/businessRegionalContext';
import toast from 'react-hot-toast';

export default function DayBookReport({ businessId }) {
  const { business, currency: businessCurrency, regionalPack } = useBusiness();
  const currency = resolveDisplayCurrency(
    { currency: businessCurrency || business?.currency },
    regionalPack
  );
  const locale = regionalPack?.locale;
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0, balanced: true });

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await accountingAPI.getDayBook(businessId, date, date);
      if (!res.success) {
        toast.error(res.error || 'Failed to load day book');
        return;
      }
      setRows(res.rows || []);
      setTotals(res.totals || { debit: 0, credit: 0, balanced: true });
    } catch {
      toast.error('Error loading day book');
    } finally {
      setLoading(false);
    }
  }, [businessId, date]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const handlePdf = () => {
    const exportRows = [
      ...rows.map((r) => ({
        ...r,
        status: String(r.status || 'posted').toLowerCase(),
      })),
      {
        journalNumber: '',
        accountCode: '',
        accountName: 'Totals',
        description: totals.balanced ? 'Balanced' : 'Out of balance',
        status: '',
        debit: totals.debit ?? 0,
        credit: totals.credit ?? 0,
      },
    ];
    generateFinanceStatementPDF(
      {
        ...buildFinancePdfMeta(business, {
          currency,
          locale,
          taxIdLabel: regionalPack?.taxIdLabel,
        }),
        title: 'Day Book',
        periodLabel: `Date: ${date}`,
        balanced: totals.balanced,
      },
      [
        { key: 'journalNumber', label: 'JE #' },
        { key: 'accountCode', label: 'Code' },
        { key: 'accountName', label: 'Account' },
        { key: 'description', label: 'Narration' },
        { key: 'status', label: 'Status' },
        { key: 'debit', label: 'Debit' },
        { key: 'credit', label: 'Credit' },
      ],
      exportRows,
      { filename: `Day-Book-${date}.pdf` }
    );
  };

  return (
    <Card className="border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm print:shadow-none">
      <CardHeader className="flex flex-col gap-3 border-b border-gray-100 dark:border-slate-800 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Day Book</CardTitle>
          <CardDescription>Non-draft journal lines for the selected date (posted and reversed)</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 rounded-md border border-gray-250 dark:border-slate-800 bg-transparent px-3 text-sm"
          />
          <Button variant="outline" size="icon" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" onClick={handlePdf} disabled={!rows.length}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading && !rows.length ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900 text-left">
                <tr>
                  <th className="px-4 py-2 font-semibold">JE #</th>
                  <th className="px-4 py-2 font-semibold">Account</th>
                  <th className="px-4 py-2 font-semibold">Narration</th>
                  <th className="px-4 py-2 font-semibold">Status</th>
                  <th className="px-4 py-2 font-semibold text-right">Debit</th>
                  <th className="px-4 py-2 font-semibold text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                      No journal entries for this date
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => {
                    const statusLabel = String(r.status || 'posted').toLowerCase();
                    const isReversed = statusLabel === 'reversed';
                    return (
                    <tr key={`${r.journalId}-${r.accountCode}-${idx}`} className="border-t border-gray-100 dark:border-slate-800">
                      <td className="px-4 py-2 font-mono text-xs">{r.journalNumber}</td>
                      <td className="px-4 py-2">
                        <span className="font-mono text-xs text-gray-500">{r.accountCode}</span>{' '}
                        {r.accountName}
                      </td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400 max-w-xs truncate">{r.description}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium capitalize ${
                            isReversed
                              ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{r.debit ? formatCurrency(r.debit, currency) : ''}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{r.credit ? formatCurrency(r.credit, currency) : ''}</td>
                    </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 dark:border-slate-700 font-semibold">
                  <td colSpan={4} className="px-4 py-3">
                    Totals {totals.balanced ? '' : '(imbalance)'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(totals.debit, currency)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(totals.credit, currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
