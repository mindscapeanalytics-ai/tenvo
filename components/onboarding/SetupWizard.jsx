'use client';

import { useState, useEffect, useMemo } from 'react';
import { useBusiness } from '@/lib/context/BusinessContext';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, Package, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { getDomainColors } from '@/lib/domainColors';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { seedRegistrationInventoryAction } from '@/lib/actions/basic/business';
import { formatCurrency } from '@/lib/currency';

/**
 * SetupWizard Component
 * Onboarding wizard to help users populate their inventory with domain-specific templates
 */
export function SetupWizard({ onComplete, category = 'retail-shop' }) {
    const { business, regionalStandards } = useBusiness();
    const colors = getDomainColors(category);
    const countryIso = regionalStandards?.countryCode || 'PK';
    const domainKnowledge = useMemo(
        () => getDomainKnowledge(category, { countryIso }),
        [category, countryIso]
    );

    const [step, setStep] = useState('welcome');
    const [loading, setLoading] = useState(false);
    const [seedingSelection, setSeedingSelection] = useState([]);

    const setupTemplate = domainKnowledge?.setupTemplate || {};
    const suggestedProducts = setupTemplate.suggestedProducts || setupTemplate.suggestedItems || [];
    const taxLabel = regionalStandards?.taxLabel || 'Tax';

    useEffect(() => {
        if (suggestedProducts.length > 0) {
            setSeedingSelection(suggestedProducts.map(p => p.name));
        }
    }, [suggestedProducts]);

    const toggleProduct = (name) => {
        setSeedingSelection(prev =>
            prev.includes(name)
                ? prev.filter(n => n !== name)
                : [...prev, name]
        );
    };

    const handleSeed = async () => {
        setLoading(true);
        try {
            const result = await seedRegistrationInventoryAction({
                businessId: business?.id,
                domainKey: category,
                countryIso,
                itemNames: seedingSelection,
            });

            if (result.success) {
                toast.success(`Successfully initialized ${result.count} products!`);
                setStep('finish');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Seeding failed:', error);
            toast.error('Failed to initialize inventory');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'welcome') {
        return (
            <Card className="max-w-2xl mx-auto border-none shadow-2xl bg-white/90 backdrop-blur-xl">
                <CardContent className="pt-12 pb-12 px-12 text-center space-y-6">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-inner"
                        style={{ backgroundColor: `${colors.primary}10`, color: colors.primary, boxShadow: `0 0 20px ${colors.primary}20` }}
                    >
                        <Sparkles className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        Welcome to {business?.business_name || business?.name || 'Your Business'}
                    </h2>
                    <p className="text-gray-500 text-lg max-w-md mx-auto">
                        We&apos;ve calibrated your <span className="font-bold" style={{ color: colors.primary }}>{category.replace(/-/g, ' ')}</span> workspace for{' '}
                        <span className="font-bold">{regionalStandards?.countryName || countryIso}</span> — {taxLabel}, local brands, and starter SKUs.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-8">
                        <div className="p-4 rounded-xl border transition-all hover:shadow-md" style={{ backgroundColor: `${colors.primary}05`, borderColor: `${colors.primary}20` }}>
                            <CheckCircle2 className="w-5 h-5 mb-2" style={{ color: colors.primary }} />
                            <h3 className="font-bold text-sm">Smart Config</h3>
                            <p className="text-xs text-gray-500">Fields tuned for {category.replace(/-/g, ' ')}</p>
                        </div>
                        <div className="p-4 rounded-xl border transition-all hover:shadow-md" style={{ backgroundColor: `${colors.primary}05`, borderColor: `${colors.primary}20` }}>
                            <CheckCircle2 className="w-5 h-5 mb-2" style={{ color: colors.primary }} />
                            <h3 className="font-bold text-sm">Tax Compliance</h3>
                            <p className="text-xs text-gray-500">{taxLabel} defaults for {regionalStandards?.countryName || countryIso}</p>
                        </div>
                        <div className="p-4 rounded-xl border transition-all hover:shadow-md" style={{ backgroundColor: `${colors.primary}05`, borderColor: `${colors.primary}20` }}>
                            <CheckCircle2 className="w-5 h-5 mb-2" style={{ color: colors.primary }} />
                            <h3 className="font-bold text-sm">Starter Inventory</h3>
                            <p className="text-xs text-gray-500">{suggestedProducts.length} market-aware templates</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-8">
                        <Button
                            onClick={() => setStep('seed')}
                            className="w-full h-12 text-lg font-bold text-white shadow-xl transition-all active:scale-95"
                            style={{ backgroundColor: colors.primary, boxShadow: `0 10px 20px -5px ${colors.primary}40` }}
                        >
                            Get Started <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onComplete}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            Skip setup for now
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (step === 'seed') {
        return (
            <Card className="max-w-3xl mx-auto border-none shadow-2xl bg-white/90 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-black">Quick Start Inventory</CardTitle>
                    <CardDescription>
                        Select standard items for {regionalStandards?.countryName || countryIso} — prices and tax use your registration defaults
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {suggestedProducts.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No templates available for this category yet.</p>
                            <Button variant="outline" onClick={() => setStep('finish')} className="mt-4">
                                Skip Setup
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
                            {suggestedProducts.map((product) => (
                                <div
                                    key={product.name}
                                    onClick={() => toggleProduct(product.name)}
                                    className={cn(
                                        "cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-3",
                                        seedingSelection.includes(product.name)
                                            ? "shadow-sm"
                                            : "border-gray-100 bg-gray-50 hover:border-gray-200"
                                    )}
                                    style={seedingSelection.includes(product.name) ? { borderColor: colors.primary, backgroundColor: `${colors.primary}05` } : {}}
                                >
                                    <div
                                        className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                                            seedingSelection.includes(product.name) ? "text-white" : "border-gray-300"
                                        )}
                                        style={seedingSelection.includes(product.name) ? { backgroundColor: colors.primary, borderColor: colors.primary } : {}}
                                    >
                                        {seedingSelection.includes(product.name) && <CheckCircle2 className="w-3.5 h-3.5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900">{product.name}</h4>
                                        <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                                        {product.defaultPrice != null && (
                                            <Badge variant="secondary" className="mt-2 text-[10px] font-bold">
                                                {formatCurrency(product.defaultPrice, regionalStandards?.currency || 'PKR')}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t pt-6">
                        <div className="text-sm text-gray-500">
                            Selected <span className="font-bold text-gray-900">{seedingSelection.length}</span> items
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => setStep('finish')}>Skip</Button>
                            <Button
                                onClick={handleSeed}
                                disabled={loading || seedingSelection.length === 0}
                                className="text-white font-bold px-8 shadow-lg active:scale-95 transition-all"
                                style={{ backgroundColor: colors.primary, boxShadow: `0 8px 16px -4px ${colors.primary}40` }}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Package className="w-5 h-5 mr-2" />}
                                Import Selected
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-md mx-auto text-center border-none shadow-2xl bg-white/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
            <CardContent className="pt-12 pb-12 px-8 space-y-6">
                <div className={`w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6`}>
                    <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Setup Complete!</h2>
                    <p className="text-gray-500 mt-2">
                        Your {category.replace(/-/g, ' ')} workspace is ready for action.
                    </p>
                </div>
                <Button
                    onClick={onComplete}
                    className="w-full h-12 text-lg font-bold bg-gray-900 text-white hover:bg-black"
                >
                    Go to Dashboard
                </Button>
            </CardContent>
        </Card>
    );
}
