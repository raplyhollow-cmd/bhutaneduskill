"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  GraduationCap,
  User,
  ChevronDown,
  Settings,
  LogOut,
} from "lucide-react";
import { PORTAL_CONFIG, MOBILE_SETTINGS, type PortalType } from "@/config/portal-config";
import { useAuth } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UniversalMobileSidebarProps {
  portalType: PortalType;
  userName?: string;
  userImage?: string;
}

/**
 * Universal Mobile Sidebar Component
 *
 * This is the ONE component that handles mobile navigation for ALL 7 portals.
 * - Portal-specific styles come from PORTAL_CONFIG
 * - Mobile behavior comes from MOBILE_SETTINGS
 *
 * To change mobile UX for all portals, edit:
 * - src/config/portal-config.ts (MOBILE_SETTINGS section)
 */
export function UniversalMobileSidebar({
  portalType,
  userName,
  userImage,
}: UniversalMobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const config = PORTAL_CONFIG[portalType];
  const settings = MOBILE_SETTINGS;

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      const desktopBreakpoint = parseInt(settings.breakpoints.desktop);
      if (window.innerWidth >= desktopBreakpoint) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [settings.breakpoints.desktop]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userName) return "U";
    return userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Mobile menu button - Floating with safe area */}
      <motion.div
        className="lg:hidden fixed top-4 left-4 z-50"
        style={{ paddingTop: settings.safeAreas.top }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Button
          size="icon"
          variant="outline"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white/95 backdrop-blur-xl shadow-lg border-gray-200/50 hover:bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl min-h-[44px] min-w-[44px]"
          aria-label={isMobileMenuOpen ? "Close portal navigation menu" : "Open portal navigation menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="universal-sidebar"
        >
          <AnimatePresence mode="wait">
            {isMobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Overlay for mobile - with backdrop blur */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Universal Sidebar - Desktop: always visible, Mobile: slides in/out */}
      {/* Uses 100dvh to fix iOS Safari address bar bug */}
      <aside
        id="universal-sidebar"
        className={cn(
          "fixed top-0 left-0 z-40 text-white overflow-hidden transition-transform duration-300 ease-in-out",
          // Desktop: always visible (translate-x-0)
          "lg:translate-x-0",
          // Mobile: hidden by default, visible when menu is open
          "-translate-x-full",
          isMobileMenuOpen && "!translate-x-0"
        )}
        style={{
          background: config.gradient,
          height: settings.viewport.fullHeight,
          width: settings.sidebar.width,
          paddingTop: settings.safeAreas.top,
        }}
        aria-label={`${config.name} navigation`}
      >
        <div className="h-full flex flex-col">
          {/* Portal Header */}
          <motion.div
            className="p-6 border-b border-white/20"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Link
              href={`/${portalType}/dashboard`}
              className="block group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <motion.h1
                className="text-xl font-bold flex items-center gap-2 text-white"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "loop", repeatDelay: 3 }}
                >
                  <GraduationCap className="w-6 h-6" />
                </motion.div>
                Bhutan EduSkill
              </motion.h1>
              <p className="text-sm text-white/80 mt-1">{config.name}</p>
            </Link>
          </motion.div>

          {/* User Info */}
          {userName && (
            <motion.div
              className="p-4 border-b border-white/20"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <div className="flex items-center gap-3">
                {userImage ? (
                  <motion.img
                    src={userImage}
                    alt={userName}
                    className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/30"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                ) : (
                  <motion.div
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 min-h-[44px] min-w-[44px]"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="font-semibold text-white text-sm">
                      {getUserInitials()}
                    </span>
                  </motion.div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-white">{userName}</p>
                  <p className="text-xs text-white/70 capitalize">{portalType.replace("-", " ")}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation - with smooth scrolling */}
          <nav
            className="flex-1 overflow-y-auto p-4 [-webkit-overflow-scrolling:touch]"
            aria-label={`${config.name} navigation menu`}
          >
            <ul role="list" className="space-y-1">
              {config.navigationItems.map((item, index) => {
                const isActive =
                  pathname === item.href ||
                  (pathname.startsWith(item.href + "/") &&
                    item.href !== `/${portalType}/dashboard`);

                return (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: index * 0.03,
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset min-h-[44px]"
                      style={
                        isActive
                          ? {
                              background: config.activeBg,
                              color: config.activeText,
                            }
                          : undefined
                      }
                      aria-current={isActive ? "page" : undefined}
                    >
                      {!isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100"
                          style={{ background: config.hoverBg }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: isActive ? 0 : 5 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="relative z-10"
                      >
                        <item.icon
                          className="w-5 h-5"
                          style={{ color: isActive ? config.activeText : "white" }}
                        />
                      </motion.div>
                      <span
                        className="font-medium relative z-10"
                        style={{ color: isActive ? config.activeText : "white" }}
                      >
                        {item.name}
                      </span>
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                          style={{ background: config.activeText }}
                          layoutId={`active-indicator-${portalType}`}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </nav>

          {/* Footer - spacer for safe area */}
          <div
            className="p-4 border-t border-white/20"
            style={{ paddingBottom: `calc(1rem + ${settings.safeAreas.bottom})` }}
          />
        </div>
      </aside>
    </>
  );
}

/**
 * Universal Portal Header Component
 *
 * Consistent header across all portals with portal-specific branding
 * Includes profile dropdown menu with settings and sign out options
 */
export function UniversalPortalHeader({
  portalType,
  userName,
  title,
  subtitle,
}: {
  portalType: PortalType;
  userName?: string;
  title?: string;
  subtitle?: string;
}) {
  const config = PORTAL_CONFIG[portalType];
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' });
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-2xl font-bold text-gray-900">{title || "Dashboard"}</h1>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </motion.div>
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Notifications placeholder */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100 min-h-[44px] min-w-[44px]"
              >
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </Button>
            </motion.div>

            {/* User dropdown menu */}
            {userName && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    className="flex items-center gap-3 focus:outline-none"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-right hidden sm:block">
                      <p className="font-medium text-gray-900">{userName}</p>
                      <p className="text-xs text-gray-600 capitalize">
                        {portalType.replace("-", " ")}
                      </p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-md min-h-[40px] min-w-[40px]"
                      style={{ background: config.gradient }}
                    >
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {portalType.replace("-", " ")}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href={`/${portalType}/settings`} className="flex items-center gap-2 cursor-pointer">
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={`/${portalType}/settings`} className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </motion.div>
        </div>
      </div>
    </header>
  );
}
