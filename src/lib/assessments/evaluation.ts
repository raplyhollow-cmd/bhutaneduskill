/**
 * ASSESSMENT EVALUATION UTILS
 *
 * This module contains the logic to evaluate assessment answers
 * and generate results for each assessment type.
 */

// ============================================================================
// MBTI EVALUATION
// ============================================================================

export interface MBTIAnswer {
  questionId: string;
  answer: number; // 1-5 Likert scale
}

export interface MBTIResult {
  type: string; // e.g., "INTJ", "ENFP"
  eiScore: number;
  snScore: number;
  tfScore: number;
  jpScore: number;
  description: string;
  traits: string[];
}

const mbtiProfiles: Record<string, Omit<MBTIResult, "eiScore" | "snScore" | "tfScore" | "jpScore">> = {
  ISTJ: { type: "ISTJ", description: "The Inspector: Practical, fact-minded, and reliable.", traits: ["Practical", "Reliable", "Detail-oriented"] },
  ISFJ: { type: "ISFJ", description: "The Protector: Dedicated and warm protectors.", traits: ["Dedicated", "Warm", "Protective"] },
  INFJ: { type: "INFJ", description: "The Counselor: Quiet and mystical, yet inspiring.", traits: ["Insightful", "Principled", "Passionate"] },
  INTJ: { type: "INTJ", description: "The Mastermind: Imaginative and strategic thinkers.", traits: ["Strategic", "Analytical", "Independent"] },
  ISTP: { type: "ISTP", description: "The Craftsman: Bold and practical experimenters.", traits: ["Bold", "Practical", "Experimental"] },
  ISFP: { type: "ISFP", description: "The Composer: Flexible and charming artists.", traits: ["Flexible", "Charming", "Artistic"] },
  INFP: { type: "INFP", description: "The Healer: Poetic, kind and altruistic.", traits: ["Poetic", "Kind", "Altruistic"] },
  INTP: { type: "INTP", description: "The Architect: Innovative inventors with thirst for knowledge.", traits: ["Innovative", "Logical", "Curious"] },
  ESTP: { type: "ESTP", description: "The Promoter: Smart, energetic and very perceptive.", traits: ["Energetic", "Perceptive", "Bold"] },
  ESFP: { type: "ESFP", description: "The Performer: Spontaneous, energetic and enthusiastic.", traits: ["Spontaneous", "Energetic", "Enthusiastic"] },
  ENFP: { type: "ENFP", description: "The Champion: Enthusiastic, creative and sociable free spirits.", traits: ["Enthusiastic", "Creative", "Sociable"] },
  ENTP: { type: "ENTP", description: "The Debater: Smart and curious thinkers.", traits: ["Smart", "Curious", "Innovative"] },
  ESTJ: { type: "ESTJ", description: "The Supervisor: Excellent administrators.", traits: ["Organized", "Dedicated", "Traditional"] },
  ESFJ: { type: "ESFJ", description: "The Provider: Very dedicated, warm and protective.", traits: ["Caring", "Social", "Traditional"] },
  ENFJ: { type: "ENFJ", description: "The Teacher: Charismatic and inspiring leaders.", traits: ["Charismatic", "Inspiring", "Empathetic"] },
  ENTJ: { type: "ENTJ", description: "The Commander: Bold, imaginative and strong-willed leaders.", traits: ["Bold", "Strategic", "Leader"] },
};

