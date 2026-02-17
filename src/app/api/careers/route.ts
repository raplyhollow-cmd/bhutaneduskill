import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { CAREERS_DATABASE } from "@/lib/tenant";

// GET /api/careers - Get all careers or user's matched careers
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'counselor']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const userIdParam = searchParams.get("userId");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    let careers = [...CAREERS_DATABASE];

    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      careers = careers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower) ||
          c.skills.some((s) => s.toLowerCase().includes(searchLower))
      );
    }

    // Filter by category (RIASEC)
    if (category) {
      careers = careers.filter((c) => c.riasecCode.includes(category.toUpperCase()));
    }

    return NextResponse.json({
      careers,
      total: careers.length,
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch careers" }, { status: 500 });
  }
}
