/**
 * VISUAL CAREER ROADMAP DATA
 *
 * Provides structured roadmap data for visual timeline components
 * Shows journey from Class 6 → Class 12 → College → Career
 *
 * Last Updated: March 5, 2026
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RoadmapPhase {
  id: string;
  name: string;
  grade: string;
  period: string;
  description: string;

  // Milestones for this phase
  milestones: RoadmapMilestone[];

  // Recommended actions
  recommendations: RoadmapRecommendation[];

  // Key skills to develop
  focusSkills: string[];

  // Career exploration goals
  explorationGoals: string[];
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  category: "assessment" | "academic" | "skill" | "application" | "milestone";

  // Status tracking
  status: "pending" | "in-progress" | "completed" | "skipped";

  // Timing
  dueDate?: string; // Relative, e.g., "Class 10, Term 1"
  priority: "high" | "medium" | "low";

  // Links
  relatedCareer?: string;
  relatedSkills?: string[];
  resources?: string[];
}

export interface RoadmapRecommendation {
  type: "action" | "explore" | "prepare" | "complete";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
}

export interface CareerRoadmap {
  careerId: string;
  careerTitle: string;
  category: string;

  // Required education
  requiredEducation: string;
  recommendedStream: "Science" | "Arts" | "Commerce" | "Any";

  // RUB pathway
  rubPathway?: {
    collegeId: string;
    collegeName: string;
    programName: string;
    programCode: string;
  };

  // Full roadmap
  phases: RoadmapPhase[];

  // Overall timeline
  totalDuration: string; // e.g., "6-7 years"
  keyDecisionPoints: string[];
}

// ============================================================================
// ROADMAP DATA FOR KEY CAREER PATHS
// ============================================================================

export const careerRoadmaps: CareerRoadmap[] = [
  // ==========================================================================
  // SOFTWARE ENGINEER ROADMAP
  // ==========================================================================
  {
    careerId: "software_engineer",
    careerTitle: "Software Engineer",
    category: "Technology",
    requiredEducation: "Bachelor's in Computer Science or related",
    recommendedStream: "Science",
    rubPathway: {
      collegeId: "rub_cst",
      collegeName: "College of Science and Technology",
      programName: "B.E. in Computer Engineering",
      programCode: "BCE",
    },
    totalDuration: "6-7 years (Class 9 to first job)",
    keyDecisionPoints: [
      "Class 10: Choose Science stream with Computer Science elective",
      "Class 12: Apply to CST or other engineering colleges",
      "Year 2 of College: Choose specialization (AI, Web, Mobile, etc.)",
    ],
    phases: [
      {
        id: "phase-1",
        name: "Foundation Building",
        grade: "9-10",
        period: "Class 9-10",
        description: "Build strong foundation in mathematics and logical thinking",
        milestones: [
          {
            id: "m-1",
            title: "Complete RIASEC Assessment",
            description: "Take career assessment to confirm interest in technology",
            category: "assessment",
            status: "pending",
            priority: "high",
            relatedCareer: "Software Engineer",
          },
          {
            id: "m-2",
            title: "Excel in Mathematics (85%+)",
            description: "Strong math foundation is essential for engineering",
            category: "academic",
            status: "pending",
            priority: "high",
            dueDate: "Class 10",
          },
          {
            id: "m-3",
            title: "Learn Basic Programming",
            description: "Start with Python or JavaScript through online courses",
            category: "skill",
            status: "pending",
            priority: "medium",
            relatedSkills: ["Programming", "Problem Solving"],
            resources: ["freeCodeCamp", "Codecademy", "YouTube tutorials"],
          },
        ],
        recommendations: [
          {
            type: "action",
            title: "Choose Science Stream",
            description: "Select Science with Computer Science for Class 11-12",
            priority: "high",
            category: "Academic",
          },
          {
            type: "explore",
            title: "Explore Programming",
            description: "Try a free coding course to see if you enjoy it",
            priority: "medium",
            category: "Skill",
          },
          {
            type: "prepare",
            title: "Build Problem-Solving Skills",
            description: "Practice logic puzzles and math problems",
            priority: "medium",
            category: "Skill",
          },
        ],
        focusSkills: ["Mathematics", "Logical Thinking", "Problem Solving"],
        explorationGoals: [
          "Complete 1 online programming course",
          "Build a small project (calculator, game)",
          "Talk to a software engineer if possible",
        ],
      },
      {
        id: "phase-2",
        name: "Skill Development",
        grade: "11-12",
        period: "Class 11-12",
        description: "Deepen programming skills and prepare for RUB admission",
        milestones: [
          {
            id: "m-4",
            title: "Master Python Programming",
            description: "Become proficient in Python for college-level work",
            category: "skill",
            status: "pending",
            priority: "high",
            relatedSkills: ["Python", "Programming"],
          },
          {
            id: "m-5",
            title: "Build Portfolio Projects",
            description: "Create 2-3 projects to demonstrate skills",
            category: "skill",
            status: "pending",
            priority: "high",
            relatedSkills: ["Web Development", "Project Building"],
          },
          {
            id: "m-6",
            title: "Maintain 75%+ in Science Subjects",
            description: "Required for competitive RUB programs",
            category: "academic",
            status: "pending",
            priority: "high",
            dueDate: "Class 12",
          },
          {
            id: "m-7",
            title: "Prepare for RUB Entrance",
            description: "Practice aptitude questions if required",
            category: "application",
            status: "pending",
            priority: "medium",
          },
        ],
        recommendations: [
          {
            type: "action",
            title: "Focus on Physics, Math, Computer Science",
            description: "These subjects directly relate to software engineering",
            priority: "high",
            category: "Academic",
          },
          {
            type: "complete",
            title: "Complete Coding Projects",
            description: "Build a website, app, or game for portfolio",
            priority: "high",
            category: "Skill",
          },
          {
            type: "prepare",
            title: "Research CST Programs",
            description: "Learn about specializations offered at CST",
            priority: "medium",
            category: "Planning",
          },
        ],
        focusSkills: ["Python", "Web Development", "Data Structures", "Algorithms"],
        explorationGoals: [
          "Participate in coding competitions",
          "Join computer club if available",
          "Internship or shadowing opportunity",
        ],
      },
      {
        id: "phase-3",
        name: "College & Career Launch",
        grade: "college",
        period: "Years 1-4",
        description: "Complete degree and prepare for job market",
        milestones: [
          {
            id: "m-8",
            title: "Complete B.E. in Computer Engineering",
            description: "Graduate from CST with good grades",
            category: "milestone",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-9",
            title: "Complete Summer Internships",
            description: "Gain industry experience during breaks",
            category: "skill",
            status: "pending",
            priority: "medium",
          },
          {
            id: "m-10",
            title: "Build Strong Portfolio",
            description: "Showcase projects and skills to employers",
            category: "skill",
            status: "pending",
            priority: "high",
          },
        ],
        recommendations: [
          {
            type: "action",
            title: "Apply for Internships",
            description: "Seek opportunities at Thimphu Tech Park and tech companies",
            priority: "high",
            category: "Career",
          },
          {
            type: "complete",
            title: "Build Network",
            description: "Connect with professionals in Bhutan's tech industry",
            priority: "medium",
            category: "Career",
          },
        ],
        focusSkills: ["System Design", "Database Management", "Team Collaboration"],
        explorationGoals: [
          "Attend tech meetups and hackathons",
          "Contribute to open source projects",
          "Build professional online presence",
        ],
      },
    ],
  },

  // ==========================================================================
  // DOCTOR ROADMAP
  // ==========================================================================
  {
    careerId: "doctor",
    careerTitle: "Doctor (Physician)",
    category: "Healthcare",
    requiredEducation: "MBBS (Bachelor of Medicine, Bachelor of Surgery)",
    recommendedStream: "Science",
    rubPathway: undefined, // RUB doesn't offer MBBS yet
    totalDuration: "10-12 years (Class 9 to practicing doctor)",
    keyDecisionPoints: [
      "Class 10: Must choose Science stream",
      "Class 12: High marks required (85%+) for medical college",
      "After Class 12: Apply to medical colleges (Bhutan or abroad)",
      "After MBBS: Complete residency for specialization",
    ],
    phases: [
      {
        id: "phase-1",
        name: "Science Foundation",
        grade: "9-10",
        period: "Class 9-10",
        description: "Build strong science foundation for medical school",
        milestones: [
          {
            id: "m-d1",
            title: "Excel in Biology, Chemistry, Physics",
            description: "Medical college requires strong science scores (85%+)",
            category: "academic",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-d2",
            title: "Complete RIASEC and MBTI",
            description: "Confirm interest in healthcare and helping others",
            category: "assessment",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-d3",
            title: "Volunteer in Healthcare Setting",
            description: "Volunteer at hospital or clinic to understand healthcare",
            category: "assessment",
            status: "pending",
            priority: "medium",
          },
        ],
        recommendations: [
          {
            type: "action",
            title: "Choose Science Stream",
            description: "Science with Biology is mandatory for medical careers",
            priority: "high",
            category: "Academic",
          },
          {
            type: "explore",
            title: "Shadow a Doctor",
            description: "Arrange to observe a doctor at work if possible",
            priority: "medium",
            category: "Exploration",
          },
        ],
        focusSkills: ["Biology", "Chemistry", "Empathy", "Communication"],
        explorationGoals: [
          "Research medical profession thoroughly",
          "Talk to practicing doctors about their experience",
          "Volunteer at health camps",
        ],
      },
      {
        id: "phase-2",
        name: "Medical Preparation",
        grade: "11-12",
        period: "Class 11-12",
        description: "Intensive preparation for medical college admission",
        milestones: [
          {
            id: "m-d4",
            title: "Score 85%+ in Class 12",
            description: "Required for competitive medical colleges",
            category: "academic",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-d5",
            title: "Prepare for Medical Entrance",
            description: "Study for medical college entrance exams",
            category: "application",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-d6",
            title: "Build Patient Care Skills",
            description: "Develop empathy and communication for patient care",
            category: "skill",
            status: "pending",
            priority: "medium",
          },
        ],
        recommendations: [
          {
            type: "action",
            title: "Focus on Biology & Chemistry",
            description: "These are most important for medical school",
            priority: "high",
            category: "Academic",
          },
          {
            type: "prepare",
            title: "Research Medical Colleges",
            description: "Explore options in Bhutan, India, and other countries",
            priority: "medium",
            category: "Planning",
          },
        ],
        focusSkills: ["Biology", "Chemistry", "Anatomy", "Psychology"],
        explorationGoals: [
          "Attend medical workshops if available",
          "Prepare for entrance exams",
          "Understand medical college curriculum",
        ],
      },
      {
        id: "phase-3",
        name: "Medical School & Beyond",
        grade: "college",
        period: "MBBS + Residency",
        description: "Complete medical education and specialization",
        milestones: [
          {
            id: "m-d7",
            title: "Complete MBBS Degree",
            description: "5.5 year medical degree program",
            category: "milestone",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-d8",
            title: "Complete Internship",
            description: "1 year rotating internship in all departments",
            category: "milestone",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-d9",
            title: "Choose Specialization",
            description: "Complete residency in chosen specialty (3+ years)",
            category: "milestone",
            status: "pending",
            priority: "medium",
          },
        ],
        recommendations: [
          {
            type: "action",
            title: "Consider Bhutan Context",
            description: "Think about serving in Bhutan's healthcare system",
            priority: "medium",
            category: "Career",
          },
        ],
        focusSkills: ["Clinical Skills", "Patient Care", "Medical Ethics", "Specialization"],
        explorationGoals: [
          "Decide on specialization (GP, Surgery, Medicine, etc.)",
          "Consider serving in rural Bhutan",
          "Network with medical community",
        ],
      },
    ],
  },

  // ==========================================================================
  // TEACHER ROADMAP
  // ==========================================================================
  {
    careerId: "teacher_secondary",
    careerTitle: "Secondary School Teacher",
    category: "Education",
    requiredEducation: "Bachelor's in Education + Subject + B.Ed",
    recommendedStream: "Any",
    rubPathway: {
      collegeId: "rub_pce",
      collegeName: "Paro College of Education",
      programName: "B.Ed Secondary",
      programCode: "B.Ed Sec",
    },
    totalDuration: "4-5 years (Class 9 to first teaching job)",
    keyDecisionPoints: [
      "Class 10: Choose stream based on preferred teaching subject",
      "Class 12: Apply to PCE for B.Ed",
      "After B.Ed: Complete teacher licensure",
    ],
    phases: [
      {
        id: "phase-1",
        name: "Interest Confirmation",
        grade: "9-10",
        period: "Class 9-10",
        description: "Explore interest in teaching and choose subject area",
        milestones: [
          {
            id: "m-t1",
            title: "Complete Career Assessment",
            description: "Confirm Social and Artistic interests for teaching",
            category: "assessment",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-t2",
            title: "Identify Teaching Subject",
            description: "Choose which subject you'd like to teach",
            category: "assessment",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-t3",
            title: "Tutor Younger Students",
            description: "Gain experience helping classmates or younger students",
            category: "skill",
            status: "pending",
            priority: "medium",
          },
        ],
        recommendations: [
          {
            type: "explore",
            title: "Choose Subject for Teaching",
            description: "Select based on your strength and interest",
            priority: "high",
            category: "Planning",
          },
          {
            type: "action",
            title: "Practice Teaching",
            description: "Help classmates with homework to build skills",
            priority: "medium",
            category: "Skill",
          },
        ],
        focusSkills: ["Communication", "Subject Knowledge", "Patience", "Leadership"],
        explorationGoals: [
          "Assist teachers with classroom activities",
          "Participate in teaching-related clubs",
          "Research teaching profession",
        ],
      },
      {
        id: "phase-2",
        name: "B.Ed Preparation",
        grade: "11-12",
        period: "Class 11-12",
        description: "Prepare for B.Ed program admission",
        milestones: [
          {
            id: "m-t4",
            title: "Maintain 60%+ Overall",
            description: "PCE minimum requirement for B.Ed",
            category: "academic",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-t5",
            title: "Develop Teaching Portfolio",
            description: "Document tutoring, projects, and related experiences",
            category: "skill",
            status: "pending",
            priority: "medium",
          },
        ],
        recommendations: [
          {
            type: "action",
            title: "Apply to PCE",
            description: "Paro College of Education for B.Ed Secondary",
            priority: "high",
            category: "Academic",
          },
        ],
        focusSkills: ["Classroom Management", "Lesson Planning", "Assessment"],
        explorationGoals: [
          "Learn about B.Ed curriculum",
          "Talk to teachers about their experience",
        ],
      },
      {
        id: "phase-3",
        name: "B.Ed & Licensure",
        grade: "college",
        period: "Years 1-4",
        description: "Complete B.Ed degree and become licensed teacher",
        milestones: [
          {
            id: "m-t6",
            title: "Complete B.Ed Degree",
            description: "4-year program at PCE or RUB",
            category: "milestone",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-t7",
            title: "Complete Teaching Practice",
            description: "Student teaching internship",
            category: "skill",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-t8",
            title: "Get Teacher License",
            description: "Obtain teaching license from Ministry of Education",
            category: "milestone",
            status: "pending",
            priority: "high",
          },
        ],
        recommendations: [
          {
            type: "action",
            title: "Apply to Schools",
            description: "Begin teaching career in government or private schools",
            priority: "high",
            category: "Career",
          },
        ],
        focusSkills: ["Pedagogy", "Subject Mastery", "Student Assessment", "Mentoring"],
        explorationGoals: [
          "Join teacher associations",
          "Pursue professional development",
        ],
      },
    ],
  },

  // ==========================================================================
  // AGRICULTURE OFFICER ROADMAP
  // ==========================================================================
  {
    careerId: "agriculture_officer",
    careerTitle: "Agriculture Officer",
    category: "Agriculture",
    requiredEducation: "Bachelor's in Agriculture or related field",
    recommendedStream: "Science",
    rubPathway: {
      collegeId: "rub_cnr",
      collegeName: "College of Natural Resources",
      programName: "B.Sc. in Agriculture",
      programCode: "BScAg",
    },
    totalDuration: "4-5 years",
    keyDecisionPoints: [
      "Class 10: Choose Science stream",
      "Class 12: Apply to CNR",
    ],
    phases: [
      {
        id: "phase-1",
        name: "Agriculture Interest",
        grade: "9-10",
        period: "Class 9-10",
        description: "Develop interest in farming and agriculture",
        milestones: [
          {
            id: "m-a1",
            title: "Learn About Farming",
            description: "Understand modern agricultural practices",
            category: "assessment",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-a2",
            title: "Excel in Biology & Chemistry",
            description: "Science foundation for agriculture",
            category: "academic",
            status: "pending",
            priority: "high",
          },
        ],
        recommendations: [
          {
            type: "explore",
            title: "Visit Farm or Research Center",
            description: "See modern agriculture in action",
            priority: "medium",
            category: "Exploration",
          },
        ],
        focusSkills: ["Biology", "Chemistry", "Environmental Science"],
        explorationGoals: [
          "Learn about food security in Bhutan",
          "Understand sustainable farming",
        ],
      },
      {
        id: "phase-2",
        name: "CNR Preparation",
        grade: "11-12",
        period: "Class 11-12",
        description: "Prepare for CNR admission",
        milestones: [
          {
            id: "m-a3",
            title: "Score 50%+ in Class 12",
            description: "CNR minimum requirement",
            category: "academic",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-a4",
            title: "Gain Farm Experience",
            description: "Work on a farm or in agricultural projects",
            category: "assessment",
            status: "pending",
            priority: "medium",
          },
        ],
        recommendations: [
          {
            type: "action",
            title: "Apply to CNR",
            description: "College of Natural Resources in Lobesa",
            priority: "high",
            category: "Academic",
          },
        ],
        focusSkills: ["Soil Science", "Crop Management", "Farm Technology"],
        explorationGoals: [
          "Research agriculture career paths",
          "Learn about agricultural innovations",
        ],
      },
      {
        id: "phase-3",
        name: "B.Sc. Agriculture",
        grade: "college",
        period: "Years 1-4",
        description: "Complete agriculture degree",
        milestones: [
          {
            id: "m-a5",
            title: "Complete B.Sc. Agriculture",
            description: "4-year program at CNR",
            category: "milestone",
            status: "pending",
            priority: "high",
          },
          {
            id: "m-a6",
            title: "Complete Internship",
            description: "Gain practical farming experience",
            category: "skill",
            status: "pending",
            priority: "medium",
          },
        ],
        recommendations: [
          {
            type: "action",
            title: "Apply to Agriculture Department",
            description: "Ministry of Agriculture or Forests",
            priority: "high",
            category: "Career",
          },
        ],
        focusSkills: ["Crop Science", "Agricultural Extension", "Research Methods"],
        explorationGoals: [
          "Serve Bhutan's agricultural sector",
          "Promote sustainable farming",
        ],
      },
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get roadmap for a specific career
 */
