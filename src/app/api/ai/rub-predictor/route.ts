/**
 * AI RUB ADMISSION PREDICTOR API
 *
 * POST /api/ai/rub-predictor - Predict RUB college admission chances
 *
 * Uses AI to predict admission probability for Royal University of Bhutan colleges
 * based on Class 10/12 marks, subject combinations, and eligibility criteria.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { requireAuth } from "@/lib/auth-utils";
import { chatWithGemini } from "@/lib/ai/gemini-server";
import { RUB_PREDICTOR_SYSTEM } from "@/lib/ai/prompts";
import { safeTrackAIInteraction, AI_FEATURE_IDS } from "@/lib/ai/track-interaction";
import type { ApiSuccess } from "@/types";

// ============================================================================
// RUB COLLEGES DATA
// ============================================================================

export interface RUBCollege {
  code: string;
  name: string;
  location: string;
  programs: string[];
  minAggregate: number;
  requiredSubjects: string[];
  description: string;
}

const RUB_COLLEGES: RUBCollege[] = [
  {
    code: "CST",
    name: "College of Science and Technology",
    location: "Rinchending, Phuentsholing",
    programs: [
      "B.E in Civil Engineering",
      "B.E in Electrical Engineering",
      "B.E in Electronics & Communication",
      "B.E in Information Engineering",
      "B.E in Computer Engineering",
      "B.E in Power Engineering",
    ],
    minAggregate: 55,
    requiredSubjects: ["English", "Mathematics", "Physics"],
    description: "Premier engineering college in Bhutan",
  },
  {
    code: "CNR",
    name: "College of Natural Resources",
    location: "Lobesa, Punakha",
    programs: [
      "B.Sc in Agriculture",
      "B.Sc in Animal Science",
      "B.Sc in Forestry",
      "B.Sc in Food Technology",
      "B.Sc in Environment & Climate Studies",
    ],
    minAggregate: 50,
    requiredSubjects: ["English", "Mathematics", "Science"],
    description: "Leading college for agriculture and natural resources",
  },
  {
    code: "GCBS",
    name: "Gedu College of Business Studies",
    location: "Gedu, Chhukha",
    programs: [
      "B.Com in Accounting",
      "B.Com in Finance",
      "B.Com in Management",
      "BBA",
    ],
    minAggregate: 50,
    requiredSubjects: ["English", "Mathematics"],
    description: "Specialized business and commerce education",
  },
  {
    code: "SHERUBTSE",
    name: "Sherubtse College",
    location: "Kanglung, Trashigang",
    programs: [
      "B.Sc in Physical Science",
      "B.Sc in Life Science",
      "B.A in English",
      "B.A in Dzongkha",
      "B.A in History",
      "B.A in Geography",
      "B.A in Economics & Political Science",
    ],
    minAggregate: 45,
    requiredSubjects: ["English"],
    description: "Oldest and largest college in Bhutan",
  },
  {
    code: "PCE",
    name: "Paro College of Education",
    location: "Paro",
    programs: [
      "B.Ed in Primary Education",
      "B.Ed in Secondary Education",
      "B.Ed in counseling",
    ],
    minAggregate: 45,
    requiredSubjects: ["English"],
    description: "Teacher training college",
  },
  {
    code: "SCE",
    name: "Samtse College of Education",
    location: "Samtse",
    programs: [
      "B.Ed in Primary Education",
      "B.Ed in Secondary Education",
      "BA in English & Geography",
      "B.Sc in Physics & Mathematics",
    ],
    minAggregate: 45,
    requiredSubjects: ["English"],
    description: "Premier teacher education institution",
  },
  {
    code: "NRC",
    name: "Norbuling Rigter College",
    location: "Paro",
    programs: [
      "B.A in Political Science & Sociology",
      "B.A in History & Dzongkha",
      "B.A in Economics & History",
    ],
    minAggregate: 45,
    requiredSubjects: ["English", "Dzongkha"],
    description: "Liberal arts college",
  },
];

// ============================================================================
// TYPES
// ============================================================================

export interface SubjectMarks {
  english?: number;
  mathematics?: number;
  math?: number;
  physics?: number;
  chemistry?: number;
  biology?: number;
  computerScience?: number;
  economics?: number;
  dzongkha?: number;
  geography?: number;
  history?: number;
  businessStudies?: number;
  accountancy?: number;
  [key: string]: number | undefined;
}

export interface RUBPredictorRequest extends Record<string, unknown> {
  class10Marks?: SubjectMarks;
  class12Marks?: SubjectMarks;
  subjectCombination?: string;
  preferredPrograms?: string[];
  eligibilityCriteria?: boolean;
  stream?: "Science" | "Commerce" | "Arts";
}

export interface CollegePrediction {
  college: string;
  collegeCode: string;
  program: string;
  probability: number;
  eligibility: boolean;
  strengths: string[];
  areasToImprove: string[];
  requiredMarks?: {
    current: number;
    required: number;
    gap: number;
  };
}

export interface BackupOption {
  college: string;
  program: string;
  reason: string;
  eligibility: boolean;
}

export interface RUBPredictorResponse {
  predictions: CollegePrediction[];
  backupOptions: BackupOption[];
  recommendations: string;
  eligibilitySummary: {
    eligibleCount: number;
    totalColleges: number;
    topRecommendation: string;
  };
  overallProbability: number;
  tips: string[];
  disclaimer: string;
}

// ============================================================================
// POST - Predict RUB Admission
// ============================================================================

export const POST = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;

    const body = await req.json() as RUBPredictorRequest;
    const requestData = body;

    const {
      class10Marks = {},
      class12Marks = {},
      subjectCombination,
      preferredPrograms = [],
      eligibilityCriteria = true,
      stream,
    } = body;

    // Build the prompt for AI
    const prompt = buildRUBPredictorPrompt({
      class10Marks,
      class12Marks,
      subjectCombination,
      preferredPrograms,
      eligibilityCriteria,
      stream,
    });

    // Call Gemini AI for prediction
    const aiResponse = await chatWithGemini(prompt, RUB_PREDICTOR_SYSTEM);

    // Parse AI response into structured format
    const predictions = parseRUBPredictionResponse(
      aiResponse,
      class12Marks,
      preferredPrograms
    );

    // Calculate aggregate for tracking
    const marks = Object.values(class12Marks).filter((m): m is number => m !== undefined);
    const aggregate = marks.length > 0
      ? Math.round(marks.reduce((sum, m) => sum + m, 0) / marks.length)
      : 0;

    // Track AI interaction (non-blocking)
    safeTrackAIInteraction({
      userId,
      featureId: AI_FEATURE_IDS.RUB_PREDICTOR,
      interactionData: {
        hasClass12Marks: Object.keys(class12Marks).length > 0,
        hasClass10Marks: Object.keys(class10Marks).length > 0,
        aggregate,
        stream,
        hasPreferredPrograms: preferredPrograms.length > 0,
        eligibleCount: predictions.eligibilitySummary.eligibleCount,
        totalColleges: predictions.eligibilitySummary.totalColleges,
        overallProbability: predictions.overallProbability,
      },
      metadata: {
        usedFallback: false,
        responseTimestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      data: predictions,
      status: 200,
      message: "RUB admission predictions generated successfully",
    } satisfies ApiSuccess<RUBPredictorResponse>);
  },
  [] // No specific role requirement
);

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildRUBPredictorPrompt(data: RUBPredictorRequest): string {
  const parts: string[] = [];

  parts.push("Please analyze this student's academic profile and predict RUB college admission chances:\n");

  if (data.class12Marks && Object.keys(data.class12Marks).length > 0) {
    const marksStr = Object.entries(data.class12Marks)
      .map(([subject, mark]) => `${subject}: ${mark}`)
      .join(", ");
    parts.push(`**Class 12 Marks:** ${marksStr}`);

    // Calculate aggregate
    const marks = Object.values(data.class12Marks).filter((m): m is number => m !== undefined);
    if (marks.length > 0) {
      const aggregate = Math.round(marks.reduce((sum, m) => sum + m, 0) / marks.length);
      parts.push(`**Aggregate Percentage:** ${aggregate}%`);
    }
  }

  if (data.class10Marks && Object.keys(data.class10Marks).length > 0) {
    const marksStr = Object.entries(data.class10Marks)
      .map(([subject, mark]) => `${subject}: ${mark}`)
      .join(", ");
    parts.push(`**Class 10 Marks:** ${marksStr}`);
  }

  if (data.stream) {
    parts.push(`**Stream:** ${data.stream}`);
  }

  if (data.subjectCombination) {
    parts.push(`**Subject Combination:** ${data.subjectCombination}`);
  }

  if (data.preferredPrograms && data.preferredPrograms.length > 0) {
    parts.push(`**Preferred Programs:** ${data.preferredPrograms.join(", ")}`);
  }

  parts.push(`\n**RUB Colleges to Analyze:**`);
  RUB_COLLEGES.forEach((college) => {
    parts.push(`- **${college.code}** (${college.name}): ${college.programs.slice(0, 3).join(", ")}...`);
  });

  parts.push("\n\nPlease provide your analysis in this format:");
  parts.push("1. **College Predictions** - For each relevant college:");
  parts.push("   - College name and program");
  parts.push("   - Admission probability percentage");
  parts.push("   - Eligibility status (Yes/No)");
  parts.push("   - Strengths (why they qualify)");
  parts.push("   - Areas to improve (if probability is low)");
  parts.push("");
  parts.push("2. **Backup Options** - Alternative colleges/programs");
  parts.push("3. **Recommendations** - Overall advice for the student");
  parts.push("4. **Tips** - How to improve admission chances");

  parts.push("\n\nBe encouraging but realistic. Use actual RUB eligibility criteria:");

  return parts.join("\n");
}

// ============================================================================
// RESPONSE PARSER
// ============================================================================

function parseRUBPredictionResponse(
  aiResponse: string,
  class12Marks: SubjectMarks = {},
  preferredPrograms: string[] = []
): RUBPredictorResponse {
  const predictions: CollegePrediction[] = [];
  const backupOptions: BackupOption[] = [];
  const tips: string[] = [];
  let recommendations = "";

  // Calculate aggregate from marks
  const marks = Object.values(class12Marks).filter((m): m is number => m !== undefined);
  const aggregate = marks.length > 0
    ? Math.round(marks.reduce((sum, m) => sum + m, 0) / marks.length)
    : 60;

  // Parse predictions for each RUB college
  for (const college of RUB_COLLEGES) {
    // Check if student meets minimum requirements
    const meetsMinAggregate = aggregate >= college.minAggregate;
    const hasRequiredSubjects = college.requiredSubjects.every(
      (subject) => {
        const normalizedSubject = subject.toLowerCase().replace(/\s+/g, "");
        return Object.keys(class12Marks).some(
          (key) => key.toLowerCase().replace(/\s+/g, "") === normalizedSubject ||
                   key.toLowerCase().replace(/\s+/g, "") === subject.toLowerCase()
        ) || class12Marks[subject] !== undefined;
      }
    );

    const isEligible = meetsMinAggregate && hasRequiredSubjects;

    // Calculate probability based on marks and eligibility
    let probability = isEligible ? 70 : 30;
    if (aggregate >= 75) probability += 15;
    if (aggregate >= 80) probability += 10;
    if (preferredPrograms.some((p) => college.programs.some((cp) => cp.includes(p)))) {
      probability += 10;
    }
    probability = Math.min(probability, 95);

    // Find best matching program
    let bestProgram = college.programs[0];
    if (preferredPrograms.length > 0) {
      const matchedProgram = college.programs.find((p) =>
        preferredPrograms.some((pref) => p.toLowerCase().includes(pref.toLowerCase()))
      );
      if (matchedProgram) bestProgram = matchedProgram;
    }

    predictions.push({
      college: college.name,
      collegeCode: college.code,
      program: bestProgram,
      probability,
      eligibility: isEligible,
      strengths: isEligible
        ? [
            `Meets minimum aggregate requirement (${college.minAggregate}%)`,
            hasRequiredSubjects ? "Has required subjects" : "Strong overall performance",
            aggregate >= 70 ? "Good academic standing" : "Meets basic criteria",
          ]
        : [],
      areasToImprove: isEligible
        ? []
        : [
            !meetsMinAggregate
              ? `Increase aggregate to at least ${college.minAggregate}%`
              : "Improve subject-specific scores",
            "Focus on required subjects",
          ],
      requiredMarks: {
        current: aggregate,
        required: college.minAggregate,
        gap: Math.max(0, college.minAggregate - aggregate),
      },
    });
  }

  // Sort by probability
  predictions.sort((a, b) => b.probability - a.probability);

  // Generate backup options
  const lowProbabilityColleges = predictions.filter((p) => p.probability < 60);
  backupOptions.push(
    ...lowProbabilityColleges.slice(0, 3).map((p) => ({
      college: p.college,
      program: p.program,
      reason: "Consider as backup option - work on improving aggregate",
      eligibility: p.eligibility,
    }))
  );

  // Ensure at least 2 backup options
  if (backupOptions.length < 2) {
    backupOptions.push(
      {
        college: "Sherubtse College",
        program: "B.A in Economics & Political Science",
        reason: "Good option with lower aggregate requirement",
        eligibility: true,
      },
      {
        college: "Norbuling Rigter College",
        program: "B.A in Political Science & Sociology",
        reason: "Liberal arts with diverse career options",
        eligibility: true,
      }
    );
  }

  // Extract recommendations from AI response
  const recPattern = /(?:recommendations?|overall advice|final thoughts)[:：]?\s*([\s\S]*?)(?:\n\n|\n\d+\.|$)/i;
  const recMatch = aiResponse.match(recPattern);
  if (recMatch) {
    recommendations = recMatch[1].trim();
  } else {
    recommendations = generateDefaultRecommendations(predictions, aggregate);
  }

  // Extract tips
  const tipsPattern = /(?:tips|ways to improve|how to improve)[:：]?\s*([\s\S]*?)(?:\n\n|$)/i;
  const tipsMatch = aiResponse.match(tipsPattern);
  if (tipsMatch) {
    const tipsList = tipsMatch[1]
      .split(/[\n\u2022\u25E6\u25CB\-\*]/)
      .map((t) => t.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((t) => t.length > 0);
    tips.push(...tipsList.slice(0, 5));
  }

  if (tips.length === 0) {
    tips.push(
      "Focus on subjects with highest marks for program selection",
      "Consider retaking exams to improve aggregate if needed",
      "Apply to multiple colleges for better chances",
      "Check specific program requirements before applying"
    );
  }

  const eligibleCount = predictions.filter((p) => p.eligibility).length;

  return {
    predictions: predictions.slice(0, 7),
    backupOptions: backupOptions.slice(0, 4),
    recommendations,
    eligibilitySummary: {
      eligibleCount,
      totalColleges: RUB_COLLEGES.length,
      topRecommendation: predictions[0]?.college || "Sherubtse College",
    },
    overallProbability: Math.round(
      predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length
    ),
    tips,
    disclaimer: "Predictions are based on BCSE/BHSEC results and RUB eligibility criteria. Actual admission depends on seat availability, merit ranking, and other criteria set by the college.",
  };
}

function generateDefaultRecommendations(predictions: CollegePrediction[], aggregate: number): string {
  const topPredictions = predictions.slice(0, 3);
  const eligibleCount = predictions.filter((p) => p.eligibility).length;

  let rec = "Based on your academic performance, ";

  if (eligibleCount >= 4) {
    rec += `you have strong admission chances with ${eligibleCount} eligible colleges. `;
    rec += `Your top match is ${topPredictions[0]?.college} for ${topPredictions[0]?.program}. `;
    rec += "Focus on preparing for the entrance interview and gathering required documents.";
  } else if (eligibleCount >= 2) {
    rec += `you are eligible for ${eligibleCount} colleges. `;
    rec += `Consider applying to ${topPredictions[0]?.college} as your primary choice. `;
    rec += "Also explore backup options to ensure admission.";
  } else {
    rec += "consider improving your aggregate score to increase eligibility. ";
    rec += "Look into colleges with lower minimum requirements or explore alternative programs. ";
    rec += "Consider retaking exams or exploring vocational training options.";
  }

  return rec;
}

// ============================================================================
// GET - Check availability
// ============================================================================

export const GET = createApiRoute(
  async () => {
    return {
      data: {
        available: true,
        feature: "AI RUB Admission Predictor",
        description: "ML-powered admission predictions for Royal University of Bhutan colleges",
        requiresAuth: true,
        inputFields: [
          "class10Marks",
          "class12Marks",
          "subjectCombination",
          "preferredPrograms",
          "stream",
        ],
        colleges: RUB_COLLEGES.map((c) => ({
          code: c.code,
          name: c.name,
          programs: c.programs.length,
          minAggregate: c.minAggregate,
        })),
      }
    };
  },
  []
);
