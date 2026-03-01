"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UniversalMobileSidebar, UniversalPortalHeader } from "@/components/mobile/universal-mobile-sidebar";
import { PortalErrorBoundary } from "@/components/error/portal-error-boundary";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette";
import { useToast } from "@/components/ui/toaster";
import { useUserEvents } from "@/hooks/use-realtime";
import { RealtimeEvents } from "@/lib/realtime";
import { Home, BookOpen, ClipboardList, Video, CheckCircle, BarChart3, TrendingUp, DollarSign, GraduationCap, Bus, Megaphone, Briefcase, Target, FileText, Globe, Award, Bookmark, Settings, Bell } from "lucide-react";

interface StudentLayoutClientProps {
  children: React.ReactNode;
  userName: string;
  portalType: "student";
  needsSetup?: boolean;
  isPendingApproval?: boolean;
}

/**
 * Student Layout Client Component
 *
 * Handles student-specific layout with auth checks.
 *
 * IMPORTANT: Always render the same components to avoid hooks mismatch errors.
 * PORTAL COLOR: Orange (rgb(249, 115, 22))
 */
export function StudentLayoutClient({ children, userName, portalType, needsSetup = false, isPendingApproval = false }: StudentLayoutClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Command palette setup
  const { isOpen, close } = useCommandPalette();

  // Toast for notifications
  const { toast } = useToast();

  // Real-time notification listener
  useUserEvents(userId, {
    [RealtimeEvents.NOTIFICATION_SENT]: (data: unknown) => {
      const notification = data as { title: string; message: string; actionUrl?: string };
      toast({
        title: notification.title,
        description: notification.message,
        action: notification.actionUrl ? {
          label: "View",
          onClick: () => router.push(notification.actionUrl!),
        } : undefined,
      });
    },
    [RealtimeEvents.HOMEWORK_CREATED]: (data: unknown) => {
      const homework = data as { homework: { title: string; dueDate: string } };
      toast({
        title: "New Homework Posted",
        description: `${homework.homework.title} - Due: ${new Date(homework.homework.dueDate).toLocaleDateString()}`,
        action: {
          label: "View",
          onClick: () => router.push("/student/homework"),
        },
      });
    },
    [RealtimeEvents.HOMEWORK_GRADED]: (data: unknown) => {
      const grading = data as { homeworkTitle: string; score: number; totalPoints: number };
      toast({
        title: "Homework Graded",
        description: `Your homework "${grading.homeworkTitle}" has been graded. Score: ${grading.score}/${grading.totalPoints}`,
        action: {
          label: "View",
          onClick: () => router.push("/student/homework"),
        },
      });
    },
    [RealtimeEvents.ANNOUNCEMENT_CREATED]: (data: unknown) => {
      const announcement = data as { announcement: { title: string; message: string } };
      toast({
        title: announcement.announcement.title,
        description: announcement.announcement.message,
      });
    },
  });

  // Student-specific commands
  const commands = [
    { id: "dashboard", label: "Dashboard", icon: Home, shortcut: "D", action: () => router.push("/student/dashboard") },
    { id: "classes", label: "My Classes", icon: BookOpen, shortcut: "C", action: () => router.push("/student/classes") },
    { id: "homework", label: "Homework", icon: ClipboardList, shortcut: "H", action: () => router.push("/student/homework") },
    { id: "learning", label: "Learning", icon: Video, shortcut: "L", action: () => router.push("/student/learning") },
    { id: "attendance", label: "Attendance", icon: CheckCircle, shortcut: "A", action: () => router.push("/student/attendance") },
    { id: "results", label: "Results", icon: BarChart3, shortcut: "R", action: () => router.push("/student/results") },
    { id: "progress", label: "Progress", icon: TrendingUp, shortcut: "P", action: () => router.push("/student/progress") },
    { id: "fees", label: "Fees", icon: DollarSign, shortcut: "F", action: () => router.push("/student/fees") },
    { id: "tuition", label: "Tuition", icon: GraduationCap, shortcut: "T", action: () => router.push("/student/tuition") },
    { id: "transport", label: "Transport", icon: Bus, shortcut: "B", action: () => router.push("/student/transport") },
    { id: "careers", label: "Career Matches", icon: Briefcase, shortcut: "K", action: () => router.push("/student/careers") },
    { id: "plan", label: "Career Plan", icon: Target, shortcut: "N", action: () => router.push("/student/plan") },
    { id: "settings", label: "Settings", icon: Settings, shortcut: ",", action: () => router.push("/student/settings") },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // If server says needs setup, redirect immediately
        if (needsSetup) {
          router.push("/setup/student");
          return;
        }

        // If pending approval, redirect to pending approval page
        if (isPendingApproval && !pathname.includes("pending-approval")) {
          router.push("/pending-approval");
          return;
        }

        const [roleRes, profileRes] = await Promise.all([
          fetch("/api/auth/set-role"),
          fetch("/api/user/profile"),
        ]);
        const roleData = await roleRes.json();
        const profileData = await profileRes.json();

        // Set userId for real-time notifications
        if (profileData.user?.id) {
          setUserId(profileData.user.id);
        }

        // Check if user is student
        if (roleData.userType === "student") {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Redirect to setup if not student
        if (roleData.needsSetup || !roleData.userType) {
          router.push("/setup/unified");
          return;
        }

        // Wrong portal type - redirect to correct one
        if (roleData.userType && roleData.userType !== "student") {
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
  const portalColor = portal.student.primary;

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
    homework: "Homework",
    learning: "Learning",
    attendance: "Attendance",
    results: "Results",
    progress: "Progress",
    fees: "Fees",
    tuition: "Tuition",
    transport: "Transport",
    announcements: "Announcements",
    assessment: "Assessments",
    careers: "Career Matches",
    skills: "Skills",
    plan: "Career Plan",
    journal: "Journal",
    "study-abroad": "Study Abroad",
    rub: "RUB Colleges",
    scholarships: "Scholarships",
    saved: "Saved Items",
    settings: "Settings",
  };

  return titles[page] || page.charAt(0).toUpperCase() + page.slice(1);
}
