-- ============================================================================
-- COMPREHENSIVE JSON TYPE CASTING FIX
-- This script fixes columns that were created as TEXT but should be JSON
-- Date: 2026-02-22
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Existing fixes (already applied)
-- ----------------------------------------------------------------------------

-- Fix assessment_questions table
ALTER TABLE "assessment_questions" ALTER COLUMN "question_data" SET DATA TYPE json USING question_data::json;
ALTER TABLE "assessment_questions" ALTER COLUMN "options" SET DATA TYPE json USING options::json;

-- Fix announcements table
ALTER TABLE "announcements" ALTER COLUMN "target_class_ids" SET DATA TYPE json USING target_class_ids::json;
ALTER TABLE "announcements" ALTER COLUMN "target_user_ids" SET DATA TYPE json USING target_user_ids::json;

-- Fix bus_attendance table
ALTER TABLE "bus_attendance" ALTER COLUMN "pickup_location" SET DATA TYPE json USING pickup_location::json;
ALTER TABLE "bus_attendance" ALTER COLUMN "drop_location" SET DATA TYPE json USING drop_location::json;

-- Fix users table
ALTER TABLE "users" ALTER COLUMN "interests" SET DATA TYPE json USING interests::json;

-- Fix schools table
ALTER TABLE "schools" ALTER COLUMN "facilities" SET DATA TYPE json USING facilities::json;
ALTER TABLE "schools" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);

-- Fix classes table
ALTER TABLE "classes" ALTER COLUMN "students" SET DATA TYPE json USING students::json;
ALTER TABLE "classes" ALTER COLUMN "schedule" SET DATA TYPE json USING schedule::json;

-- Fix homework table
ALTER TABLE "homework" ALTER COLUMN "assigned_students" SET DATA TYPE json USING assigned_students::json;

-- Fix rubric_assessments table
ALTER TABLE "rubric_assessments" ALTER COLUMN "responses" SET DATA TYPE json USING responses::json;

-- Fix teacher_logs table
ALTER TABLE "teacher_logs" ALTER COLUMN "behavior_tags" SET DATA TYPE json USING behavior_tags::json;

-- Fix behavior_logs table
ALTER TABLE "behavior_logs" ALTER COLUMN "behavior_tags" SET DATA TYPE json USING behavior_tags::json;

-- Fix intervention_plans table
ALTER TABLE "intervention_plans" ALTER COLUMN "strategies" SET DATA TYPE json USING strategies::json;
ALTER TABLE "intervention_plans" ALTER COLUMN "progress" SET DATA TYPE json USING progress::json;

-- Fix fee_payments table
ALTER TABLE "fee_payments" ALTER COLUMN "payment_details" SET DATA TYPE json USING payment_details::json;

-- Fix parent_links table
ALTER TABLE "parent_links" ALTER COLUMN "phone_numbers" SET DATA TYPE json USING phone_numbers::json;

-- Fix counselor_sessions table
ALTER TABLE "counselor_sessions" ALTER COLUMN "notes" SET DATA TYPE json USING notes::json;

-- Fix roadmap_progress table
ALTER TABLE "roadmap_progress" ALTER COLUMN "milestone_status" SET DATA TYPE json USING milestone_status::json;

-- Fix subscriptions table
ALTER TABLE "subscriptions" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);

-- Fix ai_interactions table
ALTER TABLE "ai_interactions" ALTER COLUMN "interaction_data" SET DATA TYPE json USING COALESCE(interaction_data::json, '{}'::json);
ALTER TABLE "ai_interactions" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);

-- ----------------------------------------------------------------------------
-- Additional fixes for newer tables (Feb 2026)
-- ----------------------------------------------------------------------------

-- Fix hostel_facilities table
ALTER TABLE "hostel_facilities" ALTER COLUMN "equipment" SET DATA TYPE json USING COALESCE(equipment::json, '[]'::json);

-- Fix vehicles table
ALTER TABLE "vehicles" ALTER COLUMN "specifications" SET DATA TYPE json USING COALESCE(specifications::json, '{}'::json);

-- Fix student_portfolios table
ALTER TABLE "student_portfolios" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);

