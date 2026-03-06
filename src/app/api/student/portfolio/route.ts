/**
 * Student Portfolio API
 *
 * Manages student skill evidence, projects, and portfolio for career applications
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { skillEvidence, users } from "@/lib/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const category = searchParams.get("category");

    switch (action) {
      case "all": {
        // Get all portfolio items
        const evidence = await db.query.skillEvidence.findMany({
          where: (evidence, { eq }) => eq(evidence.studentId, userId),
          orderBy: (evidence, { desc }) => [desc(evidence.isFeatured), desc(evidence.completedDate)],
        });

        // Group by category
        const grouped = evidence.reduce((acc, item) => {
          const cat = item.skillCategory;
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(item);
          return acc;
        }, {} as Record<string, typeof evidence>);

        return NextResponse.json({
          success: true,
          result: {
            all: evidence,
            grouped,
            featured: evidence.filter((e) => e.isFeatured),
          },
        });
      }

      case "featured": {
        // Get featured portfolio items
        const featured = await db.query.skillEvidence.findMany({
          where: (evidence, { eq, and }) => and(
            eq(evidence.studentId, userId),
            eq(evidence.isFeatured, true)
          ),
          orderBy: (evidence, { asc }) => [asc(evidence.showcaseOrder), desc(evidence.completedDate)],
        });

        return NextResponse.json({ success: true, result: featured });
      }

      case "category": {
        // Get items by category
        if (!category) {
          return NextResponse.json({ error: "category required" }, { status: 400 });
        }

        const items = await db.query.skillEvidence.findMany({
          where: (evidence, { eq, and }) => and(
            eq(evidence.studentId, userId),
            eq(evidence.skillCategory, category)
          ),
          orderBy: (evidence, { desc }) => [desc(evidence.completedDate)],
        });

        return NextResponse.json({ success: true, result: items });
      }

      case "stats": {
        // Get portfolio statistics
        const allEvidence = await db.query.skillEvidence.findMany({
          where: (evidence, { eq }) => eq(evidence.studentId, userId),
        });

        const byStatus = allEvidence.reduce(
          (acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          },
          { pending: 0, approved: 0, rejected: 0 }
        );

        const byCategory = allEvidence.reduce((acc, item) => {
          acc[item.skillCategory] = (acc[item.skillCategory] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const byType = allEvidence.reduce((acc, item) => {
          acc[item.evidenceType] = (acc[item.evidenceType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
          success: true,
          result: {
            total: allEvidence.length,
            byStatus,
            byCategory,
            byType,
            featuredCount: allEvidence.filter((e) => e.isFeatured).length,
          },
        });
      }

      case "for-export": {
        // Get all data needed for portfolio export
        const evidence = await db.query.skillEvidence.findMany({
          where: (e, { eq, and }) => and(
            eq(e.studentId, userId),
            eq(e.status, "approved")
          ),
          orderBy: (evidence, { desc }) => [desc(evidence.isFeatured), desc(evidence.completedDate)],
        });

        // Get student profile data
        const student = await db.query.users.findFirst({
          where: (u, { eq }) => eq(u.id, userId),
        });

        return NextResponse.json({
          success: true,
          result: {
            student: {
              firstName: student?.firstName,
              lastName: student?.lastName,
              email: student?.email,
            },
            evidence,
            exportDate: new Date().toISOString(),
          },
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Portfolio API error:", error);
    return NextResponse.json({ error: "Failed to get portfolio" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "add-evidence": {
        const {
          skillId,
          skillName,
          skillCategory,
          evidenceType,
          title,
          description,
          fileUrl,
          completedDate,
          proficiencyLevel,
        } = body;

        if (!skillId || !skillName || !evidenceType || !title) {
          return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 }
          );
        }

        const newEvidence = await db
          .insert(skillEvidence)
          .values({
            studentId: userId,
            skillId,
            skillName,
            skillCategory,
            evidenceType,
            title,
            description,
            fileUrl,
            completedDate: completedDate ? new Date(completedDate) : new Date(),
            proficiencyLevel,
            status: "pending",
          })
          .returning();

        return NextResponse.json({
          success: true,
          result: newEvidence[0],
          message: "Evidence added successfully",
        });
      }

      case "toggle-featured": {
        const { evidenceId } = body;

        if (!evidenceId) {
          return NextResponse.json({ error: "evidenceId required" }, { status: 400 });
        }

        const evidence = await db.query.skillEvidence.findFirst({
          where: (evidence, { eq }) => eq(evidence.id, evidenceId),
        });

        if (!evidence || evidence.studentId !== userId) {
          return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
        }

        const updated = await db
          .update(skillEvidence)
          .set({
            isFeatured: !evidence.isFeatured,
            updatedAt: new Date(),
          })
          .where(eq(skillEvidence.id, evidenceId))
          .returning();

        return NextResponse.json({
          success: true,
          result: updated[0],
          message: `Evidence ${!evidence.isFeatured ? "featured" : "unfeatured"}`,
        });
      }

      case "reorder": {
        const { items } = body;

        if (!Array.isArray(items)) {
          return NextResponse.json({ error: "items must be an array" }, { status: 400 });
        }

        for (const item of items) {
          await db
            .update(skillEvidence)
            .set({ showcaseOrder: item.order, updatedAt: new Date() })
            .where(and(
              eq(skillEvidence.id, item.id),
              eq(skillEvidence.studentId, userId)
            ));
        }

        return NextResponse.json({
          success: true,
          message: "Portfolio reordered successfully",
        });
      }

      case "update-evidence": {
        const { evidenceId, title, description, proficiencyLevel } = body;

        if (!evidenceId) {
          return NextResponse.json({ error: "evidenceId required" }, { status: 400 });
        }

        const evidence = await db.query.skillEvidence.findFirst({
          where: (evidence, { eq }) => eq(evidence.id, evidenceId),
        });

        if (!evidence || evidence.studentId !== userId) {
          return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
        }

        // Only allow editing pending items
        if (evidence.status !== "pending") {
          return NextResponse.json(
            { error: "Can only edit pending evidence" },
            { status: 400 }
          );
        }

        const updateData: any = { updatedAt: new Date() };
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (proficiencyLevel) updateData.proficiencyLevel = proficiencyLevel;

        const updated = await db
          .update(skillEvidence)
          .set(updateData)
          .where(eq(skillEvidence.id, evidenceId))
          .returning();

        return NextResponse.json({
          success: true,
          result: updated[0],
          message: "Evidence updated successfully",
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Portfolio API error:", error);
    return NextResponse.json({ error: "Failed to update portfolio" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const evidenceId = searchParams.get("id");

    if (!evidenceId) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const evidence = await db.query.skillEvidence.findFirst({
      where: (evidence, { eq }) => eq(evidence.id, evidenceId),
    });

    if (!evidence || evidence.studentId !== userId) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    }

    // Only allow deleting pending items
    if (evidence.status !== "pending") {
      return NextResponse.json(
        { error: "Can only delete pending evidence" },
        { status: 400 }
      );
    }

    await db.delete(skillEvidence).where(eq(skillEvidence.id, evidenceId));

    return NextResponse.json({
      success: true,
      message: "Evidence deleted successfully",
    });
  } catch (error) {
    console.error("Portfolio API error:", error);
    return NextResponse.json({ error: "Failed to delete evidence" }, { status: 500 });
  }
}
