'use client';

import { useState } from 'react';
import { addStockAction } from '@/lib/actions/standard/inventory/stock';
import { createInvoiceAction } from '@/lib/actions/basic/invoice';
import { createGLEntryAction } from '@/lib/actions/basic/accounting';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/lib/auth-client';

export default function VerifyMigrationPage() {
    const { data: session } = useSession();
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState({});

    const addLog = (key, status, message) => {
        setResults(prev => ({
            ...prev,
            [key]: { status, message, timestamp: new Date().toLocaleTimeString() }
        }));
    };

    const runTest = async (key, actionFn) => {
        setLoading(prev => ({ ...prev, [key]: true }));
        try {
            const res = await actionFn();
            addLog(key, res.success ? 'Success' : 'Failed', res.success ? JSON.stringify(res) : res.error);
        } catch (e) {
            addLog(key, 'Error', e.message);
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    // Test 1: Add Stock (Requires Business ID)
    const testStock = async () => {
        if (!session?.user?.id) return addLog('stock', 'Error', 'No session');

        // We need a valid business ID. Using the one from session if available (though Better Auth might not store it on user yet properly without custom Session)
        // Or we assume the user has switched context.
        // For verify, we might need to hardcode or pick from a list.
        // Let's assume we invoke with a fake ID to test FAILURE (Security Check) first.

        await runTest('stock_fail', () => addStockAction({
            businessId: 'invalid-uuid',
            productId: 'fake-prod',
            warehouseId: 'fake-wh',
            quantity: 10,
            costPrice: 100
        }));
    };

    const testStockSuccess = async () => {
        // This requires real IDs. 
        // We can't really run "Success" easily without picking real data.
        addLog('stock_success', 'Info', 'Skipping "Success" test - requires valid Business/Product IDs. Test via main UI.');
    };

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold">Migration Verification</h1>

            <Card>
                <CardHeader><CardTitle>Auth Session</CardTitle></CardHeader>
                <CardContent>
                    <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(session, null, 2)}
                    </pre>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader><CardTitle>System & Port Config</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <div className="text-sm">
                            <strong>Platform Port:</strong> 3000
                        </div>
                        <div className="text-sm">
                            <strong>Auth URL:</strong> {process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'Not Set'}
                        </div>
                        <Button
                            onClick={() => {
                                const url = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
                                if (!url) return addLog('env', 'Error', 'NEXT_PUBLIC_BETTER_AUTH_URL is missing');
                                if (url.includes('3001')) return addLog('env', 'Warning', 'Still using port 3001. Expected 3000.');
                                addLog('env', 'Success', `Configured correctly: ${url}`);
                            }}
                            variant="outline"
                        >
                            Verify Env
                        </Button>
                        {results['env'] && (
                            <div className={`p-2 rounded text-sm ${results['env'].status === 'Success' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                <strong>{results['env'].status}:</strong> {results['env'].message}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Stock Action Security</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <Button
                            onClick={testStock}
                            disabled={loading['stock_fail']}
                            variant="destructive"
                        >
                            Test Invalid Access
                        </Button>
                        {results['stock_fail'] && (
                            <div className={`p-2 rounded text-sm ${results['stock_fail'].status === 'Success' ? 'bg-green-100' : 'bg-red-100'}`}>
                                <strong>{results['stock_fail'].status}:</strong> {results['stock_fail'].message}
                                <div className="text-xs text-slate-500">Should fail with Unauthorized if RLS/Checks work</div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Add more cards for Invoice, Accounting */}
            </div>
        </div>
    );
}
