"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: "default" | "pills" | "underline"
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "default", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center",
      variant === "default" && "rounded-lg bg-gray-100 p-1 gap-1",
      variant === "pills" && "rounded-full bg-gray-100 p-1 gap-1",
      variant === "underline" && "border-b border-gray-200 gap-6",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: "default" | "pills" | "underline"
  showIndicator?: boolean
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant = "default", showIndicator = true, children, ...props }, ref) => {
  const [isActive, setIsActive] = React.useState(false)

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/20",
        "disabled:pointer-events-none disabled:opacity-50",
        // Variant styles
        variant === "default" && [
          "rounded-md px-3 py-1.5 text-sm font-medium",
          "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
          "data-[state=inactive]:text-gray-600 hover:text-gray-900"
        ],
        variant === "pills" && [
          "rounded-full px-4 py-2 text-sm font-medium",
          "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
          "data-[state=inactive]:text-gray-600 hover:text-gray-900"
        ],
        variant === "underline" && [
          "relative border-b-2 py-4 text-sm font-medium transition-colors",
          "data-[state=active]:border-purple-600 data-[state=active]:text-purple-600",
          "data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500",
          "hover:data-[state=inactive]:text-gray-700 hover:data-[state=inactive]:border-gray-300"
        ],
        className
      )}
      {...props}
      onSelect={() => setIsActive(true)}
      onDeselect={() => setIsActive(false)}
    >
      {children}
      {variant === "underline" && showIndicator && (
        <motion.span
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isActive ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          layoutId="activeTab"
        />
      )}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4",
      // Add fade-in animation
      "data-[state=active]:animate-in data-[state=active]:fade-in-0",
      "data-[state=inactive]:animate-out data-[state=inactive]:fade-out-0",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

/**
 * TabsNavigation - Clerk-style border bottom tabs
 * For page-level navigation with proper ARIA roles
 *
 * @example
 * <TabsNavigation defaultValue="tab1">
 *   <TabsList>
 *     <TabsNavigationTrigger value="tab1">Overview</TabsNavigationTrigger>
 *     <TabsNavigationTrigger value="tab2">Settings</TabsNavigationTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">...</TabsContent>
 *   <TabsContent value="tab2">...</TabsContent>
 * </TabsNavigation>
 */
export function TabsNavigation({
  children,
  defaultValue,
  className
}: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs defaultValue={defaultValue} className={className}>
      {children}
    </Tabs>
  )
}

export function TabsNavigationTrigger({
  children,
  value,
  disabled
}: React.ComponentProps<typeof TabsPrimitive.Trigger> & { value: string }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      disabled={disabled}
      className={cn(
        "relative border-b-2 py-4 px-1 text-sm font-medium transition-colors",
        "data-[state=active]:border-purple-600 data-[state=active]:text-purple-600",
        "data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500",
        "hover:data-[state=inactive]:text-gray-700 hover:data-[state=inactive]:border-gray-300",
        "focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "-mb-px"
      )}
    >
      {children}
      {/* Active indicator */}
      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 data-[state=active]:block data-[state=inactive]:hidden" />
    </TabsPrimitive.Trigger>
  )
}

/**
 * TabsWithUnderline - Modern tabs with animated underline
 */
interface TabItem {
  value: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
  badge?: string | number
}

interface TabsWithUnderlineProps {
  tabs: TabItem[]
  defaultValue?: string
  onChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

export function TabsWithUnderline({
  tabs,
  defaultValue,
  onChange,
  children,
  className
}: TabsWithUnderlineProps) {
  const [activeTab, setActiveTab] = React.useState(defaultValue || tabs[0]?.value)

  const handleValueChange = (value: string) => {
    setActiveTab(value)
    onChange?.(value)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleValueChange} className={className}>
      <TabsList variant="underline" className="w-full justify-start">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              "relative flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors",
              "data-[state=active]:border-purple-600 data-[state=active]:text-purple-600",
              "data-[state=inactive]:border-transparent data-[state=inactive]:text-gray-500",
              "hover:data-[state=inactive]:text-gray-700 hover:data-[state=inactive]:border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "-mb-px"
            )}
          >
            {tab.icon && <span className="h-4 w-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="ml-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-600">
                {tab.badge}
              </span>
            )}
            {/* Animated indicator */}
            {activeTab === tab.value && (
              <motion.span
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
                layoutId="activeIndicator"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  )
}

/**
 * VerticalTabs - Side navigation tabs
 */
export function VerticalTabs({
  children,
  defaultValue,
  className
}: React.ComponentProps<typeof Tabs>) {
  return (
    <Tabs defaultValue={defaultValue} orientation="vertical" className={className}>
      {children}
    </Tabs>
  )
}

interface VerticalTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  className?: string
}

export function VerticalTabsList({ className, ...props }: VerticalTabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        "flex flex-col gap-1 w-48 border-r border-gray-200 pr-4",
        className
      )}
      {...props}
    />
  )
}

interface VerticalTabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  icon?: React.ReactNode
  shortcut?: string
}

export function VerticalTabsTrigger({
  children,
  className,
  icon,
  shortcut,
  ...props
}: VerticalTabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg",
        "transition-colors",
        "data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600",
        "data-[state=inactive]:text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        "focus:outline-none focus:ring-2 focus:ring-purple-500/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {icon && <span className="h-4 w-4 shrink-0">{icon}</span>}
      <span className="flex-1 text-left">{children}</span>
      {shortcut && (
        <span className="text-xs text-gray-400">{shortcut}</span>
      )}
      {/* Active indicator */}
      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-purple-600 data-[state=active]:block data-[state=inactive]:hidden" />
    </TabsPrimitive.Trigger>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
