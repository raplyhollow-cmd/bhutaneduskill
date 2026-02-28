/**
 * Server-safe constants for Bhutan education data
 * This file contains ONLY constants and can be safely imported during SSR/SSG
 *
 * For client-side tenant utilities, import from '@/lib/tenant-utils'
 */

// Career type for the careers database
export interface Career {
  id: string;
  name: string;
  slug: string;
  description: string;
  riasecCode: string;
  riasecScores: Record<string, number>;
  skills: string[];
  educationPath: string[];
  subjects: string[];
  workEnvironment: string;
  salaryRange: string;
  demandOutlook: string;
  bhutanSpecific: boolean;
  studyAbroad?: Record<string, string>;
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

// RUB Colleges data (Official 10 Constituent Colleges)
// Source: https://www.rub.edu.bt/index.php/colleges/
export const RUB_COLLEGES = [
  {
    id: "cst",
    name: "College of Science and Technology",
    shortName: "CST",
    location: "Rinchending, Phuentsholing",
    description: "First institute in Bhutan to offer undergraduate engineering programmes",
    website: "https://www.cst.edu.bt",
    programs: [
      { name: "B.E. in Civil Engineering", minMarks: 55, duration: "4 years", eligibility: "Class 12 Science with PCM", seats: 40 },
      { name: "B.E. in Electrical Engineering", minMarks: 55, duration: "4 years", eligibility: "Class 12 Science with PCM", seats: 40 },
      { name: "B.E. in Electronics & Communication", minMarks: 55, duration: "4 years", eligibility: "Class 12 Science with PCM", seats: 40 },
      { name: "B.E. in Information Technology", minMarks: 55, duration: "4 years", eligibility: "Class 12 Science with PCM", seats: 40 },
      { name: "B.E. in Instrumentation & Control", minMarks: 55, duration: "4 years", eligibility: "Class 12 Science with PCM", seats: 30 },
      { name: "B.Architecture", minMarks: 55, duration: "5 years", eligibility: "Class 12 Science with PCM", seats: 25 },
      { name: "B.Sc. in Computer Science", minMarks: 55, duration: "4 years", eligibility: "Class 12 Science with PCM", seats: 40 },
      { name: "Diploma in IT", minMarks: 45, duration: "3 years", eligibility: "Class 12 any stream", seats: 60 },
    ],
  },
  {
    id: "jnec",
    name: "Jigme Namgyel Engineering College",
    shortName: "JNEC",
    location: "Dewathang, Samdrup Jongkhar",
    description: "Formerly Royal Bhutan Polytechnic, specializes in applied engineering",
    website: "https://www.jnec.edu.bt",
    programs: [
      { name: "B.E. in Civil Engineering", minMarks: 50, duration: "4 years", eligibility: "Class 12 Science with PCM", seats: 60 },
      { name: "B.E. in Electrical Engineering", minMarks: 50, duration: "4 years", eligibility: "Class 12 Science with PCM", seats: 40 },
      { name: "B.E. in Mechanical Engineering", minMarks: 50, duration: "4 years", eligibility: "Class 12 Science with PCM", seats: 40 },
      { name: "Diploma in Civil Engineering", minMarks: 40, duration: "3 years", eligibility: "Class 10 with Math & Science", seats: 80 },
      { name: "Diploma in Electrical Engineering", minMarks: 40, duration: "3 years", eligibility: "Class 10 with Math & Science", seats: 60 },
      { name: "Diploma in Mechanical Engineering", minMarks: 40, duration: "3 years", eligibility: "Class 10 with Math & Science", seats: 60 },
    ],
  },
  {
    id: "gcit",
    name: "Gyalpozhing College of Information Technology",
    shortName: "GCIT",
    location: "Gyalpozhing, Mongar",
    description: "Specializes in IT programmes with 'Learning by Doing' approach",
    website: "https://www.gcit.edu.bt",
    programs: [
      { name: "B.C.A (Bachelor of Computer Applications)", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 60 },
      { name: "B.Sc. in Information Technology", minMarks: 50, duration: "4 years", eligibility: "Class 12 Science", seats: 40 },
      { name: "Diploma in IT", minMarks: 40, duration: "3 years", eligibility: "Class 12 any stream", seats: 60 },
    ],
  },
  {
    id: "gcbs",
    name: "Gedu College of Business Studies",
    shortName: "GCBS",
    location: "Gedu",
    description: "Business administration and commerce programmes",
    website: "https://www.gcbs.edu.bt",
    programs: [
      { name: "B.B.A", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 120 },
      { name: "B.Com", minMarks: 45, duration: "4 years", eligibility: "Class 12 Commerce", seats: 120 },
      { name: "B.B.A in Finance", minMarks: 50, duration: "4 years", eligibility: "Class 12 Commerce", seats: 40 },
      { name: "B.B.A in Marketing", minMarks: 50, duration: "4 years", eligibility: "Class 12 Commerce", seats: 40 },
    ],
  },
  {
    id: "cnr",
    name: "College of Natural Resources",
    shortName: "CNR",
    location: "Lobesa, Punakha",
    description: "Natural resources management programmes",
    website: "https://www.cnr.edu.bt",
    programs: [
      { name: "B.Sc. Agriculture", minMarks: 45, duration: "4 years", eligibility: "Class 12 Science with PCB", seats: 60 },
      { name: "B.Sc. Forestry", minMarks: 45, duration: "4 years", eligibility: "Class 12 Science with PCB", seats: 40 },
      { name: "B.Sc. Animal Science", minMarks: 45, duration: "4 years", eligibility: "Class 12 Science with PCB", seats: 40 },
      { name: "B.Sc. Environment & Climate Studies", minMarks: 50, duration: "4 years", eligibility: "Class 12 Science", seats: 30 },
      { name: "Diploma in Agriculture", minMarks: 40, duration: "3 years", eligibility: "Class 12 Science", seats: 60 },
      { name: "Diploma in Animal Husbandry", minMarks: 40, duration: "3 years", eligibility: "Class 12 Science", seats: 40 },
      { name: "Diploma in Forestry", minMarks: 40, duration: "3 years", eligibility: "Class 12 Science", seats: 40 },
    ],
  },
  {
    id: "sherubtse",
    name: "Sherubtse College",
    shortName: "Sherubtse",
    location: "Kanglung, Trashigang",
    description: "Oldest and largest multidisciplinary college in RUB",
    website: "https://www.sherubtse.edu.bt",
    programs: [
      { name: "B.A.", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 180 },
      { name: "B.Sc.", minMarks: 45, duration: "4 years", eligibility: "Class 12 Science", seats: 180 },
      { name: "B.Com", minMarks: 45, duration: "4 years", eligibility: "Class 12 Commerce", seats: 120 },
      { name: "B.A. in History & Dzongkha", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 40 },
      { name: "B.Sc. in Physical Science", minMarks: 50, duration: "4 years", eligibility: "Class 12 Science with PCM", seats: 40 },
      { name: "B.Sc. in Life Science", minMarks: 50, duration: "4 years", eligibility: "Class 12 Science with PCB", seats: 40 },
    ],
  },
  {
    id: "clcs",
    name: "College of Language and Culture Studies",
    shortName: "CLCS",
    location: "Taktse, Trongsa",
    description: "Language, culture, and Buddhist studies programmes",
    website: "https://www.clcs.edu.bt",
    programs: [
      { name: "B.A. in Language and Culture", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 40 },
      { name: "B.A. in Language and Literature", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 40 },
      { name: "B.A. in Bhutanese & Himalayan Studies", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 30 },
      { name: "Diploma in Language & Communication", minMarks: 40, duration: "2 years", eligibility: "Class 12 any stream", seats: 30 },
    ],
  },
  {
    id: "pce",
    name: "Paro College of Education",
    shortName: "PCE",
    location: "Paro",
    description: "Teacher education programmes at diploma, undergraduate and postgraduate levels",
    website: "https://www.pce.edu.bt",
    programs: [
      { name: "B.Ed Primary", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 100 },
      { name: "B.Ed Secondary", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 100 },
      { name: "B.Ed Dzongkha", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 30 },
      { name: "Postgraduate Diploma in Education", minMarks: 45, duration: "1 year", eligibility: "Bachelor's degree", seats: 50 },
      { name: "Master of Education (Educational Leadership)", minMarks: 50, duration: "2 years", eligibility: "B.Ed + Bachelor's degree", seats: 20 },
      { name: "Diploma in School Leadership & Management", minMarks: 45, duration: "1 year", eligibility: "In-service teachers", seats: 30 },
    ],
  },
  {
    id: "sce",
    name: "Samtse College of Education",
    shortName: "SCE",
    location: "Samtse",
    description: "Teacher education and guidance & counselling programmes",
    website: "https://www.sce.edu.bt",
    programs: [
      { name: "B.Ed Primary", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 100 },
      { name: "B.Ed Secondary", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 100 },
      { name: "Postgraduate Diploma in Education", minMarks: 45, duration: "1 year", eligibility: "Bachelor's degree", seats: 50 },
      { name: "PG Diploma in Guidance & Counseling", minMarks: 45, duration: "1 year", eligibility: "Bachelor's degree", seats: 30 },
    ],
  },
  {
    id: "ycc",
    name: "Yonphula Centenary College",
    shortName: "YCC",
    location: "Yonphula, Trashigang",
    description: "POSTGRADUATE programmes in Arts and Sciences",
    status: "closed",
    website: "https://www.ycc.edu.bt",
    programs: [
      { name: "Master of Arts in English", minMarks: 50, duration: "2 years", eligibility: "Bachelor's degree in English", seats: 20 },
      { name: "Master of Arts in Dzongkha", minMarks: 50, duration: "2 years", eligibility: "Bachelor's degree in Dzongkha", seats: 20 },
      { name: "Master of Science in Physics", minMarks: 50, duration: "2 years", eligibility: "B.Sc. in Physics", seats: 15 },
    ],
  },
];

// Private Colleges in Bhutan (NOT part of RUB but recognized)
// Note: Yonphula Centenary College (YCC) is now CLOSED
export const PRIVATE_COLLEGES = [
  {
    id: "rtc",
    name: "Royal Thimphu College",
    shortName: "RTC",
    location: "Thimphu",
    description: "Bhutan's first private college, affiliated to RUB",
    website: "https://www.rtc.edu.bt",
    isPrivate: true,
    programs: [
      { name: "B.Sc. Nursing", minMarks: 55, duration: "4 years", eligibility: "Class 12 Science with PCB", seats: 40, fees: "Nu. 250,000/year" },
      { name: "B.Sc. Public Health", minMarks: 50, duration: "4 years", eligibility: "Class 12 Science", seats: 30, fees: "Nu. 200,000/year" },
      { name: "B.A. in English & Dzongkha Studies", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 40, fees: "Nu. 150,000/year" },
      { name: "B.A. in History & Dzongkha Studies", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 40, fees: "Nu. 150,000/year" },
      { name: "B.A. in Political Science & Sociology", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 40, fees: "Nu. 150,000/year" },
      { name: "Bachelor in Counseling", minMarks: 50, duration: "4 years", eligibility: "Class 12 any stream", seats: 30, fees: "Nu. 180,000/year" },
      { name: "B.B.A", minMarks: 45, duration: "4 years", eligibility: "Class 12 any stream", seats: 60, fees: "Nu. 180,000/year" },
    ],
  },
  {
    id: "nrc",
    name: "Norbuling Rigter College",
    shortName: "NRC",
    location: "Paro",
    description: "Private college offering business and management programmes",
    website: "https://www.nrc.edu.bt",
    isPrivate: true,
    programs: [
      { name: "B.B.A (Hons)", minMarks: 40, duration: "3 years", eligibility: "Class 12 any stream", fees: "Nu. 175,000/year" },
      { name: "B.A. (Hons) Business Studies", minMarks: 40, duration: "3 years", eligibility: "Class 12 Commerce", fees: "Nu. 175,000/year" },
      { name: "B.Sc. (Hons) Computing", minMarks: 45, duration: "3 years", eligibility: "Class 12 Science", fees: "Nu. 200,000/year" },
    ],
  },
];

// Technical Training Institutes (TTIs) - Vocational Education
// These are diploma/certificate level programmes under Ministry of Education and Skills Development
export const TTI_INSTITUTES = [
  {
    id: "tti-thimphu",
    name: "Technical Training Institute - Thimphu",
    location: "Thimphu",
    programs: [
      { name: "Diploma in Civil Engineering", minMarks: 40, duration: "3 years", eligibility: "Class 10 with Math & Science" },
      { name: "Diploma in Electrical Engineering", minMarks: 40, duration: "3 years", eligibility: "Class 10 with Math & Science" },
      { name: "Diploma in Auto Mechanics", minMarks: 40, duration: "3 years", eligibility: "Class 10" },
      { name: "Certificate in ICT", minMarks: 35, duration: "1 year", eligibility: "Class 10" },
    ],
  },
  {
    id: "tti-rangjung",
    name: "Technical Training Institute - Rangjung",
    location: "Rangjung, Trashigang",
    programs: [
      { name: "Diploma in Electrical Engineering", minMarks: 40, duration: "3 years", eligibility: "Class 10 with Math & Science" },
      { name: "Diploma in Furniture Making", minMarks: 35, duration: "2 years", eligibility: "Class 10" },
      { name: "Certificate in Electrical", minMarks: 35, duration: "1 year", eligibility: "Class 10" },
    ],
  },
  {
    id: "tti-chumey",
    name: "Technical Training Institute - Chumey",
    location: "Chumey, Bumthang",
    programs: [
      { name: "Diploma in Auto Mechanics", minMarks: 40, duration: "3 years", eligibility: "Class 10" },
      { name: "Certificate in Body Repair & Painting", minMarks: 35, duration: "1 year", eligibility: "Class 10" },
    ],
  },
  {
    id: "tti-khuruthang",
    name: "Technical Training Institute - Khuruthang",
    location: "Khuruthang, Punakha",
    programs: [
      { name: "Diploma in Civil Engineering", minMarks: 40, duration: "3 years", eligibility: "Class 10 with Math & Science" },
      { name: "Diploma in Architecture", minMarks: 45, duration: "3 years", eligibility: "Class 12 Science" },
    ],
  },
];

// Desuung Skilling Programme - Government initiative for youth skills training
export const DESUUNG_SKILLING = [
  {
    id: "dsp-cs",
    name: "Certificate in Web Applications",
    duration: "3 months",
    eligibility: "Class 12 passed",
    location: "Thimphu",
    fees: "Free (Government sponsored)",
  },
  {
    id: "dsp-hotel",
    name: "Certificate in Hospitality Management",
    duration: "3 months",
    eligibility: "Class 10 passed",
    location: "Thimphu",
    fees: "Free (Government sponsored)",
  },
  {
    id: "dsp-accounting",
    name: "Certificate in Accounting with Tally",
    duration: "3 months",
    eligibility: "Class 12 passed",
    location: "Thimphu/Phuentsholing",
    fees: "Free (Government sponsored)",
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
