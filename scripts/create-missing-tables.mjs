import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createMissingTables() {
  console.log("Creating missing tables...\n");

  try {
    // 1. Create students table
    console.log("Creating students table...");
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_code TEXT UNIQUE,
        current_class TEXT,
        section TEXT,
        date_of_birth DATE,
        gender TEXT,
        blood_group TEXT,
        address TEXT,
        emergency_contact TEXT,
        emergency_phone TEXT,
        metadata JSONB,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ students table created");

    // 2. Create teachers table
    console.log("Creating teachers table...");
    await sql`
      CREATE TABLE IF NOT EXISTS teachers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        employee_id TEXT UNIQUE,
        designation TEXT,
        department TEXT,
        specialization TEXT,
        joining_date DATE,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ teachers table created");

    // 3. Create parents table
    console.log("Creating parents table...");
    await sql`
      CREATE TABLE IF NOT EXISTS parents (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        occupation TEXT,
        work_address TEXT,
        emergency_contact TEXT NOT NULL,
        relationship_to_primary TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ parents table created");

    // 4. Create parent_to_student join table
    console.log("Creating parent_to_student table...");
    await sql`
      CREATE TABLE IF NOT EXISTS parent_to_student (
        parent_id TEXT NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        is_primary_contact BOOLEAN DEFAULT false,
        relationship_type TEXT,
        PRIMARY KEY (parent_id, student_id)
      )
    `;
    console.log("✓ parent_to_student table created");

    // 5. Create invoices table (fixed version)
    console.log("Creating invoices table...");
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        invoice_number TEXT NOT NULL UNIQUE,
        amount DECIMAL(10, 2) NOT NULL,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        discount_amount DECIMAL(10, 2) DEFAULT 0,
        total_amount DECIMAL(10, 2) NOT NULL,
        currency TEXT DEFAULT 'BTN',
        status TEXT DEFAULT 'draft',
        invoice_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        due_date TIMESTAMP WITHOUT TIME ZONE,
        paid_at TIMESTAMP WITHOUT TIME ZONE,
        refund_amount DECIMAL(10, 2),
        refund_reason TEXT,
        refunded_at TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ invoices table created");

    // 6. Create subscriptions table
    console.log("Creating subscriptions table...");
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        tier TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        max_students INTEGER,
        max_teachers INTEGER,
        start_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        end_date TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ subscriptions table created");

    // 7. Create payments table
    console.log("Creating payments table...");
    await sql`
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
        school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method TEXT,
        payment_reference TEXT,
        status TEXT DEFAULT 'pending',
        paid_at TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ payments table created");

    // 8. Create library_books table
    console.log("Creating library_books table...");
    await sql`
      CREATE TABLE IF NOT EXISTS library_books (
        id TEXT PRIMARY KEY,
        school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        isbn TEXT UNIQUE,
        publisher TEXT,
        publication_year INTEGER,
        category TEXT,
        sub_category TEXT,
        language TEXT DEFAULT 'English',
        pages INTEGER,
        cover_image TEXT,
        description TEXT,
        total_copies INTEGER DEFAULT 1 NOT NULL,
        available_copies INTEGER DEFAULT 1 NOT NULL,
        location TEXT,
        call_number TEXT,
        tags JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ library_books table created");

    // 9. Create library_members table
    console.log("Creating library_members table...");
    await sql`
      CREATE TABLE IF NOT EXISTS library_members (
        id TEXT PRIMARY KEY,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        member_type TEXT NOT NULL,
        membership_number TEXT NOT NULL UNIQUE,
        membership_status TEXT DEFAULT 'active',
        joined_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        expiry_date TIMESTAMP WITHOUT TIME ZONE,
        borrowing_limit INTEGER DEFAULT 5,
        currently_borrowed INTEGER DEFAULT 0,
        total_borrowed INTEGER DEFAULT 0,
        fine_due DECIMAL(10, 2) DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ library_members table created");

    // 10. Create library_circulation table
    console.log("Creating library_circulation table...");
    await sql`
      CREATE TABLE IF NOT EXISTS library_circulation (
        id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
        member_id TEXT NOT NULL REFERENCES library_members(id) ON DELETE CASCADE,
        school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        checkout_date TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        due_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        return_date TIMESTAMP WITHOUT TIME ZONE,
        status TEXT DEFAULT 'issued',
        renewals INTEGER DEFAULT 0,
        max_renewals INTEGER DEFAULT 3,
        fine DECIMAL(10, 2) DEFAULT 0,
        fine_paid BOOLEAN DEFAULT false,
        notes TEXT,
        processed_by TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ library_circulation table created");

    // 11. Create ai_interactions table
    console.log("Creating ai_interactions table...");
    await sql`
      CREATE TABLE IF NOT EXISTS ai_interactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        context_snapshot JSONB,
        prompt TEXT NOT NULL,
        response TEXT NOT NULL,
        category TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
      )
    `;
    console.log("✓ ai_interactions table created");

    // 12. Create student_portfolios table
    console.log("Creating student_portfolios table...");
    await sql`
      CREATE TABLE IF NOT EXISTS student_portfolios (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        school_id TEXT REFERENCES schools(id) ON DELETE CASCADE,
        title TEXT,
        description TEXT,
        category TEXT,
        sub_category TEXT,
        type TEXT,
        content JSONB,
        attachments JSONB,
        tags JSONB,
        portfolio_date DATE,
        is_public BOOLEAN DEFAULT false,
        is_featured BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'draft',
        submitted_by TEXT REFERENCES users(id),
        approved_by TEXT REFERENCES users(id),
        approved_at TIMESTAMP WITHOUT TIME ZONE,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    console.log("✓ student_portfolios table created");

    // Create indexes
    console.log("\nCreating indexes...");
    await sql`CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_parents_user_id ON parents(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_parent_to_student_student_id ON parent_to_student(student_id)`;
    console.log("✓ Indexes created");

    console.log("\n✅ All missing tables created successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

createMissingTables();