-- Fix hostel_rules table
ALTER TABLE "hostel_rules" ALTER COLUMN "rules" SET DATA TYPE json USING COALESCE(rules::json, '{}'::json);

-- ----------------------------------------------------------------------------
-- Comprehensive fixes for ALL JSON columns (260+ columns)
-- These use IF EXISTS pattern to skip if tables don't exist
-- ----------------------------------------------------------------------------

-- Academic years
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'academic_years') THEN
    ALTER TABLE "academic_years" ALTER COLUMN "working_days" SET DATA TYPE json USING COALESCE(working_days::json, '[]'::json);
    ALTER TABLE "academic_years" ALTER COLUMN "terms" SET DATA TYPE json USING COALESCE(terms::json, '[]'::json);
    ALTER TABLE "academic_years" ALTER COLUMN "grades" SET DATA TYPE json USING COALESCE(grades::json, '[]'::json);
    ALTER TABLE "academic_years" ALTER COLUMN "periods" SET DATA TYPE json USING COALESCE(periods::json, '[]'::json);
  END IF;
END $$;

-- Assessment responses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_responses') THEN
    ALTER TABLE "assessment_responses" ALTER COLUMN "answers" SET DATA TYPE json USING COALESCE(answers::json, '[]'::json);
    ALTER TABLE "assessment_responses" ALTER COLUMN "text_answers" SET DATA TYPE json USING COALESCE(text_answers::json, '{}'::json);
  END IF;
END $$;

-- Learning styles results
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_styles_results') THEN
    ALTER TABLE "learning_styles_results" ALTER COLUMN "recommendations" SET DATA TYPE json USING COALESCE(recommendations::json, '[]'::json);
  END IF;
END $$;

-- Assessment templates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assessment_templates') THEN
    ALTER TABLE "assessment_templates" ALTER COLUMN "questions" SET DATA TYPE json USING COALESCE(questions::json, '[]'::json);
    ALTER TABLE "assessment_templates" ALTER COLUMN "attachments" SET DATA TYPE json USING COALESCE(attachments::json, '[]'::json);
  END IF;
END $$;

-- Lesson plans
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_plans') THEN
    ALTER TABLE "lesson_plans" ALTER COLUMN "content" SET DATA TYPE json USING COALESCE(content::json, '{}'::json);
  END IF;
END $$;

-- Homework assignments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'homework_assignments') THEN
    ALTER TABLE "homework_assignments" ALTER COLUMN "attachments" SET DATA TYPE json USING COALESCE(attachments::json, '[]'::json);
  END IF;
END $$;

-- Career assessments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'career_assessments') THEN
    ALTER TABLE "career_assessments" ALTER COLUMN "scores" SET DATA TYPE json USING COALESCE(scores::json, '{}'::json);
    ALTER TABLE "career_assessments" ALTER COLUMN "recommended_careers" SET DATA TYPE json USING COALESCE(recommended_careers::json, '[]'::json);
  END IF;
END $$;

-- Strength/weaker assessments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'strength_weaker') THEN
    ALTER TABLE "strength_weaker" ALTER COLUMN "scores" SET DATA TYPE json USING COALESCE(scores::json, '{}'::json);
    ALTER TABLE "strength_weaker" ALTER COLUMN "strengths" SET DATA TYPE json USING COALESCE(strengths::json, '[]'::json);
    ALTER TABLE "strength_weaker" ALTER COLUMN "weaknesses" SET DATA TYPE json USING COALESCE(weaknesses::json, '[]'::json);
    ALTER TABLE "strength_weaker" ALTER COLUMN "recommended_careers" SET DATA TYPE json USING COALESCE(recommended_careers::json, '[]'::json);
  END IF;
END $$;

-- Value assessments
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'value_assessments') THEN
    ALTER TABLE "value_assessments" ALTER COLUMN "scores" SET DATA TYPE json USING COALESCE(scores::json, '{}'::json);
    ALTER TABLE "value_assessments" ALTER COLUMN "top_values" SET DATA TYPE json USING COALESCE(top_values::json, '[]'::json);
    ALTER TABLE "value_assessments" ALTER COLUMN "recommended_careers" SET DATA TYPE json USING COALESCE(recommended_careers::json, '[]'::json);
  END IF;
