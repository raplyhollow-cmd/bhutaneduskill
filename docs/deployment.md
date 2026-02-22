# Production Deployment Guide

## Database Schema Migrations (Manual Process)

### Important: Migrations Are Manual

This project uses **manual migrations** for production. Vercel does **NOT** run `drizzle-kit push` automatically.

When you modify `src/lib/db/schema.ts`, you must run migrations manually **before** deploying code.

---

## Before Deploying Schema Changes

### 1. Generate Migration (Optional)

For version control, you can generate a migration file:

```bash
npx drizzle-kit generate
```

This creates a new SQL file in `drizzle/` folder.

### 2. Push to Production Neon Database

**Always run migrations BEFORE pushing code to Vercel:**

```bash
# Option 1: Using your existing .env with production URL
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require" npx drizzle-kit push

# Option 2: Set DATABASE_URL in .env temporarily, then:
npx drizzle-kit push
```

### 3. Verify Changes

1. Visit [Neon Dashboard](https://console.neon.tech)
2. Go to **SQL Editor**
3. Run query to check new tables exist:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

### 4. Deploy Code

- Push to GitHub (triggers Vercel build)
- Vercel build does NOT run migrations automatically
- Code expects tables to already exist

---

## Current Migration Status

| Metric | Value |
|--------|-------|
| **Total Tables** | 94 |
| **Latest Migrations** | `0007_ai_interactions.sql`, `0008_library_tables.sql` |
| **Migration Folder** | `drizzle/*.sql` |
| **Connection Pooling** | Enabled (use `-pooler` endpoint) |

---

## Vercel Environment Variables

### Required Variables

Set these in **Vercel Dashboard → Settings → Environment Variables**:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | Pooled Neon URL (`-pooler` endpoint) | All |
| `NEXTAUTH_SECRET` | Random 32-char string | Production |
| `NEXTAUTH_URL` | `https://bhutaneduskill.vercel.app` | Production |
| `NODE_ENV` | `production` | Production |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | All |
| `CLERK_SECRET_KEY` | Clerk secret key | All |
| `GEMINI_API_KEY` | Google AI key | All |
| `ALLOWED_ORIGINS` | `https://bhutaneduskill.vercel.app` | Production |

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Neon Connection Pooling

### What is Pooling?

Neon's connection pooler uses **PgBouncer** to multiplex many client connections over fewer server connections.

- **Without pooling**: 50 concurrent logins = 50 database connections (may exceed limit)
- **With pooling**: 50 concurrent logins = ~5-10 database connections (efficient)

### How to Enable

1. Go to [Neon Dashboard](https://console.neon.tech)
2. Select your project
3. **Connection Pooling** should be enabled (default)
4. Copy the **Pooled** connection string (contains `-pooler` in hostname)

### Pooled URL Format

```
postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Look for**: `-pooler` in the hostname

---

## Troubleshooting

### "Table not found" Error on Production

**Cause**: Schema change deployed without running migrations

**Fix**:
```bash
DATABASE_URL="your-pooled-url" npx drizzle-kit push
```

### Connection Pool Exhausted

**Symptom**: "Connection limit exceeded" or "too many connections" errors

**Fix**:
1. Verify your `DATABASE_URL` contains `-pooler` in the hostname
2. Check connection pooling is enabled in Neon Dashboard
3. Example pooled URL:
   ```
   postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Build Timeout

**Symptom**: Vercel build exceeds timeout limit

**Workaround**:
1. Run migrations separately (not during build)
2. This project uses **manual migrations** by design
3. No `postinstall` script to slow down builds

---

## Pre-Deployment Checklist

- [ ] Schema changes are ready in `src/lib/db/schema.ts`
- [ ] Run `npx drizzle-kit push` against production database
- [ ] Verify tables/columns exist in Neon SQL Editor
- [ ] Test the feature locally
- [ ] Push to GitHub (triggers Vercel build)
- [ ] Monitor Vercel build logs
- [ ] Test deployed application at `https://bhutaneduskill.vercel.app`

---

## Quick Reference: Manual Migration Command

```bash
# One-line migration to production
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require" npx drizzle-kit push
```

**Replace**:
- `user` with your Neon username
- `pass` with your Neon password
- `ep-xxx-pooler.region.aws.neon.tech` with your pooled endpoint
- `neondb` with your database name
