/**
 * Structured Data (JSON-LD) for SEO
 * Following 2026 Schema.org best practices
 */

/**
 * Get Organization schema
 * @returns {Object} Organization JSON-LD
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TENVO",
    "url": "https://tenvo.com",
    "logo": "https://tenvo.com/logo.png",
    "description": "Enterprise ERP system for Pakistani businesses with FBR compliance, multi-warehouse inventory, and automated accounting",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "PK",
      "addressLocality": "Karachi",
      "addressRegion": "Sindh"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+92-XXX-XXXXXXX",
      "contactType": "Customer Service",
      "areaServed": "PK",
      "availableLanguage": ["en", "ur"]
    },
    "sameAs": [
      "https://facebook.com/tenvo",
      "https://twitter.com/tenvo",
      "https://linkedin.com/company/tenvo"
    ],
    "foundingDate": "2020",
    "numberOfEmployees": {
      "@type": "QuantitativeValue",
      "value": "100-500"
    }
  };
}

/**
 * Get Software Application schema
 * @returns {Object} SoftwareApplication JSON-LD
 */
export function getSoftwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "TENVO",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, iOS, Android",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "0",
      "highPrice": "4999",
      "priceCurrency": "PKR",
      "priceSpecification": {
        "@type": "UnitPriceSpecification",
        "price": "0",
        "priceCurrency": "PKR",
        "name": "Starter Plan"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "Inventory Management",
      "FBR Compliance",
      "Multi-warehouse Support",
      "Urdu Language Support",
      "Automated Accounting",
      "Real-time Analytics"
    ]
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
        "url": "https://tenvo.com/logo.png"
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
      "url": `https://tenvo.com${pricingTier.ctaHref}`
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
