/**
 * Centralized Data Fetching Service
 * 
 * This service provides unified data fetching across the application.
 * It handles authentication, retry logic, caching, request deduplication,
 * and multi-tenant isolation.
 * 
 * Usage:
 *   import { DataFetchingService } from '@/lib/services/dataFetching';
 *   
 *   const data = await DataFetchingService.fetchWithCache('/api/products', {
 *     businessId: '123',
 *     ttl: 300000 // 5 minutes
 *   });
 */

import { ErrorHandlingService } from './errorHandling';

/**
 * Centralized data fetching service
 */
export class DataFetchingService {
  static cache = new Map();
  static pendingRequests = new Map();
  static abortControllers = new Map();
  
  /**
   * Get authentication token
   * @returns {Promise<string|null>} Auth token
   */
  static async getAuthToken() {
    try {
      if (typeof window === 'undefined') return null;
      
      // Try to get token from localStorage
      const token = localStorage.getItem('auth_token');
      if (token) return token;
      
      // Try to get from session storage
      const sessionToken = sessionStorage.getItem('auth_token');
      if (sessionToken) return sessionToken;
      
      return null;
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  }
  
  /**
   * Fetch with authentication headers
   * @param {string} url - URL to fetch
   * @param {object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  static async fetchWithAuth(url, options = {}) {
    const token = await this.getAuthToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, {
      ...options,
      headers
    });
  }
  
  /**
   * Fetch with retry logic
   * @param {string} url - URL to fetch
   * @param {object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  static async fetchWithRetry(url, options = {}) {
    const { maxRetries = 3, ...fetchOptions } = options;
    
    return ErrorHandlingService.retryWithBackoff(
      () => this.fetchWithAuth(url, fetchOptions),
      { 
        maxRetries,
        onRetry: (attempt, max, delay) => {
          console.log(`Retrying request (${attempt}/${max}) after ${delay}ms: ${url}`);
        }
      }
    );
  }
  
  /**
   * Fetch with caching
   * @param {string} url - URL to fetch
   * @param {object} options - Fetch options with ttl
   * @returns {Promise<any>} Parsed response data
   */
  static async fetchWithCache(url, options = {}) {
    const { ttl = 300000, businessId, ...fetchOptions } = options; // 5 minutes default
    
    // Validate business_id for multi-tenant isolation
    if (businessId) {
      this.validateBusinessId(businessId);
    }
    
    // Create cache key including business_id
    const cacheKey = this.createCacheKey(url, fetchOptions, businessId);
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`Cache hit for: ${url}`);
      return cached.data;
    }
    
