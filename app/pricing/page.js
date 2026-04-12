'use client';

import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import Hero from '@/components/marketing/sections/Hero';
import PricingSection from '@/components/marketing/sections/PricingSection';
import FAQSection from '@/components/marketing/sections/FAQSection';
import CTASection from '@/components/marketing/sections/CTASection';

export default function PricingPage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <Hero 
        variant="centered"
        badge="Transparent Pricing"
        title={
          <>
            Royal-Blue Clarity <br />
            <span className="text-amber-300">for Every Stage</span>
          </>
        }
        subtitle="Choose the plan that fits your business without hidden tooling costs, fragmented modules, or surprise upgrade pressure."
        primaryCTA={{
          text: 'Start Free Trial',
          href: '/register'
        }}
        secondaryCTA={{
          text: 'Talk to Sales',
          href: '/contact'
        }}
      />

      {/* Pricing Section */}
      <PricingSection 
        showComparison={true}
        showAnnualToggle={true}
      />

      {/* Value Proposition */}
      <section className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-[11px] font-black text-wine-600 uppercase tracking-[0.3em]">Why TENVO</h2>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">More Value, Less Cost</h3>
            <p className="text-lg text-gray-500 font-medium">
              Compare what you get with TENVO vs traditional ERP systems
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6 rounded-[2rem] border border-slate-200 bg-white/82 p-8 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.32)] backdrop-blur-xl">
              <h4 className="text-2xl font-black text-gray-900">Traditional ERP</h4>
              <ul className="space-y-4">
                <ComparisonItem negative>High upfront costs (PKR 500k+)</ComparisonItem>
                <ComparisonItem negative>Long implementation (6-12 months)</ComparisonItem>
                <ComparisonItem negative>Complex customization required</ComparisonItem>
                <ComparisonItem negative>Expensive maintenance contracts</ComparisonItem>
                <ComparisonItem negative>Limited support hours</ComparisonItem>
                <ComparisonItem negative>Outdated user interface</ComparisonItem>
              </ul>
            </div>
            <div className="space-y-6 rounded-[2rem] border border-wine/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(238,244,255,0.9))] p-8 shadow-[0_24px_60px_-40px_rgba(47,91,255,0.32)]">
              <h4 className="text-2xl font-black text-wine-600">TENVO</h4>
              <ul className="space-y-4">
                <ComparisonItem positive>Start free, scale as you grow</ComparisonItem>
                <ComparisonItem positive>Go live in days, not months</ComparisonItem>
                <ComparisonItem positive>Pre-configured for your industry</ComparisonItem>
                <ComparisonItem positive>All updates included</ComparisonItem>
                <ComparisonItem positive>24/7 support on all plans</ComparisonItem>
                <ComparisonItem positive>Modern, intuitive interface</ComparisonItem>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-24 bg-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,251,255,0.96))] border border-slate-200 rounded-[2rem] p-12 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.35)]">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-black text-gray-900 mb-4">Calculate Your Savings</h3>
              <p className="text-gray-500 font-medium">See how much you can save by switching to TENVO</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-4xl font-black text-wine-600 mb-2">70%</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Cost Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-wine-600 mb-2">10x</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Faster Setup</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-wine-600 mb-2">50%</div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Time Saved</div>
              </div>
            </div>

            <div className="text-center">
              <a 
                href="/register" 
                className="inline-flex items-center justify-center px-8 py-4 bg-wine-600 hover:bg-wine-700 text-white font-black rounded-2xl transition-all shadow-[0_18px_44px_-20px_rgba(47,91,255,0.6)]"
              >
                Start Saving Today
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection 
        title="Pricing FAQs"
        subtitle="Common questions about our pricing and plans"
      />

      {/* CTA Section */}
      <CTASection 
        variant="split"
        title="Ready to Get Started?"
        subtitle="Start your free trial today. No credit card required."
        primaryCTA={{
          text: 'Start Free Trial',
          href: '/register'
        }}
        secondaryCTA={{
          text: 'Contact Sales',
          href: '/contact'
        }}
      />
    </MarketingLayout>
  );
}

function ComparisonItem({ children, positive, negative }) {
  return (
    <li className="flex items-start gap-3">
      {positive && (
        <svg className="w-6 h-6 text-wine-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )}
      {negative && (
        <svg className="w-6 h-6 text-gray-300 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )}
      <span className={`text-base font-medium ${positive ? 'text-gray-700' : 'text-gray-400'}`}>
        {children}
      </span>
    </li>
  );
}
