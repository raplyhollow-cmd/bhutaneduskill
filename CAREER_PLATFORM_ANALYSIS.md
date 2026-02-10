# Career Guidance Platform - Comprehensive Analysis & Implementation Plan

## Executive Summary

This document provides a complete analysis of the Career Guidance Platform's current state, identifies gaps for national-level deployment in Bhutan, and outlines a roadmap to transform it into a production-ready, secure, and monetizable platform.

---

## 1. PROJECT SIZE & SCOPE ANALYSIS

### Current Scale (as of February 2025)

| Metric | Count |
|--------|-------|
| **Total Source Files** | 1,244 files |
| **TypeScript/TSX Files** | 226 files |
| **API Routes** | 76 endpoints |
| **Reusable Components** | 110+ components |
| **Database Tables** | 56 tables |
| **Approximate LOC** | ~56,000 lines |
| **Tech Stack** | Next.js 16.1, React 19, TypeScript, Drizzle ORM, Clerk Auth, Tailwind CSS 4 |

### Feature Coverage Matrix

| Role | Implemented Features | Missing Features |
|------|---------------------|------------------|
| **Student** | ✅ Assessments (6 types)<br>✅ Career matching<br>✅ Homework submission<br>✅ Attendance check-in<br>✅ Fee viewing<br>✅ Learning modules<br>✅ Journal | ❌ Real notifications<br>❌ Mobile app<br>❌ Offline mode<br>❌ Peer networking<br>❌ Alumni connections |
| **Teacher** | ✅ Homework creation<br>✅ Auto-grading<br>✅ Attendance taking<br>✅ Module creation<br>✅ Student insights | ❌ Bulk messaging<br>❌ Parent communication<br>❌ Lesson planning<br>❌ Resource sharing<br>❌ Professional development |
| **Parent** | ✅ Child monitoring<br>✅ Progress viewing<br>✅ Fee tracking | ❌ Direct messaging<br>❌ Payment portal<br>❌ Consent workflows<br>❌ Meeting scheduling |
| **Counselor** | ✅ Caseload management<br>✅ Student notes<br>✅ Data export | ❌ Appointment booking<br>❌ Video counseling<br>❌ Intervention tracking<br>❌ Referral system |
| **School Admin** | ✅ User management<br>✅ Fee management<br>✅ Attendance reports<br>✅ Analytics | ❌ Timetable management<br>❌ Transport management<br>❌ Library management<br>❌ Hostel management<br>❌ Inventory management |
| **Platform Admin** | ✅ Content management<br>✅ College database<br>✅ Scholarship database<br>✅ Multi-tenant oversight | ❌ System monitoring<br>❌ Audit logs viewer<br>❌ Backup management<br>❌ API key management |

---

## 2. CRITICAL SECURITY VULNERABILITIES

### High Priority Fixes (Before Production)

| Vulnerability | Severity | Location | Fix Required |
|---------------|----------|----------|-------------|
| SQL Injection | 🔴 Critical | `src/app/api/users/route.ts` | Parameterized queries |
| XSS via unsanitized input | 🔴 Critical | `src/app/api/ai/career-coach/route.ts` | Input sanitization |
| Cookie-based role manipulation | 🔴 Critical | `src/middleware.ts` | Server-side session validation |
| No rate limiting | 🔴 Critical | All API routes | Rate limiter middleware |
| File upload bypass | 🟠 High | `src/app/api/files/upload/route.ts` | Magic number validation |
| Open CORS | 🟠 High | API routes | Restrict origins |
| No audit trails | 🟠 High | N/A | Comprehensive audit logging |
| Plaintext passwords possible | 🟠 High | N/A | Ensure Clerk handles properly |
| Missing input validation | 🟠 High | Forms | Zod validation everywhere |

### Security Architecture Required

```typescript
// Essential security layers needed:
1. Rate Limiting Middleware (express-rate-limit or Vercel rate limits)
2. Input Validation Layer (Zod schemas for all inputs)
3. SQL Injection Prevention (Drizzle prepared statements)
4. XSS Prevention (DOMPurify for user content)
5. CSRF Protection (Next.js built-in + double-submit cookie)
6. File Upload Security (file type validation, size limits, virus scanning)
7. Audit Logging (all data access/modification)
8. Encryption at rest (sensitive fields)
9. API Security (API keys, OAuth for integrations)
10. Session Management (Clerk JWT validation on every request)
```

---

## 3. MISSING FEATURES FOR NATIONAL-LEVEL DEPLOYPMENT

