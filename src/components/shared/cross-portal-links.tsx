"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ClipboardList,
  Briefcase,
  BarChart3,
  FileText,
  CheckCircle,
  BookOpen,
  Calendar,
  TrendingUp,
  User,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LinkType =
  | "assessment"
  | "career"
  | "attendance"
  | "homework"
  | "progress"
  | "results"
  | "profile"
  | "journal"
  | "classes"
  | "schedule";

export type UserType = "student" | "teacher" | "parent" | "counselor" | "admin" | "school-admin" | "ministry";

interface CrossPortalLink {
  type: LinkType;
  label: string;
  description: string;
  href: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

interface CrossPortalLinksProps {
  studentId?: string;
  userType: UserType;
  showLinks?: LinkType[];
  className?: string;
  compact?: boolean;
}

/**
 * Cross-portal navigation links for related features across different user portals.
 *
 * This component provides contextual navigation based on the current user's role
 * and the context (e.g., viewing a student's profile as a teacher).
 *
 * @example
 * // Teacher viewing student detail page
 * <CrossPortalLinks
 *   studentId="student-123"
 *   userType="teacher"
 *   showLinks={["assessment", "career", "attendance", "progress"]}
 * />
 *
 * @example
 * // Parent viewing child's dashboard
 * <CrossPortalLinks
 *   studentId="child-123"
 *   userType="parent"
 *   compact
 * />
 */
export function CrossPortalLinks({
  studentId,
  userType,
  showLinks,
  className,
  compact = false,
}: CrossPortalLinksProps) {
  // Define all available cross-portal links
  const allLinks: CrossPortalLink[] = [
    {
      type: "assessment",
      label: "Assessment Results",
      description: "View detailed assessment and test results",
      href: `/student/assessment`,
      icon: ClipboardList,
    },
    {
      type: "career",
      label: "Career Profile",
      description: "View career matches and planning",
      href: `/student/careers`,
      icon: Briefcase,
    },
    {
      type: "attendance",
      label: "Attendance Record",
      description: "View full attendance history",
      href: `/student/attendance`,
      icon: CheckCircle,
    },
    {
      type: "homework",
      label: "Homework",
      description: "View homework and submissions",
      href: `/student/homework`,
      icon: BookOpen,
    },
    {
      type: "progress",
      label: "Progress Report",
      description: "View academic progress and skills",
      href: `/student/progress`,
      icon: TrendingUp,
    },
    {
      type: "results",
      label: "Exam Results",
      description: "View exam performance",
      href: `/student/results`,
      icon: BarChart3,
    },
    {
      type: "journal",
      label: "Learning Journal",
      description: "View student's learning journal",
      href: `/student/journal`,
      icon: FileText,
    },
    {
      type: "classes",
      label: "Classes & Schedule",
      description: "View class schedule and subjects",
      href: `/student/classes`,
      icon: Calendar,
    },
  ];

  // Filter links based on showLinks prop or user type defaults
  const filteredLinks = showLinks
    ? allLinks.filter((link) => showLinks.includes(link.type))
    : getDefaultLinksForUserType(userType, allLinks);

  // If no links to show, return null
  if (filteredLinks.length === 0) {
    return null;
  }

  // Compact view for sidebar or tight spaces
  if (compact) {
    return (
      <div className={cn("space-y-1", className)}>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70 px-3 py-2">
          View Related
        </p>
        {filteredLinks.map((link) => (
          <Link
            key={link.type}
            href={studentId ? `${link.href}/${studentId}` : link.href}
            className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 relative group focus:outline-none focus:ring-2 focus:ring-white/50 min-h-[44px] ml-2"
          >
            <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-white/10 transition-opacity duration-200" />
            <link.icon className="w-4 h-4 text-white/80 relative z-10" />
            <span className="text-sm text-white/90 relative z-10">{link.label}</span>
            <ExternalLink className="w-3 h-3 text-white/60 ml-auto relative z-10" />
          </Link>
        ))}
      </div>
    );
  }

  // Full card view
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ExternalLink className="w-5 h-5 text-gray-500" />
          Related Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-3">
          {filteredLinks.map((link) => (
            <Link
              key={link.type}
              href={studentId ? `${link.href}/${studentId}` : link.href}
              className="group p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:border-blue-300"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: getPortalGradient(userType),
                  }}
                >
                  <link.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 text-sm">{link.label}</h4>
                    {link.badge && (
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", link.badgeColor)}
                      >
                        {link.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{link.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Get default links to show based on user type
 */
function getDefaultLinksForUserType(
  userType: UserType,
  allLinks: CrossPortalLink[]
): CrossPortalLink[] {
  switch (userType) {
    case "teacher":
      // Teachers can view student profiles, assessments, and attendance
      return allLinks.filter((link) =>
        ["assessment", "career", "attendance", "progress", "homework"].includes(link.type)
      );

    case "parent":
      // Parents can view their child's detailed assessments and progress
      return allLinks.filter((link) =>
        ["assessment", "career", "attendance", "homework", "progress", "results"].includes(link.type)
      );

    case "counselor":
      // Counselors can view student homework, attendance, and journal
      return allLinks.filter((link) =>
        ["assessment", "career", "attendance", "homework", "journal", "progress"].includes(link.type)
      );

    case "school-admin":
      // School admins have broader access
      return allLinks.filter((link) =>
        ["assessment", "attendance", "homework", "progress", "results"].includes(link.type)
      );

    case "admin":
    case "ministry":
      // Platform admins and ministry have read-only access
      return allLinks;

    case "student":
      // Students see their own links (no cross-portal needed usually)
      return allLinks;

    default:
      return [];
  }
}

/**
 * Get portal gradient color based on user type
 */
function getPortalGradient(userType: UserType): string {
  const gradients: Record<UserType, string> = {
    student: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
    teacher: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
    parent: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)",
    counselor: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    admin: "linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)",
    "school-admin": "linear-gradient(135deg, rgb(139 92 246) 0%, rgb(124 58 237) 100%)",
    ministry: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
  };

  return gradients[userType] || gradients.student;
}

/**
 * Quick link button component for inline use
 */
export function QuickLinkButton({
  href,
  label,
  icon: Icon,
  userType,
}: {
  href: string;
  label: string;
  icon: any;
  userType: UserType;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className="gap-2 hover:border-transparent transition-all duration-200"
    >
      <Link href={href}>
        <Icon className="w-4 h-4" />
        {label}
      </Link>
    </Button>
  );
}
