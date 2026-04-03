'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * CycleCountApproval Component
 * 
 * Supervisor interface for approving cycle count variances and adjusting stock.
 * Displays tasks that exceed tolerance threshold and require approval.
 * 
 * Features:
 * - Variance approval workflow
 * - Automatic stock adjustment on approval
 * - Rejection with reason
 * - Variance analysis report
 * - Audit trail
 * 
 * @component
 * @param {Object} props
 * @param {string} props.scheduleId - Cycle count schedule ID
 * @param {string} props.businessId - Business ID
 * @param {Function} props.onApprovalComplete - Callback when approval is complete
 */
export default function CycleCountApproval({ scheduleId, businessId, onApprovalComplete }) {
  const supabase = createClientComponentClient();
  
  // State
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showReport, setShowReport] = useState(false);

  // Load data
  useEffect(() => {
    if (scheduleId && businessId) {
      loadSchedule();
      loadTasks();
      loadCurrentUser();
    }
  }, [scheduleId, businessId]);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('cycle_count_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();
      
      if (error) throw error;
      setSchedule(data);
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cycle_count_tasks')
        .select(`
          *,
          products(id, name, sku, category, stock_quantity, cost_price)
        `)
        .eq('schedule_id', scheduleId)
        .eq('status', 'counted')
        .order('variance_percentage', { ascending: false });
      
      if (error) throw error;
      
      // Filter tasks that exceed tolerance
      const flaggedTasks = (data || []).filter(task => 
        Math.abs(task.variance_percentage || 0) > (schedule?.tolerance_percentage || 5)
      );
      
      setTasks(flaggedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveTask = async (task) => {
    if (!approvalNotes.trim()) {
      alert('Please provide approval notes');
      return;
    }
    
    try {
      // Update task status
      const { error: taskError } = await supabase
        .from('cycle_count_tasks')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: currentUser?.id,
          approval_notes: approvalNotes
        })
        .eq('id', task.id);
      
      if (taskError) throw taskError;
      
      // Adjust stock quantity
      const newQuantity = task.physical_count;
      const { error: productError } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', task.products.id);
      
      if (productError) throw productError;
      
      // If warehouse-specific, update product_locations
      if (task.warehouse_id) {
        const { error: locationError } = await supabase
          .from('product_locations')
          .update({ quantity: newQuantity })
          .eq('product_id', task.products.id)
          .eq('warehouse_id', task.warehouse_id);
        
        if (locationError) throw locationError;
      }
      
      // Create stock adjustment record for audit trail
      const { error: adjustmentError } = await supabase
        .from('stock_adjustments')
        .insert({
          business_id: businessId,
          product_id: task.products.id,
          warehouse_id: task.warehouse_id,
          adjustment_type: 'cycle_count',
          quantity_change: task.variance,
          reason_code: 'cycle_count',
          reason_notes: `Cycle count adjustment: ${approvalNotes}`,
          adjustment_value: Math.abs(task.variance * (task.products.cost_price || 0)),
          requires_approval: false,
          status: 'approved',
          requested_by: task.counted_by,
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString()
        });
      
      if (adjustmentError) throw adjustmentError;
      
      // Reset and reload
      setSelectedTask(null);
      setApprovalNotes('');
      await loadTasks();
      
      alert('Task approved and stock adjusted successfully');
    } catch (error) {
      console.error('Error approving task:', error);
      alert('Failed to approve task: ' + error.message);
    }
  };

  const rejectTask = async (task) => {
    if (!approvalNotes.trim()) {
      alert('Please provide rejection reason');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('cycle_count_tasks')
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: currentUser?.id,
          approval_notes: approvalNotes
        })
        .eq('id', task.id);
      
      if (error) throw error;
      
      // Reset and reload
      setSelectedTask(null);
      setApprovalNotes('');
      await loadTasks();
      
      alert('Task rejected successfully');
    } catch (error) {
      console.error('Error rejecting task:', error);
      alert('Failed to reject task');
    }
  };

  const generateReport = () => {
    setShowReport(true);
  };

  const exportReport = async () => {
    try {
      // Fetch all tasks for the schedule
      const { data: allTasks, error } = await supabase
        .from('cycle_count_tasks')
        .select(`
          *,
          products(name, sku, category)
        `)
        .eq('schedule_id', scheduleId);
      
      if (error) throw error;
      
      // Generate CSV
      const headers = ['Product', 'SKU', 'Category', 'Expected', 'Physical', 'Variance', 'Variance %', 'Status', 'Notes'];
      const rows = allTasks.map(task => [
        task.products.name,
        task.products.sku,
        task.products.category,
        task.expected_quantity,
        task.physical_count || '',
        task.variance || '',
        task.variance_percentage ? `${task.variance_percentage.toFixed(2)}%` : '',
        task.status,
        task.notes || ''
      ]);
      
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cycle-count-report-${schedule?.name}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#722F37] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading approval queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cycle Count Approval</h2>
          <p className="mt-1 text-sm text-gray-600">
            {schedule?.name} - {tasks.length} tasks require approval
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generateReport}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Report
          </button>
          <button
            onClick={exportReport}
            className="px-4 py-2 bg-[#722F37] text-white rounded-md hover:bg-[#5a2329] transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Tasks Requiring Approval */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Physical
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Counted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No tasks require approval
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{task.products.name}</div>
                      <div className="text-sm text-gray-500">{task.products.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.expected_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.physical_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        task.variance > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {task.variance > 0 ? '+' : ''}{task.variance?.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        ({task.variance_percentage?.toFixed(1)}%)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      PKR {(Math.abs(task.variance) * (task.products.cost_price || 0)).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.counted_at ? new Date(task.counted_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="text-[#722F37] hover:text-[#5a2329] font-medium"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Review Variance
              </h3>
              
              <div className="space-y-4">
                {/* Product Info */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Product</div>
                      <div className="font-medium">{selectedTask.products.name}</div>
                      <div className="text-sm text-gray-500">{selectedTask.products.sku}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Category</div>
                      <div className="font-medium">{selectedTask.products.category}</div>
                    </div>
                  </div>
                </div>

                {/* Variance Details */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Expected</div>
                    <div className="text-2xl font-bold text-gray-900">{selectedTask.expected_quantity}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Physical</div>
                    <div className="text-2xl font-bold text-gray-900">{selectedTask.physical_count}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Variance</div>
                    <div className={`text-2xl font-bold ${
                      selectedTask.variance > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedTask.variance > 0 ? '+' : ''}{selectedTask.variance?.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      ({selectedTask.variance_percentage?.toFixed(1)}%)
                    </div>
                  </div>
                </div>

                {/* Value Impact */}
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <strong>Value Impact:</strong> PKR {(Math.abs(selectedTask.variance) * (selectedTask.products.cost_price || 0)).toFixed(2)}
                  </div>
                </div>

                {/* Counter Notes */}
                {selectedTask.notes && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Counter Notes</div>
                    <div className="bg-gray-50 p-3 rounded text-sm">{selectedTask.notes}</div>
                  </div>
                )}

                {/* Approval Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approval Notes *
                  </label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                    placeholder="Provide reason for approval or rejection..."
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => approveTask(selectedTask)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Approve & Adjust Stock
                  </button>
                  <button
                    onClick={() => rejectTask(selectedTask)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      setApprovalNotes('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
