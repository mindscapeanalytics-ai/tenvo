import Link from 'next/link';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { TENVO_PARENT_COMPANY } from '@/lib/marketing/tenvo-assistant-knowledge';

export const metadata = {
  title: 'Terms of Use',
  description: 'Terms for using the TENVO public website and requesting information.',
};

export default function TermsPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <MarketingLayout>
      <div className="border-b border-neutral-200/80 bg-white py-14 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">Terms of Use</h1>
          <p className="mt-2 text-sm text-neutral-500">Last updated: {updated}</p>
          <div className="mt-10 space-y-6 text-sm font-medium leading-relaxed text-neutral-700">
            <p>
              These terms apply to this public TENVO website operated by {TENVO_PARENT_COMPANY.name}. Your
              subscription, trial, or enterprise agreement, when applicable, is governed by separate contract
              and checkout terms presented at purchase.
            </p>
            <h2 className="pt-4 text-lg font-black text-neutral-900">No professional advice</h2>
            <p>
              Marketing pages summarize product capabilities. They are not tax, legal, or accounting advice.
              Confirm compliance and configuration with your advisors and our team during onboarding.
            </p>
            <h2 className="pt-4 text-lg font-black text-neutral-900">Comparisons</h2>
            <p>
              References to other platforms illustrate typical operator pain points. Feature sets change over
              time; verify fit on a{' '}
              <Link href="/demo" className="font-bold text-brand-primary underline-offset-2 hover:underline">
                demo call
              </Link>
              .
            </p>
            <h2 className="pt-4 text-lg font-black text-neutral-900">Contact</h2>
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
        </div>
      </div>
    </MarketingLayout>
  );
}
