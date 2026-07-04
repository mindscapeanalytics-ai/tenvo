'use client';

import {
  ShoppingBasket,
  BarChart3,
  Truck,
  Scale,
  Tag,
  Users,
} from 'lucide-react';
import SolutionPageTemplate from '@/components/marketing/sections/SolutionPageTemplate';
import { getDemoStoreHeroByDomain } from '@/lib/marketing/demoStoreGalleryMeta';

const HERO_IMAGE = getDemoStoreHeroByDomain('demo-supermarket');

export default function SupermarketGroceryPage() {
  return (
    <SolutionPageTemplate
      badge="Supermarket & Grocery"
      title={
        <>
          Supermarket management <br />
          <span className="text-brand-primary">from receiving to checkout</span>
        </>
      }
      subtitle="Manage fresh produce, packaged goods, weight-based items, and high-turnover inventory with TENVO's grocery-optimized platform."
      heroImage={HERO_IMAGE}
      heroImageAlt="Supermarket inventory and POS system"

      problemStatement="Grocery stores face high-velocity, perishable inventory"
      painPoints={[
        'Tracking thousands of SKUs with varying shelf lives',
        'Weight-based pricing for fresh produce and bulk items',
        'Managing promotions, discounts, and loyalty programs',
        'High-frequency stock-outs and overstocking of perishables',
        'Multiple suppliers, daily deliveries, and rapid turnover',
        'Checkout speed and accuracy for high customer volume',
      ]}

      solutionTitle="Purpose-built for grocery and FMCG retail"
      solutionDescription="TENVO handles weight-based items, batch tracking for perishables, rapid checkout with barcode scanning, and supplier management for daily deliveries. Track fresh produce separately from packaged goods with category-specific expiry rules."

      features={[
        {
          icon: Scale,
          title: 'Weight-Based Items',
          description:
            'Per-kg pricing for fresh produce, meat, and bulk items. Digital scale integration and tare weight management.',
        },
        {
          icon: ShoppingBasket,
          title: 'Rapid Checkout POS',
          description:
            'Barcode scanning, quick item search, and fast tender workflows. Handle high customer volume with minimal training.',
        },
        {
          icon: Tag,
          title: 'Promotions & Discounts',
          description:
            'Buy-one-get-one, percentage discounts, bundle deals, and loyalty card integration. Scheduled start/end dates.',
        },
        {
          icon: BarChart3,
          title: 'Perishable Tracking',
          description:
            'Separate expiry tracking for fresh vs packaged goods. Automated alerts for near-expiry produce and dairy.',
        },
        {
          icon: Truck,
          title: 'Supplier Management',
          description:
            'Track daily deliveries from multiple suppliers. Purchase order management and receiving documentation.',
        },
        {
          icon: Users,
          title: 'Customer Loyalty',
          description:
            'Digital loyalty cards, points accumulation, and redemption at checkout. Targeted promotions for repeat customers.',
        },
      ]}

      demoStoreName="Supermarket"
      demoStoreUrl="/store/demo-supermarket"
      demoStoreDescription="Browse our grocery demo with 1,000+ SKUs, weight-based items, and promotional pricing."

      recommendedPlan={{
        name: 'Professional',
        tagline: 'Essential for supermarkets and grocery chains',
        price: 'PKR 24,500',
      }}
      planFeatures={[
        'Unlimited products and categories',
        'Weight-based item pricing',
        'Barcode scanning and rapid checkout',
        'Promotions and discount campaigns',
        'Batch and expiry tracking',
        '5 locations with inter-store transfers',
        'Loyalty program integration',
        'Supplier and purchase order management',
      ]}

      successMetrics={[
        { value: '1,000+', label: 'SKUs managed' },
        { value: '30 sec', label: 'Avg checkout time' },
        { value: '20%', label: 'Reduced wastage' },
        { value: 'PKR 5M', label: 'Monthly revenue' },
      ]}
    />
  );
}
