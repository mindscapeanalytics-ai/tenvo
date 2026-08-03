'use client';

import { MARKETING_CONTAINER, MARKETING_SECTION_HEADING } from '@/lib/utils/marketingLayout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, TrendingUp, Handshake, Users, ChevronRight, BarChart3, Store } from 'lucide-react';
import { ScrollReveal } from '@/components/marketing/effects/ModernEffects';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function AffiliateProgramSection() {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden bg-white">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f4f4f5_1px,transparent_1px),linear-gradient(to_bottom,#f4f4f5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />

      <div className={cn(MARKETING_CONTAINER, "relative z-10")}>
        <div className="bg-zinc-50 border border-zinc-200/60 rounded-[2.5rem] p-8 sm:p-12 lg:p-16 shadow-sm overflow-hidden relative">
          
          {/* Decorative blur blob */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
            {/* Left Column: Copy & CTA */}
            <div>
              <ScrollReveal>
                <div className="inline-flex items-center rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3 py-1.5 text-sm font-medium text-brand-primary mb-6">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Tenvo Partner Program
                </div>
                <h2 className={cn(MARKETING_SECTION_HEADING, "text-zinc-900 text-left md:text-left mb-6 !leading-tight")}>
                  Refer clients. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">
                    Earn up to 50% commission.
                  </span>
                </h2>
                <p className="text-lg text-zinc-600 mb-8 max-w-lg leading-relaxed">
                  Join the Tenvo Affiliate Program and get rewarded for bringing modern ERP and POS solutions to growing businesses. We offer some of the highest payouts in the industry on advance payments.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                  <Button asChild size="lg" className="bg-brand-primary text-white hover:bg-brand-primary-dark rounded-xl h-14 px-8 shadow-sm text-base">
                    <Link href="/affiliates">
                      Become a Partner <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <div className="flex flex-col gap-1.5 text-sm text-zinc-500 font-medium">
                    <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Free to join</span>
                    <span className="flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" /> Instant approval</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: Abstract UI / Visual */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <ScrollReveal delay={0.2} className="relative">
                {/* Main Mockup Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/60 border border-zinc-200 overflow-hidden relative z-10">
                  <div className="border-b border-zinc-100 bg-zinc-50/80 px-6 py-4 flex items-center justify-between backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-zinc-900">Partner Dashboard</span>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Active</span>
                  </div>
                  
                  <div className="p-6 sm:p-8">
                    <div className="text-sm font-semibold text-zinc-500 mb-1 tracking-wide uppercase">Total Earnings</div>
                    <div className="text-4xl font-bold text-zinc-900 mb-8 tabular-nums">$12,450.00</div>
                    
                    <div className="space-y-3">
                      {/* List Item 1 */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 shadow-sm">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 text-sm">Enterprise Deal</div>
                            <div className="text-[13px] text-zinc-500 font-medium">50% Commission</div>
                          </div>
                        </div>
                        <div className="font-bold text-emerald-600">+$2,500.00</div>
                      </div>
                      
                      {/* List Item 2 */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 shadow-sm">
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 text-sm">Retail Subscription</div>
                            <div className="text-[13px] text-zinc-500 font-medium">20% Commission</div>
                          </div>
                        </div>
                        <div className="font-bold text-emerald-600">+$120.00</div>
                      </div>
                      
                      {/* List Item 3 */}
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 shadow-sm">
                            <Handshake className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 text-sm">Agency Referral</div>
                            <div className="text-[13px] text-zinc-500 font-medium">20% Commission</div>
                          </div>
                        </div>
                        <div className="font-bold text-emerald-600">+$300.00</div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" className="w-full mt-6 text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/5 rounded-xl font-semibold">
                      View all payouts <ChevronRight className="ml-1 w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Floating Elements (Decorative) */}
                <motion.div 
                  className="absolute -right-6 -bottom-6 bg-white p-4 rounded-2xl shadow-xl shadow-zinc-200/60 border border-zinc-200 z-20 hidden sm:block"
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[13px] text-zinc-500 font-semibold uppercase tracking-wide">Monthly Growth</div>
                      <div className="text-base font-bold text-zinc-900">+45.2%</div>
                    </div>
                  </div>
                </motion.div>

              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
