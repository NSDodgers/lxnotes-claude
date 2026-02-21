import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all duration-200 focus:outline-hidden focus:focus-theatrical status-badge",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        // Enhanced module specific variants with glow
        cue: "border-transparent bg-modules-cue text-white shadow-lg shadow-modules-cue/40 hover:shadow-modules-cue/60",
        work: "border-transparent bg-modules-work text-white shadow-lg shadow-modules-work/40 hover:shadow-modules-work/60",
        production: "border-transparent bg-modules-production text-white shadow-lg shadow-modules-production/40 hover:shadow-modules-production/60",
        // Status variants with theatrical glow
        todo: "border-transparent bg-status-todo text-white shadow-lg shadow-status-todo/40",
        complete: "border-status-complete/50 bg-status-complete/20 text-status-complete shadow-lg shadow-status-complete/30",
        cancelled: "border-status-cancelled/50 bg-status-cancelled/20 text-status-cancelled shadow-lg shadow-status-cancelled/30",
        // Priority variants
        high: "border-transparent bg-priority-high text-white shadow-lg shadow-priority-high/40 priority-high",
        medium: "border-transparent bg-priority-medium text-white shadow-lg shadow-priority-medium/40 priority-medium",
        low: "border-transparent bg-priority-low text-white shadow-lg shadow-priority-low/40 priority-low",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
