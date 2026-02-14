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
  Settings,
  Users,
  Building2,
  BarChart3,
  Calendar,
  MessageSquare,
  AlertCircle,
  LogOut,
  Menu,
  X,
  Video,
  CheckCircle,
  DollarSign,
  Link as LinkIcon,
  Database,
  TrendingUp,
  Megaphone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  userType: "student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin";
  userName?: string;
  userImage?: string;
}

const navigationItems = {
  student: [
    { name: "Dashboard", href: "/student/dashboard", icon: Home },
    { name: "My Classes", href: "/student/classes", icon: BookOpen },
    { name: "Homework", href: "/student/homework", icon: ClipboardList },
    { name: "Learning", href: "/student/learning", icon: Video },
    { name: "Attendance", href: "/student/attendance", icon: CheckCircle },
    { name: "Results", href: "/student/results", icon: BarChart3 },
    { name: "Progress", href: "/student/progress", icon: TrendingUp },
    { name: "Fees", href: "/student/fees", icon: DollarSign },
    { name: "Tuition", href: "/student/tuition", icon: GraduationCap },
    { name: "Announcements", href: "/student/announcements", icon: Megaphone },
    { name: "Assessments", href: "/dashboard/assessment", icon: ClipboardList },
    { name: "Career Matches", href: "/dashboard/careers", icon: Briefcase },
    { name: "Skills", href: "/dashboard/skills", icon: BookOpen },
    { name: "Career Plan", href: "/dashboard/plan", icon: Target },
    { name: "Journal", href: "/dashboard/journal", icon: FileText },
    { name: "Study Abroad", href: "/dashboard/study-abroad", icon: Globe },
    { name: "RUB Colleges", href: "/dashboard/rub", icon: GraduationCap },
    { name: "Scholarships", href: "/dashboard/scholarships", icon: Award },
    { name: "Saved Items", href: "/dashboard/saved", icon: Bookmark },
  ],
  teacher: [
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
  parent: [
    { name: "Dashboard", href: "/parent/dashboard", icon: Home },
    { name: "My Children", href: "/parent/children", icon: Users },
    { name: "Progress", href: "/parent/progress", icon: BarChart3 },
    { name: "Careers", href: "/parent/careers", icon: Briefcase },
    { name: "Assessments", href: "/parent/assessments", icon: ClipboardList },
    { name: "Consent", href: "/parent/consent", icon: FileText },
    { name: "Messages", href: "/parent/messages", icon: MessageSquare },
  ],
  counselor: [
    { name: "Dashboard", href: "/counselor/dashboard", icon: Home },
    { name: "Students", href: "/counselor/students", icon: Users },
    { name: "Interventions", href: "/counselor/interventions", icon: AlertCircle },
    { name: "Sessions", href: "/counselor/sessions", icon: Calendar },
    { name: "Notes", href: "/counselor/notes", icon: FileText },
    { name: "Assessments", href: "/counselor/assessments", icon: ClipboardList },
    { name: "Reports", href: "/counselor/reports", icon: BarChart3 },
    { name: "Resources", href: "/counselor/resources", icon: BookOpen },
  ],
  admin: [
    { name: "Dashboard", href: "/admin/dashboard", icon: Home },
    { name: "Schools", href: "/admin/schools", icon: Building2 },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Teachers", href: "/admin/teachers", icon: GraduationCap },
    { name: "Counselors", href: "/admin/counselors", icon: MessageSquare },
    { name: "Assessments", href: "/admin/assessments", icon: ClipboardList },
    { name: "Content", href: "/admin/content", icon: Database },
    { name: "Careers", href: "/admin/careers", icon: Briefcase },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ],
  "school-admin": [
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
    { name: "Counselors", href: "/school-admin/counselors", icon: MessageSquare },
    { name: "Announcements", href: "/school-admin/announcements", icon: Megaphone },
    { name: "Reports", href: "/school-admin/reports", icon: BarChart3 },
    { name: "Analytics", href: "/school-admin/analytics", icon: BarChart3 },
    { name: "Settings", href: "/school-admin/settings", icon: Settings },
  ],
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

export function PortalSidebar({ userType, userName, userImage }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Handle sign out - navigate to sign-out page which uses Clerk's SignedOut component
  const handleSignOut = () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setIsMobileMenuOpen(false);
    // Navigate to sign-out page which properly signs out with Clerk
    router.push('/sign-out');
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

  const navigation = navigationItems[userType];
  const portalStyle = portalStyles[userType];
  const portalName = portalNames[userType];

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
                Career Compass
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
            <ul role="list" className="space-y-1">
              {navigation.map((item, index) => {
                const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== `/${userType}/dashboard`);
                return (
                  <motion.li
                    key={item.name}
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, type: "spring", stiffness: 300, damping: 24 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset min-h-[44px]"
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
            </ul>
          </nav>

          {/* Footer Actions */}
          <motion.div
            className="p-4 border-t border-white/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            role="group"
            aria-label="Account actions"
          >
            <Link
              href={`/${userType}/settings`}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-white hover:bg-white/10 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset min-h-[44px]"
              aria-label="Go to settings page"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                aria-hidden="true"
              >
                <Settings className="w-5 h-5 text-white" />
              </motion.div>
              <span className="font-medium text-white">Settings</span>
            </Link>
            <motion.button
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-white hover:bg-white/10 transition-all duration-200 mt-1 group focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSignOut}
              disabled={isSigningOut}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Sign out of your account"
              type="button"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
                aria-hidden="true"
                animate={isSigningOut ? { rotate: 360, opacity: 0.5 } : {}}
              >
                <LogOut className="w-5 h-5 text-white" />
              </motion.div>
              <span className="font-medium text-white">
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </span>
            </motion.button>
          </motion.div>
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
  userType: "student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin";
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
