/**
 * RUB (Royal University of Bhutan) Colleges Complete Data
 *
 * This file contains comprehensive data for all 5 RUB constituent colleges
 * with their programs, eligibility criteria, fees, and career prospects.
 *
 * Last Updated: March 5, 2026
 * Source: RUB official website and admission brochures
 */

export interface RUBProgram {
  code: string;
  name: string;
  level: "certificate" | "diploma" | "bachelor" | "master" | "phd";
  duration: number; // in years
  eligibility: {
    minPercentage: number;
    requiredSubjects: string[];
    stream?: "Science" | "Arts" | "Commerce" | "Any";
  };
  fees: {
    tuition: number; // per semester
    hostel?: number;
  };
  capacity: number;
  careerProspects: string[];
  riasecCodes: string[];
  description: string;
}

export interface RUBCollege {
  id: string;
  name: string;
  code: string;
  type: "constituent";
  dzongkhag: string;
  location: string;
  website: string;
  email: string;
  phone: string;
  programs: RUBProgram[];
  facilities: {
    hasHostel: boolean;
    hasLibrary: boolean;
    hasLab: boolean;
    hasSports: boolean;
  };
  description: string;
}

/**
 * Complete RUB Colleges Data
 */
export const rubCollegesData: RUBCollege[] = [
  {
    id: "rub_cnr",
    name: "College of Natural Resources",
    code: "CNR",
    type: "constituent",
    dzongkhag: "Punakha",
    location: "Lobesa, Punakha",
    website: "www.cnr.edu.bt",
    email: "info@cnr.edu.bt",
    phone: "+975-02-327911",
    facilities: {
      hasHostel: true,
      hasLibrary: true,
      hasLab: true,
      hasSports: true,
    },
    description: "Premier institution for agriculture, forestry, and environmental sciences in Bhutan. Located in the scenic Lobesa valley.",
    programs: [
      {
        code: "BScAG",
        name: "Bachelor of Science in Agriculture",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry", "Biology"],
          stream: "Science",
        },
        fees: { tuition: 25000, hostel: 8000 },
        capacity: 60,
        careerProspects: [
          "Agriculture Officer",
          "Research Scientist",
          "Agri-entrepreneur",
          "Farm Manager",
          "Agriculture Extension Officer",
        ],
        riasecCodes: ["I", "R"],
        description: "Comprehensive study of crop science, soil science, horticulture, and agricultural economics.",
      },
      {
        code: "BScANFSH",
        name: "Bachelor of Science in Animal Science",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry", "Biology"],
          stream: "Science",
        },
        fees: { tuition: 25000, hostel: 8000 },
        capacity: 40,
        careerProspects: [
          "Livestock Officer",
          "Veterinary Technician",
          "Dairy Farm Manager",
          "Poultry Farm Manager",
          "Animal Health Worker",
        ],
        riasecCodes: ["R", "I"],
        description: "Study of livestock production, animal health, breeding, and farm management.",
      },
      {
        code: "BScForestry",
        name: "Bachelor of Science in Forestry",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 55,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry", "Biology"],
          stream: "Science",
        },
        fees: { tuition: 25000, hostel: 8000 },
        capacity: 30,
        careerProspects: [
          "Forestry Officer",
          "Park Ranger",
          "Forest Guard",
          "Environmentalist",
          "Carbon Specialist",
        ],
        riasecCodes: ["R", "I"],
        description: "Focus on forest management, conservation, watershed management, and sustainable forestry practices.",
      },
      {
        code: "BScFoodTech",
        name: "Bachelor of Science in Food Technology",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry", "Biology"],
          stream: "Science",
        },
        fees: { tuition: 25000, hostel: 8000 },
        capacity: 30,
        careerProspects: [
          "Food Technologist",
          "Quality Control Officer",
          "Food Safety Inspector",
          "Product Development Manager",
        ],
        riasecCodes: ["I", "R"],
        description: "Study of food processing, preservation, quality assurance, and food safety standards.",
      },
      {
        code: "BScEnv",
        name: "Bachelor of Science in Environment and Climate Studies",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry", "Biology"],
          stream: "Science",
        },
        fees: { tuition: 25000, hostel: 8000 },
        capacity: 25,
        careerProspects: [
          "Environmental Officer",
          "Climate Change Specialist",
          "Waste Management Officer",
          "EIA Specialist",
        ],
        riasecCodes: ["I", "S"],
        description: "Focus on environmental science, climate change, pollution control, and sustainable development.",
      },
    ],
  },
  {
    id: "rub_cst",
    name: "College of Science and Technology",
    code: "CST",
    type: "constituent",
    dzongkhag: "Chukha",
    location: "Rinchending, Phuentsholing",
    website: "www.cst.edu.bt",
    email: "info@cst.edu.bt",
    phone: "+975-05-252247",
    facilities: {
      hasHostel: true,
      hasLibrary: true,
      hasLab: true,
      hasSports: true,
    },
    description: "Leading engineering and technology institution in Bhutan, located in the border town of Phuentsholing.",
    programs: [
      {
        code: "BECivil",
        name: "Bachelor of Engineering in Civil Engineering",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 60,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry"],
          stream: "Science",
        },
        fees: { tuition: 30000, hostel: 8000 },
        capacity: 40,
        careerProspects: [
          "Civil Engineer",
          "Structural Engineer",
          "Construction Manager",
          "Infrastructure Planner",
          "Site Engineer",
        ],
        riasecCodes: ["R", "I"],
        description: "Study of structural engineering, construction materials, geotechnics, and transportation engineering.",
      },
      {
        code: "BEElectrical",
        name: "Bachelor of Engineering in Electrical Engineering",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 60,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry"],
          stream: "Science",
        },
        fees: { tuition: 30000, hostel: 8000 },
        capacity: 40,
        careerProspects: [
          "Electrical Engineer",
          "Power System Engineer",
          "Maintenance Engineer",
          "Design Engineer",
        ],
        riasecCodes: ["R", "I"],
        description: "Focus on power systems, electrical machines, renewable energy, and power distribution.",
      },
      {
        code: "BEElectronics",
        name: "Bachelor of Engineering in Electronics and Communication Engineering",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 60,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry"],
          stream: "Science",
        },
        fees: { tuition: 30000, hostel: 8000 },
        capacity: 40,
        careerProspects: [
          "Electronics Engineer",
          "Communication Engineer",
          "Embedded Systems Engineer",
          "Network Engineer",
        ],
        riasecCodes: ["I", "R"],
        description: "Study of electronic circuits, communication systems, embedded systems, and signal processing.",
      },
      {
        code: "BEComputer",
        name: "Bachelor of Engineering in Computer Engineering",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 60,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry"],
          stream: "Science",
        },
        fees: { tuition: 30000, hostel: 8000 },
        capacity: 40,
        careerProspects: [
          "Software Engineer",
          "System Architect",
          "Network Engineer",
          "IT Consultant",
          "Data Engineer",
        ],
        riasecCodes: ["I", "R"],
        description: "Study of computer architecture, programming, networks, and software engineering.",
      },
      {
        code: "BEInformation",
        name: "Bachelor of Engineering in Information Technology",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 55,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry"],
          stream: "Science",
        },
        fees: { tuition: 30000, hostel: 8000 },
        capacity: 35,
        careerProspects: [
          "IT Manager",
          "Software Developer",
          "Database Administrator",
          "Cyber Security Specialist",
        ],
        riasecCodes: ["I", "C"],
        description: "Focus on software development, databases, web technologies, and IT management.",
      },
      {
        code: "BArch",
        name: "Bachelor of Architecture",
        level: "bachelor",
        duration: 5,
        eligibility: {
          minPercentage: 55,
          requiredSubjects: ["English", "Mathematics", "Physics"],
          stream: "Science",
        },
        fees: { tuition: 35000, hostel: 8000 },
        capacity: 25,
        careerProspects: [
          "Architect",
          "Urban Planner",
          "Interior Designer",
          "Landscape Architect",
        ],
        riasecCodes: ["A", "I"],
        description: "Study of architectural design, building construction, landscape architecture, and urban planning.",
      },
      {
        code: "BQTQM",
        name: "Bachelor in Quantity Surveying and Quantity Management",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry"],
          stream: "Science",
        },
        fees: { tuition: 30000, hostel: 8000 },
        capacity: 25,
        careerProspects: [
          "Quantity Surveyor",
          "Cost Engineer",
          "Project Manager",
          "Estimator",
        ],
        riasecCodes: ["C", "R"],
        description: "Study of construction cost estimation, project management, and contract administration.",
      },
      {
        code: "BDevPlanner",
        name: "Bachelor in Development Planning",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Economics"],
          stream: "Any",
        },
        fees: { tuition: 25000, hostel: 8000 },
        capacity: 30,
        careerProspects: [
          "Development Planner",
          "Policy Analyst",
          "Urban Planner",
          "Research Officer",
        ],
        riasecCodes: ["I", "S"],
        description: "Focus on rural development planning, regional planning, and sustainable development.",
      },
    ],
  },
  {
    id: "rub_gcbs",
    name: "Gaeddu College of Business Studies",
    code: "GCBS",
    type: "constituent",
    dzongkhag: "Chukha",
    location: "Gaeddu, Wangdue Phodrang",
    website: "www.gcbs.edu.bt",
    email: "info@gcbs.edu.bt",
    phone: "+975-02-366468",
    facilities: {
      hasHostel: true,
      hasLibrary: true,
      hasLab: false,
      hasSports: true,
    },
    description: "Premier business education institution in Bhutan, located in the picturesque Gedu town.",
    programs: [
      {
        code: "BCom",
        name: "Bachelor of Commerce",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Economics", "Accountancy"],
          stream: "Commerce",
        },
        fees: { tuition: 25000, hostel: 8000 },
        capacity: 60,
        careerProspects: [
          "Accountant",
          "Financial Analyst",
          "Tax Consultant",
          "Auditor",
          "Bank Officer",
        ],
        riasecCodes: ["C", "E"],
        description: "Study of accounting, finance, taxation, and business laws.",
      },
      {
        code: "BBA",
        name: "Bachelor of Business Administration",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Economics"],
          stream: "Any",
        },
        fees: { tuition: 25000, hostel: 8000 },
        capacity: 60,
        careerProspects: [
          "Business Manager",
          "Marketing Executive",
          "HR Manager",
          "Management Trainee",
          "Entrepreneur",
        ],
        riasecCodes: ["E", "S"],
        description: "Study of management principles, marketing, HR, finance, and entrepreneurship.",
      },
      {
        code: "BBM",
        name: "Bachelor of Business Management",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Economics"],
          stream: "Any",
        },
        fees: { tuition: 25000, hostel: 8000 },
        capacity: 40,
        careerProspects: [
          "Business Analyst",
          "Operations Manager",
          "Project Manager",
          "Supply Chain Manager",
        ],
        riasecCodes: ["E", "C"],
        description: "Focus on business operations, supply chain management, and organizational behavior.",
      },
      {
        code: "BInfoSys",
        name: "Bachelor in Information Systems",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Computer Science"],
          stream: "Any",
        },
        fees: { tuition: 30000, hostel: 8000 },
        capacity: 30,
        careerProspects: [
          "Business Analyst",
          "IT Manager",
          "Systems Analyst",
          "Data Analyst",
        ],
        riasecCodes: ["I", "C"],
        description: "Integration of business management with information technology and data analysis.",
      },
    ],
  },
  {
    id: "rub_sherubtse",
    name: "Sherubtse College",
    code: "SC",
    type: "constituent",
    dzongkhag: "Trashigang",
    location: "Kanglung, Trashigang",
    website: "www.sherubtse.edu.bt",
    email: "info@sherubtse.edu.bt",
    phone: "+975-04-535124",
    facilities: {
      hasHostel: true,
      hasLibrary: true,
      hasLab: true,
      hasSports: true,
    },
    description: "The oldest and largest college in Bhutan, offering diverse programs in arts, sciences, and social sciences.",
    programs: [
      {
        code: "BScPhys",
        name: "Bachelor of Science in Physics",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry"],
          stream: "Science",
        },
        fees: { tuition: 25000, hostel: 7000 },
        capacity: 30,
        careerProspects: [
          "Physics Teacher",
          "Research Assistant",
          "Quality Control Officer",
          "Meteorologist",
        ],
        riasecCodes: ["I", "R"],
        description: "Study of classical physics, quantum mechanics, thermodynamics, and applied physics.",
      },
      {
        code: "BScChem",
        name: "Bachelor of Science in Chemistry",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry"],
          stream: "Science",
        },
        fees: { tuition: 25000, hostel: 7000 },
        capacity: 30,
        careerProspects: [
          "Chemistry Teacher",
          "Quality Control Chemist",
          "Lab Technician",
          "Research Assistant",
        ],
        riasecCodes: ["I", "R"],
        description: "Study of organic, inorganic, physical, and analytical chemistry with practical applications.",
      },
      {
        code: "BScMath",
        name: "Bachelor of Science in Mathematics",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry"],
          stream: "Science",
        },
        fees: { tuition: 25000, hostel: 7000 },
        capacity: 30,
        careerProspects: [
          "Mathematics Teacher",
          "Data Analyst",
          "Statistician",
          "Bank Officer",
        ],
        riasecCodes: ["I", "C"],
        description: "Study of calculus, algebra, statistics, and mathematical modeling.",
      },
      {
        code: "BScBiol",
        name: "Bachelor of Science in Biology",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry", "Biology"],
          stream: "Science",
        },
        fees: { tuition: 25000, hostel: 7000 },
        capacity: 30,
        careerProspects: [
          "Biology Teacher",
          "Lab Technician",
          "Environmental Officer",
          "Research Assistant",
        ],
        riasecCodes: ["I", "R"],
        description: "Study of botany, zoology, ecology, and molecular biology.",
      },
      {
        code: "BScGeo",
        name: "Bachelor of Science in Geology",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Physics", "Chemistry"],
          stream: "Science",
        },
        fees: { tuition: 25000, hostel: 7000 },
        capacity: 20,
        careerProspects: [
          "Geologist",
          "Mining Engineer",
          "Hydrogeologist",
          "Environmental Consultant",
        ],
        riasecCodes: ["R", "I"],
        description: "Study of earth sciences, mineralogy, structural geology, and natural resources.",
      },
      {
        code: "BScEVS",
        name: "Bachelor of Science in Environmental and Sustainability Studies",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 45,
          requiredSubjects: ["English", "Mathematics", "Science"],
          stream: "Science",
        },
        fees: { tuition: 25000, hostel: 7000 },
        capacity: 25,
        careerProspects: [
          "Environmental Officer",
          "Sustainability Officer",
          "Waste Management Specialist",
          "EIA Coordinator",
        ],
        riasecCodes: ["I", "S"],
        description: "Focus on environmental science, sustainability, climate change, and conservation.",
      },
      {
        code: "BAEng",
        name: "Bachelor of Arts in English",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 45,
          requiredSubjects: ["English", "Dzongkha"],
          stream: "Arts",
        },
        fees: { tuition: 20000, hostel: 7000 },
        capacity: 40,
        careerProspects: [
          "English Teacher",
          "Journalist",
          "Content Writer",
          "Editor",
          "Public Relations Officer",
        ],
        riasecCodes: ["A", "S"],
        description: "Study of English literature, linguistics, and communication skills.",
      },
      {
        code: "BADzo",
        name: "Bachelor of Arts in Dzongkha",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 45,
          requiredSubjects: ["Dzongkha", "English"],
          stream: "Arts",
        },
        fees: { tuition: 20000, hostel: 7000 },
        capacity: 30,
        careerProspects: [
          "Dzongkha Teacher",
          "Translator",
          "Cultural Officer",
          "Researcher",
        ],
        riasecCodes: ["A", "S"],
        description: "Study of Dzongkha language, literature, and Bhutanese culture.",
      },
      {
        code: "BAHist",
        name: "Bachelor of Arts in History",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 45,
          requiredSubjects: ["English", "History", "Political Science"],
          stream: "Arts",
        },
        fees: { tuition: 20000, hostel: 7000 },
        capacity: 30,
        careerProspects: [
          "History Teacher",
          "Archivist",
          "Museum Curator",
          "Researcher",
        ],
        riasecCodes: ["I", "A"],
        description: "Study of Bhutanese and world history, archaeology, and heritage conservation.",
      },
      {
        code: "BAPolSci",
        name: "Bachelor of Arts in Political Science",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 45,
          requiredSubjects: ["English", "Political Science", "History"],
          stream: "Arts",
        },
        fees: { tuition: 20000, hostel: 7000 },
        capacity: 30,
        careerProspects: [
          "Civil Servant",
          "Policy Analyst",
          "Diplomat",
          "Public Administrator",
        ],
        riasecCodes: ["E", "S"],
        description: "Study of political systems, governance, international relations, and public policy.",
      },
      {
        code: "BAEco",
        name: "Bachelor of Arts in Economics",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Mathematics", "Economics"],
          stream: "Any",
        },
        fees: { tuition: 22000, hostel: 7000 },
        capacity: 30,
        careerProspects: [
          "Economist",
          "Bank Officer",
          "Policy Analyst",
          "Data Analyst",
        ],
        riasecCodes: ["I", "C"],
        description: "Study of microeconomics, macroeconomics, development economics, and econometrics.",
      },
      {
        code: "BAGeo",
        name: "Bachelor of Arts in Geography",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 45,
          requiredSubjects: ["English", "Geography", "Economics"],
          stream: "Arts",
        },
        fees: { tuition: 20000, hostel: 7000 },
        capacity: 25,
        careerProspects: [
          "Geography Teacher",
          "Urban Planner",
          "Environmental Officer",
          "Surveyor",
        ],
        riasecCodes: ["I", "R"],
        description: "Study of physical geography, human geography, cartography, and GIS.",
      },
      {
        code: "BASoci",
        name: "Bachelor of Arts in Sociology",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 45,
          requiredSubjects: ["English", "Sociology", "History"],
          stream: "Arts",
        },
        fees: { tuition: 20000, hostel: 7000 },
        capacity: 25,
        careerProspects: [
          "Social Worker",
          "Researcher",
          "Community Development Officer",
          "NGO Worker",
        ],
        riasecCodes: ["S", "I"],
        description: "Study of social institutions, social change, and community development.",
      },
    ],
  },
  {
    id: "rub_paro",
    name: "Paro College of Education",
    code: "PCE",
    type: "constituent",
    dzongkhag: "Paro",
    location: "Paro",
    website: "www.pce.edu.bt",
    email: "info@pce.edu.bt",
    phone: "+975-02-271347",
    facilities: {
      hasHostel: true,
      hasLibrary: true,
      hasLab: false,
      hasSports: true,
    },
    description: "Premier teacher education institution in Bhutan, producing qualified teachers for the nation.",
    programs: [
      {
        code: "BEdPri",
        name: "Bachelor of Education in Primary Education",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 45,
          requiredSubjects: ["English", "Dzongkha", "Mathematics"],
          stream: "Any",
        },
        fees: { tuition: 20000, hostel: 7000 },
        capacity: 50,
        careerProspects: [
          "Primary School Teacher",
          "School Administrator",
          "Education Officer",
        ],
        riasecCodes: ["S", "A"],
        description: "Comprehensive teacher training for primary level (PP-VI) with pedagogy and subject methods.",
      },
      {
        code: "BEdSec",
        name: "Bachelor of Education in Secondary Education",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 45,
          requiredSubjects: ["English", "Dzongkha", "Teaching Subject"],
          stream: "Any",
        },
        fees: { tuition: 20000, hostel: 7000 },
        capacity: 100,
        careerProspects: [
          "Secondary School Teacher",
          "Lecturer",
          "Education Administrator",
          "Curriculum Developer",
        ],
        riasecCodes: ["S", "I"],
        description: "Teacher training for secondary level with subject specialization (English, Dzongkha, Math, Science, Social Studies).",
      },
      {
        code: "BEdSecEng",
        name: "Bachelor of Education in Secondary Education (English)",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["English", "Literature"],
          stream: "Arts",
        },
        fees: { tuition: 20000, hostel: 7000 },
        capacity: 30,
        careerProspects: [
          "English Teacher",
          "Lecturer",
          "ELT Specialist",
        ],
        riasecCodes: ["S", "A"],
        description: "Specialized English teacher training with focus on language and literature pedagogy.",
      },
      {
        code: "BEdSecDzo",
        name: "Bachelor of Education in Secondary Education (Dzongkha)",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["Dzongkha"],
          stream: "Arts",
        },
        fees: { tuition: 20000, hostel: 7000 },
        capacity: 25,
        careerProspects: [
          "Dzongkha Teacher",
          "Cultural Officer",
          "Dzongkha Writer",
        ],
        riasecCodes: ["S", "A"],
        description: "Specialized Dzongkha teacher training with focus on national language pedagogy.",
      },
      {
        code: "BEdSecMath",
        name: "Bachelor of Education in Secondary Education (Mathematics)",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["Mathematics", "Physics"],
          stream: "Science",
        },
        fees: { tuition: 20000, hostel: 7000 },
        capacity: 30,
        careerProspects: [
          "Mathematics Teacher",
          "STEM Educator",
          "Education Researcher",
        ],
        riasecCodes: ["I", "S"],
        description: "Specialized Mathematics teacher training with focus on mathematical pedagogy.",
      },
      {
        code: "BEdSecSci",
        name: "Bachelor of Education in Secondary Education (Science)",
        level: "bachelor",
        duration: 4,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["Physics", "Chemistry", "Biology"],
          stream: "Science",
        },
        fees: { tuition: 20000, hostel: 7000 },
        capacity: 30,
        careerProspects: [
          "Science Teacher",
          "Lab Instructor",
          "STEM Coordinator",
        ],
        riasecCodes: ["I", "R"],
        description: "Specialized Science teacher training with focus on science pedagogy and practical work.",
      },
      {
        code: "MEd",
        name: "Master of Education",
        level: "master",
        duration: 2,
        eligibility: {
          minPercentage: 50,
          requiredSubjects: ["BEd", "Teaching Experience"],
          stream: "Any",
        },
        fees: { tuition: 35000, hostel: 8000 },
        capacity: 30,
        careerProspects: [
          "School Principal",
          "Lecturer",
          "Education Officer",
          "Curriculum Developer",
        ],
        riasecCodes: ["S", "I"],
        description: "Advanced teacher education with specializations in educational leadership, curriculum, and pedagogy.",
      },
    ],
  },
];

