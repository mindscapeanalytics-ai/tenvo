'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  MOBILE_FORM_BODY,
  MOBILE_FORM_FOOTER,
  MOBILE_FORM_HEADER,
  MOBILE_LINE_TABLE_WRAP,
} from '@/lib/utils/formMobileStyles';

export function MobileFormHeader({
  title,
  subtitle,
  icon: Icon,
  onClose,
  actions,
  className,
  tone = 'default',
}) {
  return (
    <div
      className={cn(
        MOBILE_FORM_HEADER,
        tone === 'wine' && 'border-wine/10 bg-wine/[0.03]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 sm:text-base">
            {Icon && <Icon className="h-4 w-4 shrink-0 text-emerald-600" />}
            <span className="truncate">{title}</span>
          </h2>
          {subtitle && (
            <p className="mt-0.5 truncate text-[11px] text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function MobileFormBody({ children, className }) {
  return (
    <div className={cn(MOBILE_FORM_BODY, className)}>
      {children}
    </div>
  );
}

export function MobileFormFooter({ children, className, sticky = true }) {
  return (
    <div
      className={cn(
        MOBILE_FORM_FOOTER,
        sticky && 'sticky bottom-0 z-10',
        className
      )}
    >
      {children}
    </div>
  );
}

export function MobileFormActions({
  onCancel,
  cancelLabel = 'Cancel',
  onSubmit,
  submitLabel = 'Save',
  isLoading = false,
  submitIcon: SubmitIcon,
  extra,
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      {extra}
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="h-10 rounded-xl px-3 text-sm font-semibold sm:h-10"
        >
          {cancelLabel}
        </Button>
      )}
      {onSubmit && (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 sm:h-10"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">Saving…</span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              {SubmitIcon && <SubmitIcon className="h-3.5 w-3.5" />}
              {submitLabel}
            </span>
          )}
        </Button>
      )}
    </div>
  );
}

export function MobileLineTable({ children, className }) {
  return (
    <div className={cn(MOBILE_LINE_TABLE_WRAP, className)}>
      {children}
    </div>
  );
}
