/**
 * Deep-dive Inventory section for `/features#inventory`.
 * Uses real hub product imagery (not storefront lifestyle demos) and honest plan gates.
 */
'use client';

import Link from 'next/link';
import Image from '@/components/marketing/ui/MarketingImage';
import {
  ArrowRight,
  Boxes,
  FileSpreadsheet,
  LayoutGrid,
  Package,
  ScanBarcode,
  Warehouse,
} from 'lucide-react';
import { MarketingSection } from '@/components/marketing/layout/MarketingSection';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION_HEADING,
} from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  CAPABILITY_STATUS_LABEL,
  CAPABILITY_STATUS_STYLE,
} from '@/lib/marketing/capabilities';
import { TENVO_IMG } from '@/lib/marketing/tenvoMarketingImages';

const CAPABILITIES = [
  {
    icon: LayoutGrid,
    title: 'Visual, Busy, and Excel entry',
    body: 'Three inventory modes share the same columns, field mapping, and save path. Zoho/Busy-style datalist suggestions and smart row defaults speed catalog work without per-mode forks.',
    status: 'shipped',
  },
  {
    icon: Warehouse,
    title: 'Locations and display stock',
    body: 'Sellable stock resolves from product stock locations first, then batch or variant totals, then headline stock. POS, hub, and storefront read the same picture.',
    status: 'shipped',
  },
  {
    icon: Package,
    title: 'Domain-aware product fields',
    body: '62+ vertical presets add domain_data columns (batch, serial, expiry, article/design, fitment, and more) through shared inventory domain features, not one-off grids.',
    status: 'shipped',
  },
  {
    icon: ScanBarcode,
    title: 'Barcode and camera scan',
    body: 'SKU/barcode lookup with GS1/UPC normalization and shared camera scanner on supported plans (Starter+ barcode_scanning). Works across hub inventory and POS tills.',
    status: 'shipped',
  },
  {
    icon: FileSpreadsheet,
    title: 'Excel import and product images',
    body: 'Spreadsheet import with validation, up to three product images on variant-capable domains, and client-side WebP optimization on upload.',
    status: 'shipped',
  },
  {
    icon: Boxes,
    title: 'Multi-warehouse, batch, serial',
    body: 'Transfers, multi-location limits, batch/expiry, and serial tracking unlock on Professional+ when the plan and domain enable them. Manufacturing BOM reservations use the same InventoryService path.',
    status: 'partial',
  },
];

const PROOF = [
  {
    title: 'Hub inventory ecosystem',
    body: 'Desktop inventory with phone stock list and counter hardware in one operating picture. Stock writes go through InventoryService so locations, movements, and headline stock stay aligned.',
    help: 'Available on Free for core catalog and stock. Raise warehouses, batch, and serial on Professional+.',
    image: TENVO_IMG.inventoryEcosystem,
    imageAlt: 'TENVO inventory hub with phone stock list and POS hardware',
    object: 'object-contain',
    importance: 'Day-one ops',
  },
  {
    title: 'Mobile stock on the floor',
    body: 'True phone inventory list so floor staff check quantities without a desktop. Hub mobile tiles keep Visual/Busy entry reachable below lg breakpoints.',
    help: 'Same business_id tenant scope as desktop. No separate mobile inventory app required.',
    image: TENVO_IMG.mobileStock,
    imageAlt: 'TENVO mobile inventory stock list',
    object: 'object-contain',
    importance: 'Floor productivity',
  },
  {
    title: 'Excel and Busy-style data entry',
    body: 'Spreadsheet-style grids for operators who live in Busy or Excel. Shared field mapping and compact save feedback keep catalogs moving without a full reload after every commit.',
    help: 'Import and grid edits both land on the integrated product upsert path used by Visual mode.',
    image: TENVO_IMG.excelEntry,
    imageAlt: 'TENVO Excel-style inventory data entry',
    object: 'object-contain',
    importance: 'Catalog speed',
  },
];

