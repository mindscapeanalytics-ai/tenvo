'use client';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/DatePicker';
import { AlertCircle, Flame, Biohazard, Radiation, ShieldAlert, Pill, Car, Microscope, HelpCircle, Book, Hash } from 'lucide-react';
import { getFieldLabel, getFieldInputType, isFieldRequired, getDomainKnowledge, normalizeKey, getSelectOptions, getDomainUnitPreview } from '@/lib/utils/domainHelpers';
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import {
  getDeliveryAreaSelectOptions,
  getAllPakistanDeliveryAreaSelectOptions,
  resolvePostalCodeForArea,
} from '@/lib/data/pakistanDeliveryAreas';
import { VehicleCompatibilitySelector, OEMNumberInput, PartNumberInput, WarrantyPeriodInput } from './AutoPartsFields';
import { SerialNumberInput } from './SerialTracking';
import { BatchNumberInput } from './BatchTracking';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function DomainFieldRenderer({
  field,
  value,
  onChange,
  category,
  product = {},
  className = '',
  error = null, // Accept error prop
  onDomainPatch = null,
}) {
  const label = getFieldLabel(field, category);
  const inputType = getFieldInputType(field, category);
  const required = isFieldRequired(field, category);
  const unitPreview = getDomainUnitPreview(field, category);

  // Icon mapping for domain fields
  const getFieldIcon = () => {
    const n = normalizeKey(field);
    if (n.includes('drug') || n.includes('license') || n.includes('pharmacy')) return <Pill className="w-3.5 h-3.5" />;
    if (n.includes('vehicle') || n.includes('car') || n.includes('truck')) return <Car className="w-3.5 h-3.5" />;
    if (n.includes('hazardous') || n.includes('toxic') || n.includes('danger')) return <Biohazard className="w-3.5 h-3.5" />;
    if (n.includes('radiation') || n.includes('atomic')) return <Radiation className="w-3.5 h-3.5" />;
    if (n.includes('flammable') || n.includes('fire')) return <Flame className="w-3.5 h-3.5" />;
    if (n.includes('isbn') || n.includes('book') || n.includes('author')) return <Book className="w-3.5 h-3.5" />;
    if (n.includes('model') || n.includes('serial')) return <Hash className="w-3.5 h-3.5" />;
    if (n.includes('compliance') || n.includes('legal')) return <ShieldAlert className="w-3.5 h-3.5" />;
    return <HelpCircle className="w-3.5 h-3.5 text-gray-300" />;
  };

  // 4. Default Field Rendering
  const renderField = () => {
    switch (inputType) {
      case 'date':
        return <DatePicker value={value || ''} onChange={onChange} />;
      case 'number':
        return (
          <div className="relative">
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              required={required}
              className={cn(
                "font-bold border-gray-100 bg-gray-50/30 focus:bg-white transition-all pl-3",
                error ? "border-red-400 bg-red-50/50 focus:ring-red-200" : "hover:border-indigo-100 focus:border-indigo-400",
                required && !value && !error && "border-amber-100 bg-amber-50/20"
              )}
            />
            {unitPreview && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase text-gray-400 cursor-help hover:text-gray-600 transition-colors">
                      {unitPreview}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px] font-bold">Standard {category.replace(/-/g, ' ')} unit</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2 p-3 bg-gray-50/50 rounded-lg border border-transparent hover:border-blue-100 transition-all">
            <Checkbox checked={!!value} onCheckedChange={(checked) => onChange(checked)} />
            <Label className="font-medium cursor-pointer flex items-center gap-2">
              {getFieldIcon()}
              {label}
            </Label>
          </div>
        );
      case 'select':
        return (
          <DomainSelect
            field={field}
            category={category}
            value={value}
            onChange={onChange}
            error={error}
            contextValues={product}
            onDomainPatch={onDomainPatch}
          />
        );
      case 'vehicle-compatibility':
        return <VehicleCompatibilitySelector value={value || []} onChange={onChange} />;
      case 'oem-number':
        return <OEMNumberInput value={value} onChange={onChange} required={required} />;
      case 'part-number':
        return <PartNumberInput value={value} onChange={onChange} required={required} />;
      case 'warranty':
        return <WarrantyPeriodInput value={value} onChange={onChange} required={required} />;
      default:
        return (
          <div className="relative">
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              required={required}
              placeholder={`Enter ${label.toLowerCase()}`}
              className={cn(
                "border-gray-100 bg-gray-50/30 focus:bg-white transition-all pl-3",
                error ? "border-red-400 bg-red-50/50 focus:ring-red-200" : "hover:border-indigo-100 focus:border-indigo-400",
                required && !value && !error && "border-amber-100 bg-amber-50/20"
              )}
            />
            {unitPreview && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase text-gray-400 cursor-help hover:text-gray-600 transition-colors">
                      {unitPreview}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-[10px] font-bold">Standard {category.replace(/-/g, ' ')} unit</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
    }
  };

  if (inputType === 'checkbox') return <div className={className}>{renderField()}{error && <p className="text-[10px] font-bold text-red-500 mt-1">{error}</p>}</div>;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${error ? 'text-red-500' : 'text-gray-400'}`}>
        {getFieldIcon()}
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {renderField()}
      {error && (
        <p className="text-[10px] font-semibold text-red-500 uppercase tracking-tight flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function DomainSelect({ field, category, value, onChange, error, contextValues = {}, onDomainPatch = null }) {
  const key = normalizeKey(field);
  let rawOptions = getSelectOptions(field, category);
  const isWater = resolveDomainKey(category) === 'water-delivery';

  // Water delivery: city-scoped areas with postal codes in the label + custom area entry via datalist.
  if (isWater && (key === 'deliveryarea' || key === 'delivery_area')) {
    const city = String(contextValues?.city || '').trim();
    const cityOpts = getDeliveryAreaSelectOptions(city);
    const areaOpts = cityOpts.length ? cityOpts : getAllPakistanDeliveryAreaSelectOptions();

    const handleAreaInput = (e) => {
      const next = e.target.value;
      onChange(next);
      if (typeof onDomainPatch === 'function') {
        const fromOpt = areaOpts.find((o) => String(o.value).toLowerCase() === String(next).toLowerCase())?.postalCode;
        const code = fromOpt || resolvePostalCodeForArea(city, next);
        if (code) onDomainPatch({ postalcode: code, areacode: code });
      }
    };

    return (
      <div className="relative">
        <Input
          list="water-delivery-areas-list"
          value={value || ''}
          onChange={handleAreaInput}
          placeholder="Select or type delivery area (e.g. BTK Precinct 11A, DHA Phase 6)…"
          className={cn(
            "h-11 rounded-xl border-gray-100 bg-gray-50/30 focus:bg-white transition-all pl-3 text-sm",
            error ? "border-red-500 bg-red-50" : "hover:border-indigo-100 focus:border-indigo-400"
          )}
        />
        <datalist id="water-delivery-areas-list">
          {areaOpts.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </datalist>
      </div>
    );
  }

  if (!rawOptions || rawOptions.length === 0) {
    return <Input value={value || ''} onChange={e => onChange(e.target.value)} className={error ? "border-red-500 bg-red-50" : ""} />;
  }

  // Normalize options to { value, label, postalCode? } and filter out empty values
  const options = rawOptions
    .map((opt) => {
      if (typeof opt === 'string') return { value: opt, label: opt, postalCode: null };
      return {
        value: opt.value,
        label: opt.label || opt.value,
        postalCode: opt.postalCode || null,
      };
    })
    .filter((opt) => opt.value && opt.value.toString().trim() !== '');

  const handleChange = (next) => {
    onChange(next);
    if (!isWater || typeof onDomainPatch !== 'function') return;
    if (key === 'deliveryarea' || key === 'delivery_area') {
      const city = String(contextValues?.city || '').trim();
      const fromOpt = options.find((o) => String(o.value) === String(next))?.postalCode;
      const code = fromOpt || resolvePostalCodeForArea(city, next);
      if (code) onDomainPatch({ postalcode: code, areacode: code });
    }
  };

  return (
    <Select value={value || ''} onValueChange={handleChange}>
      <SelectTrigger className={`h-11 rounded-xl border-gray-100 bg-gray-50/30 focus:bg-white transition-all ${error ? "border-red-500 bg-red-50 focus:ring-red-500" : ""}`}>
        <SelectValue placeholder="Select option..." />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


