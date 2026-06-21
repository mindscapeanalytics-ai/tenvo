'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getMarketsForCity, getAllMarkets } from '@/lib/domainData/pakistaniMarkets';
import { t } from '@/lib/translations';

/**
 * Market Location Selector Component
 * Smart selector for Pakistani market locations based on city
 * Supports city-based filtering and bilingual display (English/Urdu)
 * Uses HTML5 datalist for maximum compatibility
 */
export function MarketLocationSelector({
    value,
    onChange,
    city,
    label,
    placeholder,
    required = false,
    className = "",
    language = 'en'
}) {
    // Get city-specific markets or all markets if no city selected
    const suggestions = useMemo(() => {
        if (city) {
            const markets = getMarketsForCity(city);
            // Extract market names based on language
            return markets.map(m => language === 'ur' ? m.ur : m.en);
        }
        const allMarkets = getAllMarkets();
        return allMarkets.map(m => language === 'ur' ? m.ur : m.en);
    }, [city, language]);

    const handleChange = (e) => {
        onChange(e.target.value);
    };

    // Translate labels if not provided
    const displayLabel = label || (language === 'ur' ? 'مارکیٹ کا مقام' : 'Market Location');
    const displayPlaceholder = placeholder || (language === 'ur' ? 'مارکیٹ منتخب کریں یا ٹائپ کریں...' : 'Select or type market location...');

    return (
        <div className={cn('space-y-1.5', className)}>
            <Label htmlFor="market-location-selector" className="text-[11px] font-semibold text-slate-600">
                {displayLabel}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            <Input
                id="market-location-selector"
                list="markets-list"
                value={value || ''}
                onChange={handleChange}
                placeholder={displayPlaceholder}
                className="h-9 rounded-lg border-gray-200 text-sm"
                required={required}
                dir={language === 'ur' ? 'rtl' : 'ltr'}
            />

            <datalist id="markets-list">
                {suggestions.map((market, index) => (
                    <option key={index} value={market} />
                ))}
            </datalist>

            {value && !suggestions.includes(value) && (
                <p className="text-xs text-gray-500 font-medium">
                    {language === 'ur' ? 'حسب ضرورت مقام' : 'Custom location'}: &quot;{value}&quot;
                </p>
            )}

            {city && (
                <p className="text-xs text-gray-400 font-medium">
                    {language === 'ur' ? `${city} میں ${suggestions.length} مارکیٹیں` : `${suggestions.length} markets in ${city}`}
                </p>
            )}
        </div>
    );
}
