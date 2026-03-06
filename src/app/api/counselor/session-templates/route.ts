/**
 * Session Templates API
 *
 * Provides structured session templates for career counseling
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getTemplate,
  getTemplatesByType,
  getTemplatesByGrade,
  getRecommendedTemplate,
  sessionTemplates,
  SessionType,
} from "@/lib/data/session-templates";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    let result;

    switch (action) {
      case "list":
        result = sessionTemplates;
        break;

      case "by-type": {
        const type = searchParams.get("type") as SessionType;
        if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });
        result = getTemplatesByType(type);
        break;
      }

      case "by-grade": {
        const grade = parseInt(searchParams.get("grade") || "10", 10);
        result = getTemplatesByGrade(grade);
        break;
      }

      case "recommend": {
        const grade = parseInt(searchParams.get("grade") || "10", 10);
        const hasCompletedAssessments = searchParams.get("assessments") === "true";
        const applyingToRUB = searchParams.get("rub") === "true";
        const scholarshipNeeded = searchParams.get("scholarship") === "true";
        const parentInvolvement = searchParams.get("parent") === "true";
        const isCrisis = searchParams.get("crisis") === "true";

        result = getRecommendedTemplate({
          grade,
          hasCompletedAssessments,
          applyingToRUB,
          scholarshipNeeded,
          parentInvolvement,
          isCrisis,
        });
        break;
      }

      case "template": {
        const templateId = searchParams.get("id");
        if (!templateId) return NextResponse.json({ error: "id required" }, { status: 400 });
        result = getTemplate(templateId);
        break;
      }

      default:
        result = sessionTemplates;
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Session Templates error:", error);
    return NextResponse.json({ error: "Failed to get templates" }, { status: 500 });
  }
}
