-- Create ai_interactions table for tracking AI feature usage
CREATE TABLE IF NOT EXISTS "ai_interactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"feature_id" text NOT NULL,
	"interaction_data" json,
	"metadata" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "ai_interactions_user_id_idx" ON "ai_interactions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_interactions_feature_id_idx" ON "ai_interactions" ("feature_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_interactions_created_at_idx" ON "ai_interactions" ("created_at");--> statement-breakpoint

-- Add foreign key constraint
DO $$ BEGIN
	ALTER TABLE "ai_interactions" ADD CONSTRAINT "ai_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN null;
END $$;
