# Phase 2: Vision Completion - Task List
## Bhutan EduSkill Platform

**Start Date:** February 17, 2026
**Estimated Duration:** 3-4 weeks
**Goal:** Close gaps between original vision and current implementation

---

## BATCH 18: Report Card PDF Generation (12 hours)

### Tasks
- [ ] 18.1 Create report card template system (2h)
  - File: `src/lib/report-cards/templates.ts`
  - Support multiple templates (primary, middle, secondary)
  - Customizable school branding

- [ ] 18.2 Create report card data aggregation API (3h)
  - File: `src/app/api/school-admin/report-cards/[studentId]/route.ts`
  - Aggregate marks by subject
  - Calculate attendance percentage
  - Include teacher remarks
  - Include rank/position

- [ ] 18.3 Create PDF generation service (4h)
  - File: `src/lib/pdf/report-card-generator.ts`
  - Use jsPDF or similar
  - Support school logo
  - Support principal signature
  - Support parent signature line

- [ ] 18.4 Create UI pages (2h)
  - File: `src/app/school-admin/report-cards/page.tsx`
  - File: `src/app/parent/report-cards/page.tsx`
  - Class-wise generation
  - Individual student download
  - Email to parents option

- [ ] 18.5 Add database table (1h)
  - Table: `report_cards`
  - Track generated report cards
  - Store PDF URLs

---

## BATCH 19: ID Card Generation System (8 hours)

### Tasks
- [ ] 19.1 Create ID card template system (2h)
  - File: `src/lib/id-cards/templates.ts`
  - Student ID template
  - Teacher ID template
  - Staff ID template

- [ ] 19.2 Create QR/Barcode generation service (2h)
  - File: `src/lib/id-cards/qr-generator.ts`
  - Use qrcode library
  - Encode student/teacher ID
  - Verification endpoint

- [ ] 19.3 Create PDF/image generation (2h)
  - File: `src/lib/id-cards/generator.ts`
  - Front and back design
  - Photo upload support
  - School logo

- [ ] 19.4 Create UI pages (2h)
  - File: `src/app/school-admin/id-cards/page.tsx`
  - Bulk generation
  - Individual download
  - Print preview

---

## BATCH 20: Notice Board System (5 hours)

### Tasks
- [ ] 20.1 Add database table (1h)
  - Table: `notices`
  - Fields: title, content, targetAudience, priority, expiryDate

- [ ] 20.2 Create notice CRUD API (2h)
  - File: `src/app/api/notices/route.ts`
  - Create, read, update, delete notices
  - Target audience filtering
  - Pin important notices

- [ ] 20.3 Create notice board components (2h)
  - File: `src/components/notices/notice-board.tsx`
  - File: `src/components/notices/notice-card.tsx`
  - Priority badges
  - Expiry indicators

- [ ] 20.4 Add to portals (1h)
  - School admin: Create/manage notices
  - Student/Teacher/Parent: View notices
  - Dashboard widget

---

## BATCH 21: Events Calendar (6 hours)

### Tasks
- [ ] 21.1 Add database table (1h)
  - Table: `events`
  - Fields: title, description, startDate, endDate, type, location

- [ ] 21.2 Create events CRUD API (2h)
  - File: `src/app/api/events/route.ts`
  - Calendar view data
  - Event creation/editing
  - RSVP tracking

- [ ] 21.3 Create calendar components (3h)
  - File: `src/components/calendar/month-view.tsx`
  - File: `src/components/calendar/event-modal.tsx`
  - Holiday indicators
  - Exam schedule indicators

- [ ] 21.4 Add academic calendar management (1h)
  - Import holidays
  - Term dates
  - Exam schedules

---

## BATCH 22: Gate Pass System (8 hours)

### Tasks
- [ ] 22.1 Add database table (1h)
  - Table: `gate_passes`
  - Fields: studentId, type, reason, exitTime, entryTime, parentApproval, status

- [ ] 22.2 Create gate pass API (3h)
  - File: `src/app/api/student/gate-pass/route.ts`
  - Student request creation
  - Parent approval endpoint
  - Gate keeper verification (QR)
  - Exit/entry logging

- [ ] 22.3 Create gate pass UI (3h)
  - File: `src/app/student/gate-pass/page.tsx`
  - File: `src/app/school-admin/gate-pass/page.tsx`
  - Request form
  - Approval interface
  - QR display

- [ ] 22.4 Create parent approval flow (1h)
  - File: `src/app/parent/gate-approvals/page.tsx`
  - Notification for new requests
  - Approve/reject interface

---

## BATCH 23: Alumni Management (10 hours)

### Tasks
- [ ] 23.1 Add database tables (2h)
  - Table: `alumni`
  - Table: `alumni_events`
  - Table: `alumni_success_stories`

- [ ] 23.2 Create alumni API (3h)
  - File: `src/app/api/alumni/route.ts`
  - Profile management
  - Success stories
  - Event registration
  - Mentorship signup

- [ ] 23.3 Create alumni portal (4h)
  - File: `src/app/alumni/page.tsx`
  - Directory view
  - Success stories
  - Events
  - Networking

- [ ] 23.4 Integration with student data (1h)
  - Auto-graduate students
  - Track alumni outcomes

---

## BATCH 24: Payroll System (12 hours)

### Tasks
- [ ] 24.1 Add database tables (2h)
  - Table: `payroll`
  - Table: `salary_structure`
  - Table: `allowances`
  - Table: `deductions`

- [ ] 24.2 Create payroll calculation engine (4h)
  - File: `src/lib/payroll/calculator.ts`
  - Base salary
  - Allowances (DA, HRA, TA)
  - Deductions (PF, tax, insurance)
  - Leave encashment

