'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Package, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { pakistaniSizes, pakistaniColors } from '@/lib/domainData/pakistaniRetailData';

/**
 * SizeColorMatrixWidget Component
 * 
 * Displays interactive size-color grid for garment inventory.
 * Shows stock status with color-coded cells.
 * 
 * Features:
 * - Interactive size-color grid
 * - Color-coded cells: green (in stock), yellow (low), red (out of stock)
 * - Quantity display in each cell
 * - Quick action: Manage Variants
 * 
 * @param {Object} props
 * @param {string} props.businessId - Business ID
 * @param {string} props.category - Business category
 * @param {Function} [props.onViewDetails] - Callback for view details action
 */
export function SizeColorMatrixWidget({ businessId, category, onViewDetails }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matrixData, setMatrixData] = useState(null);

  const isFootwear = category === 'leather-footwear';
  const sizes = isFootwear ? pakistaniSizes.footwear.men.slice(0, 10) : pakistaniSizes.clothing.men;
  const colors = pakistaniColors.slice(0, 8).map(c => c.en);

  useEffect(() => {
    fetchMatrixData();
  }, [businessId]);

  const fetchMatrixData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch products with size and color variants
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, size, color, quantity, reorder_point')
        .eq('business_id', businessId)
        .not('size', 'is', null)
        .not('color', 'is', null)
        .limit(100);

      if (productsError) throw productsError;

      // Build matrix
      const matrix = {};
      let totalInStock = 0;
      let totalLowStock = 0;
      let totalOutOfStock = 0;

      sizes.forEach(size => {
        matrix[size] = {};
        colors.forEach(color => {
          matrix[size][color] = { quantity: 0, status: 'out' };
        });
      });

      products?.forEach(product => {
        const size = product.size?.toUpperCase();
        const color = product.color;
        
        if (size && color && matrix[size] && matrix[size][color]) {
          matrix[size][color].quantity += product.quantity || 0;
          
          // Determine status
          const qty = matrix[size][color].quantity;
          const reorderPoint = product.reorder_point || 10;
          
          if (qty === 0) {
            matrix[size][color].status = 'out';
            totalOutOfStock++;
          } else if (qty <= reorderPoint) {
            matrix[size][color].status = 'low';
            totalLowStock++;
          } else {
            matrix[size][color].status = 'in';
            totalInStock++;
          }
        }
      });

      setMatrixData({
        matrix,
        summary: {
          inStock: totalInStock,
          lowStock: totalLowStock,
          outOfStock: totalOutOfStock,
          total: totalInStock + totalLowStock + totalOutOfStock
        }
      });
    } catch (err) {
      console.error('Error fetching size-color matrix:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCellColor = (status) => {
    switch (status) {
      case 'in': return 'bg-green-100 text-green-800 border-green-300';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'out': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleManageVariants = () => {
    if (onViewDetails) {
      onViewDetails('variants');
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Size-Color Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-wine" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Size-Color Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading matrix data</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Size-Color Matrix
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleManageVariants}
            className="text-wine hover:bg-wine hover:text-white"
          >
            Manage Variants
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">{matrixData?.summary.inStock || 0}</div>
            <div className="text-xs text-green-600">In Stock</div>
          </div>
          <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{matrixData?.summary.lowStock || 0}</div>
            <div className="text-xs text-yellow-600">Low Stock</div>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
            <div className="text-2xl font-bold text-red-700">{matrixData?.summary.outOfStock || 0}</div>
            <div className="text-xs text-red-600">Out of Stock</div>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 bg-gray-50 text-xs font-semibold">Size/Color</th>
                {colors.map(color => (
                  <th key={color} className="border border-gray-300 p-2 bg-gray-50 text-xs font-semibold">
                    {color}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizes.map(size => (
                <tr key={size}>
                  <td className="border border-gray-300 p-2 bg-gray-50 text-xs font-semibold text-center">
                    {size}
                  </td>
                  {colors.map(color => {
                    const cell = matrixData?.matrix[size]?.[color] || { quantity: 0, status: 'out' };
                    return (
                      <td 
                        key={`${size}-${color}`}
                        className={`border p-2 text-center text-xs font-medium ${getCellColor(cell.status)}`}
                      >
                        {cell.quantity}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>In Stock</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
            <span>Low Stock</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>Out of Stock</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
