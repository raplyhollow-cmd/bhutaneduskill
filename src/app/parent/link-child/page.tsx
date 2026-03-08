"use client";

import { useRouter } from "next/navigation";
import { GuardianLinkWizard } from "@/components/wizard/guardian-link-wizard";
import { requireAuth } from "@/lib/auth-utils";
import { useEffect, useState } from "react";

export default function LinkChildPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Verify user is a parent
    fetch("/api/resources/users/actions?action=get-role", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.userType !== "parent") {
          router.push("/parent");
          return;
        }
        setIsAuthorized(true);
      })
      .catch(() => {
        router.push("/parent");
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
    <GuardianLinkWizard
      onCancel={() => router.push("/parent")}
      onComplete={() => router.push("/parent/children")}
    />
  );
}
