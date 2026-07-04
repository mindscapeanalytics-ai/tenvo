'use client';

import {
  Pill,
  Calendar,
  Shield,
  AlertCircle,
  FileText,
  Thermometer,
} from 'lucide-react';
import SolutionPageTemplate from '@/components/marketing/sections/SolutionPageTemplate';
import { getDemoStoreHeroByDomain } from '@/lib/marketing/demoStoreGalleryMeta';

const HERO_IMAGE = getDemoStoreHeroByDomain('demo-pharmacy');

export default function PharmacyCommercePage() {
  return (
    <SolutionPageTemplate
      // Hero
      badge="Pharmacy & Healthcare"
      title={
        <>
          Pharmacy management with <br />
          <span className="text-brand-primary">built-in compliance</span>
        </>
      }
      subtitle="Manage prescriptions, batch tracking, expiry alerts, and FBR compliance in one DRAP-aware pharmacy management system."
      heroImage={HERO_IMAGE}
      heroImageAlt="Pharmacy inventory and compliance system"

      // Problem Statement
      problemStatement="Pharmacies need specialized inventory and compliance tools"
      painPoints={[
        'Tracking batch numbers and expiry dates for thousands of medicines',
        'FBR GST compliance and DRAP regulatory requirements',
        'Managing controlled substances and prescription validation',
        'Temperature-sensitive storage monitoring and cold chain tracking',
        'Handling returns, near-expiry stock, and wastage documentation',
        'Multi-location coordination for pharmacy chains',
      ]}

      // Solution Overview
      solutionTitle="Built for Pakistani pharmacy operations"
      solutionDescription="TENVO provides pharmacy-specific batch tracking, expiry alerts (30/60/90 days), FBR GST automation, and DRAP-compliant audit trails. Manage retail pharmacies, hospital dispensaries, and online medicine delivery from one platform."
      solutionImage="/marketing/pharmacy-solution.jpg"
      solutionImageAlt="Pharmacy batch tracking dashboard"

      // Key Features
      features={[
        {
          icon: Pill,
          title: 'Batch & Expiry Management',
          description:
            'Track every batch with expiry dates, manufacturer details, and MRP. Get automated alerts 30, 60, and 90 days before expiry.',
        },
        {
          icon: Shield,
          title: 'FBR & DRAP Compliance',
          description:
            'Automated GST calculations, audit-ready logs, and DRAP-compliant record keeping for controlled substances and prescriptions.',
        },
        {
          icon: Calendar,
          title: 'First-Expiry-First-Out (FEFO)',
          description:
            'Automatic FEFO allocation at checkout ensures near-expiry stock moves first, reducing wastage and expired inventory.',
        },
        {
          icon: AlertCircle,
          title: 'Expiry Alerts & Reports',
          description:
            'Dashboard alerts for near-expiry stock, wastage reports, and return-to-supplier documentation for regulatory compliance.',
        },
        {
          icon: Thermometer,
          title: 'Cold Chain Tracking',
          description:
            'Monitor temperature-sensitive medications, log storage conditions, and maintain cold chain compliance documentation.',
        },
        {
          icon: FileText,
          title: 'Prescription Management',
          description:
            'Digital prescription records, controlled substance logging, and patient history tracking (optional module).',
        },
      ]}

      // Demo Store
      demoStoreName="Pharmacy"
      demoStoreUrl="/store/demo-pharmacy"
      demoStoreDescription="See batch tracking, expiry management, and online medicine ordering in our live pharmacy demo."

      // Recommended Plan
      recommendedPlan={{
        name: 'Professional',
        tagline: 'Essential for pharmacy chains and hospital dispensaries',
        price: 'PKR 24,500',
        description:
          'Get batch tracking, expiry alerts, FBR compliance, and multi-location features needed for professional pharmacy operations.',
      }}
      planFeatures={[
        'Unlimited products with batch tracking',
        'Automated expiry alerts (30/60/90 days)',
        'FEFO (First-Expiry-First-Out) allocation',
        'FBR GST compliance and audit trail',
        '5 pharmacy locations with stock transfers',
        'Temperature-sensitive item flagging',
        'Prescription logging (optional)',
        'Near-expiry and wastage reports',
      ]}

      // Success Metrics
      successMetrics={[
        { value: '99%', label: 'Expiry tracking accuracy' },
        { value: '40%', label: 'Reduced wastage' },
        { value: '100%', label: 'FBR audit compliance' },
        { value: '5 mins', label: 'Batch lookup time' },
      ]}

      includeTestimonials={true}
    />
  );
}
