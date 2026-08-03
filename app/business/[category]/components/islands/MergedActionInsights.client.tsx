'use client';

import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IndustryInsights } from './IndustryInsights.client';

interface ActionInsight {
    title: string;
    text: string;
    tone: string;
    actionTab: string;
}

interface MergedActionInsightsProps {
    category: string;
    domainKnowledge?: Record<string, unknown> | null;
    operationalInsights: ActionInsight[];
    reminders: { lowStock?: number; overdueInvoices?: number; pendingOrders?: number };
    onQuickAction?: (actionId: string) => void;
    className?: string;
    /** all = playbook+alerts (default); playbook | alerts for split layout bands */
    sections?: 'all' | 'playbook' | 'alerts';
}

function filterOperationalInsights(
    operationalInsights: ActionInsight[],
    domainKnowledge: Record<string, unknown> | null | undefined,
    reminders: { lowStock?: number; overdueInvoices?: number; pendingOrders?: number }
) {
    const intel = (domainKnowledge?.intelligence ?? {}) as Record<string, unknown>;
    return operationalInsights
        .filter((insight) => {
            if (reminders.lowStock && reminders.lowStock > 0 && insight.title === 'Predictive Restock') {
                return false;
            }
            if (reminders.overdueInvoices && reminders.overdueInvoices > 0 && insight.title === 'Collections Alert') {
                return false;
            }
            if (intel.seasonality && (insight.title === 'Seasonal Peak' || insight.title === 'Seasonal Planning')) {
                return false;
            }
            if (Number(intel.demandVolatility) > 0.6 && insight.title === 'Demand Volatility') {
                return false;
            }
            if (intel.perishability && String(intel.perishability).toLowerCase() !== 'low' && insight.title === 'Shelf-Life Risk') {
                return false;
            }
            return true;
        })
        .slice(0, 3);
}

function ActionAlertsPanel({
    alerts,
    onQuickAction,
    className,
    fillHeight,
}: {
    alerts: ActionInsight[];
    onQuickAction?: (actionId: string) => void;
    className?: string;
    fillHeight?: boolean;
}) {
    if (!alerts.length) return null;
    return (
        <div
            className={cn(
                'rounded-2xl border border-gray-100 bg-white p-3 shadow-sm',
                fillHeight && 'flex min-h-0 flex-1 flex-col',
                className
            )}
        >
            <div className="mb-1 flex shrink-0 items-center gap-2">
                <Zap className="h-4 w-4 shrink-0 fill-amber-500 text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-900">Action alerts</h3>
            </div>
            <p className="mb-2 shrink-0 text-[10px] leading-snug text-slate-500">
                Tap an alert to open the related workspace tab.
            </p>
            <div
                className={cn(
                    'space-y-1.5 overflow-y-auto overscroll-y-contain pr-1',
                    fillHeight ? 'min-h-0 flex-1' : 'max-h-[9.5rem]'
                )}
            >
                {alerts.map((insight, idx) => (
                    <button
                        key={`${insight.title}-${idx}`}
                        type="button"
                        onClick={() => onQuickAction?.(insight.actionTab)}
                        className={cn(
                            'w-full rounded-xl border p-2 text-left transition-all hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30',
                            insight.tone === 'indigo' && 'border-brand-100 bg-brand-50 hover:bg-brand-100/50',
                            insight.tone === 'emerald' && 'border-emerald-100 bg-emerald-50 hover:bg-emerald-100/50',
                            insight.tone === 'amber' && 'border-amber-100 bg-amber-50 hover:bg-amber-100/50',
                            insight.tone === 'rose' && 'border-rose-100 bg-rose-50 hover:bg-rose-100/50',
                            insight.tone === 'slate' && 'border-slate-100 bg-slate-50 hover:bg-slate-100/60'
                        )}
                    >
                        <p className="text-[11px] font-semibold text-slate-700">{insight.title}</p>
                        <p className="mt-1 text-[10px] leading-snug text-slate-600">{insight.text}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}

/** Domain playbook + deduped operational alerts — can split across dashboard bands. */
export function MergedActionInsights({
    category,
    domainKnowledge,
    operationalInsights,
    reminders,
    onQuickAction,
    className,
    sections = 'all',
}: MergedActionInsightsProps) {
    const alerts = filterOperationalInsights(operationalInsights, domainKnowledge, reminders);
    const showPlaybook = sections === 'all' || sections === 'playbook';
    const showAlerts = sections === 'all' || sections === 'alerts';
    const fillColumn = Boolean(className?.includes('h-full'));

    if (!showPlaybook && showAlerts) {
        return (
            <ActionAlertsPanel
                alerts={alerts}
                onQuickAction={onQuickAction}
                className={className}
                fillHeight={fillColumn}
            />
        );
    }

    return (
        <div className={cn('space-y-1.5', fillColumn && 'flex min-h-0 flex-col', className)}>
            {showPlaybook ? (
                <div className={cn(fillColumn && showAlerts && 'shrink-0')}>
                    <IndustryInsights category={category} domainKnowledge={domainKnowledge} variant="compact" />
                </div>
            ) : null}
            {showAlerts ? (
                <ActionAlertsPanel
                    alerts={alerts}
                    onQuickAction={onQuickAction}
                    fillHeight={fillColumn}
                />
            ) : null}
        </div>
    );
}