export function evaluateMBTI(answers: MBTIAnswer[], questions: any[]): MBTIResult {
  // Initialize dimension scores
  const dimensionScores = { EI: 0, SN: 0, TF: 0, JP: 0 };
  const dimensionCounts = { EI: 0, SN: 0, TF: 0, JP: 0 };

  // Create a map of question data
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // Calculate scores for each answer
  answers.forEach((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) return;

    const dimension = question.questionData?.dimension;
    const direction = question.questionData?.direction || 1;

    if (dimension && dimensionScores[dimension] !== undefined) {
      // Convert 1-5 to -2 to +2, then apply direction
      const adjustedScore = (answer.answer - 3) * direction;
      dimensionScores[dimension] += adjustedScore;
      dimensionCounts[dimension]++;
    }
  });

  // Normalize to -100 to +100 scale
  const normalizeScore = (score: number, count: number) => {
    if (count === 0) return 0;
    const maxPossible = count * 2;
    return Math.round((score / maxPossible) * 100);
  };

  const eiScore = normalizeScore(dimensionScores.EI, dimensionCounts.EI);
  const snScore = normalizeScore(dimensionScores.SN, dimensionCounts.SN);
  const tfScore = normalizeScore(dimensionScores.TF, dimensionCounts.TF);
  const jpScore = normalizeScore(dimensionScores.JP, dimensionCounts.JP);

  // Determine 4-letter type
  const type = `${eiScore >= 0 ? "E" : "I"}${snScore >= 0 ? "S" : "N"}${tfScore >= 0 ? "T" : "F"}${jpScore >= 0 ? "J" : "P"}`;

  return {
    type,
    eiScore,
    snScore,
    tfScore,
    jpScore,
    description: getMBTIDescription(type),
    traits: getMBTITraits(type),
  };
}

function getMBTIDescription(type: string): string {
  const descriptions: Record<string, string> = {
    ISTJ: "The Inspector: Practical, fact-minded, and reliable.",
    ISFJ: "The Protector: Dedicated and warm protectors.",
    INFJ: "The Counselor: Quiet and mystical, yet inspiring.",
    INTJ: "The Mastermind: Imaginative and strategic thinkers.",
    ISTP: "The Craftsman: Bold and practical experimenters.",
    ISFP: "The Composer: Flexible and charming artists.",
    INFP: "The Healer: Poetic, kind and altruistic.",
    INTP: "The Architect: Innovative inventors with thirst for knowledge.",
    ESTP: "The Promoter: Smart, energetic and very perceptive.",
    ESFP: "The Performer: Spontaneous, energetic and enthusiastic.",
    ENFP: "The Champion: Enthusiastic, creative and sociable free spirits.",
    ENTP: "The Debater: Smart and curious thinkers.",
    ESTJ: "The Supervisor: Excellent administrators.",
    ESFJ: "The Provider: Very dedicated, warm and protective.",
    ENFJ: "The Teacher: Charismatic and inspiring leaders.",
    ENTJ: "The Commander: Bold, imaginative and strong-willed leaders.",
  };
  return descriptions[type] || "Unknown type";
}

function getMBTITraits(type: string): string[] {
  const traits: Record<string, string[]> = {
    ISTJ: ["Responsible", "Detail-oriented", "Loyal", "Organized"],
    ISFJ: ["Supportive", "Patient", "Reliable", "Warm"],
    INFJ: ["Insightful", "Principled", "Compassionate", "Altruistic"],
    INTJ: ["Strategic", "Analytical", "Independent", "Determined"],
    ISTP: ["Practical", "Observant", "Analytical", "Flexible"],
    ISFP: ["Gentle", "Sensitive", "Kind", "Artistic"],
    INFP: ["Idealistic", "Loyal", "Creative", "Curious"],
    INTP: ["Logical", "Abstract", "Independent", "Analytical"],
    ESTP: ["Energetic", "Perceptive", "Spontaneous", "Practical"],
    ESFP: ["Enthusiastic", "Friendly", "Spontaneous", "Practical"],
    ENFP: ["Enthusiastic", "Creative", "Sociable", "Communicative"],
    ENTP: ["Innovative", "Curious", "Versatile", "Energetic"],
    ESTJ: ["Organized", "Dedicated", "Practical", "Traditional"],
    ESFJ: ["Warm", "Loyal", "Helpful", "Organized"],
    ENFJ: ["Charismatic", "Inspiring", "Altruistic", "Natural leaders"],
    ENTJ: ["Bold", "Strategic", "Confident", "Organized"],
  };
  return traits[type] || [];
}

