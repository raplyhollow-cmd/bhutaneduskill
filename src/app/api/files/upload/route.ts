import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { db } from "@/lib/db";
import { fileStorage, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  validateFile,
  sanitizeFileName,
  generateSafeFileName,
  getFileCategory,
  validateFileMagicNumber,
  validateFileSize,
} from "@/lib/file-validation";
import { checkRateLimit, getClientIp, getRateLimitPresetForPath, getRateLimitHeaders } from "@/lib/rate-limit";

// Rate limiting for file uploads (stricter than general API)
const UPLOAD_RATE_LIMIT = {
  maxRequests: 5, // 5 uploads
  windowMs: 60 * 1000, // per minute
};

/**
 * Enhanced file upload with security validations
 * - Magic number validation
 * - File size limits by category
 * - Filename sanitization
 * - Rate limiting
 * - Malware scanning placeholder
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting check
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(`${userId}_${clientIp}`, UPLOAD_RATE_LIMIT);

    const headers = getRateLimitHeaders({
      success: !rateLimitResult.isLimited,
      limit: UPLOAD_RATE_LIMIT.maxRequests,
      remaining: rateLimitResult.remaining,
      reset: new Date(rateLimitResult.resetTime),
    });

    if (rateLimitResult.isLimited) {
      return NextResponse.json(
        { error: "Too many upload requests. Please try again later." },
        { status: 429, headers }
      );
    }

    // Get current user
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate required parameters
    if (!entityType) {
      return NextResponse.json({ error: "Entity type is required" }, { status: 400 });
    }

    // Get file extension
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')) || '';
    const fileCategory = getFileCategory(file.type, fileExtension);

    // Validate file size based on category
    const sizeValidation = validateFileSize(file.size, fileCategory);
    if (!sizeValidation.isValid) {
      return NextResponse.json(
        { error: sizeValidation.error },
        { status: 400 }
      );
    }

    // Convert file to buffer for magic number check
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file type using magic numbers
    const magicNumberValidation = validateFileMagicNumber(buffer, fileExtension);
    if (!magicNumberValidation.isValid) {
      // Log security event
      console.warn('[Security] File upload magic number mismatch:', {
        userId,
        fileName: file.name,
        declaredType: file.type,
        detectedType: magicNumberValidation.detectedType,
        error: magicNumberValidation.error,
      });

      return NextResponse.json(
        { error: magicNumberValidation.error || "File validation failed" },
        { status: 400 }
      );
    }

    // Sanitize filename
    const safeFileName = sanitizeFileName(file.name);
    const storageFileName = generateSafeFileName(safeFileName, currentUser.id);

    // Create uploads directory with user subdirectory for organization
    const uploadsDir = join(process.cwd(), "public", "uploads", currentUser.id);
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    const filePath = join(uploadsDir, storageFileName);

    // Save file
    await writeFile(filePath, buffer);

    // TODO: Integrate virus scanning
    // For now, log for manual review
    console.log('[File Upload] File saved, awaiting virus scan:', {
      fileId: `file_${Date.now()}`,
      userId: currentUser.id,
      fileName: safeFileName,
      size: file.size,
      type: file.type,
    });

    // Create file storage record
    const timestamp = Date.now();
    const [fileRecord] = await db.insert(fileStorage).values({
      id: `file_${timestamp}`,
      schoolId: currentUser.schoolId,
      fileName: `/uploads/${currentUser.id}/${storageFileName}`,
      originalName: safeFileName,
      mimeType: file.type,
      size: file.size,
      storageType: "local",
      storagePath: filePath,
      uploadedBy: currentUser.id,
      entityType,
      entityId: entityId || "",
      isPublic: false,
      accessCount: 0,
      createdAt: new Date(),
    }).returning();

    // Return success with rate limit headers
    return NextResponse.json(
      { file: fileRecord },
      { status: 201, headers }
    );
  } catch (error) {
    console.error("File upload error:", error);

    // Clean up partial uploads if error occurred
    // (implementation would depend on error stage)

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

/**
 * Get allowed file types and size limits
 */
export async function GET() {
  return NextResponse.json({
    allowedTypes: {
      image: ['jpeg', 'png', 'gif', 'webp'],
      document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'],
      media: ['mp3', 'wav', 'ogg', 'mp4', 'avi', 'mov'],
    },
    maxSizes: {
      image: '5MB',
      document: '10MB',
      media: '100MB',
    },
  });
}
