/**
 * CENTRAL ROUTING MANAGER (Network Manager)
 *
 * This is the single source of truth for all ecosystem routing.
 * All navigation, access control, and route definitions are managed here.
 *
 * Like "roads in one place" - all routing logic centralized.
 */

import {
  Home,
  ClipboardCheck,
  Briefcase,
  Target,
  BookOpen,
  Calendar,
  TrendingUp,
  FileText,
  Users,
  GraduationCap,
  MessageSquare,
  Settings,
  BarChart3,
  Building2,
  School,
  ChevronRight,
  Sparkles,
  Award,
  Eye,
  Download,
  Upload,
  Database,
  FileSpreadsheet,
  FileJson,
  FilePieChart,
  DollarSign,
  UserCheck,
  Fingerprint,
  CreditCard,
  GraduationCap as GraduationCapIcon,
} from "lucide-react";

// ============================================================================
// USER ROLES DEFINITIONS
// ============================================================================

export type UserRole = "student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin";

export interface RouteConfig {
  path: string;
  label: string;
  icon: any;
  description?: string;
  badge?: string;
  requiresAuth: boolean;
  allowedRoles: UserRole[];
  children?: RouteConfig[];
  apiEndpoint?: string;
  dataExportable?: boolean;
}

export interface PortalConfig {
  role: UserRole;
  name: string;
  basePath: string;
  theme: {
    primary: string;
    gradient: string;
    gradientInline: string;
    icon: any;
  };
  routes: RouteConfig[];
}

// ============================================================================
// PORTAL CONFIGURATIONS
// ============================================================================

