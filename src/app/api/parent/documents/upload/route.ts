import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";
import { fileStorage, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * POST /api/parent/documents/upload - Upload consent form for child
 *
 * Parents can upload signed consent forms for their children.
 * Supported formats: PDF, DOC, DOCX, JPG, PNG
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current parent user
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.type !== "parent") {
      return NextResponse.json({ error: "Forbidden - Parents only" }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string; // This is the child ID
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!entityId) {
      return NextResponse.json({ error: "Child ID is required" }, { status: 400 });
    }

    // Verify the child belongs to this parent
    const child = await db.query.users.findFirst({
      where: and(
        eq(users.id, entityId),
        eq(users.parentId, currentUser.id)
      ),
    });

    if (!child) {
      return NextResponse.json({ error: "Child not found or access denied" }, { status: 403 });
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
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
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

    return NextResponse.json(
      {
        file: {
          id: fileRecord.id,
          url: fileRecord.url,
          originalName: fileRecord.originalName,
          category: fileRecord.category,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Parent file upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
