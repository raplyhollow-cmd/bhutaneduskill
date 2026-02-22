"use client";

import { ShowForRoles, HideFromRoles } from "@/components/auth/show-for-roles";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ResponsiveBentoGrid, Bento2x1, Bento2x2 } from "@/components/dashboard/bento-grid";
import { DashboardCard, StatCard } from "@/components/dashboard/glass-card";
import { useSlideOver } from "@/hooks/use-slide-over";
import { BookOpen, Calendar, TrendingUp, Users, Award, Target, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";

const portalColors: Record<string, { bg: string; accent: string; text: string }> = {
  student: { bg: "bg-orange-50", accent: "text-orange-600", text: "text-orange-900" },
  teacher: { bg: "bg-blue-50", accent: "text-blue-600", text: "text-blue-900" },
  parent: { bg: "bg-gray-50", accent: "text-gray-600", text: "text-gray-900" },
  counselor: { bg: "bg-purple-50", accent: "text-purple-600", text: "text-purple-900" },
  admin: { bg: "bg-pink-50", accent: "text-pink-600", text: "text-pink-900" },
  "school-admin": { bg: "bg-indigo-50", accent: "text-indigo-600", text: "text-indigo-900" },
  ministry: { bg: "bg-violet-50", accent: "text-violet-600", text: "text-violet-900" },
};

export default function PortalDashboard() {
  const { userType, userName } = useCurrentUser();
  const { openSlideOver } = useSlideOver();

  const colors = portalColors[userType || ""] || portalColors.student;
  const portalName = userType
    ? userType.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")
    : "Portal";

  // Get welcome title based on user type
  const getWelcomeTitle = () => {
    if (userType === 'student') return 'Student Dashboard';
    if (userType === 'teacher') return 'Teacher Dashboard';
    if (userType === 'parent') return 'Parent Dashboard';
    if (userType === 'counselor') return 'Counselor Dashboard';
    if (userType === 'school-admin') return 'School Admin Dashboard';
    if (userType === 'admin') return 'Platform Admin Dashboard';
    if (userType === 'ministry') return 'Ministry Dashboard';
    return 'Dashboard';
  };

  // Stat card click handler (opens slide-over)
  const handleStatClick = (type: string) => {
    // For demo purposes, open a profile slide-over
    openSlideOver({ panel: "details" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getWelcomeTitle()}</h1>
          <p className="text-gray-600">Welcome back, {userName || 'User'}!</p>
        </div>
        <div className="text-sm text-gray-500">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-200">⌘K</kbd> for commands
        </div>
      </div>

      {/* Bento Grid Dashboard */}
      <ResponsiveBentoGrid className="bento-grid-responsive">
        {/* Welcome Card (2x2) */}
        <Bento2x2>
          <DashboardCard
            title={`Good to see you, ${userName?.split(' ')[0] || 'there'}!`}
            subtitle={`${portalName} Overview`}
            className="h-full"
          >
            <div className="flex flex-col justify-between h-full py-4">
              <p className="text-gray-600">
                Here's what's happening today. Use <strong>Command+K</strong> to quickly navigate anywhere.
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-500 font-medium">Quick Tip</p>
                <p className="text-sm text-gray-600 mt-1">
                  Click any name or card to open detailed slide-over panels without leaving the page.
                </p>
              </div>
            </div>
          </DashboardCard>
        </Bento2x2>

        {/* Quick Stats (1x1 each) */}
        <StatCard
          label="Tasks Today"
          value="5"
          change={12}
          trend="up"
          icon={<ClipboardList className="w-5 h-5" />}
          onClick={() => handleStatClick("tasks")}
        />

        <StatCard
          label="This Week"
          value="23"
          change={8}
          trend="up"
          icon={<Calendar className="w-5 h-5" />}
          onClick={() => handleStatClick("week")}
        />

        {/* Progress Card (2x1) */}
        <Bento2x1>
          <DashboardCard
            title="Your Progress"
            subtitle="Track your journey"
            className="h-full"
          >
            <div className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Weekly Goal</span>
                  <span className="font-medium">75%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: "75%" }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Assessments</span>
                  <span className="font-medium">3/4</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: "75%" }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </DashboardCard>
        </Bento2x1>

        {/* Recent Activity (1x1) */}
        <DashboardCard title="Recent Activity" className="h-full">
          <div className="space-y-3 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600">Activity item {i}</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Career/Goals Card (2x1) */}
        <Bento2x1>
          <DashboardCard
            title="Career Goals"
            subtitle="Your aspirations"
            className="h-full"
          >
            <div className="flex items-center gap-4 mt-4">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Software Engineer</p>
                <p className="text-sm text-gray-500">Top career match</p>
                <p className="text-sm text-purple-600 mt-1">85% match</p>
              </div>
            </div>
          </DashboardCard>
        </Bento2x1>

        {/* Quick Actions (1x1) */}
        <DashboardCard title="Quick Actions" className="h-full">
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
              New Task
            </button>
            <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
              View Calendar
            </button>
            <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
              Messages
            </button>
            <button className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
              Reports
            </button>
          </div>
        </DashboardCard>

        {/* Announcements (1x1) */}
        <DashboardCard title="Announcements" className="h-full">
          <div className="space-y-3 mt-2">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-sm font-medium text-blue-900">New Assessment</p>
              <p className="text-xs text-blue-600 mt-1">Career aptitude test available</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
              <p className="text-sm font-medium text-green-900">Congratulations!</p>
              <p className="text-xs text-green-600 mt-1">You've earned a new badge</p>
            </div>
          </div>
        </DashboardCard>
      </ResponsiveBentoGrid>

      {/* Role-specific sections (legacy support) */}
      <ShowForRoles roles={['student']}>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h2 className="font-semibold text-orange-900">Student Quick Links</h2>
          <p className="text-sm text-orange-700">View your classes, homework, and progress</p>
        </div>
      </ShowForRoles>

      <ShowForRoles roles={['teacher']}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-semibold text-blue-900">Teacher Quick Links</h2>
          <p className="text-sm text-blue-700">Manage your classes and students</p>
        </div>
      </ShowForRoles>

      <ShowForRoles roles={['admin', 'school-admin']}>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h2 className="font-semibold text-purple-900">Admin Quick Links</h2>
          <p className="text-sm text-purple-700">Manage users, settings, and reports</p>
        </div>
      </ShowForRoles>
    </div>
  );
}
