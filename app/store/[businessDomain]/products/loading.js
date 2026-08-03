import { ProductsSkeleton } from '@/components/storefront/LoadingSkeletons';

export default function StoreProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 space-y-3">
        <div className="h-3 w-40 animate-pulse rounded bg-neutral-200" />
        <div className="h-8 w-56 animate-pulse rounded-md bg-neutral-200" />
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-neutral-100" />
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden lg:block lg:w-72 lg:shrink-0">
          <div className="h-[28rem] animate-pulse rounded-2xl border border-neutral-100 bg-white" />
        </aside>
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="h-11 flex-1 animate-pulse rounded-xl bg-neutral-200" />
            <div className="h-11 w-36 animate-pulse rounded-xl bg-neutral-200" />
          </div>
          <ProductsSkeleton count={12} density="catalog" />
        </div>
      </div>
    </div>
  );
}
