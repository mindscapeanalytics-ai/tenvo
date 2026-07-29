/**
 * Marketing Content Data
 * Centralized content for all marketing pages
 * Capability truth: lib/marketing/capabilities.js + PLAN_TIERS in lib/config/plans.js
 */

import { VERTICAL_COUNT, MARKETING_DISCLAIMERS } from '@/lib/marketing/capabilities';
import { getBookMeetingHref } from '@/lib/marketing/salesLinks';

export const marketingContent = {
  // Hero section content
  hero: {
    headline: "The intelligent operating system for your business",
    subheadline:
      "Run your brand store, checkout, warehouses, and books as one connected workspace - not a pile of disconnected apps. Deep Pakistan fit at launch; built to scale globally. From solo shops to multi-branch operators.",
    primaryCTA: {
      text: "Start Building",
      href: "/register"
    },
    secondaryCTA: {
      text: "Book a meeting",
      href: getBookMeetingHref()
    },
    badge: {
      text: "V4.0 Enterprise Edition",
      icon: "Rocket"
    },
    stats: [
      { value: 'One platform', label: 'Operations in sync', icon: 'Users' },
      { value: '99.9%', label: 'Target availability (region & plan dependent)', icon: 'Activity' },
      { value: 'SECP', label: 'Compliance positioning', icon: 'Shield' }
    ],
    heroImage: "/industrial_hero_image.png",
    heroImageAlt: "TENVO Inventory and Operations Dashboard"
  },

  // Features content
  features: [
    {
      id: "inventory",
      icon: "Package",
      title: "Inventory Engine",
      description: "Visual/Busy/Excel entry, location-aware stock, Excel import, barcode scan, and domain fields. Multi-warehouse, batch, and serial on Professional+.",
      link: "/features#inventory"
    },
    {
      id: "compliance",
      icon: "Receipt",
      title: "Pakistan tax & compliance",
      description: "GST/sales tax setup, Pakistani tax summaries, and audit-ready ledgers. FBR IRIS live sync is roadmap - calculations and exports ship today.",
      link: "/features#compliance"
    },
    {
      id: "analytics",
      icon: "PieChart",
      title: "Analytics & reporting",
      description: "Operational dashboards, report builder, and AI Business Analyst on supported plans - one ledger for inventory, orders, and finance.",
      link: "/features#analytics"
    },
    {
      id: "multi-location",
      icon: "Store",
      title: "Multi-location operations",
      description: "Warehouses, transfers, and role-based access from one hub. Multi-warehouse unlocks on Professional+ (limits scale by plan).",
      link: "/features#inventory"
    },
    {
      id: "security",
      icon: "Shield",
      title: "Roles & audit trail",
      description: "Role-based permissions per business, tenant-scoped data, and governance features on higher tiers.",
      link: "/features#security"
    },
    {
      id: "cloud",
      icon: "Cloud",
      title: "Cloud workspace",
      description: "Secure hosted workspace with daily operations in the browser - no on-premise server to maintain.",
      link: "/features"
    },
    {
      id: "storefront",
      icon: "ShoppingBag",
      title: "Branded online storefront",
      description: "A public shop under your name that stays in sync with the same inventory your warehouse and POS use - fewer oversells and happier customers.",
      link: "/features#storefront"
    },
    {
      id: "pos-hospitality",
      icon: "UtensilsCrossed",
      title: "POS & hospitality",
      description: "Retail checkout plus table-service workflows so cafés, restaurants, and hybrid brands keep one revenue and stock picture.",
      link: "/features#pos-hospitality"
    },
    {
      id: "growth-crm",
      icon: "Megaphone",
      title: "Marketing, CRM & campaigns",
      description: "Promotions, loyalty, and pipeline tools tied to the same customers and orders as your storefront and POS - not a bolt-on list tool.",
      link: "/solutions/marketing-crm"
    },
    {
      id: "order-hub",
      icon: "ClipboardList",
      title: "Unified order management",
      description: "Web, counter, and B2B orders in one operational queue - from payment capture to packing and courier handoff.",
      link: "/features#storefront"
    }
  ],

  // Operations flow (How it works)
  operationsFlow: {
    title: "One flow. Full control.",
    subtitle: "From receiving stock to financial close, every movement stays connected, auditable, and real-time.",
    steps: [
      {
        id: 'capture',
        icon: 'Package',
        title: 'Capture',
        description:
          'Import from Excel or enter in Visual/Busy grids. Products, images, warehouses, and domain fields land in one catalog.',
      },
      {
        id: 'operate',
        icon: 'TrendingUp',
        title: 'Operate',
        description:
          'Sell on POS and storefront, transfer stock, adjust locations, and fulfil orders from the same inventory truth.',
      },
      {
        id: 'control',
        icon: 'Shield',
        title: 'Control',
        description:
          'Post to finance, export tax summaries, and review audit-friendly logs. Role-based access scales with your plan.',
      },
    ],
  },

  // Pakistan-first launch features (global product)
  pakistaniFeatures: {
    title: "Deep Pakistan fit, built to scale globally",
    subtitle:
      "Launch depth where local tax, language, and payments matter most. TENVO is a global product from Mindscape Analytics LLC.",
    features: [
      {
        icon: "Receipt",
        title: "Pakistani tax configuration",
        description: "Configure GST/sales tax, generate tax-oriented summaries, and keep audit-ready transaction logs for your accountant.",
        badge: "Available"
      },
      {
        icon: "Globe",
        title: "Urdu language support",
        description: "Language toggle with growing Urdu strings for warehouse and hub workflows - full UI localization is expanding.",
        badge: "Partial"
      },
      {
        icon: "Building2",
        title: "Local vertical presets",
        description: `${VERTICAL_COUNT}+ industry presets with Pakistan-aware units, templates, and regional brand catalogs.`,
        badge: "Available"
      },
      {
        icon: "CreditCard",
        title: "Pakistani payment methods",
        description: "COD, JazzCash/EasyPaisa labels at checkout, Stripe for cards, and offline billing for local bank transfer.",
        badge: "Partial"
      }
    ]
  },

  disclaimers: MARKETING_DISCLAIMERS,
};
