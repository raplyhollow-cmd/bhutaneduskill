/**
 * WORKFORCE ANALYZER - Ministry of Education Intelligence
 *
 * Aggregates data from ALL schools to predict:
 * - "In 2028, Bhutan will need 500 more teachers"
 * - "Open new Technical College in Trashigang"
 * - "30% surplus in Tourism, 20% deficit in Healthcare"
 *
 * This is the strategic value that makes the Ministry partnership essential.
 */

import { db } from "@/lib/db";
import {
  users,
  schools,
  careerMatches as careerMatchesTable,
  assessmentResults,
  riasecResults,
  enrollments,
  examResultsEnhanced,
  rubApplications,
} from "@/lib/db/schema";
import { eq, and, sql, count, avg, desc, gte, lte } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface WorkforcePrediction {
  year: number;
  sector: string;
  projectedDemand: number;
  projectedSupply: number;
  gap: number;
  status: "surplus" | "balanced" | "deficit";
  confidence: "high" | "medium" | "low";
  rationale: string;
}

export interface RegionalWorkforceGap {
  district: string;
  sector: string;
  currentStudents: number;
  projectedGraduates: number;
  localDemand: number;
  gap: number;
  recommendation: string;
}

export interface CareerPathwayAnalysis {
  career: string;
  currentInterest: number;
  trend: "growing" | "stable" | "declining";
  bcseReadiness: number;
  projectedRUBEnrollment: number;
  workforceReadiness: number;
  timeToWorkforce: number; // Years from Class 12 to employment
}

export interface NationalWorkforceReport {
  generatedAt: string;
  dataSourceCount: number; // Number of schools
  totalStudents: number;
  predictions: WorkforcePrediction[];
  regionalGaps: RegionalWorkforceGap[];
  careerPathways: CareerPathwayAnalysis[];
  recommendations: Recommendation[];
}

export interface Recommendation {
  type: "infrastructure" | "policy" | "program" | "scholarship";
  priority: "urgent" | "high" | "medium" | "low";
  action: string;
  rationale: string;
  targetDzongkhags?: string[];
  estimatedCost?: string;
  timeline?: string;
}

// ============================================================================
// BHUTAN WORKFORCE SECTORS
// ============================================================================

const WORKFORCE_SECTORS = {
  "Healthcare": {
    careers: ["doctor", "nurse", "medical", "health", "pharmacist", "dentist"],
    annualNeed: 150, // New professionals needed per year
    currentSupply: 1200,
    growthRate: 0.08, // 8% annual growth
  },
  "Education": {
    careers: ["teacher", "professor", "lecturer", "tutor", "educator", "principal"],
    annualNeed: 300,
    currentSupply: 4500,
    growthRate: 0.05,
  },
  "STEM / IT": {
    careers: ["software", "engineer", "developer", "data", "it", "technology", "computer"],
    annualNeed: 200,
    currentSupply: 1500,
    growthRate: 0.12,
  },
  "Agriculture": {
    careers: ["agriculture", "farming", "forestry", "livestock", "veterinary"],
    annualNeed: 180,
    currentSupply: 2200,
    growthRate: 0.03,
  },
  "Tourism": {
    careers: ["tourism", "hotel", "hospitality", "guide", "travel"],
    annualNeed: 250,
    currentSupply: 1800,
    growthRate: 0.10,
  },
  "Hydropower": {
    careers: ["hydro", "power", "energy", "electrical"],
    annualNeed: 80,
    currentSupply: 600,
    growthRate: 0.06,
  },
  "Civil Service": {
    careers: ["administrative", "civil servant", "government", "policy"],
    annualNeed: 200,
    currentSupply: 3500,
    growthRate: 0.04,
  },
  "Finance": {
    careers: ["accounting", "finance", "banking", "economics"],
    annualNeed: 100,
    currentSupply: 900,
    growthRate: 0.07,
  },
  "Construction": {
    careers: ["construction", "architecture", "civil", "builder"],
    annualNeed: 220,
    currentSupply: 1600,
    growthRate: 0.09,
  },
  "Arts & Culture": {
    careers: ["artist", "design", "culture", "music", "textile", "painting"],
    annualNeed: 80,
    currentSupply: 700,
    growthRate: 0.05,
  },
};

// ============================================================================
// CAREER TO SECTOR MAPPING
// ============================================================================

function getSectorForCareer(career: string): string {
  const careerLower = career.toLowerCase();

  for (const [sector, data] of Object.entries(WORKFORCE_SECTORS)) {
    for (const keyword of data.careers) {
      if (careerLower.includes(keyword)) {
        return sector;
      }
    }
  }

  return "Other";
}

// ============================================================================
// WORKFORCE PREDICTION ENGINE
// ============================================================================

