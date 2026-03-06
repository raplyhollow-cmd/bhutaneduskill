/**
 * SKILLS ONTOLOGY FOR BHUTANESE STUDENTS
 *
 * Hierarchical skill mapping that connects:
 * - Skills to careers
 * - Skills to learning resources
 * - Skills to assessment methods
 * - Skills to development pathways
 *
 * Last Updated: March 5, 2026
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SkillCategory =
  | "academic"
  | "technical"
  | "soft"
  | "creative"
  | "vocational"
  | "service"
  | "emerging";

export type ProficiencyLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type SkillSource =
  | "inferred" // From assessments
  | "self-report" // Student claimed
  | "teacher-assigned" // Teacher verified
  | "project-evidence" // From portfolio projects
  | "competition" // From competitions
  | "certification"; // From certificates

export interface SkillResource {
  type: "video" | "course" | "book" | "practice" | "tool" | "article";
  title: string;
  url?: string;
  provider: string;
  duration?: string;
  cost: "free" | "paid" | "freemium";
  difficulty: "beginner" | "intermediate" | "advanced";
  bhutanRelevant: boolean;
}

export interface SkillAssessment {
  method: "quiz" | "project" | "practical" | "peer-review" | "teacher-observation" | "certification";
  description: string;
  duration: string;
  passingCriteria: string;
}

export interface SkillPrerequisite {
  skillId: string;
  level: ProficiencyLevel;
  optional?: boolean;
}

export interface CareerRequirement {
  careerId: string;
  requiredLevel: ProficiencyLevel;
  importance: "essential" | "important" | "helpful";
}

export interface OntologySkill {
  // Core identity
  id: string;
  name: string;
  category: SkillCategory;

  // Hierarchy
  parentIds?: string[]; // Skills that should be learned first
  relatedIds?: string[]; // Related skills

  // Career connections
  careerRequirements?: CareerRequirement[];

  // Learning resources
  resources?: SkillResource[];
  beginnerResources?: SkillResource[];
  intermediateResources?: SkillResource[];
  advancedResources?: SkillResource[];

  // Assessment
  assessments?: SkillAssessment[];

  // Development
  typicalDevelopmentTime: string; // e.g., "3-6 months"
  difficulty: "easy" | "medium" | "hard";

  // Context
  bhutanDemand: "high" | "medium" | "low";
  bhutanSpecific?: boolean;
  emerging?: boolean; // New skill in demand
  description: string;
}

// ============================================================================
// SKILLS ONTOLOGY DATABASE
// ============================================================================

export const skillsOntology: OntologySkill[] = [
  // ==========================================================================
  // ACADEMIC SKILLS
  // ==========================================================================

  {
    id: "mathematics",
    name: "Mathematics",
    category: "academic",
    parentIds: [],
    relatedIds: ["statistics", "physics", "accounting"],
    careerRequirements: [
      { careerId: "data_scientist", requiredLevel: "advanced", importance: "essential" },
      { careerId: "software_engineer", requiredLevel: "intermediate", importance: "important" },
      { careerId: "civil_engineer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "accountant", requiredLevel: "intermediate", importance: "essential" },
      { careerId: "teacher", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Khan Academy Mathematics",
        provider: "Khan Academy",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
      {
        type: "video",
        title: "NCERT Mathematics Class 6-12",
        provider: "NCERT",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    intermediateResources: [
      {
        type: "course",
        title: "Brilliant.org Intermediate Math",
        provider: "Brilliant",
        cost: "freemium",
        difficulty: "intermediate",
        bhutanRelevant: false,
      },
    ],
    advancedResources: [
      {
        type: "course",
        title: "MIT OpenCourseWare Mathematics",
        provider: "MIT",
        cost: "free",
        difficulty: "advanced",
        bhutanRelevant: false,
      },
    ],
    assessments: [
      {
        method: "quiz",
        description: " timed math problems covering algebra, geometry, calculus",
        duration: "1 hour",
        passingCriteria: "70% correct answers",
      },
      {
        method: "practical",
        description: "Apply mathematical concepts to real-world problems",
        duration: "2 hours",
        passingCriteria: "Correct solution with clear reasoning",
      },
    ],
    typicalDevelopmentTime: "2-4 years (school curriculum)",
    difficulty: "medium",
    bhutanDemand: "high",
    description: "Foundation for STEM careers, data analysis, and problem-solving.",
  },
  {
    id: "statistics",
    name: "Statistics",
    category: "academic",
    parentIds: ["mathematics"],
    relatedIds: ["data_analysis", "python", "r_programming"],
    careerRequirements: [
      { careerId: "data_scientist", requiredLevel: "advanced", importance: "essential" },
      { careerId: "data_analyst", requiredLevel: "advanced", importance: "essential" },
      { careerId: "economist", requiredLevel: "advanced", importance: "essential" },
      { careerId: "market_researcher", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Statistics and Probability - Khan Academy",
        provider: "Khan Academy",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "quiz",
        description: "Statistical concepts, probability distributions, hypothesis testing",
        duration: "90 minutes",
        passingCriteria: "75% correct",
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "medium",
    bhutanDemand: "high",
    description: "Essential for data science, research, and analytical roles.",
  },
  {
    id: "science_biology",
    name: "Biology",
    category: "academic",
    parentIds: [],
    relatedIds: ["science_chemistry", "environmental_science", "medicine"],
    careerRequirements: [
      { careerId: "doctor", requiredLevel: "advanced", importance: "essential" },
      { careerId: "nurse", requiredLevel: "intermediate", importance: "essential" },
      { careerId: "environmental_scientist", requiredLevel: "advanced", importance: "essential" },
      { careerId: "agriculture_specialist", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Khan Academy Biology",
        provider: "Khan Academy",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "quiz",
        description: "Biology concepts, cell structure, genetics, ecology",
        duration: "60 minutes",
        passingCriteria: "70% correct",
      },
    ],
    typicalDevelopmentTime: "2-4 years (school curriculum)",
    difficulty: "medium",
    bhutanDemand: "medium",
    description: "Foundation for healthcare, environmental science, and agriculture careers.",
  },
  {
    id: "science_chemistry",
    name: "Chemistry",
    category: "academic",
    parentIds: [],
    relatedIds: ["science_biology", "science_physics", "pharmacy"],
    careerRequirements: [
      { careerId: "doctor", requiredLevel: "intermediate", importance: "essential" },
      { careerId: "pharmacist", requiredLevel: "advanced", importance: "essential" },
      { careerId: "environmental_scientist", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Khan Academy Chemistry",
        provider: "Khan Academy",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "quiz",
        description: "Chemical reactions, periodic table, molecular structure",
        duration: "60 minutes",
        passingCriteria: "70% correct",
      },
    ],
    typicalDevelopmentTime: "2-4 years (school curriculum)",
    difficulty: "medium",
    bhutanDemand: "medium",
    description: "Foundation for healthcare, pharmacy, and environmental science.",
  },
  {
    id: "science_physics",
    name: "Physics",
    category: "academic",
    parentIds: ["mathematics"],
    relatedIds: ["engineering", "science_chemistry", "computer_science"],
    careerRequirements: [
      { careerId: "software_engineer", requiredLevel: "intermediate", importance: "important" },
      { careerId: "civil_engineer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "electrical_engineer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "data_scientist", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Khan Academy Physics",
        provider: "Khan Academy",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "quiz",
        description: "Mechanics, electricity, waves, thermodynamics",
        duration: "60 minutes",
        passingCriteria: "70% correct",
      },
    ],
    typicalDevelopmentTime: "2-4 years (school curriculum)",
    difficulty: "hard",
    bhutanDemand: "medium",
    description: "Foundation for engineering and technology careers.",
  },
  {
    id: "english_language",
    name: "English Language",
    category: "academic",
    parentIds: [],
    relatedIds: ["communication", "writing", "public_speaking"],
    careerRequirements: [
      { careerId: "teacher", requiredLevel: "advanced", importance: "essential" },
      { careerId: "journalist", requiredLevel: "advanced", importance: "essential" },
      { careerId: "lawyer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "customer_service", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Duolingo English",
        provider: "Duolingo",
        cost: "freemium",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "quiz",
        description: "Grammar, vocabulary, reading comprehension",
        duration: "60 minutes",
        passingCriteria: "70% correct",
      },
    ],
    typicalDevelopmentTime: "2-4 years (school curriculum)",
    difficulty: "easy",
    bhutanDemand: "high",
    description: "Essential for communication, business, and most professional careers.",
  },
  {
    id: "dzongkha",
    name: "Dzongkha Language",
    category: "academic",
    parentIds: [],
    relatedIds: ["communication", "cultural_preservation", "writing"],
    careerRequirements: [
      { careerId: "teacher", requiredLevel: "intermediate", importance: "important" },
      { careerId: "journalist", requiredLevel: "intermediate", importance: "important" },
      { careerId: "civil_servant", requiredLevel: "advanced", importance: "essential" },
      { careerId: "tour_guide", requiredLevel: "advanced", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Dzongkha Development Services",
        provider: "DDS",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "practical",
        description: "Reading, writing, and speaking Dzongkha",
        duration: "60 minutes",
        passingCriteria: "Functional proficiency",
      },
    ],
    typicalDevelopmentTime: "2-4 years (school curriculum)",
    difficulty: "medium",
    bhutanDemand: "high",
    bhutanSpecific: true,
    description: "National language of Bhutan, essential for government and cultural careers.",
  },

  // ==========================================================================
  // TECHNICAL SKILLS
  // ==========================================================================

  {
    id: "programming",
    name: "Programming Fundamentals",
    category: "technical",
    parentIds: ["mathematics", "logical_thinking"],
    relatedIds: ["software_development", "web_development", "data_science"],
    careerRequirements: [
      { careerId: "software_engineer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "data_scientist", requiredLevel: "advanced", importance: "essential" },
      { careerId: "web_developer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "product_manager", requiredLevel: "beginner", importance: "helpful" },
    ],
    beginnerResources: [
      {
        type: "video",
        title: "Python for Beginners - Programming with Mosh",
        provider: "YouTube",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
      {
        type: "course",
        title: "freeCodeCamp - Learn Python",
        provider: "freeCodeCamp",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    intermediateResources: [
      {
        type: "course",
        title: "Harvard CS50 - Introduction to Computer Science",
        provider: "Harvard",
        cost: "free",
        difficulty: "intermediate",
        bhutanRelevant: false,
      },
    ],
    assessments: [
      {
        method: "project",
        description: "Build a working program that solves a problem",
        duration: "3 hours",
        passingCriteria: "Working code with proper logic",
      },
      {
        method: "quiz",
        description: "Programming concepts, algorithms, data structures",
        duration: "60 minutes",
        passingCriteria: "75% correct",
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "hard",
    bhutanDemand: "high",
    emerging: true,
    description: "Foundation for all technology and digital careers.",
  },
  {
    id: "python",
    name: "Python Programming",
    category: "technical",
    parentIds: ["programming"],
    relatedIds: ["data_science", "machine_learning", "web_development"],
    careerRequirements: [
      { careerId: "data_scientist", requiredLevel: "advanced", importance: "essential" },
      { careerId: "software_engineer", requiredLevel: "intermediate", importance: "important" },
      { careerId: "machine_learning_engineer", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "video",
        title: "Python for Beginners - Programming with Mosh",
        provider: "YouTube",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    intermediateResources: [
      {
        type: "course",
        title: "Python for Everybody - Coursera",
        provider: "Coursera",
        cost: "free",
        difficulty: "intermediate",
        bhutanRelevant: false,
      },
    ],
    assessments: [
      {
        method: "project",
        description: "Build a Python project (web scraper, data analysis tool, etc.)",
        duration: "6 hours",
        passingCriteria: "Working, documented code",
      },
    ],
    typicalDevelopmentTime: "3-6 months",
    difficulty: "medium",
    bhutanDemand: "high",
    emerging: true,
    description: "Most versatile programming language, used in AI, data science, and web development.",
  },
  {
    id: "javascript",
    name: "JavaScript Programming",
    category: "technical",
    parentIds: ["programming"],
    relatedIds: ["web_development", "frontend", "react"],
    careerRequirements: [
      { careerId: "web_developer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "software_engineer", requiredLevel: "intermediate", importance: "important" },
      { careerId: "mobile_developer", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "freeCodeCamp JavaScript",
        provider: "freeCodeCamp",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "project",
        description: "Build an interactive web application",
        duration: "6 hours",
        passingCriteria: "Working, responsive application",
      },
    ],
    typicalDevelopmentTime: "3-6 months",
    difficulty: "medium",
    bhutanDemand: "high",
    emerging: true,
    description: "Essential for web development, used on all modern websites.",
  },
  {
    id: "web_development",
    name: "Web Development",
    category: "technical",
    parentIds: ["programming", "javascript"],
    relatedIds: ["html_css", "frontend", "backend"],
    careerRequirements: [
      { careerId: "web_developer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "software_engineer", requiredLevel: "intermediate", importance: "important" },
      { careerId: "freelance_developer", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "freeCodeCamp Full Stack",
        provider: "freeCodeCamp",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "project",
        description: "Build and deploy a full-stack web application",
        duration: "20 hours",
        passingCriteria: "Deployed, functional application",
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "medium",
    bhutanDemand: "high",
    emerging: true,
    description: "Building websites and web applications - high demand skill in Bhutan.",
  },
  {
    id: "html_css",
    name: "HTML & CSS",
    category: "technical",
    parentIds: [],
    relatedIds: ["web_development", "frontend", "ui_design"],
    careerRequirements: [
      { careerId: "web_developer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "ui_ux_designer", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "freeCodeCamp HTML/CSS",
        provider: "freeCodeCamp",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "project",
        description: "Build a responsive webpage from scratch",
        duration: "4 hours",
        passingCriteria: "Valid HTML/CSS, responsive design",
      },
    ],
    typicalDevelopmentTime: "2-4 weeks",
    difficulty: "easy",
    bhutanDemand: "high",
    description: "Foundation of web development - markup and styling.",
  },
  {
    id: "sql",
    name: "SQL & Databases",
    category: "technical",
    parentIds: ["programming"],
    relatedIds: ["data_analysis", "backend", "data_science"],
    careerRequirements: [
      { careerId: "data_analyst", requiredLevel: "advanced", importance: "essential" },
      { careerId: "backend_developer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "software_engineer", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "SQLBolt - Interactive SQL Tutorial",
        provider: "SQLBolt",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "quiz",
        description: "Write SQL queries to retrieve and manipulate data",
        duration: "60 minutes",
        passingCriteria: "80% correct queries",
      },
    ],
    typicalDevelopmentTime: "4-6 weeks",
    difficulty: "medium",
    bhutanDemand: "high",
    description: "Querying and managing databases - essential for data work.",
  },
  {
    id: "data_analysis",
    name: "Data Analysis",
    category: "technical",
    parentIds: ["statistics", "excel", "sql"],
    relatedIds: ["data_science", "business_intelligence", "python"],
    careerRequirements: [
      { careerId: "data_analyst", requiredLevel: "advanced", importance: "essential" },
      { careerId: "business_analyst", requiredLevel: "advanced", importance: "essential" },
      { careerId: "data_scientist", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Google Data Analytics Certificate",
        provider: "Coursera",
        cost: "paid",
        difficulty: "beginner",
        bhutanRelevant: false,
      },
    ],
    assessments: [
      {
        method: "project",
        description: "Analyze a dataset and present findings",
        duration: "6 hours",
        passingCriteria: "Clear insights with data visualization",
      },
    ],
    typicalDevelopmentTime: "3-6 months",
    difficulty: "medium",
    bhutanDemand: "high",
    emerging: true,
    description: "Analyzing data to derive insights and support decision-making.",
  },
  {
    id: "excel",
    name: "Microsoft Excel",
    category: "technical",
    parentIds: [],
    relatedIds: ["data_analysis", "accounting", "business"],
    careerRequirements: [
      { careerId: "accountant", requiredLevel: "advanced", importance: "essential" },
      { careerId: "data_analyst", requiredLevel: "intermediate", importance: "important" },
      { careerId: "business_analyst", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Excel Skills - GCFLearnFree",
        provider: "GCFLearnFree",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "practical",
        description: "Complete Excel tasks (formulas, charts, pivot tables)",
        duration: "90 minutes",
        passingCriteria: "Correct completion of all tasks",
      },
    ],
    typicalDevelopmentTime: "2-6 weeks",
    difficulty: "easy",
    bhutanDemand: "high",
    description: "Spreadsheets for data organization, analysis, and reporting.",
  },
  {
    id: "machine_learning",
    name: "Machine Learning",
    category: "technical",
    parentIds: ["python", "statistics", "data_analysis"],
    relatedIds: ["data_science", "ai", "deep_learning"],
    careerRequirements: [
      { careerId: "data_scientist", requiredLevel: "advanced", importance: "essential" },
      { careerId: "machine_learning_engineer", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Machine Learning - Andrew Ng (Coursera)",
        provider: "Coursera",
        cost: "paid",
        difficulty: "intermediate",
        bhutanRelevant: false,
      },
    ],
    advancedResources: [
      {
        type: "course",
        title: "Deep Learning Specialization",
        provider: "Coursera",
        cost: "paid",
        difficulty: "advanced",
        bhutanRelevant: false,
      },
    ],
    assessments: [
      {
        method: "project",
        description: "Build and train a machine learning model",
        duration: "12 hours",
        passingCriteria: "Working model with accuracy metrics",
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "hard",
    bhutanDemand: "medium",
    emerging: true,
    description: "AI algorithms that learn from data - cutting-edge technology.",
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    category: "technical",
    parentIds: ["programming", "networking"],
    relatedIds: ["ethical_hacking", "information_security"],
    careerRequirements: [
      { careerId: "cybersecurity_specialist", requiredLevel: "advanced", importance: "essential" },
      { careerId: "ethical_hacker", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Introduction to Cybersecurity - Cisco",
        provider: "Cisco",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "certification",
        description: "CompTIA Security+ or similar certification",
        duration: "90 minutes exam",
        passingCriteria: "Passing score on certification exam",
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "hard",
    bhutanDemand: "medium",
    emerging: true,
    description: "Protecting systems and data from digital attacks.",
  },
  {
    id: "cloud_computing",
    name: "Cloud Computing (AWS/Azure)",
    category: "technical",
    parentIds: ["programming", "networking"],
    relatedIds: ["devops", "backend"],
    careerRequirements: [
      { careerId: "software_engineer", requiredLevel: "intermediate", importance: "important" },
      { careerId: "devops_engineer", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "AWS Cloud Practitioner Essentials",
        provider: "AWS",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: false,
      },
    ],
    assessments: [
      {
        method: "certification",
        description: "AWS Cloud Practitioner or Azure Fundamentals",
        duration: "90 minutes exam",
        passingCriteria: "Passing score on certification exam",
      },
    ],
    typicalDevelopmentTime: "3-6 months",
    difficulty: "medium",
    bhutanDemand: "medium",
    emerging: true,
    description: "Managing and deploying applications on cloud platforms.",
  },

  // ==========================================================================
  // SOFT SKILLS
  // ==========================================================================

  {
    id: "communication",
    name: "Communication",
    category: "soft",
    parentIds: [],
    relatedIds: ["public_speaking", "writing", "active_listening", "english_language"],
    careerRequirements: [
      { careerId: "teacher", requiredLevel: "advanced", importance: "essential" },
      { careerId: "sales", requiredLevel: "advanced", importance: "essential" },
      { careerId: "manager", requiredLevel: "advanced", importance: "essential" },
      { careerId: "customer_service", requiredLevel: "advanced", importance: "essential" },
      { careerId: "counselor", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Communication Skills - Coursera",
        provider: "Coursera",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "practical",
        description: "Present a topic and answer questions",
        duration: "10 minutes",
        passingCriteria: "Clear, organized communication",
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "medium",
    bhutanDemand: "high",
    description: "Effectively conveying information and ideas to others.",
  },
  {
    id: "teamwork",
    name: "Teamwork & Collaboration",
    category: "soft",
    parentIds: [],
    relatedIds: ["communication", "leadership", "conflict_resolution"],
    careerRequirements: [
      { careerId: "manager", requiredLevel: "advanced", importance: "essential" },
      { careerId: "software_engineer", requiredLevel: "intermediate", importance: "important" },
      { careerId: "teacher", requiredLevel: "intermediate", importance: "important" },
    ],
    assessments: [
      {
        method: "project",
        description: "Complete a group project with assigned roles",
        duration: "2 weeks",
        passingCriteria: "Successful project completion with peer feedback",
      },
    ],
    typicalDevelopmentTime: "Ongoing",
    difficulty: "medium",
    bhutanDemand: "high",
    description: "Working effectively with others toward common goals.",
  },
  {
    id: "problem_solving",
    name: "Problem Solving",
    category: "soft",
    parentIds: ["critical_thinking"],
    relatedIds: ["logical_thinking", "creativity", "mathematics"],
    careerRequirements: [
      { careerId: "software_engineer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "manager", requiredLevel: "advanced", importance: "essential" },
      { careerId: "entrepreneur", requiredLevel: "advanced", importance: "essential" },
      { careerId: "consultant", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Problem Solving Techniques - MindTools",
        provider: "MindTools",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "practical",
        description: "Solve a complex case study problem",
        duration: "60 minutes",
        passingCriteria: "Well-reasoned solution with alternatives considered",
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "medium",
    bhutanDemand: "high",
    description: "Identifying, analyzing, and solving complex problems.",
  },
  {
    id: "critical_thinking",
    name: "Critical Thinking",
    category: "soft",
    parentIds: [],
    relatedIds: ["problem_solving", "logical_thinking"],
    careerRequirements: [
      { careerId: "lawyer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "data_analyst", requiredLevel: "advanced", importance: "important" },
      { careerId: "consultant", requiredLevel: "advanced", importance: "essential" },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "medium",
    bhutanDemand: "high",
    description: "Objective analysis and evaluation of information and arguments.",
  },
  {
    id: "leadership",
    name: "Leadership",
    category: "soft",
    parentIds: ["communication", "teamwork"],
    relatedIds: ["management", "mentoring", "decision_making"],
    careerRequirements: [
      { careerId: "manager", requiredLevel: "advanced", importance: "essential" },
      { careerId: "entrepreneur", requiredLevel: "advanced", importance: "essential" },
      { careerId: "team_lead", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Leadership Skills - LinkedIn Learning",
        provider: "LinkedIn",
        cost: "paid",
        difficulty: "beginner",
        bhutanRelevant: false,
      },
    ],
    assessments: [
      {
        method: "practical",
        description: "Lead a team project or initiative",
        duration: "1-3 months",
        passingCriteria: "Successful project outcomes with positive team feedback",
      },
    ],
    typicalDevelopmentTime: "1-3 years",
    difficulty: "hard",
    bhutanDemand: "high",
    description: "Guiding and motivating others toward shared goals.",
  },
  {
    id: "time_management",
    name: "Time Management",
    category: "soft",
    parentIds: [],
    relatedIds: ["organization", "productivity", "planning"],
    careerRequirements: [
      { careerId: "manager", requiredLevel: "intermediate", importance: "important" },
      { careerId: "entrepreneur", requiredLevel: "advanced", importance: "essential" },
      { careerId: "student", requiredLevel: "intermediate", importance: "important" },
    ],
    typicalDevelopmentTime: "3-6 months",
    difficulty: "easy",
    bhutanDemand: "high",
    description: "Effectively organizing and prioritizing tasks and commitments.",
  },
  {
    id: "adaptability",
    name: "Adaptability",
    category: "soft",
    parentIds: [],
    relatedIds: ["lifelong_learning", "resilience"],
    careerRequirements: [
      { careerId: "software_engineer", requiredLevel: "intermediate", importance: "important" },
      { careerId: "entrepreneur", requiredLevel: "advanced", importance: "essential" },
    ],
    typicalDevelopmentTime: "Ongoing",
    difficulty: "medium",
    bhutanDemand: "high",
    description: "Adjusting to new conditions and handling change effectively.",
  },
  {
    id: "emotional_intelligence",
    name: "Emotional Intelligence",
    category: "soft",
    parentIds: [],
    relatedIds: ["empathy", "communication", "self_awareness"],
    careerRequirements: [
      { careerId: "counselor", requiredLevel: "advanced", importance: "essential" },
      { careerId: "teacher", requiredLevel: "intermediate", importance: "important" },
      { careerId: "manager", requiredLevel: "advanced", importance: "important" },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "medium",
    bhutanDemand: "high",
    description: "Understanding and managing emotions in oneself and others.",
  },
  {
    id: "public_speaking",
    name: "Public Speaking",
    category: "soft",
    parentIds: ["communication"],
    relatedIds: ["presentation_skills", "confidence"],
    careerRequirements: [
      { careerId: "teacher", requiredLevel: "advanced", importance: "essential" },
      { careerId: "sales", requiredLevel: "advanced", importance: "important" },
      { careerId: "politician", requiredLevel: "advanced", importance: "essential" },
    ],
    assessments: [
      {
        method: "practical",
        description: "Deliver a presentation to an audience",
        duration: "5-10 minutes",
        passingCriteria: "Clear delivery, good structure, audience engagement",
      },
    ],
    typicalDevelopmentTime: "3-6 months",
    difficulty: "medium",
    bhutanDemand: "medium",
    description: "Speaking effectively to groups and audiences.",
  },
  {
    id: "negotiation",
    name: "Negotiation",
    category: "soft",
    parentIds: ["communication", "emotional_intelligence"],
    relatedIds: ["persuasion", "conflict_resolution"],
    careerRequirements: [
      { careerId: "sales", requiredLevel: "advanced", importance: "essential" },
      { careerId: "manager", requiredLevel: "intermediate", importance: "important" },
      { careerId: "lawyer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "entrepreneur", requiredLevel: "intermediate", importance: "important" },
    ],
    typicalDevelopmentTime: "3-6 months",
    difficulty: "medium",
    bhutanDemand: "medium",
    description: "Reaching mutually beneficial agreements through discussion.",
  },

  // ==========================================================================
  // CREATIVE SKILLS
  // ==========================================================================

  {
    id: "graphic_design",
    name: "Graphic Design",
    category: "creative",
    parentIds: [],
    relatedIds: ["ui_ux_design", "visual_communication", "creativity"],
    careerRequirements: [
      { careerId: "graphic_designer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "ui_ux_designer", requiredLevel: "intermediate", importance: "important" },
      { careerId: "marketing_specialist", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Canva Design School",
        provider: "Canva",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
      {
        type: "course",
        title: "Google UX Design Certificate",
        provider: "Coursera",
        cost: "paid",
        difficulty: "beginner",
        bhutanRelevant: false,
      },
    ],
    intermediateResources: [
      {
        type: "tool",
        title: "Figma - Free Design Tool",
        provider: "Figma",
        cost: "freemium",
        difficulty: "intermediate",
        bhutanRelevant: true,
      },
      {
        type: "tool",
        title: "Adobe Creative Suite",
        provider: "Adobe",
        cost: "paid",
        difficulty: "intermediate",
        bhutanRelevant: false,
      },
    ],
    assessments: [
      {
        method: "project",
        description: "Create a design portfolio piece",
        duration: "4 hours",
        passingCriteria: "Professional quality design with proper principles",
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "medium",
    bhutanDemand: "medium",
    description: "Creating visual content for communication and marketing.",
  },
  {
    id: "ui_ux_design",
    name: "UI/UX Design",
    category: "creative",
    parentIds: ["graphic_design", "empathy"],
    relatedIds: ["web_development", "product_management", "research"],
    careerRequirements: [
      { careerId: "ui_ux_designer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "product_manager", requiredLevel: "intermediate", importance: "important" },
      { careerId: "web_developer", requiredLevel: "beginner", importance: "helpful" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Google UX Design Certificate",
        provider: "Coursera",
        cost: "paid",
        difficulty: "beginner",
        bhutanRelevant: false,
      },
    ],
    assessments: [
      {
        method: "project",
        description: "Design a complete app interface with user flow",
        duration: "12 hours",
        passingCriteria: "Well-designed, user-friendly interface",
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "medium",
    bhutanDemand: "medium",
    emerging: true,
    description: "Designing user interfaces and experiences for digital products.",
  },
  {
    id: "video_editing",
    name: "Video Editing",
    category: "creative",
    parentIds: [],
    relatedIds: ["content_creation", "storytelling", "graphic_design"],
    careerRequirements: [
      { careerId: "video_editor", requiredLevel: "advanced", importance: "essential" },
      { careerId: "content_creator", requiredLevel: "intermediate", importance: "important" },
      { careerId: "marketing_specialist", requiredLevel: "intermediate", importance: "helpful" },
    ],
    beginnerResources: [
      {
        type: "tool",
        title: "DaVinci Resolve - Free Video Editor",
        provider: "Blackmagic",
        cost: "free",
        difficulty: "intermediate",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "project",
        description: "Edit a short video with transitions and effects",
        duration: "4 hours",
        passingCriteria: "Professional quality edit with good pacing",
      },
    ],
    typicalDevelopmentTime: "3-6 months",
    difficulty: "medium",
    bhutanDemand: "medium",
    emerging: true,
    description: "Editing and producing video content for various platforms.",
  },
  {
    id: "content_writing",
    name: "Content Writing",
    category: "creative",
    parentIds: ["english_language", "writing"],
    relatedIds: ["marketing", "journalism", "storytelling"],
    careerRequirements: [
      { careerId: "content_writer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "journalist", requiredLevel: "advanced", importance: "important" },
      { careerId: "marketing_specialist", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Content Marketing - HubSpot Academy",
        provider: "HubSpot",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "project",
        description: "Write a blog post or article on a given topic",
        duration: "2 hours",
        passingCriteria: "Well-structured, engaging content",
      },
    ],
    typicalDevelopmentTime: "3-6 months",
    difficulty: "easy",
    bhutanDemand: "medium",
    emerging: true,
    description: "Creating written content for websites, blogs, and marketing.",
  },
  {
    id: "photography",
    name: "Photography",
    category: "creative",
    parentIds: [],
    relatedIds: ["graphic_design", "visual_composition", "content_creation"],
    careerRequirements: [
      { careerId: "photographer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "content_creator", requiredLevel: "intermediate", importance: "important" },
      { careerId: "marketing_specialist", requiredLevel: "beginner", importance: "helpful" },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "medium",
    bhutanDemand: "low",
    description: "Capturing and editing photographs for various purposes.",
  },
  {
    id: "music",
    name: "Music Performance",
    category: "creative",
    parentIds: [],
    relatedIds: ["creativity", "performance", "cultural_preservation"],
    careerRequirements: [
      { careerId: "musician", requiredLevel: "expert", importance: "essential" },
      { careerId: "music_teacher", requiredLevel: "advanced", importance: "essential" },
    ],
    typicalDevelopmentTime: "5-10 years",
    difficulty: "hard",
    bhutanDemand: "low",
    description: "Performing music vocally or with instruments.",
  },
  {
    id: "traditional_crafts",
    name: "Traditional Bhutanese Crafts",
    category: "creative",
    parentIds: [],
    relatedIds: ["cultural_preservation", "artistic_skills"],
    careerRequirements: [
      { careerId: "artisan", requiredLevel: "advanced", importance: "essential" },
      { careerId: "tour_guide", requiredLevel: "beginner", importance: "helpful" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Traditional Arts Training - Zorig Chusum",
        provider: "Institutes in Bhutan",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    typicalDevelopmentTime: "2-5 years",
    difficulty: "hard",
    bhutanDemand: "medium",
    bhutanSpecific: true,
    description: "Traditional Bhutanese arts including painting, weaving, woodcarving.",
  },

  // ==========================================================================
  // VOCATIONAL SKILLS
  // ==========================================================================

  {
    id: "carpentry",
    name: "Carpentry",
    category: "vocational",
    parentIds: [],
    relatedIds: ["construction", "woodworking", "technical_skills"],
    careerRequirements: [
      { careerId: "carpenter", requiredLevel: "advanced", importance: "essential" },
      { careerId: "construction_worker", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Technical Training Institute - Carpentry",
        provider: "TTI Bhutan",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "practical",
        description: "Complete a carpentry project",
        duration: "20 hours",
        passingCriteria: "Quality work meeting specifications",
      },
    ],
    typicalDevelopmentTime: "1-2 years",
    difficulty: "medium",
    bhutanDemand: "medium",
    description: "Working with wood to construct and repair structures and furniture.",
  },
  {
    id: "electrical",
    name: "Electrical Work",
    category: "vocational",
    parentIds: [],
    relatedIds: ["construction", "technical_skills", "science_physics"],
    careerRequirements: [
      { careerId: "electrician", requiredLevel: "advanced", importance: "essential" },
      { careerId: "electrical_engineer", requiredLevel: "beginner", importance: "helpful" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Technical Training Institute - Electrical",
        provider: "TTI Bhutan",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "certification",
        description: "Electrician certification exam",
        duration: "2 hours",
        passingCriteria: "Pass certification exam",
      },
    ],
    typicalDevelopmentTime: "1-2 years",
    difficulty: "hard",
    bhutanDemand: "high",
    description: "Installing and maintaining electrical systems.",
  },
  {
    id: "plumbing",
    name: "Plumbing",
    category: "vocational",
    parentIds: [],
    relatedIds: ["construction", "technical_skills"],
    careerRequirements: [
      { careerId: "plumber", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Technical Training Institute - Plumbing",
        provider: "TTI Bhutan",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    typicalDevelopmentTime: "1-2 years",
    difficulty: "medium",
    bhutanDemand: "medium",
    description: "Installing and maintaining water systems and fixtures.",
  },
  {
    id: "welding",
    name: "Welding",
    category: "vocational",
    parentIds: [],
    relatedIds: ["construction", "metalworking", "technical_skills"],
    careerRequirements: [
      { careerId: "welder", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Technical Training Institute - Welding",
        provider: "TTI Bhutan",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "hard",
    bhutanDemand: "medium",
    description: "Joining metal parts using heat and pressure.",
  },
  {
    id: "automotive",
    name: "Automotive Mechanics",
    category: "vocational",
    parentIds: [],
    relatedIds: ["technical_skills", "problem_solving"],
    careerRequirements: [
      { careerId: "auto_mechanic", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Technical Training Institute - Automotive",
        provider: "TTI Bhutan",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    typicalDevelopmentTime: "1-2 years",
    difficulty: "medium",
    bhutanDemand: "medium",
    description: "Repairing and maintaining vehicles.",
  },
  {
    id: "hospitality",
    name: "Hospitality Services",
    category: "vocational",
    parentIds: ["communication", "customer_service"],
    relatedIds: ["tourism", "management", "languages"],
    careerRequirements: [
      { careerId: "hotel_staff", requiredLevel: "intermediate", importance: "essential" },
      { careerId: "tour_guide", requiredLevel: "intermediate", importance: "important" },
      { careerId: "event_planner", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Hospitality Training - RTI Bhutan",
        provider: "Royal Institute of Tourism",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    typicalDevelopmentTime: "3-6 months",
    difficulty: "easy",
    bhutanDemand: "high",
    description: "Providing excellent service in hotels, restaurants, and tourism.",
  },
  {
    id: "food_service",
    name: "Food Preparation & Culinary Arts",
    category: "vocational",
    parentIds: [],
    relatedIds: ["hospitality", "creativity"],
    careerRequirements: [
      { careerId: "chef", requiredLevel: "advanced", importance: "essential" },
      { careerId: "restaurant_staff", requiredLevel: "intermediate", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Culinary Training - RTI Bhutan",
        provider: "Royal Institute of Tourism",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "medium",
    bhutanDemand: "medium",
    description: "Preparing food and managing kitchen operations.",
  },

  // ==========================================================================
  // SERVICE SKILLS
  // ==========================================================================

  {
    id: "teaching",
    name: "Teaching & Pedagogy",
    category: "service",
    parentIds: ["communication", "subject_matter_expertise"],
    relatedIds: ["mentoring", "presentation", "emotional_intelligence"],
    careerRequirements: [
      { careerId: "teacher", requiredLevel: "advanced", importance: "essential" },
      { careerId: "professor", requiredLevel: "advanced", importance: "essential" },
      { careerId: "trainer", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "B.Ed Program - Paro College of Education",
        provider: "RUB",
        cost: "paid",
        difficulty: "intermediate",
        bhutanRelevant: true,
      },
    ],
    assessments: [
      {
        method: "practical",
        description: "Deliver a teaching demonstration",
        duration: "30 minutes",
        passingCriteria: "Effective lesson delivery with student engagement",
      },
    ],
    typicalDevelopmentTime: "2-4 years",
    difficulty: "medium",
    bhutanDemand: "high",
    description: "Educating and facilitating learning for others.",
  },
  {
    id: "counseling",
    name: "Counseling & Guidance",
    category: "service",
    parentIds: ["emotional_intelligence", "empathy", "active_listening"],
    relatedIds: ["psychology", "communication"],
    careerRequirements: [
      { careerId: "counselor", requiredLevel: "advanced", importance: "essential" },
      { careerId: "psychologist", requiredLevel: "advanced", importance: "essential" },
      { careerId: "social_worker", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Counseling Psychology - Sherubtse College",
        provider: "RUB",
        cost: "paid",
        difficulty: "intermediate",
        bhutanRelevant: true,
      },
    ],
    typicalDevelopmentTime: "2-4 years",
    difficulty: "hard",
    bhutanDemand: "medium",
    description: "Providing guidance and support for personal and emotional challenges.",
  },
  {
    id: "healthcare_assistance",
    name: "Healthcare Assistance",
    category: "service",
    parentIds: ["empathy", "basic_medical_knowledge"],
    relatedIds: ["patient_care", "communication", "teamwork"],
    careerRequirements: [
      { careerId: "nurse", requiredLevel: "intermediate", importance: "essential" },
      { careerId: "caregiver", requiredLevel: "intermediate", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Healthcare Assistant Training",
        provider: "JDWNRH",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "medium",
    bhutanDemand: "medium",
    description: "Providing basic care and support to patients.",
  },
  {
    id: "customer_service",
    name: "Customer Service",
    category: "service",
    parentIds: ["communication", "patience", "problem_solving"],
    relatedIds: ["sales", "hospitality"],
    careerRequirements: [
      { careerId: "customer_service_rep", requiredLevel: "intermediate", importance: "essential" },
      { careerId: "sales", requiredLevel: "intermediate", importance: "important" },
      { careerId: "hospitality", requiredLevel: "intermediate", importance: "important" },
    ],
    typicalDevelopmentTime: "1-3 months",
    difficulty: "easy",
    bhutanDemand: "high",
    description: "Assisting customers and resolving their issues professionally.",
  },
  {
    id: "social_work",
    name: "Social Work",
    category: "service",
    parentIds: ["empathy", "communication", "problem_solving"],
    relatedIds: ["community_service", "counseling", "advocacy"],
    careerRequirements: [
      { careerId: "social_worker", requiredLevel: "advanced", importance: "essential" },
      { careerId: "ngo_worker", requiredLevel: "intermediate", importance: "important" },
    ],
    typicalDevelopmentTime: "2-4 years",
    difficulty: "medium",
    bhutanDemand: "medium",
    description: "Helping individuals and communities improve their well-being.",
  },
  {
    id: "agriculture",
    name: "Agriculture & Farming",
    category: "service",
    parentIds: [],
    relatedIds: ["science_biology", "environmental_science", "business"],
    careerRequirements: [
      { careerId: "farmer", requiredLevel: "intermediate", importance: "essential" },
      { careerId: "agriculture_specialist", requiredLevel: "advanced", importance: "essential" },
      { careerId: "agri_entrepreneur", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Agriculture Programs - CNR",
        provider: "College of Natural Resources",
        cost: "paid",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    typicalDevelopmentTime: "6 months - 4 years",
    difficulty: "medium",
    bhutanDemand: "high",
    description: "Cultivating crops and raising livestock for food production.",
  },

  // ==========================================================================
  // EMERGING SKILLS
  // ==========================================================================

  {
    id: "ai_prompting",
    name: "AI Prompt Engineering",
    category: "emerging",
    parentIds: ["communication", "logical_thinking"],
    relatedIds: ["ai", "programming", "writing"],
    careerRequirements: [
      { careerId: "ai_specialist", requiredLevel: "intermediate", importance: "important" },
      { careerId: "content_creator", requiredLevel: "beginner", importance: "helpful" },
      { careerId: "software_engineer", requiredLevel: "beginner", importance: "helpful" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Prompt Engineering Guide",
        provider: "Various online",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    typicalDevelopmentTime: "2-4 weeks",
    difficulty: "easy",
    bhutanDemand: "medium",
    emerging: true,
    description: "Effectively communicating with AI systems to get desired outputs.",
  },
  {
    id: "data_visualization",
    name: "Data Visualization",
    category: "emerging",
    parentIds: ["data_analysis", "graphic_design"],
    relatedIds: ["storytelling", "statistics", "communication"],
    careerRequirements: [
      { careerId: "data_analyst", requiredLevel: "intermediate", importance: "important" },
      { careerId: "business_analyst", requiredLevel: "intermediate", importance: "important" },
      { careerId: "journalist", requiredLevel: "beginner", importance: "helpful" },
    ],
    beginnerResources: [
      {
        type: "tool",
        title: "Tableau Public",
        provider: "Tableau",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    typicalDevelopmentTime: "4-6 weeks",
    difficulty: "medium",
    bhutanDemand: "medium",
    emerging: true,
    description: "Presenting data in visual formats for better understanding.",
  },
  {
    id: "digital_marketing",
    name: "Digital Marketing",
    category: "emerging",
    parentIds: ["marketing", "content_writing", "data_analysis"],
    relatedIds: ["social_media", "seo", "advertising"],
    careerRequirements: [
      { careerId: "digital_marketer", requiredLevel: "advanced", importance: "essential" },
      { careerId: "marketing_specialist", requiredLevel: "intermediate", importance: "important" },
      { careerId: "entrepreneur", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Google Digital Garage - Digital Marketing",
        provider: "Google",
        cost: "free",
        difficulty: "beginner",
        bhutanRelevant: true,
      },
    ],
    typicalDevelopmentTime: "3-6 months",
    difficulty: "medium",
    bhutanDemand: "high",
    emerging: true,
    description: "Promoting products and services through digital channels.",
  },
  {
    id: "social_media",
    name: "Social Media Management",
    category: "emerging",
    parentIds: ["content_creation", "communication", "digital_marketing"],
    relatedIds: ["marketing", "content_writing", "graphic_design"],
    careerRequirements: [
      { careerId: "social_media_manager", requiredLevel: "advanced", importance: "essential" },
      { careerId: "digital_marketer", requiredLevel: "intermediate", importance: "important" },
      { careerId: "content_creator", requiredLevel: "intermediate", importance: "important" },
    ],
    typicalDevelopmentTime: "2-4 months",
    difficulty: "easy",
    bhutanDemand: "medium",
    emerging: true,
    description: "Managing and creating content for social media platforms.",
  },
  {
    id: "blockchain",
    name: "Blockchain Development",
    category: "emerging",
    parentIds: ["programming", "cryptography"],
    relatedIds: ["web_development", "security"],
    careerRequirements: [
      { careerId: "blockchain_developer", requiredLevel: "advanced", importance: "essential" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Blockchain Basics - Coursera",
        provider: "Coursera",
        cost: "paid",
        difficulty: "intermediate",
        bhutanRelevant: false,
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "hard",
    bhutanDemand: "low",
    emerging: true,
    description: "Developing decentralized applications and smart contracts.",
  },
  {
    id: "green_tech",
    name: "Green Technology",
    category: "emerging",
    parentIds: ["science_physics", "engineering"],
    relatedIds: ["renewable_energy", "environmental_science", "sustainability"],
    careerRequirements: [
      { careerId: "renewable_energy_specialist", requiredLevel: "advanced", importance: "essential" },
      { careerId: "environmental_scientist", requiredLevel: "intermediate", importance: "important" },
    ],
    beginnerResources: [
      {
        type: "course",
        title: "Renewable Energy Courses",
        provider: "Various",
        cost: "free",
        difficulty: "intermediate",
        bhutanRelevant: true,
      },
    ],
    typicalDevelopmentTime: "6-12 months",
    difficulty: "hard",
    bhutanDemand: "medium",
    emerging: true,
    description: "Developing and implementing sustainable technology solutions.",
  },
  {
    id: "drone_pilot",
    name: "Drone Operation",
    category: "emerging",
    parentIds: [],
    relatedIds: ["aviation", "photography", "technology"],
    careerRequirements: [
      { careerId: "drone_operator", requiredLevel: "advanced", importance: "essential" },
    ],
    typicalDevelopmentTime: "1-3 months",
    difficulty: "medium",
    bhutanDemand: "low",
    emerging: true,
    description: "Operating drones for photography, surveying, or inspections.",
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get skill by ID
 */
