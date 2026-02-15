-- Create a manual platform admin user
-- Email: admin@bhutaneduskill.vercel.app

-- Create user
INSERT INTO users ("id", "clerk_user_id", "type", "role", "name", "firstName", "lastName", "email", "createdAt", "updatedAt")
VALUES (
  'user-manual-' || extract(epoch from (now() at time zone 'utc')::bigint,
  'manual-platform-admin',
  'admin',
  'Platform Admin',
  'Admin',
  'User',
  'admin@bhutaneduskill.vercel.app',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;

-- Assign platform-admin role
INSERT INTO user_roles ("id", "user_id", "role_id", "assigned_by", "created_at")
VALUES (
  'ur-manual-' || extract(epoch from (now() at time zone 'utc')::bigint,
  'user-manual-' || extract(epoch from (now() at time zone 'utc')::bigint,
  (SELECT id FROM roles WHERE slug = 'platform-admin'),
  NOW()
)
ON CONFLICT DO NOTHING;
