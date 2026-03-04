/**
 * SETUP GUARD
 *
 * Checks if school setup is complete. If not, shows the InitialSetupWizard.
 * Use this in the school-admin layout or dashboard.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { InitialSetupWizard } from "@/components/school-admin/initial-setup-wizard";

interface SetupGuardProps {
  schoolId: string | null;
  children: React.ReactNode;
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
    return <InitialSetupWizard schoolId={schoolId} onComplete={() => setNeedsSetup(false)} />;
  }

  return <>{children}</>;
}