export function getSkillById(id: string): OntologySkill | undefined {
  return skillsOntology.find((skill) => skill.id === id);
}

/**
 * Get skills by category
 */
export function getSkillsByCategory(category: SkillCategory): OntologySkill[] {
  return skillsOntology.filter((skill) => skill.category === category);
}

/**
 * Get skills by demand level
 */
export function getSkillsByDemand(demand: "high" | "medium" | "low"): OntologySkill[] {
  return skillsOntology.filter((skill) => skill.bhutanDemand === demand);
}

/**
 * Get emerging skills
 */
export function getEmergingSkills(): OntologySkill[] {
  return skillsOntology.filter((skill) => skill.emerging === true);
}

/**
 * Get Bhutan-specific skills
 */
export function getBhutanSkills(): OntologySkill[] {
  return skillsOntology.filter((skill) =>
    (skill as any).bhutanSpecific === true
  );
}

/**
 * Get skills required for a career
 */
export function getSkillsForCareer(careerId: string): Array<OntologySkill & { requirement: CareerRequirement }> {
  const results: Array<OntologySkill & { requirement: CareerRequirement }> = [];

  for (const skill of skillsOntology) {
    if (skill.careerRequirements) {
      const requirement = skill.careerRequirements.find((cr) => cr.careerId === careerId);
      if (requirement) {
        results.push({ ...skill, requirement });
      }
    }
  }

  // Sort by importance and required level
  results.sort((a, b) => {
    const importanceOrder = { essential: 3, important: 2, helpful: 1 };
    const levelOrder = { expert: 4, advanced: 3, intermediate: 2, beginner: 1 };

    if (importanceOrder[a.requirement.importance] !== importanceOrder[b.requirement.importance]) {
      return importanceOrder[b.requirement.importance] - importanceOrder[a.requirement.importance];
    }
    return levelOrder[b.requirement.requiredLevel] - levelOrder[a.requirement.requiredLevel];
  });

  return results;
}

