"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ============================================================================
// PORTAL BOTTOM NAVIGATION
// ============================================================================
// Mobile-first bottom navigation for each portal
// - Shows 4-5 tabs max (thumb-friendly)
// - Active state with slide animation
// - 48px touch targets (Material Design)
// - Safe area inset for notched devices
// - Hidden on desktop (replaced by sidebar)
// ============================================================================

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
  disabled?: boolean;
}

interface PortalBottomNavProps {
  items: NavItem[];
  portal?: "student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin";
  className?: string;
}

const PortalBottomNav = React.forwardRef<HTMLDivElement, PortalBottomNavProps>(
  ({ items, portal, className }, ref) => {
    const pathname = usePathname();

    // Check if an item is active
    const isActive = (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname?.startsWith(href);
    };

    return (
      <nav
        ref={ref}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-40",
          "md:hidden", // Hidden on desktop (sidebar used instead)
          "bg-white border-t border-gray-200",
          "pb-[env(safe-area-inset-bottom)]", // Safe area for notched devices
          className
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-around h-16">
          {items.slice(0, 5).map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full relative min-w-0",
                  "transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-inset",
                  item.disabled && "pointer-events-none opacity-50"
                )}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
              >
                {/* Icon container */}
                <div className="relative">
                  <Icon
                    className={cn(
                      "w-6 h-6 transition-all duration-200",
                      active ? "text-orange-600 scale-110" : "text-gray-400"
                    )}
                    strokeWidth={2}
                  />

                  {/* Badge */}
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[11px] font-medium mt-1 transition-colors duration-200",
                    active ? "text-orange-600" : "text-gray-500"
                  )}
                >
                  {item.label}
                </span>

                {/* Active indicator */}
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-orange-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }
);
PortalBottomNav.displayName = "PortalBottomNav";

// ============================================================================
// PRE-CONFIGURED NAVIGATIONS FOR EACH PORTAL
// ============================================================================

import {
  Home,
  BookOpen,
  Users,
  Calendar,
  FileText,
  GraduationCap,
  ClipboardList,
  TrendingUp,
  Settings,
  MoreHorizontal,
  School,
  UserCheck,
  MessageSquare,
  CreditCard,
} from "lucide-react";

// Student navigation
export const StudentNavItems: NavItem[] = [
  { label: "Home", href: "/student", icon: Home },
  { label: "Homework", href: "/student/homework", icon: ClipboardList },
  { label: "Classes", href: "/student/classes", icon: BookOpen },
  { label: "Results", href: "/student/results", icon: TrendingUp },
];

// Teacher navigation
export const TeacherNavItems: NavItem[] = [
  { label: "Home", href: "/teacher", icon: Home },
  { label: "Classes", href: "/teacher/classes", icon: BookOpen },
  { label: "Homework", href: "/teacher/homework", icon: ClipboardList },
  { label: "Students", href: "/teacher/students", icon: Users },
];

// Parent navigation
export const ParentNavItems: NavItem[] = [
  { label: "Home", href: "/parent", icon: Home },
  { label: "Children", href: "/parent/children", icon: Users },
  { label: "Progress", href: "/parent/progress", icon: TrendingUp },
  { label: "Fees", href: "/parent/fees", icon: CreditCard },
];

// Counselor navigation
export const CounselorNavItems: NavItem[] = [
  { label: "Home", href: "/counselor", icon: Home },
  { label: "Students", href: "/counselor/students", icon: Users },
  { label: "Sessions", href: "/counselor/sessions", icon: Calendar },
  { label: "Notes", href: "/counselor/notes", icon: MessageSquare },
];

// School Admin navigation
export const SchoolAdminNavItems: NavItem[] = [
  { label: "Home", href: "/school-admin", icon: Home },
  { label: "Students", href: "/school-admin/students", icon: Users },
  { label: "Teachers", href: "/school-admin/teachers", icon: GraduationCap },
  { label: "Reports", href: "/school-admin/reports", icon: FileText },
];

// Platform Admin navigation
export const AdminNavItems: NavItem[] = [
  { label: "Home", href: "/admin", icon: Home },
  { label: "Schools", href: "/admin/schools", icon: School },
  { label: "Users", href: "/admin/users", icon: UserCheck },
  { label: "Analytics", href: "/admin/analytics", icon: TrendingUp },
];

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

export function StudentBottomNav(props?: Omit<PortalBottomNavProps, "items" | "portal">) {
  return <PortalBottomNav items={StudentNavItems} portal="student" {...props} />;
}

export function TeacherBottomNav(props?: Omit<PortalBottomNavProps, "items" | "portal">) {
  return <PortalBottomNav items={TeacherNavItems} portal="teacher" {...props} />;
}

export function ParentBottomNav(props?: Omit<PortalBottomNavProps, "items" | "portal">) {
  return <PortalBottomNav items={ParentNavItems} portal="parent" {...props} />;
}

export function CounselorBottomNav(props?: Omit<PortalBottomNavProps, "items" | "portal">) {
  return <PortalBottomNav items={CounselorNavItems} portal="counselor" {...props} />;
}

export function SchoolAdminBottomNav(props?: Omit<PortalBottomNavProps, "items" | "portal">) {
  return <PortalBottomNav items={SchoolAdminNavItems} portal="school-admin" {...props} />;
}

export function AdminBottomNav(props?: Omit<PortalBottomNavProps, "items" | "portal">) {
  return <PortalBottomNav items={AdminNavItems} portal="admin" {...props} />;
}

// ============================================================================
// MORE MENU (for items that don't fit in main nav)
// ============================================================================

interface MoreMenuProps {
  items: NavItem[];
  trigger?: React.ReactNode;
}

export function MoreMenu({ items, trigger }: MoreMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex flex-col items-center justify-center flex-1 h-full min-w-0",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-inset"
        )}
      >
        <MoreHorizontal className="w-6 h-6 text-gray-400" strokeWidth={2} />
        <span className="text-[11px] font-medium mt-1 text-gray-500">More</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-t-2xl border border-gray-200 shadow-lg overflow-hidden z-50">
            <div className="p-4 space-y-2">
              {items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-400" strokeWidth={2} />
                    <span className="font-medium text-gray-700">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// ADD PADDING BOTTOM TO MAIN CONTENT (to avoid overlap with nav)
// ============================================================================

export function MainContentWithBottomNav({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("pb-16 md:pb-0", className)}>
      {children}
    </div>
  );
}

export {
  PortalBottomNav,
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================
/*
import { StudentBottomNav, MainContentWithBottomNav } from "@/components/shared/portal-bottom-nav";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MainContentWithBottomNav>
        {children}
      </MainContentWithBottomNav>

      <StudentBottomNav />
    </>
  );
}

// Or with custom items:
import { PortalBottomNav } from "@/components/shared/portal-bottom-nav";
import { Home, BookOpen, Users } from "lucide-react";

const customItems = [
  { label: "Home", href: "/custom", icon: Home },
  { label: "Books", href: "/custom/books", icon: BookOpen, badge: 5 },
  { label: "Team", href: "/custom/team", icon: Users },
];

export default function CustomLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-16 md:pb-0">{children}</div>
      <PortalBottomNav items={customItems} />
    </>
  );
}
*/
