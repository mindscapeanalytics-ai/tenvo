'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

/**
 * DatePicker Component
 * Professional date picker with proper error handling
 * 
 * @param {string|Date} value - Date value (ISO string or Date object)
 * @param {Function} onChange - Change handler (receives ISO date string)
 * @param {string} placeholder - Placeholder text
 * @param {string} className - Additional CSS classes
 * @param {Date} minDate - Minimum selectable date
 * @param {Date} maxDate - Maximum selectable date
 */
export function DatePicker({ 
  value, 
  onChange, 
  placeholder = 'Select date', 
  className = '',
  minDate,
  maxDate,
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Normalize value to ISO date string (YYYY-MM-DD)
  const normalizeValue = (val) => {
    if (!val) return '';
    if (typeof val === 'string') {
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      // Otherwise try to parse
      try {
        return new Date(val).toISOString().split('T')[0];
      } catch {
        return '';
      }
    }
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
    return '';
  };

  const normalizedValue = normalizeValue(value);
  const displayValue = normalizedValue 
    ? format(new Date(normalizedValue + 'T00:00:00'), 'MMM dd, yyyy')
    : '';

  // Format min/max dates for input
  const minDateStr = minDate ? normalizeValue(minDate) : '';
  const maxDateStr = maxDate ? normalizeValue(maxDate) : '';

  const handleDateChange = (e) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue || '');
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-full items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className={normalizedValue ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue || placeholder}
        </span>
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[280px]">
            <input
              type="date"
              value={normalizedValue}
              onChange={handleDateChange}
              min={minDateStr}
              max={maxDateStr}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 outline-none"
              autoFocus
            />
          </div>
        </>
      )}
    </div>
  );
}

export function DateRangePicker({ startDate, endDate, onStartDateChange, onEndDateChange }) {
  return (
    <div className="flex items-center gap-2">
      <DatePicker
        value={startDate}
        onChange={onStartDateChange}
        placeholder="Start date"
      />
      <span className="text-gray-400">to</span>
      <DatePicker
        value={endDate}
        onChange={onEndDateChange}
        placeholder="End date"
      />
    </div>
  );
}





