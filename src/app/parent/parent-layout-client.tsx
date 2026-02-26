"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UniversalMobileSidebar, UniversalPortalHeader } from "@/components/mobile/universal-mobile-sidebar";
import { PortalErrorBoundary } from "@/components/error/portal-error-boundary";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette";
import { Home, Users, BarChart3, Briefcase, ClipboardList, Bus, FileText, MessageSquare, Settings } from "lucide-react";

interface ParentLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  portalType: "parent";
  needsSetup?: boolean;
}

/**
 * Parent Layout Client Component
 *
 * Handles parent-specific layout with auth checks.
 *
 * IMPORTANT: Always render the same components to avoid hooks mismatch errors.
 * PORTAL COLOR: Gray (rgb(107, 114, 128))
 */
export function ParentLayoutClient({ children, userName, portalType, needsSetup = false }: ParentLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Command palette setup
  const { isOpen, close } = useCommandPalette();

  // Parent-specific commands
  const commands = [
    { id: "dashboard", label: "Dashboard", icon: Home, shortcut: "D", action: () => router.push("/parent/dashboard") },
    { id: "children", label: "My Children", icon: Users, shortcut: "C", action: () => router.push("/parent/children") },
    { id: "progress", label: "Progress", icon: BarChart3, shortcut: "P", action: () => router.push("/parent/progress") },
    { id: "careers", label: "Careers", icon: Briefcase, shortcut: "K", action: () => router.push("/parent/careers") },
    { id: "assessments", label: "Assessments", icon: ClipboardList, shortcut: "A", action: () => router.push("/parent/assessments") },
    { id: "transport", label: "Transport", icon: Bus, shortcut: "T", action: () => router.push("/parent/transport") },
    { id: "consent", label: "Consent", icon: FileText, shortcut: "S", action: () => router.push("/parent/consent") },
    { id: "messages", label: "Messages", icon: MessageSquare, shortcut: "M", action: () => router.push("/parent/messages") },
    { id: "settings", label: "Settings", icon: Settings, shortcut: ",", action: () => router.push("/parent/settings") },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If server says needs setup, redirect immediately
        if (needsSetup) {
          router.push("/setup/parent");
          return;
        }

        const roleRes = await fetch("/api/auth/set-role");
        const roleData = await roleRes.json();

        // Check if user is parent
        if (roleData.userType === "parent") {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Redirect to setup if not parent
        if (roleData.needsSetup || !roleData.userType) {
          router.push("/setup/unified");
          return;
        }

        // Wrong portal type - redirect to correct one
        if (roleData.userType && roleData.userType !== "parent") {
          router.push(`/${roleData.userType}`);
          return;
        }
      } catch (error) {
        console.error("Auth check failed, redirecting to setup");
        router.push("/setup/unified");
      }
    };

    checkAuth();
  }, [router, needsSetup, pathname]);

  // Portal-specific color for loading spinner
  const portalColor = portal.parent.primary;

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
    children: "My Children",
    progress: "Progress",
    careers: "Careers",
    assessments: "Assessments",
    transport: "Transport",
    consent: "Consent",
    messages: "Messages",
  };

  return titles[page] || page.charAt(0).toUpperCase() + page.slice(1);
}
