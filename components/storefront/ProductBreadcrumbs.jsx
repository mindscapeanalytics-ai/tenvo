'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export function ProductBreadcrumbs({ items, businessDomain }) {
  if (!items || items.length === 0) return null;
  
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 py-4">
      <Link 
        href={`/store/${businessDomain}`}
        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
      >
        <Home className="w-4 h-4" />
        Home
      </Link>
      
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {item.href ? (
            <Link 
              href={item.href}
              className="hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
