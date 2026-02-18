"use client"
import { logger } from "@/lib/logger";

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  User,
  Settings,
  CreditCard,
  Shield,
  LogOut,
  Plus,
  Building2,
  GripVertical
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export interface Account {
  id: string
  name: string
  email: string
  avatar?: string
  type: "personal" | "organization"
  role?: string
}

interface UserButtonProps {
  accounts?: Account[]
  defaultAccount?: Account
  onAccountSwitch?: (account: Account) => void
  onManageAccount?: () => void
  onSettings?: () => void
  onSignOut?: () => void
  showCreateAccount?: boolean
  onCreateAccount?: () => void
  className?: string
  variant?: "clerk" | "default"
}

/**
 * UserButton - Avatar dropdown with account switcher
 * Clerk-inspired with smooth expand/collapse animation
 *
 * @example
 * <UserButton
 *   accounts={accounts}
 *   defaultAccount={currentAccount}
 *   onAccountSwitch={(acc) => logger.debug(acc)}
 *   onSignOut={() => logger.debug('signed out')}
 * />
 */
export function UserButton({
  accounts = [],
  defaultAccount,
  onAccountSwitch,
  onManageAccount,
  onSettings,
  onSignOut,
  showCreateAccount = true,
  onCreateAccount,
  className,
  variant = "default"
}: UserButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const activeAccount = defaultAccount || accounts[0]

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-orange-500",
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-green-500",
      "bg-cyan-500"
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Clerk-style variant
  if (variant === "clerk") {
    return (
      <div ref={containerRef} className={cn("relative", className)}>
        {/* Trigger Button - Clerk style compact avatar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-9 w-9 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="User menu"
          aria-expanded={isOpen}
        >
          <Avatar className="h-8 w-8">
            {activeAccount?.avatar && (
              <AvatarImage src={activeAccount.avatar} alt={activeAccount.name} />
            )}
            <AvatarFallback className={getAvatarColor(activeAccount?.name || "User")}>
              {getInitials(activeAccount?.name || "User")}
            </AvatarFallback>
          </Avatar>
        </Button>

        {/* Dropdown Menu - Clerk style */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.12, ease: "easeOut" }}
                className={cn(
                  "absolute right-0 top-full z-50 mt-2 w-[23.5rem]",
                  "rounded-md border shadow-xl overflow-hidden",
                  "bg-white dark:bg-gray-900",
                  "border-gray-200 dark:border-gray-700"
                )}
                style={{
                  boxShadow: "0 16px 36px -6px rgba(0,0,0,0.07), 0 6px 16px -2px rgba(0,0,0,0.2)"
                }}
              >
                {/* Current Account Header */}
                <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => {
                      onManageAccount?.()
                      setIsOpen(false)
                    }}
                    className="flex items-center gap-3 w-full hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md p-2 -m-2 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      {activeAccount?.avatar && (
                        <AvatarImage src={activeAccount.avatar} alt={activeAccount.name} />
                      )}
                      <AvatarFallback className={getAvatarColor(activeAccount?.name || "User")}>
                        {getInitials(activeAccount?.name || "User")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {activeAccount?.name || "User"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {activeAccount?.email || "user@example.com"}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Actions */}
                <div className="p-1.5">
                  <button
                    onClick={() => {
                      onManageAccount?.()
                      setIsOpen(false)
                    }}
                    className={cn(
                      "flex items-center gap-2 w-full rounded-md px-3 py-2",
                      "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm",
                      "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Manage account</span>
                  </button>

                  <button
                    onClick={() => {
                      onSignOut?.()
                      setIsOpen(false)
                    }}
                    className={cn(
                      "flex items-center gap-2 w-full rounded-md px-3 py-2",
                      "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm",
                      "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>

                {/* Add Account Divider */}
                <div className="border-t border-gray-100 dark:border-gray-800 px-1.5">
                  <button
                    onClick={() => {
                      onCreateAccount?.()
                      setIsOpen(false)
                    }}
                    className={cn(
                      "flex items-center gap-2 w-full rounded-md px-3 py-2",
                      "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm",
                      "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <div className="h-5 w-5 rounded-full border border-dashed border-gray-400 flex items-center justify-center">
                      <Plus className="h-3 w-3 text-gray-500" />
                    </div>
                    <span>Add account</span>
                  </button>
                </div>

                {/* Footer - "Secured by" */}
                <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                    <span>Secured by</span>
                    <div className="flex items-center gap-1">
                      {/* Career Compass Logo */}
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor">
                        <ellipse cx="4" cy="8" rx="1.5" ry="1.5" />
                        <path d="M5.5 11.5c0 .3-.1.5-.3.6a5 5 0 0 1-2.3.6 5 5 0 0 1-2.3-.6c-.2-.1-.3-.4-.3-.6l.8-.8a.3.3 0 0 1 .3-.1c.4.2.9.3 1.4.3.5 0 .9-.1 1.4-.3a.3.3 0 0 1 .3.1l.8.8Z" opacity="0.5" />
                        <path d="M5.4 4.5c0 .3 0 .5-.3.6l-.8.8a.3.3 0 0 1-.4 0 5 5 0 0 0-3.5 3.5.3.3 0 0 1-.4 0L.4 8.6a.3.3 0 0 1-.3-.3 7 7 0 0 1 5.3-5.3V4.5Z" opacity="0.5" />
                        <path d="M11.5 1.1c0-.1.1-.1.1-.1h1.1c.1 0 .1.1.1.1v10.8c0 .1-.1.1-.1.1h-1.1c-.1 0-.1-.1-.1-.1V1.1Z" />
                        <path d="M9.5 8.6a.1.1 0 0 0-.1 0c-.3.2-.6.4-.9.5-.3.1-.6.2-.9.2-.2 0-.5 0-.7-.1a2.4 2.4 0 0 1-.6-.3c-.3-.3-.5-.8-.5-1.3 0-1.2.8-2 1.9-2 .3 0 .5 0 .8.1.2.1.5.2.7.4 0 0 .1 0 .1 0l.7-.7a.1.1 0 0 0 0-.1c-.5-.5-1.3-.8-2.2-.8-1.9 0-3.3 1.3-3.3 3.1 0 .9.3 1.7.9 2.2.5.5 1.2.8 1.9.8 1.1 0 2-.4 2.5-.9 0 0 0-.1 0-.1l-.8-.7Z" />
                      </svg>
                      <span className="font-medium">Career Compass</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button - Increased min-height for 44px touch target */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 min-h-[44px]",
          "hover:bg-gray-50 transition-colors shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        )}
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <Avatar className="h-8 w-8">
          {activeAccount?.avatar && (
            <AvatarImage src={activeAccount.avatar} alt={activeAccount.name} />
          )}
          <AvatarFallback className={getAvatarColor(activeAccount?.name || "User")}>
            {getInitials(activeAccount?.name || "User")}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">
            {activeAccount?.name || "User"}
          </span>
          {activeAccount?.email && (
            <span className="text-xs text-gray-500 truncate max-w-[150px]">
              {activeAccount.email}
            </span>
          )}
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute right-0 top-full z-50 mt-2 w-80",
              "rounded-xl border border-gray-200 bg-white shadow-lg",
              "overflow-hidden"
            )}
          >
            {/* Current Account Header - Increased padding for better spacing */}
            <div className="border-b border-gray-100 p-4 bg-gray-50/50">
              <button
                onClick={() => {
                  onManageAccount?.()
                  setIsOpen(false)
                }}
                className="flex items-center gap-3 w-full hover:bg-gray-100 rounded-lg p-2.5 -m-2.5 transition-colors min-h-[48px]"
              >
                <Avatar className="h-12 w-12">
                  {activeAccount?.avatar && (
                    <AvatarImage src={activeAccount.avatar} alt={activeAccount.name} />
                  )}
                  <AvatarFallback className={getAvatarColor(activeAccount?.name || "User")}>
                    {getInitials(activeAccount?.name || "User")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">
                    {activeAccount?.name || "User"}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {activeAccount?.email || "user@example.com"}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Account Switcher - Increased padding for better spacing */}
            {accounts.length > 1 && (
              <div className="p-2 border-b border-gray-100">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2.5">
                  Switch Account
                </div>
                {accounts
                  .filter((acc) => acc.id !== activeAccount?.id)
                  .map((account) => (
                    <button
                      key={account.id}
                      onClick={() => {
                        onAccountSwitch?.(account)
                        setIsOpen(false)
                      }}
                      className={cn(
                        "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 min-h-[44px]",
                        "hover:bg-gray-50 transition-colors"
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        {account.avatar && (
                          <AvatarImage src={account.avatar} alt={account.name} />
                        )}
                        <AvatarFallback className={getAvatarColor(account.name)}>
                          {getInitials(account.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {account.name}
                        </div>
                        {account.type === "organization" && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {account.role || "Member"}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            )}

            {/* Actions - Increased padding and min-height for touch targets */}
            <div className="p-2">
              <button
                onClick={() => {
                  onSettings?.()
                  setIsOpen(false)
                }}
                className={cn(
                  "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 min-h-[44px]",
                  "hover:bg-gray-50 transition-colors text-sm"
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 shrink-0">
                  <Settings className="h-4 w-4 text-gray-600" />
                </div>
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  onSignOut?.()
                  setIsOpen(false)
                }}
                className={cn(
                  "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 min-h-[44px]",
                  "hover:bg-red-50 transition-colors text-sm text-red-600"
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 shrink-0">
                  <LogOut className="h-4 w-4" />
                </div>
                <span>Sign out</span>
              </button>
            </div>

            {/* Create Account - Increased padding and min-height for touch targets */}
            {showCreateAccount && (
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => {
                    onCreateAccount?.()
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 min-h-[44px]",
                    "hover:bg-gray-50 transition-colors text-sm"
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 shrink-0">
                    <Plus className="h-4 w-4 text-purple-600" />
                  </div>
                  <span>Create organization</span>
                </button>
              </div>
            )}

            {/* Footer - Increased padding */}
            <div className="border-t border-gray-100 px-4 py-2.5 text-center">
              <p className="text-xs text-gray-400">
                Secured by Career Compass
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * UserButtonCompact - Compact version for mobile or tight spaces
 */
export function UserButtonCompact({
  defaultAccount,
  onSignOut,
  className
}: Pick<UserButtonProps, "defaultAccount" | "onSignOut" | "className">) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-orange-500",
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-green-500",
      "bg-cyan-500"
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Avatar className="h-8 w-8">
          {defaultAccount?.avatar && (
            <AvatarImage src={defaultAccount.avatar} alt={defaultAccount.name} />
          )}
          <AvatarFallback className={getAvatarColor(defaultAccount?.name || "User")}>
            {getInitials(defaultAccount?.name || "User")}
          </AvatarFallback>
        </Avatar>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg p-1.5"
          >
            <button
              onClick={() => {
                onSignOut?.()
                setIsOpen(false)
              }}
              className="flex items-center gap-2 w-full rounded-md px-3 py-2 min-h-[40px] text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
