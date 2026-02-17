import type { DISCResult, DISCQuestion } from "./types";

/**
 * DISC Assessment Calculation
 *
 * DISC is a behavior assessment tool based on the DISC theory of psychologist
 * William Moulton Marston, which centers on four different personality traits:
 *
 * D - Dominance: Active, forceful, direct
 * I - Influence: Active, enthusiastic, communicative
 * S - Steadiness: Stable, sincere, calm
 * C - Conscientiousness: Private, analytical, logical
 */

export interface DISCInput {
  [questionId: string]: {
    most: number; // 1-4 rating for "Most like me"
    least: number; // 1-4 rating for "Least like me"
  };
}

/**
 * Calculate DISC type from assessment answers
 */
export function calculateDISC(
  answers: DISCInput,
  questions: DISCQuestion[]
): DISCResult {
  // Initialize scores for each dimension
  const scores = {
    D: 0,
    I: 0,
    S: 0,
    C: 0,
  };

  // Count responses per dimension
  const counts = {
    D: 0,
    I: 0,
    S: 0,
    C: 0,
  };

  // Calculate scores
  questions.forEach((question) => {
    const answer = answers[question.id];
    if (answer) {
      // Add "most" response (positive weight)
      scores[question.dimension] += answer.most;
      counts[question.dimension]++;

      // Subtract "least" response (negative weight for things you're NOT like)
      scores[question.dimension] -= answer.least;
    }
  });

  // Normalize to 0-100 scale
  const maxPossible = Math.max(...Object.values(counts)) * 4; // Max score per question is 4
  const dominance = Math.round(Math.max(0, (scores.D / maxPossible) * 100));
  const influence = Math.round(Math.max(0, (scores.I / maxPossible) * 100));
  const steadiness = Math.round(Math.max(0, (scores.S / maxPossible) * 100));
  const conscientiousness = Math.round(Math.max(0, (scores.C / maxPossible) * 100));

  // Determine primary type (top 1-2 dimensions)
  const allScores = [
    { type: "D", score: dominance },
    { type: "I", score: influence },
    { type: "S", score: steadiness },
    { type: "C", score: conscientiousness },
  ].sort((a, b) => b.score - a.score);

  const primary = allScores[0].type;
  const secondary = allScores[1].score >= allScores[0].score * 0.8 ? allScores[1].type : undefined;
  const primaryType = secondary ? `${primary}${secondary}` : primary;

  return getDISCProfile(primaryType, dominance, influence, steadiness, conscientiousness);
}

/**
 * Get detailed DISC profile
 */
