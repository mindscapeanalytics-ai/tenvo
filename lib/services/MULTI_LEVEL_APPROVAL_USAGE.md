# Multi-Level Approval System Usage Guide

## Overview

The multi-level approval system provides hierarchical approval workflows for stock adjustments based on adjustment value. It supports dynamic approval chains with role-based routing and comprehensive audit trails.

**Requirements**: 5.6

## Features

- ✅ Dynamic approval level determination based on value
- ✅ Hierarchical approval chains (Manager → Director → Admin)
- ✅ Role-based approval routing
- ✅ Automatic status updates
- ✅ Comprehensive audit trail
- ✅ Customizable approval rules per business
- ✅ Pending approvals queue by role
- ✅ Approval chain visualization

## Architecture

### Approval Hierarchy

```
Level 1: Manager (0 - 10,000 PKR)
Level 2: Director (10,001 - 50,000 PKR)
Level 3: Admin (50,001+ PKR)
```

### Database Tables

1. **approval_chain** - Tracks approval history for each adjustment
2. **approval_rules** - Defines approval rules based on value ranges

### Approval Flow

```
1. Adjustment Created (Value: 75,000 PKR)
   ↓
2. System determines required levels: [Manager, Director, Admin]
   ↓
3. Approval chain initialized with 3 entries (all pending)
   ↓
4. Manager approves (Level 1) → Status: Pending Level 2
   ↓
5. Director approves (Level 2) → Status: Pending Level 3
   ↓
6. Admin approves (Level 3) → Status: Fully Approved
   ↓
7. Stock updated automatically
```

## Usage Examples

### 1. Initialize Approval Rules for Business

```javascript
import { initializeApprovalRules } from '@/lib/services/multiLevelApproval';

// Use default rules
const result = await initializeApprovalRules('business-uuid');

// Or use custom rules
const customRules = [
  {
    rule_name: 'Small Adjustments',
    min_value: 0,
    max_value: 5000,
    approval_levels: [
      { level: 1, role: 'manager', description: 'Manager Approval' },
    ],
  },
  {
    rule_name: 'Large Adjustments',
    min_value: 5001,
    max_value: null,
    approval_levels: [
      { level: 1, role: 'manager', description: 'Manager Approval' },
      { level: 2, role: 'director', description: 'Director Approval' },
      { level: 3, role: 'admin', description: 'Admin Approval' },
    ],
  },
];

const customResult = await initializeApprovalRules('business-uuid', customRules);
```

### 2. Get Required Approval Levels

```javascript
import { getRequiredApprovalLevels } from '@/lib/services/multiLevelApproval';

// For 75,000 PKR adjustment
const levels = await getRequiredApprovalLevels('business-uuid', 75000);

console.log(levels);
// Output: [
//   { level: 1, role: 'manager', description: 'Manager Approval' },
//   { level: 2, role: 'director', description: 'Director Approval' },
//   { level: 3, role: 'admin', description: 'Admin Approval' }
// ]
```

### 3. Initialize Approval Chain

```javascript
import { initializeApprovalChain } from '@/lib/services/multiLevelApproval';

// When creating adjustment
const result = await initializeApprovalChain(
  'adjustment-uuid',
  'business-uuid',
  75000 // adjustment value
);

console.log(result);
// Output: {
//   success: true,
//   approvalChain: [...],
//   totalLevels: 3,
//   message: 'Initialized 3-level approval chain'
// }
```

### 4. Get Approval Chain

```javascript
import { getApprovalChain } from '@/lib/services/multiLevelApproval';

const chain = await getApprovalChain('adjustment-uuid');

console.log(chain);
// Output: [
//   {
//     approval_level: 1,
//     required_role: 'manager',
//     decision: 'approved',
//     approver_name: 'Ali Ahmed',
//     decision_at: '2026-04-03T10:30:00Z'
//   },
//   {
//     approval_level: 2,
//     required_role: 'director',
//     decision: 'pending',
//     approver_name: null,
//     decision_at: null
//   },
//   {
//     approval_level: 3,
//     required_role: 'admin',
//     decision: 'pending',
//     approver_name: null,
//     decision_at: null
//   }
// ]
```

### 5. Get Current Approval Level

