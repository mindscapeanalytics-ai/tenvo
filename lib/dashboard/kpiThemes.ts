/**
 * Shared KPI card visual themes — AIC-inspired tinted gradients per metric.
 */

export type KpiTheme = 'blue' | 'cyan' | 'emerald' | 'violet' | 'rose' | 'amber' | 'slate';

export const KPI_THEMES: Record<
    KpiTheme,
    {
        card: string;
        icon: string;
        sparkStroke: string;
        sparkFill: string;
        orb: string;
    }
> = {
    blue: {
        card: 'border-slate-200/90 bg-white',
        icon: 'bg-blue-500 shadow-blue-500/20',
        sparkStroke: 'stroke-blue-500',
        sparkFill: 'fill-blue-500/15',
        orb: 'bg-blue-400/20',
    },
    cyan: {
        card: 'border-slate-200/90 bg-white',
        icon: 'bg-cyan-500 shadow-cyan-500/20',
        sparkStroke: 'stroke-cyan-500',
        sparkFill: 'fill-cyan-500/15',
        orb: 'bg-cyan-400/20',
    },
    emerald: {
        card: 'border-slate-200/90 bg-white',
        icon: 'bg-emerald-500 shadow-emerald-500/20',
        sparkStroke: 'stroke-emerald-500',
        sparkFill: 'fill-emerald-500/15',
        orb: 'bg-emerald-400/20',
    },
    violet: {
        card: 'border-slate-200/90 bg-white',
        icon: 'bg-violet-500 shadow-violet-500/20',
        sparkStroke: 'stroke-violet-500',
        sparkFill: 'fill-violet-500/15',
        orb: 'bg-violet-400/20',
    },
    rose: {
        card: 'border-slate-200/90 bg-white',
        icon: 'bg-rose-500 shadow-rose-500/20',
        sparkStroke: 'stroke-rose-500',
        sparkFill: 'fill-rose-500/12',
        orb: 'bg-rose-400/20',
    },
    amber: {
        card: 'border-slate-200/90 bg-white',
        icon: 'bg-amber-500 shadow-amber-500/20',
        sparkStroke: 'stroke-amber-500',
        sparkFill: 'fill-amber-500/15',
        orb: 'bg-amber-400/20',
    },
    slate: {
        card: 'border-slate-200/90 bg-white',
        icon: 'bg-slate-600 shadow-slate-500/20',
        sparkStroke: 'stroke-slate-500',
        sparkFill: 'fill-slate-500/12',
        orb: 'bg-slate-400/15',
    },
};