### A. Infrastructure & Scalability

```
CURRENT: Single SQLite database, no caching, no CDN
REQUIRED FOR NATIONAL:
├── Load Balancer (Vercel/AWS ALB)
├── Read Replicas (PostgreSQL with read replicas)
├── Caching Layer (Redis for sessions, cache)
├── CDN (Cloudflare/Vercel Edge for static assets)
├── File Storage (S3/R2 with CloudFront)
├── Message Queue (Bull/Redis for background jobs)
├── Monitoring (Sentry, Datadog, or New Relic)
└── Backup System (Automated daily backups with retention)
```

### B. Communication & Notification System

```
REQUIRED:
├── Email Service (SendGrid/Amazon SES)
│   ├── Verification emails
│   ├── Password reset
│   ├── Notification emails
│   └── Report generation
├── SMS Integration (Bhutan Telecom / BIPS)
│   ├── OTP verification
│   ├── Attendance alerts
│   ├── Fee reminders
│   └── Emergency announcements
├── Push Notifications (OneSignal/Firebase)
│   ├── Mobile app notifications
│   └── Browser notifications
└── In-App Messaging
    ├── Teacher-Parent messaging
    ├── Counselor-Student messaging
    └── Group announcements
```

### C. Payment & Financial Integration

```
CURRENT: Mock payment data
REQUIRED FOR BHUTAN:
├── Payment Gateways
│   ├── BIPS (Bhutan Immediate Payment System)
│   ├── ePay (Bhutan)
│   ├── MobiBis (Bhutan mobile money)
│   ├── India: UPI integration
│   └── International: Stripe/PayPal
├── Fee Management
│   ├── Online payment processing
│   ├── Payment reminders
│   ├── Receipt generation
│   ├── Refund processing
│   └── Financial reports (TDS, GST)
└── Tuition Marketplace Payments
    ├── Escrow system
    ├── Tutor payouts
    ├── Commission tracking (20%)
    └── Tax document generation (Form 16)
```

### D. Advanced Academic Features

```
MISSING BUT REQUIRED:
├── Timetable Management
│   ├── Class scheduling
│   ├── Teacher allocation
│   ├── Room assignment
│   ├── Exam scheduling
│   └── Conflict detection
├── Transport Management
│   ├── Route management
│   ├── Vehicle tracking
│   ├── Driver management
│   └── Bus attendance
├── Library Management
│   ├── Book catalog
│   ├── Issue/return
│   ├── Fine calculation
│   └── Barcode/RFID
├── Hostel Management
│   ├── Room allocation
│   ├── Attendance tracking
│   ├── Visitor management
│   └── Mess/meal management
├── Health Management
│   ├── Medical records
│   ├── Vaccination tracking
│   ├── Health checkups
│   └── Emergency contacts
└── Inventory Management
    ├── Asset tracking
    ├── Stock management
    ├── Purchase orders
    └── Issuance tracking
```

### E. Compliance & Reporting

```
REQUIRED FOR BHUTAN GOVERNMENT:
├── BCSE Examination Integration
│   ├── Class 10 results import
│   ├── Class 12 results import
│   └── Automatic transcript generation
├── RUB Integration
│   ├── Program application
│   ├── Merit position calculation
│   └── Admission tracking
├── Scholarship Portal
│   ├── Government scholarships
│   ├── Private scholarships
│   └── Application tracking
├── Government Reports
│   ├── Annual statistical returns
│   ├── Enrollment reports
│   ├── Staff reports
│   └── Financial reports
└── Audit Compliance
    ├── Data access logs
    ├── Change history
    ├── User activity logs
    └── Security incident reports
```

---

## 4. USER EXPERIENCE BY ROLE

### Student Journey

```
LOGIN (Clerk)
    ↓
DASHBOARD
    ├── My Classes (timetable, homework)
    ├── My Assessments (RIASEC, MBTI, DISC)
    ├── My Progress (grades, attendance)
    ├── My Career Plan (6-phase model)
    ├── My Fees (pay online, view receipts)
    ├── My Learning (enrolled courses)
    ├── Tuition (find tutors)
    └── My Journal (career reflections)
```

### Teacher Journey

```
LOGIN (Clerk)
    ↓
DASHBOARD
    ├── My Classes (student list, timetable)
    ├── Take Attendance (quick/bulk)
    ├── Create Homework (8 question types)
    ├── Grade Submissions (auto-grade + manual)
    ├── Create Learning Modules
    ├── View Student Analytics
    ├── Communicate with Parents
    └── My Schedule (classes, duties)
```