/**
 * Get prerequisites for a skill (recursively gets all parent skills)
 */
export function getSkillPrerequisites(skillId: string, visited = new Set<string>()): OntologySkill[] {
  if (visited.has(skillId)) return [];
  visited.add(skillId);

  const skill = getSkillById(skillId);
  if (!skill || !skill.parentIds || skill.parentIds.length === 0) return [];

  const prerequisites: OntologySkill[] = [];
  for (const parentId of skill.parentIds) {
    const parent = getSkillById(parentId);
    if (parent) {
      prerequisites.push(parent);
      prerequisites.push(...getSkillPrerequisites(parentId, visited));
    }
  }

  return prerequisites;
}

/**
 * Get learning path for a skill (resources ordered by difficulty)
 */
export function getLearningPath(skillId: string): SkillResource[] {
  const skill = getSkillById(skillId);
  if (!skill) return [];

  const resources: SkillResource[] = [];

  // Add beginner resources
  if (skill.beginnerResources) {
    resources.push(...skill.beginnerResources);
  } else if (skill.resources) {
    resources.push(...skill.resources.filter((r) => r.difficulty === "beginner"));
  }

  // Add intermediate resources
  if (skill.intermediateResources) {
    resources.push(...skill.intermediateResources);
  } else if (skill.resources) {
    resources.push(...skill.resources.filter((r) => r.difficulty === "intermediate"));
  }

  // Add advanced resources
  if (skill.advancedResources) {
    resources.push(...skill.advancedResources);
  } else if (skill.resources) {
    resources.push(...skill.resources.filter((r) => r.difficulty === "advanced"));
  }

  return resources;
}

