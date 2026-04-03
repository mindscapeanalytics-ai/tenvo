'use client';

import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBrandsForDomain } from '@/lib/utils/pakistaniFeatures';
import { t } from '@/lib/translations';

/**
 * Brand Autocomplete Component
 * Smart autocomplete for Pakistani brands based on domain
 * Supports domain-aware filtering and Urdu display
 * Uses HTML5 datalist for maximum compatibility
 */
export function BrandAutocomplete({
    value,
    onChange,
    domain,
    label,
    placeholder,
    required = false,
    className = "",
    language = 'en'
}) {
    // Get domain-specific brands
    const suggestions = useMemo(() => {
        return getBrandsForDomain(domain) || [];
    }, [domain]);

    const handleChange = (e) => {
        onChange(e.target.value);
    };

    // Translate labels if not provided
    const displayLabel = label || t('brand', language);
    const displayPlaceholder = placeholder || t('selectBrand', language);

    return (
        <div className={`space-y-2 ${className}`}>
            <Label htmlFor="brand-autocomplete" className="text-xs font-black uppercase text-gray-400 tracking-wider">
                {displayLabel}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            <Input
                id="brand-autocomplete"
                list="brands-list"
                value={value || ''}
                onChange={handleChange}
                placeholder={displayPlaceholder}
                className="h-11 rounded-xl"
                required={required}
                dir={language === 'ur' ? 'rtl' : 'ltr'}
            />

            <datalist id="brands-list">
                {suggestions.map((brand, index) => (
                    <option key={index} value={brand} />
                ))}
            </datalist>

            {value && !suggestions.includes(value) && (
                <p className="text-xs text-gray-500 font-medium">
                    {language === 'ur' ? 'حسب ضرورت برانڈ' : 'Custom brand'}: &quot;{value}&quot;
                </p>
            )}
        </div>
    );
}