END $$;

-- Courses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
    ALTER TABLE "courses" ALTER COLUMN "content" SET DATA TYPE json USING COALESCE(content::json, '{}'::json);
    ALTER TABLE "courses" ALTER COLUMN "tags" SET DATA TYPE json USING COALESCE(tags::json, '[]'::json);
    ALTER TABLE "courses" ALTER COLUMN "objectives" SET DATA TYPE json USING COALESCE(objectives::json, '[]'::json);
    ALTER TABLE "courses" ALTER COLUMN "prerequisites" SET DATA TYPE json USING COALESCE(prerequisites::json, '[]'::json);
  END IF;
END $$;

-- Notifications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    ALTER TABLE "notifications" ALTER COLUMN "target_audience" SET DATA TYPE json USING COALESCE(target_audience::json, '[]'::json);
    ALTER TABLE "notifications" ALTER COLUMN "reminders" SET DATA TYPE json USING COALESCE(reminders::json, '[]'::json);
    ALTER TABLE "notifications" ALTER COLUMN "attachments" SET DATA TYPE json USING COALESCE(attachments::json, '[]'::json);
  END IF;
END $$;

-- Forms
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forms') THEN
    ALTER TABLE "forms" ALTER COLUMN "responses" SET DATA TYPE json USING COALESCE(responses::json, '{}'::json);
  END IF;
END $$;

-- AI assistants
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_assistants') THEN
    ALTER TABLE "ai_assistants" ALTER COLUMN "config" SET DATA TYPE json USING COALESCE(config::json, '{}'::json);
  END IF;
END $$;

-- Careers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'careers') THEN
    ALTER TABLE "careers" ALTER COLUMN "holland_codes" SET DATA TYPE json USING COALESCE(holland_codes::json, '[]'::json);
    ALTER TABLE "careers" ALTER COLUMN "skills" SET DATA TYPE json USING COALESCE(skills::json, '[]'::json);
    ALTER TABLE "careers" ALTER COLUMN "subjects" SET DATA TYPE json USING COALESCE(subjects::json, '[]'::json);
    ALTER TABLE "careers" ALTER COLUMN "rub_programs" SET DATA TYPE json USING COALESCE(rub_programs::json, '[]'::json);
  END IF;
END $$;

-- Analytics data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'analytics_data') THEN
    ALTER TABLE "analytics_data" ALTER COLUMN "growth_data" SET DATA TYPE json USING COALESCE(growth_data::json, '{}'::json);
    ALTER TABLE "analytics_data" ALTER COLUMN "revenue_data" SET DATA TYPE json USING COALESCE(revenue_data::json, '{}'::json);
    ALTER TABLE "analytics_data" ALTER COLUMN "activity_data" SET DATA TYPE json USING COALESCE(activity_data::json, '{}'::json);
  END IF;
END $$;

-- Scholarships
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scholarships') THEN
    ALTER TABLE "scholarships" ALTER COLUMN "eligibility_criteria" SET DATA TYPE json USING COALESCE(eligibility_criteria::json, '{}'::json);
    ALTER TABLE "scholarships" ALTER COLUMN "benefits" SET DATA TYPE json USING COALESCE(benefits::json, '{}'::json);
    ALTER TABLE "scholarships" ALTER COLUMN "documents_required" SET DATA TYPE json USING COALESCE(documents_required::json, '[]'::json);
    ALTER TABLE "scholarships" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);
  END IF;
END $$;

-- Programs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'programs') THEN
    ALTER TABLE "programs" ALTER COLUMN "required_subjects" SET DATA TYPE json USING COALESCE(required_subjects::json, '[]'::json);
    ALTER TABLE "programs" ALTER COLUMN "aggregate_requirements" SET DATA TYPE json USING COALESCE(aggregate_requirements::json, '{}'::json);
    ALTER TABLE "programs" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);
  END IF;
END $$;

