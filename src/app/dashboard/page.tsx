"use client";

import Link from "next/link";
import {
  GraduationCap,
  User,
  Users,
  MessageSquare,
  Shield,
  Building2,
  Landmark,
  ArrowRight,
} from "lucide-react";

/**
 * Portal Selection Page
 *
 * This page serves as a portal hub for users who may have access to multiple portals.
 * Users can click to navigate to their specific portal dashboard.
 *
 * Note: The middleware handles automatic routing to the appropriate portal
 * based on user type, so users typically won't see this page unless they
 * navigate to /dashboard directly.
 */

const portals = [
  {
    name: "Student Portal",
    description: "Your personal learning hub with assessments, career planning, and progress tracking.",
    href: "/student/dashboard",
    icon: GraduationCap,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },
  {
    name: "Teacher Portal",
    description: "Manage classes, homework, assessments, and track student progress.",
    href: "/teacher/dashboard",
    icon: Users,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    name: "Parent Portal",
    description: "Monitor your child's progress, attendance, and communicate with teachers.",
    href: "/parent/dashboard",
    icon: User,
    color: "from-gray-500 to-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950",
  },
  {
    name: "Counselor Portal",
    description: "Student guidance, interventions, sessions, and career counseling resources.",
    href: "/counselor/dashboard",
    icon: MessageSquare,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
  {
    name: "School Admin Portal",
    description: "School-wide management: students, teachers, classes, timetable, and reports.",
    href: "/school-admin/dashboard",
    icon: Building2,
    color: "from-violet-500 to-violet-600",
    bgColor: "bg-violet-50 dark:bg-violet-950",
  },
  {
    name: "Platform Admin Portal",
    description: "Platform-wide management: schools, users, billing, partners, and analytics.",
    href: "/admin",
    icon: Shield,
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950",
  },
  {
    name: "Ministry Portal",
    description: "National education oversight: analytics, policies, and school management.",
    href: "/ministry/dashboard",
    icon: Landmark,
    color: "from-rose-500 to-rose-600",
    bgColor: "bg-rose-50 dark:bg-rose-950",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold">BE</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Bhutan EduSkill
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Select your portal
                </p>
              </div>
            </div>
            <Link
              href="/sign-out"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Sign Out
            </Link>
          </div>
        </div>
      </div>

      {/* Portal Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Bhutan EduSkill
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Select your portal to continue. If you have access to multiple portals,
            you can switch between them at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <Link
                key={portal.href}
                href={portal.href}
                className="group relative"
              >
                <div className={`${portal.bgColor} rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 h-full`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${portal.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {portal.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {portal.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm font-medium text-gray-500 dark:text-gray-500 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    Enter Portal
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Not sure which portal to access?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-all shadow-sm hover:shadow"
          >
            Contact Support
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