/**
 * Calculate projected supply for a given year
 * Based on current students by grade, progression rates, and completion rates
 */
async function calculateProjectedSupply(
  sector: string,
  targetYear: number
): Promise<number> {
  const currentYear = new Date().getFullYear();
  const yearsToGraduation = targetYear - currentYear;

  if (yearsToGraduation <= 0) {
    // Past or current year - use current data
    return await getCurrentSupply(sector);
  }

  // Get current students interested in this sector
  const sectorKeywords = WORKFORCE_SECTORS[sector]?.careers || [];

  if (sectorKeywords.length === 0) {
    return Math.round(WORKFORCE_SECTORS[sector]?.currentSupply * (1 + 0.05 * yearsToGraduation) || 0);
  }

  // Build career matching query
  const matches = await db
    .select({
      count: count(),
    })
    .from(careerMatchesTable)
    .where(sql`${careerMatchesTable.careerTitle} ILIKE ANY(${sectorKeywords.map(k => `%${k}%`)})`);

  const interestedStudents = matches[0]?.count || 0;

  // Apply progression filters based on years to graduation
  // Class 12 graduates in 0 years, Class 11 in 1 year, etc.
  let relevantGrade: string;
  if (yearsToGraduation === 0) relevantGrade = "12";
  else if (yearsToGraduation === 1) relevantGrade = "11";
  else if (yearsToGraduation === 2) relevantGrade = "10";
  else if (yearsToGraduation >= 3 && yearsToGraduation <= 5) relevantGrade = "8";
  else relevantGrade = "6";

  // Get students in relevant grade
  const studentsInGrade = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.type, "student"),
        sql`${users.grade} = ${relevantGrade}`,
        eq(users.isActive, true)
      )
    );

  const gradeStudents = studentsInGrade[0]?.count || 0;

  // Estimate progression: 85% continue each year
  const progressionRate = Math.pow(0.85, yearsToGraduation);

  // Estimate completion: 70% complete assessments and are on track
  const completionRate = 0.70;

  // Project supply = current supply + new graduates
  const currentSupply = WORKFORCE_SECTORS[sector]?.currentSupply || 0;
  const newGraduates = Math.round(gradeStudents * progressionRate * completionRate * 0.3); // 30% enter this sector

  return currentSupply + (newGraduates * Math.max(0, yearsToGraduation));
}

/**
 * Calculate projected demand for a given year
 * Based on economic growth, retirement rates, and sector trends
 */
function calculateProjectedDemand(
  sector: string,
  targetYear: number
): number {
  const currentYear = new Date().getFullYear();
  const yearsFromNow = targetYear - currentYear;

  if (yearsFromNow < 0) return 0;

  const sectorData = WORKFORCE_SECTORS[sector];
  if (!sectorData) return 0;

  // Base demand = current supply + annual need
  const baseDemand = sectorData.currentSupply + (sectorData.annualNeed * yearsFromNow);

  // Apply growth rate (compound)
  const growthFactor = Math.pow(1 + sectorData.growthRate, yearsFromNow);

  return Math.round(baseDemand * growthFactor);
}

/**
 * Get current supply for a sector (actual professionals)
 */
async function getCurrentSupply(sector: string): Promise<number> {
  return WORKFORCE_SECTORS[sector]?.currentSupply || 0;
}

// ============================================================================
// MAIN ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Generate comprehensive workforce report for Ministry
 */
