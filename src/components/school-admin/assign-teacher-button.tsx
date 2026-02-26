/**
 * ASSIGN TEACHER BUTTON
 *
 * Client component that handles teacher assignment with modal
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { AssignTeacherModal } from "./assign-teacher-modal";

interface AssignTeacherButtonProps {
  classId: string;
  className: string;
  currentTeacherId?: string | null;
}

export function AssignTeacherButton({
  classId,
  className: classNameStr,
  currentTeacherId,
}: AssignTeacherButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleAssign = async (teacherId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/school-admin/classes/${classId}/assign-teacher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teacherId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to assign teacher");
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Error assigning teacher:", error);
      throw error;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Assign Teacher
      </Button>
      <AssignTeacherModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAssign={handleAssign}
        classId={classId}
        className={classNameStr}
        currentTeacherId={currentTeacherId}
      />
    </>
  );
}
