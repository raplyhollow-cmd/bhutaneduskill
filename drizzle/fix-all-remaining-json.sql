-- ============================================================================
-- COMPREHENSIVE FIX: All remaining JSON columns that need conversion
-- Run this in Neon SQL Editor BEFORE running: npm run db:push
-- ============================================================================

-- Fix online_courses.objectives (missing from original fix file)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'online_courses')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'online_courses' AND column_name = 'objectives' AND data_type != 'json') THEN
    ALTER TABLE "online_courses" ALTER COLUMN "objectives" SET DATA TYPE json USING COALESCE(objectives::json, '[]'::json);
    RAISE NOTICE 'online_courses.objectives fixed!';
  END IF;
END $$;

-- Fix learning_modules.objectives
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_modules')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'learning_modules' AND column_name = 'objectives' AND data_type != 'json') THEN
    ALTER TABLE "learning_modules" ALTER COLUMN "objectives" SET DATA TYPE json USING COALESCE(objectives::json, '[]'::json);
    RAISE NOTICE 'learning_modules.objectives fixed!';
  END IF;
END $$;

-- Fix learning_modules.prerequisites
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_modules')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'learning_modules' AND column_name = 'prerequisites' AND data_type != 'json') THEN
    ALTER TABLE "learning_modules" ALTER COLUMN "prerequisites" SET DATA TYPE json USING COALESCE(prerequisites::json, '[]'::json);
    RAISE NOTICE 'learning_modules.prerequisites fixed!';
  END IF;
END $$;

-- Fix inventory_items.photo_urls
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_items')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'inventory_items' AND column_name = 'photo_urls' AND data_type != 'json') THEN
    ALTER TABLE "inventory_items" ALTER COLUMN "photo_urls" SET DATA TYPE json USING COALESCE(photo_urls::json, '[]'::json);
    RAISE NOTICE 'inventory_items.photo_urls fixed!';
  END IF;
END $$;

-- Fix room_inspections.photo_urls
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'room_inspections')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'room_inspections' AND column_name = 'photo_urls' AND data_type != 'json') THEN
    ALTER TABLE "room_inspections" ALTER COLUMN "photo_urls" SET DATA TYPE json USING COALESCE(photo_urls::json, '[]'::json);
    RAISE NOTICE 'room_inspections.photo_urls fixed!';
  END IF;
END $$;

-- Fix hostel_complaints.photo_urls
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hostel_complaints')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'hostel_complaints' AND column_name = 'photo_urls' AND data_type != 'json') THEN
    ALTER TABLE "hostel_complaints" ALTER COLUMN "photo_urls" SET DATA TYPE json USING COALESCE(photo_urls::json, '[]'::json);
    RAISE NOTICE 'hostel_complaints.photo_urls fixed!';
  END IF;
END $$;

-- Fix report_templates.breakdown (might be missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_templates')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'report_templates' AND column_name = 'breakdown' AND data_type != 'json') THEN
    ALTER TABLE "report_templates" ALTER COLUMN "breakdown" SET DATA TYPE json USING COALESCE(breakdown::json, '[]'::json);
    RAISE NOTICE 'report_templates.breakdown fixed!';
  END IF;
END $$;

-- Fix report_templates.fees (might be missing)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_templates')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'report_templates' AND column_name = 'fees' AND data_type != 'json') THEN
    ALTER TABLE "report_templates" ALTER COLUMN "fees" SET DATA TYPE json USING COALESCE(fees::json, '[]'::json);
    RAISE NOTICE 'report_templates.fees fixed!';
  END IF;
END $$;

RAISE NOTICE 'All remaining JSON column fixes completed!';