### School Admin Journey

```
LOGIN (Clerk)
    ↓
DASHBOARD
    ├── Manage Students (enroll, promote, transfer)
    ├── Manage Teachers (assign classes, subjects)
    ├── Manage Classes (sections, streams)
    ├── Manage Fees (structures, payments, defaulters)
    ├── Attendance Reports (daily, monthly, annual)
    ├── Academic Reports (results, analytics)
    ├── Manage Content (announcements, events)
    ├── Staff Management (leave, payroll)
    └── School Settings (terms, holidays)
```

### Platform Owner (Career - YOU)

```
ADMIN PANEL
    ├── Multi-Tenant Overview (all schools/districts)
    ├── Content Management (careers, colleges, scholarships)
    ├── User Analytics (active users, growth)
    ├── Revenue Dashboard (subscriptions, marketplace fees)
    ├── System Health (uptime, errors, performance)
    ├── Audit Logs (all system activities)
    ├── Feature Flags (enable/disable features)
    ├── API Management (keys, webhooks)
    └── Billing & Subscriptions (school payments)
```

---

## 5. MONETIZATION STRATEGY

### Revenue Streams (Ranked by Potential)

#### 1. B2B: School/District Subscriptions (Primary Revenue)

```
Pricing Model (Per School Per Year):
├── Starter: Nu. 50,000 (~$375) - Up to 200 students
├── Standard: Nu. 150,000 (~$1,125) - Up to 500 students
├── Premium: Nu. 300,000 (~$2,250) - Up to 1000 students
└── Enterprise: Custom - 1000+ students + Multi-campus

Features by Tier:
├── Starter: Core SIS (attendance, fees, reports)
├── Standard: + Career guidance, Learning, Parent portal
├── Premium: + Tuition marketplace, AI features, Custom branding
└── Enterprise: + Dedicated support, Custom integrations, On-premise option
```

#### 2. Tuition Marketplace Commission (High Margin)

```
Revenue Model:
├── 20% commission on all paid courses
├── 15% commission on live session bookings
├── Nu. 100 verification fee for tutor approval
├── Nu. 500 listing fee for premium course placement
└── Payout frequency: Weekly to tutors (bank transfer)

Example Earnings Calculation:
If 1000 tutors earn Nu. 10,000/month = Nu. 10,00,000 marketplace GMV
Platform Revenue (20%): Nu. 200,000/month = Nu. 24,00,000/year
```

#### 3. B2C: Student/Family Subscriptions (Supplementary)

```
Pricing:
├── Free: Basic assessments, career browsing
├── Plus: Nu. 200/month - Advanced reports, AI career coach
├── Pro: Nu. 500/month - Everything + Certificate courses + Priority support
└── Lifetime: Nu. 5,000 one-time

Target: 10% of students from subscribed schools pay for premium
```

#### 4. Government/NGO Partnerships

```
Revenue Sources:
├── MoESD Implementation Contract (nationwide rollout)
├── UNICEF/World Bank education projects
├── Corporate CSR partnerships (scholarship sponsorship)
└── Training programs (teacher capacity building)
```

#### 5. Additional Revenue Streams

```
├── Certification Exam Fees (RUB preparation)
├── Premium Assessments (psychometric testing)
├── Career Counseling Sessions (paid video counseling)
├── Data Analytics Reports (sold to institutions/NGOs)
├── White-label Licensing (platform for other countries)
├── API Access (for EdTech integrators)
└── Advertisement (education products/services)
```

### Projected Revenue (Bhutan Market)

```
Assumptions:
├── ~500 schools in Bhutan (primary, secondary, higher secondary)
├── 50% adoption in 3 years = 250 schools
├── Average subscription: Nu. 150,000/year
├── Tuition marketplace: 500 tutors x Nu. 10,000/month GMV

Year 3 Projection:
├── School Subscriptions: 250 x Nu. 150,000 = Nu. 3.75 Cr/year
├── Marketplace Commission: 20% of (500 x 10,000 x 12) = Nu. 1.2 Cr/year
├── B2C Premium: 5,000 students x Nu. 200/month = Nu. 1.2 Cr/year
├── Government/Partnerships: Nu. 50,00,000/year
└── TOTAL: ~Nu. 6.65 Cr/year (~$500,000 USD)
```

---

## 6. ADVANCED FEATURES FROM GLOBAL LEADERS

