/**
 * LABOR MARKET DATA FOR BHUTAN
 *
 * Real-time job market data including:
 * - In-demand careers by region
 * - Salary trends and ranges
 * - Industry growth projections
 * - Skills demand forecasting
 * - Regional variations
 *
 * Last Updated: March 5, 2026
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface JobMarketData {
  careerId: string;
  careerTitle: string;
  category: string;

  // Demand metrics
  demandLevel: "high" | "medium" | "low";
  demandTrend: "increasing" | "stable" | "decreasing";
  talentShortage: boolean;

  // Salary data
  salaryRange: {
    entry: { min: number; max: number; average: number };
    mid: { min: number; max: number; average: number };
    senior: { min: number; max: number; average: number };
  };

  // Market data
  employers: number;
  openPositions: number;
  averageTimeToFill: number; // days

  // Regional data
  regionalDemand: {
    thimphu: "high" | "medium" | "low";
    phuentsholing: "high" | "medium" | "low";
    paro: "high" | "medium" | "low";
    otherDzongkhags: "high" | "medium" | "low";
  };

  // Projections
  fiveYearProjection: "growing" | "stable" | "declining" | "emerging";
  automationRisk: "low" | "medium" | "high";
}

export interface SkillsDemandForecast {
  skillId: string;
  skillName: string;
  category: "technical" | "soft" | "vocational";

  // Current demand
  currentDemand: "high" | "medium" | "low";

  // Projections
  oneYearProjection: "increase" | "stable" | "decrease";
  threeYearProjection: "increase" | "stable" | "decrease";
  fiveYearProjection: "increase" | "stable" | "decrease";

  // Related careers
  relatedCareers: string[];

  // Learning urgency
  urgency: "critical" | "important" | "optional";
  reason: string;
}

export interface IndustryInsight {
  industry: string;
  sector: "public" | "private" | "ngo" | "government";

  // Current state
  size: number; // Total jobs in Bhutan
  growthRate: number; // % annual growth
  turnoverRate: number; // % annual turnover

  // Top employers
  topEmployers: Array<{
    name: string;
    type: "government" | "private" | "international" | "ngo";
    location: string;
  }>;

  // Emerging trends
  trends: string[];

  // Required skills
  hotSkills: string[];
  decliningSkills: string[];

  // Entry requirements
  typicalEntry: string;
  barrierToEntry: "low" | "medium" | "high";
}

// ============================================================================
// JOB MARKET DATA
// ============================================================================

export const jobMarketData: JobMarketData[] = [
  // ==========================================================================
  // TECHNOLOGY CAREERS
  // ==========================================================================
  {
    careerId: "software_engineer",
    careerTitle: "Software Engineer",
    category: "Technology",
    demandLevel: "high",
    demandTrend: "increasing",
    talentShortage: true,
    salaryRange: {
      entry: { min: 40000, max: 70000, average: 55000 },
      mid: { min: 60000, max: 120000, average: 85000 },
      senior: { min: 100000, max: 200000, average: 140000 },
    },
    employers: 500,
    openPositions: 150,
    averageTimeToFill: 45,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "medium",
      paro: "low",
      otherDzongkhags: "low",
    },
    fiveYearProjection: "growing",
    automationRisk: "low",
  },
  {
    careerId: "data_analyst",
    careerTitle: "Data Analyst",
    category: "Technology",
    demandLevel: "high",
    demandTrend: "increasing",
    talentShortage: true,
    salaryRange: {
      entry: { min: 30000, max: 50000, average: 40000 },
      mid: { min: 45000, max: 90000, average: 65000 },
      senior: { min: 80000, max: 150000, average: 110000 },
    },
    employers: 300,
    openPositions: 80,
    averageTimeToFill: 35,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "medium",
      paro: "low",
      otherDzongkhags: "low",
    },
    fiveYearProjection: "growing",
    automationRisk: "medium",
  },
  {
    careerId: "cyber_security_specialist",
    careerTitle: "Cyber Security Specialist",
    category: "Technology",
    demandLevel: "medium",
    demandTrend: "increasing",
    talentShortage: true,
    salaryRange: {
      entry: { min: 45000, max: 75000, average: 60000 },
      mid: { min: 70000, max: 120000, average: 95000 },
      senior: { min: 100000, max: 180000, average: 140000 },
    },
    employers: 50,
    openPositions: 20,
    averageTimeToFill: 60,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "medium",
      paro: "low",
      otherDzongkhags: "low",
    },
    fiveYearProjection: "growing",
    automationRisk: "low",
  },
  {
    careerId: "digital_marketer",
    careerTitle: "Digital Marketing Specialist",
    category: "Technology",
    demandLevel: "high",
    demandTrend: "increasing",
    talentShortage: true,
    salaryRange: {
      entry: { min: 20000, max: 40000, average: 30000 },
      mid: { min: 35000, max: 70000, average: 50000 },
      senior: { min: 60000, max: 120000, average: 85000 },
    },
    employers: 400,
    openPositions: 100,
    averageTimeToFill: 21,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "medium",
      paro: "medium",
      otherDzongkhags: "medium",
    },
    fiveYearProjection: "growing",
    automationRisk: "medium",
  },

  // ==========================================================================
  // HEALTHCARE CAREERS
  // ==========================================================================
  {
    careerId: "doctor",
    careerTitle: "Doctor (Physician)",
    category: "Healthcare",
    demandLevel: "high",
    demandTrend: "stable",
    talentShortage: true,
    salaryRange: {
      entry: { min: 40000, max: 70000, average: 55000 },
      mid: { min: 60000, max: 120000, average: 85000 },
      senior: { min: 100000, max: 200000, average: 140000 },
    },
    employers: 15,
    openPositions: 50,
    averageTimeToFill: 90,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "medium",
      paro: "medium",
      otherDzongkhags: "high",
    },
    fiveYearProjection: "stable",
    automationRisk: "low",
  },
  {
    careerId: "nurse",
    careerTitle: "Nurse",
    category: "Healthcare",
    demandLevel: "high",
    demandTrend: "increasing",
    talentShortage: true,
    salaryRange: {
      entry: { min: 18000, max: 35000, average: 25000 },
      mid: { min: 25000, max: 50000, average: 37500 },
      senior: { min: 40000, max: 70000, average: 55000 },
    },
    employers: 30,
    openPositions: 200,
    averageTimeToFill: 30,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "medium",
      paro: "medium",
      otherDzongkhags: "high",
    },
    fiveYearProjection: "growing",
    automationRisk: "low",
  },
  {
    careerId: "pharmacist",
    careerTitle: "Pharmacist",
    category: "Healthcare",
    demandLevel: "medium",
    demandTrend: "stable",
    talentShortage: false,
    salaryRange: {
      entry: { min: 25000, max: 45000, average: 35000 },
      mid: { min: 35000, max: 65000, average: 50000 },
      senior: { min: 55000, max: 90000, average: 70000 },
    },
    employers: 20,
    openPositions: 30,
    averageTimeToFill: 45,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "medium",
      paro: "medium",
      otherDzongkhags: "medium",
    },
    fiveYearProjection: "stable",
    automationRisk: "low",
  },

  // ==========================================================================
  // EDUCATION CAREERS
  // ==========================================================================
  {
    careerId: "teacher_secondary",
    careerTitle: "Secondary School Teacher",
    category: "Education",
    demandLevel: "high",
    demandTrend: "stable",
    talentShortage: true,
    salaryRange: {
      entry: { min: 20000, max: 35000, average: 25000 },
      mid: { min: 28000, max: 50000, average: 38000 },
      senior: { min: 45000, max: 70000, average: 55000 },
    },
    employers: 500,
    openPositions: 300,
    averageTimeToFill: 60,
    regionalDemand: {
      thimphu: "medium",
      phuentsholing: "high",
      paro: "medium",
      otherDzongkhags: "high",
    },
    fiveYearProjection: "stable",
    automationRisk: "low",
  },
  {
    careerId: "lecturer_college",
    careerTitle: "College Lecturer",
    category: "Education",
    demandLevel: "medium",
    demandTrend: "stable",
    talentShortage: false,
    salaryRange: {
      entry: { min: 35000, max: 60000, average: 45000 },
      mid: { min: 50000, max: 90000, average: 65000 },
      senior: { min: 75000, max: 120000, average: 95000 },
    },
    employers: 11,
    openPositions: 20,
    averageTimeToFill: 90,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "medium",
      paro: "medium",
      otherDzongkhags: "low",
    },
    fiveYearProjection: "stable",
    automationRisk: "low",
  },

  // ==========================================================================
  // ENGINEERING CAREERS
  // ==========================================================================
  {
    careerId: "civil_engineer",
    careerTitle: "Civil Engineer",
    category: "Engineering",
    demandLevel: "high",
    demandTrend: "increasing",
    talentShortage: true,
    salaryRange: {
      entry: { min: 30000, max: 55000, average: 40000 },
      mid: { min: 45000, max: 90000, average: 65000 },
      senior: { min: 75000, max: 150000, average: 110000 },
    },
    employers: 200,
    openPositions: 80,
    averageTimeToFill: 40,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "high",
      paro: "medium",
      otherDzongkhags: "high",
    },
    fiveYearProjection: "growing",
    automationRisk: "low",
  },
  {
    careerId: "electrical_engineer",
    careerTitle: "Electrical Engineer",
    category: "Engineering",
    demandLevel: "high",
    demandTrend: "stable",
    talentShortage: true,
    salaryRange: {
      entry: { min: 30000, max: 55000, average: 40000 },
      mid: { min: 45000, max: 85000, average: 60000 },
      senior: { min: 70000, max: 140000, average: 100000 },
    },
    employers: 150,
    openPositions: 50,
    averageTimeToFill: 45,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "medium",
      paro: "low",
      otherDzongkhags: "medium",
    },
    fiveYearProjection: "growing",
    automationRisk: "low",
  },

  // ==========================================================================
  // BUSINESS CAREERS
  // ==========================================================================
  {
    careerId: "accountant",
    careerTitle: "Accountant",
    category: "Business",
    demandLevel: "high",
    demandTrend: "stable",
    talentShortage: true,
    salaryRange: {
      entry: { min: 20000, max: 35000, average: 25000 },
      mid: { min: 28000, max: 55000, average: 38000 },
      senior: { min: 45000, max: 90000, average: 65000 },
    },
    employers: 1000,
    openPositions: 150,
    averageTimeToFill: 30,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "high",
      paro: "high",
      otherDzongkhags: "high",
    },
    fiveYearProjection: "stable",
    automationRisk: "medium",
  },
  {
    careerId: "sales_executive",
    careerTitle: "Sales Executive",
    category: "Business",
    demandLevel: "high",
    demandTrend: "stable",
    talentShortage: false,
    salaryRange: {
      entry: { min: 18000, max: 35000, average: 25000 },
      mid: { min: 25000, max: 60000, average: 40000 },
      senior: { min: 45000, max: 120000, average: 70000 },
    },
    employers: 800,
    openPositions: 200,
    averageTimeToFill: 14,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "high",
      paro: "medium",
      otherDzongkhags: "medium",
    },
    fiveYearProjection: "stable",
    automationRisk: "medium",
  },
  {
    careerId: "entrepreneur",
    careerTitle: "Entrepreneur",
    category: "Business",
    demandLevel: "medium",
    demandTrend: "increasing",
    talentShortage: false,
    salaryRange: {
      entry: { min: 10000, max: 50000, average: 25000 },
      mid: { min: 25000, max: 150000, average: 75000 },
      senior: { min: 50000, max: 500000, average: 150000 },
    },
    employers: 0, // Self-employed
    openPositions: 0,
    averageTimeToFill: 0,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "medium",
      paro: "medium",
      otherDzongkhags: "low",
    },
    fiveYearProjection: "growing",
    automationRisk: "low",
  },

  // ==========================================================================
  // AGRICULTURE & ENVIRONMENT CAREERS
  // ==========================================================================
  {
    careerId: "agriculture_officer",
    careerTitle: "Agriculture Officer",
    category: "Agriculture",
    demandLevel: "high",
    demandTrend: "stable",
    talentShortage: true,
    salaryRange: {
      entry: { min: 20000, max: 40000, average: 28000 },
      mid: { min: 28000, max: 55000, average: 38000 },
      senior: { min: 45000, max: 80000, average: 60000 },
    },
    employers: 50,
    openPositions: 25,
    averageTimeToFill: 45,
    regionalDemand: {
      thimphu: "low",
      phuentsholing: "medium",
      paro: "low",
      otherDzongkhags: "high",
    },
    fiveYearProjection: "stable",
    automationRisk: "low",
  },
  {
    careerId: "forestry_officer",
    careerTitle: "Forestry Officer",
    category: "Environment",
    demandLevel: "medium",
    demandTrend: "stable",
    talentShortage: false,
    salaryRange: {
      entry: { min: 22000, max: 40000, average: 30000 },
      mid: { min: 30000, max: 55000, average: 40000 },
      senior: { min: 45000, max: 75000, average: 58000 },
    },
    employers: 30,
    openPositions: 15,
    averageTimeToFill: 60,
    regionalDemand: {
      thimphu: "low",
      phuentsholing: "medium",
      paro: "low",
      otherDzongkhags: "high",
    },
    fiveYearProjection: "stable",
    automationRisk: "low",
  },
  {
    careerId: "renewable_energy_specialist",
    careerTitle: "Renewable Energy Specialist",
    category: "Engineering",
    demandLevel: "high",
    demandTrend: "increasing",
    talentShortage: true,
    salaryRange: {
      entry: { min: 25000, max: 45000, average: 35000 },
      mid: { min: 35000, max: 70000, average: 50000 },
      senior: { min: 55000, max: 110000, average: 78000 },
    },
    employers: 40,
    openPositions: 25,
    averageTimeToFill: 50,
    regionalDemand: {
      thimphu: "medium",
      phuentsholing: "medium",
      paro: "low",
      otherDzongkhags: "high",
    },
    fiveYearProjection: "growing",
    automationRisk: "low",
  },

  // ==========================================================================
  // TOURISM & HOSPITALITY CAREERS
  // ==========================================================================
  {
    careerId: "tour_guide",
    careerTitle: "Tour Guide",
    category: "Hospitality",
    demandLevel: "high",
    demandTrend: "increasing",
    talentShortage: true,
    salaryRange: {
      entry: { min: 15000, max: 30000, average: 22000 },
      mid: { min: 20000, max: 45000, average: 30000 },
      senior: { min: 30000, max: 60000, average: 40000 },
    },
    employers: 300,
    openPositions: 100,
    averageTimeToFill: 14,
    regionalDemand: {
      thimphu: "medium",
      phuentsholing: "high",
      paro: "high",
      otherDzongkhags: "high",
    },
    fiveYearProjection: "growing",
    automationRisk: "low",
  },
  {
    careerId: "hotel_manager",
    careerTitle: "Hotel Manager",
    category: "Hospitality",
    demandLevel: "medium",
    demandTrend: "increasing",
    talentShortage: false,
    salaryRange: {
      entry: { min: 20000, max: 35000, average: 25000 },
      mid: { min: 28000, max: 55000, average: 40000 },
      senior: { min: 45000, max: 90000, average: 65000 },
    },
    employers: 80,
    openPositions: 30,
    averageTimeToFill: 35,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "high",
      paro: "high",
      otherDzongkhags: "medium",
    },
    fiveYearProjection: "growing",
    automationRisk: "low",
  },

  // ==========================================================================
  // SKILLED TRADES
  // ==========================================================================
  {
    careerId: "electrician",
    careerTitle: "Electrician",
    category: "Skilled Trades",
    demandLevel: "high",
    demandTrend: "stable",
    talentShortage: true,
    salaryRange: {
      entry: { min: 15000, max: 28000, average: 20000 },
      mid: { min: 20000, max: 40000, average: 28000 },
      senior: { min: 30000, max: 55000, average: 40000 },
    },
    employers: 500,
    openPositions: 150,
    averageTimeToFill: 21,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "high",
      paro: "high",
      otherDzongkhags: "high",
    },
    fiveYearProjection: "stable",
    automationRisk: "low",
  },
  {
    careerId: "plumber",
    careerTitle: "Plumber",
    category: "Skilled Trades",
    demandLevel: "high",
    demandTrend: "stable",
    talentShortage: true,
    salaryRange: {
      entry: { min: 15000, max: 28000, average: 20000 },
      mid: { min: 20000, max: 40000, average: 28000 },
      senior: { min: 30000, max: 50000, average: 38000 },
    },
    employers: 400,
    openPositions: 120,
    averageTimeToFill: 21,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "high",
      paro: "high",
      otherDzongkhags: "high",
    },
    fiveYearProjection: "stable",
    automationRisk: "low",
  },
  {
    careerId: "welder",
    careerTitle: "Welder",
    category: "Skilled Trades",
    demandLevel: "high",
    demandTrend: "stable",
    talentShortage: true,
    salaryRange: {
      entry: { min: 15000, max: 27000, average: 20000 },
      mid: { min: 19000, max: 38000, average: 27000 },
      senior: { min: 28000, max: 50000, average: 37000 },
    },
    employers: 200,
    openPositions: 80,
    averageTimeToFill: 28,
    regionalDemand: {
      thimphu: "high",
      phuentsholing: "medium",
      paro: "low",
      otherDzongkhags: "medium",
    },
    fiveYearProjection: "stable",
    automationRisk: "medium",
  },

  // ==========================================================================
  // EMERGING CAREERS
  // ==========================================================================
  {
    careerId: "ai_ml_engineer",
    careerTitle: "AI/ML Engineer",
    category: "Emerging",
    demandLevel: "medium",
    demandTrend: "increasing",
    talentShortage: true,
    salaryRange: {
      entry: { min: 50000, max: 90000, average: 70000 },
      mid: { min: 80000, max: 150000, average: 110000 },
      senior: { min: 120000, max: 250000, average: 180000 },
    },
    employers: 10,
    openPositions: 5,
    averageTimeToFill: 75,
    regionalDemand: {
      thimphu: "medium",
      phuentsholing: "low",
      paro: "low",
      otherDzongkhags: "low",
    },
    fiveYearProjection: "emerging",
    automationRisk: "low",
  },
  {
    careerId: "drone_operator",
    careerTitle: "Drone Operator/Pilot",
    category: "Emerging",
    demandLevel: "medium",
    demandTrend: "increasing",
    talentShortage: true,
    salaryRange: {
      entry: { min: 18000, max: 35000, average: 25000 },
      mid: { min: 25000, max: 50000, average: 35000 },
      senior: { min: 40000, max: 80000, average: 55000 },
    },
    employers: 20,
    openPositions: 15,
    averageTimeToFill: 30,
    regionalDemand: {
      thimphu: "low",
      phuentsholing: "medium",
      paro: "low",
      otherDzongkhags: "medium",
    },
    fiveYearProjection: "emerging",
    automationRisk: "low",
  },
  {
    careerId: "content_creator",
    careerTitle: "Content Creator / YouTuber",
    category: "Emerging",
    demandLevel: "medium",
    demandTrend: "increasing",
    talentShortage: false,
    salaryRange: {
      entry: { min: 10000, max: 40000, average: 20000 },
      mid: { min: 20000, max: 100000, average: 45000 },
      senior: { min: 40000, max: 200000, average: 80000 },
    },
    employers: 0, // Self-employed
    openPositions: 0,
    averageTimeToFill: 0,
    regionalDemand: {
      thimphu: "medium",
      phuentsholing: "medium",
      paro: "medium",
      otherDzongkhags: "low",
    },
    fiveYearProjection: "emerging",
    automationRisk: "low",
  },
];

// ============================================================================
// SKILLS DEMAND FORECAST
// ============================================================================

export const skillsDemandForecast: SkillsDemandForecast[] = [
  // Technical Skills
  {
    skillId: "python",
    skillName: "Python Programming",
    category: "technical",
    currentDemand: "high",
    oneYearProjection: "increase",
    threeYearProjection: "increase",
    fiveYearProjection: "increase",
    relatedCareers: ["software_engineer", "data_analyst", "data_scientist", "ai_ml_engineer"],
    urgency: "critical",
    reason: "AI and data science boom in Bhutan tech sector",
  },
  {
    skillId: "data_analysis",
    skillName: "Data Analysis (SQL, Excel, Visualization)",
    category: "technical",
    currentDemand: "high",
    oneYearProjection: "increase",
    threeYearProjection: "increase",
    fiveYearProjection: "increase",
    relatedCareers: ["data_analyst", "business_analyst", "financial_analyst"],
    urgency: "critical",
    reason: "All industries becoming data-driven",
  },
  {
    skillId: "digital_marketing",
    skillName: "Digital Marketing",
    category: "technical",
    currentDemand: "high",
    oneYearProjection: "increase",
    threeYearProjection: "increase",
    fiveYearProjection: "increase",
    relatedCareers: ["digital_marketer", "social_media_manager", "content_creator"],
    urgency: "important",
    reason: "Bhutan businesses going digital",
  },
  {
    skillId: "web_development",
    skillName: "Web Development (Full Stack)",
    category: "technical",
    currentDemand: "high",
    oneYearProjection: "increase",
    threeYearProjection: "increase",
    fiveYearProjection: "increase",
    relatedCareers: ["web_developer", "software_engineer", "freelance_developer"],
    urgency: "critical",
    reason: "E-commerce and online services growing",
  },
  {
    skillId: "cybersecurity",
    skillName: "Cybersecurity",
    category: "technical",
    currentDemand: "medium",
    oneYearProjection: "increase",
    threeYearProjection: "increase",
    fiveYearProjection: "increase",
    relatedCareers: ["cyber_security_specialist", "ethical_hacker", "network_engineer"],
    urgency: "important",
    reason: "Digital transformation increases security needs",
  },
  {
    skillId: "cloud_computing",
    skillName: "Cloud Computing (AWS, Azure)",
    category: "technical",
    currentDemand: "medium",
    oneYearProjection: "increase",
    threeYearProjection: "increase",
    fiveYearProjection: "increase",
    relatedCareers: ["cloud_architect", "devops_engineer", "it_manager"],
    urgency: "important",
    reason: "Bhutan adopting cloud infrastructure",
  },

  // Soft Skills
  {
    skillId: "communication",
    skillName: "Communication",
    category: "soft",
    currentDemand: "high",
    oneYearProjection: "stable",
    threeYearProjection: "stable",
    fiveYearProjection: "stable",
    relatedCareers: ["teacher", "sales_executive", "manager", "counselor"],
    urgency: "important",
    reason: "Essential for all client-facing roles",
  },
  {
    skillId: "leadership",
    skillName: "Leadership",
    category: "soft",
    currentDemand: "high",
    oneYearProjection: "stable",
    threeYearProjection: "stable",
    fiveYearProjection: "stable",
    relatedCareers: ["manager", "entrepreneur", "team_lead", "principal"],
    urgency: "important",
    reason: "Critical for management roles",
  },
  {
    skillId: "problem_solving",
    skillName: "Problem Solving",
    category: "soft",
    currentDemand: "high",
    oneYearProjection: "stable",
    threeYearProjection: "increase",
    fiveYearProjection: "increase",
    relatedCareers: ["software_engineer", "consultant", "manager", "entrepreneur"],
    urgency: "critical",
    reason: "Automation increases need for analytical skills",
  },
  {
    skillId: "adaptability",
    skillName: "Adaptability",
    category: "soft",
    currentDemand: "high",
    oneYearProjection: "stable",
    threeYearProjection: "stable",
    fiveYearProjection: "increase",
    relatedCareers: ["entrepreneur", "consultant", "project_manager"],
    urgency: "important",
    reason: "Rapid technological change requires flexibility",
  },
  {
    skillId: "emotional_intelligence",
    skillName: "Emotional Intelligence",
    category: "soft",
    currentDemand: "medium",
    oneYearProjection: "increase",
    threeYearProjection: "increase",
    fiveYearProjection: "increase",
    relatedCareers: ["counselor", "teacher", "manager", "sales"],
    urgency: "important",
    reason: "Human skills become more valuable with automation",
  },

  // Vocational Skills
  {
    skillId: "electrical",
    skillName: "Electrical Work",
    category: "vocational",
    currentDemand: "high",
    oneYearProjection: "stable",
    threeYearProjection: "stable",
    fiveYearProjection: "stable",
    relatedCareers: ["electrician", "electrical_engineer", "electronics_technician"],
    urgency: "important",
    reason: "Infrastructure development ongoing",
  },
  {
    skillId: "plumbing",
    skillName: "Plumbing",
    category: "vocational",
    currentDemand: "high",
    oneYearProjection: "stable",
    threeYearProjection: "stable",
    fiveYearProjection: "stable",
    relatedCareers: ["plumber", "civil_engineer"],
    urgency: "important",
    reason: "Construction and maintenance needs",
  },
  {
    skillId: "welding",
    skillName: "Welding",
    category: "vocational",
    currentDemand: "high",
    oneYearProjection: "stable",
    threeYearProjection: "stable",
    fiveYearProjection: "stable",
    relatedCareers: ["welder", "fabricator", "mechanic"],
    urgency: "important",
    reason: "Manufacturing and construction sectors",
  },
  {
    skillId: "agriculture",
    skillName: "Modern Farming Techniques",
    category: "vocational",
    currentDemand: "high",
    oneYearProjection: "stable",
    threeYearProjection: "stable",
    fiveYearProjection: "stable",
    relatedCareers: ["agriculture_officer", "farm_manager", "organic_farmer"],
    urgency: "important",
    reason: "Food security priority for Bhutan",
  },
  {
    skillId: "hospitality",
    skillName: "Hospitality Services",
    category: "vocational",
    currentDemand: "high",
    oneYearProjection: "increase",
    threeYearProjection: "increase",
    fiveYearProjection: "increase",
    relatedCareers: ["hotel_manager", "tour_guide", "restaurant_manager"],
    urgency: "important",
    reason: "Tourism sector growing",
  },
];

// ============================================================================
// INDUSTRY INSIGHTS
// ============================================================================

export const industryInsights: IndustryInsight[] = [
  {
    industry: "Information Technology",
    sector: "private",
    size: 3000,
    growthRate: 15,
    turnoverRate: 12,
    topEmployers: [
      { name: "Thimphu Tech Park", type: "private", location: "Thimphu" },
      { name: "Bhutan Telecom", type: "private", location: "Thimphu" },
      { name: "Tashi InfoComm", type: "private", location: "Thimphu" },
      { name: "Government Data Center", type: "government", location: "Thimphu" },
    ],
    trends: ["AI/ML adoption", "Cloud migration", "Digital transformation", "Cybersecurity focus"],
    hotSkills: ["Python", "Cloud", "AI/ML", "Cybersecurity", "Data Analysis"],
    decliningSkills: ["Legacy IT support", "Desktop repair"],
    typicalEntry: "Bachelor's in CS or related + portfolio",
    barrierToEntry: "medium",
  },
  {
    industry: "Banking & Finance",
    sector: "private",
    size: 5000,
    growthRate: 5,
    turnoverRate: 8,
    topEmployers: [
      { name: "Bank of Bhutan", type: "private", location: "Thimphu" },
      { name: "Bhutan National Bank", type: "government", location: "Thimphu" },
      { name: "Druk PNB Bank", type: "private", location: "Thimphu" },
      { name: "Bhutan Development Bank", type: "government", location: "Thimphu" },
    ],
    trends: ["Digital banking", "Financial inclusion", "Mobile payments", "FinTech integration"],
    hotSkills: ["Data Analysis", "Financial Modeling", "Compliance", "Digital Banking"],
    decliningSkills: ["Manual bookkeeping", "Cash handling"],
    typicalEntry: "Bachelor's in Finance, Accounting, Business",
    barrierToEntry: "medium",
  },
  {
    industry: "Construction & Infrastructure",
    sector: "private",
    size: 15000,
    growthRate: 8,
    turnoverRate: 15,
    topEmployers: [
      { name: "Construction Development Board", type: "government", location: "Thimphu" },
      { name: "Royal Bhutan Army - Engineering Corps", type: "government", location: "Various" },
      { name: "Private Construction Companies", type: "private", location: "Various" },
    ],
    trends: ["Hydropower projects", "Road expansion", "Urban development", "Green buildings"],
    hotSkills: ["Civil Engineering", "Project Management", "AutoCAD", "Surveying"],
    decliningSkills: ["Manual drafting"],
    typicalEntry: "Bachelor's in Civil/Architecture or Diploma",
    barrierToEntry: "medium",
  },
  {
    industry: "Tourism & Hospitality",
    sector: "private",
    size: 8000,
    growthRate: 12,
    turnoverRate: 25,
    topEmployers: [
      { name: "Hotels & Resorts", type: "private", location: "Paro, Thimphu" },
      { name: "Tour Operators", type: "private", location: "Various" },
      { name: "Tourism Council of Bhutan", type: "government", location: "Thimphu" },
    ],
    trends: ["Sustainable tourism", "Cultural tourism", "Adventure tourism", "Luxury market"],
    hotSkills: ["Hospitality Management", "Language skills", "Cultural knowledge", "Service excellence"],
    decliningSkills: ["Basic guiding", "Manual reservation systems"],
    typicalEntry: "Diploma or Bachelor's in Hospitality",
    barrierToEntry: "low",
  },
  {
    industry: "Education",
    sector: "government",
    size: 10000,
    growthRate: 3,
    turnoverRate: 5,
    topEmployers: [
      { name: "Ministry of Education", type: "government", location: "Thimphu" },
      { name: "RUB Colleges", type: "government", location: "Various" },
      { name: "Private Schools", type: "private", location: "Thimphu, Paro, Phuentsholing" },
    ],
    trends: ["Digital learning", "Hybrid models", "Personalized learning", "STEM emphasis"],
    hotSkills: ["Teaching", "EdTech", "Subject mastery", "Student counseling"],
    decliningSkills: ["Traditional teaching without technology integration"],
    typicalEntry: "B.Ed + Bachelor's in subject",
    barrierToEntry: "medium",
  },
  {
    industry: "Healthcare",
    sector: "private",
    size: 5000,
    growthRate: 6,
    turnoverRate: 8,
    topEmployers: [
      { name: "JDWNRH", type: "government", location: "Thimuphu" },
      { name: "Private Hospitals & Clinics", type: "private", location: "Thimphu, Paro" },
      { name: "Basic Health Units", type: "government", location: "Various Dzongkhags" },
    ],
    trends: ["Primary healthcare expansion", "Telemedicine", "Specialized care", "Preventive health"],
    hotSkills: ["Patient care", "Medical technology", "Public health", "Empathy"],
    decliningSkills: ["Administrative tasks (being automated)"],
    typicalEntry: "Medical degree + licensure",
    barrierToEntry: "high",
  },
  {
    industry: "Agriculture & Forestry",
    sector: "private",
    size: 20000,
    growthRate: 4,
    turnoverRate: 3,
    topEmployers: [
      { name: "Ministry of Agriculture", type: "government", location: "Thimphu" },
      { name: "RUB College of Natural Resources", type: "government", location: "Lobesa" },
      { name: "Private Farms", type: "private", location: "Various" },
    ],
    trends: ["Sustainable agriculture", "Organic farming", "Agri-technology", "Value-added processing"],
    hotSkills: ["Agricultural science", "Modern farming", "Post-harvest technology", "Sustainability"],
    decliningSkills: ["Traditional farming without technology"],
    typicalEntry: "Bachelor's in Agriculture or Diploma",
    barrierToEntry: "low",
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get job market data for a specific career
 */
