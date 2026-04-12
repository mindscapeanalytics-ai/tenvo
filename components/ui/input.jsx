import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * @typedef {Object} InputProps
 * @property {string} [className]
 * @property {string} [type]
 * @property {any} [value]
 * @property {(e: any) => void} [onChange]
 * @property {string} [placeholder]
 * @property {boolean} [required]
 * @property {boolean} [readOnly]
 * @property {number} [maxLength]
 * @property {string | number} [min]
 * @property {string | number} [max]
 * @property {string | number} [step]
 * @property {(e: any) => void} [onKeyDown]
 */

/** @type {React.ForwardRefExoticComponent<InputProps & React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>>} */
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:border-brand-primary transition-all disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }

