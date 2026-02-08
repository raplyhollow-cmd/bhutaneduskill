/**
 * COUNSELOR PORTAL LAYOUT
 *
 * Uses the centralized PortalSidebar for consistent navigation.
 * Counselors can manage students, generate reports, and provide guidance.
 */

import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalSidebar, PortalHeader } from "@/components/shared/portal-sidebar";
import { getPortalConfig } from "@/lib/routing-manager";

export default async function CounselorLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const portalConfig = getPortalConfig("counselor");

  return (
    <div className="min-h-screen bg-ash-grey-50">
      <PortalSidebar userType="counselor" />
      <div className="lg:pl-64">
        <PortalHeader userType="counselor" />
        <main className="p-6">
          {/* Portal Banner */}
          <div className={`mb-6 bg-gradient-to-r ${portalConfig.theme.gradient} text-white rounded-xl p-6 shadow-lg premium-card`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome to {portalConfig.name}</h1>
                <p className="text-white/90">
                  Manage students, generate reports, and provide career guidance.
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
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
