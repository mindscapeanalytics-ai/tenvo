'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveSupermarketSidebarDepartments } from '@/lib/storefront/supermarketStorefront';
import { useSupermarketChromeOptional } from '@/components/storefront/supermarket/SupermarketChromeContext';

function departmentHref(storeBase, dept) {
  const productsUrl = `${storeBase}/products`;
  if (dept.hrefSuffix) return `${productsUrl}${dept.hrefSuffix}`;
  if (dept.slug) return `${productsUrl}?category=${encodeURIComponent(dept.slug)}`;
  return productsUrl;
}

function DepartmentItem({ dept, storeBase, accent, depth = 0, activeCategory, onSaleActive, pathname }) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = Array.isArray(dept.children) && dept.children.length > 0;
  const href = departmentHref(storeBase, dept);
  const onSale = Boolean(dept.hrefSuffix?.includes('onSale') && onSaleActive);
  const isActive =
    onSale
    || (activeCategory && dept.slug && activeCategory === dept.slug)
    || (!hasChildren && pathname === href);

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition',
            open ? 'text-slate-900' : 'text-slate-700 hover:bg-slate-50'
          )}
          style={open ? { backgroundColor: `${accent}14`, color: accent } : undefined}
        >
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-slate-400 transition', open && 'rotate-180')}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate">{dept.label}</span>
        </button>
        {open ? (
          <div className="ml-2 border-l border-slate-100 pl-2" style={{ borderColor: `${accent}33` }}>
            {dept.children.map((child) => (
              <DepartmentItem
                key={child.id}
                dept={child}
                storeBase={storeBase}
                accent={accent}
                depth={depth + 1}
                activeCategory={activeCategory}
                onSaleActive={onSaleActive}
                pathname={pathname}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
        depth > 0 ? 'py-1.5 pl-4 text-slate-600' : 'font-semibold text-slate-700',
        isActive ? 'font-semibold' : 'hover:bg-slate-50 hover:text-slate-900'
      )}
      style={
        isActive
          ? { backgroundColor: `${accent}14`, color: accent, borderLeft: `3px solid ${accent}` }
          : undefined
      }
    >
      {depth === 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden /> : null}
      <span className="truncate">{dept.label}</span>
    </Link>
  );
}

/**
 * Sticky department sidebar — Naheed / DSM feed navigation.
 */
export function SupermarketSidebar({
  storeBase,
  settings = {},
  businessDomain,
  businessCategory,
  categories = [],
  products = [],
  accent = '#f97316',
  className,
  onNavigate,
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeCategory = searchParams.get('category') || '';
  const onSaleActive = searchParams.get('onSale') === 'true';
  const departments = resolveSupermarketSidebarDepartments(settings, storeBase, {
    businessDomain,
    businessCategory,
    categories,
    products,
  });

  return (
    <nav
      className={cn(
        'rounded-xl border border-slate-100 bg-white shadow-sm',
        className
      )}
      aria-label="Shop departments"
      id="supermarket-departments"
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Departments</p>
      </div>
      <div className="max-h-[calc(100vh-220px)] space-y-0.5 overflow-y-auto p-2 scrollbar-thin">
        {departments.map((dept) => (
          <div key={dept.id} onClick={onNavigate} onKeyDown={onNavigate}>
            <DepartmentItem
              dept={dept}
              storeBase={storeBase}
              accent={accent}
              activeCategory={activeCategory}
              onSaleActive={onSaleActive}
              pathname={pathname}
            />
          </div>
        ))}
      </div>
    </nav>
  );
}

/**
 * Categories panel — always mounted (CSS toggle) so header open is instant on every page.
 * Works on all breakpoints as a left slide-over (desktop homepage already has a sticky rail).
 */
export function SupermarketSidebarDrawer({
  storeBase,
  settings,
  businessDomain,
  businessCategory,
  categories = [],
  products = [],
  accent = '#f97316',
}) {
  const chrome = useSupermarketChromeOptional();
  const titleId = useId();
  const isOpen = Boolean(chrome?.isSidebarOpen);
  const pathname = usePathname();

  useEffect(() => {
    if (!chrome?.isSidebarOpen) return undefined;
    chrome.closeSidebar();
    return undefined;
    // Close when the route changes after a category link is followed.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pathname is the intentional trigger
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') chrome?.closeSidebar();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, chrome]);

  if (!chrome) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] transition-[visibility] duration-0',
        isOpen ? 'visible' : 'invisible pointer-events-none'
      )}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className={cn(
          'absolute inset-0 bg-black/40 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        aria-label="Close categories"
        tabIndex={isOpen ? 0 : -1}
        onClick={chrome.closeSidebar}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'absolute inset-y-0 left-0 flex w-[min(320px,92vw)] flex-col bg-white shadow-2xl transition-transform duration-200 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p id={titleId} className="text-sm font-bold text-slate-900">Shop by department</p>
          <button
            type="button"
            onClick={chrome.closeSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            aria-label="Close"
            tabIndex={isOpen ? 0 : -1}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <SupermarketSidebar
            storeBase={storeBase}
            settings={settings}
            businessDomain={businessDomain}
            businessCategory={businessCategory}
            categories={categories}
            products={products}
            accent={accent}
            className="border-0 shadow-none"
            onNavigate={chrome.closeSidebar}
          />
        </div>
      </div>
    </div>
  );
}
