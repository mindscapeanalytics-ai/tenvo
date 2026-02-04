'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { vendorAPI } from '@/lib/api/vendors';
import { useBusiness } from '@/lib/context/BusinessContext';
import { CityAutocomplete } from '@/components/CityAutocomplete';

export function QuickVendorForm({ onSave, onCancel }) {
    const { business } = useBusiness();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        contactPerson: '',
        ntn: '',
        strn: '',
        address: '',
        city: business?.city || '',
        payment_terms: ''
    });

    const handleFillDemo = () => {
        setFormData({
            name: 'Quick Supplier ' + Math.floor(Math.random() * 1000),
            phone: '+92 300 1234567',
            email: `supplier${Math.floor(Math.random() * 1000)}@example.com`,
            contactPerson: 'Manager Name',
            ntn: '1234567-8',
            strn: '',
            address: 'Industrial Area',
            city: 'Karachi',
            payment_terms: 'COD'
        });
        toast.success('Demo data filled');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) return toast.error('Name is required');

        setIsLoading(true);
        try {
            // Use the API directly or pass back to parent. 
            // Using API directly here for self-containment, similar to ProductForm pattern if we passed onSave as a callback that handles the API.
            // Actually, ProductForm calls onSave which might validly be the API call wrapper.
            // Let's assume onSave is passed and handles the API call, OR we call API here.
            // To match ProductForm signature in page.js (where we likely want to just receive the new object), 
            // BUT ProductForm in page.js receives a handler.
            // Let's call the API here to ensure we return a full object.

            const newVendor = await vendorAPI.create({
                ...formData,
                business_id: business.id
            });

            onSave(newVendor);
            toast.success('Vendor created');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create vendor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div className="flex justify-between items-center mb-4">
                <div className="space-y-1">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        New Vendor
                    </h3>
                    <p className="text-sm text-gray-500">Quickly onboard a new supplier</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={handleFillDemo} className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" /> Magic Fill
                </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <CityAutocomplete
                        value={formData.city}
                        onChange={val => setFormData({ ...formData, city: val })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Acme Corp"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+92..."
                    />
                </div>
                <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input
                        value={formData.contactPerson}
                        onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={formData.payment_terms}
                        onChange={e => setFormData({ ...formData, payment_terms: e.target.value })}
                    >
                        <option value="">Select Terms</option>
                        <option value="COD">Cash on Delivery</option>
                        <option value="Net 7">Net 7 Days</option>
                        <option value="Net 30">Net 30 Days</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Vendor'}
                </Button>
            </div>
        </form>
    );
}
