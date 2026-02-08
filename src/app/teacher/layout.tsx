/**
 * TEACHER PORTAL LAYOUT
 *
 * Uses the centralized PortalSidebar for consistent navigation.
 * Teachers can manage classes, view student progress, assign assessments.
 */

import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalSidebar, PortalHeader } from "@/components/shared/portal-sidebar";
import { getPortalConfig } from "@/lib/routing-manager";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const portalConfig = getPortalConfig("teacher");

  return (
    <div className="min-h-screen bg-ash-grey-50">
      <PortalSidebar userType="teacher" />
      <div className="lg:pl-64">
        <PortalHeader userType="teacher" />
        <main className="p-6">
          {/* Portal Banner */}
          <div className={`mb-6 bg-gradient-to-r ${portalConfig.theme.gradient} text-white rounded-xl p-6 shadow-lg premium-card`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome to {portalConfig.name}</h1>
                <p className="text-white/90">
                  Manage your classes, track student progress, and provide career guidance.
                </p>
              </div>
              <div className="hidden md:block">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-16 h-16 text-white/80"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
