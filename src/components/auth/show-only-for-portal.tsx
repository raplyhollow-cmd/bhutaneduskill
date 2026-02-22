"use client";

import { usePathname } from "next/navigation";

type PortalType = 'student' | 'teacher' | 'parent' | 'counselor' | 'admin' | 'school-admin' | 'ministry';

interface ShowOnlyForPortalProps {
  portal: PortalType;
  children: React.ReactNode;
}

export function ShowOnlyForPortal({ portal, children }: ShowOnlyForPortalProps) {
  const pathname = usePathname();
  const currentPortal = pathname.split('/')[1];
  if (currentPortal !== portal) return null;
  return <>{children}</>;
}