/**
 * Get recommended skills based on RIASEC code
 */
export function getSkillsByRIASEC(riasecCode: string): OntologySkill[] {
  // Map RIASEC codes to skill categories
  const riasecSkillMap: Record<string, SkillCategory[]> = {
    R: ["vocational", "technical"],
    I: ["academic", "technical", "emerging"],
    A: ["creative"],
    S: ["service", "soft"],
    E: ["soft"],
    C: ["technical", "academic"],
  };

  const categories = riasecSkillMap[riasecCode.toUpperCase()] || [];
  const skills: OntologySkill[] = [];

  for (const category of categories) {
    skills.push(...getSkillsByCategory(category));
  }

  return skills;
}

/**
 * Get skills by difficulty
 */
export function getSkillsByDifficulty(difficulty: "easy" | "medium" | "hard"): OntologySkill[] {
  return skillsOntology.filter((skill) => skill.difficulty === difficulty);
}

/**
 * Search skills by keyword
 */
export function searchSkills(keyword: string): OntologySkill[] {
  const lowerKeyword = keyword.toLowerCase();
  return skillsOntology.filter((skill) =>
    skill.name.toLowerCase().includes(lowerKeyword) ||
    skill.description.toLowerCase().includes(lowerKeyword) ||
    skill.id.includes(lowerKeyword)
  );
}