```javascript
import { getCurrentApprovalLevel } from '@/lib/services/multiLevelApproval';

const currentLevel = await getCurrentApprovalLevel('adjustment-uuid');

console.log(currentLevel); // 2 (Director approval pending)
// Returns 0 if fully approved
```

### 6. Approve at Current Level

```javascript
import { approveAtLevel } from '@/lib/services/multiLevelApproval';

const result = await approveAtLevel(
  'adjustment-uuid',
  'approver-uuid',
  'Fatima Khan',
  'Verified and approved'
);

console.log(result);
// Output: {
//   success: true,
//   approvedLevel: 2,
//   nextLevel: 3,
//   fullyApproved: false,
//   message: 'Level 2 approved, pending level 3'
// }
```

### 7. Reject at Current Level

```javascript
import { rejectAtLevel } from '@/lib/services/multiLevelApproval';

const result = await rejectAtLevel(
  'adjustment-uuid',
  'approver-uuid',
  'Fatima Khan',
  'Insufficient documentation provided'
);

console.log(result);
// Output: {
//   success: true,
//   rejectedLevel: 2,
//   message: 'Adjustment rejected at level 2'
// }
```

### 8. Get Pending Approvals for User

```javascript
import { getPendingApprovalsForUser } from '@/lib/services/multiLevelApproval';

// Get pending approvals for director role
const pendingApprovals = await getPendingApprovalsForUser(
  'user-uuid',
  'business-uuid',
  'director'
);

console.log(pendingApprovals);
// Output: [
//   {
//     approval_level: 2,
//     required_role: 'director',
//     adjustment: {
//       id: 'adjustment-uuid',
//       product_name: 'iPhone 14 Pro',
//       quantity_change: -50,
//       adjustment_value: 75000,
//       requester_name: 'Ali Ahmed'
//     }
//   }
// ]
```

### 9. Get Approval Chain Summary

```javascript
import { getApprovalChainSummary } from '@/lib/services/multiLevelApproval';

const summary = await getApprovalChainSummary('adjustment-uuid');

console.log(summary);
// Output: [
//   {
//     level: 1,
//     required_role: 'manager',
//     approver_name: 'Ali Ahmed',
//     decision: 'approved',
//     decision_at: '2026-04-03T10:30:00Z',
//     decision_notes: 'Verified',
//     is_current: false
//   },
//   {
//     level: 2,
//     required_role: 'director',
//     approver_name: null,
//     decision: 'pending',
//     decision_at: null,
//     decision_notes: null,
//     is_current: true  // Current pending level
//   },
//   {
//     level: 3,
//     required_role: 'admin',
//     approver_name: null,
//     decision: 'pending',
//     decision_at: null,
//     decision_notes: null,
//     is_current: false
//   }
// ]
```

### 10. Manage Approval Rules

```javascript
import { 
  getApprovalRules,
  createApprovalRule,
  updateApprovalRule,
  deleteApprovalRule 
} from '@/lib/services/multiLevelApproval';

// Get all rules
const rules = await getApprovalRules('business-uuid');

// Create new rule
const newRule = await createApprovalRule('business-uuid', {
  rule_name: 'Emergency Adjustments',
  min_value: 100001,
  max_value: null,
  approval_levels: [
    { level: 1, role: 'manager', description: 'Manager' },
    { level: 2, role: 'director', description: 'Director' },
    { level: 3, role: 'admin', description: 'Admin' },
    { level: 4, role: 'owner', description: 'Business Owner' },
  ],
  priority: 10,
});

// Update rule
const updated = await updateApprovalRule('rule-uuid', {
  max_value: 200000,
  is_active: true,
});

// Delete rule
const deleted = await deleteApprovalRule('rule-uuid');
```

## Integration with useStockAdjustment Hook

The multi-level approval system integrates seamlessly with the stock adjustment hook:

```javascript
import { useStockAdjustment } from '@/lib/hooks/useStockAdjustment';
import { initializeApprovalChain } from '@/lib/services/multiLevelApproval';

// In createAdjustment function
const adjustment = await createAdjustment({
  adjustment_type: 'decrease',
  quantity_change: -50,
  quantity_before: 100,
  reason_code: 'damage',
  reason_notes: 'Water damage',
});

// If requires approval, initialize approval chain
if (adjustment.requiresApproval) {
  await initializeApprovalChain(
    adjustment.id,
    businessId,
    adjustment.adjustment_value
  );
}
```

