/**
 * Student Career Roadmap API
 *
 * Manages student career roadmaps, milestones, and progress
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { careerRoadmaps, careerMilestones } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  getRoadmapForCareer,
  type RoadmapPhase,
  type RoadmapMilestone,
} from "@/lib/data/career-roadmaps";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    switch (action) {
      case "my-roadmap": {
        // Get student's active roadmap
        const roadmap = await db.query.careerRoadmaps.findFirst({
          where: (careers, { eq, and }) => and(
            eq(careers.studentId, userId),
            eq(careers.status, "active")
          ),
          with: {
            milestones: true,
          },
        });

        if (!roadmap) {
          return NextResponse.json({
            success: true,
            result: null,
            message: "No active roadmap found. Create one first.",
          });
        }

        return NextResponse.json({ success: true, result: roadmap });
      }

      case "template": {
        // Get roadmap template for a career
        const careerId = searchParams.get("careerId");
        if (!careerId) {
          return NextResponse.json({ error: "careerId required" }, { status: 400 });
        }

        const template = getRoadmapForCareer(careerId);
        return NextResponse.json({ success: true, result: template });
      }

      case "progress": {
        // Get progress summary
        const roadmap = await db.query.careerRoadmaps.findFirst({
          where: (careers, { eq, and }) => and(
            eq(careers.studentId, userId),
            eq(careers.status, "active")
          ),
        });

        if (!roadmap) {
          return NextResponse.json({ error: "No active roadmap" }, { status: 404 });
        }

        const milestones = await db.query.careerMilestones.findMany({
          where: (m, { eq }) => eq(m.roadmapId, roadmap.id),
        });

        const completed = milestones.filter((m) => m.status === "completed").length;
        const inProgress = milestones.filter((m) => m.status === "in-progress").length;
        const pending = milestones.filter((m) => m.status === "pending").length;

        return NextResponse.json({
          success: true,
          result: {
            total: milestones.length,
            completed,
            inProgress,
            pending,
            percentage: roadmap.progressPercentage,
            currentGrade: roadmap.currentGrade,
            targetCareer: roadmap.targetCareerTitle,
          },
        });
      }

      case "milestones": {
        // Get milestones for a roadmap
        const roadmapId = searchParams.get("roadmapId");
        if (!roadmapId) {
          return NextResponse.json({ error: "roadmapId required" }, { status: 400 });
        }

        const milestones = await db.query.careerMilestones.findMany({
          where: (m, { eq }) => eq(m.roadmapId, roadmapId),
          orderBy: (m, { asc }) => [asc(m.targetDate), asc(m.createdAt)],
        });

        return NextResponse.json({ success: true, result: milestones });
      }

      case "upcoming": {
        // Get upcoming milestones
        const roadmap = await db.query.careerRoadmaps.findFirst({
          where: (careers, { eq, and }) => and(
            eq(careers.studentId, userId),
            eq(careers.status, "active")
          ),
        });

        if (!roadmap) {
          return NextResponse.json({ error: "No active roadmap" }, { status: 404 });
        }

        const today = new Date();
        const milestones = await db.query.careerMilestones.findMany({
          where: (m, { eq, and }) => and(
            eq(m.roadmapId, roadmap.id),
            eq(m.status, "pending")
          ),
          orderBy: (m, { asc }) => [asc(m.targetDate)],
          limit: 5,
        });

        const upcoming = milestones.filter((m) => {
          if (!m.targetDate) return true;
          return new Date(m.targetDate) >= today;
        });

        return NextResponse.json({ success: true, result: upcoming });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Career Roadmap API error:", error);
    return NextResponse.json({ error: "Failed to get roadmap" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, careerId, careerTitle, grade } = body;

    switch (action) {
      case "create": {
        if (!careerId || !careerTitle) {
          return NextResponse.json(
            { error: "careerId and careerTitle required" },
            { status: 400 }
          );
        }

        // Archive existing active roadmaps
        await db
          .update(careerRoadmaps)
          .set({ status: "archived", updatedAt: new Date() })
          .where(eq(careerRoadmaps.studentId, userId));

        // Get roadmap template
        const template = getRoadmapForCareer(careerId);

        // Create new roadmap
        const newRoadmap = await db
          .insert(careerRoadmaps)
          .values({
            studentId: userId,
            targetCareerId: careerId,
            targetCareerTitle: careerTitle,
            currentGrade: grade || 10,
            phases: template.phases,
            milestones: template.phases.flatMap((phase) =>
              phase.milestones.map((m) => ({
                id: `${phase.id}-${m.id}`,
                title: m.title,
                description: m.description,
                category: m.category,
                status: m.status,
                dueDate: m.dueDate,
              }))
            ),
            totalMilestones: template.phases.reduce(
              (sum, p) => sum + p.milestones.length,
              0
            ),
            completedMilestones: 0,
            progressPercentage: 0,
            status: "active",
            updatedAt: new Date(),
          })
          .returning();

        // Create individual milestone records
        const roadmapId = newRoadmap[0].id;
        for (const phase of template.phases) {
          for (const milestone of phase.milestones) {
            await db.insert(careerMilestones).values({
              roadmapId,
              studentId: userId,
              milestoneId: `${phase.id}-${milestone.id}`,
              title: milestone.title,
              description: milestone.description,
              category: milestone.category,
              status: "pending",
              priority: milestone.priority || "medium",
              targetDate: milestone.dueDate
                ? new Date(milestone.dueDate)
                : undefined,
              resources: milestone.resources
                ? milestone.resources.map((r) => ({
                    title: r,
                    type: "link",
                  }))
                : undefined,
            });
          }
        }

        return NextResponse.json({
          success: true,
          result: newRoadmap[0],
          message: "Career roadmap created successfully",
        });
      }

      case "update-milestone": {
        const { milestoneId, status, studentNotes } = body;

        if (!milestoneId || !status) {
          return NextResponse.json(
            { error: "milestoneId and status required" },
            { status: 400 }
          );
        }

        // Get milestone to verify ownership
        const milestone = await db.query.careerMilestones.findFirst({
          where: (m, { eq }) => eq(m.id, milestoneId),
        });

        if (!milestone || milestone.studentId !== userId) {
          return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
        }

        const updateData: any = {
          status,
          updatedAt: new Date(),
        };

        if (status === "in-progress" && !milestone.startedAt) {
          updateData.startedAt = new Date();
        }

        if (status === "completed") {
          updateData.completedAt = new Date();
        }

        if (studentNotes) {
          updateData.studentNotes = studentNotes;
        }

        await db
          .update(careerMilestones)
          .set(updateData)
          .where(eq(careerMilestones.id, milestoneId));

        // Recalculate roadmap progress
        const allMilestones = await db.query.careerMilestones.findMany({
          where: (m, { eq }) => eq(m.roadmapId, milestone.roadmapId),
        });

        const completed = allMilestones.filter((m) => m.status === "completed").length;
        const progress = Math.round((completed / allMilestones.length) * 100);

        await db
          .update(careerRoadmaps)
          .set({
            completedMilestones: completed,
            progressPercentage: progress,
            updatedAt: new Date(),
          })
          .where(eq(careerRoadmaps.id, milestone.roadmapId));

        return NextResponse.json({
          success: true,
          result: { progress, completed },
          message: "Milestone updated successfully",
        });
      }

      case "update-grade": {
        const { newGrade } = body;

        if (!newGrade) {
          return NextResponse.json({ error: "newGrade required" }, { status: 400 });
        }

        const roadmap = await db.query.careerRoadmaps.findFirst({
          where: (careers, { eq, and }) => and(
            eq(careers.studentId, userId),
            eq(careers.status, "active")
          ),
        });

        if (!roadmap) {
          return NextResponse.json({ error: "No active roadmap" }, { status: 404 });
        }

        await db
          .update(careerRoadmaps)
          .set({ currentGrade: newGrade, updatedAt: new Date() })
          .where(eq(careerRoadmaps.id, roadmap.id));

        return NextResponse.json({
          success: true,
          message: "Grade updated successfully",
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Career Roadmap API error:", error);
    return NextResponse.json({ error: "Failed to update roadmap" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const roadmapId = searchParams.get("roadmapId");

    if (!roadmapId) {
      return NextResponse.json({ error: "roadmapId required" }, { status: 400 });
    }

    // Verify ownership
    const roadmap = await db.query.careerRoadmaps.findFirst({
      where: (r, { eq }) => eq(r.id, roadmapId),
    });

    if (!roadmap || roadmap.studentId !== userId) {
      return NextResponse.json({ error: "Roadmap not found" }, { status: 404 });
    }

    // Archive instead of delete
    await db
      .update(careerRoadmaps)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(careerRoadmaps.id, roadmapId));

    return NextResponse.json({
      success: true,
      message: "Roadmap archived successfully",
    });
  } catch (error) {
    console.error("Career Roadmap API error:", error);
    return NextResponse.json({ error: "Failed to archive roadmap" }, { status: 500 });
  }
}
