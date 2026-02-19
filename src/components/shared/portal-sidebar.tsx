"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  Users,
  Building2,
  BarChart3,
  Calendar,
  MessageSquare,
  AlertCircle,
  Menu,
  X,
  Video,
  CheckCircle,
  DollarSign,
  Link as LinkIcon,
  Database,
  TrendingUp,
  Megaphone,
  Shield,
  Package,
  CalendarClock,
  HeartPulse,
  Settings,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  userType: "student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin" | "ministry";
  userName?: string;
  userImage?: string;
  studentId?: string; // For cross-portal navigation when viewing a student
}

interface NavItem {
  name: string;
  href: string;
  icon: any;
}

interface NavCategory {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Categorized navigation items for better organization
const studentNavigationCategories: NavCategory[] = [
  {
    title: "Overview",
    defaultOpen: true,
    items: [
      { name: "Dashboard", href: "/student/dashboard", icon: Home },
    ],
  },
  {
    title: "Academics",
    defaultOpen: true,
    items: [
      { name: "My Classes", href: "/student/classes", icon: BookOpen },
      { name: "Homework", href: "/student/homework", icon: ClipboardList },
      { name: "Learning", href: "/student/learning", icon: Video },
      { name: "Attendance", href: "/student/attendance", icon: CheckCircle },
      { name: "Results", href: "/student/results", icon: BarChart3 },
      { name: "Progress", href: "/student/progress", icon: TrendingUp },
    ],
  },
  {
    title: "Career Planning",
    items: [
      { name: "Assessments", href: "/student/assessment", icon: ClipboardList },
      { name: "Career Matches", href: "/student/careers", icon: Briefcase },
      { name: "Skills", href: "/student/skills", icon: Target },
      { name: "Career Plan", href: "/student/plan", icon: Target },
      { name: "Journal", href: "/student/journal", icon: FileText },
    ],
  },
  {
    title: "Higher Education",
    items: [
      { name: "Study Abroad", href: "/student/study-abroad", icon: Globe },
      { name: "RUB Colleges", href: "/student/rub", icon: GraduationCap },
      { name: "Scholarships", href: "/student/scholarships", icon: Award },
    ],
  },
  {
    title: "School & Fees",
    items: [
      { name: "Fees", href: "/student/fees", icon: DollarSign },
      { name: "Tuition", href: "/student/tuition", icon: GraduationCap },
      { name: "Medical", href: "/student/medical", icon: HeartPulse },
    ],
  },
  {
    title: "Communication",
    items: [
      { name: "Announcements", href: "/student/announcements", icon: Megaphone },
      { name: "Saved Items", href: "/student/saved", icon: Bookmark },
    ],
  },
];

// Categorized navigation for all portals
const teacherNavigationCategories: NavCategory[] = [
  {
    title: "Overview",
    defaultOpen: true,
    items: [
      { name: "Dashboard", href: "/teacher/dashboard", icon: Home },
    ],
  },
  {
    title: "Teaching",
    defaultOpen: true,
    items: [
      { name: "My Classes", href: "/teacher/classes", icon: Users },
      { name: "Students", href: "/teacher/students", icon: GraduationCap },
      { name: "Homework", href: "/teacher/homework", icon: ClipboardList },
      { name: "Learning", href: "/teacher/learning", icon: Video },
      { name: "Assessments", href: "/teacher/assessments", icon: ClipboardList },
    ],
  },
  {
    title: "Classroom Management",
    items: [
      { name: "Attendance", href: "/teacher/attendance", icon: CheckCircle },
      { name: "Schedule", href: "/teacher/schedule", icon: Calendar },
      { name: "Reports", href: "/teacher/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Other",
    items: [
      { name: "Leave", href: "/teacher/leave", icon: CalendarClock },
      { name: "Live Sessions", href: "/teacher/live-sessions", icon: LinkIcon },
    ],
  },
];

const parentNavigationCategories: NavCategory[] = [
  {
    title: "Overview",
    defaultOpen: true,
    items: [
      { name: "Dashboard", href: "/parent/dashboard", icon: Home },
    ],
  },
  {
    title: "My Children",
    defaultOpen: true,
    items: [
      { name: "My Children", href: "/parent/children", icon: Users },
      { name: "Progress", href: "/parent/progress", icon: BarChart3 },
      { name: "Careers", href: "/parent/careers", icon: Briefcase },
    ],
  },
  {
    title: "Health & Activities",
    items: [
      { name: "Medical", href: "/parent/medical", icon: HeartPulse },
      { name: "Assessments", href: "/parent/assessments", icon: ClipboardList },
    ],
  },
  {
    title: "Communication",
    items: [
      { name: "Messages", href: "/parent/messages", icon: MessageSquare },
      { name: "Consent", href: "/parent/consent", icon: FileText },
    ],
  },
];

const counselorNavigationCategories: NavCategory[] = [
  {
    title: "Overview",
    defaultOpen: true,
    items: [
      { name: "Dashboard", href: "/counselor/dashboard", icon: Home },
    ],
  },
  {
    title: "Student Support",
    defaultOpen: true,
    items: [
      { name: "Students", href: "/counselor/students", icon: Users },
      { name: "Interventions", href: "/counselor/interventions", icon: AlertCircle },
      { name: "Sessions", href: "/counselor/sessions", icon: Calendar },
    ],
  },
  {
    title: "Records",
    items: [
      { name: "Notes", href: "/counselor/notes", icon: FileText },
      { name: "Assessments", href: "/counselor/assessments", icon: ClipboardList },
      { name: "Reports", href: "/counselor/reports", icon: BarChart3 },
      { name: "Resources", href: "/counselor/resources", icon: BookOpen },
    ],
  },
];

const adminNavigationCategories: NavCategory[] = [
  {
    title: "Overview",
    defaultOpen: true,
    items: [
      { name: "Dashboard", href: "/admin", icon: Home },
    ],
  },
  {
    title: "Platform Management",
    defaultOpen: true,
    items: [
      { name: "Schools", href: "/admin/schools", icon: Building2 },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Partners", href: "/admin/partners", icon: Award },
    ],
  },
  {
    title: "Content",
    items: [
      { name: "Content", href: "/admin/content", icon: Database },
      { name: "Careers", href: "/admin/careers", icon: Briefcase },
      { name: "Assessments", href: "/admin/assessments", icon: ClipboardList },
    ],
  },
  {
    title: "Settings",
    items: [
      { name: "Notifications", href: "/admin/notifications", icon: Megaphone },
      { name: "Analytics", href: "/admin/analytics", icon: TrendingUp },
      { name: "Roles", href: "/admin/roles", icon: Shield },
      { name: "Permissions", href: "/admin/permissions", icon: FileText },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

const schoolAdminNavigationCategories: NavCategory[] = [
  {
    title: "Overview",
    defaultOpen: true,
    items: [
      { name: "Dashboard", href: "/school-admin/dashboard", icon: Home },
    ],
  },
  {
    title: "People",
    defaultOpen: true,
    items: [
      { name: "Students", href: "/school-admin/students", icon: Users },
      { name: "Teachers", href: "/school-admin/teachers", icon: GraduationCap },
      { name: "Counselors", href: "/school-admin/counselors", icon: MessageSquare },
    ],
  },
  {
    title: "Academics",
    items: [
      { name: "Classes", href: "/school-admin/classes", icon: BookOpen },
      { name: "Subjects", href: "/school-admin/subjects", icon: FileText },
      { name: "Timetable", href: "/school-admin/timetable", icon: Calendar },
      { name: "Attendance", href: "/school-admin/attendance", icon: CheckCircle },
      { name: "Homework", href: "/school-admin/homework", icon: ClipboardList },
      { name: "Results", href: "/school-admin/results", icon: BarChart3 },
    ],
  },
  {
    title: "Administration",
    items: [
      { name: "Leave Approvals", href: "/school-admin/leave-approvals", icon: CalendarClock },
      { name: "Fees", href: "/school-admin/fees", icon: Briefcase },
      { name: "Tuition", href: "/school-admin/tuition", icon: Award },
      { name: "Inventory", href: "/school-admin/inventory", icon: Package },
      { name: "Announcements", href: "/school-admin/announcements", icon: Megaphone },
      { name: "Settings", href: "/school-admin/settings", icon: Settings },
    ],
  },
  {
    title: "Reports",
    items: [
      { name: "Analytics", href: "/school-admin/analytics", icon: BarChart3 },
      { name: "Reports", href: "/school-admin/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Health",
    items: [
      { name: "Infirmary", href: "/school-admin/infirmary", icon: HeartPulse },
    ],
  },
];

// Categorized navigation for all portal types
const navigationCategories: Record<string, NavCategory[]> = {
  student: studentNavigationCategories,
  teacher: teacherNavigationCategories,
  parent: parentNavigationCategories,
  counselor: counselorNavigationCategories,
  admin: adminNavigationCategories,
  "school-admin": schoolAdminNavigationCategories,
  ministry: adminNavigationCategories, // Reuse admin structure for ministry
};

// Keep flat navigation for backward compatibility
const navigationItems = {
  student: studentNavigationCategories.flatMap((cat) => cat.items),
  teacher: teacherNavigationCategories.flatMap((cat) => cat.items),
  parent: parentNavigationCategories.flatMap((cat) => cat.items),
  counselor: counselorNavigationCategories.flatMap((cat) => cat.items),
  admin: adminNavigationCategories.flatMap((cat) => cat.items),
  "school-admin": schoolAdminNavigationCategories.flatMap((cat) => cat.items),
  ministry: adminNavigationCategories.flatMap((cat) => cat.items),
};

// Clerk-inspired color scheme for each portal type
const portalStyles = {
  student: {
    background: "linear-gradient(180deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    activeBg: "rgb(255 255 255)",
    activeText: "rgb(194 65 12)",
  },
  teacher: {
    background: "linear-gradient(180deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    activeBg: "rgb(255 255 255)",
    activeText: "rgb(37 99 235)",
  },
  parent: {
    background: "linear-gradient(180deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    activeBg: "rgb(255 255 255)",
    activeText: "rgb(75 85 99)",
  },
  counselor: {
    background: "linear-gradient(180deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    activeBg: "rgb(255 255 255)",
    activeText: "rgb(147 51 234)",
  },
  admin: {
    background: "linear-gradient(180deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    activeBg: "rgb(255 255 255)",
    activeText: "rgb(219 39 119)",
  },
  "school-admin": {
    background: "linear-gradient(180deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
    hoverBg: "rgba(255, 255, 255, 0.15)",
    activeBg: "rgb(255 255 255)",
    activeText: "rgb(124 58 237)",
  },
};

const portalNames = {
  student: "Student Portal",
  teacher: "Teacher Portal",
  parent: "Parent Portal",
  counselor: "Counselor Portal",
  admin: "Admin Portal",
  "school-admin": "School Admin Portal",
};

/**
 * Get related links for cross-portal navigation based on user type and student context
 */
interface RelatedLink {
  type: string;
  label: string;
  href: string;
  icon: any;
}

function getRelatedLinks(userType: string, studentId: string): RelatedLink[] {
  const basePath = `/student`;

  switch (userType) {
    case "teacher":
      // Teachers can view student profiles, assessments, and attendance
      return [
        { type: "assessment", label: "Assessment Results", href: `${basePath}/assessment/${studentId}`, icon: ClipboardList },
        { type: "career", label: "Career Profile", href: `${basePath}/careers/${studentId}`, icon: Briefcase },
        { type: "attendance", label: "Attendance Record", href: `${basePath}/attendance/${studentId}`, icon: CheckCircle },
        { type: "homework", label: "Homework Status", href: `${basePath}/homework/${studentId}`, icon: BookOpen },
      ];

    case "parent":
      // Parents can view their child's detailed assessments and progress
      return [
        { type: "assessment", label: "Assessments", href: `${basePath}/assessment/${studentId}`, icon: ClipboardList },
        { type: "career", label: "Career Matches", href: `${basePath}/careers/${studentId}`, icon: Briefcase },
        { type: "progress", label: "Progress Report", href: `${basePath}/progress/${studentId}`, icon: TrendingUp },
        { type: "attendance", label: "Attendance", href: `${basePath}/attendance/${studentId}`, icon: CheckCircle },
      ];

    case "counselor":
      // Counselors can view student homework, attendance, and journal
      return [
        { type: "assessment", label: "Assessments", href: `${basePath}/assessment/${studentId}`, icon: ClipboardList },
        { type: "journal", label: "Learning Journal", href: `${basePath}/journal/${studentId}`, icon: FileText },
        { type: "attendance", label: "Attendance", href: `${basePath}/attendance/${studentId}`, icon: CheckCircle },
        { type: "homework", label: "Homework", href: `${basePath}/homework/${studentId}`, icon: BookOpen },
      ];

    default:
      return [];
  }
}

export function PortalSidebar({ userType, userName, userImage, studentId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State for managing open/closed categories (all portals)
  const defaultOpenCategories = new Set(["Overview"]);
  const [openCategories, setOpenCategories] = useState<Set<string>>(defaultOpenCategories);

  // Toggle category open/closed state
  const toggleCategory = (categoryTitle: string) => {
    setOpenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryTitle)) {
        newSet.delete(categoryTitle);
      } else {
        newSet.add(categoryTitle);
      }
      return newSet;
    });
  };

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const categories = navigationCategories[userType] || [];
  const navigation = navigationItems[userType];
  const portalStyle = portalStyles[userType];
  const portalName = portalNames[userType];

  // Auto-open category if current path is within its items
  useEffect(() => {
    for (const category of categories) {
      const hasActivePath = category.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + "/")
      );
      if (hasActivePath && !openCategories.has(category.title)) {
        setOpenCategories((prev) => new Set([...prev, category.title]));
      }
    }
  }, [pathname, categories, openCategories]);

  return (
    <>
      {/* Mobile menu button */}
      <motion.div
        className="lg:hidden fixed top-4 left-4 z-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Button
          size="icon"
          variant="outline"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-lg border-gray-200 hover:bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={isMobileMenuOpen ? "Close portal navigation menu" : "Open portal navigation menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="portal-sidebar"
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

      {/* Overlay for mobile */}
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

      {/* Sidebar - Desktop: always visible, Mobile: slides in/out */}
      {/* On desktop (lg+): always visible, on mobile: controlled by isMobileMenuOpen */}
      <aside
        id="portal-sidebar"
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 text-white overflow-hidden transition-transform duration-300 ease-in-out",
          // Desktop: always visible (translate-x-0)
          "lg:translate-x-0",
          // Mobile: hidden by default, visible when menu is open
          "-translate-x-full",
          isMobileMenuOpen && "!translate-x-0"
        )}
        style={{ background: portalStyle.background }}
        aria-label={`${portalName} navigation`}
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
              href={`/${userType}/dashboard`}
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
              <p className="text-sm text-white/80 mt-1">{portalName}</p>
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
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="font-semibold text-white">
                      {userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </motion.div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-white">{userName}</p>
                  <p className="text-xs text-white/70 capitalize">{userType.replace("-", " ")}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4" aria-label={`${portalName} navigation menu`}>
            {/* Categorized navigation for all portals */}
            <div className="space-y-4">
              {categories.map((category, catIndex) => {
                const isCategoryOpen = openCategories.has(category.title) || category.defaultOpen;
                const hasActivePath = category.items.some(
                  (item) => pathname === item.href || pathname.startsWith(item.href + "/")
                );

                return (
                  <div key={category.title} className="nav-category">
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category.title)}
                      className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/70 hover:text-white transition-colors duration-200 group"
                      aria-expanded={isCategoryOpen}
                      aria-controls={`category-${category.title.replace(/\s+/g, "-")}`}
                    >
                      <span>{category.title}</span>
                      <motion.div
                        animate={{ rotate: isCategoryOpen ? 180 : 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>

                    {/* Category Items */}
                    <AnimatePresence mode="wait">
                      {isCategoryOpen && (
                        <motion.ul
                          id={`category-${category.title.replace(/\s+/g, "-")}`}
                          role="list"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          {category.items.map((item, index) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                            return (
                              <motion.li
                                key={item.name}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ delay: index * 0.05, duration: 0.2 }}
                              >
                                <Link
                                  href={item.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset min-h-[44px] ml-2"
                                  style={
                                    isActive
                                      ? {
                                          background: portalStyle.activeBg,
                                          color: portalStyle.activeText,
                                        }
                                      : undefined
                                  }
                                  aria-current={isActive ? "page" : undefined}
                                >
                                  {!isActive && (
                                    <motion.div
                                      className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100"
                                      style={{ background: portalStyle.hoverBg }}
                                      transition={{ duration: 0.2 }}
                                    />
                                  )}
                                  <motion.div
                                    whileHover={{ scale: 1.1, rotate: isActive ? 0 : 5 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className="relative z-10"
                                  >
                                    <item.icon className="w-5 h-5" style={{ color: isActive ? portalStyle.activeText : 'white' }} />
                                  </motion.div>
                                  <span className="font-medium relative z-10" style={{ color: isActive ? portalStyle.activeText : 'white' }}>{item.name}</span>
                                  {isActive && (
                                    <motion.div
                                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full"
                                      style={{ background: portalStyle.activeText }}
                                      layoutId={`active-indicator-${userType}`}
                                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                  )}
                                </Link>
                              </motion.li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>

                    {/* Category separator */}
                    {catIndex < categories.length - 1 && (
                      <div className="mt-4 border-t border-white/10" />
                    )}
                  </div>
                );
              })}

              {/* Cross-portal navigation section - shown for teacher, parent, counselor */}
              {(userType === "teacher" || userType === "parent" || userType === "counselor") && studentId && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/70 px-3 py-2 flex items-center gap-2">
                    <ExternalLink className="w-3 h-3" />
                    View Related
                  </p>
                  <div className="space-y-1">
                    {getRelatedLinks(userType, studentId).map((link) => (
                      <Link
                        key={link.type}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[44px] ml-2"
                      >
                        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-white/10 transition-opacity duration-200" />
                        <link.icon className="w-4 h-4 text-white/80 relative z-10" />
                        <span className="text-sm text-white/90 relative z-10 flex-1">{link.label}</span>
                        <ExternalLink className="w-3 h-3 text-white/60 relative z-10" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Footer - spacer for bottom padding */}
          <div className="p-4 border-t border-white/20" />
        </div>
      </aside>
    </>
  );
}

export function PortalHeader({
  userType,
  userName,
  title,
  subtitle,
}: {
  userType: "student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin" | "ministry";
  userName?: string;
  title?: string;
  subtitle?: string;
}) {
  const portalStyle = portalStyles[userType];

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
              <Button variant="ghost" size="icon" className="relative hover:bg-gray-100">
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <MessageSquare className="w-5 h-5 text-gray-700" />
              </Button>
            </motion.div>

            {/* User menu */}
            {userName && (
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-right hidden sm:block">
                  <p className="font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-600 capitalize">{userType.replace("-", " ")}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-md"
                  style={{ background: portalStyle.background }}
                >
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </header>
  );
}
