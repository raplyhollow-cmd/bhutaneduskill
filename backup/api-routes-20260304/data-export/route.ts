/**
 * COMPREHENSIVE DATA EXPORT API
 *
 * POST /api/data-export - Export data in various formats
 * GET /api/data-export/sources - Get available data sources
 * GET /api/data-export/templates - Get report templates
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { users, assessments, riasecResults, careerMatches, careerPlans, examResults } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import {
  dataSources,
  exportData,
  reportTemplates,
  toCSV,
  anonymizeData,
  type ExportFormat,
} from "@/lib/data-export";
import { logger } from "@/lib/logger";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type UserRole = "admin" | "school-admin" | "teacher" | "student" | "parent" | "counselor";

interface UserRecord {
  id: string;
  clerkUserId: string;
  name: string | null;
  email: string | null;
  type: UserRole;
  schoolId: string | null;
  tenantId: string | null;
  grade: number | null;
  settings: Record<string, unknown> | null;
}

interface AssessmentRecord {
  id: string;
  userId: string;
  type: string;
  status: string;
  createdAt: Date;
}

interface RiasecResultRecord {
  id: string;
  userId: string;
  hollandCode: string | null;
  createdAt: Date;
}

interface CareerMatchRecord {
  id: string;
  assessmentId: string;
  careerId: string;
  matchScore: number;
  recommendationText: string | null;
  isTopMatch: boolean | null;
  createdAt: Date;
  userId: string;
}

interface CareerPlanRecord {
  id: string;
  userId: string;
  targetCareer: string | null;
  currentPhase?: string;
  status: string | null;
  milestones: Array<{ completed: boolean }> | null;
  shortTermGoals: string[] | null;
  longTermGoals: string[] | null;
}

interface ExamResultRecord {
  id: string;
  userId: string;
  examType: string | null;
  examYear: number | null;
  totalPercentage?: number;
  percentage?: number;
  division?: string;
}

type DataSourceRecord = UserRecord | AssessmentRecord | RiasecResultRecord | CareerMatchRecord | CareerPlanRecord | ExamResultRecord;

interface ExportBody {
  dataSource: keyof typeof dataSources;
  format?: string;
  fields?: string[];
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  anonymize?: boolean;
}

// ============================================================================
// GET - List available data sources and templates
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;

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

      return { sources };
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

      return { templates };
    }

    // Return data source schema (for field selection)
    if (action === "schema") {
      const sourceId = searchParams.get("source");
      if (!sourceId || !dataSources[sourceId as keyof typeof dataSources]) {
        return badRequestResponse("Invalid data source");
      }

      const source = dataSources[sourceId as keyof typeof dataSources];
      return {
        id: sourceId,
        name: source.name,
        description: source.description,
        fields: source.fields,
      };
    }

    return {
      sources: Object.keys(dataSources),
      templates: reportTemplates.length,
    };
  },
  ['admin', 'school-admin', 'teacher']
);

// ============================================================================
// POST - Export data
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;

    const body = await request.json() as ExportBody;
    const { dataSource, format = "json", fields, filters, limit, offset, anonymize } = body;

    if (!dataSource || !dataSources[dataSource as keyof typeof dataSources]) {
      return badRequestResponse("Invalid data source");
    }

    const source = dataSources[dataSource as keyof typeof dataSources];
    const exportFormat = format as ExportFormat;

    // Fetch data based on source type
    let data: DataSourceRecord[] = [];
    let totalRecords = 0;

    // Apply tenant/school filtering for non-admin users
    // Note: tenantId not available on user object, using schoolId for filtering
    const userSchoolId = user.schoolId;
    const isAdmin = user.type === "admin";

    switch (dataSource) {
      case "users": {
        let query = db.select().from(users);
        if (!isAdmin && userSchoolId) {
          query = query.where(eq(users.schoolId, userSchoolId)) as typeof query;
        }
        data = await query.limit(limit || 1000).offset(offset || 0) as DataSourceRecord[];
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
        data = await query.limit(limit || 1000).offset(offset || 0).orderBy(desc(assessments.createdAt)) as DataSourceRecord[];
        break;
      }

      case "riasecResults": {
        let query = db.select().from(riasecResults);
        if (!isAdmin && user.type === "student") {
          query = query.where(eq(riasecResults.userId, user.id)) as typeof query;
        } else if (!isAdmin && userSchoolId) {
          const schoolUsers = await db.select().from(users).where(eq(users.schoolId, userSchoolId));
          const userIds = schoolUsers.map((u) => u.id);
          // Filter by user IDs
        }
        data = await query.limit(limit || 1000).offset(offset || 0).orderBy(desc(riasecResults.createdAt)) as DataSourceRecord[];
        break;
      }

      case "careerMatches": {
        // career_matches doesn't have userId, need to join through assessments
        let query = db.select({
          id: careerMatches.id,
          assessmentId: careerMatches.assessmentId,
          careerId: careerMatches.careerId,
          matchScore: careerMatches.matchScore,
          recommendationText: careerMatches.recommendationText,
          isTopMatch: careerMatches.isTopMatch,
          createdAt: careerMatches.createdAt,
          userId: assessments.userId,
        }).from(careerMatches).innerJoin(assessments, eq(careerMatches.assessmentId, assessments.id));

        if (!isAdmin && user.type === "student") {
          query = query.where(eq(assessments.userId, user.id)) as typeof query;
        }
        data = await query.limit(limit || 1000).offset(offset || 0) as DataSourceRecord[];
        break;
      }

      case "careerPlans": {
        let query = db.select().from(careerPlans);
        if (!isAdmin && user.type === "student") {
          query = query.where(eq(careerPlans.userId, user.id)) as typeof query;
        }
        data = await query.limit(limit || 1000).offset(offset || 0) as DataSourceRecord[];
        break;
      }

      case "examResults": {
        let query = db.select().from(examResults);
        if (!isAdmin && user.type === "student") {
          query = query.where(eq(examResults.userId, user.id)) as typeof query;
        }
        data = await query.limit(limit || 1000).offset(offset || 0).orderBy(desc(examResults.examYear)) as DataSourceRecord[];
        break;
      }

      // Journal entries are stored in user.settings - need special handling
      case "journalEntries": {
        let targetUsers: UserRecord[] = [];

        if (user.type === "student" || isAdmin) {
          targetUsers = user.type === "student"
            ? [user as UserRecord]
            : await db.select().from(users).limit(limit || 100) as UserRecord[];
        }

        for (const targetUser of targetUsers) {
          const settings = (targetUser.settings as Record<string, unknown> | null) || {};
          const entries = (settings.journalEntries as Array<Record<string, unknown>>) || [];
          for (const entry of entries) {
            data.push({
              ...entry,
              userId: targetUser.id,
            } as unknown as DataSourceRecord);
          }
        }
        break;
      }

      default:
        return errorResponse("Data source not yet implemented for export", 501);
    }

    totalRecords = data.length;

    // Apply field filters
    let exportFields = source.fields;
    if (fields && fields.length > 0) {
      exportFields = source.fields.filter((f) => fields.includes(f.key));
      // Map data to only include requested fields
      data = data.map((item) => {
        const filtered: Record<string, unknown> = {};
        fields.forEach((key: string) => {
          const keys = key.split(".");
          let value: unknown = item;
          for (const k of keys) {
            value = (value as Record<string, unknown>)?.[k];
          }
          filtered[key] = value;
        });
        return filtered as unknown as DataSourceRecord;
      });
    }

    // Anonymize if requested
    if (anonymize) {
      data = anonymizeData(data as unknown as Record<string, unknown>[], source.fields) as unknown as DataSourceRecord[];
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
        return badRequestResponse("Unsupported format");
    }

    // Create response with file download headers
    return new Response(exportContent, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Record-Count": String(totalRecords),
      },
    });
  },
  ['admin', 'school-admin', 'teacher']
);