export function getRoadmapForCareer(careerId: string): CareerRoadmap | undefined {
  return careerRoadmaps.find((r) => r.careerId === careerId);
}

/**
 * Get roadmap by education level
 */
export function getRoadmapByEducation(education: string): CareerRoadmap[] {
  return careerRoadmaps.filter((r) => r.requiredEducation.includes(education));
}

/**
 * Get milestones for a specific grade phase
 */
export function getMilestonesForGrade(grade: number): RoadmapMilestone[] {
  const milestones: RoadmapMilestone[] = [];

  for (const roadmap of careerRoadmaps) {
    for (const phase of roadmap.phases) {
      const phaseGrade = parseInt(phase.grade);
      if (phaseGrade === grade || phase.grade.includes(grade.toString())) {
        milestones.push(...phase.milestones);
      }
    }
  }

  return milestones;
}

/**
 * Get recommended actions based on current grade
 */
export function getRecommendedActions(
  careerId: string,
  currentGrade: number
): RoadmapRecommendation[] {
  const roadmap = getRoadmapForCareer(careerId);
  if (!roadmap) return [];

  const currentPhase = roadmap.phases.find((p) => {
    const phaseGrade = parseInt(p.grade);
    return phaseGrade === currentGrade || p.grade.includes(currentGrade.toString());
  });

  return currentPhase?.recommendations || [];
}