function getDISCProfile(
  primaryType: string,
  dominance: number,
  influence: number,
  steadiness: number,
  conscientiousness: number
): DISCResult {
  const profiles: Record<
    string,
    Omit<DISCResult, "dominance" | "influence" | "steadiness" | "conscientiousness">
  > = {
    D: {
      primaryType: "D",
      traits: ["Direct", "Decisive", "Problem-solver", "Risk-taker"],
      description: "Dominant types are direct, forceful, and results-oriented. They prefer to lead and be in control.",
      strengths: ["Natural leader", "Quick decision maker", "Goal-oriented", "Confident"],
      weaknesses: ["Can be impatient", "May overlook details", "Can seem aggressive", "Dislikes routine"],
      careerSuggestions: [
        "CEO",
        "Entrepreneur",
        "Sales Director",
        "Military Officer",
        "Surgeon",
        "Lawyer",
        "Police Officer",
        "Project Manager",
      ],
    },
    I: {
      primaryType: "I",
      traits: ["Outgoing", "Enthusiastic", "Persuasive", "Spontaneous"],
      description: "Influential types are people-oriented, outgoing, and enthusiastic. They love to socialize and inspire others.",
      strengths: ["Charismatic", "Optimistic", "Great communicator", "Persuasive"],
      weaknesses: ["Can be impulsive", "May lack focus", "Dislikes details", "Can be disorganized"],
      careerSuggestions: [
        "Sales Representative",
        "Marketing Manager",
        "Public Relations",
        "Event Planner",
        "TV/Radio Host",
        "Journalist",
        "Social Media Manager",
        "Teacher",
      ],
    },
    S: {
      primaryType: "S",
      traits: ["Patient", "Reliable", "Supportive", "Steady"],
      description: "Steady types are calm, reliable, and supportive. They value stability and enjoy helping others.",
      strengths: ["Dependable", "Good listener", "Patient", "Team player"],
      weaknesses: ["Resists change", "Avoids conflict", "Can be indecisive", "May be passive"],
      careerSuggestions: [
        "Counselor",
        "Social Worker",
        "Nurse",
        "Teacher",
        "HR Specialist",
        "Customer Service",
        "Administrator",
        "Therapist",
      ],
    },
    C: {
      primaryType: "C",
      traits: ["Analytical", "Precise", "Private", "Logical"],
      description: "Conscientious types are analytical, detail-oriented, and systematic. They value accuracy and quality.",
      strengths: ["Analytical", "Detail-oriented", "Quality-focused", "Systematic"],
      weaknesses: ["Can be perfectionist", "May overanalyze", "Dislikes criticism", "Can seem detached"],
      careerSuggestions: [
        "Accountant",
        "Data Analyst",
        "Software Engineer",
        "Scientist",
        "Quality Assurance",
        "Researcher",
        "Financial Analyst",
        "Editor",
      ],
    },
    DI: {
      primaryType: "DI",
      traits: ["Active", "Fast-paced", "Persuasive", "Confident"],
      description: "DI types combine the drive of Dominance with the enthusiasm of Influence. They're dynamic leaders who inspire others.",
      strengths: ["Visionary", "Charismatic", "Action-oriented", "Inspiring"],
      weaknesses: ["Can be overwhelming", "Impatient", "May overlook details", "Can be manipulative"],
      careerSuggestions: [
        "Entrepreneur",
        "Sales Director",
        "Marketing VP",
        "Politician",
        "Startup Founder",
        "Business Consultant",
      ],
    },
    DS: {
      primaryType: "DS",
      traits: ["Active", "Direct", "Supportive", "Steady"],
      description: "DS types combine leadership with reliability. They're determined but also care about their team.",
      strengths: ["Decisive yet supportive", "Goal-oriented", "Patient leader", "Reliable"],
      weaknesses: ["Can be contradictory", "May internalize stress", "Struggles with delegation", "Perfectionist"],
      careerSuggestions: [
        "Manager",
        "Team Lead",
        "Principal",
        "Doctor",
        "Military Officer",
        "Operations Manager",
      ],
    },
    DC: {
      primaryType: "DC",
      traits: ["Active", "Strategic", "Analytical", "Precise"],
      description: "DC types combine drive with analysis. They're results-oriented but also detail-focused.",
      strengths: ["Strategic thinker", "Quality-focused", "Efficient", "Results-driven"],
      weaknesses: ["Can be critical", "May be stubborn", "Overworks", "Can seem cold"],
      careerSuggestions: [
        "CEO",
        "Consultant",
        "Engineer",
        "Lawyer",
        "Surgeon",
        "Investment Banker",
        "Scientist",
      ],
    },
    IS: {
      primaryType: "IS",
      traits: ["Inspiring", "Friendly", "Supportive", "Patient"],
      description: "IS types are people-oriented and steady. They're great team players who bring out the best in others.",
      strengths: ["Warm", "Trusting", "Patient", "Good mediator"],
      weaknesses: ["Avoids conflict", "Can be too trusting", "Procrastinates", "Overly sensitive"],
      careerSuggestions: [
        "Teacher",
        "Counselor",
        "Social Worker",
        "HR Manager",
        "Trainer",
        "Team Coordinator",
      ],
    },
    IC: {
      primaryType: "IC",
      traits: ["Outgoing", "Precise", "Creative", "Analytical"],
      description: "IC types combine enthusiasm with precision. They're creative thinkers who also value accuracy.",
      strengths: ["Creative", "Articulate", "Detail-oriented", "Persuasive"],
      weaknesses: ["Can be perfectionist", "May overthink", "Sensitive to criticism", "Can be inconsistent"],
      careerSuggestions: [
        "Marketing Analyst",
        "Creative Director",
        "Researcher",
        "Journalist",
        "Designer",
        "Communications Director",
      ],
    },
    SC: {
      primaryType: "SC",
      traits: ["Steady", "Precise", "Logical", "Supportive"],
      description: "SC types combine stability with analysis. They're careful thinkers who value quality and consistency.",
      strengths: ["Reliable", "Accurate", "Patient", "Quality-focused"],
      weaknesses: ["Slow to decide", "Fearful of change", "Overcautious", "Can be passive"],
      careerSuggestions: [
        "Accountant",
        "Data Analyst",
        "Quality Assurance",
        "Researcher",
        "Administrator",
        "Financial Planner",
      ],
    },
  };

  const profile =
    profiles[primaryType] || profiles[primaryType[0] as keyof typeof profiles] || profiles.D;

  const DISCPrimaryTypes = ["D", "I", "S", "C", "DI", "DS", "DC", "IS", "IC", "SC"] as const;
  type DISCPrimaryType = typeof DISCPrimaryTypes[number];

  return {
    primaryType: (primaryType as string) as DISCPrimaryType,
    dominance,
    influence,
    steadiness,
    conscientiousness,
    ...profile,
  };
}

