'use client';

import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import Hero from '@/components/marketing/sections/Hero';
import CaseStudyCard from '@/components/marketing/cards/CaseStudyCard';
import CTASection from '@/components/marketing/sections/CTASection';
import { caseStudies } from '@/lib/marketing/case-studies';
import { useState } from 'react';

export default function CaseStudiesPage() {
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique industries
  const industries = ['all', ...new Set(caseStudies.map(cs => cs.industry))];

  // Filter case studies
  const filteredCaseStudies = caseStudies.filter(caseStudy => {
    const matchesIndustry = selectedIndustry === 'all' || caseStudy.industry === selectedIndustry;
    const matchesSearch = searchQuery === '' || 
      caseStudy.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseStudy.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesIndustry && matchesSearch;
  });

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <Hero 
        variant="centered"
        badge="Success Stories"
        title={
          <>
            Real Results from <br />
            <span className="text-wine-600">Real Businesses</span>
          </>
        }
        subtitle="See how businesses across Pakistan are transforming their operations with TENVO. From small startups to large enterprises, discover their success stories."
        primaryCTA={{
          text: 'Start Your Story',
          href: '/register'
        }}
        secondaryCTA={{
          text: 'Schedule Demo',
          href: '/demo'
        }}
      />

      {/* Filters and Search */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 mb-12">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search case studies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
              />
            </div>

            {/* Industry Filter */}
            <div className="md:w-64">
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500"
              >
                {industries.map(industry => (
                  <option key={industry} value={industry}>
                    {industry === 'all' ? 'All Industries' : industry}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-8">
            <p className="text-gray-600">
              Showing {filteredCaseStudies.length} of {caseStudies.length} case studies
            </p>
          </div>

          {/* Case Studies Grid */}
          {filteredCaseStudies.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCaseStudies.map((caseStudy) => (
                <CaseStudyCard key={caseStudy.slug} caseStudy={caseStudy} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">
                No case studies found matching your criteria.
              </p>
              <button
                onClick={() => {
                  setSelectedIndustry('all');
                  setSearchQuery('');
                }}
                className="mt-4 text-wine-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Impact Across Industries
            </h2>
            <p className="text-gray-600">
              Aggregate results from our customers
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-wine-600 mb-2">70%</div>
              <div className="text-gray-600">Average Cost Reduction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-wine-600 mb-2">50%</div>
              <div className="text-gray-600">Time Saved on Operations</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-wine-600 mb-2">95%</div>
              <div className="text-gray-600">Customer Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-wine-600 mb-2">3x</div>
              <div className="text-gray-600">ROI in First Year</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection 
        variant="centered"
        title={
          <>
            Ready to Write Your <br />
            Success Story?
          </>
        }
        subtitle="Join thousands of businesses already transforming their operations with TENVO"
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
