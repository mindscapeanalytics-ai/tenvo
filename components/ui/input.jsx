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
        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }

