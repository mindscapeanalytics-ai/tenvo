'use client';

import { useMemo } from 'react';
import { getDomainKnowledge } from '@/lib/domainKnowledge';
import { EnhancedDashboard } from '@/components/EnhancedDashboard';

/**
 * DashboardTemplateSelector Component
 * 
 * Intelligently selects and loads the appropriate dashboard template
 * based on business category. Provides fallback to default template.
 * 
 * Features:
 * - Automatic template detection based on category
 * - Fallback to default EnhancedDashboard
 * - Support for template switching (testing/admin)
 * - Domain-specific widget loading
 * - Role-based permission filtering
 * 
 * @param {Object} props
 * @param {string} props.businessId - Business ID
 * @param {string} props.category - Business category slug
 * @param {Function} [props.onQuickAction] - Quick action callback
 * @param {string} [props.forceTemplate] - Force specific template (for testing)
 * @param {string} [props.userRole] - User role for permission filtering
 * @param {Function} [props.hasPermission] - Permission check function
 */
export function DashboardTemplateSelector({ 
  businessId, 
  category, 
  onQuickAction,
  forceTemplate,
  userRole,
  hasPermission
}) {
  // Get domain knowledge for the category
  const knowledge = useMemo(() => getDomainKnowledge(category), [category]);

  // Determine which template to load
  const templateType = useMemo(() => {
    // Allow forcing template for testing/admin purposes
    if (forceTemplate) return forceTemplate;

    // Map categories to their specialized templates
    const templateMap = {
      'pharmacy': 'pharmacy',
      'textile-wholesale': 'textile',
      'textile-manufacturing': 'textile',
      'electronics': 'electronics',
      'mobile-accessories': 'electronics',
      'appliances': 'electronics',
      'computer-hardware': 'electronics',
      'electronics-goods': 'electronics',
      'mobile': 'electronics',
      'garments-wholesale': 'garments',
      'garments-retail': 'garments',
      'garments': 'garments',
      'boutique': 'garments',
      'boutique-fashion': 'garments',
      'retail-shop': 'retail',
      'grocery': 'retail',
      'fmcg': 'retail',
      'ecommerce': 'retail',
      'bakery-confectionery': 'retail',
      'bookshop-stationery': 'retail',
      'supermarket': 'retail',
      // All other categories use default
    };

    return templateMap[category] || 'default';
  }, [category, forceTemplate]);

  // Load the appropriate template component
  const DashboardComponent = useMemo(() => {
    switch (templateType) {
      case 'pharmacy':
        // Lazy load pharmacy dashboard
        const { PharmacyDashboard } = require('./templates/PharmacyDashboard');
        return PharmacyDashboard;
      
      case 'textile':
        // Lazy load textile dashboard
        const { TextileDashboard } = require('./templates/TextileDashboard');
        return TextileDashboard;
      
      case 'electronics':
        // Lazy load electronics dashboard
        const { ElectronicsDashboard } = require('./templates/ElectronicsDashboard');
        return ElectronicsDashboard;
      
      case 'garments':
        // Lazy load garments dashboard
        const { GarmentsDashboard } = require('./templates/GarmentsDashboard');
        return GarmentsDashboard;
      
      case 'retail':
        // Lazy load retail dashboard
        const { RetailDashboard } = require('./templates/RetailDashboard');
        return RetailDashboard;
      
      case 'default':
      default:
        return EnhancedDashboard;
    }
  }, [templateType]);

  // Render the selected dashboard template
  return (
    <DashboardComponent
      businessId={businessId}
      category={category}
      onQuickAction={onQuickAction}
      userRole={userRole}
      hasPermission={hasPermission}
    />
  );
}

/**
 * Get available templates for a category
 * Useful for admin/testing interfaces
 * 
 * @param {string} category - Business category slug
 * @returns {Array<string>} Available template names
 */
export function getAvailableTemplates(category) {
  const knowledge = getDomainKnowledge(category);
  const templates = ['default'];

  // Add specialized templates based on category
  if (category === 'pharmacy') templates.push('pharmacy');
  if (category.includes('textile')) templates.push('textile');
  if (['electronics', 'mobile-accessories', 'appliances', 'computer-hardware', 'electronics-goods', 'mobile'].includes(category)) {
    templates.push('electronics');
  }
  if (category.includes('garments') || category === 'boutique' || category === 'boutique-fashion') {
    templates.push('garments');
  }
  if (['retail-shop', 'grocery', 'fmcg', 'ecommerce', 'bakery-confectionery', 'bookshop-stationery', 'supermarket'].includes(category)) {
    templates.push('retail');
  }

  return templates;
}

/**
 * Get template metadata
 * 
 * @param {string} templateType - Template type
 * @returns {Object} Template metadata
 */
export function getTemplateMetadata(templateType) {
  const metadata = {
    default: {
      name: 'Default Dashboard',
      description: 'Standard dashboard with inventory widgets',
      features: ['Stats Cards', 'Revenue Chart', 'Inventory Widgets', 'Recent Activity', 'Alerts'],
    },
    pharmacy: {
      name: 'Pharmacy Dashboard',
      description: 'Specialized for pharmaceutical businesses',
      features: ['Drug Expiry Calendar', 'FBR Compliance', 'Controlled Substances', 'Prescription Tracking'],
    },
    textile: {
      name: 'Textile Dashboard',
      description: 'Specialized for textile businesses',
      features: ['Roll/Bale Inventory', 'Fabric Types', 'Market-wise Sales', 'Finish Status'],
    },
    electronics: {
      name: 'Electronics Dashboard',
      description: 'Specialized for electronics businesses',
      features: ['Warranty Calendar', 'Serial Tracking', 'Brand Performance', 'Return/Repair Rate'],
    },
    garments: {
      name: 'Garments Dashboard',
      description: 'Specialized for garment businesses',
      features: ['Size-Color Matrix', 'Lot Inventory', 'Seasonal Collections', 'Style Trends'],
    },
    retail: {
      name: 'Retail Dashboard',
      description: 'Specialized for general retail businesses',
      features: ['Category Performance', 'Fast/Slow Moving', 'Margin Analysis', 'Customer Loyalty'],
    },
  };

  return metadata[templateType] || metadata.default;
}
