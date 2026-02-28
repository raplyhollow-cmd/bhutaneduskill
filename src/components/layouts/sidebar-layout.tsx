"use client";

import * as React from "react";
import { forwardRef, HTMLAttributes, ReactNode, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

/**
 * SidebarLayout - A responsive layout with collapsible sidebar
 *
 * Features:
 * - Collapsible sidebar (240px -> 64px)
 * - Smooth transition (300ms cubic-bezier)
 * - Mobile: drawer overlay with backdrop
 * - Compact mode with icon-only sidebar
 * - Backdrop blur on sidebar
 * - Keyboard accessible (Cmd/Ctrl + B to toggle)
 * - Persistent collapsed state (localStorage)
 *
 * @example
 * ```tsx
 * <SidebarLayout
 *   sidebar={
 *     <SidebarNavItem icon={<HomeIcon />}>Dashboard</SidebarNavItem>
 *     <SidebarNavItem icon={<UsersIcon />}>Users</SidebarNavItem>
 *   }
 *   header={<Header title="Dashboard" />}
 * >
 *   <PageContent />
 * </SidebarLayout>
 * ```
 */

export interface SidebarLayoutProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Sidebar content - typically navigation items
   */
  sidebar: ReactNode;
  /**
   * Header content - appears above main content
   */
  header?: ReactNode;
  /**
   * Main content area
   */
  children: ReactNode;
  /**
   * Initial sidebar state
   * @default "expanded"
   */
  defaultSidebarState?: "expanded" | "collapsed";
  /**
   * Sidebar width when expanded
   * @default 240
   */
  sidebarWidth?: number;
  /**
   * Sidebar width when collapsed
   * @default 64
   */
  collapsedWidth?: number;
  /**
   * Show toggle button
   * @default true
   */
  showToggle?: boolean;
  /**
   * Position of sidebar
   * @default "left"
   */
  position?: "left" | "right";
  /**
   * Custom sidebar background
   */
  sidebarClassName?: string;
  /**
   * Custom main content background
   */
  mainClassName?: string;
}

