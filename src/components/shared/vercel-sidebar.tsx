"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

// ============================================================================
// VERCEL-STYLE SIDEBAR
// ============================================================================
// Clean, professional SaaS sidebar inspired by Vercel's design:
// - White background with 1px border
// - Subtle shadows (shadow-sm)
// - Compact spacing (p-4, gap-1)
// - Portal accent colors only for badges/active states
// - Collapse support (200px expanded, 64px collapsed)
// ============================================================================

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number | string;
  disabled?: boolean;
}

interface VercelSidebarProps {
  items: NavItem[];
  portal?: "student" | "teacher" | "parent" | "counselor" | "school-admin" | "admin";
  portalName?: string;
  userName?: string;
  userImage?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

// Portal accent colors (RGB for inline styles)
const portalAccents = {
  student: "rgb(249 115 22)",
  teacher: "rgb(59 130 246)",
  parent: "rgb(107 114 128)",
  counselor: "rgb(168 85 247)",
  admin: "rgb(236 72 153)",
  "school-admin": "rgb(139 92 246)",
};

const VercelSidebar = React.forwardRef<HTMLDivElement, VercelSidebarProps>(
  ({ items, portal, portalName, userName, userImage, collapsed = false, onCollapsedChange, className }, ref) => {
    const pathname = usePathname();
    const accentColor = portal ? portalAccents[portal] : "rgb(249 115 22)";

    // Check if an item is active
    const isActive = (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname?.startsWith(href);
    };

    return (
      <aside
        ref={ref}
        className={cn(
          // Fixed positioning on desktop
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200",
          // Smooth width transition
          "transition-all duration-300 ease-in-out",
          // Width based on collapsed state
          collapsed ? "w-16" : "w-60",
          // Hidden on mobile (use bottom nav instead)
          "hidden lg:flex",
          // Subtle shadow
          "shadow-sm",
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo / Portal Name */}
          <div className="h-14 flex items-center px-4 border-b border-gray-200">
            {!collapsed ? (
              <Link
                href={portal ? `/${portal}` : "/"}
                className="flex items-center gap-2 font-semibold text-gray-900"
              >
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs"
                  style={{ background: accentColor }}
                >
                  C
                </div>
                <span className="text-sm">{portalName || "Career Compass"}</span>
              </Link>
            ) : (
              <Link
                href={portal ? `/${portal}` : "/"}
                className="w-8 h-8 rounded flex items-center justify-center text-white text-xs mx-auto"
                style={{ background: accentColor }}
              >
                C
              </Link>
            )}
          </div>

          {/* Collapse Toggle */}
          <div className="px-2 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCollapsedChange?.(!collapsed)}
              className={cn(
                "w-full h-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                collapsed && "justify-center"
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={cn(
                  "w-4 h-4 transition-transform",
                  collapsed && "rotate-180"
                )}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Main navigation">
            <ul role="list" className="space-y-0.5">
              {items.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
                        "min-h-[36px]",
                        // Active state
                        active && "bg-gray-100 text-gray-900",
                        // Inactive state
                        !active && "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        // Disabled state
                        item.disabled && "pointer-events-none opacity-50"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {/* Icon */}
                      <Icon
                        className={cn(
                          "w-4 h-4 flex-shrink-0",
                          active && "text-gray-900",
                          !active && "text-gray-400"
                        )}
                        strokeWidth={2}
                      />

                      {/* Label */}
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>

                          {/* Badge */}
                          {item.badge && (
                            <span
                              className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-medium text-white"
                              style={{ background: accentColor }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}

                      {/* Active indicator (collapsed) */}
                      {collapsed && active && (
                        <div
                          className="absolute right-1 w-1 h-4 rounded-full"
                          style={{ background: accentColor }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info (Footer) */}
          <div className="p-2 border-t border-gray-200">
            {!collapsed ? (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                {userImage ? (
                  <img src={userImage} alt={userName} className="w-7 h-7 rounded-full bg-gray-200" />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ background: accentColor }}
                  >
                    {userName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{userName || "User"}</p>
                  <p className="text-xs text-gray-500 truncate capitalize">
                    {portal?.replace("-", " ") || "User"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                {userImage ? (
                  <img src={userImage} alt={userName} className="w-7 h-7 rounded-full bg-gray-200" />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ background: accentColor }}
                  >
                    {userName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  }
);
VercelSidebar.displayName = "VercelSidebar";

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
  School,
  UserCheck,
  MessageSquare,
  CreditCard,
  Target,
  Briefcase,
  Award,
  Globe,
  Bookmark,
  Video,
  CheckCircle,
  BarChart3,
  Building2,
  Database,
  DollarSign,
} from "lucide-react";

// Student navigation
export const StudentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: Home },
  { label: "Classes", href: "/student/classes", icon: BookOpen },
  { label: "Homework", href: "/student/homework", icon: ClipboardList },
  { label: "Results", href: "/student/results", icon: TrendingUp },
  { label: "Career Plan", href: "/dashboard/plan", icon: Target },
  { label: "Careers", href: "/dashboard/careers", icon: Briefcase },
  { label: "RUB Colleges", href: "/dashboard/rub", icon: GraduationCap },
  { label: "Scholarships", href: "/dashboard/scholarships", icon: Award },
];

// Teacher navigation
export const TeacherNavItems: NavItem[] = [
  { label: "Dashboard", href: "/teacher", icon: Home },
  { label: "Classes", href: "/teacher/classes", icon: BookOpen },
  { label: "Students", href: "/teacher/students", icon: Users },
  { label: "Homework", href: "/teacher/homework", icon: ClipboardList },
  { label: "Assessments", href: "/teacher/assessments", icon: FileText },
  { label: "Reports", href: "/teacher/reports", icon: BarChart3 },
];

// Parent navigation
export const ParentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/parent", icon: Home },
  { label: "Children", href: "/parent/children", icon: Users },
  { label: "Progress", href: "/parent/progress", icon: TrendingUp },
  { label: "Fees", href: "/parent/fees", icon: CreditCard },
];

// Counselor navigation
export const CounselorNavItems: NavItem[] = [
  { label: "Dashboard", href: "/counselor", icon: Home },
  { label: "Students", href: "/counselor/students", icon: Users },
  { label: "Sessions", href: "/counselor/sessions", icon: Calendar },
  { label: "Notes", href: "/counselor/notes", icon: MessageSquare },
  { label: "Assessments", href: "/counselor/assessments", icon: ClipboardList },
  { label: "Reports", href: "/counselor/reports", icon: BarChart3 },
];

// School Admin navigation
export const SchoolAdminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/school-admin", icon: Home },
  { label: "Students", href: "/school-admin/students", icon: Users },
  { label: "Teachers", href: "/school-admin/teachers", icon: GraduationCap },
  { label: "Classes", href: "/school-admin/classes", icon: BookOpen },
  { label: "Timetable", href: "/school-admin/timetable", icon: Calendar },
  { label: "Reports", href: "/school-admin/reports", icon: FileText },
];

// Platform Admin navigation
export const AdminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: Home },
  { label: "Schools", href: "/admin/schools", icon: School },
  { label: "Users", href: "/admin/users", icon: UserCheck },
  { label: "Teachers", href: "/admin/teachers", icon: GraduationCap },
  { label: "Counselors", href: "/admin/counselors", icon: MessageSquare },
  { label: "Content", href: "/admin/content", icon: Database },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

export function StudentVercelSidebar(props?: Omit<VercelSidebarProps, "items" | "portal" | "portalName">) {
  return <VercelSidebar items={StudentNavItems} portal="student" portalName="Student Portal" {...props} />;
}

export function TeacherVercelSidebar(props?: Omit<VercelSidebarProps, "items" | "portal" | "portalName">) {
  return <VercelSidebar items={TeacherNavItems} portal="teacher" portalName="Teacher Portal" {...props} />;
}

export function ParentVercelSidebar(props?: Omit<VercelSidebarProps, "items" | "portal" | "portalName">) {
  return <VercelSidebar items={ParentNavItems} portal="parent" portalName="Parent Portal" {...props} />;
}

export function CounselorVercelSidebar(props?: Omit<VercelSidebarProps, "items" | "portal" | "portalName">) {
  return <VercelSidebar items={CounselorNavItems} portal="counselor" portalName="Counselor Portal" {...props} />;
}

export function SchoolAdminVercelSidebar(props?: Omit<VercelSidebarProps, "items" | "portal" | "portalName">) {
  return <VercelSidebar items={SchoolAdminNavItems} portal="school-admin" portalName="School Admin Portal" {...props} />;
}

export function AdminVercelSidebar(props?: Omit<VercelSidebarProps, "items" | "portal" | "portalName">) {
  return <VercelSidebar items={AdminNavItems} portal="admin" portalName="Admin Portal" {...props} />;
}

export { VercelSidebar };
