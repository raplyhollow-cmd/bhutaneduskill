/**
 * CLASS DETAIL CLIENT COMPONENT
 *
 * Client-side wrapper for class detail page with edit modal functionality
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { ClassEditModal } from "./class-edit-modal";

interface ClassDetailClientProps {
  children: React.ReactNode;
  classData: {
    id: string;
    name?: string | null;
    grade: number;
    section: string;
    roomNumber?: string | null;
    capacity?: number | null;
    homeroomTeacherId?: string | null;
    academicYear?: string | null;
  };
}

export function ClassDetailClient({ children, classData }: ClassDetailClientProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      {children}
      <ClassEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        classData={classData}
      />
      {/* Floating Edit Button */}
      <Button
        className="fixed bottom-6 right-6 z-40 shadow-lg bg-violet-600 hover:bg-violet-700"
        size="lg"
        onClick={() => setIsEditModalOpen(true)}
      >
        <Edit className="w-5 h-5 mr-2" />
        Edit Class
      </Button>
    </>
  );
}