-- Students table (multiple JSON columns)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
    ALTER TABLE "students" ALTER COLUMN "subjects" SET DATA TYPE json USING COALESCE(subjects::json, '[]'::json);
    ALTER TABLE "students" ALTER COLUMN "short_term_goals" SET DATA TYPE json USING COALESCE(short_term_goals::json, '[]'::json);
    ALTER TABLE "students" ALTER COLUMN "long_term_goals" SET DATA TYPE json USING COALESCE(long_term_goals::json, '[]'::json);
    ALTER TABLE "students" ALTER COLUMN "milestones" SET DATA TYPE json USING COALESCE(milestones::json, '[]'::json);
    ALTER TABLE "students" ALTER COLUMN "action_steps" SET DATA TYPE json USING COALESCE(action_steps::json, '[]'::json);
    ALTER TABLE "students" ALTER COLUMN "documents" SET DATA TYPE json USING COALESCE(documents::json, '[]'::json);
    ALTER TABLE "students" ALTER COLUMN "dietary_restrictions" SET DATA TYPE json USING COALESCE(dietary_restrictions::json, '[]'::json);
  END IF;
END $$;

-- Intervention plans (additional columns)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intervention_plans') THEN
    ALTER TABLE "intervention_plans" ALTER COLUMN "action_items" SET DATA TYPE json USING COALESCE(action_items::json, '[]'::json);
    ALTER TABLE "intervention_plans" ALTER COLUMN "tags" SET DATA TYPE json USING COALESCE(tags::json, '[]'::json);
  END IF;
END $$;

-- Counseling notes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'counseling_notes') THEN
    ALTER TABLE "counseling_notes" ALTER COLUMN "tags" SET DATA TYPE json USING COALESCE(tags::json, '[]'::json);
    ALTER TABLE "counseling_notes" ALTER COLUMN "related_issues" SET DATA TYPE json USING COALESCE(related_issues::json, '[]'::json);
    ALTER TABLE "counseling_notes" ALTER COLUMN "action_items" SET DATA TYPE json USING COALESCE(action_items::json, '[]'::json);
  END IF;
END $$;

-- Wellness goals
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wellness_goals') THEN
    ALTER TABLE "wellness_goals" ALTER COLUMN "goals" SET DATA TYPE json USING COALESCE(goals::json, '[]'::json);
    ALTER TABLE "wellness_goals" ALTER COLUMN "notes" SET DATA TYPE json USING COALESCE(notes::json, '[]'::json);
    ALTER TABLE "wellness_goals" ALTER COLUMN "tags" SET DATA TYPE json USING COALESCE(tags::json, '[]'::json);
  END IF;
END $$;

-- Wellness interventions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wellness_interventions') THEN
    ALTER TABLE "wellness_interventions" ALTER COLUMN "pattern_detected" SET DATA TYPE json USING COALESCE(pattern_detected::json, '{}'::json);
    ALTER TABLE "wellness_interventions" ALTER COLUMN "behavior_log_ids" SET DATA TYPE json USING COALESCE(behavior_log_ids::json, '[]'::json);
    ALTER TABLE "wellness_interventions" ALTER COLUMN "attendance_data" SET DATA TYPE json USING COALESCE(attendance_data::json, '{}'::json);
    ALTER TABLE "wellness_interventions" ALTER COLUMN "academic_data" SET DATA TYPE json USING COALESCE(academic_data::json, '{}'::json);
  END IF;
END $$;

-- Career pathways
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'career_pathways') THEN
    ALTER TABLE "career_pathways" ALTER COLUMN "skills_gap" SET DATA TYPE json USING COALESCE(skills_gap::json, '[]'::json);
    ALTER TABLE "career_pathways" ALTER COLUMN "recommended_preparation" SET DATA TYPE json USING COALESCE(recommended_preparation::json, '[]'::json);
    ALTER TABLE "career_pathways" ALTER COLUMN "recommended_scholarships" SET DATA TYPE json USING COALESCE(recommended_scholarships::json, '[]'::json);
    ALTER TABLE "career_pathways" ALTER COLUMN "gnh_alignment" SET DATA TYPE json USING COALESCE(gnh_alignment::json, '[]'::json);
  END IF;
END $$;

