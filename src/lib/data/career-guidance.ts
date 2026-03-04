/**
 * CAREER GUIDANCE DATABASE
 *
 * Career roadmap data based on MBTI + RIASEC combinations.
 * Curated for Bhutanese students with local job market outlook.
 */

// ============================================================================
// MBTI + RIASEC → CAREER MATCHES
// ============================================================================

export interface CareerMatch {
  career: string;
  fitScore: number; // 0-100
  bhutanOutlook: "Growing" | "Stable" | "Declining" | "Emerging";
  skills: string[];
  roadmap: string[];
  salaryRange?: string;
  education: string;
}

export const careerMatches: Record<string, CareerMatch[]> = {
  // INTJ combinations
  "INTJ-I": [ // Investigative
    {
      career: "Data Scientist",
      fitScore: 95,
      bhutanOutlook: "Growing",
      skills: ["Python", "Statistics", "Machine Learning", "SQL"],
      roadmap: [
        "Step 1: Learn Python programming (3-6 months)",
        "Step 2: Master Statistics & Probability (3-6 months)",
        "Step 3: Learn Machine Learning (6-12 months)",
        "Step 4: Build portfolio projects (ongoing)",
        "Step 5: Apply to companies like Thimphu Tech Park"
      ],
      salaryRange: "Nu 50,000 - 150,000/month",
      education: "Bachelor's in Computer Science, Statistics, or Math"
    },
    {
      career: "Research Scientist",
      fitScore: 92,
      bhutanOutlook: "Stable",
      skills: ["Research Methods", "Data Analysis", "Academic Writing", "Critical Thinking"],
      roadmap: [
        "Step 1: Excel in Science subjects (Physics, Chemistry, Biology)",
        "Step 2: Participate in science fairs and competitions",
        "Step 3: Bachelor's degree in chosen field",
        "Step 4: Master's/PhD for advanced research positions",
        "Step 5: Join RUB research centres or private R&D"
      ],
      salaryRange: "Nu 40,000 - 100,000/month",
      education: "Master's or PhD in scientific field"
    }
  ],
  "INTJ-A": [ // Artistic
    {
      career: "Software Architect",
      fitScore: 90,
      bhutanOutlook: "Growing",
      skills: ["System Design", "Multiple Languages", "Problem Solving", "Leadership"],
      roadmap: [
        "Step 1: Master at least 3 programming languages",
        "Step 2: Learn system design and architecture",
        "Step 3: Build complex projects",
        "Step 4: Work as software developer first",
        "Step 5: Progress to architect role"
      ],
      salaryRange: "Nu 60,000 - 180,000/month",
      education: "Bachelor's in Computer Science + Experience"
    }
  ],
  "INTJ-S": [ // Social
    {
      career: "Technical Writer",
      fitScore: 85,
      bhutanOutlook: "Stable",
      skills: ["Writing", "Technical Knowledge", "Research", "Communication"],
      roadmap: [
        "Step 1: Develop strong technical foundation",
        "Step 2: Practice technical writing (blogs, documentation)",
        "Step 3: Learn industry-standard tools (Git, Markdown)",
        "Step 4: Build portfolio of technical articles",
        "Step 5: Apply to tech companies or freelance"
      ],
      salaryRange: "Nu 30,000 - 80,000/month",
      education: "Bachelor's in Engineering, CS, or English"
    }
  ],
  "INTJ-IAS": [ // Investigative-Artistic-Social
    {
      career: "UX Designer",
      fitScore: 92,
      bhutanOutlook: "Growing",
      skills: ["Design Tools", "User Research", "Psychology", "Prototyping"],
      roadmap: [
        "Step 1: Learn design fundamentals and tools (Figma)",
        "Step 2: Study user psychology and behavior",
        "Step 3: Build case studies through personal projects",
        "Step 4: Create strong portfolio",
        "Step 5: Join tech companies or design agencies"
      ],
      salaryRange: "Nu 35,000 - 100,000/month",
      education: "Bachelor's in Design, Psychology, or related field"
    },
    {
      career: "Product Manager",
      fitScore: 88,
      bhutanOutlook: "Growing",
      skills: ["Leadership", "Data Analysis", "Communication", "Strategic Thinking"],
      roadmap: [
        "Step 1: Start in engineering or business role",
        "Step 2: Learn about product development",
        "Step 3: Develop analytical and communication skills",
        "Step 4: Transition to PM role internally",
        "Step 5: Lead product teams"
      ],
      salaryRange: "Nu 50,000 - 150,000/month",
      education: "MBA or Bachelor's + experience"
    }
  ],

  // INTP combinations
  "INTP-I": [
    {
      career: "Software Developer",
      fitScore: 95,
      bhutanOutlook: "Growing",
      skills: ["Programming", "Problem Solving", "Debugging", "System Design"],
      roadmap: [
        "Step 1: Learn programming fundamentals",
        "Step 2: Master a main language (JavaScript, Python)",
        "Step 3: Build projects and contribute to open source",
        "Step 4: Apply to tech companies or startups",
        "Step 5: Continuously learn new technologies"
      ],
      salaryRange: "Nu 40,000 - 120,000/month",
      education: "Bachelor's in Computer Science or self-taught"
    },
    {
      career: "Data Analyst",
      fitScore: 90,
      bhutanOutlook: "Growing",
      skills: ["SQL", "Excel", "Python", "Data Visualization"],
      roadmap: [
        "Step 1: Learn Excel and data analysis basics",
        "Step 2: Master SQL for database queries",
        "Step 3: Learn Python/R for advanced analysis",
        "Step 4: Practice with real datasets",
        "Step 5: Get certified (Google Data Analytics, etc.)"
      ],
      salaryRange: "Nu 35,000 - 90,000/month",
      education: "Bachelor's in Math, Stats, CS, or related"
    }
  ],

  // INFJ combinations
  "INFJ-S": [
    {
      career: "Counselor/Psychologist",
      fitScore: 94,
      bhutanOutlook: "Stable",
      skills: ["Empathy", "Active Listening", "Psychology", "Communication"],
      roadmap: [
        "Step 1: Study Psychology in school (focus on Sciences)",
        "Step 2: Bachelor's in Psychology",
        "Step 3: Master's in Counseling or Clinical Psychology",
        "Step 4: Complete required internship hours",
        "Step 5: Get licensed and practice"
      ],
      salaryRange: "Nu 30,000 - 80,000/month",
      education: "Master's in Psychology or Counseling"
    },
    {
      career: "Human Resources Professional",
      fitScore: 87,
      bhutanOutlook: "Stable",
      skills: ["Communication", "Conflict Resolution", "Organization", "Empathy"],
      roadmap: [
        "Step 1: Develop strong communication skills",
        "Step 2: Bachelor's in Business, Psychology, or HR",
        "Step 3: Learn HR laws and practices",
        "Step 4: Start as HR assistant/coordinator",
        "Step 5: Progress to HR manager roles"
      ],
      salaryRange: "Nu 30,000 - 80,000/month",
      education: "Bachelor's in Business Administration or HR"
    }
  ],

  // ENFJ combinations
  "ENFJ-S": [
    {
      career: "Teacher/Professor",
      fitScore: 95,
      bhutanOutlook: "Stable",
      skills: ["Teaching", "Communication", "Leadership", "Subject Knowledge"],
      roadmap: [
        "Step 1: Excel in your subject area",
        "Step 2: Bachelor's degree in Education + subject",
        "Step 3: B.Ed (Bachelor of Education)",
        "Step 4: Start teaching at school level",
        "Step 5: Pursue M.Ed/PhD for college teaching"
      ],
      salaryRange: "Nu 25,000 - 70,000/month",
      education: "B.Ed + Bachelor's in subject area"
    },
    {
      career: "Social Worker",
      fitScore: 90,
      bhutanOutlook: "Stable",
      skills: ["Empathy", "Communication", "Problem Solving", "Patience"],
      roadmap: [
        "Step 1: Volunteer with NGOs and community organizations",
        "Step 2: Bachelor's in Social Work (BSW)",
        "Step 3: Master's in Social Work (MSW)",
        "Step 4: Work with government or NGOs",
        "Step 5: Specialize in child welfare, healthcare, etc."
      ],
      salaryRange: "Nu 25,000 - 60,000/month",
      education: "Bachelor's or Master's in Social Work"
    }
  ],

  // ENTJ combinations
  "ENTJ-E": [ // Enterprising
    {
      career: "Entrepreneur/Business Owner",
      fitScore: 93,
      bhutanOutlook: "Growing",
      skills: ["Leadership", "Strategic Planning", "Risk Management", "Communication"],
      roadmap: [
        "Step 1: Gain experience in your industry of interest",
        "Step 2: Learn business fundamentals (finance, marketing)",
        "Step 3: Start with a small business or side project",
        "Step 4: Network and find mentors",
        "Step 5: Scale and grow your business"
      ],
      salaryRange: "Variable",
      education: "Any + Business acumen"
    },
    {
      career: "Management Consultant",
      fitScore: 88,
      bhutanOutlook: "Emerging",
      skills: ["Problem Solving", "Business Analysis", "Presentation", "Leadership"],
      roadmap: [
        "Step 1: Excel academically (top grades)",
        "Step 2: Bachelor's from top university",
        "Step 3: Gain business experience (2-4 years)",
        "Step 4: MBA from top business school",
        "Step 5: Join consulting firm or start your own"
      ],
      salaryRange: "Nu 50,000 - 150,000/month",
      education: "MBA + business experience"
    }
  ],

  // ESTP combinations
  "ESTP-R": [ // Realistic
    {
      career: "Civil Engineer",
      fitScore: 90,
      bhutanOutlook: "Growing",
      skills: ["Engineering", "Problem Solving", "Project Management", "Technical Skills"],
      roadmap: [
        "Step 1: Excel in Math and Physics",
        "Step 2: Bachelor's in Civil Engineering",
        "Step 3: Get practical experience through internships",
        "Step 4: Get licensed as professional engineer",
        "Step 5: Work on construction projects or start firm"
      ],
      salaryRange: "Nu 35,000 - 100,000/month",
      education: "Bachelor's in Civil Engineering"
    },
    {
      career: "Electrician/Technical Trades",
      fitScore: 85,
      bhutanOutlook: "Stable",
      skills: ["Technical Skills", "Problem Solving", "Physical Work", "Safety"],
      roadmap: [
        "Step 1: Complete Class 10 with Science",
        "Step 2: Join Technical Training Institute (TTI)",
        "Step 3: Complete certificate/diploma program",
        "Step 4: Apprentice under experienced tradesperson",
        "Step 5: Get certified and start working"
      ],
      salaryRange: "Nu 20,000 - 50,000/month",
      education: "Certificate/Diploma from Technical Institute"
    }
  ]
};

