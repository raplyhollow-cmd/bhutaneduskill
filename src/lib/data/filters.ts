/**
 * ADVANCED FILTERS
 *
 * Complex query filters for all portals
 */

import { sql, and, or, eq, like, inArray, gte, lte, isNull, isNotNull } from "drizzle-orm";
import { users, assessments, examResultsEnhanced, schools, classes } from "@/lib/db/schema";

export interface FilterOption {
  field: string;
  operator: "eq" | "ne" | "like" | "in" | "notIn" | "gt" | "gte" | "lt" | "lte" | "between" | "null" | "notNull";
  value?: any;
  values?: any[];
}

export interface FilterGroup {
  operator: "AND" | "OR";
  filters: (FilterOption | FilterGroup)[];
}

/**
 * Build SQL filter from filter options
 */
export function buildFilter(table: any, filters: FilterOption | FilterGroup): any {
  if ("filters" in filters) {
    // It's a FilterGroup
    const conditions = filters.filters.map((f) => buildFilter(table, f));
    return filters.operator === "AND" ? and(...conditions) : or(...conditions);
  }

  // It's a FilterOption
  const { field, operator, value, values } = filters;
  const column = table[field];

  switch (operator) {
    case "eq":
      return eq(column, value);
    case "ne":
      return sql`${column} != ${value}`;
    case "like":
      return like(column, `%${value}%`);
    case "in":
      return inArray(column, values || []);
    case "notIn":
      return sql`${column} NOT IN ${values}`;
    case "gt":
      return sql`${column} > ${value}`;
    case "gte":
      return gte(column, value);
    case "lt":
      return sql`${column} < ${value}`;
    case "lte":
      return lte(column, value);
    case "between":
      return and(gte(column, value), lte(column, values?.[0]));
    case "null":
      return isNull(column);
    case "notNull":
      return isNotNull(column);
    default:
      return sql`1=1`;
  }
}

/**
 * Student filters
 */
export const STUDENT_FILTERS = {
  grade: (grades: string[]) => ({ field: "grade", operator: "in", values: grades }),
  status: (active: boolean) => ({ field: "isActive", operator: "eq", value: active }),
  section: (sections: string[]) => ({ field: "section", operator: "in", values: sections }),
  search: (query: string) => ({ field: "name", operator: "like", value: query }),
  school: (schoolId: string) => ({ field: "schoolId", operator: "eq", value: schoolId }),
  class: (classId: string) => ({ field: "classId", operator: "eq", value: classId }),
  hasAssessment: (assessmentType: string) => ({
    field: "assessmentCompleted",
    operator: "eq",
    value: assessmentType,
  }),
  atRisk: () => ({
    field: "atRiskScore",
    operator: "gte",
    value: 70,
  }),
};

/**
 * Teacher filters
 */
export const TEACHER_FILTERS = {
  subject: (subjects: string[]) => ({ field: "subject", operator: "in", values: subjects }),
  department: (departments: string[]) => ({ field: "department", operator: "in", values: departments }),
  status: (active: boolean) => ({ field: "isActive", operator: "eq", value: active }),
  school: (schoolId: string) => ({ field: "schoolId", operator: "eq", value: schoolId }),
};

/**
 * Assessment filters
 */
export const ASSESSMENT_FILTERS = {
  type: (types: string[]) => ({ field: "assessmentType", operator: "in", values: types }),
  published: (isPublished: boolean) => ({ field: "published", operator: "eq", value: isPublished }),
  dateRange: (start: Date, end: Date) => ({
    field: "createdAt",
    operator: "between",
    value: start,
    values: [end],
  }),
  completionRate: (minRate: number) => ({
    field: "completionRate",
    operator: "gte",
    value: minRate,
  }),
};

/**
 * Build search query with filters
 */
export function buildSearchQuery(
  table: any,
  searchQuery?: string,
  filters?: FilterOption[],
  additionalConditions?: any
) {
  const conditions: any[] = [];

  // Add search condition
  if (searchQuery) {
    conditions.push(
      or(
        like(table.name, `%${searchQuery}%`),
        like(table.email, `%${searchQuery}%`)
      )
    );
  }

  // Add filter conditions
  if (filters && filters.length > 0) {
    const filterConditions = filters.map((f) => buildFilter(table, f));
    conditions.push(...filterConditions);
  }

  // Add additional conditions
  if (additionalConditions) {
    conditions.push(additionalConditions);
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Apply pagination to query
 */
export function applyPagination(query: any, options: PaginationOptions) {
  const offset = (options.page - 1) * options.pageSize;
  let result = query.limit(options.pageSize).offset(offset);

  if (options.sortBy) {
    const order = options.sortOrder === "desc" ? sql`DESC` : sql`ASC`;
    result = result.orderBy(sql`${options.sortBy} ${order}`);
  }

  return result;
}

/**
 * Get paginated result metadata
 */
export function getPaginationMetadata(
  total: number,
  page: number,
  pageSize: number
) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    hasNext: page * pageSize < total,
    hasPrev: page > 1,
  };
}
