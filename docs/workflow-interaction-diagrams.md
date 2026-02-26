# Workflow Innovation - Interaction Diagrams
## Visual Flows for Next-Gen User Experiences

**Companion to:** [workflow-innovation-report.md](./workflow-innovation-report.md)
**Last Updated:** February 25, 2026

---

## Visual Interaction Diagrams

This document provides ASCII diagrams and flow descriptions for each redesigned workflow.

---

## 1. Student Onboarding Flow

### Before (Traditional Wizard)

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT ONBOARDING (OLD)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1/5: Select Role                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                      │
│  │Student│ │Teacher│ │Parent│ │Counselor│                     │
│  └──────┘ └──────┘ └──────┘ └──────┘                      │
│                    ↓                                        │
│  Step 2/5: Find School                                     │
│  ┌─────────────────────────────────┐                       │
│  │ Search: [_____________]         │                       │
│  │                                 │                       │
│  │ • Motlhare School               │                       │
│  │ • Yangchenphug HSS              │                       │
│  └─────────────────────────────────┘                       │
│                    ↓                                        │
│  Step 3/5: Personal Details                                │
│  ┌─────────────────────────────────┐                       │
│  │ First Name [__________]         │                       │
│  │ Last Name  [__________]         │                       │
│  │ Email      [__________]         │                       │
│  │ Phone      [__________]         │                       │
│  │ DOB        [__________]         │                       │
│  │ Gender     [Select ▾]           │                       │
│  └─────────────────────────────────┘                       │
│                    ↓                                        │
│  Step 4/5: Academic Info                                   │
│  ┌─────────────────────────────────┐                       │
│  │ Grade      [Select ▾]           │                       │
│  │ Section    [Select ▾]           │                       │
│  │ Roll No    [__________]         │                       │
│  │ Admission  [__________]         │                       │
│  └─────────────────────────────────┘                       │
│                    ↓                                        │
│  Step 5/5: Parent Info                                     │
│  ┌─────────────────────────────────┐                       │
│  │ Parent Name [__________]        │                       │
│  │ Relation    [Select ▾]          │                       │
│  │ Phone       [__________]        │                       │
│  │ Email       [__________]        │                       │
│  └─────────────────────────────────┘                       │
│                    ↓                                        │
│              [Complete Setup]                               │
│                                                             │
│  ⏱️ Time: ~8 minutes   🖱️ Clicks: ~35   😓 Friction: HIGH │
└─────────────────────────────────────────────────────────────┘
```

### After (Conversational Canvas)

```
┌─────────────────────────────────────────────────────────────┐
│              STUDENT ONBOARDING (NEW)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │                                          │               │
│  │   Welcome to Bhutan EduSkill! 👋        │               │
│  │                                          │               │
│  │   I'm your setup assistant. Let's get    │               │
│  │   you started in seconds, not minutes.   │               │
│  │                                          │               │
│  │   [Student] [Teacher] [Parent]           │               │
│  │                                          │               │
│  │   Or press Cmd+K to tell me what         │               │
│  │   you need                               │               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                    ↓ (clicks Student)                      │
│  ┌─────────────────────────────────────────┐               │
│  │                                          │               │
│  │   Hi there! What's your name?            │               │
│  │                                          │               │
│  │   [Karma Dorji                     ]     │               │
│  │                                          │               │
│  │   ✨ Detected: Motlhare School            │               │
│  │      (based on your location)            │               │
│  │                                          │               │
│  │   [That's right ✓] [Different school]    │               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                    ↓ (confirms school)                     │
│  ┌─────────────────────────────────────────┐               │
│  │                                          │               │
│  │   Nice to meet you, Karma! 🎓           │               │
│  │                                          │               │
│  │   What grade are you in?                 │               │
│  │                                          │               │
│  │   [ 6 ] [ 7 ] [ 8 ] [ 9 ] [10 ]          │               │
│  │                                          │               │
│  │   (Keyboard: 6-12, Enter to confirm)     │               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                    ↓ (presses 8)                           │
│  ┌─────────────────────────────────────────┐               │
│  │                                          │               │
│  │   Awesome! Grade 8.                      │               │
│  │                                          │               │
│  │   Almost done! Just need your parent's   │               │
│  │   phone for safety.                      │               │
│  │                                          │               │
│  │   [+975                            ]     │               │
│  │                                          │               │
│  │   [Skip for now]                         │               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                    ↓ (enters phone or skips)                │
│  ┌─────────────────────────────────────────┐               │
│  │                                          │               │
│  │   ✓ You're all set, Karma!               │               │
│  │                                          │               │
│  │   Your classroom is waiting.             │               │
│  │                                          │               │
│  │   [Enter Dashboard →]                    │               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  ⏱️ Time: ~45 seconds  🖱️ Clicks: ~6  ✨ Friction: MINIMAL│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Quick Add Teacher Flow

### Before (Full Form Modal)

```
┌─────────────────────────────────────────────────────────────┐
│                     ADD TEACHER (OLD)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │  Personal Information                   │               │
│  │  First Name [__________] *              │               │
│  │  Last Name  [__________] *              │               │
│  │  Email      [__________] *              │               │
│  │  Phone      [__________] *              │               │
│  │  DOB        [__________]                │               │
│  │  Gender     [Select ▾]                  │               │
│  ├─────────────────────────────────────────┤               │
│  │  Employment Information                │               │
│  │  Employee ID [__________] *             │               │
│  │  Join Date  [__________]                │               │
│  │  Type       [Select ▾]                  │               │
│  │  Department [Select ▾]                  │               │
│  ├─────────────────────────────────────────┤               │
│  │  Qualification                          │               │
│  │  Highest    [__________] *              │               │
│  │  Experience [__________] *              │               │
│  │  Special    [__________]                │               │
│  ├─────────────────────────────────────────┤               │
│  │  Subjects (select at least one)         │               │
│  │  [✓] Math [ ] Eng [ ] Sci [ ] Dzo ...  │               │
│  ├─────────────────────────────────────────┤               │
│  │  Address                                │               │
│  │  Street     [__________]                │               │
│  │  District   [Select ▾]                  │               │
│  │  City       [__________]                │               │
│  ├─────────────────────────────────────────┤               │
│  │  [Cancel]             [Add Teacher →]   │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  ⏱️ Time: ~12 minutes  😓 Fields: 25+                      │
└─────────────────────────────────────────────────────────────┘
```

### After (Express Add Modal)

```
┌─────────────────────────────────────────────────────────────┐
│                   ADD TEACHER (NEW)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Teachers Page:                                            │
│  ┌─────────────────────────────────────────┐               │
│  │  Teachers                    [+ Add]    │ ← Click        │
│  │  ─────────────────────────────────────────              │
│  │  Search...                    [Import CSV]              │
│  └─────────────────────────────────────────┘               │
│                    ↓                                        │
│  ┌─────────────────────────────────────────┐               │
│  │  ┌─────────────────────────────────┐    │               │
│  │  │  Add Teacher                    │    │               │
│  │  │  ─────────────────────────────── │    │               │
│  │  │                                  │    │               │
│  │  │  Name or Email                   │    │               │
│  │  │  [karma.dorji@school.edu.bt]    │    │               │
│  │  │                                  │    │               │
│  │  │  ─────────────────────────────── │    │               │
│  │  │  ✨ Detected from email:          │    │               │
│  │  │     • School: Your School ✓      │    │               │
│  │  │     • Role: Teacher              │    │               │
│  │  │                                  │    │               │
│  │  │  [Quick Add →]  [Customize]      │    │               │
│  │  └─────────────────────────────────┘    │               │
│  │                                          │               │
│  │  Tip: Press Enter to add quickly         │               │
│  └─────────────────────────────────────────┘               │
│                    ↓ (presses Enter)                        │
│  ┌─────────────────────────────────────────┐               │
│  │                                          │               │
│  │   ✓ Teacher Added!                       │               │
│  │                                          │               │
│  │   Karma Dorji is now in your system.     │               │
│  │                                          │               │
│  │   [Go to Profile]  [Add Another]         │               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  ⏱️ Time: ~15 seconds  😊 Fields: 1 (email/name)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Command Palette Flow

### The Universal Action Interface

```
┌─────────────────────────────────────────────────────────────┐
│                 COMMAND PALETTE (Cmd+K)                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │  🔍 What do you need?                   │               │
│  │  [add student                   ]       │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  Recent Actions:                                           │
│  ┌─────────────────────────────────────────┐               │
│  │  👤 Add Student                         │               │
│  │     Create a new student record         │               │
│  │                          ⌘K S           │               │
│  ├─────────────────────────────────────────┤               │
│  │  📚 Create Class                        │               │
│  │     Set up a new class                  │               │
│  │                          ⌘K C           │               │
│  ├─────────────────────────────────────────┤               │
│  │  👨‍🏫 Add Teacher                         │               │
│  │     Register a new teacher              │               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │  ↑↓ Navigate  ↵ Select  esc Close      │               │
│  └─────────────────────────────────────────┘               │
│                    ↓                                        │
│  ┌─────────────────────────────────────────┐               │
│  │  🔍 What do you need?                   │               │
│  │  [create grade 8 science clas ]        │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │  🎯 Create Grade 8 Science Class        │               │
│  │     I'll create a Grade 8 class for     │               │
│  │     science with available teachers    │               │
│  │                          ⌘↵            │               │
│  ├─────────────────────────────────────────┤               │
│  │  📋 Create Class                        │               │
│  │     Set up a new class                  │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│                    ↓ (presses Enter)                       │
│  ┌─────────────────────────────────────────┐               │
│  │                                          │               │
│  │   ✓ Creating Grade 8 Science Class...    │               │
│  │                                          │               │
│  │   Assigning Ms. Karma (Physics specialist)│              │
│  │   Room 101 • Capacity 40                │               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Command Examples

```
Natural Language Commands:
├─ "add student named karma in grade 8"
├─ "create class for grade 9"
├─ "show me students in class 8-A"
├─ "assign ms karma to class 8-b as homeroom"
├─ "import teachers from csv"
├─ "generate attendance report"
└─ "open settings"

Direct Actions:
├─ "students" → Go to students list
├─ "teachers" → Go to teachers list
├─ "classes" → Go to classes list
├─ "settings" → Open settings
└─ "help" → Show keyboard shortcuts
```

---

## 4. In-Place Editing Flow

### Edit Without Leaving Context

```
┌─────────────────────────────────────────────────────────────┐
│                 IN-PLACE EDITING                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Students Table:                                           │
│  ┌─────────────────────────────────────────┐               │
│  │  Name            Grade     ID           │               │
│  │  ────────────────────────────────────  │               │
│  │  Karma Dorji      8-A    2024001       │ ← Click        │
│  │  Tashi Wangdi     9-B    2024002       │               │
│  │  Sonam Choden     8-A    2024003       │               │
│  └─────────────────────────────────────────┘               │
│                    ↓ (clicks Karma Dorji)                  │
│  ┌─────────────────────────────────────────┐               │
│  │  Name            Grade     ID           │               │
│  │  ────────────────────────────────────  │               │
│  │  [Karma Dorji      ]  8-A    2024001   │ ← Edit inline  │
│  │       ↑                                   (no modal)    │
│  │    Click to edit                         │               │
│  │                                          │               │
│  │    [✓] [✕]                               │               │
│  └─────────────────────────────────────────┘               │
│                    ↓                                        │
│  ┌─────────────────────────────────────────┐               │
│  │  Name            Grade     ID           │               │
│  │  ────────────────────────────────────  │               │
│  │  Karma Wangdue    8-A    2024001       │ ← Updated!     │
│  │  Tashi Wangdi     9-B    2024002       │               │
│  │  Sonam Choden     8-A    2024003       │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  Benefits:                                                  │
│  • No page reload                                          │
│  • No modal overlay                                         │
│  • See context while editing                                │
│  • Instant save                                             │
│  • Keyboard: Enter to save, Esc to cancel                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Smart Class Creator

### AI-Powered Suggestions

```
┌─────────────────────────────────────────────────────────────┐
│              SMART CLASS CREATOR                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Classes Page:                                             │
│  ┌─────────────────────────────────────────┐               │
│  │  Classes                    [+ New Class]│               │
│  │  ─────────────────────────────────────────              │
│  │  [2025-2026 ▾] [All Grades ▾]         │               │
│  └─────────────────────────────────────────┘               │
│                    ↓                                        │
│  ┌─────────────────────────────────────────┐               │
│  │                                          │               │
│  │  ✨ Smart Suggestions                    │               │
│  │  ─────────────────────────────────────   │               │
│  │                                          │               │
│  │  📊 Grade 8, Section B                   │               │
│  │     Most schools create a second         │               │
│  │     section for Grade 8                  │               │
│  │     [Create →]                          │               │
│  │                                          │               │
│  │  📋 Clone Grade 8-A                      │               │
│  │     Copy teachers and settings           │               │
│  │     [Clone →]                           │               │
│  │                                          │               │
│  │  👩‍🏫 Assign Ms. Karma                     │               │
│  │     She has the lowest load (2 classes)  │               │
│  │     [Assign →]                          │               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                    ↓                                        │
│  ┌─────────────────────────────────────────┐               │
│  │                                          │               │
│  │  Or describe what you want:              │               │
│  │  [grade 8 science class for ms. karma]  │               │
│  │                                          │               │
│  │  I'll create a Grade 8 class with        │               │
│  │  Ms. Karma as the science teacher.       │               │
│  │                                          │               │
│  │  [Create →]                             │               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                    ↓                                        │
│  ┌─────────────────────────────────────────┐               │
│  │                                          │               │
│  │   ✓ Class Created!                       │               │
│  │                                          │               │
│  │   Grade 8-B is ready for the year        │               │
│  │                                          │               │
│  │   Homeroom: Ms. Karma (auto-assigned)    │               │
│  │   Capacity: 40 • Room: 102               │               │
│  │                                          │               │
│  │   [View Class]  [Add Another]            │               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Progressive Disclosure Pattern

### Show What's Needed, When Needed

```
┌─────────────────────────────────────────────────────────────┐
│           PROGRESSIVE DISCLOSURE PATTERN                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ OLD WAY (Everything at once):                          │
│  ┌─────────────────────────────────────────┐               │
│  │  Personal Information                   │               │
│  │  Name [__] Email [__] Phone [__]        │               │
│  │  DOB [__] Gender [__] Address [__]      │               │
│  │  ← 6 fields visible immediately         │               │
│  │                                          │               │
│  │  Academic Info                          │               │
│  │  Grade [__] Section [__] Roll [__]      │               │
│  │  ← 3 more fields                        │               │
│  │                                          │               │
│  │  Parent Info                            │               │
│  │  Parent [__] Phone [__] Email [__]      │               │
│  │  ← 3 more fields                        │               │
│  │                                          │               │
│  │  [Submit all at once →]                 │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  ✅ NEW WAY (One question at a time):                     │
│  ┌─────────────────────────────────────────┐               │
│  │  ┌─────────────────────────────────┐    │               │
│  │  │ What's your name?               │    │               │
│  │  │ [Karma Dorji               ]    │    │               │
│  │  │                                 │    │               │
│  │  │ [→] [Skip]                      │    │               │
│  │  └─────────────────────────────────┘    │               │
│  │              ↓ After answering            ↓               │
│  │  ┌─────────────────────────────────┐    │               │
│  │  │ Hi Karma! What's your email?     │    │               │
│  │  │ [karma@school.edu.bt         ]  │    │               │
│  │  │                                 │    │               │
│  │  │ [→] [Skip]                      │    │               │
│  │  └─────────────────────────────────┘    │               │
│  │              ↓ After answering            ↓               │
│  │  ┌─────────────────────────────────┐    │               │
│  │  │ What grade are you in?           │    │               │
│  │  │ [8] [9] [10] [11] [12]           │    │               │
│  │  └─────────────────────────────────┘    │               │
│  │                                          │               │
│  │  Progress: ████░░░░ 50%                  │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  Key Difference:                                           │
│  • Cognitive load: 1 question vs 12 questions              │
│  • Focus: Single field visible vs all fields              │
│  • Progress: Visible bar vs unknown total                 │
│  • Errors: Caught immediately vs at end                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Keyboard-First Navigation

### Power User Flow

```
┌─────────────────────────────────────────────────────────────┐
│            KEYBOARD-FIRST NAVIGATION                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Scenario: Add 5 students quickly                          │
│                                                             │
│  ┌─────────────────────────────────────────┐               │
│  │  Press Cmd+K                             │               │
│  │  → Command palette opens                │               │
│  │                                          │               │
│  │  Type: "add student"                    │               │
│  │  → Selects "Add Student" command         │               │
│  │                                          │               │
│  │  Press Enter                             │               │
│  │  → Express add modal opens              │               │
│  │                                          │               │
│  │  Type: "karma 8"                         │               │
│  │  → Auto-fills: Name=Karma, Grade=8       │               │
│  │                                          │               │
│  │  Press Enter                             │               │
│  │  → Student added, modal stays open       │               │
│  │                                          │               │
│  │  Type: "tashi 8"                         │               │
│  │  Press Enter                             │               │
│  │  → Student #2 added                      │               │
│  │                                          │               │
│  │  Type: "sonam 9"                         │               │
│  │  Press Enter                             │               │
│  │  → Student #3 added                      │               │
│  │                                          │               │
│  │  Type: "dechen 8"                        │               │
│  │  Press Enter                             │               │
│  │  → Student #4 added                      │               │
│  │                                          │               │
│  │  Type: "wangmo 7"                        │               │
│  │  Press Enter                             │               │
│  │  → Student #5 added                      │               │
│  │                                          │               │
│  │  Press Esc                               │               │
│  │  → Modal closes                          │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  Total time: ~45 seconds                                     │
│  Mouse usage: 0                                             │
│  Context switches: 0                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Error Recovery Flow

### Graceful Error Handling

```
┌─────────────────────────────────────────────────────────────┐
│               ERROR RECOVERY PATTERN                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ OLD WAY (Error banner at top):                        │
│  ┌─────────────────────────────────────────┐               │
│  │  ⚠️ Please fix the errors below          │               │
│  │  ─────────────────────────────────────   │               │
│  │                                          │               │
│  │  Name [__________] ← Error shown here   │               │
│  │  Email [__________] ← Error shown here  │               │
│  │  Phone [__________] ← Error shown here  │               │
│  │                                          │               │
│  │  (User must scroll to find errors)       │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  ✅ NEW WAY (Inline, actionable):                         │
│  ┌─────────────────────────────────────────┐               │
│  │                                          │               │
│  │  What's your email?                      │               │
│  │  [karma@email                   ]       │               │
│  │  └─ "Please use your school email"      │               │
│  │     (Error shown immediately,           │               │
│  │      with specific guidance)            │               │
│  │                                          │               │
│  │  What's your phone?                      │               │
│  │  [+975 17 00 00 00              ]       │               │
│  │  ✓ Valid format                         │               │
│  │                                          │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
│  Key Improvements:                                         │
│  • Error shown at field level, not page level              │
│  • Specific guidance, not generic error                    │
│  • Visual validation (✓) as user types                     │
│  • Auto-correction suggestions                             │
│  • Never blocks progress with errors                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary: Before vs After

```
┌─────────────────────────────────────────────────────────────┐
│                    BEFORE → AFTER COMPARISON               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STUDENT ONBOARDING:                                       │
│    Before: 8 minutes, 35 clicks, 25 fields                │
│    After:  45 seconds, 6 clicks, 3 questions              │
│    Improvement: 91% faster                                 │
│                                                             │
│  TEACHER CREATION:                                         │
│    Before: 12 minutes, 4 sections, 25 fields              │
│    After:  15 seconds, 1 field, email-only               │
│    Improvement: 98% faster                                 │
│                                                             │
│  CLASS CREATION:                                           │
│    Before: 4 minutes, dropdowns, manual selection          │
│    After:  30 seconds, suggestions, auto-assign           │
│    Improvement: 88% faster                                 │
│                                                             │
│  DATA ENTRY (bulk):                                        │
│    Before: Individual forms for each entry                │
│    After:  Express modal, stay in context, repeat          │
│    Improvement: 75% faster                                 │
│                                                             │
│  NAVIGATION:                                               │
│    Before: Click through menus, multiple page loads       │
│    After:  Cmd+K, type anywhere, instant jump             │
│    Improvement: 70% faster                                 │
│                                                             │
│  EDITING:                                                  │
│    Before: Open edit page, modal, or form                 │
│    After:  Click to edit, inline, no context loss         │
│    Improvement: 60% faster                                 │
│                                                             │
│  ERROR HANDLING:                                           │
│    Before: Submit → See errors → Fix → Resubmit           │
│    After:  Real-time validation, inline fixes             │
│    Improvement: 80% less frustration                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
