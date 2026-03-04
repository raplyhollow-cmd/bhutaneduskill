import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { neon } from "@neondatabase/serverless";

// POST /api/admin/school-admin-applications/[id]/approve - Approve school admin application
export const POST = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId } = auth;

    const params = await context?.params || Promise.resolve({ id: "" });
    const applicationId = (await params).id;

    const sql = neon(process.env.DATABASE_URL!);

    // Check if application exists and get details
    const applications = await sql`
      SELECT id, user_id, school_id, status
      FROM school_admin_applications
      WHERE id = ${applicationId}
      LIMIT 1
    `;

    if (applications.length === 0) {
      return { error: "Application not found", status: 404 };
    }

    const application = applications[0];

    if (application.status !== "pending_approval") {
      return { error: "Application already processed", status: 400 };
    }

    // Update application status using raw SQL
    await sql`
      UPDATE school_admin_applications
      SET status = 'approved',
          reviewed_by = ${userId},
          reviewed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${applicationId}
    `;

    // Assign school-admin role to the user
    // Get the role ID
    const roleResult = await sql`
      SELECT id FROM roles WHERE slug = 'school-admin' LIMIT 1
    `;

    if (roleResult.length > 0) {
      const roleId = roleResult[0].id;

      // Check if user already has this role
      const existingRole = await sql`
        SELECT id FROM user_roles
        WHERE user_id = ${application.user_id} AND role_id = ${roleId}
        LIMIT 1
      `;

      if (existingRole.length === 0) {
        // Insert the role
        await sql`
          INSERT INTO user_roles (id, user_id, role_id, assigned_by, created_at)
          VALUES (
            ${`ur_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`},
            ${application.user_id},
            ${roleId},
            ${userId},
            NOW()
          )
        `;
      }

      // Update user's onboarding status using raw SQL
      await sql`
        UPDATE users
        SET onboarding_complete = true,
            onboarding_status = 'complete',
            updated_at = NOW()
        WHERE id = ${application.user_id}
      `;
    }

    logger.info("School admin application approved", {
      applicationId,
      userId: application.user_id,
      schoolId: application.school_id,
      reviewedBy: userId,
    });

    return {
      success: true,
      message: "School admin application approved successfully",
    };
  },
  ["admin"]
);

// PATCH /api/admin/school-admin-applications/[id]/reject - Reject school admin application
export const PATCH = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId } = auth;

    const params = await context?.params || Promise.resolve({ id: "" });
    const applicationId = (await params).id;
    const body = await req.json();
    const { rejectionReason } = body;

    const sql = neon(process.env.DATABASE_URL!);

    // Check if application exists
    const applications = await sql`
      SELECT id, user_id, status
      FROM school_admin_applications
      WHERE id = ${applicationId}
      LIMIT 1
    `;

    if (applications.length === 0) {
      return { error: "Application not found", status: 404 };
    }

    const application = applications[0];

    if (application.status !== "pending_approval") {
      return { error: "Application already processed", status: 400 };
    }

    // Update application status
    await sql`
      UPDATE school_admin_applications
      SET status = 'rejected',
          reviewed_by = ${userId},
          reviewed_at = NOW(),
          rejection_reason = ${rejectionReason || null},
          updated_at = NOW()
      WHERE id = ${applicationId}
    `;

    logger.info("School admin application rejected", {
      applicationId,
      userId: application.user_id,
      rejectionReason,
      reviewedBy: userId,
    });

    return {
      success: true,
      message: "School admin application rejected",
    };
  },
  ["admin"]
);
