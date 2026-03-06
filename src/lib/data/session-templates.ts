/**
 * CAREER PLANNING SESSION TEMPLATES & RESOURCES
 *
 * Structured templates for counselor-led career planning sessions
 * Includes session guides, questions, activities, and follow-up tasks
 *
 * Last Updated: March 5, 2026
 */

// ============================================================================
// SESSION TYPES
// ============================================================================

export enum SessionType {
  INITIAL_ASSESSMENT = "initial-assessment",
  CAREER_EXPLORATION = "career-exploration",
  RUB_APPLICATION = "rub-application",
  SCHOLARSHIP_GUIDANCE = "scholarship-guidance",
  PARENT_COUNSELING = "parent-counseling",
  REVIEW_FOLLOWUP = "review-followup",
  CRISIS_INTERVENTION = "crisis-intervention",
}

export enum SessionPhase {
  PREPARATION = "preparation",
  DISCUSSION = "discussion",
  ACTIVITY = "activity",
  PLANNING = "planning",
  FOLLOWUP = "followup",
}

// ============================================================================
// SESSION TEMPLATES
// ============================================================================

export interface SessionTemplate {
  id: string;
  type: SessionType;
  title: string;
  description: string;
  duration: number; // minutes
  targetGrade: string; // "6-8", "9-10", "11-12"

  // Session structure
  phases: SessionPhase[];

  // Preparation checklist
  preparation: ChecklistItem[];

  // Discussion guide
  discussionGuide: DiscussionGuide;

  // Activities
  activities?: SessionActivity[];

  // Outcomes
  expectedOutcomes: string[];

  // Follow-up tasks
  followUpTasks: FollowUpTask[];
}

export interface ChecklistItem {
  item: string;
  completed: boolean;
  notes?: string;
}

export interface DiscussionGuide {
  openingQuestions: string[];
  coreTopics: Array<{
    topic: string;
    questions: string[];
    talkingPoints: string[];
  }>;
  closingQuestions: string[];
}

export interface SessionActivity {
  id: string;
  name: string;
  duration: number;
  instructions: string[];
  materials: string[];
}

export interface FollowUpTask {
  task: string;
  assignedTo: "student" | "counselor" | "parent";
  dueDate: string; // relative, e.g., "1 week", "2 days"
  priority: "high" | "medium" | "low";
}

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

