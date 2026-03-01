-- ============================================================================
-- COMPREHENSIVE FIX: Convert ALL text-to-json columns at once
-- Run this in Neon SQL Editor ONCE, then npm run db:push should work
-- ============================================================================

-- This will try to convert any text column that should be JSON
-- It will skip columns that are already JSON or don't exist

DO $$
DECLARE
    r RECORD;
    sql_text text;
BEGIN
    -- Loop through all columns that might need JSON conversion
    FOR r IN (
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND data_type IN ('text', 'character varying', 'varchar')
          AND column_name IN (
            'recommendations', 'photo_urls', 'objectives', 'prerequisites',
            'requirements', 'tags', 'schedule', 'content', 'options',
            'answers', 'attachments', 'findings', 'prohibited_items',
            'equipment', 'specifications', 'metadata', 'config',
            'subjects', 'qualifications', 'availability', 'grade_levels',
            'scores', 'strengths', 'weaknesses', 'top_values',
            'skills_gap', 'recommended_preparation', 'recommended_scholarships',
            'gnh_alignment', 'completed_steps', 'interaction_data',
            'growth_data', 'revenue_data', 'activity_data',
            'structured_data', 'required_subjects', 'aggregate_requirements',
            'eligibility_criteria', 'benefits', 'documents_required',
            'specialties', 'layout', 'colors', 'custom_sections',
            'signatures', 'acknowledgements', 'symptoms', 'medications_prescribed',
            'dietary_restrictions', 'short_term_goals', 'long_term_goals',
            'milestones', 'action_steps', 'related_issues',
            'action_items', 'goals', 'notes', 'pattern_detected',
            'behavior_log_ids', 'attendance_data', 'academic_data',
            'working_days', 'terms', 'grades', 'periods',
            'question_data', 'text_answers', 'breakdown', 'fees',
            'rub_programs', 'holland_codes', 'skills',
            'target_audience', 'reminders', 'responses',
            'facilities', 'students', 'assigned_students', 'behavior_tags',
            'strategies', 'progress', 'payment_details', 'phone_numbers',
            'milestone_status', 'reserved_seats', 'discussed_programs',
            'interests', 'college_selections', 'program_selections',
            'line_items', 'applicable_plans', 'custom_fields',
            'old_value', 'new_value', 'changes', 'days', 'stops',
            'pickup_location', 'drop_location', 'bed_details', 'items_brought',
            'available_days', 'cooks', 'weekly_menu', 'participants',
            'read_by', 'target_users', 'tiers', 'tax_slabs',
            'allowances', 'deductions', 'custom_allowances', 'custom_deductions',
            'additional_allowances', 'additional_deductions', 'authors',
            'contributors', 'classes', 'table_of_contents', 'subject_marks',
            'scholarship_documents', 'documents_shared', 'complainant_satisfaction',
            'complainant_feedback', 'room_inspections', 'hostel_complaints',
            'learning_modules', 'school_events', 'notifications',
            'announcements', 'target_class_ids', 'target_user_ids',
            'bus_attendance', 'users', 'schools', 'classes', 'homework',
            'rubric_assessments', 'teacher_logs', 'behavior_logs',
            'intervention_plans', 'fee_payments', 'parent_links',
            'counselor_sessions', 'roadmap_progress', 'subscriptions',
            'ai_interactions', 'hostel_facilities', 'vehicles',
            'student_portfolios', 'hostel_rules', 'academic_years',
            'assessment_responses', 'assessment_templates', 'lesson_plans',
            'homework_assignments', 'career_assessments', 'strength_weaker',
            'value_assessments', 'courses', 'forms', 'ai_assistants',
            'careers', 'analytics_data', 'scholarships', 'programs',
            'counseling_notes', 'wellness_goals', 'wellness_interventions',
            'career_pathways', 'ai_sessions', 'ai_conversations',
            'agreements', 'partnerships', 'tutors', 'intervention_sessions',
            'transport_routes', 'gps_tracking', 'library_books',
            'branding_settings', 'hostel_rooms', 'inspections', 'incidents',
            'lost_and_found', 'mess_menu', 'conversations', 'messages',
            'payroll_rules', 'report_templates', 'wellness_plans',
            'timetable_periods', 'timetable_resources', 'online_courses',
            'tutoring_sessions', 'curriculum_plans', 'school_applications',
            'audit_logs', 'subscription_plans', 'invoices'
          )
        ORDER BY table_name, column_name
    )
    LOOP
        -- Build and execute the ALTER TABLE statement
        sql_text := format('ALTER TABLE "%I" ALTER COLUMN "%I" SET DATA TYPE json USING COALESCE("%I"::json, ''[]''::json)',
            r.table_name, r.column_name, r.column_name);

        BEGIN
            EXECUTE sql_text;
            RAISE NOTICE 'Fixed: %.%', r.table_name, r.column_name;
        EXCEPTION WHEN OTHERS THEN
            -- Skip if already JSON or other error
            RAISE NOTICE 'Skipped %.%: %', r.table_name, r.column_name, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'JSON column conversion completed!';
    RAISE NOTICE 'You can now run: npm run db:push';
    RAISE NOTICE '========================================';
END $$;
