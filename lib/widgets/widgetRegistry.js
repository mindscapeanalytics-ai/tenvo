/**
 * Widget Registry
 * 
 * Centralized catalog of all available dashboard widgets with metadata and permissions.
 * Provides discovery, filtering, and registration capabilities for widgets.
 * 
 * Usage:
 *   import { widgetRegistry } from '@/lib/widgets/widgetRegistry';
 *   
 *   // Get widget by ID
 *   const widget = widgetRegistry.getWidget('team-performance');
 *   
 *   // Get widgets by category
 *   const inventoryWidgets = widgetRegistry.getWidgetsByCategory('inventory');
 *   
 *   // Get widgets by permission
 *   const userWidgets = widgetRegistry.getWidgetsByPermission(['view_inventory']);
 */

/**
 * Widget categories
 */
export const WIDGET_CATEGORIES = {
  INVENTORY: 'inventory',
  SALES: 'sales',
  FINANCE: 'finance',
  MANAGEMENT: 'management',
  PAKISTANI: 'pakistani',
  GENERAL: 'general',
  SYSTEM: 'system'
};

/**
 * Widget Registry class
 */
class WidgetRegistry {
  constructor() {
    this.widgets = new Map();
  }
  
  /**
   * Register a widget
   * @param {object} definition - Widget definition
   * @throws {Error} If definition is invalid
   */
  registerWidget(definition) {
    const { 
      id, 
      name, 
      component, 
      category, 
      description, 
      requiredPermissions, 
      defaultSize, 
      minSize, 
      maxSize,
      icon,
      previewImage
    } = definition;
    
    // Validate required fields
    if (!id || !name || !component) {
      throw new Error('Widget definition must include id, name, and component');
    }
    
    // Check for duplicate IDs
    if (this.widgets.has(id)) {
      console.warn(`Widget with ID "${id}" already registered. Overwriting.`);
    }
    
    // Store widget definition
    this.widgets.set(id, {
      id,
      name,
      component,
      category: category || WIDGET_CATEGORIES.GENERAL,
      description: description || '',
      requiredPermissions: requiredPermissions || [],
      defaultSize: defaultSize || { w: 2, h: 2 },
      minSize: minSize || { w: 1, h: 1 },
      maxSize: maxSize || { w: 4, h: 4 },
      icon: icon || null,
      previewImage: previewImage || null,
      registeredAt: new Date().toISOString()
    });
    
    console.log(`Widget registered: ${id} (${name})`);
  }
  
  /**
   * Register multiple widgets at once
   * @param {Array<object>} definitions - Array of widget definitions
   */
  registerWidgets(definitions) {
    if (!Array.isArray(definitions)) {
      throw new Error('Definitions must be an array');
    }
    
    definitions.forEach(definition => {
      try {
        this.registerWidget(definition);
      } catch (error) {
        console.error(`Failed to register widget:`, error);
      }
    });
  }
  
  /**
   * Get widget by ID
   * @param {string} id - Widget ID
   * @returns {object|undefined} Widget definition or undefined
   */
  getWidget(id) {
    const widget = this.widgets.get(id);
    
    if (!widget) {
      console.warn(`Widget not found: ${id}`);
    }
    
    return widget;
  }
  
  /**
   * Get widgets by category
   * @param {string} category - Widget category
   * @returns {Array<object>} Array of widget definitions
   */
  getWidgetsByCategory(category) {
    return Array.from(this.widgets.values())
      .filter(widget => widget.category === category);
  }
  
  /**
   * Get widgets by permission
   * @param {Array<string>} permissions - User permissions
   * @returns {Array<object>} Array of widget definitions
   */
  getWidgetsByPermission(permissions) {
    if (!Array.isArray(permissions)) {
      console.warn('Permissions must be an array');
      return [];
    }
    
    // If user has wildcard permission, return all widgets
    if (permissions.includes('*')) {
      return this.getAllWidgets();
    }
    
    return Array.from(this.widgets.values())
      .filter(widget => {
        // Widgets with no required permissions are available to all
        if (widget.requiredPermissions.length === 0) {
          return true;
        }
        
        // Check if user has at least one required permission
        return widget.requiredPermissions.some(permission => 
          permissions.includes(permission)
        );
      });
  }
  
  /**
   * Get all widgets
   * @returns {Array<object>} Array of all widget definitions
   */
  getAllWidgets() {
    return Array.from(this.widgets.values());
  }
  
  /**
   * Get all widget IDs
   * @returns {Array<string>} Array of widget IDs
   */
  getAllWidgetIds() {
    return Array.from(this.widgets.keys());
  }
  
  /**
   * Get all categories
   * @returns {Array<string>} Array of unique categories
   */
  getAllCategories() {
    const categories = new Set();
    
    for (const widget of this.widgets.values()) {
      categories.add(widget.category);
    }
    
    return Array.from(categories);
  }
  
