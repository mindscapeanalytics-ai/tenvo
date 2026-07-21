'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { clampRegistrationStep } from '../registration/registrationWizard.js';

const STORAGE_KEY = 'tenvo_registration_data';
const SAVE_INTERVAL = 3000; // Save every 3 seconds
const LAST_STEP_KEY = 'tenvo_registration_step';

/**
 * Hook for persisting registration form data
 * - Auto-saves to localStorage every 3 seconds
 * - Recovers data on page reload
 * - Clears data on successful registration
 * - Shows recovery dialog if data exists
 */
export function useRegistrationPersistence(initialStep = 1) {
  const [formData, setFormData] = useState({});
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [hasRecoveredData, setHasRecoveredData] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef(Date.now());

  // Load saved data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedStep = localStorage.getItem(LAST_STEP_KEY);

      if (savedData) {
        const parsed = JSON.parse(savedData);
        setFormData(parsed);
        setHasRecoveredData(true);
        setShowRecoveryDialog(true);
      }

      if (savedStep) {
        const parsed = parseInt(savedStep, 10);
        const parsedData = savedData ? JSON.parse(savedData) : {};
        setCurrentStep(clampRegistrationStep(parsed, parsedData));
      }
    } catch (error) {
      console.error('[useRegistrationPersistence] Error loading saved data:', error);
      clearSavedData();
    }
  }, []);

  // Auto-save to localStorage
  const saveToStorage = useCallback((data, step) => {
    try {
      const dataToSave = {
        ...data,
        _savedAt: new Date().toISOString(),
        _version: '1.0'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      localStorage.setItem(LAST_STEP_KEY, step.toString());
      lastSavedRef.current = Date.now();
    } catch (error) {
      console.error('[useRegistrationPersistence] Error saving data:', error);
    }
  }, []);

  // Debounced save
  const scheduleSave = useCallback((data, step) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(data, step);
    }, SAVE_INTERVAL);
  }, [saveToStorage]);

  // Update form data with persistence
  const updateFormData = useCallback((updates) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      scheduleSave(newData, currentStep);
      return newData;
    });
  }, [currentStep, scheduleSave]);

  // Update current step with persistence
  const updateStep = useCallback((step) => {
    setCurrentStep(step);
    saveToStorage(formData, step);
  }, [formData, saveToStorage]);

  // Clear all saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LAST_STEP_KEY);
      setFormData({});
      setHasRecoveredData(false);
      setShowRecoveryDialog(false);
    } catch (error) {
      console.error('[useRegistrationPersistence] Error clearing data:', error);
    }
  }, []);

  // Accept recovered data
  const acceptRecoveredData = useCallback(() => {
    setShowRecoveryDialog(false);
  }, []);

  // Reject recovered data (start fresh)
  const rejectRecoveredData = useCallback(() => {
    clearSavedData();
    setShowRecoveryDialog(false);
  }, [clearSavedData]);

  // Manual save trigger (for beforeunload)
  const saveNow = useCallback(() => {
    saveToStorage(formData, currentStep);
  }, [formData, currentStep, saveToStorage]);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveNow();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveNow]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    formData,
    setFormData: updateFormData,
    currentStep,
    setCurrentStep: updateStep,
    hasRecoveredData,
    showRecoveryDialog,
    acceptRecoveredData,
    rejectRecoveredData,
    clearSavedData,
    saveNow,
    lastSaved: lastSavedRef.current
  };
}

/**
 * Hook for checking if there's saved registration data
 */
export function useHasRegistrationData() {
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      setHasData(!!savedData);
    } catch {
      setHasData(false);
    }
  }, []);

  return hasData;
}

/**
 * Get saved registration data (for recovery dialog)
 */
export function getSavedRegistrationData() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const savedStep = localStorage.getItem(LAST_STEP_KEY);

    if (!savedData) return null;

    const data = JSON.parse(savedData);
    const savedAt = data._savedAt ? new Date(data._savedAt) : null;
    const age = savedAt ? Date.now() - savedAt.getTime() : 0;
    const ageHours = Math.floor(age / (1000 * 60 * 60));

    return {
      data,
      step: parseInt(savedStep, 10) || 1,
      savedAt,
      ageHours,
      isRecent: ageHours < 24 // Less than 24 hours old
    };
  } catch (error) {
    console.error('[getSavedRegistrationData] Error:', error);
    return null;
  }
}

/**
 * Clear all registration data
 */
export function clearRegistrationData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LAST_STEP_KEY);
  } catch (error) {
    console.error('[clearRegistrationData] Error:', error);
  }
}

/**
 * Clear only the saved step (keep form draft).
 */
export function clearRegistrationStep() {
  try {
    localStorage.removeItem(LAST_STEP_KEY);
  } catch (error) {
    console.error('[clearRegistrationStep] Error:', error);
  }
}
