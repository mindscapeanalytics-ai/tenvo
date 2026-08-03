import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchBusinessByDomain } from '@/lib/storefront/fetchBusinessByDomain';
import { guardStorefrontBusiness } from '@/lib/storefront/guardStorefrontBusiness';
import { isAboutPageEnabled, resolveAboutPageContent } from '@/lib/storefront/aboutStorefront';
import { AboutPageClient } from '@/components/storefront/AboutPageClient';

export async function generateMetadata({ params }) {
  const { businessDomain } = await params;
  const result = await fetchBusinessByDomain(businessDomain);
  if (!result.success) return { title: 'About' };
  if (!isAboutPageEnabled(result.settings, result.business)) {
    return { title: 'About' };
  }
  const about = resolveAboutPageContent({ business: result.business, settings: result.settings });
  return {
    title: `${about.headline} | ${result.business.business_name}`,
    description: about.story?.slice(0, 160) || `About ${result.business.business_name}.`,
  };
}

export default async function AboutPage({ params }) {
  const { businessDomain } = await params;
  const result = guardStorefrontBusiness(await fetchBusinessByDomain(businessDomain));
  if (!result) return null;

  if (!isAboutPageEnabled(result.settings, result.business)) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <AboutPageClient />
    </Suspense>
  );
}
