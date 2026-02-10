# Onboarding & Setup Wizard

## Overview

A guided wizard for first-time users to set up their accounts and get familiar with the system. Different user types need different onboarding flows.

---

## Wizard Flows by User Type

### 1. Platform Admin (First User - System Setup)
```
Step 1: Welcome
├── Platform name
├── Admin contact details
└── Get started button

Step 2: Organization Setup
├── Organization name
├── Logo upload
├── Theme color selection
└── Timezone

Step 3: Admin Account
├── Full name
├── Email (becomes username)
├── Password
└── Security question

Step 4: First School
├── School name
├── School code (auto-generated)
├── Address, district, country
└── Contact person

Step 5: Complete
├── Dashboard preview
├── Create more schools OR invite school admin
└── Go to dashboard
```

### 2. School Admin (New School Registration)
```
Step 1: Find Your School
├── Enter school code
├── OR search by school name
├── OR register new school
└── Verify with email/phone

Step 2: Personal Details
├── Full name
├── Email
├── Phone
├── Position (Principal/Vice-Principal)
└── Government ID (optional)

Step 3: School Setup
├── Academic year settings
├── Grade levels (Class 6-12)
├── Number of students (approx)
├── Number of teachers (approx)
└── School type (Middle/Secondary)

Step 4: Quick Configuration
├── Choose modules to enable (checklist)
├── Set fee structure (basic)
├── Configure periods/timings
└── Add subjects

Step 5: Import or Add Data
├── Import students (Excel/CSV)
├── Import teachers (Excel/CSV)
├── Add manually (skip import)
└── Bulk invite option

Step 6: Complete
├── Dashboard tour
├── First tasks checklist
└── Go to dashboard
```

### 3. Teacher (New Teacher Joining)
```
Step 1: Find Your School
├── Enter school code
├── OR select from registered schools
└── Verify employment

Step 2: Personal Details
├── Full name
├── Email
├── Phone
├── Employee ID (if provided)
└── Qualifications

Step 3: Subject Assignment
├── Select subjects you teach
├── Select classes you teach
├── Upload qualification documents
└── Set availability

Step 4: Profile Setup
├── Profile photo
├── Bio/introduction
├── Specializations
└── Contact preferences

Step 5: Complete
├── Dashboard tour
├── Create first homework
└── Go to dashboard
```

### 4. Student (New Student Registration)
```
Step 1: Find Your School
├── Enter school code
├── OR select from registered schools
└── Verify enrollment

Step 2: Personal Details
├── Full name
├── Date of birth
├── Gender
├── Blood group
├── Student ID (if provided)
└── Photo upload

Step 3: Academic Details
├── Class/Grade
├── Section
├── Roll number
├── Academic year
└── Previous school details

Step 4: Guardian Information
├── Parent/guardian name
├── Relationship
├── Phone (primary)
├── Phone (alternate)
├── Email
└── Address

Step 5: Career Interests (Optional)
├── Take career assessment (RIASEC)
├── Skip for later
└── Go to dashboard

Step 6: Complete
├── Welcome video (2 min)
├── Dashboard tour
└── Explore features
```

### 5. Parent (New Parent Registration)
```
Step 1: Find Your School
├── Enter school code
├── OR select from registered schools
└── Verify with phone/email

Step 2: Personal Details
├── Full name
├── Email
├── Phone
├── Relationship to student(s)
└── Government ID

Step 3: Link Children
├── Add child (student ID)
├── Verify with OTP/phone
├── Add more children
└── Skip if children already registered

Step 4: Communication Preferences
├── SMS notifications
├── Email notifications
├── App notifications
├── Language preference (English/Dzongkha)
└── Frequency

Step 5: Complete
├── Dashboard tour
├── View child's progress
└── Go to dashboard
```

### 6. Counselor (New Counselor Registration)
```
Step 1: Find Your School
├── Enter school code
├── Verify counselor status
└── License number (if applicable)

Step 2: Personal Details
├── Full name
├── Email
├── Phone
├── Qualifications
└── Specializations

Step 3: Setup Preferences
├── Caseload capacity
├── Availability schedule
├── Session duration options
└── Notification preferences

Step 4: Complete
├── Dashboard tour
├── View assigned students
└── Go to dashboard
```

