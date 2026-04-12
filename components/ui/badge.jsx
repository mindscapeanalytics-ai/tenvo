import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-primary text-white hover:bg-brand-primary-dark",
        secondary:
          "border-transparent bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
        destructive:
          "border-transparent bg-error text-white hover:bg-error-dark",
        outline: "border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50",
        success: "border-transparent bg-success-light text-success-dark hover:bg-success-light/80",
        warning: "border-transparent bg-warning-light text-warning-dark hover:bg-warning-light/80",
        info: "border-transparent bg-info-light text-info-dark hover:bg-info-light/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * @typedef {Object} BadgeProps
 * @property {string} [className]
 * @property {string} [variant] - "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
 * @property {React.ReactNode} [children]
 */

/** @param {BadgeProps & React.HTMLAttributes<HTMLDivElement>} props */
function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant: /** @type {any} */ (variant) }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