/**
 * Helper function to get all programs across all colleges
 */
export function getAllRUBPrograms(): Array<RUBProgram & { collegeId: string; collegeName: string; collegeLocation: string }> {
  const programs: Array<RUBProgram & { collegeId: string; collegeName: string; collegeLocation: string }> = [];

  for (const college of rubCollegesData) {
    for (const program of college.programs) {
      programs.push({
        ...program,
        collegeId: college.id,
        collegeName: college.name,
        collegeLocation: college.location,
      });
    }
  }

  return programs;
}

/**
 * Helper function to get programs by RIASEC code
 */
export function getProgramsByRIASEC(riasecCode: string) {
  const allPrograms = getAllRUBPrograms();
  return allPrograms.filter((program) =>
    program.riasecCodes.some((code) => code === riasecCode || code === riasecCode[0])
  );
}

/**
 * Helper function to get programs by minimum percentage
 */
export function getProgramsByPercentage(percentage: number) {
  const allPrograms = getAllRUBPrograms();
  return allPrograms.filter((program) => percentage >= program.eligibility.minPercentage);
}

/**
 * Helper function to get programs by stream
 */
export function getProgramsByStream(stream: "Science" | "Arts" | "Commerce" | "Any") {
  const allPrograms = getAllRUBPrograms();
  return allPrograms.filter((program) =>
    program.eligibility.stream === stream || program.eligibility.stream === "Any"
  );
}

