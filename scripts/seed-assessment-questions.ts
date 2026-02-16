/**
 * SEED ASSESSMENT QUESTIONS
 *
 * This script seeds the database with predefined questions for each assessment type.
 * Includes MBTI, DISC, Work Values, and Learning Styles questions.
 */

import { db } from "../src/lib/db";
import { assessmentTypes, assessmentQuestions } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// MBTI QUESTIONS
// ============================================================================

const mbtiQuestions = [
  { id: "mbti_001", text: "You enjoy social gatherings and parties", dimension: "EI", direction: 1 },
  { id: "mbti_002", text: "You prefer spending time alone rather than with others", dimension: "EI", direction: -1 },
  { id: "mbti_003", text: "You feel energized after being around people", dimension: "EI", direction: 1 },
  { id: "mbti_004", text: "You prefer one-on-one conversations over group discussions", dimension: "EI", direction: -1 },
  { id: "mbti_005", text: "You focus on present realities rather than future possibilities", dimension: "SN", direction: 1 },
  { id: "mbti_006", text: "You enjoy thinking about abstract concepts and ideas", dimension: "SN", direction: -1 },
  { id: "mbti_007", text: "You prefer practical solutions over theoretical ones", dimension: "SN", direction: 1 },
  { id: "mbti_008", text: "You often notice patterns that others miss", dimension: "SN", direction: -1 },
  { id: "mbti_009", text: "You make decisions based on logic rather than feelings", dimension: "TF", direction: 1 },
  { id: "mbti_010", text: "You consider people's feelings when making decisions", dimension: "TF", direction: -1 },
  { id: "mbti_011", text: "You value justice over mercy", dimension: "TF", direction: 1 },
  { id: "mbti_012", text: "You are easily affected by other people's emotions", dimension: "TF", direction: -1 },
  { id: "mbti_013", text: "You prefer to have things decided and settled", dimension: "JP", direction: 1 },
  { id: "mbti_014", text: "You like to keep your options open", dimension: "JP", direction: -1 },
  { id: "mbti_015", text: "You enjoy making to-do lists and following schedules", dimension: "JP", direction: 1 },
  { id: "mbti_016", text: "You prefer spontaneous activities over planned ones", dimension: "JP", direction: -1 },
];

// ============================================================================
// DISC QUESTIONS
// ============================================================================

const discQuestions = [
  { id: "disc_001", text: "In your approach to work", most: "Getting immediate results", least: "Ensuring accuracy", dimension: "D" },
  { id: "disc_002", text: "When dealing with others", most: "Being direct and firm", least: "Being supportive and understanding", dimension: "D" },
  { id: "disc_003", text: "In group situations", most: "Taking the lead", least: "Following along", dimension: "D" },
  { id: "disc_004", text: "When facing challenges", most: "Confronting them head-on", least: "Planning carefully", dimension: "D" },
  { id: "disc_005", text: "In social situations", most: "Meeting new people", least: "Spending quiet time", dimension: "I" },
  { id: "disc_006", text: "When communicating", most: "Being enthusiastic", least: "Being factual", dimension: "I" },
  { id: "disc_007", text: "When working with others", most: "Inspiring and motivating", least: "Analyzing problems", dimension: "I" },
  { id: "disc_008", text: "In presentations", most: "Being energetic and dynamic", least: "Being detailed and precise", dimension: "I" },
  { id: "disc_009", text: "When things change", most: "Adapting slowly", least: "Embracing change", dimension: "S" },
  { id: "disc_010", text: "In team settings", most: "Supporting the team", least: "Leading the team", dimension: "S" },
  { id: "disc_011", text: "When making decisions", most: "Considering others' feelings", least: "Being logical and objective", dimension: "S" },
  { id: "disc_012", text: "With your work style", most: "Preferring stability", least: "Seeking variety", dimension: "S" },
  { id: "disc_013", text: "When solving problems", most: "Following established procedures", least: "Trying new approaches", dimension: "C" },
  { id: "disc_014", text: "In your approach to quality", most: "Ensuring accuracy", least: "Acting quickly", dimension: "C" },
  { id: "disc_015", text: "When receiving feedback", most: "Analyzing the details", least: "Responding emotionally", dimension: "C" },
  { id: "disc_016", text: "With planning", most: "Creating detailed plans", least: "Acting spontaneously", dimension: "C" },
];

// ============================================================================
// WORK VALUES QUESTIONS
// ============================================================================

