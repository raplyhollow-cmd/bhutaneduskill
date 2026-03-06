"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useTransform, PanInfo, Variants, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  GraduationCap,
  User,
  ChevronDown,
  Settings,
  LogOut,
  Home,
  Search,
} from "lucide-react";
import { PORTAL_CONFIG, MOBILE_SETTINGS, type PortalType, type NavigationItem } from "@/config/portal-config";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/ui/notification-bell";
import { useCommandPalette } from "@/components/ui/command-palette";
import { chevronRotateVariants, sidebarExpandVariants } from "@/lib/motion/variants";

interface UniversalMobileSidebarProps {
  portalType: PortalType;
  userName?: string;
  userImage?: string;
}

// SWIPE_THRESHOLD: Distance in px to trigger menu close
const SWIPE_THRESHOLD = 50;
// SWIPE_VELOCITY_THRESHOLD: Velocity in px/ms to trigger menu close
const SWIPE_VELOCITY_THRESHOLD = 0.3;
// ESCAPE_KEY: Keyboard key to close menu
const ESCAPE_KEY = "Escape";

/**
 * Universal Mobile Sidebar Component
 *
 * This is the ONE component that handles mobile navigation for ALL 7 portals.
 * - Portal-specific styles come from PORTAL_CONFIG
 * - Mobile behavior comes from MOBILE_SETTINGS
 * - Swipe gestures for close on mobile
 * - Keyboard accessible (Escape to close)
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const config = PORTAL_CONFIG[portalType];
  const settings = MOBILE_SETTINGS;

  // Toggle expanded state for nested navigation
  const toggleExpanded = (name: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ESCAPE_KEY && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

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

  // Handle swipe to close
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isMobileMenuOpen) return;

    const { offset, velocity } = info;
    const swipeDistance = offset.x;
    const swipeVelocity = velocity.x;

    // Close on swipe left or fast swipe left
    if (swipeDistance < -SWIPE_THRESHOLD || swipeVelocity < -SWIPE_VELOCITY_THRESHOLD) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobileMenuOpen]);

  // Handle touch start for swiping the overlay
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobileMenuOpen) return;
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, [isMobileMenuOpen]);

  // Handle touch move for swiping the overlay
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobileMenuOpen || !touchStart.current) return;

    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStart.current.x;

    // If swiping left from the overlay, close the menu
    if (deltaX < -SWIPE_THRESHOLD) {
      setIsMobileMenuOpen(false);
      touchStart.current = null;
    }
  }, [isMobileMenuOpen]);

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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

  // Get top navigation items for bottom nav (first 4 items)
  const topNavItems = config.navigationItems.slice(0, 4);

  return (
    <>
      {/* Mobile menu button - Engineer Premium */}
      <motion.button
        className="lg:hidden fixed top-3 left-3 z-50 flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-150"
        style={{ paddingTop: settings.safeAreas.top }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15 }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label={isMobileMenuOpen ? "Close portal navigation menu" : "Open portal navigation menu"}
        aria-expanded={isMobileMenuOpen}
        aria-controls="universal-sidebar"
      >
        <motion.div
          animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5 text-gray-700" />
          ) : (
            <Menu className="h-5 w-5 text-gray-700" />
          )}
        </motion.div>
      </motion.button>

      {/* Overlay for mobile - with swipe to close */}
      {isMobileMenuOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setIsMobileMenuOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          aria-hidden="true"
        />
      )}

      {/* Universal Sidebar - Desktop: always visible, Mobile: slides in/out with gesture */}
      {/* Uses 100dvh to fix iOS Safari address bar bug */}
      <aside
        ref={sidebarRef}
        id="universal-sidebar"
        className={cn(
          "nav-clerk fixed top-0 left-0 z-40 overflow-hidden transition-transform duration-300 ease-in-out",
          // Desktop: always visible
          "lg:translate-x-0",
          // Mobile: visible when menu is open, hidden when closed
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          height: settings.viewport.fullHeight,
          width: settings.sidebar.width,
          paddingTop: settings.safeAreas.top,
        }}
        aria-label={`${config.name} navigation`}
      >
        <div className="h-full flex flex-col bg-ceramic-bg-menu">
          {/* Portal Header */}
          <motion.div
            className="p-6 border-b border-ceramic-border"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {/* Logo/Brand - REMOVED */}
          </motion.div>

          {/* User Info - REMOVED */}

          {/* Navigation - with smooth scrolling and improved touch targets */}
          <nav
            className="flex-1 overflow-y-auto p-4 [-webkit-overflow-scrolling:touch] touch-pan-y"
            aria-label={`${config.name} navigation menu`}
          >
            <ul role="list" className="space-y-1">
              {config.navigationItems.map((item, index) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedItems.has(item.name);
                const isActive = pathname === item.href || (item.href !== `/${portalType}/dashboard` && pathname.startsWith(item.href + "/"));

                // Check if any child is active
                const isChildActive = hasChildren && item.children!.some(
                  child => pathname === child.href || pathname.startsWith(child.href + "/")
                );

                return (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: isMobileMenuOpen ? Math.min(index * 0.03, 0.15) : 0,
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                    }}
                  >
                    {/* Parent Item */}
                    <div className="relative">
                      <motion.button
                        onClick={() => {
                          if (hasChildren) {
                            toggleExpanded(item.name);
                          } else {
                            router.push(item.href);
                            setIsMobileMenuOpen(false);
                          }
                        }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className={cn(
                          "flex items-center w-full h-9 px-2 rounded-md text-gray-900 text-sm font-medium",
                          "hover:bg-gray-100 active:bg-gray-200 focus-visible:bg-gray-100 transition-all duration-150 cursor-pointer select-none",
                          (isActive || isChildActive) && "bg-gray-200"
                        )}
                      >
                        {/* Icon */}
                        <div className="flex-none grid size-9 place-content-center">
                          {item.icon && (
                            <item.icon className="w-4 h-4" strokeWidth={2.5} style={{ color: 'currentColor' }} />
                          )}
                        </div>

                        {/* Label */}
                        <span className="flex-1 text-left">{item.name}</span>

                        {/* Badge - live-dot */}
                        {item.badge?.type === "live-dot" && (
                          <span className="flex items-center gap-1 mr-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                          </span>
                        )}

                        {/* Chevron for expandable items */}
                        {hasChildren && (
                          <motion.div
                            variants={chevronRotateVariants}
                            initial={false}
                            animate={isExpanded ? "expanded" : "collapsed"}
                          >
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </motion.div>
                        )}

                        {/* Active indicator */}
                        {(isActive || isChildActive) && (
                          <motion.div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-current"
                            layoutId={`active-indicator-${portalType}`}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                      </motion.button>
                    </div>

                    {/* Children (nested items) */}
                    {hasChildren && (
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            variants={sidebarExpandVariants}
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                            className="pl-4"
                          >
                            {item.children!.map((child, childIndex) => {
                              const isChildActiveItem = pathname === child.href || pathname.startsWith(child.href + "/");

                              return (
                                <motion.div
                                  key={child.name}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: childIndex * 0.02 }}
                                  whileTap={{ scale: 0.97 }}
                                >
                                  <Link
                                    href={child.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                      "flex items-center h-8 px-2 rounded-md text-gray-700 text-sm",
                                      "hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 cursor-pointer select-none",
                                      isChildActiveItem && "bg-gray-100 text-gray-900 font-medium"
                                    )}
                                  >
                                    {/* Child icon */}
                                    <div className="flex-none grid size-8 place-content-center mr-1">
                                      {child.icon && (
                                        <child.icon className="w-3.5 h-3.5" strokeWidth={2} />
                                      )}
                                    </div>

                                    {/* Child label */}
                                    <span className="flex-1">{child.name}</span>

                                    {/* Child badge */}
                                    {child.badge?.type === "live-dot" && (
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                      </span>
                                    )}
                                  </Link>
                                </motion.div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </motion.li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - Engineer Premium */}
      {topNavItems.length > 0 && (
        <motion.nav
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-white z-40"
          style={{
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.8) inset',
            paddingBottom: settings.safeAreas.bottom,
          }}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.15 }}
          aria-label="Mobile bottom navigation"
        >
          <ul className="flex items-center justify-around py-1">
            {topNavItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (pathname.startsWith(item.href + "/") &&
                  item.href !== `/${portalType}/dashboard`);

              return (
                <li key={item.name} className="flex-1">
                  <Link
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 px-2 rounded-lg min-h-[48px]",
                      "transition-all duration-150 cursor-pointer select-none",
                      isActive
                        ? "text-gray-900 bg-gray-50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg mb-1 transition-colors",
                        isActive ? "bg-gray-100" : ""
                      )}
                    >
                      <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    </motion.div>
                    <span className="text-[11px] font-medium leading-tight text-center">
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
            {/* More menu button */}
            <li className="flex-1">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex flex-col items-center justify-center py-2 px-2 rounded-lg min-h-[48px] text-gray-500 hover:text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 cursor-pointer select-none w-full"
                aria-label="Open full menu"
              >
                <motion.div
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center w-8 h-8 rounded-lg mb-1"
                >
                  <Menu className="w-5 h-5" />
                </motion.div>
                <span className="text-[11px] font-medium leading-tight text-center">
                  More
                </span>
              </button>
            </li>
          </ul>
        </motion.nav>
      )}
    </>
  );
}

/**
 * Universal Portal Header Component - Engineer Premium
 *
 * ENGINEER PREMIUM HEADER SPECIFICATION:
 * - Height: 56px fixed
 * - Background: #FFFFFF
 * - Border-bottom: 1px solid rgba(0, 0, 0, 0.08)
 * - Shadow: 0 0 0 1px rgba(255, 255, 255, 0.8) inset (milled border)
 * - 150ms transitions
 *
 * Desktop (>768px):
 * ┌─────────────────────────────────────────────────────────┐
 * │ [Burger]  [Logo] [Title]        [Search] [Badge] [Menu] │
 * │  hidden   40px    auto      flex-1    32px     40px    │
 * └─────────────────────────────────────────────────────────┘
 *
 * Mobile (<768px):
 * ┌────────────────────────────────────────────┐
 * │ [Burger] [Title/Logo]        [Badge] [Menu] │
 * │   40px        flex-1            32px   40px │
 * └────────────────────────────────────────────┘
 *
 * Includes profile dropdown menu with settings and sign out options
 * Command palette trigger on desktop
 * Mobile-optimized with responsive text sizing
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
  // Handle sign out via direct navigation instead of Clerk hook
  const handleSignOut = () => {
    window.location.href = '/sign-out';
  };
  const { open: openCommandPalette } = useCommandPalette();



  // Get user initials
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
    <header
      className="sticky top-0 z-[50] bg-white"
      style={{
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.8) inset',
      }}
    >
      <div className="flex items-center h-14 px-3 sm:px-4">
        {/* Left side - Logo and Title */}
        <motion.div
          className="flex items-center gap-3 flex-1 min-w-0"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Logo - Desktop only */}
          <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: config.gradient }}>
            <GraduationCap className="w-4 h-4 text-white" />
          </div>

          {/* Portal Title */}
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate tracking-tight">
              {title || config.name}
            </h1>
            {subtitle && (
              <p className="text-xs text-gray-500 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </motion.div>

        {/* Right side - Actions */}
        <motion.div
          className="flex items-center gap-2 flex-shrink-0"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15, delay: 0.05 }}
        >
          {/* Command Palette Trigger - Desktop only */}
          <button
            onClick={openCommandPalette}
            className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-[6px] text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:outline-none"
            aria-label="Open command palette"
          >
            <Search className="w-4 h-4" />
            <span className="hidden lg:inline">Search...</span>
            <kbd className="ml-auto text-[11px] text-gray-400">
              {typeof window !== "undefined" && window.navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl"}K
            </kbd>
          </button>

          {/* Notifications - Badge icon (32px) */}
          <NotificationBell className="hover:bg-gray-100 rounded-full p-1.5 transition-colors duration-150" />

          {/* User dropdown - Badge (32px) + Menu (40px) */}
          {userName && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-200 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors duration-150"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  {/* User info - Desktop only */}
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-700">{userName}</p>
                  </div>

                  {/* Avatar badge - 32px */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                    style={{ background: config.gradient }}
                  >
                    {getUserInitials()}
                  </div>

                  {/* Chevron - Desktop only */}
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" variant="ceramic">
                <DropdownMenuLabel ceramicVariant="ceramic">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-gray-500 capitalize">
                      {portalType.replace("-", " ")}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator ceramicVariant="ceramic" />
                <DropdownMenuItem asChild ceramicVariant="ceramic">
                  <a href={`/${portalType}/settings`} className="flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild ceramicVariant="ceramic">
                  <a href={`/${portalType}/settings`} className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator ceramicVariant="ceramic" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  ceramicVariant="ceramic"
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
    </header>
  );
}
