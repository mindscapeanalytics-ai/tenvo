import Link from 'next/link';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { TENVO_PARENT_COMPANY } from '@/lib/marketing/tenvo-assistant-knowledge';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'How TENVO collects and uses information on this public website, forms, and analytics.',
};

export default function PrivacyPage() {
  const updated = new Date().toISOString().slice(0, 10);

  return (
    <MarketingLayout>
      <div className="border-b border-neutral-200/80 bg-white py-14 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-neutral-500">Last updated: {updated}</p>
          <div className="mt-10 space-y-6 text-sm font-medium leading-relaxed text-neutral-700">
            <p>
              This policy describes the public marketing site for TENVO, a product developed by{' '}
              {TENVO_PARENT_COMPANY.name}. It does not replace your separate agreement or privacy terms
              when you use the signed-in application or a tenant storefront.
            </p>
            <h2 className="pt-4 text-lg font-black text-neutral-900">Information you submit</h2>
            <p>
              When you use contact, demo, newsletter, or similar forms, we process the fields you provide so
              our team can respond. Messages may be delivered by email (for example via Resend) to{' '}
              <a className="font-bold text-brand-primary underline-offset-2 hover:underline" href="mailto:tenvo@mindscapeanalytics.com">
                tenvo@mindscapeanalytics.com
              </a>
              . Do not include payment card numbers or government ID numbers in free-form messages.
            </p>
            <h2 className="pt-4 text-lg font-black text-neutral-900">Analytics</h2>
            <p>
              We may use first-party analytics to understand navigation and campaign performance. You can ask
              questions about data use anytime via{' '}
              <Link href="/contact" className="font-bold text-brand-primary underline-offset-2 hover:underline">
                Contact
              </Link>{' '}
              or our parent company at{' '}
              <a
                href={TENVO_PARENT_COMPANY.contactPage}
                className="font-bold text-brand-primary underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mindscape contact
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
