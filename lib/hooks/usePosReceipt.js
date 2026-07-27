'use client';

import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { dispatchThermalReceipt } from '@/lib/print/thermalReceipt';
import { openCashDrawer } from '@/lib/utils/posCashDrawer';
import {
    buildPosReceiptDraft,
    computePosOrderTotals,
    getPosAutoPrintEnabled,
    setPosAutoPrintEnabled,
} from '@/lib/utils/posHelpers';
import { resolvePosSettings } from '@/lib/config/posSettings';

function receiptOpts({ business, documentLabel, category, currencyCode, sale, isDraft, kickCashDrawer }) {
    const posSettings = resolvePosSettings(business);
    return {
        business,
        documentLabel: isDraft ? `${documentLabel} (Preview)` : documentLabel,
        category,
        currencyCode,
        sale,
        lineItems: sale.lineItems || [],
        kickCashDrawer: Boolean(kickCashDrawer),
        paperSize: posSettings.paperSize === '80mm' ? '80mm' : '58mm',
        printDelayMs: 500,
    };
}

/**
 * Shared POS receipt printing, PDF download, auto-print preference, and post-sale success state.
 */
export function usePosReceipt({ business, documentLabel, category, currencyCode }) {
    const [autoPrintEnabled, setAutoPrintEnabledState] = useState(true);
    const [lastSale, setLastSale] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const tenantDefault = resolvePosSettings(business).autoPrintReceipt !== false;
        setAutoPrintEnabledState(getPosAutoPrintEnabled(tenantDefault));
    }, [business]);

    const runReceipt = useCallback(async (sale, { isDraft = false, mode = 'print', kickCashDrawer = false } = {}) => {
        try {
            await dispatchThermalReceipt(
                receiptOpts({
                    business,
                    documentLabel,
                    category,
                    currencyCode,
                    sale,
                    isDraft,
                    kickCashDrawer,
                }),
                mode
            );
            if (mode === 'pdf') {
                toast.success('Receipt PDF downloaded', { id: 'pos-print' });
            }
            return true;
        } catch (err) {
            console.error('Receipt dispatch failed:', err);
            toast.error(err?.message || 'Could not generate receipt', { id: 'pos-print' });
            return false;
        }
    }, [business, category, currencyCode, documentLabel]);

    const printSaleDocument = useCallback(
        (sale, opts = {}) => runReceipt(sale, { ...opts, mode: 'print' }),
        [runReceipt]
    );

    const downloadSalePdf = useCallback(
        (sale, opts = {}) => runReceipt(sale, { ...opts, mode: 'pdf' }),
        [runReceipt]
    );

    const toggleAutoPrint = useCallback(() => {
        setAutoPrintEnabledState((prev) => {
            const next = !prev;
            setPosAutoPrintEnabled(next);
            toast.success(next ? 'Auto-print on' : 'Auto-print off', { id: 'pos-auto-print' });
            return next;
        });
    }, []);

    const buildDraftFromCart = useCallback(({
        cart,
        customer,
        paymentMethod,
        discount,
        discountType = 'fixed',
        totalsFromCart,
        transactionRef = 'DRAFT-BILL',
    }) => {
        if (!cart?.length) return null;
        const t = totalsFromCart?.subtotal != null
            ? totalsFromCart
            : computePosOrderTotals(cart, { discount, discountType });
        return buildPosReceiptDraft({
            cart,
            subtotal: t.subtotal,
            taxAmount: t.taxAmount,
            discountAmount: t.discountAmount,
            total: t.total,
            customer,
            paymentMethod,
            amountTendered: totalsFromCart?.amountTendered,
            transactionRef,
            isDraft: true,
        });
    }, []);

    const printBillFromCart = useCallback((params) => {
        const draft = buildDraftFromCart(params);
        if (!draft) return;
        return printSaleDocument(draft, { isDraft: true });
    }, [buildDraftFromCart, printSaleDocument]);

    const downloadBillPdfFromCart = useCallback((params) => {
        const draft = buildDraftFromCart(params);
        if (!draft) return;
        return downloadSalePdf(draft, { isDraft: true });
    }, [buildDraftFromCart, downloadSalePdf]);

    const buildLineItemsFromCart = useCallback((cart) => (
        (cart || []).map((i) => ({
            name: i.name,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            lineTotal: Math.round(i.unitPrice * i.quantity * 100) / 100,
        }))
    ), []);

    const recordSuccessfulSale = useCallback(({
        result,
        payload,
        cart,
        customer,
        paymentMethod,
        hasSession,
        successDurationMs = 2500,
        kickCashDrawer = false,
        autoPrint = undefined,
    }) => {
        const lineItems = buildLineItemsFromCart(cart);
        const saleRecord = {
            ...result.transaction,
            saleNumber: result.transaction?.transaction_number || `SALE-${Date.now()}`,
            transaction_number: result.transaction?.transaction_number || result.transaction?.invoice_number,
            invoice_number: result.transaction?.invoice_number,
            total: payload.total,
            subtotal: payload.subtotal,
            taxAmount: payload.taxAmount,
            discountAmount: payload.discountAmount,
            lineItems,
            items: cart.length,
            customerName: customer?.name || null,
            paymentMethod,
            mode: result?.mode || (hasSession ? 'pos' : 'invoice-fallback'),
            date: new Date().toISOString(),
        };
        setLastSale(saleRecord);
        setShowSuccess(true);
        const shouldPrint = autoPrint === undefined ? autoPrintEnabled : Boolean(autoPrint);
        if (shouldPrint) {
            // One print job: receipt (+ optional drawer kick). Do not open a second blank print.
            queueMicrotask(() => {
                void printSaleDocument(saleRecord, { kickCashDrawer: Boolean(kickCashDrawer) });
            });
        } else if (kickCashDrawer) {
            // No full receipt: labeled drawer slip only (never a blank white page).
            queueMicrotask(() => {
                const posSettings = resolvePosSettings(business);
                openCashDrawer({
                    label: 'Cash sale',
                    businessName: business?.business_name || business?.name || 'Store',
                    currencyCode,
                    paperSize: posSettings.paperSize === '80mm' ? '80mm' : '58mm',
                });
            });
        }
        setTimeout(() => setShowSuccess(false), successDurationMs);
        return saleRecord;
    }, [autoPrintEnabled, buildLineItemsFromCart, printSaleDocument, business, currencyCode]);

    const dismissSuccess = useCallback(() => setShowSuccess(false), []);

    const printLastReceipt = useCallback(() => {
        if (!lastSale) return;
        return printSaleDocument(lastSale);
    }, [lastSale, printSaleDocument]);

    const downloadLastReceiptPdf = useCallback(() => {
        if (!lastSale) return;
        return downloadSalePdf(lastSale);
    }, [lastSale, downloadSalePdf]);

    const formatSaleError = useCallback((resultOrError) => {
        const err = resultOrError?.error ?? resultOrError;
        return err?.message
            || (err?.validationErrors
                ? Object.values(err.validationErrors).join('; ')
                : null)
            || (typeof err === 'string' ? err : null)
            || 'Sale could not be completed';
    }, []);

    return {
        autoPrintEnabled,
        toggleAutoPrint,
        lastSale,
        showSuccess,
        dismissSuccess,
        printSaleDocument,
        downloadSalePdf,
        printBillFromCart,
        downloadBillPdfFromCart,
        recordSuccessfulSale,
        printLastReceipt,
        downloadLastReceiptPdf,
        formatSaleError,
    };
}
