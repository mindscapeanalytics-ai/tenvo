'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';

/**
 * Custom hook for form validation using Zod schemas
 * Provides real-time validation and error handling
 * 
 * @param {z.ZodSchema} schema - Zod validation schema
 * @param {object} initialData - Initial form data
 * @returns {object} Validation utilities
 */
export function useFormValidation(schema, initialData = {}) {
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    /**
     * Validate a single field
     */
    const validateField = useCallback((fieldName, value) => {
        try {
            // Extract the field schema
            const fieldSchema = schema.shape[fieldName];
            if (!fieldSchema) return null;

            fieldSchema.parse(value);

            // Clear error for this field
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
            });

            return null;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldError = error.errors[0]?.message || 'Invalid value';
                setErrors(prev => ({ ...prev, [fieldName]: fieldError }));
                return fieldError;
            }
            return null;
        }
    }, [schema]);

    /**
     * Validate entire form
     */
    const validateForm = useCallback((data) => {
        try {
            schema.parse(data);
            setErrors({});
            return { success: true, data };
        } catch (error) {
            if (error instanceof z.ZodError) {
                const formattedErrors = {};
                error.errors.forEach(err => {
                    const path = err.path.join('.');
                    formattedErrors[path] = err.message;
                });
                setErrors(formattedErrors);
                return { success: false, errors: formattedErrors };
            }
            return { success: false, errors: { _general: error.message } };
        }
    }, [schema]);

    /**
     * Mark field as touched
     */
    const touchField = useCallback((fieldName) => {
        setTouched(prev => ({ ...prev, [fieldName]: true }));
    }, []);

    /**
     * Reset validation state
     */
    const resetValidation = useCallback(() => {
        setErrors({});
        setTouched({});
    }, []);

    /**
     * Get error for a field (only if touched)
     */
    const getFieldError = useCallback((fieldName) => {
        return touched[fieldName] ? errors[fieldName] : undefined;
    }, [errors, touched]);

    /**
     * Check if field has error
     */
    const hasError = useCallback((fieldName) => {
        return touched[fieldName] && !!errors[fieldName];
    }, [errors, touched]);

    return {
        errors,
        touched,
        validateField,
        validateForm,
        touchField,
        resetValidation,
        getFieldError,
        hasError
    };
}

/**
 * Hook for async server-side validation
 * Useful for checking uniqueness, availability, etc.
 * 
 * @param {Function} validationFn - Async validation function
 * @param {number} debounceMs - Debounce delay in milliseconds
 */
export function useAsyncValidation(validationFn, debounceMs = 500) {
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState(null);
    const [validationSuccess, setValidationSuccess] = useState(false);

    const validate = useCallback(async (value) => {
        if (!value) {
            setValidationError(null);
            setValidationSuccess(false);
            return;
        }

        setIsValidating(true);
        setValidationError(null);
        setValidationSuccess(false);

        try {
            const result = await validationFn(value);
            if (result.success) {
                setValidationSuccess(true);
            } else {
                setValidationError(result.error || 'Validation failed');
            }
        } catch (error) {
            setValidationError(error.message);
        } finally {
            setIsValidating(false);
        }
    }, [validationFn]);

    // Debounced validation
    const debouncedValidate = useCallback((value) => {
        const timer = setTimeout(() => validate(value), debounceMs);
        return () => clearTimeout(timer);
    }, [validate, debounceMs]);

    return {
        isValidating,
        validationError,
        validationSuccess,
        validate: debouncedValidate,
        validateImmediate: validate
    };
}

/**
 * Hook for form submission with validation
 * 
 * @param {z.ZodSchema} schema - Zod validation schema
 * @param {Function} onSubmit - Submit handler
 */
export function useValidatedForm(schema, onSubmit) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const validation = useFormValidation(schema);

    const handleSubmit = useCallback(async (data) => {
        setSubmitError(null);

        // Validate form
        const validationResult = validation.validateForm(data);
        if (!validationResult.success) {
            setSubmitError('Please fix validation errors before submitting');
            return { success: false, errors: validationResult.errors };
        }

        // Submit
        setIsSubmitting(true);
        try {
            const result = await onSubmit(validationResult.data);
            if (result.success) {
                validation.resetValidation();
            } else {
                setSubmitError(result.error || 'Submission failed');
                if (result.errors) {
                    // Server-side validation errors
                    Object.keys(result.errors).forEach(field => {
                        validation.touchField(field);
                    });
                }
            }
            return result;
        } catch (error) {
            setSubmitError(error.message);
            return { success: false, error: error.message };
        } finally {
            setIsSubmitting(false);
        }
    }, [onSubmit, validation]);

    return {
        ...validation,
        isSubmitting,
        submitError,
        handleSubmit
    };
}

/**
 * Validation helper for common patterns
 */
export const validationHelpers = {
    /**
     * Check if SKU is unique
     */
    checkSKUUnique: async (sku, businessId, excludeProductId = null) => {
        try {
            const { checkSKUExistsAction } = await import('@/lib/actions/standard/inventory/validation');
            const result = await checkSKUExistsAction(sku, businessId, excludeProductId);
            return result.exists
                ? { success: false, error: 'SKU already exists' }
                : { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Check if barcode is unique
     */
    checkBarcodeUnique: async (barcode, businessId, excludeProductId = null) => {
        try {
            const { checkBarcodeExistsAction } = await import('@/lib/actions/standard/inventory/validation');
            const result = await checkBarcodeExistsAction(barcode, businessId, excludeProductId);
            return result.exists
                ? { success: false, error: 'Barcode already exists' }
                : { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Check stock availability
     */
    checkStockAvailability: async (productId, quantity, warehouseId = null) => {
        try {
            const { checkStockAvailabilityAction } = await import('@/lib/actions/standard/inventory/validation');
            const result = await checkStockAvailabilityAction(productId, quantity, warehouseId);
            return result.available
                ? { success: true }
                : { success: false, error: `Only ${result.availableQuantity} units available` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    /**
     * Check customer credit limit
     */
    checkCreditLimit: async (customerId, additionalAmount) => {
        try {
            const { checkCustomerCreditAction } = await import('@/lib/actions/basic/customer');
            const result = await checkCustomerCreditAction(customerId, additionalAmount);
            return result.withinLimit
                ? { success: true }
                : { success: false, error: `Credit limit exceeded by ${result.excessAmount}` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};