-- AI sessions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_sessions') THEN
    ALTER TABLE "ai_sessions" ALTER COLUMN "completed_steps" SET DATA TYPE json USING COALESCE(completed_steps::json, '[]'::json);
    ALTER TABLE "ai_sessions" ALTER COLUMN "data" SET DATA TYPE json USING COALESCE(data::json, '{}'::json);
  END IF;
END $$;

-- AI conversations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_conversations') THEN
    ALTER TABLE "ai_conversations" ALTER COLUMN "interaction_data" SET DATA TYPE json USING COALESCE(interaction_data::json, '{}'::json);
    ALTER TABLE "ai_conversations" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);
  END IF;
END $$;

-- Agreements
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agreements') THEN
    ALTER TABLE "agreements" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);
  END IF;
END $$;

-- Partnerships
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partnerships') THEN
    ALTER TABLE "partnerships" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);
    ALTER TABLE "partnerships" ALTER COLUMN "structured_data" SET DATA TYPE json USING COALESCE(structured_data::json, '{}'::json);
  END IF;
END $$;

-- Tutors
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutors') THEN
    ALTER TABLE "tutors" ALTER COLUMN "subjects" SET DATA TYPE json USING COALESCE(subjects::json, '[]'::json);
    ALTER TABLE "tutors" ALTER COLUMN "qualifications" SET DATA TYPE json USING COALESCE(qualifications::json, '[]'::json);
    ALTER TABLE "tutors" ALTER COLUMN "availability" SET DATA TYPE json USING COALESCE(availability::json, '[]'::json);
    ALTER TABLE "tutors" ALTER COLUMN "grade_levels" SET DATA TYPE json USING COALESCE(grade_levels::json, '[]'::json);
  END IF;
END $$;

-- Intervention sessions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'intervention_sessions') THEN
    ALTER TABLE "intervention_sessions" ALTER COLUMN "tags" SET DATA TYPE json USING COALESCE(tags::json, '[]'::json);
  END IF;
END $$;

-- Transport routes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transport_routes') THEN
    ALTER TABLE "transport_routes" ALTER COLUMN "stops" SET DATA TYPE json USING COALESCE(stops::json, '[]'::json);
  END IF;
END $$;

-- GPS tracking
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gps_tracking') THEN
    ALTER TABLE "gps_tracking" ALTER COLUMN "pickup_location" SET DATA TYPE json USING COALESCE(pickup_location::json, '{}'::json);
    ALTER TABLE "gps_tracking" ALTER COLUMN "drop_location" SET DATA TYPE json USING COALESCE(drop_location::json, '{}'::json);
  END IF;
END $$;

-- Library books
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'library_books') THEN
    ALTER TABLE "library_books" ALTER COLUMN "authors" SET DATA TYPE json USING COALESCE(authors::json, '[]'::json);
    ALTER TABLE "library_books" ALTER COLUMN "contributors" SET DATA TYPE json USING COALESCE(contributors::json, '[]'::json);
    ALTER TABLE "library_books" ALTER COLUMN "subjects" SET DATA TYPE json USING COALESCE(subjects::json, '[]'::json);
    ALTER TABLE "library_books" ALTER COLUMN "classes" SET DATA TYPE json USING COALESCE(classes::json, '[]'::json);
    ALTER TABLE "library_books" ALTER COLUMN "table_of_contents" SET DATA TYPE json USING COALESCE(table_of_contents::json, '[]'::json);
    ALTER TABLE "library_books" ALTER COLUMN "tags" SET DATA TYPE json USING COALESCE(tags::json, '[]'::json);
  END IF;
END $$;

-- Branding settings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branding_settings') THEN
    ALTER TABLE "branding_settings" ALTER COLUMN "layout" SET DATA TYPE json USING COALESCE(layout::json, '{}'::json);
    ALTER TABLE "branding_settings" ALTER COLUMN "colors" SET DATA TYPE json USING COALESCE(colors::json, '{}'::json);
    ALTER TABLE "branding_settings" ALTER COLUMN "custom_sections" SET DATA TYPE json USING COALESCE(custom_sections::json, '[]'::json);
    ALTER TABLE "branding_settings" ALTER COLUMN "signatures" SET DATA TYPE json USING COALESCE(signatures::json, '{}'::json);
  END IF;
