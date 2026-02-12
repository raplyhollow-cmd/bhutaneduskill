import type { RIASECScores, CareerMatch } from "@/types";

/**
 * Calculate RIASEC personality type from assessment answers
 */
export interface RIASECInput {
  [questionId: string]: number; // Selected value (1-5)
}

export interface RIASECResult {
  type: string; // 3-letter code (e.g., "IAS")
  scores: RIASECScores;
  dominantTraits: string[];
}

/**
 * Calculate RIASEC scores from user answers
 */
export function calculateRIASEC(
  answers: RIASECInput,
  questions: Array<{ id: string; category: string }>
): RIASECResult {
  // Initialize scores
  const rawScores = {
    realistic: 0,
    investigative: 0,
    artistic: 0,
    social: 0,
    enterprising: 0,
    conventional: 0,
  };

  // Count questions per category
  const categoryCounts = {
    realistic: 0,
    investigative: 0,
    artistic: 0,
    social: 0,
    enterprising: 0,
    conventional: 0,
  };

  // Calculate scores by category
  questions.forEach((question) => {
    const answer = answers[question.id];
    if (answer !== undefined) {
      const category = question.category.toLowerCase();
      rawScores[category as keyof typeof rawScores] += answer;
      categoryCounts[category as keyof typeof categoryCounts]++;
    }
  });

  // Normalize scores to 0-100 scale
  const maxPossible = Math.max(...Object.values(categoryCounts)) * 5;

  const normalizedScores: RIASECScores = {
    realistic: Math.round((rawScores.realistic / (categoryCounts.realistic * 5 || 1)) * 100),
    investigative: Math.round((rawScores.investigative / (categoryCounts.investigative * 5 || 1)) * 100),
    artistic: Math.round((rawScores.artistic / (categoryCounts.artistic * 5 || 1)) * 100),
    social: Math.round((rawScores.social / (categoryCounts.social * 5 || 1)) * 100),
    enterprising: Math.round((rawScores.enterprising / (categoryCounts.enterprising * 5 || 1)) * 100),
    conventional: Math.round((rawScores.conventional / (categoryCounts.conventional * 5 || 1)) * 100),
  };

  // Sort to find top 3
  const sorted = Object.entries(normalizedScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3) as [string, number][];

  const dominantTraits = sorted.map(([trait]) => trait.charAt(0).toUpperCase());
  const type = dominantTraits.join("");

  return {
    type,
    scores: normalizedScores,
    dominantTraits,
  };
}

function maxObjectValues(obj: Record<string, number>): number {
  return Math.max(...Object.values(obj));
}

/**
 * Match careers based on RIASEC results
 */
export function matchCareers(
  riasecResult: RIASECResult,
  careers: Array<{
    id: string;
    name: string;
    description: string;
    riasecCode: string;
    riasecScores?: Partial<RIASECScores>;
    skills: string[];
    educationPath: string[];
    subjects: string[];
    workEnvironment: string;
    salaryRange: string;
    demandOutlook: "high" | "medium" | "low";
  }>
): CareerMatch[] {
  return careers
    .map((career) => {
      // Calculate match score based on RIASEC alignment
      const careerTraits = career.riasecCode?.toLowerCase() || "";
      let alignmentScore = 0;

      // Weight: 1st trait 50%, 2nd 30%, 3rd 20%
      riasecResult.dominantTraits.forEach((trait, index) => {
        if (careerTraits.includes(trait.toLowerCase())) {
          const weight = index === 0 ? 0.5 : index === 1 ? 0.3 : 0.2;
          alignmentScore += 50 * weight;
        }
      });

      // Bonus for high scores in career's primary RIASEC areas
      if (career.riasecScores) {
        Object.entries(career.riasecScores).forEach(([trait, score]) => {
          const userScore = riasecResult.scores[trait as keyof RIASECScores] || 0;
          alignmentScore += (userScore * score) / 100;
        });
      }

      return {
        career: {
          ...career,
          slug: career.slug || career.name.toLowerCase().replace(/\s+/g, "-"),
        } as any,
        matchScore: Math.round(Math.min(alignmentScore, 100)),
      };
    })
    .filter((match) => match.matchScore >= 40)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
}

/**
 * Get study abroad readiness score
 */
export function getStudyAbroadReadiness(
  userGrades: number[],
  targetCountry: "australia" | "new-zealand" | "usa" | "singapore" | "europe",
  ieltsScore?: number
): {
  score: number;
  academicReady: boolean;
  languageReady: boolean;
  recommendations: string[];
} {
  const avgGrade = userGrades.reduce((a, b) => a + b, 0) / userGrades.length;

  const requirements = {
    australia: { minGrade: 70, minIelts: 6.5 },
    "new-zealand": { minGrade: 65, minIelts: 6.0 },
    usa: { minGrade: 75, minIelts: null },
    singapore: { minGrade: 70, minIelts: 6.5 },
    europe: { minGrade: 65, minIelts: 6.0 },
  };

  const req = requirements[targetCountry];

  const academicReady = avgGrade >= req.minGrade;
  const languageReady = req.minIelts ? (ieltsScore || 0) >= req.minIelts : true;

  let score = 50; // Base score
  if (academicReady) score += 25;
  if (languageReady) score += 25;

  const recommendations: string[] = [];

  if (!academicReady) {
    recommendations.push(`Improve grades to at least ${req.minGrade}% average`);
  }
  if (req.minIelts && !languageReady) {
    recommendations.push(`Achieve IELTS score of ${req.minIelts} or higher`);
  }
  if (academicReady && languageReady) {
    recommendations.push("Start university application process");
    recommendations.push("Research scholarship opportunities");
  }

  return {
    score,
    academicReady,
    languageReady,
    recommendations,
  };
}

/**
 * Get skills improvement resources
 */
export function getSkillsResources(skill: string) {
  const resources: Record<string, Array<{ name: string; url: string; type: "free" | "paid" }>> = {
    programming: [
      { name: "freeCodeCamp", url: "https://freecodecamp.org", type: "free" },
      { name: "Khan Academy Computing", url: "https://khanacademy.org/computing", type: "free" },
      { name: "Coursera Python", url: "https://www.coursera.org/learn/python", type: "paid" },
    ],
    design: [
      { name: "Canva Design School", url: "https://www.canva.com/design-school", type: "free" },
      { name: "Figma", url: "https://www.figma.com", type: "free" },
      { name: "Coursera Google UX Design", url: "https://www.coursera.org/learn/google-ux-design", type: "paid" },
    ],
    data: [
      { name: "Khan Academy Statistics", url: "https://www.khanacademy.org/math/statistics-probability", type: "free" },
      { name: "SQLBolt", url: "https://sqlbolt.com", type: "free" },
      { name: "DataCamp", url: "https://www.datacamp.com", type: "paid" },
    ],
    business: [
      { name: "Khan Academy Economics", url: "https://www.khanacademy.org/economics-finance-domain", type: "free" },
      { name: "HubSpot Academy", url: "https://academy.hubspot.com", type: "free" },
      { name: "Udemy Business", url: "https://www.udemy.com/courses/business/", type: "paid" },
    ],
  };

  return resources[skill.toLowerCase()] || [];
}
