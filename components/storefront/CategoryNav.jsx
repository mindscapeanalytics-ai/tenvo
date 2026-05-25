'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { getStoreAccentColor } from '@/lib/config/storefrontDomains';

export function CategoryNav({ categories, activeCategory, businessDomain }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const { settings, business } = useStorefront();
  const accent = getStoreAccentColor(settings, business?.category);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const visibleCategories = categories?.slice(0, 6) || [];
  const extraCategories = categories?.slice(6) || [];

  const activeLinkStyle = { color: accent, backgroundColor: accent + '12' };

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
      <Link
        href={`/store/${businessDomain}/products`}
        className={cn(
          'px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap flex-shrink-0',
          !activeCategory ? '' : 'text-gray-700 hover:bg-gray-100'
        )}
        style={!activeCategory ? activeLinkStyle : {}}
      >
        All Products
      </Link>

      {visibleCategories.map((category) => (
        <Link
          key={category.id}
          href={`/store/${businessDomain}/products?category=${category.slug}`}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0',
            activeCategory === category.slug ? '' : 'text-gray-700 hover:bg-gray-100'
          )}
          style={activeCategory === category.slug ? activeLinkStyle : {}}
        >
          {category.name}
        </Link>
      ))}

      {extraCategories.length > 0 && (
        <div className="relative flex-shrink-0" ref={ref}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            More
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', isOpen && 'rotate-180')} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
              {extraCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/store/${businessDomain}/products?category=${category.slug}`}
                  className={cn(
                    'flex items-center justify-between px-4 py-2.5 text-sm transition-colors',
                    activeCategory === category.slug ? 'font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  )}
                  style={activeCategory === category.slug ? { color: accent } : {}}
                  onClick={() => setIsOpen(false)}
                >
                  <span>{category.name}</span>
                  {category.product_count !== undefined && (
                    <span className="text-xs text-gray-400 tabular-nums ml-2">{category.product_count}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
