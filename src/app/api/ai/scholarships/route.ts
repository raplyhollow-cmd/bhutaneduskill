/**
 * AI SCHOLARSHIP MATCHER API
 *
 * POST /api/ai/scholarships - Match scholarships to student profile
 *
 * Uses AI to find relevant scholarship opportunities for Bhutanese students
 * based on academic performance, field of study, and achievements.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { chatWithGemini } from "@/lib/ai/gemini-server";
import { SCHOLARSHIP_SYSTEM } from "@/lib/ai/prompts";
import { safeTrackAIInteraction, AI_FEATURE_IDS } from "@/lib/ai/track-interaction";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

export interface ScholarshipMatcherRequest {
  academicPerformance?: {
    marks?: Record<string, number>;
    gpa?: number;
    class10Marks?: number;
    class12Marks?: number;
    ranking?: string;
  };
  familyIncome?: number;
  fieldOfStudy?: string;
  careerGoals?: string[];
  specialAchievements?: string[];
  interests?: string[];
  currentClass?: string;
}

export interface MatchedScholarship {
  name: string;
  provider: string;
  type: "government" | "rub" | "private" | "merit-based" | "need-based" | "international";
  amount?: string;
  eligibility: string[];
  deadline: string;
  deadlineDate?: Date;
  applicationProcess: string[];
  documentsNeeded: string[];
  matchScore: number;
  description: string;
}

export interface ScholarshipMatcherResponse {
  matchedScholarships: MatchedScholarship[];
  applicationTips: string[];
  generalAdvice: string[];
  eligibilitySummary: string;
  totalScholarships: number;
  highPriorityCount: number;
  disclaimer: string;
}

// ============================================================================
// POST - Match Scholarships
// ============================================================================

export async function POST(request: NextRequest) {
  let requestData: ScholarshipMatcherRequest = {};
  let userId = "";

  try {
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    userId = authResult.userId;

    const body = await request.json();
    requestData = body as ScholarshipMatcherRequest;

    const {
      academicPerformance = {},
      familyIncome,
      fieldOfStudy,
      careerGoals = [],
      specialAchievements = [],
      interests = [],
      currentClass,
    } = requestData;

    // Build the prompt for AI
    const prompt = buildScholarshipPrompt({
      academicPerformance,
      familyIncome,
      fieldOfStudy,
      careerGoals,
      specialAchievements,
      interests,
      currentClass,
    });

    // Call Gemini AI for scholarship matching
    const aiResponse = await chatWithGemini(prompt, SCHOLARSHIP_SYSTEM);

    // Parse AI response into structured format
    const matches = parseScholarshipResponse(
      aiResponse,
      academicPerformance,
      familyIncome,
      fieldOfStudy
    );

    logger.info("Scholarship matching completed", {
      route: "/api/ai/scholarships",
      method: "POST",
      userId,
      scholarshipCount: matches.matchedScholarships.length,
      hasNeedBased: !!familyIncome,
    });

    // Track AI interaction (non-blocking)
    safeTrackAIInteraction({
      userId,
      featureId: AI_FEATURE_IDS.SCHOLARSHIP_MATCHER,
      interactionData: {
        hasAcademicPerformance: !!(academicPerformance && (academicPerformance.gpa || academicPerformance.class10Marks || academicPerformance.class12Marks)),
        hasFamilyIncome: familyIncome !== undefined,
        hasFieldOfStudy: !!fieldOfStudy,
        hasCareerGoals: careerGoals.length > 0,
        hasSpecialAchievements: specialAchievements.length > 0,
        matchedScholarshipsCount: matches.matchedScholarships.length,
        highPriorityCount: matches.highPriorityCount,
        hasNeedBasedMatches: matches.matchedScholarships.some(s => s.type === "need-based"),
      },
      metadata: {
        usedFallback: false,
        responseTimestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      data: matches,
      status: 200,
      message: "Scholarship matching completed successfully",
    } satisfies ApiSuccess<ScholarshipMatcherResponse>);

  } catch (error: any) {
    logger.apiError(error, {
      route: "/api/ai/scholarships",
      method: "POST",
    });

    // Check if it's an API key error
    if (error?.message === "Gemini API key not configured") {
      // Return fallback response
      const fallback = generateFallbackMatches(requestData);

      // Track fallback usage (non-blocking)
      safeTrackAIInteraction({
        userId,
        featureId: AI_FEATURE_IDS.SCHOLARSHIP_MATCHER,
        interactionData: {
          hasAcademicPerformance: !!(requestData.academicPerformance && (requestData.academicPerformance.gpa || requestData.academicPerformance.class10Marks || requestData.academicPerformance.class12Marks)),
          hasFamilyIncome: requestData.familyIncome !== undefined,
          fallbackMatchCount: fallback.matchedScholarships.length,
          fallbackHighPriorityCount: fallback.highPriorityCount,
        },
        metadata: {
          usedFallback: true,
          errorReason: "API key not configured",
          responseTimestamp: new Date().toISOString(),
        },
      });

      return NextResponse.json({
        data: fallback,
        status: 200,
        message: "Using offline scholarship database",
      } satisfies ApiSuccess<ScholarshipMatcherResponse>);
    }

    return NextResponse.json(
      {
        error: "Failed to match scholarships",
        status: 500,
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PROMPT BUILDER
// ============================================================================

function buildScholarshipPrompt(data: ScholarshipMatcherRequest): string {
  const parts: string[] = [];

  parts.push("Please match scholarships for this Bhutanese student:\n");

  // Academic Performance
  if (data.academicPerformance) {
    const perf = data.academicPerformance;
    const perfParts: string[] = [];

    if (perf.gpa) perfParts.push(`GPA: ${perf.gpa}`);
    if (perf.class10Marks) perfParts.push(`Class 10 Marks: ${perf.class10Marks}%`);
    if (perf.class12Marks) perfParts.push(`Class 12 Marks: ${perf.class12Marks}%`);
    if (perf.ranking) perfParts.push(`Ranking: ${perf.ranking}`);
    if (perf.marks && Object.keys(perf.marks).length > 0) {
      const marksStr = Object.entries(perf.marks)
        .map(([subject, mark]) => `${subject}: ${mark}`)
        .join(", ");
      perfParts.push(`Subject Marks: ${marksStr}`);
    }

    if (perfParts.length > 0) {
      parts.push(`**Academic Performance:** ${perfParts.join(", ")}`);
    }
  }

  // Family Income
  if (data.familyIncome !== undefined) {
    const incomeDisplay = data.familyIncome === 0 ? "Not specified / Need-based consideration" : `Nu. ${data.familyIncome.toLocaleString()}/year`;
    parts.push(`**Family Income:** ${incomeDisplay}`);
  }

  // Field of Study
  if (data.fieldOfStudy) {
    parts.push(`**Field of Study:** ${data.fieldOfStudy}`);
  }

  // Career Goals
  if (data.careerGoals && data.careerGoals.length > 0) {
    parts.push(`**Career Goals:** ${data.careerGoals.join(", ")}`);
  }

  // Special Achievements
  if (data.specialAchievements && data.specialAchievements.length > 0) {
    parts.push(`**Special Achievements:** ${data.specialAchievements.join(", ")}`);
  }

  // Interests
  if (data.interests && data.interests.length > 0) {
    parts.push(`**Interests:** ${data.interests.join(", ")}`);
  }

  // Current Class
  if (data.currentClass) {
    parts.push(`**Current Class:** ${data.currentClass}`);
  }

  parts.push("\n\nPlease provide scholarship matches in this format:");
  parts.push("For each scholarship, provide:");
  parts.push("1. **Scholarship Name** - Name of the scholarship");
  parts.push("2. **Provider** - Organization offering it");
  parts.push("3. **Type** - (government/rub/private/merit-based/need-based/international)");
  parts.push("4. **Amount** - Scholarship amount (if known)");
  parts.push("5. **Eligibility** - Requirements (3-4 bullet points)");
  parts.push("6. **Deadline** - Application deadline");
  parts.push("7. **Application Process** - How to apply (2-3 steps)");
  parts.push("8. **Documents Needed** - Required paperwork");
  parts.push("9. **Match Score** - How well it matches (0-100%)");
  parts.push("10. **Description** - Brief description of the scholarship");

  parts.push("\nAfter the scholarship list, provide:");
  parts.push("- **Application Tips** - General advice for scholarship applications (3-4 points)");
  parts.push("- **General Advice** - How to improve chances (2-3 points)");
  parts.push("- **Eligibility Summary** - Summary of what they qualify for");

  parts.push("\n\nFocus on scholarships available to Bhutanese students, including:");
  parts.push("- Government of India Scholarships");
  parts.push("- Government of Bangladesh Scholarships");
  parts.push("- RUB Scholarships");
  parts.push("- Private sector scholarships in Bhutan");
  parts.push("- International opportunities");

  return parts.join("\n");
}

// ============================================================================
// RESPONSE PARSER
// ============================================================================

function parseScholarshipResponse(
  aiResponse: string,
  academicPerformance: ScholarshipMatcherRequest["academicPerformance"],
  familyIncome?: number,
  fieldOfStudy?: string
): ScholarshipMatcherResponse {
  const matchedScholarships: MatchedScholarship[] = [];
  const applicationTips: string[] = [];
  const generalAdvice: string[] = [];
  let eligibilitySummary = "";

  // Known scholarship database for fallback and validation
  const knownScholarships = getBhutanScholarshipDatabase();

  // Parse scholarships from AI response
  // Note: Using simple patterns to avoid TypeScript regex parsing issues
  // The actual parsing is done in parseScholarshipSection function
  const scholarshipPatterns = [
    /scholarship[:\s*]/gi,
  ];

  // Try to extract structured scholarship data
  const scholarshipSections = aiResponse.split(/\n\n(?=\d+\.|\*\*Scholarship)/i);

  for (const section of scholarshipSections) {
    const scholarship = parseScholarshipSection(section, knownScholarships);
    if (scholarship) {
      // Check if already exists
      const exists = matchedScholarships.some(
        (s) => s.name.toLowerCase() === scholarship.name.toLowerCase()
      );
      if (!exists) {
        matchedScholarships.push(scholarship);
      }
    }
  }

  // If no scholarships parsed, use database matching
  if (matchedScholarships.length === 0) {
    const dbMatches = matchFromDatabase(
      knownScholarships,
      academicPerformance,
      familyIncome,
      fieldOfStudy
    );
    matchedScholarships.push(...dbMatches);
  }

  // Ensure at least some scholarships are returned
  if (matchedScholarships.length === 0) {
    matchedScholarships.push(...getDefaultScholarships());
  }

  // Extract application tips
  const tipsPattern = /(?:application tips?|how to apply|tips for applying)[:\uFF1A]?\s*([\s\S]*?)(?=\n\n|\n\d+\.|\n(?:general|eligibility|advice))/i;
  const tipsMatch = aiResponse.match(tipsPattern);
  if (tipsMatch) {
    const tipsList = tipsMatch[1]
      .split(/[\n\u2022\u25E6\u25CB\-*]/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((s) => s.length > 10 && s.length < 150);
    applicationTips.push(...tipsList.slice(0, 5));
  }

  if (applicationTips.length === 0) {
    applicationTips.push(
      "Start applications early - don't wait until deadlines",
      "Write a compelling personal statement highlighting your achievements",
      "Get strong recommendation letters from teachers or counselors",
      "Proofread all documents carefully before submission",
      "Apply to multiple scholarships to increase your chances"
    );
  }

  // Extract general advice
  const advicePattern = /(?:general advice?|recommendations?|additional tips?)[:\uFF1A]?\s*([\s\S]*?)(?=\n\n|\n\d+\.|\n(?:eligibility))/i;
  const adviceMatch = aiResponse.match(advicePattern);
  if (adviceMatch) {
    const adviceList = adviceMatch[1]
      .split(/[\n\u2022\u25E6\u25CB\-*]/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((s) => s.length > 10 && s.length < 150);
    generalAdvice.push(...adviceList.slice(0, 4));
  }

  if (generalAdvice.length === 0) {
    generalAdvice.push(
      "Maintain strong academic performance throughout the year",
      "Participate in extracurricular activities and community service",
      "Build relationships with teachers who can write recommendations",
      "Keep copies of all applications and documents organized"
    );
  }

  // Extract eligibility summary
  const eligibilityPattern = /(?:eligibility summary?|summary|you qualify for)[:\uFF1A]?\s*([\s\S]*?)$/i;
  const eligibilityMatch = aiResponse.match(eligibilityPattern);
  if (eligibilityMatch) {
    eligibilitySummary = eligibilityMatch[1].trim();
  }

  if (!eligibilitySummary) {
    eligibilitySummary = buildEligibilitySummary(matchedScholarships, academicPerformance, familyIncome);
  }

  // Count high priority matches (match score > 70%)
  const highPriorityCount = matchedScholarships.filter((s) => s.matchScore >= 70).length;

  return {
    matchedScholarships: matchedScholarships.slice(0, 10),
    applicationTips,
    generalAdvice,
    eligibilitySummary,
    totalScholarships: matchedScholarships.length,
    highPriorityCount,
    disclaimer: "Scholarship information is subject to change. Always verify details with official sources before applying. Deadlines and requirements may vary.",
  };
}

function parseScholarshipSection(section: string, knownDb: typeof bhutanScholarshipDatabase): MatchedScholarship | null {
  let name = "";
  let provider = "";
  let type: MatchedScholarship["type"] = "private";
  let amount = "";
  let deadline = "";
  let description = "";
  const eligibility: string[] = [];
  const applicationProcess: string[] = [];
  const documentsNeeded: string[] = [];
  let matchScore = 70;

  // Extract name - simpler pattern to avoid TypeScript regex issues
  const nameMatch = section.match(/(?:scholarship|name)[:\s]+\*+([^*]+?)(?:\*+|\n|$)/i);
  if (nameMatch) name = nameMatch[1].trim();

  // Extract provider
  const providerMatch = section.match(/provider[:\s]+\*+([^*]+?)(?:\*+|\n|$)/i);
  if (providerMatch) provider = providerMatch[1].trim();

  // Extract type
  const typeMatch = section.match(/type[:\s]+\*+([^*]+?)(?:\*+|\n|$)/i);
  if (typeMatch) {
    const typeStr = typeMatch[1].trim().toLowerCase();
    if (typeStr.includes("government")) type = "government";
    else if (typeStr.includes("rub") || typeStr.includes("university")) type = "rub";
    else if (typeStr.includes("merit")) type = "merit-based";
    else if (typeStr.includes("need")) type = "need-based";
    else if (typeStr.includes("international")) type = "international";
  }

  // Extract amount
  const amountMatch = section.match(/amount[:\s]+\*+([^*]+?)(?:\*+|\n|$)/i);
  if (amountMatch) amount = amountMatch[1].trim();

  // Extract deadline
  const deadlineMatch = section.match(/deadline[:\s]+\*+([^*]+?)(?:\*+|\n|$)/i);
  if (deadlineMatch) deadline = deadlineMatch[1].trim();

  // Extract description
  const descMatch = section.match(/description[:\s]+\*+([^*]+?)(?:\*+|\n|$)/i);
  if (descMatch) description = descMatch[1].trim();

  // Extract eligibility (bullet points)
  const eligibilityPattern = /eligibility[:\s]*]([\s\S]*?)(?=\n\n|\n\s*(?:deadline|application|documents|amount|$))/i;
  const eligibilityMatch = section.match(eligibilityPattern);
  if (eligibilityMatch) {
    const items = eligibilityMatch[1]
      .split(/[\n\u2022\u25E6\u25CB\-*]/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((s) => s.length > 5);
    eligibility.push(...items);
  }

  // Extract application process
  const processPattern = /application process[:\s]*]([\s\S]*?)(?=\n\n|\n\s*(?:documents|deadline|eligibility|$))/i;
  const processMatch = section.match(processPattern);
  if (processMatch) {
    const items = processMatch[1]
      .split(/[\n\u2022\u25E6\u25CB\-*]/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((s) => s.length > 5);
    applicationProcess.push(...items);
  }

  // Extract documents needed
  const docsPattern = /documents? (?:needed|required)?[:\s]*]([\s\S]*?)(?=\n\n|\n\s*(?:deadline|application|eligibility|$))/i;
  const docsMatch = section.match(docsPattern);
  if (docsMatch) {
    const items = docsMatch[1]
      .split(/[\n\u2022\u25E6\u25CB\-*]/)
      .map((s) => s.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((s) => s.length > 3);
    documentsNeeded.push(...items);
  }

  // Extract match score
  const scoreMatch = section.match(/match score[:\s]+?\*+(\d+)%/i);
  if (scoreMatch) {
    matchScore = Math.min(Math.max(parseInt(scoreMatch[1], 10), 0), 100);
  }

  // If we at least have a name, return the scholarship
  if (name) {
    // Fill in missing required fields with defaults
    if (!provider) provider = "Various Organizations";
    if (!amount) amount = "Varies";
    if (!deadline) deadline = "Varies - Check official website";
    if (description) description = `Scholarship opportunity for ${name}`;
    if (eligibility.length === 0) eligibility.push("Bhutanese citizen", "Meet academic requirements");
    if (applicationProcess.length === 0) applicationProcess.push("Complete application form", "Submit required documents");
    if (documentsNeeded.length === 0) documentsNeeded.push("Citizenship ID", "Academic transcripts", "Recommendation letter");

    return {
      name,
      provider,
      type,
      amount,
      eligibility,
      deadline,
      deadlineDate: parseDeadline(deadline),
      applicationProcess,
      documentsNeeded,
      matchScore,
      description,
    };
  }

  return null;
}

function parseDeadline(deadlineStr: string): Date | undefined {
  // Try to parse common date formats
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, // MM/DD/YYYY or DD/MM/YYYY
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{1,2}),?\s*(\d{4})/i, // Month DD, YYYY
  ];

  for (const pattern of datePatterns) {
    const match = deadlineStr.match(pattern);
    if (match) {
      try {
        return new Date(deadlineStr);
      } catch {
        return undefined;
      }
    }
  }

  return undefined;
}

function buildEligibilitySummary(
  scholarships: MatchedScholarship[],
  academicPerformance?: ScholarshipMatcherRequest["academicPerformance"],
  familyIncome?: number
): string {
  const parts: string[] = [];

  // Count by type
  const byType = scholarships.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (byType.government || byType.international) {
    parts.push(`You qualify for ${(byType.government || 0) + (byType.international || 0)} government/international scholarship opportunities.`);
  }

  if (byType.meritBased && academicPerformance) {
    const gpa = academicPerformance.gpa || academicPerformance.class10Marks || 0;
    if (gpa >= 70) {
      parts.push("Your strong academic performance makes you eligible for merit-based scholarships.");
    }
  }

  if (byType.needBased && familyIncome !== undefined && familyIncome < 300000) {
    parts.push("Based on your family income, you may qualify for need-based financial assistance.");
  }

  if (parts.length === 0) {
    parts.push("There are several scholarship opportunities available for you to explore.");
  }

  return parts.join(" ");
}

// ============================================================================
// BHUTAN SCHOLARSHIP DATABASE
// ============================================================================

const bhutanScholarshipDatabase = [
  {
    name: "Government of India Scholarship",
    provider: "Royal Government of Bhutan / Government of India",
    type: "government" as const,
    amount: "Full tuition + stipend",
    eligibility: [
      "Bhutanese citizen",
      "Minimum 60% in Class 12",
      "Strong academic record",
      "Age limit: 21-25 years depending on course",
    ],
    deadline: "March-April annually",
    applicationProcess: [
      "Apply through scholarship division, Ministry of Education",
      "Submit academic transcripts and certificates",
      "Appear for interview if shortlisted",
    ],
    documentsNeeded: [
      "Class 10 and 12 mark sheets",
      "Citizenship ID card",
      "Character certificate",
      "Passport-size photographs",
      "No objection certificate from relevant agency",
    ],
    description: "Full scholarships for undergraduate and postgraduate studies in India across various disciplines including engineering, medicine, and humanities.",
  },
  {
    name: "Government of Bangladesh Scholarship",
    provider: "Government of Bangladesh",
    type: "government" as const,
    amount: "Full tuition + accommodation",
    eligibility: [
      "Bhutanese citizen",
      "Minimum 55% in Class 12 (Science stream)",
      "Age below 22 years",
      "Good English proficiency",
    ],
    deadline: "February-March annually",
    applicationProcess: [
      "Apply through scholarship division, MoE",
      "Submit application with academic records",
      "Medical examination required",
    ],
    documentsNeeded: [
      "Academic transcripts (Class 10-12)",
      "Citizenship ID",
      "Medical fitness certificate",
      "Birth certificate",
    ],
    description: "Scholarships for medical and engineering studies in Bangladesh for Bhutanese students.",
  },
  {
    name: "RUB Merit Scholarship",
    provider: "Royal University of Bhutan",
    type: "rub" as const,
    amount: "Partial to full tuition waiver",
    eligibility: [
      "Enrolled or admitted to RUB college",
      "Minimum GPA of 3.0 or 75% marks",
      "Bhutanese citizen",
      "Demonstrated financial need or academic excellence",
    ],
    deadline: "Rolling / Announced by each college",
    applicationProcess: [
      "Apply through respective RUB college",
      "Submit financial aid application",
      "Provide academic transcripts",
    ],
    documentsNeeded: [
      "College admission letter",
      "Academic transcripts",
      "Income certificate of parents/guardian",
      "Citizenship ID",
    ],
    description: "Merit-based scholarships offered by various RUB colleges including CST, CNR, GCBS, Sherubtse, Paro College, and Samtse College.",
  },
  {
    name: "RUB Need-Based Financial Assistance",
    provider: "Royal University of Bhutan",
    type: "need-based" as const,
    amount: "Varies based on need assessment",
    eligibility: [
      "Enrolled in RUB program",
      "Family income below Nu. 300,000/year",
      "Good academic standing",
      "Bhutanese citizen",
    ],
    deadline: "Beginning of each academic year",
    applicationProcess: [
      "Submit financial assistance form",
      "Provide income verification",
      "Interview with college committee",
    ],
    documentsNeeded: [
      "Family income certificate",
      "Property ownership documents (if any)",
      "Academic records",
      "Citizenship ID",
    ],
    description: "Financial assistance for students from economically disadvantaged backgrounds to pursue higher education at RUB colleges.",
  },
  {
    name: "Thimphu TechPark Scholarship",
    provider: "Thimphu TechPark Limited",
    type: "private" as const,
    amount: "Nu. 100,000 - Nu. 200,000",
    eligibility: [
      "IT/Computer Science student",
      "Minimum 70% in Class 12 (PCM)",
      "Interest in software development",
      "Bhutanese citizen",
    ],
    deadline: "June annually",
    applicationProcess: [
      "Apply through Thimphu TechPark website",
      "Submit statement of purpose",
      "Interview with tech panel",
    ],
    documentsNeeded: [
      "Class 12 mark sheet",
      "Statement of purpose",
      "Recommendation letter from IT teacher",
      "Citizenship ID",
    ],
    description: "Scholarships for IT students pursuing computer science or related fields to support Bhutan's growing tech industry.",
  },
  {
    name: "Druk Holding & Investments Scholarship",
    provider: "Druk Holding & Investments",
    type: "private" as const,
    amount: "Full tuition + living allowance",
    eligibility: [
      "Strong academic record (75%+)",
      "Pursuing business, engineering, or finance",
      "Leadership qualities",
      "Bhutanese citizen",
    ],
    deadline: "April annually",
    applicationProcess: [
      "Submit application through DHI website",
      "Write essay on career goals",
      "Multiple interview rounds",
    ],
    documentsNeeded: [
      "Academic transcripts",
      "Essay on career objectives",
      "Letters of recommendation",
      "Citizenship ID",
      "Proof of admission",
    ],
    description: "Prestigious scholarship program for Bhutanese students pursuing undergraduate studies in business, engineering, and finance.",
  },
  {
    name: "Bhutan Innovation Scholarship",
    provider: "Loden Foundation",
    type: "merit-based" as const,
    amount: "Nu. 150,000 - Nu. 300,000",
    eligibility: [
      "Innovative project or business idea",
      "Entrepreneurial mindset",
      "Age 18-30 years",
      "Bhutanese citizen",
    ],
    deadline: "Quarterly (March, June, September, December)",
    applicationProcess: [
      "Submit business proposal",
      "Present to selection committee",
      "Attend entrepreneurship training",
    ],
    documentsNeeded: [
      "Detailed business proposal",
      "Budget breakdown",
      "Academic qualifications",
      "Citizenship ID",
    ],
    description: "Scholarship for young entrepreneurs and innovators to pursue their business ideas or innovative projects.",
  },
  {
    name: "Australia Awards Scholarships",
    provider: "Australian Government",
    type: "international" as const,
    amount: "Full tuition + airfare + living allowance",
    eligibility: [
      "Minimum 2 years work experience",
      "Bachelor's degree with good grades",
      "Age between 25-45 years",
      "Bhutanese citizen",
    ],
    deadline: "February annually",
    applicationProcess: [
      "Apply online through Australia Awards website",
      "Submit academic and professional documents",
      "English proficiency test (IELTS)",
    ],
    documentsNeeded: [
      "Academic transcripts and certificates",
      "Employment references",
      "IELTS test results",
      "Passport",
      "Citizenship ID",
    ],
    description: "Prestigious international scholarship for postgraduate studies in Australia for experienced professionals from Bhutan.",
  },
  {
    name: "DAAD Scholarship Germany",
    provider: "German Academic Exchange Service (DAAD)",
    type: "international" as const,
    amount: "Monthly stipend + travel allowance",
    eligibility: [
      "Bachelor's degree (4 years)",
      "Strong academic record",
      "German language skills (for some programs)",
      "Bhutanese citizen",
    ],
    deadline: "August-October annually",
    applicationProcess: [
      "Apply through DAAD portal",
      "Get admission from German university",
      "Submit DAAD application",
    ],
    documentsNeeded: [
      "University admission letter",
      "Academic transcripts",
      "CV/Resume",
      "Letter of motivation",
      "Letters of recommendation",
    ],
    description: "Scholarships for postgraduate studies in Germany for students from developing countries including Bhutan.",
  },
  {
    name: "Kuwait Scholarship for Bhutanese Students",
    provider: "Government of Kuwait",
    type: "government" as const,
    amount: "Full tuition + accommodation + allowance",
    eligibility: [
      "Minimum 85% in Class 12 (Science)",
      "Age 17-23 years",
      "Medically fit",
      "Bhutanese citizen",
    ],
    deadline: "June annually",
    applicationProcess: [
      "Apply through Scholarship Division, MoE",
      "Medical examination in Thimphu",
      "Interview with Kuwait embassy officials",
    ],
    documentsNeeded: [
      "Class 10-12 mark sheets",
      "Citizenship ID",
      "Medical fitness certificate",
      "Birth certificate",
      "No objection certificate",
    ],
    description: "Full scholarship for undergraduate studies in Kuwait for Bhutanese students with strong academic backgrounds.",
  },
  {
    name: "Tashi InfoComm Scholarship",
    provider: "Tashi InfoComm Limited",
    type: "private" as const,
    amount: "Nu. 80,000 - Nu. 150,000",
    eligibility: [
      "IT/Engineering student",
      "Minimum 65% in Class 12",
      "Interest in telecommunications",
      "Bhutanese citizen",
    ],
    deadline: "July annually",
    applicationProcess: [
      "Submit application to Tashi InfoComm",
      "Write statement of purpose",
      "Interview with HR team",
    ],
    documentsNeeded: [
      "Class 12 mark sheet",
      "College admission letter",
      "Recommendation letter",
      "Citizenship ID",
    ],
    description: "Scholarship for students pursuing IT, engineering, or telecommunications related fields.",
  },
  {
    name: "Bhutan Chamber of Commerce & Industry Scholarship",
    provider: "Bhutan Chamber of Commerce & Industry",
    type: "private" as const,
    amount: "Nu. 100,000 - Nu. 200,000",
    eligibility: [
      "Business/Commerce student",
      "Entrepreneurial interest",
      "Good academic standing",
      "Bhutanese citizen",
    ],
    deadline: "May annually",
    applicationProcess: [
      "Apply through BCCI office",
      "Submit business idea proposal",
      "Present to selection panel",
    ],
    documentsNeeded: [
      "Academic transcripts",
      "Business proposal",
      "Recommendation letter",
      "Citizenship ID",
    ],
    description: "Scholarship for students interested in business and entrepreneurship to foster Bhutan's private sector development.",
  },
];

function getBhutanScholarshipDatabase() {
  return bhutanScholarshipDatabase;
}

function matchFromDatabase(
  database: typeof bhutanScholarshipDatabase,
  academicPerformance?: ScholarshipMatcherRequest["academicPerformance"],
  familyIncome?: number,
  fieldOfStudy?: string
): MatchedScholarship[] {
  const matches: MatchedScholarship[] = [];

  for (const scholarship of database) {
    let matchScore = 50; // Base score

    // Check academic performance
    const gpa = academicPerformance?.gpa ||
                academicPerformance?.class12Marks ||
                academicPerformance?.class10Marks ||
                0;

    if (gpa >= 75) {
      matchScore += 20;
    } else if (gpa >= 60) {
      matchScore += 10;
    }

    // Check need-based eligibility
    if (scholarship.type === "need-based" && familyIncome !== undefined) {
      if (familyIncome < 200000) {
        matchScore += 30;
      } else if (familyIncome < 400000) {
        matchScore += 15;
      }
    }

    // Check field of study match
    if (fieldOfStudy) {
      const fieldLower = fieldOfStudy.toLowerCase();
      const descLower = scholarship.description.toLowerCase();

      if (descLower.includes(fieldLower) ||
          descLower.includes(fieldLower.substring(0, 3))) {
        matchScore += 20;
      }

      // Specific field matches
      if ((fieldLower.includes("it") || fieldLower.includes("computer") || fieldLower.includes("software")) &&
          (descLower.includes("it") || descLower.includes("tech"))) {
        matchScore += 15;
      }

      if ((fieldLower.includes("engineer") || fieldLower.includes("civil") || fieldLower.includes("mechanical")) &&
          descLower.includes("engineer")) {
        matchScore += 15;
      }

      if ((fieldLower.includes("medic") || fieldLower.includes("doctor") || fieldLower.includes("nurs")) &&
          descLower.includes("medic")) {
        matchScore += 15;
      }

      if ((fieldLower.includes("business") || fieldLower.includes("commerce") || fieldLower.includes("account")) &&
          descLower.includes("business")) {
        matchScore += 15;
      }
    }

    // Cap at 95%
    matchScore = Math.min(matchScore, 95);

    matches.push({
      ...scholarship,
      matchScore,
      deadlineDate: parseDeadline(scholarship.deadline),
    });
  }

  // Sort by match score
  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

function getDefaultScholarships(): MatchedScholarship[] {
  return [
    {
      name: "Government of India Scholarship",
      provider: "Royal Government of Bhutan / Government of India",
      type: "government",
      amount: "Full tuition + stipend",
      eligibility: ["Bhutanese citizen", "Minimum 60% in Class 12", "Strong academic record"],
      deadline: "March-April annually",
      applicationProcess: ["Apply through scholarship division", "Submit academic transcripts", "Interview if shortlisted"],
      documentsNeeded: ["Class 10 and 12 mark sheets", "Citizenship ID", "Character certificate"],
      matchScore: 85,
      description: "Full scholarships for undergraduate and postgraduate studies in India.",
    },
    {
      name: "RUB Merit Scholarship",
      provider: "Royal University of Bhutan",
      type: "rub",
      amount: "Partial to full tuition waiver",
      eligibility: ["Enrolled or admitted to RUB college", "Minimum GPA of 3.0 or 75% marks"],
      deadline: "Rolling / Announced by each college",
      applicationProcess: ["Apply through respective RUB college", "Submit financial aid application"],
      documentsNeeded: ["College admission letter", "Academic transcripts", "Income certificate"],
      matchScore: 80,
      description: "Merit-based scholarships offered by various RUB colleges.",
    },
    {
      name: "RUB Need-Based Financial Assistance",
      provider: "Royal University of Bhutan",
      type: "need-based",
      amount: "Varies based on need assessment",
      eligibility: ["Enrolled in RUB program", "Family income below Nu. 300,000/year"],
      deadline: "Beginning of each academic year",
      applicationProcess: ["Submit financial assistance form", "Provide income verification"],
      documentsNeeded: ["Family income certificate", "Academic records", "Citizenship ID"],
      matchScore: 75,
      description: "Financial assistance for students from economically disadvantaged backgrounds.",
    },
  ];
}

// ============================================================================
// FALLBACK MATCHES (when AI is unavailable)
// ============================================================================

function generateFallbackMatches(data: ScholarshipMatcherRequest): ScholarshipMatcherResponse {
  const { academicPerformance, familyIncome, fieldOfStudy, careerGoals = [] } = data;

  // Get matched scholarships from database
  const matchedScholarships = matchFromDatabase(
    bhutanScholarshipDatabase,
    academicPerformance,
    familyIncome,
    fieldOfStudy
  );

  // Build application tips
  const applicationTips = [
    "Start your scholarship applications early - at least 2-3 months before deadlines",
    "Write a compelling personal statement highlighting your achievements and goals",
    "Request recommendation letters from teachers who know you well",
    "Prepare all documents in advance and keep multiple copies",
    "Apply to multiple scholarships to increase your chances",
  ];

  // Build general advice
  const generalAdvice = [
    "Maintain strong academic performance throughout your studies",
    "Participate in extracurricular activities and community service",
    "Develop leadership skills through school clubs and organizations",
    "Prepare well for entrance exams if required by the scholarship",
  ];

  const eligibilitySummary = buildEligibilitySummary(
    matchedScholarships,
    academicPerformance,
    familyIncome
  );

  const highPriorityCount = matchedScholarships.filter((s) => s.matchScore >= 70).length;

  return {
    matchedScholarships: matchedScholarships.slice(0, 10),
    applicationTips,
    generalAdvice,
    eligibilitySummary,
    totalScholarships: matchedScholarships.length,
    highPriorityCount,
    disclaimer: "Scholarship information is based on available data and may change. Always verify with official sources before applying.",
  };
}

// ============================================================================
// GET - Check availability
// ============================================================================

export async function GET() {
  return NextResponse.json({
    available: true,
    feature: "AI Scholarship Matcher",
    description: "Find scholarship opportunities matched to your profile",
    requiresAuth: true,
    inputFields: [
      "academicPerformance.marks",
      "academicPerformance.gpa",
      "academicPerformance.class10Marks",
      "academicPerformance.class12Marks",
      "familyIncome",
      "fieldOfStudy",
      "careerGoals",
      "specialAchievements",
      "interests",
    ],
  });
}
