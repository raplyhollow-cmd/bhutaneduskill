// Assessment Types
export type AssessmentCategory =
  | "personality"
  | "interest"
  | "ability"
  | "values"
  | "learning_style"
  | "career_readiness";

export type TargetAudience =
  | "student"
  | "professional"
  | "parent"
  | "teacher";

export type TargetGrade =
  | "grade-8"
  | "grade-9-10"
  | "grade-11-12"
  | "graduate"
  | "all";

export type AssessmentStatus = "pending" | "in_progress" | "completed" | "abandoned";

// Base Question Types
export interface BaseQuestion {
  id: string;
  text: string;
  category?: string;
  order: number;
}

export interface LikertQuestion extends BaseQuestion {
  type: "likert";
  scale: 5 | 7;
  options: Array<{ value: number; label: string }>;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice";
  options: Array<{ value: string; label: string }>;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: "true_false";
}

export type Question = LikertQuestion | MultipleChoiceQuestion | TrueFalseQuestion;

// MBTI Types
export type MBTIPreference = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";
export type MBTIType = `${MBTIPreference}${MBTIPreference}${MBTIPreference}${MBTIPreference}`;

export interface MBTIQuestion {
  id: string;
  text: string;
  dimension: "EI" | "SN" | "TF" | "JP";
  direction: 1 | -1; // 1 for first option, -1 for second option
}

export interface MBTIResult {
  type: MBTIType;
  eiScore: number; // -100 (I) to 100 (E)
  snScore: number; // -100 (N) to 100 (S)
  tfScore: number; // -100 (F) to 100 (T)
  jpScore: number; // -100 (P) to 100 (J)
  traits: string[];
  description: string;
  strengths: string[];
  weaknesses: string[];
  careerSuggestions: string[];
}

// DISC Types
export type DISCType = "D" | "I" | "S" | "C" | "DI" | "DS" | "DC" | "IS" | "IC" | "SC";

export interface DISCQuestion {
  id: string;
  text: string;
  most: string; // Most like you
  least: string; // Least like you
  dimension: "D" | "I" | "S" | "C";
}

export interface DISCResult {
  primaryType: DISCType;
  dominance: number; // 0-100
  influence: number; // 0-100
  steadiness: number; // 0-100
  conscientiousness: number; // 0-100
  traits: string[];
  description: string;
  strengths: string[];
  weaknesses: string[];
  careerSuggestions: string[];
}

// Work Values Types
export interface WorkValue {
  id: string;
  name: string;
  description: string;
}

export const WORK_VALUES = {
  achievement: {
    id: "achievement",
    name: "Achievement",
    description: "Using your abilities to accomplish meaningful goals",
  },
  independence: {
    id: "independence",
    name: "Independence",
    description: "Being able to work without close supervision",
  },
  recognition: {
    id: "recognition",
    name: "Recognition",
    description: "Receiving appreciation for your work",
  },
  relationships: {
    id: "relationships",
    name: "Relationships",
    description: "Working with people you enjoy and respect",
  },
  support: {
    id: "support",
    name: "Support",
    description: "Having management that supports employees",
  },
  workingConditions: {
    id: "workingConditions",
    name: "Working Conditions",
    description: "Good pay, job security, and comfortable environment",
  },
} as const;

export type WorkValueKey = keyof typeof WORK_VALUES;

export interface WorkValuesQuestion {
  id: string;
  text: string;
  value: WorkValueKey;
}

export interface WorkValuesResult {
  values: Record<WorkValueKey, number>;
  topValues: WorkValueKey[];
  description: string;
  careerSuggestions: string[];
}

// Learning Styles Types (VARK Model)
export type LearningStyle = "visual" | "auditory" | "read_write" | "kinesthetic";

export interface LearningStylesQuestion {
  id: string;
  text: string;
  options: Array<{ value: LearningStyle; label: string }>;
  multiple: boolean;
}

export interface LearningStylesResult {
  visual: number; // 0-100
  auditory: number; // 0-100
  readWrite: number; // 0-100
  kinesthetic: number; // 0-100
  dominantStyle: LearningStyle;
  secondaryStyle?: LearningStyle;
  description: string;
  recommendations: {
    studyTips: string[];
    teachingMethods: string[];
    careerSuggestions: string[];
  };
}

// Assessment Type Definition
export interface AssessmentType {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: AssessmentCategory;
  targetAudience: TargetAudience;
  targetGrade?: TargetGrade;
  duration: number; // in minutes
  questionCount: number;
  isActive: boolean;
}

// Assessment Submission
export interface AssessmentSubmission {
  id: string;
  assessmentId: string;
  userId: string;
  assignedBy?: string;
  status: AssessmentStatus;
  startedAt?: Date;
  completedAt?: Date;
  timeSpent?: number; // seconds
  ipAddress?: string;
  createdAt: Date;
}

// Career Plan Types (Six-Phase Model)
export type CareerPhase =
  | "self_assessment"
  | "career_exploration"
  | "goal_setting"
  | "planning"
  | "implementation"
  | "review";

export const CAREER_PHASES: Record<CareerPhase, { name: string; description: string }> = {
  self_assessment: {
    name: "Self-Assessment",
    description: "Understand your interests, values, skills, and personality",
  },
  career_exploration: {
    name: "Career Exploration",
    description: "Research and explore various career options that match your profile",
  },
  goal_setting: {
    name: "Goal Setting",
    description: "Set short-term and long-term career goals",
  },
  planning: {
    name: "Planning",
    description: "Create a detailed action plan to achieve your goals",
  },
  implementation: {
    name: "Implementation",
    description: "Take action and work towards your career goals",
  },
  review: {
    name: "Review",
    description: "Review your progress and adjust your plans as needed",
  },
};

export interface CareerGoal {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  status: "not_started" | "in_progress" | "completed";
}

export interface ActionStep {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  status: "not_started" | "in_progress" | "completed";
  resources?: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  achievedAt?: Date;
}

export interface CareerPlan {
  id: string;
  userId: string;
  counselorId?: string;
  currentPhase: CareerPhase;
  targetCareer?: string;
  shortTermGoals: CareerGoal[];
  longTermGoals: CareerGoal[];
  actionSteps: ActionStep[];
  milestones: Milestone[];
  status: "active" | "completed" | "on_hold";
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