- [ ] 24.3 Create payroll API (3h)
  - File: `src/app/api/school-admin/payroll/route.ts`
  - Monthly payroll generation
  - Pay slip download
  - Payment status tracking

- [ ] 24.4 Create payroll UI (3h)
  - File: `src/app/school-admin/payroll/page.tsx`
  - Salary structure config
  - Monthly payroll run
  - Pay slip preview

---

## BATCH 25: Infirmary/Medical Records (8 hours)

### Tasks
- [ ] 25.1 Add database table (1h)
  - Table: `medical_records`
  - Fields: studentId, condition, treatment, date, doctor

- [ ] 25.2 Create medical API (2h)
  - File: `src/app/api/student/medical/route.ts`
  - Medical history
  - Vaccination records
  - Medicine inventory

- [ ] 25.3 Create medical UI (3h)
  - File: `src/app/student/medical/page.tsx`
  - File: `src/app/school-admin/medical/page.tsx`
  - Medical profile
  - Visit logging
  - Vaccination tracker

- [ ] 25.4 Emergency contacts integration (1h)
  - Quick access for emergencies
  - Allergy alerts

---

## BATCH 26: BCSE Integration (16 hours)

### Tasks
- [ ] 26.1 Research BCSE data format (2h)
  - Understand result import format
  - Document specification

- [ ] 26.2 Create BCSE import service (4h)
  - File: `src/lib/bcse/importer.ts`
  - CSV/Excel import
  - Data validation
  - Error handling

- [ ] 26.3 Create scholarship eligibility calculator (4h)
  - File: `src/lib/bcse/scholarship-eligibility.ts`
  - Government scholarship rules
  - College recommendations

- [ ] 26.4 Create BCSE UI (4h)
  - File: `src/app/admin/bcse/page.tsx`
  - Import interface
  - Result viewing
  - Scholarship eligibility

- [ ] 26.5 Integration with student profiles (2h)
  - Auto-update from BCSE results
  - Career plan adjustments

---

## BATCH 27: RUB College Portal (12 hours)

### Tasks
- [ ] 27.1 Add RUB college database (3h)
  - Table: `rub_colleges`
  - Table: `rub_programs`
  - Table: `rub_eligibility`

- [ ] 27.2 Create RUB program explorer (3h)
  - File: `src/components/rub/program-explorer.tsx`
  - College information
  - Program requirements
  - Seat availability

- [ ] 27.3 Create application tracking (4h)
  - File: `src/app/student/rub-applications/page.tsx`
  - Application status
  - Document upload
  - Admission tracking

- [ ] 27.4 Create predictor (2h)
  - File: `src/lib/ai/rub-predictor.ts`
  - Admission probability
  - Program recommendations

---

## BATCH 28: Scholarship Portal (12 hours)

### Tasks
- [ ] 28.1 Add scholarship database (2h)
  - Table: `scholarships`
  - Government and private scholarships
  - Eligibility criteria

- [ ] 28.2 Create scholarship matching (4h)
  - File: `src/lib/scholarships/matcher.ts`
  - Match based on academics
  - Match based on income
  - Match based on career goals

- [ ] 28.3 Create application tracking (4h)
  - File: `src/app/student/scholarships/page.tsx`
  - Application workflow
  - Document submission
  - Status tracking

- [ ] 28.4 Ministry scholarship management (2h)
  - File: `src/app/ministry/scholarships/page.tsx`
  - Government scholarships
  - Application approval
  - Disbursement tracking

---

## BATCH 29: Data Import/Export (10 hours)

### Tasks
- [ ] 29.1 Create bulk import service (4h)
  - File: `src/lib/data-import/bulk-import.ts`
  - Student import
  - Teacher import
  - Excel/CSV validation

- [ ] 29.2 Create export service (3h)
  - File: `src/lib/data-export/exporter.ts`
  - Custom report builder
  - CSV/Excel/PDF export

- [ ] 29.3 Create UI (3h)
  - File: `src/app/school-admin/data-migration/page.tsx`
  - Import wizard
  - Export builder

---

## BATCH 30: School Branding/Customization (8 hours)

### Tasks
- [ ] 30.1 Add branding settings table (1h)
  - Table: `school_branding`
  - Logo, colors, themes

- [ ] 30.2 Create branding API (2h)
  - File: `src/app/api/school-admin/branding/route.ts`
  - Logo upload
  - Color customization
  - Template selection

- [ ] 30.3 Apply branding to portals (4h)
  - Dynamic theming
  - Logo injection
  - Custom report cards
  - Custom ID cards

- [ ] 30.4 Custom fields support (1h)
  - User-defined fields
  - Custom form fields

---

## Progress Tracking

| Batch | Status | Hours | Completed |
|-------|--------|-------|-----------|
| BATCH 18: Report Cards | ⏳ Pending | 12h | |
| BATCH 19: ID Cards | ⏳ Pending | 8h | |
| BATCH 20: Notice Board | ⏳ Pending | 5h | |
| BATCH 21: Events Calendar | ⏳ Pending | 6h | |
| BATCH 22: Gate Pass | ⏳ Pending | 8h | |
| BATCH 23: Alumni | ⏳ Pending | 10h | |
| BATCH 24: Payroll | ⏳ Pending | 12h | |
| BATCH 25: Medical | ⏳ Pending | 8h | |
| BATCH 26: BCSE Integration | ⏳ Pending | 16h | |
| BATCH 27: RUB Portal | ⏳ Pending | 12h | |
| BATCH 28: Scholarships | ⏳ Pending | 12h | |
| BATCH 29: Import/Export | ⏳ Pending | 10h | |
| BATCH 30: Branding | ⏳ Pending | 8h | |
| **TOTAL** | | **127h** | **0%** |

---

*Task List Created: February 17, 2026*
*Phase 2: Vision Completion*
