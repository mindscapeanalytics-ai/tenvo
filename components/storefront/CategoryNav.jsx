'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CategoryNav({ categories, activeCategory, businessDomain }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Limit visible categories
  const visibleCategories = categories.slice(0, 6);
  const hasMore = categories.length > 6;
  
  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/store/${businessDomain}/products`}
        className={cn(
          "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
          !activeCategory 
            ? "bg-blue-50 text-blue-700" 
            : "text-gray-700 hover:bg-gray-100"
        )}
      >
        All Products
      </Link>
      
      {visibleCategories.map((category) => (
        <Link
          key={category.id}
          href={`/store/${businessDomain}/products?category=${category.slug}`}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
            activeCategory === category.slug
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          {category.name}
        </Link>
      ))}
      
      {hasMore && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            More
            <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
          </button>
          
          {isOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
              {categories.slice(6).map((category) => (
                <Link
                  key={category.id}
                  href={`/store/${businessDomain}/products?category=${category.slug}`}
                  className={cn(
                    "block px-4 py-2 text-sm hover:bg-gray-50 transition-colors",
                    activeCategory === category.slug && "bg-blue-50 text-blue-700"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
