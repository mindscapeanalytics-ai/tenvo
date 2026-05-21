import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getBusinessByDomain } from '@/lib/actions/storefront/business';
import { getProductBySlug, getRelatedProducts } from '@/lib/actions/storefront/products';
import { ProductGallery } from '@/components/storefront/ProductGallery';
import { ProductInfo } from '@/components/storefront/ProductInfo';
import { ProductVariants } from '@/components/storefront/ProductVariants';
import { AddToCartSection } from '@/components/storefront/AddToCartSection';
import { RelatedProducts } from '@/components/storefront/RelatedProducts';
import { ProductReviews } from '@/components/storefront/ProductReviews';
import { ProductBreadcrumbs } from '@/components/storefront/ProductBreadcrumbs';
import { ProductDetailSkeleton } from '@/components/storefront/LoadingSkeletons';
import { Metadata } from 'next';

export async function generateMetadata({ params }) {
  const result = await getBusinessByDomain(params.businessDomain);
  
  if (!result.success) {
    return { title: 'Product Not Found' };
  }
  
  const productResult = await getProductBySlug(result.business.id, params.slug);
  
  if (!productResult.success) {
    return { title: 'Product Not Found' };
  }
  
  const { product } = productResult;
  
  return {
    title: `${product.name} - ${result.business.business_name}`,
    description: product.description?.substring(0, 160) || `Buy ${product.name}`,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.image_url ? [{ url: product.image_url }] : [],
      type: 'product',
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const { businessDomain, slug } = params;
  
  // Validate business
  const businessResult = await getBusinessByDomain(businessDomain);
  if (!businessResult.success) {
    notFound();
  }
  
  const { business } = businessResult;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductContent 
          businessId={business.id}
          businessDomain={businessDomain}
          slug={slug}
        />
      </Suspense>
    </div>
  );
}

async function ProductContent({ businessId, businessDomain, slug }) {
  const productResult = await getProductBySlug(businessId, slug);
  
  if (!productResult.success) {
    notFound();
  }
  
  const { product } = productResult;
  
  // Get related products
  const relatedResult = await getRelatedProducts(businessId, product.id, 8);
  const relatedProducts = relatedResult.success ? relatedResult.products : [];
  
  // Prepare images array
  const images = product.images?.length > 0 
    ? product.images 
    : product.image_url 
      ? [{ url: product.image_url, alt: product.name }]
      : [];
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <ProductBreadcrumbs 
        businessDomain={businessDomain}
        category={product.category_name}
        categorySlug={product.category_slug}
        productName={product.name}
      />
      
      {/* Main Product Section */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* Product Gallery */}
          <div className="space-y-4">
            <ProductGallery images={images} productName={product.name} />
          </div>
          
          {/* Product Info */}
          <div className="space-y-6">
            <ProductInfo 
              product={product}
              businessDomain={businessDomain}
            />
            
            {/* Variants Selection */}
            {product.has_variants && (
              <ProductVariants 
                product={product}
                businessDomain={businessDomain}
              />
            )}
            
            {/* Add to Cart */}
            <AddToCartSection 
              product={product}
              businessDomain={businessDomain}
            />
            
            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <TrustBadge 
                icon="Truck"
                title="Free Shipping"
                subtitle="Orders over Rs. 2000"
              />
              <TrustBadge 
                icon="Shield"
                title="Secure Payment"
                subtitle="100% secure checkout"
              />
              <TrustBadge 
                icon="RefreshCw"
                title="Easy Returns"
                subtitle="7-day return policy"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Details Tabs */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-12">
        <ProductTabs product={product} />
      </div>
      
      {/* Reviews Section */}
      {product.enable_reviews !== false && (
        <div className="mb-12">
          <ProductReviews 
            productId={product.id}
            businessDomain={businessDomain}
            initialRating={product.rating}
            reviewCount={product.review_count}
          />
        </div>
      )}
      
      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mb-12">
          <RelatedProducts 
            products={relatedProducts}
            businessDomain={businessDomain}
            title="You May Also Like"
          />
        </div>
      )}
      
      {/* Recently Viewed */}
      <RecentlyViewedSection 
        currentProductId={product.id}
        businessDomain={businessDomain}
      />
    </div>
  );
}

function TrustBadge({ icon, title, subtitle }) {
  const icons = {
    Truck: () => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 12a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
    ),
    Shield: () => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    RefreshCw: () => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  };
  
  const Icon = icons[icon];
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 text-blue-600">
        <Icon />
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function ProductTabs({ product }) {
  // This would be a client component with tab switching
  return (
    <div className="p-8">
      <div className="border-b mb-6">
        <div className="flex gap-8">
          <button className="pb-4 border-b-2 border-blue-600 font-medium text-blue-600">
            Description
          </button>
          <button className="pb-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
            Specifications
          </button>
          <button className="pb-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700">
            Shipping & Returns
          </button>
        </div>
      </div>
      
      <div className="prose max-w-none">
        <div 
          className="text-gray-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: product.description || 'No description available' }}
        />
      </div>
      
      {/* Specifications */}
      {product.specifications && (
        <div className="mt-8">
          <h3 className="font-semibold mb-4">Specifications</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex">
                <dt className="w-1/3 text-gray-500 capitalize">{key}:</dt>
                <dd className="w-2/3 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function RecentlyViewedSection({ currentProductId, businessDomain }) {
  // This would be a client component that reads from localStorage
  return (
    <div className="border-t pt-8">
      <h2 className="text-xl font-bold mb-6">Recently Viewed</h2>
      <p className="text-gray-500">Products you viewed recently will appear here</p>
    </div>
  );
}
