'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * CycleCountTask Component
 * 
 * Mobile/web interface for executing cycle count tasks.
 * Displays product list with expected quantities and allows physical count input.
 * 
 * Features:
 * - Product list with expected quantities
 * - Physical count input
 * - Variance calculation and highlighting
 * - Tolerance-based flagging
 * - Mobile-responsive design
 * - Barcode scanning support (optional)
 * 
 * @component
 * @param {Object} props
 * @param {string} props.scheduleId - Cycle count schedule ID
 * @param {string} props.businessId - Business ID
 * @param {Function} props.onComplete - Callback when all tasks completed
 */
export default function CycleCountTask({ scheduleId, businessId, onComplete }) {
  const supabase = createClientComponentClient();
  
  // State
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, counted, flagged
  const [currentUser, setCurrentUser] = useState(null);

  // Load data
  useEffect(() => {
    if (scheduleId && businessId) {
      loadSchedule();
      loadTasks();
      loadCurrentUser();
    }
  }, [scheduleId, businessId]);

  // Filter tasks based on search and status
  useEffect(() => {
    let filtered = tasks;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.products.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.products.sku.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'flagged') {
        filtered = filtered.filter(task => 
          task.physical_count !== null &&
          Math.abs(task.variance_percentage || 0) > (schedule?.tolerance_percentage || 5)
        );
      } else {
        filtered = filtered.filter(task => task.status === filterStatus);
      }
    }
    
    setFilteredTasks(filtered);
  }, [tasks, searchQuery, filterStatus, schedule]);

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
          products(id, name, sku, category, stock_quantity)
        `)
        .eq('schedule_id', scheduleId)
        .order('products(name)');
      
      if (error) throw error;
      setTasks(data || []);
      setFilteredTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePhysicalCount = async (taskId, physicalCount) => {
    try {
      const { error } = await supabase
        .from('cycle_count_tasks')
        .update({
          physical_count: physicalCount,
          status: 'counted',
          counted_at: new Date().toISOString(),
          counted_by: currentUser?.id
        })
        .eq('id', taskId);
      
      if (error) throw error;
      
      // Reload tasks to get updated variance
      await loadTasks();
    } catch (error) {
      console.error('Error updating physical count:', error);
      alert('Failed to update count');
    }
  };

  const addNote = async (taskId, note) => {
    try {
      const { error } = await supabase
        .from('cycle_count_tasks')
        .update({ notes: note })
        .eq('id', taskId);
      
      if (error) throw error;
      
      await loadTasks();
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const getVarianceColor = (variancePercentage, tolerance) => {
    const absVariance = Math.abs(variancePercentage || 0);
    if (absVariance === 0) return 'text-green-600';
    if (absVariance <= tolerance) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVarianceBadge = (variancePercentage, tolerance) => {
    const absVariance = Math.abs(variancePercentage || 0);
    if (absVariance === 0) return { text: 'Match', color: 'bg-green-100 text-green-800' };
    if (absVariance <= tolerance) return { text: 'Within Tolerance', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Requires Approval', color: 'bg-red-100 text-red-800' };
  };

  const completedCount = tasks.filter(t => t.status === 'counted').length;
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#722F37] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cycle count tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{schedule?.name}</h2>
        <p className="mt-1 text-sm text-gray-600">
          Scheduled: {schedule?.scheduled_date ? new Date(schedule.scheduled_date).toLocaleDateString() : 'N/A'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">
            {completedCount} / {totalCount} ({progressPercentage.toFixed(0)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#722F37] h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
            >
              <option value="all">All Products</option>
              <option value="pending">Pending</option>
              <option value="counted">Counted</option>
              <option value="flagged">Flagged (Exceeds Tolerance)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expected
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Physical Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                    No tasks found
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const badge = task.physical_count !== null 
                    ? getVarianceBadge(task.variance_percentage, schedule?.tolerance_percentage || 5)
                    : null;
                  
                  return (
                    <tr key={task.id} className={task.status === 'counted' ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {task.products.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.products.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.expected_quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          step="0.01"
                          value={task.physical_count || ''}
                          onChange={(e) => updatePhysicalCount(task.id, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                          placeholder="Count"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.physical_count !== null ? (
                          <div>
                            <div className={`text-sm font-medium ${getVarianceColor(task.variance_percentage, schedule?.tolerance_percentage || 5)}`}>
                              {task.variance > 0 ? '+' : ''}{task.variance?.toFixed(2) || 0}
                            </div>
                            <div className="text-xs text-gray-500">
                              ({task.variance_percentage?.toFixed(1) || 0}%)
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {badge && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                            {badge.text}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={task.notes || ''}
                          onChange={(e) => addNote(task.id, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                          placeholder="Add note..."
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-gray-200">
          {filteredTasks.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              No tasks found
            </div>
          ) : (
            filteredTasks.map(task => {
              const badge = task.physical_count !== null 
                ? getVarianceBadge(task.variance_percentage, schedule?.tolerance_percentage || 5)
                : null;
              
              return (
                <div key={task.id} className="p-4 space-y-3">
                  <div>
                    <div className="font-medium text-gray-900">{task.products.name}</div>
                    <div className="text-sm text-gray-500">{task.products.sku}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Expected</div>
                      <div className="text-sm font-medium">{task.expected_quantity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Physical Count</div>
                      <input
                        type="number"
                        step="0.01"
                        value={task.physical_count || ''}
                        onChange={(e) => updatePhysicalCount(task.id, parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                        placeholder="Count"
                      />
                    </div>
                  </div>
                  
                  {task.physical_count !== null && (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500">Variance</div>
                        <div className={`text-sm font-medium ${getVarianceColor(task.variance_percentage, schedule?.tolerance_percentage || 5)}`}>
                          {task.variance > 0 ? '+' : ''}{task.variance?.toFixed(2) || 0} ({task.variance_percentage?.toFixed(1) || 0}%)
                        </div>
                      </div>
                      {badge && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
                          {badge.text}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <input
                      type="text"
                      value={task.notes || ''}
                      onChange={(e) => addNote(task.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
                      placeholder="Add note..."
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-500">Total Products</div>
            <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Counted</div>
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-2xl font-bold text-gray-600">{totalCount - completedCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Flagged</div>
            <div className="text-2xl font-bold text-red-600">
              {tasks.filter(t => 
                t.physical_count !== null &&
                Math.abs(t.variance_percentage || 0) > (schedule?.tolerance_percentage || 5)
              ).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
