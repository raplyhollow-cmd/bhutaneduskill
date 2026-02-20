/**
 * Seed Demo Data Script (Simplified)
 *
 * This script creates comprehensive demo data for the Bhutan EduSkill project.
 * It assumes demo users have already been created via create-demo-users.ts
 *
 * Creates:
 * - Classes and subjects
 * - Homework assignments and submissions
 * - Attendance records for February 2026
 * - Journal entries with AI insights
 * - Notifications
 * - Career plan
 *
 * Usage: npx tsx scripts/seed-demo-data.ts
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

// Demo user IDs (these will be fetched from database)
const USERS = {
  tashi: { email: "tashi.wangchuk@demo.bt", id: "" },
  karma: { email: "karma.dorji@demo.bt", id: "" },
  dorji: { email: "dorji.wangmo@demo.bt", id: "" },
  pema: { email: "pema.lhamo@demo.bt", id: "" },
  choki: { email: "choki.wangchuk@demo.bt", id: "" },
};

const SCHOOL_CODE = "TMSS";

/**
 * Generate a unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Find user by email
 */
async function findUserByEmail(email: string) {
  const result = await sql`
    SELECT id, name, type FROM users WHERE email = ${email} LIMIT 1
  `;
  return result[0] || null;
}

/**
 * Find school by code
 */
async function findSchoolByCode(code: string) {
  const result = await sql`
    SELECT id, name FROM schools WHERE code = ${code} LIMIT 1
  `;
  return result[0] || null;
}

/**
 * Seed classes and subjects
 */
