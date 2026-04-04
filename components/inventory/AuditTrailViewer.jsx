'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FileText, Download, Filter, Calendar, User, Package, 
  RotateCcw, Search, X, ChevronDown, AlertCircle, Clock,
  TrendingUp, TrendingDown, Edit3, FileSpreadsheet, FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * AuditTrailViewer Component
 * Enhanced audit trail viewer for inventory stock adjustments
 * 
 * Features:
 * - Filterable table with all adjustment details
 * - Date range, user, product, and transaction type filters
 * - Export to PDF and Excel
 * - Comprehensive audit information display
 * - Mobile responsive design
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.5, 6.6
 * 
 * @param {Object} props
 * @param {string} props.businessId - Business ID
 * @param {string} [props.productId] - Optional product ID to filter by specific product
 * @param {string} [props.warehouseId] - Optional warehouse ID to filter by location
 * @param {string} [props.currency] - Currency symbol
 */
export function AuditTrailViewer({
  businessId,
  productId = null,
  warehouseId = null,
  currency = 'PKR'
}) {
  const supabase = createClient();
  
  // State
  const [auditTrail, setAuditTrail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    productId: productId || '',
    transactionType: '',
    reasonCode: '',
    searchTerm: ''
  });
  
  // Available filter options
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  
  const transactionTypes = [
    { value: '', label: 'All Types' },
    { value: 'increase', label: 'Increase' },
    { value: 'decrease', label: 'Decrease' },
    { value: 'correction', label: 'Correction' }
  ];
  
  const reasonCodes = [
    { value: '', label: 'All Reasons' },
    { value: 'damage', label: 'Damage' },
    { value: 'theft', label: 'Theft' },
    { value: 'count_error', label: 'Counting Error' },
    { value: 'return', label: 'Return' },
    { value: 'expired', label: 'Expired' },
    { value: 'cycle_count', label: 'Cycle Count' },
    { value: 'other', label: 'Other' }
  ];
  
  /**
   * Fetch audit trail data
   */
  const fetchAuditTrail = useCallback(async () => {
    if (!businessId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('stock_adjustments')
        .select(`
          *,
          product:products(id, name, sku),
          warehouse:warehouses(id, name, code),
          requester:requested_by(id, email, full_name),
          approver:approved_by(id, email, full_name)
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        const endDateTime = new Date(filters.endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endDateTime.toISOString());
      }
      if (filters.userId) {
        query = query.eq('requested_by', filters.userId);
      }
      if (filters.productId) {
        query = query.eq('product_id', filters.productId);
      }
      if (filters.transactionType) {
        query = query.eq('adjustment_type', filters.transactionType);
      }
      if (filters.reasonCode) {
        query = query.eq('reason_code', filters.reasonCode);
      }
      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setAuditTrail(data || []);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  }, [businessId, filters, warehouseId, supabase]);
  
  /**
   * Fetch users for filter dropdown
   */
  const fetchUsers = useCallback(async () => {
    if (!businessId) return;
    
    try {
      const { data, error } = await supabase
        .from('business_users')
        .select('user_id, users(id, email, full_name)')
        .eq('business_id', businessId);
      
      if (error) throw error;
      
      const userList = data?.map(bu => bu.users).filter(Boolean) || [];
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [businessId, supabase]);
  
  /**
   * Fetch products for filter dropdown
   */
  const fetchProducts = useCallback(async () => {
    if (!businessId) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku')
        .eq('business_id', businessId)
        .order('name');
      
      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, [businessId, supabase]);
  
  // Load data on mount
  useEffect(() => {
    fetchAuditTrail();
    fetchUsers();
    fetchProducts();
  }, [fetchAuditTrail, fetchUsers, fetchProducts]);
  
  /**
   * Filter audit trail by search term
   */
  const filteredAuditTrail = useMemo(() => {
    if (!filters.searchTerm) return auditTrail;
    
    const term = filters.searchTerm.toLowerCase();
    return auditTrail.filter(record => 
      record.product?.name?.toLowerCase().includes(term) ||
      record.product?.sku?.toLowerCase().includes(term) ||
      record.reason_notes?.toLowerCase().includes(term) ||
      record.requester?.email?.toLowerCase().includes(term)
    );
  }, [auditTrail, filters.searchTerm]);
  
  /**
   * Export to PDF
   */
  const exportToPDF = useCallback(() => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text('Stock Adjustment Audit Trail', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Total Records: ${filteredAuditTrail.length}`, 14, 34);
      
      // Table data
      const tableData = filteredAuditTrail.map(record => [
        new Date(record.created_at).toLocaleString(),
        record.requester?.email || record.requester?.full_name || 'Unknown',
        record.adjustment_type,
        record.product?.name || 'N/A',
        record.quantity_before,
        record.quantity_after,
        record.quantity_change,
        record.reason_code,
        record.ip_address || 'N/A'
      ]);
      
      // Generate table
      doc.autoTable({
        startY: 40,
        head: [[
          'Timestamp',
          'User',
          'Action',
          'Product',
          'Before',
          'After',
          'Change',
          'Reason',
          'IP Address'
        ]],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 0, 0] }, // Wine color
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15 },
          7: { cellWidth: 20 },
          8: { cellWidth: 25 }
        }
      });
      
      // Save
      const filename = `audit_trail_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  }, [filteredAuditTrail]);
  
  /**
   * Export to Excel
   */
  const exportToExcel = useCallback(() => {
    try {
      // Prepare data
      const excelData = filteredAuditTrail.map(record => ({
        'Timestamp': new Date(record.created_at).toLocaleString(),
        'User': record.requester?.email || record.requester?.full_name || 'Unknown',
        'Action': record.adjustment_type,
        'Product': record.product?.name || 'N/A',
        'SKU': record.product?.sku || 'N/A',
        'Warehouse': record.warehouse?.name || 'N/A',
        'Before Value': record.quantity_before,
        'After Value': record.quantity_after,
        'Change': record.quantity_change,
        'Reason Code': record.reason_code,
        'Reason Notes': record.reason_notes || '',
        'Adjustment Value': record.adjustment_value || 0,
        'Approval Status': record.approval_status,
        'Approver': record.approver?.email || record.approver?.full_name || 'N/A',
        'Approved At': record.approved_at ? new Date(record.approved_at).toLocaleString() : 'N/A',
        'IP Address': record.ip_address || 'N/A',
        'User Agent': record.user_agent || 'N/A'
      }));
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Timestamp
        { wch: 25 }, // User
        { wch: 12 }, // Action
        { wch: 30 }, // Product
        { wch: 15 }, // SKU
        { wch: 20 }, // Warehouse
        { wch: 12 }, // Before Value
        { wch: 12 }, // After Value
        { wch: 12 }, // Change
        { wch: 15 }, // Reason Code
        { wch: 40 }, // Reason Notes
        { wch: 15 }, // Adjustment Value
        { wch: 15 }, // Approval Status
        { wch: 25 }, // Approver
        { wch: 20 }, // Approved At
        { wch: 15 }, // IP Address
        { wch: 50 }  // User Agent
      ];
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Audit Trail');
      
      // Add metadata sheet
      const metadata = [
        ['Report', 'Stock Adjustment Audit Trail'],
        ['Generated', new Date().toLocaleString()],
        ['Total Records', filteredAuditTrail.length],
        ['Business ID', businessId]
      ];
      const metaWs = XLSX.utils.aoa_to_sheet(metadata);
      XLSX.utils.book_append_sheet(wb, metaWs, 'Report Info');
      
      // Save
      const filename = `audit_trail_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel file');
    }
  }, [filteredAuditTrail, businessId]);
  
  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      userId: '',
      productId: productId || '',
      transactionType: '',
      reasonCode: '',
      searchTerm: ''
    });
  };
  
  /**
   * Get badge color for adjustment type
   */
  const getAdjustmentTypeBadge = (type) => {
    const config = {
      increase: { label: 'Increase', className: 'bg-green-100 text-green-700' },
      decrease: { label: 'Decrease', className: 'bg-red-100 text-red-700' },
      correction: { label: 'Correction', className: 'bg-blue-100 text-blue-700' }
    };
    
    const { label, className } = config[type] || config.correction;
    return <Badge className={className}>{label}</Badge>;
  };
  
  /**
   * Get badge color for approval status
   */
  const getApprovalStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-700' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' }
    };
    
    const { label, className } = config[status] || config.pending;
    return <Badge className={className}>{label}</Badge>;
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-wine" />
            Audit Trail
          </h3>
          <p className="text-sm text-gray-500">
            Comprehensive stock adjustment history with full audit details
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          
          <Button
            onClick={fetchAuditTrail}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RotateCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={exportToPDF}
            variant="outline"
            size="sm"
            disabled={filteredAuditTrail.length === 0}
          >
            <FileDown className="w-4 h-4 mr-2" />
            PDF
          </Button>
          
          <Button
            onClick={exportToExcel}
            variant="outline"
            size="sm"
            disabled={filteredAuditTrail.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filter Audit Trail</CardTitle>
            <CardDescription>
              Narrow down results by date range, user, product, or transaction type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              
              {/* User Filter */}
              <div className="space-y-2">
                <Label>User</Label>
                <select
                  value={filters.userId}
                  onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">All Users</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Product Filter */}
              {!productId && (
                <div className="space-y-2">
                  <Label>Product</Label>
                  <select
                    value={filters.productId}
                    onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">All Products</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Transaction Type Filter */}
              <div className="space-y-2">
                <Label>Transaction Type</Label>
                <select
                  value={filters.transactionType}
                  onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  {transactionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Reason Code Filter */}
              <div className="space-y-2">
                <Label>Reason Code</Label>
                <select
                  value={filters.reasonCode}
                  onChange={(e) => setFilters({ ...filters, reasonCode: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  {reasonCodes.map(reason => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={clearFilters} size="sm">
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <Button onClick={fetchAuditTrail} size="sm" className="bg-wine hover:bg-wine/90">
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by product name, SKU, user, or notes..."
          value={filters.searchTerm}
          onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
          className="pl-10"
        />
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold">{filteredAuditTrail.length}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Increases</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredAuditTrail.filter(r => r.adjustment_type === 'increase').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Decreases</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredAuditTrail.filter(r => r.adjustment_type === 'decrease').length}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredAuditTrail.filter(r => r.approval_status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Audit Trail Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Before
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    After
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                      <RotateCcw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                      Loading audit trail...
                    </td>
                  </tr>
                ) : filteredAuditTrail.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-gray-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="font-medium">No audit records found</p>
                      <p className="text-sm">Try adjusting your filters or date range</p>
                    </td>
                  </tr>
                ) : (
                  filteredAuditTrail.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(record.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{record.requester?.full_name || record.requester?.email || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getAdjustmentTypeBadge(record.adjustment_type)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{record.product?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">{record.product?.sku || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {record.quantity_before}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                        {record.quantity_after}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <Badge variant="outline" className="mb-1">
                            {record.reason_code}
                          </Badge>
                          {record.reason_notes && (
                            <p className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={record.reason_notes}>
                              {record.reason_notes}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {record.ip_address || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {getApprovalStatusBadge(record.approval_status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Results Summary */}
      {filteredAuditTrail.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredAuditTrail.length} of {auditTrail.length} total records
        </div>
      )}
    </div>
  );
}