export const SidebarLayout = forwardRef<HTMLDivElement, SidebarLayoutProps>(
  ({
    sidebar,
    header,
    children,
    defaultSidebarState = "expanded",
    sidebarWidth = 240,
    collapsedWidth = 64,
    showToggle = true,
    position = "left",
    sidebarClassName,
    mainClassName,
    className,
    ...props
  }, ref) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultSidebarState === "collapsed");
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Detect mobile breakpoint
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 1024);
        if (window.innerWidth < 1024) {
          setIsMobileOpen(false);
        }
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Load saved state from localStorage
    useEffect(() => {
      const saved = localStorage.getItem("sidebar-collapsed");
      if (saved !== null && !isMobile) {
        setIsCollapsed(saved === "true");
      }
    }, [isMobile]);

    // Save state to localStorage
    useEffect(() => {
      if (!isMobile) {
        localStorage.setItem("sidebar-collapsed", String(isCollapsed));
      }
    }, [isCollapsed, isMobile]);

    // Keyboard shortcut to toggle sidebar
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "b") {
          e.preventDefault();
          if (isMobile) {
            setIsMobileOpen(!isMobileOpen);
          } else {
            setIsCollapsed(!isCollapsed);
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isCollapsed, isMobile, isMobileOpen]);

    // Close mobile sidebar when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          isMobileOpen &&
          sidebarRef.current &&
          !sidebarRef.current.contains(e.target as Node)
        ) {
          setIsMobileOpen(false);
        }
      };

      if (isMobileOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isMobileOpen]);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
      if (isMobileOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [isMobileOpen]);

    const toggleSidebar = () => {
      if (isMobile) {
        setIsMobileOpen(!isMobileOpen);
      } else {
        setIsCollapsed(!isCollapsed);
      }
    };

    const currentSidebarWidth = isCollapsed ? collapsedWidth : sidebarWidth;
    const isLeft = position === "left";

    return (
      <div
        ref={ref}
        className={cn(
          "flex min-h-screen bg-background",
          className
        )}
        {...props}
      >
        {/* Mobile Overlay */}
        {isMobile && isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={cn(
            // Fixed position on mobile, relative on desktop
            "fixed z-50 h-screen shrink-0 overflow-y-auto border-r bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 lg:sticky lg:top-0 lg:h-auto lg:bg-transparent lg:backdrop-blur-none",
            // Mobile styles
            "translate-x-0 transition-transform duration-300 lg:translate-x-0",
            isLeft ? "left-0" : "right-0",
            isMobile && !isMobileOpen && (isLeft ? "-translate-x-full" : "translate-x-full"),
            // Desktop transition
            "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            // Custom classes
            sidebarClassName
          )}
          style={{
            width: isMobile ? sidebarWidth : currentSidebarWidth,
          }}
        >
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between border-b p-4 lg:hidden">
            <span className="font-semibold">Menu</span>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="rounded-md p-2 hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="h-full">{sidebar}</div>
        </aside>

        {/* Main Content Area */}
        <div
          className="flex min-w-0 flex-1 flex-col"
          style={{
            marginLeft: isLeft && !isMobile ? `${currentSidebarWidth}px` : undefined,
            marginRight: !isLeft && !isMobile ? `${currentSidebarWidth}px` : undefined,
            transition: isMobile ? undefined : "margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1), margin-right 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Header */}
          {header && (
            <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
                {showToggle && (
                  <button
                    onClick={toggleSidebar}
                    className="rounded-md p-2 hover:bg-muted lg:hidden"
                    aria-label="Toggle menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                )}
                {showToggle && !isMobile && (
                  <button
                    onClick={toggleSidebar}
                    className="rounded-md p-2 hover:bg-muted"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    aria-pressed={isCollapsed}
                  >
                    <Menu className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
                  </button>
                )}
                {header}
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className={cn("flex-1", mainClassName)}>
            {children}
          </main>
        </div>
      </div>
    );
  }
);

SidebarLayout.displayName = "SidebarLayout";

/**
 * SidebarNavItem - Navigation item for sidebar
 *
 * @example
 * ```tsx
 * <SidebarNavItem
 *   icon={<HomeIcon />}
 *   href="/dashboard"
 *   isActive
 * >
 *   Dashboard
 * </SidebarNavItem>
 * ```
 */
export interface SidebarNavItemProps extends HTMLAttributes<HTMLAnchorElement> {
  icon?: ReactNode;
  isActive?: boolean;
  href?: string;
  collapsed?: boolean;
  badge?: string | number;
}

export const SidebarNavItem = forwardRef<HTMLAnchorElement | HTMLButtonElement, SidebarNavItemProps>(
  ({ children, icon, isActive = false, href, collapsed = false, badge, className, ...props }, ref) => {
    const Component = href ? "a" : "button";

    return (
      <Component
        ref={ref as any}
        href={href || undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive && "bg-accent text-accent-foreground",
          !isActive && "text-muted-foreground",
          collapsed && "justify-center px-0",
          className
        )}
        {...(props as any)}
      >
        {icon && (
          <span className={cn("shrink-0", collapsed ? "" : "h-5 w-5")}>
            {icon}
          </span>
        )}
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{children}</span>
            {badge && (
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                {badge}
              </span>
            )}
          </>
        )}
      </Component>
    );
  }
);

SidebarNavItem.displayName = "SidebarNavItem";

/**
 * SidebarSection - Groups navigation items with a label
 *
 * @example
 * ```tsx
 * <SidebarSection label="Main">
 *   <SidebarNavItem icon={<HomeIcon />}>Dashboard</SidebarNavItem>
 *   <SidebarNavItem icon={<SettingsIcon />}>Settings</SidebarNavItem>
 * </SidebarSection>
 * ```
 */
export interface SidebarSectionProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  collapsed?: boolean;
}

export const SidebarSection = forwardRef<HTMLDivElement, SidebarSectionProps>(
  ({ children, label, collapsed = false, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-1", className)} {...props}>
        {!collapsed && label && (
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
        )}
        {children}
      </div>
    );
  }
);

SidebarSection.displayName = "SidebarSection";

/**
 * SidebarFooter - Fixed footer content in sidebar
 *
 * @example
 * ```tsx
 * <SidebarFooter>
 *   <UserMenu />
 * </SidebarFooter>
 * ```
 */
export interface SidebarFooterProps extends HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
}

export const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ children, collapsed = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mt-auto border-t pt-4",
          collapsed && "flex justify-center",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SidebarFooter.displayName = "SidebarFooter";
