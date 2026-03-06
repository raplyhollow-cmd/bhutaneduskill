/**
 * Labor Market Data API
 *
 * Provides job market data, skills forecasts, and industry insights
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getJobMarketData,
  getCareersByDemand,
  getCareersByTrend,
  getTopPayingCareer,
  getSkillsDemandForecast,
  getIndustryInsights,
  getTalentShortageCareers,
  getRegionalDemand,
} from "@/lib/data/labor-market-data";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const careerId = searchParams.get("careerId");
    const demand = searchParams.get("demand");
    const trend = searchParams.get("trend");
    const level = searchParams.get("level") as "entry" | "mid" | "senior" | undefined;
    const category = searchParams.get("category") as "technical" | "soft" | "vocational" | undefined;
    const urgency = searchParams.get("urgency") as "critical" | "important" | "optional" | undefined;

    let result;

    switch (action) {
      case "career":
        if (!careerId) return NextResponse.json({ error: "careerId required" }, { status: 400 });
        result = getJobMarketData(careerId);
        break;

      case "by-demand":
        if (!demand || !["high", "medium", "low"].includes(demand as "high" | "medium" | "low")) {
          return NextResponse.json({ error: "Invalid demand level" }, { status: 400 });
        }
        result = getCareersByDemand(demand as ("high" | "medium" | "low"));
        break;

      case "by-trend":
        if (!trend || !["increasing", "stable", "decreasing", "emerging"].includes(trend as "increasing" | "stable" | "decreasing" | "emerging")) {
          return NextResponse.json({ error: "Invalid trend" }, { status: 400 });
        }
        result = getCareersByTrend(trend as ("increasing" | "stable" | "decreasing" | "emerging"));
        break;

      case "top-paying":
        result = getTopPayingCareer(level || "mid", 10);
        break;

      case "skills-forecast":
        result = getSkillsDemandForecast(category, urgency);
        break;

      case "industry-insights":
        result = getIndustryInsights();
        break;

      case "talent-shortage":
        result = getTalentShortageCareers();
        break;

      case "regional":
        if (!careerId) return NextResponse.json({ error: "careerId required" }, { status: 400 });
        result = getRegionalDemand(careerId);
        break;

      default:
        result = {
          jobMarketData: await getJobMarketData(""),
          skillsDemandForecast: await getSkillsDemandForecast(undefined, undefined),
          industryInsights: await getIndustryInsights(),
        };
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Labor Market API error:", error);
    return NextResponse.json({ error: "Failed to get labor market data" }, { status: 500 });
  }
}
