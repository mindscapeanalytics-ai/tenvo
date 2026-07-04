'use client';

import { useState } from 'react';
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

function DepartmentItem({ dept, storeBase, accent, depth = 0 }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = Array.isArray(dept.children) && dept.children.length > 0;
  const href = departmentHref(storeBase, dept);
  const categoryParam = dept.slug ? searchParams.get('category') : null;
  const onSale = dept.hrefSuffix?.includes('onSale') && searchParams.get('onSale') === 'true';
  const isActive =
    onSale
    || (categoryParam && dept.slug && categoryParam === dept.slug)
    || (!hasChildren && pathname === href);

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition',
            open ? 'bg-orange-50 text-orange-900' : 'text-slate-700 hover:bg-slate-50'
          )}
        >
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-slate-400 transition', open && 'rotate-180')}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate">{dept.label}</span>
        </button>
        {open ? (
          <div className="ml-2 border-l border-orange-100 pl-2">
            {dept.children.map((child) => (
              <DepartmentItem
                key={child.id}
                dept={child}
                storeBase={storeBase}
                accent={accent}
                depth={depth + 1}
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
        isActive ? 'bg-orange-50 font-semibold text-orange-800' : 'hover:bg-slate-50 hover:text-slate-900'
      )}
      style={isActive ? { borderLeft: `3px solid ${accent}` } : undefined}
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
  accent = '#f97316',
  className,
  onNavigate,
}) {
  const departments = resolveSupermarketSidebarDepartments(settings, storeBase, { businessDomain });

  return (
    <nav
      className={cn(
        'rounded-xl border border-slate-100 bg-white shadow-sm',
        className
      )}
      aria-label="Shop departments"
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Departments</p>
      </div>
      <div className="max-h-[calc(100vh-220px)] space-y-0.5 overflow-y-auto p-2 scrollbar-thin">
        {departments.map((dept) => (
          <div key={dept.id} onClick={onNavigate} onKeyDown={onNavigate}>
            <DepartmentItem dept={dept} storeBase={storeBase} accent={accent} />
          </div>
        ))}
      </div>
    </nav>
  );
}

/** Mobile drawer overlay for department sidebar */
export function SupermarketSidebarDrawer({
  storeBase,
  settings,
  businessDomain,
  accent,
}) {
  const chrome = useSupermarketChromeOptional();
  if (!chrome?.isSidebarOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close categories"
        onClick={chrome.closeSidebar}
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <p className="text-sm font-bold text-slate-900">Shop by department</p>
          <button
            type="button"
            onClick={chrome.closeSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <SupermarketSidebar
            storeBase={storeBase}
            settings={settings}
            businessDomain={businessDomain}
            accent={accent}
            className="border-0 shadow-none"
            onNavigate={chrome.closeSidebar}
          />
        </div>
      </div>
    </div>
  );
}