const AUDIENCE = [
  {
    title: 'Small shops',
    body: 'One location, barcode till, Excel import, and a catalog that already powers your branded storefront. Free covers core inventory; Starter adds barcode scanning for counter velocity.',
  },
  {
    title: 'Growing multi-branch operators',
    body: 'Professional+ unlocks multi-warehouse, transfers, batch/serial, and higher limits. Low-stock alerts and smart restock signals use domain intelligence (seasonality, perishability) when configured.',
  },
];

function statusPill(status) {
  const label = CAPABILITY_STATUS_LABEL[status] || CAPABILITY_STATUS_LABEL.shipped;
  const style = CAPABILITY_STATUS_STYLE[status] || CAPABILITY_STATUS_STYLE.shipped;
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', style)}>
      {label}
    </span>
  );
}

export default function FeaturesInventorySection() {
  return (
    <MarketingSection
      id="inventory"
      padding="default"
      className="scroll-mt-28 border-b border-neutral-200/80 bg-neutral-50"
    >
      <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12 lg:mb-14">
        <p className={cn(MARKETING_EYEBROW, 'mb-3')}>Inventory Engine</p>
        <h2 className={MARKETING_SECTION_HEADING}>
          Stock that POS, storefront, and finance can trust
        </h2>
        <p className={cn(MARKETING_LEAD, 'mt-4')}>
          One catalog, location-aware display stock, and domain fields for how you actually sell. Not a
          storefront demo photo pretending to be a warehouse system.
        </p>
      </div>

      <div className="mb-10 grid gap-5 md:grid-cols-2 lg:mb-14">
        {AUDIENCE.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-sky-100/90 bg-gradient-to-br from-sky-50/50 via-white to-white p-5 shadow-sm sm:rounded-3xl sm:p-6"
          >
            <h3 className="text-lg font-semibold text-neutral-900">{item.title}</h3>
            <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-600">{item.body}</p>
          </article>
        ))}
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:mb-14 lg:grid-cols-3">
        {CAPABILITIES.map(({ icon: Icon, title, body, status }) => (
          <article
            key={title}
            className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-neutral-50/40 p-5 shadow-sm sm:p-6"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              {statusPill(status)}
            </div>
            <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
            <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-neutral-600">{body}</p>
          </article>
        ))}
      </div>

      <div className="mb-8 text-center sm:mb-10">
        <p className={cn(MARKETING_EYEBROW, 'mb-3')}>Product proof</p>
        <h3 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          Real hub screens, not stock photography
        </h3>
        <p className={cn(MARKETING_LEAD, 'mx-auto mt-3 max-w-2xl')}>
          Imagery from `/tenvo-img` product captures used across marketing. Multi-warehouse and
          batch/serial stay labeled Partial where plan or domain gates apply.
        </p>
      </div>

      <div className="space-y-8 lg:space-y-12">
        {PROOF.map((feature, idx) => {
          const reverse = idx % 2 === 1;
          return (
            <article
              key={feature.title}
              className={cn(
                'grid items-center gap-6 overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50/50 p-5 shadow-sm sm:p-6 lg:grid-cols-2 lg:gap-10 lg:p-8',
                reverse && 'lg:[&>*:first-child]:order-2'
              )}
            >
              <div className="space-y-3">
                <span className="inline-flex rounded-full bg-sky-600/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
                  {feature.importance}
                </span>
                <h3 className="text-xl font-semibold text-neutral-900 sm:text-2xl">{feature.title}</h3>
                <p className="text-sm font-medium leading-relaxed text-neutral-600 sm:text-base">
                  {feature.body}
                </p>
                <p className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-sky-950/80">
                  {feature.help}
                </p>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                <Image
                  src={feature.image}
                  alt={feature.imageAlt}
                  fill
                  className={cn(feature.object, 'object-top')}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </article>
          );
        })}
      </div>

      <div className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-3 sm:mt-12 sm:flex-row sm:justify-center">
        <Button asChild size="lg" className="h-12 rounded-full font-semibold">
          <Link href="/register">
            Start with inventory
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-12 rounded-full font-semibold">
          <Link href="/pricing">See plan limits</Link>
        </Button>
        <Button asChild variant="ghost" size="lg" className="h-12 rounded-full font-semibold">
          <Link href="/features#manufacturing">Manufacturing & BOM</Link>
        </Button>
      </div>
    </MarketingSection>
  );
}
