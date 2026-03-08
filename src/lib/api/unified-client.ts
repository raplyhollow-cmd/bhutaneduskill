/**
 * UNIFIED RESOURCE API CLIENT
 *
 * Client-side helper for the unified resource API system.
 * Provides type-safe methods to interact with /api/resources/{resource} endpoints.
 *
 * Usage:
 * ```ts
 * import { resourceApi } from '@/lib/api/unified-client';
 *
 * // List students
 * const students = await resourceApi.list('students', { page: 1, limit: 20 });
 *
 * // Get single student
 * const student = await resourceApi.get('students', 'student-id');
 *
 * // Create new student
 * const newStudent = await resourceApi.create('students', { firstName: 'John', lastName: 'Doe', ... });
 *
 * // Update student
 * const updated = await resourceApi.update('students', 'student-id', { firstName: 'Jane' });
 *
 * // Delete student
 * await resourceApi.delete('students', 'student-id');
 *
 * // Execute action
 * const result = await resourceApi.action('notifications', 'mark-read', { notificationIds: ['...'] });
 * ```
 */

import { revalidatePath } from "next/cache";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Supported resource names in the unified API
 */
export type ResourceName =
  // Core entities
  | "users" | "user" | "students" | "student" | "teachers" | "teacher"
  | "classes" | "class" | "subjects" | "subject" | "schools" | "school"

  // Academic
  | "assessments" | "assessment" | "attendance" | "attendance_records"
  | "homework" | "homework_submission" | "lessons" | "lesson"
  | "exams" | "exam" | "results" | "result" | "marks"
  | "submissions" | "submission" | "rubrics" | "rubric"

  // Organization
  | "departments" | "department" | "batches" | "batch" | "sections" | "section"
  | "timetables" | "timetable" | "timetable-slots" | "timetable-slot"
  | "schedule-exceptions" | "schedule-exception"

  // Skills & Career
  | "skills" | "skill" | "student-skills" | "student-skill"
  | "careers" | "career" | "career-matches"
  | "learning-paths" | "learning-path" | "roadmaps" | "roadmap"
  | "skill-gaps" | "skill-gap"

  // Behavior & Support
  | "behavior-records" | "behavior-record" | "interventions" | "intervention"
  | "counselor-notes" | "counselor-note"
  | "treatment-plans" | "treatment-plan"

  // Transport
  | "transport" | "transports" | "transport-allocations" | "transport-allocation"
  | "transport-routes" | "transport-route"

  // Library
  | "library-books" | "library-book" | "library-loans" | "library-loan"
  | "library-fines" | "library-fine"

  // Fees & Billing
  | "fees" | "fee" | "fee-payments" | "fee-payment" | "invoices" | "invoice"
  | "plans" | "plan" | "subscriptions" | "subscription"
  | "payments" | "billing"

  // Communication
  | "announcements" | "announcement" | "communication"
  | "notifications" | "notification" | "messages" | "message"

  // Reports & Analytics
  | "reports" | "report" | "analytics" | "analytic"
  | "audit-logs" | "audit-log"

  // Resources
  | "teaching-resources" | "teaching-resource"
  | "resource-shares" | "resource-share"

  // Meetings & Sessions
  | "meetings" | "meeting" | "sessions" | "session"

  // Ministry
  | "workforce-data";

/**
 * List/query parameters for filtering and pagination
 */
export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, unknown>;
  [key: string]: unknown;
};

/**
 * API response wrapper
 */
export type ApiResponse<T> = ApiSuccess<T> | ApiErrorResponse;

/**
 * Paginated response wrapper
 */
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

// ============================================================================
// CLIENT
// ============================================================================

class ResourceApiClient {
  private baseUrl = "/api/resources";

