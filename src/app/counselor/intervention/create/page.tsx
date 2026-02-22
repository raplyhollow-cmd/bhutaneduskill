"use client";

import { useRouter, useParams } from "next/navigation";
import { WellnessCompassWizard } from "@/components/wizard/wellness-compass-wizard";
import { useEffect, useState } from "react";

export default function CreateInterventionPage() {
  const router = useRouter();
  const params = useParams();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Verify user is a counselor
    fetch("/api/auth/set-role")
      .then((res) => res.json())
      .then((data) => {
        if (data.userType !== "counselor") {
          router.push("/counselor");
          return;
        }
        setIsAuthorized(true);
      })
      .catch(() => {
        router.push("/counselor");
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
    <WellnessCompassWizard
      studentId={params.id as string}
      onCancel={() => router.push("/counselor/dashboard")}
      onComplete={() => router.push("/counselor/sessions")}
    />
  );
}
