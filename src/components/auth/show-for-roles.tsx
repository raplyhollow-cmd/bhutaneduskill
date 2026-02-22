"use client";

import { useCurrentUser } from "@/hooks/use-current-user";

type ValidRole = 'student' | 'teacher' | 'parent' | 'counselor' | 'school-admin' | 'admin' | 'ministry';

interface ShowForRolesProps {
  roles: ValidRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ShowForRoles({ roles, children, fallback = null }: ShowForRolesProps) {
  const { userType } = useCurrentUser();
  if (!userType || !roles.includes(userType as ValidRole)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}

interface HideFromRolesProps {
  roles: ValidRole[];
  children: React.ReactNode;
}

export function HideFromRoles({ roles, children }: HideFromRolesProps) {
  const { userType } = useCurrentUser();
  if (userType && roles.includes(userType as ValidRole)) return null;
  return <>{children}</>;
}
