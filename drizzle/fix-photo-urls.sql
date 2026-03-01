-- ============================================================================
-- FIX: photo_urls JSON conversion for inspections and incidents tables
-- Run this in Neon SQL Editor BEFORE running: npm run db:push
-- ============================================================================

-- Fix inspections table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inspections')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'inspections' AND column_name = 'photo_urls' AND data_type != 'json') THEN
    ALTER TABLE "inspections" ALTER COLUMN "photo_urls" SET DATA TYPE json USING COALESCE(photo_urls::json, '[]'::json);
    RAISE NOTICE 'inspections.photo_urls fixed!';
  END IF;
END $$;

-- Fix incidents table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incidents')
     AND EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'incidents' AND column_name = 'photo_urls' AND data_type != 'json') THEN
    ALTER TABLE "incidents" ALTER COLUMN "photo_urls" SET DATA TYPE json USING COALESCE(photo_urls::json, '[]'::json);
    RAISE NOTICE 'incidents.photo_urls fixed!';
  END IF;
END $$;