import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-compact-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-hidden focus-visible:focus-theatrical disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Enhanced module specific variants with glow
        cue: "bg-modules-cue text-white shadow-lg shadow-modules-cue/30 hover:shadow-modules-cue/50 hover:bg-modules-cue/90 btn-glow",
        work: "bg-modules-work text-white shadow-lg shadow-modules-work/30 hover:shadow-modules-work/50 hover:bg-modules-work/90 btn-glow",
        production: "bg-modules-production text-white shadow-lg shadow-modules-production/30 hover:shadow-modules-production/50 hover:bg-modules-production/90 btn-glow",
        actor: "bg-modules-production text-white shadow-lg shadow-modules-production/30 hover:shadow-modules-production/50 hover:bg-modules-production/90 btn-glow", // For Director Notes app
        // Status variants - dark mode optimized
        complete: "bg-transparent border border-status-complete/30 text-status-complete hover:bg-status-complete/10 hover:border-status-complete/50 transition-all duration-200",
        cancelled: "bg-transparent border border-status-cancelled/30 text-status-cancelled hover:bg-status-cancelled/10 hover:border-status-cancelled/50 transition-all duration-200",
        todo: "bg-status-todo text-white shadow hover:bg-status-todo/90",
        // Enhanced priority variants for quick add buttons
        priority_high: "bg-priority-high text-white shadow-lg shadow-priority-high/30 hover:shadow-priority-high/50 hover:bg-priority-high/90 priority-high",
        priority_medium: "bg-priority-medium text-white shadow-lg shadow-priority-medium/30 hover:shadow-priority-medium/50 hover:bg-priority-medium/90 priority-medium",
        priority_low: "bg-priority-low text-white shadow-lg shadow-priority-low/30 hover:shadow-priority-low/50 hover:bg-priority-low/90 priority-low",
        // Theatrical lighting variants
        spotlight: "bg-linear-to-br from-yellow-400 to-amber-500 text-black shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 font-medium",
        moonlight: "bg-linear-to-br from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 font-medium",
        stage: "bg-linear-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 font-medium",
      },
      size: {
        default: "h-compact-8 px-compact-3 py-compact-2",
        sm: "h-compact-7 rounded-md px-compact-3 text-xs",
        lg: "h-compact-9 rounded-md px-compact-6",
        icon: "h-compact-8 w-compact-8",
        xs: "h-compact-7 rounded-md px-compact-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
