import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, tenants, wizardProgress } from "@/lib/db/schema";
import { userRoles } from "@/lib/db/rbac-schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { neon } from "@neondatabase/serverless";

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
      console.log("[Admin Setup] Creating new user for clerkUserId:", user.id);

      const newUserId = `user-${Date.now()}`;
      const firstName = user.firstName || "";
      const lastName = user.lastName || "";
      const email = user.emailAddresses?.[0]?.emailAddress || "";

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
          settings: {
            theme: data.organization.themeColor,
            primaryColor: data.organization.themeColor,
          },
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
          settings: {},
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
        onboardingComplete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Additional admin data
        department: "Administration",
        // Admin specific fields from form if provided
        ...(data.admin?.adminName && {
          firstName: data.admin.adminName.split(" ")[0],
          lastName: data.admin.adminName.split(" ").slice(1).join(" "),
        }),
        ...(data.admin?.adminEmail && { email: data.admin.adminEmail }),
        ...(data.admin?.adminPhone && { phone: data.admin.adminPhone }),
      });

      // Assign platform-admin role in RBAC system
      const platformAdminRole = await sql`
        SELECT id FROM roles WHERE slug = 'platform-admin' LIMIT 1
      `;

      if (platformAdminRole.length > 0) {
        await db.insert(userRoles).values({
          id: nanoid(),
          userId: newUserId,
          roleId: platformAdminRole[0].id,
          assignedBy: newUserId, // Self-assigned
          createdAt: new Date(),
        });
        console.log("[Admin Setup] Assigned platform-admin role to user:", newUserId);
      }

      dbUser = (await db.select().from(users).where(eq(users.id, newUserId)).limit(1))[0];

      console.log("[Admin Setup] Created new user:", dbUser.id);
    } else {
      dbUser = userRecord[0];
    }

    // Update or create wizard progress
    const existingProgress = await db
      .select()
      .from(wizardProgress)
      .where(eq(wizardProgress.userId, dbUser.id))
      .limit(1);

    if (existingProgress.length > 0) {
      await db
        .update(wizardProgress)
        .set({
          currentStep: step === "complete" ? "4" : String((parseInt(existingProgress[0].currentStep as string) || 0) + 1),
          data: { ...(existingProgress[0].data as any), ...data },
          updatedAt: new Date(),
        })
        .where(eq(wizardProgress.id, existingProgress[0].id));
    } else {
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
        settings: {
          theme: data.organization.themeColor,
          primaryColor: data.organization.themeColor,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db
        .update(users)
        .set({ tenantId })
        .where(eq(users.id, dbUser.id));

      // Update admin details
      await db
        .update(users)
        .set({
          firstName: data.admin.adminName.split(" ")[0],
          lastName: data.admin.adminName.split(" ").slice(1).join(" "),
          email: data.admin.adminEmail,
          phone: data.admin.adminPhone,
        })
        .where(eq(users.id, dbUser.id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in admin setup:", error);
    return NextResponse.json(
      { error: "Failed to process setup" },
      { status: 500 }
    );
  }
}