  /**
   * Check if widget exists
   * @param {string} id - Widget ID
   * @returns {boolean} True if widget exists
   */
  hasWidget(id) {
    return this.widgets.has(id);
  }
  
  /**
   * Unregister widget
   * @param {string} id - Widget ID
   * @returns {boolean} True if widget was removed
   */
  unregisterWidget(id) {
    const removed = this.widgets.delete(id);
    
    if (removed) {
      console.log(`Widget unregistered: ${id}`);
    } else {
      console.warn(`Widget not found for unregistration: ${id}`);
    }
    
    return removed;
  }
  
  /**
   * Clear all widgets
   */
  clearAll() {
    this.widgets.clear();
    console.log('All widgets cleared from registry');
  }
  
  /**
   * Get registry statistics
   * @returns {object} Registry statistics
   */
  getStats() {
    const stats = {
      total: this.widgets.size,
      byCategory: {},
      byPermission: {}
    };
    
    // Count by category
    for (const widget of this.widgets.values()) {
      stats.byCategory[widget.category] = (stats.byCategory[widget.category] || 0) + 1;
      
      // Count by permission
      for (const permission of widget.requiredPermissions) {
        stats.byPermission[permission] = (stats.byPermission[permission] || 0) + 1;
      }
    }
    
    return stats;
  }
  
  /**
   * Search widgets by name or description
   * @param {string} query - Search query
   * @returns {Array<object>} Array of matching widgets
   */
  search(query) {
    if (!query || typeof query !== 'string') {
      return [];
    }
    
    const lowerQuery = query.toLowerCase();
    
    return Array.from(this.widgets.values())
      .filter(widget => {
        const nameMatch = widget.name.toLowerCase().includes(lowerQuery);
        const descMatch = widget.description.toLowerCase().includes(lowerQuery);
        const idMatch = widget.id.toLowerCase().includes(lowerQuery);
        
        return nameMatch || descMatch || idMatch;
      });
  }
  
  /**
   * Validate widget definition
   * @param {object} definition - Widget definition to validate
   * @returns {object} Validation result with valid flag and errors array
   */
  validateDefinition(definition) {
    const errors = [];
    
    if (!definition.id) {
      errors.push('Widget ID is required');
    }
    
    if (!definition.name) {
      errors.push('Widget name is required');
    }
    
    if (!definition.component) {
      errors.push('Widget component is required');
    }
    
    if (definition.category && !Object.values(WIDGET_CATEGORIES).includes(definition.category)) {
      errors.push(`Invalid category: ${definition.category}`);
    }
    
    if (definition.requiredPermissions && !Array.isArray(definition.requiredPermissions)) {
      errors.push('requiredPermissions must be an array');
    }
    
    if (definition.defaultSize) {
      if (typeof definition.defaultSize.w !== 'number' || typeof definition.defaultSize.h !== 'number') {
        errors.push('defaultSize must have numeric w and h properties');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
export const widgetRegistry = new WidgetRegistry();

// Export class for testing
export { WidgetRegistry };

/**
 * Helper function to register a widget with validation
 * @param {object} definition - Widget definition
 * @returns {boolean} True if registration succeeded
 */
export function registerWidget(definition) {
  try {
    const validation = widgetRegistry.validateDefinition(definition);
    
    if (!validation.valid) {
      console.error('Widget validation failed:', validation.errors);
      return false;
    }
    
    widgetRegistry.registerWidget(definition);
    return true;
  } catch (error) {
    console.error('Widget registration failed:', error);
    return false;
  }
}

/**
 * Helper function to get widgets for a specific user
 * @param {object} user - User object with role and permissions
 * @param {string} [category] - Optional category filter
 * @returns {Array<object>} Array of widgets available to user
 */
export function getWidgetsForUser(user, category = null) {
  if (!user) {
    return [];
  }
  
  // Get user permissions (from role and user-specific permissions)
  const permissions = user.permissions || [];
  
  // Get widgets by permission
  let widgets = widgetRegistry.getWidgetsByPermission(permissions);
  
  // Filter by category if specified
  if (category) {
    widgets = widgets.filter(widget => widget.category === category);
  }
  
  return widgets;
}

/**
 * Helper function to check if user can access widget
 * @param {object} user - User object with permissions
 * @param {string} widgetId - Widget ID
 * @returns {boolean} True if user can access widget
 */
export function canAccessWidget(user, widgetId) {
  if (!user || !widgetId) {
    return false;
  }
  
  const widget = widgetRegistry.getWidget(widgetId);
  
  if (!widget) {
    return false;
  }
  
  // Widgets with no required permissions are available to all
  if (widget.requiredPermissions.length === 0) {
    return true;
  }
  
  // Check if user has wildcard permission
  if (user.permissions && user.permissions.includes('*')) {
    return true;
  }
  
  // Check if user has at least one required permission
  const userPermissions = user.permissions || [];
  return widget.requiredPermissions.some(permission => 
    userPermissions.includes(permission)
  );
}
