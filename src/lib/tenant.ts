/**
 * Tenant utilities for multi-tenancy
 */

export function getTenantFromRequest(): {
  tenant: string | null;
  subdomain: string | null;
} {
  // For server-side usage, this will be enhanced with headers()
  // For now, return null and we'll implement with middleware
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    if (parts.length > 2) {
      return {
        tenant: parts[0],
        subdomain: parts[0],
      };
    }
  }
  return { tenant: null, subdomain: null };
}

export function withTenant<T>(
  tenant: string,
  callback: (tenant: string) => T
): T {
  return callback(tenant);
}

// List of Bhutan school codes for validation
export const BHUTAN_SCHOOL_CODES = [
  "PELKHIL",
  "DRUK",
  "YANGCHENPHUG",
  "MOTITHANG",
  "ZILUKHA",
  // Add more as needed
];

export function isValidSchoolCode(code: string): boolean {
  return BHUTAN_SCHOOL_CODES.includes(code.toUpperCase());
}

// RUB Colleges data
export const RUB_COLLEGES = [
  {
    id: "cest",
    name: "College of Science and Technology",
    location: "Thimphu",
    programs: ["B.E. in Civil Engineering", "B.E. in Electrical Engineering", "Diploma in IT"],
  },
  {
    id: "ce",
    name: "College of Education",
    location: "Paro",
    programs: ["B.Ed. Primary", "B.Ed. Secondary", "Postgraduate Diploma in Education"],
  },
  {
    id: "cnr",
    name: "College of Natural Resources",
    location: "Lobesa",
    programs: ["B.Sc. in Agriculture", "B.Sc. in Forestry", "B.Sc. in Animal Science"],
  },
  {
    id: "gaeddu",
    name: "Gaeddu College of Business Studies",
    location: "Gaeddu",
    programs: ["B.B.A", "B.Com", "BBA"],
  },
  {
    id: "sherubtse",
    name: "Sherubtse College",
    location: "Kanglung",
    programs: ["B.A.", "B.Sc.", "B.Com"],
  },
];

// Study Abroad Requirements
export const STUDY_ABROAD_REQUIREMENTS = {
  australia: {
    name: "Australia",
    ielts: 6.5,
    requirements: ["Academic transcripts", "English proficiency", "Student visa", "Financial proof"],
    popularCourses: ["IT", "Engineering", "Business", "Health Sciences"],
    avgTuition: "$25,000 - $45,000 AUD/year",
  },
  "new-zealand": {
    name: "New Zealand",
    ielts: 6.0,
    requirements: ["Academic transcripts", "English proficiency", "Student visa", "Health insurance"],
    popularCourses: ["IT", "Hospitality", "Business", "Agriculture"],
    avgTuition: "$20,000 - $35,000 NZD/year",
  },
  usa: {
    name: "United States",
    sat: 1200,
    requirements: ["SAT/ACT scores", "Essays", "Recommendation letters", "F-1 visa"],
    popularCourses: ["Computer Science", "Engineering", "Business", "Liberal Arts"],
    avgTuition: "$30,000 - $60,000 USD/year",
  },
  singapore: {
    name: "Singapore",
    ielts: 6.5,
    requirements: ["Academic transcripts", "English proficiency", "Student pass"],
    popularCourses: ["Business", "IT", "Engineering", "Design"],
    avgTuition: "$20,000 - $40,000 SGD/year",
  },
  europe: {
    name: "Europe (varies)",
    requirements: ["Varies by country", "Language requirements", "Student visa"],
    popularCourses: ["Engineering", "Business", "Arts", "Hospitality"],
    avgTuition: "€5,000 - €20,000/year",
  },
};

