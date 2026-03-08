"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UniversalMobileSidebar, UniversalPortalHeader } from "@/components/mobile/universal-mobile-sidebar";
import { PortalErrorBoundary } from "@/components/error/portal-error-boundary";
import { UnifiedAIAssistant } from "@/components/ai/unified-ai-assistant";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette";
import { Home, Users, AlertCircle, Calendar, FileText, ClipboardList, BarChart3, BookOpen, Settings } from "lucide-react";

interface CounselorLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  portalType: "counselor";
  needsSetup?: boolean;
}

/**
 * Counselor Layout Client Component
 *
 * Handles counselor-specific layout with auth checks.
 *
 * IMPORTANT: Always render the same components to avoid hooks mismatch errors.
 * PORTAL COLOR: Purple (rgb(168, 85, 247))
 */
export function CounselorLayoutClient({ children, userName, portalType, needsSetup = false }: CounselorLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Command palette setup
  const { isOpen, close } = useCommandPalette();

  // Counselor-specific commands
  const commands = [
    { id: "dashboard", label: "Dashboard", icon: Home, shortcut: "D", action: () => router.push("/counselor/dashboard") },
    { id: "students", label: "Students", icon: Users, shortcut: "S", action: () => router.push("/counselor/students") },
    { id: "interventions", label: "Interventions", icon: AlertCircle, shortcut: "I", action: () => router.push("/counselor/interventions") },
    { id: "sessions", label: "Sessions", icon: Calendar, shortcut: "E", action: () => router.push("/counselor/sessions") },
    { id: "notes", label: "Notes", icon: FileText, shortcut: "N", action: () => router.push("/counselor/notes") },
    { id: "assessments", label: "Assessments", icon: ClipboardList, shortcut: "A", action: () => router.push("/counselor/assessments") },
    { id: "reports", label: "Reports", icon: BarChart3, shortcut: "R", action: () => router.push("/counselor/reports") },
    { id: "resources", label: "Resources", icon: BookOpen, shortcut: "O", action: () => router.push("/counselor/resources") },
    { id: "settings", label: "Settings", icon: Settings, shortcut: ",", action: () => router.push("/counselor/settings") },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If server says needs setup, redirect immediately
        if (needsSetup) {
          router.push("/setup/counselor");
          return;
        }

        const roleRes = await fetch("/api/resources/users/actions?action=get-role", {
          credentials: "include",
        });
        const roleData = await roleRes.json();

        // Check if user is counselor
        if (roleData.userType === "counselor") {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Redirect to setup if not counselor
        if (roleData.needsSetup || !roleData.userType) {
          router.push("/setup/unified");
          return;
        }

        // Wrong portal type - redirect to correct one
        if (roleData.userType && roleData.userType !== "counselor") {
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
  const portalColor = portal.counselor.primary;

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

      {/* AI Assistant - Cmd+; */}
      <UnifiedAIAssistant userName={userName} userRole="counselor" />

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
    students: "Students",
    interventions: "Interventions",
    sessions: "Sessions",
    notes: "Notes",
    assessments: "Assessments",
    reports: "Reports",
    resources: "Resources",
    settings: "Settings",
  };

  return titles[page] || page.charAt(0).toUpperCase() + page.slice(1);
}