/**
 * Get "What If" scenario roadmap
 */
export function getWhatIfRoadmap(fromCareer: string, toCareer: string): {
  additionalSkills: string[];
  additionalEducation: string[];
  timelineAdjustment: string;
  notes: string[];
} {
  // Compare two roadmaps and identify differences
  const fromRoadmap = getRoadmapForCareer(fromCareer);
  const toRoadmap = getRoadmapForCareer(toCareer);

  if (!fromRoadmap || !toRoadmap) {
    return {
      additionalSkills: [],
      additionalEducation: [],
      timelineAdjustment: "Unable to compare",
      notes: ["One or both careers not found in roadmap database"],
    };
  }

  const fromSkills = new Set<string>();
  const toSkills = new Set<string>();

  for (const phase of fromRoadmap.phases) {
    for (const skill of phase.focusSkills) {
      fromSkills.add(skill);
    }
  }

  for (const phase of toRoadmap.phases) {
    for (const skill of phase.focusSkills) {
      toSkills.add(skill);
    }
  }

  const additionalSkills = Array.from(toSkills).filter((s) => !fromSkills.has(s));
  const additionalEducation =
    fromRoadmap.requiredEducation !== toRoadmap.requiredEducation
      ? [toRoadmap.requiredEducation]
      : [];

  return {
    additionalSkills,
    additionalEducation,
    timelineAdjustment: additionalEducation.length > 0 ? "1-2 years additional" : "Similar timeline",
    notes: [
      `Switching from ${fromRoadmap.careerTitle} to ${toRoadmap.careerTitle}`,
      additionalSkills.length > 0
        ? `You'll need to develop: ${additionalSkills.join(", ")}`
        : "Your current skills are mostly transferable",
    ],
  };
}
