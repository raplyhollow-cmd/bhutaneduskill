import type { WorkValuesResult, WorkValueKey } from "./types";
import { WORK_VALUES } from "./types";

/**
 * Work Values Inventory Calculation
 *
 * The Work Values Inventory helps identify what matters most to you in a job.
 * Understanding your work values is essential for career satisfaction.
 */

export interface WorkValuesInput {
  [questionId: string]: number; // 1 (Not important) to 5 (Very important)
}

/**
 * Calculate work values from assessment answers
 */
export function calculateWorkValues(
  answers: WorkValuesInput,
  questions: Array<{ id: string; value: WorkValueKey }>
): WorkValuesResult {
  // Initialize scores for each value
  const rawScores: Record<WorkValueKey, number[]> = {
    achievement: [],
    independence: [],
    recognition: [],
    relationships: [],
    support: [],
    workingConditions: [],
  };

  // Collect scores by value
  questions.forEach((question) => {
    const answer = answers[question.id];
    if (answer !== undefined) {
      rawScores[question.value].push(answer);
    }
  });

  // Calculate average for each value
  const values: Record<WorkValueKey, number> = {
    achievement: average(rawScores.achievement),
    independence: average(rawScores.independence),
    recognition: average(rawScores.recognition),
    relationships: average(rawScores.relationships),
    support: average(rawScores.support),
    workingConditions: average(rawScores.workingConditions),
  };

  // Find top 3 values
  const sortedValues = (Object.entries(values) as [WorkValueKey, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key);

  return {
    values,
    topValues: sortedValues,
    description: getWorkValuesDescription(sortedValues),
    careerSuggestions: getCareerSuggestions(sortedValues),
  };
}

/**
 * Calculate average of array
 */
function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 20); // Convert to 0-100 scale
}

/**
 * Get description based on top work values
 */
function getWorkValuesDescription(topValues: WorkValueKey[]): string {
  const descriptions: Record<WorkValueKey, string> = {
    achievement: "You seek opportunities to use your abilities and feel a sense of accomplishment",
    independence: "You value autonomy and prefer to work with minimal supervision",
    recognition: "You appreciate public acknowledgment and credit for your work",
    relationships: "You prioritize working with people you enjoy and respect",
    support: " You look for supportive management and a positive work environment",
    workingConditions: "You value good pay, job security, and comfortable surroundings",
  };

  return topValues.map((v) => descriptions[v]).join(". ");
}

/**
 * Get career suggestions based on work values
 */
function getCareerSuggestions(topValues: WorkValueKey[]): string[] {
  const careerMap: Record<WorkValueKey, string[]> = {
    achievement: [
      "Entrepreneur",
      "Sales Manager",
      "Surgeon",
      "Architect",
      "Software Developer",
      "Research Scientist",
      "CEO",
      "Consultant",
    ],
    independence: [
      "Freelance Writer",
      "Consultant",
      "Real Estate Agent",
      "Financial Advisor",
      "Software Developer",
      "Artist",
      "Private Practice Professional",
    ],
    recognition: [
      "Actor/Performer",
      "Politician",
      "Sales Representative",
      "Marketing Manager",
      "Influencer",
      "Broadcast Journalist",
      "Coach",
    ],
    relationships: [
      "Teacher",
      "Counselor",
      "Social Worker",
      "Human Resources",
      "Nurse",
      "Team Leader",
      "Event Planner",
      "Therapist",
    ],
    support: [
      "Teacher",
      "Non-profit Worker",
      "Government Employee",
      "Education Administrator",
      "Counselor",
      "Human Resources",
      "Social Worker",
    ],
    workingConditions: [
      "Corporate Executive",
      "Government Official",
      "University Professor",
      "Doctor",
      "Lawyer",
      "IT Manager",
      "Engineer",
    ],
  };

  // Combine unique suggestions from top values
  const suggestions = new Set<string>();
  topValues.forEach((value) => {
    careerMap[value]?.forEach((career) => suggestions.add(career));
  });

  return Array.from(suggestions).slice(0, 8);
}

/**
 * Get work values questions
 */
export function getWorkValuesQuestions(): Array<{ id: string; text: string; value: WorkValueKey }> {
  return [
    // Achievement
    { id: "wv_001", text: "Having a feeling of accomplishment", value: "achievement" },
    { id: "wv_002", text: "Using my abilities to the fullest", value: "achievement" },
    { id: "wv_003", text: "Seeing the results of my work", value: "achievement" },

    // Independence
    { id: "wv_004", text: "Being able to work without close supervision", value: "independence" },
    { id: "wv_005", text: "Having freedom to make my own decisions", value: "independence" },
    { id: "wv_006", text: "Setting my own pace and schedule", value: "independence" },

    // Recognition
    { id: "wv_007", text: "Receiving public recognition for my work", value: "recognition" },
    { id: "wv_008", text: "Getting credit when credit is due", value: "recognition" },
    { id: "wv_009", text: "Being appreciated by others", value: "recognition" },

    // Relationships
    { id: "wv_010", text: "Working with people I enjoy", value: "relationships" },
    { id: "wv_011", text: "Being part of a team", value: "relationships" },
    { id: "wv_012", text: "Having friendly coworkers", value: "relationships" },

    // Support
    { id: "wv_013", text: "Having supportive management", value: "support" },
    { id: "wv_014", text: "Working in a positive environment", value: "support" },
    { id: "wv_015", text: "Having access to training and development", value: "support" },

    // Working Conditions
    { id: "wv_016", text: "Having good pay and benefits", value: "workingConditions" },
    { id: "wv_017", text: "Job security and stability", value: "workingConditions" },
    { id: "wv_018", text: "Comfortable and safe work environment", value: "workingConditions" },
  ];
}
