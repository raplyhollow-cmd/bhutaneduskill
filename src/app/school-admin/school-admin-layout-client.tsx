"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UniversalMobileSidebar, UniversalPortalHeader } from "@/components/mobile/universal-mobile-sidebar";
import { PortalErrorBoundary } from "@/components/error/portal-error-boundary";
import { UnifiedAIAssistant } from "@/components/ai/unified-ai-assistant";
import { SetupGuard } from "@/components/school-admin/setup-guard";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette";
import { Home, Users, Clock, GraduationCap, UserCheck, BookOpen, Calendar, CheckCircle, ClipboardList, BarChart3, Briefcase, Award, Bus, Package, MessageSquare, Megaphone, Settings } from "lucide-react";

interface SchoolAdminLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  portalType: "school-admin";
  needsSetup?: boolean;
  isPendingApproval?: boolean;
  schoolId?: string | null;
}

/**
 * School Admin Layout Client Component
 *
 * Handles school-admin-specific layout with auth checks.
 *
 * IMPORTANT: Always render the same components to avoid hooks mismatch errors.
 * The auth check and loading states are handled internally, not by early returns.
 * PORTAL COLOR: Violet (rgb(139, 92, 246))
 */
export function SchoolAdminLayoutClient({ children, userName, portalType, needsSetup = false, isPendingApproval = false, schoolId }: SchoolAdminLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Command palette setup
  const { isOpen, close } = useCommandPalette();

  // School Admin-specific commands
  const commands = [
    { id: "dashboard", label: "Dashboard", icon: Home, shortcut: "D", action: () => router.push("/school-admin/dashboard") },
    { id: "students", label: "Students", icon: Users, shortcut: "S", action: () => router.push("/school-admin/students") },
    { id: "pending-students", label: "Pending Students", icon: Clock, shortcut: "P", action: () => router.push("/school-admin/students/pending") },
    { id: "teachers", label: "Teachers", icon: GraduationCap, shortcut: "T", action: () => router.push("/school-admin/teachers") },
    { id: "pending-teachers", label: "Pending Teachers", icon: UserCheck, shortcut: "O", action: () => router.push("/school-admin/teachers/pending") },
    { id: "classes", label: "Classes", icon: BookOpen, shortcut: "C", action: () => router.push("/school-admin/classes") },
    { id: "subjects", label: "Subjects", icon: BookOpen, shortcut: "U", action: () => router.push("/school-admin/subjects") },
    { id: "timetable", label: "Timetable", icon: Calendar, shortcut: "M", action: () => router.push("/school-admin/timetable") },
    { id: "attendance", label: "Attendance", icon: CheckCircle, shortcut: "A", action: () => router.push("/school-admin/attendance") },
    { id: "homework", label: "Homework", icon: ClipboardList, shortcut: "H", action: () => router.push("/school-admin/homework") },
    { id: "results", label: "Results", icon: BarChart3, shortcut: "R", action: () => router.push("/school-admin/results") },
    { id: "fees", label: "Fees", icon: Briefcase, shortcut: "F", action: () => router.push("/school-admin/fees") },
    { id: "tuition", label: "Tuition", icon: Award, shortcut: "I", action: () => router.push("/school-admin/tuition") },
    { id: "transport", label: "Transport", icon: Bus, shortcut: "B", action: () => router.push("/school-admin/transport") },
    { id: "inventory", label: "Inventory", icon: Package, shortcut: "V", action: () => router.push("/school-admin/inventory") },
    { id: "counselors", label: "Counselors", icon: MessageSquare, shortcut: "L", action: () => router.push("/school-admin/counselors") },
    { id: "announcements", label: "Announcements", icon: Megaphone, shortcut: "N", action: () => router.push("/school-admin/announcements") },
    { id: "reports", label: "Reports", icon: BarChart3, shortcut: "E", action: () => router.push("/school-admin/reports") },
    { id: "analytics", label: "Analytics", icon: BarChart3, shortcut: "Y", action: () => router.push("/school-admin/analytics") },
    { id: "settings", label: "Settings", icon: Settings, shortcut: ",", action: () => router.push("/school-admin/settings") },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // NOTE: Middleware now handles pending approval and setup redirects
        // This just verifies auth and sets loading state
        const profileRes = await fetch("/api/user/profile");
        if (profileRes.ok) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Always call hooks at the top level - no early returns that skip components!
  // This ensures the same number of hooks are called on every render.

  // Portal-specific color for loading spinner
  const portalColor = portal.schoolAdmin.primary;

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Always render UniversalMobileSidebar to ensure consistent hook count */}
      <UniversalMobileSidebar portalType={portalType} userName={userName} />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isOpen}
        onClose={close}
        commands={commands}
        placeholder="Search or type a command..."
      />

      {/* AI Assistant - Cmd+; */}
      <UnifiedAIAssistant userName={userName} userRole="school-admin" />

      {/* Loading overlay - shown conditionally but components are always rendered */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: portalColor, borderTopColor: 'transparent' }} />
        </div>
      )}

      {/* ALWAYS render the same structure - only visibility changes */}
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
            {/* SetupGuard checks if school setup is complete and shows wizard if needed */}
            <SetupGuard schoolId={schoolId || null}>
              {/* ALWAYS render children to avoid hooks mismatch - use visibility to hide */}
              <div style={{ visibility: !isAuthenticated ? "hidden" : "visible" }}>
                {children}
              </div>
              {!isAuthenticated && (
                <div className="flex items-center justify-center h-64">
                  <p className="text-gray-500">Verifying your account...</p>
                </div>
              )}
            </SetupGuard>
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
    teachers: "Teachers",
    counselors: "Counselors",
    classes: "Classes",
    subjects: "Subjects",
    timetable: "Timetable",
    attendance: "Attendance",
    homework: "Homework",
    results: "Results",
    fees: "Fees",
    tuition: "Tuition",
    transport: "Transport",
    inventory: "Inventory",
    announcements: "Announcements",
    reports: "Reports",
    analytics: "Analytics",
    settings: "Settings",
  };

  return titles[page] || page.charAt(0).toUpperCase() + page.slice(1);
}
