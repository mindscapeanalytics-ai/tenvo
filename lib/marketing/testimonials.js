/**
 * Testimonials Data
 * Customer testimonials and social proof
 */

export const testimonials = [
  {
    id: "testimonial-1",
    quote: "The most intuitive ERP we've ever used. It streamlined our entire supply chain within months.",
    author: "Ibrahim Mansoor",
    role: "Director",
    company: "Mansoor Textiles",
    avatar: "/images/testimonials/ibrahim.jpg",
    rating: 5,
    industry: "Textile Manufacturing"
  },
  {
    id: "testimonial-2",
    quote: "TENVO's tax automation saved our accounting team hundreds of hours every quarter.",
    author: "Sara Ahmed",
    role: "CFO",
    company: "Nexus Logistics",
    avatar: "/images/testimonials/sara.jpg",
    rating: 5,
    industry: "Logistics"
  },
  {
    id: "testimonial-3",
    quote: "Finally, a platform that scales with us. Managing 20+ retail locations is now effortless.",
    author: "Kamran Malik",
    role: "Founder",
    company: "Malik Mart",
    avatar: "/images/testimonials/kamran.jpg",
    rating: 5,
    industry: "Retail"
  },
  {
    id: "testimonial-4",
    quote: "FBR compliance used to be a nightmare. TENVO automated everything and we haven't looked back.",
    author: "Ayesha Khan",
    role: "Operations Manager",
    company: "Khan Pharmaceuticals",
    avatar: "/images/testimonials/ayesha.jpg",
    rating: 5,
    industry: "Pharmaceutical"
  },
  {
    id: "testimonial-5",
    quote: "The Urdu interface made it easy for our entire team to adopt. No more language barriers.",
    author: "Ahmed Hassan",
    role: "Business Owner",
    company: "Hassan Electronics",
    avatar: "/images/testimonials/ahmed.jpg",
    rating: 5,
    industry: "Electronics"
  },
  {
    id: "testimonial-6",
    quote: "Real-time inventory across 15 warehouses. TENVO gave us visibility we never had before.",
    author: "Fatima Noor",
    role: "Supply Chain Director",
    company: "Noor Foods",
    avatar: "/images/testimonials/fatima.jpg",
    rating: 5,
    industry: "FMCG"
  }
];

/**
 * Get testimonials filtered by industry
 * @param {string} industry - Industry name
 * @returns {Array} Filtered testimonials
 */
export function getTestimonialsByIndustry(industry) {
  return testimonials.filter(t => t.industry === industry);
}

/**
 * Get featured testimonials (first N)
 * @param {number} count - Number of testimonials to return
 * @returns {Array} Featured testimonials
 */
export function getFeaturedTestimonials(count = 3) {
  return testimonials.slice(0, count);
}

/**
 * Get random testimonials
 * @param {number} count - Number of testimonials to return
 * @returns {Array} Random testimonials
 */
export function getRandomTestimonials(count = 3) {
  const shuffled = [...testimonials].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
