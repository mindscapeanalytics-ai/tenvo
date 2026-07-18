'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';

/**
 * Compact About page editor for Store Settings.
 */
export function AboutPageSettingsEditor({
  about,
  onChange,
  businessId,
  ImageUpload = null,
}) {
  const set = (key, val) => onChange({ ...(about || {}), [key]: val });
  const team = Array.isArray(about?.team) ? about.team : [];
  const valuesText = Array.isArray(about?.values) ? about.values.join('\n') : '';

  const updateMember = (index, key, val) => {
    const next = team.map((m, i) => (i === index ? { ...m, [key]: val } : m));
    set('team', next);
  };

  const addMember = () => {
    set('team', [
      ...team,
      { id: `member-${Date.now()}`, name: '', role: '', photoUrl: '', bio: '' },
    ]);
  };

  const removeMember = (index) => {
    set(
      'team',
      team.filter((_, i) => i !== index)
    );
  };

  const Upload = ImageUpload;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-gray-900">Enable About page</p>
          <p className="text-xs text-gray-500">Public page at /about with your company story and team</p>
        </div>
        <Switch checked={about?.enabled !== false} onCheckedChange={(v) => set('enabled', v)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2">
          <span className="text-xs font-medium text-gray-700">Show in footer</span>
          <Switch checked={about?.showInFooter !== false} onCheckedChange={(v) => set('showInFooter', v)} />
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2">
          <span className="text-xs font-medium text-gray-700">Show in header nav</span>
          <Switch checked={about?.showInNav === true} onCheckedChange={(v) => set('showInNav', v)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Headline</Label>
        <Input
          value={about?.headline || ''}
          onChange={(e) => set('headline', e.target.value)}
          placeholder="About our company"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Story</Label>
        <Textarea
          value={about?.story || ''}
          onChange={(e) => set('story', e.target.value)}
          rows={4}
          placeholder="Who you are, what you supply, and how you support customers..."
        />
      </div>
      <div className="space-y-1.5">
        <Label>Mission (optional)</Label>
        <Input
          value={about?.mission || ''}
          onChange={(e) => set('mission', e.target.value)}
          placeholder="Short mission line under the title"
        />
      </div>
      <div className="space-y-1.5">
        <Label>Values (one per line, up to 6)</Label>
        <Textarea
          value={valuesText}
          onChange={(e) =>
            set(
              'values',
              e.target.value
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 6)
            )
          }
          rows={3}
          placeholder={'Quality parts\nFast response\nOEM fitment'}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Founded year</Label>
          <Input
            value={about?.foundedYear || ''}
            onChange={(e) => set('foundedYear', e.target.value)}
            placeholder="2012"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Headquarters</Label>
          <Input
            value={about?.headquarters || ''}
            onChange={(e) => set('headquarters', e.target.value)}
            placeholder="City, Country"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Registration / tax ID</Label>
          <Input
            value={about?.registrationId || ''}
            onChange={(e) => set('registrationId', e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      {Upload ? (
        <Upload
          label="About hero image (optional)"
          hint="Wide banner for the About page. Converted to WebP on upload."
          value={about?.heroImageUrl || ''}
          onChange={(v) => set('heroImageUrl', v)}
          businessId={businessId}
          purpose="banner"
        />
      ) : null}

      <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 space-y-3">
        <p className="text-sm font-semibold text-gray-900">Owner / CEO</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={about?.ownerName || ''}
              onChange={(e) => set('ownerName', e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={about?.ownerTitle || ''}
              onChange={(e) => set('ownerTitle', e.target.value)}
              placeholder="Founder / CEO"
            />
          </div>
        </div>
        {Upload ? (
          <Upload
            label="Owner photo"
            hint="Square portrait recommended."
            value={about?.ownerPhotoUrl || ''}
            onChange={(v) => set('ownerPhotoUrl', v)}
            businessId={businessId}
            purpose="logo"
          />
        ) : null}
        <div className="space-y-1.5">
          <Label>Short bio</Label>
          <Textarea
            value={about?.ownerBio || ''}
            onChange={(e) => set('ownerBio', e.target.value)}
            rows={2}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Team members</p>
          <Button type="button" size="sm" variant="outline" onClick={addMember} disabled={team.length >= 12}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </div>
        {team.length === 0 ? (
          <p className="text-xs text-gray-500">Optional. Add people who represent your company.</p>
        ) : null}
        {team.map((member, index) => (
          <div key={member.id || index} className="rounded-xl border border-gray-100 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Member {index + 1}</span>
              <button
                type="button"
                onClick={() => removeMember(index)}
                className="text-gray-400 hover:text-red-500"
                aria-label="Remove team member"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={member.name || ''}
                onChange={(e) => updateMember(index, 'name', e.target.value)}
                placeholder="Name"
              />
              <Input
                value={member.role || ''}
                onChange={(e) => updateMember(index, 'role', e.target.value)}
                placeholder="Role"
              />
            </div>
            {Upload ? (
              <Upload
                label="Photo"
                hint=""
                value={member.photoUrl || ''}
                onChange={(v) => updateMember(index, 'photoUrl', v)}
                businessId={businessId}
                purpose="logo"
              />
            ) : null}
            <Textarea
              value={member.bio || ''}
              onChange={(e) => updateMember(index, 'bio', e.target.value)}
              rows={2}
              placeholder="Short bio (optional)"
            />
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label>About page CTA label</Label>
        <Input
          value={about?.ctaLabel || ''}
          onChange={(e) => set('ctaLabel', e.target.value)}
          placeholder="Contact us"
        />
      </div>
    </div>
  );
}
