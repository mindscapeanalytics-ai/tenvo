'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * DomainShowcase Component
 * 
 * Displays 55+ industry domains with search and category filtering.
 * Supports progressive disclosure with "Show more" functionality.
 * 
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Section subtitle
 * @param {Array} props.domains - Array of domain objects with slug, name, icon, category
 * @param {boolean} props.showSearch - Show search bar
 * @param {boolean} props.showFilters - Show category filters
 * @param {number} props.initialDisplay - Number of domains to show initially
 * @param {string} props.ctaText - CTA button text
 * @param {string} props.ctaHref - CTA button link
 */
export default function DomainShowcase({
  title,
  subtitle,
  domains = [],
  showSearch = true,
  showFilters = true,
  initialDisplay = 12,
  ctaText = "Explore All Industries",
  ctaHref = "/industries"
}) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [displayCount, setDisplayCount] = useState(initialDisplay);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Extract unique categories from domains
  const categories = useMemo(() => {
    const cats = new Set(domains.map(d => d.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [domains]);

  // Debounced search with memoization
  const filteredDomains = useMemo(() => {
    let filtered = domains;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(domain =>
        domain.name.toLowerCase().includes(query) ||
        domain.category?.toLowerCase().includes(query) ||
        domain.description?.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(domain => domain.category === selectedCategory);
    }

    return filtered;
  }, [domains, searchQuery, selectedCategory]);

  // Domains to display (with progressive disclosure)
  const displayedDomains = useMemo(() => {
    return filteredDomains.slice(0, displayCount);
  }, [filteredDomains, displayCount]);

  // Handle search input with debounce
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    setDisplayCount(initialDisplay); // Reset display count on search
  }, [initialDisplay]);

  // Handle category filter
  const handleCategoryClick = useCallback((category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
    setDisplayCount(initialDisplay); // Reset display count on filter
  }, [selectedCategory, initialDisplay]);

  // Handle show more
  const handleShowMore = useCallback(() => {
    setDisplayCount(prev => prev + 12);
  }, []);

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
                placeholder="Search industries (e.g., pharmacy, textile, restaurant)..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-12 pr-4 py-6 text-lg rounded-xl border-2 border-neutral-200 focus:border-wine-500"
              />
            </div>
          </div>
        )}

        {/* Category filters */}
        {showFilters && categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              onClick={() => handleCategoryClick(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-wine-600 text-white shadow-lg'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              All Industries
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
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

        {/* Domains grid */}
        {displayedDomains.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
              {displayedDomains.map((domain, index) => {
                const DomainIcon = domain.icon ? LucideIcons[domain.icon] : LucideIcons.Building2;
                
                return (
                  <Link
                    key={domain.slug}
                    href={`/register?domain=${domain.slug}`}
                    className={`group relative bg-white rounded-xl p-6 border-2 border-neutral-200 hover:border-wine-500 hover:shadow-lg transition-all duration-300 ${
                      mounted ? 'animate-fade-in-up' : 'opacity-0'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 bg-wine-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-wine-600 transition-colors duration-300">
                      <DomainIcon className="w-6 h-6 text-wine-600 group-hover:text-white transition-colors duration-300" />
                    </div>

                    {/* Name */}
                    <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-wine-600 transition-colors duration-300">
                      {domain.name}
                    </h3>

                    {/* Category badge */}
                    {domain.category && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium text-neutral-600 bg-neutral-100 rounded">
                        {domain.category}
                      </span>
                    )}

                    {/* Hover underline effect */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-wine-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </Link>
                );
              })}
            </div>

            {/* Show more button */}
            {displayedDomains.length < filteredDomains.length && (
              <div className="flex justify-center">
                <Button
                  onClick={handleShowMore}
                  variant="outline"
                  size="lg"
                  className="border-2 border-wine-600 text-wine-600 hover:bg-wine-600 hover:text-white px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300"
                >
                  Show More Industries
                  <LucideIcons.ChevronDown className="ml-2 w-5 h-5" />
                </Button>
              </div>
            )}

            {/* Results count */}
            <div className="text-center mt-8 text-sm text-neutral-600">
              Showing {displayedDomains.length} of {filteredDomains.length} industries
            </div>
          </>
        ) : (
          // No results message
          <div className="text-center py-16">
            <LucideIcons.Search className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              No industries found
            </h3>
            <p className="text-neutral-600 mb-6">
              Try adjusting your search or filters
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setDisplayCount(initialDisplay);
              }}
              variant="outline"
              className="border-2 border-wine-600 text-wine-600 hover:bg-wine-600 hover:text-white"
            >
              Clear Filters
            </Button>
          </div>
        )}

        {/* CTA section */}
        {ctaHref && (
          <div className="text-center mt-16 pt-16 border-t border-neutral-200">
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">
              Don't see your industry?
            </h3>
            <p className="text-lg text-neutral-600 mb-6">
              TENVO is flexible enough to work for any business. Let's talk about your specific needs.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-wine-600 hover:bg-wine-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link href={ctaHref}>
                {ctaText}
                <LucideIcons.ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
