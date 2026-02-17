import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
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
import { checkRateLimitWithConfig, getClientIp, RateLimitPresets, type RateLimitCheckResult } from "@/lib/rate-limit";

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
    // Authentication check with role-based access
    const authResult = await requireAuth(['admin', 'school-admin', 'teacher', 'student']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId, user } = authResult;

    // Rate limiting check using fileUpload preset
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimitWithConfig(
      `user:${userId}:${clientIp}`,
      RateLimitPresets.fileUpload
    );

    // Create rate limit headers
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString(),
    };

    if (rateLimitResult.retryAfter) {
      headers['Retry-After'] = rateLimitResult.retryAfter.toString();
    }

    if (!rateLimitResult.allowed) {
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
      logger.warn('[Security] File upload magic number mismatch:', {
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
    logger.info('[File Upload] File saved, awaiting virus scan:', {
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
      userId: currentUser.id,
      fileName: `/uploads/${currentUser.id}/${storageFileName}`,
      originalName: safeFileName,
      mimeType: file.type,
      size: file.size,
      path: filePath,
      url: `/uploads/${currentUser.id}/${storageFileName}`,
      category: entityType || "other",
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
    logger.apiError(error, { route: "/", method: "GET" });

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
  // Authentication check with role-based access
  const authResult = await requireAuth(['admin', 'school-admin', 'teacher', 'student']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

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
