import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, tenants, wizardProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { neon } from "@neondatabase/serverless";
import { logger } from "@/lib/logger";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { step, data } = body;

    // Get user from database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, user.id))
      .limit(1);

    let dbUser;

    if (userRecord.length === 0) {
      // User doesn't exist - create them with default values
      logger.info("Creating new admin user", { clerkUserId: user.id });

      const newUserId = `user-${Date.now()}`;
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      // Defensive email extraction - try multiple methods
      const email = user.primaryEmailAddress?.emailAddress
        || user.emailAddresses?.find((e: any) => e.id === user.primaryEmailAddressId)?.emailAddress
        || user.emailAddresses?.[0]?.emailAddress
        || "";

      // Create organization first if data exists
      let tenantId;
      if (data.organization) {
        tenantId = nanoid();
        await db.insert(tenants).values({
          id: tenantId,
          name: data.organization.orgName,
          slug: data.organization.orgSlug,
          domain: `${data.organization.orgSlug}.bhutaneduskill.com`,
          logo: "/logo.png",
          primaryColor: data.organization.themeColor || "#f97316",
          secondaryColor: "#c2410c",
          settings: JSON.stringify({
            theme: data.organization.themeColor,
            primaryColor: data.organization.themeColor,
          }),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        tenantId = nanoid();
        // Create default tenant
        await db.insert(tenants).values({
          id: tenantId,
          name: "Default Organization",
          slug: `org-${Date.now()}`,
          domain: `default-${Date.now()}.bhutaneduskill.com`,
          logo: "/logo.png",
          primaryColor: "#f97316",
          secondaryColor: "#c2410c",
          settings: JSON.stringify({}),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Create user
      await db.insert(users).values({
        id: newUserId,
        clerkUserId: user.id,
        tenantId,
        type: "admin",
        role: "admin",
        name: `${firstName} ${lastName}`.trim() || "Platform Admin",
        firstName,
        lastName,
        email,
        // Required fields with defaults
        phone: data.admin?.adminPhone || "",
        profileImage: user.imageUrl || "",
        gender: "",
        grade: 0,
        section: "",
        rollNumber: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Bhutan",
        parentContact: "",
        parentPhone: "",
        emergencyContact: "",
        bloodGroup: "",
        enrollmentDate: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toISOString(),
        onboardingComplete: step === "complete",
        createdAt: new Date(),
        updatedAt: new Date(),
        // Additional admin data
        department: "Administration",
        // Admin specific fields from form if provided
        ...(data.admin?.adminName && {
          firstName: data.admin.adminName.split(" ")[0] || "",
          lastName: data.admin.adminName.split(" ").slice(1).join(" ") || "",
        }),
        ...(data.admin?.adminEmail && { email: data.admin.adminEmail }),
        ...(data.admin?.adminPhone && { phone: data.admin.adminPhone }),
      });

      // Assign platform-admin role in RBAC system
      const platformAdminRole = await sql`
        SELECT id FROM roles WHERE slug = 'platform-admin' LIMIT 1
      `;

      if (platformAdminRole.length > 0) {
        await sql`
          INSERT INTO user_roles (id, user_id, role_id, assigned_by, created_at)
          VALUES (${nanoid()}, ${newUserId}, ${platformAdminRole[0].id}, ${newUserId}, NOW())
        `;
        logger.info("Assigned platform-admin role to user", { userId: newUserId });
      }

      dbUser = (await db.select().from(users).where(eq(users.id, newUserId)).limit(1))[0];

      logger.info("Created new admin user", { userId: dbUser.id });
    } else {
      dbUser = userRecord[0];
    }

    // Update or create wizard progress (gracefully handle missing table)
    let existingProgress: any[] = [];
    try {
      existingProgress = await db
        .select()
        .from(wizardProgress)
        .where(eq(wizardProgress.userId, dbUser.id))
        .limit(1);
    } catch (error) {
      // wizard_progress table doesn't exist - skip progress tracking
      logger.warn("wizard_progress table not available, skipping progress tracking");
    }

    if (existingProgress.length > 0) {
      try {
        await db
          .update(wizardProgress)
          .set({
            currentStep: step === "complete" ? "4" : String((parseInt(existingProgress[0].currentStep as string) || 0) + 1),
            data: { ...(existingProgress[0].data as any), ...data },
            updatedAt: new Date(),
          })
          .where(eq(wizardProgress.id, existingProgress[0].id));
      } catch (error) {
        logger.warn("Could not update wizard_progress", { error });
      }
    } else {
      try {
        await db.insert(wizardProgress).values({
          id: nanoid(),
          userId: dbUser.id,
          currentStep: "1",
          completedSteps: [],
          data,
          isCompleted: false,
          lastUpdated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        logger.warn("Could not insert wizard_progress", { error });
      }
    }

    // Create organization if not exists
    if (data.organization && !dbUser.tenantId) {
      const tenantId = nanoid();
      await db.insert(tenants).values({
        id: tenantId,
        name: data.organization.orgName,
        slug: data.organization.orgSlug,
        domain: `${data.organization.orgSlug}.bhutaneduskill.com`,
        logo: "/logo.png",
        primaryColor: data.organization.themeColor || "#f97316",
        secondaryColor: "#c2410c",
        settings: JSON.stringify({
          theme: data.organization.themeColor,
          primaryColor: data.organization.themeColor,
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db
        .update(users)
        .set({ tenantId })
        .where(eq(users.id, dbUser.id));

      // Update admin details
      const adminName = data.admin?.adminName || "";
      const nameParts = adminName.trim().split(" ");
      await db
        .update(users)
        .set({
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          email: data.admin?.adminEmail || "",
          phone: data.admin?.adminPhone || "",
        })
        .where(eq(users.id, dbUser.id));
    }

    // Mark onboarding as complete when step is "complete"
    if (step === "complete") {
      await db
        .update(users)
        .set({ onboardingComplete: true })
        .where(eq(users.id, dbUser.id));
      logger.info("Marked onboarding as complete for admin", { userId: dbUser.id });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Admin setup error:", error);
    return NextResponse.json(
      {
        error: "Failed to process setup",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
