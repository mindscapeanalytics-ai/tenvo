import Link from 'next/link';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { TENVO_PARENT_COMPANY } from '@/lib/marketing/tenvo-assistant-knowledge';

export const metadata = {
  title: 'Press',
  description: 'Media and press information for TENVO and Mindscape Analytics LLC.',
};

export default function PressPage() {
  return (
    <MarketingLayout>
      <div className="border-b border-neutral-200/80 bg-white py-14 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">Press</h1>
          <p className="mt-6 text-sm font-medium leading-relaxed text-neutral-700">
            TENVO is an operations and commerce platform for growing businesses, developed by{' '}
            {TENVO_PARENT_COMPANY.name}. For logos, executive commentary, or fact checking, reach the Mindscape
            team through the official contact channels below.
          </p>
          <ul className="mt-8 space-y-4 text-sm font-medium text-neutral-700">
            <li>
              <span className="font-black text-neutral-900">Corporate: </span>
              <a
                href={TENVO_PARENT_COMPANY.contactPage}
                className="font-bold text-brand-primary underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mindscape contact form
              </a>
            </li>
            <li>
              <span className="font-black text-neutral-900">Email: </span>
              <a className="font-bold text-brand-primary underline-offset-2 hover:underline" href="mailto:info@mindscapeanalytics.com">
                info@mindscapeanalytics.com
              </a>
            </li>
            <li>
              <span className="font-black text-neutral-900">Product inquiries: </span>
              <Link href="/contact" className="font-bold text-brand-primary underline-offset-2 hover:underline">
                TENVO contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </MarketingLayout>
  );
}
