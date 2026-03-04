import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";
import { fileStorage, users, parents, parentToStudent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * POST /api/parent/documents/upload - Upload consent form for child
 *
 * SECURITY: FERPA COMPLIANCE
 * - Uses parent_to_student join table for verification
 * - Only allows uploads for verified children
 *
 * Parents can upload signed consent forms for their children.
 * Supported formats: PDF, DOC, DOCX, JPG, PNG
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string; // This is the child ID
    const description = formData.get("description") as string;

    if (!file) {
      return { error: "No file provided", status: 400 };
    }

    if (!entityId) {
      return { error: "Child ID is required", status: 400 };
    }

    // FERPA COMPLIANCE: Get parent record first
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      logger.warn("No parent record found for user", { userId });
      return { error: "Parent record not found", status: 403 };
    }

    // FERPA COMPLIANCE: Verify parent-child relationship via parent_to_student join table
    const [relationship] = await db
      .select()
      .from(parentToStudent)
      .where(
        and(
          eq(parentToStudent.parentId, parentRecord.id),
          eq(parentToStudent.studentId, entityId)
        )
      )
      .limit(1);

    if (!relationship) {
      logger.security("ferpa_violation_attempt", {
        parentId: parentRecord.id,
        childId: entityId,
        route: "/api/parent/documents/upload",
      });
      return { error: "Child not found or access denied", status: 403 };
    }

    // Verify the child exists
    const [child] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, entityId),
          eq(users.type, "student")
        )
      )
      .limit(1);

    if (!child) {
      return { error: "Child not found", status: 404 };
    }

    // Get file extension
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")) || "";

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      return { error: "Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG", status: 400 };
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { error: "File too large. Maximum size is 10MB", status: 400 };
    }

    // Sanitize filename
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageFileName = `consent_${nanoid(12)}${fileExtension}`;

    // Create uploads directory
    const uploadsDir = join(process.cwd(), "public", "uploads", "consents");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    const filePath = join(uploadsDir, storageFileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create file storage record
    const timestamp = Date.now();
    const fileId = `file_${timestamp}_${nanoid(8)}`;

    const [fileRecord] = await db.insert(fileStorage).values({
      id: fileId,
      userId: child.id, // Link to child
      fileName: `/uploads/consents/${storageFileName}`,
      originalName: safeFileName,
      mimeType: file.type,
      size: file.size,
      path: filePath,
      url: `/uploads/consents/${storageFileName}`,
      category: entityType || "consent_form",
      isPublic: false,
      accessCount: 0,
      createdAt: new Date(),
    }).returning();

    return {
      file: {
        id: fileRecord.id,
        url: fileRecord.url,
        originalName: fileRecord.originalName,
        category: fileRecord.category,
      },
    };
  },
  ["parent"]
);
