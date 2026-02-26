# React Component Patterns - Rules for Stable UI

> **LAST UPDATED:** 2026-02-24
> **STATUS:** 🔴 CRITICAL - Read before ANY React component work

---

## RULE #1: Hooks Declaration Order (CRITICAL)

**ALL hooks MUST be declared at the TOP of the component, BEFORE any conditional logic, early returns, or loops.**

React requires hooks to be called in the same order on every render. Violating this causes:

```
Error: Rendered more hooks than during the previous render
```

### ✅ CORRECT Pattern

```tsx
"use client";

export function MyComponent({ prop }: { prop: string }) {
  // ✅ ALL hooks declared first
  const [state, setState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Effect logic
    fetchData();
  }, [prop]);

  // ✅ Conditional logic AFTER all hooks
  if (isLoading) {
    return <Loader />;
  }

  // ✅ Early returns AFTER all hooks
  if (someCondition) {
    return <div>Special case</div>;
  }

  return <div>{state}</div>;
}
```

### ❌ WRONG Pattern (Causes Crashes)

```tsx
export function MyComponent() {
  // ❌ Early return BEFORE hooks
  if (typeof window === "undefined") {
    return null;  // CRASH!
  }

  // ❌ Hooks after conditional
  const [state, setState] = useState(null);  // CRASH!
  return <div>{state}</div>;
}
```

---

## RULE #2: Client Component Declaration

Always add `"use client";` at the top of files that use:
- React hooks (useState, useEffect, etc.)
- Browser APIs (window, localStorage, etc.)
- Event handlers

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MyComponent() {
  // Component logic
}
```

---

## RULE #3: Server vs Client Components

| Use Server Component When | Use Client Component When |
|-------------------------|-------------------------------|
| Fetching data directly from DB | Using React hooks |
| Static content | Browser APIs needed |
| API routes | User interactions (click, input) |
| Authentication checks | Real-time updates |

---

## Portal Layout Pattern

All 7 portal layouts follow this authentication pattern:

```tsx
"use client";

export default function PortalLayout({ children }) {
  const router = useRouter();
  const [needsSetup, setNeedsSetup] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    Promise.all([
      fetch("/api/auth/set-role"),
      fetch("/api/user/profile")
    ])
      .then(([roleRes, profileRes]) => Promise.all([roleRes.json(), profileRes.json()]))
      .then(([roleData, profileData]) => {
        if (roleData.needsSetup) {
          setNeedsSetup(true);
          setTimeout(() => router.push("/setup/unified"), 100);
          return;
        }
        setUserType(roleData.userType);
      })
      .catch(() => {
        setNeedsSetup(true);
        setTimeout(() => router.push("/setup/unified"), 100);
      });
  }, [router]);

  if (needsSetup) {
    return <RedirectingToSetup />;
  }

  return <PortalSidebar>{children}</PortalSidebar>;
}
```

---

## Form Handling Pattern

### Controlled Components

```tsx
"use client";

export function CreateClassForm() {
  const [formData, setFormData] = useState({
    name: "",
    grade: 6,
    section: "A",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit logic
    await createClass(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" value={formData.name} onChange={handleChange} />
      {/* Form fields */}
    </form>
  );
}
```

### Async State with Loading

```tsx
"use client";

export function DataList() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <ErrorDisplay message={error} />;
  if (data.length === 0) return <EmptyState />;

  return <DataList data={data} />;
}
```

---

## Error Boundary Pattern

```tsx
"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ErrorBoundary({ children, fallback }: Props) {
  return (
    <Component
      onError={(error) => {
        logger.error("Component error:", error);
      }}
      FallbackComponent={fallback}
    >
      {children}
    </Component>
  );
}
```

---

## Conditional Rendering (Safe Patterns)

### ✅ SAFE - Conditional inside JSX

```tsx
function Component() {
  const [show, setShow] = useState(false);

  return (
    <div>
      {show && <Modal />}  {/* ✅ Safe */}
      <Button onClick={() => setShow(true)}>Open</Button>
    </div>
  );
}
```

### ✅ SAFE - Early return AFTER hooks

```tsx
function Component({ isAdmin }: { isAdmin: boolean }) {
  const [data, setData] = useState();

  // ✅ All hooks declared first
  useEffect(() => {}, []);

  // ✅ Early return AFTER hooks
  if (!isAdmin) return <AccessDenied />;

  return <Dashboard />;
}
```

### ❌ UNSAFE - Hooks after early return

```tsx
function Component({ isAdmin }: { isAdmin: boolean }) {
  // ❌ Early return BEFORE hooks = CRASH
  if (!isAdmin) return <AccessDenied />;

  const [data] = useState();  // Never reached!
  return <Dashboard />;
}
```

---

## Framer Motion Rules (Within React)

```tsx
"use client";

import { motion } from "framer-motion";

export function AnimatedComponent() {
  return (
    <motion.div
      animate={{ opacity: [0, 1, 0] }}
      transition={{
        repeat: Infinity,
        repeatType: "loop",  // ✅ REQUIRED with Infinity
        duration: 2
      }}
    />
  );
}
```

---

## Working Examples to Copy From

### Student Dashboard
**File:** `src/app/student/dashboard/page.tsx`

### Teacher Dashboard
**File:** `src/app/teacher/dashboard/page.tsx`

### School Admin Classes List
**File:** `src/app/school-admin/classes/page.tsx`

---

## Quick Checklist Before Marking Component "Done"

- [ ] All hooks declared before any conditionals
- [ ] `"use client"` added if using hooks
- [ ] Loading state handled
- [ ] Error state handled
- [ ] Empty state handled
- [ ] Form validation on submit
- [ ] Success/error feedback to user
- [ ] Navigation works after actions