    // Deduplicate concurrent requests
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`Deduplicating request for: ${url}`);
      return this.pendingRequests.get(cacheKey);
    }
    
    // Create abort controller for this request
    const abortController = new AbortController();
    this.abortControllers.set(cacheKey, abortController);
    
    // Fetch data
    const promise = this.fetchWithRetry(url, {
      ...fetchOptions,
      signal: abortController.signal
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        // Cache the data
        this.cache.set(cacheKey, { 
          data, 
          timestamp: Date.now(),
          businessId 
        });
        
        // Store as fallback for network errors
        ErrorHandlingService.setFallbackData(cacheKey, data);
        
        // Clean up
        this.pendingRequests.delete(cacheKey);
        this.abortControllers.delete(cacheKey);
        
        return data;
      })
      .catch((error) => {
        // Clean up
        this.pendingRequests.delete(cacheKey);
        this.abortControllers.delete(cacheKey);
        
        // Try to return fallback data for network errors
        if (ErrorHandlingService.categorizeError(error) === 'network') {
          const fallback = ErrorHandlingService.getFallbackData(cacheKey);
          if (fallback) {
            console.warn(`Using fallback data for: ${url}`);
            return fallback;
          }
        }
        
        throw error;
      });
    
    this.pendingRequests.set(cacheKey, promise);
    return promise;
  }
  
  /**
   * Create cache key from URL and options
   * @param {string} url - URL
   * @param {object} options - Fetch options
   * @param {string} businessId - Business ID
   * @returns {string} Cache key
   */
  static createCacheKey(url, options, businessId) {
    const optionsKey = JSON.stringify({
      method: options.method || 'GET',
      body: options.body,
      businessId
    });
    return `${url}:${optionsKey}`;
  }
  
  /**
   * Validate business_id for multi-tenant isolation
   * @param {string} businessId - Business ID to validate
   * @throws {Error} If business_id is invalid
   */
  static validateBusinessId(businessId) {
    if (!businessId || typeof businessId !== 'string') {
      throw ErrorHandlingService.createError(
        'business_id is required for multi-tenant isolation',
        'validation'
      );
    }
    return businessId;
  }
  
  /**
   * Clear cache for specific key or all cache
   * @param {string} cacheKey - Optional cache key to clear
   */
  static clearCache(cacheKey = null) {
    if (cacheKey) {
      this.cache.delete(cacheKey);
      console.log(`Cache cleared for: ${cacheKey}`);
    } else {
      this.cache.clear();
      console.log('All cache cleared');
    }
  }
  
  /**
   * Clear cache for specific business
   * @param {string} businessId - Business ID
   */
  static clearBusinessCache(businessId) {
    let cleared = 0;
    for (const [key, value] of this.cache.entries()) {
      if (value.businessId === businessId) {
        this.cache.delete(key);
        cleared++;
      }
    }
    console.log(`Cleared ${cleared} cache entries for business: ${businessId}`);
  }
  
  /**
   * Cancel pending request
   * @param {string} cacheKey - Cache key of request to cancel
   */
  static cancelRequest(cacheKey) {
    const controller = this.abortControllers.get(cacheKey);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(cacheKey);
      this.pendingRequests.delete(cacheKey);
      console.log(`Request cancelled: ${cacheKey}`);
    }
  }
  
  /**
   * Cancel all pending requests
   */
  static cancelAllRequests() {
    for (const [key, controller] of this.abortControllers.entries()) {
      controller.abort();
    }
    this.abortControllers.clear();
    this.pendingRequests.clear();
    console.log('All pending requests cancelled');
  }
  
  /**
   * GET request with caching
   * @param {string} url - URL to fetch
   * @param {object} options - Options including businessId and ttl
   * @returns {Promise<any>} Response data
   */
  static async get(url, options = {}) {
    return this.fetchWithCache(url, {
      method: 'GET',
      ...options
    });
  }
  
  /**
   * POST request
   * @param {string} url - URL to fetch
   * @param {object} data - Data to send
   * @param {object} options - Options including businessId
   * @returns {Promise<any>} Response data
   */
  static async post(url, data, options = {}) {
    const { businessId, ...fetchOptions } = options;
    
    if (businessId) {
      this.validateBusinessId(businessId);
    }
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      body: JSON.stringify(data),
      ...fetchOptions
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * PUT request
   * @param {string} url - URL to fetch
   * @param {object} data - Data to send
   * @param {object} options - Options including businessId
   * @returns {Promise<any>} Response data
   */
  static async put(url, data, options = {}) {
    const { businessId, ...fetchOptions } = options;
    
    if (businessId) {
      this.validateBusinessId(businessId);
    }
    
    const response = await this.fetchWithRetry(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...fetchOptions
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * DELETE request
   * @param {string} url - URL to fetch
   * @param {object} options - Options including businessId
   * @returns {Promise<any>} Response data
   */
  static async delete(url, options = {}) {
    const { businessId, ...fetchOptions } = options;
    
    if (businessId) {
      this.validateBusinessId(businessId);
    }
    
    const response = await this.fetchWithRetry(url, {
      method: 'DELETE',
      ...fetchOptions
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  static getCacheStats() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

/**
 * React hook for data fetching with caching
 * @param {string} url - URL to fetch
 * @param {object} options - Options including businessId and ttl
 * @returns {object} Data, loading, error, and refetch function
 */
export function useFetch(url, options = {}) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await DataFetchingService.fetchWithCache(url, options);
      setData(result);
    } catch (err) {
      const handled = ErrorHandlingService.handleError(err, { url });
      setError(handled);
    } finally {
      setLoading(false);
    }
  }, [url, JSON.stringify(options)]);
  
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch: fetchData };
}
