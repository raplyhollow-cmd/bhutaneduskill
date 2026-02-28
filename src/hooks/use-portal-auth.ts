"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { logger } from "@/lib/logger";

interface PortalAuthState {
  userType: string | null;
  userName: string;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Circuit Breaker: Auth Hook
 *
 * Three security guards for portal access:
 * 1. Onboarding Status → Redirect (restricted/pending_approval/rejected)
 * 2. Portal Cross-Check → Redirect to correct portal
 * 3. Setup Guard → Redirect to /setup/unified
 *
 * @param portalType - The expected portal type (e.g., 'student', 'admin')
 * @returns Auth state with loading flag and authentication status
 *
 * @example
 * const { userName, isLoading, isAuthenticated } = usePortalAuth('student');
 */
export function usePortalAuth(portalType: string): PortalAuthState {
  const router = useRouter();
  const [state, setState] = useState<PortalAuthState>({
    userType: null,
    userName: "",
    isLoading: true,
    isAuthenticated: false,
  });
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const checkAuth = async () => {
      try {
        // Parallel fetch for performance
        const [roleRes, profileRes] = await Promise.all([
          fetch("/api/auth/set-role"),
          fetch("/api/user/profile").catch(() => ({ ok: false, json: async () => ({ needsSetup: true, profile: null }) }))
        ]);

        const roleData = await roleRes.json();
        const profileData = await profileRes.json();

        // GUARD 0: Profile API indicates needsSetup (new user in Clerk, not in DB)
        if (profileData.needsSetup || !profileData.profile) {
          logger.info("User needs setup (no profile in DB)", { portalType });
          router.push("/setup/unified");
          return;
        }

        // GUARD 1: Onboarding Status Check
        const status = profileData?.profile?.onboardingStatus;
        const blockedStatuses = ["restricted", "rejected", "pending_approval", "pending_enrollment"] as const;

        if (status && blockedStatuses.includes(status as typeof blockedStatuses[number])) {
          logger.info("User blocked by onboarding status", { status, portalType });
          // Map pending_enrollment to pending-approval page
          const redirectPage = status === "pending_enrollment" ? "pending-approval" : status.replace('_', '-');
          router.push(`/${redirectPage}`);
          return;
        }

        // GUARD 2: Portal Type Cross-Check
        if (roleData.userType && roleData.userType !== portalType) {
          logger.info("User redirected to correct portal", {
            expected: portalType,
            actual: roleData.userType
          });
          router.push(`/${roleData.userType}`);
          return;
        }

        // GUARD 3: Setup Required
        if (roleData.needsSetup || !roleData.userType) {
          logger.info("User needs setup", { portalType, needsSetup: roleData.needsSetup });
          router.push("/setup/unified");
          return;
        }

        // All guards passed - user is authenticated
        const userName = `${profileData?.profile?.firstName || ""} ${profileData?.profile?.lastName || ""}`.trim();

        setState({
          userType: roleData.userType,
          userName: userName || "User",
          isLoading: false,
          isAuthenticated: true,
        });

        logger.info("User authenticated successfully", {
          portalType,
          userType: roleData.userType
        });

      } catch (error) {
        logger.error("Auth check failed, redirecting to setup", error);
        router.push("/setup/unified");
      }
    };

    checkAuth();
  }, [router, portalType]);

  return state;
}
