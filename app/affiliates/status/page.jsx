import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { MARKETING_CONTAINER } from '@/lib/utils/marketingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, Loader2, XCircle, Users, DollarSign, Clock, ArrowRight, BadgeCheck } from 'lucide-react';
import CopyReferralLink from './CopyReferralLink';
import { prismaBase as prisma } from '@/lib/db';
import Link from 'next/link';

export const metadata = {
  title: 'Partner Dashboard | Tenvo Partner Program',
  description: 'Check your Tenvo Partner Program status, access your referral link, and view your commissions.',
};

export const dynamic = 'force-dynamic';

export default async function AffiliateStatusPage({ searchParams }) {
  // Next.js App Router: searchParams may be a Promise in v15+
  const resolvedParams = await Promise.resolve(searchParams);
  const email = resolvedParams?.email?.toString()?.trim() || '';

  let affiliate = null;
  let error = null;

  if (email) {
    try {
      const cleanEmail = email.toLowerCase().trim();

      // Raw SQL: always returns all columns regardless of Prisma client cache
      const rows = await prisma.$queryRaw`
        SELECT id, name, email, referral_code, status, commission_rate,
               total_earnings, is_active, created_at, updated_at
        FROM affiliates
        WHERE LOWER(email) = ${cleanEmail}
        LIMIT 1
      `;

      if (!rows || rows.length === 0) {
        error = 'no_account';
      } else {
        affiliate = {
          ...rows[0],
          commission_rate: Number(rows[0].commission_rate || 20),
          total_earnings: Number(rows[0].total_earnings || 0),
          referrals: [],
        };

        // Fetch referrals
        const referralRows = await prisma.$queryRaw`
          SELECT r.id, r.affiliate_id, r.business_id, r.status,
                 r.commission_earned, r.created_at
          FROM referrals r
          WHERE r.affiliate_id = ${affiliate.id}::uuid
          ORDER BY r.created_at DESC
          LIMIT 20
        `;

        // Batch-fetch business names
        const bizIds = [...new Set(referralRows.map(r => r.business_id).filter(Boolean))];
        let bizMap = {};
        if (bizIds.length > 0) {
          const businesses = await prisma.businesses.findMany({
            where: { id: { in: bizIds } },
            select: { id: true, business_name: true, domain: true, plan_tier: true }
          });
          bizMap = Object.fromEntries(businesses.map(b => [b.id, b]));
        }

        affiliate.referrals = referralRows.map(r => ({
          ...r,
          commission_earned: Number(r.commission_earned || 0),
          businesses: bizMap[r.business_id] || null,
        }));
      }
    } catch (err) {
      console.error('[affiliate status page]', err);
      error = 'server_error';
    }
  }

  const totalReferrals = affiliate?.referrals?.length || 0;
  const pendingCommissions = affiliate?.referrals
    ?.filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + Number(r.commission_earned), 0) || 0;
  const paidCommissions = affiliate?.referrals
    ?.filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + Number(r.commission_earned), 0) || 0;

  const isApproved = affiliate?.status === 'approved';

  return (
    <MarketingLayout>
      <div className="relative bg-zinc-50 min-h-[85vh] py-24 overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className={cn(MARKETING_CONTAINER, "relative z-10 w-full")}>
          <div className={cn(
            "mx-auto bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-200 p-8 sm:p-14 relative overflow-hidden",
            isApproved ? 'max-w-5xl' : 'max-w-xl'
          )}>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 mb-3 tracking-tight">
                {isApproved ? `Welcome back, ${affiliate.name?.split(' ')[0] || 'Partner'}` : 'Partner Portal'}
              </h1>
              {!email && (
                <p className="text-zinc-500">
                  Enter your partner email to access your dashboard and referral link.
                </p>
              )}
            </div>

            {/* Email lookup form — always show if not approved */}
            {!isApproved && (
              <form action="/affiliates/status" method="GET" className="mb-6 max-w-lg mx-auto">
                <div className="flex gap-3">
                  <Input
                    name="email"
                    type="email"
                    placeholder="partner@example.com"
                    defaultValue={email}
                    required
                    className="h-12 bg-zinc-50 rounded-xl"
                  />
                  <Button type="submit" className="h-12 px-6 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl flex-shrink-0">
                    <Search className="w-4 h-4 mr-2" /> Access
                  </Button>
                </div>
              </form>
            )}

            {/* Errors */}
            {error === 'no_account' && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl text-sm mb-6 max-w-lg mx-auto">
                <p className="font-semibold mb-1">No account found for <span className="font-mono">{email}</span></p>
                <p>
                  Haven't applied yet?{' '}
                  <Link href="/affiliates" className="font-semibold underline hover:text-red-900">
                    Apply to the partner program here →
                  </Link>
                </p>
              </div>
            )}
            {error === 'server_error' && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl text-sm mb-6 flex items-start gap-3 max-w-lg mx-auto">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>An error occurred. Please try again.</p>
              </div>
            )}

            {/* Pending */}
            {affiliate && affiliate.status === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-left max-w-lg mx-auto mt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">Application Under Review</h3>
                    <p className="text-xs text-zinc-500">Hi {affiliate.name?.split(' ')[0]}</p>
                  </div>
                </div>
                <p className="text-zinc-600 text-sm ml-12">
                  Your application is pending review by our team. We'll notify you by email once approved. Check back here anytime.
                </p>
                <div className="mt-4 ml-12 flex items-center gap-2 text-xs text-amber-700 font-medium bg-amber-100 w-fit px-3 py-1.5 rounded-full">
                  <span className="font-mono">{affiliate.referral_code}</span>
                  <span className="text-amber-500">· Your future referral code</span>
                </div>
              </div>
            )}

            {/* Rejected */}
            {affiliate && affiliate.status === 'rejected' && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-left max-w-lg mx-auto mt-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-zinc-900">Application Not Approved</h3>
                </div>
                <p className="text-zinc-600 text-sm ml-12">
                  Unfortunately we are unable to accept your application at this time. Contact support if you believe this is an error.
                </p>
              </div>
            )}

            {/* ✅ APPROVED — Full Dashboard */}
            {isApproved && (
              <div className="space-y-8 text-left animate-in fade-in duration-500">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 pb-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mb-2">
                      <BadgeCheck className="w-3.5 h-3.5" /> Approved Partner
                    </div>
                    <p className="text-zinc-500 text-sm">Commission Rate: <span className="font-semibold text-zinc-800">{affiliate.commission_rate}%</span></p>
                  </div>
                  <Link
                    href="/affiliates/status"
                    className="text-sm font-medium text-zinc-400 hover:text-zinc-700 transition-colors border border-zinc-200 px-4 py-2 rounded-xl hover:bg-zinc-50"
                  >
                    Sign out
                  </Link>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-zinc-600 text-sm">Total Referrals</h3>
                    </div>
                    <div className="text-3xl font-bold text-zinc-900 tabular-nums">{totalReferrals}</div>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-zinc-600 text-sm">Pending</h3>
                    </div>
                    <div className="text-3xl font-bold text-zinc-900 tabular-nums">${pendingCommissions.toFixed(2)}</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-emerald-800 text-sm">Total Earned</h3>
                    </div>
                    <div className="text-3xl font-bold text-emerald-900 tabular-nums">${paidCommissions.toFixed(2)}</div>
                  </div>
                </div>

                {/* Referral Link */}
                <CopyReferralLink referralCode={affiliate.referral_code} />

                {/* Referrals Ledger */}
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-zinc-900">Referral History</h3>
                    <span className="text-xs text-zinc-400">{totalReferrals} total</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3 font-medium">Date</th>
                          <th className="px-6 py-3 font-medium">Business</th>
                          <th className="px-6 py-3 font-medium">Commission</th>
                          <th className="px-6 py-3 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {affiliate.referrals.map((ref) => (
                          <tr key={ref.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-6 py-4 text-zinc-500 whitespace-nowrap">
                              {new Date(ref.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 font-medium text-zinc-900">
                              {ref.businesses?.business_name || '—'}
                              {ref.businesses?.plan_tier && (
                                <span className="block text-xs text-zinc-400 capitalize">{ref.businesses.plan_tier} plan</span>
                              )}
                            </td>
                            <td className="px-6 py-4 font-semibold text-emerald-700 tabular-nums whitespace-nowrap">
                              ${Number(ref.commission_earned).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                ref.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {ref.status === 'paid' ? '✓ Paid' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {affiliate.referrals.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-14 text-center">
                              <div className="flex flex-col items-center gap-2 text-zinc-400">
                                <Users className="w-7 h-7" />
                                <p className="font-medium text-sm">No referrals yet</p>
                                <p className="text-xs">Share your referral link above to start earning.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* Bottom nav when no email entered yet */}
            {!email && (
              <div className="text-center text-sm text-zinc-400 mt-8">
                Not a partner yet?{' '}
                <Link href="/affiliates" className="text-zinc-900 font-semibold hover:underline">
                  Apply to the program <ArrowRight className="inline w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
