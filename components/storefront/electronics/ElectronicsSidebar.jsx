'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveElectronicsSidebarDepartments } from '@/lib/storefront/electronicsStorefront';

function departmentHref(storeBase, dept) {
  if (dept.href) return dept.href;
  const productsUrl = `${storeBase}/products`;
  if (dept.hrefSuffix) return `${productsUrl}${dept.hrefSuffix}`;
  if (dept.slug) return `${productsUrl}?category=${encodeURIComponent(dept.slug)}`;
  return productsUrl;
}

function DepartmentItem({ dept, storeBase, accent, depth = 0, onNavigate }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = Array.isArray(dept.children) && dept.children.length > 0;
  const href = departmentHref(storeBase, dept);
  const categoryParam = dept.slug ? searchParams.get('category') : null;
  const onSale = dept.hrefSuffix?.includes('onSale') && searchParams.get('onSale') === 'true';
  const isActive =
    onSale ||
    (categoryParam && dept.slug && categoryParam === dept.slug) ||
    (!hasChildren && pathname === href);

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition',
            open ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'
          )}
        >
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-slate-400 transition', open && 'rotate-180')}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate">{dept.label}</span>
        </button>
        {open ? (
          <div className="ml-2 border-l border-blue-100 pl-2">
            {dept.children.map((child) => (
              <DepartmentItem
                key={child.id}
                dept={child}
                storeBase={storeBase}
                accent={accent}
                depth={depth + 1}
                onNavigate={onNavigate}
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
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
        depth > 0 ? 'py-1.5 pl-4 text-slate-600' : 'font-semibold text-slate-700',
        isActive ? 'bg-blue-50 font-semibold text-blue-800' : 'hover:bg-slate-50 hover:text-slate-900'
      )}
      style={isActive ? { borderLeft: `3px solid ${accent}` } : undefined}
    >
      {depth === 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" aria-hidden /> : null}
      <span className="truncate">{dept.label}</span>
    </Link>
  );
}

/**
 * Sticky department sidebar — supermarket-style feed navigation for electronics.
 */
export function ElectronicsSidebar({
  storeBase,
  settings = {},
  businessDomain,
  accent = '#2563eb',
  className,
  onNavigate,
}) {
  const departments = resolveElectronicsSidebarDepartments(settings, storeBase, { businessDomain });

  return (
    <nav
      className={cn('rounded-xl border border-slate-100 bg-white shadow-sm', className)}
      aria-label="Shop departments"
    >
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Departments</p>
      </div>
      <div className="max-h-[calc(100vh-220px)] space-y-0.5 overflow-y-auto p-2">
        {departments.map((dept) => (
          <DepartmentItem
            key={dept.id}
            dept={dept}
            storeBase={storeBase}
            accent={accent}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}

/** Simple mobile department sheet (no chrome context required). */
export function ElectronicsSidebarDrawer({ storeBase, settings, businessDomain, accent }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-slate-100 bg-white/95 px-3 py-2 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900"
        >
          Shop by department
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close departments"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Shop by department</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <ElectronicsSidebar
                storeBase={storeBase}
                settings={settings}
                businessDomain={businessDomain}
                accent={accent}
                className="border-0 shadow-none"
                onNavigate={() => setOpen(false)}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