### Features from PowerSchool (Leader in K-12 SIS)

```
✅ Already Implemented:
├── Attendance tracking
├── Gradebook
├── Student/Parent portals
└── Reporting

❌ Missing - Add:
├── Behavior tracking (disciplinary records)
├── Health records (vaccinations, medical conditions)
├── Special education IEP tracking
├── Transportation management
├── Food service/meal tracking
├── Digital badge system (expanded)
├── Parent conference scheduling
└── Data warehouse for longitudinal analytics
```

### Features from Canvas (Leading LMS)

```
✅ Already Implemented:
├── Learning modules
└── Progress tracking

❌ Missing - Add:
├── Discussion forums (peer learning)
├── Group projects/collaboration
├── Peer review system
├── Rubric-based grading
├── Learning outcomes tracking
├── Mobile-optimized interface (PWA)
├── Calendar integration (Google Calendar)
└── Video conferencing (built-in, not third-party)
```

### Features from LinkedIn Learning (Career Development)

```
✅ Already Implemented:
├── Career assessments
└── Skill recommendations

❌ Missing - Add:
├── Skill assessments (technical tests)
├── Learning paths (curated course sequences)
├── Mentorship matching (connect with alumni/professionals)
├── Industry expert talks
├── Job board integration
├── Company pages (for sponsors/employers)
└── Professional networking features
```

### Features from Khan Academy (Personalized Learning)

```
✅ Already Implemented:
├── Video lessons (learning modules)
└── Progress tracking

❌ Missing - Add:
├── Adaptive learning algorithm (personalizes difficulty)
├── Mastery learning (must achieve 90% to advance)
├── Interactive exercises (beyond multiple choice)
├── Coach tools (parent/teacher dashboards)
├── Offline mode (PWA with service worker)
└── Multilingual content (Dzongkha support)
```

---

## 7. IMPLEMENTATION ROADMAP

### Phase 1: Security & Compliance (Weeks 1-4)
**Priority: CRITICAL - Must complete before any production deployment**

```
Week 1-2: Security Hardening
├── Implement rate limiting (Vercel/rate-limit)
├── Add input validation (Zod schemas for all API routes)
├── Fix XSS vulnerabilities (DOMPurify integration)
├── Implement proper session validation (Clerk middleware)
├── Add CSRF protection
└── File upload security (magic numbers, size limits)

Week 3: Audit & Monitoring
├── Implement comprehensive audit logging
├── Add error tracking (Sentry integration)
├── Security headers implementation
├── SQL injection prevention review
└── Penetration testing (hire external auditor)

Week 4: Compliance
├── Data encryption at rest (sensitive fields)
├── Data retention policy implementation
├── Privacy policy page
├── Terms of service page
├── Cookie consent banner
└── GDPR/Bhutan data protection compliance
```

### Phase 2: Core Platform Features (Weeks 5-12)

```
Week 5-6: Communication System
├── Email service setup (SendGrid)
├── SMS integration (Bhutan Telecom API)
├── Notification preferences
├── Email templates (verification, password reset)
├── SMS templates (OTP, alerts)
└── Push notification setup (OneSignal)

Week 7-8: Payment Integration
├── BIPS payment gateway integration
├── ePay integration
├── Fee payment processing
├── Receipt generation (PDF)
├── Refund processing
└── Financial reports

Week 9-10: Missing Academic Modules
├── Timetable management
├── Transport management
├── Library management
├── Hostel management
└── Inventory management

Week 11-12: Advanced Features
├── Parent-teacher messaging
├── Video counseling integration
├── Alumni network module
├── Job board integration
└── Professional networking features
```

### Phase 3: Mobile & Offline (Weeks 13-16)

```
Week 13-14: Progressive Web App
├── Service worker implementation
├── Offline mode for key features
├── Install prompts
├── Push notifications
└── Mobile optimization

Week 15-16: Native Apps (React Native)
├── Student app (Android priority for Bhutan)
├── Teacher app
├── Parent app
└── Admin app
```

### Phase 4: Scalability & Infrastructure (Weeks 17-20)

```
Week 17-18: Database Migration
├── SQLite → PostgreSQL migration
├── Database indexing optimization
├── Read replica setup
├── Backup automation
└── Migration scripts

Week 19-20: Performance
├── Redis caching implementation
├── CDN setup (Cloudflare)
├── Image optimization
├── API response optimization
└── Load testing
```

### Phase 5: Integration & Data Sync (Weeks 21-24)

