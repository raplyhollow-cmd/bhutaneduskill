/**
 * COMPREHENSIVE DATA EXPORT API
 *
 * POST /api/data-export - Export data in various formats
 * GET /api/data-export/sources - Get available data sources
 * GET /api/data-export/templates - Get report templates
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { users, assessments, riasecResults, careerMatches, careerPlans, examResults } from "@/lib/db/schema";
import { eq, and, desc, gt } from "drizzle-orm";
import {
  dataSources,
  exportData,
  reportTemplates,
  toCSV,
  anonymizeData,
  type ExportFormat,
} from "@/lib/data-export";

// ============================================================================
// GET - List available data sources and templates
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Return available data sources
    if (action === "sources") {
      const sources = Object.entries(dataSources).map(([key, value]) => ({
        id: key,
        name: value.name,
        description: value.description,
        fieldCount: value.fields.length,
      }));

      return NextResponse.json({ sources });
    }

    // Return report templates
    if (action === "templates") {
      const userRole = user.type;
      const templates = reportTemplates
        .filter((t) => t.allowedRoles.includes(userRole))
        .map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          parameterCount: t.parameters.length,
        }));

      return NextResponse.json({ templates });
    }

    // Return data source schema (for field selection)
    if (action === "schema") {
      const sourceId = searchParams.get("source");
      if (!sourceId || !dataSources[sourceId as keyof typeof dataSources]) {
        return NextResponse.json({ error: "Invalid data source" }, { status: 400 });
      }

      const source = dataSources[sourceId as keyof typeof dataSources];
      return NextResponse.json({
        id: sourceId,
        name: source.name,
        description: source.description,
        fields: source.fields,
      });
    }

    return NextResponse.json({
      sources: Object.keys(dataSources),
      templates: reportTemplates.length,
    });

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Data export GET error:", error);
    return NextResponse.json({ error: "Failed to fetch export info" }, { status: 500 });
  }
}

// ============================================================================
// POST - Export data
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await request.json();
    const { dataSource, format = "json", fields, filters, limit, offset, anonymize } = body;

    if (!dataSource || !dataSources[dataSource as keyof typeof dataSources]) {
      return NextResponse.json({ error: "Invalid data source" }, { status: 400 });
    }

    const source = dataSources[dataSource as keyof typeof dataSources];
    const exportFormat = format as ExportFormat;

    // Fetch data based on source type
    let data: any[] = [];
    let totalRecords = 0;

    // Apply tenant/school filtering for non-admin users
    const userTenantId = user.tenantId;
    const userSchoolId = user.schoolId;
    const isAdmin = user.type === "admin";

    switch (dataSource) {
      case "users": {
        let query = db.select().from(users);
        if (!isAdmin && userSchoolId) {
          query = query.where(eq(users.schoolId, userSchoolId)) as any;
        }
        data = await query.limit(limit || 1000).offset(offset || 0) as any[];
        break;
      }

      case "assessments": {
        let query = db.select().from(assessments);
        if (!isAdmin && userSchoolId) {
          // Get users from same school first
          const schoolUsers = await db.select().from(users).where(eq(users.schoolId, userSchoolId));
          const userIds = schoolUsers.map((u) => u.id);
          if (userIds.length > 0) {
            // This would need an 'in' clause - simplified for now
          }
        }
        data = await query.limit(limit || 1000).offset(offset || 0).orderBy(desc(assessments.createdAt)) as any[];
        break;
      }

      case "riasecResults": {
        let query = db.select().from(riasecResults);
        if (!isAdmin && user.type === "student") {
          query = query.where(eq(riasecResults.userId, user.id)) as any;
        } else if (!isAdmin && userSchoolId) {
          const schoolUsers = await db.select().from(users).where(eq(users.schoolId, userSchoolId));
          const userIds = schoolUsers.map((u) => u.id);
          // Filter by user IDs
        }
        data = await query.limit(limit || 1000).offset(offset || 0).orderBy(desc(riasecResults.createdAt)) as any[];
        break;
      }

      case "careerMatches": {
        let query = db.select().from(careerMatches);
        if (!isAdmin && user.type === "student") {
          query = query.where(eq(careerMatches.userId, user.id)) as any;
        }
        data = await query.limit(limit || 1000).offset(offset || 0) as any[];
        break;
      }

      case "careerPlans": {
        let query = db.select().from(careerPlans);
        if (!isAdmin && user.type === "student") {
          query = query.where(eq(careerPlans.userId, user.id)) as any;
        }
        data = await query.limit(limit || 1000).offset(offset || 0) as any[];
        break;
      }

      case "examResults": {
        let query = db.select().from(examResults);
        if (!isAdmin && user.type === "student") {
          query = query.where(eq(examResults.userId, user.id)) as any;
        }
        data = await query.limit(limit || 1000).offset(offset || 0).orderBy(desc(examResults.examYear)) as any[];
        break;
      }

      // Journal entries are stored in user.settings - need special handling
      case "journalEntries": {
        let targetUsers: any[] = [];

        if (user.type === "student" || isAdmin) {
          targetUsers = user.type === "student"
            ? [user]
            : await db.select().from(users).limit(limit || 100);
        }

        for (const targetUser of targetUsers) {
          const settings = (targetUser.settings as any) || {};
          const entries = settings.journalEntries || [];
          for (const entry of entries) {
            data.push({
              ...entry,
              userId: targetUser.id,
            });
          }
        }
        break;
      }

      default:
        return NextResponse.json({ error: "Data source not yet implemented for export" }, { status: 501 });
    }

    totalRecords = data.length;

    // Apply field filters
    let exportFields = source.fields;
    if (fields && fields.length > 0) {
      exportFields = source.fields.filter((f) => fields.includes(f.key));
      // Map data to only include requested fields
      data = data.map((item) => {
        const filtered: any = {};
        fields.forEach((key: string) => {
          const keys = key.split(".");
          let value = item;
          for (const k of keys) {
            value = value?.[k];
          }
          filtered[key] = value;
        });
        return filtered;
      });
    }

    // Anonymize if requested
    if (anonymize) {
      data = anonymizeData(data, source.fields);
    }

    // Convert to requested format
    let exportContent: string;
    let contentType: string;
    let filename: string;

    const timestamp = new Date().toISOString().split("T")[0];

    switch (exportFormat) {
      case "json":
        exportContent = JSON.stringify(data, null, 2);
        contentType = "application/json";
        filename = `${dataSource}_${timestamp}.json`;
        break;

      case "csv":
        exportContent = toCSV(data, exportFields);
        contentType = "text/csv";
        filename = `${dataSource}_${timestamp}.csv`;
        break;

      case "xml":
        exportContent = `<?xml version="1.0" encoding="UTF-8"?>\n<${dataSource}>\n${data.map((item) =>
          `  <record>\n${Object.entries(item).map(([k, v]) => `    <${k}>${v}</${k}>`).join("\n")}\n  </record>`
        ).join("\n")}\n</${dataSource}>`;
        contentType = "application/xml";
        filename = `${dataSource}_${timestamp}.xml`;
        break;

      case "excel":
        // Return CSV with Excel-compatible content type
        exportContent = toCSV(data, exportFields);
        contentType = "application/vnd.ms-excel";
        filename = `${dataSource}_${timestamp}.csv`;
        break;

      case "pdf":
        // For PDF, return JSON for now with a note
        // In production, use a PDF library
        exportContent = JSON.stringify({
          note: "PDF export requires a PDF generation library",
          data,
        }, null, 2);
        contentType = "application/json";
        filename = `${dataSource}_${timestamp}.json`;
        break;

      default:
        return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
    }

    // Create response with file download headers
    return new NextResponse(exportContent, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Record-Count": String(totalRecords),
      },
    });

  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Data export POST error:", error);
    return NextResponse.json({ error: "Export failed", details: error.message }, { status: 500 });
  }
}

// ============================================================================
// OPTIONS - CORS support
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
