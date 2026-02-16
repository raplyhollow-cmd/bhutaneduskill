/**
 * SEED ASSESSMENT TYPES
 *
 * This script seeds the database with predefined assessment types
 * including MBTI, DISC, Work Values, and Learning Styles.
 */

import { db } from "../src/lib/db";
import { assessmentTypes } from "../src/lib/db/schema";

const assessmentTypesData = [
  // MBTI
  {
    id: "at_mbti_personality",
    name: "MBTI Personality Assessment",
    description: "Discover your personality type based on the Myers-Briggs Type Indicator. This assessment evaluates your preferences across four dichotomies: Extraversion vs Introversion, Sensing vs Intuition, Thinking vs Feeling, and Judging vs Perceiving.",
    category: "personality",
    targetAudience: "student",
    targetGrade: null,
    duration: 15,
    totalQuestions: 16,
    passingScore: 0,
    isActive: true,
  },

  // DISC
  {
    id: "at_disc_behavior",
    name: "DISC Behavior Assessment",
    description: "Understand your behavioral style using the DISC model. This assessment measures Dominance, Influence, Steadiness, and Conscientiousness to help you understand how you interact with others and approach tasks.",
    category: "personality",
    targetAudience: "student",
    targetGrade: null,
    duration: 20,
    totalQuestions: 16,
    passingScore: 0,
    isActive: true,
  },

  // Work Values
  {
    id: "at_work_values",
    name: "Work Values Inventory",
    description: "Identify what matters most to you in a career. This assessment helps you understand your core work values including achievement, independence, recognition, relationships, support, and working conditions.",
    category: "work_values",
    targetAudience: "student",
    targetGrade: null,
    duration: 10,
    totalQuestions: 18,
    passingScore: 0,
    isActive: true,
  },

  // Learning Styles
  {
    id: "at_learning_styles",
    name: "Learning Styles Assessment (VARK)",
    description: "Discover your preferred learning style using the VARK model. This assessment identifies whether you learn best through Visual, Auditory, Read/Write, or Kinesthetic methods.",
    category: "learning_style",
    targetAudience: "student",
    targetGrade: null,
    duration: 12,
    totalQuestions: 16,
    passingScore: 0,
    isActive: true,
  },

  // Career Interest
  {
    id: "at_career_interest",
    name: "Career Interest Inventory",
    description: "Explore your career interests and discover occupations that match your preferences. This assessment helps identify career paths aligned with your interests.",
    category: "career_interest",
    targetAudience: "student",
    targetGrade: null,
    duration: 25,
    totalQuestions: 30,
    passingScore: 0,
    isActive: true,
  },

  // Aptitude
  {
    id: "at_aptitude_test",
    name: "General Aptitude Test",
    description: "Assess your general aptitudes across multiple areas including verbal, numerical, and spatial reasoning. This test helps identify your natural strengths and abilities.",
    category: "aptitude",
    targetAudience: "student",
    targetGrade: null,
    duration: 30,
    totalQuestions: 25,
    passingScore: 70,
    isActive: true,
  },

  // Skill Assessment
  {
    id: "at_skill_assessment",
    name: "Core Skills Assessment",
    description: "Evaluate your core skills in communication, problem-solving, teamwork, and critical thinking. This assessment helps identify areas for skill development.",
    category: "skill",
    targetAudience: "student",
    targetGrade: null,
    duration: 20,
    totalQuestions: 20,
    passingScore: 60,
    isActive: true,
  },
];

async function seedAssessmentTypes() {
  console.log("🌱 Seeding assessment types...");

  try {
    // Get existing assessment types
    const existing = await db.select().from(assessmentTypes);
    const existingIds = new Set(existing.map((at) => at.id));

    // Filter out already existing types
    const toInsert = assessmentTypesData.filter((at) => !existingIds.has(at.id));

    if (toInsert.length === 0) {
      console.log("✅ All assessment types already exist in the database.");
      return;
    }

    console.log(`📝 Inserting ${toInsert.length} assessment types...`);

    const now = new Date();

    for (const assessmentType of toInsert) {
      await db.insert(assessmentTypes).values({
        ...assessmentType,
        createdAt: now,
        updatedAt: now,
      });
      console.log(`  ✓ Inserted: ${assessmentType.name}`);
    }

    console.log(`✅ Successfully seeded ${toInsert.length} assessment types!`);

    // Display summary
    const allTypes = await db.select().from(assessmentTypes);
    console.log(`\n📊 Total assessment types in database: ${allTypes.length}`);

    // Group by category
    const byCategory = allTypes.reduce((acc, at) => {
      const cat = at.category || "other";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("\n📋 By category:");
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });
  } catch (error) {
    console.error("❌ Error seeding assessment types:", error);
    throw error;
  }
}

// Run the seed function
seedAssessmentTypes()
  .then(() => {
    console.log("\n✨ Seed completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seed failed:", error);
    process.exit(1);
  });
