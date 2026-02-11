import { useEffect, useState, useRef } from 'react';
import { debounce } from 'lodash';

/**
 * Autosave Hook
 * Automatically saves form data after a delay of inactivity
 * 
 * @param {Object} data - Form data to save
 * @param {Function} onSave - Async function to save data
 * @param {number} delay - Delay in milliseconds (default: 3000)
 * @param {boolean} enabled - Whether autosave is enabled (default: true)
 * @returns {Object} { isSaving, lastSaved, error }
 * 
 * @example
 * const { isSaving, lastSaved } = useAutosave(
 *   formData,
 *   async (data) => await updateProduct(data),
 *   3000
 * );
 */
export function useAutosave(data, onSave, delay = 3000, enabled = true) {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [error, setError] = useState(null);
    const isFirstRender = useRef(true);
    const previousData = useRef(data);

    useEffect(() => {
        // Skip autosave on first render
        if (isFirstRender.current) {
            isFirstRender.current = false;
            previousData.current = data;
            return;
        }

        // Skip if autosave is disabled
        if (!enabled) return;

        // Skip if data hasn't changed
        if (JSON.stringify(data) === JSON.stringify(previousData.current)) {
            return;
        }

        // Skip if data is empty or invalid
        if (!data || Object.keys(data).length === 0) {
            return;
        }

        const debouncedSave = debounce(async () => {
            setIsSaving(true);
            setError(null);

            try {
                await onSave(data);
                setLastSaved(new Date());
                previousData.current = data;
            } catch (err) {
                console.error('Autosave failed:', err);
                setError(err.message || 'Failed to autosave');
            } finally {
                setIsSaving(false);
            }
        }, delay);

        debouncedSave();

        return () => {
            debouncedSave.cancel();
        };
    }, [data, delay, enabled, onSave]);

    return { isSaving, lastSaved, error };
}

/**
 * Autosave Indicator Component
 * Displays autosave status to the user
 */
export function AutosaveIndicator({ isSaving, lastSaved, error }) {
    if (error) {
        return (
            <div className="flex items-center gap-2 text-xs text-red-600">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>Autosave failed</span>
            </div>
        );
    }

    if (isSaving) {
        return (
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
            </div>
        );
    }

    if (lastSaved) {
        const secondsAgo = Math.floor((new Date() - lastSaved) / 1000);
        const timeAgo = secondsAgo < 60
            ? 'just now'
            : secondsAgo < 3600
                ? `${Math.floor(secondsAgo / 60)}m ago`
                : `${Math.floor(secondsAgo / 3600)}h ago`;

        return (
            <div className="flex items-center gap-2 text-xs text-green-600">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Saved {timeAgo}</span>
            </div>
        );
    }

    return null;
}
