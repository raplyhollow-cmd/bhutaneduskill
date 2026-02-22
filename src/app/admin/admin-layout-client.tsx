"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UniversalMobileSidebar, UniversalPortalHeader } from "@/components/mobile/universal-mobile-sidebar";
import { PortalErrorBoundary } from "@/components/error/portal-error-boundary";
import { cn } from "@/lib/utils";

interface AdminLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  portalType: "admin";
}

/**
 * Admin Layout Client Component
 *
 * Handles admin-specific layout without the Promise wrapper issues.
 * Checks auth and redirects if not authenticated.
 * Now with ceramic design system styling.
 */
export function AdminLayoutClient({ children, userName, portalType }: AdminLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const roleRes = await fetch("/api/auth/set-role");
        const roleData = await roleRes.json();

        // Check if user is admin
        if (roleData.userType === "admin") {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Redirect to setup if not admin
        if (roleData.needsSetup || !roleData.userType) {
          router.push("/setup/unified");
          return;
        }

        // Wrong portal type - redirect to correct one
        if (roleData.userType && roleData.userType !== "admin") {
          router.push(`/${roleData.userType}`);
          return;
        }
      } catch (error) {
        console.error("Auth check failed, redirecting to setup");
        router.push("/setup/unified");
      }
    };

    checkAuth();
  }, [router]);

  // Loading state - ceramic styled
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-ceramic-gray-50">
        <div className="w-8 h-8 border-4 border-ceramic-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-ceramic-bg">
      <UniversalMobileSidebar portalType={portalType} userName={userName} />
      <div className="lg:pl-64">
        <UniversalPortalHeader
          portalType={portalType}
          userName={userName}
          title={getPageTitle(pathname)}
        />
        <main className={cn(
          "p-6",
          "min-h-[calc(100dvh-64px)]" // Account for fixed header
        )}>
          <PortalErrorBoundary portalType={portalType}>
            {children}
          </PortalErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return "Dashboard";

  const page = segments[1];
  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    "command-center": "Command Center",
    schools: "Schools",
    users: "Users",
    "school-admin-applications": "School Admin Applications",
    careers: "Careers",
    colleges: "Colleges",
    programs: "Programs",
    scholarships: "Scholarships",
    content: "Content Management",
    knowledge: "Knowledge Management",
    notifications: "Notifications",
    analytics: "Analytics",
    reports: "Reports",
    settings: "Settings",
    "system-status": "System Status",
    roles: "Roles",
    permissions: "Permissions",
  };

  return titles[page] || page.charAt(0).toUpperCase() + page.slice(1);
}
