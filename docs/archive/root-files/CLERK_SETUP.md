# Clerk Authentication Setup Guide

## Step 1: Create Clerk Account

1. Go to https://clerk.com
2. Click "Sign up" (you can use GitHub or Google for quick signup)
3. Verify your email if required

## Step 2: Create a New Application

1. After signing in, click "Add application" or "Create application"
2. Choose a name: "Career Compass" or similar
3. Select "Next.js" as the framework
4. Choose your authentication providers:
   - Email (enabled by default)
   - Google (recommended)
   - Apple (optional)
   - Phone number (optional)

## Step 3: Get API Keys

1. In your application dashboard, go to "API Keys"
2. You'll see two keys:
   - **Publishable Key**: Starts with `pk_test_...` or `pk_live_...`
   - **Secret Key**: Starts with `sk_test_...` or `sk_live_...`

## Step 4: Configure Environment Variables

1. Create a new file in your project root: `.env.local`
2. Add the following (replace with your actual keys):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
```

## Step 5: Update Clerk Components (Optional Customization)

The default Clerk components will work, but you can customize:
- Go to "Sessions" in your Clerk dashboard
- Configure session expiration times
- Set up redirect URLs after sign-in/sign-out

## Step 6: Test Authentication

1. Restart your dev server:
```bash
cd "C:\Users\pc\AI Career\career-guidance"
npm run dev
```

2. Go to http://localhost:3000
3. Click "Sign In" or "Get Started"
4. Try creating a new account
5. Verify you can access protected routes (dashboard)

## Organization Support (For Multi-Tenant)

To enable organization/school support:
1. Go to "Organizations" in Clerk dashboard
2. Enable organizations
3. Create organization for each school

## Troubleshooting

**Issue:** "Invalid Clerk keys"
**Solution:** Double-check your keys match exactly what's in Clerk dashboard

**Issue:** "Auth not working"
**Solution:** Make sure you restarted the dev server after adding .env.local

**Issue:** "Middleware error"
**Solution:** Clerk middleware is working but may show deprecation warning - this is fine for now
