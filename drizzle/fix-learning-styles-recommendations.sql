-- ============================================================================
-- FIX: learning_styles_results.recommendations JSON conversion
-- Run this in Neon SQL Editor BEFORE running: npm run db:push
-- ============================================================================

-- Step 1: Check if table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'learning_styles_results') THEN
    RAISE NOTICE 'Table learning_styles_results does not exist. Skipping.';
    RETURN;
  END IF;

  RAISE NOTICE 'Table learning_styles_results exists. Proceeding with fix...';
END $$;

-- Step 2: Check current column type
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'learning_styles_results' AND column_name = 'recommendations';

  IF col_type IS NULL THEN
    RAISE NOTICE 'Column recommendations does not exist. Skipping.';
    RETURN;
  END IF;

  IF col_type = 'json' THEN
    RAISE NOTICE 'Column recommendations is already JSON type. Skipping.';
    RETURN;
  END IF;

  RAISE NOTICE 'Column recommendations is currently % type. Converting to JSON...', col_type;
END $$;

-- Step 3: Clean up invalid data first (make sure all values are valid JSON arrays)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'learning_styles_results' AND column_name = 'recommendations' AND data_type != 'json') THEN

    -- Update NULL or empty values to empty JSON array
    UPDATE "learning_styles_results"
    SET "recommendations" = '[]'
    WHERE "recommendations" IS NULL
       OR "recommendations" = ''
       OR "recommendations"::text = 'null';

    -- Try to fix values that aren't valid JSON arrays
    UPDATE "learning_styles_results"
    SET "recommendations" = '[]'
    WHERE "recommendations"::text NOT LIKE '[%'
      AND "recommendations"::text NOT LIKE '{%'
      AND "recommendations"::text != '[]';

    RAISE NOTICE 'Data cleanup completed.';
  END IF;
END $$;

-- Step 4: Convert column to JSON type (with proper USING clause)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'learning_styles_results' AND column_name = 'recommendations' AND data_type != 'json') THEN

    EXECUTE 'ALTER TABLE "learning_styles_results"
             ALTER COLUMN "recommendations"
             SET DATA TYPE json
             USING COALESCE("recommendations"::json, ''[]''::json)';

    RAISE NOTICE 'Column recommendations converted to JSON type successfully!';
  ELSE
    RAISE NOTICE 'Column recommendations is already JSON type or does not exist.';
  END IF;
END $$;

-- Step 5: Verify the conversion
DO $$
DECLARE
  col_type text;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_name = 'learning_styles_results' AND column_name = 'recommendations';

  IF col_type = 'json' THEN
    RAISE NOTICE 'SUCCESS: Column recommendations is now JSON type!';
    RAISE NOTICE 'You can now run: npm run db:push';
  ELSE
    RAISE EXCEPTION 'FAILED: Column is still % type. Check the error messages above.', col_type;
  END IF;
END $$;