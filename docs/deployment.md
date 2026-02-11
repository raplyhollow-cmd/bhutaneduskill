# Deployment Guide

## Current Status

- **Local Development:** ✅ Running on http://localhost:3003
- **Database:** SQLite (local), needs migration to Neon (production)
- **Authentication:** ✅ Clerk integrated
- **Payment:** ✅ RMA code ready (needs testing)

---

## Before Production Deployment

### 1. Database Migration (SQLite → Neon) ✅ COMPLETE

**Migration completed:** 14 rows migrated to Neon PostgreSQL

### 2. Environment Variables Setup
```bash
# 1. Create Neon project at neon.tech
# 2. Get your DATABASE_URL
# 3. Push schema to Neon
npx drizzle-kit push:pg --config=drizzle.config.prod.ts
```

#### Option B: Migrate Existing SQLite Data
```bash
# 1. Create Neon project at neon.tech
# 2. Get your DATABASE_URL
# 3. Set environment variable
export DATABASE_URL="postgresql://user:password@ep-xxx.aws.neon.tech/neondb"

# 4. Run migration script
npm run migrate:neon
```

The migration script ([`scripts/migrate-sqlite-to-neon.ts`](../scripts/migrate-sqlite-to-neon.ts)):
- Exports all data from `local.db`
- Converts SQLite formats to PostgreSQL
- Imports to Neon in correct dependency order
- Shows progress and error summary

### 2. Environment Variables Setup

Create these in Vercel/production environment:

```bash
# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Neon (Database)
DATABASE_URL=

# Resend (Email)
RESEND_API_KEY=

# PostHog (Analytics)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Upstash Redis (Caching)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# RMA (Payment - Bhutan)
RMA_MERCHANT_ID=
RMA_API_KEY=
RMA_API_SECRET=
RMA_API_URL=
```

### 3. Service Integrations

| Service | Purpose | Free Tier | Status |
|---------|---------|-----------|--------|
| **Vercel** | Hosting | 100 GB bandwidth | ✅ Ready |
| **Neon** | PostgreSQL | 500 MB storage | ⏳ Pending |
| **Clerk** | Authentication | 5,000 MAU | ✅ Integrated |
| **Resend** | Emails | 3,000/month | ⏳ Pending |
| **PostHog** | Analytics | 1M events/month | ⏳ Pending |
| **Sentry** | Error Tracking | 5,000 errors/month | ⏳ Pending |
| **Upstash Redis** | Caching | 500K commands/month | ⏳ Pending |

### 4. Testing Checklist

- [ ] End-to-end user flows
- [ ] Authentication (sign in, sign out, role-based access)
- [ ] All portals load correctly
- [ ] Database operations (CRUD)
- [ ] Payment gateway (RMA)
- [ ] Email notifications
- [ ] Mobile responsiveness
- [ ] Performance testing
- [ ] Security audit

### 5. Vercel Deployment Steps

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to preview
vercel

# 4. Deploy to production
vercel --prod
```

Or via Vercel Dashboard:
1. Connect GitHub repository
2. Import project
3. Configure environment variables
4. Deploy
5. Set custom domain (optional)

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server (port 3003)
npm run dev

# Build for production
npm run build

# Run production build locally
npm start
```

**Note:** Local URL is `http://localhost:3003` (NOT 3002)

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3003
npx kill-port 3003
```

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Neon database is active
- Test connection with Drizzle Studio

### Build Errors
- Check Tailwind CSS custom classes (use inline styles for gradients)
- Verify all imports are correct
- Check TypeScript errors with `npm run type-check`
