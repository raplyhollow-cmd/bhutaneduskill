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
        // Use unified API for role check - action as query parameter
        const roleRes = await fetch("/api/resources/users/actions?action=get-role", {
          credentials: "include",
        });
        const roleResData = await roleRes.json();

// Extract user data from response
        const userType = roleResData.data?.userType || roleResData.userType;
        const onboardingStatus = roleResData.data?.onboardingStatus || roleResData.onboardingStatus;
        const onboardingComplete = roleResData.data?.onboardingComplete;
        const userName = roleResData.data?.name || `${roleResData.data?.firstName || ""} ${roleResData.data?.lastName || ""}`.trim() || "User";

        // FIX: GUARD 0 - Check onboardingComplete explicitly (!== true handles null correctly)
        if (!userType || onboardingComplete !== true || onboardingStatus === "restricted" || onboardingStatus === "pending_approval") {
          logger.info("User needs setup", { portalType, userType, onboardingComplete, onboardingStatus });
          router.push("/setup/unified");
          return;
        }

        // GUARD 1: Onboarding Status Check
        const blockedStatuses = ["rejected", "pending_enrollment"] as const;

        if (onboardingStatus && blockedStatuses.includes(onboardingStatus as typeof blockedStatuses[number])) {
          logger.info("User blocked by onboarding status", { status: onboardingStatus, portalType });
          // Map pending_enrollment to pending-approval page
          const redirectPage = onboardingStatus === "pending_enrollment" ? "pending-approval" : onboardingStatus.replace('_', '-');
          router.push(`/${redirectPage}`);
          return;
        }

        // GUARD 2: Portal Type Cross-Check
        if (userType && userType !== portalType) {
          logger.info("User redirected to correct portal", {
            expected: portalType,
            actual: userType
          });
          router.push(`/${userType}`);
          return;
        }

        // All guards passed - user is authenticated
        setState({
          userType,
          userName,
          isLoading: false,
          isAuthenticated: true,
        });

        logger.info("User authenticated successfully", {
          portalType,
          userType
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
