'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UsersIcon, Loader2, Sparkles, Building2, Smartphone, Wallet, Globe, X, Droplets } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDomainCustomerFields, normalizeKey } from '@/lib/utils/domainHelpers';
import { isWaterHisabRelevant } from '@/lib/storefront/waterShopHisab';
import { DomainFieldRenderer } from './domain/DomainFieldRenderer';
import { useFormRegionalContext } from '@/lib/hooks/useFormRegionalContext';
import { getRegionalStandards, getPhoneCountryCodeOptions } from '@/lib/utils/regionalHelpers';
import { CityAutocomplete } from '@/components/CityAutocomplete';
import { MarketLocationSelector } from '@/components/MarketLocationSelector';
import { useAppMode } from '@/lib/context/BusyModeContext';
import { validateNTN, formatNTN } from '@/lib/tax/pakistaniTax';
import { formatPakistaniPhone, isValidCNIC, isValidPakistaniPhone, customerSchema, validateForm } from '@/lib/validation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormError } from '@/components/ui/form-error';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isEntitlementError, getEntitlementErrorMessage, isEntitlementErrorHandled } from '@/lib/utils/subscriptionErrors';
import { showActionError, formatValidationErrors, isValidationError } from '@/lib/utils/formErrorHandler';
import { MOBILE_FORM_BODY, MOBILE_FORM_FOOTER, MOBILE_INPUT_CLASS, MOBILE_LABEL_CLASS, MOBILE_TAB_LIST } from '@/lib/utils/formMobileStyles';

const PHONE_COUNTRY_CODES = getPhoneCountryCodeOptions();

