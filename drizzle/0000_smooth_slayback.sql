CREATE TABLE "academic_terms" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"name" text NOT NULL,
	"academic_year" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"is_current" boolean DEFAULT false,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"date_earned" text NOT NULL,
	"level" text NOT NULL,
	"certificate_url" text NOT NULL,
	"issuer" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_reads" (
	"id" text PRIMARY KEY NOT NULL,
	"announcement_id" text NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"class_id" text,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"excerpt" text NOT NULL,
	"priority" text NOT NULL,
	"target_audience" text NOT NULL,
	"target_grade_level" text NOT NULL,
	"target_class_ids" text,
	"target_user_ids" text,
	"category" text NOT NULL,
	"publish_date" text NOT NULL,
	"expiry_date" text NOT NULL,
	"is_pinned" boolean DEFAULT false,
	"is_published" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"is_archived" boolean DEFAULT false,
	"published_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"assessment_type_id" text,
	"question_text" text NOT NULL,
	"question_data" text,
	"options" text,
	"correct_answer" text NOT NULL,
	"points" integer NOT NULL,
	"order" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_results" (
	"id" text PRIMARY KEY NOT NULL,
	"assessment_id" text,
	"student_id" text,
	"question_id" text,
	"selected_option_id" text,
	"selected_option_text" text NOT NULL,
	"answer" text NOT NULL,
	"score" integer NOT NULL,
	"points" integer NOT NULL,
	"is_passed" boolean DEFAULT true,
	"completed_at" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"time_spent" integer NOT NULL,
	"feedback" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"assessment_id" text,
	"user_id" text,
	"assigned_by" text,
	"status" text NOT NULL,
	"score" integer,
	"feedback" text,
	"submitted_at" timestamp with time zone,
	"graded_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"duration" integer NOT NULL,
	"passing_score" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"category" text,
	"target_audience" text,
	"target_grade" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text,
	"assessment_type_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"due_date" text NOT NULL,
	"total_points" integer NOT NULL,
	"passing_score" integer NOT NULL,
	"user_id" text,
	"status" text,
	"type" text,
	"completed_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text,
	"class_id" text,
	"school_id" text,
	"date" text NOT NULL,
	"status" text NOT NULL,
	"recorded_by" text,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text,
	"date" text NOT NULL,
	"status" text NOT NULL,
	"notes" text NOT NULL,
	"recorded_by" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "books" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"isbn" text NOT NULL,
	"publication_year" integer NOT NULL,
	"category" text NOT NULL,
	"cover_image" text NOT NULL,
	"description" text NOT NULL,
	"total_pages" integer NOT NULL,
	"publisher" text NOT NULL,
	"language" text NOT NULL,
	"status" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bus_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"route_id" text NOT NULL,
	"vehicle_id" text,
	"date" text NOT NULL,
	"trip_type" text NOT NULL,
	"morning_present" integer,
	"afternoon_present" integer,
	"pickup_time" text,
	"drop_time" text,
	"pickup_location" text,
	"drop_location" text,
	"marked_by" text,
	"absence_reason" text,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_matches" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text,
	"career_id" text NOT NULL,
	"career_title" text NOT NULL,
	"match_score" integer NOT NULL,
	"match_reason" text NOT NULL,
	"recommendation_text" text,
	"is_top_match" boolean DEFAULT false,
	"assessment_type" text NOT NULL,
	"assessment_id" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "career_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text,
	"user_id" text,
	"target_career" text NOT NULL,
	"target_career_id" text NOT NULL,
	"short_term_goals" text,
	"long_term_goals" text,
	"subjects" text,
	"milestones" text,
	"notes" text,
	"counselor_notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "career_plans_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "careers" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"industry" text NOT NULL,
	"riasec_code" text,
	"holland_codes" text,
	"education_level" text NOT NULL,
	"typical_salary" text,
	"salary_currency" text DEFAULT 'BTN',
	"growth_outlook" text,
	"skills" text,
	"subjects" text,
	"work_environment" text NOT NULL,
	"bhutan_specific" boolean DEFAULT false,
	"bhutan_demand" text,
	"rub_programs" text,
	"is_active" boolean DEFAULT true,
	"view_count" integer DEFAULT 0,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "careers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "circulation" (
	"id" text PRIMARY KEY NOT NULL,
	"book_id" text,
	"student_id" text,
	"borrower_id" text,
	"borrow_date" text NOT NULL,
	"due_date" text NOT NULL,
	"return_date" text,
	"status" text NOT NULL,
	"fine" integer DEFAULT 0,
	"fine_paid" boolean DEFAULT false,
	"renewals" integer DEFAULT 0,
	"max_renewals" integer NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text,
	"subject_id" text,
	"teacher_id" text,
	"periods_per_week" integer NOT NULL,
	"is_core_subject" boolean DEFAULT true,
	"room_id" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"name" text NOT NULL,
	"grade" integer NOT NULL,
	"section" text NOT NULL,
	"room_number" text NOT NULL,
	"capacity" integer NOT NULL,
	"homeroom_teacher_id" text,
	"homeroom_teacher_name" text NOT NULL,
	"class_teacher_id" text,
	"class_teacher_name" text NOT NULL,
	"teacher_id" text,
	"academic_year" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rub_colleges" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"dzongkhag" text NOT NULL,
	"location" text NOT NULL,
	"latitude" text,
	"longitude" text,
	"website" text,
	"email" text,
	"phone" text,
	"programs" text,
	"has_hostel" boolean DEFAULT false,
	"has_library" boolean DEFAULT true,
	"has_lab" boolean DEFAULT false,
	"has_sports" boolean DEFAULT false,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rub_colleges_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "consent_records" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text,
	"user_id" text,
	"parent_id" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text NOT NULL,
	"consent_given" boolean DEFAULT false,
	"consent_date" timestamp with time zone,
	"ip_address" text,
	"document_url" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counselor_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"counselor_id" text,
	"school_id" text,
	"assigned_classes" text,
	"assigned_grades" text,
	"academic_year" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counselor_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"counselor_id" text,
	"student_id" text,
	"note_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_confidential" boolean DEFAULT false,
	"tags" text,
	"related_issues" text,
	"action_items" text,
	"follow_up_date" text,
	"session_date" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counselor_resources" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"url" text NOT NULL,
	"content" text,
	"tags" text,
	"target_audience" text NOT NULL,
	"is_public" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"view_count" integer DEFAULT 0,
	"download_count" integer DEFAULT 0,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"endpoint" text NOT NULL,
	"auth_method" text,
	"config" text,
	"last_sync_at" timestamp with time zone,
	"status" text NOT NULL,
	"error_message" text,
	"sync_frequency" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disc_results" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"dominant_style" text NOT NULL,
	"scores" text NOT NULL,
	"description" text NOT NULL,
	"strengths" text NOT NULL,
	"weaknesses" text NOT NULL,
	"recommended_careers" text NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"dzongkhag" text NOT NULL,
	"country" text DEFAULT 'Bhutan' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "districts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "drivers" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"phone" text NOT NULL,
	"emergency_contact" text,
	"address" text,
	"license_number" text NOT NULL,
	"license_type" text,
	"licence_expiry" text,
	"badge_number" text,
	"employee_id" text,
	"date_of_joining" text,
	"status" text DEFAULT 'active' NOT NULL,
	"background_check_verified" boolean DEFAULT false,
	"background_check_date" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text,
	"class_id" text,
	"academic_year" text NOT NULL,
	"enrollment_date" text NOT NULL,
	"status" text NOT NULL,
	"roll_number" text,
	"section" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_results_enhanced" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text,
	"user_id" text,
	"exam_name" text NOT NULL,
	"exam_type" text NOT NULL,
	"academic_year" text NOT NULL,
	"term" text NOT NULL,
	"exam_date" text NOT NULL,
	"exam_year" integer,
	"subjects" text,
	"total_marks" integer NOT NULL,
	"max_total_marks" integer NOT NULL,
	"percentage" integer NOT NULL,
	"grade" text NOT NULL,
	"rank" integer,
	"class_rank" integer,
	"remarks" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"student_fee_id" text,
	"amount" integer NOT NULL,
	"paid_date" text NOT NULL,
	"method" text NOT NULL,
	"transaction_id" text NOT NULL,
	"receipt_number" text NOT NULL,
	"status" text NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"due_date" text NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"school_id" text,
	"collected_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fee_structures" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"academic_year" text NOT NULL,
	"grade" integer NOT NULL,
	"total_fees" integer NOT NULL,
	"breakdown" text,
	"is_recurring" boolean DEFAULT false,
	"currency" text DEFAULT 'BTN' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "file_storage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"path" text NOT NULL,
	"url" text NOT NULL,
	"category" text NOT NULL,
	"is_public" boolean DEFAULT false,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homework" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text,
	"subject_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"due_date" text NOT NULL,
	"assigned_date" text NOT NULL,
	"total_points" integer NOT NULL,
	"passing_score" integer NOT NULL,
	"is_published" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "homework_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"homework_id" text,
	"student_id" text,
	"submitted_at" timestamp with time zone NOT NULL,
	"content" text,
	"graded_at" timestamp with time zone NOT NULL,
	"score" integer NOT NULL,
	"feedback" text NOT NULL,
	"status" text NOT NULL,
	"is_late" boolean DEFAULT false,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostel_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"student_name" text,
	"hostel_id" text NOT NULL,
	"room_id" text NOT NULL,
	"bed_number" text,
	"allocation_date" text NOT NULL,
	"academic_year" text NOT NULL,
	"semester" text,
	"status" text DEFAULT 'active' NOT NULL,
	"checkout_date" text,
	"checkout_reason" text,
	"checkout_processed_by" text,
	"fee_type" text,
	"fee_amount" integer,
	"fee_paid" integer DEFAULT 0,
	"fee_waived" integer DEFAULT 0,
	"fee_outstanding" integer,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relation" text,
	"local_guardian_name" text,
	"local_guardian_phone" text,
	"local_guardian_address" text,
	"blood_group" text,
	"medical_conditions" text,
	"allergies" text,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostel_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"room_id" text,
	"hostel_id" text,
	"date" text NOT NULL,
	"status" text NOT NULL,
	"check_in_time" text,
	"check_out_time" text,
	"leave_type" text,
	"leave_reason" text,
	"leave_approved_by" text,
	"gate_pass_number" text,
	"gate_pass_issued_by" text,
	"gate_pass_issued_at" text,
	"expected_return_date" text,
	"actual_return_date" text,
	"return_late_by" integer,
	"remarks" text,
	"marked_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostel_buildings" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"type" text NOT NULL,
	"description" text,
	"address" text,
	"building_number" text,
	"total_floors" integer,
	"total_rooms" integer,
	"total_capacity" integer,
	"has_common_room" boolean DEFAULT false,
	"has_study_room" boolean DEFAULT false,
	"has_tv_room" boolean DEFAULT false,
	"has_kitchen" boolean DEFAULT false,
	"has_laundry" boolean DEFAULT false,
	"has_gym" boolean DEFAULT false,
	"has_prayer_room" boolean DEFAULT false,
	"has_hot_water" boolean DEFAULT false,
	"has_ac" boolean DEFAULT false,
	"has_heating" boolean DEFAULT false,
	"has_wifi" boolean DEFAULT false,
	"has_fire_extinguisher" boolean DEFAULT false,
	"has_fire_alarm" boolean DEFAULT false,
	"has_cctv" boolean DEFAULT false,
	"has_security_guard" boolean DEFAULT false,
	"warden_id" text,
	"warden_contact" text,
	"warden_residence" text,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "hostel_buildings_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "hostel_facilities" (
	"id" text PRIMARY KEY NOT NULL,
	"hostel_id" text NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"floor" integer,
	"room_number" text,
	"capacity" integer,
	"open_time" text,
	"close_time" text,
	"available_days" json,
	"equipment" json,
	"status" text DEFAULT 'active' NOT NULL,
	"rules" json,
	"in_charge_staff_id" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostel_leave_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"student_name" text,
	"room_id" text,
	"hostel_id" text,
	"leave_type" text NOT NULL,
	"leave_reason" text NOT NULL,
	"from_date" text NOT NULL,
	"from_time" text,
	"to_date" text NOT NULL,
	"to_time" text,
	"number_of_days" integer,
	"destination" text,
	"purpose" text,
	"companion_name" text,
	"companion_relation" text,
	"companion_phone" text,
	"parent_approved" boolean DEFAULT false,
	"parent_approval_date" text,
	"parent_name" text,
	"parent_phone" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" text,
	"approval_date" text,
	"approval_notes" text,
	"rejection_reason" text,
	"gate_pass_issued" boolean DEFAULT false,
	"gate_pass_number" text,
	"actual_departure_time" text,
	"actual_return_time" text,
	"late_return_reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostel_mess" (
	"id" text PRIMARY KEY NOT NULL,
	"hostel_id" text NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"seating_capacity" integer,
	"breakfast_start" text,
	"breakfast_end" text,
	"lunch_start" text,
	"lunch_end" text,
	"dinner_start" text,
	"dinner_end" text,
	"weekly_menu" json,
	"mess_manager" text,
	"cooks" json,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hostel_rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"hostel_id" text NOT NULL,
	"school_id" text NOT NULL,
	"room_number" text NOT NULL,
	"floor" integer NOT NULL,
	"room_type" text NOT NULL,
	"capacity" integer NOT NULL,
	"occupied_beds" integer DEFAULT 0,
	"has_attached_bathroom" boolean DEFAULT false,
	"has_balcony" boolean DEFAULT false,
	"has_ac" boolean DEFAULT false,
	"has_study_table" boolean DEFAULT true,
	"has_wardrobe" boolean DEFAULT true,
	"area" integer,
	"bed_details" json,
	"condition" text DEFAULT 'good' NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"maintenance_reason" text,
	"last_maintenance_date" text,
	"next_maintenance_date" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"description" text,
	"parent_id" text,
	"level" integer DEFAULT 0,
	"depreciation_rate" integer,
	"useful_life_years" integer,
	"alert_threshold" integer,
	"is_active" boolean DEFAULT true,
	"display_order" integer,
	"icon" text,
	"color" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "inventory_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sku" text,
	"barcode" text,
	"qr_code" text,
	"category_id" text NOT NULL,
	"item_type" text NOT NULL,
	"is_fixed_asset" boolean DEFAULT false,
	"asset_tag" text,
	"serial_number" text,
	"purchase_date" text,
	"purchase_price" integer,
	"current_value" integer,
	"depreciation" integer,
	"manufacturer" text,
	"model" text,
	"year" integer,
	"specifications" text,
	"location" text,
	"building_id" text,
	"room_id" text,
	"shelf" text,
	"rack" text,
	"bin" text,
	"quantity" integer DEFAULT 0 NOT NULL,
	"minimum_stock" integer,
	"maximum_stock" integer,
	"reorder_level" integer,
	"reorder_quantity" integer,
	"unit" text NOT NULL,
	"condition" text DEFAULT 'new' NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"assigned_to" text,
	"assigned_date" text,
	"assigned_until" text,
	"last_maintenance_date" text,
	"next_maintenance_date" text,
	"warranty_expiry" text,
	"photo_urls" json,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "inventory_items_sku_unique" UNIQUE("sku"),
	CONSTRAINT "inventory_items_barcode_unique" UNIQUE("barcode"),
	CONSTRAINT "inventory_items_asset_tag_unique" UNIQUE("asset_tag")
);
--> statement-breakpoint
CREATE TABLE "learning_modules" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"subject_id" text,
	"class_id" text,
	"teacher_id" text,
	"category" text NOT NULL,
	"level" text NOT NULL,
	"duration" integer NOT NULL,
	"content" text,
	"thumbnail" text NOT NULL,
	"is_public" boolean DEFAULT false,
	"is_premium" boolean DEFAULT false,
	"is_published" boolean DEFAULT false,
	"price" integer DEFAULT 0,
	"tags" text,
	"objectives" text,
	"prerequisites" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_styles_results" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"visual_score" integer NOT NULL,
	"auditory_score" integer NOT NULL,
	"kinesthetic_score" integer NOT NULL,
	"dominant_style" text NOT NULL,
	"recommendations" text NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text,
	"school_id" text,
	"applicant_id" text,
	"applicant_type" text,
	"type" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"reason" text NOT NULL,
	"status" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"rejection_reason" text,
	"documents" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text,
	"tutor_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"scheduled_start" text NOT NULL,
	"scheduled_end" text NOT NULL,
	"actual_start" timestamp with time zone,
	"actual_end" timestamp with time zone,
	"meeting_link" text,
	"meeting_id" text,
	"recording_url" text,
	"status" text NOT NULL,
	"participants" integer DEFAULT 0,
	"maxparticipants" integer,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mbti_results" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"personality_type" text NOT NULL,
	"scores" text NOT NULL,
	"description" text NOT NULL,
	"strengths" text NOT NULL,
	"weaknesses" text NOT NULL,
	"recommended_careers" text NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "module_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text,
	"module_id" text,
	"status" text NOT NULL,
	"progress" integer NOT NULL,
	"completed_lessons" text,
	"current_lesson" text,
	"time_spent" integer NOT NULL,
	"last_accessed_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"certificate_url" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"partnership_date" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"workshops_conducted" integer DEFAULT 0,
	"students_placed" integer DEFAULT 0,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"order_number" text NOT NULL,
	"order_date" text NOT NULL,
	"expected_delivery_date" text,
	"actual_delivery_date" text,
	"vendor_id" text NOT NULL,
	"vendor_name" text,
	"vendor_address" text,
	"vendor_contact" text,
	"vendor_phone" text,
	"vendor_email" text,
	"items" text,
	"subtotal" integer NOT NULL,
	"tax_amount" integer DEFAULT 0,
	"discount_amount" integer DEFAULT 0,
	"shipping_cost" integer DEFAULT 0,
	"other_charges" integer DEFAULT 0,
	"total_amount" integer NOT NULL,
	"payment_terms" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"payment_due_date" text,
	"amount_paid" integer DEFAULT 0,
	"delivery_address" text,
	"delivery_instructions" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"approved_by" text,
	"approved_date" text,
	"approval_notes" text,
	"notes" text,
	"terms_and_conditions" text,
	"document_urls" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "purchase_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "riasec_results" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"scores" text NOT NULL,
	"primary_holland_code" text NOT NULL,
	"secondary_holland_code" text NOT NULL,
	"holland_code" text,
	"recommended_careers" text NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"name" text NOT NULL,
	"room_number" text NOT NULL,
	"type" text NOT NULL,
	"capacity" integer NOT NULL,
	"floor" integer NOT NULL,
	"building" text NOT NULL,
	"has_projector" boolean DEFAULT false,
	"has_computers" boolean DEFAULT false,
	"has_smart_board" boolean DEFAULT false,
	"has_whiteboard" boolean DEFAULT false,
	"has_ac" boolean DEFAULT false,
	"facilities" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rub_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"application_number" text,
	"application_year" integer NOT NULL,
	"academic_year" text NOT NULL,
	"preferences" text,
	"student_name" text NOT NULL,
	"cid_number" text NOT NULL,
	"date_of_birth" text NOT NULL,
	"gender" text NOT NULL,
	"blood_group" text,
	"photo" text,
	"phone" text NOT NULL,
	"email" text,
	"present_address" text,
	"permanent_address" text,
	"dzongkhag" text,
	"gewog" text,
	"village" text,
	"father_name" text,
	"father_occupation" text,
	"father_phone" text,
	"father_cid" text,
	"mother_name" text,
	"mother_occupation" text,
	"mother_phone" text,
	"mother_cid" text,
	"guardian_name" text,
	"guardian_phone" text,
	"guardian_cid" text,
	"exam_type" text NOT NULL,
	"exam_year" integer NOT NULL,
	"index_number" text,
	"school_attended" text NOT NULL,
	"percentage" integer,
	"division" text,
	"subject_marks" text,
	"documents" text,
	"category" text,
	"has_disability" boolean DEFAULT false,
	"disability_type" text,
	"disability_certificate" text,
	"scholarship_applied" boolean DEFAULT false,
	"scholarship_type" text,
	"scholarship_documents" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"submitted_date" text,
	"last_modified_date" text,
	"admitted_college_id" text,
	"admitted_program_id" text,
	"admitted_college_name" text,
	"admitted_program_name" text,
	"admission_date" text,
	"admission_deadline" text,
	"merit_rank" integer,
	"verified_by" text,
	"verified_date" text,
	"verification_notes" text,
	"interview_scheduled" boolean DEFAULT false,
	"interview_date" text,
	"interview_time" text,
	"interview_venue" text,
	"interview_result" text,
	"interview_score" integer,
	"interview_notes" text,
	"rejection_reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rub_applications_application_number_unique" UNIQUE("application_number")
);
--> statement-breakpoint
CREATE TABLE "rub_programs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"college_id" text NOT NULL,
	"level" text NOT NULL,
	"field" text NOT NULL,
	"discipline" text,
	"duration" integer NOT NULL,
	"duration_type" text NOT NULL,
	"total_seats" integer,
	"reserved_seats" text,
	"min_percentage" integer,
	"required_subjects" text,
	"eligibility_criteria" text,
	"tuition_fee" integer,
	"hostel_fee" integer,
	"other_fees" integer,
	"total_fee" integer,
	"description" text,
	"career_prospects" text,
	"is_active" boolean DEFAULT true,
	"admission_open" boolean DEFAULT false,
	"academic_year" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rub_programs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "rub_scholarship_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text NOT NULL,
	"scholarship_id" text NOT NULL,
	"rub_application_id" text,
	"application_number" text,
	"application_year" integer NOT NULL,
	"academic_year" text NOT NULL,
	"student_name" text NOT NULL,
	"cid_number" text NOT NULL,
	"annual_family_income" integer,
	"family_members" integer,
	"earning_members" integer,
	"property_details" text,
	"financial_hardship" text,
	"documents" text,
	"school_recommendation" text,
	"recommended_by" text,
	"recommendation_date" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"submitted_date" text,
	"approved_date" text,
	"approved_amount" integer,
	"disbursement_schedule" text,
	"rejection_reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rub_scholarship_applications_application_number_unique" UNIQUE("application_number")
);
--> statement-breakpoint
CREATE TABLE "rub_scholarships" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_name" text,
	"covers_tuition" boolean DEFAULT false,
	"covers_hostel" boolean DEFAULT false,
	"covers_books" boolean DEFAULT false,
	"covers_living" boolean DEFAULT false,
	"coverage_percentage" integer,
	"min_percentage" integer,
	"annual_income_limit" integer,
	"categories" text,
	"duration" text,
	"application_open_date" text,
	"application_close_date" text,
	"required_documents" text,
	"description" text,
	"terms_and_conditions" text,
	"is_active" boolean DEFAULT true,
	"academic_year" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rub_scholarships_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "school_events" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"event_type" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"location" text NOT NULL,
	"is_all_day" boolean DEFAULT false,
	"target_audience" text,
	"is_recurring" boolean DEFAULT false,
	"recurrence_pattern" text,
	"status" text NOT NULL,
	"reminders" text,
	"attachments" text,
	"created_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"country" text NOT NULL,
	"postal_code" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"website" text NOT NULL,
	"logo" text NOT NULL,
	"established_year" integer NOT NULL,
	"accreditation_status" text NOT NULL,
	"max_students" integer NOT NULL,
	"campus_size" text NOT NULL,
	"facilities" text,
	"board" text NOT NULL,
	"principal_name" text NOT NULL,
	"principal_email" text NOT NULL,
	"principal_phone" text NOT NULL,
	"counselor_name" text NOT NULL,
	"counselor_email" text NOT NULL,
	"counselor_phone" text NOT NULL,
	"vice_principal_name" text NOT NULL,
	"school_type" text,
	"level" text,
	"contact_email" text,
	"contact_phone" text,
	"tenant_id" text,
	"district_id" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "schools_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"item_id" text NOT NULL,
	"transaction_type" text NOT NULL,
	"transaction_date" text NOT NULL,
	"quantity" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"unit_price" integer,
	"total_value" integer,
	"reference_number" text,
	"reference_type" text,
	"source_location" text,
	"destination_location" text,
	"performed_by" text,
	"authorized_by" text,
	"reason" text,
	"document_urls" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_fees" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text,
	"fee_type" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"frequency" text NOT NULL,
	"due_date" text NOT NULL,
	"year" integer NOT NULL,
	"status" text NOT NULL,
	"is_recurring" boolean DEFAULT false,
	"description" text NOT NULL,
	"school_id" text,
	"amount_pending" integer,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"grade" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "subjects_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "teacher_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"teacher_id" text,
	"class_id" text,
	"subject_id" text,
	"academic_year" text NOT NULL,
	"role" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"domain" text NOT NULL,
	"logo" text NOT NULL,
	"primary_color" text NOT NULL,
	"secondary_color" text NOT NULL,
	"settings" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tenants_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "time_periods" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"duration" integer NOT NULL,
	"order" integer NOT NULL,
	"is_break" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timetable_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"class_id" text,
	"subject_id" text,
	"teacher_id" text,
	"teacher_name" text NOT NULL,
	"room_id" text,
	"room_name" text NOT NULL,
	"period_id" text,
	"period_name" text NOT NULL,
	"day_of_week" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"is_double_period" boolean DEFAULT false,
	"notes" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text,
	"route_id" text,
	"vehicle_id" text,
	"school_id" text,
	"stop_name" text NOT NULL,
	"pickup_time" text NOT NULL,
	"drop_time" text NOT NULL,
	"academic_year" text NOT NULL,
	"fee" integer NOT NULL,
	"is_paid" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "transport_allocations_student_id_unique" UNIQUE("student_id")
);
--> statement-breakpoint
CREATE TABLE "transport_incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"type" text NOT NULL,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"incident_date" text NOT NULL,
	"incident_time" text,
	"location" text,
	"vehicle_id" text,
	"driver_id" text,
	"students_involved" text,
	"action_taken" text,
	"reported_to" text,
	"report_reference" text,
	"status" text DEFAULT 'open' NOT NULL,
	"reported_by" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_routes" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"name" text NOT NULL,
	"route_number" text NOT NULL,
	"start_location" text NOT NULL,
	"end_location" text NOT NULL,
	"stops" text NOT NULL,
	"distance" integer NOT NULL,
	"estimated_time" integer NOT NULL,
	"fee" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "transport_routes_route_number_unique" UNIQUE("route_number")
);
--> statement-breakpoint
CREATE TABLE "tuition_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tuition_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"tutor_id" text,
	"subject_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"level" text NOT NULL,
	"grade" integer NOT NULL,
	"duration" integer NOT NULL,
	"price_per_session" integer NOT NULL,
	"currency" text DEFAULT 'BTN' NOT NULL,
	"max_students" integer NOT NULL,
	"current_students" integer DEFAULT 0,
	"schedule" text,
	"mode" text NOT NULL,
	"location" text,
	"meeting_link" text,
	"thumbnail" text NOT NULL,
	"tags" text,
	"requirements" text,
	"status" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tuition_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text,
	"student_id" text,
	"tutor_id" text,
	"status" text NOT NULL,
	"enrollment_date" text NOT NULL,
	"enrolled_at" timestamp with time zone,
	"completion_date" text,
	"completed_at" timestamp with time zone,
	"sessions_completed" integer DEFAULT 0,
	"total_paid" integer DEFAULT 0,
	"tutor_earnings" integer,
	"notes" text,
	"rating" integer,
	"review" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutor_earnings" (
	"id" text PRIMARY KEY NOT NULL,
	"tutor_id" text,
	"enrollment_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'BTN' NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"payout_status" text,
	"session_date" text NOT NULL,
	"earned_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutor_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"tutor_id" text,
	"student_id" text,
	"enrollment_id" text,
	"rating" integer NOT NULL,
	"review" text NOT NULL,
	"response" text,
	"is_verified" boolean DEFAULT false,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutors" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"bio" text NOT NULL,
	"subjects" text NOT NULL,
	"qualifications" text NOT NULL,
	"experience" integer NOT NULL,
	"hourly_rate" integer NOT NULL,
	"currency" text DEFAULT 'BTN' NOT NULL,
	"availability" text,
	"teaching_mode" text NOT NULL,
	"location" text,
	"average_rating" integer,
	"total_reviews" integer DEFAULT 0,
	"total_students" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"verification_document" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "tutors_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"student_id" text,
	"type" text NOT NULL,
	"metric_name" text NOT NULL,
	"metric_value" text NOT NULL,
	"target_value" text NOT NULL,
	"date" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"type" text NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"school_id" text,
	"profile_image" text NOT NULL,
	"date_of_birth" text NOT NULL,
	"gender" text NOT NULL,
	"grade" integer NOT NULL,
	"section" text NOT NULL,
	"roll_number" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"parent_contact" text NOT NULL,
	"parent_phone" text NOT NULL,
	"emergency_contact" text NOT NULL,
	"blood_group" text NOT NULL,
	"enrollment_date" text NOT NULL,
	"last_login" text NOT NULL,
	"employee_id" text,
	"subjects" text,
	"tenant_id" text,
	"email_verified" boolean DEFAULT false,
	"onboarding_complete" boolean DEFAULT false,
	"clerk_id" text,
	"class_grade" integer,
	"parent_id" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "vehicle_maintenance" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"reported_date" text,
	"scheduled_date" text,
	"completed_date" text,
	"estimated_cost" integer,
	"actual_cost" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"vendor_name" text,
	"vendor_contact" text,
	"invoice_number" text,
	"next_service_date" text,
	"next_service_odometer" integer,
	"notes" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_tracking" (
	"id" text PRIMARY KEY NOT NULL,
	"vehicle_id" text NOT NULL,
	"latitude" text NOT NULL,
	"longitude" text NOT NULL,
	"speed" integer,
	"heading" integer,
	"status" text NOT NULL,
	"current_trip_id" text,
	"route_id" text,
	"students_on_board" integer DEFAULT 0,
	"timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text,
	"route_id" text NOT NULL,
	"registration_number" text NOT NULL,
	"vehicle_type" text NOT NULL,
	"capacity" integer NOT NULL,
	"driver_name" text NOT NULL,
	"driver_phone" text NOT NULL,
	"driver_license" text NOT NULL,
	"conductor_name" text,
	"conductor_phone" text,
	"status" text NOT NULL,
	"gps_enabled" boolean DEFAULT true,
	"tracking_device_id" text,
	"insurance_expiry" text,
	"pollution_expiry" text,
	"fitness_expiry" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "vehicles_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
