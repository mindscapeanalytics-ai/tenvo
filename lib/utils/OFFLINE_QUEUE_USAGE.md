# Offline Queue with IndexedDB - Usage Guide

## Overview

The offline queue system provides offline-first capabilities for inventory operations. When the user is offline, stock movements are queued in IndexedDB and automatically synced when the connection is restored.

## Features

- **IndexedDB Storage**: Persistent storage for offline operations
- **Automatic Sync**: Operations sync automatically when connection is restored
- **Conflict Resolution**: Detects and handles concurrent updates
- **Retry Logic**: Exponential backoff for failed operations
- **Queue Statistics**: Real-time stats on pending, completed, and failed operations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Action (Offline)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              useMultiLocationSync Hook                       │
│  - Detects offline status                                    │
│  - Queues operation in IndexedDB                             │
│  - Returns queued status to user                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  IndexedDB (Browser)                         │
│  Store: operations                                           │
│    - id, type, data, status, timestamp                       │
│    - retryCount, lastRetry, error                            │
│  Store: conflicts                                            │
│    - id, operationId, localData, serverData                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ (Connection Restored)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Automatic Sync Process                          │
│  1. Detect online status                                     │
│  2. Get pending operations                                   │
│  3. Execute each operation                                   │
│  4. Handle conflicts                                         │
│  5. Update operation status                                  │
│  6. Remove completed operations                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase (Server)                           │
│  - Stock transfers                                           │
│  - Receipt confirmations                                     │
│  - Product locations                                         │
└─────────────────────────────────────────────────────────────┘
```

## Usage

### 1. Basic Integration

The offline queue is automatically integrated into `useMultiLocationSync` hook:

```javascript
import { useMultiLocationSync } from '@/lib/hooks/useMultiLocationSync';

