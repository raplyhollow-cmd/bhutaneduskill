/**
 * SCHOOL ADMIN PORTAL LAYOUT
 *
 * For school principals/admins to manage their school:
 * - Students, teachers, classes
 * - Attendance, fees, results
 * - Counselor assignments
 */

import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalSidebar, PortalHeader } from "@/components/shared/portal-sidebar";
import { getPortalConfig } from "@/lib/routing-manager";

export default async function SchoolAdminLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const portalConfig = getPortalConfig("school-admin");

  return (
    <div className="min-h-screen bg-ash-grey-50">
      <PortalSidebar userType="school-admin" />
      <div className="lg:pl-64">
        <PortalHeader userType="school-admin" />
        <main className="p-6">
          {/* Portal Banner */}
          <div className={`mb-6 bg-gradient-to-r ${portalConfig.theme.gradient} text-white rounded-xl p-6 shadow-lg premium-card`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome to {portalConfig.name}</h1>
                <p className="text-white/90">
                  Manage your school, students, teachers, and track progress all in one place.
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
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4 8 4v14" />
                  <path d="M8 9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2H8V9z" />
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
