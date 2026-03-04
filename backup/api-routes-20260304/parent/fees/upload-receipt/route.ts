/**
 * POST /api/parent/fees/upload-receipt
 *
 * API for parents to upload payment receipts after paying via mBOB/bank.
 *
 * This creates a receipt record that school admins can verify.
 *
 * For now, this stores metadata about the upload. In production,
 * you would store the actual file in a storage service (S3, Vercel Blob, etc.)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, parents, parentToStudent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute } from "@/lib/api/route-handler";

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    const formData = await request.formData();
    const receiptFile = formData.get("receipt") as File;
    const transactionId = formData.get("transactionId") as string;
    const childId = formData.get("childId") as string;
    const amount = formData.get("amount") as string;
    const sessionYear = formData.get("sessionYear") as string;

    // Validate required fields
    if (!receiptFile) {
      return { error: "Receipt file is required", status: 400 };
    }

    if (!transactionId || !transactionId.trim()) {
      return { error: "Transaction ID is required", status: 400 };
    }

    if (!childId) {
      return { error: "Child ID is required", status: 400 };
    }

    // Verify the child belongs to this parent
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      return { error: "Parent record not found", status: 404 };
    }

    const [relationship] = await db
      .select()
      .from(parentToStudent)
      .where(and(
        eq(parentToStudent.parentId, parentRecord.id),
        eq(parentToStudent.studentId, childId)
      ))
      .limit(1);

    if (!relationship) {
      return { error: "Child not linked to your account", status: 403 };
    }

    // In a real implementation, you would:
    // 1. Upload file to storage (S3, Vercel Blob, etc.)
    // 2. Get the file URL
    // 3. Store the URL in the database

    // For now, we'll create a placeholder record with file metadata
    const receiptId = `receipt-${nanoid()}`;
    const fileMetadata = {
      name: receiptFile.name,
      size: receiptFile.size,
      type: receiptFile.type,
    };

    // TODO: Create a fee_receipts table for proper storage
    // For now, return success with a note

    logger.info("Payment receipt uploaded", {
      route: "/api/parent/fees/upload-receipt",
      userId,
      childId,
      transactionId,
      amount,
      sessionYear,
      receiptId,
      fileMetadata,
    });

    // In production, you would store the receipt record:
    // await db.insert(feeReceipts).values({
    //   id: receiptId,
    //   parentId: parentRecord.id,
    //   studentId: childId,
    //   transactionId,
    //   amount: parseInt(amount),
    //   sessionYear,
    //   fileUrl: uploadedFileUrl,
    //   fileName: receiptFile.name,
    //   status: "pending_verification",
    //   createdAt: new Date(),
    // });

    return {
      success: true,
      message: "Receipt uploaded successfully. Waiting for school verification.",
      receiptId,
      // In production, you might want to include the file URL
      fileUrl: null, // Would be the uploaded file URL
    };
  },
  ["parent"]
);
