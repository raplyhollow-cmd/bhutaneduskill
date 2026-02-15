/**
 * DNS Verification API
 *
 * Verifies domain ownership via DNS TXT record lookup.
 *
 * POST /api/verification/verify-domain
 * - Checks DNS TXT record for verification code
 * - Updates tenant status if verified
 * - Returns verification result
 *
 * This endpoint uses Node.js dns module for DNS lookups.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tenants, verificationRequests } from "@/lib/db/tenancy-schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { resolveTxt } from "dns";

// ============================================================================
// TYPES
// ============================================================================

interface DomainVerificationRequest {
  domain: string;
  requestId: string;
  verificationCode?: string;
}

interface DomainVerificationResponse {
  verified: boolean;
  domain: string;
  message: string;
  tenantId?: string;
}

// ============================================================================
// DNS LOOKUP HELPERS
// ============================================================================

/**
 * Promisified DNS TXT record lookup
 */
function resolveTxtAsync(domain: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    resolveTxt(domain, (err, records) => {
      if (err) {
        reject(err);
      } else {
        resolve(records);
      }
    });
  });
}

/**
 * Check DNS TXT record for verification code
 *
 * The expected format is: bhutan-edu-verify=<code>
 * Example: bhutan-edu-verify=edu-abc123def456...
 */
async function checkDnsTxtRecord(domain: string, expectedCode: string): Promise<boolean> {
  try {
    // Normalize domain
    const normalizedDomain = domain.toLowerCase().trim();

    // Remove any protocol prefix
    if (normalizedDomain.startsWith("http://") || normalizedDomain.startsWith("https://")) {
      const url = new URL(normalizedDomain);
      return checkDnsTxtRecord(url.hostname, expectedCode);
    }

    // Remove any path
    const hostname = normalizedDomain.split("/")[0];

    logger.info("Checking DNS TXT record", { domain: hostname, expectedCode: expectedCode.substring(0, 10) + "..." });

    // Query TXT records
    const records = await resolveTxtAsync(hostname);

    // records is an array of arrays, each inner array contains parts of a TXT record
    // We need to join them and check for our verification code
    const txtRecords = records.map((parts) => parts.join(""));

    // Check for verification code in format: bhutan-edu-verify=<code>
    const expectedPrefix = `bhutan-edu-verify=${expectedCode}`;

    for (const record of txtRecords) {
      if (record === expectedPrefix) {
        logger.info("DNS TXT record verified successfully", { domain: hostname });
        return true;
      }

      // Also check if record starts with our prefix (for compatibility)
      if (record.startsWith("bhutan-edu-verify=")) {
        const actualCode = record.substring("bhutan-edu-verify=".length);
        if (actualCode === expectedCode) {
          logger.info("DNS TXT record verified successfully", { domain: hostname });
          return true;
        }
      }
    }

    logger.warn("DNS TXT record not found or invalid", {
      domain: hostname,
      foundRecords: txtRecords.length,
      records: txtRecords.map(r => r.substring(0, 50)).join(", "),
    });

    return false;
  } catch (error) {
    logger.apiError(error, {
      route: "/api/verification/verify-domain",
      method: "DNS Lookup",
      domain,
    });

    // DNS errors can occur if:
    // - Domain doesn't exist
    // - No TXT records found
    // - Network issues
    // - DNS server issues
    return false;
  }
}

/**
 * Extract verification code from request or database
 */
async function getVerificationCode(requestId: string, providedCode?: string): Promise<string | null> {
  if (providedCode) {
    return providedCode;
  }

  // Look up the verification request to get the code
  // In production, store the code in the verification request or tenant record
  const verificationRequest = await db.query.verificationRequests.findFirst({
    where: eq(verificationRequests.id, requestId),
  });

  // For now, we need to pass the code in the request
  // In production, store it securely in the database when request is created
  return null;
}

