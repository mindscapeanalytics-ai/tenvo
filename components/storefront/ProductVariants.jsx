'use client';

import { useState, useMemo } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { getStoreAccentColor } from '@/lib/config/storefrontDomains';

export function ProductVariants({ product, businessDomain, onVariantSelect }) {
  const { currency, settings, business } = useStorefront();
  const accent = getStoreAccentColor(settings, business?.category);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  
  // Group variants by attributes
  const attributeGroups = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return {};
    
    const groups = {};
    
    product.variants.forEach(variant => {
      // Check for attribute_1
      if (variant.attribute_1_name && variant.attribute_1_value) {
        if (!groups[variant.attribute_1_name]) {
          groups[variant.attribute_1_name] = new Set();
        }
        groups[variant.attribute_1_name].add(variant.attribute_1_value);
      }
      
      // Check for attribute_2
      if (variant.attribute_2_name && variant.attribute_2_value) {
        if (!groups[variant.attribute_2_name]) {
          groups[variant.attribute_2_name] = new Set();
        }
        groups[variant.attribute_2_name].add(variant.attribute_2_value);
      }
      
      // Check for attribute_3
      if (variant.attribute_3_name && variant.attribute_3_value) {
        if (!groups[variant.attribute_3_name]) {
          groups[variant.attribute_3_name] = new Set();
        }
        groups[variant.attribute_3_name].add(variant.attribute_3_value);
      }
    });
    
    // Convert sets to arrays
    return Object.fromEntries(
      Object.entries(groups).map(([key, values]) => [key, Array.from(values)])
    );
  }, [product.variants]);
  
  // Find matching variant based on selected attributes
  const selectedVariant = useMemo(() => {
    if (!product.variants || Object.keys(selectedAttributes).length === 0) return null;
    
    return product.variants.find(variant => {
      let matches = 0;
      let totalAttributes = 0;
      
      if (variant.attribute_1_name) {
        totalAttributes++;
        if (selectedAttributes[variant.attribute_1_name] === variant.attribute_1_value) {
          matches++;
        }
      }
      
      if (variant.attribute_2_name) {
        totalAttributes++;
        if (selectedAttributes[variant.attribute_2_name] === variant.attribute_2_value) {
          matches++;
        }
      }
      
      if (variant.attribute_3_name) {
        totalAttributes++;
        if (selectedAttributes[variant.attribute_3_name] === variant.attribute_3_value) {
          matches++;
        }
      }
      
      return matches === totalAttributes && totalAttributes > 0;
    });
  }, [product.variants, selectedAttributes]);
  
  const handleAttributeSelect = (attributeName, value) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: prev[attributeName] === value ? null : value
    }));
  };
  
  // Check if an attribute value is available (has matching variant in stock)
  const isAttributeAvailable = (attributeName, value) => {
    if (!product.variants) return false;
    
    return product.variants.some(variant => {
      // Check if this variant matches the attribute
      let matchesAttribute = false;
      
      if (variant.attribute_1_name === attributeName && variant.attribute_1_value === value) {
        matchesAttribute = true;
      } else if (variant.attribute_2_name === attributeName && variant.attribute_2_value === value) {
        matchesAttribute = true;
      } else if (variant.attribute_3_name === attributeName && variant.attribute_3_value === value) {
        matchesAttribute = true;
      }
      
      if (!matchesAttribute) return false;
      
      // Check if other selected attributes match
      for (const [selectedName, selectedValue] of Object.entries(selectedAttributes)) {
        if (selectedName === attributeName) continue; // Skip current attribute
        if (!selectedValue) continue; // Skip if not selected
        
        let variantValue = null;
        if (variant.attribute_1_name === selectedName) variantValue = variant.attribute_1_value;
        else if (variant.attribute_2_name === selectedName) variantValue = variant.attribute_2_value;
        else if (variant.attribute_3_name === selectedName) variantValue = variant.attribute_3_value;
        
        if (variantValue !== selectedValue) return false;
      }
      
      return true;
    });
  };
  
  if (!product.variants || product.variants.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {/* Variant Selectors */}
      {Object.entries(attributeGroups).map(([attributeName, values]) => (
        <div key={attributeName} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="font-medium text-sm">
              {attributeName}
              {selectedAttributes[attributeName] && (
                <span className="ml-2 text-gray-500">
                  : {selectedAttributes[attributeName]}
                </span>
              )}
            </label>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {values.map((value) => {
              const isSelected = selectedAttributes[attributeName] === value;
              const isAvailable = isAttributeAvailable(attributeName, value);
              
              return (
                <button
                  key={value}
                  onClick={() => isAvailable && handleAttributeSelect(attributeName, value)}
                  disabled={!isAvailable}
                  className={cn(
                    "relative px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                    !isSelected && isAvailable && "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700",
                    !isAvailable && "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                  )}
                  style={isSelected ? { borderColor: accent, backgroundColor: accent + '10', color: accent } : {}}
                >
                  {value}
                  {isSelected && (
                    <span
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: accent }}
                    >
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* Selected Variant Info */}
      {selectedVariant && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Selected variant:</span>
            <span className="font-medium">
              {selectedVariant.attribute_1_value}
              {selectedVariant.attribute_2_value && ` / ${selectedVariant.attribute_2_value}`}
              {selectedVariant.attribute_3_value && ` / ${selectedVariant.attribute_3_value}`}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Price:</span>
            <span className="font-bold text-lg">
              {formatCurrency(selectedVariant.price, currency)}
            </span>
          </div>
          
          {selectedVariant.stock !== null && selectedVariant.stock <= 5 && selectedVariant.stock > 0 && (
            <div className="flex items-center gap-2 text-orange-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Only {selectedVariant.stock} left in stock</span>
            </div>
          )}
          
          {selectedVariant.stock === 0 && (
            <Badge variant="destructive" className="mt-2">
              Out of Stock
            </Badge>
          )}
        </div>
      )}
      
      {/* Selection Required Warning */}
      {Object.keys(attributeGroups).length > 0 && !selectedVariant && (
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Please select all options before adding to cart
        </p>
      )}
    </div>
  );
}
