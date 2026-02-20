'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, ChevronDown, Check, Plus, Loader2, Briefcase,
    Store, UtensilsCrossed, Factory, Truck, ShoppingCart, Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBusiness } from '@/lib/context/BusinessContext';
import { useAuth } from '@/lib/context/AuthContext';
import { getJoinedBusinessesAction } from '@/lib/actions/basic/business';

const DOMAIN_ICONS = {
    'retail-shop': Store,
    'restaurant-cafe': UtensilsCrossed,
    'supermarket': ShoppingCart,
    'grocery': ShoppingCart,
    'wholesale': Truck,
    'manufacturing': Factory,
    'default': Building2,
};

const DOMAIN_COLORS = {
    'retail-shop': 'bg-blue-500',
    'restaurant-cafe': 'bg-orange-500',
    'supermarket': 'bg-emerald-500',
    'grocery': 'bg-green-500',
    'wholesale': 'bg-purple-500',
    'manufacturing': 'bg-slate-600',
    'default': 'bg-indigo-500',
};

export function BusinessSwitcher({ isCollapsed = false }) {
    const router = useRouter();
    const { business, switchBusinessByDomain } = useBusiness();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [switching, setSwitching] = useState(null);

    const fetchBusinesses = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const result = await getJoinedBusinessesAction(user.id);
            if (result.success) {
                setBusinesses(result.businesses || []);
            }
        } catch (err) {
            console.error('Failed to fetch businesses:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        if (isOpen && businesses.length === 0) {
            fetchBusinesses();
        }
    }, [isOpen, fetchBusinesses, businesses.length]);

    const handleSwitch = async (biz) => {
        if (biz.id === business?.id) {
            setIsOpen(false);
            return;
        }
        setSwitching(biz.id);
        try {
            const result = await switchBusinessByDomain(biz.domain);
            if (result.success) {
                router.push(`/business/${biz.domain}?tab=dashboard`);
            }
        } finally {
            setSwitching(null);
            setIsOpen(false);
        }
    };

    const getDomainIcon = (domain) => DOMAIN_ICONS[domain] || DOMAIN_ICONS.default;
    const getDomainColor = (domain) => DOMAIN_COLORS[domain] || DOMAIN_COLORS.default;
    const ActiveIcon = getDomainIcon(business?.domain);

    if (isCollapsed) {
        return (
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors mx-auto"
                title={business?.name || 'Switch Business'}
            >
                <ActiveIcon className="w-5 h-5 text-white" />
                {businesses.length > 1 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-[10px] font-bold rounded-full flex items-center justify-center text-gray-900">
                        {businesses.length}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition-colors text-left group"
            >
                <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm',
                    getDomainColor(business?.domain)
                )}>
                    <ActiveIcon className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{business?.name || 'No Business'}</p>
                    <p className="text-[11px] text-white/50 truncate capitalize">{business?.domain?.replace(/-/g, ' ') || 'Select'}</p>
                </div>
                <ChevronDown className={cn(
                    'w-4 h-4 text-white/40 transition-transform flex-shrink-0',
                    isOpen && 'rotate-180'
                )} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: -8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                        >
                            <div className="p-2 max-h-72 overflow-y-auto">
                                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Your Businesses
                                </p>

                                {loading ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                    </div>
                                ) : businesses.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">No businesses found</p>
                                ) : (
                                    businesses.map((biz) => {
                                        const Icon = getDomainIcon(biz.domain);
                                        const isActive = biz.id === business?.id;
                                        const isSwitching = switching === biz.id;

                                        return (
                                            <button
                                                key={biz.id}
                                                onClick={() => handleSwitch(biz)}
                                                disabled={isSwitching}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left',
                                                    isActive
                                                        ? 'bg-indigo-50 border border-indigo-100'
                                                        : 'hover:bg-gray-50'
                                                )}
                                            >
                                                <div className={cn(
                                                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                                    getDomainColor(biz.domain)
                                                )}>
                                                    <Icon className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        'text-sm font-semibold truncate',
                                                        isActive ? 'text-indigo-700' : 'text-gray-800'
                                                    )}>
                                                        {biz.name}
                                                    </p>
                                                    <p className="text-[11px] text-gray-400 truncate capitalize">
                                                        {biz.domain?.replace(/-/g, ' ')} · {biz.user_role}
                                                    </p>
                                                </div>
                                                {isSwitching ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500 flex-shrink-0" />
                                                ) : isActive ? (
                                                    <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                ) : null}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            <div className="border-t border-gray-100 p-2">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        router.push('/register');
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
                                        <Plus className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">Add New Business</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