export const portalConfigs: Record<UserRole, PortalConfig> = {
  student: {
    role: "student",
    name: "Student Portal",
    basePath: "/student",
    theme: {
      primary: "orange",
      gradient: "from-orange-600 to-orange-700",
      gradientInline: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
      icon: GraduationCap,
    },
    routes: [
      {
        path: "/student/dashboard",
        label: "Dashboard",
        icon: Home,
        description: "Overview of your progress",
        requiresAuth: true,
        allowedRoles: ["student"],
        dataExportable: true,
      },
      {
        path: "/student/homework",
        label: "Homework",
        icon: FileText,
        description: "View and complete homework",
        requiresAuth: true,
        allowedRoles: ["student"],
        dataExportable: true,
      },
      {
        path: "/student/modules",
        label: "Learning Modules",
        icon: BookOpen,
        description: "Access learning materials",
        requiresAuth: true,
        allowedRoles: ["student"],
        dataExportable: true,
      },
      {
        path: "/student/class-notes",
        label: "Class Notes",
        icon: FileSpreadsheet,
        description: "Access teacher notes",
        requiresAuth: true,
        allowedRoles: ["student"],
        dataExportable: true,
      },
      {
        path: "/student/assessments",
        label: "Assessments",
        icon: ClipboardCheck,
        description: "Personality and aptitude tests",
        requiresAuth: true,
        allowedRoles: ["student"],
        children: [
          { path: "/student/assessments/riasec", label: "RIASEC", icon: Target, allowedRoles: ["student"], requiresAuth: true },
          { path: "/student/assessments/mbti", label: "MBTI", icon: Sparkles, allowedRoles: ["student"], requiresAuth: true },
          { path: "/student/assessments/disc", label: "DISC", icon: Award, allowedRoles: ["student"], requiresAuth: true },
          { path: "/student/assessments/work-values", label: "Work Values", icon: Eye, allowedRoles: ["student"], requiresAuth: true },
          { path: "/student/assessments/learning-styles", label: "Learning Styles", icon: BookOpen, allowedRoles: ["student"], requiresAuth: true },
        ],
      },
      {
        path: "/student/careers",
        label: "Career Matches",
        icon: Briefcase,
        description: "Explore matched careers",
        requiresAuth: true,
        allowedRoles: ["student"],
        dataExportable: true,
      },
      {
        path: "/student/plan",
        label: "Career Plan",
        icon: Target,
        description: "Your personalized career roadmap",
        requiresAuth: true,
        allowedRoles: ["student"],
        dataExportable: true,
      },
      {
        path: "/student/rub",
        label: "RUB Programs",
        icon: School,
        description: "Royal University of Bhutan programs",
        requiresAuth: true,
        allowedRoles: ["student"],
        dataExportable: true,
      },
      {
        path: "/student/tuition",
        label: "Tuition",
        icon: GraduationCapIcon,
        description: "Find tutoring",
        requiresAuth: true,
        allowedRoles: ["student"],
        dataExportable: true,
      },
      {
        path: "/student/results",
        label: "My Results",
        icon: BarChart3,
        description: "Exam results and academic performance",
        requiresAuth: true,
        allowedRoles: ["student"],
        dataExportable: true,
      },
      {
        path: "/student/attendance",
        label: "Attendance",
        icon: UserCheck,
        description: "View attendance record",
        requiresAuth: true,
        allowedRoles: ["student"],
        dataExportable: true,
      },
      {
        path: "/student/fees",
        label: "Fees",
        icon: DollarSign,
        description: "View fee status",
        requiresAuth: true,
        allowedRoles: ["student"],
        dataExportable: true,
      },
      {
        path: "/student/journal",
        label: "Journal",
        icon: FileText,
        description: "Personal reflection and notes",
        requiresAuth: true,
        allowedRoles: ["student"],
        dataExportable: true,
      },
      {
        path: "/student/schedule",
        label: "Schedule",
        icon: Calendar,
        description: "Upcoming tasks and deadlines",
        requiresAuth: true,
        allowedRoles: ["student"],
      },
      {
        path: "/student/profile",
        label: "Profile",
        icon: Settings,
        description: "Manage your account",
        requiresAuth: true,
        allowedRoles: ["student"],
      },
    ],
  },

  teacher: {
    role: "teacher",
    name: "Teacher Portal",
    basePath: "/teacher",
    theme: {
      primary: "blue",
      gradient: "from-blue-600 to-blue-700",
      gradientInline: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
      icon: GraduationCap,
    },
    routes: [
      {
        path: "/teacher/dashboard",
        label: "Dashboard",
        icon: Home,
        description: "Class overview and statistics",
        requiresAuth: true,
        allowedRoles: ["teacher"],
        dataExportable: true,
      },
      {
        path: "/teacher/students",
        label: "My Students",
        icon: Users,
        description: "View and manage students",
        requiresAuth: true,
        allowedRoles: ["teacher"],
        dataExportable: true,
      },
      {
        path: "/teacher/classes",
        label: "Classes",
        icon: School,
        description: "Manage class schedules",
        requiresAuth: true,
        allowedRoles: ["teacher"],
        dataExportable: true,
      },
      {
        path: "/teacher/homework",
        label: "Homework",
        icon: FileText,
        description: "Create and grade homework",
        requiresAuth: true,
        allowedRoles: ["teacher"],
        dataExportable: true,
      },
      {
        path: "/teacher/attendance",
        label: "Attendance",
        icon: UserCheck,
        description: "Mark student attendance",
        requiresAuth: true,
        allowedRoles: ["teacher"],
        dataExportable: true,
      },
      {
        path: "/teacher/modules",
        label: "Learning Modules",
        icon: BookOpen,
        description: "Create learning content",
        requiresAuth: true,
        allowedRoles: ["teacher"],
        dataExportable: true,
      },
      {
        path: "/teacher/class-notes",
        label: "Class Notes",
        icon: FileSpreadsheet,
        description: "Share notes with students",
        requiresAuth: true,
        allowedRoles: ["teacher"],
        dataExportable: true,
      },
      {
        path: "/teacher/assessments",
        label: "Assessments",
        icon: ClipboardCheck,
        description: "View student assessment results",
        requiresAuth: true,
        allowedRoles: ["teacher"],
        dataExportable: true,
      },
      {
        path: "/teacher/career-guidance",
        label: "Career Guidance",
        icon: Briefcase,
        description: "Career resources for students",
        requiresAuth: true,
        allowedRoles: ["teacher"],
      },
      {
        path: "/teacher/tuition",
        label: "Tutoring",
        icon: GraduationCapIcon,
        description: "Manage tutoring sessions",
        requiresAuth: true,
        allowedRoles: ["teacher"],
        dataExportable: true,
      },
      {
        path: "/teacher/profile",
        label: "Profile",
        icon: Settings,
        description: "Manage your account",
        requiresAuth: true,
        allowedRoles: ["teacher"],
      },
    ],
  },

  parent: {
    role: "parent",
    name: "Parent Portal",
    basePath: "/parent",
    theme: {
      primary: "gray",
      gradient: "from-gray-600 to-gray-700",
      gradientInline: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)",
      icon: Users,
    },
    routes: [
      {
        path: "/parent/dashboard",
        label: "Dashboard",
        icon: Home,
        description: "Overview of your child's progress",
        requiresAuth: true,
        allowedRoles: ["parent"],
        dataExportable: true,
      },
      {
        path: "/parent/child-progress",
        label: "Child's Progress",
        icon: TrendingUp,
        description: "Academic and assessment results",
        requiresAuth: true,
        allowedRoles: ["parent"],
        dataExportable: true,
      },
      {
        path: "/parent/assessments",
        label: "Assessment Results",
        icon: ClipboardCheck,
        description: "View assessment outcomes",
        requiresAuth: true,
        allowedRoles: ["parent"],
        dataExportable: true,
      },
      {
        path: "/parent/career-matches",
        label: "Career Matches",
        icon: Briefcase,
        description: "Recommended careers for your child",
        requiresAuth: true,
        allowedRoles: ["parent"],
        dataExportable: true,
      },
      {
        path: "/parent/career-plan",
        label: "Career Plan",
        icon: Target,
        description: "Your child's career roadmap",
        requiresAuth: true,
        allowedRoles: ["parent"],
        dataExportable: true,
      },
      {
        path: "/parent/messages",
        label: "Messages",
        icon: MessageSquare,
        description: "Communicate with counselors",
        requiresAuth: true,
        allowedRoles: ["parent"],
      },
      {
        path: "/parent/profile",
        label: "Profile",
        icon: Settings,
        description: "Manage your account",
        requiresAuth: true,
        allowedRoles: ["parent"],
      },
    ],
  },

  counselor: {
    role: "counselor",
    name: "Counselor Portal",
    basePath: "/counselor",
    theme: {
      primary: "purple",
      gradient: "from-purple-600 to-purple-700",
      gradientInline: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
      icon: GraduationCap,
    },
    routes: [
      {
        path: "/counselor/dashboard",
        label: "Dashboard",
        icon: Home,
        description: "Overview and analytics",
        requiresAuth: true,
        allowedRoles: ["counselor", "admin"],
        dataExportable: true,
      },
      {
        path: "/counselor/students",
        label: "Students",
        icon: Users,
        description: "Manage assigned students",
        requiresAuth: true,
        allowedRoles: ["counselor", "admin"],
        dataExportable: true,
      },
      {
        path: "/counselor/assessments",
        label: "Assessments",
        icon: ClipboardCheck,
        description: "View all assessment results",
        requiresAuth: true,
        allowedRoles: ["counselor", "admin"],
        dataExportable: true,
      },
      {
        path: "/counselor/career-plans",
        label: "Career Plans",
        icon: Target,
        description: "Review and update student plans",
        requiresAuth: true,
        allowedRoles: ["counselor", "admin"],
        dataExportable: true,
      },
      {
        path: "/counselor/reports",
        label: "Reports",
        icon: FileSpreadsheet,
        description: "Generate comprehensive reports",
        requiresAuth: true,
        allowedRoles: ["counselor", "admin"],
        dataExportable: true,
      },
      {
        path: "/counselor/schools",
        label: "Schools",
        icon: Building2,
        description: "Manage partner schools",
        requiresAuth: true,
        allowedRoles: ["counselor", "admin"],
        dataExportable: true,
      },
      {
        path: "/counselor/data-export",
        label: "Data Export",
        icon: Download,
        description: "Export data in various formats",
        requiresAuth: true,
        allowedRoles: ["counselor", "admin"],
        dataExportable: true,
      },
      {
        path: "/counselor/profile",
        label: "Profile",
        icon: Settings,
        description: "Manage your account",
        requiresAuth: true,
        allowedRoles: ["counselor", "admin"],
      },
    ],
  },

  admin: {
    role: "admin",
    name: "Admin Portal",
    basePath: "/admin",
    theme: {
      primary: "pink",
      gradient: "from-pink-600 to-pink-700",
      gradientInline: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
      icon: Settings,
    },
    routes: [
      {
        path: "/admin/dashboard",
        label: "Dashboard",
        icon: Home,
        description: "System overview",
        requiresAuth: true,
        allowedRoles: ["admin"],
        dataExportable: true,
      },
      {
        path: "/admin/users",
        label: "Users",
        icon: Users,
        description: "Manage all users",
        requiresAuth: true,
        allowedRoles: ["admin"],
        dataExportable: true,
      },
      {
        path: "/admin/tenants",
        label: "Tenants",
        icon: Building2,
        description: "Manage organizations",
        requiresAuth: true,
        allowedRoles: ["admin"],
        dataExportable: true,
      },
      {
        path: "/admin/assessments",
        label: "Assessments",
        icon: ClipboardCheck,
        description: "Manage assessment types",
        requiresAuth: true,
        allowedRoles: ["admin"],
        dataExportable: true,
      },
      {
        path: "/admin/careers",
        label: "Careers",
        icon: Briefcase,
        description: "Manage career database",
        requiresAuth: true,
        allowedRoles: ["admin"],
        dataExportable: true,
      },
      {
        path: "/admin/reports",
        label: "Reports",
        icon: FileSpreadsheet,
        description: "Generate system reports",
        requiresAuth: true,
        allowedRoles: ["admin"],
        dataExportable: true,
      },
      {
        path: "/admin/data-export",
        label: "Data Export",
        icon: Download,
        description: "Export all system data",
        requiresAuth: true,
        allowedRoles: ["admin"],
        dataExportable: true,
      },
      {
        path: "/admin/settings",
        label: "Settings",
        icon: Settings,
        description: "System configuration",
        requiresAuth: true,
        allowedRoles: ["admin"],
      },
    ],
  },

  "school-admin": {
    role: "school-admin",
    name: "School Admin Portal",
    basePath: "/school-admin",
    theme: {
      primary: "violet",
      gradient: "from-violet-600 to-violet-700",
      gradientInline: "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
      icon: Building2,
    },
    routes: [
      {
        path: "/school-admin/dashboard",
        label: "Dashboard",
        icon: Home,
        description: "School overview and statistics",
        requiresAuth: true,
        allowedRoles: ["school-admin", "admin"],
        dataExportable: true,
      },
      {
        path: "/school-admin/students",
        label: "Students",
        icon: Users,
        description: "Manage students",
        requiresAuth: true,
        allowedRoles: ["school-admin", "admin"],
        dataExportable: true,
      },
      {
        path: "/school-admin/teachers",
        label: "Teachers",
        icon: GraduationCap,
        description: "Manage teachers",
        requiresAuth: true,
        allowedRoles: ["school-admin", "admin"],
        dataExportable: true,
      },
      {
        path: "/school-admin/classes",
        label: "Classes",
        icon: School,
        description: "Manage classes",
        requiresAuth: true,
        allowedRoles: ["school-admin", "admin"],
        dataExportable: true,
      },
      {
        path: "/school-admin/subjects",
        label: "Subjects",
        icon: BookOpen,
        description: "Manage subjects",
        requiresAuth: true,
        allowedRoles: ["school-admin", "admin"],
        dataExportable: true,
      },
      {
        path: "/school-admin/attendance",
        label: "Attendance",
        icon: UserCheck,
        description: "Manage attendance",
        requiresAuth: true,
        allowedRoles: ["school-admin", "admin"],
        dataExportable: true,
      },
      {
        path: "/school-admin/homework",
        label: "Homework",
        icon: FileText,
        description: "View all homework",
        requiresAuth: true,
        allowedRoles: ["school-admin", "admin"],
        dataExportable: true,
      },
      {
        path: "/school-admin/results",
        label: "Results",
        icon: BarChart3,
        description: "Exam results",
        requiresAuth: true,
        allowedRoles: ["school-admin", "admin"],
        dataExportable: true,
      },
      {
        path: "/school-admin/fees",
        label: "Fees",
        icon: DollarSign,
        description: "Fee management",
        requiresAuth: true,
        allowedRoles: ["school-admin", "admin"],
        dataExportable: true,
      },
      {
        path: "/school-admin/counselors",
        label: "Counselors",
        icon: UserCheck,
        description: "Manage counselors",
        requiresAuth: true,
        allowedRoles: ["school-admin", "admin"],
        dataExportable: true,
      },
      {
        path: "/school-admin/tuition",
        label: "Tuition Center",
        icon: GraduationCapIcon,
        description: "Manage tuition",
        requiresAuth: true,
        allowedRoles: ["school-admin", "admin"],
        dataExportable: true,
      },
      {
        path: "/school-admin/analytics",
        label: "Analytics",
        icon: TrendingUp,
        description: "School analytics",
        requiresAuth: true,
        allowedRoles: ["school-admin", "admin"],
        dataExportable: true,
      },
      {
        path: "/school-admin/settings",
        label: "Settings",
        icon: Settings,
        description: "School settings",
        requiresAuth: true,
        allowedRoles: ["school-admin", "admin"],
      },
    ],
  },
};

