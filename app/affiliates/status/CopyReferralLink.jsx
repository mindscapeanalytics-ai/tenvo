'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

export default function CopyReferralLink({ referralCode }) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  // Using origin so it dynamically adapts to dev or prod domain
  const referralUrl = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode}` : `https://tenvo.com/register?ref=${referralCode}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="mt-6 mb-8 text-left bg-zinc-50 border border-emerald-200 p-6 rounded-2xl">
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mb-6">
        Application Approved
      </div>
      
      <div className="space-y-6">
        {/* Referral Code */}
        <div>
          <h3 className="font-semibold text-zinc-900 mb-1 text-sm">Your Referral Code</h3>
          <p className="text-xs text-zinc-500 mb-2">Customers can enter this code manually during checkout.</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-zinc-900 tracking-wide truncate select-all">
              {referralCode}
            </div>
            <Button 
              onClick={handleCopyCode}
              variant="outline"
              className="rounded-xl h-[46px] sm:w-[100px] bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200 flex items-center justify-center transition-all"
            >
              {copiedCode ? (
                <span className="flex items-center text-emerald-600"><Check className="w-4 h-4 mr-1.5" /> Copied</span>
              ) : (
                <span className="flex items-center"><Copy className="w-4 h-4 mr-1.5" /> Copy</span>
              )}
            </Button>
          </div>
        </div>

        {/* Tracking Link */}
        <div>
          <h3 className="font-semibold text-zinc-900 mb-1 text-sm">Your Tracking Link</h3>
          <p className="text-xs text-zinc-500 mb-2">Share this link to automatically track your commissions without manual entry.</p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono text-zinc-600 truncate select-all">
              {referralUrl}
            </div>
            <Button 
              onClick={handleCopyUrl}
              variant="outline"
              className="rounded-xl h-[46px] sm:w-[100px] bg-emerald-600 hover:bg-emerald-700 text-white border-transparent flex items-center justify-center transition-all"
            >
              {copiedUrl ? (
                <span className="flex items-center"><Check className="w-4 h-4 mr-1.5" /> Copied</span>
              ) : (
                <span className="flex items-center"><Copy className="w-4 h-4 mr-1.5" /> Copy</span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
