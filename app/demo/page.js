'use client';

import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { MARKETING_CONTAINER } from '@/lib/utils/marketingLayout';
import Hero from '@/components/marketing/sections/Hero';
import { DemoRequestForm } from '@/components/marketing/forms/DemoRequestForm';
import TestimonialsSection from '@/components/marketing/sections/TestimonialsSection';
import { TrustBadges } from '@/components/marketing/ui/TrustBadges';
import { CheckCircle } from 'lucide-react';

export default function DemoPage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <Hero 
        variant="centered"
        badge="Schedule a Demo"
        title={
          <>
            See TENVO in <br />
            <span className="text-brand-primary">Action</span>
          </>
        }
        subtitle="Get a personalized demo tailored to your industry and business needs. See how TENVO can transform your operations."
        primaryCTA={{
          text: 'Request Demo',
          href: '#demo-form'
        }}
        secondaryCTA={{
          text: 'View Features',
          href: '/features'
        }}
      />

      {/* Demo Form and Benefits */}
      <section id="demo-form" className="bg-white py-10 sm:py-14 lg:py-16">
        <div className={MARKETING_CONTAINER}>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="min-w-0">
              <h2 className="mb-3 text-2xl font-bold text-gray-900 sm:mb-4 sm:text-3xl">
                Request Your Demo
              </h2>
              <p className="mb-6 text-sm font-medium leading-relaxed text-gray-600 sm:mb-8 sm:text-base">
                Fill out the form and our team will contact you within 24 hours to schedule your personalized demo.
              </p>
              <DemoRequestForm />
            </div>

            <div className="min-w-0 space-y-6 sm:space-y-8">
              <div>
                <h2 className="mb-3 text-2xl font-bold text-gray-900 sm:mb-4 sm:text-3xl">
                  What to Expect
                </h2>
                <p className="text-sm font-medium text-gray-600 sm:text-base">
                  Your demo will be customized to your specific needs
                </p>
              </div>

              <div className="space-y-4">
                <BenefitItem text="30-minute personalized walkthrough" />
                <BenefitItem text="Industry-specific use cases and examples" />
                <BenefitItem text="Live Q&A with our product experts" />
                <BenefitItem text="Custom pricing based on your requirements" />
                <BenefitItem text="Implementation timeline and support options" />
                <BenefitItem text="Free trial access after the demo" />
              </div>

              {/* Trust Badges */}
              <div className="pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  Trusted &amp; Compliant
                </h3>
                <TrustBadges variant="vertical" />
              </div>

              {/* Stats */}
              <div className="mt-6 rounded-2xl border border-gray-200/80 bg-gray-50 p-6 sm:p-7">
                <h3 className="text-xl font-bold text-gray-900 mb-5">
                  Join Thousands of Businesses
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <div className="text-3xl font-bold text-brand-primary mb-1">450k+</div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-brand-primary mb-1">55+</div>
                    <div className="text-sm text-gray-600">Industries</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-brand-primary mb-1">99.9%</div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-brand-primary mb-1">24/7</div>
                    <div className="text-sm text-gray-600">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-10 sm:py-14 lg:py-16">
        <TestimonialsSection 
          variant="grid"
          title="What Our Customers Say"
          subtitle="See why businesses trust TENVO for their operations"
        />
      </section>

      {/* FAQ */}
      <section className="bg-white py-10 sm:py-14 lg:py-16">
        <div className={`${MARKETING_CONTAINER} max-w-4xl`}>
          <div className="mb-8 space-y-3 text-center sm:mb-10 sm:space-y-4 lg:mb-12">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Demo FAQs
            </h2>
            <p className="text-sm text-gray-600 sm:text-base">
              Common questions about our demo process
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <FAQItem
              question="How long does the demo take?"
              answer="Our standard demo is 30 minutes, but we can adjust based on your needs. We'll cover the features most relevant to your industry and answer all your questions."
            />
            <FAQItem
              question="Is the demo really free?"
              answer="Yes, absolutely! There's no cost or obligation. We want you to see how TENVO can help your business before making any commitment."
            />
            <FAQItem
              question="Can I try TENVO after the demo?"
              answer="Yes! After the demo, we'll provide you with free trial access so you can explore TENVO at your own pace."
            />
            <FAQItem
              question="What should I prepare for the demo?"
              answer="Just come with your questions! It helps if you can share some details about your current processes and pain points, but it's not required."
            />
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

function BenefitItem({ text }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle className="w-6 h-6 text-brand-primary flex-shrink-0 mt-0.5" />
      <span className="text-gray-700 font-medium">{text}</span>
    </div>
  );
}

function FAQItem({ question, answer }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4 sm:p-6">
      <h3 className="mb-2 text-base font-bold text-gray-900 sm:text-lg">{question}</h3>
      <p className="text-sm leading-relaxed text-gray-600">{answer}</p>
    </div>
  );
}
