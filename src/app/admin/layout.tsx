/**
 * PLATFORM ADMIN PORTAL LAYOUT
 *
 * For platform administrators to manage multi-tenant operations.
 * Uses the centralized PortalSidebar for consistent navigation.
 */

import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalSidebar, PortalHeader } from "@/components/shared/portal-sidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Admin portal uses pink gradient
  const bannerStyle = {
    background: 'linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalSidebar userType="admin" />
      <div className="lg:pl-64">
        <PortalHeader userType="admin" />
        <main className="p-6">
          {/* Portal Banner */}
          <div className="mb-6 text-white rounded-xl p-6 shadow-lg premium-card" style={bannerStyle}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome to Admin Portal</h1>
                <p className="text-white/90">
                  Manage the entire platform - schools, users, analytics, and settings.
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
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
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
