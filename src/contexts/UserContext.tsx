"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

/**
 * User context state interface
 */
export interface UserContextState {
  // User data
  user: UserContextUser | null;
  school: UserContextSchool | null;
  permissions: string[];
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  // Actions
  refetch: () => Promise<void>;
  clearContext: () => void;
  updateUser: (updates: Partial<UserContextUser>) => void;
}

/**
 * Minimal user type for context (reduced payload)
 */
export interface UserContextUser {
  id: string;
  clerkUserId: string;
  type: string;
  role: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  schoolId?: string;
  tenantId?: string;
  onboardingComplete?: boolean;
  isActive?: boolean;
  lastLogin?: string | null;
}

/**
 * Minimal school type for context
 */
export interface UserContextSchool {
  id: string;
  name: string;
  code: string;
  type?: string;
  logo?: string;
  city?: string;
  state?: string;
}

/**
 * API response type for user context endpoint
 */
interface UserContextResponse {
  success: boolean;
  data?: {
    user: UserContextUser;
    school?: UserContextSchool;
    permissions: string[];
  };
  error?: string;
}

// ============================================================================
// CONTEXT
// ============================================================================

const UserContext = createContext<UserContextState | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface UserProviderProps {
  children: React.ReactNode;
  /**
   * Skip auto-fetch on mount (useful for landing pages)
   * @default false
   */
  skipAutoFetch?: boolean;
}

export function UserProvider({ children, skipAutoFetch = false }: UserProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  // State
  const [user, setUser] = useState<UserContextUser | null>(null);
  const [school, setSchool] = useState<UserContextSchool | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if we've already fetched to prevent duplicate calls
  const hasFetched = useRef(false);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  /**
   * Fetch user context from API
   * Uses promise deduplication to prevent concurrent calls
   */
  const fetchContext = useCallback(async (): Promise<void> => {
    // Return existing promise if fetch is in progress
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    // Create new fetch promise
    fetchPromiseRef.current = (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/user/context", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          // Don't include credentials - Clerk handles auth via cookies
        });

        const data: UserContextResponse = await response.json();

        if (response.ok && data.success && data.data) {
          setUser(data.data.user);
          setSchool(data.data.school || null);
          setPermissions(data.data.permissions || []);
          setIsInitialized(true);
          logger.debug("User context loaded", {
            userId: data.data.user?.id,
            userType: data.data.user?.type,
          });
        } else {
          // Not authenticated or other error
          if (response.status === 401) {
            // Clear context on 401
            setUser(null);
            setSchool(null);
            setPermissions([]);
          } else {
            setError(data.error || "Failed to load user context");
            logger.warn("User context fetch failed", {
              status: response.status,
              error: data.error,
            });
          }
          setIsInitialized(true);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        logger.error("User context fetch error", err as Error);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
        fetchPromiseRef.current = null;
      }
    })();

    return fetchPromiseRef.current;
  }, []);

  /**
   * Refetch user context
   * Useful after profile updates or role changes
   */
  const refetch = useCallback(async (): Promise<void> => {
    hasFetched.current = false;
    await fetchContext();
  }, [fetchContext]);

  /**
   * Clear all context data
   * Useful after sign-out
   */
  const clearContext = useCallback(() => {
    setUser(null);
    setSchool(null);
    setPermissions([]);
    setIsInitialized(false);
    setError(null);
    hasFetched.current = false;
  }, []);

  /**
   * Update user data locally without refetching
   * Useful for optimistic updates
   */
  const updateUser = useCallback((updates: Partial<UserContextUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  // Auto-fetch on mount (once)
  useEffect(() => {
    if (hasFetched.current || skipAutoFetch) {
      return;
    }

    hasFetched.current = true;
    fetchContext();
  }, [skipAutoFetch, fetchContext]);

  // Listen for auth state changes via custom event
  useEffect(() => {
    const handleAuthChange = () => {
      // Refetch context when auth state changes
      refetch();
    };

    // Listen for Clerk auth events
    window.addEventListener("clerk:signedIn", handleAuthChange);
    window.addEventListener("clerk:signedOut", clearContext);

    return () => {
      window.removeEventListener("clerk:signedIn", handleAuthChange);
      window.removeEventListener("clerk:signedOut", clearContext);
    };
  }, [refetch, clearContext]);

  // Context value
  const value: UserContextState = {
    user,
    school,
    permissions,
    isLoading,
    isInitialized,
    error,
    refetch,
    clearContext,
    updateUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useUser hook for accessing user context
 *
 * @throws Error if used outside UserProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, school, permissions, isLoading } = useUser();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!user) return <SignInPrompt />;
 *
 *   return <div>Welcome, {user.name}!</div>;
 * }
 * ```
 */
export function useUser(): UserContextState {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  permissions: string[],
  requiredPermission: string
): boolean {
  return permissions.includes(requiredPermission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  permissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((permission) =>
    permissions.includes(permission)
  );
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  permissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every((permission) =>
    permissions.includes(permission)
  );
}

/**
 * Check if user is of a specific type
 */
export function isUserType(
  user: UserContextUser | null,
  type: string
): boolean {
  return user?.type === type;
}

/**
 * Check if user has any of the specified types
 */
export function isAnyUserType(
  user: UserContextUser | null,
  types: string[]
): boolean {
  return user ? types.includes(user.type) : false;
}

/**
 * Check if user is a platform admin
 */
export function isPlatformAdmin(user: UserContextUser | null): boolean {
  return user?.type === "admin";
}

/**
 * Check if user is a school admin
 */
export function isSchoolAdmin(user: UserContextUser | null): boolean {
  return user?.type === "school_admin";
}

/**
 * Check if user is a teacher
 */
export function isTeacher(user: UserContextUser | null): boolean {
  return user?.type === "teacher";
}

/**
 * Check if user is a student
 */
export function isStudent(user: UserContextUser | null): boolean {
  return user?.type === "student";
}

/**
 * Check if user is a parent
 */
export function isParent(user: UserContextUser | null): boolean {
  return user?.type === "parent";
}

/**
 * Check if user is a counselor
 */
export function isCounselor(user: UserContextUser | null): boolean {
  return user?.type === "counselor";
}

/**
 * Check if user is from ministry
 */
export function isMinistry(user: UserContextUser | null): boolean {
  return user?.type === "ministry";
}
