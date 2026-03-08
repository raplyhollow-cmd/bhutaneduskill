"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UniversalMobileSidebar, UniversalPortalHeader } from "@/components/mobile/universal-mobile-sidebar";
import { PortalErrorBoundary } from "@/components/error/portal-error-boundary";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette";
import { Home, Building2, BarChart3, Bell, DollarSign, FileText, Users, Settings } from "lucide-react";

interface MinistryLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  portalType: "ministry";
  needsSetup?: boolean;
}

/**
 * Ministry Layout Client Component
 *
 * Handles ministry-specific layout with auth checks.
 *
 * IMPORTANT: Always render the same components to avoid hooks mismatch errors.
 * PORTAL COLOR: Teal (rgb(20, 184, 166))
 */
export function MinistryLayoutClient({ children, userName, portalType, needsSetup = false }: MinistryLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Command palette setup
  const { isOpen, close } = useCommandPalette();

  // Ministry-specific commands
  const commands = [
    { id: "dashboard", label: "Dashboard", icon: Home, shortcut: "D", action: () => router.push("/ministry") },
    { id: "schools", label: "Schools", icon: Building2, shortcut: "S", action: () => router.push("/ministry/schools") },
    { id: "analytics", label: "National Analytics", icon: BarChart3, shortcut: "A", action: () => router.push("/ministry/analytics") },
    { id: "notifications", label: "Notifications", icon: Bell, shortcut: "N", action: () => router.push("/ministry/notifications") },
    { id: "billing", label: "Billing Overview", icon: DollarSign, shortcut: "B", action: () => router.push("/ministry/billing") },
    { id: "policies", label: "Policies", icon: FileText, shortcut: "P", action: () => router.push("/ministry/policies") },
    { id: "users", label: "Users", icon: Users, shortcut: "U", action: () => router.push("/ministry/users") },
    { id: "settings", label: "Settings", icon: Settings, shortcut: ",", action: () => router.push("/ministry/settings") },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If server says needs setup, redirect immediately
        if (needsSetup) {
          router.push("/setup/ministry");
          return;
        }

        const roleRes = await fetch("/api/resources/users/actions?action=get-role", {
          credentials: "include",
        });
        const roleData = await roleRes.json();

        // Check if user is ministry
        if (roleData.userType === "ministry") {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Redirect to setup if not ministry
        if (roleData.needsSetup || !roleData.userType) {
          router.push("/setup/ministry");
          return;
        }

        // Wrong portal type - redirect to correct one
        if (roleData.userType && roleData.userType !== "ministry") {
          router.push(`/${roleData.userType}`);
          return;
        }
      } catch (error) {
        console.error("Auth check failed, redirecting to setup");
        router.push("/setup/ministry");
      }
    };

    checkAuth();
  }, [router, needsSetup, pathname]);

  // Portal-specific color for loading spinner
  const portalColor = portal.ministry.primary;

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Always render to ensure consistent hook count */}
      <UniversalMobileSidebar portalType={portalType} userName={userName} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isOpen}
        onClose={close}
        commands={commands}
        placeholder="Search or type a command..."
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: portalColor, borderTopColor: 'transparent' }} />
        </div>
      )}

      {/* ALWAYS render the same structure */}
      <div className="lg:pl-64 pb-16 lg:pb-0">
        <UniversalPortalHeader
          portalType={portalType}
          userName={userName}
          title={getPageTitle(pathname)}
        />
        <main className={cn(
          "p-4 sm:p-6",
          "min-h-[calc(100dvh-64px)]"
        )}>
          <PortalErrorBoundary portalType={portalType}>
            {!isAuthenticated ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Verifying your account...</p>
              </div>
            ) : (
              children
            )}
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
    schools: "Schools",
    analytics: "National Analytics",
    gnh: "GNH Dashboard",
    "labor-market": "Labor Market",
    "teacher-resources": "Teacher Resources",
    infrastructure: "Infrastructure",
    policies: "Policies",
    notifications: "Notifications",
    emis: "EMIS Sync",
    billing: "Billing Overview",
    reports: "Reports",
    users: "Users",
    settings: "Settings",
  };

  return titles[page] || page.charAt(0).toUpperCase() + page.slice(1);
}
