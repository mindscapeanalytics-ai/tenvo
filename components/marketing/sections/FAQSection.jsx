'use client';

import { useState, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Input } from '@/components/ui/input';

/**
 * FAQSection Component
 * 
 * Displays frequently asked questions in an accordion format.
 * Supports category filtering and search functionality.
 * 
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Section subtitle
 * @param {Array} props.faqs - Array of FAQ objects with id, question, answer, category
 * @param {boolean} props.showSearch - Show search functionality
 * @param {boolean} props.showCategories - Show category filters
 */
export default function FAQSection({
  title,
  subtitle,
  faqs = [],
  showSearch = true,
  showCategories = true
}) {
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(faqs.map(faq => faq.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [faqs]);

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    let filtered = faqs;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    return filtered;
  }, [faqs, searchQuery, selectedCategory]);

  // Toggle FAQ expansion
  const toggleFAQ = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <LucideIcons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg rounded-xl border-2 border-neutral-200 focus:border-wine-500"
              />
            </div>
          </div>
        )}

        {/* Category filters */}
        {showCategories && categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-wine-600 text-white shadow-lg'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All Questions
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-wine-600 text-white shadow-lg'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* FAQs accordion */}
        {filteredFAQs.length > 0 ? (
          <div className="max-w-4xl mx-auto space-y-4">
            {filteredFAQs.map((faq, index) => {
              const isExpanded = expandedId === faq.id;
              
              return (
                <div
                  key={faq.id}
                  className={`bg-neutral-50 rounded-xl border-2 border-neutral-200 hover:border-wine-300 transition-all duration-300 ${
                    mounted ? 'animate-fade-in-up' : 'opacity-0'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Question button */}
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full flex items-center justify-between gap-4 p-6 text-left"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-neutral-900 mb-1">
                        {faq.question}
                      </h3>
                      {faq.category && (
                        <span className="inline-block px-2 py-1 text-xs font-medium text-wine-700 bg-wine-50 rounded">
                          {faq.category}
                        </span>
                      )}
                    </div>
                    
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-wine-100 flex items-center justify-center transition-transform duration-300 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}>
                      <LucideIcons.ChevronDown className="w-5 h-5 text-wine-600" />
                    </div>
                  </button>

                  {/* Answer */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isExpanded ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <div className="px-6 pb-6 pt-2">
                      <p className="text-neutral-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // No results message
          <div className="text-center py-16">
            <LucideIcons.HelpCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              No FAQs found
            </h3>
            <p className="text-neutral-600 mb-6">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="px-6 py-3 bg-wine-600 text-white rounded-xl hover:bg-wine-700 transition-colors duration-300"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <p className="text-lg text-neutral-600 mb-4">
            Still have questions?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-wine-600 font-semibold hover:gap-3 transition-all duration-300"
          >
            <span>Contact our support team</span>
            <LucideIcons.ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
}
