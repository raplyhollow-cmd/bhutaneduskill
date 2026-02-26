"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { radius, portal } from "@/styles/design-tokens"

/**
 * Avatar Component with Design Token Integration
 *
 * Uses design tokens for consistent border radius and transitions.
 */

const avatarVariants = cva(
  "group/avatar relative flex shrink-0 overflow-hidden rounded-full select-none",
  {
    variants: {
      variant: {
        default: "",
        // Ceramic design system variants
        ceramic: "[background-color:var(--ceramic-purple-100)] [color:var(--ceramic-purple-700)] dark:[background-color:var(--ceramic-purple-900)] dark:[color:var(--ceramic-purple-300)]",
        "ceramic-gray": "[background-color:var(--ceramic-gray-100)] [color:var(--ceramic-gray-700)] dark:[background-color:var(--ceramic-gray-700)] dark:[color:var(--ceramic-gray-300)]",
        "ceramic-success": "[background-color:var(--ceramic-green-100)] [color:var(--ceramic-green-700)] dark:[background-color:var(--ceramic-green-900)] dark:[color:var(--ceramic-green-300)]",
        "ceramic-brand": "[background-color:rgba(132,107,255,0.15)] [color:var(--ceramic-brand)]",
        "ceramic-outline": "[background-color:transparent] [border:1px_solid_var(--border-color-primary)]",
        // Portal-specific variants
        student: "",
        teacher: "",
        parent: "",
        counselor: "",
        admin: "",
        "school-admin": "",
        ministry: "",
      },
      size: {
        xs: "size-5 [&>svg]:size-3 text-[0.625rem]",
        sm: "size-7 text-[0.75rem]",
        default: "size-9 text-sm",
        lg: "size-11 text-base",
        xl: "size-14 text-lg",
        "2xl": "size-20 text-xl",
      },
      clickable: {
        true: "min-h-[44px] min-w-[44px] cursor-pointer transition-opacity hover:opacity-80 active:opacity-70",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      clickable: false,
    },
  }
)

/**
 * Get inline styles for avatar variants
 * Uses design tokens for consistent styling
 */
function getAvatarStyles(variant?: string): React.CSSProperties {
  const styles: React.CSSProperties = {
    borderRadius: radius.avatar,
  }

  // Portal-specific background colors using design tokens
  if (variant === 'student') {
    styles.background = portal.student.primary
    styles.color = '#ffffff'
  } else if (variant === 'teacher') {
    styles.background = portal.teacher.primary
    styles.color = '#ffffff'
  } else if (variant === 'parent') {
    styles.background = portal.parent.primary
    styles.color = '#ffffff'
  } else if (variant === 'counselor') {
    styles.background = portal.counselor.primary
    styles.color = '#ffffff'
  } else if (variant === 'admin') {
    styles.background = portal.admin.primary
    styles.color = '#ffffff'
  } else if (variant === 'school-admin') {
    styles.background = portal.schoolAdmin.primary
    styles.color = '#ffffff'
  } else if (variant === 'ministry') {
    styles.background = portal.ministry.primary
    styles.color = '#ffffff'
  }

  return styles
}

interface AvatarProps extends React.ComponentProps<typeof AvatarPrimitive.Root>, VariantProps<typeof avatarVariants> {
  variant?: "default" | "ceramic" | "ceramic-gray" | "ceramic-success" | "ceramic-brand" | "ceramic-outline" | "student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin" | "ministry";
}

function Avatar({
  className,
  variant = "default",
  size = "default",
  clickable = false,
  style,
  ...props
}: AvatarProps) {
  const tokenStyles = getAvatarStyles(variant)

  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-variant={variant}
      data-size={size}
      className={cn(avatarVariants({ variant, size, clickable }), className)}
      style={{ ...tokenStyles, ...style }}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  variant = "default",
  style,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback> & VariantProps<typeof avatarVariants>) {
  const tokenStyles = getAvatarStyles(variant)

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      data-variant={variant}
      className={cn(
        avatarVariants({ variant }),
        "flex size-full items-center justify-center font-medium group-data-[size=xs]/avatar:text-[0.625rem] group-data-[size=sm]/avatar:text-xs group-data-[size=default]/avatar:text-sm group-data-[size=lg]/avatar:text-base group-data-[size=xl]/avatar:text-lg group-data-[size=2xl]/avatar:text-xl",
        variant === "default" && "bg-muted text-muted-foreground",
        className
      )}
      style={{ ...tokenStyles, ...style }}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "bg-primary text-primary-foreground ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full ring-2 select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "*:data-[slot=avatar]:ring-background group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  variant = "default",
  style,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof avatarVariants>) {
  const tokenStyles = getAvatarStyles(variant)

  return (
    <div
      data-slot="avatar-group-count"
      data-variant={variant}
      className={cn(
        avatarVariants({ variant, size: "default" }),
        "ring-background relative flex shrink-0 items-center justify-center rounded-lg ring-2 font-medium",
        // Size adjustments based on avatar group size
        "size-9 group-has-data-[size=xs]/avatar-group:size-5 group-has-data-[size=sm]/avatar-group:size-7 group-has-data-[size=lg]/avatar-group:size-11 group-has-data-[size=xl]/avatar-group:size-14 group-has-data-[size=2xl]/avatar-group:size-20",
        "[&>svg]:size-4 group-has-data-[size=xs]/avatar-group:[&>svg]:size-3 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=xl]/avatar-group:[&>svg]:size-6 group-has-data-[size=2xl]/avatar-group:[&>svg]:size-8",
        variant === "default" && "bg-muted text-muted-foreground",
        className
      )}
      style={{ ...tokenStyles, ...style }}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  avatarVariants,
}
