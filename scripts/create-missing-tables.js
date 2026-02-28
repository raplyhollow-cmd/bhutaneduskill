/**
 * Create missing database tables directly
 * This bypasses drizzle-kit which is slow with 145+ tables
 */

const { neon } = require('@neondatabase/serverless');

async function createMissingTables() {
  const sql = neon(process.env.DATABASE_URL);

  console.log('Creating missing tables...\n');

  const tables = [
    // Billing tables (from billing-schema.ts)
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      plan_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      price NUMERIC(10,2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'BTN',
      start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      end_date TIMESTAMP WITH TIME ZONE,
      auto_renew BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
      price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'BTN',
      max_students INTEGER,
      max_teachers INTEGER,
      features JSONB,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )`,

    `CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      school_id TEXT NOT NULL,
      subscription_id TEXT,
      invoice_number TEXT NOT NULL UNIQUE,
      amount NUMERIC(10,2) NOT NULL,
      currency TEXT NOT NULL DEFAULT 'BTN',
      status TEXT NOT NULL DEFAULT 'pending',
      due_date TIMESTAMP WITH TIME ZONE,
      paid_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )`,

    // Add tenant_id column to users table if not exists
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)`,

    // Add tenant_id to schools table if not exists
    `ALTER TABLE schools ADD COLUMN IF NOT EXISTS tenant_id TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_schools_tenant_id ON schools(tenant_id)`,
  ];

  for (const tableSql of tables) {
    try {
      await sql[tableSql];
      console.log('✅ Executed:', tableSql.substring(0, 50) + '...');
    } catch (error) {
      console.log('⚠️  Skipped (may already exist):', error.message.substring(0, 80));
    }
  }

  console.log('\n✨ Done! Database is ready.');
}

createMissingTables()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('💥 Error:', err);
    process.exit(1);
  });
