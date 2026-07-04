'use client';

import {
  Sofa,
  Ruler,
  Truck,
  Image as ImageIcon,
  Calendar,
  DollarSign,
} from 'lucide-react';
import SolutionPageTemplate from '@/components/marketing/sections/SolutionPageTemplate';
import { getDemoStoreHeroByDomain } from '@/lib/marketing/demoStoreGalleryMeta';

const HERO_IMAGE = getDemoStoreHeroByDomain('demo-furniture');

export default function FurnitureCommercePage() {
  return (
    <SolutionPageTemplate
      badge="Furniture & Home Décor"
      title={
        <>
          Furniture commerce with <br />
          <span className="text-brand-primary">visual merchandising</span>
        </>
      }
      subtitle="Manage custom orders, delivery schedules, installment plans, and showroom inventory with TENVO's furniture-optimized platform."
      heroImage={HERO_IMAGE}
      heroImageAlt="Furniture showroom and inventory management"

      problemStatement="Furniture businesses have unique operational needs"
      painPoints={[
        'Managing custom orders, made-to-order items, and long lead times',
        'Complex delivery logistics with assembly and installation',
        'Tracking multiple variants (colors, sizes, fabrics) per product',
        'Installment payment plans and advance deposits',
        'Showroom vs warehouse stock visibility',
        'High-value items requiring insurance and damage tracking',
      ]}

      solutionTitle="Built for furniture retailers and manufacturers"
      solutionDescription="TENVO provides furniture-specific features like custom order tracking, delivery scheduling, installment payment management, and visual product galleries. Perfect for showrooms, online furniture stores, and make-to-order workshops."

      features={[
        {
          icon: Sofa,
          title: 'Custom Order Management',
          description:
            'Track made-to-order items, custom dimensions, fabric selections, and production status from order to delivery.',
        },
        {
          icon: Ruler,
          title: 'Variant & Dimension Tracking',
          description:
            'Manage color, size, fabric, and finish variants. Store custom dimensions and specifications for bespoke pieces.',
        },
        {
          icon: Truck,
          title: 'Delivery & Installation',
          description:
            'Schedule deliveries with assembly slots, track driver assignments, and log installation completion.',
        },
        {
          icon: DollarSign,
          title: 'Installment Payment Plans',
          description:
            'Flexible payment plans with advance deposits, monthly installments, and automated payment reminders.',
        },
        {
          icon: ImageIcon,
          title: 'Visual Product Galleries',
          description:
            'Multiple product images, 360° views, and room visualization. Showroom display tags with QR codes.',
        },
        {
          icon: Calendar,
          title: 'Lead Time Management',
          description:
            'Track supplier lead times, production schedules, and delivery commitments. Alert customers of delays proactively.',
        },
      ]}

      demoStoreName="Furniture"
      demoStoreUrl="/store/demo-furniture"
      demoStoreDescription="Explore our furniture demo with visual galleries, custom ordering, and installment payment options."

      recommendedPlan={{
        name: 'Professional',
        tagline: 'Perfect for furniture showrooms and online stores',
        price: 'PKR 24,500',
      }}
      planFeatures={[
        'Unlimited products with variants',
        'Custom order tracking and production status',
        'Delivery scheduling and driver management',
        'Installment payment plans',
        'Multi-image product galleries',
        'Showroom + warehouse inventory',
        'Customer advance deposits',
        'Lead time and supplier tracking',
      ]}

      successMetrics={[
        { value: '50%', label: 'Faster order processing' },
        { value: '95%', label: 'On-time delivery rate' },
        { value: '30%', label: 'More online orders' },
        { value: 'PKR 2M', label: 'Avg installment revenue' },
      ]}
    />
  );
}
