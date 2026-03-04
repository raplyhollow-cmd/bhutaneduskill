/**
 * SEED RUB COLLEGES AND PROGRAMS DATABASE
 *
 * Populates the RUB (Royal University of Bhutan) colleges and programs
 * with comprehensive data including:
 * - All constituent colleges
 * - All programs offered
 * - Eligibility requirements
 * - Seat counts
 * - Fee information
 *
 * Run: npx tsx scripts/seed-rub-colleges.ts
 */

import "dotenv/config";
import { db } from "@/lib/db";
import { rubColleges, rubPrograms } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

// ============================================================================
// RUB CONSTITUENT COLLEGES DATA
// ============================================================================

const RUB_COLLEGES_DATA = [
  {
    id: "college-cst",
    name: "College of Science and Technology",
    code: "CST",
    type: "constituent",
    dzongkhag: "Chukha",
    location: "Rinchending, Phuentsholing",
    latitude: "26.8536",
    longitude: "89.4084",
    website: "https://www.cst.edu.bt",
    email: "info@cst.edu.bt",
    phone: "+975-5-251327",
    hasHostel: true,
    hasLibrary: true,
    hasLab: true,
    hasSports: true,
    description: "First institute in Bhutan to offer undergraduate engineering programmes. Premier technical education institute.",
    programs: [
      { code: "BE-CIVIL", name: "B.E. in Civil Engineering", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 55, requiredSubjects: ["Mathematics", "Physics", "Chemistry"], tuitionFee: 45000, hostelFee: 15000 },
      { code: "BE-ELEC", name: "B.E. in Electrical Engineering", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 55, requiredSubjects: ["Mathematics", "Physics", "Chemistry"], tuitionFee: 45000, hostelFee: 15000 },
      { code: "BE-ECE", name: "B.E. in Electronics & Communication", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 55, requiredSubjects: ["Mathematics", "Physics", "Chemistry"], tuitionFee: 45000, hostelFee: 15000 },
      { code: "BE-IT", name: "B.E. in Information Technology", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 55, requiredSubjects: ["Mathematics", "Physics", "Chemistry"], tuitionFee: 45000, hostelFee: 15000 },
      { code: "BE-PWR", name: "B.E. in Power Engineering", level: "bachelor", duration: 4, durationType: "years", totalSeats: 30, minPercentage: 55, requiredSubjects: ["Mathematics", "Physics", "Chemistry"], tuitionFee: 45000, hostelFee: 15000 },
      { code: "B-ARCH", name: "Bachelor of Architecture", level: "bachelor", duration: 5, durationType: "years", totalSeats: 25, minPercentage: 55, requiredSubjects: ["Mathematics", "Physics", "Chemistry"], tuitionFee: 50000, hostelFee: 15000 },
      { code: "BSC-CS", name: "B.Sc. in Computer Science", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 55, requiredSubjects: ["Mathematics", "Physics", "Chemistry"], tuitionFee: 45000, hostelFee: 15000 },
      { code: "DIP-IT", name: "Diploma in IT", level: "diploma", duration: 3, durationType: "years", totalSeats: 60, minPercentage: 45, requiredSubjects: ["Mathematics"], tuitionFee: 30000, hostelFee: 12000 },
    ],
  },
  {
    id: "college-jnec",
    name: "Jigme Namgyel Engineering College",
    code: "JNEC",
    type: "constituent",
    dzongkhag: "Samdrup Jongkhar",
    location: "Dewathang, Samdrup Jongkhar",
    latitude: "26.8967",
    longitude: "91.5432",
    website: "https://www.jnec.edu.bt",
    email: "info@jnec.edu.bt",
    phone: "+975-5-531248",
    hasHostel: true,
    hasLibrary: true,
    hasLab: true,
    hasSports: true,
    description: "Formerly Royal Bhutan Polytechnic, specializes in applied engineering with practical focus.",
    programs: [
      { code: "BE-CIVIL", name: "B.E. in Civil Engineering", level: "bachelor", duration: 4, durationType: "years", totalSeats: 60, minPercentage: 50, requiredSubjects: ["Mathematics", "Physics", "Chemistry"], tuitionFee: 45000, hostelFee: 15000 },
      { code: "BE-ELEC", name: "B.E. in Electrical Engineering", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 50, requiredSubjects: ["Mathematics", "Physics", "Chemistry"], tuitionFee: 45000, hostelFee: 15000 },
      { code: "BE-MECH", name: "B.E. in Mechanical Engineering", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 50, requiredSubjects: ["Mathematics", "Physics", "Chemistry"], tuitionFee: 45000, hostelFee: 15000 },
      { code: "DIP-CIVIL", name: "Diploma in Civil Engineering", level: "diploma", duration: 3, durationType: "years", totalSeats: 80, minPercentage: 40, requiredSubjects: ["Mathematics", "Science"], tuitionFee: 30000, hostelFee: 12000 },
      { code: "DIP-ELEC", name: "Diploma in Electrical Engineering", level: "diploma", duration: 3, durationType: "years", totalSeats: 60, minPercentage: 40, requiredSubjects: ["Mathematics", "Science"], tuitionFee: 30000, hostelFee: 12000 },
      { code: "DIP-MECH", name: "Diploma in Mechanical Engineering", level: "diploma", duration: 3, durationType: "years", totalSeats: 60, minPercentage: 40, requiredSubjects: ["Mathematics", "Science"], tuitionFee: 30000, hostelFee: 12000 },
    ],
  },
  {
    id: "college-gcit",
    name: "Gyalpozhing College of Information Technology",
    code: "GCIT",
    type: "constituent",
    dzongkhag: "Mongar",
    location: "Gyalpozhing, Mongar",
    latitude: "27.2589",
    longitude: "91.0834",
    website: "https://www.gcit.edu.bt",
    email: "info@gcit.edu.bt",
    phone: "+975-4-721367",
    hasHostel: true,
    hasLibrary: true,
    hasLab: true,
    hasSports: true,
    description: "Specializes in IT programmes with 'Learning by Doing' approach.",
    programs: [
      { code: "BCA", name: "B.C.A (Bachelor of Computer Applications)", level: "bachelor", duration: 4, durationType: "years", totalSeats: 60, minPercentage: 45, requiredSubjects: ["Mathematics"], tuitionFee: 45000, hostelFee: 15000 },
      { code: "BSC-IT", name: "B.Sc. in Information Technology", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 50, requiredSubjects: ["Mathematics", "Physics"], tuitionFee: 45000, hostelFee: 15000 },
      { code: "DIP-IT", name: "Diploma in IT", level: "diploma", duration: 3, durationType: "years", totalSeats: 60, minPercentage: 40, requiredSubjects: ["Mathematics"], tuitionFee: 30000, hostelFee: 12000 },
    ],
  },
  {
    id: "college-gcbs",
    name: "Gedu College of Business Studies",
    code: "GCBS",
    type: "constituent",
    dzongkhag: "Chukha",
    location: "Gedu, Chukha",
    latitude: "27.0167",
    longitude: "89.4583",
    website: "https://www.gcbs.edu.bt",
    email: "info@gcbs.edu.bt",
    phone: "+975-5-263868",
    hasHostel: true,
    hasLibrary: true,
    hasLab: false,
    hasSports: true,
    description: "Business administration and commerce programmes.",
    programs: [
      { code: "BBA", name: "B.B.A", level: "bachelor", duration: 4, durationType: "years", totalSeats: 120, minPercentage: 45, requiredSubjects: [], tuitionFee: 40000, hostelFee: 15000 },
      { code: "BCOM", name: "B.Com", level: "bachelor", duration: 4, durationType: "years", totalSeats: 120, minPercentage: 45, requiredSubjects: ["English", "Mathematics"], tuitionFee: 40000, hostelFee: 15000 },
      { code: "BBA-FIN", name: "B.B.A in Finance", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 50, requiredSubjects: ["Mathematics", "English"], tuitionFee: 40000, hostelFee: 15000 },
      { code: "BBA-MKT", name: "B.B.A in Marketing", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 50, requiredSubjects: ["English"], tuitionFee: 40000, hostelFee: 15000 },
    ],
  },
  {
    id: "college-cnr",
    name: "College of Natural Resources",
    code: "CNR",
    type: "constituent",
    dzongkhag: "Punakha",
    location: "Lobesa, Punakha",
    latitude: "27.4833",
    longitude: "89.8667",
    website: "https://www.cnr.edu.bt",
    email: "info@cnr.edu.bt",
    phone: "+975-3-245249",
    hasHostel: true,
    hasLibrary: true,
    hasLab: true,
    hasSports: true,
    description: "Natural resources management programmes for sustainable development.",
    programs: [
      { code: "BSC-AGRI", name: "B.Sc. Agriculture", level: "bachelor", duration: 4, durationType: "years", totalSeats: 60, minPercentage: 45, requiredSubjects: ["Physics", "Chemistry", "Biology"], tuitionFee: 40000, hostelFee: 15000 },
      { code: "BSC-FOREST", name: "B.Sc. Forestry", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 45, requiredSubjects: ["Physics", "Chemistry", "Biology"], tuitionFee: 40000, hostelFee: 15000 },
      { code: "BSC-ANIMAL", name: "B.Sc. Animal Science", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 45, requiredSubjects: ["Physics", "Chemistry", "Biology"], tuitionFee: 40000, hostelFee: 15000 },
      { code: "BSC-ENV", name: "B.Sc. Environment & Climate Studies", level: "bachelor", duration: 4, durationType: "years", totalSeats: 30, minPercentage: 50, requiredSubjects: ["Physics", "Chemistry", "Biology"], tuitionFee: 40000, hostelFee: 15000 },
      { code: "DIP-AGRI", name: "Diploma in Agriculture", level: "diploma", duration: 3, durationType: "years", totalSeats: 60, minPercentage: 40, requiredSubjects: ["Physics", "Chemistry", "Biology"], tuitionFee: 30000, hostelFee: 12000 },
      { code: "DIP-ANIMAL", name: "Diploma in Animal Husbandry", level: "diploma", duration: 3, durationType: "years", totalSeats: 40, minPercentage: 40, requiredSubjects: ["Physics", "Chemistry", "Biology"], tuitionFee: 30000, hostelFee: 12000 },
      { code: "DIP-FOREST", name: "Diploma in Forestry", level: "diploma", duration: 3, durationType: "years", totalSeats: 40, minPercentage: 40, requiredSubjects: ["Physics", "Chemistry", "Biology"], tuitionFee: 30000, hostelFee: 12000 },
    ],
  },
  {
    id: "college-sherubtse",
    name: "Sherubtse College",
    code: "SHERUBTSE",
    type: "constituent",
    dzongkhag: "Trashigang",
    location: "Kanglung, Trashigang",
    latitude: "27.2742",
    longitude: "91.5678",
    website: "https://www.sherubtse.edu.bt",
    email: "info@sherubtse.edu.bt",
    phone: "+975-4-532866",
    hasHostel: true,
    hasLibrary: true,
    hasLab: true,
    hasSports: true,
    description: "Oldest and largest multidisciplinary college in RUB, offering diverse programmes.",
    programs: [
      { code: "BA", name: "B.A.", level: "bachelor", duration: 4, durationType: "years", totalSeats: 180, minPercentage: 45, requiredSubjects: [], tuitionFee: 35000, hostelFee: 15000 },
      { code: "BSC", name: "B.Sc.", level: "bachelor", duration: 4, durationType: "years", totalSeats: 180, minPercentage: 45, requiredSubjects: ["Physics", "Chemistry", "Biology", "Mathematics"], tuitionFee: 35000, hostelFee: 15000 },
      { code: "BCOM", name: "B.Com", level: "bachelor", duration: 4, durationType: "years", totalSeats: 120, minPercentage: 45, requiredSubjects: ["Mathematics", "English"], tuitionFee: 35000, hostelFee: 15000 },
      { code: "BA-HD", name: "B.A. in History & Dzongkha", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 45, requiredSubjects: [], tuitionFee: 35000, hostelFee: 15000 },
      { code: "BSC-PHY", name: "B.Sc. in Physical Science", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 50, requiredSubjects: ["Physics", "Chemistry", "Mathematics"], tuitionFee: 35000, hostelFee: 15000 },
      { code: "BSC-LIFE", name: "B.Sc. in Life Science", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 50, requiredSubjects: ["Physics", "Chemistry", "Biology"], tuitionFee: 35000, hostelFee: 15000 },
    ],
  },
  {
    id: "college-clcs",
    name: "College of Language and Culture Studies",
    code: "CLCS",
    type: "constituent",
    dzongkhag: "Trongsa",
    location: "Taktse, Trongsa",
    latitude: "27.5167",
    longitude: "90.3833",
    website: "https://www.clcs.edu.bt",
    email: "info@clcs.edu.bt",
    phone: "+975-3-613324",
    hasHostel: true,
    hasLibrary: true,
    hasLab: false,
    hasSports: false,
    description: "Language, culture, and Buddhist studies programmes preserving Bhutanese heritage.",
    programs: [
      { code: "BA-LC", name: "B.A. in Language and Culture", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 45, requiredSubjects: [], tuitionFee: 35000, hostelFee: 15000 },
      { code: "BA-LL", name: "B.A. in Language and Literature", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 45, requiredSubjects: [], tuitionFee: 35000, hostelFee: 15000 },
      { code: "BA-BHS", name: "B.A. in Bhutanese & Himalayan Studies", level: "bachelor", duration: 4, durationType: "years", totalSeats: 30, minPercentage: 45, requiredSubjects: [], tuitionFee: 35000, hostelFee: 15000 },
      { code: "DIP-LC", name: "Diploma in Language & Communication", level: "diploma", duration: 2, durationType: "years", totalSeats: 30, minPercentage: 40, requiredSubjects: [], tuitionFee: 25000, hostelFee: 12000 },
    ],
  },
  {
    id: "college-pce",
    name: "Paro College of Education",
    code: "PCE",
    type: "constituent",
    dzongkhag: "Paro",
    location: "Paro",
    latitude: "27.4167",
    longitude: "89.3833",
    website: "https://www.pce.edu.bt",
    email: "info@pce.edu.bt",
    phone: "+975-8-271897",
    hasHostel: true,
    hasLibrary: true,
    hasLab: false,
    hasSports: true,
    description: "Teacher education programmes at diploma, undergraduate and postgraduate levels.",
    programs: [
      { code: "B-ED-PRI", name: "B.Ed Primary", level: "bachelor", duration: 4, durationType: "years", totalSeats: 100, minPercentage: 45, requiredSubjects: [], tuitionFee: 35000, hostelFee: 15000 },
      { code: "B-ED-SEC", name: "B.Ed Secondary", level: "bachelor", duration: 4, durationType: "years", totalSeats: 100, minPercentage: 45, requiredSubjects: [], tuitionFee: 35000, hostelFee: 15000 },
      { code: "B-ED-DZO", name: "B.Ed Dzongkha", level: "bachelor", duration: 4, durationType: "years", totalSeats: 30, minPercentage: 45, requiredSubjects: ["Dzongkha"], tuitionFee: 35000, hostelFee: 15000 },
      { code: "PGDE", name: "Postgraduate Diploma in Education", level: "bachelor", duration: 1, durationType: "years", totalSeats: 50, minPercentage: 45, requiredSubjects: [], tuitionFee: 25000, hostelFee: 12000 },
      { code: "MED-LEAD", name: "Master of Education (Educational Leadership)", level: "master", duration: 2, durationType: "years", totalSeats: 20, minPercentage: 50, requiredSubjects: [], tuitionFee: 50000, hostelFee: 18000 },
      { code: "DIP-SLM", name: "Diploma in School Leadership & Management", level: "diploma", duration: 1, durationType: "years", totalSeats: 30, minPercentage: 45, requiredSubjects: [], tuitionFee: 25000, hostelFee: 12000 },
    ],
  },
  {
    id: "college-sce",
    name: "Samtse College of Education",
    code: "SCE",
    type: "constituent",
    dzongkhag: "Samtse",
    location: "Samtse",
    latitude: "26.9083",
    longitude: "89.0583",
    website: "https://www.sce.edu.bt",
    email: "info@sce.edu.bt",
    phone: "+975-5-362116",
    hasHostel: true,
    hasLibrary: true,
    hasLab: false,
    hasSports: true,
    description: "Teacher education and guidance & counselling programmes.",
    programs: [
      { code: "B-ED-PRI", name: "B.Ed Primary", level: "bachelor", duration: 4, durationType: "years", totalSeats: 100, minPercentage: 45, requiredSubjects: [], tuitionFee: 35000, hostelFee: 15000 },
      { code: "B-ED-SEC", name: "B.Ed Secondary", level: "bachelor", duration: 4, durationType: "years", totalSeats: 100, minPercentage: 45, requiredSubjects: [], tuitionFee: 35000, hostelFee: 15000 },
      { code: "PGDE", name: "Postgraduate Diploma in Education", level: "bachelor", duration: 1, durationType: "years", totalSeats: 50, minPercentage: 45, requiredSubjects: [], tuitionFee: 25000, hostelFee: 12000 },
      { code: "PGD-GC", name: "PG Diploma in Guidance & Counseling", level: "bachelor", duration: 1, durationType: "years", totalSeats: 30, minPercentage: 45, requiredSubjects: [], tuitionFee: 25000, hostelFee: 12000 },
    ],
  },
  {
    id: "college-jswwsl",
    name: "Jigme Singye Wangchuck School of Law",
    code: "JSWSL",
    type: "constituent",
    dzongkhag: "Paro",
    location: "Pangbisa, Paro",
    latitude: "27.4167",
    longitude: "89.3667",
    website: "https://www.jswwsl.edu.bt",
    email: "info@jswwsl.edu.bt",
    phone: "+975-8-271970",
    hasHostel: true,
    hasLibrary: true,
    hasLab: false,
    hasSports: false,
    description: "Premier law school offering legal education for Bhutan's judicial system.",
    programs: [
      { code: "LLB", name: "LL.B", level: "bachelor", duration: 4, durationType: "years", totalSeats: 50, minPercentage: 50, requiredSubjects: ["English"], tuitionFee: 40000, hostelFee: 15000 },
    ],
  },

  // ============================================================================
  // PRIVATE COLLEGES (Recognized)
  // ============================================================================
  {
    id: "college-rtc",
    name: "Royal Thimphu College",
    code: "RTC",
    type: "affiliated",
    dzongkhag: "Thimphu",
    location: "Thimphu",
    latitude: "27.4667",
    longitude: "89.6167",
    website: "https://www.rtc.edu.bt",
    email: "info@rtc.edu.bt",
    phone: "+975-2-333793",
    hasHostel: true,
    hasLibrary: true,
    hasLab: true,
    hasSports: true,
    description: "Bhutan's first private college, affiliated to RUB.",
    programs: [
      { code: "BSC-NURSING", name: "B.Sc. Nursing", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 55, requiredSubjects: ["Physics", "Chemistry", "Biology"], tuitionFee: 250000, hostelFee: 30000 },
      { code: "BSC-PH", name: "B.Sc. Public Health", level: "bachelor", duration: 4, durationType: "years", totalSeats: 30, minPercentage: 50, requiredSubjects: ["Physics", "Chemistry", "Biology"], tuitionFee: 200000, hostelFee: 30000 },
      { code: "BA-ED", name: "B.A. in English & Dzongkha Studies", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 45, requiredSubjects: [], tuitionFee: 150000, hostelFee: 30000 },
      { code: "BA-HIS", name: "B.A. in History & Dzongkha Studies", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 45, requiredSubjects: [], tuitionFee: 150000, hostelFee: 30000 },
      { code: "BA-PS", name: "B.A. in Political Science & Sociology", level: "bachelor", duration: 4, durationType: "years", totalSeats: 40, minPercentage: 45, requiredSubjects: [], tuitionFee: 150000, hostelFee: 30000 },
      { code: "B-COUNSEL", name: "Bachelor in Counseling", level: "bachelor", duration: 4, durationType: "years", totalSeats: 30, minPercentage: 50, requiredSubjects: [], tuitionFee: 180000, hostelFee: 30000 },
      { code: "BBA", name: "B.B.A", level: "bachelor", duration: 4, durationType: "years", totalSeats: 60, minPercentage: 45, requiredSubjects: [], tuitionFee: 180000, hostelFee: 30000 },
    ],
  },
  {
    id: "college-nrc",
    name: "Norbuling Rigter College",
    code: "NRC",
    type: "affiliated",
    dzongkhag: "Paro",
    location: "Paro",
    latitude: "27.4167",
    longitude: "89.3833",
    website: "https://www.nrc.edu.bt",
    email: "info@nrc.edu.bt",
    phone: "+975-8-262360",
    hasHostel: true,
    hasLibrary: true,
    hasLab: true,
    hasSports: true,
    description: "Private college offering business and management programmes.",
    programs: [
      { code: "BBA", name: "B.B.A (Hons)", level: "bachelor", duration: 3, durationType: "years", totalSeats: 60, minPercentage: 40, requiredSubjects: [], tuitionFee: 175000, hostelFee: 25000 },
      { code: "BA-BS", name: "B.A. (Hons) Business Studies", level: "bachelor", duration: 3, durationType: "years", totalSeats: 60, minPercentage: 40, requiredSubjects: ["English", "Mathematics"], tuitionFee: 175000, hostelFee: 25000 },
      { code: "BSC-COMPUTING", name: "B.Sc. (Hons) Computing", level: "bachelor", duration: 3, durationType: "years", totalSeats: 40, minPercentage: 45, requiredSubjects: ["Mathematics", "Physics"], tuitionFee: 200000, hostelFee: 25000 },
    ],
  },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seedRUBColleges() {
  console.log("🌱 Starting to seed RUB colleges and programs database...");
  console.log(`   Total colleges to insert: ${RUB_COLLEGES_DATA.length}`);

  const now = new Date();
  let collegesInserted = 0;
  let collegesUpdated = 0;
  let programsInserted = 0;

  for (const collegeData of RUB_COLLEGES_DATA) {
    try {
      // Check if college exists
      const existingCollege = await db.query.rubColleges.findFirst({
        where: (rubColleges, { eq }) => eq(rubColleges.id, collegeData.id),
      });

      let collegeId = collegeData.id;

      // Prepare college data for insert/update
      const collegeRecord = {
        id: collegeData.id,
        name: collegeData.name,
        code: collegeData.code,
        type: collegeData.type,
        dzongkhag: collegeData.dzongkhag,
        location: collegeData.location,
        latitude: collegeData.latitude,
        longitude: collegeData.longitude,
        website: collegeData.website,
        email: collegeData.email,
        phone: collegeData.phone,
        hasHostel: collegeData.hasHostel,
        hasLibrary: collegeData.hasLibrary,
        hasLab: collegeData.hasLab,
        hasSports: collegeData.hasSports,
        description: collegeData.description,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      if (existingCollege) {
        // Update existing college
        await db
          .update(rubColleges)
          .set({
            ...collegeRecord,
            updatedAt: now,
          })
          .where(eq(rubColleges.id, collegeData.id));
        collegesUpdated++;
        console.log(`   ✓ Updated college: ${collegeData.name}`);
      } else {
        // Insert new college
        await db.insert(rubColleges).values(collegeRecord);
        collegesInserted++;
        console.log(`   + Inserted college: ${collegeData.name}`);
      }

      // Process programs
      for (const programData of collegeData.programs) {
        const programId = `${collegeData.id}-${programData.code}`;

        // Check if program exists
        const existingProgram = await db.query.rubPrograms.findFirst({
          where: (rubPrograms, { eq }) => eq(rubPrograms.id, programId),
        });

        const programRecord = {
          id: programId,
          name: programData.name,
          code: programData.code,
          collegeId: collegeData.id,
          level: programData.level,
          field: getProgramField(programData.name),
          discipline: getProgramDiscipline(programData.name),
          duration: programData.duration,
          durationType: programData.durationType,
          totalSeats: programData.totalSeats,
          minPercentage: programData.minPercentage,
          requiredSubjects: programData.requiredSubjects,
          eligibilityCriteria: {
            minPercentage: programData.minPercentage,
            requiredSubjects: programData.requiredSubjects,
          },
          tuitionFee: programData.tuitionFee,
          hostelFee: programData.hostelFee,
          totalFee: programData.tuitionFee + programData.hostelFee,
          description: `${programData.name} at ${collegeData.name}`,
          careerProspects: getCareerProspects(programData.name),
          isActive: true,
          admissionOpen: true,
          academicYear: "2025-2026",
          createdAt: now,
          updatedAt: now,
        };

        if (existingProgram) {
          // Update existing program
          await db
            .update(rubPrograms)
            .set({
              ...programRecord,
              updatedAt: now,
            })
            .where(eq(rubPrograms.id, programId));
        } else {
          // Insert new program
          await db.insert(rubPrograms).values(programRecord);
          programsInserted++;
        }
      }
    } catch (error) {
      console.error(`   ✗ Error with college ${collegeData.name}:`, error);
    }
  }

  console.log("\n✅ RUB colleges seeding completed!");
  console.log(`   Colleges Inserted: ${collegesInserted}`);
  console.log(`   Colleges Updated:  ${collegesUpdated}`);
  console.log(`   Programs Inserted: ${programsInserted}`);
  console.log(`   Total Colleges:    ${collegesInserted + collegesUpdated}/${RUB_COLLEGES_DATA.length}`);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getProgramField(programName: string): string {
  const name = programName.toLowerCase();
  if (name.includes("engineering") || name.includes("b.e.")) return "engineering";
  if (name.includes("computer") || name.includes("it")) return "technology";
  if (name.includes("agriculture") || name.includes("animal") || name.includes("forestry")) return "agriculture";
  if (name.includes("nursing") || name.includes("health") || name.includes("medical")) return "healthcare";
  if (name.includes("education") || name.includes("b.ed")) return "education";
  if (name.includes("b.a.") || name.includes("ba ")) return "arts";
  if (name.includes("b.sc.") || name.includes("bsc ")) return "science";
  if (name.includes("b.com") || name.includes("bba") || name.includes("business")) return "business";
  if (name.includes("law") || name.includes("ll.b")) return "law";
  if (name.includes("language") || name.includes("culture")) return "arts";
  if (name.includes("counseling")) return "healthcare";
  return "general";
}

function getProgramDiscipline(programName: string): string {
  const name = programName.toLowerCase();
  if (name.includes("civil")) return "civil_engineering";
  if (name.includes("electrical")) return "electrical_engineering";
  if (name.includes("mechanical")) return "mechanical_engineering";
  if (name.includes("computer") || name.includes("it")) return "computer_science";
  if (name.includes("agriculture")) return "agriculture";
  if (name.includes("forestry")) return "forestry";
  if (name.includes("animal")) return "animal_science";
  if (name.includes("environment")) return "environmental_science";
  if (name.includes("nursing")) return "nursing";
  if (name.includes("mathematics")) return "mathematics";
  if (name.includes("physics")) return "physics";
  if (name.includes("chemistry")) return "chemistry";
  if (name.includes("biology")) return "biology";
  if (name.includes("english")) return "english";
  if (name.includes("dzongkha")) return "dzongkha";
  if (name.includes("history")) return "history";
  if (name.includes("economics")) return "economics";
  if (name.includes("political science")) return "political_science";
  if (name.includes("law") || name.includes("ll.b")) return "law";
  return "general";
}

function getCareerProspects(programName: string): string[] {
  const name = programName.toLowerCase();
  const prospects = [];

  if (name.includes("engineering")) {
    prospects.push("Civil Engineer", "Project Manager", "Site Engineer", "Construction Manager");
  }
  if (name.includes("computer") || name.includes("it")) {
    prospects.push("Software Developer", "IT Specialist", "Data Analyst", "System Administrator");
  }
  if (name.includes("agriculture")) {
    prospects.push("Agriculturist", "Farm Manager", "Research Officer", "Agricultural Officer");
  }
  if (name.includes("forestry")) {
    prospects.push("Forestry Officer", "Conservation Officer", "Environmental Scientist", "Park Ranger");
  }
  if (name.includes("education") || name.includes("b.ed")) {
    prospects.push("Teacher", "Lecturer", "Education Officer", "Curriculum Developer");
  }
  if (name.includes("nursing")) {
    prospects.push("Nurse", "Healthcare Administrator", "Public Health Officer", "Medical Researcher");
  }
  if (name.includes("business") || name.includes("bba") || name.includes("b.com")) {
    prospects.push("Accountant", "Financial Analyst", "Business Manager", "HR Manager", "Marketing Manager");
  }
  if (name.includes("law") || name.includes("ll.b")) {
    prospects.push("Lawyer", "Judge", "Legal Advisor", "Civil Servant");
  }

  return prospects.length > 0 ? prospects : ["Various career opportunities in related field"];
}

// ============================================================================
// RUN SEED
// ============================================================================

seedRUBColleges()
  .then(() => {
    console.log("\n🎉 RUB colleges database seeded successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error seeding RUB colleges:", error);
    process.exit(1);
  });
