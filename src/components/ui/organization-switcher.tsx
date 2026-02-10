"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  Building2,
  User,
  Plus,
  Check,
  Crown,
  Shield,
  Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

/**
 * Organization Switcher Component
 *
 * Design Standards:
 * - Border radius: rounded-lg (8px) for all items and containers
 * - Padding: px-3 py-2.5 (12px 10px) for menu items
 * - Touch targets: min-h-[44px] for mobile-friendly interaction
 * - Container padding: p-2 (8px) for menu list sections
 */

export interface Organization {
  id: string
  name: string
  slug?: string
  logo?: string
  role?: "admin" | "member" | "owner"
  personal?: boolean
}

interface OrganizationSwitcherProps {
  organizations?: Organization[]
  defaultOrganization?: Organization
  onOrganizationSwitch?: (organization: Organization) => void
  onCreateOrganization?: () => void
  onManageOrganization?: () => void
  showPersonalAccount?: boolean
  personalAccount?: {
    name: string
    email: string
    avatar?: string
  }
  className?: string
}

/**
 * OrganizationSwitcher - Multi-account/organization management
 * Clerk-inspired with visual hierarchy and avatars
 *
 * @example
 * <OrganizationSwitcher
 *   organizations={orgs}
 *   defaultOrganization={currentOrg}
 *   onOrganizationSwitch={(org) => console.log(org)}
 *   showPersonalAccount
 *   personalAccount={{ name: "John Doe", email: "john@example.com" }}
 * />
 */
export function OrganizationSwitcher({
  organizations = [],
  defaultOrganization,
  onOrganizationSwitch,
  onCreateOrganization,
  onManageOrganization,
  showPersonalAccount = true,
  personalAccount,
  className
}: OrganizationSwitcherProps) {
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

  const activeOrg = defaultOrganization || organizations[0]

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
      "bg-purple-500",
      "bg-blue-500",
      "bg-cyan-500",
      "bg-green-500",
      "bg-orange-500",
      "bg-pink-500"
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "owner":
      case "admin":
        return <Shield className="h-3 w-3 text-purple-600" />
      default:
        return <Users className="h-3 w-3 text-gray-400" />
    }
  }

  const getRoleText = (role?: string) => {
    switch (role) {
      case "owner":
        return "Owner"
      case "admin":
        return "Admin"
      case "member":
        return "Member"
      default:
        return ""
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 min-h-[44px]",
          "hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-purple-500/20"
        )}
        aria-label="Switch organization"
        aria-expanded={isOpen}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-semibold text-sm">
          {activeOrg?.logo ? (
            <img src={activeOrg.logo} alt={activeOrg.name} className="h-6 w-6 rounded" />
          ) : (
            getInitials(activeOrg?.name || "Org")
          )}
        </div>

        <div className="flex flex-col items-start flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {activeOrg?.name || "Select Organization"}
            </span>
            {activeOrg?.role === "owner" && <Crown className="h-3 w-3 text-yellow-500" />}
          </div>
          {activeOrg?.role && (
            <span className="text-xs text-gray-500">
              {getRoleText(activeOrg.role)}
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
              "absolute left-0 right-0 top-full z-50 mt-2",
              "rounded-lg border border-gray-200 bg-white shadow-xl",
              "overflow-hidden"
            )}
          >
            {/* Current Organization Header */}
            <div className="border-b border-gray-100 p-4 bg-gradient-to-r from-purple-50 to-blue-50">
              <button
                onClick={() => {
                  onManageOrganization?.()
                  setIsOpen(false)
                }}
                className="flex items-center gap-3 w-full hover:bg-white/50 rounded-lg p-2 -m-2 transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                  {activeOrg?.logo ? (
                    <img src={activeOrg.logo} alt={activeOrg.name} className="h-8 w-8 rounded" />
                  ) : (
                    <span className="font-semibold text-purple-600">
                      {getInitials(activeOrg?.name || "Org")}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    {activeOrg?.name}
                    {activeOrg?.role === "owner" && <Crown className="h-4 w-4 text-yellow-500" />}
                  </div>
                  <div className="text-sm text-gray-500">
                    {activeOrg?.slug || activeOrg?.name?.toLowerCase().replace(/\s+/g, "-")}
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Organizations List */}
            <div className="p-2 max-h-64 overflow-y-auto">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">
                Your Organizations
              </div>

              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    onOrganizationSwitch?.(org)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 min-h-[44px]",
                    "hover:bg-gray-50 transition-colors relative",
                    org.id === activeOrg?.id && "bg-purple-50 hover:bg-purple-100"
                  )}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                    {org.logo ? (
                      <img src={org.logo} alt={org.name} className="h-6 w-6 rounded" />
                    ) : (
                      <span className="text-xs font-semibold text-gray-600">
                        {getInitials(org.name)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {org.name}
                      {org.id === activeOrg?.id && (
                        <Check className="h-3.5 w-3.5 text-purple-600" />
                      )}
                    </div>
                    {org.role && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        {getRoleIcon(org.role)}
                        {getRoleText(org.role)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Personal Account */}
            {showPersonalAccount && personalAccount && (
              <div className="border-t border-gray-100 p-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">
                  Personal Account
                </div>
                <button
                  onClick={() => {
                    // Switch to personal account
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 min-h-[44px]",
                    "hover:bg-gray-50 transition-colors"
                  )}
                >
                  <Avatar className="h-9 w-9">
                    {personalAccount.avatar && (
                      <AvatarImage src={personalAccount.avatar} alt={personalAccount.name} />
                    )}
                    <AvatarFallback className={getAvatarColor(personalAccount.name)}>
                      {getInitials(personalAccount.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {personalAccount.name}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {personalAccount.email}
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Create Organization */}
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => {
                  onCreateOrganization?.()
                  setIsOpen(false)
                }}
                className={cn(
                  "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 min-h-[44px]",
                  "hover:bg-purple-50 transition-colors text-sm font-medium text-purple-600"
                )}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                  <Plus className="h-5 w-5" />
                </div>
                <span>Create organization</span>
              </button>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-3 py-2 text-center bg-gray-50">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
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
 * OrganizationSwitcherInline - Inline horizontal version for headers
 */
export function OrganizationSwitcherInline({
  organizations = [],
  defaultOrganization,
  onOrganizationSwitch,
  className
}: Omit<OrganizationSwitcherProps, "onCreateOrganization" | "showPersonalAccount" | "personalAccount">) {
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

  const activeOrg = defaultOrganization || organizations[0]

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm hover:bg-gray-100 rounded-lg px-3 py-2 min-h-[36px] transition-colors"
      >
        <Building2 className="h-4 w-4 text-gray-500" />
        <span className="font-medium">{activeOrg?.name || "Select"}</span>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg p-1.5"
          >
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  onOrganizationSwitch?.(org)
                  setIsOpen(false)
                }}
                className={cn(
                  "flex items-center gap-2 w-full rounded-lg px-3 py-2 min-h-[36px] text-sm text-left",
                  "hover:bg-gray-100 transition-colors",
                  org.id === activeOrg?.id && "bg-purple-50 text-purple-600"
                )}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{org.name}</span>
                {org.id === activeOrg?.id && <Check className="h-4 w-4 ml-auto" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
