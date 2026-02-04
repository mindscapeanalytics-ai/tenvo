/**
 * Error Handling Utilities
 * Centralized error handling with user-friendly messages
 */

/**
 * Format error message for user display
 * 
 * @param {Error|string} error - Error object or message
 * @returns {string} User-friendly error message
 */
export function formatErrorMessage(error) {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    // Handle common error patterns
    const message = error.message;

    // Network errors
    if (message.includes('fetch') || message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Validation errors
    if (message.includes('validation') || message.includes('required')) {
      return message;
    }

    // Permission errors
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'You do not have permission to perform this action.';
    }

    // Generic error
    return message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Log error with context
 * 
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export function logError(error, context = {}) {
  console.error('Error:', {
    message: error?.message,
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle async errors with try-catch wrapper
 * 
 * @param {Function} asyncFn - Async function to execute
 * @param {Function} onError - Error callback
 * @returns {Promise} Promise that resolves with result or rejects with formatted error
 */
export async function handleAsyncError(asyncFn, onError) {
  try {
    return await asyncFn();
  } catch (error) {
    const formattedError = formatErrorMessage(error);
    logError(error);
    
    if (onError) {
      onError(formattedError, error);
    }
    
    throw new Error(formattedError);
  }
}

/**
 * Create error boundary message
 * 
 * @param {Error} error - Error object
 * @param {string} componentName - Name of component that errored
 * @returns {Object} Error info for error boundary
 */
export function createErrorInfo(error, componentName = 'Component') {
  return {
    error,
    componentStack: error?.stack || '',
    componentName,
    timestamp: new Date().toISOString(),
  };
}

