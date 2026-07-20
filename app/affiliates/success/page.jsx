import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { MARKETING_CONTAINER } from '@/lib/utils/marketingLayout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CheckCircle2, ArrowLeft, MailOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Application Received | Tenvo Partner Program',
  description: 'Your application to the Tenvo Partner Program has been received.',
};

export default function AffiliatesSuccessPage() {
  return (
    <MarketingLayout>
      <div className="relative bg-zinc-50 min-h-[90vh] py-24 overflow-hidden flex items-center">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className={cn(MARKETING_CONTAINER, "relative z-10 w-full")}>
          <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-200 p-8 sm:p-14 text-center relative overflow-hidden">
            
            {/* Decorative blob */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="relative inline-flex mb-8">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-50" />
                <div className="relative w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4 tracking-tight">Application Received!</h1>
              
              <p className="text-zinc-600 mb-8 text-lg leading-relaxed">
                Thank you for applying to the Tenvo Partner Program. We're excited to have you on board! 
              </p>

              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-6 mb-10 flex items-start gap-4 text-left">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                  <MailOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">What happens next?</h3>
                  <p className="text-zinc-600 text-sm mt-1">
                    We will review your application and email you your unique referral link and dashboard access within the next 24 hours.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl h-14 text-base font-semibold shadow-sm group">
                  <Link href="/affiliates/status">
                    Check Application Status
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="flex-1 rounded-xl h-14 text-base font-semibold group">
                  <Link href="/">
                    <ArrowLeft className="mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Return to Homepage
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
