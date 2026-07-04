'use client';

import {
  Package,
  Search,
  Truck,
  BarChart3,
  FileText,
  ShoppingCart,
} from 'lucide-react';
import SolutionPageTemplate from '@/components/marketing/sections/SolutionPageTemplate';
import { getDemoStoreHeroByDomain } from '@/lib/marketing/demoStoreGalleryMeta';

const HERO_IMAGE = getDemoStoreHeroByDomain('demo-autoparts');

export default function AutoPartsCommercePage() {
  return (
    <SolutionPageTemplate
      // Hero
      badge="Auto Parts & Accessories"
      title={
        <>
          Complete auto parts commerce <br />
          <span className="text-brand-primary">from catalog to delivery</span>
        </>
      }
      subtitle="Manage thousands of SKUs, VIN lookups, cross-references, and multi-location inventory with TENVO's auto parts-optimized platform."
      heroImage={HERO_IMAGE}
      heroImageAlt="Auto parts inventory management system"

      // Problem Statement
      problemStatement="Auto parts businesses face unique inventory challenges"
      painPoints={[
        'Thousands of SKUs with complex part numbers and cross-references',
        'Customer needs specific parts by VIN, make, model, or year',
        'Managing OEM vs aftermarket variants and supplier catalogs',
        'Multiple warehouse locations with inter-branch transfers',
        'Seasonal demand spikes and slow-moving inventory',
        'Complex pricing tiers for retail, wholesale, and workshop clients',
      ]}

      // Solution Overview
      solutionTitle="Purpose-built for auto parts distributors"
      solutionDescription="TENVO provides automotive-specific features like part number search, VIN-based compatibility lookups, multi-tier pricing, and integrated storefronts optimized for parts catalogs. Manage retail outlets, wholesale distribution, and B2B orders from one unified platform."
      solutionImage="/marketing/auto-parts-solution.jpg"
      solutionImageAlt="Auto parts inventory dashboard"

      // Key Features
      features={[
        {
          icon: Search,
          title: 'Advanced Part Search',
          description:
            'Search by part number, VIN, make/model/year, or description. Cross-reference OEM and aftermarket equivalents instantly.',
        },
        {
          icon: Package,
          title: 'Multi-Location Inventory',
          description:
            'Track stock across multiple warehouses and retail outlets. Automated inter-branch transfer requests and stock balancing.',
        },
        {
          icon: ShoppingCart,
          title: 'B2B & Retail Storefront',
          description:
            'Branded online catalog with parts finder, bulk order forms, and wholesale customer portals with custom pricing.',
        },
        {
          icon: BarChart3,
          title: 'Demand Forecasting',
          description:
            'Identify fast-moving vs slow-moving parts. Get reorder alerts based on historical sales and seasonal patterns.',
        },
        {
          icon: FileText,
          title: 'Supplier Catalog Import',
          description:
            'Bulk import supplier catalogs via Excel. Map part numbers, update costs, and sync pricing automatically.',
        },
        {
          icon: Truck,
          title: 'Local Courier Integration',
          description:
            'TCS, Leopards, and M&P tracking integration (roadmap). Print shipping labels and manage COD collections.',
        },
      ]}

      // Demo Store
      demoStoreName="Auto Parts"
      demoStoreUrl="/store/demo-autoparts"
      demoStoreDescription="Explore our fully-featured auto parts demo store with 7,600+ products, VIN-based search, and multi-tier pricing."

      // Recommended Plan
      recommendedPlan={{
        name: 'Professional',
        tagline: 'Perfect for growing auto parts distributors',
        price: 'PKR 24,500',
        description:
          'Get advanced inventory features, multi-warehouse support, and B2B capabilities needed for auto parts distribution.',
      }}
      planFeatures={[
        'Unlimited products (manage 10,000+ SKUs)',
        '5 warehouse locations with inter-branch transfers',
        'Multi-tier pricing (retail, wholesale, workshop)',
        'Batch tracking for date-sensitive items',
        'Advanced reports and demand forecasting',
        'Branded storefront with parts finder',
        'FBR GST compliance and audit trail',
        'Excel bulk import/export',
      ]}

      // Success Metrics
      successMetrics={[
        { value: '7,600+', label: 'Products in demo catalog' },
        { value: '5 mins', label: 'Average part lookup time' },
        { value: '99.8%', label: 'Stock accuracy rate' },
        { value: '40%', label: 'Faster fulfillment' },
      ]}

      includeTestimonials={true}
    />
  );
}