// ============================================================================
// DISC EVALUATION
// ============================================================================

export interface DISCAnswer {
  questionId: string;
  most: number; // 1-4 rating
  least: number; // 1-4 rating
}

export interface DISCResult {
  primaryType: string;
  dominance: number;
  influence: number;
  steadiness: number;
  conscientiousness: number;
  description: string;
  traits: string[];
}

export function evaluateDISC(answers: DISCAnswer[], questions: any[]): DISCResult {
  const scores = { D: 0, I: 0, S: 0, C: 0 };

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  answers.forEach((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) return;

    const dimension = question.questionData?.dimension;
    if (dimension && scores[dimension] !== undefined) {
      scores[dimension] += answer.most - answer.least;
    }
  });

  // Normalize to 0-100
  const maxPossible = questions.length * 4; // Each question max contribution is 4-1=3
  const normalize = (score: number) => Math.round(Math.max(0, (score / maxPossible) * 100));

  const dominance = normalize(scores.D);
  const influence = normalize(scores.I);
  const steadiness = normalize(scores.S);
  const conscientiousness = normalize(scores.C);

  // Determine primary type
  const allScores = [
    { type: "D", score: dominance },
    { type: "I", score: influence },
    { type: "S", score: steadiness },
    { type: "C", score: conscientiousness },
  ].sort((a, b) => b.score - a.score);

  const primary = allScores[0].type;
  const secondary = allScores[1].score >= allScores[0].score * 0.8 ? allScores[1].type : undefined;
  const primaryType = secondary ? `${primary}${secondary}` : primary;

  return {
    primaryType,
    dominance,
    influence,
    steadiness,
    conscientiousness,
    description: getDISCDescription(primaryType),
    traits: getDISCTraits(primaryType),
  };
}

function getDISCDescription(type: string): string {
  const descriptions: Record<string, string> = {
    D: "Dominant types are direct, forceful, and results-oriented.",
    I: "Influential types are people-oriented, outgoing, and enthusiastic.",
    S: "Steady types are calm, reliable, and supportive.",
    C: "Conscientious types are analytical, detail-oriented, and systematic.",
    DI: "Combines the drive of Dominance with the enthusiasm of Influence.",
    DS: "Combines leadership with reliability.",
    DC: "Combines drive with analysis.",
    IS: "People-oriented and steady team players.",
    IC: "Enthusiasm combined with precision.",
    SC: "Careful thinkers who value quality.",
  };
  return descriptions[type] || descriptions[type[0]] || "Unknown type";
}

function getDISCTraits(type: string): string[] {
  const traits: Record<string, string[]> = {
    D: ["Direct", "Decisive", "Problem-solver", "Risk-taker"],
    I: ["Outgoing", "Enthusiastic", "Persuasive", "Spontaneous"],
    S: ["Patient", "Reliable", "Supportive", "Steady"],
    C: ["Analytical", "Precise", "Private", "Logical"],
    DI: ["Active", "Fast-paced", "Persuasive", "Confident"],
    DS: ["Active", "Direct", "Supportive", "Steady"],
    DC: ["Active", "Strategic", "Analytical", "Precise"],
    IS: ["Inspiring", "Friendly", "Supportive", "Patient"],
    IC: ["Outgoing", "Precise", "Creative", "Analytical"],
    SC: ["Steady", "Precise", "Logical", "Supportive"],
  };
  return traits[type] || traits[type[0]] || [];
}

// ============================================================================
// WORK VALUES EVALUATION
// ============================================================================

export interface WorkValuesAnswer {
  questionId: string;
  answer: number; // 1-5 Likert scale
}

export interface WorkValuesResult {
  values: Record<string, number>;
  topValues: string[];
  description: string;
}

