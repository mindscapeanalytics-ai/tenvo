'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { searchBrands, getBrandsForDomain } from '@/lib/data/pakistaniBrands';

/**
 * Brand Autocomplete Component
 * Smart autocomplete for Pakistani brands based on domain
 * Uses HTML5 datalist for maximum compatibility
 */
export function BrandAutocomplete({
    value,
    onChange,
    domain,
    label = "Brand",
    placeholder = "Select or type brand name...",
    required = false,
    className = ""
}) {
    const [suggestions, setSuggestions] = useState([]);

    // Get domain-specific brands
    useEffect(() => {
        const brands = getBrandsForDomain(domain);
        setSuggestions(brands);
    }, [domain]);

    const handleChange = (e) => {
        onChange(e.target.value);
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <Label htmlFor="brand-autocomplete">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            <Input
                id="brand-autocomplete"
                list="brands-list"
                value={value || ''}
                onChange={handleChange}
                placeholder={placeholder}
                className="h-11 rounded-xl"
                required={required}
            />

            <datalist id="brands-list">
                {suggestions.map((brand, index) => (
                    <option key={index} value={brand} />
                ))}
            </datalist>

            {value && !suggestions.includes(value) && (
                <p className="text-xs text-muted-foreground">
                    Custom brand: "{value}"
                </p>
            )}
        </div>
    );
}
