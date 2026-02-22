# Clerk Design System

A comprehensive design system extracted from Clerk.com dashboard UI. This document contains all the design tokens, components, and patterns needed to replicate the Clerk design aesthetic.

---

## Table of Contents

1. [Color Palette](#color-palette)
2. [Typography](#typography)
3. [Spacing Scale](#spacing-scale)
4. [Border Radius](#border-radius)
5. [Shadows](#shadows)
6. [Animations](#animations)
7. [Components](#components)
   - [Buttons](#buttons)
   - [Inputs](#inputs)
   - [Cards](#cards)
   - [Data Tables](#data-tables)
   - [Navigation](#navigation)
   - [Toast Notifications](#toast-notifications)
   - [Modals/Dialogs](#modalsdialogs)
   - [Badges & Tags](#badges--tags)
   - [Avatars](#avatars)
   - [Callouts/Banners](#calloutsbanners)
8. [Utility Classes Reference](#utility-classes-reference)

---

## Color Palette

### Primary Colors (Ceramic Gray Scale)

```css
/* Light Mode */
--ceramic-white: #ffffff;
--ceramic-gray-50: #fafafb;
--ceramic-gray-100: #f6f6f7;
--ceramic-gray-200: #ececee;
--ceramic-gray-300: #dbdbe0;
--ceramic-gray-400: #c7c7cf;
--ceramic-gray-500: #adadb7;
--ceramic-gray-600: #90909d;
--ceramic-gray-700: #767684;
--ceramic-gray-800: #5f5f6f;
--ceramic-gray-900: #4c4c5c;
--ceramic-gray-1000: #3d3d4a;
--ceramic-gray-1100: #33333e;
--ceramic-gray-1200: #2b2b34;
--ceramic-gray-1300: #232328;
--ceramic-gray-1400: #1b1b1f;
--ceramic-gray-1500: #111113;
--ceramic-black: #000000;

/* Dark Mode - semantic mappings */
--ceramic-bg-main: var(--ceramic-gray-1400); /* Dark mode */
--ceramic-bg-main: var(--ceramic-white);     /* Light mode */
--ceramic-bg-menu: var(--ceramic-gray-1100);
--ceramic-bg-separator: var(--ceramic-gray-1300);
--ceramic-primary: var(--ceramic-gray-100);
--ceramic-secondary: var(--ceramic-gray-800);
--ceramic-dimmed: var(--ceramic-gray-800);
```

### Brand Color (Purple)

```css
--ceramic-purple-50: #f5f3ff;
--ceramic-purple-100: #e3e0ff;
--ceramic-purple-200: #ccc8ff;
--ceramic-purple-300: #bab0ff;
--ceramic-purple-400: #a698ff;
--ceramic-purple-500: #9280ff;
--ceramic-purple-600: #846bff;    /* Brand - Light */
--ceramic-purple-700: #6c47ff;    /* Brand - Dark */
--ceramic-purple-800: #5f15fe;
--ceramic-purple-900: #4d06d1;
--ceramic-purple-1000: #3707a6;
--ceramic-purple-1100: #27057c;
--ceramic-purple-1200: #1c045f;
--ceramic-purple-1300: #16034b;
```

### Semantic Colors

```css
/* Success / Positive */
--ceramic-positive: var(--ceramic-green-400);  /* Light mode */
--ceramic-positive: var(--ceramic-green-700);  /* Dark mode */
--ceramic-green-50: #effdf1;
--ceramic-green-100: #aff9bf;
--ceramic-green-200: #65f088;
--ceramic-green-300: #49dc6e;
--ceramic-green-400: #31c854;
--ceramic-green-500: #1eb43c;
--ceramic-green-600: #199d34;
--ceramic-green-700: #15892b;
--ceramic-green-800: #107524;
--ceramic-green-900: #09661c;

/* Error / Negative */
--ceramic-negative: var(--ceramic-red-600);    /* Light mode */
--ceramic-negative: var(--ceramic-red-700);    /* Dark mode */
--ceramic-red-50: #fef8f8;
--ceramic-red-100: #fedddd;
--ceramic-red-200: #fec4c4;
--ceramic-red-300: #fca9a9;
--ceramic-red-400: #f98a8a;
--ceramic-red-500: #f86969;
--ceramic-red-600: #f73d3d;
--ceramic-red-700: #e02e2e;
--ceramic-red-800: #c22a2a;
--ceramic-red-900: #aa1b1b;

/* Warning */
--ceramic-warning: var(--ceramic-orange-500);
--ceramic-orange-50: #fff8f2;
--ceramic-orange-100: bisque;
--ceramic-orange-200: #fecc9f;
--ceramic-orange-300: #feb166;
--ceramic-orange-400: #fd9357;
--ceramic-orange-500: #fd7224;
--ceramic-orange-600: #e06213;
--ceramic-orange-700: #c3540f;
--ceramic-orange-800: #a8470c;
--ceramic-orange-900: #9d3405;

/* Info */
--ceramic-info: var(--ceramic-blue-600);       /* Light mode */
--ceramic-info: var(--ceramic-blue-700);       /* Dark mode */
--ceramic-blue-50: #f6faff;
--ceramic-blue-100: #daeafe;
--ceramic-blue-200: #b4d5fe;
--ceramic-blue-300: #8dc2fd;
--ceramic-blue-400: #73acfa;
--ceramic-blue-500: #6694f8;
--ceramic-blue-600: #307ff6;
--ceramic-blue-700: #236dd7;
--ceramic-blue-800: #1c5bb6;
--ceramic-blue-900: #1744a6;
```

### Border Colors

```css
/* Light Mode */
--border-color-primary: #eeeef0;
--border-color-secondary: #f7f7f8;

/* Dark Mode */
--border-color-primary: #373840;
--border-color-secondary: #2f3037;
```

---

## Typography

### Font Families

```css
/* Primary Font Family - Suisse Intl */
--font-suisse: "suisse", "suisse Fallback", system-ui, -apple-system, sans-serif;

/* Number Font - Geist */
--font-geist-numbers: "geistNumbers", system-ui;

/* Mono Font - Soehne Mono */
--font-soehne-mono: "soehneMono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
                   "Liberation Mono", "Courier New", monospace;

/* Base Font */
font-family: var(--font-geist-numbers), var(--font-suisse);
line-height: 1.5;
```

### Font Weights

```css
/* Suisse Intl */
--font-weight-book: 450;      /* Book */
--font-weight-regular: 400;   /* Regular */
--font-weight-medium: 500;    /* Medium */
--font-weight-semibold: 600;  /* SemiBold */
--font-weight-bold: 700;      /* Bold */

/* Number fonts */
--font-weight-600: 600;
```

### Type Scale

```css
/* Text Sizes (approximate from spacing scale) */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

---

## Spacing Scale

```css
/* Spacing tokens */
--spacing-0: 0;
--spacing-px: 0.0625rem;  /* 1px */
--spacing-0_5: 0.125rem;  /* 2px */
--spacing-1: 0.25rem;     /* 4px */
--spacing-1_5: 0.375rem;  /* 6px */
--spacing-2: 0.5rem;      /* 8px */
--spacing-2_5: 0.625rem;  /* 10px */
--spacing-3: 0.75rem;     /* 12px */
--spacing-3_5: 0.875rem;  /* 14px */
--spacing-4: 1rem;        /* 16px */
--spacing-5: 1.25rem;     /* 20px */
--spacing-6: 1.5rem;      /* 24px */
--spacing-7: 1.75rem;     /* 28px */
--spacing-8: 2rem;        /* 32px */
--spacing-9: 2.25rem;     /* 36px */
--spacing-10: 2.5rem;     /* 40px */
--spacing-11: 2.75rem;    /* 44px */
--spacing-12: 3rem;       /* 48px */
--spacing-14: 3.5rem;     /* 56px */
--spacing-16: 4rem;       /* 64px */
--spacing-20: 5rem;       /* 80px */
--spacing-24: 6rem;       /* 96px */
```

---

## Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem;   /* 2px */
--radius-base: 0.25rem;  /* 4px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-2xl: 1rem;      /* 16px */
--radius-3xl: 1.5rem;    /* 24px */
--radius-full: 9999px;
```

---

## Shadows

```css
/* Base shadow tokens */
--shadow-0: 0 0 #0000;
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);

/* Ring shadows for focus states */
--ring-offset-width: 0px;
--ring-offset-color: #fff;
--ring-color: rgb(147 197 253 / 0.5);
--ring-width: 2px;
```

---

## Animations

### Animation Keyframes

```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Fade Out */
@keyframes fadeOut {
  to { opacity: 0; }
}

/* Slide Animations */
@keyframes slideFromBottom {
  from { transform: translate3d(0, 100%, 0); }
  to { transform: translate3d(0, 0, 0); }
}

@keyframes slideToBottom {
  to { transform: translate3d(0, 100%, 0); }
}

@keyframes slideFromTop {
  from { transform: translate3d(0, -100%, 0); }
  to { transform: translate3d(0, 0, 0); }
}

@keyframes slideToTop {
  to { transform: translate3d(0, -100%, 0); }
}

@keyframes slideFromLeft {
  from { transform: translate3d(-100%, 0, 0); }
  to { transform: translate3d(0, 0, 0); }
}

@keyframes slideToLeft {
  to { transform: translate3d(-100%, 0, 0); }
}

@keyframes slideFromRight {
  from { transform: translate3d(100%, 0, 0); }
  to { transform: translate3d(0, 0, 0); }
}

@keyframes slideToRight {
  to { transform: translate3d(100%, 0, 0); }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Caret Blink */
@keyframes caretBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Spinner Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Shine Effect */
@keyframes shine {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
```

### Animation Duration

```css
--animation-duration: 0.25s;
--animation-duration-fast: 0.15s;
--animation-duration-slow: 0.35s;
```

### Transition Timing Functions

```css
/* Standard easing */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
```

---

## Components

### Buttons

#### Primary Button

```css
.button-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  font-weight: 500;
  border-radius: var(--radius-md);
  background-color: var(--ceramic-brand);
  color: var(--ceramic-white);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--animation-duration) var(--ease-default);
}

.button-primary:hover {
  opacity: 0.9;
}

.button-primary:active {
  transform: scale(0.98);
}

.button-primary:focus-visible {
  outline: 2px solid var(--ceramic-brand);
  outline-offset: 2px;
}
```

#### Secondary Button

```css
.button-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-4);
  font-weight: 500;
  border-radius: var(--radius-md);
  background-color: transparent;
  color: var(--ceramic-primary);
  border: 1px solid var(--border-color-primary);
  cursor: pointer;
  transition: all var(--animation-duration) var(--ease-default);
}

.button-secondary:hover {
  background-color: var(--ceramic-gray-100);
}
```

#### Ghost Button

```css
.button-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  font-weight: 500;
  border-radius: var(--radius-md);
  background-color: transparent;
  color: var(--ceramic-secondary);
  border: none;
  cursor: pointer;
  transition: all var(--animation-duration) var(--ease-default);
}

.button-ghost:hover {
  background-color: var(--ceramic-gray-100);
  color: var(--ceramic-primary);
}
```

#### Button Sizes

```css
/* Small */
.button-sm {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: 0.875rem;
}

/* Medium (default) */
.button-md {
  padding: var(--spacing-2) var(--spacing-4);
  font-size: 1rem;
}

/* Large */
.button-lg {
  padding: var(--spacing-3) var(--spacing-6);
  font-size: 1.125rem;
}
```

---

### Inputs

#### Text Input

```css
.input {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ceramic-primary);
  background-color: var(--ceramic-white);
  border: 1px solid var(--border-color-primary);
  border-radius: var(--radius-md);
  transition: all var(--animation-duration) var(--ease-default);
}

.input::placeholder {
  color: var(--ceramic-dimmed);
}

.input:hover {
  border-color: var(--ceramic-gray-400);
}

.input:focus {
  outline: none;
  border-color: var(--ceramic-brand);
  box-shadow: 0 0 0 2px rgba(108, 71, 255, 0.1);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Input with Label

```css
.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1_5);
}

.input-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ceramic-primary);
}

.input-error {
  border-color: var(--ceramic-negative);
}

.input-error:focus {
  box-shadow: 0 0 0 2px rgba(247, 61, 61, 0.1);
}

.input-helper-text {
  font-size: 0.75rem;
  color: var(--ceramic-secondary);
}

.input-error-text {
  font-size: 0.75rem;
  color: var(--ceramic-negative);
}
```

#### Textarea

```css
.textarea {
  width: 100%;
  padding: var(--spacing-3);
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--ceramic-primary);
  background-color: var(--ceramic-white);
  border: 1px solid var(--border-color-primary);
  border-radius: var(--radius-md);
  resize: vertical;
  min-height: 80px;
  transition: all var(--animation-duration) var(--ease-default);
}

.textarea:focus {
  outline: none;
  border-color: var(--ceramic-brand);
  box-shadow: 0 0 0 2px rgba(108, 71, 255, 0.1);
}
```

---

### Cards

```css
.card {
  background-color: var(--ceramic-white);
  border: 1px solid var(--border-color-primary);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

/* Card Header */
.card-header {
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--border-color-primary);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ceramic-primary);
  margin: 0;
}

.card-description {
  font-size: 0.875rem;
  color: var(--ceramic-secondary);
  margin-top: var(--spacing-1);
}

/* Card Body */
.card-body {
  padding: var(--spacing-6);
}

/* Card Footer */
.card-footer {
  padding: var(--spacing-6);
  border-top: 1px solid var(--border-color-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
}

/* Interactive Card */
.card-interactive {
  cursor: pointer;
  transition: all var(--animation-duration) var(--ease-default);
}

.card-interactive:hover {
  border-color: var(--ceramic-gray-300);
  box-shadow: var(--shadow-md);
}
```

---

### Data Tables

```css
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background-color: var(--ceramic-gray-50);
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.data-table thead {
  background-color: var(--ceramic-gray-50);
}

.data-table th {
  padding: var(--spacing-3) var(--spacing-4);
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ceramic-secondary);
  border-bottom: 1px solid var(--border-color-primary);
}

.data-table tbody {
  background-color: var(--ceramic-white);
}

.data-table td {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: 0.875rem;
  color: var(--ceramic-primary);
  border-bottom: 1px solid var(--border-color-primary);
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background-color: rgba(118, 118, 132, 0.04);
}

/* Row Link */
.data-table-row-link {
  display: block;
  width: 100%;
  height: 100%;
  text-decoration: none;
  color: inherit;
}
```

---

### Navigation

#### Sidebar Navigation

```css
.sidebar {
  width: 260px;
  height: 100vh;
  background-color: var(--ceramic-bg-menu);
  border-right: 1px solid var(--border-color-primary);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: var(--spacing-4) var(--spacing-4);
  border-bottom: 1px solid var(--border-color-primary);
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-2);
  overflow-y: auto;
}

.nav-section {
  margin-bottom: var(--spacing-4);
}

.nav-section-title {
  padding: var(--spacing-1) var(--spacing-3);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ceramic-dimmed);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  color: var(--ceramic-secondary);
  text-decoration: none;
  transition: all var(--animation-duration) var(--ease-default);
  cursor: pointer;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--ceramic-primary);
}

.nav-item-active {
  background-color: rgba(108, 71, 255, 0.1);
  color: var(--ceramic-brand);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Dark mode adjustments */
.dark .sidebar {
  background-color: var(--ceramic-gray-1100);
}

.dark .nav-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}
```

#### Top Navigation

```css
.topnav {
  height: 56px;
  background-color: var(--ceramic-white);
  border-bottom: 1px solid var(--border-color-primary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-6);
}

.topnav-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
}

.topnav-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: 0.875rem;
  color: var(--ceramic-secondary);
}

.breadcrumb-link {
  color: var(--ceramic-secondary);
  text-decoration: none;
  transition: color var(--animation-duration);
}

.breadcrumb-link:hover {
  color: var(--ceramic-primary);
}

.breadcrumb-separator {
  color: var(--ceramic-dimmed);
}

.breadcrumb-current {
  color: var(--ceramic-primary);
  font-weight: 500;
}
```

---

### Toast Notifications

```css
.toast-container {
  position: fixed;
  bottom: var(--spacing-6);
  right: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  z-index: 50;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  min-width: 320px;
  max-width: 420px;
  padding: var(--spacing-4);
  background-color: var(--ceramic-white);
  border: 1px solid var(--border-color-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  animation: slideFromRight 0.3s var(--ease-out);
}

.toast-closing {
  animation: slideToRight 0.3s var(--ease-in);
}

/* Toast Icons */
.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.toast-icon-success {
  color: var(--ceramic-positive);
}

.toast-icon-error {
  color: var(--ceramic-negative);
}

.toast-icon-warning {
  color: var(--ceramic-warning);
}

.toast-icon-info {
  color: var(--ceramic-info);
}

/* Toast Content */
.toast-content {
  flex: 1;
}

.toast-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ceramic-primary);
  margin: 0 0 var(--spacing-1) 0;
}

.toast-message {
  font-size: 0.875rem;
  color: var(--ceramic-secondary);
  margin: 0;
  line-height: 1.4;
}

/* Toast Actions */
.toast-actions {
  display: flex;
  gap: var(--spacing-2);
  margin-top: var(--spacing-3);
}

.toast-action {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ceramic-brand);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
}

.toast-close {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--ceramic-dimmed);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  color: var(--ceramic-primary);
}
```

---

### Modals/Dialogs

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 40;
  animation: fadeIn 0.2s var(--ease-out);
}

.modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  background-color: var(--ceramic-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  z-index: 50;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.2s var(--ease-out),
             scaleIn 0.2s var(--ease-out);
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-5) var(--spacing-6);
  border-bottom: 1px solid var(--border-color-primary);
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ceramic-primary);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background: none;
  border: none;
  border-radius: var(--radius-md);
  color: var(--ceramic-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--animation-duration);
}

.modal-close:hover {
  background-color: var(--ceramic-gray-100);
  color: var(--ceramic-primary);
}

/* Modal Body */
.modal-body {
  padding: var(--spacing-6);
  overflow-y: auto;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-5) var(--spacing-6);
  border-top: 1px solid var(--border-color-primary);
}

/* Modal Sizes */
.modal-sm {
  max-width: 400px;
}

.modal-lg {
  max-width: 700px;
}

.modal-xl {
  max-width: 1000px;
}
```

---

### Badges & Tags

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-2);
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--radius-full);
}

/* Badge Variants */
.badge-default {
  background-color: var(--ceramic-gray-100);
  color: var(--ceramic-gray-700);
}

.badge-brand {
  background-color: rgba(108, 71, 255, 0.1);
  color: var(--ceramic-brand);
}

.badge-success {
  background-color: rgba(49, 200, 84, 0.1);
  color: var(--ceramic-green-600);
}

.badge-error {
  background-color: rgba(247, 61, 61, 0.1);
  color: var(--ceramic-red-600);
}

.badge-warning {
  background-color: rgba(253, 114, 36, 0.1);
  color: var(--ceramic-orange-600);
}

.badge-info {
  background-color: rgba(48, 127, 246, 0.1);
  color: var(--ceramic-blue-600);
}

/* Badge with Dot */
.badge-dot {
  position: relative;
  padding-left: var(--spacing-4);
}

.badge-dot::before {
  content: '';
  position: absolute;
  left: var(--spacing-2);
  top: 50%;
  transform: translateY(-50%);
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}
```

---

### Avatars

```css
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  overflow: hidden;
  font-weight: 500;
  text-transform: uppercase;
}

