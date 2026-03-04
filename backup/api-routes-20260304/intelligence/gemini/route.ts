/**
 * GEMINI LAYER API ROUTE
 *
 * Simplified version for migration
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("mode") || "metadata";

    // Get user role
    const userRole = "user"; // Simplified

    switch (mode) {
      case "metadata":
        // Return basic metadata
        return NextResponse.json({
          features: {},
          userRole,
          status: "Gemini Layer - Simplified for migration",
        });

      case "system-prompt":
        // Return basic system prompt
        return NextResponse.json({
          systemPrompt: "You are an AI assistant for Bhutan EduSkill platform.",
          userRole,
        });

      default:
        return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      message: "Gemini Layer is in simplified mode during migration",
      status: "Coming soon after migration completes",
    });

  } catch (error: any) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