export function evaluateWorkValues(answers: WorkValuesAnswer[], questions: any[]): WorkValuesResult {
  const valueScores: Record<string, number> = {
    achievement: 0,
    independence: 0,
    recognition: 0,
    relationships: 0,
    support: 0,
    workingConditions: 0,
  };

  const valueCounts: Record<string, number> = {
    achievement: 0,
    independence: 0,
    recognition: 0,
    relationships: 0,
    support: 0,
    workingConditions: 0,
  };

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  answers.forEach((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) return;

    const value = question.questionData?.valueCategory;
    if (value && valueScores[value] !== undefined) {
      valueScores[value] += answer.answer;
      valueCounts[value]++;
    }
  });

  // Average the scores
  Object.keys(valueScores).forEach((key) => {
    if (valueCounts[key] > 0) {
      valueScores[key] = Math.round(valueScores[key] / valueCounts[key]);
    }
  });

  // Get top 3 values
  const sortedValues = Object.entries(valueScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key);

  return {
    values: valueScores,
    topValues: sortedValues,
    description: getWorkValuesDescription(sortedValues),
  };
}

function getWorkValuesDescription(topValues: string[]): string {
  const valueNames: Record<string, string> = {
    achievement: "Achievement",
    independence: "Independence",
    recognition: "Recognition",
    relationships: "Relationships",
    support: "Support",
    workingConditions: "Working Conditions",
  };

  const top = topValues.map((v) => valueNames[v]).join(", ");
  return `Your top work values are: ${top}`;
}

// ============================================================================
// LEARNING STYLES (VARK) EVALUATION
// ============================================================================

export interface LearningStylesAnswer {
  questionId: string;
  answer: number; // 1-5 Likert scale
}

export interface LearningStylesResult {
  visual: number;
  auditory: number;
  readWrite: number;
  kinesthetic: number;
  dominantStyle: string;
  secondaryStyle?: string;
  description: string;
}

export function evaluateLearningStyles(answers: LearningStylesAnswer[], questions: any[]): LearningStylesResult {
  const styleScores = { visual: 0, auditory: 0, read_write: 0, kinesthetic: 0 };
  const styleCounts = { visual: 0, auditory: 0, read_write: 0, kinesthetic: 0 };

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  answers.forEach((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) return;

    const style = question.questionData?.style;
    if (style && styleScores[style] !== undefined) {
      styleScores[style] += answer.answer;
      styleCounts[style]++;
    }
  });

  // Average the scores
  Object.keys(styleScores).forEach((key) => {
    if (styleCounts[key] > 0) {
      styleScores[key] = Math.round(styleScores[key] / styleCounts[key]);
    }
  });

  // Find dominant style
  const sortedStyles = Object.entries(styleScores)
    .sort(([, a], [, b]) => b - a);

  const dominantStyle = sortedStyles[0][0];
  const secondaryStyle = sortedStyles[1][1] >= sortedStyles[0][1] * 0.8 ? sortedStyles[1][0] : undefined;

  return {
    visual: styleScores.visual,
    auditory: styleScores.auditory,
    readWrite: styleScores.read_write,
    kinesthetic: styleScores.kinesthetic,
    dominantStyle,
    secondaryStyle,
    description: getLearningStyleDescription(dominantStyle, secondaryStyle),
  };
}

function getLearningStyleDescription(dominant: string, secondary?: string): string {
  const descriptions: Record<string, string> = {
    visual: "You learn best through visual aids, charts, diagrams, and written materials.",
    auditory: "You learn best through listening, verbal instructions, and discussions.",
    read_write: "You learn best by reading and taking notes.",
    kinesthetic: "You learn best through hands-on activities and practical experiences.",
  };

  let desc = descriptions[dominant] || "";
  if (secondary) {
    desc += ` You also have a strong preference for ${secondary} learning.`;
  }
  return desc;
}

// ============================================================================
// CAREER INTEREST EVALUATION
// ============================================================================