---

## Wizard Components Needed

### 1. Progress Indicator
```tsx
<WizardSteps current={3} total={5}>
  <Step completed>Account</Step>
  <Step completed>School</Step>
  <Step active>Profile</Step>
  <Step>Preferences</Step>
  <Step>Complete</Step>
</WizardSteps>
```

### 2. Step Validation
- Each step validates before proceeding
- Show errors inline
- Disable "Next" until valid
- Save progress automatically

### 3. Skip Option
- Allow optional steps to be skipped
- Mark skipped steps for later completion
- Show reminder for incomplete setup

### 4. School Code Lookup
```tsx
// Real-time school code validation
<InputGroup>
  <Input
    placeholder="Enter school code (e.g., RHS-2026)"
    onChange={validateSchoolCode}
  />
  {schoolFound && (
    <Badge variant="success">
      {schoolName} - {schoolLocation}
    </Badge>
  )}
</InputGroup>
```

### 5. File Upload
```tsx
// For bulk import
<FileUpload
  accept=".xlsx,.csv"
  onUpload={handleImport}
  templateUrl="/templates/student-import.xlsx"
/>
```

### 6. Completion Checklist
```tsx
<SetupChecklist>
  <ChecklistItem complete>Account created</ChecklistItem>
  <ChecklistItem complete>School linked</ChecklistItem>
  <ChecklistItem active>Profile setup</ChecklistItem>
  <ChecklistItem>Take assessment</ChecklistItem>
  <ChecklistItem>Explore dashboard</ChecklistItem>
</SetupChecklist>
```

---

## Technical Implementation

### Routes
```
/setup                          → Entry point, detects user type
/setup/admin                    → Platform admin setup
/setup/school                    → School admin setup
/setup/teacher                  → Teacher setup
/setup/student                   → Student setup
/setup/parent                   → Parent setup
/setup/counselor                → Counselor setup
/setup/complete                 → Setup completion
```

### State Management
```typescript
// Store wizard progress
interface WizardState {
  currentStep: number
  userType: 'admin' | 'school' | 'teacher' | 'student' | 'parent' | 'counselor'
  data: {
    // Collected form data
  }
  completed: boolean
  skippedSteps: string[]
}
```

### Database Tables
```typescript
// Track setup status
wizard_progress {
  id: string
  user_id: string
  current_step: number
  completed: boolean
  data: JSON  // Store collected data
  created_at: timestamp
  updated_at: timestamp
}
```

---

## Post-Wizard Experience

### First Login Dashboard
```
┌─────────────────────────────────────┐
│  Welcome, [Name]! 👋               │
│                                     │
│  Complete your setup to get full   │
│  access to all features.            │
│                                     │
│  Progress: ████████░░ 80%          │
│                                     │
│  Remaining tasks:                   │
│  ☐ Take career assessment          │
│  ☐ Add profile photo               │
│  ☐ Complete school verification    │
│                                     │
│  [Continue Setup]  [Skip for Now]  │
└─────────────────────────────────────┘
```

### Smart Reminders
- Show banner on dashboard until setup complete
- Send reminder emails (3, 7, 14 days)
- Show progress in settings page
- Offer "Resume Setup" button

---

## Best Practices

1. **Keep it short** - Max 5-6 steps per wizard
2. **Show progress** - Always indicate where user is
3. **Allow exit** - Save progress, allow resume later
4. **Provide help** - Tooltip and support link on each step
5. **Celebrate completion** - Confetti, welcome message, reward
6. **Mobile first** - Many users on mobile
7. **Accessible** - Keyboard navigation, screen reader support

---

## School Code Format

Recommended format for Bhutan:
```
[SCHOOL_ABBR]-[DISTRICT_CODE]-[YEAR]

Examples:
RHS-THI-2026  (Royal High School - Thimphu - 2026)
LHSS-PUN-2026  (LHSS - Punakha - 2026)
YCSE-BUM-2026  (Yangchenphug HSS - Bumthang - 2026)
```

Auto-generate and display during school registration.
