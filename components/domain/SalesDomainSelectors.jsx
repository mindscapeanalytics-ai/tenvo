'use client';

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { getAvailableBatchesAction } from '@/lib/actions/batch';
import { getAvailableSerialsAction } from '@/lib/actions/serial';
import { getDomainKnowledge } from '@/lib/utils/domainHelpers';

/**
 * Component to select a batch number for a product
 */
export function BatchSelector({ productId, businessId, onSelect, selectedBatch, className }) {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!productId || !businessId) return;

        async function loadBatches() {
            setLoading(true);
            const result = await getAvailableBatchesAction(productId, businessId);
            if (result.success) {
                setBatches(result.batches);
                // If previously selected batch is not in list (e.g. quantity became 0), clear it?
                // Actually, if it's already selected, we might want to keep it or visually indicate issue.
                // For now, simple list.
            }
            setLoading(false);
        }

        loadBatches();
    }, [productId, businessId]);

    if (loading) {
        return <div className="flex items-center text-xs text-muted-foreground"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Loading batches...</div>;
    }

    if (batches.length === 0) {
        return <span className="text-xs text-muted-foreground italic">No batches available</span>;
    }

    return (
        <Select
            value={selectedBatch}
            onValueChange={(val) => {
                const batch = batches.find(b => b.batch_number === val);
                onSelect(val, batch?.expiry_date);
            }}
        >
            <SelectTrigger className={`h-8 w-[140px] ${className}`}>
                <SelectValue placeholder="Select Batch" />
            </SelectTrigger>
            <SelectContent>
                {batches.filter(b => b.batch_number && b.batch_number.trim() !== '').map(batch => (
                    <SelectItem key={batch.id} value={batch.batch_number}>
                        {batch.batch_number} (Exp: {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'N/A'}) - Qty: {batch.quantity}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

/**
 * Component to select a serial number for a product
 */
export function SerialSelector({ productId, businessId, onSelect, selectedSerial, className }) {
    const [serials, setSerials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!productId || !businessId) return;

        async function loadSerials() {
            setLoading(true);
            const result = await getAvailableSerialsAction(productId, businessId);
            if (result.success) {
                setSerials(result.serials);
            }
            setLoading(false);
        }

        loadSerials();
    }, [productId, businessId]);

    if (loading) {
        return <div className="flex items-center text-xs text-muted-foreground"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Loading serials...</div>;
    }

    if (serials.length === 0) {
        return <span className="text-xs text-muted-foreground italic">No serials available</span>;
    }

    return (
        <Select
            value={selectedSerial}
            onValueChange={(val) => onSelect(val)}
        >
            <SelectTrigger className={`h-8 w-[140px] ${className}`}>
                <SelectValue placeholder="Select Serial" />
            </SelectTrigger>
            <SelectContent>
                {serials.filter(s => s.serial_number && s.serial_number.trim() !== '').map(serial => (
                    <SelectItem key={serial.id} value={serial.serial_number}>
                        {serial.serial_number}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