## UI Components

### Approval Chain Visualizer

```javascript
import { getApprovalChainSummary } from '@/lib/services/multiLevelApproval';

function ApprovalChainVisualizer({ adjustmentId }) {
  const [chain, setChain] = useState([]);

  useEffect(() => {
    loadChain();
  }, [adjustmentId]);

  const loadChain = async () => {
    const summary = await getApprovalChainSummary(adjustmentId);
    setChain(summary);
  };

  return (
    <div className="approval-chain">
      {chain.map((level, index) => (
        <div key={level.level} className="approval-level">
          <div className={`level-indicator ${level.is_current ? 'current' : ''}`}>
            Level {level.level}
          </div>
          <div className="level-details">
            <p>Role: {level.required_role}</p>
            {level.decision === 'approved' && (
              <>
                <p>Approved by: {level.approver_name}</p>
                <p>Date: {new Date(level.decision_at).toLocaleString()}</p>
                <p>Notes: {level.decision_notes}</p>
              </>
            )}
            {level.decision === 'rejected' && (
              <>
                <p>Rejected by: {level.approver_name}</p>
                <p>Reason: {level.decision_notes}</p>
              </>
            )}
            {level.decision === 'pending' && (
              <p>Status: Pending {level.is_current ? '(Current)' : ''}</p>
            )}
          </div>
          {index < chain.length - 1 && <div className="level-connector">↓</div>}
        </div>
      ))}
    </div>
  );
}
```

### Pending Approvals Queue

