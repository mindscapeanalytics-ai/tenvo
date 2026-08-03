'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Factory, Loader2, RotateCcw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useBusiness } from '@/lib/context/BusinessContext';
import { getDomainKnowledgeForBusiness } from '@/lib/utils/businessRegionalContext';
import { extractDomainKnowledgeOverride } from '@/lib/utils/domainKnowledgeOverrides';
import { updateDomainKnowledgeOverridesAction } from '@/lib/actions/basic/business';

function linesToList(text) {
  return String(text || '')
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function listToLines(list) {
  return Array.isArray(list) ? list.join('\n') : '';
}

/**
 * Settings → Industry: owner overrides for domain knowledge (fields, units, brands, intelligence).
 */
export default function IndustryDomainKnowledgePanel() {
  const { business, updateBusiness, role, isPlatformOwner } = useBusiness();
  const canEdit = isPlatformOwner || role === 'owner' || role === 'admin';

  const baseline = useMemo(() => {
    if (!business) return null;
    const category = business.category || business.domain || 'retail-shop';
    const prev = business.settings && typeof business.settings === 'object' ? business.settings : {};
    const { domainKnowledge: _omit, ...settingsWithoutPatch } = prev;
    return getDomainKnowledgeForBusiness(category, {
      ...business,
      settings: settingsWithoutPatch,
    });
  }, [business]);

  const [unitsText, setUnitsText] = useState('');
  const [brandsText, setBrandsText] = useState('');
  const [categoriesText, setCategoriesText] = useState('');
  const [seasonality, setSeasonality] = useState('');
  const [perishability, setPerishability] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [minOrderQuantity, setMinOrderQuantity] = useState('');
  const [shelfLife, setShelfLife] = useState('');
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [saving, setSaving] = useState(false);

  const hydrateFromBusiness = useCallback(() => {
    const patch = extractDomainKnowledgeOverride(business?.settings);
    setUnitsText(listToLines(patch.units));
    setBrandsText(listToLines(patch.popularBrands));
    setCategoriesText(listToLines(patch.setupTemplate?.categories));
    setSeasonality(patch.intelligence?.seasonality || '');
    setPerishability(patch.intelligence?.perishability || '');
    setLeadTime(
      patch.intelligence?.leadTime != null ? String(patch.intelligence.leadTime) : ''
    );
    setMinOrderQuantity(
      patch.intelligence?.minOrderQuantity != null
        ? String(patch.intelligence.minOrderQuantity)
        : ''
    );
    setShelfLife(
      patch.intelligence?.shelfLife != null ? String(patch.intelligence.shelfLife) : ''
    );
    const firstField = patch.fieldConfig
      ? Object.values(patch.fieldConfig)[0]
      : null;
    setFieldLabel(firstField?.label || '');
    setFieldType(firstField?.type || 'text');
  }, [business?.settings]);

  useEffect(() => {
    hydrateFromBusiness();
  }, [hydrateFromBusiness]);

  const buildPatch = () => {
    const patch = {};
    const units = linesToList(unitsText);
    if (units.length) patch.units = units;
    const brands = linesToList(brandsText);
    if (brands.length) patch.popularBrands = brands;
    const categories = linesToList(categoriesText);
    if (categories.length) {
      patch.setupTemplate = { categories };
    }
    const intelligence = {};
    if (seasonality) intelligence.seasonality = seasonality;
    if (perishability) intelligence.perishability = perishability;
    if (leadTime !== '' && Number.isFinite(Number(leadTime))) {
      intelligence.leadTime = Number(leadTime);
    }
    if (minOrderQuantity !== '' && Number.isFinite(Number(minOrderQuantity))) {
      intelligence.minOrderQuantity = Number(minOrderQuantity);
    }
    if (shelfLife !== '' && Number.isFinite(Number(shelfLife))) {
      intelligence.shelfLife = Number(shelfLife);
    }
    if (Object.keys(intelligence).length) patch.intelligence = intelligence;

    const label = String(fieldLabel || '').trim();
    if (label) {
      const key = label.toLowerCase().replace(/[^a-z0-9]/g, '');
      patch.fieldConfig = {
        [key]: { label, type: fieldType || 'text', required: false },
      };
      patch.productFields = [label];
    }
    return patch;
  };

  const handleSave = async () => {
    if (!business?.id || !canEdit) return;
    setSaving(true);
    try {
      const patch = buildPatch();
      const res = await updateDomainKnowledgeOverridesAction({
        businessId: business.id,
        domainKnowledge: Object.keys(patch).length ? patch : null,
      });
      if (!res?.success) {
        toast.error(res?.error || 'Failed to save industry settings');
        return;
      }
      if (res.business) {
        updateBusiness(res.business);
      }
      toast.success('Industry settings saved');
    } catch (error) {
      toast.error(error?.message || 'Failed to save industry settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetAll = async () => {
    if (!business?.id || !canEdit) return;
    setSaving(true);
    try {
      const res = await updateDomainKnowledgeOverridesAction({
        businessId: business.id,
        domainKnowledge: null,
      });
      if (!res?.success) {
        toast.error(res?.error || 'Failed to reset');
        return;
      }
      if (res.business) {
        updateBusiness(res.business);
      }
      setUnitsText('');
      setBrandsText('');
      setCategoriesText('');
      setSeasonality('');
      setPerishability('');
      setLeadTime('');
      setMinOrderQuantity('');
      setShelfLife('');
      setFieldLabel('');
      setFieldType('text');
      toast.success('Reset to platform defaults');
    } catch (error) {
      toast.error(error?.message || 'Failed to reset');
    } finally {
      setSaving(false);
    }
  };

  if (!business) return null;

  return (
    <Card className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <CardHeader className="space-y-1 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white pb-4 pt-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-800 ring-1 ring-slate-200/80">
            <Factory className="w-5 h-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
              Industry customization
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 font-medium leading-relaxed">
              Extend product fields, units, brands, and demand hints for your vertical. Tax rates stay under Financials.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 space-y-1">
          <p>
            <span className="font-semibold text-slate-900">Vertical:</span>{' '}
            {baseline?.name || business.category || 'Retail'}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Market:</span>{' '}
            {baseline?.countryIso || business.registration_country_iso || 'PK'}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Default unit:</span>{' '}
            {baseline?.units?.[0] || 'pcs'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Units (one per line)</Label>
            <Textarea
              value={unitsText}
              onChange={(e) => setUnitsText(e.target.value)}
              disabled={!canEdit || saving}
              placeholder={(baseline?.units || []).slice(0, 5).join('\n')}
              className="min-h-[100px] text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-700">Brand suggestions (one per line)</Label>
            <Textarea
              value={brandsText}
              onChange={(e) => setBrandsText(e.target.value)}
              disabled={!canEdit || saving}
              placeholder={['Your house brand', 'Preferred supplier brand'].join('\n')}
              className="min-h-[100px] text-sm"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-semibold text-slate-700">Category shells (one per line)</Label>
            <Textarea
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
              disabled={!canEdit || saving}
              placeholder={(baseline?.setupTemplate?.categories || []).slice(0, 4).join('\n')}
              className="min-h-[88px] text-sm"
            />
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Custom product field
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Field label</Label>
              <Input
                value={fieldLabel}
                onChange={(e) => setFieldLabel(e.target.value)}
                disabled={!canEdit || saving}
                placeholder="e.g. Finish"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Type</Label>
              <Select value={fieldType} onValueChange={setFieldType} disabled={!canEdit || saving}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
            Demand intelligence
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Seasonality</Label>
              <Select
                value={seasonality || '__platform__'}
                onValueChange={(v) => setSeasonality(v === '__platform__' ? '' : v)}
                disabled={!canEdit || saving}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Platform default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__platform__">Platform default</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Perishability</Label>
              <Select
                value={perishability || '__platform__'}
                onValueChange={(v) => setPerishability(v === '__platform__' ? '' : v)}
                disabled={!canEdit || saving}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Platform default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__platform__">Platform default</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Lead time (days)</Label>
              <Input
                type="number"
                min={0}
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                disabled={!canEdit || saving}
                placeholder={String(baseline?.intelligence?.leadTime ?? 14)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Min order qty</Label>
              <Input
                type="number"
                min={0}
                value={minOrderQuantity}
                onChange={(e) => setMinOrderQuantity(e.target.value)}
                disabled={!canEdit || saving}
                placeholder={String(baseline?.intelligence?.minOrderQuantity ?? 1)}
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">Shelf life (days)</Label>
              <Input
                type="number"
                min={0}
                value={shelfLife}
                onChange={(e) => setShelfLife(e.target.value)}
                disabled={!canEdit || saving}
                placeholder={String(baseline?.intelligence?.shelfLife ?? 365)}
                className="h-9"
              />
            </div>
          </div>
        </div>

        {canEdit ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-9 font-semibold"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save industry settings
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetAll}
              disabled={saving}
              className="h-9 font-semibold"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset all
            </Button>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Only owners and admins can edit industry settings.</p>
        )}
      </CardContent>
    </Card>
  );
}
