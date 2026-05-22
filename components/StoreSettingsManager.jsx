'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Store, Globe, Link, Palette, Truck, CreditCard, 
  Save, ExternalLink, CheckCircle, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getStorefrontSettings, updateBusinessSettings } from '@/lib/actions/storefront/admin';

export function StoreSettingsManager({ business, category }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    customDomain: '',
    theme: 'default',
    currency: 'PKR',
    enableCOD: true,
    enableCard: true,
    freeShippingThreshold: 2000,
    returnPolicyDays: 7,
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: ''
    }
  });

  useEffect(() => {
    loadSettings();
  }, [business?.id]);

  const loadSettings = async () => {
    if (!business?.id) return;
    try {
      const result = await getStorefrontSettings(business.id);
      if (result.success && result.data) {
        setSettings(prev => ({ ...prev, ...result.data }));
      }
    } catch (err) {
      console.error('Failed to load store settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!business?.id) return;
    setSaving(true);
    try {
      const result = await updateBusinessSettings(business.id, settings);
      if (result.success) {
        toast.success('Store settings saved successfully');
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const storeUrl = business?.domain 
    ? `/store/${business.domain}` 
    : `/store/${business?.handle || business?.id}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Store className="w-6 h-6" />
            Online Store Settings
          </h2>
          <p className="text-gray-500 mt-1">
            Configure your public storefront and e-commerce settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href={storeUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ExternalLink className="w-4 h-4" />
            View Store
          </a>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Store Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${settings.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Store className={`w-6 h-6 ${settings.enabled ? 'text-green-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <h3 className="font-semibold">Store Status</h3>
                <p className="text-sm text-gray-500">
                  {settings.enabled 
                    ? 'Your store is live and accessible to customers' 
                    : 'Your store is currently hidden from customers'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={settings.enabled ? 'default' : 'secondary'}>
                {settings.enabled ? 'Active' : 'Inactive'}
              </Badge>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="domain">Domain</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Store Appearance
              </CardTitle>
              <CardDescription>
                Customize how your store looks to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={settings.theme}
                    onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value }))}
                  >
                    <option value="default">Default</option>
                    <option value="modern">Modern</option>
                    <option value="minimal">Minimal</option>
                    <option value="classic">Classic</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={settings.currency}
                    onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                  >
                    <option value="PKR">PKR (Rs.)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Social Links
              </CardTitle>
              <CardDescription>
                Connect your social media accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Facebook</Label>
                  <Input 
                    placeholder="https://facebook.com/yourpage"
                    value={settings.socialLinks?.facebook || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input 
                    placeholder="https://instagram.com/yourhandle"
                    value={settings.socialLinks?.instagram || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, instagram: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Twitter</Label>
                  <Input 
                    placeholder="https://twitter.com/yourhandle"
                    value={settings.socialLinks?.twitter || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Youtube</Label>
                  <Input 
                    placeholder="https://youtube.com/yourchannel"
                    value={settings.socialLinks?.youtube || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, youtube: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain Settings */}
        <TabsContent value="domain" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                Custom Domain
              </CardTitle>
              <CardDescription>
                Use your own domain name for the store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Store URL</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{typeof window !== 'undefined' ? window.location.origin : ''}{storeUrl}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Custom Domain (Optional)</Label>
                <Input 
                  placeholder="store.yourdomain.com"
                  value={settings.customDomain}
                  onChange={(e) => setSettings(prev => ({ ...prev, customDomain: e.target.value }))}
                />
                <p className="text-sm text-gray-500">
                  Enter your custom domain without http/https. You&apos;ll need to configure DNS settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Settings */}
        <TabsContent value="payments" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Configure which payment options are available
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Cash on Delivery (COD)</h4>
                    <p className="text-sm text-gray-500">Customers pay when they receive the order</p>
                  </div>
                </div>
                <Switch
                  checked={settings.enableCOD}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableCOD: checked }))}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Card Payments</h4>
                    <p className="text-sm text-gray-500">Credit/Debit card payments via Stripe</p>
                  </div>
                </div>
                <Switch
                  checked={settings.enableCard}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableCard: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping Configuration
              </CardTitle>
              <CardDescription>
                Set up shipping rules and policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Free Shipping Threshold (Rs.)</Label>
                <Input 
                  type="number"
                  placeholder="2000"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => setSettings(prev => ({ ...prev, freeShippingThreshold: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-sm text-gray-500">
                  Orders above this amount get free shipping
                </p>
              </div>
              <div className="space-y-2">
                <Label>Return Policy (Days)</Label>
                <Input 
                  type="number"
                  placeholder="7"
                  value={settings.returnPolicyDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, returnPolicyDays: parseInt(e.target.value) || 0 }))}
                />
                <p className="text-sm text-gray-500">
                  Number of days customers have to return items
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