// ============================================================================
// DATA EXPORT CONFIGURATIONS
// ============================================================================

export type ExportFormat = "json" | "csv" | "excel" | "pdf" | "xml";

export interface DataExportConfig {
  entityType: string;
  apiEndpoint: string;
  exportableFormats: ExportFormat[];
  fields: {
    key: string;
    label: string;
    type: "string" | "number" | "date" | "boolean" | "array" | "object";
  }[];
  allowedRoles: UserRole[];
}

export const dataExportConfigs: DataExportConfig[] = [
  {
    entityType: "assessments",
    apiEndpoint: "/api/data-export/assessments",
    exportableFormats: ["json", "csv", "excel", "pdf"],
    allowedRoles: ["counselor", "admin"],
    fields: [
      { key: "id", label: "ID", type: "string" },
      { key: "userId", label: "User ID", type: "string" },
      { key: "type", label: "Assessment Type", type: "string" },
      { key: "status", label: "Status", type: "string" },
      { key: "results", label: "Results", type: "object" },
      { key: "completedAt", label: "Completed Date", type: "date" },
    ],
  },
  {
    entityType: "career-matches",
    apiEndpoint: "/api/data-export/career-matches",
    exportableFormats: ["json", "csv", "excel", "pdf"],
    allowedRoles: ["student", "teacher", "parent", "counselor", "admin"],
    fields: [
      { key: "career", label: "Career Name", type: "string" },
      { key: "matchScore", label: "Match Score", type: "number" },
      { key: "category", label: "Category", type: "string" },
      { key: "description", label: "Description", type: "string" },
    ],
  },
  {
    entityType: "career-plans",
    apiEndpoint: "/api/data-export/career-plans",
    exportableFormats: ["json", "csv", "excel", "pdf"],
    allowedRoles: ["student", "counselor", "admin"],
    fields: [
      { key: "userId", label: "User ID", type: "string" },
      { key: "targetCareer", label: "Target Career", type: "string" },
      { key: "currentPhase", label: "Current Phase", type: "string" },
      { key: "shortTermGoals", label: "Short Term Goals", type: "array" },
      { key: "longTermGoals", label: "Long Term Goals", type: "array" },
    ],
  },
  {
    entityType: "exam-results",
    apiEndpoint: "/api/data-export/exam-results",
    exportableFormats: ["json", "csv", "excel", "pdf"],
    allowedRoles: ["student", "teacher", "parent", "counselor", "admin"],
    fields: [
      { key: "examType", label: "Exam Type", type: "string" },
      { key: "examYear", label: "Year", type: "number" },
      { key: "subjects", label: "Subjects", type: "array" },
      { key: "totalPercentage", label: "Total %", type: "number" },
      { key: "division", label: "Division", type: "string" },
    ],
  },
  {
    entityType: "users",
    apiEndpoint: "/api/data-export/users",
    exportableFormats: ["json", "csv", "excel"],
    allowedRoles: ["counselor", "admin"],
    fields: [
      { key: "id", label: "ID", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "email", label: "Email", type: "string" },
      { key: "type", label: "Role", type: "string" },
      { key: "schoolId", label: "School ID", type: "string" },
    ],
  },
  {
    entityType: "journal-entries",
    apiEndpoint: "/api/data-export/journal",
    exportableFormats: ["json", "csv", "pdf"],
    allowedRoles: ["student", "counselor"],
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "title", label: "Title", type: "string" },
      { key: "content", label: "Content", type: "string" },
      { key: "mood", label: "Mood", type: "string" },
      { key: "tags", label: "Tags", type: "array" },
    ],
  },
];

