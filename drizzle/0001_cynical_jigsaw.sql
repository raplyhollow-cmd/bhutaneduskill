ALTER TABLE "assessment_results" DROP CONSTRAINT "assessment_results_selected_option_id_assessment_questions_options_fk";
--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "target_class_ids" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "target_user_ids" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "assessment_questions" ALTER COLUMN "question_data" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "assessment_questions" ALTER COLUMN "options" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "bus_attendance" ALTER COLUMN "morning_present" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "bus_attendance" ALTER COLUMN "afternoon_present" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "bus_attendance" ALTER COLUMN "pickup_location" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "bus_attendance" ALTER COLUMN "drop_location" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "career_plans" ALTER COLUMN "short_term_goals" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "career_plans" ALTER COLUMN "long_term_goals" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "career_plans" ALTER COLUMN "subjects" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "career_plans" ALTER COLUMN "milestones" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "careers" ALTER COLUMN "holland_codes" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "careers" ALTER COLUMN "skills" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "careers" ALTER COLUMN "subjects" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "careers" ALTER COLUMN "rub_programs" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rub_colleges" ALTER COLUMN "programs" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "counselor_assignments" ALTER COLUMN "assigned_classes" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "counselor_assignments" ALTER COLUMN "assigned_grades" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "counselor_notes" ALTER COLUMN "tags" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "counselor_notes" ALTER COLUMN "related_issues" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "counselor_notes" ALTER COLUMN "action_items" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "counselor_resources" ALTER COLUMN "content" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "counselor_resources" ALTER COLUMN "tags" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "data_sources" ALTER COLUMN "config" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "disc_results" ALTER COLUMN "scores" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "disc_results" ALTER COLUMN "strengths" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "disc_results" ALTER COLUMN "weaknesses" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "disc_results" ALTER COLUMN "recommended_careers" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "exam_results_enhanced" ALTER COLUMN "subjects" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "fee_structures" ALTER COLUMN "breakdown" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "homework_submissions" ALTER COLUMN "content" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "hostel_facilities" ALTER COLUMN "available_days" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "hostel_facilities" ALTER COLUMN "equipment" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "hostel_facilities" ALTER COLUMN "rules" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "hostel_mess" ALTER COLUMN "weekly_menu" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "hostel_mess" ALTER COLUMN "cooks" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "hostel_rooms" ALTER COLUMN "bed_details" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "specifications" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "photo_urls" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "learning_modules" ALTER COLUMN "content" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "learning_modules" ALTER COLUMN "tags" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "learning_modules" ALTER COLUMN "objectives" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "learning_modules" ALTER COLUMN "prerequisites" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "learning_styles_results" ALTER COLUMN "recommendations" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "leave_requests" ALTER COLUMN "documents" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "mbti_results" ALTER COLUMN "scores" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "mbti_results" ALTER COLUMN "strengths" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "mbti_results" ALTER COLUMN "weaknesses" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "mbti_results" ALTER COLUMN "recommended_careers" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "module_progress" ALTER COLUMN "completed_lessons" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "items" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "purchase_orders" ALTER COLUMN "document_urls" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "riasec_results" ALTER COLUMN "scores" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "riasec_results" ALTER COLUMN "recommended_careers" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "facilities" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rub_applications" ALTER COLUMN "preferences" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rub_applications" ALTER COLUMN "subject_marks" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rub_applications" ALTER COLUMN "documents" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rub_applications" ALTER COLUMN "scholarship_documents" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rub_programs" ALTER COLUMN "reserved_seats" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rub_programs" ALTER COLUMN "required_subjects" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rub_programs" ALTER COLUMN "eligibility_criteria" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rub_programs" ALTER COLUMN "career_prospects" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rub_scholarship_applications" ALTER COLUMN "documents" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rub_scholarship_applications" ALTER COLUMN "disbursement_schedule" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rub_scholarships" ALTER COLUMN "categories" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "rub_scholarships" ALTER COLUMN "required_documents" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "school_events" ALTER COLUMN "target_audience" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "school_events" ALTER COLUMN "reminders" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "school_events" ALTER COLUMN "attachments" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "schools" ALTER COLUMN "facilities" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ALTER COLUMN "document_urls" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "settings" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "timetable_entries" ALTER COLUMN "teacher_name" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "timetable_entries" ALTER COLUMN "room_name" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "transport_incidents" ALTER COLUMN "students_involved" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "transport_routes" ALTER COLUMN "stops" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "tuition_courses" ALTER COLUMN "schedule" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "tuition_courses" ALTER COLUMN "tags" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "tuition_courses" ALTER COLUMN "requirements" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "tutors" ALTER COLUMN "subjects" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "tutors" ALTER COLUMN "qualifications" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "tutors" ALTER COLUMN "availability" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "inventory_vendors" ALTER COLUMN "category_ids" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "wizard_progress" ALTER COLUMN "completed_steps" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "wizard_progress" ALTER COLUMN "data" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "work_values_results" ALTER COLUMN "top_values" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "work_values_results" ALTER COLUMN "recommended_careers" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "author_id" text;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "author_name" text;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "author_role" text;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "attachments" json;--> statement-breakpoint
ALTER TABLE "assessment_submissions" ADD COLUMN "answers" json;--> statement-breakpoint
ALTER TABLE "assessment_submissions" ADD COLUMN "text_answers" json;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assessments" ADD COLUMN "results" json;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "check_in_time" text;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "attendance" ADD COLUMN "entry_method" text;--> statement-breakpoint
ALTER TABLE "career_plans" ADD COLUMN "counselor_id" text;--> statement-breakpoint
ALTER TABLE "career_plans" ADD COLUMN "current_phase" text;--> statement-breakpoint
ALTER TABLE "career_plans" ADD COLUMN "action_steps" json;--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "students" json;--> statement-breakpoint
ALTER TABLE "counselor_notes" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "counselor_notes" ADD COLUMN "is_private" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "exam_results_enhanced" ADD COLUMN "subject_results" json;--> statement-breakpoint
ALTER TABLE "exam_results_enhanced" ADD COLUMN "overall_percentage" integer;--> statement-breakpoint
ALTER TABLE "exam_results_enhanced" ADD COLUMN "total_max_marks" integer;--> statement-breakpoint
ALTER TABLE "exam_results_enhanced" ADD COLUMN "total_marks_obtained" integer;--> statement-breakpoint
ALTER TABLE "exam_results_enhanced" ADD COLUMN "total_percentage" integer;--> statement-breakpoint
ALTER TABLE "exam_results_enhanced" ADD COLUMN "division" text;--> statement-breakpoint
ALTER TABLE "exam_results_enhanced" ADD COLUMN "traits" json;--> statement-breakpoint
ALTER TABLE "exam_results_enhanced" ADD COLUMN "is_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD COLUMN "last_payment_date" text;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD COLUMN "amount_pending" integer;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD COLUMN "fees" json;--> statement-breakpoint
ALTER TABLE "file_storage" ADD COLUMN "access_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "homework" ADD COLUMN "questions" json;--> statement-breakpoint
ALTER TABLE "homework" ADD COLUMN "attachments" json;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "substitute_teacher_id" text;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD COLUMN "leave_handover_notes" text;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD COLUMN "start_time" text;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD COLUMN "scheduled_date" text;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD COLUMN "end_time" text;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD COLUMN "actual_start_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD COLUMN "actual_end_time" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD COLUMN "meeting_password" text;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD COLUMN "platform" text;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD COLUMN "subject" text;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD COLUMN "current_participants" integer;--> statement-breakpoint
ALTER TABLE "module_progress" ADD COLUMN "is_completed" boolean;--> statement-breakpoint
ALTER TABLE "riasec_results" ADD COLUMN "traits" json;--> statement-breakpoint
ALTER TABLE "student_fees" ADD COLUMN "total_amount" integer;--> statement-breakpoint
ALTER TABLE "student_fees" ADD COLUMN "amount_paid" integer;--> statement-breakpoint
ALTER TABLE "student_fees" ADD COLUMN "amount_waived" integer;--> statement-breakpoint
ALTER TABLE "student_fees" ADD COLUMN "entry_method" text;--> statement-breakpoint
ALTER TABLE "student_fees" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "student_fees" ADD COLUMN "last_payment_date" text;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "name_dzongkha" text;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD COLUMN "route_name" text;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD COLUMN "morning_start_time" text;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD COLUMN "afternoon_end_time" text;--> statement-breakpoint
ALTER TABLE "tuition_courses" ADD COLUMN "price" integer;--> statement-breakpoint
ALTER TABLE "tuition_courses" ADD COLUMN "discount_price" integer;--> statement-breakpoint
ALTER TABLE "tuition_courses" ADD COLUMN "current_enrollments" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "tuition_courses" ADD COLUMN "max_enrollments" integer;--> statement-breakpoint
ALTER TABLE "tuition_courses" ADD COLUMN "school_id" text;--> statement-breakpoint
ALTER TABLE "tuition_courses" ADD COLUMN "prerequisites" json;--> statement-breakpoint
ALTER TABLE "tuition_courses" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "tuition_courses" ADD COLUMN "grade_level" integer;--> statement-breakpoint
ALTER TABLE "tuition_enrollments" ADD COLUMN "amount_paid" integer;--> statement-breakpoint
ALTER TABLE "tuition_enrollments" ADD COLUMN "current_enrollments" integer;--> statement-breakpoint
ALTER TABLE "tutor_earnings" ADD COLUMN "net_amount" integer;--> statement-breakpoint
ALTER TABLE "tutor_earnings" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tutors" ADD COLUMN "hourly_rate_online" integer;--> statement-breakpoint
ALTER TABLE "tutors" ADD COLUMN "district" text;--> statement-breakpoint
ALTER TABLE "tutors" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "tutors" ADD COLUMN "grade_levels" json;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "school" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "interests" json;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "goals" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "settings" json;--> statement-breakpoint
ALTER TABLE "vehicle_tracking" ADD COLUMN "assigned_route_id" text;--> statement-breakpoint
ALTER TABLE "vehicle_tracking" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "assigned_route_id" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "vehicle_number" text;--> statement-breakpoint
ALTER TABLE "wizard_progress" ADD COLUMN "completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "career_plans" ADD CONSTRAINT "career_plans_counselor_id_users_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_substitute_teacher_id_users_id_fk" FOREIGN KEY ("substitute_teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;