export interface CareerInterestAnswer {
  questionId: string;
  answer: number; // 1-5 Likert scale
}

export interface CareerInterestResult {
  categories: Record<string, number>;
  topCategories: string[];
  description: string;
  careerSuggestions: string[];
}

export function evaluateCareerInterest(answers: CareerInterestAnswer[], questions: any[]): CareerInterestResult {
  const categoryScores: Record<string, number> = {
    technology: 0,
    helping: 0,
    arts: 0,
    leadership: 0,
    analytical: 0,
    outdoors: 0,
  };

  const categoryCounts: Record<string, number> = {
    technology: 0,
    helping: 0,
    arts: 0,
    leadership: 0,
    analytical: 0,
    outdoors: 0,
  };

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  answers.forEach((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) return;

    const category = question.questionData?.category;
    if (category && categoryScores[category] !== undefined) {
      categoryScores[category] += answer.answer;
      categoryCounts[category]++;
    }
  });

  // Average the scores
  Object.keys(categoryScores).forEach((key) => {
    if (categoryCounts[key] > 0) {
      categoryScores[key] = Math.round(categoryScores[key] / categoryCounts[key]);
    }
  });

  // Get top categories
  const sortedCategories = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key);

  return {
    categories: categoryScores,
    topCategories: sortedCategories,
    description: getCareerInterestDescription(sortedCategories),
    careerSuggestions: getCareerSuggestions(sortedCategories),
  };
}

function getCareerInterestDescription(categories: string[]): string {
  const categoryNames: Record<string, string> = {
    technology: "Technology & Computers",
    helping: "Helping & Social Services",
    arts: "Arts & Creativity",
    leadership: "Leadership & Management",
    analytical: "Analytical & Data",
    outdoors: "Outdoor & Physical Work",
  };

  return `Your top career interests are: ${categories.map((c) => categoryNames[c]).join(", ")}`;
}

function getCareerSuggestions(categories: string[]): string[] {
  const suggestions: Record<string, string[]> = {
    technology: ["Software Developer", "Data Scientist", "IT Specialist", "Web Developer"],
    helping: ["Counselor", "Social Worker", "Teacher", "Healthcare Provider"],
    arts: ["Graphic Designer", "Writer", "Musician", "Artist"],
    leadership: ["Manager", "Entrepreneur", "Team Lead", "Executive"],
    analytical: ["Data Analyst", "Accountant", "Researcher", "Financial Analyst"],
    outdoors: ["Environmental Scientist", "Landscape Architect", "Farmer", "Park Ranger"],
  };

  const uniqueSuggestions = new Set<string>();
  categories.forEach((cat) => {
    const catSuggestions = suggestions[cat] || [];
    catSuggestions.forEach((s) => uniqueSuggestions.add(s));
  });

  return Array.from(uniqueSuggestions).slice(0, 10);
}

// ============================================================================
// APTITUDE EVALUATION
// ============================================================================

export interface AptitudeAnswer {
  questionId: string;
  answer: string; // Selected option
}

export interface AptitudeResult {
  score: number;
  total: number;
  percentage: number;
  verbalScore: number;
  numericalScore: number;
  spatialScore: number;
  description: string;
  strengths: string[];
}

export function evaluateAptitude(answers: AptitudeAnswer[], questions: any[]): AptitudeResult {
  let correct = 0;
  let verbal = 0;
  let verbalCount = 0;
  let numerical = 0;
  let numericalCount = 0;
  let spatial = 0;
  let spatialCount = 0;

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  answers.forEach((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) return;

    const isCorrect = answer.answer === question.options?.[0]; // First option is correct
    if (isCorrect) {
      correct++;

      const subtype = question.questionData?.subtype;
      if (subtype === "verbal") {
        verbal++;
        verbalCount++;
      } else if (subtype === "numerical") {
        numerical++;
        numericalCount++;
      } else if (subtype === "spatial") {
        spatial++;
        spatialCount++;
      }
    }
  });

  const total = questions.length;
  const percentage = Math.round((correct / total) * 100);

  return {
    score: correct,
    total,
    percentage,
    verbalScore: verbalCount > 0 ? Math.round((verbal / verbalCount) * 100) : 0,
    numericalScore: numericalCount > 0 ? Math.round((numerical / numericalCount) * 100) : 0,
    spatialScore: spatialCount > 0 ? Math.round((spatial / spatialCount) * 100) : 0,
    description: getAptitudeDescription(percentage),
    strengths: getAptitudeStrengths(verbal, numerical, spatial),
  };
}

