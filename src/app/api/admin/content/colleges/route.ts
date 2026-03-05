import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { rubColleges as colleges } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { logContentModified, AuditActions } from "@/lib/audit-log";
import { createApiRoute } from "@/lib/api/route-handler";

const collegeSchema = z.object({
  name: z.string().min(1, "College name is required"),
  code: z.string().min(1, "College code is required"),
  type: z.string().optional(),
  dzongkhag: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  description: z.string().optional(),
  hasHostel: z.boolean().optional(),
  hasLibrary: z.boolean().optional(),
  hasLab: z.boolean().optional(),
  hasSports: z.boolean().optional(),
  programs: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/content/colleges - List colleges
export const GET = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const isActive = searchParams.get("isActive");

    const allColleges = await db
      .select()
      .from(colleges)
      .orderBy(desc(colleges.createdAt));

    let filtered = allColleges;
    if (isActive === "true") {
      filtered = filtered.filter(c => c.isActive === true);
    } else if (isActive === "false") {
      filtered = filtered.filter(c => c.isActive === false);
    }

    logger.info("Colleges fetched", { userId, count: filtered.length });

    return { data: filtered };
  },
  ['admin']
);

// POST /api/admin/content/colleges - Add college
export const POST = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;

    const body = await req.json();
    const validatedData = collegeSchema.parse(body);

    const collegeId = `college_${Date.now()}`;

    const [newCollege] = await db.insert(colleges).values({
      id: collegeId,
      name: validatedData.name,
      code: validatedData.code,
      type: validatedData.type || "constituent",
      dzongkhag: validatedData.dzongkhag,
      location: validatedData.location,
      website: validatedData.website || null,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      description: validatedData.description || null,
      hasHostel: validatedData.hasHostel ?? false,
      hasLibrary: validatedData.hasLibrary ?? true,
      hasLab: validatedData.hasLab ?? false,
      hasSports: validatedData.hasSports ?? false,
      programs: validatedData.programs || [],
      isActive: validatedData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("College created", { collegeId, userId });

    // Log audit event for college creation
    await logContentModified(
      AuditActions.COLLEGE_CREATED,
      "college",
      collegeId,
      undefined,
      {
        name: newCollege.name,
        code: newCollege.code,
        type: newCollege.type,
        dzongkhag: newCollege.dzongkhag,
      },
      userId,
      req
    );

    return { data: newCollege, message: "College created successfully" };
  },
  ['admin']
);

// PUT /api/admin/content/colleges - Update college
export const PUT = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return { error: "College ID is required" };
    }

    const body = await req.json();
    const validatedData = collegeSchema.partial().parse(body);

    // Check if college exists
    const [existing] = await db
      .select()
      .from(colleges)
      .where(eq(colleges.id, id))
      .limit(1);

    if (!existing) {
      return { error: "College not found" };
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only include fields that were provided
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.code !== undefined) updateData.code = validatedData.code;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.dzongkhag !== undefined) updateData.dzongkhag = validatedData.dzongkhag;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.website !== undefined) updateData.website = validatedData.website || null;
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null;
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
    if (validatedData.hasHostel !== undefined) updateData.hasHostel = validatedData.hasHostel;
    if (validatedData.hasLibrary !== undefined) updateData.hasLibrary = validatedData.hasLibrary;
    if (validatedData.hasLab !== undefined) updateData.hasLab = validatedData.hasLab;
    if (validatedData.hasSports !== undefined) updateData.hasSports = validatedData.hasSports;
    if (validatedData.programs !== undefined) updateData.programs = validatedData.programs;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    const [updatedCollege] = await db.update(colleges)
      .set(updateData)
      .where(eq(colleges.id, id))
      .returning();

    logger.info("College updated", { collegeId: id, userId });

    // Log audit event for college update
    await logContentModified(
      AuditActions.COLLEGE_UPDATED,
      "college",
      id,
      { name: existing.name, code: existing.code },
      { name: updatedCollege.name, code: updatedCollege.code },
      userId,
      req
    );

    return { data: updatedCollege, message: "College updated successfully" };
  },
  ['admin']
);

// DELETE /api/admin/content/colleges - Delete college
export const DELETE = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return { error: "College ID is required" };
    }

    // Check if college exists
    const [existing] = await db
      .select()
      .from(colleges)
      .where(eq(colleges.id, id))
      .limit(1);

    if (!existing) {
      return { error: "College not found" };
    }

    await db.delete(colleges).where(eq(colleges.id, id));

    logger.info("College deleted", { collegeId: id, userId });

    // Log audit event for college deletion
    await logContentModified(
      AuditActions.COLLEGE_DELETED,
      "college",
      id,
      { name: existing.name, code: existing.code },
      undefined,
      userId,
      req
    );

    return { data: { success: true }, message: "College deleted successfully" };
  },
  ['admin']
);
