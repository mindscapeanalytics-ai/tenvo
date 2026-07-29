'use client';

import {
  ChefHat,
  UtensilsCrossed,
  Receipt,
  Clock,
  Users,
  Smartphone,
} from 'lucide-react';
import SolutionPageTemplate from '@/components/marketing/sections/SolutionPageTemplate';
import { getDemoStoreHeroByDomain } from '@/lib/marketing/demoStoreGalleryMeta';
import { PLAN_TIERS } from '@/lib/config/plans';
import { formatCurrency } from '@/lib/currency';

const HERO_IMAGE = getDemoStoreHeroByDomain('demo-restaurant');
const business = PLAN_TIERS.business;

export default function RestaurantHospitalityPage() {
  return (
    <SolutionPageTemplate
      badge="Restaurant & Café · Partial depth"
      title={
        <>
          Restaurant POS with <br />
          <span className="text-brand-primary">menu, modes, and kitchen flow</span>
        </>
      }
      subtitle="Dine-in, takeaway, and delivery on one restaurant ledger with a Foodpanda-style public menu. Kitchen display is Partial on Business+. Not a separate Industry Plan SKU yet. Confirm KDS depth on a demo."
      heroImage={HERO_IMAGE}
      heroImageAlt="Restaurant POS and digital menu"
      includeTestimonials={false}
      problemStatement="Restaurants need more than a generic retail till"
      painPoints={[
        'Paper tickets get lost between front desk and kitchen',
        'Dine-in, takeaway, and delivery tracked in separate tools',
        'Online menu that does not share the kitchen queue',
        'Table number and delivery fee rules living in staff memory',
        'End-of-day reconciliation across channels takes too long',
        'Buying software that overclaims full workforce HR depth',
      ]}
      solutionTitle="Restaurant-cafe vertical on the TENVO hub"
      solutionDescription="RestaurantPOS, elevated storefront menu, sticky bag bar multi-add, and order modes that persist through checkout into restaurant_orders. KDS is Available as Partial on Business+. Attendance/shift UIs stay early. Payroll depth is Business+ with honest caveats."
      features={[
        {
          icon: ChefHat,
          title: 'Kitchen display (Partial)',
          description:
            'Kitchen display flows on Business+. Confirm prep-status depth on a demo before buying primarily for KDS.',
        },
        {
          icon: UtensilsCrossed,
          title: 'Order modes',
          description:
            'Delivery, takeaway (collection), and dine-in with table number where required. Fees recalculated server-side from Store Settings.',
        },
        {
          icon: Receipt,
          title: 'Restaurant POS',
          description:
            'Dedicated restaurant till on the restaurant_orders ledger (not generic retail POS), with receipts and open-order style kitchen flow.',
        },
        {
          icon: Clock,
          title: 'Quiet multi-add menu',
          description:
            'Public digital menu stays on-page while guests build the bag. Sticky View bag / Checkout for faster multi-item orders.',
        },
        {
          icon: Smartphone,
          title: 'Online ordering',
          description:
            'Branded elevated restaurant storefront. Orders land in the same hub fulfilment path as walk-ins.',
        },
        {
          icon: Users,
          title: 'Staff & payroll caveats',
          description:
            'Payroll runs on Business+. Attendance and shift scheduling UIs are early. Confirm HR scope on a meeting before buying for workforce depth.',
        },
      ]}
      demoStoreName="Restaurant"
      demoStoreUrl="/store/demo-restaurant"
      demoStoreDescription="Try the Roll Inn style demo menu and order modes. Use a sales walkthrough for KDS and plan fit."
      recommendedPlan={{
        name: business?.name || 'Business',
        tagline: 'Recommended when you need kitchen display and broader hospitality modules',
        price: formatCurrency(business?.price_pkr || 0, 'PKR'),
        description:
          'Professional can cover lighter cafe retail. Business is the honest tier when KDS and deeper ops matter. See Pricing for Free/Starter POS entry.',
      }}
      planFeatures={[
        'RestaurantPOS + restaurant_orders ledger',
        'Elevated digital menu and online orders',
        'Delivery / takeaway / dine-in modes',
        'Kitchen display on Business+ (Partial)',
        'Owner delivery fees from Store Settings',
        'Hub order fulfilment for online tickets',
        'Inventory shared with retail catalog where used',
        'HR/attendance: early UIs (confirm on demo)',
      ]}
      successMetrics={[
        { value: '3 modes', label: 'Dine-in · takeaway · delivery' },
        { value: '1 menu', label: 'Public + kitchen path' },
        { value: 'Partial', label: 'KDS on Business+' },
        { value: 'demo', label: 'Live menu preview' },
      ]}
    />
  );
}