function MyComponent({ businessId }) {
  const {
    transferStock,
    confirmReceipt,
    isOnline,
    syncing,
    syncOfflineQueue
  } = useMultiLocationSync(businessId);

  // Operations automatically queue when offline
  const handleTransfer = async () => {
    try {
      const result = await transferStock({
        product_id: 'prod-123',
        from_warehouse_id: 'wh-1',
        to_warehouse_id: 'wh-2',
        quantity: 10,
        notes: 'Transfer for restocking'
      });

      if (result.status === 'queued') {
        toast.info('Transfer queued. Will sync when online.');
      } else {
        toast.success('Transfer completed successfully');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      <button onClick={handleTransfer}>Transfer Stock</button>
      {!isOnline && <p>Offline - operations will be queued</p>}
      {syncing && <p>Syncing queued operations...</p>}
    </div>
  );
}
```

### 2. Using OfflineIndicator Component

Display offline status and queue information:

```javascript
import { OfflineIndicator } from '@/components/inventory/OfflineIndicator';

function InventoryPage() {
  const { syncOfflineQueue, syncing } = useMultiLocationSync(businessId);

  return (
    <div>
      <header>
        <h1>Inventory Management</h1>
        <OfflineIndicator 
          onSyncRequest={syncOfflineQueue}
          isSyncing={syncing}
          compact={false} // Full mode for desktop
        />
      </header>
      {/* Rest of your component */}
    </div>
  );
}
```

### 3. Manual Sync Trigger

Manually trigger sync (useful for "Sync Now" buttons):

```javascript
const { syncOfflineQueue, syncing } = useMultiLocationSync(businessId);

<button 
  onClick={syncOfflineQueue}
  disabled={syncing}
>
  {syncing ? 'Syncing...' : 'Sync Now'}
</button>
```

### 4. Direct Queue Operations

For advanced use cases, you can use the queue utilities directly:

```javascript
import {
  addToQueue,
  getPendingOperations,
  getQueueStats,
  clearCompletedOperations
} from '@/lib/utils/offlineQueue';

// Add custom operation
const operationId = await addToQueue({
  type: 'custom_operation',
  businessId: 'business-123',
  data: {
    // Your operation data
  }
});

// Get queue statistics
const stats = await getQueueStats();
console.log(`Pending: ${stats.pending}, Completed: ${stats.completed}`);

// Clear old completed operations
const cleared = await clearCompletedOperations();
console.log(`Cleared ${cleared} completed operations`);
```

## Supported Operations

### 1. Stock Transfer

Queued when offline:
- Product ID
- Source warehouse ID
- Destination warehouse ID
- Quantity
- Notes
- Requested by (user ID)

### 2. Receipt Confirmation

Queued when offline:
- Transfer ID
- Quantity received
- Received by (user ID)
- Receipt notes

## Conflict Resolution

When concurrent updates are detected (e.g., same stock adjusted by two users), the system:

1. Marks the operation as `failed`
2. Creates a conflict record with both local and server data
3. Displays conflict alert in OfflineIndicator
4. Requires manual resolution

### Conflict Resolution Strategies

- **keep_local**: Use the local (queued) data
- **keep_server**: Use the server data (discard local changes)
- **merge**: Manually merge both datasets

```javascript
import { resolveConflict } from '@/lib/utils/offlineQueue';

// Resolve conflict
await resolveConflict(conflictId, 'keep_local');
```

## Error Handling

### Retry Logic

Failed operations are automatically retried with exponential backoff:
- Retry 1: Immediate
- Retry 2: After 5 seconds
- Retry 3: After 15 seconds
- After 3 retries: Marked as `failed`

### Error States

- **pending**: Waiting to be synced
- **syncing**: Currently being synced
- **completed**: Successfully synced
- **failed**: Failed after retries or conflict detected

## Performance Considerations

### IndexedDB Limits

- **Storage**: Typically 50% of available disk space (varies by browser)
- **Operations**: Recommended max 1000 pending operations
- **Cleanup**: Completed operations should be cleared periodically

### Best Practices

1. **Clear completed operations regularly**:
   ```javascript
   // Clear completed operations older than 7 days
   setInterval(async () => {
     await clearCompletedOperations();
   }, 24 * 60 * 60 * 1000); // Daily
   ```

2. **Monitor queue size**:
   ```javascript
   const stats = await getQueueStats();
   if (stats.pending > 100) {
     toast.warning('Large number of pending operations. Please sync when online.');
   }
   ```

3. **Handle sync failures gracefully**:
   ```javascript
   const { syncing, error } = useMultiLocationSync(businessId);
   
   if (error) {
     toast.error(`Sync failed: ${error}`);
   }
   ```

## Testing

### Unit Tests

Run the offline queue tests:

```bash
npm test lib/utils/__tests__/offlineQueue.test.js
```

### Manual Testing

1. **Test offline queueing**:
   - Open DevTools → Network tab
   - Set throttling to "Offline"
   - Perform stock transfer
   - Verify operation is queued (check OfflineIndicator)

2. **Test automatic sync**:
   - While offline, queue multiple operations
   - Set throttling back to "Online"
   - Verify operations sync automatically
   - Check database for updated records

3. **Test conflict resolution**:
   - Open app in two browser tabs
   - Go offline in both tabs
   - Perform conflicting operations (e.g., adjust same stock)
   - Go online in both tabs
   - Verify conflict is detected and flagged

## Browser Compatibility

IndexedDB is supported in:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+
- Mobile browsers (iOS Safari 10+, Chrome Android)

For unsupported browsers, operations will fail gracefully with an error message.

## Troubleshooting

### Queue not syncing

1. Check browser console for errors
2. Verify IndexedDB is enabled (not in private/incognito mode)
3. Check network connectivity
4. Manually trigger sync with `syncOfflineQueue()`

### Operations stuck in "syncing" state

1. Check for server errors in network tab
2. Verify Supabase connection
3. Clear stuck operations:
   ```javascript
   import { updateOperationStatus } from '@/lib/utils/offlineQueue';
   await updateOperationStatus(operationId, 'pending');
   ```

### IndexedDB quota exceeded

1. Clear completed operations
2. Reduce number of queued operations
3. Clear browser data for the site

## Future Enhancements

- [ ] Background sync using Service Workers
- [ ] Push notifications for sync completion
- [ ] Batch operation sync (multiple operations in one request)
- [ ] Compression for large operation data
- [ ] Encryption for sensitive data in IndexedDB
- [ ] Sync priority queue (high-priority operations first)

## Related Files

- `lib/utils/offlineQueue.js` - Core queue utilities
- `lib/hooks/useMultiLocationSync.js` - Hook with offline support
- `components/inventory/OfflineIndicator.jsx` - UI component
- `lib/utils/__tests__/offlineQueue.test.js` - Unit tests

## Support

For issues or questions, please refer to:
- Design document: `.kiro/specs/inventory-system-consolidation/design.md`
- Requirements: `.kiro/specs/inventory-system-consolidation/requirements.md`
- Task list: `.kiro/specs/inventory-system-consolidation/tasks.md`