export const sessionTemplates: SessionTemplate[] = [
  // ==========================================================================
  // INITIAL ASSESSMENT (Class 6-8)
  // ==========================================================================
  {
    id: "initial-assessment-6-8",
    type: SessionType.INITIAL_ASSESSMENT,
    title: "Initial Career Awareness Session",
    description: "Introduction to career awareness for middle school students",
    duration: 45,
    targetGrade: "6-8",
    phases: [SessionPhase.PREPARATION, SessionPhase.DISCUSSION, SessionPhase.ACTIVITY, SessionPhase.PLANNING],
    preparation: [
      { item: "Review student's academic records", completed: false },
      { item: "Check if any assessments completed", completed: false },
      { item: "Prepare career interest inventory materials", completed: false },
      { item: "Set up meeting space with visual aids", completed: false },
    ],
    discussionGuide: {
      openingQuestions: [
        "What do you enjoy learning about most in school?",
        "What activities do you do for fun?",
        "Have you ever thought about what you'd like to be when you grow up?",
        "What are you really good at?",
      ],
      coreTopics: [
        {
          topic: "Understanding Strengths",
          questions: [
            "What subjects come easiest to you?",
            "What do teachers often praise you for?",
            "What activities make you lose track of time?",
          ],
          talkingPoints: [
            "Everyone has different strengths - that's what makes us unique",
            "Your interests can guide you toward suitable careers",
            "It's okay to change your mind as you learn more",
          ],
        },
        {
          topic: "Exploring Career Families",
          questions: [
            "Which of these sounds most interesting: working with computers, helping people, building things, creating art, or leading teams?",
          ],
          talkingPoints: [
            "There are 6 main career types (RIASEC)",
            "Most people fit into 2-3 types, not just one",
            "We'll explore which types might fit you best",
          ],
        },
      ],
      closingQuestions: [
        "What was most interesting to learn today?",
        "Would you like to explore some careers before our next meeting?",
        "Is there anything you'd like to ask your parents about careers?",
      ],
    },
    activities: [
      {
        id: "interest-inventory",
        name: "Quick Interest Inventory",
        duration: 15,
        instructions: [
          "Show student pictures of different careers",
          "Ask them to rate each: Very Interested, Somewhat Interested, Not Interested",
          "Record their top 3 choices",
        ],
        materials: ["Career picture cards", "Rating sheet", "Pen"],
      },
      {
        id: "strengths-map",
        name: "Strengths Map",
        duration: 10,
        instructions: [
          "Give student a paper with 'My Strengths' in center",
          "Write down things they're good at around it",
          "Draw connections between strengths and possible careers",
        ],
        materials: ["Paper", "Colored markers", "Career list"],
      },
    ],
    expectedOutcomes: [
      "Student completes initial interest inventory",
      "Identifies 3-5 career areas of interest",
      "Understands that career exploration is a process",
      "Feels excited about future possibilities",
    ],
    followUpTasks: [
      { task: "Complete RIASEC assessment", assignedTo: "student", dueDate: "1 week", priority: "high" },
      { task: "Talk with parents about session", assignedTo: "student", dueDate: "3 days", priority: "medium" },
      { task: "Review assessment results", assignedTo: "counselor", dueDate: "2 weeks", priority: "high" },
    ],
  },

  // ==========================================================================
  // INITIAL ASSESSMENT (Class 9-10)
  // ==========================================================================
  {
    id: "initial-assessment-9-10",
    type: SessionType.INITIAL_ASSESSMENT,
    title: "Stream Selection & Career Planning",
    description: "Guidance for Class 10 students choosing their stream for higher secondary",
    duration: 60,
    targetGrade: "9-10",
    phases: [SessionPhase.PREPARATION, SessionPhase.DISCUSSION, SessionPhase.ACTIVITY, SessionPhase.PLANNING, SessionPhase.FOLLOWUP],
    preparation: [
      { item: "Get student's Class 9 report card", completed: false },
      { item: "Retrieve completed assessments (RIASEC, MBTI)", completed: false },
      { item: "Print stream selection guide for RUB programs", completed: false },
      { item: "Prepare stream comparison chart", completed: false },
    ],
    discussionGuide: {
      openingQuestions: [
        "How do you feel about completing Class 10 soon?",
        "What subjects have you enjoyed most in secondary school?",
        "What do your teachers say you're good at?",
        "Have your parents talked to you about stream choice?",
      ],
      coreTopics: [
        {
          topic: "Understanding Streams",
          questions: [
            "What do you know about Science, Arts, and Commerce streams?",
            "Which stream do you think you want and why?",
          ],
          talkingPoints: [
            "Science opens doors to Engineering, Medicine, Research, Architecture",
            "Commerce leads to Business, Management, Finance, Accounting",
            "Arts connects to Humanities, Law, Social Sciences, Education",
            "Your choice now affects your RUB program options later",
            "It's possible to switch, but easier to start in the right stream",
          ],
        },
        {
          topic: "Assessment Results Review",
          questions: [
            "Based on your assessments, which careers showed strong matches?",
            "Do these results feel accurate to you?",
          ],
          talkingPoints: [
            "Review RIASEC code and what it means",
            "Show how personality matches certain careers",
            "Discuss interests that may not match assessments",
          ],
        },
        {
          topic: "RUB Program Requirements",
          questions: [
            "Which RUB programs interest you most?",
            "Do you meet the eligibility requirements?",
          ],
          talkingPoints: [
            "Each RUB program has specific stream requirements",
            "Some programs require specific subjects",
            "Minimum percentage requirements vary by college and program",
            "Scholarships are competitive - good grades matter",
          ],
        },
      ],
      closingQuestions: [
        "Which stream are you leaning toward now?",
        "What questions do you still have?",
        "How can I help you talk to your parents about this?",
      ],
    },
    activities: [
      {
        id: "stream-matrix",
        name: "Stream-Career Mapping",
        duration: 15,
        instructions: [
          "Create a 3-column chart: Science, Commerce, Arts",
          "List careers under each stream that interest the student",
          "Highlight which careers match their assessment results",
          "Circle the stream with most appealing careers",
        ],
        materials: ["Chart paper", "Markers", "Career list", "Assessment results"],
      },
      {
        id: "subject-planner",
        name: "Subject Planning",
        duration: 10,
        instructions: [
          "List Class 11-12 subjects for each stream",
          "Mark which subjects the student would enjoy/struggle with",
          "Discuss ways to strengthen weaker subjects",
        ],
        materials: ["Subject list", "Planner sheet"],
      },
    ],
    expectedOutcomes: [
      "Student understands stream options and implications",
      "Student makes informed stream choice",
      "Student knows which RUB programs align with their choice",
      "Parents are aligned with student's decision",
    ],
    followUpTasks: [
      { task: "Discuss stream choice with parents", assignedTo: "student", dueDate: "3 days", priority: "high" },
      { task: "Complete stream selection form", assignedTo: "student", dueDate: "1 week", priority: "high" },
      { task: "Follow up on parent meeting", assignedTo: "counselor", dueDate: "2 weeks", priority: "medium" },
    ],
  },

  // ==========================================================================
  // CAREER EXPLORATION (Class 11-12)
  // ==========================================================================
  {
    id: "career-exploration-11-12",
    type: SessionType.CAREER_EXPLORATION,
    title: "Deep Dive Career Exploration",
    description: "In-depth exploration of specific career options",
    duration: 60,
    targetGrade: "11-12",
    phases: [SessionPhase.PREPARATION, SessionPhase.DISCUSSION, SessionPhase.ACTIVITY, SessionPhase.PLANNING],
    preparation: [
      { item: "Review student's career match results", completed: false },
      { item: "Print detailed information on top 5 career matches", completed: false },
      { item: "Prepare RUB program handouts for relevant careers", completed: false },
      { item: "Have laptop ready for showing online resources", completed: false },
    ],
    discussionGuide: {
      openingQuestions: [
        "Since our last meeting, what careers have you been thinking about?",
        "Have you researched any of the careers we discussed?",
        "What new information have you learned?",
      ],
      coreTopics: [
        {
          topic: "Top Career Matches Review",
          questions: [
            "Which of these top 5 careers interests you most?",
            "Which surprises you?",
            "Which do you want to eliminate?",
          ],
          talkingPoints: [
            "Review match scores and what they mean",
            "Discuss job outlook in Bhutan",
            "Talk about salary expectations and growth",
          ],
        },
        {
          topic: "RUB Program Details",
          questions: [
            "Which of these RUB programs appeals to you?",
            "Do you meet the admission requirements?",
            "What are your chances of admission?",
          ],
          talkingPoints: [
            "Program duration, fees, and location",
            "Application deadlines and requirements",
            "Career prospects after graduation",
          ],
        },
      ],
      closingQuestions: [
        "Which 2-3 careers will you research further?",
        "How can I help you prepare for RUB applications?",
        "When should we meet next?",
      ],
    },
    activities: [
      {
        id: "career-comparison",
        name: "Career Comparison Matrix",
        duration: 15,
        instructions: [
          "Create comparison chart for top 3 careers",
          "Columns: Education Required, RUB Programs, Salary, Outlook, Skills Needed",
          "Fill in information for each career",
          "Highlight pros and cons of each",
        ],
        materials: ["Comparison chart", "Career handouts", "Markers"],
      },
    ],
    expectedOutcomes: [
      "Student narrows down to 2-3 target careers",
      "Student understands RUB program options",
      "Student knows admission requirements and timeline",
      "Action plan for application preparation is created",
    ],
    followUpTasks: [
      { task: "Research top 3 careers in detail", assignedTo: "student", dueDate: "1 week", priority: "high" },
      { task: "Visit RUB college websites for program details", assignedTo: "student", dueDate: "1 week", priority: "medium" },
      { task: "Talk to professionals in target careers", assignedTo: "student", dueDate: "2 weeks", priority: "medium" },
    ],
  },

  // ==========================================================================
  // RUB APPLICATION (Class 12)
  // ==========================================================================
  {
    id: "rub-application",
    type: SessionType.RUB_APPLICATION,
    title: "RUB Application Preparation",
    description: "Guidance for preparing and submitting RUB college applications",
    duration: 45,
    targetGrade: "12",
    phases: [SessionPhase.PREPARATION, SessionPhase.DISCUSSION, SessionPhase.PLANNING],
    preparation: [
      { item: "Get RUB application deadlines", completed: false },
      { item: "Print application checklist", completed: false },
      { item: "Have student's documents ready for review", completed: false },
      { item: "Prepare sample personal statement", completed: false },
    ],
    discussionGuide: {
      openingQuestions: [
        "Which RUB programs are you applying to?",
        "Have you started your applications?",
        "What questions do you have about the process?",
      ],
      coreTopics: [
        {
          topic: "Application Requirements",
          questions: [
            "What documents do you need?",
            "Have you prepared your personal statement?",
            "Do you need recommendation letters?",
          ],
          talkingPoints: [
            "Required documents: CID, mark sheets, character certificate, photos",
            "Application fees and payment methods",
            "Online vs. offline application process",
            "Deadline reminders",
          ],
        },
        {
          topic: "Program Prioritization",
          questions: [
            "What's your first choice program?",
            "What are your backup options?",
          ],
          talkingPoints: [
            "Apply to multiple programs to increase chances",
            "Consider colleges outside Thimphu as backups",
            "Have realistic and ambitious options",
          ],
        },
      ],
      closingQuestions: [
        "What's your application timeline?",
        "How can I help you complete your applications?",
        "When will you submit each application?",
      ],
    },
    activities: [],
    expectedOutcomes: [
      "Student has complete application checklist",
      "Student understands timeline and deadlines",
      "Personal statement draft is reviewed",
      "Recommendation letters are arranged",
    ],
    followUpTasks: [
      { task: "Complete all applications", assignedTo: "student", dueDate: "2 weeks", priority: "high" },
      { task: "Follow up on recommenders", assignedTo: "student", dueDate: "1 week", priority: "high" },
      { task: "Review submitted applications", assignedTo: "counselor", dueDate: "3 weeks", priority: "medium" },
    ],
  },

  // ==========================================================================
  // SCHOLARSHIP GUIDANCE
  // ==========================================================================
  {
    id: "scholarship-guidance",
    type: SessionType.SCHOLARSHIP_GUIDANCE,
    title: "Scholarship Application Guidance",
    description: "Help students find and apply for scholarships",
    duration: 45,
    targetGrade: "11-12",
    phases: [SessionPhase.PREPARATION, SessionPhase.DISCUSSION, SessionPhase.PLANNING],
    preparation: [
      { item: "Research available scholarships", completed: false },
      { item: "Print scholarship eligibility criteria", completed: false },
      { item: "Prepare scholarship essay samples", completed: false },
    ],
    discussionGuide: {
      openingQuestions: [
        "Are you planning to apply for scholarships?",
        "Do you know what scholarships are available?",
        "What's your family's financial situation?",
      ],
      coreTopics: [
        {
          topic: "Available Scholarships",
          questions: [
            "Which scholarships match your profile?",
            "What are the eligibility criteria?",
          ],
          talkingPoints: [
            "RUB scholarships (merit-based, need-based)",
            "Government scholarships",
            "Private organization scholarships",
            "International scholarship opportunities",
          ],
        },
        {
          topic: "Application Strategy",
          questions: [
            "How will you make your application stand out?",
            "Who can write strong recommendations?",
          ],
          talkingPoints: [
            "Maintain strong academic record",
            "Leadership and community service matter",
            "Strong essays and personal statements",
            "Apply to multiple scholarships",
          ],
        },
      ],
      closingQuestions: [
        "Which scholarships will you apply to?",
        "What help do you need with applications?",
      ],
    },
    activities: [],
    expectedOutcomes: [
      "Student knows available scholarships",
      "Student understands eligibility and requirements",
      "Application timeline is set",
      "Essay writing assistance is provided",
    ],
    followUpTasks: [
      { task: "Complete scholarship applications", assignedTo: "student", dueDate: "as per deadline", priority: "high" },
      { task: "Draft scholarship essays", assignedTo: "student", dueDate: "1 week", priority: "high" },
    ],
  },

  // ==========================================================================
  // PARENT COUNSELING
  // ==========================================================================
  {
    id: "parent-counseling",
    type: SessionType.PARENT_COUNSELING,
    title: "Parent Career Counseling Session",
    description: "Involve parents in student's career planning process",
    duration: 45,
    targetGrade: "all",
    phases: [SessionPhase.PREPARATION, SessionPhase.DISCUSSION, SessionPhase.PLANNING],
    preparation: [
      { item: "Get parent contact information", completed: false },
      { item: "Prepare student profile summary", completed: false },
      { item: "Print student's assessment results", completed: false },
      { item: "Prepare agenda for meeting", completed: false },
    ],
    discussionGuide: {
      openingQuestions: [
        "What are your hopes for your child's future?",
        "What careers have you discussed at home?",
        "What concerns do you have?",
      ],
      coreTopics: [
        {
          topic: "Student's Profile",
          questions: [
            "Would you like to see your child's assessment results?",
            "What are their greatest strengths?",
          ],
          talkingPoints: [
            "Share assessment results objectively",
            "Discuss both interests and aptitudes",
            "Address parent expectations vs. student interests",
          ],
        },
        {
          topic: "Career Options & RUB",
          questions: [
            "What do you think about these career options?",
            "Do you have questions about RUB programs?",
          ],
          talkingPoints: [
            "Present recommended careers with rationale",
            "Discuss admission requirements realistically",
            "Address financial considerations",
          ],
        },
      ],
      closingQuestions: [
        "How can you support your child's career journey?",
        "When should we follow up?",
      ],
    },
    activities: [],
    expectedOutcomes: [
      "Parents understand student's profile and options",
      "Parents are aligned with career plan",
      "Support system is established",
      "Realistic expectations are set",
    ],
    followUpTasks: [
      { task: "Discuss career plan at home", assignedTo: "parent", dueDate: "1 week", priority: "medium" },
      { task: "Support skill development", assignedTo: "parent", dueDate: "ongoing", priority: "medium" },
    ],
  },

  // ==========================================================================
  // REVIEW FOLLOW-UP
  // ==========================================================================
  {
    id: "review-followup",
    type: SessionType.REVIEW_FOLLOWUP,
    title: "Progress Review & Follow-up",
    description: "Check on student's progress since last session",
    duration: 30,
    targetGrade: "all",
    phases: [SessionPhase.DISCUSSION, SessionPhase.PLANNING],
    preparation: [
      { item: "Review notes from previous session", completed: false },
      { item: "Check if follow-up tasks were completed", completed: false },
      { item: "Get updated assessment results if any", completed: false },
    ],
    discussionGuide: {
      openingQuestions: [
        "What have you done since our last meeting?",
        "What questions have come up?",
        "What progress have you made?",
      ],
      coreTopics: [
        {
          topic: "Task Review",
          questions: [
            "Which follow-up tasks did you complete?",
            "What was difficult about completing them?",
          ],
          talkingPoints: [
            "Acknowledge completed tasks positively",
            "Address incomplete tasks constructively",
            "Identify barriers and solutions",
          ],
        },
      ],
      closingQuestions: [
        "What's your next step?",
        "When should we meet again?",
      ],
    },
    activities: [],
    expectedOutcomes: [
      "Progress is assessed",
      "Barriers are identified and addressed",
      "Next steps are clarified",
      "Accountability is reinforced",
    ],
    followUpTasks: [
      { task: "Complete overdue tasks", assignedTo: "student", dueDate: "1 week", priority: "high" },
    ],
  },

  // ==========================================================================
  // CRISIS INTERVENTION
  // ==========================================================================
  {
    id: "crisis-intervention",
    type: SessionType.CRISIS_INTERVENTION,
    title: "Career Crisis Intervention",
    description: "For students facing career-related challenges",
    duration: 60,
    targetGrade: "all",
    phases: [SessionPhase.PREPARATION, SessionPhase.DISCUSSION, SessionPhase.PLANNING],
    preparation: [
      { item: "Understand the crisis situation", completed: false },
      { item: "Involve additional resources if needed", completed: false },
      { item: "Prepare alternative options", completed: false },
    ],
    discussionGuide: {
      openingQuestions: [
        "What's the biggest challenge you're facing right now?",
        "How can I help you through this?",
      ],
      coreTopics: [
        {
          topic: "Understanding the Challenge",
          questions: [
            "What happened?",
            "How are you feeling about it?",
          ],
          talkingPoints: [
            "Listen empathetically",
            "Normalize the struggle",
            "Offer perspective and hope",
          ],
        },
        {
          topic: "Exploring Options",
          questions: [
            "What alternatives do you have?",
            "What's Plan B?",
          ],
          talkingPoints: [
            "Discuss multiple pathways to goals",
            "Highlight that setbacks are temporary",
            "Emphasize resilience and growth",
          ],
        },
      ],
      closingQuestions: [
        "What's one thing you can do this week?",
        "Who can support you through this?",
      ],
    },
    activities: [],
    expectedOutcomes: [
      "Student feels heard and supported",
      "Alternative paths are identified",
      "Immediate stressors are addressed",
      "Action plan is created",
    ],
    followUpTasks: [
      { task: "Schedule follow-up meeting", assignedTo: "counselor", dueDate: "1 week", priority: "high" },
      { task: "Identify support system", assignedTo: "student", dueDate: "3 days", priority: "high" },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get session template by ID
 */
export function getTemplate(templateId: string): SessionTemplate | undefined {
  return sessionTemplates.find((t) => t.id === templateId);
}

/**
 * Get templates by type
 */
export function getTemplatesByType(type: SessionType): SessionTemplate[] {
  return sessionTemplates.filter((t) => t.type === type);
}

/**
 * Get templates by grade level
 */
export function getTemplatesByGrade(grade: number): SessionTemplate[] {
  if (grade <= 8) {
    return sessionTemplates.filter((t) => t.targetGrade === "6-8" || t.targetGrade === "all");
  } else if (grade <= 10) {
    return sessionTemplates.filter((t) => t.targetGrade === "9-10" || t.targetGrade === "all");
  } else {
    return sessionTemplates.filter((t) => t.targetGrade === "11-12" || t.targetGrade === "all");
  }
}

/**
 * Get recommended template based on student context
 */
export function getRecommendedTemplate(context: {
  grade: number;
  hasCompletedAssessments: boolean;
  applyingToRUB?: boolean;
  scholarshipNeeded?: boolean;
  parentInvolvement?: boolean;
  isCrisis?: boolean;
}): SessionTemplate | undefined {
  // Crisis intervention takes priority
  if (context.isCrisis) {
    return getTemplate("crisis-intervention");
  }

  // Initial assessment based on grade
  if (!context.hasCompletedAssessments) {
    if (context.grade <= 8) {
      return getTemplate("initial-assessment-6-8");
    } else {
      return getTemplate("initial-assessment-9-10");
    }
  }

  // RUB application preparation
  if (context.applyingToRUB && context.grade === 12) {
    return getTemplate("rub-application");
  }

  // Scholarship guidance
  if (context.scholarshipNeeded) {
    return getTemplate("scholarship-guidance");
  }

  // Parent counseling
  if (context.parentInvolvement) {
    return getTemplate("parent-counseling");
  }

  // Default career exploration
  return getTemplate("career-exploration-11-12");
}
