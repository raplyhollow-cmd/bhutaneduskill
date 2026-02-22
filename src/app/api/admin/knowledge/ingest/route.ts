/**
 * KNOWLEDGE INGESTION API
 *
 * POST /api/admin/knowledge/ingest - Ingest external knowledge into the platform
 *
 * Platform Admin can import:
 * - RUB college requirements from PDF/URL
 * - Scholarship information
 * - Career pathways
 * - National curriculum data
 *
 * Uses Gemini AI to parse and structure the data.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { knowledgeDrafts, rubRequirements, nationalScholarships } from "@/lib/db/schema";
import { chatWithGemini } from "@/lib/ai/gemini-server";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

interface KnowledgeIngestRequest {
  sourceType: "rub" | "scholarship" | "career" | "college";
  content?: string;
  url?: string;
  sourceName?: string;
}

interface IngestResult {
  draftId: string;
  confidenceScore: number;
  estimatedRecords: number;
  structuredData: any;
  preview: string[];
}

// ============================================================================
// AI PARSING PROMPTS
// ============================================================================

const RUB_REQUIREMENTS_PROMPT = `You are an expert at parsing Royal University of Bhutan (RUB) college and program requirements.

Extract structured data from the provided content. For each program identified, extract:
1. Program name
2. College/institution name
3. Education level (undergraduate, diploma, certificate)
4. Required subjects with minimum grades/percentages
5. Aggregate requirements (minimum percentage, which subjects to consider)
6. English/Dzongkha requirements
7. Duration of program
8. Any additional requirements

Return ONLY valid JSON in this format:
[
  {
    "collegeName": "College of Science and Technology",
    "programName": "Bachelor of Engineering in Information Technology",
    "educationLevel": "undergraduate",
    "requiredSubjects": [
      { "subject": "Mathematics", "minimumGrade": "A", "minimumPercentage": 75 },
      { "subject": "Physics", "minimumGrade": "B", "minimumPercentage": 65 }
    ],
    "aggregateRequirements": {
      "minimumPercentage": 70,
      "subjectsToConsider": ["English", "Math", "Physics", "Chemistry"],
      "englishRequired": true,
      "dzongkhaRequired": false
    },
    "duration": "4 years",
    "additionalRequirements": "Good communication skills recommended"
  }
]

If you cannot extract valid data, return an empty array: []`;

const SCHOLARSHIP_PROMPT = `You are an expert at parsing scholarship and financial aid information.

Extract structured data from the provided content. For each scholarship identified, extract:
1. Scholarship name
2. Provider organization
3. Type (merit-based, need-based, sports, specific field)
4. Education level
5. Eligibility criteria (minimum percentage, income limits, etc.)
6. Benefits/coverage (tuition, living allowance, books, etc.)
7. Application deadline
8. Required documents
9. Application URL if mentioned

Return ONLY valid JSON in this format:
[
  {
    "name": "DAHE Undergraduate Scholarship",
    "provider": "Department of Adult and Higher Education",
    "type": "merit",
    "educationLevel": "undergraduate",
    "eligibilityCriteria": {
      "minimumPercentage": 80,
      "stream": ["Science", "Arts"],
      "familyIncomeLimit": 300000,
      "district": ["Thimphu", "Paro"],
      "gender": null
    },
    "benefits": {
      "covers": ["tuition", "living_allowance", "books"],
      "amount": 60000,
      "currency": "BTN",
      "notes": "Renewable annually based on performance"
    },
    "applicationDeadline": "2025-03-31",
    "applicationUrl": "https://dahe.gov.bt/scholarships",
    "documentsRequired": ["Citizen ID", "Mark sheets", "Income certificate", "Recommendation letter"]
  }
]

If you cannot extract valid data, return an empty array: []`;

// ============================================================================
// INGESTION FUNCTIONS
// ============================================================================

/**
 * Parse RUB requirements from content
 */
async function parseRUBRequirements(content: string): Promise<{
  data: any[];
  confidence: number;
  preview: string[];
}> {
  try {
    const response = await chatWithGemini(
      `Parse this content and extract RUB college/program requirements:\n\n${content.substring(0, 10000)}`,
      RUB_REQUIREMENTS_PROMPT
    );

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { data: [], confidence: 0, preview: [] };
    }

    const data = JSON.parse(jsonMatch[0]) as any[];
    const preview = data.slice(0, 3).map((item: any) =>
      `${item.collegeName} - ${item.programName}`
    );

    // Calculate confidence based on data quality
    let confidence = 0.5;
    if (data.length > 0) confidence += 0.2;
    if (data.every((d: any) => d.collegeName && d.programName)) confidence += 0.2;
    if (data.every((d: any) => d.requiredSubjects && d.requiredSubjects.length > 0)) confidence += 0.1;

    return { data, confidence: Math.min(confidence, 1), preview };
  } catch (error) {
    logger.error("Failed to parse RUB requirements:", error);
    return { data: [], confidence: 0, preview: [] };
  }
}

