/**
 * Careers Data Import API
 *
 * Imports the expanded careers database into the system.
 * Admin only endpoint.
 */

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { careers } from "@/lib/db/schema";
import { expandedCareersData } from "@/lib/data/careers-expanded";

/**
 * POST /api/resources/careers/import
 * Import careers data into database
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

    for (const careerData of expandedCareersData) {
      try {
        // Check if career exists
        const existing = await db.query.careers.findFirst({
          where: (eq(careers.id, careerData.id)),
        });

        if (existing) {
          await db.update(careers)
            .set({
              title: careerData.title,
              name: careerData.title, // Alias for title
              slug: careerData.id,
              category: careerData.category,
              industry: careerData.industry,
              riasecCode: careerData.riasecCode,
              hollandCodes: careerData.hollandCodes,
              educationLevel: careerData.educationLevel,
              typicalSalary: careerData.typicalSalary,
              bhutanDemand: careerData.bhutanDemand,
              growthOutlook: careerData.bhutanOutlook,
              bhutanSpecific: careerData.bhutanSpecific,
              skills: careerData.skills,
              subjects: careerData.subjects,
              workEnvironment: careerData.workEnvironment,
              description: careerData.description,
              icon: "Briefcase",
              color: "#3B82F6",
              updatedAt: new Date(),
            })
            .where(eq(careers.id, careerData.id));
          updated++;
        } else {
          await db.insert(careers).values({
            id: careerData.id,
            title: careerData.title,
            name: careerData.title, // Alias for title
            slug: careerData.id,
            category: careerData.category,
            industry: careerData.industry,
            riasecCode: careerData.riasecCode,
            hollandCodes: careerData.hollandCodes,
            educationLevel: careerData.educationLevel,
            typicalSalary: careerData.typicalSalary,
            bhutanDemand: careerData.bhutanDemand,
            growthOutlook: careerData.bhutanOutlook,
            bhutanSpecific: careerData.bhutanSpecific,
            skills: careerData.skills,
            subjects: careerData.subjects,
            workEnvironment: careerData.workEnvironment,
            description: careerData.description,
            icon: "Briefcase",
            color: "#3B82F6",
            isActive: true,
            viewCount: 0,
            salaryCurrency: "BTN",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          created++;
        }
      } catch (error) {
        errors.push(`${careerData.id}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Careers import completed",
      stats: {
        total: expandedCareersData.length,
        created,
        updated,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Careers import error:", error);
    return NextResponse.json(
      { error: "Failed to import careers", message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/resources/careers/import
 * Check import status
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Add proper admin check

    // Count careers in database
    const allCareers = await db.query.careers.findMany();

    return NextResponse.json({
      totalInDatabase: allCareers.length,
      totalInFile: expandedCareersData.length,
      status: allCareers.length === expandedCareersData.length ? "complete" : "pending",
    });
  } catch (error) {
    console.error("Careers status error:", error);
    return NextResponse.json(
      { error: "Failed to get careers status" },
      { status: 500 }
    );
  }
}
