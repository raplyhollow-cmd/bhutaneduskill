/**
 * Industry Career Database for Bhutan
 * Maps industries to specific careers with demand, salary, and growth data
 */

export interface Industry {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sectors: string[];
  demandInBhutan: "very-high" | "high" | "medium" | "low" | "emerging";
  avgSalaryRange: string;
  growthOutlook: string;
  requiredSkills: string[];
  relatedCareers: string[];
  studyAbroadPotential: string[];
}

export const INDUSTRIES: Industry[] = [
  {
    id: "technology",
    name: "Technology & IT",
    description: "Software development, data analysis, AI, cybersecurity, and digital services",
    icon: "💻",
    color: "from-blue-500 to-cyan-500",
    sectors: ["Software", "Data", "Cybersecurity", "IT Services", "AI/ML"],
    demandInBhutan: "very-high",
    avgSalaryRange: "Nu. 25,000 - 80,000/month",
    growthOutlook: "25% annually",
    requiredSkills: ["Programming", "Problem Solving", "Mathematics", "Analytical Thinking"],
    relatedCareers: ["Software Developer", "Data Analyst", "IT Specialist", "Network Administrator", "Cybersecurity Analyst"],
    studyAbroadPotential: ["Australia", "USA", "Singapore", "Canada"],
  },
  {
    id: "healthcare",
    name: "Healthcare & Medicine",
    description: "Medical services, nursing, public health, and healthcare administration",
    icon: "🏥",
    color: "from-red-500 to-pink-500",
    sectors: ["Hospitals", "Clinics", "Public Health", "Pharmaceutical", "Research"],
    demandInBhutan: "very-high",
    avgSalaryRange: "Nu. 20,000 - 70,000/month",
    growthOutlook: "20% annually",
    requiredSkills: ["Biology", "Chemistry", "Empathy", "Attention to Detail", "Communication"],
    relatedCareers: ["Doctor", "Nurse", "Pharmacist", "Public Health Officer", "Medical Researcher"],
    studyAbroadPotential: ["Australia", "New Zealand", "UK", "USA"],
  },
  {
    id: "finance",
    name: "Finance & Banking",
    description: "Banking, insurance, accounting, financial planning, and investment",
    icon: "🏦",
    color: "from-green-500 to-emerald-500",
    sectors: ["Banking", "Insurance", "Accounting", "Investment", "Fintech"],
    demandInBhutan: "high",
    avgSalaryRange: "Nu. 25,000 - 90,000/month",
    growthOutlook: "15% annually",
    requiredSkills: ["Mathematics", "Analytical Skills", "Attention to Detail", "Communication"],
    relatedCareers: ["Accountant", "Financial Analyst", "Bank Manager", "Investment Advisor", "Tax Consultant"],
    studyAbroadPotential: ["Singapore", "UK", "Australia", "USA"],
  },
  {
    id: "education",
    name: "Education & Training",
    description: "Teaching, educational administration, curriculum development, and training",
    icon: "📚",
    color: "from-purple-500 to-violet-500",
    sectors: ["Schools", "Colleges", "Vocational Training", "EdTech", "Research"],
    demandInBhutan: "high",
    avgSalaryRange: "Nu. 15,000 - 50,000/month",
    growthOutlook: "10% annually",
    requiredSkills: ["Communication", "Patience", "Subject Knowledge", "Leadership", "Creativity"],
    relatedCareers: ["Teacher", "Professor", "Education Administrator", "Curriculum Developer", "Trainer"],
    studyAbroadPotential: ["UK", "Australia", "Canada", "New Zealand"],
  },
  {
    id: "engineering",
    name: "Engineering & Construction",
    description: "Civil, electrical, mechanical engineering and construction management",
    icon: "🏗️",
    color: "from-orange-500 to-amber-500",
    sectors: ["Construction", "Manufacturing", "Power", "Infrastructure", "Telecommunications"],
    demandInBhutan: "very-high",
    avgSalaryRange: "Nu. 25,000 - 70,000/month",
    growthOutlook: "18% annually",
    requiredSkills: ["Mathematics", "Physics", "Problem Solving", "Technical Drawing", "Project Management"],
    relatedCareers: ["Civil Engineer", "Electrical Engineer", "Mechanical Engineer", "Architect", "Project Manager"],
    studyAbroadPotential: ["Australia", "Germany", "USA", "Singapore"],
  },
  {
    id: "agriculture",
    name: "Agriculture & Forestry",
    description: "Farming, forestry, animal husbandry, and sustainable resource management",
    icon: "🌾",
    color: "from-lime-500 to-green-500",
    sectors: ["Farming", "Forestry", "Animal Husbandry", "Research", "Agribusiness"],
    demandInBhutan: "high",
    avgSalaryRange: "Nu. 18,000 - 55,000/month",
    growthOutlook: "12% annually",
    requiredSkills: ["Biology", "Environmental Science", "Business", "Research", "Sustainability"],
    relatedCareers: ["Agriculturist", "Forest Officer", "Veterinarian", "Research Scientist", "Farm Manager"],
    studyAbroadPotential: ["New Zealand", "Australia", "Netherlands", "Denmark"],
  },
  {
    id: "tourism",
    name: "Tourism & Hospitality",
    description: "Hotels, travel, tour operations, and cultural tourism management",
    icon: "🏔️",
    color: "from-teal-500 to-cyan-500",
    sectors: ["Hotels", "Travel Agencies", "Tour Operations", "Cultural Tourism", "Adventure Tourism"],
    demandInBhutan: "high",
    avgSalaryRange: "Nu. 15,000 - 45,000/month",
    growthOutlook: "20% annually",
    requiredSkills: ["Communication", "Customer Service", "Languages", "Cultural Knowledge", "Management"],
    relatedCareers: ["Hotel Manager", "Tour Guide", "Travel Agent", "Event Planner", "Hospitality Trainer"],
    studyAbroadPotential: ["Switzerland", "Australia", "Thailand", "Singapore"],
  },
  {
    id: "media",
    name: "Media & Communications",
    description: "Journalism, digital media, content creation, and public relations",
    icon: "🎬",
    color: "from-pink-500 to-rose-500",
    sectors: ["Journalism", "Digital Media", "Broadcasting", "Advertising", "PR"],
    demandInBhutan: "medium",
    avgSalaryRange: "Nu. 15,000 - 50,000/month",
    growthOutlook: "15% annually",
    requiredSkills: ["Writing", "Creativity", "Communication", "Technical Skills", "Research"],
    relatedCareers: ["Journalist", "Content Creator", "PR Specialist", "Social Media Manager", "Video Producer"],
    studyAbroadPotential: ["UK", "USA", "Australia", "Canada"],
  },
  {
    id: "creative",
    name: "Creative Arts & Design",
    description: "Graphic design, fashion, architecture, and creative industries",
    icon: "🎨",
    color: "from-indigo-500 to-purple-500",
    sectors: ["Design", "Fashion", "Architecture", "Fine Arts", "Crafts"],
    demandInBhutan: "medium",
    avgSalaryRange: "Nu. 15,000 - 45,000/month",
    growthOutlook: "10% annually",
    requiredSkills: ["Creativity", "Design Software", "Artistic Ability", "Innovation", "Business"],
    relatedCareers: ["Graphic Designer", "Fashion Designer", "Architect", "UX Designer", "Art Director"],
    studyAbroadPotential: ["Italy", "France", "UK", "USA"],
  },
  {
    id: "government",
    name: "Government & Public Service",
    description: "Civil services, administration, and public sector roles",
    icon: "🏛️",
    color: "from-slate-500 to-gray-500",
    sectors: ["Civil Service", "Administration", "Law Enforcement", "Policy", "Diplomacy"],
    demandInBhutan: "high",
    avgSalaryRange: "Nu. 18,000 - 60,000/month",
    growthOutlook: "5% annually",
    requiredSkills: ["Communication", "Leadership", "Policy Analysis", "Ethics", "Public Speaking"],
    relatedCareers: ["Civil Servant", "Policy Analyst", "Diplomat", "Administrator", "Public Officer"],
    studyAbroadPotential: ["UK", "USA", "Australia", "Singapore"],
  },
  {
    id: "environmental",
    name: "Environmental & Sustainability",
    description: "Conservation, renewable energy, waste management, and climate action",
    icon: "🌱",
    color: "from-green-600 to-teal-500",
    sectors: ["Conservation", "Renewable Energy", "Waste Management", "Climate Research", "Sustainability"],
    demandInBhutan: "emerging",
    avgSalaryRange: "Nu. 20,000 - 55,000/month",
    growthOutlook: "25% annually",
    requiredSkills: ["Environmental Science", "Research", "Data Analysis", "Policy", "Innovation"],
    relatedCareers: ["Environmental Scientist", "Climate Analyst", "Sustainability Officer", "Conservation Officer", "Energy Consultant"],
    studyAbroadPotential: ["Germany", "Norway", "Netherlands", "Denmark"],
  },
  {
    id: "entrepreneurship",
    name: "Entrepreneurship & Business",
    description: "Starting and running businesses, startups, and self-employment",
    icon: "🚀",
    color: "from-amber-500 to-orange-500",
    sectors: ["Startups", "Small Business", "E-commerce", "Innovation", "Consulting"],
    demandInBhutan: "high",
    avgSalaryRange: "Variable (Nu. 10,000 - 200,000+/month)",
    growthOutlook: "20% annually",
    requiredSkills: ["Business Planning", "Leadership", "Risk Management", "Innovation", "Networking"],
    relatedCareers: ["Entrepreneur", "Business Consultant", "Startup Founder", "Franchise Owner", "Business Coach"],
    studyAbroadPotential: ["USA", "Singapore", "UK", "Israel"],
  },
];

