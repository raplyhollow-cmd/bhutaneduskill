import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // "students" | "teachers"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get user from database to verify school admin role
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, user.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dbUser = userRecord[0];

    // Read file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    let imported = 0;
    let errors = 0;

    // Import based on type
    if (type === "students") {
      for (const row of data as Array<Record<string, unknown>>) {
        try {
          await db.insert(users).values({
            id: nanoid(),
            tenantId: dbUser.tenantId,
            schoolId: dbUser.schoolId,
            type: "student",
            role: "student",
            firstName: String(row.firstName || row["First Name"] || ""),
            lastName: String(row.lastName || row["Last Name"] || ""),
            email: row.email || row.Email ? String(row.email || row.Email) : null,
            phone: row.phone || row.Phone ? String(row.phone || row.Phone) : null,
            dateOfBirth: row.dateOfBirth || row["Date of Birth"] ? new Date(String(row.dateOfBirth || row["Date of Birth"])) : null,
            classGrade: row.classGrade || row["Class"] ? Number(row.classGrade || row["Class"] || row.grade || row.Grade || 0) : 0,
            section: row.section || row.Section ? String(row.section || row.Section) : null,
            parentId: null, // Will be linked later
            createdAt: new Date(),
          });
          imported++;
        } catch (err) {
          logger.error("Error importing student:", err);
          errors++;
        }
      }
    } else if (type === "teachers") {
      for (const row of data as Array<Record<string, unknown>>) {
        try {
          await db.insert(users).values({
            id: nanoid(),
            tenantId: dbUser.tenantId,
            schoolId: dbUser.schoolId,
            type: "teacher",
            role: "teacher",
            firstName: String(row.firstName || row["First Name"] || ""),
            lastName: String(row.lastName || row["Last Name"] || ""),
            email: row.email || row.Email ? String(row.email || row.Email) : null,
            phone: row.phone || row.Phone ? String(row.phone || row.Phone) : null,
            employeeId: row.employeeId || row["Employee ID"] ? String(row.employeeId || row["Employee ID"]) : null,
            subjects: row.subjects || row.Subjects ? JSON.parse(String(row.subjects || row.Subjects)) : [],
            createdAt: new Date(),
          });
          imported++;
        } catch (err) {
          logger.error("Error importing teacher:", err);
          errors++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors,
      total: data.length,
    });
  } catch (error) {
    logger.error("Error importing data:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    );
  }
}

// GET endpoint provides template info
export async function GET(request: NextRequest) {
  return NextResponse.json({
    templates: {
      students: {
        columns: ["First Name", "Last Name", "Email", "Phone", "Date of Birth", "Class", "Section"],
        downloadUrl: "/templates/student-import.xlsx",
      },
      teachers: {
        columns: ["First Name", "Last Name", "Email", "Phone", "Employee ID", "Subjects (JSON array)"],
        downloadUrl: "/templates/teacher-import.xlsx",
      },
    },
  });
}