/**
 * Get DISC questions
 */
export function getDISCQuestions(): DISCQuestion[] {
  return [
    {
      id: "disc_001",
      text: "In your approach to work",
      most: "Getting immediate results",
      least: "Ensuring accuracy",
      dimension: "D",
    },
    {
      id: "disc_002",
      text: "When dealing with others",
      most: "Being direct and firm",
      least: "Being supportive and understanding",
      dimension: "D",
    },
    {
      id: "disc_003",
      text: "In group situations",
      most: "Taking the lead",
      least: "Following along",
      dimension: "D",
    },
    {
      id: "disc_004",
      text: "When facing challenges",
      most: "Confronting them head-on",
      least: "Planning carefully",
      dimension: "D",
    },
    {
      id: "disc_005",
      text: "In social situations",
      most: "Meeting new people",
      least: "Spending quiet time",
      dimension: "I",
    },
    {
      id: "disc_006",
      text: "When communicating",
      most: "Being enthusiastic",
      least: "Being factual",
      dimension: "I",
    },
    {
      id: "disc_007",
      text: "When working with others",
      most: "Inspiring and motivating",
      least: "Analyzing problems",
      dimension: "I",
    },
    {
      id: "disc_008",
      text: "In presentations",
      most: "Being energetic and dynamic",
      least: "Being detailed and precise",
      dimension: "I",
    },
    {
      id: "disc_009",
      text: "When things change",
      most: "Adapting slowly",
      least: "Embracing change",
      dimension: "S",
    },
    {
      id: "disc_010",
      text: "In team settings",
      most: "Supporting the team",
      least: "Leading the team",
      dimension: "S",
    },
    {
      id: "disc_011",
      text: "When making decisions",
      most: "Considering others' feelings",
      least: "Being logical and objective",
      dimension: "S",
    },
    {
      id: "disc_012",
      text: "With your work style",
      most: "Preferring stability",
      least: "Seeking variety",
      dimension: "S",
    },
    {
      id: "disc_013",
      text: "When solving problems",
      most: "Following established procedures",
      least: "Trying new approaches",
      dimension: "C",
    },
    {
      id: "disc_014",
      text: "In your approach to quality",
      most: "Ensuring accuracy",
      least: "Acting quickly",
      dimension: "C",
    },
    {
      id: "disc_015",
      text: "When receiving feedback",
      most: "Analyzing the details",
      least: "Responding emotionally",
      dimension: "C",
    },
    {
      id: "disc_016",
      text: "With planning",
      most: "Creating detailed plans",
      least: "Acting spontaneously",
      dimension: "C",
    },
  ];
}
