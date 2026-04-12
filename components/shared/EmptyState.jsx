/**
 * EmptyState Component
 * 
 * Displays a friendly empty state when no data is available.
 * Used in widgets, tables, and lists.
 * 
 * Features:
 * - Customizable icon, message, and description
 * - Optional action button
 * - Consistent styling
 * 
 * Usage:
 *   <EmptyState
 *     icon={Package}
 *     message="No products found"
 *     description="Add your first product to get started"
 *     action={{ label: 'Add Product', onClick: handleAdd }}
 *   />
 */

'use client';

import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

export function EmptyState({
  icon: Icon = Package,
  message = 'No data available',
  description = null,
  action = null,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {/* Icon */}
      <div className="mb-4 p-4 rounded-full bg-gray-100">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      
      {/* Message */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {message}
      </h3>
      
      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {/* Action button */}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || 'default'}
          size={action.size || 'default'}
        >
          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
