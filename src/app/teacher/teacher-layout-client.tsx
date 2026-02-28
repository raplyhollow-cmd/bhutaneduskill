"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UniversalMobileSidebar, UniversalPortalHeader } from "@/components/mobile/universal-mobile-sidebar";
import { PortalErrorBoundary } from "@/components/error/portal-error-boundary";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";
import { CommandPalette, useCommandPalette, createNavigationCommands, createQuickActionsCommands } from "@/components/ui/command-palette";
import { Home, Users, ClipboardList, BookOpen, Calendar, BarChart3, Settings, MessageSquare, Link as LinkIcon, CheckCircle } from "lucide-react";

interface TeacherLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  portalType: "teacher";
  needsSetup?: boolean;
  isPendingApproval?: boolean;
}

/**
 * Teacher Layout Client Component
 *
 * Handles teacher-specific layout with auth checks.
 *
 * IMPORTANT: Always render the same components to avoid hooks mismatch errors.
 * PORTAL COLOR: Blue (rgb(59, 130, 246))
 */
export function TeacherLayoutClient({ children, userName, portalType, needsSetup = false, isPendingApproval = false }: TeacherLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Command palette setup
  const { isOpen, close } = useCommandPalette();

  // Create portal-specific commands
  const commands = [
    ...createNavigationCommands(router),
    {
      id: "classes",
      label: "My Classes",
      icon: BookOpen,
      shortcut: "C",
      action: () => router.push("/teacher/classes"),
    },
    {
      id: "students",
      label: "Students",
      icon: Users,
      shortcut: "S",
      action: () => router.push("/teacher/students"),
    },
    {
      id: "approvals",
      label: "Approvals",
      icon: CheckCircle,
      shortcut: "A",
      action: () => router.push("/teacher/approvals"),
    },
    {
      id: "homework",
      label: "Homework",
      icon: ClipboardList,
      shortcut: "H",
      action: () => router.push("/teacher/homework"),
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: ClipboardList,
      shortcut: "T",
      action: () => router.push("/teacher/attendance"),
    },
    {
      id: "assessments",
      label: "Assessments",
      icon: ClipboardList,
      shortcut: "K",
      action: () => router.push("/teacher/assessments"),
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      shortcut: "R",
      action: () => router.push("/teacher/reports"),
    },
    {
      id: "schedule",
      label: "Schedule",
      icon: Calendar,
      shortcut: "D",
      action: () => router.push("/teacher/schedule"),
    },
    {
      id: "messages",
      label: "Messages",
      icon: MessageSquare,
      shortcut: "M",
      action: () => router.push("/teacher/messages"),
    },
    {
      id: "live-sessions",
      label: "Live Sessions",
      icon: LinkIcon,
      action: () => router.push("/teacher/live-sessions"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      shortcut: ",",
      action: () => router.push("/teacher/settings"),
    },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If server says needs setup, redirect immediately
        if (needsSetup) {
          router.push("/setup/teacher");
          return;
        }

        // If pending approval, redirect to pending approval page
        if (isPendingApproval && !pathname.includes("pending-approval")) {
          router.push("/pending-approval");
          return;
        }

        const roleRes = await fetch("/api/auth/set-role");
        const roleData = await roleRes.json();

        // Check if user is teacher
        if (roleData.userType === "teacher") {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Redirect to setup if not teacher
        if (roleData.needsSetup || !roleData.userType) {
          router.push("/setup/unified");
          return;
        }

        // Wrong portal type - redirect to correct one
        if (roleData.userType && roleData.userType !== "teacher") {
          router.push(`/${roleData.userType}`);
          return;
        }
      } catch (error) {
        console.error("Auth check failed, redirecting to setup");
        router.push("/setup/unified");
      }
    };

    checkAuth();
  }, [router, needsSetup, isPendingApproval, pathname]);

  // Portal-specific color for loading spinner
  const portalColor = portal.teacher.primary;

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
    classes: "My Classes",
    students: "Students",
    homework: "Homework",
    learning: "Learning",
    attendance: "Attendance",
    assessments: "Assessments",
    reports: "Reports",
    schedule: "Schedule",
    "live-sessions": "Live Sessions",
    leave: "Leave",
    settings: "Settings",
  };

  return titles[page] || page.charAt(0).toUpperCase() + page.slice(1);
}