// Student Indecision Detection Framework
export interface StudentIndecisionFactors {
  profileStrength: number; // 0-100, how complete is their career profile
  assessmentCompleteness: number; // 0-100, assessments completed
  interestConsistency: number; // 0-100, consistency in interests over time
  parentAlignmentGap: number; // 0-100, gap between parent expectations and student interests
  decisionConfidence: number; // 0-100, self-reported confidence
  lastActivityDays: number; // days since last meaningful activity
}

export const INDECISION_LEVELS = {
  critical: { threshold: 30, action: "Immediate counselor intervention required", color: "red" },
  high: { threshold: 50, action: "Schedule counseling session", color: "orange" },
  medium: { threshold: 70, action: "Send guidance resources", color: "yellow" },
  low: { threshold: 100, action: "Monitor progress", color: "green" },
};

// AI Recommendation Framework
export interface RecommendationInput {
  passionScore: number; // From interest tracking and activities
  academicPerformance: number; // Class 12 marks in relevant subjects
  assessmentScore: number; // RIASEC/aptitude test results
  marketDemand: number; // Industry demand in Bhutan
  parentPreference: number; // Parent's expectation alignment
  studyAbroadInterest: number; // Interest in studying abroad
}

export interface RecommendationOutput {
  career: string;
  confidence: number; // 0-100
  reasoning: string[];
  pathways: string[];
  risks: string[];
  nextSteps: string[];
}