/**
 * Get skill development recommendations based on current level and target
 */
export interface SkillDevelopmentStep {
  skillId: string;
  skillName: string;
  currentLevel?: ProficiencyLevel;
  targetLevel: ProficiencyLevel;
  estimatedTime: string;
  resources: SkillResource[];
  prerequisites: OntologySkill[];
  assessments: SkillAssessment[];
}

export function getSkillDevelopmentPlan(
  skillId: string,
  currentLevel?: ProficiencyLevel,
  targetLevel: ProficiencyLevel = "advanced"
): SkillDevelopmentStep | null {
  const skill = getSkillById(skillId);
  if (!skill) return null;

  const prerequisites = getSkillPrerequisites(skillId);
  const resources = getLearningPath(skillId);
  const assessments = skill.assessments || [];

  return {
    skillId: skill.id,
    skillName: skill.name,
    currentLevel,
    targetLevel,
    estimatedTime: skill.typicalDevelopmentTime,
    resources,
    prerequisites,
    assessments,
  };
}

/**
 * Get all skill categories
 */
export function getSkillCategories(): SkillCategory[] {
  const categories = new Set(skillsOntology.map((skill) => skill.category));
  return Array.from(categories);
}

/**
 * Get skills gap analysis for a career
 */
export interface SkillsGap {
  skillId: string;
  skillName: string;
  requiredLevel: ProficiencyLevel;
  currentLevel?: ProficiencyLevel;
  gap: "none" | "partial" | "full";
  importance: "essential" | "important" | "helpful";
  resources: SkillResource[];
}

export function getSkillsGapForCareer(
  careerId: string,
  currentSkills: Array<{ skillId: string; level: ProficiencyLevel }>
): SkillsGap[] {
  const requiredSkills = getSkillsForCareer(careerId);
  const gaps: SkillsGap[] = [];

  for (const { requirement, ...skill } of requiredSkills) {
    const current = currentSkills.find((cs) => cs.skillId === skill.id);

    let gap: "none" | "partial" | "full" = "full";
    if (current) {
      const levels = ["beginner", "intermediate", "advanced", "expert"];
      const currentIdx = levels.indexOf(current.level);
      const requiredIdx = levels.indexOf(requirement.requiredLevel);

      if (currentIdx >= requiredIdx) {
        gap = "none";
      } else if (currentIdx >= requiredIdx - 1) {
        gap = "partial";
      }
    }

    gaps.push({
      skillId: skill.id,
      skillName: skill.name,
      requiredLevel: requirement.requiredLevel,
      currentLevel: current?.level,
      gap,
      importance: requirement.importance,
      resources: getLearningPath(skill.id),
    });
  }

  return gaps;
}
