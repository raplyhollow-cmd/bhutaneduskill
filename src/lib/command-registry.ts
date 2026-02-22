/**
 * Command Registry
 *
 * Central registry for all command menu items across all portals.
 * Each portal can register navigation commands, actions, and shortcuts.
 */

import {
  Home,
  BookOpen,
  ClipboardList,
  Target,
  FileText,
  GraduationCap,
  Globe,
  Award,
  Bookmark,
  Users,
  Building2,
  BarChart3,
  Calendar,
  MessageSquare,
  Settings,
  Bell,
  CheckCircle,
  DollarSign,
  Bus,
  Video,
  TrendingUp,
  Megaphone,
  Shield,
  Activity,
  Package,
  AlertCircle,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import type { PortalType } from "@/config/portal-config";

export interface CommandItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  shortcut?: string;
  action: () => void | Promise<void>;
  keywords?: string[];
}

export interface CommandGroup {
  id: string;
  label: string;
  items: CommandItem[];
}

// ============================================================================
// STUDENT COMMANDS
// ============================================================================

const studentCommands: CommandGroup[] = [
  {
    id: "navigation",
    label: "Navigation",
    items: [
      { id: "dashboard", label: "Go to Dashboard", icon: Home, action: () => navigate("/student/dashboard") },
      { id: "classes", label: "My Classes", icon: BookOpen, action: () => navigate("/student/classes") },
      { id: "homework", label: "Homework", icon: ClipboardList, action: () => navigate("/student/homework") },
      { id: "attendance", label: "Attendance", icon: CheckCircle, action: () => navigate("/student/attendance") },
      { id: "results", label: "Results", icon: BarChart3, action: () => navigate("/student/results") },
      { id: "fees", label: "Fees", icon: DollarSign, action: () => navigate("/student/fees") },
    ],
  },
  {
    id: "career",
    label: "Career & Learning",
    items: [
      { id: "careers", label: "Career Matches", icon: Target, action: () => navigate("/student/careers") },
      { id: "plan", label: "Career Plan", icon: Target, action: () => navigate("/student/plan") },
      { id: "assessments", label: "Assessments", icon: ClipboardList, action: () => navigate("/student/assessment") },
      { id: "rub", label: "RUB Colleges", icon: GraduationCap, action: () => navigate("/student/rub") },
      { id: "scholarships", label: "Scholarships", icon: Award, action: () => navigate("/student/scholarships") },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    items: [
      { id: "settings", label: "Open Settings", icon: Settings, action: () => navigate("/student/settings") },
    ],
  },
];

// ============================================================================
// TEACHER COMMANDS
// ============================================================================

const teacherCommands: CommandGroup[] = [
  {
    id: "navigation",
    label: "Navigation",
    items: [
      { id: "dashboard", label: "Go to Dashboard", icon: Home, action: () => navigate("/teacher/dashboard") },
      { id: "classes", label: "My Classes", icon: BookOpen, action: () => navigate("/teacher/classes") },
      { id: "students", label: "Students", icon: Users, action: () => navigate("/teacher/students") },
      { id: "homework", label: "Homework", icon: ClipboardList, action: () => navigate("/teacher/homework") },
      { id: "attendance", label: "Mark Attendance", icon: CheckCircle, action: () => navigate("/teacher/attendance") },
      { id: "assessments", label: "Assessments", icon: ClipboardList, action: () => navigate("/teacher/assessments") },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    items: [
      { id: "settings", label: "Open Settings", icon: Settings, action: () => navigate("/teacher/settings") },
    ],
  },
];

// ============================================================================
// PARENT COMMANDS
// ============================================================================

const parentCommands: CommandGroup[] = [
  {
    id: "navigation",
    label: "Navigation",
    items: [
      { id: "dashboard", label: "Go to Dashboard", icon: Home, action: () => navigate("/parent/dashboard") },
      { id: "children", label: "My Children", icon: Users, action: () => navigate("/parent/children") },
      { id: "progress", label: "Progress", icon: BarChart3, action: () => navigate("/parent/progress") },
      { id: "careers", label: "Career Matches", icon: Target, action: () => navigate("/parent/careers") },
      { id: "fees", label: "Pay Fees", icon: DollarSign, action: () => navigate("/parent/fees") },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    items: [
      { id: "settings", label: "Open Settings", icon: Settings, action: () => navigate("/parent/settings") },
    ],
  },
];

// ============================================================================
// COUNSELOR COMMANDS
// ============================================================================

const counselorCommands: CommandGroup[] = [
  {
    id: "navigation",
    label: "Navigation",
    items: [
      { id: "dashboard", label: "Go to Dashboard", icon: Home, action: () => navigate("/counselor/dashboard") },
      { id: "students", label: "Students", icon: Users, action: () => navigate("/counselor/students") },
      { id: "interventions", label: "Interventions", icon: AlertCircle, action: () => navigate("/counselor/interventions") },
      { id: "sessions", label: "Sessions", icon: Calendar, action: () => navigate("/counselor/sessions") },
      { id: "notes", label: "Notes", icon: FileText, action: () => navigate("/counselor/notes") },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    items: [
      { id: "settings", label: "Open Settings", icon: Settings, action: () => navigate("/counselor/settings") },
    ],
  },
];

// ============================================================================
// ADMIN COMMANDS
// ============================================================================

const adminCommands: CommandGroup[] = [
  {
    id: "navigation",
    label: "Navigation",
    items: [
      { id: "dashboard", label: "Go to Dashboard", icon: Home, action: () => navigate("/admin") },
      { id: "schools", label: "Schools", icon: Building2, action: () => navigate("/admin/schools") },
      { id: "users", label: "Users", icon: Users, action: () => navigate("/admin/users") },
      { id: "teachers", label: "Teachers", icon: GraduationCap, action: () => navigate("/admin/teachers") },
      { id: "counselors", label: "Counselors", icon: MessageSquare, action: () => navigate("/admin/counselors") },
      { id: "careers", label: "Careers", icon: Target, action: () => navigate("/admin/careers") },
      { id: "analytics", label: "Analytics", icon: BarChart3, action: () => navigate("/admin/analytics") },
      { id: "notifications", label: "Notifications", icon: Megaphone, action: () => navigate("/admin/notifications") },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    items: [
      { id: "settings", label: "Open Settings", icon: Settings, action: () => navigate("/admin/settings") },
    ],
  },
];

// ============================================================================
// SCHOOL ADMIN COMMANDS
// ============================================================================

const schoolAdminCommands: CommandGroup[] = [
  {
    id: "navigation",
    label: "Navigation",
    items: [
      { id: "dashboard", label: "Go to Dashboard", icon: Home, action: () => navigate("/school-admin/dashboard") },
      { id: "students", label: "Students", icon: Users, action: () => navigate("/school-admin/students") },
      { id: "teachers", label: "Teachers", icon: GraduationCap, action: () => navigate("/school-admin/teachers") },
      { id: "classes", label: "Classes", icon: BookOpen, action: () => navigate("/school-admin/classes") },
      { id: "attendance", label: "Attendance", icon: CheckCircle, action: () => navigate("/school-admin/attendance") },
      { id: "fees", label: "Fees", icon: DollarSign, action: () => navigate("/school-admin/fees") },
      { id: "announcements", label: "Announcements", icon: Megaphone, action: () => navigate("/school-admin/announcements") },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    items: [
      { id: "settings", label: "Open Settings", icon: Settings, action: () => navigate("/school-admin/settings") },
    ],
  },
];

// ============================================================================
// MINISTRY COMMANDS
// ============================================================================

const ministryCommands: CommandGroup[] = [
  {
    id: "navigation",
    label: "Navigation",
    items: [
      { id: "dashboard", label: "Go to Dashboard", icon: Home, action: () => navigate("/ministry") },
      { id: "schools", label: "Schools", icon: Building2, action: () => navigate("/ministry/schools") },
      { id: "analytics", label: "Analytics", icon: BarChart3, action: () => navigate("/ministry/analytics") },
      { id: "notifications", label: "Notifications", icon: Bell, action: () => navigate("/ministry/notifications") },
      { id: "billing", label: "Billing", icon: DollarSign, action: () => navigate("/ministry/billing") },
      { id: "policies", label: "Policies", icon: FileText, action: () => navigate("/ministry/policies") },
    ],
  },
  {
    id: "actions",
    label: "Actions",
    items: [
      { id: "settings", label: "Open Settings", icon: Settings, action: () => navigate("/ministry/settings") },
    ],
  },
];

// ============================================================================
// REGISTRY
// ============================================================================

export const commandRegistry: Record<PortalType, CommandGroup[]> = {
  student: studentCommands,
  teacher: teacherCommands,
  parent: parentCommands,
  counselor: counselorCommands,
  admin: adminCommands,
  "school-admin": schoolAdminCommands,
  ministry: ministryCommands,
};

// ============================================================================
// UNIVERSAL COMMANDS (Available in all portals)
// ============================================================================

export const universalCommands: CommandItem[] = [
  { id: "signout", label: "Sign Out", icon: LogOut, action: () => {
    if (typeof window !== "undefined") {
      window.location.href = "/sign-out";
    }
  }, keywords: ["logout", "exit"] },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all commands for a specific portal
 */
export function getCommandsForPortal(portal: PortalType): CommandGroup[] {
  return commandRegistry[portal] || [];
}

/**
 * Get all command items as a flat array for searching
 */
export function getAllCommandsForPortal(portal: PortalType): CommandItem[] {
  const groups = getCommandsForPortal(portal);
  const items = groups.flatMap((g) => g.items);
  return [...items, ...universalCommands];
}

/**
 * Navigate to a path
 */
function navigate(path: string) {
  if (typeof window !== "undefined") {
    window.location.href = path;
  }
}
