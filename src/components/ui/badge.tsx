import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border border-transparent px-3 py-1.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
        // Ceramic design system variants
        ceramic: "[background-color:rgba(132,107,255,0.1)] [color:var(--ceramic-brand)]",
        "ceramic-default": "[background-color:var(--ceramic-gray-100)] [color:var(--ceramic-gray-700)]",
        "ceramic-success": "[background-color:rgba(49,200,84,0.1)] [color:var(--ceramic-green-600)]",
        "ceramic-error": "[background-color:rgba(247,61,61,0.1)] [color:var(--ceramic-red-600)]",
        "ceramic-warning": "[background-color:rgba(253,114,36,0.1)] [color:var(--ceramic-orange-600)]",
        "ceramic-info": "[background-color:rgba(48,127,246,0.1)] [color:var(--ceramic-blue-600)]",
        "ceramic-solid-brand": "[background-color:var(--ceramic-brand)] [color:var(--ceramic-white)]",
        "ceramic-solid-success": "[background-color:var(--ceramic-green-600)] [color:var(--ceramic-white)]",
        "ceramic-solid-error": "[background-color:var(--ceramic-red-600)] [color:var(--ceramic-white)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