CREATE TABLE "inventory_vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"vendor_type" text,
	"contact_person" text,
	"email" text,
	"phone" text,
	"mobile" text,
	"website" text,
	"address" text,
	"city" text,
	"district" text,
	"country" text DEFAULT 'Bhutan',
	"postal_code" text,
	"tax_id" text,
	"license_number" text,
	"bank_name" text,
	"bank_account_number" text,
	"bank_branch" text,
	"payment_terms" text,
	"credit_limit" integer,
	"credit_period" integer,
	"discount_percentage" integer DEFAULT 0,
	"category_ids" text,
	"rating" integer,
	"total_orders" integer DEFAULT 0,
	"total_amount" integer DEFAULT 0,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "inventory_vendors_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "wizard_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"current_step" text NOT NULL,
	"completed_steps" text,
	"data" text,
	"is_completed" boolean DEFAULT false,
	"last_updated" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "wizard_progress_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "work_values_results" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"top_values" text NOT NULL,
	"description" text NOT NULL,
	"recommended_careers" text NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_terms" ADD CONSTRAINT "academic_terms_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessment_type_id_assessment_types_id_fk" FOREIGN KEY ("assessment_type_id") REFERENCES "public"."assessment_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_question_id_assessment_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."assessment_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_selected_option_id_assessment_questions_options_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."assessment_questions"("options") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_submissions" ADD CONSTRAINT "assessment_submissions_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_submissions" ADD CONSTRAINT "assessment_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_submissions" ADD CONSTRAINT "assessment_submissions_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_assessment_type_id_assessment_types_id_fk" FOREIGN KEY ("assessment_type_id") REFERENCES "public"."assessment_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_matches" ADD CONSTRAINT "career_matches_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_plans" ADD CONSTRAINT "career_plans_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "career_plans" ADD CONSTRAINT "career_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circulation" ADD CONSTRAINT "circulation_book_id_books_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."books"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circulation" ADD CONSTRAINT "circulation_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "circulation" ADD CONSTRAINT "circulation_borrower_id_users_id_fk" FOREIGN KEY ("borrower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_subjects" ADD CONSTRAINT "class_subjects_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_homeroom_teacher_id_users_id_fk" FOREIGN KEY ("homeroom_teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_class_teacher_id_users_id_fk" FOREIGN KEY ("class_teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselor_assignments" ADD CONSTRAINT "counselor_assignments_counselor_id_users_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselor_assignments" ADD CONSTRAINT "counselor_assignments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselor_notes" ADD CONSTRAINT "counselor_notes_counselor_id_users_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselor_notes" ADD CONSTRAINT "counselor_notes_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselor_resources" ADD CONSTRAINT "counselor_resources_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselor_resources" ADD CONSTRAINT "counselor_resources_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disc_results" ADD CONSTRAINT "disc_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results_enhanced" ADD CONSTRAINT "exam_results_enhanced_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results_enhanced" ADD CONSTRAINT "exam_results_enhanced_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_student_fee_id_student_fees_id_fk" FOREIGN KEY ("student_fee_id") REFERENCES "public"."student_fees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file_storage" ADD CONSTRAINT "file_storage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_homework_id_homework_id_fk" FOREIGN KEY ("homework_id") REFERENCES "public"."homework"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homework_submissions" ADD CONSTRAINT "homework_submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_styles_results" ADD CONSTRAINT "learning_styles_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_applicant_id_users_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_course_id_tuition_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."tuition_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mbti_results" ADD CONSTRAINT "mbti_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_module_id_learning_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."learning_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partners" ADD CONSTRAINT "partners_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riasec_results" ADD CONSTRAINT "riasec_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_events" ADD CONSTRAINT "school_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_assignments" ADD CONSTRAINT "teacher_assignments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_periods" ADD CONSTRAINT "time_periods_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timetable_entries" ADD CONSTRAINT "timetable_entries_period_id_time_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."time_periods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_allocations" ADD CONSTRAINT "transport_allocations_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_allocations" ADD CONSTRAINT "transport_allocations_route_id_transport_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."transport_routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_allocations" ADD CONSTRAINT "transport_allocations_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_allocations" ADD CONSTRAINT "transport_allocations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuition_courses" ADD CONSTRAINT "tuition_courses_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuition_courses" ADD CONSTRAINT "tuition_courses_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuition_enrollments" ADD CONSTRAINT "tuition_enrollments_course_id_tuition_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."tuition_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuition_enrollments" ADD CONSTRAINT "tuition_enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tuition_enrollments" ADD CONSTRAINT "tuition_enrollments_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_earnings" ADD CONSTRAINT "tutor_earnings_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_earnings" ADD CONSTRAINT "tutor_earnings_enrollment_id_tuition_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."tuition_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_reviews" ADD CONSTRAINT "tutor_reviews_tutor_id_users_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_reviews" ADD CONSTRAINT "tutor_reviews_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_reviews" ADD CONSTRAINT "tutor_reviews_enrollment_id_tuition_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."tuition_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutors" ADD CONSTRAINT "tutors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_parent_id_users_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wizard_progress" ADD CONSTRAINT "wizard_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_values_results" ADD CONSTRAINT "work_values_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;