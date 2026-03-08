/**
 * SCHOOL ADMIN SETUP WIZARD
 *
 * After platform admin approval, school admin completes school setup.
 * Unified wizard to configure school profile, departments, classes, calendar, etc.
 *
 * This page can also be accessed anytime from Settings > Run Setup Wizard
 * for reconfiguration.
 */

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { UnifiedSetupWizard } from "@/components/school-admin/unified-setup-wizard";
import { logger } from "@/lib/logger";

export default async function SchoolAdminSetupPage() {
  const authResult = await requireAuth(['school-admin']);

  if ('error' in authResult) {
    logger.security("unauthorized_setup_access_attempt", { error: authResult.error });
    redirect("/sign-in");
  }

  const { userId, user } = authResult;

  // Get user and school details
  const userRecords = await db
    .select({
      userId: users.id,
      schoolId: users.schoolId,
      schoolName: schools.name,
      schoolCode: schools.code,
      setupComplete: schools.setupComplete,
      subscriptionStatus: schools.subscriptionStatus,
    })
    .from(users)
    .innerJoin(schools, eq(users.schoolId, schools.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (userRecords.length === 0) {
    redirect("/setup/school-admin");
  }

  const userData = userRecords[0];

  // Check if school is active
  if (userData.subscriptionStatus !== "active") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-yellow-600">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">School Not Yet Activated</h1>
          <p className="text-gray-600 mb-6">
            Your school subscription is pending activation. Please wait for the platform admin to verify payment and activate your school.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-700">
              <strong>School:</strong> {userData.schoolName}<br />
              <strong>School Code:</strong> {userData.schoolCode}<br />
              <strong>Status:</strong> {userData.subscriptionStatus}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UnifiedSetupWizard
      schoolId={userData.schoolId!}
      schoolName={userData.schoolName}
      schoolCode={userData.schoolCode}
    />
  );
}
