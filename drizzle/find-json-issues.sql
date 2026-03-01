-- ============================================================================
-- DIAGNOSTIC: Find all columns that need JSON type conversion
-- Run this in Neon SQL Editor to see what needs to be fixed
-- ============================================================================

SELECT
    table_name,
    column_name,
    data_type,
    'needs fix' as status
FROM information_schema.columns
WHERE data_type IN ('text', 'character varying', 'varchar')
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
    'milestones', 'action_steps', 'tags', 'related_issues',
    'action_items', 'goals', 'notes', 'pattern_detected',
    'behavior_log_ids', 'attendance_data', 'academic_data',
    'working_days', 'terms', 'grades', 'periods',
    'question_data', 'options', 'results', 'text_answers',
    'breakdown', 'fees', 'rub_programs', 'holland_codes',
    'skills', 'subjects', 'target_audience', 'reminders',
    'responses', 'facilities', 'students', 'schedule',
    'assigned_students', 'behavior_tags', 'strategies', 'progress',
    'payment_details', 'phone_numbers', 'milestone_status',
    'reserved_seats', 'discussed_programs', 'interests',
    'college_selections', 'program_selections', 'line_items',
    'applicable_plans', 'custom_fields', 'old_value', 'new_value',
    'changes', 'days', 'stops', 'pickup_location', 'drop_location',
    'bed_details', 'items_brought', 'available_days', 'cooks',
    'weekly_menu', 'participants', 'read_by', 'target_users',
    'tiers', 'tax_slabs', 'allowances', 'deductions',
    'custom_allowances', 'custom_deductions', 'additional_allowances',
    'additional_deductions', 'authors', 'contributors', 'classes',
    'table_of_contents', 'subject_marks', 'scholarship_documents',
    'documents_shared', 'complainant_satisfaction', 'complainant_feedback',
    'room_inspections', 'hostel_complaints', 'learning_modules'
  )
ORDER BY table_name, column_name;