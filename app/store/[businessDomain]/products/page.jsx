import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getBusinessByDomain } from '@/lib/actions/storefront/business';
import { getProducts, getCategories } from '@/lib/actions/storefront/products';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { ProductFilters } from '@/components/storefront/ProductFilters';
import { SearchBar } from '@/components/storefront/SearchBar';
import { CategoryNav } from '@/components/storefront/CategoryNav';
import { ProductsSkeleton } from '@/components/storefront/LoadingSkeletons';
import { Metadata } from 'next';

export async function generateMetadata({ params, searchParams }) {
  const result = await getBusinessByDomain(params.businessDomain);
  
  if (!result.success) {
    return { title: 'Store Not Found' };
  }
  
  const { business } = result;
  const category = searchParams.category;
  
  return {
    title: category 
      ? `${category} - ${business.business_name}` 
      : `Products - ${business.business_name}`,
    description: `Browse products from ${business.business_name}`,
  };
}

export default async function ProductsPage({ params, searchParams }) {
  const { businessDomain } = params;
  
  // Validate business
  const businessResult = await getBusinessByDomain(businessDomain);
  if (!businessResult.success) {
    notFound();
  }
  
  const { business } = businessResult;
  
  // Parse filters from search params
  const filters = {
    category: searchParams.category,
    minPrice: searchParams.minPrice ? parseFloat(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : undefined,
    search: searchParams.search,
    sort: searchParams.sort || 'featured',
    inStock: searchParams.inStock === 'true',
    onSale: searchParams.onSale === 'true',
    page: parseInt(searchParams.page || '1'),
    limit: 24,
  };
  
  // Fetch categories for filters
  const categoriesResult = await getCategories(business.id);
  const categories = categoriesResult.success ? categoriesResult.categories : [];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {filters.search ? `Search: "${filters.search}"` : 'All Products'}
          </h1>
          <p className="text-gray-600">
            Browse our collection of quality products
          </p>
        </div>
      </div>
      
      {/* Category Navigation */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <CategoryNav 
            categories={categories} 
            activeCategory={filters.category}
            businessDomain={businessDomain}
          />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-40">
              <ProductFilters 
                filters={filters}
                categories={categories}
                businessDomain={businessDomain}
              />
            </div>
          </aside>
          
          {/* Product Grid */}
          <main className="flex-1">
            {/* Search and Sort Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <SearchBar 
                  businessDomain={businessDomain}
                  initialQuery={filters.search}
                />
              </div>
              <SortDropdown 
                currentSort={filters.sort}
                businessDomain={businessDomain}
                searchParams={searchParams}
              />
            </div>
            
            {/* Active Filters */}
            <ActiveFilters 
              filters={filters}
              businessDomain={businessDomain}
              searchParams={searchParams}
            />
            
            {/* Products */}
            <Suspense fallback={<ProductsSkeleton count={12} />}>
              <ProductGridContent 
                businessId={business.id}
                businessDomain={businessDomain}
                filters={filters}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}

async function ProductGridContent({ businessId, businessDomain, filters }) {
  const result = await getProducts(businessId, filters);
  
  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load products</p>
      </div>
    );
  }
  
  const { products, total, hasMore } = result;
  
  return (
    <ProductGrid 
      products={products}
      total={total}
      hasMore={hasMore}
      businessDomain={businessDomain}
      currentPage={filters.page}
      filters={filters}
    />
  );
}

function SortDropdown({ currentSort, businessDomain, searchParams }) {
  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name-asc', label: 'Name: A to Z' },
    { value: 'popularity', label: 'Most Popular' },
  ];
  
  const handleSort = (value) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', value);
    window.location.href = `/store/${businessDomain}/products?${params.toString()}`;
  };
  
  return (
    <select
      value={currentSort}
      onChange={(e) => handleSort(e.target.value)}
      className="border rounded-lg px-4 py-2 bg-white text-sm focus:ring-2 focus:ring-blue-500"
    >
      {sortOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function ActiveFilters({ filters, businessDomain, searchParams }) {
  const activeFilters = [];
  
  if (filters.category) {
    activeFilters.push({ key: 'category', label: `Category: ${filters.category}` });
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceLabel = `Price: ${filters.minPrice || 0} - ${filters.maxPrice || '∞'}`;
    activeFilters.push({ key: 'price', label: priceLabel });
  }
  if (filters.inStock) {
    activeFilters.push({ key: 'inStock', label: 'In Stock' });
  }
  if (filters.onSale) {
    activeFilters.push({ key: 'onSale', label: 'On Sale' });
  }
  if (filters.search) {
    activeFilters.push({ key: 'search', label: `Search: ${filters.search}` });
  }
  
  if (activeFilters.length === 0) return null;
  
  const removeFilter = (key) => {
    const params = new URLSearchParams(searchParams);
    if (key === 'price') {
      params.delete('minPrice');
      params.delete('maxPrice');
    } else {
      params.delete(key);
    }
    window.location.href = `/store/${businessDomain}/products?${params.toString()}`;
  };
  
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {activeFilters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
        >
          {filter.label}
          <button
            onClick={() => removeFilter(filter.key)}
            className="hover:text-blue-900"
          >
            ×
          </button>
        </span>
      ))}
      {activeFilters.length > 1 && (
        <button
          onClick={() => {
            window.location.href = `/store/${businessDomain}/products`;
          }}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
