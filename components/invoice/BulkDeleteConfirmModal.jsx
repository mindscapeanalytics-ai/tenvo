'use client';

import { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => Promise<void>} props.onConfirm
 * @param {number} props.selectedCount
 * @param {Array<{id: string, grand_total?: number, payment_status?: string|null, status?: string}>} props.selectedInvoices
 * @param {boolean} [props.isLoading]
 */
export function BulkDeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    selectedCount,
    selectedInvoices = [],
    isLoading = false
}) {
    const [confirmText, setConfirmText] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleConfirm = async () => {
        if (!isConfirmed || confirmText !== 'DELETE') {
            return;
        }
        
        await onConfirm();
        // Reset state
        setConfirmText('');
        setIsConfirmed(false);
    };

    const handleClose = () => {
        if (!isLoading) {
            setConfirmText('');
            setIsConfirmed(false);
            onClose();
        }
    };

    // Calculate total amount being deleted
    const totalAmount = selectedInvoices.reduce((sum, inv) => sum + (Number(inv.grand_total) || 0), 0);
    const paidInvoices = selectedInvoices.filter(inv => inv.payment_status === 'paid' || inv.status === 'paid');

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-6 h-6" />
                        Confirm Bulk Delete
                    </DialogTitle>
                    <DialogDescription className="text-left">
                        You are about to delete <strong>{selectedCount}</strong> invoice(s). 
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Warning Box */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-semibold text-red-900 mb-2">Warning</h4>
                        <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                            <li>Deleted invoices will be marked as voided</li>
                            <li>Stock will be restored for inventory items</li>
                            <li>Customer balances will be reversed</li>
                            <li>Accounting entries will be reversed</li>
                            {paidInvoices.length > 0 && (
                                <li className="font-semibold">
                                    {paidInvoices.length} paid invoice(s) included - payments will remain recorded
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Invoices to delete:</span>
                            <span className="font-medium">{selectedCount}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Total amount:</span>
                            <span className="font-medium">₨{totalAmount.toFixed(2)}</span>
                        </div>
                        {paidInvoices.length > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Paid invoices:</span>
                                <span className="font-medium text-red-600">{paidInvoices.length}</span>
                            </div>
                        )}
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="flex items-start space-x-2">
                        <Checkbox
                            id="confirm"
                            checked={isConfirmed}
                            onCheckedChange={setIsConfirmed}
                            disabled={isLoading}
                        />
                        <Label htmlFor="confirm" className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            I understand that deleting these invoices will restore stock, reverse customer balances, 
                            and void all associated records. This action cannot be undone.
                        </Label>
                    </div>

                    {/* Type DELETE to confirm */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmText" className="text-sm">
                            Type <strong className="text-red-600">DELETE</strong> to confirm:
                        </Label>
                        <Input
                            id="confirmText"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type DELETE"
                            disabled={isLoading || !isConfirmed}
                            className={confirmText === 'DELETE' ? 'border-red-500 bg-red-50' : ''}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1"
                        disabled={isLoading}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        disabled={!isConfirmed || confirmText !== 'DELETE' || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete {selectedCount} Invoice{selectedCount !== 1 ? 's' : ''}
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
