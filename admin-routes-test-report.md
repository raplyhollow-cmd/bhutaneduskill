# Platform Admin Portal - Route Availability Report

**Date:** 2026-02-26T14:16:11.655Z
**Base URL:** http://localhost:3000
**Total Routes Tested:** 31

## Summary

- **✅ Success (200):** 0
- **↪️ Redirect (302/307):** 24
- **❌ Error/Timeout:** 7
- **⚠️ Other Status:** 0

## Detailed Results

| # | Route | Name | Status | Load Time | Content Type | Notes |
|---|-------|------|--------|-----------|--------------|-------|
| 1 | `/admin` | Admin Dashboard (Home) | ⏱️ TIMEOUT | 10000ms | N/A | Request timeout |
| 2 | `/admin/schools` | Schools Management | ↪️ 307 | 9754ms | text/html; charset=utf-8 | Redirects to: /sign-in; 44619 bytes |
| 3 | `/admin/users` | Users Management | ↪️ 307 | 8641ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42773 bytes |
| 4 | `/admin/users/test-id` | User Detail (Dynamic) | ⏱️ TIMEOUT | 10000ms | N/A | Request timeout |
| 5 | `/admin/teachers` | Teachers Management | ↪️ 307 | 5996ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42799 bytes |
| 6 | `/admin/counselors` | Counselors Management | ⏱️ TIMEOUT | 10000ms | N/A | Request timeout |
| 7 | `/admin/partners` | Partners Management | ⏱️ TIMEOUT | 10000ms | N/A | Request timeout |
| 8 | `/admin/partners/test-id` | Partner Detail (Dynamic) | ⏱️ TIMEOUT | 10000ms | N/A | Request timeout |
| 9 | `/admin/notifications` | Notifications | ↪️ 307 | 5064ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42895 bytes |
| 10 | `/admin/analytics` | Analytics | ↪️ 307 | 7897ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42863 bytes |
| 11 | `/admin/settings` | Settings | ↪️ 307 | 9028ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42799 bytes |
| 12 | `/admin/content` | Content Management | ↪️ 307 | 4462ms | text/html; charset=utf-8 | Redirects to: /sign-in; 43512 bytes |
| 13 | `/admin/content/colleges` | Colleges Management | ↪️ 307 | 4703ms | text/html; charset=utf-8 | Redirects to: /sign-in; 44220 bytes |
| 14 | `/admin/content/programs` | Programs Management | ⏱️ TIMEOUT | 10000ms | N/A | Request timeout |
| 15 | `/admin/content/scholarships` | Scholarships Management | ⏱️ TIMEOUT | 10000ms | N/A | Request timeout |
| 16 | `/admin/assessments` | Assessments | ↪️ 307 | 7742ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42822 bytes |
| 17 | `/admin/permissions` | Permissions | ↪️ 307 | 5708ms | text/html; charset=utf-8 | Redirects to: /sign-in; 43552 bytes |
| 18 | `/admin/roles` | Roles | ↪️ 307 | 5719ms | text/html; charset=utf-8 | Redirects to: /sign-in; 44006 bytes |
| 19 | `/admin/billing` | Billing | ↪️ 307 | 1260ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42791 bytes |
| 20 | `/admin/reports` | Reports | ↪️ 307 | 1428ms | text/html; charset=utf-8 | Redirects to: /sign-in; 43140 bytes |
| 21 | `/admin/support` | Support | ↪️ 307 | 801ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42791 bytes |
| 22 | `/admin/verification` | Verification | ↪️ 307 | 1014ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42830 bytes |
| 23 | `/admin/school-admin-applications` | School Admin Applications | ↪️ 307 | 3320ms | text/html; charset=utf-8 | Redirects to: /sign-in; 44805 bytes |
| 24 | `/admin/schools/test-id` | School Detail (Dynamic) | ↪️ 307 | 7058ms | text/html; charset=utf-8 | Redirects to: /sign-in; 44253 bytes |
| 25 | `/admin/schools/test-id/fee-generator` | Fee Generator (Dynamic) | ↪️ 307 | 4691ms | text/html; charset=utf-8 | Redirects to: /sign-in; 45787 bytes |
| 26 | `/admin/command-center` | Command Center | ↪️ 307 | 3091ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42492 bytes |
| 27 | `/admin/knowledge` | Knowledge Base | ↪️ 307 | 3149ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42451 bytes |
| 28 | `/admin/bcse` | BCSE Management | ↪️ 307 | 2439ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42464 bytes |
| 29 | `/admin/careers` | Careers Management | ↪️ 307 | 3654ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42790 bytes |
| 30 | `/admin/subjects` | Subjects Management | ↪️ 307 | 3391ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42799 bytes |
| 31 | `/admin/system-status` | System Status | ↪️ 307 | 3188ms | text/html; charset=utf-8 | Redirects to: /sign-in; 42838 bytes |

## Issues Found

### Admin Dashboard (Home)
- **Route:** `/admin`
- **Status:** TIMEOUT
- **Error:** Request timeout

### User Detail (Dynamic)
- **Route:** `/admin/users/test-id`
- **Status:** TIMEOUT
- **Error:** Request timeout

### Counselors Management
- **Route:** `/admin/counselors`
- **Status:** TIMEOUT
- **Error:** Request timeout

### Partners Management
- **Route:** `/admin/partners`
- **Status:** TIMEOUT
- **Error:** Request timeout

### Partner Detail (Dynamic)
- **Route:** `/admin/partners/test-id`
- **Status:** TIMEOUT
- **Error:** Request timeout

### Programs Management
- **Route:** `/admin/content/programs`
- **Status:** TIMEOUT
- **Error:** Request timeout

### Scholarships Management
- **Route:** `/admin/content/scholarships`
- **Status:** TIMEOUT
- **Error:** Request timeout


## Recommendations

- **24 routes** are redirecting. This may indicate authentication requirements or routing rules.
- **7 routes** have errors. These need immediate attention.

---

*Generated by automated QA test*