/**
 * Helper function to search programs by keyword
 */
export function searchPrograms(keyword: string) {
  const allPrograms = getAllRUBPrograms();
  const lowerKeyword = keyword.toLowerCase();

  return allPrograms.filter(
    (program) =>
      program.name.toLowerCase().includes(lowerKeyword) ||
      program.description.toLowerCase().includes(lowerKeyword) ||
      program.careerProspects.some((prospect) => prospect.toLowerCase().includes(lowerKeyword))
  );
}

/**
 * RUB Scholarship Data
 */
export interface RUBScholarship {
  id: string;
  name: string;
  code: string;
  type: "merit" | "need_based" | "sports" | "arts" | "government";
  provider: string;
  providerName: string;
  coverage: {
    tuition: boolean;
    hostel: boolean;
    books: boolean;
    living: boolean;
    percentage?: number;
  };
  eligibility: {
    minPercentage?: number;
    annualIncomeLimit?: number;
    categories?: string[];
  };
  applicationOpenDate: string;
  applicationCloseDate: string;
  requiredDocuments: string[];
  description: string;
}

export const rubScholarshipsData: RUBScholarship[] = [
  {
    id: "rub_merit_scholarship",
    name: "RUB Merit Scholarship",
    code: "RUB-MS",
    type: "merit",
    provider: "RUB",
    providerName: "Royal University of Bhutan",
    coverage: {
      tuition: true,
      hostel: true,
      books: true,
      living: false,
      percentage: 100,
    },
    eligibility: {
      minPercentage: 75,
    },
    applicationOpenDate: "March 1",
    applicationCloseDate: "May 31",
    requiredDocuments: [
      "Class X certificate",
      "Class XII marksheet",
      "Citizen ID",
      "School recommendation letter",
      "Income statement",
    ],
    description: "Full scholarship for meritorious students securing 75% and above in Class XII examinations.",
  },
  {
    id: "rub_need_based",
    name: "RUB Need-Based Scholarship",
    code: "RUB-NBS",
    type: "need_based",
    provider: "RUB",
    providerName: "Royal University of Bhutan",
    coverage: {
      tuition: true,
      hostel: true,
      books: false,
      living: false,
      percentage: 75,
    },
    eligibility: {
      annualIncomeLimit: 300000,
    },
    applicationOpenDate: "March 1",
    applicationCloseDate: "May 31",
    requiredDocuments: [
      "Class XII certificate",
      "Citizen ID",
      "Income certificate",
      "Land ownership certificate",
      "Recommendation from Gewog Administration",
    ],
    description: "Scholarship for students from economically disadvantaged backgrounds.",
  },
  {
    id: "govt_scholarship",
    name: "Government Scholarship for Undergraduate Studies",
    code: "GOV-UG",
    type: "government",
    provider: "Govt",
    providerName: "Royal Government of Bhutan",
    coverage: {
      tuition: true,
      hostel: true,
      books: true,
      living: true,
      percentage: 100,
    },
    eligibility: {
      minPercentage: 65,
    },
    applicationOpenDate: "March 1",
    applicationCloseDate: "April 30",
    requiredDocuments: [
      "Class XII certificate",
      "Citizen ID",
      "Security clearance",
      "Medical fitness certificate",
      "No objection certificate",
    ],
    description: "Full government scholarship for undergraduate studies in priority disciplines.",
  },
  {
    id: "stem_scholarship",
    name: "STEM Scholarship",
    code: "STEM",
    type: "merit",
    provider: "Govt",
    providerName: "Royal Government of Bhutan",
    coverage: {
      tuition: true,
      hostel: true,
      books: true,
      living: true,
      percentage: 100,
    },
    eligibility: {
      minPercentage: 70,
    },
    applicationOpenDate: "March 1",
    applicationCloseDate: "May 31",
    requiredDocuments: [
      "Class XII certificate (Science stream)",
      "Citizen ID",
      "School recommendation",
      "Commitment to work in Bhutan after graduation",
    ],
    description: "Special scholarship for STEM (Science, Technology, Engineering, Mathematics) programs.",
  },
];
