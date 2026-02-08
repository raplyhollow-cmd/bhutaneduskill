/**
 * PARENT PORTAL LAYOUT
 *
 * Uses the centralized PortalSidebar for consistent navigation.
 * Parents can monitor their child's progress and career exploration.
 */

import { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PortalSidebar, PortalHeader } from "@/components/shared/portal-sidebar";
import { getPortalConfig } from "@/lib/routing-manager";

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const portalConfig = getPortalConfig("parent");

  return (
    <div className="min-h-screen bg-ash-grey-50">
      <PortalSidebar userType="parent" />
      <div className="lg:pl-64">
        <PortalHeader userType="parent" />
        <main className="p-6">
          {/* Portal Banner */}
          <div className={`mb-6 bg-gradient-to-r ${portalConfig.theme.gradient} text-white rounded-xl p-6 shadow-lg premium-card`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome to {portalConfig.name}</h1>
                <p className="text-white/90">
                  Monitor your child's career exploration and academic progress.
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
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
