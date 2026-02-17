# QA Audit Process Guide

> **Purpose:** Document the process for running comprehensive QA audits on the Bhutan EduSkill platform
> **Last Run:** 2026-02-16
> **Next Run:** After task list completion

---

## Overview

This document describes the automated QA audit process that was conducted to assess the entire platform's health, security, and completeness. The audit uses virtual user simulation combined with comprehensive code analysis.

---

## Prerequisites

### Tools Required
- **Claude Code** - For running parallel analysis agents
- **Glob/Grep tools** - For searching codebase patterns
- **Bash tool** - For running commands
- **Read/Write tools** - For generating reports

### Access Required
- Full repository read access
- Documentation folder write access

---

## Audit Process

### Phase 1: Comprehensive Code Analysis (5 Parallel Agents)

#### Agent 1: Page & Component Inventory
**Task:** Find ALL pages, components, and UI elements

**Prompt:**
```
Find all pages, API routes, server actions, modal/form components.

For each file, identify:
- File path
- User role it serves
- Function/feature it provides
- Any obvious issues

Search in:
- src/app/ (all pages and API routes)
- src/components/ (all UI components)
- src/lib/ (utilities and helpers)
```

**Output:** Complete file inventory with issues

---

#### Agent 2: Database Schema Audit
**Task:** Validate schema against queries

**Prompt:**
```
Read the full database schema from src/lib/db/schema.ts
Find ALL database queries throughout the codebase

Identify:
- Tables defined but never used
- Tables referenced but not defined
- Columns referenced but not in schema
- Missing relationships/foreign keys
- Inconsistent field names (camelCase vs snake_case)
```

**Output:** Schema validation report

---

#### Agent 3: Authentication & Authorization Audit
**Task:** Review auth patterns across all routes

**Prompt:**
```
Find ALL authentication mechanisms and portal layouts

Identify:
- Pages without auth checks that should have them
- API routes missing requireAuth()
- Inconsistent role checking
- Broken redirect flows
- Missing setup wizard protections
```

**Output:** Security vulnerability report

---

#### Agent 4: Component & Dependency Audit
**Task:** Check imports and dependencies

**Prompt:**
```
Find ALL component files and check import patterns

Identify:
- Relative imports (../) instead of @/
- Circular dependencies
- Missing imports
- Unused imports
- Deprecated packages
- TypeScript type issues
```

**Output:** Component health report

---

#### Agent 5: API Endpoint Audit
**Task:** Review all API routes

**Prompt:**
```
Find ALL API routes in src/app/api/

For each endpoint, identify:
- HTTP methods supported
- Expected request body/parameters
- Response format
- Error handling
- Authentication required
- Database operations
- TODO features

Find:
- Missing error handling
- Inconsistent response formats
- Missing authentication
- SQL injection vulnerabilities
- Duplicate endpoints
```

**Output:** API security and completeness report

---

### Phase 2: Pattern Analysis

#### Console Statement Count
```bash
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l
```

#### TODO Comment Count
```bash
grep -r "TODO\|FIXME\|XXX\|HACK\|BUG" src/ docs/ --include="*.ts" --include="*.tsx" --include="*.md" | wc -l
```

#### Type Safety Issues
```bash
grep -r ": any\|as any" src/ --include="*.ts" --include="*.tsx" | wc -l
```

#### Mock Data References
```bash
grep -r "Mock Data\|mock data\|MOCK\|mockData" src/ --include="*.ts" --include="*.tsx" -l
```

---

### Phase 3: Portal-Specific Analysis

For each of the 7 portals, analyze:

1. **Student Portal** (`/student`)
   - Working features
   - Broken/incomplete features
   - Console errors
   - Missing functionality

2. **Teacher Portal** (`/teacher`)
   - Same analysis as above

3. **Parent Portal** (`/parent`)
   - Same analysis as above

4. **Counselor Portal** (`/counselor`)
   - Same analysis as above

5. **School Admin Portal** (`/school-admin`)
   - Same analysis as above

