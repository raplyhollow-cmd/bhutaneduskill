"use client";

/**
 * TEACHER LEARNING MODULE CREATOR PAGE
 * Dedicated page for creating learning modules - redirects to main page with create mode
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeacherLearningCreatePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main learning page with create mode
    // The main page will handle the create view
    router.replace("/teacher/learning?mode=create");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading module creator...</p>
      </div>
    </div>
  );
}
