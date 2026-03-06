/**
 * Visual Career Roadmap API
 *
 * Provides roadmap data for student's chosen career path
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getRoadmapForCareer,
  getMilestonesForGrade,
  getRecommendedActions,
  getWhatIfRoadmap,
  careerRoadmaps,
} from "@/lib/data/career-roadmaps";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const careerId = searchParams.get("careerId");
    const fromCareer = searchParams.get("fromCareer");
    const toCareer = searchParams.get("toCareer");
    const grade = parseInt(searchParams.get("grade") || "10");

    let result;

    switch (action) {
      case "roadmap":
        if (!careerId) return NextResponse.json({ error: "careerId required" }, { status: 400 });
        result = getRoadmapForCareer(careerId);
        break;

      case "milestones":
        result = getMilestonesForGrade(grade);
        break;

      case "actions":
        if (!careerId) return NextResponse.json({ error: "careerId required" }, { status: 400 });
        result = getRecommendedActions(careerId, grade);
        break;

      case "whatif":
        if (!fromCareer || !toCareer) {
          return NextResponse.json({ error: "fromCareer and toCareer required" }, { status: 400 });
        }
        result = getWhatIfRoadmap(fromCareer, toCareer);
        break;

      case "list":
        result = careerRoadmaps.map((r) => ({
          id: r.careerId,
          title: r.careerTitle,
          category: r.category,
          requiredEducation: r.requiredEducation,
        }));
        break;

      default:
        result = careerRoadmaps;
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Roadmap API error:", error);
    return NextResponse.json({ error: "Failed to get roadmap data" }, { status: 500 });
  }
}