6. **Platform Admin Portal** (`/admin`)
   - Same analysis as above

7. **Ministry Portal** (`/ministry`)
   - Same analysis as above

---

### Phase 4: Report Generation

#### Report 1: Comprehensive Audit Report
**File:** `docs/QA_COMPREHENSIVE_AUDIT_REPORT.md`

**Sections:**
1. Executive Summary
2. Critical Issues
3. Portal-Specific Results
4. Database Issues
5. Component Audit
6. API Audit
7. Recommendations
8. Summary Statistics

#### Report 2: Quick Reference Guide
**File:** `docs/QA_QUICK_REFERENCE.md`

**Sections:**
1. TL;DR Status
2. Critical Issues
3. Broken Features
4. Working Features
5. By the Numbers
6. Quick Fixes
7. Files to Fix First
8. Production Checklist

#### Report 3: Task List
**File:** `docs/TASKS.md`

**Sections:**
1. Critical Security Tasks
2. High Priority - Missing APIs
3. High Priority - Type Safety
4. Medium Priority - Incomplete Features
5. Medium Priority - Code Quality
6. Low Priority - Optimizations
7. Testing & Validation
8. Summary Statistics

---

## Running the Audit Again

### When to Re-Run
- After completing all 78 tasks
- Before major releases
- After significant feature additions
- Monthly for maintenance

### Quick Re-Audit (After Task Completion)

```bash
# 1. Check for remaining security issues
grep -r "await auth()" src/app/api/ --include="*.ts" -l

# 2. Check for remaining type issues
grep -r ": any" src/ --include="*.ts" --include="*.tsx" | wc -l

# 3. Check for remaining console statements
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l

# 4. Check for TODO comments
grep -r "TODO" src/ --include="*.ts" --include="*.tsx" | wc -l

# 5. Verify TypeScript compilation
npm run build 2>&1 | tee build-output.txt
```

---

## Expected Outcomes

### Before Fix (Current State)
- Security: 3/10 (40+ unprotected routes)
- Functionality: 6/10 (15+ incomplete features)
- Type Safety: 4/10 (615 any types)
- Overall: 6.5/10

### After Fix (Target State)
- Security: 9/10 (all routes protected)
- Functionality: 9/10 (all features complete)
- Type Safety: 8/10 (minimal any types)
- Overall: 8.5/10

---

## Agent Commands Used

### To Run Full Audit
Use the Task tool with 5 Explore agents in parallel:

```
Agent 1: Comprehensive code audit (pages, components, APIs)
Agent 2: Database schema and queries
Agent 3: Authentication and authorization
Agent 4: Component imports and dependencies
Agent 5: API endpoints and server actions
```

### Each Agent Prompt Should Include
- "This is research only - DO NOT make any code changes"
- Clear search patterns
- Expected output format
- Specific areas to focus on

---

## Report Template

### Comprehensive Audit Report Structure

```markdown
# Comprehensive QA Audit Report

## Executive Summary
- Overall Platform Health: X/10
- Critical Issues Count
- High Priority Issues Count

## Critical Issues (Must Fix Immediately)
1. Security Vulnerabilities
2. Missing API Endpoints
3. Type Safety Failures

## Portal-Specific Audit Results
- Student Portal
- Teacher Portal
- [etc.]

## Database Issues
- Schema Problems
- Query Issues

## Component Audit
- Problematic Components
- Performance Issues

## Recommendations
- Immediate Actions
- Short-term Actions
- Long-term Actions

## Summary Statistics
[Table of counts and metrics]
```

---

## Notes

- **All analysis is code-based** - No manual browser testing required
- **Parallel agents** - 5 agents run simultaneously for speed
- **Comprehensive coverage** - Every file is analyzed
- **Actionable output** - File paths and line numbers included
- **Follows project standards** - Uses DEVELOPMENT_FRAMEWORK.md patterns

---

*Document Created: 2026-02-16*
*Process Version: 1.0*
*Platform: Bhutan EduSkill v1.2.0*
