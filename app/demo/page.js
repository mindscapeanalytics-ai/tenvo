'use client';

import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
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
            <span className="text-wine-600">Action</span>
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
      <section id="demo-form" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Demo Request Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Request Your Demo
              </h2>
              <p className="text-gray-600 mb-8">
                Fill out the form and our team will contact you within 24 hours to schedule your personalized demo.
              </p>
              <DemoRequestForm />
            </div>

            {/* Demo Benefits */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  What to Expect
                </h2>
                <p className="text-gray-600 mb-8">
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
              <div className="pt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Trusted & Compliant
                </h3>
                <TrustBadges variant="vertical" />
              </div>

              {/* Stats */}
              <div className="bg-gray-50 rounded-2xl p-8 mt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Join Thousands of Businesses
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-3xl font-bold text-wine-600 mb-1">450k+</div>
                    <div className="text-sm text-gray-600">Active Users</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-wine-600 mb-1">55+</div>
                    <div className="text-sm text-gray-600">Industries</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-wine-600 mb-1">99.9%</div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-wine-600 mb-1">24/7</div>
                    <div className="text-sm text-gray-600">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <TestimonialsSection 
          variant="grid"
          title="What Our Customers Say"
          subtitle="See why businesses trust TENVO for their operations"
        />
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Demo FAQs
            </h2>
            <p className="text-gray-600">
              Common questions about our demo process
            </p>
          </div>

          <div className="space-y-6">
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
      <CheckCircle className="w-6 h-6 text-wine-600 flex-shrink-0 mt-0.5" />
      <span className="text-gray-700 font-medium">{text}</span>
    </div>
  );
}

function FAQItem({ question, answer }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  );
}
