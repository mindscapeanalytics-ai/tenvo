'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type HubHeaderAction = {
  id?: string;
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  className?: string;
  onClick: () => void;
  disabled?: boolean;
  badge?: number | string;
  badgeClassName?: string;
};

type ResponsiveManagerHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: HubHeaderAction[];
  className?: string;
  titleClassName?: string;
};

type HubSectionHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  actions?: HubHeaderAction[];
  className?: string;
};

function renderActions(actions: HubHeaderAction[], { mobile = false }: { mobile?: boolean } = {}) {
  return actions.map((action) => (
    <Button
      key={action.id || action.label}
      type="button"
      variant={action.variant || (mobile ? 'outline' : 'default')}
      size={mobile ? 'sm' : 'default'}
      className={cn(
        mobile && 'h-9 flex-1 min-w-[calc(50%-0.25rem)] rounded-xl text-xs font-semibold sm:flex-none sm:min-w-0',
        action.className
      )}
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {action.icon && <action.icon className={cn('shrink-0', mobile ? 'mr-1.5 h-3.5 w-3.5' : 'mr-2 h-4 w-4')} />}
      <span className={mobile ? 'truncate' : undefined}>{action.label}</span>
      {action.badge != null && (
        <Badge className={cn('ml-2', action.badgeClassName || 'bg-yellow-500')}>{action.badge}</Badge>
      )}
    </Button>
  ));
}

/** Compact responsive header for nested hub managers (inventory sub-tabs, etc.). */
export function ResponsiveManagerHeader({
  title,
  subtitle,
  actions = [],
  className,
  titleClassName,
}: ResponsiveManagerHeaderProps) {
  return (
    <div className={cn('min-w-0 space-y-2.5', className)}>
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className={cn('text-base font-bold text-gray-900 lg:text-xl', titleClassName)}>{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground lg:text-sm">{subtitle}</p>
          )}
        </div>
        {actions.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2 lg:hidden">{renderActions(actions, { mobile: true })}</div>
            <div className="hidden shrink-0 flex-wrap gap-2 lg:flex">{renderActions(actions)}</div>
          </>
        )}
      </div>
    </div>
  );
}

/** Responsive hub section header — compact on mobile, full row on desktop. */
export function HubSectionHeader({
  title,
  subtitle,
  badge,
  icon: Icon,
  iconClassName,
  actions = [],
  className,
}: HubSectionHeaderProps) {
  return (
    <div className={cn('min-w-0 space-y-3', className)}>
      <div className="space-y-2.5 lg:hidden">
        <div className="flex min-w-0 items-start gap-2.5">
          {Icon && (
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                iconClassName || 'bg-gray-100 text-gray-700'
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="text-base font-bold leading-snug text-gray-900">{title}</h2>
              {badge && (
                <Badge variant="outline" className="max-w-full truncate text-[10px] font-medium capitalize opacity-80">
                  {badge}
                </Badge>
              )}
            </div>
            {subtitle && (
              <p className="mt-0.5 text-[11px] font-medium leading-snug text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">{renderActions(actions, { mobile: true })}</div>
        )}
      </div>

      <div className="hidden items-start justify-between gap-4 lg:flex">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {Icon && (
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  iconClassName || 'bg-gray-100 text-gray-700'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            )}
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {badge && (
              <Badge variant="outline" className="ml-1 capitalize opacity-70">
                {badge}
              </Badge>
            )}
          </div>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {actions.length > 0 && (
          <div className="flex shrink-0 gap-2">{renderActions(actions)}</div>
        )}
      </div>
    </div>
  );
}
