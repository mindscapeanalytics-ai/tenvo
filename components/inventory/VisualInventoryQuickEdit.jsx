'use client';

import { useState, useRef, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Click-to-edit cell for Visual inventory mode (stock, price, tax, etc.).
 */
export function VisualInventoryQuickEdit({
  value,
  displayValue,
  type = 'text',
  align = 'left',
  onCommit,
  className,
  inputClassName,
  disabled = false,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!editing) return;
    setDraft(String(value ?? ''));
    const t = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(t);
  }, [editing, value]);

  const commit = async () => {
    if (saving) return;
    const next = type === 'number' ? draft.trim() : draft;
    if (String(next) === String(value ?? '')) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onCommit?.(next);
      setEditing(false);
    } catch {
      // Parent toasts; keep editor open for retry
    } finally {
      setSaving(false);
    }
  };

  if (disabled) {
    return (
      <span className={cn('block truncate text-xs text-gray-600', align === 'right' && 'text-right', className)}>
        {displayValue ?? value ?? '-'}
      </span>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void commit();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            setEditing(false);
          }
        }}
        className={cn(
          'w-full min-w-0 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs outline-none ring-2 ring-blue-100 tabular-nums',
          align === 'right' && 'text-right',
          inputClassName
        )}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={cn(
        'group/edit flex w-full min-w-0 items-center gap-0.5 rounded px-0.5 py-0 text-left transition-colors hover:bg-blue-50/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-300',
        align === 'right' && 'justify-end text-right',
        className
      )}
      title="Click to edit"
    >
      {displayValue != null && typeof displayValue !== 'string' && typeof displayValue !== 'number' ? (
        displayValue
      ) : (
        <span className="min-w-0 truncate">{displayValue ?? value ?? '-'}</span>
      )}
      <Pencil
        className="h-2.5 w-2.5 shrink-0 text-gray-300 opacity-0 transition-opacity group-hover/edit:opacity-100 group-focus-visible/edit:opacity-100"
        aria-hidden
      />
    </button>
  );
}

export default VisualInventoryQuickEdit;