/* Avatar Sizes */
.avatar-xs {
  width: 20px;
  height: 20px;
  font-size: 0.625rem;
}

.avatar-sm {
  width: 24px;
  height: 24px;
  font-size: 0.75rem;
}

.avatar-md {
  width: 32px;
  height: 32px;
  font-size: 0.875rem;
}

.avatar-lg {
  width: 40px;
  height: 40px;
  font-size: 1rem;
}

.avatar-xl {
  width: 56px;
  height: 56px;
  font-size: 1.25rem;
}

.avatar-2xl {
  width: 80px;
  height: 80px;
  font-size: 1.5rem;
}

/* Avatar Variants */
.avatar-primary {
  background-color: var(--ceramic-purple-100);
  color: var(--ceramic-purple-700);
}

.avatar-gray {
  background-color: var(--ceramic-gray-100);
  color: var(--ceramic-gray-700);
}

.avatar-success {
  background-color: var(--ceramic-green-100);
  color: var(--ceramic-green-700);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Avatar Group */
.avatar-group {
  display: flex;
  flex-direction: row-reverse;
  justify-content: flex-end;
}

.avatar-group .avatar {
  margin-left: -8px;
  border: 2px solid var(--ceramic-white);
}

.avatar-group .avatar:first-child {
  margin-left: 0;
}
```

---

### Callouts/Banners

```css
.callout {
  display: flex;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  border: 1px solid;
}

/* Callout Variants */
.callout-info {
  background-color: rgba(48, 127, 246, 0.05);
  border-color: var(--ceramic-blue-200);
}

.callout-info .callout-icon {
  color: var(--ceramic-info);
}

.callout-warning {
  background-color: rgba(253, 114, 36, 0.05);
  border-color: var(--ceramic-orange-200);
}

.callout-warning .callout-icon {
  color: var(--ceramic-warning);
}

.callout-error {
  background-color: rgba(247, 61, 61, 0.05);
  border-color: var(--ceramic-red-200);
}

.callout-error .callout-icon {
  color: var(--ceramic-negative);
}

.callout-success {
  background-color: rgba(49, 200, 84, 0.05);
  border-color: var(--ceramic-green-200);
}

.callout-success .callout-icon {
  color: var(--ceramic-positive);
}

/* Callout Content */
.callout-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.callout-content {
  flex: 1;
}

.callout-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ceramic-primary);
  margin: 0 0 var(--spacing-1) 0;
}

