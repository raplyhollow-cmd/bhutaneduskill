"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, useMotionValue, useTransform, PanInfo, Variants } from "framer-motion";
import {
  Menu,
  X,
  GraduationCap,
  User,
  ChevronDown,
  Settings,
  LogOut,
  Home,
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
import { NotificationBell } from "@/components/ui/notification-bell";

interface UniversalMobileSidebarProps {
  portalType: PortalType;
  userName?: string;
  userImage?: string;
}

// SWIPE_THRESHOLD: Distance in px to trigger menu close on swipe
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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const config = PORTAL_CONFIG[portalType];
  const settings = MOBILE_SETTINGS;

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
          className="bg-white/95 backdrop-blur-xl shadow-lg border-ceramic-border hover:bg-ceramic-gray-50 text-ceramic-primary focus:outline-none focus:ring-2 focus:ring-ceramic-brand focus:ring-offset-2 rounded-xl min-h-[44px] min-w-[44px]"
          aria-label={isMobileMenuOpen ? "Close portal navigation menu" : "Open portal navigation menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="universal-sidebar"
        >
          <motion.div
            animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="relative"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </motion.div>
        </Button>
      </motion.div>

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
      <motion.aside
        ref={sidebarRef}
        id="universal-sidebar"
        drag={isMobileMenuOpen ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        initial={false}
        animate={isMobileMenuOpen ? "open" : "closed"}
        variants={{
          open: { x: 0 },
          closed: { x: "-100%" },
        } as Variants}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className={cn(
          "nav-clerk fixed top-0 left-0 z-40 overflow-hidden lg:translate-x-0",
          // Hide sidebar on mobile when closed (using translate)
          !isMobileMenuOpen && "-translate-x-full lg:translate-x-0"
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
            <Link
              href={`/${portalType}/dashboard`}
              className="block group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <motion.h1
                className="text-xl font-bold flex items-center gap-2 text-ceramic-primary"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "loop", repeatDelay: 3 }}
                >
                  <GraduationCap className="w-6 h-6" style={{ color: config.activeText }} />
                </motion.div>
                Bhutan EduSkill
              </motion.h1>
              <p className="text-sm text-ceramic-secondary mt-1">{config.name}</p>
            </Link>
          </motion.div>

          {/* User Info */}
          {userName && (
            <motion.div
              className="p-4 border-b border-ceramic-border"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <div className="flex items-center gap-3">
                {userImage ? (
                  <motion.img
                    src={userImage}
                    alt={userName}
                    className="w-10 h-10 rounded-full bg-ceramic-gray-200 border-2 border-ceramic-border"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                ) : (
                  <motion.div
                    className="w-10 h-10 rounded-full bg-ceramic-brand/10 flex items-center justify-center border-2 border-ceramic-border min-h-[44px] min-w-[44px]"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="font-semibold text-ceramic-brand text-sm">
                      {getUserInitials()}
                    </span>
                  </motion.div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-ceramic-primary">{userName}</p>
                  <p className="text-xs text-ceramic-dimmed capitalize">{portalType.replace("-", " ")}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation - with smooth scrolling and improved touch targets */}
          <nav
            className="flex-1 overflow-y-auto p-4 [-webkit-overflow-scrolling:touch] touch-pan-y"
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: isMobileMenuOpen ? Math.min(index * 0.03, 0.15) : 0,
                      type: "spring",
                      stiffness: 300,
                      damping: 24,
                    }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "nav-item-clerk flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-ceramic-brand min-h-[48px]",
                        isActive
                          ? "bg-ceramic-purple-50 text-ceramic-brand nav-item-clerk-active shadow-sm"
                          : "text-ceramic-secondary hover:bg-ceramic-gray-50 hover:text-ceramic-primary active:scale-[0.98]"
                      )}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="nav-icon-clerk flex-shrink-0 w-6 h-6 flex items-center justify-center relative z-10"
                      >
                        <item.icon className="w-5 h-5" strokeWidth={2.5} />
                      </motion.div>
                      <span className="font-medium text-sm relative z-10">
                        {item.name}
                      </span>
                      {isActive && (
                        <motion.div
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-9 rounded-r-full bg-ceramic-brand"
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

          {/* Footer - spacer for safe area + quick actions */}
          <div
            className="p-4 border-t border-ceramic-border space-y-2"
            style={{ paddingBottom: `calc(1rem + ${settings.safeAreas.bottom})` }}
          >
            {/* Quick action buttons */}
            <Link
              href={`/${portalType}/dashboard`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-ceramic-secondary hover:bg-ceramic-gray-50 transition-colors min-h-[48px]"
            >
              <Home className="w-5 h-5" strokeWidth={2.5} />
              <span className="font-medium text-sm">Home</span>
            </Link>
            <Link
              href={`/${portalType}/settings`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-ceramic-secondary hover:bg-ceramic-gray-50 transition-colors min-h-[48px]"
            >
              <Settings className="w-5 h-5" strokeWidth={2.5} />
              <span className="font-medium text-sm">Settings</span>
            </Link>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Bottom Navigation - Only visible on small screens */}
      {topNavItems.length > 0 && (
        <motion.nav
          className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-ceramic-border z-40"
          style={{
            paddingBottom: settings.safeAreas.bottom,
          }}
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          aria-label="Mobile bottom navigation"
        >
          <ul className="flex items-center justify-around py-2 px-safe">
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
                      "flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 min-h-[56px]",
                      isActive
                        ? "text-ceramic-brand"
                        : "text-ceramic-secondary hover:text-ceramic-primary"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full mb-1 transition-colors",
                        isActive ? "bg-ceramic-brand/10" : ""
                      )}
                    >
                      <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    </motion.div>
                    <span className="text-[11px] font-medium leading-tight text-center px-1">
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
                className="flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all duration-200 min-h-[56px] text-ceramic-secondary hover:text-ceramic-primary w-full"
                aria-label="Open full menu"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center w-10 h-10 rounded-full mb-1"
                >
                  <Menu className="w-5 h-5" />
                </motion.div>
                <span className="text-[11px] font-medium leading-tight text-center px-1">
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
 * Universal Portal Header Component
 *
 * Consistent header across all portals with portal-specific branding
 * Includes profile dropdown menu with settings and sign out options
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
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' });
  };

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
    <header className="topnav-clerk bg-white border-b border-gray-200 sticky top-0 z-[50]">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <motion.div
            className="flex-1 min-w-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {title || "Dashboard"}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-ceramic-secondary mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </motion.div>
          <motion.div
            className="flex items-center gap-2 sm:gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            {/* Notifications - Integrated NotificationBell component */}
            <NotificationBell className="hover:bg-ceramic-gray-100 rounded-full" />

            {/* User dropdown menu - mobile optimized */}
            {userName && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-ceramic-brand rounded-full pr-1 sm:pr-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="text-right hidden sm:block">
                      <p className="font-medium text-sm text-ceramic-primary">{userName}</p>
                      <p className="text-xs text-ceramic-secondary capitalize">
                        {portalType.replace("-", " ")}
                      </p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-sm"
                      style={{ background: config.gradient }}
                    >
                      <span className="text-sm font-semibold">
                        {getUserInitials()}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-ceramic-dimmed hidden sm:block" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" variant="ceramic">
                  <DropdownMenuLabel ceramicVariant="ceramic">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-ceramic-dimmed capitalize">
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
                    className="text-ceramic-negative focus:text-ceramic-negative cursor-pointer"
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
