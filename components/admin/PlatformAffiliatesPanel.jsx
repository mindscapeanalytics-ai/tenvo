'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Link as LinkIcon, RefreshCcw } from 'lucide-react';
import { getPlatformAffiliates, updateAffiliateStatusAction } from '@/lib/actions/admin/affiliates';
import toast from 'react-hot-toast';

export function PlatformAffiliatesPanel() {
    const [affiliates, setAffiliates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(null);

    const loadAffiliates = async () => {
        setIsLoading(true);
        try {
            const res = await getPlatformAffiliates();
            if (res.success) {
                setAffiliates(res.data);
            } else {
                toast.error(res.error || 'Failed to load affiliates');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAffiliates();
    }, []);

    const handleUpdateStatus = async (id, action) => {
        setIsUpdating(id);
        try {
            const res = await updateAffiliateStatusAction(id, action);
            if (res.success) {
                toast.success(`Partner application ${action}d successfully`);
                loadAffiliates();
            } else {
                toast.error(res.error || 'Failed to update status');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsUpdating(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div>
                    <CardTitle className="text-xl">Affiliates & Partners</CardTitle>
                    <CardDescription>Manage affiliate program applications and active partners.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadAffiliates}>
                    <RefreshCcw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500">
                            <tr>
                                <th className="px-6 py-4 font-medium">Partner Name</th>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Referrals</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {affiliates.map((aff) => (
                                <tr key={aff.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{aff.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{aff.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            aff.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                            aff.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-amber-100 text-amber-800'
                                        }`}>
                                            {aff.status.charAt(0).toUpperCase() + aff.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {aff._count?.referrals || 0}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {aff.status === 'pending' && (
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    size="sm" 
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg h-8 px-3"
                                                    onClick={() => handleUpdateStatus(aff.id, 'approve')}
                                                    disabled={isUpdating === aff.id}
                                                >
                                                    {isUpdating === aff.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />} 
                                                    Approve
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-lg h-8 px-3"
                                                    onClick={() => handleUpdateStatus(aff.id, 'reject')}
                                                    disabled={isUpdating === aff.id}
                                                >
                                                    {isUpdating === aff.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <XCircle className="w-4 h-4 mr-1.5" />} 
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                        {aff.status === 'approved' && (
                                            <span className="text-gray-400 text-xs font-medium">Approved</span>
                                        )}
                                        {aff.status === 'rejected' && (
                                            <span className="text-gray-400 text-xs font-medium">Rejected</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            
                            {affiliates.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No applications found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
