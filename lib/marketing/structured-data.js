/**
 * Structured Data (JSON-LD) for SEO
 * Following 2026 Schema.org best practices
 */

import { getSiteUrl } from '@/lib/marketing/site-url';
import { TENVO_PARENT_COMPANY } from '@/lib/marketing/tenvo-assistant-knowledge';

/** US display phone → ITU-T style for JSON-LD (keep in sync with TENVO_PARENT_COMPANY.phone) */
const parentTelephone = (() => {
  const d = TENVO_PARENT_COMPANY.phone.replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('1')) {
    return `+1-${d.slice(1, 4)}-${d.slice(4, 7)}-${d.slice(7)}`;
  }
  return TENVO_PARENT_COMPANY.phone.replace(/\s/g, '');
})();

/**
 * Get Organization schema
 * @returns {Object} Organization JSON-LD
 */
export function getOrganizationSchema() {
  const site = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TENVO',
    url: site,
    logo: `${site}/industrial_hero_image.png`,
    description:
      'TENVO is business operations software: inventory, warehouses, POS, branded storefront, orders, and accounting in one platform. Deep Pakistan fit at launch (FBR-aware positioning, Urdu, local payments); scaling globally. Parent: Mindscape Analytics LLC (Sheridan, WY, USA).',
    parentOrganization: {
      '@type': 'Organization',
      name: TENVO_PARENT_COMPANY.name,
      url: TENVO_PARENT_COMPANY.website,
      telephone: parentTelephone,
      email: TENVO_PARENT_COMPANY.email,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Sheridan',
        addressRegion: 'WY',
        addressCountry: 'US',
      },
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'PK',
      addressLocality: 'Karachi',
      addressRegion: 'Sindh',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${site}/contact`,
        areaServed: ['PK', 'US', 'Worldwide'],
        availableLanguage: ['en', 'ur'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        url: `${site}/demo`,
        areaServed: ['PK', 'AE', 'SA', 'IN', 'US', 'Worldwide'],
        availableLanguage: ['en'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'corporate',
        url: TENVO_PARENT_COMPANY.contactPage,
        email: TENVO_PARENT_COMPANY.email,
        telephone: parentTelephone,
        areaServed: 'Worldwide',
      },
    ],
    foundingDate: '2023',
  };
}

/**
 * Get Software Application schema
 * @returns {Object} SoftwareApplication JSON-LD
 */
export function getSoftwareApplicationSchema() {
  const site = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'TENVO',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: site,
    description:
      'Inventory, POS, branded storefront, orders, accounting, and compliance-oriented workflows in one platform. Pakistan-first launch depth; global product roadmap.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'PKR',
      description: 'Free trial available; paid tiers on the pricing page.',
      url: `${site}/pricing`,
    },
    featureList: [
      'Multi-warehouse inventory',
      'POS and hospitality workflows',
      'Branded online storefront',
      'Order fulfilment and courier integrations',
      'Accounting and compliance-oriented reporting',
      'Urdu-friendly UI positioning for local teams',
    ],
    provider: {
      '@type': 'Organization',
      name: TENVO_PARENT_COMPANY.name,
      url: TENVO_PARENT_COMPANY.website,
    },
  };
}

/**
 * Get FAQ schema
 * @param {Array} faqs - Array of FAQ objects
 * @returns {Object} FAQPage JSON-LD
 */
export function getFAQSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Get Article schema (for case studies/blog posts)
 * @param {Object} article - Article data
 * @returns {Object} Article JSON-LD
 */
export function getArticleSchema(article) {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.summary,
    "image": article.heroImage,
    "datePublished": article.publishedDate,
    "dateModified": article.modifiedDate || article.publishedDate,
    "author": {
      "@type": "Organization",
      "name": "TENVO"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TENVO",
      "logo": {
        "@type": "ImageObject",
        url: `${site}/industrial_hero_image.png`,
      }
    }
  };
}

/**
 * Get Product schema (for pricing pages)
 * @param {Object} pricingTier - Pricing tier data
 * @returns {Object} Product JSON-LD
 */
export function getProductSchema(pricingTier) {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `TENVO ${pricingTier.name} Plan`,
    "description": `TENVO ERP ${pricingTier.name} plan with ${pricingTier.features.join(', ')}`,
    "brand": {
      "@type": "Brand",
      "name": "TENVO"
    },
    "offers": {
      "@type": "Offer",
      "price": pricingTier.price.amount || "0",
      "priceCurrency": pricingTier.price.currency,
      "availability": "https://schema.org/InStock",
      url: `${site}${pricingTier.ctaHref || '/pricing'}`,
    }
  };
}

/**
 * Get BreadcrumbList schema
 * @param {Array} breadcrumbs - Array of breadcrumb objects {name, url}
 * @returns {Object} BreadcrumbList JSON-LD
 */
export function getBreadcrumbSchema(breadcrumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
}

/**
 * Render JSON-LD script tag
 * @param {Object} schema - Schema object
 * @returns {string} Script tag HTML
 */
export function renderJSONLD(schema) {
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}
