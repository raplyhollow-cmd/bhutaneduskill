import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// GET /api/rub/applications - Get RUB applications
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId") || currentUser.schoolId;
    const studentId = searchParams.get("studentId");
    const academicYear = searchParams.get("academicYear");
    const status = searchParams.get("status");

    const { rubApplications: rubApplicationsTable } = await import("@/lib/db/rub-schema");

    const conditions = [eq(rubApplicationsTable.schoolId, schoolId || "")];

    if (studentId) {
      conditions.push(eq(rubApplicationsTable.studentId, studentId));
    }

    if (academicYear) {
      conditions.push(eq(rubApplicationsTable.academicYear, academicYear));
    }

    if (status) {
      conditions.push(eq(rubApplicationsTable.status, status));
    }

    const applications = await db.query.rubApplications.findMany({
      where: and(...conditions),
      orderBy: [desc(rubApplicationsTable.createdAt)],
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("RUB applications fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}

// ============================================================================
// POST /api/rub/applications - Create RUB application
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      studentId,
      studentName,
      cidNumber,
      applicationYear,
      academicYear,
      preferences,
      examType,
      examYear,
      indexNumber,
      schoolAttended,
      percentage,
      division,
      subjectMarks,
      phone,
      email,
      presentAddress,
      permanentAddress,
      dzongkhag,
      gewog,
      village,
      dateOfBirth,
      gender,
      bloodGroup,
      fatherName,
      fatherOccupation,
      fatherPhone,
      fatherCID,
      motherName,
      motherOccupation,
      motherPhone,
      motherCID,
      category,
      hasDisability,
      disabilityType,
      scholarshipApplied,
      scholarshipType,
      documents,
      photo,
    } = body;

    // Validate required fields
    if (
      !studentId ||
      !studentName ||
      !cidNumber ||
      !applicationYear ||
      !academicYear ||
      !preferences ||
      !preferences.length
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: studentId, studentName, cidNumber, applicationYear, academicYear, preferences",
        },
        { status: 400 }
      );
    }

    // Validate CID
    const { validateCID } = await import("@/lib/bcse/bcse-api");
    if (!validateCID(cidNumber)) {
      return NextResponse.json({ error: "Invalid CID number" }, { status: 400 });
    }

    const { rubApplications: rubApplicationsTable } = await import("@/lib/db/rub-schema");

    // Check for existing application
    const existing = await db.query.rubApplications.findFirst({
      where: and(
        eq(rubApplicationsTable.studentId, studentId),
        eq(rubApplicationsTable.academicYear, academicYear)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Student already has an application for this academic year" },
        { status: 400 }
      );
    }

    // Generate application number
    const applicationNumber = `RUB-${currentUser.schoolId}-${applicationYear}-${Date.now().toString().slice(-6)}`;

    // Create application
    const [application] = await db.insert(rubApplicationsTable).values({
      id: nanoid(),
      schoolId: currentUser.schoolId || "",
      studentId,
      applicationNumber,
      applicationYear,
      academicYear,
      preferences,
      studentName,
      cidNumber,
      dateOfBirth,
      gender,
      bloodGroup,
      photo,
      phone,
      email,
      presentAddress,
      permanentAddress,
      dzongkhag,
      gewog,
      village,
      fatherName,
      fatherOccupation,
      fatherPhone,
      fatherCID,
      motherName,
      motherOccupation,
      motherPhone,
      motherCID,
      guardianName: body.guardianName,
      guardianPhone: body.guardianPhone,
      guardianCID: body.guardianCID,
      examType,
      examYear,
      indexNumber,
      schoolAttended,
      percentage,
      division,
      subjectMarks,
      documents: documents || [],
      category,
      hasDisability: hasDisability || false,
      disabilityType,
      disabilityCertificate: body.disabilityCertificate,
      scholarshipApplied: scholarshipApplied || false,
      scholarshipType,
      scholarshipDocuments: body.scholarshipDocuments,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("RUB application creation error:", error);
    return NextResponse.json({ error: "Failed to create application" }, { status: 500 });
  }
}

// ============================================================================
// PATCH /api/rub/applications - Update RUB application
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { applicationId, action } = body; // action: "submit", "verify", "update_status"

    if (!applicationId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: applicationId, action" },
        { status: 400 }
      );
    }

    const { rubApplications: rubApplicationsTable } = await import("@/lib/db/rub-schema");

    const application = await db.query.rubApplications.findFirst({
      where: eq(rubApplicationsTable.id, applicationId),
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (action === "submit") {
      if (application.status !== "draft") {
        return NextResponse.json({ error: "Cannot submit non-draft application" }, { status: 400 });
      }

      // Validate required fields before submission
      if (
        !application.preferences ||
        !application.preferences.length ||
        !application.studentName ||
        !application.cidNumber ||
        !application.examType ||
        !application.examYear
      ) {
        return NextResponse.json(
          { error: "Please complete all required fields before submitting" },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(rubApplicationsTable)
        .set({
          status: "submitted",
          submittedDate: new Date().toISOString(),
          lastModifiedDate: new Date().toISOString(),
          updatedAt: new Date(),
        })
        .where(eq(rubApplicationsTable.id, applicationId))
        .returning();

      return NextResponse.json({ application: updated, message: "Application submitted successfully" });
    }

    if (action === "verify") {
      const [updated] = await db
        .update(rubApplicationsTable)
        .set({
          verifiedBy: currentUser.id,
          verifiedDate: new Date().toISOString(),
          verificationNotes: body.notes,
          status: "document_verified",
          updatedAt: new Date(),
        })
        .where(eq(rubApplicationsTable.id, applicationId))
        .returning();

      return NextResponse.json({ application: updated, message: "Application verified" });
    }

    if (action === "update_status") {
      const { status, admittedCollegeId, admittedProgramId, admittedCollegeName, admittedProgramName, admissionDeadline, meritRank, rejectionReason } = body;

      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (status === "admitted") {
        updateData.admissionDate = new Date().toISOString();
      }

      if (admittedCollegeId) updateData.admittedCollegeId = admittedCollegeId;
      if (admittedProgramId) updateData.admittedProgramId = admittedProgramId;
      if (admittedCollegeName) updateData.admittedCollegeName = admittedCollegeName;
      if (admittedProgramName) updateData.admittedProgramName = admittedProgramName;
      if (admissionDeadline) updateData.admissionDeadline = admissionDeadline;
      if (meritRank) updateData.meritRank = meritRank;
      if (rejectionReason) updateData.rejectionReason = rejectionReason;

      const [updated] = await db
        .update(rubApplicationsTable)
        .set(updateData)
        .where(eq(rubApplicationsTable.id, applicationId))
        .returning();

      return NextResponse.json({ application: updated, message: "Status updated" });
    }

    if (action === "schedule_interview") {
      const { interviewDate, interviewTime, interviewVenue } = body;

      const [updated] = await db
        .update(rubApplicationsTable)
        .set({
          interviewScheduled: true,
          interviewDate,
          interviewTime,
          interviewVenue,
          status: "interview_scheduled",
          updatedAt: new Date(),
        })
        .where(eq(rubApplicationsTable.id, applicationId))
        .returning();

      return NextResponse.json({ application: updated, message: "Interview scheduled" });
    }

    if (action === "submit_interview_result") {
      const { interviewResult, interviewScore, interviewNotes } = body;

      const [updated] = await db
        .update(rubApplicationsTable)
        .set({
          interviewResult,
          interviewScore,
          interviewNotes,
          status: interviewResult === "passed" ? "under_review" : "rejected",
          updatedAt: new Date(),
        })
        .where(eq(rubApplicationsTable.id, applicationId))
        .returning();

      return NextResponse.json({ application: updated, message: "Interview result submitted" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("RUB application update error:", error);
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}
