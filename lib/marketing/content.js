/**
 * Marketing Content Data
 * Centralized content for all marketing pages
 * Following 2026 best practices for content management
 */

export const marketingContent = {
  // Hero section content
  hero: {
    headline: "The Intelligent Operating System for Pakistan",
    subheadline: "Unified financial infrastructure for the modern enterprise. Scale your inventory, accounting, and compliance with bank-grade precision.",
    primaryCTA: {
      text: "Start Building",
      href: "/register"
    },
    secondaryCTA: {
      text: "Schedule Demo",
      href: "/demo"
    },
    badge: {
      text: "V4.0 Enterprise Edition",
      icon: "Rocket"
    },
    stats: [
      { value: "450k+", label: "Active Users", icon: "Users" },
      { value: "99.9%", label: "Core Uptime", icon: "Activity" },
      { value: "SECP", label: "Compliant", icon: "Shield" }
    ],
    heroImage: "/industrial_hero_image.png",
    heroImageAlt: "TENVO Inventory and Operations Dashboard"
  },

  // Features content
  features: [
    {
      id: "inventory",
      icon: "Package",
      title: "Inventory Intelligence",
      description: "Real-time multi-warehouse tracking with AI-driven stock predictions and low-stock alerts.",
      link: "/features#inventory"
    },
    {
      id: "compliance",
      icon: "Receipt",
      title: "Automated Compliance",
      description: "Stay 100% compliant with FBR Tier-1, SRB, and PRA regulations automatically.",
      link: "/features#compliance"
    },
    {
      id: "analytics",
      icon: "PieChart",
      title: "Advanced Analytics",
      description: "Instant P&L, Balance Sheets, and Cash Flow statements with granular drill-down capacity.",
      link: "/features#analytics"
    },
    {
      id: "multi-location",
      icon: "Store",
      title: "Scale Everywhere",
      description: "Manage hundreds of branches, outlets, and depots from a single global control center.",
      link: "/features#multi-location"
    },
    {
      id: "security",
      icon: "Shield",
      title: "Identity & Security",
      description: "Zero-trust security architecture with role-based access and immutable audit trails.",
      link: "/features#security"
    },
    {
      id: "cloud",
      icon: "Cloud",
      title: "Cloud Infrastructure",
      description: "High-availability server network ensuring your business stays online 24/7/365.",
      link: "/features#cloud"
    }
  ],

  // Operations flow (How it works)
  operationsFlow: {
    title: "One flow. Full control.",
    subtitle: "From receiving stock to financial close, every movement stays connected, auditable, and real-time.",
    steps: [
      {
        id: "capture",
        icon: "Package",
        title: "Capture",
        description: "Create products, batches, serials, and warehouse locations with enterprise-grade validation."
      },
      {
        id: "operate",
        icon: "TrendingUp",
        title: "Operate",
        description: "Run reservations, transfers, adjustments, and auto-reorder from a single operational cockpit."
      },
      {
        id: "control",
        icon: "Shield",
        title: "Control",
        description: "Maintain audit-ready traceability with role-based permissions and compliance-first workflows."
      }
    ]
  },

  // Pakistani features
  pakistaniFeatures: {
    title: "Built for Pakistan",
    subtitle: "Localized features that give you a competitive edge in the Pakistani market.",
    features: [
      {
        icon: "Receipt",
        title: "FBR Tier-1 Compliance",
        description: "Automated tax filing, invoice generation, and sales tax returns. Stay compliant without the paperwork.",
        badge: "Exclusive"
      },
      {
        icon: "Globe",
        title: "Urdu Language Support",
        description: "Full RTL support with Nastaliq typography. Generate reports and invoices in Urdu.",
        badge: "Exclusive"
      },
      {
        icon: "Building2",
        title: "Local Brand Integration",
        description: "Pre-configured database of 200+ Pakistani suppliers, brands, and market-specific pricing.",
        badge: "Exclusive"
      },
      {
        icon: "CreditCard",
        title: "Pakistani Payment Methods",
        description: "JazzCash, EasyPaisa, and local bank integrations built-in.",
        badge: "Exclusive"
      }
    ]
  }
};
