/**
 * RUB Colleges Data Import API
 *
 * POST /api/resources/rub-colleges/import
 *
 * Imports complete RUB colleges and programs data into the database.
 * This should be run once to seed the database with RUB data.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { rubColleges, rubPrograms, rubScholarships } from "@/lib/db/rub-schema";
import { nanoid } from "nanoid";

export const POST = createApiRoute(
  async (request, { userId }) => {
    // Only allow admins to import data
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const { rubCollegesData, rubScholarshipsData } = await import("@/lib/data/rub-colleges");

      let collegesCreated = 0;
      let programsCreated = 0;
      let scholarshipsCreated = 0;
      let collegesUpdated = 0;
      let programsUpdated = 0;
      let scholarshipsUpdated = 0;

      // Import colleges
      for (const collegeData of rubCollegesData.rubCollegesData) {
        // Check if college exists
        const [existing] = await db
          .select()
          .from(rubColleges)
          .where(eq(rubColleges.code, collegeData.code))
          .limit(1);

        const collegeRecord = {
          id: collegeData.id,
          name: collegeData.name,
          code: collegeData.code,
          type: collegeData.type,
          dzongkhag: collegeData.dzongkhag,
          location: collegeData.location,
          website: collegeData.website,
          email: collegeData.email,
          phone: collegeData.phone,
          programs: collegeData.programs.map((p: any) => ({
            code: p.code,
            name: p.name,
            level: p.level,
            duration: p.duration,
            capacity: p.capacity,
          })),
          hasHostel: collegeData.facilities.hasHostel,
          hasLibrary: collegeData.facilities.hasLibrary,
          hasLab: collegeData.facilities.hasLab,
          hasSports: collegeData.facilities.hasSports,
          description: collegeData.description,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (existing) {
          await db
            .update(rubColleges)
            .set(collegeRecord)
            .where(eq(rubColleges.id, existing.id));
          collegesUpdated++;
        } else {
          await db.insert(rubColleges).values(collegeRecord);
          collegesCreated++;
        }

        // Import programs for this college
        for (const programData of collegeData.programs) {
          const programId = `${collegeData.id}_${programData.code}`;

          // Check if program exists
          const [existingProgram] = await db
            .select()
            .from(rubPrograms)
            .where(eq(rubPrograms.code, programData.code))
            .limit(1);

          const programRecord = {
            id: programId,
            name: programData.name,
            code: programData.code,
            collegeId: collegeData.id,
            level: programData.level,
            field: getProgramField(programData.name),
            discipline: getProgramDiscipline(programData.name),
            duration: programData.duration,
            durationType: "years" as const,
            totalSeats: programData.capacity,
            minPercentage: programData.eligibility.minPercentage,
            requiredSubjects: programData.eligibility.requiredSubjects,
            eligibilityCriteria: {
              stream: programData.eligibility.stream || "Any",
            },
            tuitionFee: programData.fees.tuition,
            hostelFee: programData.fees.hostel || 0,
            totalFee: programData.fees.tuition + (programData.fees.hostel || 0),
            description: programData.description,
            careerProspects: programData.careerProspects,
            isActive: true,
            admissionOpen: true,
            academicYear: "2026",
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          if (existingProgram) {
            await db
              .update(rubPrograms)
              .set(programRecord)
              .where(eq(rubPrograms.id, existingProgram.id));
            programsUpdated++;
          } else {
            await db.insert(rubPrograms).values(programRecord);
            programsCreated++;
          }
        }
      }

      // Import scholarships
      for (const scholarshipData of rubScholarshipsData.rubScholarshipsData) {
        const [existingScholarship] = await db
          .select()
          .from(rubScholarships)
          .where(eq(rubScholarships.code, scholarshipData.code))
          .limit(1);

        const scholarshipRecord = {
          id: scholarshipData.id,
          name: scholarshipData.name,
          code: scholarshipData.code,
          type: scholarshipData.type,
          provider: scholarshipData.provider,
          providerName: scholarshipData.providerName,
          coversTuition: scholarshipData.coverage.tuition,
          coversHostel: scholarshipData.coverage.hostel,
          coversBooks: scholarshipData.coverage.books,
          coversLiving: scholarshipData.coverage.living,
          coveragePercentage: scholarshipData.coverage.percentage || 0,
          minPercentage: scholarshipData.eligibility.minPercentage || null,
          annualIncomeLimit: scholarshipData.eligibility.annualIncomeLimit || null,
          categories: scholarshipData.eligibility.categories || null,
          applicationOpenDate: scholarshipData.applicationOpenDate,
          applicationCloseDate: scholarshipData.applicationCloseDate,
          requiredDocuments: scholarshipData.requiredDocuments,
          description: scholarshipData.description,
          isActive: true,
          academicYear: "2026",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        if (existingScholarship) {
          await db
            .update(rubScholarships)
            .set(scholarshipRecord)
            .where(eq(rubScholarships.id, existingScholarship.id));
          scholarshipsUpdated++;
        } else {
          await db.insert(rubScholarships).values(scholarshipRecord);
          scholarshipsCreated++;
        }
      }

      return NextResponse.json({
        success: true,
        message: "RUB data imported successfully",
        data: {
          colleges: {
            created: collegesCreated,
            updated: collegesUpdated,
            total: collegesCreated + collegesUpdated,
          },
          programs: {
            created: programsCreated,
            updated: programsUpdated,
            total: programsCreated + programsUpdated,
          },
          scholarships: {
            created: scholarshipsCreated,
            updated: scholarshipsUpdated,
            total: scholarshipsCreated + scholarshipsUpdated,
          },
        },
      });
    } catch (error) {
      console.error("RUB import error:", error);
      return NextResponse.json(
        {
          error: "Failed to import RUB data",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  },
  ["admin"] // Only admins can import
);

// GET endpoint to check import status
export const GET = createApiRoute(async () => {
  try {
    const [collegeCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rubColleges);

    const [programCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rubPrograms);

    const [scholarshipCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(rubScholarships);

    return {
      success: true,
      data: {
        colleges: collegeCount?.count || 0,
        programs: programCount?.count || 0,
        scholarships: scholarshipCount?.count || 0,
        imported: (collegeCount?.count || 0) > 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}, []);

// Helper functions
function getProgramField(programName: string): string {
  const fieldMapping: Record<string, string> = {
    "Agriculture": "agriculture",
    "Animal": "agriculture",
    "Forestry": "forestry",
    "Food": "food_technology",
    "Environment": "environment",
    "Civil": "engineering",
    "Electrical": "engineering",
    "Electronics": "engineering",
    "Computer": "it",
    "Information": "it",
    "Architecture": "architecture",
    "Quantity": "construction",
    "Development": "social_science",
    "Commerce": "business",
    "Business": "business",
    "Physics": "science",
    "Chemistry": "science",
    "Mathematics": "science",
    "Biology": "science",
    "Geology": "science",
    "English": "arts",
    "Dzongkha": "arts",
    "History": "arts",
    "Political": "social_science",
    "Economics": "social_science",
    "Geography": "arts",
    "Sociology": "social_science",
    "Education": "education",
  };

  for (const [key, value] of Object.entries(fieldMapping)) {
    if (programName.includes(key)) {
      return value;
    }
  }

  return "other";
}

function getProgramDiscipline(programName: string): string | undefined {
  const disciplineMapping: Record<string, string> = {
    "Computer": "computer_science",
    "Information": "information_technology",
    "Civil": "civil_engineering",
    "Electrical": "electrical_engineering",
    "Electronics": "electronics_engineering",
  };

  for (const [key, value] of Object.entries(disciplineMapping)) {
    if (programName.includes(key)) {
      return value;
    }
  }

  return undefined;
}

// Import necessary functions
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