END $$;

-- Hostel rooms
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hostel_rooms') THEN
    ALTER TABLE "hostel_rooms" ALTER COLUMN "bed_details" SET DATA TYPE json USING COALESCE(bed_details::json, '[]'::json);
    ALTER TABLE "hostel_rooms" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);
  END IF;
END $$;

-- Inspections
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inspections') THEN
    ALTER TABLE "inspections" ALTER COLUMN "findings" SET DATA TYPE json USING COALESCE(findings::json, '[]'::json);
    ALTER TABLE "inspections" ALTER COLUMN "prohibited_items" SET DATA TYPE json USING COALESCE(prohibited_items::json, '[]'::json);
    ALTER TABLE "inspections" ALTER COLUMN "photo_urls" SET DATA TYPE json USING COALESCE(photo_urls::json, '[]'::json);
  END IF;
END $$;

-- Incidents
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incidents') THEN
    ALTER TABLE "incidents" ALTER COLUMN "photo_urls" SET DATA TYPE json USING COALESCE(photo_urls::json, '[]'::json);
  END IF;
END $$;

-- Lost and found
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lost_and_found') THEN
    ALTER TABLE "lost_and_found" ALTER COLUMN "items_brought" SET DATA TYPE json USING COALESCE(items_brought::json, '[]'::json);
  END IF;
END $$;

-- Mess menu
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mess_menu') THEN
    ALTER TABLE "mess_menu" ALTER COLUMN "available_days" SET DATA TYPE json USING COALESCE(available_days::json, '[]'::json);
    ALTER TABLE "mess_menu" ALTER COLUMN "equipment" SET DATA TYPE json USING COALESCE(equipment::json, '[]'::json);
    ALTER TABLE "mess_menu" ALTER COLUMN "rules" SET DATA TYPE json USING COALESCE(rules::json, '[]'::json);
    ALTER TABLE "mess_menu" ALTER COLUMN "weekly_menu" SET DATA TYPE json USING COALESCE(weekly_menu::json, '{}'::json);
    ALTER TABLE "mess_menu" ALTER COLUMN "cooks" SET DATA TYPE json USING COALESCE(cooks::json, '[]'::json);
  END IF;
END $$;

-- Conversations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    ALTER TABLE "conversations" ALTER COLUMN "participants" SET DATA TYPE json USING COALESCE(participants::json, '[]'::json);
    ALTER TABLE "conversations" ALTER COLUMN "attachments" SET DATA TYPE json USING COALESCE(attachments::json, '[]'::json);
    ALTER TABLE "conversations" ALTER COLUMN "read_by" SET DATA TYPE json USING COALESCE(read_by::json, '[]'::json);
  END IF;
END $$;

-- Messages
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    ALTER TABLE "messages" ALTER COLUMN "target_audience" SET DATA TYPE json USING COALESCE(target_audience::json, '[]'::json);
    ALTER TABLE "messages" ALTER COLUMN "target_users" SET DATA TYPE json USING COALESCE(target_users::json, '[]'::json);
    ALTER TABLE "messages" ALTER COLUMN "attachments" SET DATA TYPE json USING COALESCE(attachments::json, '[]'::json);
  END IF;
END $$;

-- Payroll rules
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payroll_rules') THEN
    ALTER TABLE "payroll_rules" ALTER COLUMN "tiers" SET DATA TYPE json USING COALESCE(tiers::json, '[]'::json);
    ALTER TABLE "payroll_rules" ALTER COLUMN "tax_slabs" SET DATA TYPE json USING COALESCE(tax_slabs::json, '[]'::json);
    ALTER TABLE "payroll_rules" ALTER COLUMN "allowances" SET DATA TYPE json USING COALESCE(allowances::json, '[]'::json);
    ALTER TABLE "payroll_rules" ALTER COLUMN "deductions" SET DATA TYPE json USING COALESCE(deductions::json, '[]'::json);
    ALTER TABLE "payroll_rules" ALTER COLUMN "custom_allowances" SET DATA TYPE json USING COALESCE(custom_allowances::json, '[]'::json);
    ALTER TABLE "payroll_rules" ALTER COLUMN "custom_deductions" SET DATA TYPE json USING COALESCE(custom_deductions::json, '[]'::json);
    ALTER TABLE "payroll_rules" ALTER COLUMN "additional_allowances" SET DATA TYPE json USING COALESCE(additional_allowances::json, '[]'::json);
    ALTER TABLE "payroll_rules" ALTER COLUMN "additional_deductions" SET DATA TYPE json USING COALESCE(additional_deductions::json, '[]'::json);
  END IF;
