"use client";

import { createContext, useContext, useState } from "react";

type ValidRole = 'student' | 'teacher' | 'parent' | 'counselor' | 'school-admin' | 'admin' | 'ministry';

interface UserContextValue {
  userType: ValidRole | null;
  userId: string | null;
  userName: string;
  schoolId: string | null;
}

const UserContext = createContext<UserContextValue>({
  userType: null,
  userId: null,
  userName: "",
  schoolId: null,
});

/**
 * User Context Provider
 *
 * Provides current user information throughout the app.
 * Used by useCurrentUser() hook and ShowForRoles component.
 */
export function UserProvider({ children, initialUser }: {
  children: React.ReactNode;
  initialUser?: Partial<UserContextValue>;
}) {
  const [user, setUser] = useState<UserContextValue>({
    userType: initialUser?.userType || null,
    userId: initialUser?.userId || null,
    userName: initialUser?.userName || "",
    schoolId: initialUser?.schoolId || null,
  });

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/**
 * Hook to access current user context
 *
 * @returns Current user information (userType, userId, userName, schoolId)
 */
export function useCurrentUser() {
  return useContext(UserContext);
}
