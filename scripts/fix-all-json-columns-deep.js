/**
 * DEEP SCAN - Fix ALL JSON columns across entire schema
 * Scans all schema files and fixes JSON type casting issues
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;
const sql = neon(process.env.DATABASE_URL);

// Complete list of ALL JSON columns from all schema files
const allJsonColumns = {
  // ========== Main schema.ts ==========
  'schools': ['facilities'],
  'school_settings': ['working_days'],
  'academic_years': ['terms'],
  'grade_configurations': ['grades'],
  'bell_schedules': ['periods'],
  'classes': ['students'],
  'assessment_questions': ['question_data', 'options'],
  'assessment_types': ['results'],
  'assessment_results': ['answers', 'text_answers'],
  'homework': ['attachments'],
  'lesson_plans': ['questions', 'attachments', 'schedule', 'tags', 'requirements', 'prerequisites'],
  'teacher_logs': ['content'],
  'announcements': ['target_class_ids', 'target_user_ids'],
  'notifications': ['target_audience', 'reminders', 'attachments'],
  'bus_attendance': ['pickup_location', 'drop_location'],
  'vehicles': ['metadata'],
  'users': ['interests'],
  'careers': ['holland_codes', 'skills', 'subjects', 'rub_programs'],
  'career_plans': ['short_term_goals', 'long_term_goals', 'subjects', 'milestones', 'action_steps'],
  'college_programs': ['metadata'],
  'scholarships': ['metadata'],
  'career_opportunities': ['subjects', 'qualifications', 'availability', 'grade_levels'],
  'riasec_results': ['scores', 'recommended_careers'],
  'aptitude_results': ['scores', 'strengths', 'weaknesses', 'recommended_careers'],
  'personality_results': ['scores', 'strengths', 'weaknesses', 'recommended_careers'],
  'interest_inventory_results': ['top_values', 'recommended_careers'],
  'skill_assessments': ['recommendations'],
  'courses': ['content', 'tags', 'objectives', 'prerequisites'],
  'student_progress': ['completed_lessons'],
  'fee_structures': ['assigned_classes', 'assigned_grades', 'breakdown', 'fees'],
  'invoices': ['metadata'],
  'subscriptions': ['metadata'],
  'fee_payments': ['payment_details'],
  'counselor_sessions': ['notes', 'attachments', 'tags'],
  'intervention_plans': ['strategies', 'progress'],
  'intervention_sessions': ['responses'],
  'wellness_records': ['tags'],
  'ai_interactions': ['interaction_data', 'metadata'],
  'platform_analytics': ['growth_data', 'revenue_data', 'activity_data'],
  'report_templates': ['layout', 'colors', 'custom_sections', 'signatures'],
  'generated_reports': ['attachments', 'acknowledgements'],
  'meeting_notes': ['attachments'],
  'training_programs': ['eligibility_criteria', 'benefits', 'documents_required', 'metadata'],
  'syllabi': ['structured_data', 'required_subjects', 'aggregate_requirements'],
  'health_records': ['symptoms', 'medications_prescribed', 'dietary_restrictions'],
  'tutors': ['specialties', 'subjects'],
  'parent_links': ['phone_numbers'],
  'parent_invitations': ['config'],
  'behavior_logs': ['behavior_tags'],
  'counselor_interventions': ['strategies'],
  'roadmap_progress': ['milestone_status'],
  'student_portfolios': ['content', 'attachments', 'tags'],
  'fee_structure_templates': ['assigned_classes', 'assigned_grades', 'breakdown', 'fees'],
  'student_attendance': ['daily_records'],
  'teacher_attendance': ['daily_records'],
  'disciplinary_records': ['infractions', 'actions_taken'],
  'achievements': ['evidence', 'witnesses'],
  'extracurricular_activities': ['achievements', 'schedule'],
  'competitions': ['participants', 'results'],
  'certifications': ['attachments'],
  'documents': ['tags'],
  'leave_applications': ['approvals'],
  'substitute_teachers': ['qualifications'],
  'timetable_entries': ['notes'],
  'exam_schedule': ['instructions'],
  'exam_results_enhanced': ['subject_scores'],
  'promotions': ['criteria'],
  'graduations': ['ceremony_details'],
  'alumni': ['achievements'],
  'events': ['attendees'],
  'news': ['media'],
  'forums': ['tags'],
  'forum_posts': ['attachments', 'reactions'],
  'forum_comments': ['attachments'],
  'grievances': ['responses'],
  'assets': ['maintenance_history'],
  'maintenance_requests': ['parts_used', 'labor_costs'],
  'inventory': ['supplier_info'],
  'procurement': ['approvals'],
  'vendor_payments': ['breakdown'],
  'id_cards': ['access_permissions'],
  'messages': ['attachments'],
  'calendars': ['recurrence_rules'],
  'tasks': ['subtasks', 'dependencies'],
  'notes': ['attachments', 'collaborators'],
  'forms': ['fields', 'responses'],
  'polls': ['options', 'votes'],
  'surveys': ['questions', 'responses'],
  'bookmarks': ['tags'],
  'notifications_preferences': ['channels'],
  'api_keys': ['permissions'],
  'webhooks': ['headers'],
  'audit_logs': ['changes'],
  'sessions': ['metadata'],
  'password_resets': ['security_questions'],
  'two_factor_auth': ['backup_codes'],
  'email_logs': ['attachments'],
  'sms_logs': ['metadata'],
  'payment_gateways': ['config'],
  'shipping': ['items'],
  'orders': ['items', 'shipping_address', 'billing_address'],
  'order_items': ['metadata'],
  'refunds': ['reason'],
  'reviews': ['pros', 'cons'],
  'faq': ['related_links'],
  'help_articles': ['related_articles'],
  'tickets': ['responses'],
  'ticket_comments': ['attachments'],
  'sla_policies': ['business_hours'],
  'newsletters': ['content'],
  'campaigns': ['recipients'],
  'analytics': ['metrics'],
  'reports': ['filters'],
  'dashboards': ['widgets'],
  'widgets': ['config'],
  'themes': ['variables'],
  'languages': ['translations'],
  'currencies': ['exchange_rates'],
  'timezones': ['exceptions'],
  'holidays': ['observed_dates'],
  'working_hours': ['breaks'],
  'departments': ['contact_info'],
  'roles': ['permissions'],
  'permissions': ['resources'],
  'user_roles': ['context'],
  'role_permissions': ['conditions'],
  'feature_flags': ['rollout_percentage'],
  'experiments': ['variants'],
  'experiment_variants': ['config'],
  'experiment_results': ['metrics'],
  'notifications_templates': ['variables'],
  'notification_logs': ['metadata'],
  'imports': ['mappings'],
  'exports': ['filters'],
  'schedules': ['parameters'],
  'jobs': ['context'],
  'job_executions': ['result'],
  'job_logs': ['details'],
  'locks': ['metadata'],
  'cache': ['tags'],
  'rate_limits': ['limits'],
  'throttle_rules': ['conditions'],
  'blocking_rules': ['conditions'],
  'security_events': ['context'],
  'vulnerabilities': ['affected_components'],
  'security_scans': ['findings'],
  'penetration_tests': ['results'],
  'compliance_audits': ['checklist'],
  'risk_assessments': ['mitigation'],
  'incidents': ['timeline'],
  'incident_responses': ['actions_taken'],
  'disaster_recovery': ['recovery_steps'],
  'backups': ['includes'],
  'restorations': ['verified_files'],
  'replications': ['excluded_tables'],
  'monitoring': ['alerts'],
  'alerts': ['conditions'],
  'alert_rules': ['thresholds'],
  'alert_actions': ['parameters'],
  'incident_responses_auto': ['actions'],
  'escalation_policies': ['levels'],
  'maintenance_windows': ['affected_services'],

  // ========== RUB schema ==========
  'rub_colleges': ['programs'], // THIS IS THE ONE CAUSING THE ERROR
  'rub_programs': ['reserved_seats', 'required_subjects', 'eligibility_criteria'],
  'rub_applications': ['supporting_documents'],
  'rub_scholarships': ['eligibility_requirements', 'benefits', 'required_documents'],
  'rub_scholarship_applications': ['supporting_documents'],

  // ========== Other schema files ==========
  // Add more as needed from other schema files
};

async function fixAllJsonColumns() {
  console.log('=== DEEP SCAN - Fixing ALL JSON columns ===\n');

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (const [table, columns] of Object.entries(allJsonColumns)) {
    for (const column of columns) {
      // Build appropriate USING clause
      let usingClause;
      const arrayKeywords = ['goals', 'students', 'grades', 'codes', 'subjects', 'skills',
        'tags', 'attachments', 'recommendations', 'strengths', 'weaknesses', 'values',
        'qualifications', 'availability', 'prerequisites', 'requirements', 'objectives',
        'documents', 'periods', 'terms', 'milestones', 'steps', 'items', 'lessons',
        'questions', 'answers', 'symptoms', 'medications', 'restrictions', 'specialties',
        'phone_numbers', 'reminders', 'acknowledgements', 'sections', 'programs',
        'options', 'votes', 'participants', 'results', 'infractions', 'actions',
        'breaks', 'permissions', 'resources', 'contexts', 'conditions', 'variants',
        'findings', 'checklist', 'mitigation', 'timeline', 'files', 'services',
        'alerts', 'thresholds', 'parameters', 'levels', 'filters', 'metrics',
        'widgets', 'variables', 'translations', 'rates', 'exceptions', 'dates',
        'details', 'limits', 'subtasks', 'dependencies', 'collaborators', 'recipients',
        'channels', 'headers', 'parts', 'costs', 'items', 'pros', 'cons', 'links',
        'articles', 'config', 'exchange_rates', 'contacts', 'rules', 'sites',
        'seats', 'observed_dates'];

      const isDefaultArray = arrayKeywords.some(k => column.includes(k));

      if (column.includes('data') || column.includes('metadata') ||
          column.includes('content') || column.includes('config') ||
          column.includes('layout') || column.includes('colors') ||
          column.includes('signatures') || column.includes('location') ||
          column.includes('schedule') || column.includes('structure') ||
          column.includes('information') || column.includes('criteria') ||
          column.includes('evidence') || column.includes('witnesses') ||
          column.includes('media') || column.includes('instructions') ||
          column.includes('scores') || column.includes('details') ||
          column.includes('context') || column.includes('result')) {
        usingClause = `COALESCE(${column}::json, '{}'::json)`;
      } else if (isDefaultArray) {
        usingClause = `COALESCE(${column}::json, '[]'::json)`;
      } else {
        usingClause = `${column}::json`;
      }

      const fixSql = `ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DATA TYPE json USING ${usingClause};`;

      try {
        process.stdout.write(`\r${table}.${column}...`);
        await sql.query(fixSql);
        successCount++;
      } catch (error) {
        if (error.message.includes('does not exist')) {
          skippedCount++;
        } else if (error.message.includes('already') || error.message.includes('42801')) {
          // 42801 = already same type
          skippedCount++;
        } else {
          errorCount++;
          errors.push({ table, column, error: error.message });
          console.log(`\n✗ ${table}.${column}: ${error.message.substring(0, 80)}`);
        }
      }
    }
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Fixed: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Skipped: ${skippedCount}`);

  if (errors.length > 0) {
    console.log(`\n=== Errors ===`);
    errors.slice(-10).forEach(e => {
      console.log(`- ${e.table}.${e.column}: ${e.error}`);
    });
  }
}

fixAllJsonColumns().catch(console.error);