const workValuesQuestions = [
  { id: "wv_001", text: "I feel a sense of accomplishment when I achieve challenging goals", value: "achievement" },
  { id: "wv_002", text: "Having opportunities for advancement is important to me", value: "achievement" },
  { id: "wv_003", text: "I prefer to work independently without close supervision", value: "independence" },
  { id: "wv_004", text: "Being able to make my own decisions is important in my work", value: "independence" },
  { id: "wv_005", text: "I appreciate when my efforts are recognized by others", value: "recognition" },
  { id: "wv_006", text: "Public acknowledgment of my work is motivating to me", value: "recognition" },
  { id: "wv_007", text: "I enjoy working with people I like and respect", value: "relationships" },
  { id: "wv_008", text: "Having friendly coworkers is important for my job satisfaction", value: "relationships" },
  { id: "wv_009", text: "I value having supportive management", value: "support" },
  { id: "wv_010", text: "A supportive work environment helps me perform better", value: "support" },
  { id: "wv_011", text: "Good pay and job security are my top priorities", value: "workingConditions" },
  { id: "wv_012", text: "I prefer a comfortable and safe work environment", value: "workingConditions" },
];

// ============================================================================
// LEARNING STYLES (VARK) QUESTIONS
// ============================================================================

const learningStylesQuestions = [
  { id: "ls_001", text: "I remember information better when it is presented in charts, diagrams, or graphs", style: "visual" },
  { id: "ls_002", text: "I prefer to read instructions rather than listen to them", style: "visual" },
  { id: "ls_003", text: "I learn best when information is spoken or explained verbally", style: "auditory" },
  { id: "ls_004", text: "I prefer to discuss ideas with others to understand them better", style: "auditory" },
  { id: "ls_005", text: "I learn best by reading written materials and taking notes", style: "read_write" },
  { id: "ls_006", text: "I prefer to study by reading textbooks and handouts", style: "read_write" },
  { id: "ls_007", text: "I learn best by doing things hands-on", style: "kinesthetic" },
  { id: "ls_008", text: "I prefer to learn through practical activities and experiments", style: "kinesthetic" },
];

// ============================================================================
// CAREER INTEREST QUESTIONS
// ============================================================================

const careerInterestQuestions = [
  { id: "ci_001", text: "I enjoy working with computers and solving technical problems", category: "technology" },
  { id: "ci_002", text: "I am interested in how things work and enjoy fixing things", category: "technology" },
  { id: "ci_003", text: "I enjoy helping others solve their personal problems", category: "helping" },
  { id: "ci_004", text: "I am a good listener and people often come to me for advice", category: "helping" },
  { id: "ci_005", text: "I enjoy being creative and expressing myself through art or music", category: "arts" },
  { id: "ci_006", text: "I enjoy activities that allow me to use my imagination", category: "arts" },
  { id: "ci_007", text: "I enjoy leading groups and organizing activities", category: "leadership" },
  { id: "ci_008", text: "I am comfortable taking charge and making decisions for others", category: "leadership" },
  { id: "ci_009", text: "I enjoy working with numbers and analyzing data", category: "analytical" },
  { id: "ci_010", text: "I pay attention to details and enjoy analyzing information", category: "analytical" },
  { id: "ci_011", text: "I enjoy working outdoors and being physically active", category: "outdoors" },
  { id: "ci_012", text: "I prefer hands-on work rather than sitting at a desk", category: "outdoors" },
];

// ============================================================================
// APTITUDE TEST QUESTIONS
// ============================================================================

const aptitudeQuestions = [
  { id: "apt_001", text: "If all Bloops are Razzies and all Razzies are Lazzies, then all Blops are definitely Lazzies", type: "logic", options: ["True", "False", "Cannot be determined"] },
  { id: "apt_002", text: "Which number comes next: 2, 6, 12, 20, 30, ?", type: "numerical", options: ["40", "42", "44", "46"] },
  { id: "apt_003", text: "Select the word that is most similar to 'Fast': Slow is to ?", type: "verbal", options: ["Run:Walk", "Big:Small", "Hot:Cold", "Light:Dark"] },
  { id: "apt_004", text: "If a store sells 3 apples for $2, how much would 9 apples cost?", type: "numerical", options: ["$4", "$5", "$6", "$7"] },
  { id: "apt_005", text: "Which shape completes the pattern?", type: "spatial", options: ["Circle", "Square", "Triangle", "Hexagon"] },
  { id: "apt_006", text: "Find the odd one out: 2, 4, 6, 9, 10", type: "numerical", options: ["2", "6", "9", "10"] },
  { id: "apt_007", text: "Cat is to Kitten as Dog is to ?", type: "verbal", options: ["Puppy", "Pet", "Animal", "Bark"] },
  { id: "apt_008", text: "What is 15% of 200?", type: "numerical", options: ["25", "30", "35", "40"] },
];

