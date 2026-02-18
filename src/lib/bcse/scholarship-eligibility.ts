/**
 * BCSE Scholarship Eligibility Calculator
 * Calculate student eligibility for various government scholarships
 */

import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { bcseResults, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export interface ScholarshipEligibility {
  scholarshipCode: string;
  scholarshipName: string;
  provider: string;
  eligible: boolean;
  eligibilityScore: number; // 0-100
  requirementsMet: string[];
  requirementsNotMet: string[];
  recommendedPrograms: Array<{
    field: string;
    programs: string[];
  }>;
}

export interface AcademicProfile {
  percentage: number;
  division: string;
  passed: boolean;
  examType: "BCSE_10" | "BCSE_12";
  examYear: number;
  subjectResults: Array<{
    subjectName: string;
    marksObtained: number;
    totalMarks: number;
    grade: string;
  }>;
  aggregateMarks: number;
  totalMarks: number;
}

// ============================================================================
// SCHOLARSHIP DEFINITIONS
// ============================================================================

const GOVERNMENT_SCHOLARSHIPS = [
  {
    code: "GOS_FULL_MERIT",
    name: "Full Merit Scholarship",
    provider: "Royal Government of Bhutan",
    eligibilityCriteria: {
      minPercentage: 75,
      requireDivision: "First Division",
      subjects: [],
    },
    coverage: { tuition: true, hostel: true, books: true, living: true },
  },
  {
    code: "GOS_PARTIAL_MERIT",
    name: "Partial Merit Scholarship",
    provider: "Royal Government of Bhutan",
    eligibilityCriteria: {
      minPercentage: 65,
      requireDivision: "First Division",
      subjects: [],
    },
    coverage: { tuition: true, hostel: false, books: true, living: false },
  },
  {
    code: "GOS_STEM_SCHOLARSHIP",
    name: "STEM Excellence Scholarship",
    provider: "Royal Government of Bhutan",
    eligibilityCriteria: {
      minPercentage: 70,
      requireDivision: "First Division",
      subjects: ["Mathematics", "Physics", "Chemistry", "Biology"],
      minSubjectPercentage: 75,
    },
    coverage: { tuition: true, hostel: true, books: true, living: true },
    recommendedFields: ["engineering", "medicine", "science"],
  },
  {
    code: "GOS_ARTS_HUMANITIES",
    name: "Arts & Humanities Scholarship",
    provider: "Royal Government of Bhutan",
    eligibilityCriteria: {
      minPercentage: 65,
      requireDivision: "First Division",
      subjects: ["English", "Dzongkha", "History", "Economics"],
      minSubjectPercentage: 70,
    },
    coverage: { tuition: true, hostel: true, books: true, living: false },
    recommendedFields: ["arts", "education", "social_science"],
  },
  {
    code: "GOS_NEED_BASED",
    name: "Need-Based Scholarship",
    provider: "Royal Government of Bhutan",
    eligibilityCriteria: {
      minPercentage: 55,
      requireDivision: null,
      subjects: [],
    },
    coverage: { tuition: true, hostel: false, books: true, living: false },
    requiresIncomeVerification: true,
    maxAnnualIncome: 300000, // Nu. 300,000
  },
  {
    code: "RUB_COLLEGE_SPECIFIC",
    name: "RUB College Scholarship",
    provider: "Royal University of Bhutan",
    eligibilityCriteria: {
      minPercentage: 60,
      requireDivision: null,
      subjects: [],
    },
    coverage: { tuition: true, hostel: false, books: false, living: false },
  },
];

// ============================================================================
// ELIGIBILITY CALCULATOR
// ============================================================================

/**
 * Get student's academic profile from BCSE results
 */
export async function getStudentAcademicProfile(
  studentId: string,
  examType?: "BCSE_10" | "BCSE_12"
): Promise<AcademicProfile | null> {
  const conditions = [eq(bcseResults.studentId, studentId)];

  if (examType) {
    conditions.push(eq(bcseResults.examType, examType));
  }

  const [result] = await db
    .select()
    .from(bcseResults)
    .where(and(...conditions))
    .orderBy(bcseResults.examYear)
    .limit(1);

  if (!result) {
    return null;
  }

  return {
    percentage: result.percentage / 100, // Convert from hundredths
    division: result.division || "",
    passed: result.passed,
    examType: result.examType as "BCSE_10" | "BCSE_12",
    examYear: result.examYear,
    subjectResults: (result.subjectResults || []).map((s: any) => ({
      subjectName: s.subjectName,
      marksObtained: s.marksObtained,
      totalMarks: s.totalMarks,
      grade: s.grade,
    })),
    aggregateMarks: result.aggregateMarks || 0,
    totalMarks: result.totalMarks || 0,
  };
}

/**
 * Calculate scholarship eligibility for a student
 */
export async function calculateScholarshipEligibility(
  studentId: string,
  examType?: "BCSE_10" | "BCSE_12",
  annualIncome?: number
): Promise<ScholarshipEligibility[]> {
  // Get academic profile
  const profile = await getStudentAcademicProfile(studentId, examType);

  if (!profile || !profile.passed) {
    return [];
  }

  const eligibilities: ScholarshipEligibility[] = [];

  for (const scholarship of GOVERNMENT_SCHOLARSHIPS) {
    const eligibility = calculateSingleScholarship(profile, scholarship, annualIncome);
    eligibilities.push(eligibility);
  }

  // Sort by eligibility score (highest first)
  eligibilities.sort((a, b) => b.eligibilityScore - a.eligibilityScore);

  return eligibilities;
}

/**
 * Calculate eligibility for a single scholarship
 */
function calculateSingleScholarship(
  profile: AcademicProfile,
  scholarship: any,
  annualIncome?: number
): ScholarshipEligibility {
  const requirementsMet: string[] = [];
  const requirementsNotMet: string[] = [];
  let eligibilityScore = 0;

  // Check percentage requirement
  if (profile.percentage >= scholarship.eligibilityCriteria.minPercentage) {
    requirementsMet.push(
      `Minimum percentage (${profile.percentage.toFixed(2)}% ≥ ${scholarship.eligibilityCriteria.minPercentage}%)`
    );
    eligibilityScore += 40;
  } else {
    requirementsNotMet.push(
      `Minimum percentage (${profile.percentage.toFixed(2)}% < ${scholarship.eligibilityCriteria.minPercentage}%)`
    );
  }

  // Check division requirement
  if (scholarship.eligibilityCriteria.requireDivision) {
    if (profile.division.includes(scholarship.eligibilityCriteria.requireDivision)) {
      requirementsMet.push(`Division requirement (${profile.division})`);
      eligibilityScore += 20;
    } else {
      requirementsNotMet.push(
        `Division requirement (Need ${scholarship.eligibilityCriteria.requireDivision}, have ${profile.division})`
      );
    }
  }

  // Check subject requirements
  if (scholarship.eligibilityCriteria.subjects.length > 0) {
    const subjectScores: Record<string, number> = {};
    const requiredSubjects = scholarship.eligibilityCriteria.subjects;

    profile.subjectResults.forEach((subject) => {
      const subjectName = subject.subjectName.toLowerCase();
      const percentage = (subject.marksObtained / subject.totalMarks) * 100;
      subjectScores[subjectName] = percentage;
    });

    const subjectsMet: string[] = [];
    const subjectsNotMet: string[] = [];

    for (const requiredSubject of requiredSubjects) {
      const score = subjectScores[requiredSubject.toLowerCase()];
      const minScore = scholarship.eligibilityCriteria.minSubjectPercentage || 60;

      if (score && score >= minScore) {
        subjectsMet.push(`${requiredSubject} (${score.toFixed(1)}%)`);
        eligibilityScore += 10;
      } else {
        subjectsNotMet.push(
          `${requiredSubject} (${score?.toFixed(1) || "N/A"}% < ${minScore}%)`
        );
      }
    }

    if (subjectsMet.length === requiredSubjects.length) {
      requirementsMet.push(`Subject requirements (${subjectsMet.join(", ")})`);
    } else {
      requirementsNotMet.push(`Subject requirements (${subjectsNotMet.join(", ")})`);
    }
  }

  // Check income requirement for need-based scholarships
  if (scholarship.requiresIncomeVerification) {
    if (annualIncome !== undefined && annualIncome <= scholarship.maxAnnualIncome) {
      requirementsMet.push(
        `Income requirement (Nu. ${annualIncome.toLocaleString()} ≤ Nu. ${scholarship.maxAnnualIncome.toLocaleString()})`
      );
      eligibilityScore += 20;
    } else if (annualIncome !== undefined) {
      requirementsNotMet.push(
        `Income requirement (Nu. ${annualIncome.toLocaleString()} > Nu. ${scholarship.maxAnnualIncome.toLocaleString()})`
      );
    } else {
      requirementsNotMet.push("Income verification required");
    }
  }

  const eligible = requirementsNotMet.length === 0;

  return {
    scholarshipCode: scholarship.code,
    scholarshipName: scholarship.name,
    provider: scholarship.provider,
    eligible,
    eligibilityScore: Math.min(100, eligibilityScore),
    requirementsMet,
    requirementsNotMet,
    recommendedPrograms: scholarship.recommendedFields
      ? [
          {
            field: scholarship.recommendedFields.join(", "),
            programs: getProgramsForField(scholarship.recommendedFields),
          },
        ]
      : [],
  };
}

/**
 * Get program recommendations for a field
 */
function getProgramsForField(fields: string[]): string[] {
  const fieldPrograms: Record<string, string[]> = {
    engineering: ["B.E. Civil Engineering", "B.E. Electrical Engineering", "B.E. Computer Science"],
    medicine: ["MBBS", "BDS", "B.Pharm", "B.Nursing"],
    science: ["B.Sc. Physics", "B.Sc. Chemistry", "B.Sc. Mathematics", "B.Sc. Environmental Science"],
    arts: ["B.A. English", "B.A. Dzongkha", "B.A. History", "B.A. Political Science"],
    education: ["B.Ed Primary", "B.Ed Secondary", "B.Ed Special Education"],
    social_science: ["B.A. Economics", "B.A. Sociology", "B.A. Psychology"],
    business: ["BBA", "B.Com", "BBA Finance"],
  };

  const programs: string[] = [];
  for (const field of fields) {
    if (fieldPrograms[field]) {
      programs.push(...fieldPrograms[field]);
    }
  }

  return programs;
}

/**
 * Get recommended RUB colleges based on academic profile
 */
export function getRecommendedColleges(profile: AcademicProfile): Array<{
  collegeName: string;
  programs: string[];
  matchScore: number;
}> {
  const recommendations: Array<{
    collegeName: string;
    programs: string[];
    matchScore: number;
  }> = [];

  // RUB Colleges with their specialties
  const colleges = [
    {
      name: "College of Science and Technology (CST)",
      programs: ["B.E. Civil", "B.E. Electrical", "B.E. Electronics", "B.E. Information Technology"],
      fields: ["engineering", "technology"],
    },
    {
      name: "Jigme Singye Wangchuck School of Law",
      programs: ["LL.B (Hons)"],
      fields: ["law"],
    },
    {
      name: "Royal Thimphu College (RTC)",
      programs: ["B.A Economics", "B.A Political Science", "BBA", "B.Com"],
      fields: ["arts", "business", "social_science"],
    },
    {
      name: "Sherubtse College",
      programs: ["B.Sc Physics", "B.Sc Chemistry", "B.Sc Mathematics", "B.A English", "B.A Dzongkha"],
      fields: ["science", "arts"],
    },
    {
      name: "Gedu College of Business Studies (GCBS)",
      programs: ["BBA", "B.Com", "BBA Finance"],
      fields: ["business"],
    },
    {
      name: "Paro College of Education (PCE)",
      programs: ["B.Ed Primary", "B.Ed Secondary"],
      fields: ["education"],
    },
    {
      name: "Samtse College of Education (SCE)",
      programs: ["B.Ed Primary", "B.Ed Secondary"],
      fields: ["education"],
    },
    {
      name: "College of Language and Culture Studies (CLCS)",
      programs: ["B.A Dzongkha", "B.A Language and Culture"],
      fields: ["arts", "language"],
    },
  ];

  for (const college of colleges) {
    let matchScore = 50; // Base score

    // High percentage students match better with competitive programs
    if (profile.percentage >= 75) {
      matchScore += 30;
    } else if (profile.percentage >= 65) {
      matchScore += 20;
    }

    // Check subject alignment
    const subjectAreas = profile.subjectResults.map((s) => s.subjectName.toLowerCase());
    for (const field of college.fields) {
      if (subjectAreas.some((s) => s.includes(field) || field.includes(s))) {
        matchScore += 10;
      }
    }

    recommendations.push({
      collegeName: college.name,
      programs: college.programs,
      matchScore: Math.min(100, matchScore),
    });
  }

  return recommendations.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get career suggestions based on BCSE subject performance
 */
export function getCareerSuggestions(profile: AcademicProfile): Array<{
  career: string;
  field: string;
  reasoning: string;
  suitabilityScore: number;
}> {
  const suggestions: Array<{
    career: string;
    field: string;
    reasoning: string;
    suitabilityScore: number;
  }> = [];

  const subjectStrengths: Record<string, number> = {};

  // Calculate subject strengths
  profile.subjectResults.forEach((subject) => {
    const percentage = (subject.marksObtained / subject.totalMarks) * 100;
    subjectStrengths[subject.subjectName.toLowerCase()] = percentage;
  });

  // Career mappings based on subject performance
  const careerMappings = [
    {
      subjects: ["mathematics", "physics", "chemistry"],
      careers: [
        { career: "Engineer", field: "engineering" },
        { career: "Architect", field: "engineering" },
        { career: "Data Scientist", field: "technology" },
      ],
    },
    {
      subjects: ["biology", "chemistry"],
      careers: [
        { career: "Doctor", field: "medicine" },
        { career: "Pharmacist", field: "medicine" },
        { career: "Nurse", field: "medicine" },
      ],
    },
    {
      subjects: ["english", "dzongkha", "history", "economics"],
      careers: [
        { career: "Civil Servant", field: "administration" },
        { career: "Journalist", field: "media" },
        { career: "Teacher", field: "education" },
        { career: "Lawyer", field: "law" },
      ],
    },
    {
      subjects: ["economics", "mathematics", "accountancy"],
      careers: [
        { career: "Accountant", field: "finance" },
        { career: "Banker", field: "finance" },
        { career: "Business Analyst", field: "business" },
      ],
    },
  ];

  for (const mapping of careerMappings) {
    const totalScore = mapping.subjects.reduce((sum, subject) => {
      return sum + (subjectStrengths[subject.toLowerCase()] || 0);
    }, 0);

    const avgScore = totalScore / mapping.subjects.length;

    if (avgScore >= 70) {
      for (const career of mapping.careers) {
        suggestions.push({
          ...career,
          reasoning: `Strong performance in ${mapping.subjects.join(" and ")} (avg: ${avgScore.toFixed(1)}%)`,
          suitabilityScore: Math.min(100, avgScore + 10),
        });
      }
    }
  }

  return suggestions
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
    .slice(0, 10);
}

// ============================================================================
// RUB ADMISSION PREDICTOR
// ============================================================================

export interface AdmissionPrediction {
  collegeName: string;
  programName: string;
  admissionProbability: number; // 0-100
  category: "high" | "medium" | "low";
  reasons: string[];
}

/**
 * Predict admission chances for RUB colleges
 */
export function predictRUBAdmission(
  profile: AcademicProfile,
  collegePreferences?: Array<{ collegeName: string; programName: string }>
): AdmissionPrediction[] {
  const predictions: AdmissionPrediction[] = [];

  // Default college preferences if not provided
  const defaults = collegePreferences || [
    { collegeName: "College of Science and Technology", programName: "B.E. Civil Engineering" },
    { collegeName: "Sherubtse College", programName: "B.Sc Physics" },
    { collegeName: "Royal Thimphu College", programName: "BBA" },
  ];

  for (const pref of defaults) {
    let probability = 0;
    const reasons: string[] = [];

    // Base probability from percentage
    if (profile.percentage >= 80) {
      probability = 85;
      reasons.push("Excellent academic performance (80%+)");
    } else if (profile.percentage >= 70) {
      probability = 70;
      reasons.push("Good academic performance (70-80%)");
    } else if (profile.percentage >= 60) {
      probability = 50;
      reasons.push("Average academic performance (60-70%)");
    } else {
      probability = 30;
      reasons.push("Below average academic performance");
    }

    // Adjust based on division
    if (profile.division.includes("First")) {
      probability += 10;
      reasons.push("First Division");
    }

    // Adjust based on relevant subjects
    const relevantSubjects = getRelevantSubjects(pref.programName);
    let relevantScore = 0;
    let count = 0;

    for (const subject of relevantSubjects) {
      const result = profile.subjectResults.find(
        (s) => s.subjectName.toLowerCase() === subject.toLowerCase()
      );
      if (result) {
        const percentage = (result.marksObtained / result.totalMarks) * 100;
        relevantScore += percentage;
        count++;
      }
    }

    if (count > 0) {
      const avgRelevant = relevantScore / count;
      if (avgRelevant >= 75) {
        probability += 10;
        reasons.push("Strong performance in relevant subjects");
      } else if (avgRelevant >= 60) {
        probability += 5;
        reasons.push("Good performance in relevant subjects");
      }
    }

    predictions.push({
      collegeName: pref.collegeName,
      programName: pref.programName,
      admissionProbability: Math.min(100, Math.max(0, probability)),
      category: probability >= 70 ? "high" : probability >= 50 ? "medium" : "low",
      reasons,
    });
  }

  return predictions.sort((a, b) => b.admissionProbability - a.admissionProbability);
}

function getRelevantSubjects(programName: string): string[] {
  const programSubjects: Record<string, string[]> = {
    "B.E.": ["Mathematics", "Physics", "Chemistry"],
    "B.Sc": ["Mathematics", "Physics", "Chemistry", "Biology"],
    "BBA": ["Economics", "Mathematics", "Accountancy"],
    "B.Com": ["Economics", "Mathematics", "Accountancy"],
    "B.A": ["English", "Dzongkha", "History", "Economics"],
    "B.Ed": ["English", "Dzongkha", "Mathematics"],
    "MBBS": ["Biology", "Chemistry", "Physics"],
  };

  for (const [key, subjects] of Object.entries(programSubjects)) {
    if (programName.includes(key)) {
      return subjects;
    }
  }

  return ["English", "Mathematics"];
}
