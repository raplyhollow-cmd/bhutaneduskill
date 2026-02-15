import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { tenants, users, schools } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// In-memory storage for verification requests (in production, use database)
// This is a temporary solution - add verificationRequests table to schema
const verificationRequests = new Map<string, VerificationRequest>();

interface VerificationRequest {
  id: string;
  type: "ministry" | "school";
  status: "pending" | "approved" | "rejected" | "needs_info";
  ministryData?: MinistryData;
  adminData?: AdminData;
  documents?: DocumentData;
  schoolData?: any;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
  rejectionReason?: string;
}

interface MinistryData {
  name: string;
  level: "national" | "district" | "regional";
  country: string;
  region?: string;
  officialDomain: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

interface AdminData {
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  officialEmail: string;
  phone: string;
  employeeId: string;
}

interface DocumentData {
  governmentId: string;
  appointmentLetter: string;
  letterhead: string;
}

// Helper: Generate verification ID
function generateVerificationId(): string {
  return `MOE-${nanoid(8).toUpperCase()}`;
}

// Helper: Validate government email domain
function validateEmailDomain(email: string, officialDomain: string): boolean {
  const emailDomain = email.split("@")[1]?.toLowerCase();
  return emailDomain === officialDomain.toLowerCase() ||
         emailDomain?.endsWith(`.${officialDomain.toLowerCase()}`);
}

// Helper: Store file (in production, use S3 or similar)
async function storeFile(file: File, prefix: string): Promise<string> {
  // For now, return a mock path. In production:
  // 1. Upload to S3/Cloud Storage
  // 2. Return the actual URL
  const timestamp = Date.now();
  const extension = file.name.split(".").pop();
  return `uploads/verification/${prefix}_${timestamp}.${extension}`;
}

// GET: Fetch verification status
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const verificationId = searchParams.get("id");

    if (verificationId) {
      // Get specific verification request
      const request = verificationRequests.get(verificationId);

      if (!request) {
        return NextResponse.json(
          { success: false, error: "Verification request not found" },
          { status: 404 }
        );
      }

      // Only allow access to own requests or admins
      const isAdminUser = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);

