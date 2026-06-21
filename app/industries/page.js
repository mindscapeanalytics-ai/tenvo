'use client';

import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { VERTICAL_COUNT } from '@/lib/marketing/capabilities';
import { MARKETING_CONTAINER } from '@/lib/utils/marketingLayout';
import Hero from '@/components/marketing/sections/Hero';
import DomainShowcase from '@/components/marketing/sections/DomainShowcase';
import TestimonialsSection from '@/components/marketing/sections/TestimonialsSection';
import CTASection from '@/components/marketing/sections/CTASection';

export default function IndustriesPage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <Hero 
        variant="centered"
        badge={`${VERTICAL_COUNT} Industry Verticals`}
        title={
          <>
            Industry presets for <br />
            <span className="text-brand-primary">real operations</span>
          </>
        }
        subtitle="Each vertical configures dashboards, units, seed templates, and intelligence defaults — not a separate product fork. Pick your category at registration and refine in the hub."
        primaryCTA={{
          text: 'Find Your Industry',
          href: '#domains'
        }}
        secondaryCTA={{
          text: 'Schedule Demo',
          href: '/demo'
        }}
      />

      {/* Domain Showcase - Full List */}
      <div id="domains">
        <DomainShowcase 
          title="All Industry Verticals"
          subtitle="Choose your industry to see pre-configured features, workflows, and compliance rules"
          showAll={true}
          ctaText="Get Started"
          ctaHref="/register"
        />
      </div>

      {/* Industry Benefits */}
      <section className="bg-transparent py-10 sm:py-16 lg:py-24">
        <div className={MARKETING_CONTAINER}>
          <div className="mx-auto mb-8 max-w-3xl space-y-3 text-center sm:mb-12 lg:mb-16 sm:space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.22em] text-brand-primary sm:text-[11px] sm:tracking-[0.3em]">Industry-Specific Benefits</h2>
            <h3 className="text-2xl font-black tracking-tighter text-gray-900 sm:text-3xl md:text-4xl lg:text-5xl">Why Industry Specialization Matters</h3>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 sm:gap-6 md:gap-8">
            <BenefitCard
              title="Pre-configured defaults"
              description="Start with vertical-aware units, sample products, and dashboard layouts tuned to your category."
              icon="⚙️"
            />
            <BenefitCard
              title="Tax & compliance context"
              description="Pakistan-first tax configuration and regional standards — with honest scope on live FBR filing (roadmap)."
              icon="✓"
            />
            <BenefitCard
              title="Faster onboarding"
              description="Register, import from Excel, and open your hub in days — not a six-month IT project."
              icon="⚡"
            />
            <BenefitCard
              title="Industry Terminology"
              description="Use the language of your industry. Labels, reports, and workflows use familiar terms."
              icon="💬"
            />
            <BenefitCard
              title="Best Practice Reports"
              description="Industry-standard reports and KPIs are ready to use out of the box."
              icon="📊"
            />
            <BenefitCard
              title="Continuous Updates"
              description="Stay current with industry changes. We update compliance rules and best practices regularly."
              icon="🔄"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection 
        variant="grid"
        title="Success Stories Across Industries"
        subtitle="See how businesses in different sectors are thriving with TENVO"
      />

      {/* CTA Section */}
      <CTASection 
        variant="centered"
        title="Ready to Get Started?"
        subtitle="Choose your industry and start your free trial today. No credit card required."
        primaryCTA={{
          text: 'Start Free Trial',
          href: '/register'
        }}
        secondaryCTA={{
          text: 'Talk to Sales',
          href: '/contact'
        }}
      />
    </MarketingLayout>
  );
}

function BenefitCard({ title, description, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(15,23,42,0.08)] sm:rounded-3xl sm:p-6 lg:p-8">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-xl text-brand-primary sm:mb-4 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-2xl">{icon}</div>
      <h4 className="mb-2 text-lg font-black text-gray-900 sm:mb-3 sm:text-xl">{title}</h4>
      <p className="text-gray-500 font-medium leading-relaxed">{description}</p>
    </div>
  );
}
