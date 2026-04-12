/**
 * FAQ Data
 * Frequently Asked Questions
 */

export const faqs = [
  {
    id: "what-is-tenvo",
    question: "What is TENVO?",
    answer: "TENVO is a comprehensive ERP system designed specifically for Pakistani businesses. It combines inventory management, accounting, compliance, and multi-location operations into a single, unified platform.",
    category: "General"
  },
  {
    id: "fbr-compliance",
    question: "How does TENVO handle FBR compliance?",
    answer: "TENVO automatically generates FBR-compliant invoices, calculates sales tax, and prepares tax returns. Our system is certified for FBR Tier-1 compliance and stays updated with the latest tax regulations.",
    category: "Compliance"
  },
  {
    id: "pricing",
    question: "What are the pricing plans?",
    answer: "We offer three plans: Starter (free for up to 100 products), Professional (PKR 4,999/month), and Enterprise (custom pricing). All plans include core features, with Professional and Enterprise adding advanced capabilities.",
    category: "Pricing"
  },
  {
    id: "trial",
    question: "Is there a free trial?",
    answer: "Yes! Our Professional plan includes a 14-day free trial with full access to all features. No credit card required to start.",
    category: "Pricing"
  },
  {
    id: "data-security",
    question: "How secure is my data?",
    answer: "We use bank-grade encryption (AES-256) for data at rest and TLS 1.3 for data in transit. Our infrastructure is hosted on secure cloud servers with daily backups and 99.9% uptime SLA.",
    category: "Security"
  },
  {
    id: "multi-location",
    question: "Can I manage multiple locations?",
    answer: "Yes! TENVO supports unlimited locations on Professional and Enterprise plans. You can manage inventory, sales, and operations across all your branches from a single dashboard.",
    category: "Features"
  },
  {
    id: "urdu-support",
    question: "Does TENVO support Urdu?",
    answer: "Yes! TENVO includes full Urdu language support with RTL interface, Nastaliq typography, and the ability to generate reports and invoices in Urdu.",
    category: "Features"
  },
  {
    id: "migration",
    question: "Can I migrate from my current system?",
    answer: "Yes! We provide free data migration assistance for Professional and Enterprise customers. Our team will help you import your existing data from Excel, other ERP systems, or manual records.",
    category: "Support"
  },
  {
    id: "mobile-app",
    question: "Is there a mobile app?",
    answer: "Yes! TENVO is available on iOS and Android. The mobile app provides full access to inventory management, sales, and reporting features on the go.",
    category: "Features"
  },
  {
    id: "integrations",
    question: "What integrations are available?",
    answer: "TENVO integrates with JazzCash, EasyPaisa, PayFast, major Pakistani banks, and popular accounting software. We also provide API access for custom integrations.",
    category: "Features"
  },
  {
    id: "training",
    question: "Do you provide training?",
    answer: "Yes! We offer comprehensive training for all plans. Professional customers get video tutorials and documentation, while Enterprise customers receive personalized on-site training.",
    category: "Support"
  },
  {
    id: "support-hours",
    question: "What are your support hours?",
    answer: "Email support is available 24/7 for all plans. Professional customers get priority support during business hours (9 AM - 6 PM PKT). Enterprise customers have access to 24/7 phone support.",
    category: "Support"
  }
];

/**
 * Get FAQs filtered by category
 * @param {string} category - Category name
 * @returns {Array} Filtered FAQs
 */
export function getFAQsByCategory(category) {
  return faqs.filter(faq => faq.category === category);
}

/**
 * Search FAQs by query
 * @param {string} query - Search query
 * @returns {Array} Matching FAQs
 */
export function searchFAQs(query) {
  const lowerQuery = query.toLowerCase();
  return faqs.filter(faq => 
    faq.question.toLowerCase().includes(lowerQuery) ||
    faq.answer.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all FAQ categories
 * @returns {Array} Unique categories
 */
export function getFAQCategories() {
  return [...new Set(faqs.map(faq => faq.category))];
}