function getAptitudeDescription(percentage: number): string {
  if (percentage >= 80) return "Excellent aptitude across multiple areas.";
  if (percentage >= 60) return "Good aptitude with strong potential.";
  if (percentage >= 40) return "Average aptitude with room for improvement.";
  return "Developing aptitude - consider focused skill building.";
}

function getAptitudeStrengths(verbal: number, numerical: number, spatial: number): string[] {
  const strengths: string[] = [];
  if (verbal >= 70) strengths.push("Verbal reasoning");
  if (numerical >= 70) strengths.push("Numerical ability");
  if (spatial >= 70) strengths.push("Spatial awareness");
  return strengths.length > 0 ? strengths : ["Balanced abilities"];
}

// ============================================================================
// CORE SKILLS EVALUATION
// ============================================================================

export interface SkillAnswer {
  questionId: string;
  answer: number; // 1-5 Likert scale
}

export interface SkillResult {
  skills: Record<string, number>;
  topSkills: string[];
  overallScore: number;
  description: string;
  recommendations: string[];
}

export function evaluateCoreSkills(answers: SkillAnswer[], questions: any[]): SkillResult {
  const skillScores: Record<string, number> = {
    communication: 0,
    problem_solving: 0,
    teamwork: 0,
    critical_thinking: 0,
    time_management: 0,
  };

  const skillCounts: Record<string, number> = {
    communication: 0,
    problem_solving: 0,
    teamwork: 0,
    critical_thinking: 0,
    time_management: 0,
  };

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  answers.forEach((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) return;

    const skill = question.questionData?.skill;
    if (skill && skillScores[skill] !== undefined) {
      skillScores[skill] += answer.answer;
      skillCounts[skill]++;
    }
  });

  // Average the scores
  Object.keys(skillScores).forEach((key) => {
    if (skillCounts[key] > 0) {
      skillScores[key] = Math.round(skillScores[key] / skillCounts[key]);
    }
  });

  const allScores = Object.values(skillScores);
  const overallScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  // Get top skills
  const sortedSkills = Object.entries(skillScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key);

  return {
    skills: skillScores,
    topSkills: sortedSkills,
    overallScore,
    description: getSkillDescription(overallScore),
    recommendations: getSkillRecommendations(skillScores),
  };
}

function getSkillDescription(score: number): string {
  if (score >= 4) return "Strong core skills demonstrated.";
  if (score >= 3) return "Good core skills with areas for growth.";
  if (score >= 2) return "Developing core skills - focus on improvement areas.";
  return "Core skills need significant development.";
}

function getSkillRecommendations(scores: Record<string, number>): string[] {
  const recommendations: string[] = [];

  if (scores.communication < 3) {
    recommendations.push("Practice public speaking or join a debate club");
  }
  if (scores.problem_solving < 3) {
    recommendations.push("Try puzzles, logic games, or coding exercises");
  }
  if (scores.teamwork < 3) {
    recommendations.push("Join group activities or team sports");
  }
  if (scores.critical_thinking < 3) {
    recommendations.push("Practice analyzing news articles or case studies");
  }
  if (scores.time_management < 3) {
    recommendations.push("Use planners and time-blocking techniques");
  }

  if (recommendations.length === 0) {
    recommendations.push("Continue developing your strong skill set!");
  }

  return recommendations;
}
