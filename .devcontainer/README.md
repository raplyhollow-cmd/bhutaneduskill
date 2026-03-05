# Remote Sandbox Setup

## Option 1: GitHub Codespaces (Recommended - Free)

1. Push your code to GitHub
2. Go to your repo on GitHub
3. Click **Code** → **Codespaces** → **Create codespace**
4. Wait ~2 minutes for setup
5. Dev server starts automatically on port 3000

**Resources:** 4 cores, 8GB RAM (free tier)

---

## Option 2: Gitpod (Free Alternative)

1. Go to [gitpod.io](https://gitpod.io)
2. Connect your GitHub repo
3. Open your repo in Gitpod
4. Runs automatically

**Resources:** Variable (usually 2-4 cores, 4-8GB RAM)

---

## Option 3: Local Docker (Your Machine)

```bash
# Install Docker Desktop first
docker run -it --rm `
  -p 3000:3000 `
  -v "${PWD}:/app" `
  -w /app `
  --memory 8g `
  --cpus 4 `
  node:18 bash -c "npm install && npm run dev"
```

---

## Quick Start (Right Now)

1. **Create GitHub repo** if you don't have one:
   ```bash
   gh repo create bhutaneduskill --public --source=. --push
   ```

2. **Open in Codespaces**:
   - Go to: https://github.com/yourusername/bhutaneduskill/codespaces

3. **Or open directly**:
   ```bash
   gh codespace create -r bhutaneduskill
   ```

---

## Environment Variables Needed

Set these in the sandbox `.env` file:

```env
DATABASE_URL=your_neon_database_url
CLERK_SECRET_KEY=your_clerk_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_public_key
# ... rest of your .env
```

Copy your local `.env` to the sandbox.
