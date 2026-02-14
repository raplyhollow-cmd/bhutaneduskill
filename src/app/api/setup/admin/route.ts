import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, schools, tenants, wizardProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

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

    if (userRecord.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dbUser = userRecord[0];

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

    // Create first school
    if (data.school) {
      const tenantRecord = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, dbUser.tenantId!))
        .limit(1);

      if (tenantRecord.length > 0) {
        await db.insert(schools).values({
          id: nanoid(),
          tenantId: tenantRecord[0].id,
          name: data.school.schoolName,
          code: data.school.schoolCode,
          type: "private",
          address: data.school.schoolAddress || "",
          city: (data.school as any).city || "Thimphu",
          state: (data.school as any).state || "Thimphu",
          country: "Bhutan",
          postalCode: (data.school as any).postalCode || "12345",
          phone: (data.school as any).phone || "123456",
          email: data.admin?.adminEmail || "admin@school.bt",
          website: "https://school.bt",
          logo: "/logo.png",
          establishedYear: 2000,
          accreditationStatus: "registered",
          maxStudents: 1000,
          campusSize: "10 acres",
          facilities: [],
          board: "BCSE",
          principalName: (data.admin as any)?.adminName || "Principal",
          principalEmail: data.admin?.adminEmail || "principal@school.bt",
          principalPhone: (data.school as any).phone || "123456",
          counselorName: "Counselor",
          counselorEmail: "counselor@school.bt",
          counselorPhone: "123456",
          vicePrincipalName: "Vice Principal",
          contactEmail: data.admin?.adminEmail,
          contactPhone: (data.school as any).phone || "123456",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
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
