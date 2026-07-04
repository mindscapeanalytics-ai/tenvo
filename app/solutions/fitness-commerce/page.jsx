'use client';

import {
  Dumbbell,
  Users,
  CreditCard,
  Calendar,
  TrendingUp,
  ShoppingBag,
} from 'lucide-react';
import SolutionPageTemplate from '@/components/marketing/sections/SolutionPageTemplate';
import { getDemoStoreHeroByDomain } from '@/lib/marketing/demoStoreGalleryMeta';

const HERO_IMAGE = getDemoStoreHeroByDomain('demo-fitness');

export default function FitnessCommercePage() {
  return (
    <SolutionPageTemplate
      badge="Gym & Fitness"
      title={
        <>
          Fitness club management <br />
          <span className="text-brand-primary">memberships to merchandise</span>
        </>
      }
      subtitle="Manage gym memberships, class bookings, personal training, and supplement sales in one unified fitness platform."
      heroImage={HERO_IMAGE}
      heroImageAlt="Gym membership and retail management"

      problemStatement="Fitness businesses juggle memberships and retail"
      painPoints={[
        'Managing monthly memberships, renewals, and payment collection',
        'Class scheduling, capacity limits, and trainer assignments',
        'Selling supplements, protein, and fitness gear at the counter',
        'Tracking member check-ins and access control',
        'Handling personal training sessions and packages',
        'Separate systems for memberships vs retail inventory',
      ]}

      solutionTitle="One platform for gyms, studios, and fitness centers"
      solutionDescription="TENVO combines membership management with retail POS. Sell monthly passes, track renewals, manage class bookings, and ring up supplement sales from the same system. Perfect for gyms, yoga studios, and fitness clubs."

      features={[
        {
          icon: Users,
          title: 'Membership Management',
          description:
            'Monthly, quarterly, and annual membership plans with automated renewal reminders and payment collection.',
        },
        {
          icon: Calendar,
          title: 'Class Scheduling',
          description:
            'Schedule group classes, manage capacity limits, assign trainers, and handle member bookings with waitlists.',
        },
        {
          icon: Dumbbell,
          title: 'Personal Training Packages',
          description:
            'Sell PT session packages, track session usage, and manage trainer schedules and client assignments.',
        },
        {
          icon: ShoppingBag,
          title: 'Retail Supplements & Gear',
          description:
            'Full inventory management for supplements, protein powders, shakers, and fitness apparel sold at reception.',
        },
        {
          icon: CreditCard,
          title: 'Automated Billing',
          description:
            'Recurring membership billing, installment plans, and payment gateway integration for online sign-ups.',
        },
        {
          icon: TrendingUp,
          title: 'Member Analytics',
          description:
            'Track check-ins, class attendance, retail purchases per member, and revenue trends across membership tiers.',
        },
      ]}

      demoStoreName="Fitness"
      demoStoreUrl="/store/demo-fitness"
      demoStoreDescription="See membership packages, class schedules, and supplement retail in our live fitness demo."

      recommendedPlan={{
        name: 'Business',
        tagline: 'For multi-location gyms and fitness chains',
        price: 'PKR 39,500',
      }}
      planFeatures={[
        'Unlimited members and classes',
        'Automated membership renewals',
        'Class booking and capacity management',
        'Personal training session tracking',
        'Retail POS for supplements and gear',
        'Multi-location access control',
        'Member check-in logs',
        'Revenue and attendance analytics',
      ]}

      successMetrics={[
        { value: '200+', label: 'Active memberships' },
        { value: '95%', label: 'Renewal rate' },
        { value: 'PKR 1.2M', label: 'Monthly retail revenue' },
        { value: '40', label: 'Classes per week' },
      ]}
    />
  );
}
