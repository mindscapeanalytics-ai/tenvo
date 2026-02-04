'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { businessAPI } from '@/lib/api/business';
import {
  Building2,
  Store,
  Plus,
  Settings,
  BarChart3,
  Package,
  Users,
  Eye,
  Loader2,
  Factory,
  Globe,
  Briefcase,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function MultiBusinessPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBusinesses() {
      if (!user) return;
      try {
        const fetched = await businessAPI.getJoinedBusinesses(user.id);
        setBusinesses(fetched || []);
      } catch (error) {
        console.error('Failed to load businesses:', error);
        toast.error('Could not load your businesses');
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchBusinesses();
    } else if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleEnterBusiness = (domain) => {
    router.push(`/business/${domain}`);
  };

  if (loading || authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-wine" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Syncing Cloud Entities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-20">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg transform -rotate-3"
                style={{ background: 'linear-gradient(135deg, #8B1538 0%, #A41941 100%)' }}
              >
                T
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2 uppercase">
                  Enterprise Hub
                  <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300" />
                  <span className="hidden sm:inline text-xs font-bold text-gray-400 lowercase tracking-normal">Switch Entity</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="text-xs font-black uppercase tracking-widest hover:bg-gray-50 rounded-xl"
              >
                Public Home
              </Button>
              <div className="w-px h-6 bg-gray-100 mx-2" />
              <Button
                onClick={() => router.push('/register')}
                className="bg-wine hover:bg-wine/90 text-white font-black rounded-xl px-6 py-5 shadow-lg shadow-wine/20 transition-all active:scale-95 text-xs uppercase tracking-widest"
              >
                <Plus className="w-4 h-4 mr-2" />
                Launch New Entity
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-wine/5 border border-wine/10 text-wine text-[10px] font-black uppercase tracking-widest mb-4">
            <ShieldCheck className="w-3 h-3" />
            Global Executive Controls
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter">
            Choose Your <span className="text-wine">Operational Domain</span>
          </h2>
          <p className="text-gray-500 font-medium max-w-2xl">
            You have access to <strong>{businesses.length}</strong> active legal entities. Every workspace is isolated with dedicated compliance, inventory, and financial ledger data.
          </p>
        </div>

        {/* Businesses Grid */}
        <div className="mt-12">
          {businesses.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">No entities found</h3>
              <p className="text-gray-500 font-medium mb-8 max-w-xs mx-auto">Click below to initialize your first enterprise business domain.</p>
              <Button
                onClick={() => router.push('/register')}
                className="bg-wine hover:bg-wine/90 text-white font-black h-14 px-10 rounded-2xl shadow-xl shadow-wine/20"
              >
                <Plus className="w-5 h-5 mr-3" />
                Launch First Entity
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {businesses.map((biz, idx) => (
                <div
                  key={biz.id}
                  className="group bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-wine/20 transition-all duration-500 overflow-hidden relative animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  {/* Decorative Gradient Background */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-wine/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-wine/10 transition-colors" />

                  <div className="p-8 pb-6 relative">
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-wine/5 rounded-2xl flex items-center justify-center text-wine shadow-inner group-hover:scale-110 transition-transform duration-500">
                          {biz.category === 'retail-shop' ? <Store className="w-7 h-7" /> :
                            biz.category === 'manufacturing' ? <Factory className="w-7 h-7" /> :
                              biz.category === 'ecommerce' ? <Globe className="w-7 h-7" /> :
                                <Briefcase className="w-7 h-7" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-gray-900 text-lg leading-tight group-hover:text-wine transition-colors">{biz.business_name}</h3>
                          <p className="text-[10px] text-wine font-black uppercase tracking-widest mt-1.5 opacity-70">
                            {biz.domain?.replace(/-/g, ' ')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100/50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Global Base</p>
                        <p className="font-bold text-gray-800 tracking-tight text-sm truncate">{biz.city || 'Karachi, PK'}</p>
                      </div>
                      <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100/50">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Authority</p>
                        <p className="font-bold text-gray-800 tracking-tight text-sm truncate uppercase">{biz.user_role || 'Executive'}</p>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleEnterBusiness(biz.domain)}
                      className="w-full h-14 bg-gray-900 hover:bg-wine text-white rounded-2xl transition-all duration-300 font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] group/btn"
                    >
                      Enter Workplace
                      <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>

                  {/* Status Footer */}
                  <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Active Sync</span>
                    </div>
                    <div className="flex items-center gap-1.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                      <ShieldCheck className="w-3.5 h-3.5 text-wine" />
                      <span className="text-[10px] font-black text-gray-400 group-hover:text-wine uppercase tracking-widest">Verified Vault</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Overview Banner */}
        <div className="mt-20 relative overflow-hidden bg-white rounded-[2.5rem] border border-gray-100 p-8 sm:p-12 shadow-xl shadow-gray-200/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-wine/5 rounded-full -mr-48 -mt-48 blur-3xl opacity-50" />
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="w-12 h-12 bg-wine rounded-2xl flex items-center justify-center text-white shadow-lg shadow-wine/20">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
                One Platform.<br />
                <span className="text-wine">Infinite Business Potential.</span>
              </h2>
              <p className="text-gray-500 font-medium">
                The Tenvo Enterprise API ensures that your inventory, sales, and accounting data remains perfectly isolated per entity while allowing you as an owner to maintain global oversight.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-xl text-xs font-black text-zinc-600 uppercase tracking-widest">
                  <TrendingUp className="w-4 h-4" />
                  Real-time Ledger
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 rounded-xl text-xs font-black text-zinc-600 uppercase tracking-widest">
                  <Zap className="w-4 h-4" />
                  Domain Adaptive UI
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-wine/5 rounded-3xl border border-wine/10 space-y-2">
                <LayoutGrid className="w-6 h-6 text-wine opacity-40" />
                <p className="text-xl font-black text-wine leading-none">Unlimited</p>
                <p className="text-[10px] font-black text-wine/60 uppercase tracking-widest">Domains</p>
              </div>
              <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 space-y-2">
                <Users className="w-6 h-6 text-zinc-400" />
                <p className="text-xl font-black text-zinc-800 leading-none">Unified</p>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Legal Team</p>
              </div>
              <div className="col-span-2 p-6 bg-zinc-900 rounded-3xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-black text-white uppercase tracking-widest">Global Security</p>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  Advanced RLS (Row Level Security) ensures that your financial sensitive data never leaks across business domains.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
