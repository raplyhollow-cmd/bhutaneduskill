/**
 * FILE [id] API
 *
 * GET /api/files/[id] - Download file or get file metadata
 * DELETE /api/files/[id] - Delete file
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { fileStorage } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import { join } from "path";
import { createApiRoute } from "@/lib/api/route-handler";
import { NextResponse } from "next/server";

// GET /api/files/[id] - Download file or get file metadata
export const GET = createApiRoute(
  async (req: NextRequest, auth, context) => {
    const { userId, user } = auth;

    const { searchParams } = new URL(req.url);
    const download = searchParams.get("download") === "true";

    const params = await context?.params as { id?: string } | undefined;
    const id = params?.id;

    if (!id) {
      return { error: "Missing file ID", status: 400 };
    }

    const [file] = await db
      .select()
      .from(fileStorage)
      .where(eq(fileStorage.id, id))
      .limit(1);

    if (!file) {
      return { error: "File not found", status: 404 };
    }

    // Check access permissions
    // Allow if: public, same school, or uploader
    type FileWithMetadata = typeof file & {
      schoolId?: string;
      uploadedBy?: string;
      accessCount?: number;
      storageType?: string;
      storagePath?: string;
    };
    const fileWithMeta = file as FileWithMetadata;

    if (!file.isPublic && fileWithMeta.schoolId !== user.schoolId && fileWithMeta.uploadedBy !== userId) {
      return { error: "Forbidden", status: 403 };
    }

    // Increment access count
    await db.update(fileStorage)
      .set({ accessCount: (fileWithMeta.accessCount || 0) + 1 })
      .where(eq(fileStorage.id, id));

    // If just getting metadata, return it
    if (!download) {
      return { file };
    }

    // For local storage, read and return the file
    if (fileWithMeta.storageType === "local") {
      const filePath = join(process.cwd(), "public", file.fileName.replace("/uploads/", "uploads/"));
      const fileContent = await readFile(filePath);

      return new NextResponse(fileContent, {
        headers: {
          "Content-Type": file.mimeType,
          "Content-Disposition": `attachment; filename="${file.originalName}"`,
        },
      });
    }

    // For external storage, redirect to URL
    if (fileWithMeta.storageType === "s3" || fileWithMeta.storageType === "cloudflare_r2") {
      return NextResponse.redirect(fileWithMeta.storagePath);
    }

    return { error: "Cannot download this file type", status: 400 };
  },
  ['admin', 'school-admin', 'teacher', 'student', 'parent']
);

// DELETE /api/files/[id] - Delete file
export const DELETE = createApiRoute(
  async (req: NextRequest, auth, context) => {
    const { userId, user } = auth;

    const params = await context?.params as { id?: string } | undefined;
    const id = params?.id;

    if (!id) {
      return { error: "Missing file ID", status: 400 };
    }

    const [file] = await db
      .select()
      .from(fileStorage)
      .where(eq(fileStorage.id, id))
      .limit(1);

    if (!file) {
      return { error: "File not found", status: 404 };
    }

    // Only uploader or admin can delete
    type FileWithUploader = typeof file & { uploadedBy?: string };
    const fileWithUploader = file as FileWithUploader;
    if (fileWithUploader.uploadedBy !== userId && user.type !== "admin") {
      return { error: "Forbidden", status: 403 };
    }

    // Delete from database
    await db.delete(fileStorage).where(eq(fileStorage.id, id));

    // For local files, you might want to delete the actual file too
    // This is optional depending on your requirements

    return { success: true };
  },
  ['admin', 'school-admin', 'teacher', 'student', 'parent']
);
