'use client';

import Link from 'next/link';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import Hero from '@/components/marketing/sections/Hero';
import FeaturesGrid from '@/components/marketing/sections/FeaturesGrid';
import OperationsFlow from '@/components/marketing/sections/OperationsFlow';
import CommerceAndIntelligenceSection from '@/components/marketing/sections/CommerceAndIntelligenceSection';
import CTASection from '@/components/marketing/sections/CTASection';
import { marketingContent } from '@/lib/marketing/content';

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <Hero 
        variant="centered"
        badge="Enterprise Capabilities"
        title={
          <>
            Everything You Need to <br />
            <span className="text-brand-primary">Run Your Business</span>
          </>
        }
        subtitle="Storefront, POS, warehouses, accounting, and Pakistan-ready compliance in one platform - so operators are not paying for a patchwork of global apps that were never designed together."
        primaryCTA={{
          text: 'Start Free Trial',
          href: '/register'
        }}
        secondaryCTA={{
          text: 'Why TENVO vs others',
          href: '/why-tenvo'
        }}
      />

      {/* Core features & operations (integrations anchor for footer deep links) */}
      <div id="integrations" className="scroll-mt-28">
        <FeaturesGrid
          variant="grid"
          title="Core ERP Capabilities"
          subtitle="Integrated modules that work together seamlessly"
          features={marketingContent.features}
        />

        <OperationsFlow />
      </div>

      <CommerceAndIntelligenceSection variant="compact" />

      {/* Advanced Features */}
      <section className="bg-white py-10 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 min-[380px]:px-5 sm:px-6 lg:px-12">
          <div className="mx-auto mb-8 max-w-3xl space-y-3 text-center sm:mb-12 sm:space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary sm:text-[11px] sm:tracking-[0.3em]">Advanced Features</h2>
            <h3 className="text-2xl font-black tracking-tighter text-gray-900 sm:text-4xl md:text-5xl">Built for Scale</h3>
            <p className="text-base font-medium text-gray-500 sm:text-lg">
              Enterprise-grade features that grow with your business
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <FeatureDetail
              id="inventory"
              title="Inventory & warehouses"
              description="Core stock control with adjustments, reservations on key flows, and multi-warehouse support on Professional+. Batch and serial tracking when your plan and domain enable them."
              features={[
                'Product catalog with images & Excel import',
                'Multi-warehouse (plan limits apply)',
                'Inter-warehouse transfers',
                'Batch & serial tracking (Professional+)',
                'Low-stock alerts & smart restock signals',
              ]}
            />
            <FeatureDetail
              id="manufacturing"
              title="Manufacturing & BOM"
              description="Bill of materials and production orders with material reservations through InventoryService. Advanced shop-floor MES features are on the roadmap."
              features={[
                'Multi-level BOM (Business+)',
                'Production / work orders',
                'Material reservation on start',
                'Manufacturing cost tracking (basic)',
                'Shop-floor scheduling (roadmap)',
              ]}
            />
            <FeatureDetail
              id="accounting"
              title="Finance & general ledger"
              description="Journal entries, chart of accounts, and finance hub with posting hooks from invoices and POS. Fiscal periods unlock on Professional+."
              features={[
                'Double-entry journal entries',
                'Chart of accounts & GL hub',
                'Fiscal periods (Professional+)',
                'Multi-currency manual rates (Business+)',
                'Bank reconciliation UI (manual)',
              ]}
            />
            <FeatureDetail
              id="compliance"
              title="Pakistan tax & compliance"
              description="Configure GST/sales tax, use Pakistani tax tools, and export audit-friendly summaries. Live FBR IRIS transmission is not yet wired — we prepare accurate records for your filing workflow."
              features={[
                'GST / sales tax configuration',
                'Provincial rate support in config',
                'Tax summaries & export-oriented reports',
                'Audit trail on financial documents',
                'FBR IRIS live sync (roadmap)',
              ]}
            />
            <FeatureDetail
              id="storefront"
              title="Branded storefront & checkout"
              description="Launch a customer-facing shop under your business domain with catalog, cart, checkout, and an order hub in the same workspace as inventory and POS."
              features={[
                'Public catalog & product pages',
                'Cart & checkout (COD + Stripe when configured)',
                'Storefront order queue in the hub',
                'Shared product catalog with POS',
                'Policies, FAQs, and contact pages',
              ]}
            />
            <FeatureDetail
              id="pos-hospitality"
              title="POS, tables & kitchen coordination"
              description="Retail POS with sessions, terminals, product images, and receipt printing. Restaurant flows and kitchen display on supported plans and domains."
              features={[
                'Retail POS checkout (Starter+)',
                'Barcode / SKU lookup at counter',
                'Restaurant table-service POS',
                'Kitchen display (Business+, KDS flag)',
                'Browser thermal receipts (not ESC/POS hardware)',
              ]}
            />
            <FeatureDetail
              id="analytics"
              title="Analytics & AI"
              description="Operational dashboards, custom report layouts, demand forecasting signals, and AI Business Analyst when your plan and AI keys are enabled."
              features={[
                'Domain dashboards & KPI portlets',
                'Report builder & standard reports',
                'Demand forecast & smart restock (Business+)',
                'AI Business Analyst chat (env + plan)',
                'Guided automation with human approval (expanding)',
              ]}
            />
          </div>
          <p className="text-center mt-12 text-sm text-gray-500 font-medium max-w-2xl mx-auto">
            See how TENVO compares to stitched storefront and suite stacks for business buyers on{' '}
            <Link href="/why-tenvo" className="text-brand-primary font-black hover:underline">Why TENVO</Link>.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection 
        variant="split"
        title="Ready to Transform Your Business?"
        subtitle="Join growing teams using TENVO to streamline inventory, sales, and finance in one workspace."
        primaryCTA={{
          text: 'Start Free Trial',
          href: '/register'
        }}
        secondaryCTA={{
          text: 'View Pricing',
          href: '/pricing'
        }}
      />
    </MarketingLayout>
  );
}

function FeatureDetail({ id, title, description, features }) {
  return (
    <div
      id={id}
      className={`rounded-3xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:shadow-xl ${id ? 'scroll-mt-28' : ''}`}
    >
      <h4 className="text-2xl font-black text-gray-900 mb-3">{title}</h4>
      <p className="text-gray-500 font-medium mb-6">{description}</p>
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <svg className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
