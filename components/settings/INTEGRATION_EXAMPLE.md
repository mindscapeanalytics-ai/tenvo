# Integration Example: Adding ApprovalThresholdConfig to SettingsManager

## Step-by-Step Integration Guide

### Step 1: Import the Component

Add the import at the top of `components/SettingsManager.jsx`:

```jsx
import { ApprovalThresholdConfig } from './settings/ApprovalThresholdConfig';
import { CostingMethodSelector } from './settings/CostingMethodSelector';
import { PakistaniTaxConfig } from './settings/PakistaniTaxConfig';
```

### Step 2: Add to Financials Tab

Locate the `<TabsContent value="financials">` section and add the component:

```jsx
<TabsContent value="financials" className="space-y-4 pt-4">
  {/* Existing Financial Configuration Card */}
  <Card className="border-none shadow-xl">
    <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
      <CardTitle className="text-emerald-900 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-emerald-600" />
        Financial Configuration
      </CardTitle>
      <CardDescription>Manage Chart of Accounts and currency settings</CardDescription>
    </CardHeader>
    <CardContent className="pt-6 space-y-6">
      {/* Existing GL Account Mapping and Global Defaults */}
    </CardContent>
  </Card>

  {/* NEW: Add Costing Method Selector */}
  <CostingMethodSelector
    businessId={business?.id}
    currentMethod={business?.costing_method || 'FIFO'}
    onUpdate={(newMethod) => {
      updateBusiness({ 
        ...business, 
        costing_method: newMethod 
      });
    }}
  />

  {/* NEW: Add Approval Threshold Config */}
  <ApprovalThresholdConfig
    businessId={business?.id}
    currentThreshold={business?.approval_threshold_amount || 10000}
    onUpdate={(newThreshold) => {
      updateBusiness({ 
        ...business, 
        approval_threshold_amount: newThreshold 
      });
    }}
  />
</TabsContent>
```

### Step 3: Alternative - Add to Compliance Tab

If you prefer to add it to the Compliance tab (since it's related to approval workflows):

```jsx
<TabsContent value="compliance" className="space-y-4 pt-4">
  {/* Existing FBR & Tax Integration Card */}
  <Card className="border-blue-100 shadow-xl border-t-4 border-t-blue-500">
    <CardHeader>
      <CardTitle className="text-blue-900 flex items-center gap-2">
        <Shield className="w-5 h-5 text-blue-600" />
        FBR & Tax Integration
      </CardTitle>
      <CardDescription className="text-blue-700">
        Official tax identifiers for Pakistani compliance
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* Existing NTN and STRN fields */}
    </CardContent>
  </Card>

  {/* NEW: Add Approval Threshold Config */}
  <ApprovalThresholdConfig
    businessId={business?.id}
    currentThreshold={business?.approval_threshold_amount || 10000}
    onUpdate={(newThreshold) => {
      updateBusiness({ 
        ...business, 
        approval_threshold_amount: newThreshold 
      });
    }}
  />

  {/* Existing POS Integration Status */}
</TabsContent>
```

### Step 4: Ensure Business Context Includes Threshold

Make sure the business context loads the approval threshold. In `lib/context/BusinessContext.js`, verify the business object includes:

```javascript
{
  id: 'business-id',
  business_name: 'My Business',
  costing_method: 'FIFO',
  approval_threshold_amount: 10000, // <-- This field
  // ... other fields
}
```

### Step 5: Update Business API Call

If needed, update the business fetch query to include the new field:

```javascript
// In businessAPI.get() or similar
const { data, error } = await supabase
  .from('businesses')
  .select(`
    *,
    costing_method,
    approval_threshold_amount,
    multi_location_enabled
  `)
  .eq('id', businessId)
  .single();
```

## Complete Example

Here's a complete example of the Financials tab with all enterprise settings:

```jsx
<TabsContent value="financials" className="space-y-4 pt-4">
  {/* Chart of Accounts Configuration */}
  <Card className="border-none shadow-xl">
    <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
      <CardTitle className="text-emerald-900 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-emerald-600" />
        Financial Configuration
      </CardTitle>
      <CardDescription>Manage Chart of Accounts and currency settings</CardDescription>
    </CardHeader>
    <CardContent className="pt-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* GL Account Mapping */}
        <div className="space-y-4">
          <h4 className="text-sm font-black text-gray-900 border-b pb-2 uppercase tracking-widest">
            GL Account Mapping
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-600">Cash Account Code</Label>
              <Input
                value={business?.settings?.coa_mapping?.cash || '1001'}
                onChange={(e) => {
                  const settings = { ...business.settings };
                  settings.coa_mapping = { ...settings.coa_mapping, cash: e.target.value };
                  updateBusiness({ settings });
                }}
                className="w-24 h-8 text-center font-mono text-xs rounded-lg"
              />
            </div>
            {/* More GL mappings... */}
          </div>
        </div>

        {/* Global Defaults */}
        <div className="space-y-4">
          <h4 className="text-sm font-black text-gray-900 border-b pb-2 uppercase tracking-widest">
            Global Defaults
          </h4>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-600">Base Currency</Label>
              <select
                value={business?.settings?.domain_defaults?.currency || 'PKR'}
                onChange={(e) => {
                  const settings = { ...business.settings };
                  settings.domain_defaults = { ...settings.domain_defaults, currency: e.target.value };
                  updateBusiness({ settings });
                }}
                className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm font-medium"
              >
                <option value="PKR">Pakistani Rupee (PKR)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="SAR">Saudi Riyal (SAR)</option>
                <option value="AED">UAE Dirham (AED)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Inventory Costing Method */}
  <CostingMethodSelector
    businessId={business?.id}
    currentMethod={business?.costing_method || 'FIFO'}
    onUpdate={(newMethod) => {
      updateBusiness({ 
        ...business, 
        costing_method: newMethod 
      });
    }}
  />

  {/* Stock Adjustment Approval Threshold */}
  <ApprovalThresholdConfig
    businessId={business?.id}
    currentThreshold={business?.approval_threshold_amount || 10000}
    onUpdate={(newThreshold) => {
      updateBusiness({ 
        ...business, 
        approval_threshold_amount: newThreshold 
      });
    }}
  />
</TabsContent>
```

## Testing the Integration

### 1. Visual Test
1. Navigate to Settings page
2. Click on "Financials" tab
3. Scroll to "Stock Adjustment Approval Threshold" card
4. Verify all UI elements are displayed correctly

### 2. Functional Test
1. Change the threshold value (e.g., from 10000 to 25000)
2. Click "Save Threshold"
3. Verify success toast appears
4. Refresh the page
5. Verify the new value persists

### 3. Integration Test
1. Go to Inventory → Stock Adjustments
2. Create an adjustment with value > threshold
3. Verify it shows "Requires Approval" badge
4. Create an adjustment with value < threshold
5. Verify it's auto-approved

## Troubleshooting

### Issue: Component not rendering
**Solution**: Check that the import path is correct and the component is exported properly.

### Issue: Save button not working
**Solution**: Verify `businessId` is being passed correctly and is not null/undefined.

### Issue: Value not persisting
**Solution**: Check that the `updateBusiness` function is updating the context and the database query includes `approval_threshold_amount`.

### Issue: Threshold not used in stock adjustments
**Solution**: Verify that `useStockAdjustment` hook is fetching the threshold from business settings.

## Related Documentation

- [ApprovalThresholdConfig Usage Guide](./APPROVAL_THRESHOLD_USAGE.md)
- [Task 9.1 Implementation](./TASK_9.1_IMPLEMENTATION.md)
- [Stock Adjustment Manager](../inventory/README.md)