// ============================================================================
// POST HANDLER - Verify Domain
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const body: DomainVerificationRequest = await req.json();

    logger.info("Domain verification request received", {
      domain: body.domain,
      requestId: body.requestId,
    });

    // Validate request
    if (!body.domain || !body.requestId) {
      return NextResponse.json(
        { error: "Missing required fields: domain, requestId", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get verification request
    const verificationRequest = await db.query.verificationRequests.findFirst({
      where: eq(verificationRequests.id, body.requestId),
    });

    if (!verificationRequest) {
      return NextResponse.json(
        { error: "Verification request not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Check if already verified
    if (verificationRequest.status === "approved") {
      return NextResponse.json({
        data: {
          verified: true,
          domain: body.domain,
          message: "Domain already verified",
          tenantId: verificationRequest.tenantId,
        } as DomainVerificationResponse
      });
    }

    // Check if request is still pending
    if (verificationRequest.status !== "pending") {
      return NextResponse.json(
        {
          error: `Cannot verify domain for request with status: ${verificationRequest.status}`,
          status: 400
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get tenant using select to ensure correct schema
    const tenantResult = await db
      .select({
        id: tenants.id,
        domain: tenants.domain,
        status: tenants.status,
      })
      .from(tenants)
      .where(eq(tenants.id, verificationRequest.tenantId))
      .limit(1);

    const tenant = tenantResult[0];

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Verify the domain matches the tenant's expected domain
    if (tenant.domain && tenant.domain.toLowerCase() !== body.domain.toLowerCase()) {
      return NextResponse.json(
        {
          error: "Domain mismatch. Please verify the correct domain.",
          details: { expected: tenant.domain, provided: body.domain },
          status: 400
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // In production, retrieve the verification code from a secure store
    // For now, we'll use the provided code or generate one from request metadata
    let verificationCode = body.verificationCode;

    // If no code provided, try to extract from request metadata
    if (!verificationCode) {
      // The code should have been stored when the request was created
      // For this implementation, we'll use a deterministic approach
      // In production, store the code in verificationRequest.metadata
      verificationCode = `edu-${verificationRequest.id.substring(3)}`;
    }

    // Perform DNS lookup
    const isVerified = await checkDnsTxtRecord(body.domain, verificationCode);

    if (isVerified) {
      // Update tenant status
      await db
        .update(tenants)
        .set({
          status: "verified",
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenant.id));

      // Update verification request status
      await db
        .update(verificationRequests)
        .set({
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy: "system",
          updatedAt: new Date(),
        })
        .where(eq(verificationRequests.id, body.requestId));

      logger.info("Domain verification successful", {
        domain: body.domain,
        tenantId: tenant.id,
        requestId: body.requestId,
      });

      return NextResponse.json({
        data: {
          verified: true,
          domain: body.domain,
          message: "Domain verified successfully! Your school registration is complete.",
          tenantId: tenant.id,
        } as DomainVerificationResponse
      });
    }

    // Verification failed
    logger.warn("Domain verification failed", {
      domain: body.domain,
      requestId: body.requestId,
      expectedCode: verificationCode.substring(0, 10) + "...",
    });

    return NextResponse.json({
      data: {
        verified: false,
        domain: body.domain,
        message: "DNS TXT record not found. Please ensure you have added the verification record and DNS has propagated (may take 10-15 minutes).",
      } as DomainVerificationResponse
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/verification/verify-domain", method: "POST" });
    return NextResponse.json(
      { error: "Internal server error", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// GET HANDLER - Check Verification Status
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");
    const requestId = searchParams.get("requestId");

    if (!domain || !requestId) {
      return NextResponse.json(
        { error: "Missing required parameters: domain, requestId", status: 400 } satisfies ApiErrorResponse,
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

    // Get tenant using select
    const tenantResult = await db
      .select({
        id: tenants.id,
        status: tenants.status,
        verifiedAt: tenants.verifiedAt,
      })
      .from(tenants)
      .where(eq(tenants.id, verificationRequest.tenantId))
      .limit(1);

    const tenant = tenantResult[0];

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        verified: tenant.status === "verified" || tenant.status === "active",
        domain,
        tenantId: tenant.id,
        requestStatus: verificationRequest.status,
        tenantStatus: tenant.status,
        verifiedAt: tenant.verifiedAt?.toISOString() || null,
      }
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/verification/verify-domain", method: "GET" });
    return NextResponse.json(
      { error: "Internal server error", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