END $$;

-- RUB programs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rub_programs') THEN
    ALTER TABLE "rub_programs" ALTER COLUMN "programs" SET DATA TYPE json USING COALESCE(programs::json, '[]'::json);
    ALTER TABLE "rub_programs" ALTER COLUMN "reserved_seats" SET DATA TYPE json USING COALESCE(reserved_seats::json, '[]'::json);
    ALTER TABLE "rub_programs" ALTER COLUMN "required_subjects" SET DATA TYPE json USING COALESCE(required_subjects::json, '[]'::json);
    ALTER TABLE "rub_programs" ALTER COLUMN "eligibility_criteria" SET DATA TYPE json USING COALESCE(eligibility_criteria::json, '{}'::json);
    ALTER TABLE "rub_programs" ALTER COLUMN "career_prospects" SET DATA TYPE json USING COALESCE(career_prospects::json, '[]'::json);
    ALTER TABLE "rub_programs" ALTER COLUMN "preferences" SET DATA TYPE json USING COALESCE(preferences::json, '[]'::json);
  END IF;
END $$;

-- RUB applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rub_applications') THEN
    ALTER TABLE "rub_applications" ALTER COLUMN "subject_marks" SET DATA TYPE json USING COALESCE(subject_marks::json, '[]'::json);
    ALTER TABLE "rub_applications" ALTER COLUMN "documents" SET DATA TYPE json USING COALESCE(documents::json, '[]'::json);
    ALTER TABLE "rub_applications" ALTER COLUMN "scholarship_documents" SET DATA TYPE json USING COALESCE(scholarship_documents::json, '[]'::json);
  END IF;
END $$;

-- Career counseling
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'career_counseling') THEN
    ALTER TABLE "career_counseling" ALTER COLUMN "discussed_programs" SET DATA TYPE json USING COALESCE(discussed_programs::json, '[]'::json);
    ALTER TABLE "career_counseling" ALTER COLUMN "interests" SET DATA TYPE json USING COALESCE(interests::json, '[]'::json);
    ALTER TABLE "career_counseling" ALTER COLUMN "strengths" SET DATA TYPE json USING COALESCE(strengths::json, '[]'::json);
    ALTER TABLE "career_counseling" ALTER COLUMN "recommended_fields" SET DATA TYPE json USING COALESCE(recommended_fields::json, '[]'::json);
    ALTER TABLE "career_counseling" ALTER COLUMN "recommended_colleges" SET DATA TYPE json USING COALESCE(recommended_colleges::json, '[]'::json);
    ALTER TABLE "career_counseling" ALTER COLUMN "documents_shared" SET DATA TYPE json USING COALESCE(documents_shared::json, '[]'::json);
  END IF;
END $$;

-- College selections
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'college_selections') THEN
    ALTER TABLE "college_selections" ALTER COLUMN "college_selections" SET DATA TYPE json USING COALESCE(college_selections::json, '[]'::json);
    ALTER TABLE "college_selections" ALTER COLUMN "program_selections" SET DATA TYPE json USING COALESCE(program_selections::json, '[]'::json);
  END IF;
END $$;

-- Subscription plans
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
    ALTER TABLE "subscription_plans" ALTER COLUMN "features" SET DATA TYPE json USING COALESCE(features::json, '[]'::json);
    ALTER TABLE "subscription_plans" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);
    ALTER TABLE "subscription_plans" ALTER COLUMN "payment_details" SET DATA TYPE json USING COALESCE(payment_details::json, '{}'::json);
    ALTER TABLE "subscription_plans" ALTER COLUMN "line_items" SET DATA TYPE json USING COALESCE(line_items::json, '[]'::json);
    ALTER TABLE "subscription_plans" ALTER COLUMN "applicable_plans" SET DATA TYPE json USING COALESCE(applicable_plans::json, '[]'::json);
  END IF;
