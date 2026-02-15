-- Add missing columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "department" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "school" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "interests" json;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "goals" text;

-- For settings, we need to handle it differently since it may already exist with wrong type
-- First, let's check if settings column exists and drop it if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'settings'
    ) THEN
        ALTER TABLE "users" DROP COLUMN "settings";
    END IF;
END $$;

-- Now add settings as json type
ALTER TABLE "users" ADD COLUMN "settings" json;
