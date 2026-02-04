/**
 * useProductForm Hook
 * Custom hook for managing product form state and validation
 * 
 * Best Practices:
 * - Separation of concerns
 * - Reusable logic
 * - Type safety
 * - Performance optimization
 */

import { useState, useCallback, useEffect } from 'react';
import { validateDomainProduct } from '@/lib/utils/domainHelpers';
import { productSchema } from '@/lib/validation';
import { formatErrorMessage } from '@/lib/utils/errorHandler';

/**
 * Custom hook for product form management
 * 
 * @param {Object} options
 * @param {Object} options.initialProduct - Initial product data
 * @param {string} options.category - Business category
 * @param {Function} options.onSave - Save callback
 * @returns {Object} Form state and handlers
 */
export function useProductForm({ initialProduct = null, category = 'retail-shop', onSave }) {
  const [formData, setFormData] = useState(initialProduct || {});
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Update form data
  const updateField = useCallback((field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      setIsDirty(true);
      
      // Clear error when field is updated
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
      
      return updated;
    });
  }, [errors]);

  // Update multiple fields at once
  const updateFields = useCallback((updates) => {
    setFormData(prev => {
      const updated = { ...prev, ...updates };
      setIsDirty(true);
      return updated;
    });
  }, []);

  // Mark field as touched
  const markTouched = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  // Validate single field
  const validateField = useCallback((field, value) => {
    const fieldErrors = {};
    const fieldWarnings = {};

    // Basic validations
    if (field === 'name' && !value?.trim()) {
      fieldErrors.name = 'Product name is required';
    }

    if (field === 'price' && (value < 0 || isNaN(value))) {
      fieldErrors.price = 'Price must be a positive number';
    }

    if (field === 'stock' && (value < 0 || isNaN(value))) {
      fieldErrors.stock = 'Stock must be a positive number';
    }

    // Domain-specific validation
    const validation = validateDomainProduct({ [field]: value }, category);
    if (!validation.valid) {
      validation.errors.forEach(err => {
        if (err.includes(field)) {
          fieldErrors[field] = err;
        }
      });
    }

    // Update errors
    setErrors(prev => ({ ...prev, ...fieldErrors }));
    setWarnings(prev => ({ ...prev, ...fieldWarnings }));

    return Object.keys(fieldErrors).length === 0;
  }, [category]);

  // Validate entire form
  const validateForm = useCallback(() => {
    // Domain validation
    const domainValidation = validateDomainProduct(formData, category);
    
    // Zod validation
    let zodErrors = {};
    try {
      productSchema.parse(formData);
    } catch (error) {
      if (error.errors) {
        error.errors.forEach(err => {
          zodErrors[err.path[0]] = err.message;
        });
      }
    }

    // Combine errors
    const allErrors = {
      ...domainValidation.errors.reduce((acc, err) => {
        const fieldMatch = err.match(/^(\w+) is required/);
        if (fieldMatch) {
          acc[fieldMatch[1].toLowerCase()] = err;
        }
        return acc;
      }, {}),
      ...zodErrors,
    };

    setErrors(allErrors);
    setWarnings(domainValidation.warnings.reduce((acc, warn) => {
      // Parse warnings similarly
      return acc;
    }, {}));

    return domainValidation.valid && Object.keys(allErrors).length === 0;
  }, [formData, category]);

  // Reset form
  const resetForm = useCallback((newData = null) => {
    setFormData(newData || initialProduct || {});
    setErrors({});
    setWarnings({});
    setTouched({});
    setIsDirty(false);
  }, [initialProduct]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();

    // Mark all fields as touched
    const allFields = Object.keys(formData);
    allFields.forEach(field => markTouched(field));

    // Validate form
    if (!validateForm()) {
      throw new Error('Please fix the errors in the form');
    }

    setIsLoading(true);
    
    try {
      const productData = {
        ...formData,
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (onSave) {
        await onSave(productData);
      }

      setIsDirty(false);
      return productData;
    } catch (error) {
      const message = formatErrorMessage(error);
      setErrors({ submit: message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, onSave, markTouched]);

  // Reset form when initial product changes
  useEffect(() => {
    if (initialProduct) {
      resetForm(initialProduct);
    }
  }, [initialProduct, resetForm]);

  return {
    formData,
    errors,
    warnings,
    touched,
    isLoading,
    isDirty,
    updateField,
    updateFields,
    markTouched,
    validateField,
    validateForm,
    resetForm,
    handleSubmit,
  };
}