export async function generateNationalWorkforceReport(
  targetYear: number = 2028
): Promise<NationalWorkforceReport> {

  logger.info("Generating national workforce report", { targetYear });

  // Get data source count
  const [schoolCount] = await db
    .select({ count: count() })
    .from(schools)
    .where(eq(schools.isActive, true));

  const [studentCount] = await db
    .select({ count: count() })
    .from(users)
    .where(and(eq(users.type, "student"), eq(users.isActive, true)));

  const dataSourceCount = schoolCount?.count || 0;
  const totalStudents = studentCount?.count || 0;

  // ========================================================================
  // PART 1: Workforce Predictions by Sector
  // ========================================================================

  const predictions: WorkforcePrediction[] = [];

  for (const [sector, data] of Object.entries(WORKFORCE_SECTORS)) {
    const projectedSupply = await calculateProjectedSupply(sector, targetYear);
    const projectedDemand = calculateProjectedDemand(sector, targetYear);
    const gap = projectedDemand - projectedSupply;

    let status: "surplus" | "balanced" | "deficit";
    const gapPercentage = Math.abs(gap / projectedDemand) * 100;

    if (gapPercentage <= 10) {
      status = "balanced";
    } else if (gap > 0) {
      status = "deficit";
    } else {
      status = "surplus";
    }

    // Confidence based on data quality
    const sectorKeywords = data.careers;
    const careerMatchCount = await db
      .select({ count: count() })
      .from(careerMatchesTable)
      .where(sql`${careerMatchesTable.careerTitle} ILIKE ANY(${sectorKeywords.map(k => `%${k}%`)})`);

    const confidence = careerMatchCount[0]?.count > 50 ? "high" :
                       careerMatchCount[0]?.count > 20 ? "medium" : "low";

    predictions.push({
      year: targetYear,
      sector,
      projectedSupply,
      projectedDemand,
      gap,
      status,
      confidence,
      rationale: `Based on ${careerMatchCount[0]?.count || 0} students interested in ${sector.toLowerCase()} careers, with ${data.growthRate * 100}% annual growth rate.`,
    });
  }

  // Sort by gap magnitude (biggest deficits first)
  predictions.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

  // ========================================================================
  // PART 2: Regional Workforce Gaps
  // ========================================================================

  const regionalGaps: RegionalWorkforceGap[] = [];

  // Get all schools grouped by district
  const allSchools = await db.select({
    id: schools.id,
    name: schools.name,
    state: schools.state,
    city: schools.city,
  }).from(schools).where(eq(schools.isActive, true));

  const districtMap = new Map<string, { schoolIds: string[]; districtName: string }>();

  for (const school of allSchools) {
    const district = school.state?.trim() || school.city?.trim() || "Other";

    if (!districtMap.has(district)) {
      districtMap.set(district, { schoolIds: [], districtName: district });
    }
    districtMap.get(district)!.schoolIds.push(school.id);
  }

  // Analyze each district for critical gaps
  for (const [district, data] of districtMap.entries()) {
    const schoolIds = data.schoolIds;

    // Get students in this district
    const districtStudents = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.type, "student"),
          sql`${users.schoolId} = ANY(${schoolIds})`,
          eq(users.isActive, true)
        )
      );

    const studentIds = districtStudents.map(s => s.id);
    const currentStudents = studentIds.length;

    // Project graduates (assuming 40% of students graduate and enter workforce)
    const projectedGraduates = Math.round(currentStudents * 0.4);

    // Local demand estimate based on district population
    // Thimphu = highest demand, remote districts = lower
    const districtMultiplier = district.toLowerCase().includes("thimphu") ? 1.5 :
                               district.toLowerCase().includes("phuentsholing") ? 1.3 :
                               district.toLowerCase().includes("paro") ? 1.2 :
                               0.8;

    const localDemand = Math.round(projectedGraduates * districtMultiplier);
    const gap = localDemand - projectedGraduates;

    if (Math.abs(gap) > 50) {
      regionalGaps.push({
        district: data.districtName,
        sector: "General",
        currentStudents,
        projectedGraduates,
        localDemand,
        gap,
        recommendation: gap > 0
          ? `Establish new Technical Training Institute in ${data.districtName} to meet ${gap} worker shortfall`
          : `${data.districtName} has surplus of ${Math.abs(gap)} workers - encourage migration to other districts`,
      });
    }
  }

  // Sort by gap magnitude
  regionalGaps.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

  // ========================================================================
  // PART 3: Career Pathway Analysis
  // ========================================================================

  const careerPathways: CareerPathwayAnalysis[] = [];

  // Get top career interests
  const topCareers = await db
    .select({
      careerTitle: careerMatchesTable.careerTitle,
      count: count(),
    })
    .from(careerMatchesTable)
    .groupBy(careerMatchesTable.careerTitle)
    .orderBy(desc(count(careerMatchesTable.careerTitle)))
    .limit(15);

  for (const career of topCareers) {
    const sector = getSectorForCareer(career.careerTitle);

    // Get BCSE readiness for students interested in this career
    const careerInterests = await db
      .select({
        userId: careerMatchesTable.studentId,
      })
      .from(careerMatchesTable)
      .where(eq(careerMatchesTable.careerTitle, career.careerTitle))
      .limit(100);

    const userIds = careerInterests.map(c => c.userId);

    // Get average grades
    const avgGradeResult = await db
      .select({
        avg: avg(examResultsEnhanced.percentage),
      })
      .from(examResultsEnhanced)
      .where(sql`${examResultsEnhanced.userId} = ANY(${userIds})`);

    const bcseReadiness = Math.round(Number(avgGradeResult[0]?.avg || 0));

    // Project RUB enrollment
    const projectedRUBEnrollment = Math.round(career.count * 0.7);

    // Workforce readiness (combination of interest, grades, and completion)
    const workforceReadiness = Math.round(
      (bcseReadiness * 0.5) + (Math.min(career.count * 10, 50) * 0.5)
    );

    careerPathways.push({
      career: career.careerTitle,
      currentInterest: career.count,
      trend: career.count > 20 ? "growing" : career.count > 10 ? "stable" : "declining",
      bcseReadiness,
      projectedRUBEnrollment,
      workforceReadiness,
      timeToWorkforce: 6, // Class 6 → Class 12 (6 years average)
    });
  }

  // ========================================================================
  // PART 4: Generate Recommendations
  // ========================================================================

  const recommendations: Recommendation[] = [];

  // Find critical deficits
  const criticalDeficits = predictions.filter(p => p.status === "deficit" && p.gap > 100);
  for (const deficit of criticalDeficits) {
    if (deficit.sector === "Healthcare") {
      recommendations.push({
        type: "scholarship",
        priority: "urgent",
        action: `Increase medical scholarships by ${Math.round(deficit.gap / 4)} per year`,
        rationale: `Projected ${deficit.gap}-doctor shortfall by ${targetYear}. Current pipeline insufficient.`,
        timeline: "Immediate",
        estimatedCost: "Nu. 50M annually",
      });
    } else if (deficit.sector === "Education") {
      recommendations.push({
        type: "program",
        priority: "urgent",
        action: `Expand Paro and Samtse College of Education capacity by ${Math.round(deficit.gap / 2)} seats`,
        rationale: `${deficit.gap} teacher shortage projected. Rural schools most affected.`,
        targetDzongkhags: ["All Dzongkhags"],
        timeline: "2 years",
        estimatedCost: "Nu. 75M",
      });
    } else if (deficit.sector === "STEM / IT") {
      recommendations.push({
        type: "infrastructure",
        priority: "high",
        action: "Establish new Institute of Technology in Gelephug",
        rationale: `Eastern region lacks STEM institutions. ${deficit.gap} IT workforce deficit projected.`,
        targetDzongkhags: ["Sarpang", "Samdrup Jongkhar", "Trashigang"],
        timeline: "3 years",
        estimatedCost: "Nu. 200M",
      });
    }
  }

  // Find regional gaps to address
  const topRegionalGaps = regionalGaps.slice(0, 3);
  for (const gap of topRegionalGaps) {
    if (gap.gap > 100) {
      recommendations.push({
        type: "infrastructure",
        priority: gap.gap > 200 ? "high" : "medium",
        action: `Build Technical Training Institute in ${gap.district}`,
        rationale: gap.recommendation,
        targetDzongkhags: [gap.district],
        timeline: "2-3 years",
      });
    }
  }

  // Check for surpluses to redirect
  const surpluses = predictions.filter(p => p.status === "surplus" && Math.abs(p.gap) > 50);
  for (const surplus of surpluses) {
    recommendations.push({
      type: "policy",
      priority: "medium",
      action: `Create career guidance campaign to redirect students from ${surplus.sector} to deficit sectors`,
      rationale: `${Math.abs(surplus.gap)}-worker surplus projected. Students should be guided toward Healthcare, Education, and STEM.`,
      timeline: "1 year",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    dataSourceCount,
    totalStudents,
    predictions,
    regionalGaps: regionalGaps.slice(0, 10),
    careerPathways: careerPathways.slice(0, 10),
    recommendations: recommendations.slice(0, 10),
  };
}

/**
 * Get quick workforce summary for dashboard widgets
 */
export async function getWorkforceSummary(): Promise<{
  totalStudents: number;
  projectedGraduates2028: number;
  criticalDeficits: string[];
  criticalSurpluses: string[];
  topRecommendation: string;
}> {
  const report = await generateNationalWorkforceReport(2028);

  const projectedGraduates2028 = Math.round(report.totalStudents * 0.4);
  const criticalDeficits = report.predictions
    .filter(p => p.status === "deficit" && p.gap > 100)
    .slice(0, 3)
    .map(p => p.sector);

  const criticalSurpluses = report.predictions
    .filter(p => p.status === "surplus" && Math.abs(p.gap) > 50)
    .slice(0, 2)
    .map(p => p.sector);

  const topRecommendation = report.recommendations[0]?.action ||
    "Continue monitoring student career interests";

  return {
    totalStudents: report.totalStudents,
    projectedGraduates2028,
    criticalDeficits,
    criticalSurpluses,
    topRecommendation,
  };
}

/**
 * Get regional workforce data for map visualization
 */
export async function getRegionalWorkforceData(): Promise<{
  district: string;
  studentCount: number;
  projectedGraduates: number;
  topSectors: string[];
  riskLevel: "adequate" | "shortage" | "critical";
}[]> {
  const report = await generateNationalWorkforceReport(2028);

  return report.regionalGaps.map(gap => ({
    district: gap.district,
    studentCount: gap.currentStudents,
    projectedGraduates: gap.projectedGraduates,
    topSectors: ["Education", "Healthcare", "Agriculture"], // TODO: Calculate from actual data
    riskLevel: gap.gap < -100 ? "critical" : gap.gap < -20 ? "shortage" : "adequate",
  }));
}