.callout-message {
  font-size: 0.875rem;
  color: var(--ceramic-secondary);
  margin: 0;
}

/* Page Banner */
.banner {
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2) var(--spacing-4);
  font-size: 0.875rem;
}

.banner-info {
  background-color: var(--ceramic-blue-100);
  color: var(--blue-900);
}

.banner-warning {
  background-color: var(--ceramic-orange-100);
  color: var(--orange-900);
}

.banner-error {
  background-color: var(--ceramic-red-100);
  color: var(--red-900);
}
```

---

## Utility Classes Reference

### Display

```css
.block { display: block; }
.inline-block { display: inline-block; }
.inline { display: inline; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.hidden { display: none; }
```

### Flexbox

```css
.flex-row { flex-direction: row; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.flex-1 { flex: 1 1 0%; }
.flex-none { flex: none; }
.grow { flex-grow: 1; }
```

### Spacing

```css
/* Margin */
.m-auto { margin: auto; }
.mx-auto { margin-left: auto; margin-right: auto; }
.my-1 { margin-top: 0.25rem; margin-bottom: 0.25rem; }
.my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
.my-3 { margin-top: 0.75rem; margin-bottom: 0.75rem; }
.my-4 { margin-top: 1rem; margin-bottom: 1rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }

/* Padding */
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
```

### Sizing

```css
/* Width */
.w-full { width: 100%; }
.w-fit { width: fit-content; }
.w-auto { width: auto; }
.max-w-xs { max-width: 20rem; }
.max-w-sm { max-width: 24rem; }
.max-w-md { max-width: 28rem; }
.max-w-lg { max-width: 32rem; }
.max-w-xl { max-width: 36rem; }
.max-w-2xl { max-width: 42rem; }

/* Height */
.h-full { height: 100%; }
.h-screen { height: 100vh; }
.h-auto { height: auto; }
.min-h-screen { min-height: 100vh; }
```

### Border Radius

```css
.rounded-none { border-radius: 0; }
.rounded-sm { border-radius: 0.125rem; }
.rounded { border-radius: 0.25rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-2xl { border-radius: 1rem; }
.rounded-3xl { border-radius: 1.5rem; }
.rounded-full { border-radius: 9999px; }
```

### Text

```css
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### Position

```css
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }
.inset-0 { inset: 0; }
.top-0 { top: 0; }
.right-0 { right: 0; }
.bottom-0 { bottom: 0; }
.left-0 { left: 0; }
```

### Z-Index

```css
.z-0 { z-index: 0; }
.z-10 { z-index: 10; }
.z-20 { z-index: 20; }
.z-30 { z-index: 30; }
.z-40 { z-index: 40; }
.z-50 { z-index: 50; }
```

### Other Utilities

```css
.cursor-pointer { cursor: pointer; }
.cursor-default { cursor: default; }
.cursor-not-allowed { cursor: not-allowed; }
.select-none { user-select: none; }
.pointer-events-none { pointer-events: none; }
.pointer-events-auto { pointer-events: auto; }
.opacity-50 { opacity: 0.5; }
.opacity-100 { opacity: 1; }
.transition { transition: all var(--animation-duration) var(--ease-default); }
```

---

## Dark Mode Implementation

```css
/* Dark mode color overrides */
:root,
.dark {
  --ceramic-bg-main: var(--ceramic-gray-1400);
  --ceramic-bg-menu: var(--ceramic-gray-1100);
  --ceramic-bg-separator: var(--ceramic-gray-1300);
  --ceramic-primary: var(--ceramic-gray-100);
  --ceramic-secondary: var(--ceramic-gray-800);
  --ceramic-dimmed: var(--ceramic-gray-800);
  --ceramic-brand: var(--ceramic-purple-700);
  --ceramic-positive: var(--ceramic-green-700);
  --ceramic-negative: var(--ceramic-red-700);
  --ceramic-info: var(--ceramic-blue-700);
  --border-color-primary: #373840;
  --border-color-secondary: #2f3037;
}

.light {
  --ceramic-bg-main: var(--ceramic-white);
  --ceramic-bg-menu: var(--ceramic-white);
  --ceramic-bg-separator: var(--ceramic-gray-200);
  --ceramic-primary: var(--ceramic-gray-100);
  --ceramic-secondary: var(--ceramic-gray-800);
  --ceramic-brand: var(--ceramic-purple-600);
  --ceramic-positive: var(--ceramic-green-400);
  --ceramic-negative: var(--ceramic-red-600);
  --ceramic-info: var(--ceramic-blue-600);
  --border-color-primary: #eeeef0;
  --border-color-secondary: #f7f7f8;
}
```

---

## HTML Structure Examples

### Toast Component HTML

```html
<div data-testid="toast" class="toast" role="status" aria-live="polite">
  <svg class="toast-icon toast-icon-success" viewBox="0 0 20 20">
    <!-- Check icon -->
  </svg>
  <div class="toast-content">
    <p class="toast-title">Success</p>
    <p class="toast-message">Your changes have been saved.</p>
  </div>
  <button class="toast-close" aria-label="Close">
    <svg viewBox="0 0 20 20">
      <!-- X icon -->
    </svg>
  </button>
</div>
```

### Navigation Item HTML

```html
<a class="nav-item nav-item-active" href="/settings">
  <svg class="nav-icon" viewBox="0 0 20 20">
    <!-- Settings icon -->
  </svg>
  <span>Settings</span>
</a>
```

### Card Component HTML

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <p class="card-description">Card description goes here.</p>
  </div>
  <div class="card-body">
    <!-- Card content -->
  </div>
  <div class="card-footer">
    <button class="button-ghost">Cancel</button>
    <button class="button-primary">Save</button>
  </div>
</div>
```

---

## Implementation Notes

1. **Font Loading**: The design uses custom fonts (Suisse Intl, Geist, Soehne Mono) with fallbacks to system fonts.

2. **Color Mixing**: Clerk uses `color-mix()` function for opacity-based color variations:
   ```css
   color: color-mix(in srgb, var(--ceramic-gray-400) calc(1 * 100%), transparent);
   ```

3. **Data Attributes**: Components use data attributes for state and testing:
   - `data-state="open|closed"` - For open/close states
   - `data-testid` - For testing selectors
   - `data-slot` - For component slots

4. **Accessibility**:
   - All interactive elements have proper `:focus-visible` styles
   - Toast notifications use `role="status"` and `aria-live="polite"`
   - Modals use proper backdrop focus management

---

## Quick Start CSS

Copy this into your project to get started:

```css
:root {
  /* Colors - Light Mode */
  --ceramic-white: #ffffff;
  --ceramic-gray-50: #fafafb;
  --ceramic-gray-100: #f6f6f7;
  --ceramic-gray-200: #ececee;
  --ceramic-gray-300: #dbdbe0;
  --ceramic-gray-400: #c7c7cf;
  --ceramic-gray-500: #adadb7;
  --ceramic-gray-600: #90909d;
  --ceramic-gray-700: #767684;
  --ceramic-gray-800: #5f5f6f;
  --ceramic-gray-900: #4c4c5c;
  --ceramic-purple-600: #846bff;
  --ceramic-purple-700: #6c47ff;
  --ceramic-red-600: #f73d3d;
  --ceramic-green-400: #31c854;
  --ceramic-orange-500: #fd7224;
  --ceramic-blue-600: #307ff6;

  /* Semantic */
  --ceramic-bg-main: var(--ceramic-white);
  --ceramic-primary: var(--ceramic-gray-100);
  --ceramic-secondary: var(--ceramic-gray-800);
  --ceramic-brand: var(--ceramic-purple-600);
  --ceramic-negative: var(--ceramic-red-600);
  --ceramic-positive: var(--ceramic-green-400);
  --ceramic-warning: var(--ceramic-orange-500);

  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;

  /* Border Radius */
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-full: 9999px;

  /* Animation */
  --animation-duration: 0.25s;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  box-sizing: border-box;
  border-style: solid;
  border-width: 0;
  border-color: var(--ceramic-gray-300);
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  color: var(--ceramic-gray-900);
  background-color: var(--ceramic-bg-main);
}

/* Focus visible styles */
:focus-visible {
  outline: 2px solid var(--ceramic-brand);
  outline-offset: 2px;
}
```

---


