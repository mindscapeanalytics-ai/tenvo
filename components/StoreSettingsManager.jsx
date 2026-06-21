'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Store, Globe, Link2, Palette, Truck, CreditCard, 
  Save, ExternalLink, ArrowRight, Upload, Image, RefreshCw,
  CheckCircle2, XCircle, Package, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  getStorefrontSettings, updateBusinessSettings,
  configureStorefrontDomain, syncInventoryToStorefront
} from '@/lib/actions/storefront/admin';
import { MobileTabHeader } from '@/components/mobile/MobileTabHeader';
import { useStorefrontEmbedded } from '@/lib/context/StorefrontMobileContext';

// ── Image Upload Field ────────────────────────────────────────────────────────
function ImageUploadField({ label, hint, value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/product-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        onChange(data.url);
        toast.success('Image uploaded');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <div
          className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50 overflow-hidden shrink-0"
          onClick={() => inputRef.current?.click()}
        >
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <Image className="w-8 h-8 text-gray-300" />
          )}
        </div>
        <div className="space-y-2 flex-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {uploading ? 'Uploading...' : 'Upload Image'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              onClick={() => onChange('')}
            >
              Remove
            </Button>
          )}
          <p className="text-xs text-gray-400">{hint}</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

export function StoreSettingsManager({ business, category }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [domainSaving, setDomainSaving] = useState(false);
  const [newDomain, setNewDomain] = useState('');

  const [settings, setSettings] = useState({
    enabled: true,
    theme: 'default',
    currency: 'PKR',
    enableCOD: true,
    enableCard: true,
    freeShippingThreshold: 2000,
    returnPolicyDays: 7,
    heroTitle: '',
    announcement: '',
    brand: { primaryColor: '' },
    socialLinks: { facebook: '', instagram: '', twitter: '', youtube: '' },
    // business core fields
    logoUrl: '',
    coverImageUrl: '',
    description: '',
    phone: '',
    address: '',
    // resolved from DB
    storeDomain: null,
    storeUrl: null,
    products: { total: 0, active: 0 },
  });

  useEffect(() => { loadSettings(); }, [business?.id]);

  const loadSettings = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const result = await getStorefrontSettings(business.id);
      if (result.success && result.data) {
        setSettings(prev => ({ ...prev, ...result.data }));
        setNewDomain(result.data.storeDomain || '');
      }
    } catch (err) {
      console.error('Failed to load store settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));
  const setSocialLink = (key, val) => setSettings(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: val } }));
  const setBrand = (key, val) => setSettings(prev => ({ ...prev, brand: { ...prev.brand, [key]: val } }));

  const handleSave = async () => {
    if (!business?.id) return;
    setSaving(true);
    try {
      const result = await updateBusinessSettings(business.id, settings);
      if (result.success) {
        toast.success('Store settings saved');
        loadSettings();
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDomain = async () => {
    if (!business?.id || !newDomain.trim()) return;
    const slug = newDomain.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    setDomainSaving(true);
    try {
      const result = await configureStorefrontDomain(business.id, slug);
      if (result.success) {
        toast.success(`Store URL set to /store/${slug}`);
        loadSettings();
      } else {
        toast.error(result.error || 'Failed to set domain');
      }
    } catch {
      toast.error('Failed to set domain');
    } finally {
      setDomainSaving(false);
    }
  };

  const handleSyncInventory = async () => {
    if (!business?.id) return;
    setSyncing(true);
    try {
      const result = await syncInventoryToStorefront(business.id);
      if (result.success) {
        toast.success(`Synced ${result.synced || 0} products to store`);
        loadSettings();
      } else {
        toast.error(result.error || 'Sync failed');
      }
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const storeUrl = settings.storeUrl;
  const fullStoreUrl = storeUrl && typeof window !== 'undefined'
    ? `${window.location.origin}${storeUrl}`
    : storeUrl || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-gray-400" />
      </div>
    );
  }

  const embeddedInStorefront = useStorefrontEmbedded();

  return (
    <div className="space-y-2 lg:space-y-5">
      {!embeddedInStorefront && (
        <MobileTabHeader
          icon={Store}
          iconClassName="bg-emerald-100 text-emerald-600"
          title="Online Store"
          subtitle={settings.enabled ? 'Store is live' : 'Store is offline'}
          primaryAction={{
            label: saving ? 'Saving…' : 'Save',
            icon: Save,
            className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
            onClick: handleSave,
          }}
          actions={
            fullStoreUrl
              ? [{ id: 'view', label: 'View', icon: ExternalLink, onClick: () => window.open(storeUrl, '_blank', 'noopener,noreferrer') }]
              : []
          }
        />
      )}

      {embeddedInStorefront && (
        <div className="flex items-center justify-between gap-2 lg:hidden">
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
            settings.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
          )}>
            {settings.enabled ? 'Live' : 'Offline'}
          </span>
          <div className="flex gap-1">
            {fullStoreUrl && (
              <Button type="button" variant="outline" size="sm" className="h-8 px-2.5 text-[10px]" onClick={() => window.open(storeUrl, '_blank', 'noopener,noreferrer')}>
                <ExternalLink className="mr-1 h-3 w-3" /> View
              </Button>
            )}
            <Button type="button" size="sm" className="h-8 bg-emerald-600 px-2.5 text-[10px] text-white hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
              <Save className="mr-1 h-3 w-3" /> {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Desktop header */}
      <div className="hidden items-center justify-between lg:flex">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-gray-600" />
            Online Store
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Customize your public storefront</p>
        </div>
        <div className="flex items-center gap-2">
          {fullStoreUrl && (
            <a href={storeUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                View Store
              </Button>
            </a>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* ── Store Status Banner ──────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${settings.enabled ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-3">
          {settings.enabled
            ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
            : <XCircle className="w-4.5 h-4.5 text-gray-400" />}
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {settings.enabled ? 'Store is live' : 'Store is offline'}
            </p>
            <p className="text-xs text-gray-500">
              {settings.enabled
                ? `Customers can browse at ${fullStoreUrl || 'your store URL'}`
                : 'Your store is hidden from customers'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-gray-500">
            <span className="font-medium text-gray-700">{settings.products?.active ?? 0}</span> active products
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(v) => set('enabled', v)}
          />
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="domain">Domain</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>

        {/* ── Branding Tab ────────────────────────────────────────────── */}
        <TabsContent value="branding" className="space-y-4 mt-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Image className="w-4 h-4" /> Store Images
              </CardTitle>
              <CardDescription>Logo and hero banner shown on your public store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUploadField
                label="Store Logo"
                hint="Shown in header and emails. Recommended: 200×200px square."
                value={settings.logoUrl}
                onChange={(v) => set('logoUrl', v)}
              />
              <Separator />
              <ImageUploadField
                label="Hero / Cover Image"
                hint="Full-width banner on your store homepage. Recommended: 1440×500px."
                value={settings.coverImageUrl}
                onChange={(v) => set('coverImageUrl', v)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Palette className="w-4 h-4" /> Brand Color
              </CardTitle>
              <CardDescription>Used for buttons, links, and accent elements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.brand?.primaryColor || '#e34242'}
                  onChange={(e) => setBrand('primaryColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border cursor-pointer"
                />
                <Input
                  placeholder="#e34242"
                  value={settings.brand?.primaryColor || ''}
                  onChange={(e) => setBrand('primaryColor', e.target.value)}
                  className="w-32"
                />
                <span className="text-xs text-gray-400">Hex color code</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="w-4 h-4" /> Social Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['facebook', 'instagram', 'twitter', 'youtube'].map(platform => (
                  <div key={platform} className="space-y-1.5">
                    <Label className="capitalize text-xs">{platform}</Label>
                    <Input
                      placeholder={`https://${platform}.com/yourhandle`}
                      value={settings.socialLinks?.[platform] || ''}
                      onChange={(e) => setSocialLink(platform, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Content Tab ─────────────────────────────────────────────── */}
        <TabsContent value="content" className="space-y-4 mt-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">Store Information</CardTitle>
              <CardDescription>Details shown to customers on your public store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Store Description</Label>
                <Textarea
                  placeholder="Describe your store and what you sell..."
                  value={settings.description || ''}
                  onChange={(e) => set('description', e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-400">Shown on your store page and used for SEO meta description.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Contact Phone</Label>
                  <Input
                    placeholder="+92 300 1234567"
                    value={settings.phone || ''}
                    onChange={(e) => set('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Store Address</Label>
                  <Input
                    placeholder="123 Main St, Karachi"
                    value={settings.address || ''}
                    onChange={(e) => set('address', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold">Hero & Announcement</CardTitle>
              <CardDescription>Text displayed prominently on your homepage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Hero Tagline</Label>
                <Input
                  placeholder="e.g. Shop the best products"
                  value={settings.heroTitle || ''}
                  onChange={(e) => set('heroTitle', e.target.value)}
                />
                <p className="text-xs text-gray-400">Main headline in the hero banner.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Announcement Banner</Label>
                <Input
                  placeholder="e.g. Free shipping on orders over Rs. 2,000"
                  value={settings.announcement || ''}
                  onChange={(e) => set('announcement', e.target.value)}
                />
                <p className="text-xs text-gray-400">Shown at the very top of your store.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <select
                    className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm bg-white"
                    value={settings.currency}
                    onChange={(e) => set('currency', e.target.value)}
                  >
                    <option value="PKR">PKR (Rs.)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Theme</Label>
                  <select
                    className="w-full h-9 px-3 border border-gray-200 rounded-md text-sm bg-white"
                    value={settings.theme}
                    onChange={(e) => set('theme', e.target.value)}
                  >
                    <option value="default">Default</option>
                    <option value="modern">Modern</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Domain Tab ──────────────────────────────────────────────── */}
        <TabsContent value="domain" className="space-y-4 mt-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Store URL
              </CardTitle>
              <CardDescription>The public address where customers access your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fullStoreUrl && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-sm font-medium text-emerald-800 break-all">{fullStoreUrl}</span>
                  <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="ml-auto shrink-0">
                    <ExternalLink className="w-4 h-4 text-emerald-600" />
                  </a>
                </div>
              )}
              <Separator />
              <div className="space-y-1.5">
                <Label>Store Slug</Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-md text-sm text-gray-500 shrink-0">
                    /store/
                  </div>
                  <Input
                    placeholder="your-store-name"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="rounded-l-none"
                  />
                  <Button onClick={handleSaveDomain} disabled={domainSaving || !newDomain.trim()} size="sm">
                    {domainSaving ? 'Saving...' : 'Apply'}
                  </Button>
                </div>
                <p className="text-xs text-gray-400">Only lowercase letters, numbers, and hyphens. This is your store&apos;s public URL path.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" /> Product Sync
              </CardTitle>
              <CardDescription>Sync your inventory products to the public store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">{settings.products?.active ?? 0}</span> active &nbsp;/&nbsp;
                    <span className="font-semibold text-gray-800">{settings.products?.total ?? 0}</span> total products
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Marks all active inventory products as visible on the store</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSyncInventory} disabled={syncing}>
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Payments Tab ────────────────────────────────────────────── */}
        <TabsContent value="payments" className="space-y-4 mt-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment Methods
              </CardTitle>
              <CardDescription>Choose which payment options customers see at checkout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cash on Delivery</p>
                    <p className="text-xs text-gray-400">Customer pays on delivery</p>
                  </div>
                </div>
                <Switch checked={settings.enableCOD} onCheckedChange={(v) => set('enableCOD', v)} />
              </div>
              <div className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Card Payments</p>
                    <p className="text-xs text-gray-400">Credit/debit via Stripe</p>
                  </div>
                </div>
                <Switch checked={settings.enableCard} onCheckedChange={(v) => set('enableCard', v)} />
              </div>
              <Separator />
              <button
                onClick={() => router.push(`/business/${category}/store-settings/payments`)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
              >
                <span className="font-medium">Advanced Payment Settings (Stripe Connect, COD fees…)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Shipping Tab ────────────────────────────────────────────── */}
        <TabsContent value="shipping" className="space-y-4 mt-5">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Truck className="w-4 h-4" /> Shipping Rules
              </CardTitle>
              <CardDescription>Configure shipping thresholds and return policy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Free Shipping Threshold</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 shrink-0">{settings.currency}</span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="2000"
                    value={settings.freeShippingThreshold}
                    onChange={(e) => set('freeShippingThreshold', parseInt(e.target.value) || 0)}
                    className="w-40"
                  />
                </div>
                <p className="text-xs text-gray-400">Orders above this amount qualify for free shipping.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Return Window (Days)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="7"
                    value={settings.returnPolicyDays}
                    onChange={(e) => set('returnPolicyDays', parseInt(e.target.value) || 0)}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500">days</span>
                </div>
                <p className="text-xs text-gray-400">How many days customers have to return items.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
