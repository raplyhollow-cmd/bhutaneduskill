"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
  ChevronDown,
  Video,
  CheckCircle,
  DollarSign,
  Clock,
  Link as LinkIcon,
} from "lucide-react";

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
    { name: "Fees", href: "/student/fees", icon: DollarSign },
    { name: "Tuition", href: "/student/tuition", icon: GraduationCap },
    { name: "Assessments", href: "/student/assessments", icon: ClipboardList },
    { name: "Career Matches", href: "/student/careers", icon: Briefcase },
    { name: "Skills", href: "/student/skills", icon: BookOpen },
    { name: "Career Plan", href: "/student/plan", icon: Target },
    { name: "Journal", href: "/student/journal", icon: FileText },
    { name: "Study Abroad", href: "/student/study-abroad", icon: Globe },
    { name: "RUB Colleges", href: "/student/rub", icon: GraduationCap },
    { name: "Scholarships", href: "/student/scholarships", icon: Award },
    { name: "Saved Items", href: "/student/saved", icon: Bookmark },
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
    { name: "Attendance", href: "/school-admin/attendance", icon: Calendar },
    { name: "Homework", href: "/school-admin/homework", icon: ClipboardList },
    { name: "Results", href: "/school-admin/results", icon: BarChart3 },
    { name: "Fees", href: "/school-admin/fees", icon: Briefcase },
    { name: "Tuition", href: "/school-admin/tuition", icon: Award },
    { name: "Counselors", href: "/school-admin/counselors", icon: MessageSquare },
    { name: "Analytics", href: "/school-admin/analytics", icon: BarChart3 },
  ],
};

const portalColors = {
  student: "from-hunter-green-600 to-hunter-green-700",
  teacher: "from-powder-blue-500 to-powder-blue-600",
  parent: "from-ash-grey-600 to-ash-grey-700",
  counselor: "from-oxidized-iron-500 to-oxidized-iron-600",
  admin: "from-lobster-pink-500 to-lobster-pink-600",
  "school-admin": "from-purple-600 to-purple-700",
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = navigationItems[userType];
  const portalColor = portalColors[userType];
  const portalName = portalNames[userType];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-lg"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-gradient-to-b text-white transition-transform duration-300 ease-in-out",
          portalColor,
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Portal Header */}
        <div className="p-6 border-b border-white/10">
          <Link href={`/${userType}/dashboard`} className="block">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              Career Compass
            </h1>
            <p className="text-sm text-white/70 mt-1">{portalName}</p>
          </Link>
        </div>

        {/* User Info */}
        {userName && (
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              {userImage ? (
                <img
                  src={userImage}
                  alt={userName}
                  className="w-10 h-10 rounded-full bg-white/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="font-semibold">
                    {userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{userName}</p>
                <p className="text-xs text-white/70 capitalize">{userType}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                      isActive
                        ? "bg-white text-gray-900 shadow-lg"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10">
          <Link
            href={`/${userType}/settings`}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => {
              // Clerk sign out will be handled here
              window.location.href = "/sign-out";
            }}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
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
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{title || "Dashboard"}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4">
            {/* Notifications placeholder */}
            <Button variant="ghost" size="icon" className="relative">
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              <MessageSquare className="w-5 h-5 text-gray-600" />
            </Button>
            {/* User menu */}
            {userName && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500 capitalize">{userType}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-hunter-green-100 flex items-center justify-center">
                  <span className="font-semibold text-hunter-green-700">
                    {userName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