// Generate recommendations based on multiple factors
export function generateRecommendations(input: RecommendationInput): RecommendationOutput[] {
  const recommendations: RecommendationOutput[] = [];

  // Algorithm: Weighted scoring of all factors
  // Passion: 30%, Academics: 25%, Assessment: 25%, Market: 15%, Parent: 5%

  for (const industry of INDUSTRIES) {
    const score =
      (input.passionScore * 0.30) +
      (input.academicPerformance * 0.25) +
      (input.assessmentScore * 0.25) +
      (mapDemandToScore(industry.demandInBhutan) * 0.15) +
      (input.parentPreference * 0.05);

    if (score >= 60) {
      recommendations.push({
        career: industry.name,
        confidence: Math.round(score),
        reasoning: [
          `Strong ${industry.sectors[0]} sector growth in Bhutan`,
          `Your assessment results align well with this field`,
          `Good academic foundation for this career path`,
          `Industry demand: ${industry.demandInBhutan}`,
          input.studyAbroadInterest > 70 ? `Strong study abroad options in ${industry.studyAbroadPotential.slice(0, 2).join(", ")}` : "Local opportunities available",
        ],
        pathways: [
          `RUB: ${getRUBCollegesForIndustry(industry.id)}`,
          `Private: ${getPrivateCollegesForIndustry(industry.id)}`,
          `Vocational: ${getTTIForIndustry(industry.id)}`,
        ],
        risks: [
          `High competition for top programs`,
          `Requires strong foundation in ${industry.requiredSkills.slice(0, 2).join(" and ")}`,
        ],
        nextSteps: [
          "Talk to a counselor about this career path",
          "Connect with professionals in this field",
          `Explore ${industry.name} courses on Khan Academy/Coursera`,
        ],
      });
    }
  }

  return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

function mapDemandToScore(demand: string): number {
  switch (demand) {
    case "very-high": return 95;
    case "high": return 80;
    case "medium": return 60;
    case "low": return 40;
    case "emerging": return 70;
    default: return 50;
  }
}

function getRUBCollegesForIndustry(industryId: string): string {
  const rubMapping: Record<string, string> = {
    technology: "CST, GCIT",
    healthcare: "RTC (Nursing)",
    finance: "GCBS",
    education: "PCE, SCE",
    engineering: "CST, JNEC",
    agriculture: "CNR",
    tourism: "GCBS (Tourism)",
    media: "Sherubtse, CLCS",
    creative: "All colleges",
    government: "All colleges",
    environmental: "CNR",
    entrepreneurship: "GCBS",
  };
  return rubMapping[industryId] || "Multiple options";
}

function getPrivateCollegesForIndustry(industryId: string): string {
  return "RTC, NRC"; // Most private colleges offer business/arts programs
}

function getTTIForIndustry(industryId: string): string {
  const ttiMapping: Record<string, string> = {
    technology: "TTI Thimphu (ICT)",
    engineering: "All TTIs",
    construction: "TTI Thimphu, TTI Khuruthang",
    automotive: "TTI Chumey",
    default: "Various TTIs",
  };
  return ttiMapping[industryId] || ttiMapping.default;
}

// Outreach templates for counselors to use with parents and teachers
export const OUTREACH_TEMPLATES = {
  parent: {
    subject: "Your Child's Career Development - Action Required",
    email: `Dear Parent/Guardian,

I hope this message finds you well. I am writing regarding your child's career development journey.

Our career guidance platform has identified that your child may benefit from additional guidance in making informed career decisions.

Key Observations:
- Your child has shown interest in {career_interests}
- Assessment results indicate strengths in {strength_areas}
- We recommend a counseling session to discuss options

Please feel free to contact me to schedule a meeting.

Best regards,
{counselor_name}
Career Counselor`,
    sms: `Namaste! Your child {child_name}'s career profile needs attention. Please contact the school counselor at {phone} for guidance. Thank you.`,
  },
  teacher: {
    subject: "Student Career Support Request",
    email: `Dear Teacher,

I would like to request your observations on the following students who may need additional career guidance:

Students: {student_list}

Your insights on their classroom behavior, subject interests, and any concerns would be valuable in helping them make informed career decisions.

Please respond at your earliest convenience.

Best regards,
{counselor_name}`,
  },
};
