"use client";

import { useEffect, useState } from "react";
import { UniversalMobileSidebar, UniversalPortalHeader } from "@/components/mobile/universal-mobile-sidebar";
import { usePortalAuth } from "@/hooks/use-portal-auth";
import { ShowOnlyForPortal } from "@/components/auth/show-only-for-portal";
import { PortalErrorBoundary } from "@/components/error/portal-error-boundary";
import { AssessmentOnboardingModal } from "@/components/student/assessment-onboarding-modal";
import { PageTransition } from "@/components/transitions/page-transition";

/**
 * Unified Portal Layout (Client Component)
 *
 * Replaces 7 separate layouts with one circuit.
 * All portal behavior via: usePortalAuth + portal-config.ts + ShowOnlyForPortal
 *
 * Portal Types: student, teacher, parent, counselor, admin, school-admin, ministry
 */
export function UnifiedPortalLayoutClient({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ portal: string }>;
}) {
  const [portal, setPortal] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  // Await params promise (Next.js 15 requirement)
  useEffect(() => {
    const loadParams = async () => {
      try {
        const p = await params;
        setPortal(p.portal);
      } catch {
        // If params fails, redirect to setup
        window.location.href = "/setup/unified";
      }
    };
    loadParams();
  }, [params]);

  const auth = usePortalAuth(portal);

  useEffect(() => {
    if (!auth.isLoading && auth.userName) {
      setUserName(auth.userName);
    }
  }, [auth]);

  // Loading state with portal-specific color
  if (auth.isLoading || !portal) {
    const colors: Record<string, string> = {
      student: "border-orange-500",
      teacher: "border-blue-500",
      parent: "border-gray-500",
      counselor: "border-purple-500",
      admin: "border-pink-500",
      "school-admin": "border-indigo-500",
      ministry: "border-violet-500",
    };

    const borderColor = colors[portal] || "border-indigo-500";

    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <div className={`w-8 h-8 border-4 ${borderColor} border-t-transparent rounded-full animate-spin`} />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <UniversalMobileSidebar portalType={portal as any} userName={userName} />
      <div className="lg:pl-64">
        <UniversalPortalHeader portalType={portal as any} userName={userName} />
        <main className="p-6">
          <PageTransition>
            <PortalErrorBoundary portalType={portal}>
              {children}
            </PortalErrorBoundary>
          </PageTransition>
        </main>
      </div>

      {/* Portal-Specific Modals */}
      <ShowOnlyForPortal portal="student">
        <AssessmentOnboardingModal
          isOpen={false}
          onClose={() => {}}
          onComplete={() => {}}
        />
      </ShowOnlyForPortal>
    </div>
  );
}