```
Week 21-22: Government Integrations
├── BCSE results API integration
├── RUB application portal integration
├── Scholarship portal sync
├── CID (Civil Registration) data verification
└── Government SSO integration

Week 23-24: Third-Party Integrations
├── Google Classroom sync
├── Microsoft Education sync
├── Zoom/Google Meet for video sessions
├── Calendar integration
└── Payment gateway expansions
```

---

## 8. FILES TO MODIFY / CREATE

### Security Fixes (Critical)

| File | Action | Priority |
|------|--------|----------|
| `src/middleware.ts` | Implement proper session validation | P0 |
| `src/app/api/**/route.ts` | Add rate limiting to all routes | P0 |
| `src/lib/validation.ts` | Create Zod schemas | P0 |
| `src/app/api/files/upload/route.ts` | Add file magic number validation | P0 |
| `src/lib/audit-log.ts` | Create audit logging system | P0 |
| `src/lib/security.ts` | Security utilities (encryption, CSRF) | P0 |

### New Features to Create

```
/src/app/api/
├── notifications/
│   ├── send-email/route.ts
│   ├── send-sms/route.ts
│   └── preferences/route.ts
├── payments/
│   ├── bips/route.ts (Bhutan payment gateway)
│   ├── epay/route.ts
│   ├── refund/route.ts
│   └── webhook/route.ts
├── communication/
│   ├── messages/route.ts
│   ├── conversations/route.ts
│   └── announcements/route.ts
├── timetable/
│   ├── generate/route.ts
│   ├── update/route.ts
│   └── conflicts/route.ts
├── transport/
│   ├── routes/route.ts
│   ├── tracking/route.ts
│   └── attendance/route.ts
└── integrations/
    ├── bcse/route.ts
    ├── rub/route.ts
    └── government-sso/route.ts

/src/components/
├── communication/
│   ├── MessageCenter.tsx
│   ├── AnnouncementComposer.tsx
│   └── NotificationPreferences.tsx
├── payments/
│   ├── PaymentModal.tsx
│   ├── ReceiptViewer.tsx
│   └── RefundRequest.tsx
├── timetable/
│   ├── TimetableEditor.tsx
│   ├── ClassScheduler.tsx
│   └── ConflictDetector.tsx
└── integrations/
    ├── BCSEImport.tsx
    ├── RUBApplication.tsx
    └── GovernmentDataSync.tsx
```

---

## 9. ARCHITECTURE IMPROVEMENTS

### Current Architecture (Simple)

```
User → Clerk Auth → Next.js API → SQLite Database
```

### Required Architecture (Production)

```
                        ┌─────────────┐
                        │   CDN       │ (Cloudflare)
                        │  (Static)    │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │  Load Balancer│ (Vercel/AWS)
                        └──────┬───────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
  ┌─────▼─────┐        ┌─────▼─────┐        ┌─────▼─────┐
  │ Next.js   │        │ Next.js   │        │ Next.js   │
  │ Server 1  │        │ Server 2  │        │ Server N  │
  └─────┬─────┘        └─────┬─────┘        └─────┬─────┘
        │                    │                    │
        └────────┬───────────┴────────┬──────────┘
                 │                    │
        ┌────────▼─────────┐  ┌─────▼─────┐
        │  Redis Cache     │  │ PostgreSQL │ (Primary)
        │  (Sessions)      │  └─────┬─────┘
        └──────────────────┘        │
                            ┌───────▼──────┐
                            │ PostgreSQL   │ (Replica)
                            └──────────────┘

External Services:
├── Clerk (Auth)
├── SendGrid (Email)
├── Twilio/Bhutan Telecom (SMS)
├── BIPS/ePay (Payments)
├── S3/R2 (File Storage)
├── Sentry (Error Tracking)
├── OneSignal (Push Notifications)
└── DataDog (Monitoring)
```

---

## 10. MONETIZATION IMPLEMENTATION

### Subscription System Architecture

```typescript
// Required tables to add:
subscriptions {
  id: string
  schoolId: string
  plan: 'starter' | 'standard' | 'premium' | 'enterprise'
  status: 'active' | 'trialing' | 'past_due' | 'cancelled'
  startDate: Date
  endDate: Date
  studentLimit: number
  features: string[] (JSON)
}

subscriptionPayments {
  id: string
  subscriptionId: string
  amount: number
  currency: string
  method: string
  status: string
  transactionId: string
}

featureUsage {
  id: string
  schoolId: string
  feature: string
  usageCount: number
  period: string (month)
}
```

