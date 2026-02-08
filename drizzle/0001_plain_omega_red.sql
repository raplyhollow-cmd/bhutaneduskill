CREATE TABLE `assessment_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text,
	`user_id` text,
	`assigned_by` text,
	`status` text DEFAULT 'pending',
	`started_at` integer,
	`completed_at` integer,
	`time_spent` integer,
	`ip_address` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `assessment_types` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`target_grade` text,
	`target_audience` text,
	`category` text,
	`duration` integer,
	`question_count` integer,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `assessment_types_slug_unique` ON `assessment_types` (`slug`);--> statement-breakpoint
CREATE TABLE `career_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`counselor_id` text,
	`current_phase` text DEFAULT 'self_assessment',
	`targetCareer` text,
	`short_term_goals` text,
	`long_term_goals` text,
	`action_steps` text,
	`milestones` text,
	`status` text DEFAULT 'active',
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`counselor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`targetCareer`) REFERENCES `careers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `counselor_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`counselor_id` text,
	`student_id` text,
	`note` text NOT NULL,
	`is_private` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`counselor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `disc_results` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text,
	`user_id` text,
	`dominance` integer,
	`influence` integer,
	`steadiness` integer,
	`conscientiousness` integer,
	`disc_type` text,
	`traits` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exam_results` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`exam_type` text,
	`exam_year` integer,
	`subjects` text,
	`total_percentage` integer,
	`division` text,
	`is_verified` integer DEFAULT false,
	`verified_by` text,
	`entered_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`entered_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `learning_styles_results` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text,
	`user_id` text,
	`visual` integer,
	`auditory` integer,
	`read_write` integer,
	`kinesthetic` integer,
	`dominant_style` text,
	`recommendations` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mbti_results` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text,
	`user_id` text,
	`ei_score` integer,
	`sn_score` integer,
	`tf_score` integer,
	`jp_score` integer,
	`personality_type` text,
	`traits` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `work_values_results` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text,
	`user_id` text,
	`values` text,
	`top_values` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
