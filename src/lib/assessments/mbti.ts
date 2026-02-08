import type { MBTIResult, MBTIQuestion } from "./types";

/**
 * MBTI (Myers-Briggs Type Indicator) Calculation
 *
 * The MBTI assesses personality across 4 dichotomies:
 * - Extraversion (E) vs Introversion (I)
 * - Sensing (S) vs Intuition (N)
 * - Thinking (T) vs Feeling (F)
 * - Judging (J) vs Perceiving (P)
 *
 * Each person has a preference on each dichotomy, resulting in 16 possible types.
 */

export interface MBTIInput {
  [questionId: string]: number; // Answer: 1 (Strongly disagree) to 5 (Strongly agree)
}

/**
 * Calculate MBTI type from assessment answers
 */
export function calculateMBTI(
  answers: MBTIInput,
  questions: MBTIQuestion[]
): MBTIResult {
  // Initialize scores for each dimension
  const dimensionScores = {
    EI: 0, // Positive = E, Negative = I
    SN: 0, // Positive = S, Negative = N
    TF: 0, // Positive = T, Negative = F
    JP: 0, // Positive = J, Negative = P
  };

  // Count questions per dimension
  const dimensionCounts = {
    EI: 0,
    SN: 0,
    TF: 0,
    JP: 0,
  };

  // Calculate raw scores
  questions.forEach((question) => {
    const answer = answers[question.id];
    if (answer !== undefined) {
      const adjustedAnswer = (answer - 3) * question.direction; // Convert 1-5 to -2 to +2, then apply direction
      dimensionScores[question.dimension] += adjustedAnswer;
      dimensionCounts[question.dimension]++;
    }
  });

  // Normalize to -100 to +100 scale
  const eiScore = normalizeScore(dimensionScores.EI, dimensionCounts.EI);
  const snScore = normalizeScore(dimensionScores.SN, dimensionCounts.SN);
  const tfScore = normalizeScore(dimensionScores.TF, dimensionCounts.TF);
  const jpScore = normalizeScore(dimensionScores.JP, dimensionCounts.JP);

  // Determine 4-letter type
  const type = `${eiScore >= 0 ? "E" : "I"}${snScore >= 0 ? "S" : "N"}${tfScore >= 0 ? "T" : "F"}${jpScore >= 0 ? "J" : "P"}`;

  return getMBTIProfile(type, eiScore, snScore, tfScore, jpScore);
}

/**
 * Normalize raw score to -100 to +100 scale
 */
function normalizeScore(rawScore: number, count: number): number {
  if (count === 0) return 0;
  const maxPossible = count * 2; // Each question max contribution is 2
  return Math.round((rawScore / maxPossible) * 100);
}

/**
 * Get detailed MBTI profile
 */
