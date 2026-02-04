import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FormError Component
 * Displays field-level error messages with appropriate styling
 * 
 * @param {Object} props
 * @param {string} props.error - Error message
 * @param {string} props.className - Additional CSS classes
 */
export function FormError({ error, className }) {
    if (!error) return null;

    return (
        <div className={cn("flex items-center gap-1.5 text-sm text-red-600 mt-1", className)}>
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
        </div>
    );
}

/**
 * FormWarning Component
 * Displays field-level warning messages
 * 
 * @param {Object} props
 * @param {string} props.warning - Warning message
 * @param {string} props.className - Additional CSS classes
 */
export function FormWarning({ warning, className }) {
    if (!warning) return null;

    return (
        <div className={cn("flex items-center gap-1.5 text-sm text-orange-600 mt-1", className)}>
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{warning}</span>
        </div>
    );
}

/**
 * FormInfo Component
 * Displays helpful information or hints
 * 
 * @param {Object} props
 * @param {string} props.info - Info message
 * @param {string} props.className - Additional CSS classes
 */
export function FormInfo({ info, className }) {
    if (!info) return null;

    return (
        <div className={cn("flex items-center gap-1.5 text-sm text-gray-500 mt-1", className)}>
            <Info className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{info}</span>
        </div>
    );
}

/**
 * FormFieldWrapper Component
 * Wraps form fields with label, error, and warning display
 * 
 * @param {Object} props
 * @param {string} props.label - Field label
 * @param {string} props.error - Error message
 * @param {string} props.warning - Warning message
 * @param {string} props.info - Info message
 * @param {boolean} props.required - Whether field is required
 * @param {React.ReactNode} props.children - Form input element
 * @param {string} props.className - Additional CSS classes
 */
export function FormFieldWrapper({
    label,
    error,
    warning,
    info,
    required,
    children,
    className
}) {
    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="text-sm font-medium text-gray-900">
                    {label}
                    {required && <span className="text-red-600 ml-1">*</span>}
                </label>
            )}
            {children}
            <FormError error={error} />
            <FormWarning warning={warning} />
            <FormInfo info={info} />
        </div>
    );
}
