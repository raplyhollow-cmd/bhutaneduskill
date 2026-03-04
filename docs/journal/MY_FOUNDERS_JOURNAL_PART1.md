# My Founder's Journal - Part 1: The Beginning

**A First-Time Builder's Journey from Zero to SaaS**

> "I am like zero coder. I don't know any coding." - Me, February 2026

---

## Day Zero: February 7, 2026

### The Crazy Idea

I had this idea. A school management platform for Bhutan. Not just ANY platform - something modern, like Vercel, like Notion. Something that would actually work for our middle schools.

There was just one problem.

**I didn't know how to code.**

Like, AT ALL.

I'd heard about this thing called "vibe coding" - where you just... vibe with AI and build stuff? Sounds crazy, right? But I thought, why not?

### The First Commit

I remember staring at my terminal. Node.js installed. npm ready. And I typed:

```bash
npx create-next-app@latest career-guidance
```

And just like that, my journey began.

**Project location:** `C:\Users\pc\AI Career\career-guidance\` (yes, I named it "career-guidance" at first - the vision evolved!)

---

## Day 1-2: The Setup Rollercoaster

### What I Installed (With Zero Clue What Half of It Did)

Looking back at my notes, I installed:

- **Next.js 16** - Something about React framework?
- **TypeScript** - JavaScript with types? Still don't fully get it
- **Tailwind CSS** - For styling without writing CSS files
- **Clerk** - Authentication (I knew I needed login/signup)
- **Drizzle ORM** - Database stuff (was clueless)
- **shadcn/ui** - Pretty components?

I was basically following tutorials and hoping for the best.

### The First Success

By Day 2, I had:
- ✅ Landing page
- ✅ Student dashboard
- ✅ Teacher portal
- ✅ Parent portal
- ✅ Admin portal

"How???" you ask. Me and my AI assistant just kept building. We didn't know what we were doing, but we were DOING it.

---

## Week 1: The "Everything's Broken" Phase

### Error #1: Framer Motion Tears

I'll never forget my first real crash. The browser console showed:

```
Uncaught Error: Rendered more hooks than during the previous render.
```

**Panic mode.** I had no idea what hooks were. What did it mean "rendered more hooks"?

The AI explained it to me:

> "You can't call React hooks (useState, useEffect) conditionally or after early returns. They MUST be at the top of your component, in the same order, every time."

I fixed it, but honestly? I still didn't understand WHY. I just moved my hooks to the top and hoped for the best.

### Error #2: TypeScript Screaming

Then TypeScript started yelling at me:

```
Property 'skills' does not exist on type 'unknown'
```

I was like, "I don't CARE about types! Just let me code!"

But apparently TypeScript cares. A lot.

The solution was something called "type assertions":

```typescript
const userSettings = user?.settings as { skills?: Record<string, number> } | undefined;
```

I copy-pasted this everywhere. Did I understand it? No. Did it work? Yes.

---

## Week 2: The Database Nightmare

### The Schema Horror

I created this MASSIVE database schema. 145+ tables. No joke.

Looking back, I have no idea how I came up with all this:

```
- tenants, schools, users
- assessments, questions, careers
- classes, subjects, teachers
- attendance, homework, fees
- library, transport, hostel
- And 130+ more...
```

The AI helped, but I was the one saying "yes, add this" and "we need that feature."

### The Neon PostgreSQL Connection

Getting the database to connect was... an adventure.

I remember being SO confused about connection strings. Why are there so many formats? Why does the local one differ from production?

But eventually, I got it working:

```typescript
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
```

Success! I could actually save data to a database. I felt like a wizard.

---

## Week 2-3: The Authentication Saga

### Clerk Setup

Clerk is supposed to make auth easy. And it did... eventually.

But getting there? Painful.

I had to:
1. Create a Clerk account
2. Configure my application
3. Get API keys
4. Add them to `.env.local`
5. Wrap my app in ClerkProvider
6. Create sign-in and sign-up pages

Each step was a new adventure in "what does this error mean?"

### The Portal Routing Problem

This was BIG. I had 7 different portals:
- Student
- Teacher
- Parent
- Counselor
- School Admin
- Platform Admin
- Ministry

And they all needed different dashboards based on user type.

My solution? A monster `set-role` API that checked everything:

```typescript
export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.select().from(users).where(eq(users.clerkUserId, user.id));
  // ... lots of checks
}
```

It worked. But it was messy.

---

## February 10-15: The "Learning by Breaking Things" Phase

### My Coding Style Back Then

I'll be honest - my style was:

1. **Copy code from AI**
2. **Paste it in**
3. **See if it works**
4. **If yes, move on. If no, panic and ask AI again**

I didn't understand:
- Why certain imports used `@/` vs `../`
- What `use client` really meant
- The difference between server and client components
- How Next.js routing actually worked

But I kept going. Feature after feature. Portal after portal.

### The Commit Messages Tell the Story

Looking at my git history from these days:

```
"ux1"
"update 2"
"ux 3"
"update 4"
"update 5"
"last commit for today"
"deploy"
```

I was committing CONSTANTLY. Multiple times a day. Why? Because I was terrified of breaking something and losing progress.

---

## The Emotional Rollercoaster

### Highs

- **First successful build** - I felt like I could build anything
- **First portal working** - The teacher portal actually showed teacher data!
- **Database query returning results** - DATA! I was seeing real data!

### Lows

- **Build failures** - "Internal error" with no explanation
- **TypeScript errors** - Hundreds of them. I just wanted them to GO AWAY
- **Authentication not working** - Users getting redirected randomly
- **Feeling like an imposter** - "I don't know what I'm doing, this is all going to collapse"

### The Breakthrough Moment

I remember one specific night. I was stuck on an error for HOURS.

```
Error: Column does not exist
```

The AI told me: "You're trying to select ALL columns from the schools table, but some columns in your schema don't actually exist in the database yet."

The fix was so simple:

```typescript
// Before (broken)
db.select().from(schools)

// After (working!)
db.select({
  id: schools.id,
  name: schools.name,
  code: schools.code
}).from(schools)
```

Only select what you need. Only select what EXISTS.

That's when it clicked - I didn't have to be perfect. I just had to be specific.

---

## What I Built in Those First Two Weeks

Blows my mind looking back:

| Feature | Status |
|---------|--------|
| 7 Portal Layouts | ✅ Complete |
| 145+ Database Tables | ✅ Defined |
| RIASEC Career Assessment | ✅ Working |
| MBTI Personality Test | ✅ Working |
| Student Dashboard | ✅ Complete |
| Teacher Portal | ✅ Complete |
| Admin Dashboard | ✅ Complete |
| Basic Authentication | ✅ Working |

And I did it ALL with:
- Zero prior coding experience
- An AI assistant I didn't fully understand
- Lots of trial and error
- Pure determination (and maybe stubbornness)

---

## End of Part 1

**Date**: February 15, 2026
**Status**: Platform exists, lots of bugs, lots to learn
**TypeScript Errors**: ??? (too scared to count)
**Feeling**: Exhausted but proud

**Next**: The Middle Phase - where everything breaks and I have to learn how to actually fix it...

---

*Part 1 of 3*
*Continue to [Part 2: The Middle Phase](MY_FOUNDERS_JOURNAL_PART2.md)*
