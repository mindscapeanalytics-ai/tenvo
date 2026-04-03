'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * CycleCountSchedule Component
 * 
 * Allows users to configure and generate cycle count tasks for inventory verification.
 * Supports filtering by product category, location, and ABC classification.
 * 
 * Features:
 * - Product category filtering
 * - Location-based filtering
 * - ABC classification filtering
 * - Task generation with expected quantities
 * - Counter assignment
 * - Schedule management
 * 
 * @component
 * @param {Object} props
 * @param {string} props.businessId - Business ID
 * @param {Function} props.onTaskCreated - Callback when task is created
 */
export default function CycleCountSchedule({ businessId, onTaskCreated }) {
  const supabase = createClientComponentClient();
  
  // State
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    warehouse_id: '',
    abc_classification: '',
    assigned_to: '',
    scheduled_date: '',
    frequency: 'once', // once, weekly, monthly, quarterly
    tolerance_percentage: 5
  });
  
  const [errors, setErrors] = useState({});

  // Load initial data
  useEffect(() => {
    if (businessId) {
      loadCategories();
      loadWarehouses();
      loadUsers();
      loadSchedules();
    }
  }, [businessId]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .eq('business_id', businessId)
        .not('category', 'is', null);
      
      if (error) throw error;
      
      const uniqueCategories = [...new Set(data.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setWarehouses(data || []);
    } catch (error) {
      console.error('Error loading warehouses:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_businesses')
        .select('user_id, users(id, email, full_name)')
        .eq('business_id', businessId);
      
      if (error) throw error;
      
      const userList = data.map(ub => ({
        id: ub.users.id,
        name: ub.users.full_name || ub.users.email
      }));
      
      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('cycle_count_schedules')
        .select(`
          *,
          warehouses(name),
          users(full_name, email)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Schedule name is required';
    }
    
    if (!formData.scheduled_date) {
      newErrors.scheduled_date = 'Scheduled date is required';
    }
    
    if (!formData.assigned_to) {
      newErrors.assigned_to = 'Counter assignment is required';
    }
    
    if (formData.tolerance_percentage < 0 || formData.tolerance_percentage > 100) {
      newErrors.tolerance_percentage = 'Tolerance must be between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateCycleCountTask = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Build product query based on filters
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          category,
          stock_quantity,
          product_locations(warehouse_id, quantity)
        `)
        .eq('business_id', businessId);
      
      if (formData.category) {
        query = query.eq('category', formData.category);
      }
      
      if (formData.abc_classification) {
        query = query.eq('abc_classification', formData.abc_classification);
      }
      
      const { data: products, error: productsError } = await query;
      
      if (productsError) throw productsError;
      
      // Filter by warehouse if specified
      let filteredProducts = products;
      if (formData.warehouse_id) {
        filteredProducts = products.filter(p => 
          p.product_locations?.some(loc => loc.warehouse_id === formData.warehouse_id)
        );
      }
      
      if (filteredProducts.length === 0) {
        setErrors({ general: 'No products found matching the selected filters' });
        setLoading(false);
        return;
      }
      
      // Create cycle count schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('cycle_count_schedules')
        .insert({
          business_id: businessId,
          name: formData.name,
          category: formData.category || null,
          warehouse_id: formData.warehouse_id || null,
          abc_classification: formData.abc_classification || null,
          assigned_to: formData.assigned_to,
          scheduled_date: formData.scheduled_date,
          frequency: formData.frequency,
          tolerance_percentage: formData.tolerance_percentage,
          status: 'scheduled',
          product_count: filteredProducts.length
        })
        .select()
        .single();
      
      if (scheduleError) throw scheduleError;
      
      // Create cycle count tasks for each product
      const tasks = filteredProducts.map(product => {
        const expectedQty = formData.warehouse_id
          ? product.product_locations?.find(loc => loc.warehouse_id === formData.warehouse_id)?.quantity || 0
          : product.stock_quantity;
        
        return {
          schedule_id: schedule.id,
          business_id: businessId,
          product_id: product.id,
          warehouse_id: formData.warehouse_id || null,
          expected_quantity: expectedQty,
          status: 'pending'
        };
      });
      
      const { error: tasksError } = await supabase
        .from('cycle_count_tasks')
        .insert(tasks);
      
      if (tasksError) throw tasksError;
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        warehouse_id: '',
        abc_classification: '',
        assigned_to: '',
        scheduled_date: '',
        frequency: 'once',
        tolerance_percentage: 5
      });
      
      // Reload schedules
      await loadSchedules();
      
      if (onTaskCreated) {
        onTaskCreated(schedule);
      }
      
      alert(`Cycle count task created successfully with ${filteredProducts.length} products`);
    } catch (error) {
      console.error('Error generating cycle count task:', error);
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      // Delete associated tasks first
      await supabase
        .from('cycle_count_tasks')
        .delete()
        .eq('schedule_id', scheduleId);
      
      // Delete schedule
      const { error } = await supabase
        .from('cycle_count_schedules')
        .delete()
        .eq('id', scheduleId);
      
      if (error) throw error;
      
      await loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Cycle Count Schedule</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure and generate cycle count tasks for inventory verification
        </p>
      </div>

      {/* Create Schedule Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Schedule</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Schedule Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
              placeholder="e.g., Monthly Electronics Count"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Warehouse Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warehouse/Location
            </label>
            <select
              value={formData.warehouse_id}
              onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
            >
              <option value="">All Warehouses</option>
              {warehouses.map(wh => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>

          {/* ABC Classification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ABC Classification
            </label>
            <select
              value={formData.abc_classification}
              onChange={(e) => setFormData({ ...formData, abc_classification: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
            >
              <option value="">All Classifications</option>
              <option value="A">A - High Value</option>
              <option value="B">B - Medium Value</option>
              <option value="C">C - Low Value</option>
            </select>
          </div>

          {/* Assigned Counter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign Counter *
            </label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
            >
              <option value="">Select Counter</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            {errors.assigned_to && (
              <p className="mt-1 text-sm text-red-600">{errors.assigned_to}</p>
            )}
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Date *
            </label>
            <input
              type="date"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
            />
            {errors.scheduled_date && (
              <p className="mt-1 text-sm text-red-600">{errors.scheduled_date}</p>
            )}
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
            >
              <option value="once">Once</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          {/* Tolerance Percentage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tolerance Percentage
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.tolerance_percentage}
              onChange={(e) => setFormData({ ...formData, tolerance_percentage: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#722F37] focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Variances within this percentage won't require approval
            </p>
            {errors.tolerance_percentage && (
              <p className="mt-1 text-sm text-red-600">{errors.tolerance_percentage}</p>
            )}
          </div>
        </div>

        {errors.general && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={generateCycleCountTask}
            disabled={loading}
            className="px-6 py-2 bg-[#722F37] text-white rounded-md hover:bg-[#5a2329] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating...' : 'Generate Cycle Count Task'}
          </button>
        </div>
      </div>

      {/* Existing Schedules */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Existing Schedules</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheduled Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                    No schedules created yet
                  </td>
                </tr>
              ) : (
                schedules.map(schedule => (
                  <tr key={schedule.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {schedule.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.category || 'All'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.warehouses?.name || 'All'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.users?.full_name || schedule.users?.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(schedule.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {schedule.product_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        schedule.status === 'completed' ? 'bg-green-100 text-green-800' :
                        schedule.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => deleteSchedule(schedule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
