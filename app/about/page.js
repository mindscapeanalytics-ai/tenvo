'use client';

import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import Hero from '@/components/marketing/sections/Hero';
import StatsBar from '@/components/marketing/sections/StatsBar';
import CTASection from '@/components/marketing/sections/CTASection';
import { Building2, Users, Globe, Award, Heart, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <Hero 
        variant="centered"
        badge="About TENVO"
        title={
          <>
            Building the Future of <br />
            <span className="text-wine-600">Enterprise Software</span>
          </>
        }
        subtitle="We're on a mission to make enterprise-grade business management accessible to every Pakistani business, regardless of size or industry."
        primaryCTA={{
          text: 'Join Our Team',
          href: '#careers'
        }}
        secondaryCTA={{
          text: 'Contact Us',
          href: '/contact'
        }}
      />

      {/* Stats */}
      <StatsBar 
        variant="default"
        stats={[
          { value: '450k+', label: 'Active Users' },
          { value: '55+', label: 'Industries Served' },
          { value: '99.9%', label: 'Uptime SLA' },
          { value: '24/7', label: 'Support' }
        ]}
      />

      {/* Mission & Vision */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-[11px] font-black text-wine-600 uppercase tracking-[0.3em] mb-4">Our Mission</h2>
              <h3 className="text-4xl font-black text-gray-900 mb-6">Empowering Pakistani Businesses</h3>
              <p className="text-lg text-gray-500 font-medium leading-relaxed mb-6">
                We believe every business deserves access to world-class enterprise software. TENVO was built from the ground up to address the unique challenges of Pakistani businesses - from FBR compliance to multi-currency operations.
              </p>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
                Our mission is to level the playing field, giving small and medium businesses the same powerful tools that large enterprises use, at a fraction of the cost.
              </p>
            </div>
            <div>
              <h2 className="text-[11px] font-black text-wine-600 uppercase tracking-[0.3em] mb-4">Our Vision</h2>
              <h3 className="text-4xl font-black text-gray-900 mb-6">The Operating System for Business</h3>
              <p className="text-lg text-gray-500 font-medium leading-relaxed mb-6">
                We envision a future where every business in Pakistan runs on TENVO - a unified platform that connects inventory, finance, operations, and compliance into one seamless experience.
              </p>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
                By 2030, we aim to be the backbone of Pakistan's digital economy, powering millions of businesses and creating thousands of jobs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-[11px] font-black text-wine-600 uppercase tracking-[0.3em]">Our Values</h2>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">What Drives Us</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ValueCard
              icon={<Heart className="w-8 h-8" />}
              title="Customer First"
              description="Every decision we make starts with our customers. Their success is our success."
            />
            <ValueCard
              icon={<Zap className="w-8 h-8" />}
              title="Innovation"
              description="We constantly push boundaries to deliver cutting-edge solutions that solve real problems."
            />
            <ValueCard
              icon={<Users className="w-8 h-8" />}
              title="Collaboration"
              description="We believe in the power of teamwork and building strong partnerships with our customers."
            />
            <ValueCard
              icon={<Award className="w-8 h-8" />}
              title="Excellence"
              description="We set high standards and never compromise on quality, security, or reliability."
            />
            <ValueCard
              icon={<Globe className="w-8 h-8" />}
              title="Accessibility"
              description="Enterprise software should be accessible to everyone, not just large corporations."
            />
            <ValueCard
              icon={<Building2 className="w-8 h-8" />}
              title="Local Focus"
              description="Built for Pakistan, with deep understanding of local business needs and regulations."
            />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="careers" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-[11px] font-black text-wine-600 uppercase tracking-[0.3em]">Join Our Team</h2>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Build the Future with Us</h3>
            <p className="text-lg text-gray-500 font-medium">
              We're always looking for talented individuals who share our passion for empowering businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="text-4xl font-black text-wine-600 mb-2">50+</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Team Members</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="text-4xl font-black text-wine-600 mb-2">Remote</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Work Culture</div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="text-4xl font-black text-wine-600 mb-2">Growing</div>
              <div className="text-sm font-bold text-gray-500 uppercase tracking-wider">Always Hiring</div>
            </div>
          </div>

          <div className="text-center">
            <a 
              href="/contact" 
              className="inline-flex items-center justify-center px-8 py-4 bg-wine-600 hover:bg-wine-700 text-white font-black rounded-2xl transition-all"
            >
              View Open Positions
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection 
        variant="centered"
        title="Ready to Transform Your Business?"
        subtitle="Join thousands of businesses already using TENVO to streamline their operations."
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

function ValueCard({ icon, title, description }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-all duration-300">
      <div className="text-wine-600 mb-4">{icon}</div>
      <h4 className="text-xl font-black text-gray-900 mb-3">{title}</h4>
      <p className="text-gray-500 font-medium leading-relaxed">{description}</p>
    </div>
  );
}
