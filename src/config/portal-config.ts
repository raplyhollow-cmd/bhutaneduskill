/**
 * Portal Configuration - Single Source of Truth
 *
 * This file contains all portal-specific configurations including:
 * - Navigation items for each portal
 * - Color schemes and gradients
 * - Mobile settings that apply to ALL portals
 *
 * To change mobile UX across all portals, edit MOBILE_SETTINGS below.
 * To change a specific portal, edit that portal's entry in PORTAL_CONFIG.
 */

import {
  Home,
  ClipboardList,
  Briefcase,
  BookOpen,
  Target,
  FileText,
  GraduationCap,
  Globe,
  Award,
  Bookmark,
  Settings,
  Users,
  Building2,
  BarChart3,
  Calendar,
  MessageSquare,
  AlertCircle,
  LogOut,
  Video,
  CheckCircle,
  DollarSign,
  Link as LinkIcon,
  TrendingUp,
  Megaphone,
  Shield,
  ShieldCheck,
  Package,
  Bell,
  Activity,
  Bus,
  Command,
  Database,
  Zap,
} from "lucide-react";

// ============ PORTAL CONFIGURATION ============
// Each portal has its own navigation items and styling

export const PORTAL_CONFIG = {
  student: {
    name: "Student Portal",
    type: "student",
    gradient: "linear-gradient(180deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
    mobileGradient: "rgb(249 115 22)",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    activeBg: "rgb(255 255 255)",
    activeText: "rgb(194 65 12)",
    navigationItems: [
      { name: "Dashboard", href: "/student/dashboard", icon: Home },
      { name: "My Classes", href: "/student/classes", icon: BookOpen },
      { name: "Homework", href: "/student/homework", icon: ClipboardList },
      { name: "Learning", href: "/student/learning", icon: Video },
      { name: "Attendance", href: "/student/attendance", icon: CheckCircle },
      { name: "Results", href: "/student/results", icon: BarChart3 },
      { name: "Progress", href: "/student/progress", icon: TrendingUp },
      { name: "Fees", href: "/student/fees", icon: DollarSign },
      { name: "Tuition", href: "/student/tuition", icon: GraduationCap },
      { name: "Transport", href: "/student/transport", icon: Bus },
      { name: "Announcements", href: "/student/announcements", icon: Megaphone },
      { name: "Assessments", href: "/student/assessment", icon: ClipboardList },
      { name: "Career Matches", href: "/student/careers", icon: Briefcase },
      { name: "Skills", href: "/student/skills", icon: BookOpen },
      { name: "Career Plan", href: "/student/plan", icon: Target },
      { name: "Journal", href: "/student/journal", icon: FileText },
      { name: "Study Abroad", href: "/student/study-abroad", icon: Globe },
      { name: "RUB Colleges", href: "/student/rub", icon: GraduationCap },
      { name: "Scholarships", href: "/student/scholarships", icon: Award },
      { name: "Saved Items", href: "/student/saved", icon: Bookmark },
    ],
  },
  teacher: {
    name: "Teacher Portal",
    type: "teacher",
    gradient: "linear-gradient(180deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
    mobileGradient: "rgb(59 130 246)",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    activeBg: "rgb(255 255 255)",
    activeText: "rgb(37 99 235)",
    navigationItems: [
      { name: "Dashboard", href: "/teacher/dashboard", icon: Home },
      { name: "My Classes", href: "/teacher/classes", icon: Users },
      { name: "Students", href: "/teacher/students", icon: GraduationCap },
      { name: "Homework", href: "/teacher/homework", icon: ClipboardList },
      { name: "Learning", href: "/teacher/learning", icon: Video },
      { name: "Attendance", href: "/teacher/attendance", icon: CheckCircle },
      { name: "Assessments", href: "/teacher/assessments", icon: ClipboardList },
      { name: "Reports", href: "/teacher/reports", icon: BarChart3 },
      { name: "Schedule", href: "/teacher/schedule", icon: Calendar },
      { name: "Live Sessions", href: "/teacher/live-sessions", icon: LinkIcon },
    ],
  },
  parent: {
    name: "Parent Portal",
    type: "parent",
    gradient: "linear-gradient(180deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)",
    mobileGradient: "rgb(107 114 128)",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    activeBg: "rgb(255 255 255)",
    activeText: "rgb(75 85 99)",
    navigationItems: [
      { name: "Dashboard", href: "/parent/dashboard", icon: Home },
      { name: "My Children", href: "/parent/children", icon: Users },
      { name: "Progress", href: "/parent/progress", icon: BarChart3 },
      { name: "Careers", href: "/parent/careers", icon: Briefcase },
      { name: "Assessments", href: "/parent/assessments", icon: ClipboardList },
      { name: "Transport", href: "/parent/transport", icon: Bus },
      { name: "Consent", href: "/parent/consent", icon: FileText },
      { name: "Messages", href: "/parent/messages", icon: MessageSquare },
    ],
  },
  counselor: {
    name: "Counselor Portal",
    type: "counselor",
    gradient: "linear-gradient(180deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    mobileGradient: "rgb(168 85 247)",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    activeBg: "rgb(255 255 255)",
    activeText: "rgb(147 51 234)",
    navigationItems: [
      { name: "Dashboard", href: "/counselor/dashboard", icon: Home },
      { name: "Students", href: "/counselor/students", icon: Users },
      { name: "Interventions", href: "/counselor/interventions", icon: AlertCircle },
      { name: "Sessions", href: "/counselor/sessions", icon: Calendar },
      { name: "Notes", href: "/counselor/notes", icon: FileText },
      { name: "Assessments", href: "/counselor/assessments", icon: ClipboardList },
      { name: "Reports", href: "/counselor/reports", icon: BarChart3 },
      { name: "Resources", href: "/counselor/resources", icon: BookOpen },
    ],
  },
  admin: {
    name: "Admin Portal",
    type: "admin",
    gradient: "linear-gradient(180deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
    mobileGradient: "rgb(236 72 153)",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    activeBg: "rgb(255 255 255)",
    activeText: "rgb(219 39 119)",
    navigationItems: [
      { name: "Dashboard", href: "/admin", icon: Home },
      { name: "Command Center", href: "/admin/command-center", icon: Command },
      { name: "Schools", href: "/admin/schools", icon: Building2 },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Teachers", href: "/admin/teachers", icon: GraduationCap },
      { name: "Counselors", href: "/admin/counselors", icon: MessageSquare },
      { name: "Assessments", href: "/admin/assessments", icon: ClipboardList },
      { name: "Knowledge", href: "/admin/knowledge", icon: Database },
      { name: "Content", href: "/admin/content", icon: FileText },
      { name: "Careers", href: "/admin/careers", icon: Briefcase },
      { name: "Reports", href: "/admin/reports", icon: BarChart3 },
      { name: "Partners", href: "/admin/partners", icon: Award },
      { name: "Notifications", href: "/admin/notifications", icon: Megaphone },
      { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
      { name: "System Status", href: "/admin/system-status", icon: Activity },
      { name: "Roles", href: "/admin/roles", icon: Shield },
      { name: "Permissions", href: "/admin/permissions", icon: Shield },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
  "school-admin": {
    name: "School Admin Portal",
    type: "school-admin",
    gradient: "linear-gradient(180deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
    mobileGradient: "rgb(139 92 246)",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    activeBg: "rgb(255 255 255)",
    activeText: "rgb(124 58 237)",
    navigationItems: [
      { name: "Dashboard", href: "/school-admin/dashboard", icon: Home },
      { name: "Students", href: "/school-admin/students", icon: Users },
      { name: "Teachers", href: "/school-admin/teachers", icon: GraduationCap },
      { name: "Classes", href: "/school-admin/classes", icon: BookOpen },
      { name: "Subjects", href: "/school-admin/subjects", icon: FileText },
      { name: "Timetable", href: "/school-admin/timetable", icon: Calendar },
      { name: "Attendance", href: "/school-admin/attendance", icon: CheckCircle },
      { name: "Homework", href: "/school-admin/homework", icon: ClipboardList },
      { name: "Results", href: "/school-admin/results", icon: BarChart3 },
      { name: "Fees", href: "/school-admin/fees", icon: Briefcase },
      { name: "Tuition", href: "/school-admin/tuition", icon: Award },
      { name: "Transport", href: "/school-admin/transport", icon: Bus },
      { name: "Inventory", href: "/school-admin/inventory", icon: Package },
      { name: "Counselors", href: "/school-admin/counselors", icon: MessageSquare },
      { name: "Announcements", href: "/school-admin/announcements", icon: Megaphone },
      { name: "Reports", href: "/school-admin/reports", icon: BarChart3 },
      { name: "Analytics", href: "/school-admin/analytics", icon: BarChart3 },
      { name: "Settings", href: "/school-admin/settings", icon: Settings },
    ],
  },
  ministry: {
    name: "Ministry Portal",
    type: "ministry",
    gradient: "linear-gradient(180deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    mobileGradient: "rgb(168 85 247)",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    activeBg: "rgb(255 255 255)",
    activeText: "rgb(147 51 234)",
    navigationItems: [
      { name: "Dashboard", href: "/ministry", icon: Home },
      { name: "Schools", href: "/ministry/schools", icon: Building2 },
      { name: "Analytics", href: "/ministry/analytics", icon: BarChart3 },
      { name: "Notifications", href: "/ministry/notifications", icon: Bell },
      { name: "Billing", href: "/ministry/billing", icon: DollarSign },
      { name: "Policies", href: "/ministry/policies", icon: FileText },
      { name: "Users", href: "/ministry/users", icon: Users },
    ],
  },
} as const;

// ============ MOBILE SETTINGS ============
// These settings apply to ALL portals
// Edit this section to change mobile behavior globally

export const MOBILE_SETTINGS = {
  // Responsive breakpoints
  breakpoints: {
    mobile: "1024px",  // Below this = mobile view
    tablet: "768px",   // Below this = tablet/mobile
    desktop: "1024px", // Above this = desktop view
  },

  // Touch target sizes (iOS standard = 44px minimum)
  touchTargets: {
    minimum: "44px",   // iOS HIG minimum
    comfortable: "48px", // More comfortable
    large: "52px",     // Easy to tap
  },

  // Safe area insets for notched devices (iPhone X+, etc.)
  safeAreas: {
    top: "env(safe-area-inset-top)",
    bottom: "env(safe-area-inset-bottom)",
    left: "env(safe-area-inset-left)",
    right: "env(safe-area-inset-right)",
  },

  // Animation settings
  animations: {
    sidebarSlideIn: "300ms ease-out",
    sidebarSlideOut: "200ms ease-in",
    overlayFade: "200ms ease-in-out",
    springStiffness: 300,
    springDamping: 20,
  },

  // Sidebar width
  sidebar: {
    width: "16rem",    // 256px / w-64
    widthCollapsed: "5rem", // 80px / w-20
  },

  // Viewport height (fixes iOS Safari address bar bug)
  viewport: {
    // Use 100dvh instead of 100vh to account for mobile browser chrome
    fullHeight: "100dvh",
    minFullHeight: "min-h-[100dvh]",
  },
} as const;

// ============ TYPE EXPORTS ============

export type PortalType = keyof typeof PORTAL_CONFIG;
export type NavigationItem = typeof PORTAL_CONFIG[PortalType]["navigationItems"][number];
