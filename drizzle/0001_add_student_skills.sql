-- Create student_skills table for skills tracking
CREATE TABLE IF NOT EXISTS student_skills (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL,
  source TEXT NOT NULL,
  evidence JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  validated_by TEXT,
  validated_at TIMESTAMP WITH TIME ZONE,
  confidence INTEGER,
  is_inferred BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS student_skills_user_id_idx ON student_skills(user_id);
CREATE INDEX IF NOT EXISTS student_skills_skill_name_idx ON student_skills(skill_name);
CREATE INDEX IF NOT EXISTS student_skills_status_idx ON student_skills(status);
CREATE INDEX IF NOT EXISTS student_skills_category_idx ON student_skills(category);
