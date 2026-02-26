# Bhutan EduSkill Deployment Guide

> **Version**: 2.6.0
> **Last Updated**: March 9, 2026
> **Target Production**: Bhutan Schools

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Authentication Setup](#authentication-setup)
5. [Deployment Platforms](#deployment-platforms)
6. [Production Configuration](#production-configuration)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Multi-Tenancy Setup](#multi-tenancy-setup)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Node.js**: 18.x or higher
- **npm**: 8.x or higher
- **Database**: PostgreSQL 14+ (Neon recommended)
- **SSL Certificate**: Valid SSL/TLS certificate required
- **Domain**: Wildcard subdomain support (e.g., `*.school.bt`)

### Required Services
1. **Neon PostgreSQL** - Database hosting
2. **Clerk** - Authentication service
3. **Vercel** - Deployment platform (recommended)
4. **Gemini API** - AI services (optional)

## Environment Setup

### 1. Clone and Setup Repository

```bash
git clone https://github.com/your-org/bhutaneduskill.git
cd bhutaneduskill
npm install
```

### 2. Environment Variables

Create `.env.local` with all required variables:

```env
# ====================
# CLERK AUTHENTICATION
# ====================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key
CLERK_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# ====================
# DATABASE (NEON POSTGRESQL)
# ====================
DATABASE_URL=postgresql://user:password@ep-xxx.aws.neon.tech/neondb?sslmode=require

# ====================
# AI SERVICES (Optional)
# ====================
OPENAI_API_KEY=your_openai_key_here
GEMINI_API_KEY=your_gemini_key_here

# ====================
# VERCEL CONFIGURATION
# ====================
NEXT_PUBLIC_VERCEL_URL=your-domain.vercel.app
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# ====================
# NOTIFICATIONS
# ====================
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:admin@school.bt
```

## Database Configuration

### Neon PostgreSQL Setup

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

---

## Authentication Setup

### Clerk Configuration

1. **Create Clerk Application**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Create new application
   - Set up OAuth providers if needed

2. **User Types Configuration**
   ```typescript
   // Define roles in Clerk
   const roleMappings = {
     student: 'student',
     teacher: 'teacher',
     parent: 'parent',
     counselor: 'counselor',
     school_admin: 'school_admin',
     admin: 'admin',
     ministry: 'ministry'
   };
   ```

3. **Webhook Setup**
   ```bash
   # Clerk webhook endpoint
   curl -X POST https://your-domain.vercel.app/api/clerk/webhook \
     -H "Content-Type: application/json" \
     -d '{"secret": "your_webhook_secret"}'
   ```

### Multi-Tenant Authentication

```typescript
// Middleware for tenant isolation
export async function middleware(request: NextRequest) {
  const { userId } = await auth();
  const schoolId = request.nextUrl.searchParams.get('schoolId');

  if (schoolId && userId) {
    // Verify user belongs to school
    const userSchool = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, userId));

    if (userSchool[0]?.schoolId !== schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
}
```

---

## Deployment Platforms

### Vercel Deployment (Recommended)

1. **GitHub Integration**
   ```bash
   # Create GitHub repository
   git remote add origin https://github.com/your-org/bhutaneduskill.git
   git push -u origin main
   ```

2. **Vercel Setup**
   - Import repository on Vercel
   - Add environment variables
   - Configure build settings:
     - Build Command: `npm run build`
     - Output Directory: `.next`
     - Install Command: `npm install`

3. **Vercel Configuration**
   ```json
   // vercel.json
   {
     "functions": {
       "src/app/api/**/*.ts": {
         "maxDuration": 30
       }
     },
     "env": {
       "NEXT_PUBLIC_VERCEL_URL": "your-domain.vercel.app"
     }
   }
   ```

### Self-Hosted Deployment

1. **Docker Setup**
   ```dockerfile
   # Dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Docker Compose**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DATABASE_URL=postgresql://...
       depends_on:
         - postgres
     postgres:
       image: postgres:14
       environment:
         POSTGRES_DB: neondb
         POSTGRES_USER: user
         POSTGRES_PASSWORD: password
       volumes:
         - postgres_data:/var/lib/postgresql/data
   ```

---

## Production Configuration

### Security Headers

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', "default-src 'self'");

  return response;
}
```

### Rate Limiting

```typescript
// Create rate limiter
const rateLimit = createMiddleware({
  limit: {
    max: 100,
    ttl: 60000,
  },
});

// Apply to API routes
export const config = {
  matcher: '/api/:path*',
};
```

### Caching Strategy

```typescript
// Add caching headers
export async function GET() {
  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
    },
  });
}
```

---

## Monitoring & Maintenance

### Performance Monitoring

1. **Vercel Analytics**
   - Enable Application Analytics
   - Set up Real-time Monitoring
   - Configure alerts for errors

2. **Database Monitoring**
   - Neon Performance Dashboard
   - Query time tracking
   - Connection pool monitoring

3. **Application Metrics**
   ```typescript
   // Track API performance
   const startTime = Date.now();

   try {
     const result = await apiCall();
     const duration = Date.now() - startTime;

     // Log performance
     logger.info('API call completed', {
       route: req.url,
       duration,
       userId
     });

     return result;
   } catch (error) {
     const duration = Date.now() - startTime;
     logger.error('API call failed', {
       route: req.url,
       duration,
       error
     });
     throw error;
   }
   ```

### Health Checks

```typescript
// /api/health route
export async function GET() {
  try {
    // Check database
    await db.select().from(users).limit(1);

    // Check external services
    await fetch('https://api.clerk.com/v1/users', {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` }
    });

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.6.0'
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
```

---

## Multi-Tenancy Setup

### School Registration

```typescript
// API for registering new schools
export async function POST(req: Request) {
  const { name, code, clerkDomain } = await req.json();

  // Validate school code format
  if (!/^[A-Z]{3}\d{3}$/.test(code)) {
    return Response.json({ error: 'Invalid school code format' }, { status: 400 });
  }

  // Create school
  const school = await db.insert(schools).values({
    name,
    code,
    clerkDomain
  }).returning();

  // Create admin user
  await createUserWithRole({
    email: `admin@${code}.bt`,
    role: 'school_admin',
    schoolId: school[0].id
  });

  return Response.json({ school: school[0] });
}
```

### Domain-based Routing

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');

  // Extract subdomain
  const schoolSubdomain = hostname?.split('.')[0];

  if (schoolSubdomain && schoolSubdomain !== 'www') {
    // Find school by subdomain
    const school = await db
      .select({ id: schools.id, code: schools.code })
      .from(schools)
      .where(eq(schools.code, schoolSubdomain));

    if (school.length > 0) {
      // Set school context
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-school-id', school[0].id);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
}
```

---

## Backup & Recovery

### Database Backup

1. **Neon Automatic Backups**
   - Enabled by default
   - 7-day retention
   - Point-in-time recovery

2. **Manual Backup**
   ```bash
   # Export database
   pg_dump $DATABASE_URL > backup.sql

   # Restore database
   psql $DATABASE_URL < backup.sql
   ```

### File Backup

```bash
# Backup user files
tar -czf uploads-backup.tar.gz uploads/

# Restore files
tar -xzf uploads-backup.tar.gz
```

### Disaster Recovery Plan

1. **Backup Schedule**
   - Daily database backups
   - Weekly file backups
   - Monthly test restores

2. **Recovery Procedure**
   ```bash
   # Step 1: Stop services
   docker-compose down

   # Step 2: Restore database
   psql $DATABASE_URL < backup.sql

   # Step 3: Restore files
   tar -xzf uploads-backup.tar.gz

   # Step 4: Start services
   docker-compose up -d
   ```

---

## Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   npm run db:studio
   ```

3. **Authentication Issues**
   - Verify Clerk keys are correct
   - Check webhook configuration
   - Validate user roles in database

### Debug Mode

```typescript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  logger.enable('debug');
}

// Debug API calls
export async function GET() {
  logger.debug('API call', {
    route: '/api/debug',
    user: userId,
    timestamp: new Date().toISOString()
  });

  return Response.json({ debug: true });
}
```

### Performance Issues

1. **Slow Queries**
   ```sql
   -- Find slow queries
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

2. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=16384" npm run build
   ```

### Support Resources

1. **Documentation**
   - [API Reference](./API_REFERENCE.md)
   - [User Manual](./USER_MANUAL.md)
   - [Troubleshooting Guide](./TROUBLESHOOTING.md)

2. **Contact Support**
   - Email: support@bhutaneduskill.bt
   - Phone: +975-2-123456
   - Portal: /admin/support

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema pushed
- [ ] Clerk application set up
- [ ] SSL certificate installed
- [ ] Rate limiting enabled
- [ ] Monitoring configured
- [ ] Backup schedule active
- [ ] Multi-tenancy tested
- [ ] Performance optimized
- [ ] Security headers applied

**Last Reviewed**: March 9, 2026
**Next Review**: March 9, 2027