/**
 * Parse scholarship information from content
 */
async function parseScholarships(content: string): Promise<{
  data: any[];
  confidence: number;
  preview: string[];
}> {
  try {
    const response = await chatWithGemini(
      `Parse this content and extract scholarship information:\n\n${content.substring(0, 10000)}`,
      SCHOLARSHIP_PROMPT
    );

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { data: [], confidence: 0, preview: [] };
    }

    const data = JSON.parse(jsonMatch[0]) as any[];
    const preview = data.slice(0, 3).map((item: any) =>
      `${item.name} - ${item.provider}`
    );

    // Calculate confidence based on data quality
    let confidence = 0.5;
    if (data.length > 0) confidence += 0.2;
    if (data.every((d: any) => d.name && d.provider)) confidence += 0.2;
    if (data.every((d: any) => d.eligibilityCriteria)) confidence += 0.1;

    return { data, confidence: Math.min(confidence, 1), preview };
  } catch (error) {
    logger.error("Failed to parse scholarships:", error);
    return { data: [], confidence: 0, preview: [] };
  }
}

/**
 * Generic parser for other content types
 */
async function parseGenericContent(content: string, sourceType: string): Promise<{
  data: any[];
  confidence: number;
  preview: string[];
}> {
  try {
    const response = await chatWithGemini(
      `Parse this content and extract ${sourceType} information. Return structured JSON data:\n\n${content.substring(0, 10000)}`,
      `Extract key information from the content. Return valid JSON array of objects with relevant fields for ${sourceType}.`
    );

    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return { data: [], confidence: 0, preview: [] };
    }

    const data = JSON.parse(jsonMatch[0]) as any[];
    const preview = data.slice(0, 3).map((item: any, i: number) =>
      `${sourceType} ${i + 1}`
    );

    return { data, confidence: 0.7, preview };
  } catch (error) {
    logger.error("Failed to parse generic content:", error);
    return { data: [], confidence: 0, preview: [] };
  }
}

// ============================================================================
// API ROUTE
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body: KnowledgeIngestRequest = await request.json();
    const { sourceType, content, url, sourceName } = body;

    if (!sourceType) {
      return NextResponse.json(
        { error: "sourceType is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    if (!content && !url) {
      return NextResponse.json(
        { error: "Either content or url is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    logger.info("Knowledge ingestion requested", { userId, sourceType, url, hasContent: !!content });

    // For URLs, fetch content (simplified - would need web scraper in production)
    let sourceContent = content || "";
    if (url && !content) {
      // In production, would use web scraper
      sourceContent = `Content from ${url}`;
    }

    // Parse content based on source type
    let parseResult;
    switch (sourceType) {
      case "rub":
      case "college":
        parseResult = await parseRUBRequirements(sourceContent);
        break;
      case "scholarship":
        parseResult = await parseScholarships(sourceContent);
        break;
      default:
        parseResult = await parseGenericContent(sourceContent, sourceType);
    }

    // Create knowledge draft
    const draftId = nanoid();
    await db.insert(knowledgeDrafts).values({
      id: draftId,
      sourceType,
      sourceUrl: url,
      sourceName: sourceName || url || "Manual entry",
      rawContent: sourceContent.substring(0, 5000), // Store first 5000 chars
      structuredData: parseResult.data,
      confidenceScore: parseResult.confidence,
      status: "pending",
      ingestMethod: "ai_parse",
      estimatedRecords: parseResult.data.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    logger.info("Knowledge draft created", {
      draftId,
      sourceType,
      recordCount: parseResult.data.length,
      confidence: parseResult.confidence,
    });

    return NextResponse.json({
      data: {
        draftId,
        confidenceScore: parseResult.confidence,
        estimatedRecords: parseResult.data.length,
        structuredData: parseResult.data,
        preview: parseResult.preview,
      } satisfies IngestResult,
    } satisfies ApiSuccess<IngestResult>);

  } catch (error) {
    logger.apiError(error, {
      route: "/api/admin/knowledge/ingest",
      method: "POST",
    });

    return NextResponse.json(
      {
        error: "Failed to ingest knowledge",
        status: 500,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/knowledge/drafts - List all drafts
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const drafts = await db
      .select()
      .from(knowledgeDrafts)
      .orderBy(knowledgeDrafts.createdAt);

    return NextResponse.json({
      data: drafts,
    } satisfies ApiSuccess<typeof drafts>);

  } catch (error) {
    logger.apiError(error, {
      route: "/api/admin/knowledge/ingest",
      method: "GET",
    });

    return NextResponse.json(
      {
        error: "Failed to fetch drafts",
        status: 500,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
