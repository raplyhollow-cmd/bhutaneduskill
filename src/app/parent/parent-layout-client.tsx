"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UniversalMobileSidebar, UniversalPortalHeader } from "@/components/mobile/universal-mobile-sidebar";
import { PortalErrorBoundary } from "@/components/error/portal-error-boundary";
import { PageTransition } from "@/components/transitions/page-transition";
import { logger } from "@/lib/logger";

interface ParentLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  portalType: "parent";
}

export function ParentLayoutClient({ children, userName, portalType }: ParentLayoutClientProps) {
  const router = useRouter();
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const checkAuth = async () => {
      try {
        const [roleRes, profileRes] = await Promise.all([
          fetch("/api/auth/set-role"),
          fetch("/api/user/profile")
        ]);

        const [roleData, profileData] = await Promise.all([
          roleRes.json(),
          profileRes.json().catch(() => ({}))
        ]);

        // Check if user is properly set up as parent
        if (roleData.needsSetup || roleData.userType !== "parent") {
          setNeedsSetup(true);
          setTimeout(() => router.push("/setup/parent"), 100);
          return;
        }

        setIsLoading(false);
      } catch (error) {
        logger.error("Parent auth check failed", error);
        setNeedsSetup(true);
        setTimeout(() => router.push("/setup/parent"), 100);
      }
    };

    checkAuth();
  }, [router]);

  // Loading state
  if (isLoading || needsSetup) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Parent Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      <UniversalMobileSidebar portalType={portalType} userName={userName} />
      <div className="lg:pl-64">
        <UniversalPortalHeader portalType={portalType} userName={userName} />
        <main className="p-6">
          <PageTransition>
            <PortalErrorBoundary portalType={portalType}>
              {children}
            </PortalErrorBoundary>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
