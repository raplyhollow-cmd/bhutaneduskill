# AI Career Guidance Platform for Bhutan

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)

A comprehensive, AI-powered career guidance platform designed specifically for Bhutanese students. The platform provides personalized career recommendations, college matching, scholarship information, and multi-portal access for students, parents, teachers, and counselors.

## Features

### Core Capabilities

- **AI-Powered Career Recommendations** - Personalized suggestions based on:
  - Student interests and passions
  - Academic performance and results
  - RIASEC psychological assessment
  - Career aptitude testing

- **Student Indecision Detection** - Proprietary framework with 5 key metrics:
  - Interest volatility tracking
  - Goal clarity assessment
  - Decision confidence scoring
  - Information sufficiency analysis
  - Timeline adherence monitoring

- **Comprehensive Education Databases**:
  - All 10 RUB (Royal University of Bhutan) constituent colleges
  - Private colleges in Bhutan
  - Technical Training Institutes (TTIs)
  - Desuung Skilling Programme opportunities
  - Study abroad requirements for Australia, New Zealand, USA, Singapore, and Europe

- **Scholarship Database** - Curated scholarships for Bhutanese students

### Multi-Portal System

| Portal | Description |
|--------|-------------|
| **Student Portal** | Career assessments, college exploration, scholarship search, progress tracking |
| **Parent Portal** | Monitor child's progress, view recommendations, understand career options |
| **Teacher Portal** | Track student development, provide guidance recommendations |
| **Counselor Portal** | Advanced intervention tools, AI-powered insights, outreach automation |

### Smart Features

- Intelligent college matching based on marks and eligibility
- Career path visualization with education roadmaps
- Industry insights with demand outlook for Bhutan
- Study abroad guidance with country-specific requirements
- Automated outreach and communication templates

## Tech Stack

### Frontend
- **Next.js 16.1.6** - React framework with App Router
- **React 19.x** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - High-quality React components

### Backend & Services
- **Next.js API Routes** - Server-side endpoints
- **Clerk Authentication** - User management and auth
- **PostgreSQL** - Database (prepared for integration)

### Development Tools
- **Turbopack** - Fast bundler
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Project Structure

```
career-guidance/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── portal/               # Portal-specific pages
│   │   │   ├── student/          # Student portal
│   │   │   ├── parent/           # Parent portal
│   │   │   ├── teacher/          # Teacher portal
│   │   │   └── counselor/        # Counselor portal
│   │   ├── dashboard/            # Main dashboard
│   │   ├── rub/                  # RUB colleges page
│   │   ├── scholarship/          # Scholarships page
│   │   └── assessment/           # Career assessments
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── portal/               # Portal-specific components
│   │   └── dashboard/            # Dashboard components
│   ├── lib/                      # Utilities and databases
│   │   ├── tenant.ts             # Multi-tenancy, RUB/TTI data
│   │   ├── industry-database.ts  # Industry & career data
│   │   ├── scholarship-database.ts # Scholarships
│   │   └── utils.ts              # Helper functions
│   └── middleware.ts             # Next.js middleware
├── public/                       # Static assets
├── .env.local                    # Environment variables (create this)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
└── tsconfig.json                 # TypeScript configuration
```

## Installation

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, pnpm, or bun
- A Clerk account (for authentication)

### Step 1: Clone the Repository

```bash
git clone https://github.com/raplyhollow-cmd/career-guidance.git
cd career-guidance
```

### Step 2: Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Step 3: Environment Variables

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database (optional - for future use)
DATABASE_URL=your_database_url_here

# AI Services (optional - for enhanced recommendations)
OPENAI_API_KEY=your_openai_key_here
```

To get Clerk keys:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Copy your API keys from the API Keys section

### Step 4: Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For Students

1. **Sign Up** - Create an account with your school code
2. **Take Assessments** - Complete RIASEC and aptitude tests
3. **Explore Careers** - Browse recommended careers based on your profile
4. **Find Colleges** - Match with RUB colleges and programs based on your marks
5. **Search Scholarships** - Discover opportunities for further education

### For Counselors

1. **Access Counselor Portal** - Navigate to `/portal/counselor`
2. **View Students** - See all students and their indecision metrics
3. **AI Recommendations** - Get personalized intervention strategies
4. **Outreach Tools** - Send messages and schedule sessions
5. **Track Progress** - Monitor intervention effectiveness

### For Parents & Teachers

Access your respective portals to:
- Monitor student progress
- View career recommendations
- Understand assessment results
- Support student development

## Configuration

### Multi-Tenancy Setup

The platform supports multi-tenancy via subdomains. To enable:

1. Configure your DNS to support wildcards: `*.yourdomain.com`
2. Update middleware logic to handle school-based subdomains
3. Add schools to `BHUTAN_SCHOOL_CODES` in `src/lib/tenant.ts`

### Adding New Colleges

Edit `src/lib/tenant.ts`:

```typescript
export const RUB_COLLEGES = [
  {
    id: "college-id",
    name: "College Name",
    shortName: "SHORT",
    location: "Location",
    description: "Description",
    website: "https://college.edu.bt",
    programs: [
      {
        name: "Program Name",
        minMarks: 50,
        duration: "4 years",
        eligibility: "Class 12 Science",
        seats: 60
      }
    ]
  }
];
```

### Adding Careers

Edit `src/lib/tenant.ts` CAREERS_DATABASE:

```typescript
{
  id: "career-id",
  name: "Career Name",
  slug: "career-name",
  description: "Career description",
  riasecCode: "RIA",
  riasecScores: { r: 9, i: 7, a: 5 },
  skills: ["Skill1", "Skill2"],
  educationPath: ["Step 1", "Step 2"],
  subjects: ["Math", "Science"],
  workEnvironment: "Office",
  salaryRange: "Nu. 20,000 - 50,000/month",
  demandOutlook: "high",
  bhutanSpecific: true
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy

```bash
npm run build
```

### Other Platforms

The platform can be deployed to any platform that supports Next.js:
- Railway
- Render
- AWS Amplify
- Digital Ocean App Platform

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing code style
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation as needed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Royal University of Bhutan** - For the official college and program information
- **Ministry of Education and Skills Development, Bhutan** - For TTI and scholarship data
- **Clerk** - For the authentication system
- **shadcn/ui** - For the beautiful UI components
- **Next.js Team** - For the amazing framework

## Support

For support, questions, or suggestions:

- Open an issue on GitHub
- Contact: [Your Email]
- Documentation: [Full Documentation Link]

## Roadmap

- [ ] Full PostgreSQL database integration
- [ ] Enhanced AI recommendations with GPT-4
- [ ] Mobile app (React Native)
- [ ] SMS/email notifications
- [ ] Offline mode support
- [ ] Additional scholarship sources
- [ ] Alumni network integration
- [ ] Virtual career fairs

---

**Built with care for the future of Bhutan's students**
