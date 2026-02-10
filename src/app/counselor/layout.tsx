/**
 * COUNSELOR PORTAL LAYOUT
 *
 * For counselors to manage students, generate reports, and provide guidance.
 * Uses the centralized PortalSidebar for consistent navigation.
 */

import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalSidebar, PortalHeader } from "@/components/shared/portal-sidebar";

export default async function CounselorLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Counselor portal uses purple gradient
  const bannerStyle = {
    background: 'linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalSidebar userType="counselor" />
      <div className="lg:pl-64">
        <PortalHeader userType="counselor" />
        <main className="p-6">
          {/* Portal Banner */}
          <div className="mb-6 text-white rounded-xl p-6 shadow-lg premium-card" style={bannerStyle}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome to Counselor Portal</h1>
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
