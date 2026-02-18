"use client";

import { logger } from "@/lib/logger";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UniversalMobileSidebar, UniversalPortalHeader } from "@/components/mobile/universal-mobile-sidebar";
import { AssessmentOnboardingModal } from "@/components/student/assessment-onboarding-modal";

/**
 * Student Portal Layout
 *
 * Uses the Universal Mobile Template for consistent mobile UX across all portals.
 * - Mobile: Hamburger menu with slide-in sidebar
 * - Desktop: Always-visible sidebar
 * - NO bottom navigation (removed as per user decision)
 *
 * To change mobile behavior, edit: src/config/portal-config.ts
 */
export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userType, setUserType] = useState<"student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin" | "ministry" | null>(null);
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const hasFetched = useRef(false);
  const hasCheckedOnboarding = useRef(false);

  useEffect(() => {
    // Prevent multiple simultaneous fetch calls
    if (hasFetched.current) return;
    hasFetched.current = true;

    Promise.all([
      fetch("/api/auth/set-role"),
      fetch("/api/user/profile")
    ])
      .then(([roleRes, profileRes]) => Promise.all([roleRes.json(), profileRes.json()]))
      .then(([roleData, profileData]) => {
        // Portal type validation: redirect non-students to their correct portal
        if (roleData.userType && roleData.userType !== 'student') {
          const portalMap: Record<string, string> = {
            teacher: '/teacher',
            parent: '/parent',
            counselor: '/counselor',
            'school-admin': '/school-admin',
            admin: '/admin',
            ministry: '/ministry',
          };
          router.push(portalMap[roleData.userType] || '/dashboard');
          return;
        }

        // Check if user needs setup
        if (roleData.needsSetup || !roleData.userType) {
          router.push("/setup/unified");
          return;
        }

        // Set user type and name
        setUserType(roleData.userType || "student");
        if (profileData?.profile) {
          setUserName(`${profileData.profile.firstName} ${profileData.profile.lastName || ""}`.trim());
        } else {
          setUserName("Student");
        }
        setIsLoading(false);

        // Check if student needs assessment onboarding (after user is loaded)
        checkAssessmentOnboarding();
      })
      .catch((error) => {
        logger.error("API fetch failed:", error);
        // If API fails, redirect to setup to ensure user is properly configured
        router.push("/setup/unified");
      });
  }, [router]);

  // Check if student needs assessment onboarding
  const checkAssessmentOnboarding = async () => {
    if (hasCheckedOnboarding.current) return;
    hasCheckedOnboarding.current = true;

    try {
      const response = await fetch("/api/student/onboarding/status");
      if (response.ok) {
        const data = await response.json();
        // Show modal only for first-time students (haven't completed required assessments)
        if (data.isFirstTime) {
          setShowAssessmentModal(true);
        }
      }
    } catch (error) {
      logger.error("Failed to check assessment onboarding status", error);
    }
  };

  // Loading state - Uses 100dvh to fix iOS Safari address bar bug
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Main layout - Uses 100dvh for proper mobile viewport height
  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Universal Sidebar - Works for ALL portals */}
      <UniversalMobileSidebar portalType={userType || "student"} userName={userName} />

      {/* Main content area with desktop padding for sidebar */}
      <div className="lg:pl-64">
        <UniversalPortalHeader portalType={userType || "student"} userName={userName} />
        <main className="p-6">{children}</main>
      </div>

      {/* Assessment Onboarding Modal - Shows for new students */}
      <AssessmentOnboardingModal
        isOpen={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
        onComplete={() => {
          setShowAssessmentModal(false);
          // Optionally refresh the page to show updated dashboard
          router.refresh();
        }}
      />
    </div>
  );
}
