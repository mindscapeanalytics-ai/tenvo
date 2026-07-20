import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { MARKETING_CONTAINER } from '@/lib/utils/marketingLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search, Loader2, MailOpen, XCircle, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import CopyReferralLink from './CopyReferralLink';
import { prismaBase as prisma } from '@/lib/db';
import Link from 'next/link';

export const metadata = {
  title: 'Partner Dashboard | Tenvo Partner Program',
  description: 'Manage your Tenvo Partner Program account.',
};

export default async function AffiliateStatusPage({ searchParams }) {
  const email = searchParams?.email;
  let affiliate = null;
  let error = null;

  if (email) {
    try {
      affiliate = await prisma.affiliates.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
          referrals: {
            orderBy: { created_at: 'desc' },
            take: 10, // show latest 10
            include: {
              businesses: {
                select: { name: true }
              }
            }
          }
        }
      });
      if (!affiliate) {
        error = "No partner account found for that email address.";
      }
    } catch (err) {
      console.error(err);
      error = "An error occurred while looking up your account.";
    }
  }

  // Calculate stats if approved
  const totalReferrals = affiliate?.referrals?.length || 0;
  const pendingCommissions = affiliate?.referrals?.filter(r => r.status === 'pending').reduce((sum, r) => sum + Number(r.commission_earned), 0) || 0;
  const paidCommissions = affiliate?.referrals?.filter(r => r.status === 'paid').reduce((sum, r) => sum + Number(r.commission_earned), 0) || 0;

  return (
    <MarketingLayout>
      <div className="relative bg-zinc-50 min-h-[85vh] py-24 overflow-hidden flex items-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <div className={cn(MARKETING_CONTAINER, "relative z-10 w-full")}>
          <div className={cn("mx-auto bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-200 p-8 sm:p-14 relative overflow-hidden", affiliate?.status === 'approved' ? 'max-w-5xl' : 'max-w-xl')}>
            
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-zinc-900 mb-3 tracking-tight">{affiliate?.status === 'approved' ? 'Partner Dashboard' : 'Partner Portal'}</h1>
              {!affiliate && <p className="text-zinc-500">Enter your partner email to access your dashboard and referral link.</p>}
            </div>

            {(!affiliate || affiliate.status !== 'approved') && (
              <form action="/affiliates/status" method="GET" className="mb-8 max-w-lg mx-auto">
                <div className="flex gap-3">
                  <Input 
                    name="email"
                    type="email" 
                    placeholder="partner@example.com" 
                    defaultValue={email || ''}
                    required
                    className="h-12 bg-zinc-50"
                  />
                  <Button type="submit" className="h-12 px-6 bg-zinc-900 text-white hover:bg-zinc-800">
                    <Search className="w-4 h-4 mr-2" /> Access
                  </Button>
                </div>
              </form>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-start gap-3 max-w-lg mx-auto">
                <XCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {affiliate && affiliate.status === 'pending' && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-left max-w-lg mx-auto">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <h3 className="font-semibold text-zinc-900">Application Under Review</h3>
                </div>
                <p className="text-zinc-600 text-sm mt-2 ml-11">
                  Your application is currently pending review by our team. We will notify you once approved!
                </p>
              </div>
            )}

            {affiliate && affiliate.status === 'rejected' && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-left max-w-lg mx-auto">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-zinc-900">Application Declined</h3>
                </div>
                <p className="text-zinc-600 text-sm mt-2 ml-11">
                  Unfortunately, we are not able to accept your application into the partner program at this time.
                </p>
              </div>
            )}

            {affiliate && affiliate.status === 'approved' && (
              <div className="space-y-8 text-left animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900">Welcome back, {affiliate.name.split(' ')[0]}</h2>
                    <p className="text-zinc-500 mt-1">Here's an overview of your partner performance.</p>
                  </div>
                  <Link href="/affiliates/status" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                    Log out
                  </Link>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-zinc-600 text-sm">Total Referrals</h3>
                    </div>
                    <div className="text-3xl font-bold text-zinc-900">{totalReferrals}</div>
                  </div>
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-zinc-600 text-sm">Pending Commissions</h3>
                    </div>
                    <div className="text-3xl font-bold text-zinc-900 tabular-nums">${pendingCommissions.toFixed(2)}</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-emerald-800 text-sm">Total Earned</h3>
                    </div>
                    <div className="text-3xl font-bold text-emerald-900 tabular-nums">${paidCommissions.toFixed(2)}</div>
                  </div>
                </div>

                <CopyReferralLink referralCode={affiliate.referral_code} />

                {/* Referrals Ledger */}
                <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50/50">
                    <h3 className="font-bold text-zinc-900">Recent Referrals</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-zinc-50 text-zinc-500">
                        <tr>
                          <th className="px-6 py-4 font-medium">Date</th>
                          <th className="px-6 py-4 font-medium">Referred Business</th>
                          <th className="px-6 py-4 font-medium">Commission</th>
                          <th className="px-6 py-4 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {affiliate.referrals.map((ref) => (
                          <tr key={ref.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-6 py-4 text-zinc-600">
                              {new Date(ref.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 font-medium text-zinc-900">
                              {ref.businesses?.name || 'Unknown Business'}
                            </td>
                            <td className="px-6 py-4 font-medium text-emerald-700 tabular-nums">
                              ${Number(ref.commission_earned).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                ref.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {ref.status.toUpperCase()}
                              </span>
                            </td>
                          </tr>
                        ))}
                        
                        {affiliate.referrals.length === 0 && (
                          <tr>
                            <td colSpan="4" className="px-6 py-12 text-center text-zinc-500">
                              You haven't referred anyone yet. Share your link to get started!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {!affiliate && !error && !email && (
              <div className="text-center text-sm text-zinc-400 mt-12">
                Don't have an account? <Link href="/affiliates" className="text-zinc-900 font-medium hover:underline">Apply here</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
