import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { fileStorage, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "fs/promises";
import { join } from "path";

interface Params {
  params: { id: string };
}

// GET /api/files/[id] - Download file or get file metadata
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get("download") === "true";

    const file = await db.query.fileStorage.findFirst({
      where: eq(fileStorage.id, params.id),
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check access permissions
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Allow if: public, same school, or uploader
    if (!file.isPublic && file.schoolId !== currentUser.schoolId && file.uploadedBy !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Increment access count
    await db.update(fileStorage)
      .set({ accessCount: (file.accessCount || 0) + 1 })
      .where(eq(fileStorage.id, params.id));

    // If just getting metadata, return it
    if (!download) {
      return NextResponse.json({ file });
    }

    // For local storage, read and return the file
    if (file.storageType === "local") {
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
    if (file.storageType === "s3" || file.storageType === "cloudflare_r2") {
      return NextResponse.redirect(file.storagePath);
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

    const file = await db.query.fileStorage.findFirst({
      where: eq(fileStorage.id, params.id),
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Only uploader or admin can delete
    if (file.uploadedBy !== currentUser.id && currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete from database
    await db.delete(fileStorage).where(eq(fileStorage.id, params.id));

    // For local files, you might want to delete the actual file too
    // This is optional depending on your requirements

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("File delete error:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
