/**
 * CONSENT [id] API
 *
 * PATCH /api/consent/[id] - Update consent status (approve/revoke)
 * GET /api/consent/[id] - Get single consent record
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { consentRecords } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

type ConsentContext = { id: string };

// PATCH /api/consent/[id] - Update consent status (approve/revoke)
export const PATCH = createApiRoute<ConsentContext>(
  async (req: NextRequest, auth, context) => {
    const { user } = auth;
    const params = await context?.params;
    const id = params?.id;

    if (!id) {
      return { error: "Missing consent ID", status: 400 };
    }

    const body = await req.json();
    const { status } = body;

    if (!["approved", "revoked", "denied"].includes(status)) {
      return { error: "Invalid status", status: 400 };
    }

    const [record] = await db
      .select()
      .from(consentRecords)
      .where(eq(consentRecords.id, id))
      .limit(1);

    if (!record) {
      return { error: "Consent record not found", status: 404 };
    }

    // Only the parent can approve/deny their consent
    if (record.parentId !== user.id) {
      return { error: "Forbidden", status: 403 };
    }

    type ConsentUpdateData = {
      status: string;
      consentedAt?: Date;
      revokedAt?: Date;
    };

    const updateData: ConsentUpdateData = {
      status,
    };

    if (status === "approved") {
      updateData.consentedAt = new Date();
    } else if (status === "revoked") {
      updateData.revokedAt = new Date();
    }

    const [updatedRecord] = await db
      .update(consentRecords)
      .set(updateData)
      .where(eq(consentRecords.id, id))
      .returning();

    return { record: updatedRecord };
  },
  ['parent', 'admin', 'school-admin']
);

// GET /api/consent/[id] - Get single consent record
export const GET = createApiRoute<ConsentContext>(
  async (req: NextRequest, _auth, context) => {
    const params = await context?.params;
    const id = params?.id;

    if (!id) {
      return { error: "Missing consent ID", status: 400 };
    }

    const [record] = await db
      .select()
      .from(consentRecords)
      .where(eq(consentRecords.id, id))
      .limit(1);

    if (!record) {
      return { error: "Consent record not found", status: 404 };
    }

    return { record };
  },
  ['parent', 'admin', 'counselor']
);
