import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../src/lib/db/schema";

const client = createClient({
  url: "file:local.db",
});

const db = drizzle(client, { schema });

async function migrate() {
  console.log("🔧 Creating database tables...");

  // Create tables manually using SQL
  await client.execute(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      domain TEXT UNIQUE,
      settings TEXT,
      created_at INTEGER NOT NULL
    )
  `);
  console.log("✅ Created tenants table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS districts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_dzongkha TEXT,
      code TEXT NOT NULL UNIQUE,
      is_city INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER
    )
  `);
  console.log("✅ Created districts table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      district_id TEXT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      domain TEXT UNIQUE,
      address TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      school_type TEXT,
      level TEXT,
      settings TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (district_id) REFERENCES districts(id)
    )
  `);
  console.log("✅ Created schools table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      school_id TEXT,
      type TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT,
      profile_picture TEXT,
      date_of_birth TEXT,
      class_grade INTEGER,
      section TEXT,
      parent_id TEXT,
      employee_id TEXT,
      subjects TEXT,
      occupation TEXT,
      relationship TEXT,
      clerk_user_id TEXT UNIQUE,
      email_verified INTEGER DEFAULT 0,
      settings TEXT,
      created_at INTEGER NOT NULL,
      last_login_at INTEGER,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (parent_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created users table");

  // Assessment tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS assessments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'riasec',
      status TEXT DEFAULT 'in_progress',
      answers TEXT NOT NULL,
      results TEXT,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created assessments table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      assessment_type TEXT NOT NULL,
      question_text TEXT NOT NULL,
      options TEXT NOT NULL,
      category TEXT,
      order_index INTEGER,
      is_active INTEGER DEFAULT 1,
      language TEXT DEFAULT 'en',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);
  console.log("✅ Created questions table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS careers (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      riasec_code TEXT,
      riasec_scores TEXT,
      skills TEXT,
      education_path TEXT,
      subjects TEXT,
      work_environment TEXT,
      salary_range TEXT,
      demand_outlook TEXT,
      bhutan_specific INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);
  console.log("✅ Created careers table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS career_matches (
      id TEXT PRIMARY KEY,
      assessment_id TEXT NOT NULL,
      career_id TEXT NOT NULL,
      match_score INTEGER NOT NULL,
      recommendation_text TEXT,
      is_top_match INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (career_id) REFERENCES careers(id)
    )
  `);
  console.log("✅ Created career_matches table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS consent_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      consent_text TEXT,
      ip_address TEXT,
      user_agent TEXT,
      consented_at INTEGER,
      revoked_at INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created consent_records table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      name TEXT NOT NULL,
      grade INTEGER NOT NULL,
      section TEXT,
      academic_year TEXT NOT NULL,
      students TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created classes table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS assessment_types (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      target_grade TEXT,
      target_audience TEXT,
      category TEXT,
      duration INTEGER,
      question_count INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    )
  `);
  console.log("✅ Created assessment_types table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS assessment_submissions (
      id TEXT PRIMARY KEY,
      assessment_id TEXT,
      user_id TEXT,
      assigned_by TEXT,
      status TEXT DEFAULT 'pending',
      started_at INTEGER,
      completed_at INTEGER,
      time_spent INTEGER,
      ip_address TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created assessment_submissions table");

  // Assessment results tables
  const resultTables = [
    { name: "mbti_results", cols: "ei_score INTEGER, sn_score INTEGER, tf_score INTEGER, jp_score INTEGER, personality_type TEXT, traits TEXT" },
    { name: "disc_results", cols: "dominance INTEGER, influence INTEGER, steadiness INTEGER, conscientiousness INTEGER, disc_type TEXT, traits TEXT" },
    { name: "work_values_results", cols: "value_data TEXT, top_values TEXT" },
    { name: "learning_styles_results", cols: "visual INTEGER, auditory INTEGER, read_write INTEGER, kinesthetic INTEGER, dominant_style TEXT, recommendations TEXT" },
    { name: "riasec_results", cols: "realistic INTEGER, investigative INTEGER, artistic INTEGER, social INTEGER, enterprising INTEGER, conventional INTEGER, holland_code TEXT, traits TEXT, career_suggestions TEXT" }
  ];

  for (const table of resultTables) {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS ${table.name} (
        id TEXT PRIMARY KEY,
        assessment_id TEXT,
        user_id TEXT,
        ${table.cols},
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log(`✅ Created ${table.name} table`);
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS exam_results (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      exam_type TEXT,
      exam_year INTEGER,
      subjects TEXT,
      total_percentage INTEGER,
      division TEXT,
      is_verified INTEGER DEFAULT 0,
      verified_by TEXT,
      entered_by TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created exam_results table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS career_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      counselor_id TEXT,
      current_phase TEXT DEFAULT 'self_assessment',
      targetCareer TEXT,
      short_term_goals TEXT,
      long_term_goals TEXT,
      action_steps TEXT,
      milestones TEXT,
      status TEXT DEFAULT 'active',
      completed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (counselor_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created career_plans table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS counselor_notes (
      id TEXT PRIMARY KEY,
      counselor_id TEXT,
      student_id TEXT,
      note TEXT NOT NULL,
      is_private INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (counselor_id) REFERENCES users(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created counselor_notes table");

  // School management tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS school_admins (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      school_id TEXT NOT NULL,
      permissions TEXT,
      is_active INTEGER DEFAULT 1,
      appointed_by TEXT,
      appointed_at INTEGER,
      created_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (school_id) REFERENCES schools(id)
    )
  `);
  console.log("✅ Created school_admins table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS counselor_assignments (
      id TEXT PRIMARY KEY,
      counselor_id TEXT NOT NULL,
      school_id TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      assigned_by TEXT,
      assigned_at INTEGER,
      expires_at INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER,
      FOREIGN KEY (counselor_id) REFERENCES users(id),
      FOREIGN KEY (school_id) REFERENCES schools(id)
    )
  `);
  console.log("✅ Created counselor_assignments table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      school_year TEXT NOT NULL,
      semester TEXT,
      roll_number INTEGER,
      enrolled_at INTEGER,
      enrolled_by TEXT,
      withdrew_at INTEGER,
      status TEXT DEFAULT 'active',
      created_at INTEGER,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    )
  `);
  console.log("✅ Created enrollments table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS teacher_assignments (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      role TEXT DEFAULT 'teacher',
      assigned_at INTEGER,
      assigned_by TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER,
      FOREIGN KEY (teacher_id) REFERENCES users(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    )
  `);
  console.log("✅ Created teacher_assignments table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS academic_terms (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER,
      FOREIGN KEY (school_id) REFERENCES schools(id)
    )
  `);
  console.log("✅ Created academic_terms table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      school_id TEXT,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      name_dzongkha TEXT,
      grade INTEGER,
      description TEXT,
      icon TEXT,
      color TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER,
      FOREIGN KEY (school_id) REFERENCES schools(id)
    )
  `);
  console.log("✅ Created subjects table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS homework (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      subject_id TEXT,
      teacher_id TEXT NOT NULL,
      term_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      instructions TEXT,
      type TEXT NOT NULL,
      questions TEXT,
      attachments TEXT,
      external_links TEXT,
      assigned_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      late_submission_deadline TEXT,
      max_points INTEGER,
      passing_points INTEGER,
      time_limit INTEGER,
      attempts_allowed INTEGER DEFAULT 1,
      show_answers_after TEXT,
      is_published INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created homework table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS homework_submissions (
      id TEXT PRIMARY KEY,
      homework_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      answers TEXT,
      attachments TEXT,
      text_answers TEXT,
      score INTEGER,
      max_score INTEGER,
      percentage INTEGER,
      is_late INTEGER DEFAULT 0,
      submitted_at INTEGER,
      graded_by TEXT,
      graded_at INTEGER,
      feedback TEXT,
      question_feedback TEXT,
      status TEXT DEFAULT 'submitted',
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (homework_id) REFERENCES homework(id),
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (graded_by) REFERENCES users(id)
    )
  `);
  console.log("✅ Created homework_submissions table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      date TEXT NOT NULL,
      term_id TEXT,
      status TEXT NOT NULL,
      entry_method TEXT NOT NULL,
      entered_by TEXT,
      check_in_time TEXT,
      check_out_time TEXT,
      check_in_location TEXT,
      reason TEXT,
      notes TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (entered_by) REFERENCES users(id)
    )
  `);
  console.log("✅ Created attendance table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      class_id TEXT,
      name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      kiosk_device_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER,
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    )
  `);
  console.log("✅ Created attendance_sessions table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS exam_results_enhanced (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      term_id TEXT,
      exam_type TEXT NOT NULL,
      exam_name TEXT NOT NULL,
      exam_year INTEGER NOT NULL,
      subject_results TEXT,
      total_marks_obtained INTEGER,
      total_max_marks INTEGER,
      overall_percentage INTEGER,
      division TEXT,
      rank INTEGER,
      percentile INTEGER,
      board_exam_roll_number TEXT,
      board_registration_number TEXT,
      certificate_url TEXT,
      is_verified INTEGER DEFAULT 0,
      verified_by TEXT,
      entered_by TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created exam_results_enhanced table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS fee_structures (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      name TEXT NOT NULL,
      grade INTEGER NOT NULL,
      academic_year TEXT NOT NULL,
      fees TEXT,
      total_annual_amount INTEGER,
      applicable_scholarships TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (school_id) REFERENCES schools(id)
    )
  `);
  console.log("✅ Created fee_structures table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS student_fees (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      structure_id TEXT,
      term_id TEXT,
      total_amount INTEGER NOT NULL,
      amount_paid INTEGER DEFAULT 0,
      amount_pending INTEGER,
      amount_waived INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      due_date TEXT,
      last_payment_date TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (structure_id) REFERENCES fee_structures(id)
    )
  `);
  console.log("✅ Created student_fees table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS fee_payments (
      id TEXT PRIMARY KEY,
      student_fee_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      school_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_id TEXT,
      receipt_number TEXT NOT NULL,
      receipt_url TEXT,
      collected_by TEXT,
      collected_at INTEGER NOT NULL,
      notes TEXT,
      created_at INTEGER,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (school_id) REFERENCES schools(id)
    )
  `);
  console.log("✅ Created fee_payments table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS learning_modules (
      id TEXT PRIMARY KEY,
      school_id TEXT,
      subject_id TEXT,
      teacher_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      order_index INTEGER,
      lessons TEXT,
      quiz TEXT,
      is_published INTEGER DEFAULT 0,
      is_public INTEGER DEFAULT 0,
      allow_preview INTEGER DEFAULT 1,
      enrollable INTEGER DEFAULT 0,
      max_enrollments INTEGER,
      estimated_duration INTEGER,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created learning_modules table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS module_progress (
      id TEXT PRIMARY KEY,
      module_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      completed_lessons TEXT,
      current_lesson TEXT,
      progress_percentage INTEGER DEFAULT 0,
      quiz_score INTEGER,
      quiz_completed_at INTEGER,
      is_completed INTEGER DEFAULT 0,
      completed_at INTEGER,
      certificate_url TEXT,
      enrolled_at INTEGER,
      last_accessed_at INTEGER,
      created_at INTEGER,
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created module_progress table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS file_storage (
      id TEXT PRIMARY KEY,
      school_id TEXT,
      file_name TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      storage_type TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      uploaded_by TEXT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      is_public INTEGER DEFAULT 0,
      access_count INTEGER DEFAULT 0,
      expires_at INTEGER,
      created_at INTEGER,
      FOREIGN KEY (school_id) REFERENCES schools(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    )
  `);
  console.log("✅ Created file_storage table");

  // Tuition marketplace tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS tuition_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      description TEXT,
      grade_levels TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER
    )
  `);
  console.log("✅ Created tuition_categories table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS tutors (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      bio TEXT,
      qualifications TEXT,
      experience INTEGER,
      subjects TEXT,
      grade_levels TEXT,
      location TEXT,
      travel_radius INTEGER,
      hourly_rate_online INTEGER,
      hourly_rate_physical INTEGER,
      currency TEXT DEFAULT 'BTN',
      available_days TEXT,
      available_slots TEXT,
      is_verified INTEGER DEFAULT 0,
      verification_documents TEXT,
      average_rating INTEGER,
      total_reviews INTEGER DEFAULT 0,
      total_students INTEGER DEFAULT 0,
      bank_account TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created tutors table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS tuition_courses (
      id TEXT PRIMARY KEY,
      tutor_id TEXT NOT NULL,
      category_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      thumbnail TEXT,
      type TEXT NOT NULL,
      location TEXT,
      grade_level INTEGER,
      max_students INTEGER,
      current_enrollments INTEGER DEFAULT 0,
      schedule TEXT,
      lessons TEXT,
      price INTEGER NOT NULL,
      currency TEXT DEFAULT 'BTN',
      discount_price INTEGER,
      discount_valid_until TEXT,
      status TEXT DEFAULT 'draft',
      published_at INTEGER,
      created_at INTEGER,
      updated_at INTEGER,
      FOREIGN KEY (tutor_id) REFERENCES tutors(id)
    )
  `);
  console.log("✅ Created tuition_courses table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS tuition_enrollments (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      tutor_id TEXT NOT NULL,
      amount_paid INTEGER NOT NULL,
      platform_fee INTEGER NOT NULL,
      tutor_earnings INTEGER NOT NULL,
      currency TEXT DEFAULT 'BTN',
      payment_status TEXT DEFAULT 'pending',
      payment_method TEXT,
      enrolled_at INTEGER NOT NULL,
      completed_at INTEGER,
      expires_at INTEGER,
      progress_percentage INTEGER DEFAULT 0,
      completed_lessons TEXT,
      certificate_url TEXT,
      created_at INTEGER,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (tutor_id) REFERENCES tutors(id)
    )
  `);
  console.log("✅ Created tuition_enrollments table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS live_sessions (
      id TEXT PRIMARY KEY,
      tutor_id TEXT NOT NULL,
      student_id TEXT,
      course_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      subject TEXT NOT NULL,
      session_type TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration INTEGER NOT NULL,
      platform TEXT NOT NULL,
      meeting_link TEXT,
      meeting_password TEXT,
      max_participants INTEGER,
      current_participants INTEGER DEFAULT 0,
      price_per_student INTEGER,
      is_recorded INTEGER DEFAULT 0,
      recording_url TEXT,
      status TEXT DEFAULT 'scheduled',
      actual_start_time INTEGER,
      actual_end_time INTEGER,
      created_at INTEGER,
      FOREIGN KEY (tutor_id) REFERENCES tutors(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created live_sessions table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS tutor_reviews (
      id TEXT PRIMARY KEY,
      tutor_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      enrollment_id TEXT,
      session_id TEXT,
      rating INTEGER NOT NULL,
      teaching_quality INTEGER,
      communication INTEGER,
      punctuality INTEGER,
      value_for_money INTEGER,
      review TEXT,
      is_public INTEGER DEFAULT 1,
      tutor_response TEXT,
      responded_at INTEGER,
      created_at INTEGER,
      FOREIGN KEY (tutor_id) REFERENCES tutors(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created tutor_reviews table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS tutor_earnings (
      id TEXT PRIMARY KEY,
      tutor_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT NOT NULL,
      enrollment_id TEXT,
      gross_amount INTEGER NOT NULL,
      platform_fee INTEGER NOT NULL,
      net_amount INTEGER NOT NULL,
      currency TEXT DEFAULT 'BTN',
      payout_status TEXT DEFAULT 'pending',
      payout_method TEXT,
      payout_reference TEXT,
      paid_at INTEGER,
      earned_at INTEGER NOT NULL,
      created_at INTEGER,
      FOREIGN KEY (tutor_id) REFERENCES tutors(id)
    )
  `);
  console.log("✅ Created tutor_earnings table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS physical_tuition_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      subjects TEXT,
      grade_level INTEGER NOT NULL,
      location TEXT,
      max_travel_distance INTEGER,
      preferred_days TEXT,
      preferred_time TEXT,
      max_hourly_rate INTEGER,
      matched_tutors TEXT,
      selected_tutor_id TEXT,
      status TEXT DEFAULT 'open',
      created_at INTEGER,
      expires_at INTEGER,
      FOREIGN KEY (student_id) REFERENCES users(id)
    )
  `);
  console.log("✅ Created physical_tuition_requests table");

  // Content management tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS colleges (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      data_source TEXT,
      external_id TEXT,
      location TEXT,
      website TEXT,
      type TEXT,
      is_bhutan_college INTEGER DEFAULT 0,
      bhutan_college_type TEXT,
      acceptance_rate INTEGER,
      avg_sat INTEGER,
      avg_act INTEGER,
      required_gpa TEXT,
      programs TEXT,
      is_active INTEGER DEFAULT 1,
      updated_at INTEGER,
      created_at INTEGER
    )
  `);
  console.log("✅ Created colleges table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS rub_programs (
      id TEXT PRIMARY KEY,
      college_id TEXT,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      duration TEXT,
      seats INTEGER,
      min_marks INTEGER,
      required_subjects TEXT,
      eligibility_criteria TEXT,
      related_career_clusters TEXT,
      is_active INTEGER DEFAULT 1,
      academic_year TEXT,
      updated_at INTEGER,
      created_at INTEGER
    )
  `);
  console.log("✅ Created rub_programs table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS scholarships (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      data_source TEXT,
      amount TEXT,
      amount_min INTEGER,
      amount_max INTEGER,
      currency TEXT DEFAULT 'BTN',
      eligibility_criteria TEXT,
      required_gpa TEXT,
      required_class TEXT,
      application_deadline TEXT,
      announcement_date TEXT,
      category TEXT,
      target_groups TEXT,
      career_clusters TEXT,
      required_interests TEXT,
      application_url TEXT,
      more_info_url TEXT,
      is_active INTEGER DEFAULT 1,
      academic_year TEXT,
      created_at INTEGER
    )
  `);
  console.log("✅ Created scholarships table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS data_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      api_url TEXT,
      last_sync_at INTEGER,
      sync_status TEXT,
      config TEXT,
      created_at INTEGER
    )
  `);
  console.log("✅ Created data_sources table");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS content_audit (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      user_id TEXT,
      changes TEXT,
      ip_address TEXT,
      created_at INTEGER
    )
  `);
  console.log("✅ Created content_audit table");

  console.log("\n🎉 All database migrations complete!");
  process.exit(0);
}

migrate().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