      if (isAdminUser.length === 0 || isAdminUser[0].type !== "admin") {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: request.id,
          type: request.type,
          status: request.status,
          submittedAt: request.submittedAt,
          reviewedAt: request.reviewedAt,
          notes: request.notes,
          rejectionReason: request.rejectionReason,
        },
      });
    } else {
      // List all verification requests (admin only)
      const user = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId))
        .limit(1);

      if (user.length === 0 || user[0].type !== "admin") {
        return NextResponse.json(
          { success: false, error: "Forbidden - Admin access required" },
          { status: 403 }
        );
      }

      const requests = Array.from(verificationRequests.values()).sort(
        (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
      );

      return NextResponse.json({
        success: true,
        data: requests,
      });
    }
  } catch (error) {
    logger.apiError(error, { route: "/api/verification/ministry", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create new verification request
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const ministryDataJson = formData.get("ministryData") as string;
    const adminDataJson = formData.get("adminData") as string;
    const governmentIdFile = formData.get("governmentId") as File | null;
    const appointmentLetterFile = formData.get("appointmentLetter") as File | null;
    const letterheadFile = formData.get("letterhead") as File | null;

    if (!ministryDataJson || !adminDataJson) {
      return NextResponse.json(
        { success: false, error: "Missing required data" },
        { status: 400 }
      );
    }

    const ministryData: MinistryData = JSON.parse(ministryDataJson);
    const adminData: AdminData = JSON.parse(adminDataJson);

    // Validate email domain
    if (!validateEmailDomain(adminData.officialEmail, ministryData.officialDomain)) {
      return NextResponse.json(
        {
          success: false,
          error: "Email domain does not match official ministry domain"
        },
        { status: 400 }
      );
    }

    // Check if ministry with same name already exists
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.name, ministryData.name))
      .limit(1);

    if (existingTenant.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "A ministry with this name already exists in our system"
        },
        { status: 409 }
      );
    }

    // Store documents
    const documents: DocumentData = {
      governmentId: governmentIdFile ? await storeFile(governmentIdFile, "gov_id") : "",
      appointmentLetter: appointmentLetterFile ? await storeFile(appointmentLetterFile, "appointment") : "",
      letterhead: letterheadFile ? await storeFile(letterheadFile, "letterhead") : "",
    };

    // Generate verification ID
    const verificationId = generateVerificationId();

    // Create tenant record with pending status
    const tenantId = `tenant-${nanoid()}`;
    await db.insert(tenants).values({
      id: tenantId,
      name: ministryData.name,
      slug: ministryData.name.toLowerCase().replace(/\s+/g, "-"),
      domain: ministryData.officialDomain,
      logo: "",
      primaryColor: "rgb(249 115 22)",
      secondaryColor: "rgb(194 65 12)",
      settings: {
        type: "ministry",
        level: ministryData.level,
        verificationStatus: "pending",
        verificationId,
      },
      isActive: false, // Not active until verified
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Store verification request
    const request: VerificationRequest = {
      id: verificationId,
      type: "ministry",
      status: "pending",
      ministryData,
      adminData,
      documents,
      submittedAt: new Date(),
    };

    verificationRequests.set(verificationId, request);

    // Log the verification request
    logger.info("Ministry verification request submitted", {
      verificationId,
      ministryName: ministryData.name,
      adminEmail: adminData.officialEmail,
    });

    // Send notification to platform admins (in production, use email service)
    // TODO: Integrate with notification system

    return NextResponse.json({
      success: true,
      data: {
        verificationId,
        status: "pending_review",
        message: "Your verification request has been submitted successfully",
        expectedTimeline: "3-5 business days",
        nextSteps: [
          "Check your email for confirmation",
          "Save your verification ID for reference",
          "We'll contact you if additional documents are needed",
        ],
      },
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/verification/ministry", method: "POST" });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update verification request (upload additional documents or admin action)
export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify admin access
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (user.length === 0 || user[0].type !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { verificationId, action, notes } = body;

    if (!verificationId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing verification ID or action" },
        { status: 400 }
      );
    }

    const request = verificationRequests.get(verificationId);

    if (!request) {
      return NextResponse.json(
        { success: false, error: "Verification request not found" },
        { status: 404 }
      );
    }

    // Handle different actions
    switch (action) {
      case "approve": {
        // Update tenant status
        if (request.ministryData) {
          await db
            .update(tenants)
            .set({
              isActive: true,
              settings: {
                type: "ministry",
                level: request.ministryData.level,
                verificationStatus: "approved",
                verifiedAt: new Date().toISOString(),
              },
              updatedAt: new Date(),
            })
            .where(eq(tenants.name, request.ministryData.name));

          // Create admin user for the ministry
          const adminUserId = `user-${nanoid()}`;
          await db.insert(users).values({
            id: adminUserId,
            clerkUserId: userId, // Will be updated after they complete signup
            type: "admin",
            role: "ministry_admin",
            name: `${request.adminData?.firstName} ${request.adminData?.lastName}`,
            firstName: request.adminData?.firstName || "",
            lastName: request.adminData?.lastName || "",
            email: request.adminData?.officialEmail || "",
            phone: request.adminData?.phone || "",
            schoolId: null,
            tenantId: null, // Will be linked after tenant approval
            profileImage: "",
            dateOfBirth: "",
            gender: "",
            grade: 0,
            section: "",
            rollNumber: "",
            address: request.ministryData?.address || "",
            city: request.ministryData?.city || "",
            state: request.ministryData?.region || "",
            postalCode: request.ministryData?.postalCode || "",
            country: request.ministryData?.country || "",
            parentContact: "",
            parentPhone: "",
            emergencyContact: "",
            bloodGroup: "",
            enrollmentDate: new Date().toISOString().split("T")[0],
            lastLogin: "",
            employeeId: request.adminData?.employeeId,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        request.status = "approved";
        request.reviewedAt = new Date();
        request.reviewedBy = userId;
        request.notes = notes;

        logger.info("Ministry verification approved", { verificationId });
        break;
      }

      case "reject": {
        request.status = "rejected";
        request.reviewedAt = new Date();
        request.reviewedBy = userId;
        request.rejectionReason = notes;

        // Update tenant settings
        if (request.ministryData) {
          await db
            .update(tenants)
            .set({
              isActive: false,
              settings: {
                type: "ministry",
                level: request.ministryData.level,
                verificationStatus: "rejected",
                rejectionReason: notes,
              },
              updatedAt: new Date(),
            })
            .where(eq(tenants.name, request.ministryData.name));
        }

        logger.info("Ministry verification rejected", { verificationId, reason: notes });
        break;
      }

      case "request_info": {
        request.status = "needs_info";
        request.notes = notes;
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: {
        verificationId,
        status: request.status,
        message: `Verification request ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "updated"} successfully`,
      },
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/verification/ministry", method: "PATCH" });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove verification request
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify admin access
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (user.length === 0 || user[0].type !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const verificationId = searchParams.get("id");

    if (!verificationId) {
      return NextResponse.json(
        { success: false, error: "Missing verification ID" },
        { status: 400 }
      );
    }

    const deleted = verificationRequests.delete(verificationId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Verification request not found" },
        { status: 404 }
      );
    }

    logger.info("Verification request deleted", { verificationId });

    return NextResponse.json({
      success: true,
      message: "Verification request deleted successfully",
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/verification/ministry", method: "DELETE" });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