// ============================================================================
// ROUTING HELPER FUNCTIONS
// ============================================================================

/**
 * Get portal configuration for a given role
 */
export function getPortalConfig(role: UserRole): PortalConfig {
  return portalConfigs[role];
}

/**
 * Get all routes for a given role
 */
export function getRoutesForRole(role: UserRole): RouteConfig[] {
  const config = getPortalConfig(role);
  return config.routes.filter((route) => route.allowedRoles.includes(role));
}

/**
 * Check if a user can access a specific path
 */
export function canAccessPath(role: UserRole, path: string): boolean {
  for (const config of Object.values(portalConfigs)) {
    for (const route of config.routes) {
      if (route.path === path && route.allowedRoles.includes(role)) {
        return true;
      }
      // Check children routes
      if (route.children) {
        for (const child of route.children) {
          if (child.path === path && child.allowedRoles.includes(role)) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

/**
 * Get the base path for a role's portal
 */
export function getBasePathForRole(role: UserRole): string {
  return portalConfigs[role].basePath;
}

/**
 * Get navigation items for sidebar (flattened with children)
 */
export function getNavigationItems(role: UserRole): RouteConfig[] {
  const routes = getRoutesForRole(role);
  const items: RouteConfig[] = [];

  for (const route of routes) {
    items.push(route);
    if (route.children) {
      items.push(...route.children);
    }
  }

  return items;
}

/**
 * Get data export configs for a role
 */
export function getExportConfigsForRole(role: UserRole): DataExportConfig[] {
  return dataExportConfigs.filter((config) => config.allowedRoles.includes(role));
}

/**
 * Redirect path for legacy routes
 */
export function getRedirectForLegacyPath(path: string, role: UserRole): string | null {
  // Map legacy dashboard routes to new portal structure
  const legacyMappings: Record<string, string> = {
    "/dashboard": getBasePathForRole(role) + "/dashboard",
    "/dashboard/assessment": getBasePathForRole(role) + "/assessments/riasec",
    "/dashboard/careers": getBasePathForRole(role) + "/careers",
    "/dashboard/plan": getBasePathForRole(role) + "/plan",
    "/dashboard/rub": getBasePathForRole(role) + "/rub",
    "/dashboard/results": getBasePathForRole(role) + "/results",
    "/dashboard/journal": getBasePathForRole(role) + "/journal",
    "/portal/counselor": "/counselor/dashboard",
  };

  // Exact match
  if (legacyMappings[path]) {
    return legacyMappings[path];
  }

  // Prefix match
  for (const [legacy, newPath] of Object.entries(legacyMappings)) {
    if (path.startsWith(legacy + "/")) {
      return newPath + path.slice(legacy.length);
    }
  }

  return null;
}

/**
 * Get default route after login based on role
 */
export function getDefaultRouteForRole(role: UserRole): string {
  return getBasePathForRole(role) + "/dashboard";
}

// ============================================================================
// EXPORT ALL CONFIGURATIONS FOR EASY IMPORT
// ============================================================================

export default {
  portalConfigs,
  dataExportConfigs,
  getPortalConfig,
  getRoutesForRole,
  canAccessPath,
  getBasePathForRole,
  getNavigationItems,
  getExportConfigsForRole,
  getRedirectForLegacyPath,
  getDefaultRouteForRole,
};
