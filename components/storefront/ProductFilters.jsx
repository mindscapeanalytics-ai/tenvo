'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { useStorefront } from '@/lib/context/StorefrontContext';

export function ProductFilters({ filters, categories, businessDomain }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency } = useStorefront();
  
  const [priceRange, setPriceRange] = useState([
    filters.minPrice || 0,
    filters.maxPrice || 10000
  ]);
  
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    availability: true,
    special: true,
  });
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === null || value === false || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    // Reset to page 1 when filters change
    params.delete('page');
    
    router.push(`/store/${businessDomain}/products?${params.toString()}`);
  };
  
  const handlePriceChange = (value) => {
    setPriceRange(value);
  };
  
  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('minPrice', priceRange[0]);
    params.set('maxPrice', priceRange[1]);
    params.delete('page');
    router.push(`/store/${businessDomain}/products?${params.toString()}`);
  };
  
  const clearAllFilters = () => {
    router.push(`/store/${businessDomain}/products`);
  };
  
  const hasActiveFilters = filters.category || filters.minPrice !== undefined || 
    filters.maxPrice !== undefined || filters.inStock || filters.onSale;
  
  return (
    <div className="space-y-4">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden">
        <Button variant="outline" className="w-full gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              !
            </span>
          )}
        </Button>
      </div>
      
      {/* Desktop Filters */}
      <div className="hidden lg:block space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
        
        {/* Categories */}
        <Card>
          <CardHeader className="py-3 cursor-pointer" onClick={() => toggleSection('categories')}>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Categories
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                !expandedSections.categories && "-rotate-90"
              )} />
            </CardTitle>
          </CardHeader>
          {expandedSections.categories && (
            <CardContent className="pt-0">
              <div className="space-y-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <Checkbox
                      checked={filters.category === category.slug}
                      onCheckedChange={(checked) => {
                        updateFilter('category', checked ? category.slug : null);
                      }}
                    />
                    <span className="text-sm flex-1">{category.name}</span>
                    <span className="text-xs text-gray-500">({category.product_count})</span>
                  </label>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
        
        {/* Price Range */}
        <Card>
          <CardHeader className="py-3 cursor-pointer" onClick={() => toggleSection('price')}>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Price Range
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                !expandedSections.price && "-rotate-90"
              )} />
            </CardTitle>
          </CardHeader>
          {expandedSections.price && (
            <CardContent className="pt-0 space-y-4">
              <Slider
                value={priceRange}
                onValueChange={handlePriceChange}
                onValueCommit={applyPriceFilter}
                max={10000}
                step={100}
                minStepsBetweenThumbs={1}
              />
              <div className="flex items-center justify-between text-sm">
                <span>{formatCurrency(priceRange[0], currency)}</span>
                <span>{formatCurrency(priceRange[1], currency)}</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={applyPriceFilter}
              >
                Apply Price Filter
              </Button>
            </CardContent>
          )}
        </Card>
        
        {/* Availability */}
        <Card>
          <CardHeader className="py-3 cursor-pointer" onClick={() => toggleSection('availability')}>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Availability
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                !expandedSections.availability && "-rotate-90"
              )} />
            </CardTitle>
          </CardHeader>
          {expandedSections.availability && (
            <CardContent className="pt-0">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <Checkbox
                  checked={filters.inStock}
                  onCheckedChange={(checked) => {
                    updateFilter('inStock', checked || null);
                  }}
                />
                <span className="text-sm">In Stock Only</span>
              </label>
            </CardContent>
          )}
        </Card>
        
        {/* Special Offers */}
        <Card>
          <CardHeader className="py-3 cursor-pointer" onClick={() => toggleSection('special')}>
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Special Offers
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                !expandedSections.special && "-rotate-90"
              )} />
            </CardTitle>
          </CardHeader>
          {expandedSections.special && (
            <CardContent className="pt-0">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <Checkbox
                  checked={filters.onSale}
                  onCheckedChange={(checked) => {
                    updateFilter('onSale', checked || null);
                  }}
                />
                <span className="text-sm">On Sale</span>
              </label>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