  /**
   * Build URL for resource endpoint
   */
  private buildUrl(resource: ResourceName, id?: string, queryParams?: Record<string, unknown>): string {
    let url = `${this.baseUrl}/${resource}`;
    if (id) {
      url += `/${id}`;
    }
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      url += `?${params.toString()}`;
    }
    return url;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiErrorResponse = await response.json().catch(() => ({
        error: response.statusText,
        status: response.status,
      }));
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    const result: ApiSuccess<T> = await response.json();
    return result.data as T;
  }

  /**
   * LIST - Get all records with pagination and filtering
   */
  async list<T = unknown>(
    resource: ResourceName,
    params?: ListParams
  ): Promise<PaginatedResponse<T>> {
    const url = this.buildUrl(resource, undefined, params);
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });
    return this.handleResponse<PaginatedResponse<T>>(response);
  }

  /**
   * GET - Get single record by ID
   */
  async get<T = unknown>(
    resource: ResourceName,
    id: string
  ): Promise<T> {
    const url = this.buildUrl(resource, id);
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });
    return this.handleResponse<T>(response);
  }

  /**
   * CREATE - Create new record
   */
  async create<T = unknown>(
    resource: ResourceName,
    data: Record<string, unknown>,
    options?: { revalidate?: string }
  ): Promise<T> {
    const url = this.buildUrl(resource);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await this.handleResponse<T>(response);

    if (options?.revalidate) {
      revalidatePath(options.revalidate);
    }

    return result;
  }

  /**
   * UPDATE - Update existing record
   */
  async update<T = unknown>(
    resource: ResourceName,
    id: string,
    data: Record<string, unknown>,
    options?: { revalidate?: string }
  ): Promise<T> {
    const url = this.buildUrl(resource, id);
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await this.handleResponse<T>(response);

    if (options?.revalidate) {
      revalidatePath(options.revalidate);
    }

    return result;
  }

  /**
   * DELETE - Delete (soft delete) record
   */
  async delete(
    resource: ResourceName,
    id: string,
    options?: { revalidate?: string }
  ): Promise<{ message: string }> {
    const url = this.buildUrl(resource, id);
    const response = await fetch(url, {
      method: "DELETE",
    });

    const result = await this.handleResponse<{ message: string }>(response);

    if (options?.revalidate) {
      revalidatePath(options.revalidate);
    }

    return result;
  }

  /**
   * ACTION - Execute non-CRUD operation
   */
  async action<T = unknown>(
    resource: ResourceName,
    actionName: string,
    data?: Record<string, unknown>,
    options?: { method?: "GET" | "POST"; revalidate?: string }
  ): Promise<T> {
    const method = options?.method || "POST";
    let url = `${this.buildUrl(resource)}/actions?action=${encodeURIComponent(actionName)}`;

    if (method === "GET" && data) {
      // Add data as query params for GET requests
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      url += `&${params.toString()}`;
    }

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(method === "POST" && data ? { body: JSON.stringify(data) } : {}),
    });

    const result = await this.handleResponse<T>(response);

    if (options?.revalidate) {
      revalidatePath(options.revalidate);
    }

    return result;
  }

  /**
   * PUBLIC - Access public endpoint (no auth required)
   */
  async public<T = unknown>(
    resource: ResourceName,
    endpointName: string,
    data?: Record<string, unknown>,
    options?: { method?: "GET" | "POST" }
  ): Promise<T> {
    const method = options?.method || "GET";
    let url = `${this.buildUrl(resource)}?public=${encodeURIComponent(endpointName)}`;

    if (method === "GET" && data) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }
      url += `&${params.toString()}`;
    }

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(method === "POST" && data ? { body: JSON.stringify(data) } : {}),
    });

    return this.handleResponse<T>(response);
  }

  /**
   * WEBHOOK - Trigger webhook handler
   */
  async webhook<T = unknown>(
    resource: ResourceName,
    webhookName: string,
    data: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.buildUrl(resource)}?webhook=${encodeURIComponent(webhookName)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/** Singleton instance */
export const resourceApi = new ResourceApiClient();

// Types are already exported inline above - no need for re-export

/**
 * Helper to create a typed resource API client for a specific resource
 *
 * Example:
 * ```ts
 * const studentsApi = createResourceClient('students');
 * const list = studentsApi.list({ page: 1 });
 * const one = studentsApi.get('id');
 * ```
 */
export function createResourceClient<T = unknown>(resource: ResourceName) {
  return {
    list: (params?: ListParams) => resourceApi.list<PaginatedResponse<T>>(resource, params),
    get: (id: string) => resourceApi.get<T>(resource, id),
    create: (data: Record<string, unknown>, opts?: { revalidate?: string }) =>
      resourceApi.create<T>(resource, data, opts),
    update: (id: string, data: Record<string, unknown>, opts?: { revalidate?: string }) =>
      resourceApi.update<T>(resource, id, data, opts),
    delete: (id: string, opts?: { revalidate?: string }) =>
      resourceApi.delete(resource, id, opts),
    action: (action: string, data?: Record<string, unknown>, opts?: { method?: "GET" | "POST"; revalidate?: string }) =>
      resourceApi.action<T>(resource, action, data, opts),
    public: (endpoint: string, data?: Record<string, unknown>, opts?: { method?: "GET" | "POST" }) =>
      resourceApi.public<T>(resource, endpoint, data, opts),
  };
}
