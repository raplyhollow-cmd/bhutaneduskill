import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 min-h-11 md:h-10 w-full min-w-0 rounded-lg border bg-transparent px-4 py-2.5 text-base md:text-sm shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Ceramic design system variants
        ceramic: "[border-color:var(--border-color-primary)] [background-color:var(--ceramic-white)] [color:var(--ceramic-primary)] focus-visible:[border-color:var(--ceramic-brand)] focus-visible:[box-shadow:0_0_0_2px_rgba(132,107,255,0.1)]",
        "ceramic-hover": "[border-color:var(--border-color-primary)] [background-color:var(--ceramic-white)] [color:var(--ceramic-primary)] hover:[border-color:var(--ceramic-gray-400)] focus-visible:[border-color:var(--ceramic-brand)] focus-visible:[box-shadow:0_0_0_2px_rgba(132,107,255,0.1)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Input({ className, type, variant = "default", ...props }: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