// ============================================================================
// SKILL DEVELOPMENT PATHS
// ============================================================================

export interface SkillPath {
  skill: string;
  importance: "critical" | "important" | "nice-to-have";
  resources: string[];
  activities: string[];
  timeline: string;
}

export const skillPaths: Record<string, SkillPath[]> = {
  "Data Science": [
    {
      skill: "Python Programming",
      importance: "critical",
      resources: [
        "YouTube: Python for Beginners - Programming with Mosh",
        "NCERT: Computer Science Python Class 11-12",
        "Practice: HackerRank Python challenges"
      ],
      activities: [
        "Code daily (minimum 30 minutes)",
        "Build small projects (calculator, to-do app)",
        "Join coding competitions"
      ],
      timeline: "3-6 months"
    },
    {
      skill: "Statistics",
      importance: "critical",
      resources: [
        "Khan Academy: Statistics and Probability",
        "NCERT: Mathematics Class 11-12 (Statistics chapter)",
        "Book: 'Naked Statistics' by Charles Wheelan"
      ],
      activities: [
        "Solve statistics problems daily",
        "Analyze real datasets",
        "Participate in math competitions"
      ],
      timeline: "3-6 months"
    },
    {
      skill: "Machine Learning",
      importance: "critical",
      resources: [
        "Coursera: Machine Learning by Andrew Ng",
        "YouTube: 3Blue1Brown for neural network visualizations",
        "Book: 'Hands-On Machine Learning' by Aurélien Géron"
      ],
      activities: [
        "Complete ML projects (Kaggle)",
        "Read research papers",
        "Build and deploy ML models"
      ],
      timeline: "6-12 months"
    }
  ],
  "Software Development": [
    {
      skill: "Web Development",
      importance: "critical",
      resources: [
        "freeCodeCamp: Full Stack Web Development",
        "YouTube: Traversy Media, Web Dev Simplified",
        "Practice: Build real projects"
      ],
      activities: [
        "Build portfolio website",
        "Clone popular websites (YouTube, Amazon)",
        "Contribute to open source"
      ],
      timeline: "6-12 months"
    },
    {
      skill: "Problem Solving",
      importance: "critical",
      resources: [
        "LeetCode: Coding challenges",
        "HackerRank: Problem solving",
        "Book: 'Cracking the Coding Interview'"
      ],
      activities: [
        "Solve 1 problem daily",
        "Participate in hackathons",
        "Study algorithms and data structures"
      ],
      timeline: "Ongoing"
    }
  ]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getCareerMatches(mbti: string, riasec?: string): CareerMatch[] {
  // Try exact MBTI + RIASEC combination first
  const key = riasec ? `${mbti}-${riasec}` : mbti;
  if (careerMatches[key]) {
    return careerMatches[key];
  }

  // Try MBTI + first letter of RIASEC
  if (riasec) {
    const firstLetterKey = `${mbti}-${riasec[0]}`;
    if (careerMatches[firstLetterKey]) {
      return careerMatches[firstLetterKey];
    }
  }

  // Fallback to MBTI only
  const mbtiPrefix = mbti.substring(0, 2);
  for (const [k, v] of Object.entries(careerMatches)) {
    if (k.startsWith(mbtiPrefix)) {
      return v;
    }
  }

  // Default fallback
  return [];
}

export function getSkillPath(careerArea: string): SkillPath[] {
  return skillPaths[careerArea] || [];
}
