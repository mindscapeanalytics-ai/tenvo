'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { getStoreAccentColor } from '@/lib/config/storefrontDomains';
import { isFashionEditorialStore } from '@/lib/storefront/fashionEditorial';
import { isElectronicsElevatedStore } from '@/lib/storefront/electronicsStorefront';
import {
  isMarinePartsFinderStore,
  MARINE_EQUIPMENT_TYPES,
  MARINE_VESSEL_TYPES,
  MARINE_SYSTEM_CONDITIONS,
} from '@/lib/storefront/marinePartsFinder';
import { isPharmacyElevatedStore } from '@/lib/storefront/pharmacyStorefront';
import { getBrandsForMarket } from '@/lib/regionalMarket/index.js';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import {
  PK_FABRIC_OPTIONS,
  PK_SIZE_OPTIONS,
  PK_SOURCING_OPTIONS,
} from '@/lib/utils/inventoryFieldSuggestions';
import {
  buildStoreProductsHref,
  storefrontCategoriesMatch,
} from '@/lib/storefront/storefrontCategoryNav';

function FilterSection({ title, expanded, onToggle, children, count }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          {title}
          {count > 0 && (
            <span className="w-4 h-4 rounded-full bg-gray-900 text-white text-[9px] font-semibold flex items-center justify-center">
              {count}
            </span>
          )}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', expanded && 'rotate-180')} />
      </button>
      {expanded && <div className="pb-4">{children}</div>}
    </div>
  );
}

function FilterOptionList({ options, filterKey, currentValue, accent, onSelect, formatLabel }) {
  return (
    <div className="space-y-0.5 max-h-52 overflow-y-auto pr-0.5">
      {options.map((opt) => {
        const label = formatLabel ? formatLabel(opt) : opt;
        return (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 px-1 py-1.5 rounded-lg group">
            <Checkbox
              checked={currentValue === opt}
              onCheckedChange={(checked) => onSelect(filterKey, checked ? opt : null)}
              style={currentValue === opt ? { backgroundColor: accent, borderColor: accent } : {}}
            />
            <span className="text-sm text-gray-700 flex-1 group-hover:text-gray-900 capitalize">{label}</span>
          </label>
        );
      })}
    </div>
  );
}