// RIASEC Questions for ages 11-18
export const RIASEC_QUESTIONS = [
  // Realistic (R)
  {
    id: "r1",
    text: "I enjoy working with tools and machines",
    category: "R",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  {
    id: "r2",
    text: "I like to build or repair things",
    category: "R",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  {
    id: "r3",
    text: "I enjoy outdoor activities and nature",
    category: "R",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  // Investigative (I)
  {
    id: "i1",
    text: "I enjoy solving complex problems",
    category: "I",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  {
    id: "i2",
    text: "I like to analyze and investigate things",
    category: "I",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  {
    id: "i3",
    text: "I enjoy science experiments and research",
    category: "I",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  // Artistic (A)
  {
    id: "a1",
    text: "I enjoy creative activities like drawing or writing",
    category: "A",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  {
    id: "a2",
    text: "I like to express myself through art or music",
    category: "A",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  {
    id: "a3",
    text: "I enjoy designing and creating new things",
    category: "A",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  // Social (S)
  {
    id: "s1",
    text: "I enjoy helping and teaching others",
    category: "S",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  {
    id: "s2",
    text: "I prefer working in teams rather than alone",
    category: "S",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  {
    id: "s3",
    text: "I enjoy listening to people's problems",
    category: "S",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  // Enterprising (E)
  {
    id: "e1",
    text: "I enjoy leading and persuading others",
    category: "E",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  {
    id: "e2",
    text: "I like to start new projects and initiatives",
    category: "E",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  {
    id: "e3",
    text: "I enjoy business and entrepreneurship",
    category: "E",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  // Conventional (C)
  {
    id: "c1",
    text: "I enjoy following established procedures",
    category: "C",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  {
    id: "c2",
    text: "I like organizing and keeping detailed records",
    category: "C",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
  {
    id: "c3",
    text: "I enjoy working with numbers and data",
    category: "C",
    options: [
      { value: 1, text: "Strongly Disagree" },
      { value: 2, text: "Disagree" },
      { value: 3, text: "Neutral" },
      { value: 4, text: "Agree" },
      { value: 5, text: "Strongly Agree" },
    ],
  },
];

// Careers database
export const CAREERS_DATABASE = [
  {
    id: "software-developer",
    name: "Software Developer",
    slug: "software-developer",
    description: "Design and create software applications and systems",
    riasecCode: "IRC",
    riasecScores: { i: 9, r: 7, c: 6 },
    skills: ["Programming", "Problem Solving", "Logic", "Mathematics"],
    educationPath: ["Class 12 with Science (Computer Science)", "B.E./B.Tech in CS", "Online certifications"],
    subjects: ["Mathematics", "Computer Science", "Physics"],
    workEnvironment: "Office, Remote",
    salaryRange: "Nu. 30,000 - 80,000/month",
    demandOutlook: "high",
    bhutanSpecific: true,
    studyAbroad: { australia: "high", "new-zealand": "high", usa: "very-high", singapore: "very-high" },
  },
  {
    id: "ux-designer",
    name: "UX Designer",
    slug: "ux-designer",
    description: "Create user-friendly digital experiences and interfaces",
    riasecCode: "AIR",
    riasecScores: { a: 9, i: 8, r: 5 },
    skills: ["Design Thinking", "User Research", "Prototyping", "Visual Design"],
    educationPath: ["B.Des./B.A. in Design", "UX Certification", "Portfolio building"],
    subjects: ["Art", "Computer Science", "Psychology"],
    workEnvironment: "Office, Remote",
    salaryRange: "Nu. 25,000 - 70,000/month",
    demandOutlook: "high",
    bhutanSpecific: false,
    studyAbroad: { australia: "high", "new-zealand": "medium", "usa": "high", singapore: "very-high" },
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    slug: "data-analyst",
    description: "Analyze data to help businesses make decisions",
    riasecCode: "ICR",
    riasecScores: { i: 9, c: 8, r: 6 },
    skills: ["Statistics", "Excel", "SQL", "Critical Thinking"],
    educationPath: ["B.Sc. in Statistics/Data Science", "Certifications", "Portfolio projects"],
    subjects: ["Mathematics", "Statistics", "Computer Science"],
    workEnvironment: "Office, Remote",
    salaryRange: "Nu. 35,000 - 90,000/month",
    demandOutlook: "very-high",
    bhutanSpecific: true,
    studyAbroad: { australia: "high", "new-zealand": "high", "usa": "very-high", singapore: "very-high" },
  },
  {
    id: "civil-engineer",
    name: "Civil Engineer",
    slug: "civil-engineer",
    description: "Design and build infrastructure like roads, bridges, buildings",
    riasecCode: "RIE",
    riasecScores: { r: 9, i: 6, e: 7 },
    skills: ["Design", "Construction Knowledge", "Project Management", "AutoCAD"],
    educationPath: ["B.E. in Civil Engineering", "Licensed Professional"],
    subjects: ["Mathematics", "Physics", "Chemistry"],
    workEnvironment: "Office, Field",
    salaryRange: "Nu. 25,000 - 60,000/month",
    demandOutlook: "high",
    bhutanSpecific: true,
    studyAbroad: { australia: "high", "new-zealand": "high", "usa": "medium", "singapore": "medium" },
  },
  {
    id: "teacher",
    name: "Teacher",
    slug: "teacher",
    description: "Educate and inspire students in various subjects",
    riasecCode: "SIA",
    riasecScores: { s: 9, a: 6, i: 7 },
    skills: ["Communication", "Patience", "Subject Knowledge", "Presentation"],
    educationPath: ["B.Ed./B.A. with B.Ed.", "Teaching Certification"],
    subjects: ["Varies by subject"],
    workEnvironment: "School",
    salaryRange: "Nu. 15,000 - 40,000/month",
    demandOutlook: "high",
    bhutanSpecific: true,
    studyAbroad: { australia: "medium", "new-zealand": "medium", "usa": "low", "singapore": "medium" },
  },
  {
    id: "nurse",
    name: "Nurse",
    slug: "nurse",
    description: "Provide healthcare and support to patients",
    riasecCode: "SIR",
    riasecScores: { s: 9, i: 7, r: 6 },
    skills: ["Medical Knowledge", "Empathy", "Attention to Detail", "Communication"],
    educationPath: ["B.Sc. Nursing", "Nursing License"],
    subjects: ["Biology", "Chemistry", "English"],
    workEnvironment: "Hospital, Clinic",
    salaryRange: "Nu. 20,000 - 50,000/month",
    demandOutlook: "very-high",
    bhutanSpecific: true,
    studyAbroad: { australia: "high", "new-zealand": "very-high", "usa": "medium", "singapore": "high" },
  },
  {
    id: "graphic-designer",
    name: "Graphic Designer",
    slug: "graphic-designer",
    description: "Create visual content for brands and communications",
    riasecCode: "AIR",
    riasecScores: { a: 9, i: 5, r: 4 },
    skills: ["Design Software", "Creativity", "Color Theory", "Typography"],
    educationPath: ["B.Des./B.A. in Design", "Certification", "Portfolio"],
    subjects: ["Art", "Computer Science", "English"],
    workEnvironment: "Office, Remote, Freelance",
    salaryRange: "Nu. 15,000 - 50,000/month",
    demandOutlook: "medium",
    bhutanSpecific: false,
    studyAbroad: { australia: "medium", "new-zealand": "medium", "usa": "low", "singapore": "medium" },
  },
  {
    id: "accountant",
    name: "Accountant",
    slug: "accountant",
    description: "Manage financial records and ensure tax compliance",
    riasecCode: "CEI",
    riasecScores: { c: 9, i: 6, e: 7 },
    skills: ["Accounting", "Attention to Detail", "Mathematics", "Software"],
    educationPath: ["B.Com/M.Com", "CA/CPA certification"],
    subjects: ["Mathematics", "Economics", "Business Studies"],
    workEnvironment: "Office",
    salaryRange: "Nu. 20,000 - 60,000/month",
    demandOutlook: "high",
    bhutanSpecific: true,
    studyAbroad: { australia: "medium", "new-zealand": "medium", "usa": "low", "singapore": "high" },
  },
  {
    id: "agriculturist",
    name: "Agriculturist",
    slug: "agriculturist",
    description: "Work in farming, agricultural research, or agribusiness",
    riasecCode: "RIE",
    riasecScores: { r: 9, i: 5, e: 7 },
    skills: ["Farming Knowledge", "Business", "Research", "Sustainability"],
    educationPath: ["B.Sc. Agriculture", "Specialized training"],
    subjects: ["Biology", "Chemistry", "Economics"],
    workEnvironment: "Farm, Office, Field",
    salaryRange: "Nu. 15,000 - 40,000/month",
    demandOutlook: "high",
    bhutanSpecific: true,
    studyAbroad: { australia: "high", "new-zealand": "very-high", "usa": "low", "singapore": "medium" },
  },
];
