/**
 * SETUP GUARD
 *
 * Checks if school setup is complete. If not, shows the UnifiedSetupWizard.
 * Use this in the school-admin layout or dashboard.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { UnifiedSetupWizard } from "@/components/school-admin/unified-setup-wizard";

interface SetupGuardProps {
  schoolId: string | null;
  children: React.ReactNode;
}

interface SchoolData {
  setupComplete: boolean;
  name?: string;
  code?: string;
  grades?: string[];
}

export function SetupGuard({ schoolId, children }: SetupGuardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [schoolData, setSchoolData] = useState<any>(null);

  useEffect(() => {
    if (!schoolId) {
      setIsLoading(false);
      return;
    }

    checkSetupStatus();
  }, [schoolId]);

  const checkSetupStatus = async () => {
    try {
      const res = await fetch("/api/school-admin/settings/status");
      const json = await res.json();

      if (json.data?.setupComplete === false) {
        setNeedsSetup(true);
        setSchoolData(json.data);
      } else {
        setNeedsSetup(false);
      }
    } catch (error) {
      console.error("Failed to check setup status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (needsSetup && schoolData) {
    return (
      <UnifiedSetupWizard
        schoolId={schoolId}
        schoolName={schoolData.name}
        schoolCode={schoolData.code}
        grades={schoolData.grades || []}
        onComplete={() => setNeedsSetup(false)}
      />
    );
  }

  return <>{children}</>;
}
