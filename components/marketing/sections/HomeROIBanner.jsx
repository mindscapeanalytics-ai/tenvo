'use client';

import { MARKETING_CONTAINER } from '@/lib/utils/marketingLayout';
import { Button } from '@/components/ui/button';
import MarketingCtaLink from '@/components/marketing/ui/MarketingCtaLink';
import { getBookMeetingHref } from '@/lib/marketing/salesLinks';
import { ScrollReveal } from '@/components/marketing/effects/ModernEffects';
import { cn } from '@/lib/utils';
import { ArrowRight, ShieldCheck, Clock, TrendingUp } from 'lucide-react';

export default function HomeROIBanner() {
  return (
    <section className="bg-white py-12 sm:py-20 lg:py-24">
      <div className={MARKETING_CONTAINER}>
        <ScrollReveal direction="up" threshold={0.3} className="relative overflow-hidden rounded-[2.5rem] bg-neutral-900 px-6 py-16 sm:px-12 sm:py-20 lg:px-16">
          {/* Abstract dark gradients */}
          <div className="absolute -left-[10%] top-0 h-[500px] w-[500px] rounded-full bg-brand-primary/20 blur-[100px] mix-blend-screen" />
          <div className="absolute -right-[10%] bottom-0 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[100px] mix-blend-screen" />
          
          <div className="relative z-10 grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            
            {/* Left Content */}
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl mb-6 leading-tight">
                Stop losing margins to inflation.<br />
                <span className="text-brand-primary">Start managing profitability.</span>
              </h2>
              <p className="text-lg text-neutral-400 mb-8 font-medium">
                Traditional POS and inventory systems treat your data like a static ledger. TENVO acts like a live operating system, actively defending your bottom line against rising vendor costs and stockouts.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                 <Button asChild className="h-14 rounded-xl bg-brand-primary px-8 text-base font-semibold text-white hover:bg-brand-primary-dark shadow-[0_0_20px_rgba(var(--brand-primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--brand-primary-rgb),0.5)] transition-all">
                   <MarketingCtaLink href={getBookMeetingHref()} className="inline-flex items-center gap-2">
                     Book a platform demo
                     <ArrowRight className="h-4 w-4" />
                   </MarketingCtaLink>
                 </Button>
                 <Button asChild variant="outline" className="h-14 rounded-xl border-neutral-700 bg-neutral-800/50 px-8 text-base font-semibold text-white hover:bg-neutral-800">
                   <MarketingCtaLink href="/pricing">
                     View our pricing
                   </MarketingCtaLink>
                 </Button>
              </div>
            </div>

            {/* Right Metrics */}
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-1">
               {[
                 {
                   icon: TrendingUp,
                   title: "20%+ Margin Lift",
                   desc: "By auto-adjusting retail prices to vendor cost spikes.",
                   color: "text-emerald-400",
                   bg: "bg-emerald-400/10"
                 },
                 {
                   icon: Clock,
                   title: "15 Hours Saved/Wk",
                   desc: "No more manual data-entry or disconnected Excel sheets.",
                   color: "text-brand-primary",
                   bg: "bg-brand-primary/10"
                 },
                 {
                   icon: ShieldCheck,
                   title: "100% Tax Compliant",
                   desc: "Automated FBR 18% GST calculation on every invoice.",
                   color: "text-purple-400",
                   bg: "bg-purple-400/10"
                 }
               ].map((metric, i) => (
                 <div key={i} className="flex items-start gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 backdrop-blur-sm">
                   <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", metric.bg, metric.color)}>
                     <metric.icon className="h-6 w-6" />
                   </div>
                   <div>
                     <h4 className="text-lg font-bold text-white mb-1">{metric.title}</h4>
                     <p className="text-sm font-medium text-neutral-400 leading-relaxed">{metric.desc}</p>
                   </div>
                 </div>
               ))}
            </div>

          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