function getMBTIProfile(
  type: string,
  eiScore: number,
  snScore: number,
  tfScore: number,
  jpScore: number
): MBTIResult {
  const profiles: Record<string, Omit<MBTIResult, "eiScore" | "snScore" | "tfScore" | "jpScore">> = {
    ISTJ: {
      description: "The Inspector: Practical, fact-minded, and reliable.",
      traits: ["Responsible", "Detail-oriented", "Loyal", "Organized"],
      strengths: ["Honest and direct", "Dedicated", "Patient", "Very organized"],
      weaknesses: ["Stubborn", "Insensitive", "Judgmental", "Resists change"],
      careerSuggestions: [
        "Accountant",
        "Auditor",
        "Data Analyst",
        "Doctor",
        "Dentist",
        "Lawyer",
        "Police Officer",
        "Military Officer",
      ],
    },
    ISFJ: {
      description: "The Protector: Dedicated and warm protectors, always ready to defend loved ones.",
      traits: ["Supportive", "Patient", "Reliable", "Warm"],
      strengths: ["Supportive", "Reliable", "Patient", "Imaginative"],
      weaknesses: ["Humble", "Altruistic", "Represses feelings", "Overload themselves"],
      careerSuggestions: [
        "Social Worker",
        "Counselor",
        "Teacher",
        "Nurse",
        "Administrator",
        "Office Manager",
        "Paralegal",
      ],
    },
    INFJ: {
      description: "The Counselor: Quiet and mystical, yet very inspiring and tireless idealists.",
      traits: ["Insightful", "Principled", "Compassionate", "Altruistic"],
      strengths: ["Creative", "Insightful", "Principled", "Altruistic"],
      weaknesses: ["Sensitive", "Extremely private", "Perfectionist", "Burnout prone"],
      careerSuggestions: [
        "Counselor",
        "Psychologist",
        "Writer",
        "HR Specialist",
        "Librarian",
        "Artist",
        "Editor",
        "Non-profit Director",
      ],
    },
    INTJ: {
      description: "The Mastermind: Imaginative and strategic thinkers, with a plan for everything.",
      traits: ["Strategic", "Analytical", "Independent", "Determined"],
      strengths: ["Hard-working", "Open-minded", "Strategic", "Rational"],
      weaknesses: ["Arrogant", "Judgmental", "Overly analytical", "Dislikes rules"],
      careerSuggestions: [
        "Software Architect",
        "Scientist",
        "Engineer",
        "Strategist",
        "Systems Analyst",
        "University Professor",
        "Judge",
      ],
    },
    ISTP: {
      description: "The Craftsman: Bold and practical experimenters, masters of all kinds of tools.",
      traits: ["Practical", "Observant", "Analytical", "Flexible"],
      strengths: ["Optimistic", "Creative", "Practical", "Spontaneous"],
      weaknesses: ["Private", "Insensitive", "Easily bored", "Risky behavior"],
      careerSuggestions: [
        "Mechanic",
        "Engineer",
        "Forensic Scientist",
        "Pilot",
        "Driver",
        "Chef",
        "Technician",
        "Data Analyst",
      ],
    },
    ISFP: {
      description: "The Composer: Flexible and charming artists, always ready to explore something new.",
      traits: ["Gentle", "Sensitive", "Kind", "Artistic"],
      strengths: ["Charming", "Sensitive", "Imaginative", "Passionate"],
      weaknesses: ["Too sensitive", "Indecisive", "Easily bored", "Unpredictable"],
      careerSuggestions: [
        "Artist",
        "Designer",
        "Musician",
        "Photographer",
        "Fashion Designer",
        "Interior Designer",
        "Veterinarian",
        "Landscape Architect",
      ],
    },
    INFP: {
      description: "The Healer: Poetic, kind and altruistic, always eager to help a good cause.",
      traits: ["Idealistic", "Loyal", "Creative", "Curious"],
      strengths: ["Creative", "Dedicated", "Generous", "Open-minded"],
      weaknesses: ["Too idealistic", "Difficult to get to know", "Impractical", "Self-critical"],
      careerSuggestions: [
        "Writer",
        "Artist",
        "Counselor",
        "Psychologist",
        "Social Worker",
        "Editor",
        "HR Specialist",
        "Graphic Designer",
      ],
    },
    INTP: {
      description: "The Architect: Innovative inventors with an unquenchable thirst for knowledge.",
      traits: ["Logical", "Abstract", "Independent", "Analytical"],
      strengths: ["Analytical", "Original", "Open-minded", "Honest"],
      weaknesses: ["Insensitive", "Absent-minded", "Dissatisfied", "Second-guesses themselves"],
      careerSuggestions: [
        "Software Developer",
        "Scientist",
        "Researcher",
        "Professor",
        "Data Analyst",
        "Mathematician",
        "Systems Analyst",
        "Technical Writer",
      ],
    },
    ESTP: {
      description: "The Promoter: Smart, energetic and very perceptive people, who truly enjoy living on the edge.",
      traits: ["Energetic", "Perceptive", "Spontaneous", "Practical"],
      strengths: ["Bold", "Rational", "Original", "Perceptive"],
      weaknesses: ["Insensitive", "Impatient", "Risk-prone", "Unstructured"],
      careerSuggestions: [
        "Entrepreneur",
        "Sales Representative",
        "Police Officer",
        "Firefighter",
        "Paramedic",
        "Athlete",
        "Coach",
        "Tour Guide",
      ],
    },
    ESFP: {
      description: "The Performer: Spontaneous, energetic and enthusiastic people - life is never boring around them.",
      traits: ["Enthusiastic", "Friendly", "Spontaneous", "Practical"],
      strengths: ["Bold", "Original", "Aesthetics", "People skills"],
      weaknesses: ["Sensitive", "Conflict-averse", "Easily bored", "Poor long-term planning"],
      careerSuggestions: [
        "Actor",
        "Sales Representative",
        "Fashion Designer",
        "Event Planner",
        "Public Relations",
        "Tour Guide",
        "Recreation Worker",
        "Retail Manager",
      ],
    },
    ENFP: {
      description: "The Champion: Enthusiastic, creative and sociable free spirits, who can always find a reason to smile.",
      traits: ["Enthusiastic", "Creative", "Sociable", "Communicative"],
      strengths: ["Curious", "Observant", "Energetic", "Excellent communicators"],
      weaknesses: ["Poor practical skills", "Stressful", "Overthink", "Independent"],
      careerSuggestions: [
        "Journalist",
        "Creative Director",
        "Politician",
        "Teacher",
        "Public Relations",
        "Social Worker",
        "Event Planner",
        "Marketing Manager",
      ],
    },
    ENTP: {
      description: "The Debater: Smart and curious thinkers who cannot resist an intellectual challenge.",
      traits: ["Innovative", "Curious", "Versatile", "Energetic"],
      strengths: ["Knowledgeable", "Quick thinker", "Original", "Excellent brainstormer"],
      weaknesses: ["Argumentative", "Insensitive", "Intolerant", "Impatient"],
      careerSuggestions: [
        "Entrepreneur",
        "Lawyer",
        "Marketing Director",
        "Investment Banker",
        "Political Consultant",
        "Management Consultant",
        "Software Developer",
        "Journalist",
      ],
    },
    ESTJ: {
      description: "The Supervisor: Excellent administrators, unsurpassed at managing things or people.",
      traits: ["Organized", "Dedicated", "Practical", "Traditional"],
      strengths: ["Dedicated", "Strong-willed", "Direct", "Honest"],
      weaknesses: ["Stubborn", "Insensitive", "Uncomfortable with change", "Judgmental"],
      careerSuggestions: [
        "Executive",
        "Military Officer",
        "Police Officer",
        "Judge",
        "Teacher",
        "Sales Manager",
        "Administrator",
        "Accountant",
      ],
    },
    ESFJ: {
      description: "The Provider: Very dedicated, warm and protective, always eager to help.",
      traits: ["Warm", "Loyal", "Helpful", "Organized"],
      strengths: ["Strong practical skills", "Strong sense of duty", "Loyal", "Sensitive"],
      weaknesses: ["Worried about status", "Inflexible", "Reluctant to innovate", "Vulnerable to criticism"],
      careerSuggestions: [
        "Teacher",
        "Social Worker",
        "Nurse",
        "Administrative Assistant",
        "Counselor",
        "Office Manager",
        "Public Relations",
        "Event Coordinator",
      ],
    },
    ENFJ: {
      description: "The Teacher: Charismatic and inspiring leaders, able to mesmerize their listeners.",
      traits: ["Charismatic", "Inspiring", "Altruistic", "Natural leaders"],
      strengths: ["Tolerant", "Reliable", "Charismatic", "Altruistic"],
      weaknesses: ["Too altruistic", "Too sensitive", "Fluctuating self-esteem", "Stubborn"],
      careerSuggestions: [
        "Teacher",
        "HR Manager",
        "Public Relations",
        "Political Leader",
        "Counselor",
        "Social Worker",
        "Training Manager",
        "Non-profit Director",
      ],
    },
    ENTJ: {
      description: "The Commander: Bold, imaginative and strong-willed leaders, always finding a way.",
      traits: ["Bold", "Strategic", "Confident", "Organized"],
      strengths: ["Efficient", "Energetic", "Confident", "Strong-willed"],
      weaknesses: ["Intolerant", "Impatient", "Arrogant", "Poor handling of emotions"],
      careerSuggestions: [
        "CEO",
        "Management Consultant",
        "Lawyer",
        "Sales Director",
        "Political Leader",
        "University Administrator",
        "Judge",
        "Entrepreneur",
      ],
    },
  };

  const profile = profiles[type] || profiles["ISTJ"];

  return {
    type: type as any,
    eiScore,
    snScore,
    tfScore,
    jpScore,
    ...profile,
  };
}

