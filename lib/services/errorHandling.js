/**
 * Centralized Error Handling Service
 * 
 * This service provides unified error handling across the application.
 * It categorizes errors, provides user-friendly messages, implements retry logic,
 * and integrates with monitoring services.
 * 
 * Usage:
 *   import { ErrorHandlingService } from '@/lib/services/errorHandling';
 *   
 *   try {
 *     await someOperation();
 *   } catch (error) {
 *     const { type, message } = ErrorHandlingService.handleError(error, { context: 'user-action' });
 *     toast.error(message);
 *   }
 */

/**
 * Error types
 */
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  PERMISSION: 'permission',
  SYSTEM: 'system',
  NOT_FOUND: 'not_found',
  TIMEOUT: 'timeout'
};

/**
 * Centralized error handling service
 */
export class ErrorHandlingService {
  /**
   * Handle error with context
   * @param {Error} error - Error object
   * @param {object} context - Additional context information
   * @returns {object} Error details with type and message
   */
  static handleError(error, context = {}) {
    const errorType = this.categorizeError(error);
    const errorMessage = this.getErrorMessage(error);
    
    // Log error with context
    console.error(`[${errorType}] ${errorMessage}`, { 
      error, 
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
    
    // Send critical errors to monitoring
    if (errorType === ERROR_TYPES.SYSTEM) {
      this.sendToMonitoring(error, context);
    }
    
    return { 
      type: errorType, 
      message: errorMessage,
      originalError: error
    };
  }
  
  /**
   * Categorize error type
   * @param {Error} error - Error object
   * @returns {string} Error type
   */
  static categorizeError(error) {
    if (!error) return ERROR_TYPES.SYSTEM;
    
    const message = error.message?.toLowerCase() || '';
    const name = error.name?.toLowerCase() || '';
    
    // Network errors
    if (
      message.includes('network') || 
      message.includes('fetch') ||
      message.includes('connection') ||
      name === 'networkerror' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND'
    ) {
      return ERROR_TYPES.NETWORK;
    }
    
    // Validation errors
    if (
      message.includes('validation') ||
      message.includes('invalid') ||
      message.includes('required') ||
      name === 'validationerror'
    ) {
      return ERROR_TYPES.VALIDATION;
    }
    
    // Permission errors
    if (
      message.includes('permission') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('access denied') ||
      error.status === 401 ||
      error.status === 403
    ) {
      return ERROR_TYPES.PERMISSION;
    }
    
    // Not found errors
    if (
      message.includes('not found') ||
      error.status === 404
    ) {
      return ERROR_TYPES.NOT_FOUND;
    }
    
    // Timeout errors
    if (
      message.includes('timeout') ||
      message.includes('timed out') ||
      name === 'timeouterror'
    ) {
      return ERROR_TYPES.TIMEOUT;
    }
    
    // Default to system error
    return ERROR_TYPES.SYSTEM;
  }
  
  /**
   * Get user-friendly error message
   * @param {Error} error - Error object
   * @returns {string} User-friendly error message
   */
  static getErrorMessage(error) {
    if (!error) return 'An unexpected error occurred. Please try again.';
    
    const type = this.categorizeError(error);
    
    const messages = {
      [ERROR_TYPES.NETWORK]: 'Network error. Please check your connection and try again.',
      [ERROR_TYPES.VALIDATION]: 'Invalid data. Please check your input and try again.',
      [ERROR_TYPES.PERMISSION]: 'You do not have permission to perform this action.',
      [ERROR_TYPES.NOT_FOUND]: 'The requested resource was not found.',
      [ERROR_TYPES.TIMEOUT]: 'Request timed out. Please try again.',
      [ERROR_TYPES.SYSTEM]: 'An unexpected error occurred. Please try again later.'
    };
    
    // Return custom message if available
    if (error.userMessage) {
      return error.userMessage;
    }
    
    // Return type-specific message
    return messages[type] || messages[ERROR_TYPES.SYSTEM];
  }
  
  /**
   * Retry function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {object} options - Retry options
   * @returns {Promise} Result of function
   */
  static async retryWithBackoff(fn, options = {}) {
    const { 
      maxRetries = 3, 
      initialDelay = 1000, 
      maxDelay = 10000,
      backoffFactor = 2,
      onRetry = null
    } = options;
    
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on validation or permission errors
        const errorType = this.categorizeError(error);
        if (
          errorType === ERROR_TYPES.VALIDATION || 
          errorType === ERROR_TYPES.PERMISSION
        ) {
          throw error;
        }
        
        // If this was the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(
          initialDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        );
        
        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, maxRetries, delay, error);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
  
  /**
   * Send error to monitoring service
   * @param {Error} error - Error object
   * @param {object} context - Additional context
   */
  static sendToMonitoring(error, context) {
    // In production, this would send to Sentry, LogRocket, etc.
    // For now, we'll just log it
    console.error('Critical error reported to monitoring:', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A'
    });
    
    // TODO: Integrate with actual monitoring service
    // Example: Sentry.captureException(error, { extra: context });
  }
  
  /**
   * Create error with additional context
   * @param {string} message - Error message
   * @param {string} type - Error type
   * @param {object} context - Additional context
   * @returns {Error} Enhanced error object
   */
  static createError(message, type = ERROR_TYPES.SYSTEM, context = {}) {
    const error = new Error(message);
    error.type = type;
    error.context = context;
    error.timestamp = new Date().toISOString();
    return error;
  }
  
  /**
   * Wrap async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {object} context - Error context
   * @returns {Function} Wrapped function
   */
  static wrapAsync(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        const handled = this.handleError(error, context);
        throw handled.originalError;
      }
    };
  }
  
  /**
   * Get fallback data for network errors
   * @param {string} cacheKey - Cache key for fallback data
   * @param {any} defaultValue - Default value if no cache
   * @returns {any} Cached data or default value
   */
  static getFallbackData(cacheKey, defaultValue = null) {
    try {
      if (typeof window === 'undefined') return defaultValue;
      
      const cached = localStorage.getItem(`fallback_${cacheKey}`);
      return cached ? JSON.parse(cached) : defaultValue;
    } catch (error) {
      console.warn('Failed to get fallback data:', error);
      return defaultValue;
    }
  }
  
  /**
   * Set fallback data for network errors
   * @param {string} cacheKey - Cache key for fallback data
   * @param {any} data - Data to cache
   */
  static setFallbackData(cacheKey, data) {
    try {
      if (typeof window === 'undefined') return;
      
      localStorage.setItem(`fallback_${cacheKey}`, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to set fallback data:', error);
    }
  }
}

/**
 * Error boundary helper for React components
 * @param {Error} error - Error object
 * @param {object} errorInfo - React error info
 * @returns {object} Error details
 */
export function handleComponentError(error, errorInfo) {
  return ErrorHandlingService.handleError(error, {
    componentStack: errorInfo?.componentStack,
    type: 'component-error'
  });
}

// Export error types for convenience
export { ERROR_TYPES as ErrorTypes };
