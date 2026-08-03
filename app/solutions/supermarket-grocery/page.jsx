'use client';

import {
  ShoppingBasket,
  BarChart3,
  Truck,
  Scale,
  Tag,
  Users,
} from 'lucide-react';
import SolutionPageTemplate from '@/components/marketing/sections/SolutionPageTemplate';
import { getDemoStoreHeroByDomain } from '@/lib/marketing/demoStoreGalleryMeta';
import { PLAN_TIERS } from '@/lib/config/plans';
import { formatCurrency } from '@/lib/currency';

const HERO_IMAGE = getDemoStoreHeroByDomain('demo-supermarket');
const professional = PLAN_TIERS.professional;

export default function SupermarketGroceryPage() {
  return (
    <SolutionPageTemplate
      badge="Supermarket & Grocery"
      title={
        <>
          Supermarket operations <br />
          <span className="text-brand-primary">from receiving to checkout</span>
        </>
      }
      subtitle="Weight-aware POS, perishable-aware inventory, promotions, and an elevated public store on one hub. Honest scope: not a separate Industry Plan SKU yet. Start from Free/Starter POS or Professional for multi-location depth."
      heroImage={HERO_IMAGE}
      heroImageAlt="Supermarket inventory and POS system"
      includeTestimonials={false}
      problemStatement="Grocery stores need high-velocity checkout and perishable discipline"
      painPoints={[
        'Thousands of SKUs with mixed shelf lives and daily receiving',
        'Weight-based pricing for fresh produce and bulk lines',
        'Promotions and loyalty that must hit the same till as barcode sales',
        'Stock-outs and wastage when FEFO and low-stock signals are missing',
        'Multi-supplier deliveries without a clean purchase/receive path',
        'Online grocery orders that disagree with counter stock',
      ]}
      solutionTitle="Retail OS tuned for grocery velocity"
      solutionDescription="TENVO SuperStore POS handles barcode and weight-aware lines, hub inventory covers batch/expiry where enabled, and the supermarket elevated storefront shares the same catalog. Loyalty and campaigns attach on supported plans. Live FBR IRIS filing remains Roadmap."
      features={[
        {
          icon: Scale,
          title: 'Weight-aware lines',
          description:
            'Per-kg style selling for fresh and bulk items in SuperStore POS. Pair with barcode for packaged SKUs on the same till.',
        },
        {
          icon: ShoppingBasket,
          title: 'Rapid checkout POS',
          description:
            'Barcode lookup, product imagery, hold sales, and thermal receipts. Camera scan on plan gate via shared PosCameraScanner.',
        },
        {
          icon: Tag,
          title: 'Promotions & loyalty',
          description:
            'Promotions and loyalty programs wired to POS and invoices on Professional+ (not a disconnected coupon app).',
        },
        {
          icon: BarChart3,
          title: 'Perishable awareness',
          description:
            'Batch and near-expiry workflows where domain inventory features enable them. FEFO-friendly for chill and fresh categories.',
        },
        {
          icon: Truck,
          title: 'Purchasing & receiving',
          description:
            'Purchase orders and receiving documentation in the hub so daily supplier drops land against real stock.',
        },
        {
          icon: Users,
          title: 'Elevated grocery store',
          description:
            'Public supermarket storefront with category drawer chrome and hub order fulfilment. Open demo-supermarket to preview.',
        },
      ]}
      demoStoreName="Supermarket"
      demoStoreUrl="/store/demo-supermarket"
      demoStoreDescription="Browse the grocery demo storefront with live-style catalog rails. Confirm exact plan limits on Pricing."
      recommendedPlan={{
        name: professional?.name || 'Professional',
        tagline: 'Strong fit for multi-SKU grocery with loyalty and finance depth',
        price: formatCurrency(professional?.price_pkr || 0, 'PKR'),
        description:
          'Free and Starter cover core POS and inventory for smaller starts. Professional adds the depth most supermarket operators want before Enterprise custom limits.',
      }}
      planFeatures={[
        'Weight-aware and barcode POS (SuperStore)',
        'Elevated supermarket storefront + order hub',
        'Promotions and loyalty on supported tiers',
        'Batch / expiry awareness where enabled',
        'Purchase orders and receiving',
        'Multi-warehouse on Professional+',
        'Offline POS Phase 1 on plan gate',
        'Tax summaries (Partial; live FBR IRIS is Roadmap)',
      ]}
      successMetrics={[
        { value: '1 hub', label: 'Counter + online stock' },
        { value: 'kg + scan', label: 'Fresh and pack dairy/produce' },
        { value: 'Partial', label: 'Tax depth (honest label)' },
        { value: 'demo', label: 'Live storefront preview' },
      ]}
    />
  );
}
