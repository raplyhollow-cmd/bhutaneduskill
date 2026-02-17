import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { fileStorage, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import { join } from "path";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/files/[id] - Download file or get file metadata
export async function GET(request: NextRequest, { params }: Params) {
  try {
    // Authentication check with role-based access (parents can download their child's documents)
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher', 'student', 'parent']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const download = searchParams.get("download") === "true";

    const { id } = await params;
    const file = await db.query.fileStorage.findFirst({
      where: eq(fileStorage.id, id),
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check access permissions
    // Allow if: public, same school, or uploader
    if (!file.isPublic && (file as any).schoolId !== user.schoolId && (file as any).uploadedBy !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Increment access count
    await db.update(fileStorage)
      .set({ accessCount: ((file as any).accessCount || 0) + 1 })
      .where(eq(fileStorage.id, id));

    // If just getting metadata, return it
    if (!download) {
      return NextResponse.json({ file });
    }

    // For local storage, read and return the file
    if ((file as any).storageType === "local") {
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
    if ((file as any).storageType === "s3" || (file as any).storageType === "cloudflare_r2") {
      return NextResponse.redirect((file as any).storagePath);
    }

    return NextResponse.json({ error: "Cannot download this file type" }, { status: 400 });
  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}

// DELETE /api/files/[id] - Delete file
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    // Authentication check with role-based access (parents can download their child's documents)
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher', 'student', 'parent']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, user } = authResult;

    const { id } = await params;
    const file = await db.query.fileStorage.findFirst({
      where: eq(fileStorage.id, id),
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Only uploader or admin can delete
    if ((file as any).uploadedBy !== userId && user.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from database
    await db.delete(fileStorage).where(eq(fileStorage.id, id));

    // For local files, you might want to delete the actual file too
    // This is optional depending on your requirements

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