```javascript
import { getPendingApprovalsForUser, approveAtLevel, rejectAtLevel } from '@/lib/services/multiLevelApproval';

function PendingApprovalsQueue({ userId, businessId, userRole }) {
  const [approvals, setApprovals] = useState([]);

  useEffect(() => {
    loadPendingApprovals();
  }, [userId, businessId, userRole]);

  const loadPendingApprovals = async () => {
    const pending = await getPendingApprovalsForUser(userId, businessId, userRole);
    setApprovals(pending);
  };

  const handleApprove = async (adjustmentId, notes) => {
    const result = await approveAtLevel(adjustmentId, userId, userName, notes);
    if (result.success) {
      toast.success(result.message);
      loadPendingApprovals();
    }
  };

  const handleReject = async (adjustmentId, reason) => {
    const result = await rejectAtLevel(adjustmentId, userId, userName, reason);
    if (result.success) {
      toast.success(result.message);
      loadPendingApprovals();
    }
  };

  return (
    <div className="pending-approvals">
      <h2>Pending Approvals ({approvals.length})</h2>
      {approvals.map(approval => (
        <div key={approval.adjustment_id} className="approval-card">
          <h3>{approval.adjustment.product_name}</h3>
          <p>Quantity: {approval.adjustment.quantity_change}</p>
          <p>Value: {formatCurrency(approval.adjustment.adjustment_value)}</p>
          <p>Requester: {approval.adjustment.requester_name}</p>
          <p>Level: {approval.approval_level}</p>
          <div className="actions">
            <button onClick={() => handleApprove(approval.adjustment_id, '')}>
              Approve
            </button>
            <button onClick={() => handleReject(approval.adjustment_id, '')}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Database Functions

### get_required_approval_levels

Returns required approval levels for an adjustment value:

```sql
SELECT get_required_approval_levels('business-uuid', 75000);
-- Returns: [
--   {"level": 1, "role": "manager", "description": "Manager Approval"},
--   {"level": 2, "role": "director", "description": "Director Approval"},
--   {"level": 3, "role": "admin", "description": "Admin Approval"}
-- ]
```

### get_current_approval_level

Returns current pending approval level:

```sql
SELECT get_current_approval_level('adjustment-uuid');
-- Returns: 2 (or 0 if fully approved)
```

### is_fully_approved

Checks if all levels are approved:

```sql
SELECT is_fully_approved('adjustment-uuid');
-- Returns: true or false
```

### get_approval_chain_summary

Returns approval chain with current level indicator:

```sql
SELECT * FROM get_approval_chain_summary('adjustment-uuid');
```

## Automatic Triggers

### update_adjustment_approval_status

Automatically updates stock_adjustments table when approval chain changes:

- Updates `approval_status` to 'approved' when fully approved
- Updates `approval_status` to 'rejected' if any level rejects
- Updates `approval_level` to current pending level
- Updates `approved_by`, `approved_at`, and `approval_notes`

## Testing

### Unit Tests

```javascript
describe('Multi-Level Approval', () => {
  it('should initialize 3-level approval chain for high-value adjustment', async () => {
    const result = await initializeApprovalChain('adj-1', 'biz-1', 75000);
    expect(result.success).toBe(true);
    expect(result.totalLevels).toBe(3);
  });

  it('should approve at level 1 and move to level 2', async () => {
    const result = await approveAtLevel('adj-1', 'user-1', 'Manager', 'OK');
    expect(result.success).toBe(true);
    expect(result.approvedLevel).toBe(1);
    expect(result.nextLevel).toBe(2);
    expect(result.fullyApproved).toBe(false);
  });

  it('should mark as fully approved after all levels approve', async () => {
    await approveAtLevel('adj-1', 'user-1', 'Manager', 'OK');
    await approveAtLevel('adj-1', 'user-2', 'Director', 'OK');
    const result = await approveAtLevel('adj-1', 'user-3', 'Admin', 'OK');
    
    expect(result.fullyApproved).toBe(true);
    expect(result.nextLevel).toBe(0);
  });

  it('should reject entire chain if any level rejects', async () => {
    await approveAtLevel('adj-1', 'user-1', 'Manager', 'OK');
    const result = await rejectAtLevel('adj-1', 'user-2', 'Director', 'No');
    
    expect(result.success).toBe(true);
    expect(result.rejectedLevel).toBe(2);
  });
});
```

### Integration Tests

```javascript
describe('Multi-Level Approval Integration', () => {
  it('should complete full approval workflow', async () => {
    // 1. Create high-value adjustment
    const adjustment = await createAdjustment({
      adjustment_value: 75000,
      // ... other params
    });

    // 2. Initialize approval chain
    await initializeApprovalChain(adjustment.id, businessId, 75000);

    // 3. Manager approves
    await approveAtLevel(adjustment.id, managerId, 'Manager', 'OK');
    let level = await getCurrentApprovalLevel(adjustment.id);
    expect(level).toBe(2);

    // 4. Director approves
    await approveAtLevel(adjustment.id, directorId, 'Director', 'OK');
    level = await getCurrentApprovalLevel(adjustment.id);
    expect(level).toBe(3);

    // 5. Admin approves
    await approveAtLevel(adjustment.id, adminId, 'Admin', 'OK');
    const approved = await isFullyApproved(adjustment.id);
    expect(approved).toBe(true);

    // 6. Verify stock updated
    const product = await getProduct(adjustment.product_id);
    expect(product.stock).toBe(expectedStock);
  });
});
```

## Best Practices

1. **Initialize rules on business creation** - Set up approval rules when business is created
2. **Use role-based permissions** - Ensure users have appropriate roles for approval levels
3. **Track approval chain** - Always display approval chain status to users
4. **Send notifications** - Notify approvers at each level
5. **Audit trail** - Maintain complete audit trail of all approvals
6. **Handle rejections** - Clearly communicate rejection reasons
7. **Timeout handling** - Consider implementing approval timeouts (Phase 2)
8. **Escalation** - Auto-escalate if approval pending too long (Phase 2)

## Future Enhancements (Phase 2)

- Approval timeouts with auto-escalation
- Delegation of approval authority
- Approval templates for common scenarios
- Bulk approval operations
- Approval analytics and reporting
- Mobile push notifications for pending approvals
- WhatsApp notifications for Pakistani users

## Troubleshooting

### Approval chain not initializing

1. Check if approval rules exist for business
2. Verify adjustment value is correct
3. Check database function `get_required_approval_levels`

### Approval not progressing to next level

1. Verify trigger `trigger_update_adjustment_approval_status` is active
2. Check if approval chain entry was updated correctly
3. Verify `get_current_approval_level` function returns correct level

### User not seeing pending approvals

1. Verify user role matches required_role in approval_chain
2. Check if approval is at current level (not future level)
3. Verify RLS policies allow user to see approval_chain entries

## Support

For issues or questions:
- Migration: `supabase/migrations/022_multi_level_approval.sql`
- Service: `lib/services/multiLevelApproval.js`
- Integration: `lib/hooks/useStockAdjustment.js`
