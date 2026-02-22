ALTER TABLE "announcements" ALTER COLUMN "target_audience" SET DATA TYPE json USING COALESCE("target_audience"::json, '[]'::json);
ALTER TABLE "homework_submissions" ALTER COLUMN "feedback" SET DATA TYPE json USING COALESCE("feedback"::json, '[]'::json);
ALTER TABLE "lesson_plans" ALTER COLUMN "objectives" SET DATA TYPE json USING COALESCE("objectives"::json, '[]'::json);
ALTER TABLE "lesson_plans" ALTER COLUMN "activities" SET DATA TYPE json USING COALESCE("activities"::json, '[]'::json);
ALTER TABLE "lesson_plans" ALTER COLUMN "resources" SET DATA TYPE json USING COALESCE("resources"::json, '[]'::json);
ALTER TABLE "counseling_sessions" ALTER COLUMN "notes" SET DATA TYPE json USING COALESCE("notes"::json, '[]'::json);