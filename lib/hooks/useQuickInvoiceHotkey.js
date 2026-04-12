import { useEffect, useState, useCallback } from 'react';

/**
 * useQuickInvoiceHotkey Hook
 * Manages global hotkey binding (Ctrl+I / Cmd+I) for Quick Invoice Modal
 * Works across entire application
 */
export function useQuickInvoiceHotkey() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+I or Cmd+I to open quick invoice
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return {
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen(prev => !prev),
    };
}

/**
 * Enhanced keyboard shortcuts for invoice workflows
 */
export const INVOICE_HOTKEYS = {
    QUICK_INVOICE: { key: 'Ctrl+I', description: 'Open Quick Checkout' },
    CLOSE: { key: 'Esc', description: 'Close modal' },
    ADD_ITEM: { key: 'Enter', description: 'Add selected item' },
    COMPLETE_SALE: { key: 'Shift+Enter', description: 'Complete sale' },
    CLEAR_CART: { key: 'Ctrl+C', description: 'Clear cart' },
    ZOOM_QTY: { key: '+/-', description: 'Adjust quantity' },
    PAYMENT_METHOD: { key: 'Ctrl+P', description: 'Toggle payment options' },
    DISCOUNT: { key: 'Ctrl+D', description: 'Adjust discount' },
};
