import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { MARKETING_CONTAINER, MARKETING_SECTION_HEADING } from '@/lib/utils/marketingLayout';
import { Button } from '@/components/ui/button';
import { prismaBase as prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { TrendingUp, ArrowRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const metadata = {
  title: 'Partner Program | Tenvo',
  description: 'Join the Tenvo partner program and earn up to 50% commission.',
};

async function registerAffiliate(formData) {
  'use server';
  
  const name = formData.get('name');
  const email = formData.get('email');
  
  if (!name || !email) {
    throw new Error('Name and email are required');
  }
  
  const referral_code = 'REF-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  
  let hasError = null;
  try {
    await prisma.affiliates.create({
      data: {
        name,
        email,
        referral_code,
        commission_rate: 20.00, // Default to 20%
      }
    });
  } catch (error) {
    if (error.code === 'P2002') {
      hasError = 'email_taken';
    } else {
      throw error; // Rethrow unexpected errors
    }
  }

  if (hasError === 'email_taken') {
    redirect('/affiliates?error=email_taken');
  }
  
  redirect('/affiliates/success');
}

export default async function AffiliatesPage({ searchParams }) {
  const resolvedParams = await Promise.resolve(searchParams);
  const error = resolvedParams?.error;
  return (
    <MarketingLayout>
      <div className="relative bg-zinc-50 min-h-[90vh] py-24 overflow-hidden flex items-center">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className={cn(MARKETING_CONTAINER, "relative z-10 w-full")}>
          <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-200 p-8 sm:p-12 relative overflow-hidden">
            
            {/* Decorative blob */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3 py-1.5 text-sm font-medium text-brand-primary mb-6">
                <TrendingUp className="mr-2 h-4 w-4" />
                Tenvo Partner Program
              </div>
              
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4 tracking-tight">Become a Partner</h1>
              <p className="text-zinc-600 mb-10 text-lg leading-relaxed">
                Fill out the application below to join our affiliate program. Once approved, you'll receive a unique referral link to start earning up to 50% commission.
              </p>
              
              {error === 'email_taken' && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-sm flex items-start">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-semibold mb-1">You've already applied!</p>
                    <p className="text-amber-700">
                      An application with this email address already exists. {' '}
                      <Link href="/affiliates/status" className="font-bold underline hover:text-amber-900">
                        Check your application status here
                      </Link>.
                    </p>
                  </div>
                </div>
              )}
              
              <form action={registerAffiliate} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-semibold text-zinc-800">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    required 
                    placeholder="Jane Doe"
                    className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-zinc-400" 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-zinc-800">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    placeholder="jane@example.com"
                    className="w-full px-4 py-3.5 rounded-2xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all placeholder:text-zinc-400" 
                  />
                </div>
                
                <div className="pt-2 space-y-4">
                  <Button type="submit" size="lg" className="w-full bg-brand-primary text-white hover:bg-brand-primary-dark rounded-xl h-14 text-base font-semibold shadow-sm group">
                    Submit Application
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <div className="text-center">
                    <Link href="/affiliates/status" className="text-sm font-medium text-brand-primary hover:text-brand-primary-dark hover:underline transition-colors">
                      Already a partner? Check Status & Dashboard
                    </Link>
                  </div>
                </div>
                
                <div className="flex items-center justify-center pt-4 text-sm text-zinc-500 font-medium">
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-zinc-400" /> Secure and encrypted application
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