export function CustomerForm({
    onSave,
    onClose,
    onEntitlementError,
    initialData = null,
    category = 'retail-shop',
    embedded = false,
}) {
    const {
        business,
        currency,
        taxIdLabel,
        isPakistanMarket,
        registry,
    } = useFormRegionalContext(category);
    const standards = registry || getRegionalStandards('PK');
    const { isEasyMode } = useAppMode();
    const isWaterRoute = isWaterHisabRelevant(category);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('basic');
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState(() => {
        const domain = initialData?.domain_data && typeof initialData.domain_data === 'object'
            ? initialData.domain_data
            : {};
        return {
            name: '',
            email: '',
            phone: '',
            ntn: '',
            cnic: '',
            srn: '',
            address: '',
            city: business?.city || '',
            market_location: domain.market_location || domain.marketlocation || '',
            credit_limit: 0,
            opening_balance: 0,
            filer_status: 'none',
            domain_data: domain,
            ...initialData,
            market_location:
                initialData?.market_location
                || domain.market_location
                || domain.marketlocation
                || '',
            domain_data: {
                ...domain,
                ...(initialData?.domain_data && typeof initialData.domain_data === 'object'
                    ? initialData.domain_data
                    : {}),
            },
        };
    });

    const [countryCode, setCountryCode] = useState(standards.phoneCode || '+92');
    const [localPhone, setLocalPhone] = useState('');

    useEffect(() => {
        const phone = formData.phone || '';
        if (!phone) {
            // Use queueMicrotask to avoid setState in effect
            queueMicrotask(() => setLocalPhone(''));
            return;
        }
        const matcheCode = PHONE_COUNTRY_CODES.find(c => phone.startsWith(c.code));
        if (matcheCode) {
            queueMicrotask(() => {
                setCountryCode(matcheCode.code);
                setLocalPhone(phone.slice(matcheCode.code.length).trim());
            });
        } else {
            queueMicrotask(() => setLocalPhone(phone));
        }
    }, [formData.phone]);

    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    }, [errors]);

    useEffect(() => {
        const cleanLocal = localPhone.replace(/\s+/g, ' ').trim();
        if (cleanLocal) {
            handleInputChange('phone', `${countryCode} ${cleanLocal}`);
        } else {
            handleInputChange('phone', '');
        }
    }, [countryCode, localPhone, handleInputChange]);

    const domainFields = getDomainCustomerFields(category).filter((field) => {
        const key = normalizeKey(field);
        // Column already exists on customers — avoid duplicate domain_data credit fields
        return key !== 'creditlimit' && key !== 'credit_limit';
    });

    useEffect(() => {
        if (initialData) {
            const domain = initialData.domain_data && typeof initialData.domain_data === 'object'
                ? initialData.domain_data
                : {};
            // Move to queueMicrotask to avoid setState in effect
            queueMicrotask(() => {
                setFormData((prev) => ({
                    ...prev,
                    ...initialData,
                    market_location:
                        initialData.market_location
                        || domain.market_location
                        || domain.marketlocation
                        || prev.market_location
                        || '',
                    domain_data: { ...domain },
                }));
            });
        } else if (business?.city) {
            queueMicrotask(() => {
                setFormData((prev) => (prev.city ? prev : { ...prev, city: business.city }));
            });
        }
    }, [initialData, business?.city]);

    const handleCNICChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 5) val = val.slice(0, 5) + '-' + val.slice(5);
        if (val.length > 13) val = val.slice(0, 13) + '-' + val.slice(13);
        if (val.length > 15) val = val.slice(0, 15);
        handleInputChange('cnic', val);
    };

    const handleNTNChange = (e) => {
        handleInputChange('ntn', formatNTN(e.target.value));
    };

    const validateLocalInputs = () => {
        if (!String(formData.name || '').trim()) {
            toast.error('Customer name is required');
            return false;
        }
        if (formData.phone && String(formData.phone).replace(/\D/g, '').length > 0
            && String(formData.phone).replace(/\D/g, '').length < 7) {
            toast.error('Phone number seems too short');
            return false;
        }
        if (formData.cnic && String(formData.cnic).replace(/\D/g, '').length >= 13 && !isValidCNIC(formData.cnic)) {
            toast.error('Invalid CNIC format (e.g. 42201-1234567-1)');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateLocalInputs()) return;

        const validation = validateForm(customerSchema, formData);
        if (!validation.isValid) {
            setErrors(validation.errors);
            toast.error('Please fix highlighted errors');
            if (activeTab === 'basic' && ['ntn', 'cnic', 'srn'].some(k => validation.errors[k])) {
                setActiveTab('tax');
            }
            return;
        }

        setIsLoading(true);
        try {
            const marketLoc = String(formData.market_location || '').trim();
            const domain_data = {
                ...(formData.domain_data && typeof formData.domain_data === 'object' ? formData.domain_data : {}),
            };
            if (marketLoc) {
                domain_data.market_location = marketLoc;
                domain_data.marketlocation = marketLoc;
            }

            const payload = {
                id: formData.id,
                name: String(formData.name || '').trim(),
                email: formData.email || '',
                phone: formData.phone || '',
                address: formData.address || '',
                city: formData.city || '',
                market_location: marketLoc,
                ntn: formData.ntn || '',
                cnic: formData.cnic || '',
                srn: formData.srn || '',
                credit_limit: Number(formData.credit_limit) || 0,
                opening_balance: Number(formData.opening_balance) || 0,
                filer_status: formData.filer_status || 'none',
                type: formData.type || 'individual',
                notes: formData.notes || '',
                domain_data,
            };

            const result = await onSave(payload);

            if (result && !result.success) {
                if (isValidationError(result)) {
                    setErrors(formatValidationErrors(result));
                    toast.error('Please fix highlighted errors');
                    return;
                }
                showActionError(result);
                return;
            }

            onClose?.();
        } catch (error) {
            console.error('Customer save error:', error);
            if (isEntitlementError(error)) {
                if (!isEntitlementErrorHandled(error)) {
                    toast.error(getEntitlementErrorMessage(error, { action: 'save customer' }));
                }
                onEntitlementError?.(error);
            } else {
                showActionError({
                    success: false,
                    error: error.message || 'Failed to save customer',
                    code: error.code || null,
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleFillDemo = () => {
        const isTextile = category.includes('textile');
        const isPharmacy = category === 'pharmacy';
        const randomLocal = '3' + Math.floor(Math.random() * 90 + 10) + ' ' + Math.floor(Math.random() * 9000000 + 1000000);

        setCountryCode('+92');
        setLocalPhone(randomLocal);
        setFormData(prev => ({
            ...prev,
            name: isTextile ? 'Zubair Fabrics & Sons' : (isPharmacy ? 'Al-Shifa Medicos' : 'Global Traders'),
            email: 'contact@demo-client.com',
            ntn: Math.floor(Math.random() * 9000000 + 1000000) + '-' + Math.floor(Math.random() * 9),
            cnic: '42201-' + Math.floor(Math.random() * 9000000 + 1000000) + '-' + Math.floor(Math.random() * 9),
            address: isTextile ? 'Shop # 45, Jama Cloth Market' : 'Plot 123, Sector 5',
            city: isTextile ? 'Karachi' : 'Lahore',
            credit_limit: 500000,
            domain_data: {
                marketlocation: isTextile ? 'Jama Cloth' : '',
                brokername: isTextile ? 'Haji Bashoor' : '',
                shopname: isTextile ? 'Zubair Fabrics' : '',
                marketsegment: 'Wholesale',
            }
        }));
        toast.success('Generated realistic demo data');
    };

    return (
        <Card className={cn(
            'flex w-full flex-col overflow-hidden border-wine/15 shadow-xl',
            embedded ? 'border-none shadow-none rounded-none' : 'max-w-6xl rounded-2xl max-h-[min(92vh,900px)]'
        )}>
            <CardHeader className="shrink-0 space-y-1 border-b border-wine/10 bg-wine/[0.03] px-4 py-3 sm:px-6 sm:py-3.5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                        <CardTitle className="flex flex-wrap items-center gap-2 text-base font-bold text-wine">
                            <UsersIcon className="h-4 w-4 shrink-0" />
                            {initialData ? 'Edit Customer' : 'Add New Customer'}
                            {!initialData && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleFillDemo}
                                    className="h-7 px-2 text-[10px] font-semibold uppercase tracking-tight border-wine/20 text-wine hover:bg-wine/5"
                                >
                                    <Sparkles className="mr-1 h-3 w-3" /> Magic Fill
                                </Button>
                            )}
                        </CardTitle>
                        <CardDescription className="text-xs text-wine/60">
                            Press Tab to move between fields • Only name is required
                        </CardDescription>
                    </div>
                    {onClose && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 shrink-0 rounded-lg hover:bg-red-50 hover:text-red-500"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className={MOBILE_FORM_BODY}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {!isWaterRoute && (
                        <TabsList className={cn(
                            MOBILE_TAB_LIST,
                            isEasyMode ? (domainFields.length > 0 ? 'sm:grid-cols-2' : 'sm:grid-cols-1') : (domainFields.length > 0 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')
                        )}>
                            <TabsTrigger value="basic" className="relative rounded-md text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                Basic Details
                                {['name', 'phone', 'city'].some(k => errors[k]) && (
                                    <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                                )}
                            </TabsTrigger>
                            {!isEasyMode && (
                                <TabsTrigger value="tax" className="relative rounded-md text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    Financial & Tax
                                    {['ntn', 'cnic', 'srn', 'credit_limit'].some(k => errors[k]) && (
                                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                                    )}
                                </TabsTrigger>
                            )}
                            {domainFields.length > 0 && (
                                <TabsTrigger value="domain" className="relative rounded-md text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    {category.includes('water') ? 'Route & Water Details' : 'Domain Info'}
                                </TabsTrigger>
                            )}
                        </TabsList>
                    )}

                    <TabsContent value="basic" className="mt-0 space-y-5">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-3">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className={cn(MOBILE_LABEL_CLASS, 'font-semibold text-gray-700')}>Customer Name *</Label>
                                <Input 
                                    value={formData.name || ''} 
                                    onChange={(e) => handleInputChange('name', e.target.value)} 
                                    placeholder="Enter full name or company name" 
                                    className={cn(MOBILE_INPUT_CLASS, 'h-10 text-[15px]')}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            document.querySelector('input[name="phone-local"]')?.focus();
                                        }
                                    }}
                                />
                                {errors?.name && <FormError message={errors.name} />}
                            </div>
                            <div className="space-y-1.5">
                                <Label className={cn(MOBILE_LABEL_CLASS, 'font-semibold text-gray-700')}>Phone</Label>
                                <div className="flex gap-2">
                                    <Select value={countryCode} onValueChange={setCountryCode}>
                                        <SelectTrigger className="h-10 w-[100px] rounded-lg text-sm">
                                            <SelectValue placeholder="Code" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PHONE_COUNTRY_CODES.map((c) => (
                                                <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="relative flex-1">
                                        <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                        <Input 
                                            name="phone-local"
                                            value={localPhone} 
                                            onChange={(e) => setLocalPhone(e.target.value.replace(/[^\d\s-]/g, ''))} 
                                            placeholder="300 1234567" 
                                            className={cn(MOBILE_INPUT_CLASS, 'pl-9 h-10 text-[15px]')}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    document.querySelector('input[type="email"]')?.focus();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                {errors?.phone && <FormError message={errors.phone} />}
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className={cn(MOBILE_LABEL_CLASS, 'font-semibold text-gray-700')}>Email</Label>
                                <Input 
                                    type="email"
                                    value={formData.email || ''} 
                                    onChange={(e) => handleInputChange('email', e.target.value)} 
                                    placeholder="customer@example.com" 
                                    className={cn(MOBILE_INPUT_CLASS, 'h-10 text-[15px]')}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const cityInput = document.querySelector('[data-city-input]');
                                            cityInput?.focus();
                                        }
                                    }}
                                />
                                {errors?.email && <FormError message={errors.email} />}
                            </div>
                            <div className="space-y-1.5">
                                <CityAutocomplete 
                                    value={formData.city} 
                                    onChange={(val) => handleInputChange('city', val)} 
                                    required={false}
                                />
                                {errors?.city && <FormError message={errors.city} />}
                            </div>
                            <div className="space-y-1.5 md:col-span-3">
                                <MarketLocationSelector 
                                    value={formData.market_location} 
                                    onChange={(val) => handleInputChange('market_location', val)} 
                                    city={formData.city} 
                                    required={false} 
                                    language="en" 
                                />
                            </div>
                            <div className="space-y-1.5 md:col-span-3">
                                <Label className={cn(MOBILE_LABEL_CLASS, 'font-semibold text-gray-700')}>Billing Address</Label>
                                <Input 
                                    value={formData.address || ''} 
                                    onChange={(e) => handleInputChange('address', e.target.value)} 
                                    placeholder="Shop #, Market, Area, Street" 
                                    className={cn(MOBILE_INPUT_CLASS, 'h-10 text-[15px]')}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isEasyMode && !isWaterRoute) {
                                            e.preventDefault();
                                            setActiveTab('tax');
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {isWaterRoute && domainFields.length > 0 && (
                            <div className="grid grid-cols-1 gap-4 rounded-xl border border-sky-200 bg-sky-50/50 p-4 md:grid-cols-2 mt-2">
                                <div className="md:col-span-2 flex items-center gap-2 text-sm font-bold text-sky-800">
                                    <Droplets className="h-4 w-4" /> Water Route Details
                                </div>
                                {domainFields.map(field => {
                                    const key = normalizeKey(field);
                                    return (
                                        <DomainFieldRenderer
                                            key={field}
                                            field={key}
                                            value={formData.domain_data?.[key] || ''}
                                            onChange={(val) => {
                                                const nextDomain = { ...formData.domain_data, [key]: val };
                                                if (key === 'city') {
                                                    nextDomain.deliveryarea = '';
                                                    nextDomain.postalcode = '';
                                                    nextDomain.areacode = '';
                                                }
                                                setFormData({ ...formData, domain_data: nextDomain });
                                            }}
                                            onDomainPatch={(patch) => {
                                                setFormData((prev) => ({ ...prev, domain_data: { ...prev.domain_data, ...patch } }));
                                            }}
                                            category={category}
                                            product={formData.domain_data || {}}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {isEasyMode && !isWaterRoute && (
                            <div className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-gray-200 pt-5 md:grid-cols-3">
                                <div className="space-y-1.5">
                                    <Label className={cn(MOBILE_LABEL_CLASS, 'font-semibold text-gray-700 flex items-center gap-1.5')}>
                                        <Wallet className="h-3.5 w-3.5" />
                                        Credit Limit ({currency})
                                    </Label>
                                    <Input 
                                        type="number" 
                                        value={formData.credit_limit || ''} 
                                        onChange={(e) => handleInputChange('credit_limit', e.target.value)} 
                                        placeholder="0" 
                                        className={cn(MOBILE_INPUT_CLASS, 'h-10 text-[15px] tabular-nums')}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                document.querySelector('input[name="opening-balance"]')?.focus();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={cn(MOBILE_LABEL_CLASS, 'font-semibold text-gray-700')}>Opening Balance ({currency})</Label>
                                    <Input 
                                        type="number" 
                                        name="opening-balance"
                                        value={formData.opening_balance || ''} 
                                        onChange={(e) => handleInputChange('opening_balance', e.target.value)} 
                                        placeholder="0" 
                                        className={cn(MOBILE_INPUT_CLASS, 'h-10 text-[15px] tabular-nums')}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSubmit();
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {!isWaterRoute && (
                        <TabsContent value="tax" className="mt-0 space-y-5">
                            <div className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-xl border border-gray-200 bg-gray-50/50 p-5 md:grid-cols-3">
                                {isPakistanMarket ? (
                                    <>
                                        <div className="space-y-1.5">
                                            <Label className={cn(MOBILE_LABEL_CLASS, 'font-semibold text-gray-700')}>CNIC</Label>
                                            <Input 
                                                value={formData.cnic || ''} 
                                                onChange={handleCNICChange} 
                                                placeholder="42201-1234567-1" 
                                                className={cn(MOBILE_INPUT_CLASS, 'font-mono h-10 text-[15px]')} 
                                                maxLength={15}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        document.querySelector('input[name="ntn-input"]')?.focus();
                                                    }
                                                }}
                                            />
                                            {errors?.cnic && <FormError message={errors.cnic} />}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className={cn(MOBILE_LABEL_CLASS, 'font-semibold text-gray-700')}>{taxIdLabel || 'NTN'}</Label>
                                            <Input 
                                                name="ntn-input"
                                                value={formData.ntn || ''} 
                                                onChange={handleNTNChange} 
                                                placeholder="1234567-8" 
                                                className={cn(MOBILE_INPUT_CLASS, 'font-mono h-10 text-[15px]')} 
                                                maxLength={9}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        document.querySelector('input[name="srn-input"]')?.focus();
                                                    }
                                                }}
                                            />
                                            {errors?.ntn && <FormError message={errors.ntn} />}
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className={cn(MOBILE_LABEL_CLASS, 'font-semibold text-gray-700')}>SRN</Label>
                                            <Input 
                                                name="srn-input"
                                                value={formData.srn || ''} 
                                                onChange={(e) => handleInputChange('srn', e.target.value)} 
                                                placeholder="12-34-5678-910-1" 
                                                className={cn(MOBILE_INPUT_CLASS, 'font-mono h-10 text-[15px]')}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        document.querySelector('select[name="filer-status"]')?.focus();
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className={cn(MOBILE_LABEL_CLASS, 'font-semibold text-gray-700')}>FBR Filer Status</Label>
                                            <select 
                                                name="filer-status"
                                                className={cn(MOBILE_INPUT_CLASS, 'w-full border border-input bg-background px-3 h-10 text-[15px]')} 
                                                value={formData.filer_status || 'none'} 
                                                onChange={(e) => handleInputChange('filer_status', e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        document.querySelector('input[name="credit-limit"]')?.focus();
                                                    }
                                                }}
                                            >
                                                <option value="none">Not Verified</option>
                                                <option value="active">Active (Filer)</option>
                                                <option value="inactive">Inactive (Non-Filer)</option>
                                            </select>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-1.5 md:col-span-3">
                                        <Label className={cn(MOBILE_LABEL_CLASS, 'font-semibold text-gray-700')}>{taxIdLabel}</Label>
                                        <Input 
                                            value={formData.ntn || ''} 
                                            onChange={(e) => handleInputChange('ntn', e.target.value)} 
                                            placeholder={`${taxIdLabel} / registration number`} 
                                            className={cn(MOBILE_INPUT_CLASS, 'h-10 text-[15px]')}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    document.querySelector('input[name="credit-limit"]')?.focus();
                                                }
                                            }}
                                        />
                                        {errors?.ntn && <FormError message={errors.ntn} />}
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <Label className={cn(MOBILE_LABEL_CLASS, 'font-semibold text-gray-700 flex items-center gap-1.5')}>
                                        <Wallet className="h-3.5 w-3.5" />
                                        Credit Limit ({currency})
                                    </Label>
                                    <Input 
                                        type="number" 
                                        name="credit-limit"
                                        value={formData.credit_limit || ''} 
                                        onChange={(e) => handleInputChange('credit_limit', e.target.value)} 
                                        placeholder="0" 
                                        className={cn(MOBILE_INPUT_CLASS, 'h-10 text-[15px] tabular-nums')}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                document.querySelector('input[name="opening-balance-tax"]')?.focus();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className={cn(MOBILE_LABEL_CLASS, 'font-semibold text-gray-700')}>Opening Balance ({currency})</Label>
                                    <Input 
                                        type="number" 
                                        name="opening-balance-tax"
                                        value={formData.opening_balance || ''} 
                                        onChange={(e) => handleInputChange('opening_balance', e.target.value)} 
                                        placeholder="0" 
                                        className={cn(MOBILE_INPUT_CLASS, 'h-10 text-[15px] tabular-nums')}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSubmit();
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    )}

                    {!isWaterRoute && (
                        <TabsContent value="domain" className="mt-0 space-y-4">
                        {domainFields.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 md:grid-cols-2">
                                {domainFields.map(field => {
                                    const key = normalizeKey(field);
                                    return (
                                        <DomainFieldRenderer
                                            key={field}
                                            field={key}
                                            value={formData.domain_data?.[key] || ''}
                                            onChange={(val) => {
                                                const nextDomain = { ...formData.domain_data, [key]: val };
                                                if (key === 'city') {
                                                    // Refresh area options for the new city; clear stale area/postal.
                                                    nextDomain.deliveryarea = '';
                                                    nextDomain.postalcode = '';
                                                    nextDomain.areacode = '';
                                                }
                                                setFormData({
                                                    ...formData,
                                                    domain_data: nextDomain,
                                                });
                                            }}
                                            onDomainPatch={(patch) => {
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    domain_data: { ...prev.domain_data, ...patch },
                                                }));
                                            }}
                                            category={category}
                                            product={formData.domain_data || {}}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
                                No domain-specific fields for this category
                            </div>
                        )}
                    </TabsContent>
                    )}
                </Tabs>
            </CardContent>

            <div className={cn(MOBILE_FORM_FOOTER, 'flex items-center justify-between gap-3 border-t bg-gray-50/50')}>
                <div className="text-xs text-gray-500 hidden sm:block">
                    Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-mono shadow-sm">Enter</kbd> to move between fields
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={onClose} 
                        className="h-10 px-5 text-gray-600 hover:text-gray-900"
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="button" 
                        onClick={handleSubmit} 
                        disabled={isLoading} 
                        className="h-10 bg-emerald-600 px-8 text-[15px] font-semibold hover:bg-emerald-700 shadow-sm"
                    >
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                        ) : (
                            initialData ? 'Update Customer' : 'Add Customer'
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
