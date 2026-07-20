'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    CheckCircle2, XCircle, Loader2, RefreshCcw, ChevronDown, ChevronRight,
    DollarSign, Users, TrendingUp, Clock, BadgeCheck, Ban, CreditCard
} from 'lucide-react';
import { getPlatformAffiliates, updateAffiliateStatusAction, markReferralPaidAction } from '@/lib/actions/admin/affiliates';
import toast from 'react-hot-toast';

// Status badge helper
function StatusBadge({ status }) {
    const s = status || 'pending';
    const styles = {
        approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        rejected: 'bg-red-100 text-red-800 border-red-200',
        pending: 'bg-amber-100 text-amber-800 border-amber-200',
        paid: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    const icons = {
        approved: <BadgeCheck className="w-3 h-3 mr-1" />,
        rejected: <Ban className="w-3 h-3 mr-1" />,
        pending: <Clock className="w-3 h-3 mr-1" />,
        paid: <CreditCard className="w-3 h-3 mr-1" />,
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[s] || styles.pending}`}>
            {icons[s] || icons.pending}
            {s.charAt(0).toUpperCase() + s.slice(1)}
        </span>
    );
}

// Summary KPI bar at the top
function AffiliateSummaryBar({ affiliates }) {
    const total = affiliates.length;
    const approved = affiliates.filter(a => a.status === 'approved').length;
    const pending = affiliates.filter(a => a.status === 'pending').length;
    const totalEarnings = affiliates.reduce((sum, a) => sum + Number(a.total_earnings || 0), 0);
    const totalReferrals = affiliates.reduce((sum, a) => sum + (a._count?.referrals || 0), 0);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
                { label: 'Total Partners', value: total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Approved', value: approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Pending Review', value: pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Total Commissions', value: `$${totalEarnings.toFixed(2)}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">{label}</p>
                        <p className="text-lg font-bold text-gray-900">{value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Expandable referral ledger for a single affiliate
function ReferralLedger({ referrals, affiliateId, onPaid }) {
    const [paying, setPaying] = useState(null);

    const handleMarkPaid = async (referralId) => {
        setPaying(referralId);
        try {
            const res = await markReferralPaidAction(referralId);
            if (res.success) {
                toast.success('Commission marked as paid');
                onPaid();
            } else {
                toast.error(res.error || 'Failed to mark as paid');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setPaying(null);
        }
    };

    if (!referrals || referrals.length === 0) {
        return (
            <div className="px-6 py-4 text-sm text-gray-400 italic bg-gray-50/50">
                No referrals recorded yet.
            </div>
        );
    }

    return (
        <div className="border-t border-gray-100 bg-gray-50/50">
            <div className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Referral Commission Ledger
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-xs text-gray-500">
                        <th className="px-6 py-2 text-left font-medium">Business</th>
                        <th className="px-6 py-2 text-left font-medium">Plan</th>
                        <th className="px-6 py-2 text-left font-medium">Commission</th>
                        <th className="px-6 py-2 text-left font-medium">Date</th>
                        <th className="px-6 py-2 text-left font-medium">Status</th>
                        <th className="px-6 py-2 text-right font-medium">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {referrals.map((ref) => (
                        <tr key={ref.id} className="hover:bg-white transition-colors">
                            <td className="px-6 py-3 font-medium text-gray-800">
                                {ref.businesses?.business_name || 'Unknown Business'}
                                {ref.businesses?.domain && (
                                    <span className="block text-xs text-gray-400 font-normal">{ref.businesses.domain}</span>
                                )}
                            </td>
                            <td className="px-6 py-3 text-gray-500 capitalize">
                                {ref.businesses?.plan_tier || '—'}
                            </td>
                            <td className="px-6 py-3 font-semibold text-gray-900">
                                ${Number(ref.commission_earned || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-3 text-gray-500">
                                {new Date(ref.created_at).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric'
                                })}
                            </td>
                            <td className="px-6 py-3">
                                <StatusBadge status={ref.status} />
                            </td>
                            <td className="px-6 py-3 text-right">
                                {ref.status === 'pending' ? (
                                    <Button
                                        size="sm"
                                        className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                        onClick={() => handleMarkPaid(ref.id)}
                                        disabled={paying === ref.id}
                                    >
                                        {paying === ref.id
                                            ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            : <CreditCard className="w-3 h-3 mr-1" />}
                                        Mark Paid
                                    </Button>
                                ) : (
                                    <span className="text-xs text-gray-400 font-medium">Paid ✓</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Single affiliate row in the main table
function AffiliateRow({ aff, onRefresh, isUpdating, onUpdateStatus }) {
    const [expanded, setExpanded] = useState(false);

    const pendingCount = (aff.referrals || []).filter(r => r.status === 'pending').length;
    const totalEarned = (aff.referrals || [])
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + Number(r.commission_earned || 0), 0);
    const totalPending = (aff.referrals || [])
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + Number(r.commission_earned || 0), 0);

    return (
        <>
            <tr
                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => setExpanded(v => !v)}
            >
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        {expanded
                            ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        <div>
                            <p className="font-semibold text-gray-900">{aff.name}</p>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">{aff.referral_code}</p>
                        </div>
                    </div>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">{aff.email}</td>
                <td className="px-6 py-4">
                    <StatusBadge status={aff.status} />
                </td>
                <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-gray-800">{aff._count?.referrals || 0}</span>
                    {pendingCount > 0 && (
                        <span className="ml-1.5 text-xs text-amber-600 font-medium">({pendingCount} pending)</span>
                    )}
                </td>
                <td className="px-6 py-4 text-sm">
                    <span className="font-semibold text-gray-700">{Number(aff.commission_rate || 20).toFixed(0)}%</span>
                </td>
                <td className="px-6 py-4 text-sm">
                    <div>
                        <span className="font-bold text-gray-900">${totalEarned.toFixed(2)}</span>
                        {totalPending > 0 && (
                            <span className="block text-xs text-amber-600">${totalPending.toFixed(2)} pending</span>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                    {(aff.status || 'pending') === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8 px-3 text-xs"
                                onClick={() => onUpdateStatus(aff.id, 'approve')}
                                disabled={isUpdating === aff.id}
                            >
                                {isUpdating === aff.id
                                    ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    : <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
                                Approve
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 border-red-200 rounded-lg h-8 px-3 text-xs"
                                onClick={() => onUpdateStatus(aff.id, 'reject')}
                                disabled={isUpdating === aff.id}
                            >
                                {isUpdating === aff.id
                                    ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                                    : <XCircle className="w-3.5 h-3.5 mr-1" />}
                                Reject
                            </Button>
                        </div>
                    )}
                    {(aff.status || 'pending') !== 'pending' && (
                        <span className="text-xs text-gray-400 font-medium">
                            {aff.status === 'approved' ? 'Active' : 'Rejected'}
                        </span>
                    )}
                </td>
            </tr>
            {expanded && (
                <tr>
                    <td colSpan={7} className="p-0 border-0">
                        <ReferralLedger
                            referrals={aff.referrals || []}
                            affiliateId={aff.id}
                            onPaid={onRefresh}
                        />
                    </td>
                </tr>
            )}
        </>
    );
}

export function PlatformAffiliatesPanel() {
    const [affiliates, setAffiliates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(null);
    const [filter, setFilter] = useState('all');

    const loadAffiliates = async () => {
        setIsLoading(true);
        try {
            const res = await getPlatformAffiliates();
            if (res.success) {
                setAffiliates(res.data);
            } else {
                toast.error(res.error || 'Failed to load affiliates');
            }
        } catch {
            toast.error('An error occurred loading affiliate data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadAffiliates(); }, []);

    const handleUpdateStatus = async (id, action) => {
        setIsUpdating(id);
        try {
            const res = await updateAffiliateStatusAction(id, action);
            if (res.success) {
                toast.success(`Partner ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
                loadAffiliates();
            } else {
                toast.error(res.error || 'Failed to update status');
            }
        } catch {
            toast.error('An error occurred');
        } finally {
            setIsUpdating(null);
        }
    };

    const filteredAffiliates = affiliates.filter(a => {
        if (filter === 'all') return true;
        return (a.status || 'pending') === filter;
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <AffiliateSummaryBar affiliates={affiliates} />

            <Card className="border border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                    <div>
                        <CardTitle className="text-lg font-bold">Partner Applications</CardTitle>
                        <CardDescription className="mt-0.5">
                            Click a row to expand referral commission details. Mark individual commissions as paid after processing payouts.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Filter tabs */}
                        <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
                            {['all', 'pending', 'approved', 'rejected'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                                        filter === f
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={loadAffiliates} className="rounded-xl text-xs">
                            <RefreshCcw className="w-3.5 h-3.5 mr-1.5" /> Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500">
                                <tr>
                                    <th className="px-6 py-3.5 font-medium text-xs uppercase tracking-wider">Partner</th>
                                    <th className="px-6 py-3.5 font-medium text-xs uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3.5 font-medium text-xs uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3.5 font-medium text-xs uppercase tracking-wider text-center">Referrals</th>
                                    <th className="px-6 py-3.5 font-medium text-xs uppercase tracking-wider">Rate</th>
                                    <th className="px-6 py-3.5 font-medium text-xs uppercase tracking-wider">Earned</th>
                                    <th className="px-6 py-3.5 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAffiliates.map((aff) => (
                                    <AffiliateRow
                                        key={aff.id}
                                        aff={aff}
                                        onRefresh={loadAffiliates}
                                        isUpdating={isUpdating}
                                        onUpdateStatus={handleUpdateStatus}
                                    />
                                ))}
                                {filteredAffiliates.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center gap-2 text-gray-400">
                                                <Users className="w-8 h-8" />
                                                <p className="font-medium">No partners found</p>
                                                <p className="text-xs">
                                                    {filter === 'all'
                                                        ? 'No applications have been submitted yet.'
                                                        : `No ${filter} partners found.`}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
