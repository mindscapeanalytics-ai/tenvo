'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Star, Gift, Trophy, TrendingUp, CreditCard, Clock,
    ChevronRight, Sparkles, Crown, Shield, Zap, Award,
    ShoppingBag, ArrowUpRight, ArrowDownRight, Percent, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/utils/formatDisplayDate';
import { BRAND_PRIMARY, BRAND_PRIMARY_LIGHT } from '@/lib/theme/brandTokens';
import { getCustomersAction } from '@/lib/actions/basic/customer';
import { getLoyaltyProgramsAction, getLoyaltyBalanceAction } from '@/lib/actions/standard/loyalty';
import { useBusiness } from '@/lib/context/BusinessContext';

const TIERS = [
    { id: 'bronze', name: 'Bronze', minPoints: 0, icon: Shield, color: 'from-orange-700 to-amber-600', textColor: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
    { id: 'silver', name: 'Silver', minPoints: 500, icon: Star, color: 'from-gray-500 to-slate-400', textColor: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
    { id: 'gold', name: 'Gold', minPoints: 2000, icon: Crown, color: 'from-yellow-500 to-amber-400', textColor: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
    { id: 'platinum', name: 'Platinum', minPoints: 5000, icon: Sparkles, color: 'from-brand-primary to-brand-primary-dark', textColor: 'text-brand-primary', bgColor: 'bg-brand-50', borderColor: 'border-brand-100' },
];

const DEMO_REWARDS = [
    { id: 'rw1', name: '10% Off Next Order', points: 200, icon: Percent, category: 'discount' },
    { id: 'rw2', name: 'Free Delivery', points: 150, icon: ShoppingBag, category: 'perk' },
    { id: 'rw3', name: 'Rs. 500 Gift Card', points: 500, icon: Gift, category: 'gift' },
    { id: 'rw4', name: 'Priority Support', points: 300, icon: Zap, category: 'perk' },
    { id: 'rw5', name: 'Rs. 1000 Cashback', points: 1000, icon: CreditCard, category: 'cashback' },
    { id: 'rw6', name: 'Exclusive Access', points: 2000, icon: Crown, category: 'vip' },
];

const DEMO_TRANSACTIONS = [
    { id: 't1', type: 'earn', points: 120, description: 'Purchase -- Invoice #4521', date: '2026-02-20', total: 6000 },
    { id: 't2', type: 'earn', points: 85, description: 'Purchase -- Invoice #4518', date: '2026-02-18', total: 4250 },
    { id: 't3', type: 'redeem', points: -200, description: 'Redeemed -- 10% Off Coupon', date: '2026-02-15' },
    { id: 't4', type: 'earn', points: 250, description: 'Purchase -- Invoice #4501', date: '2026-02-10', total: 12500 },
    { id: 't5', type: 'earn', points: 60, description: 'Referral Bonus -- Ahmed K.', date: '2026-02-08' },
    { id: 't6', type: 'redeem', points: -150, description: 'Redeemed -- Free Delivery', date: '2026-02-05' },
    { id: 't7', type: 'earn', points: 180, description: 'Purchase -- Invoice #4490', date: '2026-02-01', total: 9000 },
];

export function CustomerLoyaltyPortal({ businessId, currency = 'Rs.' }) {
    const { business, currencySymbol } = useBusiness();
    const effectiveBusinessId = businessId || business?.id;
    const activeCurrency = currencySymbol || currency || 'Rs.';

    const [selectedTab, setSelectedTab] = useState('overview'); // overview | rewards | history
    const [customers, setCustomers] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedProgramId, setSelectedProgramId] = useState('');
    const [loading, setLoading] = useState(true);
    const [balanceLoading, setBalanceLoading] = useState(false);

    // Active customer loyalty stats
    const [totalPoints, setTotalPoints] = useState(0);
    const [lifetimePoints, setLifetimePoints] = useState(0);
    const [redeemed, setRedeemed] = useState(0);
    const [transactions, setTransactions] = useState([]);

    // Load initial list of customers and programs
    useEffect(() => {
        let isMounted = true;
        async function init() {
            if (!effectiveBusinessId) return;
            try {
                const [custRes, progRes] = await Promise.all([
                    getCustomersAction(effectiveBusinessId),
                    getLoyaltyProgramsAction(effectiveBusinessId)
                ]);
                if (!isMounted) return;
                
                const loadedCustomers = custRes.success ? custRes.customers || [] : [];
                const loadedPrograms = progRes.success ? progRes.programs || [] : [];
                
                setCustomers(loadedCustomers);
                setPrograms(loadedPrograms);
                
                if (loadedPrograms.length > 0) {
                    setSelectedProgramId(loadedPrograms[0].id);
                }
                if (loadedCustomers.length > 0) {
                    setSelectedCustomerId(loadedCustomers[0].id);
                }
            } catch (err) {
                console.error('Failed to initialize loyalty portal:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        init();
        return () => { isMounted = false; };
    }, [effectiveBusinessId]);

    // Fetch balance & transactions whenever customer or program changes
    useEffect(() => {
        let isMounted = true;
        async function fetchBalance() {
            if (!effectiveBusinessId || !selectedCustomerId || !selectedProgramId) {
                setTotalPoints(0);
                setLifetimePoints(0);
                setRedeemed(0);
                setTransactions([]);
                return;
            }
            setBalanceLoading(true);
            try {
                const res = await getLoyaltyBalanceAction(effectiveBusinessId, selectedCustomerId, selectedProgramId);
                if (!isMounted) return;
                if (res.success) {
                    setTotalPoints(res.balance || 0);
                    setLifetimePoints(res.lifetimePoints || 0);
                    setRedeemed(res.redeemed || 0);
                    setTransactions(res.history || []);
                } else {
                    setTotalPoints(0);
                    setLifetimePoints(0);
                    setRedeemed(0);
                    setTransactions([]);
                }
            } catch (err) {
                console.error('Failed to load loyalty balance:', err);
            } finally {
                if (isMounted) setBalanceLoading(false);
            }
        }
        fetchBalance();
        return () => { isMounted = false; };
    }, [effectiveBusinessId, selectedCustomerId, selectedProgramId]);

    const thisMonthEarned = useMemo(() => {
        const now = new Date();
        return transactions
            .filter(tx => {
                if (!tx.created_at || (tx.type !== 'earn' && tx.type !== 'adjust')) return false;
                const d = new Date(tx.created_at);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            })
            .reduce((sum, tx) => sum + tx.points, 0);
    }, [transactions]);

    const currentTier = useMemo(() => {
        return [...TIERS].reverse().find(t => lifetimePoints >= t.minPoints) || TIERS[0];
    }, [lifetimePoints]);

    const nextTier = useMemo(() => {
        const idx = TIERS.findIndex(t => t.id === currentTier.id);
        return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
    }, [currentTier]);

    const progressToNext = nextTier
        ? Math.min(100, ((lifetimePoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100)
        : 100;

    const TierIcon = currentTier.icon;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-xs font-semibold text-gray-500 uppercase tracking-widest">Loading CRM Ledger...</p>
            </div>
        );
    }

    if (programs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <Trophy className="w-12 h-12 text-amber-400 opacity-60" />
                <div>
                    <h3 className="text-sm font-bold text-gray-900">No Active Loyalty Program</h3>
                    <p className="text-xs text-gray-500 mt-1">Create a loyalty program in the Loyalty Manager below to enable customer points tracking.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Customer Selector Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-gray-900">Customer Loyalty Ledger</h3>
                    <p className="text-[11px] text-gray-500">Select a customer to view their active tier, points balance, and loyalty history.</p>
                </div>
                <div className="flex items-center gap-2">
                    {customers.length === 0 ? (
                        <span className="text-[11px] font-semibold text-gray-400">No customers found</span>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <select 
                                value={selectedCustomerId}
                                onChange={e => setSelectedCustomerId(e.target.value)}
                                className="px-3 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer"
                            >
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Hero Card -- Points Balance */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-5 text-white shadow-xl"
                style={{ background: `linear-gradient(135deg, #C49C3B 0%, ${BRAND_PRIMARY} 50%, ${BRAND_PRIMARY_LIGHT} 100%)` }}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Left Column: Points & Progress */}
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Available Points</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <h2 className="text-4xl font-bold tracking-tight">{totalPoints.toLocaleString()}</h2>
                                    <span className="text-[11px] text-white/60">
                                        / {lifetimePoints.toLocaleString()} lifetime
                                    </span>
                                </div>
                            </div>
                            <div className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-sm'
                            )}>
                                <TierIcon className="w-4 h-4 text-amber-300" />
                                <span className="text-xs font-bold uppercase tracking-wider">{currentTier.name} Tier</span>
                            </div>
                        </div>

                        {/* Tier Progress */}
                        {nextTier && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] text-white/60 font-semibold uppercase tracking-wider">
                                    <span>{currentTier.name}</span>
                                    <span>{nextTier.minPoints - lifetimePoints} pts to {nextTier.name}</span>
                                </div>
                                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressToNext}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full bg-white/80 rounded-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Quick Stats */}
                    <div className="grid grid-cols-3 gap-2.5 md:w-[360px] shrink-0">
                        {[
                            { label: 'This Month', value: `+${thisMonthEarned}`, icon: TrendingUp, sub: 'Earned' },
                            { label: 'Redeemed', value: redeemed, icon: Gift, sub: 'All time' },
                            { label: 'Transactions', value: transactions.length, icon: CreditCard, sub: 'Recent' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/5 flex flex-col justify-between">
                                <div className="flex items-center gap-1.5">
                                    <stat.icon className="w-3.5 h-3.5 text-white/60" />
                                    <span className="text-[9px] text-white/60 font-bold uppercase tracking-wider truncate">{stat.label}</span>
                                </div>
                                <div className="mt-2">
                                    <p className="text-base font-bold tracking-tight">{stat.value}</p>
                                    <p className="text-[9px] text-white/40 mt-0.5">{stat.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                {[
                    { key: 'overview', label: 'Overview', icon: Trophy },
                    { key: 'rewards', label: 'Rewards Catalog', icon: Gift },
                    { key: 'history', label: 'Transaction History', icon: Clock },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setSelectedTab(tab.key)}
                        className={cn(
                            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all',
                            selectedTab === tab.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview */}
            {selectedTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tier Progression */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold">Tier Progression</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {TIERS.map((tier, idx) => {
                                    const isActive = tier.id === currentTier.id;
                                    const isAchieved = lifetimePoints >= tier.minPoints;
                                    return (
                                        <div
                                            key={tier.id}
                                            className={cn(
                                                'flex items-center gap-3 p-3 rounded-xl transition-all',
                                                isActive ? `${tier.bgColor} ${tier.borderColor} border-2` : isAchieved ? 'bg-gray-50' : 'opacity-50'
                                            )}
                                        >
                                            <div className={cn(
                                                'w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br',
                                                tier.color
                                            )}>
                                                <tier.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn('text-sm font-bold', isActive ? tier.textColor : 'text-gray-700')}>
                                                        {tier.name}
                                                    </span>
                                                    {isActive && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-white rounded-full text-brand-primary">
                                                            CURRENT
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {tier.minPoints === 0 ? 'Starting tier' : `${tier.minPoints.toLocaleString()} lifetime pts`}
                                                </p>
                                            </div>
                                            {isAchieved && (
                                                <Award className={cn('w-5 h-5', isActive ? tier.textColor : 'text-gray-300')} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="border-none shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {transactions.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-4 text-center">No recent points activity</p>
                                ) : (
                                    transactions.slice(0, 5).map(tx => (
                                        <div key={tx.id}
                                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            <div className={cn(
                                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                                (tx.type === 'earn' || tx.type === 'adjust') ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                                            )}>
                                                {(tx.type === 'earn' || tx.type === 'adjust')
                                                    ? <ArrowUpRight className="w-4 h-4" />
                                                    : <ArrowDownRight className="w-4 h-4" />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-gray-800 truncate">
                                                    {tx.description || (tx.type === 'earn' ? 'Points Earned' : tx.type === 'redeem' ? 'Points Redeemed' : 'Points Adjustment')}
                                                </p>
                                                <p className="text-[10px] text-gray-400">{formatDisplayDate(tx.created_at || tx.date)}</p>
                                            </div>
                                            <span className={cn(
                                                'text-sm font-semibold',
                                                (tx.type === 'earn' || tx.type === 'adjust') ? 'text-emerald-600' : 'text-orange-600'
                                            )}>
                                                {tx.points > 0 ? '+' : ''}{tx.points}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Rewards Catalog */}
            {selectedTab === 'rewards' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DEMO_REWARDS.map(reward => {
                        const canRedeem = totalPoints >= reward.points;
                        return (
                            <motion.div
                                key={reward.id}
                                whileHover={{ y: -4 }}
                                className={cn(
                                    'group p-4 rounded-2xl border-2 transition-all',
                                    canRedeem
                                        ? 'bg-white border-gray-100 hover:border-brand-100 hover:shadow-lg'
                                        : 'bg-gray-50 border-gray-100 opacity-60'
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <div className={cn(
                                        'w-12 h-12 rounded-xl flex items-center justify-center',
                                        canRedeem ? 'bg-brand-50 text-brand-primary' : 'bg-gray-100 text-gray-400'
                                    )}>
                                        <reward.icon className="w-6 h-6" />
                                    </div>
                                    <span className={cn(
                                        'text-xs font-semibold px-2.5 py-1 rounded-full',
                                        canRedeem ? 'bg-brand-100 text-brand-primary-dark' : 'bg-gray-200 text-gray-500'
                                    )}>
                                        {reward.points} pts
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 mt-3">{reward.name}</h4>
                                <p className="text-xs text-gray-400 mt-1 capitalize">{reward.category}</p>
                                <Button
                                    disabled={!canRedeem}
                                    className={cn(
                                        'w-full mt-4 h-9 text-xs font-bold rounded-xl',
                                        canRedeem
                                            ? 'bg-brand-primary hover:bg-brand-primary-dark'
                                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    )}
                                >
                                    {canRedeem ? 'Redeem Now' : `Need ${reward.points - totalPoints} more pts`}
                                </Button>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Transaction History */}
            {selectedTab === 'history' && (
                <Card className="border-none shadow-sm">
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <p className="text-xs text-gray-400 py-8 text-center">No points transactions found</p>
                            ) : (
                                transactions.map(tx => (
                                    <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                                        <div className={cn(
                                            'w-10 h-10 rounded-xl flex items-center justify-center',
                                            (tx.type === 'earn' || tx.type === 'adjust') ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                                        )}>
                                            {(tx.type === 'earn' || tx.type === 'adjust')
                                                ? <ArrowUpRight className="w-5 h-5" />
                                                : <ArrowDownRight className="w-5 h-5" />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800">
                                                {tx.description || (tx.type === 'earn' ? 'Points Earned' : tx.type === 'redeem' ? 'Points Redeemed' : 'Points Adjustment')}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-0.5">{formatDisplayDate(tx.created_at || tx.date)}</p>
                                        </div>
                                        {tx.total && (
                                            <span className="text-xs text-gray-400 font-medium">{activeCurrency} {tx.total.toLocaleString()}</span>
                                        )}
                                        <span className={cn(
                                            'text-sm font-semibold min-w-[60px] text-right',
                                            (tx.type === 'earn' || tx.type === 'adjust') ? 'text-emerald-600' : 'text-orange-600'
                                        )}>
                                            {tx.points > 0 ? '+' : ''}{tx.points}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