function CategoryNavList({ categories, filters, accent, onSelect }) {
  return (
    <div className="space-y-0.5 max-h-64 overflow-y-auto pr-0.5">
      <button
        type="button"
        onClick={() => onSelect('category', null)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
          !filters.category ? 'font-semibold' : 'font-medium text-gray-700 hover:bg-gray-50'
        )}
        style={!filters.category ? { color: accent, backgroundColor: `${accent}12` } : undefined}
      >
        <span>All products</span>
      </button>
      {categories.map((cat) => {
        const active =
          storefrontCategoriesMatch(filters.category, cat.slug) ||
          storefrontCategoriesMatch(filters.category, cat.name);
        return (
          <button
            type="button"
            key={cat.id}
            onClick={() => onSelect('category', cat.slug || cat.name)}
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
              active ? 'font-semibold' : 'font-medium text-gray-700 hover:bg-gray-50'
            )}
            style={active ? { color: accent, backgroundColor: `${accent}12` } : undefined}
          >
            <span className="min-w-0 truncate">{cat.name}</span>
            {cat.product_count !== undefined && (
              <span className="shrink-0 text-xs tabular-nums text-gray-400">{cat.product_count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function FiltersBody({ filters, categories, businessDomain, onClose }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency, settings, business } = useStorefront();
  const accent = getStoreAccentColor(settings, business?.category);
  const clothingStore = isFashionEditorialStore(business?.category);
  const electronicsStore = isElectronicsElevatedStore(business?.category);
  const marineStore = isMarinePartsFinderStore(business?.category);
  const pharmacyStore = isPharmacyElevatedStore(business?.category);

  const countryIso =
    settings?.storefront?.countryIso ||
    (business?.country === 'Pakistan' ? 'PK' : business?.country?.slice(0, 2)?.toUpperCase()) ||
    'PK';

  const clothingFilterOptions = useMemo(() => {
    if (!clothingStore) return null;
    const knowledge = getDomainKnowledge(business?.category, { countryIso });
    const marketBrands = getBrandsForMarket(countryIso, business?.category) || [];
    const popularBrands = knowledge?.pakistaniFeatures?.popularBrands || [];
    const fabricOptions = uniqueFilterOptions([
      ...(knowledge?.fieldConfig?.fabrictype?.options || []),
      ...PK_FABRIC_OPTIONS,
    ]);
    return {
      brands: uniqueFilterOptions([...marketBrands, ...popularBrands]),
      fabrics: fabricOptions,
      sourcing: uniqueFilterOptions([
        ...(knowledge?.fieldConfig?.sourcing?.options || []),
        ...PK_SOURCING_OPTIONS,
      ]),
      sizes: uniqueFilterOptions([
        ...(knowledge?.fieldConfig?.sizecolormatrix?.options || []),
        ...PK_SIZE_OPTIONS,
      ]),
    };
  }, [clothingStore, business?.category, countryIso]);

  const electronicsBrandOptions = useMemo(() => {
    if (!electronicsStore) return [];
    const knowledge = getDomainKnowledge(business?.category, { countryIso });
    const marketBrands = getBrandsForMarket(countryIso, business?.category) || [];
    const popularBrands = knowledge?.pakistaniFeatures?.popularBrands || [];
    return uniqueFilterOptions([
      ...marketBrands,
      ...popularBrands,
      'PEL',
      'YOLO',
      'Haier',
      'Dawlance',
      'Samsung',
      'LG',
      'Gree',
      'Orient',
      'Kenwood',
      'Midea',
      'Philips',
      'TCL',
    ]);
  }, [electronicsStore, business?.category, countryIso]);

  const [priceRange, setPriceRange] = useState([
    filters.minPrice || 0,
    filters.maxPrice || 50000,
  ]);
  const [expanded, setExpanded] = useState({
    browse: true,
    categories: true,
    brand: clothingStore || electronicsStore,
    fabric: clothingStore,
    sourcing: clothingStore,
    size: false,
    equipment: Boolean(filters.equipmentType),
    vessel: Boolean(filters.vesselType),
    condition: Boolean(filters.systemCondition),
    price: true,
    availability: true,
    special: true,
  });

  const toggle = (k) => setExpanded((p) => ({ ...p, [k]: !p[k] }));

  const updateFilter = (key, value) => {
    if (key === 'category') {
      router.push(
        buildStoreProductsHref(businessDomain, {
          category: value,
          searchParams,
          preserveSortView: true,
          clearAttributeFilters: true,
        })
      );
      onClose?.();
      return;
    }

    // Pharmacy browse modes use short URL keys (otc / rx), mutually exclusive.
    if (key === 'otcOnly' || key === 'rxOnly') {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      params.delete('otc');
      params.delete('rx');
      params.delete('onSale');
      if (key === 'otcOnly' && value) params.set('otc', 'true');
      if (key === 'rxOnly' && value) params.set('rx', 'true');
      router.push(`/store/${businessDomain}/products?${params.toString()}`);
      onClose?.();
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === false || value === '') params.delete(key);
    else params.set(key, String(value));
    params.delete('page');
    router.push(`/store/${businessDomain}/products?${params.toString()}`);
    onClose?.();
  };

  const applyPrice = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('minPrice', String(priceRange[0]));
    params.set('maxPrice', String(priceRange[1]));
    params.delete('page');
    router.push(`/store/${businessDomain}/products?${params.toString()}`);
    onClose?.();
  };

  const clearAll = () => {
    router.push(
      buildStoreProductsHref(businessDomain, {
        searchParams,
        preserveSortView: true,
      })
    );
    onClose?.();
  };

  const activeCount = [
    filters.category,
    filters.brand,
    filters.fabric,
    filters.sourcing,
    filters.size,
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
    filters.inStock,
    filters.onSale,
    filters.equipmentType,
    filters.vesselType,
    filters.systemCondition,
    filters.manufacturer,
    filters.otcOnly,
    filters.rxOnly,
    filters.model,
    filters.year,
    filters.engine,
    filters.engineNo,
    filters.vehicleClass,
    filters.vehicleType,
    filters.body,
    filters.fuel,
    filters.condition,
    filters.search,
  ].filter(Boolean).length;

  const pharmacyBrowseActive = filters.otcOnly || filters.rxOnly || filters.onSale;

  return (
    <div className="space-y-0">
      <div className="mb-1 flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Browse &amp; filters
          {activeCount > 0 && (
            <span className="ml-1 font-normal text-gray-400">({activeCount} active)</span>
          )}
        </h3>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700"
          >
            <X className="h-3.5 w-3.5" /> Clear all
          </button>
        )}
      </div>

      {pharmacyStore && (
        <FilterSection
          title="Pharmacy"
          expanded={expanded.browse}
          onToggle={() => toggle('browse')}
          count={pharmacyBrowseActive ? 1 : 0}
        >
          <div className="space-y-0.5">
            {[
              { key: 'all', label: 'All medicines', active: !filters.otcOnly && !filters.rxOnly && !filters.onSale },
              { key: 'otcOnly', label: 'OTC only', active: !!filters.otcOnly },
              { key: 'rxOnly', label: 'Prescription (Rx)', active: !!filters.rxOnly },
              { key: 'onSale', label: 'Deals & offers', active: !!filters.onSale && !filters.otcOnly && !filters.rxOnly },
            ].map((item) => (
              <button
                type="button"
                key={item.key}
                onClick={() => {
                  if (item.key === 'all') {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('page');
                    params.delete('otc');
                    params.delete('rx');
                    params.delete('onSale');
                    router.push(`/store/${businessDomain}/products?${params.toString()}`);
                    onClose?.();
                    return;
                  }
                  if (item.key === 'onSale') {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete('page');
                    params.delete('otc');
                    params.delete('rx');
                    params.set('onSale', 'true');
                    router.push(`/store/${businessDomain}/products?${params.toString()}`);
                    onClose?.();
                    return;
                  }
                  updateFilter(item.key, true);
                }}
                className={cn(
                  'flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                  item.active ? 'font-semibold' : 'font-medium text-gray-700 hover:bg-gray-50'
                )}
                style={item.active ? { color: accent, backgroundColor: `${accent}12` } : undefined}
              >
                {item.label}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {categories.length > 0 && (
        <FilterSection
          title="Categories"
          expanded={expanded.categories}
          onToggle={() => toggle('categories')}
          count={filters.category ? 1 : 0}
        >
          <CategoryNavList
            categories={categories}
            filters={filters}
            accent={accent}
            onSelect={updateFilter}
          />
        </FilterSection>
      )}

      {clothingStore && clothingFilterOptions?.brands?.length > 0 && (
        <FilterSection
          title="Brand"
          expanded={expanded.brand}
          onToggle={() => toggle('brand')}
          count={filters.brand ? 1 : 0}
        >
          <FilterOptionList
            options={clothingFilterOptions.brands}
            filterKey="brand"
            currentValue={filters.brand}
            accent={accent}
            onSelect={updateFilter}
          />
        </FilterSection>
      )}

      {electronicsStore && electronicsBrandOptions.length > 0 && (
        <FilterSection
          title="Brand"
          expanded={expanded.brand}
          onToggle={() => toggle('brand')}
          count={filters.brand ? 1 : 0}
        >
          <FilterOptionList
            options={electronicsBrandOptions}
            filterKey="brand"
            currentValue={filters.brand}
            accent={accent}
            onSelect={updateFilter}
          />
        </FilterSection>
      )}

      {clothingStore && clothingFilterOptions?.fabrics?.length > 0 && (
        <FilterSection
          title="Fabric"
          expanded={expanded.fabric}
          onToggle={() => toggle('fabric')}
          count={filters.fabric ? 1 : 0}
        >
          <FilterOptionList
            options={clothingFilterOptions.fabrics}
            filterKey="fabric"
            currentValue={filters.fabric}
            accent={accent}
            onSelect={updateFilter}
          />
        </FilterSection>
      )}

      {clothingStore && clothingFilterOptions?.sourcing?.length > 0 && (
        <FilterSection
          title="Sourcing"
          expanded={expanded.sourcing}
          onToggle={() => toggle('sourcing')}
          count={filters.sourcing ? 1 : 0}
        >
          <FilterOptionList
            options={clothingFilterOptions.sourcing}
            filterKey="sourcing"
            currentValue={filters.sourcing}
            accent={accent}
            onSelect={updateFilter}
          />
        </FilterSection>
      )}

      {clothingStore && clothingFilterOptions?.sizes?.length > 0 && (
        <FilterSection
          title="Size"
          expanded={expanded.size}
          onToggle={() => toggle('size')}
          count={filters.size ? 1 : 0}
        >
          <FilterOptionList
            options={clothingFilterOptions.sizes}
            filterKey="size"
            currentValue={filters.size}
            accent={accent}
            onSelect={updateFilter}
          />
        </FilterSection>
      )}

      {marineStore && (
        <>
          <FilterSection
            title="Equipment type"
            expanded={expanded.equipment}
            onToggle={() => toggle('equipment')}
            count={filters.equipmentType ? 1 : 0}
          >
            <FilterOptionList
              options={MARINE_EQUIPMENT_TYPES}
              filterKey="equipmentType"
              currentValue={filters.equipmentType}
              accent={accent}
              onSelect={updateFilter}
            />
          </FilterSection>
          <FilterSection
            title="Vessel type"
            expanded={expanded.vessel}
            onToggle={() => toggle('vessel')}
            count={filters.vesselType ? 1 : 0}
          >
            <FilterOptionList
              options={MARINE_VESSEL_TYPES}
              filterKey="vesselType"
              currentValue={filters.vesselType}
              accent={accent}
              onSelect={updateFilter}
            />
          </FilterSection>
          <FilterSection
            title="Condition"
            expanded={expanded.condition}
            onToggle={() => toggle('condition')}
            count={filters.systemCondition ? 1 : 0}
          >
            <FilterOptionList
              options={MARINE_SYSTEM_CONDITIONS}
              filterKey="systemCondition"
              currentValue={filters.systemCondition}
              accent={accent}
              onSelect={updateFilter}
              formatLabel={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            />
          </FilterSection>
        </>
      )}

      <FilterSection
        title="Price range"
        expanded={expanded.price}
        onToggle={() => toggle('price')}
        count={filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0}
      >
        <div className="space-y-4 px-1">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={50000}
            step={500}
            minStepsBetweenThumbs={1}
            className="mt-2"
          />
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 tabular-nums">
              {formatCurrency(priceRange[0], currency)}
            </div>
            <span className="text-sm text-gray-400">to</span>
            <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 tabular-nums">
              {formatCurrency(priceRange[1], currency)}
            </div>
          </div>
          <button
            type="button"
            onClick={applyPrice}
            className="w-full rounded-xl py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            Apply price filter
          </button>
        </div>
      </FilterSection>

      <FilterSection
        title="Availability"
        expanded={expanded.availability}
        onToggle={() => toggle('availability')}
        count={filters.inStock ? 1 : 0}
      >
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 group hover:bg-gray-50">
          <Checkbox
            checked={!!filters.inStock}
            onCheckedChange={(checked) => updateFilter('inStock', checked || null)}
            style={filters.inStock ? { backgroundColor: accent, borderColor: accent } : {}}
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">In stock only</span>
        </label>
      </FilterSection>

      {!pharmacyStore && (
        <FilterSection
          title="Special offers"
          expanded={expanded.special}
          onToggle={() => toggle('special')}
          count={filters.onSale ? 1 : 0}
        >
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1.5 group hover:bg-gray-50">
            <Checkbox
              checked={!!filters.onSale}
              onCheckedChange={(checked) => updateFilter('onSale', checked || null)}
              style={filters.onSale ? { backgroundColor: accent, borderColor: accent } : {}}
            />
            <span className="text-sm text-gray-700 group-hover:text-gray-900">On sale</span>
          </label>
        </FilterSection>
      )}
    </div>
  );
}

function uniqueFilterOptions(values) {
  const seen = new Set();
  const out = [];
  for (const raw of values) {
    const s = String(raw || '').trim();
    if (!s || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(s);
  }
  return out;
}

export function ProductFilters({ filters, categories, businessDomain }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings, business } = useStorefront();
  const accent = getStoreAccentColor(settings, business?.category);

  const activeCount = [
    filters.category,
    filters.brand,
    filters.fabric,
    filters.sourcing,
    filters.size,
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
    filters.inStock,
    filters.onSale,
    filters.equipmentType,
    filters.vesselType,
    filters.systemCondition,
    filters.manufacturer,
    filters.otcOnly,
    filters.rxOnly,
    filters.search,
  ].filter(Boolean).length;

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Browse &amp; filters
          {activeCount > 0 && (
            <span
              className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="flex w-full flex-col p-0 sm:max-w-xs">
          <SheetHeader className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
            <SheetTitle className="text-base font-semibold">Browse &amp; filters</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <FiltersBody
              filters={filters}
              categories={categories}
              businessDomain={businessDomain}
              onClose={() => setMobileOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:block">
        <FiltersBody
          filters={filters}
          categories={categories}
          businessDomain={businessDomain}
        />
      </div>
    </>
  );
}