END $$;

-- Invoices
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    ALTER TABLE "invoices" ALTER COLUMN "metadata" SET DATA TYPE json USING COALESCE(metadata::json, '{}'::json);
  END IF;
END $$;

-- School applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'school_applications') THEN
    ALTER TABLE "school_applications" ALTER COLUMN "documents" SET DATA TYPE json USING COALESCE(documents::json, '[]'::json);
    ALTER TABLE "school_applications" ALTER COLUMN "additional_info_requested" SET DATA TYPE json USING COALESCE(additional_info_requested::json, '[]'::json);
  END IF;
END $$;

-- Audit logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    ALTER TABLE "audit_logs" ALTER COLUMN "custom_fields" SET DATA TYPE json USING COALESCE(custom_fields::json, '{}'::json);
    ALTER TABLE "audit_logs" ALTER COLUMN "old_value" SET DATA TYPE json USING COALESCE(old_value::json, '{}'::json);
    ALTER TABLE "audit_logs" ALTER COLUMN "new_value" SET DATA TYPE json USING COALESCE(new_value::json, '{}'::json);
    ALTER TABLE "audit_logs" ALTER COLUMN "changes" SET DATA TYPE json USING COALESCE(changes::json, '[]'::json);
  END IF;
END $$;

-- Timetable periods
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timetable_periods') THEN
    ALTER TABLE "timetable_periods" ALTER COLUMN "days" SET DATA TYPE json USING COALESCE(days::json, '[]'::json);
  END IF;
END $$;

-- Timetable resources
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timetable_resources') THEN
    ALTER TABLE "timetable_resources" ALTER COLUMN "facilities" SET DATA TYPE json USING COALESCE(facilities::json, '[]'::json);
  END IF;
END $$;

-- Online courses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'online_courses') THEN
    ALTER TABLE "online_courses" ALTER COLUMN "schedule" SET DATA TYPE json USING COALESCE(schedule::json, '[]'::json);
    ALTER TABLE "online_courses" ALTER COLUMN "tags" SET DATA TYPE json USING COALESCE(tags::json, '[]'::json);
    ALTER TABLE "online_courses" ALTER COLUMN "requirements" SET DATA TYPE json USING COALESCE(requirements::json, '[]'::json);
    ALTER TABLE "online_courses" ALTER COLUMN "prerequisites" SET DATA TYPE json USING COALESCE(prerequisites::json, '[]'::json);
  END IF;
END $$;

-- Tutoring sessions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tutoring_sessions') THEN
    ALTER TABLE "tutoring_sessions" ALTER COLUMN "completed_lessons" SET DATA TYPE json USING COALESCE(completed_lessons::json, '[]'::json);
  END IF;
END $$;

-- Curriculum plans
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'curriculum_plans') THEN
    ALTER TABLE "curriculum_plans" ALTER COLUMN "assigned_classes" SET DATA TYPE json USING COALESCE(assigned_classes::json, '[]'::json);
    ALTER TABLE "curriculum_plans" ALTER COLUMN "assigned_grades" SET DATA TYPE json USING COALESCE(assigned_grades::json, '[]'::json);
  END IF;
END $$;

-- Report templates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_templates') THEN
    ALTER TABLE "report_templates" ALTER COLUMN "breakdown" SET DATA TYPE json USING COALESCE(breakdown::json, '[]'::json);
    ALTER TABLE "report_templates" ALTER COLUMN "fees" SET DATA TYPE json USING COALESCE(fees::json, '[]'::json);
  END IF;
END $$;

-- Wellness plans
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wellness_plans') THEN
    ALTER TABLE "wellness_plans" ALTER COLUMN "recommendations" SET DATA TYPE json USING COALESCE(recommendations::json, '[]'::json);
  END IF;
END $$;

-- ============================================================================
-- COMPLETE
-- ============================================================================