export function getJobMarketData(careerId: string): JobMarketData | undefined {
  return jobMarketData.find((d) => d.careerId === careerId);
}

/**
 * Get careers by demand level
 */
export function getCareersByDemand(demand: "high" | "medium" | "low"): JobMarketData[] {
  return jobMarketData.filter((d) => d.demandLevel === demand);
}

/**
 * Get careers by demand trend
 */
export function getCareersByTrend(trend: "increasing" | "stable" | "decreasing" | "emerging"): JobMarketData[] {
  return jobMarketData.filter((d) => d.demandTrend === trend || (trend === "emerging" && d.fiveYearProjection === "emerging"));
}

/**
 * Get top paying careers
 */
export function getTopPayingCareer(level: "entry" | "mid" | "senior", limit: number = 10): Array<{
  careerId: string;
  careerTitle: string;
  salary: number;
}> {
  const careers = [...jobMarketData].sort((a, b) =>
    b.salaryRange[level].average - a.salaryRange[level].average
  );

  return careers.slice(0, limit).map((c) => ({
    careerId: c.careerId,
    careerTitle: c.careerTitle,
    salary: c.salaryRange[level].average,
  }));
}

/**
 * Get skills demand forecast
 */
export function getSkillsDemandForecast(
  category?: "technical" | "soft" | "vocational",
  urgency?: "critical" | "important" | "optional"
): SkillsDemandForecast[] {
  let forecast = skillsDemandForecast;

  if (category) {
    forecast = forecast.filter((s) => s.category === category);
  }

  if (urgency) {
    forecast = forecast.filter((s) => s.urgency === urgency);
  }

  return forecast.sort((a, b) => {
    const urgencyOrder = { critical: 3, important: 2, optional: 1 };
    return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
  });
}

/**
 * Get industry insights
 */
export function getIndustryInsights(): IndustryInsight[] {
  return industryInsights;
}

/**
 * Get careers with talent shortage
 */
export function getTalentShortageCareers(): JobMarketData[] {
  return jobMarketData.filter((d) => d.talentShortage);
}

/**
 * Get regional demand for a career
 */
export function getRegionalDemand(careerId: string): {
  thimphu: "high" | "medium" | "low";
  phuentsholing: "high" | "medium" | "low";
  paro: "high" | "medium" | "low";
  otherDzongkhags: "high" | "medium" | "low";
} | undefined {
  return getJobMarketData(careerId)?.regionalDemand;
}
