/**
 * School Verification API
 *
 * Handles school registration and verification requests for principals/IT admins.
 *
 * POST /api/verification/school
 * - Creates a new verification request for school registration
 * - Supports three verification methods: domain, document, ministry code
 * - Creates tenant record with status "pending"
 * - Creates verificationRequest record
 * - Instant verification for ministry code
 * - Returns verification code for domain verification
 *
 * GET /api/verification/school?requestId={id}
 * - Returns verification status for a request
 *
 * PATCH /api/verification/school
 * - Upload additional documents for existing request
 */

import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { tenants, verificationRequests } from "@/lib/db/tenancy-schema";
import { schools } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface SchoolVerificationRequest {
  // School Information
  schoolName: string;
  schoolType: string;
  schoolLevel: string;
  address: string;
  district: string;
  governmentId: string;
  contactEmail: string;
  contactPhone: string;
  website: string;

  // Admin Details
  adminName: string;
  adminTitle: string;
  adminEmail: string;
  adminPhone: string;
  employeeId: string;

  // Verification
  verificationMethod: string;
  domain: string;
  ministryCode: string;

  // Documents (base64 encoded)
  registrationCertificate?: string;
  appointmentLetter?: string;
  governmentIdDoc?: string;
}

interface VerificationStatusResponse {
  requestId: string;
  status: "pending" | "under_review" | "approved" | "rejected";
  verified: boolean;
  verificationMethod: string;
  submittedAt: string;
  reviewedAt?: string;
  notes?: string;
  rejectionReason?: string;
}

// ============================================================================
// MINISTRY CODE VALIDATION (Mock - In production, call Ministry API)
// ============================================================================

/**
 * Validate ministry school code
 * In production, this would call the Ministry of Education API
 */
async function validateMinistryCode(code: string): Promise<boolean> {
  // Mock validation - in production, verify against Ministry API
  // For now, accept codes in format: MOE-SCH-YYYY-NNN or SCH-YYYY-NNN
  const validPatterns = [
    /^MOE-SCH-\d{4}-\d{3,}$/,
    /^SCH-\d{4}-\d{3,}$/,
    /^MOE\d{6,}$/,
  ];

  return validPatterns.some((pattern) => pattern.test(code));
}

/**
 * Generate verification code for domain verification
 */
function generateVerificationCode(): string {
  return `edu-${nanoid(16)}`;
}

/**
 * Extract domain from email address
 */
function extractDomainFromEmail(email: string): string {
  const match = email.match(/@(.+)$/);
  return match ? match[1] : "";
}

/**
 * Validate email domain matches school domain
 */
function validateEmailDomain(email: string, domain: string): boolean {
  const emailDomain = extractDomainFromEmail(email);
  return emailDomain.toLowerCase() === domain.toLowerCase();
}

