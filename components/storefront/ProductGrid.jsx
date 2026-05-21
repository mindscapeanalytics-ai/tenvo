'use client';

import { ProductCard } from './ProductCard';

export function ProductGrid({ products, businessDomain }) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No products found</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          businessDomain={businessDomain}
        />
      ))}
    </div>
  );
}
