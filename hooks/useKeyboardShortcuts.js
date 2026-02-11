import { useEffect, useCallback } from 'react';

/**
 * Keyboard Shortcuts Hook
 * Registers global keyboard shortcuts for forms and components
 * 
 * @param {Object} shortcuts - Map of key combinations to handlers
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 * 
 * @example
 * useKeyboardShortcuts({
 *   'Ctrl+s': handleSave,
 *   'Ctrl+b': () => focusBarcode(),
 *   'Escape': handleClose,
 *   'Ctrl+Shift+d': fillDemoData
 * });
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
    const handleKeyDown = useCallback((e) => {
        if (!enabled) return;

        // Build the key combination string
        const parts = [];
        if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
        if (e.shiftKey) parts.push('Shift');
        if (e.altKey) parts.push('Alt');

        // Normalize key name
        let key = e.key;
        if (key === ' ') key = 'Space';
        if (key.length === 1) key = key.toLowerCase();

        parts.push(key);
        const combination = parts.join('+');

        // Check if this combination has a handler
        const handler = shortcuts[combination];

        if (handler) {
            // Prevent default browser behavior
            e.preventDefault();
            e.stopPropagation();

            // Execute handler
            handler(e);
        }
    }, [shortcuts, enabled]);

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown, enabled]);
}

/**
 * Common keyboard shortcuts for forms
 */
export const COMMON_SHORTCUTS = {
    SAVE: 'Ctrl+s',
    CANCEL: 'Escape',
    SUBMIT: 'Ctrl+Enter',
    DEMO_DATA: 'Ctrl+Shift+d',
    FOCUS_SEARCH: 'Ctrl+k',
    FOCUS_BARCODE: 'Ctrl+b',
    NEW_ITEM: 'Ctrl+n',
    DELETE: 'Delete',
    DUPLICATE: 'Ctrl+d'
};

/**
 * Keyboard Shortcuts Help Component
 * Displays available shortcuts to the user
 */
export function KeyboardShortcutsHelp({ shortcuts, visible = false }) {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                <h3 className="text-lg font-bold mb-4">Keyboard Shortcuts</h3>
                <div className="space-y-2">
                    {Object.entries(shortcuts).map(([key, description]) => (
                        <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">{description}</span>
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                                {key.replace('Ctrl', '⌘').replace('Shift', '⇧').replace('Alt', '⌥')}
                            </kbd>
                        </div>
                    ))}
                </div>
                <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">Press <kbd className="px-1 py-0.5 text-xs bg-gray-100 border rounded">?</kbd> to toggle this help</p>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to show/hide keyboard shortcuts help
 */
export function useKeyboardShortcutsHelp() {
    const [visible, setVisible] = useState(false);

    useKeyboardShortcuts({
        '?': () => setVisible(prev => !prev),
        'Escape': () => setVisible(false)
    }, visible || true);

    return { visible, setVisible };
}