// ============================================================================
// CORE SKILLS ASSESSMENT QUESTIONS
// ============================================================================

const skillQuestions = [
  { id: "skill_001", text: "I can clearly explain complex ideas to others", skill: "communication" },
  { id: "skill_002", text: "I am comfortable speaking in front of a group", skill: "communication" },
  { id: "skill_003", text: "I can identify the main cause of a problem", skill: "problem_solving" },
  { id: "skill_004", text: "I can come up with creative solutions to difficult problems", skill: "problem_solving" },
  { id: "skill_005", text: "I work well with others to achieve common goals", skill: "teamwork" },
  { id: "skill_006", text: "I can adapt my communication style for different audiences", skill: "communication" },
  { id: "skill_007", text: "I can analyze information objectively before making decisions", skill: "critical_thinking" },
  { id: "skill_008", text: "I can manage my time effectively to meet deadlines", skill: "time_management" },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seedAssessmentQuestions() {
  console.log("🌱 Seeding assessment questions...");

  try {
    // Get assessment types
    const types = await db.select().from(assessmentTypes);
    const typeMap = new Map(types.map((t) => [t.name.toLowerCase(), t.id]));

    const now = new Date();
    let totalInserted = 0;

    // Seed MBTI questions
    const mbtiTypeId = typeMap.get("mbti personality assessment");
    if (mbtiTypeId) {
      console.log("📝 Seeding MBTI questions...");
      const existingMBTI = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.assessmentTypeId, mbtiTypeId));

      if (existingMBTI.length === 0) {
        for (let i = 0; i < mbtiQuestions.length; i++) {
          const q = mbtiQuestions[i];
          await db.insert(assessmentQuestions).values({
            id: q.id,
            assessmentTypeId: mbtiTypeId,
            questionText: q.text,
            questionData: {
              type: "likert_5",
              dimension: q.dimension,
              direction: q.direction,
            },
            options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
            correctAnswer: "",
            points: 1,
            order: i + 1,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
        }
        console.log(`  ✓ Inserted ${mbtiQuestions.length} MBTI questions`);
        totalInserted += mbtiQuestions.length;
      } else {
        console.log(`  ⊘ MBTI questions already exist (${existingMBTI.length})`);
      }
    }

    // Seed DISC questions
    const discTypeId = typeMap.get("disc behavior assessment");
    if (discTypeId) {
      console.log("📝 Seeding DISC questions...");
      const existingDISC = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.assessmentTypeId, discTypeId));

      if (existingDISC.length === 0) {
        for (let i = 0; i < discQuestions.length; i++) {
          const q = discQuestions[i];
          await db.insert(assessmentQuestions).values({
            id: q.id,
            assessmentTypeId: discTypeId,
            questionText: q.text,
            questionData: {
              type: "disc_most_least",
              dimension: q.dimension,
            },
            options: ["Most like me", "Somewhat like me", "Neutral", "Somewhat unlike me", "Least like me"],
            correctAnswer: "",
            points: 1,
            order: i + 1,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
        }
        console.log(`  ✓ Inserted ${discQuestions.length} DISC questions`);
        totalInserted += discQuestions.length;
      } else {
        console.log(`  ⊘ DISC questions already exist (${existingDISC.length})`);
      }
    }

    // Seed Work Values questions
    const workValuesTypeId = typeMap.get("work values inventory");
    if (workValuesTypeId) {
      console.log("📝 Seeding Work Values questions...");
      const existingWV = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.assessmentTypeId, workValuesTypeId));

      if (existingWV.length === 0) {
        for (let i = 0; i < workValuesQuestions.length; i++) {
          const q = workValuesQuestions[i];
          await db.insert(assessmentQuestions).values({
            id: q.id,
            assessmentTypeId: workValuesTypeId,
            questionText: q.text,
            questionData: {
              type: "likert_5",
              valueCategory: q.value,
            },
            options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
            correctAnswer: "",
            points: 1,
            order: i + 1,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
        }
        console.log(`  ✓ Inserted ${workValuesQuestions.length} Work Values questions`);
        totalInserted += workValuesQuestions.length;
      } else {
        console.log(`  ⊘ Work Values questions already exist (${existingWV.length})`);
      }
    }

    // Seed Learning Styles questions
    const learningStylesTypeId = typeMap.get("learning styles assessment (vark)");
    if (learningStylesTypeId) {
      console.log("📝 Seeding Learning Styles questions...");
      const existingLS = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.assessmentTypeId, learningStylesTypeId));

      if (existingLS.length === 0) {
        for (let i = 0; i < learningStylesQuestions.length; i++) {
          const q = learningStylesQuestions[i];
          await db.insert(assessmentQuestions).values({
            id: q.id,
            assessmentTypeId: learningStylesTypeId,
            questionText: q.text,
            questionData: {
              type: "learning_style",
              style: q.style,
            },
            options: ["Never", "Rarely", "Sometimes", "Often", "Always"],
            correctAnswer: "",
            points: 1,
            order: i + 1,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
        }
        console.log(`  ✓ Inserted ${learningStylesQuestions.length} Learning Styles questions`);
        totalInserted += learningStylesQuestions.length;
      } else {
        console.log(`  ⊘ Learning Styles questions already exist (${existingLS.length})`);
      }
    }

    // Seed Career Interest questions
    const careerInterestTypeId = typeMap.get("career interest inventory");
    if (careerInterestTypeId) {
      console.log("📝 Seeding Career Interest questions...");
      const existingCI = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.assessmentTypeId, careerInterestTypeId));

      if (existingCI.length === 0) {
        for (let i = 0; i < careerInterestQuestions.length; i++) {
          const q = careerInterestQuestions[i];
          await db.insert(assessmentQuestions).values({
            id: q.id,
            assessmentTypeId: careerInterestTypeId,
            questionText: q.text,
            questionData: {
              type: "likert_5",
              category: q.category,
            },
            options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
            correctAnswer: "",
            points: 1,
            order: i + 1,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
        }
        console.log(`  ✓ Inserted ${careerInterestQuestions.length} Career Interest questions`);
        totalInserted += careerInterestQuestions.length;
      } else {
        console.log(`  ⊘ Career Interest questions already exist (${existingCI.length})`);
      }
    }

    // Seed Aptitude questions
    const aptitudeTypeId = typeMap.get("general aptitude test");
    if (aptitudeTypeId) {
      console.log("📝 Seeding Aptitude questions...");
      const existingApt = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.assessmentTypeId, aptitudeTypeId));

      if (existingApt.length === 0) {
        for (let i = 0; i < aptitudeQuestions.length; i++) {
          const q = aptitudeQuestions[i];
          await db.insert(assessmentQuestions).values({
            id: q.id,
            assessmentTypeId: aptitudeTypeId,
            questionText: q.text,
            questionData: {
              type: "single_choice",
              subtype: q.type,
            },
            options: q.options,
            correctAnswer: q.options[0], // First option is correct
            points: 1,
            order: i + 1,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
        }
        console.log(`  ✓ Inserted ${aptitudeQuestions.length} Aptitude questions`);
        totalInserted += aptitudeQuestions.length;
      } else {
        console.log(`  ⊘ Aptitude questions already exist (${existingApt.length})`);
      }
    }

    // Seed Core Skills questions
    const skillsTypeId = typeMap.get("core skills assessment");
    if (skillsTypeId) {
      console.log("📝 Seeding Core Skills questions...");
      const existingSkills = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.assessmentTypeId, skillsTypeId));

      if (existingSkills.length === 0) {
        for (let i = 0; i < skillQuestions.length; i++) {
          const q = skillQuestions[i];
          await db.insert(assessmentQuestions).values({
            id: q.id,
            assessmentTypeId: skillsTypeId,
            questionText: q.text,
            questionData: {
              type: "likert_5",
              skill: q.skill,
            },
            options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
            correctAnswer: "",
            points: 1,
            order: i + 1,
            isActive: true,
            createdAt: now,
            updatedAt: now,
          });
        }
        console.log(`  ✓ Inserted ${skillQuestions.length} Core Skills questions`);
        totalInserted += skillQuestions.length;
      } else {
        console.log(`  ⊘ Core Skills questions already exist (${existingSkills.length})`);
      }
    }

    console.log(`\n✅ Successfully seeded ${totalInserted} assessment questions!`);

    // Display summary
    const allQuestions = await db.select().from(assessmentQuestions);
    console.log(`\n📊 Total questions in database: ${allQuestions.length}`);

  } catch (error) {
    console.error("❌ Error seeding assessment questions:", error);
    throw error;
  }
}

// Run the seed function
seedAssessmentQuestions()
  .then(() => {
    console.log("\n✨ Seed completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seed failed:", error);
    process.exit(1);
  });
