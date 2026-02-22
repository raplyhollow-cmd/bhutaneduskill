"use client";

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "flex flex-col gap-6 rounded-xl border shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground hover:border-border/50 hover:shadow-md",
        // Ceramic design system variants
        ceramic: "[background-color:var(--ceramic-white)] [border-color:var(--border-color-primary)] hover:[border-color:var(--ceramic-gray-400)]",
        "ceramic-interactive": "[background-color:var(--ceramic-white)] [border-color:var(--border-color-primary)] cursor-pointer hover:[border-color:var(--ceramic-gray-400)] hover:shadow-md",
        "ceramic-elevated": "[background-color:var(--ceramic-white)] [border-color:var(--border-color-primary)] shadow-md hover:shadow-lg",
        "ceramic-flat": "[background-color:var(--ceramic-gray-50)] border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface CardProps extends React.ComponentProps<"div"> {
  asChild?: boolean;
  variant?: VariantProps<typeof cardVariants>["variant"];
}

function Card({ className, asChild, children, variant = "default", ...props }: CardProps) {
  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement & { props?: { className?: string } };
    const childClassName = child.props?.className || "";
    return React.cloneElement(child, {
      className: cn(
        cardVariants({ variant }),
        "text-card-foreground",
        className,
        childClassName
      ),
      ...props
    });
  }

  return (
    <div
      data-slot="card"
      data-variant={variant}
      className={cn(cardVariants({ variant }), "text-card-foreground", className)}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 py-5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 py-5", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
