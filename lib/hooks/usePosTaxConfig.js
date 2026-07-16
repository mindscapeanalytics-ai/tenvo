'use client';

import { useEffect, useMemo, useState } from 'react';
import { useBusiness } from '@/lib/context/BusinessContext';
import { getPosUiConfig } from '@/lib/utils/posHelpers';
import { getPosTaxConfigAction } from '@/lib/actions/standard/pos';
import {
    resolvePosTaxComponents,
    sumPosTaxComponentRates,
} from '@/lib/utils/posTaxComponents';

/**
 * Load till tax config (GST/PST) with regional fallback.
 * @param {string} [category]
 */
export function usePosTaxConfig(category) {
    const { business, regionalPack } = useBusiness();
    const posUi = useMemo(
        () => getPosUiConfig(category || business?.category, business),
        [category, business]
    );
    const [taxConfig, setTaxConfig] = useState(null);
    const [taxMode, setTaxMode] = useState(/** @type {'standard' | 'gst_only' | 'exempt'} */ ('standard'));
    const [loading, setLoading] = useState(Boolean(business?.id));

    useEffect(() => {
        if (!business?.id) {
            setLoading(false);
            return undefined;
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await getPosTaxConfigAction(business.id);
                if (!cancelled && res?.success && res.config) {
                    setTaxConfig(res.config);
                }
            } catch {
                /* regional fallback */
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [business?.id]);

    const components = useMemo(
        () => resolvePosTaxComponents({
            taxConfig,
            defaultTaxRate: posUi.defaultTaxRate,
            taxStrategy: regionalPack?.taxStrategy || posUi.taxStrategy,
            taxLabel: posUi.taxLabel,
            taxMode,
        }),
        [taxConfig, posUi.defaultTaxRate, posUi.taxLabel, posUi.taxStrategy, regionalPack?.taxStrategy, taxMode]
    );

    const effectiveTaxRate = useMemo(
        () => sumPosTaxComponentRates(components),
        [components]
    );

    return {
        taxConfig,
        taxMode,
        setTaxMode,
        components,
        effectiveTaxRate,
        taxLabel: posUi.taxLabel,
        loading,
        posUi,
    };
}
