'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { useClickOutside } from '@/lib/hooks/useClickOutside';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export function SearchBar({ businessDomain, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const router = useRouter();
  
  // Close suggestions on click outside
  useClickOutside(containerRef, () => setShowSuggestions(false));
  
  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/storefront/${businessDomain}/search?q=${encodeURIComponent(query)}`
          );
          if (response.ok) {
            const data = await response.json();
            setSuggestions(data.products || []);
            setShowSuggestions(true);
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [query, businessDomain]);
  
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/store/${businessDomain}/products?search=${encodeURIComponent(query)}`);
      setShowSuggestions(false);
    }
  }, [query, businessDomain, router]);
  
  const handleSuggestionClick = useCallback((product) => {
    router.push(`/store/${businessDomain}/products/${product.slug || product.id}`);
    setShowSuggestions(false);
    setQuery('');
  }, [businessDomain, router]);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSuggestionClick(suggestions[selectedIndex]);
      } else {
        handleSubmit(e);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [suggestions, selectedIndex, handleSuggestionClick, handleSubmit]);
  
  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };
  
  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            className={cn(
              "w-full pl-12 pr-12 py-3 rounded-xl border bg-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "transition-all duration-200",
              showSuggestions && suggestions.length > 0 && "rounded-b-none"
            )}
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isLoading && (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            )}
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        
        {/* Search Button (Mobile) */}
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors sm:hidden"
        >
          Search
        </button>
      </form>
      
      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b-xl shadow-lg z-50 overflow-hidden"
          >
            <div className="max-h-96 overflow-y-auto">
              {suggestions.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleSuggestionClick(product)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 text-left transition-colors",
                    selectedIndex === index ? "bg-blue-50" : "hover:bg-gray-50",
                    index !== suggestions.length - 1 && "border-b"
                  )}
                >
                  {/* Product Image */}
                  <div className="relative w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 line-clamp-1">
                      {product.name}
                    </p>
                    {product.category_name && (
                      <p className="text-sm text-gray-500">{product.category_name}</p>
                    )}
                  </div>
                  
                  {/* Price */}
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(product.price, 'PKR')}
                    </p>
                    {product.compare_price && product.compare_price > product.price && (
                      <p className="text-sm text-gray-400 line-through">
                        {formatCurrency(product.compare_price, 'PKR')}
                      </p>
                    )}
                  </div>
                  
                  <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
            
            {/* View All Results */}
            <button
              onClick={handleSubmit}
              className="w-full p-4 text-center text-blue-600 font-medium hover:bg-blue-50 transition-colors border-t"
            >
              View all results for "{query}"
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay for mobile */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 sm:hidden"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
}

