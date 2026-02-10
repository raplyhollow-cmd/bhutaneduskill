"use client"

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
  Building2
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
}

/**
 * UserButton - Avatar dropdown with account switcher
 * Clerk-inspired with smooth expand/collapse animation
 *
 * @example
 * <UserButton
 *   accounts={accounts}
 *   defaultAccount={currentAccount}
 *   onAccountSwitch={(acc) => console.log(acc)}
 *   onSignOut={() => console.log('signed out')}
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
  className
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

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2",
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
            {/* Current Account Header */}
            <div className="border-b border-gray-100 p-4 bg-gray-50/50">
              <button
                onClick={() => {
                  onManageAccount?.()
                  setIsOpen(false)
                }}
                className="flex items-center gap-3 w-full hover:bg-gray-100 rounded-lg p-2 -m-2 transition-colors"
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

            {/* Account Switcher */}
            {accounts.length > 1 && (
              <div className="p-2 border-b border-gray-100">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">
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
                        "flex items-center gap-3 w-full rounded-lg px-3 py-2.5",
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

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={() => {
                  onSettings?.()
                  setIsOpen(false)
                }}
                className={cn(
                  "flex items-center gap-3 w-full rounded-lg px-3 py-2.5",
                  "hover:bg-gray-50 transition-colors text-sm"
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
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
                  "flex items-center gap-3 w-full rounded-lg px-3 py-2.5",
                  "hover:bg-red-50 transition-colors text-sm text-red-600"
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                  <LogOut className="h-4 w-4" />
                </div>
                <span>Sign out</span>
              </button>
            </div>

            {/* Create Account */}
            {showCreateAccount && (
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={() => {
                    onCreateAccount?.()
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-lg px-3 py-2.5",
                    "hover:bg-gray-50 transition-colors text-sm"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                    <Plus className="h-4 w-4 text-purple-600" />
                  </div>
                  <span>Create organization</span>
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-100 px-3 py-2 text-center">
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
            className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg p-1"
          >
            <button
              onClick={() => {
                onSignOut?.()
                setIsOpen(false)
              }}
              className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
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
