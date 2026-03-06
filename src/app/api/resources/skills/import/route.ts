/**
 * Skills Ontology Import API
 *
 * Imports the skills ontology data into the system.
 * Admin only endpoint.
 */

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { skillsOntology } from "@/lib/data/skills-ontology";

/**
 * POST /api/resources/skills/import
 * Import skills ontology data into database
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    // TODO: Add proper admin check

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const skillData of skillsOntology) {
      try {
        // Check if skill exists
        const existing = await db.query.skills.findFirst({
          where: (eq(skills.id, skillData.id)),
        });

        const skillRecord = {
          id: skillData.id,
          name: skillData.name,
          category: skillData.category,
          description: skillData.description,
          difficulty: skillData.difficulty,
          bhutanDemand: skillData.bhutanDemand,
          bhutanSpecific: skillData.bhutanSpecific ?? false,
          emerging: skillData.emerging ?? false,
          typicalDevelopmentTime: skillData.typicalDevelopmentTime,
          parentIds: skillData.parentIds ?? [],
          relatedIds: skillData.relatedIds ?? [],
          careerRequirements: skillData.careerRequirements ?? [],
          resources: skillData.resources ?? [],
          beginnerResources: skillData.beginnerResources ?? [],
          intermediateResources: skillData.intermediateResources ?? [],
          advancedResources: skillData.advancedResources ?? [],
          assessments: skillData.assessments ?? [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (existing) {
          await db.update(skills)
            .set({
              ...skillRecord,
              updatedAt: new Date(),
            })
            .where(eq(skills.id, skillData.id));
          updated++;
        } else {
          await db.insert(skills).values(skillRecord);
          created++;
        }
      } catch (error) {
        errors.push(`${skillData.id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Skills import completed",
      stats: {
        total: skillsOntology.length,
        created,
        updated,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Skills import error:", error);
    return NextResponse.json(
      { error: "Failed to import skills", message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/resources/skills/import
 * Check import status
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add proper admin check

    // Count skills in database
    const allSkills = await db.query.skills.findMany();

    return NextResponse.json({
      totalInDatabase: allSkills.length,
      totalInFile: skillsOntology.length,
      status: allSkills.length === skillsOntology.length ? "complete" : "pending",
    });
  } catch (error) {
    console.error("Skills status error:", error);
    return NextResponse.json(
      { error: "Failed to get skills status" },
      { status: 500 }
    );
  }
}
