'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

export default function CopyReferralLink({ referralCode }) {
  const [copied, setCopied] = useState(false);
  // Using origin so it dynamically adapts to dev or prod domain
  const referralUrl = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode}` : `https://tenvo.com/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-6 mb-8 text-left bg-zinc-50 border border-emerald-200 p-6 rounded-2xl">
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 mb-4">
        Application Approved
      </div>
      <h3 className="font-semibold text-zinc-900 mb-2 text-lg">Your Unique Referral Link</h3>
      <p className="text-sm text-zinc-600 mb-4">Share this link to automatically track your commissions.</p>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono text-zinc-700 truncate select-all">
          {referralUrl}
        </div>
        <Button 
          onClick={handleCopy}
          variant="outline"
          className="rounded-xl h-[46px] sm:w-[100px] bg-emerald-600 hover:bg-emerald-700 text-white border-transparent flex items-center justify-center transition-all"
        >
          {copied ? (
            <span className="flex items-center"><Check className="w-4 h-4 mr-1.5" /> Copied</span>
          ) : (
            <span className="flex items-center"><Copy className="w-4 h-4 mr-1.5" /> Copy</span>
          )}
        </Button>
      </div>
    </div>
  );
}