/**
 * Get MBTI questions
 */
export function getMBTIQuestions(): MBTIQuestion[] {
  return [
    // E vs I questions
    { id: "mbti_001", text: "You enjoy social gatherings and parties", dimension: "EI", direction: 1 },
    { id: "mbti_002", text: "You prefer spending time alone rather than with others", dimension: "EI", direction: -1 },
    { id: "mbti_003", text: "You feel energized after being around people", dimension: "EI", direction: 1 },
    { id: "mbti_004", text: "You prefer one-on-one conversations over group discussions", dimension: "EI", direction: -1 },

    // S vs N questions
    { id: "mbti_005", text: "You focus on present realities rather than future possibilities", dimension: "SN", direction: 1 },
    { id: "mbti_006", text: "You enjoy thinking about abstract concepts and ideas", dimension: "SN", direction: -1 },
    { id: "mbti_007", text: "You prefer practical solutions over theoretical ones", dimension: "SN", direction: 1 },
    { id: "mbti_008", text: "You often notice patterns that others miss", dimension: "SN", direction: -1 },

    // T vs F questions
    { id: "mbti_009", text: "You make decisions based on logic rather than feelings", dimension: "TF", direction: 1 },
    { id: "mbti_010", text: "You consider people's feelings when making decisions", dimension: "TF", direction: -1 },
    { id: "mbti_011", text: "You value justice over mercy", dimension: "TF", direction: 1 },
    { id: "mbti_012", text: "You are easily affected by other people's emotions", dimension: "TF", direction: -1 },

    // J vs P questions
    { id: "mbti_013", text: "You prefer to have things decided and settled", dimension: "JP", direction: 1 },
    { id: "mbti_014", text: "You like to keep your options open", dimension: "JP", direction: -1 },
    { id: "mbti_015", text: "You enjoy making to-do lists and following schedules", dimension: "JP", direction: 1 },
    { id: "mbti_016", text: "You prefer spontaneous activities over planned ones", dimension: "JP", direction: -1 },
  ];
}