### Pricing Page Implementation

```typescript
// Required pages:
/src/app/pricing/page.tsx (Public pricing page)
/src/app/billing/page.tsx (School billing management)
/src/app/admin/subscriptions/page.tsx (Subscription management)
/src/app/api/subscriptions/checkout/route.ts (Payment processing)
/src/app/api/webhooks/payment/route.ts (Payment confirmation)
```

---

## 11. VERIFICATION & TESTING CHECKLIST

### Security Testing

```
□ SQL injection testing (SQLMap)
□ XSS testing (user inputs)
□ CSRF testing
□ Authentication bypass testing
□ Authorization testing (cross-role access)
□ Rate limiting testing
□ File upload security testing
□ Session management testing
□ API security testing (OWASP ZAP)
□ Third-party dependency scanning (npm audit)
```

### Performance Testing

```
□ Load testing (Artillery/K6) - Target 10,000 concurrent users
□ Database query optimization (EXPLAIN ANALYZE)
□ API response time testing (<200ms p95)
□ Frontend performance (Lighthouse score >90)
□ Mobile performance testing
□ CDN effectiveness testing
□ Cache hit rate monitoring
```

### Functional Testing

```
□ All user role workflows (student, teacher, parent, counselor, admin)
□ Assessment flow (complete, save draft, submit, view results)
□ Homework flow (create, assign, submit, grade, feedback)
□ Attendance flow (check-in, mark, reports, export)
□ Fee flow (structure, payment, receipt, reports)
□ Tuition flow (tutor signup, course creation, enrollment, payment)
□ Communication flow (email, SMS, notifications)
```

---

## 12. RECOMMENDED NEXT ACTIONS

### Immediate (This Week)
1. **Fix Critical Security Vulnerabilities** - All P0 items
2. **Implement Rate Limiting** - Prevent abuse
3. **Add Audit Logging** - Track all data access
4. **Review Clerk Integration** - Ensure proper auth

### Short Term (This Month)
1. **Set Up Monitoring** - Sentry for errors, analytics for usage
2. **Implement Email Notifications** - SendGrid integration
3. **Create Production Database** - Migrate to PostgreSQL
4. **Add Input Validation** - Zod schemas everywhere

### Medium Term (Next Quarter)
1. **Payment Integration** - BIPS/ePay for Bhutan
2. **SMS Integration** - Bhutan Telecom
3. **Communication Features** - Messaging system
4. **Mobile PWA** - Offline capability

### Long Term (Next 6 Months)
1. **Native Mobile Apps** - React Native
2. **Government Integrations** - BCSE, RUB
3. **Advanced Features** - Timetable, Transport, etc.
4. **Marketplace Launch** - Tutor platform
5. **Subscription System** - Monetization

---

## Sources Referenced

### Security & Compliance
- [SIS Security Best Practices](https://www.classe365.com/blog/student-information-system-best-practices-k12-schools/)
- [Modern SIS Security Features 2025](https://www.academiaerp.com/blog/digital-campus-revolution-how-modern-student-information-systems-transform-higher-education-operations-in-2025/)
- [Student Information Systems Security](https://moderncampus.com/blog/what-to-look-for-in-a-student-information-system-for-high-ed.html)

### Market Research
- [School Management Systems Guide 2026](https://www.classter.com/blog/edtech/a-guide-to-school-management-systems-in-2026/)
- [Bhutan Education Technology Framework](https://education.gov.bt/download/education-technology-framework-etf/)
- [Bhutan EU Education Partnership](https://www.unicef.org/bhutan/press-releases/bhutan-and-eu-jointly-launch-education-technology-framework-transform-school)

### Monetization
- [EdTech 2026-2030 Business Models](https://www.linkedin.com/pulse/edtech-20262030-smart-business-models-subhadeep-dutta-pa8gc)
- [SaaS Business Model Trends 2026](https://rightleftagency.com/saas-business-model-strategy-metrics-and-trends/)
- [Freemium Business Model Templates](https://www.slideteam.net/blog/top-10-freemium-business-model-templates-with-examples-and-samples)

### Payment Integration
- [Accepting Payments in Bhutan](https://payatlas.com/countries/bhutan-bt/)
- [Bhutan Payment Systems](https://www.afi-global.org/wp-content/uploads/2024/10/AFI_Bhutan_MS_AW2_digital.pdf)
- [School Management Software in Bhutan](https://www.geniusedusoft.com/global-education-erp-system/bhutan-school-management-software.html)
