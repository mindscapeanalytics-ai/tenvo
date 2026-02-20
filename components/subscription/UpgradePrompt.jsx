'use client';

import React from 'react';
import { Crown, Sparkles, ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PLAN_INFO = {
    basic: { name: 'Basic', next: 'standard', nextName: 'Standard', color: 'from-gray-500 to-gray-600' },
    standard: { name: 'Standard', next: 'premium', nextName: 'Premium', color: 'from-blue-500 to-blue-600' },
    premium: { name: 'Premium', next: 'enterprise', nextName: 'Enterprise', color: 'from-amber-500 to-amber-600' },
    enterprise: { name: 'Enterprise', next: null, nextName: null, color: 'from-purple-500 to-purple-600' },
};

export function UpgradePrompt({ currentPlan = 'basic', featureName = '', requiredPlan = 'standard', onUpgrade }) {
    const planInfo = PLAN_INFO[currentPlan] || PLAN_INFO.basic;
    const requiredInfo = PLAN_INFO[requiredPlan] || PLAN_INFO.standard;

    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className={cn(
                'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5 shadow-lg',
                requiredInfo.color, 'shadow-gray-200'
            )}>
                <Lock className="w-7 h-7 text-white" />
            </div>

            <h3 className="text-xl font-black text-gray-900 mb-2">
                {featureName || 'This feature'} requires the {requiredInfo.name} plan
            </h3>

            <p className="text-sm text-gray-500 max-w-md mb-6">
                Upgrade to {requiredInfo.name} to unlock {featureName || 'this feature'} and more powerful tools for your business.
            </p>

            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold">
                    <Crown className="w-3.5 h-3.5" />
                    {planInfo.name}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300" />
                <div className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold bg-gradient-to-r',
                    requiredInfo.color
                )}>
                    <Sparkles className="w-3.5 h-3.5" />
                    {requiredInfo.name}
                </div>
            </div>

            <Button
                onClick={onUpgrade}
                className={cn(
                    'px-6 py-3 rounded-xl font-bold shadow-lg bg-gradient-to-r',
                    requiredInfo.color
                )}
            >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to {requiredInfo.name}
            </Button>
        </div>
    );
}