// ============================================================================
// POST HANDLER - Create Verification Request
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body: SchoolVerificationRequest = await req.json();

    logger.info("School verification request received", {
      schoolName: body.schoolName,
      verificationMethod: body.verificationMethod,
    });

    // Validate required fields
    const requiredFields = [
      "schoolName",
      "schoolType",
      "schoolLevel",
      "address",
      "district",
      "governmentId",
      "contactEmail",
      "contactPhone",
      "adminName",
      "adminTitle",
      "adminEmail",
      "adminPhone",
      "employeeId",
      "verificationMethod",
    ] as const;

    for (const field of requiredFields) {
      if (!body[field as keyof SchoolVerificationRequest]) {
        logger.apiError(new Error(`Missing required field: ${field}`), { route: "/api/verification/school", method: "POST" });
        return NextResponse.json(
          { error: `Missing required field: ${field}`, status: 400 } satisfies ApiErrorResponse,
          { status: 400 }
        );
      }
    }

    // Validate verification method specific requirements
    if (body.verificationMethod === "domain" && !body.domain) {
      return NextResponse.json(
        { error: "Domain is required for domain verification", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    if (body.verificationMethod === "ministry" && !body.ministryCode) {
      return NextResponse.json(
        { error: "Ministry code is required for ministry verification", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    if (body.verificationMethod === "document" && !body.registrationCertificate) {
      return NextResponse.json(
        { error: "Registration certificate is required for document verification", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // For domain verification, validate admin email matches domain
    if (body.verificationMethod === "domain" && body.domain) {
      if (!validateEmailDomain(body.adminEmail, body.domain)) {
        return NextResponse.json(
          {
            error: "Admin email must match the school domain being verified",
            details: { email: body.adminEmail, domain: body.domain },
            status: 400
          } satisfies ApiErrorResponse,
          { status: 400 }
        );
      }
    }

    // Check if school with same government ID already exists
    const existingTenant = await db.query.tenants.findFirst({
      where: eq(tenants.governmentId, body.governmentId),
    });

    if (existingTenant) {
      logger.security("duplicate_school_registration", {
        governmentId: body.governmentId,
        existingTenantId: existingTenant.id,
      });

      return NextResponse.json(
        {
          error: "A school with this government ID is already registered",
          details: { existingTenantId: existingTenant.id },
          status: 409
        } satisfies ApiErrorResponse,
        { status: 409 }
      );
    }

    // Generate IDs
    const tenantId = `tenant-${nanoid()}`;
    const requestId = `vr-${nanoid()}`;
    const verificationCode = body.verificationMethod === "domain" ? generateVerificationCode() : undefined;

    // Determine initial status
    let tenantStatus: "pending" | "verified" | "active" = "pending";
    let verificationStatus: "pending" | "under_review" | "approved" = "pending";

    // Ministry code verification - instant verification
    if (body.verificationMethod === "ministry") {
      const isValidCode = await validateMinistryCode(body.ministryCode);

      if (isValidCode) {
        tenantStatus = "verified";
        verificationStatus = "approved";
        logger.info("School verified via ministry code", {
          schoolName: body.schoolName,
          ministryCode: body.ministryCode,
        });
      } else {
        return NextResponse.json(
          { error: "Invalid ministry code. Please check with your Ministry of Education.", status: 400 } satisfies ApiErrorResponse,
          { status: 400 }
        );
      }
    }

    // Create tenant record
    const newTenant = {
      id: tenantId,
      name: body.schoolName,
      code: body.governmentId,
      type: "school" as const,
      domain: body.domain || null,
      governmentId: body.governmentId,
      status: tenantStatus,
      verificationMethod: body.verificationMethod,
      address: body.address,
      city: body.district,
      district: body.district,
      country: "Bhutan",
      phone: body.contactPhone,
      email: body.contactEmail,
      website: body.website || null,
      verifiedAt: tenantStatus === "verified" ? new Date() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(tenants).values(newTenant);

    // Prepare documents array
    const documents: Array<{
      type: string;
      url: string;
      name: string;
      size?: number;
    }> = [];

    if (body.registrationCertificate) {
      documents.push({
        type: "registration_certificate",
        url: body.registrationCertificate,
        name: "School Registration Certificate",
      });
    }

    if (body.appointmentLetter) {
      documents.push({
        type: "appointment_letter",
        url: body.appointmentLetter,
        name: "Principal/IT Admin Appointment Letter",
      });
    }

    if (body.governmentIdDoc) {
      documents.push({
        type: "government_id",
        url: body.governmentIdDoc,
        name: "Government ID",
      });
    }

    // Create verification request record
    const newVerificationRequest = {
      id: requestId,
      tenantId,
      userId: `pending-${nanoid()}`, // Placeholder until user creates account
      type: "school_signup",
      documents,
      governmentId: body.ministryCode || body.governmentId,
      domain: body.domain || null,
      status: verificationStatus,
      submittedAt: new Date(),
      reviewedAt: verificationStatus === "approved" ? new Date() : null,
      reviewedBy: verificationStatus === "approved" ? "system" : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(verificationRequests).values(newVerificationRequest);

    // Create school record if verified
    if (tenantStatus === "verified") {
      const schoolCode = `SCH-${body.district.substring(0, 3).toUpperCase()}-${nanoid(6)}`;

      await db.insert(schools).values({
        id: `school-${nanoid()}`,
        name: body.schoolName,
        code: schoolCode,
        type: body.schoolType as "public" | "private" | "international",
        address: body.address,
        city: body.district,
        state: body.district,
        country: "Bhutan",
        postalCode: "",
        phone: body.contactPhone,
        email: body.contactEmail,
        website: body.website || "",
        logo: "",
        establishedYear: new Date().getFullYear(),
        accreditationStatus: "registered",
        maxStudents: 500,
        campusSize: "Standard",
        facilities: [],
        board: "BCSEA",
        principalName: body.adminName,
        principalEmail: body.adminEmail,
        principalPhone: body.adminPhone,
        counselorName: "",
        counselorEmail: "",
        counselorPhone: "",
        vicePrincipalName: "",
        schoolType: body.schoolType,
        level: body.schoolLevel,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        tenantId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Send confirmation email (mock)
    // In production, integrate with email service
    logger.info("Confirmation email would be sent", {
      email: body.adminEmail,
      schoolName: body.schoolName,
      verificationMethod: body.verificationMethod,
    });

    // Prepare response
    const responseData = {
      data: {
        requestId,
        tenantId,
        status: verificationStatus,
        verified: tenantStatus === "verified",
        verificationCode,
        message: tenantStatus === "verified"
          ? "Your school has been verified! You can now sign in."
          : body.verificationMethod === "domain"
          ? "Please add the DNS TXT record to verify your domain."
          : "Your documents have been submitted for review. You will receive an email once verification is complete.",
      }
    };

    logger.info("School verification request created successfully", {
      requestId,
      tenantId,
      status: verificationStatus,
    });

    return NextResponse.json(responseData, { status: 201 });

  } catch (error) {
    logger.apiError(error, { route: "/api/verification/school", method: "POST" });
    return NextResponse.json(
      { error: "Internal server error", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// GET HANDLER - Get Verification Status
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing requestId parameter", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const verificationRequest = await db.query.verificationRequests.findFirst({
      where: eq(verificationRequests.id, requestId),
    });

    if (!verificationRequest) {
      return NextResponse.json(
        { error: "Verification request not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Get tenant using select to ensure we use correct schema
    const tenantResult = await db
      .select({
        status: tenants.status,
        verifiedAt: tenants.verifiedAt,
      })
      .from(tenants)
      .where(eq(tenants.id, verificationRequest.tenantId))
      .limit(1);

    const tenant = tenantResult[0];

    const response = {
      data: {
        requestId: verificationRequest.id,
        status: verificationRequest.status as any,
        verified: tenant?.status === "verified" || tenant?.status === "active",
        verificationMethod: verificationRequest.type,
        submittedAt: verificationRequest.submittedAt.toISOString(),
        reviewedAt: verificationRequest.reviewedAt?.toISOString(),
        notes: verificationRequest.notes || undefined,
        rejectionReason: verificationRequest.rejectionReason || undefined,
      } as VerificationStatusResponse
    };

    return NextResponse.json(response);

  } catch (error) {
    logger.apiError(error, { route: "/api/verification/school", method: "GET" });
    return NextResponse.json(
      { error: "Internal server error", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH HANDLER - Upload Additional Documents
// ============================================================================

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId, documentType, documentData, documentName } = body;

    if (!requestId || !documentType || !documentData) {
      return NextResponse.json(
        { error: "Missing required fields: requestId, documentType, documentData", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get verification request
    const verificationRequest = await db.query.verificationRequests.findFirst({
      where: eq(verificationRequests.id, requestId),
    });

    if (!verificationRequest) {
      return NextResponse.json(
        { error: "Verification request not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Check if request is still pending
    if (verificationRequest.status !== "pending" && verificationRequest.status !== "more_info_required") {
      return NextResponse.json(
        { error: "Cannot add documents to a completed request", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Add new document to array
    const updatedDocuments = [
      ...(verificationRequest.documents as any[]),
      {
        type: documentType,
        url: documentData,
        name: documentName || `${documentType}_${Date.now()}`,
      },
    ];

    // Update verification request
    await db
      .update(verificationRequests)
      .set({
        documents: updatedDocuments as any,
        updatedAt: new Date(),
      })
      .where(eq(verificationRequests.id, requestId));

    logger.info("Additional document uploaded", {
      requestId,
      documentType,
    });

    return NextResponse.json({
      data: {
        success: true,
        message: "Document uploaded successfully",
      }
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/verification/school", method: "PATCH" });
    return NextResponse.json(
      { error: "Internal server error", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
