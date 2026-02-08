CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text DEFAULT 'riasec' NOT NULL,
	`status` text DEFAULT 'in_progress',
	`answers` text NOT NULL,
	`results` text,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `career_matches` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`career_id` text NOT NULL,
	`match_score` integer NOT NULL,
	`recommendation_text` text,
	`is_top_match` integer DEFAULT false,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`career_id`) REFERENCES `careers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `careers` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`riasec_code` text,
	`riasec_scores` text,
	`skills` text,
	`education_path` text,
	`subjects` text,
	`work_environment` text,
	`salary_range` text,
	`demand_outlook` text,
	`bhutan_specific` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`name` text NOT NULL,
	`grade` integer NOT NULL,
	`section` text,
	`academic_year` text NOT NULL,
	`students` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `consent_records` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending',
	`consent_text` text,
	`ip_address` text,
	`user_agent` text,
	`consented_at` integer,
	`revoked_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`assessment_type` text NOT NULL,
	`question_text` text NOT NULL,
	`options` text NOT NULL,
	`category` text,
	`order_index` integer,
	`is_active` integer DEFAULT true,
	`language` text DEFAULT 'en',
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`domain` text,
	`address` text,
	`contact_email` text,
	`contact_phone` text,
	`settings` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_code_unique` ON `schools` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `schools_domain_unique` ON `schools` (`domain`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`domain` text,
	`settings` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_unique` ON `tenants` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_domain_unique` ON `tenants` (`domain`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`school_id` text,
	`type` text NOT NULL,
	`email` text,
	`phone` text,
	`first_name` text NOT NULL,
	`last_name` text,
	`profile_picture` text,
	`date_of_birth` text,
	`class_grade` integer,
	`section` text,
	`parent_id` text,
	`employee_id` text,
	`subjects` text,
	`occupation` text,
	`relationship` text,
	`clerk_user_id` text,
	`email_verified` integer DEFAULT false,
	`settings` text,
	`created_at` integer NOT NULL,
	`last_login_at` integer,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_clerk_user_id_unique` ON `users` (`clerk_user_id`);