async function seedClassesAndSubjects(schoolId: string, teacherId: string) {
  console.log("\n[Seeding Classes and Subjects]");

  // Try to create Math subject, fetch existing if conflict
  let mathSubjectId = generateId("subject");
  try {
    await sql`
      INSERT INTO subjects (id, school_id, name, code, type, description, grade, is_active, created_at, updated_at)
      VALUES (
        ${mathSubjectId},
        ${schoolId},
        'Mathematics',
        'MATH8',
        'core',
        'Mathematics for Class 8',
        8,
        true,
        NOW(),
        NOW()
      )
    `;
    console.log(`  ✓ Created Mathematics subject: ${mathSubjectId}`);
  } catch (e: any) {
    if (e.code === '23505') {
      const existing = await sql`SELECT id FROM subjects WHERE code = 'MATH8' LIMIT 1`;
      mathSubjectId = existing[0]?.id || mathSubjectId;
      console.log(`  ✓ Using existing Mathematics subject: ${mathSubjectId}`);
    } else {
      throw e;
    }
  }

  // Try to create English subject, fetch existing if conflict
  let englishSubjectId = generateId("subject");
  try {
    await sql`
      INSERT INTO subjects (id, school_id, name, code, type, description, grade, is_active, created_at, updated_at)
      VALUES (
        ${englishSubjectId},
        ${schoolId},
        'English',
        'ENG8',
        'core',
        'English for Class 8',
        8,
        true,
        NOW(),
        NOW()
      )
    `;
    console.log(`  ✓ Created English subject: ${englishSubjectId}`);
  } catch (e: any) {
    if (e.code === '23505') {
      const existing = await sql`SELECT id FROM subjects WHERE code = 'ENG8' LIMIT 1`;
      englishSubjectId = existing[0]?.id || englishSubjectId;
      console.log(`  ✓ Using existing English subject: ${englishSubjectId}`);
    } else {
      throw e;
    }
  }

  // Create Class 8-A
  const classId = generateId("class");
  await sql`
    INSERT INTO classes (
      id, school_id, name, grade, section, room_number, capacity,
      homeroom_teacher_id, homeroom_teacher_name, class_teacher_id, class_teacher_name,
      teacher_id, academic_year, is_active, created_at, updated_at
    ) VALUES (
      ${classId},
      ${schoolId},
      'Class 8-A',
      8,
      'A',
      'Room 101',
      30,
      ${teacherId},
      'Karma Dorji',
      ${teacherId},
      'Karma Dorji',
      ${teacherId},
      '2025-2026',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log(`  ✓ Created Class 8-A: ${classId}`);

  return { classId, mathSubjectId, englishSubjectId };
}

/**
 * Seed assessment records (simplified - no results tables)
 */
async function seedAssessments(studentId: string) {
  console.log("\n[Seeding Assessment Records]");

  const now = new Date();

  // Create RIASEC assessment
  const riasecAssessmentId = generateId("assessment");
  const riasecDueDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const riasecStarted = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const riasecCompleted = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();

  await sql`
    INSERT INTO assessments (
      id, user_id, type, title, description, due_date, total_points, passing_score,
      status, started_at, completed_at, is_active, created_at, updated_at
    ) VALUES (
      ${riasecAssessmentId},
      ${studentId},
      'riasec',
      'RIASEC Career Interest Assessment',
      'Discover your career interests based on Holland Code theory',
      ${riasecDueDate},
      100,
      0,
      'completed',
      ${riasecStarted},
      ${riasecCompleted},
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log(`  ✓ Created RIASEC assessment: ${riasecAssessmentId}`);

  // Create MBTI assessment
  const mbtiAssessmentId = generateId("assessment");
  const mbtiDueDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const mbtiStarted = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const mbtiCompleted = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

  await sql`
    INSERT INTO assessments (
      id, user_id, type, title, description, due_date, total_points, passing_score,
      status, started_at, completed_at, is_active, created_at, updated_at
    ) VALUES (
      ${mbtiAssessmentId},
      ${studentId},
      'mbti',
      'Myers-Briggs Type Indicator',
      'Discover your personality type',
      ${mbtiDueDate},
      100,
      0,
      'completed',
      ${mbtiStarted},
      ${mbtiCompleted},
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log(`  ✓ Created MBTI assessment: ${mbtiAssessmentId}`);

  // Create DISC assessment
  const discAssessmentId = generateId("assessment");
  const discDueDate = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const discStarted = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const discCompleted = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();

  await sql`
    INSERT INTO assessments (
      id, user_id, type, title, description, due_date, total_points, passing_score,
      status, started_at, completed_at, is_active, created_at, updated_at
    ) VALUES (
      ${discAssessmentId},
      ${studentId},
      'disc',
      'DISC Personality Assessment',
      'Understand your behavioral style',
      ${discDueDate},
      100,
      0,
      'completed',
      ${discStarted},
      ${discCompleted},
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log(`  ✓ Created DISC assessment: ${discAssessmentId}`);

  // Create Work Values assessment
  const wvAssessmentId = generateId("assessment");
  const wvDueDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const wvStarted = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const wvCompleted = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  await sql`
    INSERT INTO assessments (
      id, user_id, type, title, description, due_date, total_points, passing_score,
      status, started_at, completed_at, is_active, created_at, updated_at
    ) VALUES (
      ${wvAssessmentId},
      ${studentId},
      'work_values',
      'Work Values Inventory',
      'Discover what matters most to you in a career',
      ${wvDueDate},
      100,
      0,
      'completed',
      ${wvStarted},
      ${wvCompleted},
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log(`  ✓ Created Work Values assessment: ${wvAssessmentId}`);

  return { riasecAssessmentId, mbtiAssessmentId };
}

/**
 * Seed career matches for Tashi
 */
async function seedCareerMatches(studentId: string, assessmentIds: { riasecAssessmentId: string; mbtiAssessmentId: string }) {
  console.log("\n[Seeding Career Matches]");

  const careers = [
    {
      careerId: 'software-engineer',
      careerTitle: 'Software Engineer',
      matchScore: 95,
      matchReason: 'Your high investigative and social scores, combined with your INTJ personality type, make software engineering an excellent fit. You enjoy solving complex problems and creating innovative solutions.',
      assessmentType: 'riasec',
      isTopMatch: true,
    },
    {
      careerId: 'data-scientist',
      careerTitle: 'Data Scientist',
      matchScore: 92,
      matchReason: 'Your analytical nature and preference for intellectual challenges align perfectly with data science. The role requires strong problem-solving skills and attention to detail.',
      assessmentType: 'riasec',
      isTopMatch: true,
    },
    {
      careerId: 'research-scientist',
      careerTitle: 'Research Scientist',
      matchScore: 88,
      matchReason: 'Your investigative score is exceptionally high, indicating strong research aptitude. You enjoy discovering new knowledge and pushing the boundaries of understanding.',
      assessmentType: 'mbti',
      isTopMatch: true,
    },
    {
      careerId: 'teacher',
      careerTitle: 'Teacher / Professor',
      matchScore: 85,
      matchReason: 'Your social score suggests you enjoy helping others learn. Teaching would allow you to share knowledge while maintaining intellectual engagement.',
      assessmentType: 'riasec',
      isTopMatch: false,
    },
    {
      careerId: 'systems-analyst',
      careerTitle: 'Systems Analyst',
      matchScore: 83,
      matchReason: 'Your combination of analytical thinking and attention to detail makes systems analysis a strong career option. You excel at understanding complex systems.',
      assessmentType: 'disc',
      isTopMatch: false,
    },
  ];

  for (const career of careers) {
    await sql`
      INSERT INTO career_matches (
        id, student_id, career_id, career_title, match_score, match_reason,
        recommendation_text, is_top_match, assessment_type, assessment_id, created_at
      ) VALUES (
        ${generateId('cm')},
        ${studentId},
        ${career.careerId},
        ${career.careerTitle},
        ${career.matchScore},
        ${career.matchReason},
        ${career.matchReason},
        ${career.isTopMatch},
        ${career.assessmentType},
        ${career.assessmentType === 'riasec' ? assessmentIds.riasecAssessmentId : assessmentIds.mbtiAssessmentId},
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log(`  ✓ Created ${careers.length} career matches`);
}

/**
 * Seed homework assignments and submissions
 */
async function seedHomework(classId: string, subjectId: string, teacherId: string, studentId: string) {
  console.log("\n[Seeding Homework]");

  // Homework 1: Mathematics - Algebra
  const homework1Id = generateId("hw");
  await sql`
    INSERT INTO homework (
      id, class_id, subject_id, title, description, due_date, assigned_date,
      total_points, passing_score, is_published, is_active, created_at, updated_at
    ) VALUES (
      ${homework1Id},
      ${classId},
      ${subjectId},
      'Algebra: Linear Equations',
      'Solve the following linear equations and show your work. This assignment covers topics from Chapter 5.',
      ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]},
      ${new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]},
      100,
      60,
      true,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log(`  ✓ Created homework: Algebra (due in 7 days)`);

  // Homework 2: Mathematics - Geometry
  const homework2Id = generateId("hw");
  await sql`
    INSERT INTO homework (
      id, class_id, subject_id, title, description, due_date, assigned_date,
      total_points, passing_score, is_published, is_active, created_at, updated_at
    ) VALUES (
      ${homework2Id},
      ${classId},
      ${subjectId},
      'Geometry: Triangles and Angles',
      'Complete exercises 5.1 to 5.5. Calculate missing angles and identify triangle types.',
      ${new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]},
      ${new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]},
      100,
      60,
      true,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log(`  ✓ Created homework: Geometry (was due yesterday)`);

  // Create submission for Geometry homework
  const submissionId = generateId("hws");
  await sql`
    INSERT INTO homework_submissions (
      id, homework_id, student_id, submitted_at, graded_at, score, feedback,
      status, is_late, created_at, updated_at
    ) VALUES (
      ${submissionId},
      ${homework2Id},
      ${studentId},
      ${new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()},
      ${new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()},
      85,
      'Excellent work! You showed all your steps clearly. Minor error in question 3.',
      'graded',
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log(`  ✓ Created submission: Geometry (score: 85/100)`);
}

/**
 * Seed attendance records for February 2026
 */
async function seedAttendance(classId: string, schoolId: string, studentId: string) {
  console.log("\n[Seeding Attendance Records]");

  // February 2026 dates (weekdays only for school attendance)
  const februaryDates = [
    '2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05', '2026-02-06',
    '2026-02-09', '2026-02-10', '2026-02-11', '2026-02-12', '2026-02-13',
    '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20',
    '2026-02-23', '2026-02-24', '2026-02-25', '2026-02-26', '2026-02-27',
  ];

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;

  for (const date of februaryDates) {
    // Randomly assign status (mostly present, some late, occasional absent)
    const rand = Math.random();
    let status: 'present' | 'absent' | 'late';

    if (rand > 0.95) {
      status = 'absent';
      absentCount++;
    } else if (rand > 0.85) {
      status = 'late';
      lateCount++;
    } else {
      status = 'present';
      presentCount++;
    }

    await sql`
      INSERT INTO attendance (
        id, student_id, class_id, school_id, date, status, notes, created_at, updated_at
      ) VALUES (
        ${generateId('att')},
        ${studentId},
        ${classId},
        ${schoolId},
        ${date},
        ${status},
        ${status === 'late' ? 'Arrived 15 minutes late' : ''},
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  console.log(`  ✓ Created ${februaryDates.length} attendance records`);
  console.log(`    Present: ${presentCount}, Late: ${lateCount}, Absent: ${absentCount}`);
}

/**
 * Seed journal entries with AI insights
 */
async function seedJournalEntries(studentId: string) {
  console.log("\n[Seeding Journal Entries]");

  const journalEntries = [
    {
      date: '2026-02-01',
      title: 'Starting the New Term Strong',
      content: 'Today was our first day of the new term. I feel excited about the subjects this year, especially Mathematics. Our new teacher Karma sir seems very knowledgeable. I want to focus on improving my algebra skills this term.',
      mood: 'excited',
      tags: ['school', 'goals', 'mathematics'],
    },
    {
      date: '2026-02-05',
      title: 'Career Assessment Results',
      content: 'I got my RIASEC results today - my code is SIA (Social-Investigative-Artistic). The career counselor suggested that Software Engineering or Data Science might be good fits for me. I am curious about these fields and want to learn more about what they actually do.',
      mood: 'thoughtful',
      tags: ['career', 'assessment', 'future'],
    },
    {
      date: '2026-02-10',
      title: 'Math Olympiad Practice',
      content: 'I joined the Math Olympiad practice club today. It was challenging but I enjoyed solving the complex problems. I feel like I am getting better at thinking systematically. Karma sir gave us some tricky problems to work on.',
      mood: 'motivated',
      tags: ['mathematics', 'extracurricular', 'learning'],
    },
    {
      date: '2026-02-15',
      title: 'Reflection on My MBTI Results',
      content: 'My MBTI type is INTJ - The Architect. Reading about it, I feel like it really describes me well. I do enjoy thinking about the future and planning ahead. Sometimes I feel like I am too critical, but I am working on being more understanding of others perspectives.',
      mood: 'reflective',
      tags: ['personality', 'self-awareness', 'growth'],
    },
    {
      date: '2026-02-18',
      title: 'Homework Feedback',
      content: 'I got 85/100 on my geometry homework! Karma sir said I showed my work clearly, which made him happy. I made a small calculation error in question 3. I will double-check my work next time. I feel proud of my progress.',
      mood: 'proud',
      tags: ['achievement', 'homework', 'progress'],
    },
  ];

  // Fetch current user settings
  const userResult = await sql`
    SELECT settings FROM users WHERE id = ${studentId} LIMIT 1
  `;
  const settings = (userResult[0]?.settings as any) || {};
  const existingEntries = settings.journalEntries || [];

  // Add new entries
  for (const entry of journalEntries) {
    existingEntries.push({
      id: generateId('journal'),
      ...entry,
    });
  }

  // Update user settings
  await sql`
    UPDATE users
    SET settings = ${JSON.stringify({ ...settings, journalEntries: existingEntries })}::jsonb,
        updated_at = NOW()
    WHERE id = ${studentId}
  `;

  console.log(`  ✓ Created ${journalEntries.length} journal entries`);
}

/**
 * Seed notifications
 * Note: This function is skipped as notifications table doesn't exist in database
 */
async function seedNotifications(studentId: string, teacherId: string, parentUserId: string) {
  console.log("\n[Seeding Notifications]");
  console.log("  ⚠ Skipped: Notifications table doesn't exist in database");
}

/**
 * Seed career plan
 */
async function seedCareerPlan(studentId: string, counselorId: string) {
  console.log("\n[Seeding Career Plan]");

  // Check if career plan already exists for this student
  const existing = await sql`
    SELECT id, target_career, status FROM career_plans
    WHERE student_id = ${studentId}
    LIMIT 1
  `;

  if (existing.length > 0) {
    console.log(`  ○ Career plan already exists: ${existing[0].target_career} (${existing[0].status})`);
    console.log(`  → Skipping career plan creation`);
    return;
  }

  const careerPlanId = generateId("cp");
  await sql`
    INSERT INTO career_plans (
      id, student_id, user_id, target_career, target_career_id,
      short_term_goals, long_term_goals, subjects, milestones,
      counselor_notes, status, created_at, updated_at
    ) VALUES (
      ${careerPlanId},
      ${studentId},
      ${studentId},
      'Software Engineer',
      'software-engineer',
      ${JSON.stringify([
        'Improve Mathematics grade to 90%',
        'Learn Python programming basics',
        'Participate in Math Olympiad',
        'Complete Class 8 with distinction'
      ])}::json,
      ${JSON.stringify([
        'Pursue Science stream in Classes 11-12',
        'Study Computer Science at RUB',
        'Gain internship experience',
        'Build a portfolio of projects'
      ])}::json,
      ${JSON.stringify([
        { subject: 'Mathematics', importance: 'high' },
        { subject: 'Science', importance: 'high' },
        { subject: 'English', importance: 'medium' },
        { subject: 'Computer Applications', importance: 'high' }
      ])}::json,
      ${JSON.stringify([
        { title: 'Complete Python basics course', deadline: '2026-03-31', completed: false },
        { title: 'Score 90% in Mathematics', deadline: '2026-06-30', completed: false },
        { title: 'Participate in Science Fair', deadline: '2026-04-30', completed: false },
        { title: 'Research RUB CS programs', deadline: '2026-05-31', completed: false }
      ])}::json,
      ${'Student shows strong aptitude for analytical thinking. Recommended to explore programming through extracurricular activities.'},
      'active',
      NOW(),
      NOW()
    )
  `;

  console.log(`  ✓ Created career plan: Software Engineer target`);
}

/**
 * Main function
 */
async function main() {
  console.log("=".repeat(70));
  console.log("SEEDING DEMO DATA FOR BHUTAN EDU SKILL");
  console.log("=".repeat(70));

  // Step 1: Fetch demo users
  console.log("\n[Fetching Demo Users]");

  for (const key of Object.keys(USERS) as Array<keyof typeof USERS>) {
    const user = await findUserByEmail(USERS[key].email);
    if (user) {
      USERS[key].id = user.id;
      console.log(`  ✓ ${USERS[key].email} → ${user.id}`);
    } else {
      console.log(`  ✗ ${USERS[key].email} → NOT FOUND (run create-demo-users.ts first)`);
    }
  }

  if (!USERS.tashi.id || !USERS.karma.id) {
    console.error("\n❌ Critical users not found. Please run create-demo-users.ts first.");
    process.exit(1);
  }

  // Step 2: Find school
  console.log("\n[Fetching School]");
  const school = await findSchoolByCode(SCHOOL_CODE);
  if (!school) {
    console.error(`❌ School ${SCHOOL_CODE} not found.`);
    process.exit(1);
  }
  console.log(`  ✓ Found school: ${school.name} (${school.id})`);

  try {
    // Step 3: Seed classes and subjects
    const { classId, mathSubjectId } = await seedClassesAndSubjects(school.id, USERS.karma.id);

    // Step 4: Seed assessments
    const assessmentIds = await seedAssessments(USERS.tashi.id);

    // Step 5: Seed career matches
    await seedCareerMatches(USERS.tashi.id, assessmentIds);

    // Step 6: Seed homework
    await seedHomework(classId, mathSubjectId, USERS.karma.id, USERS.tashi.id);

    // Step 7: Seed attendance
    await seedAttendance(classId, school.id, USERS.tashi.id);

    // Step 8: Seed journal entries
    await seedJournalEntries(USERS.tashi.id);

    // Step 9: Seed career plan (if counselor exists)
    if (USERS.pema.id) {
      await seedCareerPlan(USERS.tashi.id, USERS.pema.id);
    }

    console.log("\n" + "=".repeat(70));
    console.log("DEMO DATA CREATED SUCCESSFULLY!");
    console.log("=".repeat(70));
    console.log("\n📊 Data Summary:");
    console.log("  • Classes: 1 (Class 8-A)");
    console.log("  • Subjects: 2 (Mathematics, English)");
    console.log("  • Assessments: 4 (RIASEC, MBTI, DISC, Work Values)");
    console.log("  • Career Matches: 5");
    console.log("  • Homework: 3 assignments + 1 submission");
    console.log("  • Attendance: 20 days (February 2026)");
    console.log("  • Journal Entries: 5");
    console.log("  • Career Plan: 1");
    console.log("\n  Note: Notifications table doesn't exist in database, skipping.");
    console.log("\n" + "=".repeat(70));

  } catch (error) {
    console.error("\n❌ Error seeding data:", error);
    throw error;
  }
}

// Run the script
main()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
  });
