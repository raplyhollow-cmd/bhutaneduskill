/**
 * TEACHER QUICK ACTIONS COMPONENT
 *
 * Provides quick access buttons for common teacher tasks:
 * - Log student behavior (merit/demerit)
 * - Create lesson plan
 * - Upload teaching resources
 * - Generate student reports
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Award,
  FileText,
  Upload,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { BehaviorLogModal } from "@/components/teacher/behavior-log-modal";

export function TeacherQuickActions() {
  const [isBehaviorModalOpen, setIsBehaviorModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>();
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string | undefined>();

  const handleBehaviorSubmit = async (data: any) => {
    const response = await fetch("/api/teacher/behavior", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to log behavior");
    }

    return await response.json();
  };

  // Quick action buttons
  const quickActions = [
    {
      label: "Log Behavior",
      icon: Award,
      variant: "ceramic-warning" as const,
      href: null,
      onClick: () => setIsBehaviorModalOpen(true),
      description: "Merit or Demerit",
    },
    {
      label: "Lesson Plans",
      icon: Calendar,
      variant: "ceramic-info" as const,
      href: "/teacher/lessons",
      onClick: null,
      description: "Plan & Track",
    },
    {
      label: "My Students",
      icon: Users,
      variant: "ceramic-ghost" as const,
      href: "/teacher/students",
      onClick: null,
      description: "View All",
    },
    {
      label: "Create Homework",
      icon: BookOpen,
      variant: "ceramic" as const,
      href: "/teacher/homework",
      onClick: null,
      description: "New Assignment",
    },
    {
      label: "Upload Resources",
      icon: Upload,
      variant: "ceramic-outline" as const,
      href: "/teacher/resources",
      onClick: null,
      description: "Share Materials",
    },
    {
      label: "Student Reports",
      icon: FileText,
      variant: "ceramic-ghost" as const,
      href: "/teacher/reports",
      onClick: null,
      description: "Generate PDFs",
    },
  ];

  return (
    <>
      <div className="flex gap-3 flex-wrap">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const buttonContent = (
            <>
              <Icon className="w-4 h-4 mr-2" />
              {action.label}
            </>
          );

          return (
            <Button
              key={action.label}
              variant={action.variant}
              size="sm"
              asChild={!!action.href && !action.onClick}
              onClick={action.onClick || undefined}
              className="relative group"
            >
              {action.href ? (
                <Link href={action.href}>
                  {buttonContent}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-ceramic-dimmed opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {action.description}
                  </span>
                </Link>
              ) : (
                <>
                  {buttonContent}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-ceramic-dimmed opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {action.description}
                  </span>
                </>
              )}
            </Button>
          );
        })}
      </div>

      {/* Behavior Log Modal */}
      <BehaviorLogModal
        isOpen={isBehaviorModalOpen}
        onClose={() => {
          setIsBehaviorModalOpen(false);
          setSelectedStudentId(undefined);
          setSelectedStudentName("");
          setSelectedClassId(undefined);
        }}
        onSubmit={handleBehaviorSubmit}
        studentId={selectedStudentId}
        studentName={selectedStudentName || undefined}
        classId={selectedClassId}
      />
    </>
  );
}
