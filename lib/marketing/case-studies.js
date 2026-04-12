/**
 * Case Studies Data
 * Customer success stories
 */

export const caseStudies = [
  {
    id: "mansoor-textiles",
    slug: "mansoor-textiles",
    company: "Mansoor Textiles",
    industry: "Textile Manufacturing",
    logo: "/images/case-studies/mansoor-logo.png",
    heroImage: "/images/case-studies/mansoor-hero.jpg",
    summary: "How Mansoor Textiles reduced stock discrepancies by 40% and saved PKR 2M annually.",
    challenge: "Managing inventory across 5 warehouses with manual processes led to frequent stock discrepancies, delayed orders, and significant financial losses.",
    solution: "Implemented TENVO's multi-warehouse system with batch tracking, automated reordering, and real-time inventory synchronization across all locations.",
    results: [
      { metric: "40%", label: "Reduction in stock discrepancies" },
      { metric: "60%", label: "Faster order processing" },
      { metric: "PKR 2M", label: "Annual cost savings" }
    ],
    testimonial: {
      quote: "TENVO transformed our operations. We now have complete visibility across all warehouses and can make data-driven decisions in real-time.",
      author: "Ibrahim Mansoor",
      role: "Director",
      avatar: "/images/testimonials/ibrahim.jpg"
    },
    features: [
      "Multi-warehouse inventory management",
      "Batch tracking and traceability",
      "Automated reorder points",
      "Real-time synchronization",
      "Custom reporting"
    ],
    publishedDate: "2024-01-15",
    readTime: "5 min"
  },
  {
    id: "malik-mart",
    slug: "malik-mart",
    company: "Malik Mart",
    industry: "Retail",
    logo: "/images/case-studies/malik-logo.png",
    heroImage: "/images/case-studies/malik-hero.jpg",
    summary: "How Malik Mart scaled from 5 to 20 locations while maintaining operational efficiency.",
    challenge: "Rapid expansion created operational chaos with inconsistent pricing, inventory mismatches, and poor visibility across locations.",
    solution: "Deployed TENVO's centralized management system with role-based access, unified pricing, and real-time reporting across all 20 locations.",
    results: [
      { metric: "4x", label: "Location growth" },
      { metric: "85%", label: "Reduction in pricing errors" },
      { metric: "50%", label: "Faster monthly closing" }
    ],
    testimonial: {
      quote: "Managing 20+ retail locations is now effortless. TENVO gave us the scalability we needed without the complexity.",
      author: "Kamran Malik",
      role: "Founder",
      avatar: "/images/testimonials/kamran.jpg"
    },
    features: [
      "Centralized multi-location management",
      "Role-based access control",
      "Unified pricing across locations",
      "Real-time reporting",
      "Mobile POS integration"
    ],
    publishedDate: "2024-02-20",
    readTime: "6 min"
  },
  {
    id: "khan-pharmaceuticals",
    slug: "khan-pharmaceuticals",
    company: "Khan Pharmaceuticals",
    industry: "Pharmaceutical",
    logo: "/images/case-studies/khan-logo.png",
    heroImage: "/images/case-studies/khan-hero.jpg",
    summary: "How Khan Pharmaceuticals achieved 100% FBR compliance and eliminated manual tax filing.",
    challenge: "Manual FBR compliance processes were time-consuming, error-prone, and required dedicated accounting staff for tax preparation.",
    solution: "Implemented TENVO's automated FBR compliance module with real-time tax calculations, automated invoice generation, and one-click tax filing.",
    results: [
      { metric: "100%", label: "FBR compliance rate" },
      { metric: "200hrs", label: "Saved per quarter" },
      { metric: "Zero", label: "Tax filing errors" }
    ],
    testimonial: {
      quote: "FBR compliance used to be a nightmare. TENVO automated everything and we haven't looked back.",
      author: "Ayesha Khan",
      role: "Operations Manager",
      avatar: "/images/testimonials/ayesha.jpg"
    },
    features: [
      "Automated FBR compliance",
      "Real-time tax calculations",
      "One-click tax filing",
      "Batch tracking for pharmaceuticals",
      "Expiry date management"
    ],
    publishedDate: "2024-03-10",
    readTime: "4 min"
  }
];

/**
 * Get case study by slug
 * @param {string} slug - Case study slug
 * @returns {Object|undefined} Case study
 */
export function getCaseStudy(slug) {
  return caseStudies.find(cs => cs.slug === slug);
}

/**
 * Get case studies filtered by industry
 * @param {string} industry - Industry name
 * @returns {Array} Filtered case studies
 */
export function getCaseStudiesByIndustry(industry) {
  return caseStudies.filter(cs => cs.industry === industry);
}

/**
 * Get featured case studies (first N)
 * @param {number} count - Number of case studies to return
 * @returns {Array} Featured case studies
 */
export function getFeaturedCaseStudies(count = 3) {
  return caseStudies.slice(0, count);
}

/**
 * Get all industries from case studies
 * @returns {Array} Unique industries
 */
export function getCaseStudyIndustries() {
  return [...new Set(caseStudies.map(cs => cs.industry))];
}
