/**
 * Centralized Language Hook
 * 
 * This module re-exports the useLanguage hook from LanguageContext
 * for easier imports across the application.
 * 
 * Usage:
 *   import { useLanguage } from '@/lib/hooks/useLanguage';
 *   const { language, t } = useLanguage();
 */

export { useLanguage } from '@/lib/context/LanguageContext';
