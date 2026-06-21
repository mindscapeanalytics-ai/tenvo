import Link from 'next/link';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { MarketingPageHeader, MarketingSection } from '@/components/marketing/layout/MarketingSection';
import { TENVO_PARENT_COMPANY } from '@/lib/marketing/tenvo-assistant-knowledge';

export const metadata = {
  title: 'Terms of Use',
  description: 'Terms for using the TENVO public website and requesting information.',
};

export default function TermsPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <MarketingLayout>
      <MarketingPageHeader title="Terms of Use">
        <p className="mt-2 text-sm text-neutral-500">Last updated: {updated}</p>
      </MarketingPageHeader>
      <MarketingSection className="bg-neutral-50/50" padding="default" width="narrow">
        <div className="space-y-6 text-sm font-medium leading-relaxed text-neutral-700 sm:space-y-8">
          <p>
            These terms apply to this public TENVO website operated by {TENVO_PARENT_COMPANY.name}. Your
            subscription, trial, or enterprise agreement, when applicable, is governed by separate contract
            and checkout terms presented at purchase.
          </p>
          <h2 className="pt-2 text-base font-black text-neutral-900 sm:text-lg">No professional advice</h2>
          <p>
            Marketing pages summarize product capabilities. They are not tax, legal, or accounting advice.
            Confirm compliance and configuration with your advisors and our team during onboarding.
          </p>
          <h2 className="pt-2 text-base font-black text-neutral-900 sm:text-lg">Comparisons</h2>
          <p>
            References to other platforms illustrate typical operator pain points. Feature sets change over
            time; verify fit on a{' '}
            <Link href="/demo" className="font-bold text-brand-primary underline-offset-2 hover:underline">
              demo call
            </Link>
            .
          </p>
          <h2 className="pt-2 text-base font-black text-neutral-900 sm:text-lg">Contact</h2>
          <p>
            Questions:{' '}
            <Link href="/contact" className="font-bold text-brand-primary underline-offset-2 hover:underline">
              TENVO contact
            </Link>
            , or parent company{' '}
            <a
              href={TENVO_PARENT_COMPANY.website}
              className="font-bold text-brand-primary underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              mindscapeanalytics.com
            </a>
            .
          </p>
        </div>
      </MarketingSection>
    </MarketingLayout>
  );
}
