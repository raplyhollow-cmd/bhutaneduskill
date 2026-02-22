"use client";

import { useRouter } from "next/navigation";
import { SubjectTeacherMappingWizard } from "@/components/wizard/subject-teacher-mapping-wizard";
import { useEffect, useState } from "react";

export default function AssignTeachersPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Verify user is a school admin
    fetch("/api/auth/set-role")
      .then((res) => res.json())
      .then((data) => {
        if (data.userType !== "school-admin") {
          router.push("/school-admin");
          return;
        }
        setIsAuthorized(true);
      })
      .catch(() => {
        router.push("/school-admin");
      });
  }, [router]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <SubjectTeacherMappingWizard
      onCancel={() => router.push("/school-admin/timetable")}
      onComplete={() => router.push("/school-admin/timetable")}
    />
  );
}
