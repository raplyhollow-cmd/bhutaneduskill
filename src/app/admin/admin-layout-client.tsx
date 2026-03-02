"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UniversalMobileSidebar, UniversalPortalHeader } from "@/components/mobile/universal-mobile-sidebar";
import { PortalErrorBoundary } from "@/components/error/portal-error-boundary";
import { CommandPalette, useCommandPalette, type CommandItem } from "@/components/ui/command-palette";
import { UnifiedAIAssistant } from "@/components/ai/unified-ai-assistant";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  GraduationCap,
  School,
  Settings,
  FileText,
  Bell,
  BarChart3,
} from "lucide-react";

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
 *
 * IMPORTANT: Always render the same components to avoid hooks mismatch errors.
 * PORTAL COLOR: Pink (rgb(236, 72, 153))
 */
export function AdminLayoutClient({ children, userName, portalType }: AdminLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Command Palette
  const { isOpen: isCommandPaletteOpen, close: closeCommandPalette } = useCommandPalette();

  // Admin-specific commands
  const adminCommands: CommandItem[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: LayoutDashboard,
      shortcut: "G D",
      keywords: ["home", "main"],
      action: () => router.push("/admin/dashboard"),
    },
    {
      id: "schools",
      label: "Manage Schools",
      icon: Building2,
      shortcut: "G S",
      keywords: ["institutions", "education"],
      action: () => router.push("/admin/schools"),
    },
    {
      id: "users",
      label: "Manage Users",
      icon: Users,
      shortcut: "G U",
      keywords: ["people", "accounts"],
      action: () => router.push("/admin/users"),
    },
    {
      id: "subjects",
      label: "Global Subjects",
      icon: BookOpen,
      shortcut: "G B",
      keywords: ["courses", "curriculum"],
      action: () => router.push("/admin/subjects"),
    },
    {
      id: "careers",
      label: "Manage Careers",
      icon: GraduationCap,
      shortcut: "G C",
      keywords: ["jobs", "pathways"],
      action: () => router.push("/admin/careers"),
    },
    {
      id: "colleges",
      label: "Manage Colleges",
      icon: School,
      shortcut: "G L",
      keywords: ["universities", "higher-ed"],
      action: () => router.push("/admin/colleges"),
    },
    {
      id: "scholarships",
      label: "Manage Scholarships",
      icon: FileText,
      shortcut: "G H",
      keywords: ["financial-aid", "grants"],
      action: () => router.push("/admin/scholarships"),
    },
    {
      id: "notifications",
      label: "Send Notifications",
      icon: Bell,
      shortcut: "G N",
      keywords: ["alerts", "announcements"],
      action: () => router.push("/admin/notifications"),
    },
    {
      id: "analytics",
      label: "View Analytics",
      icon: BarChart3,
      shortcut: "G A",
      keywords: ["stats", "metrics", "reports"],
      action: () => router.push("/admin/analytics"),
    },
    {
      id: "settings",
      label: "Platform Settings",
      icon: Settings,
      shortcut: "G ,",
      keywords: ["config", "preferences"],
      action: () => router.push("/admin/settings"),
    },
  ];

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
  }, [pathname]);

  // Portal-specific color for loading spinner
  const portalColor = portal.admin.primary;

  return (
    <div className="min-h-[100dvh] bg-gray-50">
      {/* Always render the same components */}
      <UniversalMobileSidebar portalType={portalType} userName={userName} />

      {/* Command Palette - Cmd+K */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={closeCommandPalette}
        commands={adminCommands}
        placeholder="Type a command or search..."
      />

      {/* AI Assistant - Cmd+; */}
      <UnifiedAIAssistant userName={userName} userRole="admin" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: portalColor, borderTopColor: 'transparent' }} />
        </div>
      )}

      {/* Always render the main structure */}
      {/* Header - extends full viewport width, button at true top-right */}
      <UniversalPortalHeader
        portalType={portalType}
        userName={userName}
        title={getPageTitle(pathname)}
      />
      {/* Main content with sidebar padding */}
      <div className="lg:pl-64 pb-16 lg:pb-0">
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
    "command-center": "Command Center",
    schools: "Schools",
    users: "Users",
    "school-admin-applications": "School Admin Applications",
    subjects: "Global Subjects",
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
