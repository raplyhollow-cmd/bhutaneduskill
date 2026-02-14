# Components Guide - Usage & Documentation

**Project:** Career Compass + School Management System
**Last Updated:** February 14, 2026
**Version:** 1.2

---

## Table of Contents

1. [Base UI Components](#base-ui-components) - `src/components/ui/`
2. [Shared Components](#shared-components) - `src/components/shared/`
3. [Landing Page Components](#landing-page-components) - `src/components/landing/`
4. [Portal-Specific Components](#portal-specific-components) - `src/components/[portal]/`
5. [Layout Components](#layout-components) - `src/components/layout/`
6. [Form & Input Components](#form--input-components)
7. [Display Components](#display-components)

---

## Base UI Components

Location: `src/components/ui/`

### Button

**File:** `button.tsx`

**Variants:** `default`, `primary`, `secondary`, `ghost`, `link`

```tsx
import { Button } from "@/components/ui/button";

// Basic usage
<Button>Click me</Button>

// With variant
<Button variant="primary">Primary Action</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="link">Link Button</Button>

// With size
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// As child (for Radix UI compatibility)
<Button asChild>
  <a href="/link">Link as button</a>
</Button>

// Disabled state
<Button disabled>Disabled</Button>

// With icon
<Button>
  <Icon className="mr-2" />
  Button with Icon
</Button>
```

---

### Card

**File:** `card.tsx`

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// With custom styling
<Card className="bg-gradient-to-br from-orange-50 to-white">
  <CardContent>Custom styled card</CardContent>
</Card>
```

---

### Input (Form Input)

**File:** `form-input.tsx`

Enhanced input with icon support.

```tsx
import { FormInput } from "@/components/ui/form-input";

// Basic text input
<FormInput
  type="text"
  placeholder="Enter your name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// With icon
<FormInput
  type="email"
  placeholder="Email address"
  icon="mail"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With label
<div className="space-y-2">
  <label>Full Name</label>
  <FormInput
    type="text"
    placeholder="John Doe"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
</div>

// With error state
<FormInput
  type="text"
  placeholder="Username"
  error={error}
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
```

---

### Dialog (Modal)

**File:** `dialog.tsx`

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="ghost">Cancel</Button>
      <Button variant="primary">Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Full Screen Modal (Mobile-Friendly)

**File:** `full-screen-modal.tsx`

**Special:** Adapts to screen size - full-screen on mobile, centered dialog on desktop.

```tsx
import {
  FullScreenModal,
  FullScreenModalContent,
  FullScreenModalDescription,
  FullScreenModalFooter,
  FullScreenModalHeader,
  FullScreenModalTitle,
  FullScreenModalTrigger,
} from "@/components/ui/full-screen-modal";

<FullScreenModal>
  <FullScreenModalTrigger asChild>
    <Button>Open Modal</Button>
  </FullScreenModalTrigger>
  <FullScreenModalContent>
    <FullScreenModalHeader>
      <FullScreenModalTitle>Modal Title</FullScreenModalTitle>
      <FullScreenModalDescription>
        Modal description goes here
      </FullScreenModalDescription>
    </FullScreenModalHeader>
    {/* Your content here */}
    <FullScreenModalFooter>
      <Button>Action</Button>
    </FullScreenModalFooter>
  </FullScreenModalContent>
</FullScreenModal>
```

---

### Mobile Card (Responsive)

**File:** `mobile-card.tsx`

**Special:** 2-column grid on mobile, 4-column on desktop.

```tsx
import { MobileCard, MobileCardGrid } from "@/components/ui/mobile-card";

// Using the grid wrapper
<MobileCardGrid>
  <MobileCard
    title="Mathematics"
    subtitle="Class 10A"
    icon={BookOpen}
    onClick={() => router.push('/classes/math')}
  />
  <MobileCard
    title="Physics"
    subtitle="Class 10B"
    icon={Atom}
    badge="New"
  />
  <MobileCard
    title="Chemistry"
    subtitle="Class 10C"
    icon={Flask}
    gradient="purple"
  />
</MobileCardGrid>

// Stats card variant
import { StatsCard } from "@/components/ui/mobile-card";

<StatsCard
  title="Total Students"
  value="1,234"
  change={12}
  icon={Users}
/>
<StatsCard
  title="Attendance"
  value="94.5%"
  change={-2.3}
  icon={CheckCircle}
  trend="down"
/>

// Quick action card variant
import { QuickActionCard } from "@/components/ui/mobile-card";

<QuickActionCard
  title="Take Attendance"
  icon={CheckSquare}
  onClick={() => router.push('/attendance/take')}
/>
```

---

### Badge

**File:** `badge.tsx`

```tsx
import { Badge } from "@/components/ui/badge";

<Badge>Default</Badge>
<Badge variant="primary">Primary</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>

// With dot indicator
<Badge variant="primary">
  <span className="w-2 h-2 rounded-full bg-white mr-2" />
  Live
</Badge>
```

---

### Avatar

**File:** `avatar.tsx`

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src="/avatars/user.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// With sizes
<Avatar size="sm">
  <AvatarImage src="/avatars/user.jpg" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

<Avatar size="lg">
  <AvatarImage src="/avatars/user.jpg" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// Automatic initials from name
<Avatar name="John Doe">
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

---

### Toast Notifications

**File:** `toast.tsx`

```tsx
import { useToast } from "@/components/ui/toast";

function MyComponent() {
  const { toast } = useToast();

  return (
    <Button
      onClick={() => {
        toast({
          title: "Success!",
          description: "Your changes have been saved.",
          variant: "default",
        });
      }}
    >
      Show Success Toast
    </Button>
  );
}

// Error toast
toast({
  title: "Error",
  description: "Something went wrong.",
  variant: "destructive",
});

// With action
toast({
  title: "Undo available",
  description: "Your changes were saved.",
  action: <Button variant="ghost" size="sm">Undo</Button>,
});
```

---

### Dropdown Menu

**File:** `dropdown-menu.tsx`

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">Options</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### Tabs

**File:** `tabs.tsx`

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    <TabsTrigger value="tab3">Tab 3</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Content for tab 1
  </TabsContent>
  <TabsContent value="tab2">
    Content for tab 2
  </TabsContent>
  <TabsContent value="tab3">
    Content for tab 3
  </TabsContent>
</Tabs>
```

---

### Progress Bar

**File:** `progress.tsx`

```tsx
import { Progress } from "@/components/ui/progress";

<Progress value={33} />
<Progress value={66} className="bg-purple-500" />
<Progress value={100} className="bg-green-500" />

// Indeterminate (loading state)
<Progress />
```

---

### Empty State

**File:** `empty-state.tsx`

```tsx
import { EmptyState } from "@/components/ui/empty-state";

<EmptyState
  icon={Inbox}
  title="No homework assigned"
  description="You don't have any homework assignments yet."
  action={
    <Button variant="primary">
      View All Assignments
    </Button>
  }
/>

// Without action
<EmptyState
  icon={Users}
  title="No students found"
  description="Try adjusting your search or filters."
/>
```

---

### Skeleton Loading States

**File:** `skeleton.tsx`

```tsx
import {
  Skeleton,
  CardSkeleton,
  StatsCardSkeleton,
  ListSkeleton,
  DashboardSkeleton,
} from "@/components/ui/skeleton";

// Base skeleton
<Skeleton className="h-4 w-full" />
<Skeleton className="h-12 w-12 rounded-full" />

// Card skeleton
<CardSkeleton showIcon lines={3} />

// Stats card skeleton
<StatsCardSkeleton />

// List skeleton
<ListSkeleton count={5} />

// Full dashboard skeleton
<DashboardSkeleton statsCount={4} cardCount={6} />
```

---

## Shared Components

Location: `src/components/shared/`

### Portal Sidebar

**File:** `portal-sidebar.tsx`

**Used by:** All 6 portals (student, teacher, parent, counselor, school-admin, admin)

```tsx
import { PortalSidebar } from "@/components/shared/portal-sidebar";

<PortalSidebar
  userType="student"
  userName="John Doe"
  userImage="/avatars/user.jpg"
  collapsed={false}
/>
```

**Portal Types:**
- `"student"` - Orange gradient
- `"teacher"` - Blue gradient
- `"parent"` - Gray gradient
- `"counselor"` - Purple gradient
- `"admin"` - Pink gradient
- `"school-admin"` - Violet gradient

---

### Portal Bottom Nav (Mobile)

**File:** `portal-bottom-nav.tsx`

**Special:** Only visible on mobile (< 768px), hidden on desktop

```tsx
import { StudentBottomNav, TeacherBottomNav, MainContentWithBottomNav } from "@/components/shared/portal-bottom-nav";

// Wrap your main content
export default function StudentLayout({ children }) {
  return (
    <>
      <PortalSidebar userType="student" userName={userName} />
      <div className="lg:pl-64">
        <PortalHeader userType="student" userName={userName} />
        <MainContentWithBottomNav>
          <main className="p-6">{children}</main>
        </MainContentWithBottomNav>
      </div>
      <StudentBottomNav />
    </>
  );
}

// Available bottom nav components:
// - StudentBottomNav
// - TeacherBottomNav
// - ParentBottomNav
// - CounselorBottomNav
// - SchoolAdminBottomNav
// - AdminBottomNav
```

**Navigation Items:**

| Portal | Items |
|--------|-------|
| Student | Home, Homework, Classes, Results |
| Teacher | Home, Classes, Homework, Students |
| Parent | Home, Children, Progress, Fees |
| Counselor | Home, Students, Sessions, Notes |
| School Admin | Home, Students, Teachers, Reports |
| Admin | Home, Schools, Users, Analytics |

---

### AI Insight Card

**File:** `ai-insight-card.tsx`

**Purpose:** Display AI-powered insights with actionable recommendations

```tsx
import { AIInsightCard } from "@/components/shared/ai-insight-card";

<AIInsightCard
  type="warning"
  title="At-Risk Students"
  message="3 students need immediate attention based on attendance trends."
  actions={[
    { label: "View Students", onClick: () => router.push('/students') },
    { label: "Send Reminder", onClick: () => {/*...*/} }
  ]}
/>

<AIInsightCard
  type="success"
  title="Great Progress!"
  message="Class performance improved by 15% this month."
/>

<AIInsightCard
  type="info"
  title="Pending Actions"
  message="5 homework assignments need grading."
  actions={[
    { label: "Grade Now", onClick: () => router.push('/homework/grade') }
  ]}
/>
```

**Types:** `warning`, `success`, `info`, `error`

---

## Landing Page Components

Location: `src/components/landing/`

### Hero 3D

**File:** `hero-3d.tsx`

**Purpose:** Main hero section with 3D mountain backgrounds

```tsx
import { Hero3D } from "@/components/landing/hero-3d";

// Used in homepage
<Hero3D />
```

**Features:**
- 3D mountain background (Three.js)
- Animated gradient text
- Call-to-action buttons
- Responsive design

---

### Portal Cards 3D

**File:** `portal-cards-3d.tsx`

**Purpose:** Animated portal selection cards

```tsx
import { PortalCards3D } from "@/components/landing/portal-cards-3d";

<PortalCards3D
  onSelectPortal={(portal) => {
    router.push(`/sign-in?portal=${portal}`);
  }}
/>
```

**Portals:** Student, Teacher, Parent, School Admin

---

### Journey Timeline

**File:** `journey-timeline.tsx`

**Purpose:** Visual user journey steps

```tsx
import { JourneyTimeline } from "@/components/landing/journey-timeline";

const steps = [
  { icon: Compass, title: "Discover", description: "Take RIASEC test" },
  { icon: Map, title: "Explore", description: "Browse careers" },
  { icon: Target, title: "Plan", description: "Create roadmap" },
  { icon: Trophy, title: "Achieve", description: "Track progress" },
];

<JourneyTimeline steps={steps} />
```

---

## Portal-Specific Components

### Child Selector (Parent Portal)

**File:** `parent/child-selector.tsx`

**Purpose:** Multi-child management for parents

```tsx
import { ChildSelector, useChildSelector } from "@/components/parent/child-selector";

// Using the hook
function ParentDashboard() {
  const { selectedChild, setSelectedChild, children } = useChildSelector();

  return (
    <div>
      <ChildSelector
        children={children}
        selectedChildId={selectedChild?.id}
        onChildChange={(childId) => setSelectedChild(child)}
      />
      {/* Display selected child's data */}
    </div>
  );
}

// Display child card
<ChildSelector.ChildDisplayCard
  child={selectedChild}
  showActions
/>
```

---

### Homework Creator

**File:** `homework/homework-creator.tsx`

**Purpose:** Create homework with 8 question types

```tsx
import { HomeworkCreator } from "@/components/homework/homework-creator";

<HomeworkCreator
  onSave={(homework) => {
    // Save homework to database
  }}
  initialData={existingHomework}
/>

// Question types supported:
// 1. Multiple Choice
// 2. True/False
// 3. Short Answer
// 4. Essay
// 5. Fill in the Blank
// 6. Matching
// 7. Ordering
// 8. Math (with KaTeX support)
```

---

### Grading Panel

**File:** `homework/grading-panel.tsx`

**Purpose:** Grade student submissions

```tsx
import { GradingPanel } from "@/components/homework/grading-panel";

<GradingPanel
  submissions={studentSubmissions}
  onGrade={(submission, grade, feedback) => {
    // Submit grade to database
  }}
/>
```

---

### Attendance Tracker

**File:** `attendance/attendance-tracker.tsx`

**Purpose:** Take attendance with keyboard shortcuts

```tsx
import { AttendanceTracker } from "@/components/attendance/attendance-tracker";

<AttendanceTracker
  students={classList}
  classId="class-123"
  date={new Date()}
  onSave={(attendanceData) => {
    // Save attendance
  }}
/>

// Keyboard shortcuts:
// P / 1 - Present
// A / 2 - Absent
// L / 3 - Late
// E / 4 - Excused
```

---

### Certificate Generator

**File:** `learning/certificate-generator.tsx`

**Purpose:** Generate achievement certificates

```tsx
import { CertificateGenerator } from "@/components/learning/certificate-generator";

<CertificateGenerator
  student={studentData}
  course={courseData}
  achievement="Completed Advanced Mathematics"
  onComplete={(certificate) => {
    // Download or print certificate
  }}
/>
```

---

### Report Card Generator

**File:** `reports/report-card.tsx`

**Purpose:** Generate PDF student report cards

```tsx
import { ReportCardGenerator } from "@/components/reports/report-card";

<ReportCardGenerator
  studentId="student-123"
  academicYear="2026"
/>
```

**Includes:**
- Subject-wise grades
- Attendance summary
- Behavior remarks
- Extracurricular achievements
- Teacher and principal signature sections

---

## Layout Components

Location: `src/components/layout/`

### Professional Nav

**File:** `professional-nav.tsx`

**Purpose:** Main navigation for public pages

```tsx
import { ProfessionalNav } from "@/components/layout/professional-nav";

<ProfessionalNav />
```

**Features:**
- Floating, rounded edges design
- Logo with link to home
- Navigation links: Home, About, Careers, Assessments, Contact
- Sign In / Get Started buttons
- Mobile menu with slide-out sheet

---

### Footer

**File:** `footer.tsx`

**Purpose:** Site footer with links and back-to-top button

```tsx
import { Footer } from "@/components/layout/footer";

<Footer
  copyright="2026 Career Compass Bhutan"
  links={{
    company: [{ label: "About", href: "/about" }],
    resources: [{ label: "Careers", href: "/careers" }],
    legal: [{ label: "Privacy", href: "/privacy" }],
  }}
/>
```

**Features:**
- 4-column link layout
- Back-to-top button (positioned at `bottom-20 right-4` on mobile)
- Social media links
- Newsletter signup

---

## Form & Input Components

### Wizard Form

**File:** `wizard/wizard-form.tsx`

**Purpose:** Multi-step form with validation

```tsx
import { WizardForm, WizardSteps, WizardNavigation } from "@/components/wizard/wizard-form";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

const steps = [
  { id: "personal", title: "Personal Info" },
  { id: "school", title: "School Info" },
  { id: "review", title: "Review" },
];

<WizardForm
  schema={schema}
  onSubmit={(data) => {
    // Submit form data
  }}
  steps={steps}
>
  {/* Step 1 */}
  <WizardSteps step={1}>
    <FormInput name="name" label="Full Name" />
  </WizardSteps>

  {/* Step 2 */}
  <WizardSteps step={2}>
    <FormInput name="email" label="Email" type="email" />
  </WizardSteps>

  {/* Navigation */}
  <WizardNavigation />
</WizardForm>
```

---

### School Code Input

**File:** `wizard/school-code-input.tsx`

**Purpose:** Verify school code during registration

```tsx
import { SchoolCodeInput } from "@/components/wizard/school-code-input";

<SchoolCodeInput
  onVerify={async (code) => {
    const response = await fetch(`/api/schools/verify?code=${code}`);
    const data = await response.json();
    return data.valid;
  }}
  className="w-full"
/>
```

---

## Portal Color System

Each portal has its own gradient color scheme:

| Portal | Gradient | RGB Values |
|--------|----------|------------|
| **Student** | Orange | `rgb(249 115 22)` → `rgb(194 65 12)` |
| **Teacher** | Blue | `rgb(59 130 246)` → `rgb(37 99 235)` |
| **Parent** | Gray | `rgb(107 114 128)` → `rgb(75 85 99)` |
| **Counselor** | Purple | `rgb(168 85 247)` → `rgb(147 51 234)` |
| **School Admin** | Violet | `rgb(139 92 246)` → `rgb(124 58 237)` |
| **Admin** | Pink | `rgb(236 72 153)` → `rgb(219 39 119)` |

**Usage:**
```tsx
// Inline gradient style
<div style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>

// Or use CSS classes from globals.css
<div className="portal-orange" />
<div className="portal-blue" />
<div className="portal-purple" />
```

---

## Common Patterns

### 1. Data Fetching with Loading State

```tsx
"use client";

import { useState, useEffect } from "react";
import { DashboardSkeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <EmptyState title="No data found" />;

  return <div>{/* render data */}</div>;
}
```

### 2. Error Handling with Retry

```tsx
"use client";

import { useState } from "react";
import { ErrorDisplay } from "@/components/error/error-display";

export default function Page() {
  const [error, setError] = useState(null);

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load"
        message={error.message}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Rest of component
}
```

### 3. Form Validation with Zod

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput } from "@/components/ui/form-input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

export default function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        {...register("name")}
        error={errors.name?.message}
        placeholder="Full Name"
      />
      <FormInput
        {...register("email")}
        error={errors.email?.message}
        type="email"
        placeholder="Email"
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

---

## Component Best Practices

1. **Use "use client" directive** when using hooks (useState, useEffect, etc.)
2. **Import from @/components** - Never use relative paths
3. **Handle loading states** - Use skeleton components
4. **Handle error states** - Use error display components
5. **Use proper types** - Define interfaces for component props
6. **Mobile-first** - Design for mobile, then enhance for desktop
7. **Portal-specific colors** - Match component colors to portal type
8. **Accessibility** - Use proper ARIA labels, keyboard navigation

---

## Quick Reference Card

```tsx
// Basic card with hover effect
<Card className="hover:shadow-lg hover:-translate-y-1 transition-all">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Stats card
<StatsCard
  title="Total Students"
  value="1,234"
  change={12}
  icon={Users}
/>

// Button with icon
<Button>
  <Icon className="mr-2 h-4 w-4" />
  Button Text
</Button>

// Badge
<Badge variant="primary">New Feature</Badge>

// Avatar
<Avatar>
  <AvatarImage src="/avatar.jpg" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>

// Toast notification
const { toast } = useToast();
toast({ title: "Success!", description: "Saved changes." });
```